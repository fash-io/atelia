-- Studio team management and collaborators
CREATE TABLE IF NOT EXISTS public.studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  cover_url text,
  custom_domain text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member','collaborator')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (studio_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.studio_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  invited_user_id uuid,
  invited_email text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member','collaborator')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (invited_user_id IS NOT NULL OR invited_email IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.content_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('work','project')),
  target_id uuid NOT NULL,
  user_id uuid NOT NULL,
  studio_id uuid REFERENCES public.studios(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'Collaborator',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id)
);

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS studio_id uuid REFERENCES public.studios(id) ON DELETE SET NULL;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS studio_id uuid REFERENCES public.studios(id) ON DELETE SET NULL;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS studio_id uuid REFERENCES public.studios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS studios_owner_idx ON public.studios(owner_id);
CREATE INDEX IF NOT EXISTS studio_members_studio_idx ON public.studio_members(studio_id);
CREATE INDEX IF NOT EXISTS studio_members_user_idx ON public.studio_members(user_id);
CREATE INDEX IF NOT EXISTS studio_invites_studio_idx ON public.studio_invites(studio_id);
CREATE INDEX IF NOT EXISTS studio_invites_user_idx ON public.studio_invites(invited_user_id);
CREATE INDEX IF NOT EXISTS content_collaborators_target_idx ON public.content_collaborators(target_type, target_id);
CREATE INDEX IF NOT EXISTS content_collaborators_user_idx ON public.content_collaborators(user_id);
CREATE INDEX IF NOT EXISTS jobs_studio_idx ON public.jobs(studio_id);
CREATE INDEX IF NOT EXISTS works_studio_idx ON public.works(studio_id);
CREATE INDEX IF NOT EXISTS projects_studio_idx ON public.projects(studio_id);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_collaborators ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_studio_admin(_studio_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.studios s
    WHERE s.id = _studio_id AND s.owner_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.studio_members sm
    WHERE sm.studio_id = _studio_id
      AND sm.user_id = _user_id
      AND sm.role IN ('owner','admin')
  ) OR public.has_role(_user_id, 'admin');
$$;

CREATE OR REPLACE FUNCTION public.can_manage_content_collaborators(_target_type text, _target_id uuid, _studio_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.works w
      WHERE _target_type = 'work' AND w.id = _target_id AND w.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE _target_type = 'project' AND p.id = _target_id AND p.user_id = auth.uid()
    )
    OR (_studio_id IS NOT NULL AND public.is_studio_admin(_studio_id, auth.uid()));
$$;

CREATE OR REPLACE FUNCTION public.enforce_studio_member_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT count(*) FROM public.studio_members WHERE studio_id = NEW.studio_id) >= 8 THEN
    RAISE EXCEPTION 'Studio plan supports up to 8 team members';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS studio_members_limit ON public.studio_members;
CREATE TRIGGER studio_members_limit
BEFORE INSERT ON public.studio_members
FOR EACH ROW EXECUTE FUNCTION public.enforce_studio_member_limit();

