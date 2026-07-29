
-- 1. Applications attachments
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS proof_url text;

-- 2. Private storage bucket for application attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('applications', 'applications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for applications bucket
-- path layout: <applicant_id>/<job_id>/<filename>
DROP POLICY IF EXISTS "Applicants upload own application files" ON storage.objects;
CREATE POLICY "Applicants upload own application files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'applications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Applicants view own application files" ON storage.objects;
CREATE POLICY "Applicants view own application files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'applications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Job posters view applicant files" ON storage.objects;
CREATE POLICY "Job posters view applicant files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'applications'
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id::text = (storage.foldername(name))[2]
      AND j.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Applicants delete own application files" ON storage.objects;
CREATE POLICY "Applicants delete own application files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'applications'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Studio bookings: allow any studio member to view & create bookings on shared calendar
DROP POLICY IF EXISTS "Studio members view studio bookings" ON public.bookings;
CREATE POLICY "Studio members view studio bookings"
ON public.bookings FOR SELECT
USING (
  studio_id IS NOT NULL
  AND (
    is_studio_admin(studio_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.studio_members sm
      WHERE sm.studio_id = bookings.studio_id AND sm.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Studio members create studio bookings" ON public.bookings;
CREATE POLICY "Studio members create studio bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  studio_id IS NOT NULL
  AND auth.uid() = client_id
  AND (
    is_studio_admin(studio_id, auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.studio_members sm
      WHERE sm.studio_id = bookings.studio_id AND sm.user_id = auth.uid()
    )
  )
);

-- 4. Enhanced booking notification trigger — fires on more status transitions
CREATE OR REPLACE FUNCTION public.handle_booking_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (NEW.creative_id, 'booking', 'New booking request', NEW.title, '/profile?tab=Bookings', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    -- Notify client when creative/studio takes action
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (NEW.client_id, 'booking', 'Booking ' || NEW.status, NEW.title, '/profile?tab=Bookings', NEW.id);
    -- Notify creative when client cancels/reschedules
    IF NEW.status IN ('cancelled', 'rescheduled') AND NEW.client_id IS DISTINCT FROM NEW.creative_id THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
      VALUES (NEW.creative_id, 'booking', 'Booking ' || NEW.status, NEW.title, '/profile?tab=Bookings', NEW.id);
    END IF;
  ELSIF TG_OP = 'UPDATE' AND NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
    -- Time change notification
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (NEW.client_id, 'booking', 'Booking rescheduled', NEW.title, '/profile?tab=Bookings', NEW.id),
           (NEW.creative_id, 'booking', 'Booking rescheduled', NEW.title, '/profile?tab=Bookings', NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS trg_booking_event ON public.bookings;
CREATE TRIGGER trg_booking_event
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.handle_booking_event();
