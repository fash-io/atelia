
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

-- RLS for user_roles
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Bootstrap first admin or admin manages roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR (
      auth.uid() = user_id
      AND role = 'admin'
      AND NOT public.admin_exists()
    )
  );

CREATE POLICY "Admins update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Social links on profiles
ALTER TABLE public.profiles
  ADD COLUMN instagram TEXT,
  ADD COLUMN behance TEXT,
  ADD COLUMN dribbble TEXT,
  ADD COLUMN linkedin TEXT,
  ADD COLUMN twitter TEXT;

-- Admin can update any profile (e.g. toggle is_pro, feature)
CREATE POLICY "Admins update any profile"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can manage subscriptions of any user
CREATE POLICY "Admins view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update any subscription"
  ON public.subscriptions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin can view all works/projects (already public for published)
-- Admin delete any work/project for moderation
CREATE POLICY "Admins delete any work"
  ON public.works FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete any project"
  ON public.projects FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Featured work column
ALTER TABLE public.works ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;

-- Prevent duplicate cards per user (brand + last4 + exp_month + exp_year)
CREATE UNIQUE INDEX billing_methods_unique_per_user
  ON public.billing_methods (user_id, brand, last4, exp_month, exp_year);

-- Allow message delete (sender only)
CREATE POLICY "Sender deletes own message"
  ON public.messages FOR DELETE
  USING (auth.uid() = sender_id);