DROP TRIGGER IF EXISTS studios_touch ON public.studios;
CREATE TRIGGER studios_touch BEFORE UPDATE ON public.studios FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS studio_members_touch ON public.studio_members;
CREATE TRIGGER studio_members_touch BEFORE UPDATE ON public.studio_members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS studio_invites_touch ON public.studio_invites;
CREATE TRIGGER studio_invites_touch BEFORE UPDATE ON public.studio_invites FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "Studios are publicly viewable" ON public.studios;
CREATE POLICY "Studios are publicly viewable" ON public.studios FOR SELECT USING (is_public = true OR owner_id = auth.uid() OR public.is_studio_admin(id, auth.uid()));
DROP POLICY IF EXISTS "Users create owned studios" ON public.studios;
CREATE POLICY "Users create owned studios" ON public.studios FOR INSERT WITH CHECK (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Studio admins update studios" ON public.studios;
CREATE POLICY "Studio admins update studios" ON public.studios FOR UPDATE USING (public.is_studio_admin(id, auth.uid())) WITH CHECK (public.is_studio_admin(id, auth.uid()));
DROP POLICY IF EXISTS "Studio owners delete studios" ON public.studios;
CREATE POLICY "Studio owners delete studios" ON public.studios FOR DELETE USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Studio members are publicly viewable" ON public.studio_members;
CREATE POLICY "Studio members are publicly viewable" ON public.studio_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Studio admins add members" ON public.studio_members;
CREATE POLICY "Studio admins add members" ON public.studio_members FOR INSERT WITH CHECK (public.is_studio_admin(studio_id, auth.uid()));
DROP POLICY IF EXISTS "Studio admins update members" ON public.studio_members;
CREATE POLICY "Studio admins update members" ON public.studio_members FOR UPDATE USING (public.is_studio_admin(studio_id, auth.uid())) WITH CHECK (public.is_studio_admin(studio_id, auth.uid()));
DROP POLICY IF EXISTS "Studio admins or member remove members" ON public.studio_members;
CREATE POLICY "Studio admins or member remove members" ON public.studio_members FOR DELETE USING (public.is_studio_admin(studio_id, auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Studio invite visibility" ON public.studio_invites;
CREATE POLICY "Studio invite visibility" ON public.studio_invites FOR SELECT USING (public.is_studio_admin(studio_id, auth.uid()) OR invited_user_id = auth.uid());
DROP POLICY IF EXISTS "Studio admins create invites" ON public.studio_invites;
CREATE POLICY "Studio admins create invites" ON public.studio_invites FOR INSERT WITH CHECK (public.is_studio_admin(studio_id, auth.uid()) AND invited_by = auth.uid());
DROP POLICY IF EXISTS "Studio admins or invitee update invites" ON public.studio_invites;
CREATE POLICY "Studio admins or invitee update invites" ON public.studio_invites FOR UPDATE USING (public.is_studio_admin(studio_id, auth.uid()) OR invited_user_id = auth.uid()) WITH CHECK (public.is_studio_admin(studio_id, auth.uid()) OR invited_user_id = auth.uid());
DROP POLICY IF EXISTS "Studio admins delete invites" ON public.studio_invites;
CREATE POLICY "Studio admins delete invites" ON public.studio_invites FOR DELETE USING (public.is_studio_admin(studio_id, auth.uid()));

DROP POLICY IF EXISTS "Content collaborators viewable" ON public.content_collaborators;
CREATE POLICY "Content collaborators viewable" ON public.content_collaborators FOR SELECT USING (true);
DROP POLICY IF EXISTS "Content owners add collaborators" ON public.content_collaborators;
CREATE POLICY "Content owners add collaborators" ON public.content_collaborators FOR INSERT WITH CHECK (public.can_manage_content_collaborators(target_type, target_id, studio_id));
DROP POLICY IF EXISTS "Content owners update collaborators" ON public.content_collaborators;
CREATE POLICY "Content owners update collaborators" ON public.content_collaborators FOR UPDATE USING (public.can_manage_content_collaborators(target_type, target_id, studio_id)) WITH CHECK (public.can_manage_content_collaborators(target_type, target_id, studio_id));
DROP POLICY IF EXISTS "Content owners delete collaborators" ON public.content_collaborators;
CREATE POLICY "Content owners delete collaborators" ON public.content_collaborators FOR DELETE USING (public.can_manage_content_collaborators(target_type, target_id, studio_id));

-- Job application notifications for owner and applicant
CREATE OR REPLACE FUNCTION public.handle_application_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  poster uuid;
  job_title text;
  applicant_name text;
BEGIN
  SELECT user_id, title INTO poster, job_title FROM public.jobs WHERE id = NEW.job_id;
  SELECT COALESCE(full_name, username, 'Applicant') INTO applicant_name FROM public.profiles WHERE id = NEW.applicant_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES
      (poster, 'application_submitted', 'New application submitted', applicant_name || ' applied to: ' || job_title, '/jobs/' || NEW.job_id::text, NEW.id),
      (NEW.applicant_id, 'application_submitted', 'Application submitted', 'Your application for ' || job_title || ' was submitted.', '/jobs/' || NEW.job_id::text, NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES
      (poster, 'application_' || NEW.status, 'Application ' || NEW.status, applicant_name || '''s application for ' || job_title || ' is now ' || NEW.status || '.', '/jobs/' || NEW.job_id::text, NEW.id),
      (NEW.applicant_id, 'application_' || NEW.status, 'Application ' || NEW.status, 'Your application for ' || job_title || ' is now ' || NEW.status || '.', '/jobs/' || NEW.job_id::text, NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS applications_notify ON public.applications;
CREATE TRIGGER applications_notify AFTER INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.handle_application_event();

-- Allow Studio admins to associate their studio with content they own.
DROP POLICY IF EXISTS "Studio admins update own jobs" ON public.jobs;
CREATE POLICY "Studio admins update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id OR (studio_id IS NOT NULL AND public.is_studio_admin(studio_id, auth.uid()))) WITH CHECK (auth.uid() = user_id OR (studio_id IS NOT NULL AND public.is_studio_admin(studio_id, auth.uid())));
