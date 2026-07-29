
-- Support tickets table for /contact + super-admin
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'normal',
  admin_notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a ticket"
  ON public.support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner views own tickets"
  ON public.support_tickets FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update tickets"
  ON public.support_tickets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tickets"
  ON public.support_tickets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Bookings: studio collaboration
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS studio_id uuid NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_studio_id ON public.bookings(studio_id);

-- Allow studio members to view/update bookings tied to their studio
CREATE POLICY "Studio members view studio bookings"
  ON public.bookings FOR SELECT
  USING (studio_id IS NOT NULL AND public.is_studio_admin(studio_id, auth.uid()));

CREATE POLICY "Studio admins update studio bookings"
  ON public.bookings FOR UPDATE
  USING (studio_id IS NOT NULL AND public.is_studio_admin(studio_id, auth.uid()));
