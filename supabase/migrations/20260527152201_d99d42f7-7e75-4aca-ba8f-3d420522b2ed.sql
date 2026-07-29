
-- Remove duplicate booking notification trigger (handle_booking_event was firing twice)
DROP TRIGGER IF EXISTS bookings_notify ON public.bookings;

-- Allow studio admins to update studio-posted works
DROP POLICY IF EXISTS "Studio admins update studio works" ON public.works;
CREATE POLICY "Studio admins update studio works"
ON public.works
FOR UPDATE
TO authenticated
USING (studio_id IS NOT NULL AND is_studio_admin(studio_id, auth.uid()))
WITH CHECK (studio_id IS NOT NULL AND is_studio_admin(studio_id, auth.uid()));

-- Same for projects (case studies)
DROP POLICY IF EXISTS "Studio admins update studio projects" ON public.projects;
CREATE POLICY "Studio admins update studio projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (studio_id IS NOT NULL AND is_studio_admin(studio_id, auth.uid()))
WITH CHECK (studio_id IS NOT NULL AND is_studio_admin(studio_id, auth.uid()));
