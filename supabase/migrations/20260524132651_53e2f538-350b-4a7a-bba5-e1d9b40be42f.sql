
-- 1. Restrict likes SELECT to owner
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.likes;
CREATE POLICY "Users view own likes" ON public.likes
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Services hidden visibility
DROP POLICY IF EXISTS "Services are viewable by everyone" ON public.services;
CREATE POLICY "Visible services or own services" ON public.services
  FOR SELECT USING (is_visible = true OR auth.uid() = user_id);

-- 3. Remove admin bootstrap escalation
DROP POLICY IF EXISTS "Bootstrap first admin or admin manages roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Drop broad public listing storage policies (files still served via public URLs)
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Work images publicly readable" ON storage.objects;

-- 5. Revoke EXECUTE on internal helper SECURITY DEFINER functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_studio_admin(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_manage_content_collaborators(text, uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_job_views(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_project_views(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_work_views(uuid) FROM anon;

-- 6. Realtime channel authorization
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users subscribe to own topics" ON realtime.messages;
CREATE POLICY "Authenticated users subscribe to own topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow only topics scoped to the user's own id (notifications, presence)
    -- or threads they participate in (messages:thread_id)
    (realtime.topic() = 'user:' || auth.uid()::text)
    OR (realtime.topic() = 'notifications:' || auth.uid()::text)
    OR (
      realtime.topic() LIKE 'thread:%'
      AND EXISTS (
        SELECT 1 FROM public.messages m
        WHERE m.thread_id::text = split_part(realtime.topic(), ':', 2)
          AND m.sender_id = auth.uid()
      )
    )
  );
