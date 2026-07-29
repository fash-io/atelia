
-- Clean existing website values
UPDATE public.profiles
SET website = 'https://' || website
WHERE website IS NOT NULL
  AND website !~* '^https?://'
  AND website ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+(/.*)?$';

UPDATE public.profiles
SET website = NULL
WHERE website IS NOT NULL AND website !~* '^https?://';

-- Now add constraint and re-apply other fixes
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_website_http_only
  CHECK (website IS NULL OR website ~* '^https?://');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND is_pro IS NOT DISTINCT FROM (SELECT p.is_pro FROM public.profiles p WHERE p.id = auth.uid())
);

DROP POLICY IF EXISTS "Users update own subscription" ON public.subscriptions;
CREATE POLICY "Users update own subscription"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND plan IS NOT DISTINCT FROM (SELECT s.plan FROM public.subscriptions s WHERE s.user_id = auth.uid())
  AND status IS NOT DISTINCT FROM (SELECT s.status FROM public.subscriptions s WHERE s.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users insert own subscription" ON public.subscriptions;
CREATE POLICY "Users insert own subscription"
ON public.subscriptions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND plan = 'free'
  AND status = 'active'
  AND cancel_at_period_end = false
);

DROP POLICY IF EXISTS "Users insert own transactions" ON public.transactions;
CREATE POLICY "Users insert own transactions"
ON public.transactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND amount_ngn >= 0
);

DROP POLICY IF EXISTS "Authenticated users subscribe to own topics" ON realtime.messages;
CREATE POLICY "Authenticated users subscribe to own topics"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
  OR (
    realtime.topic() LIKE 'thread:%'
    AND EXISTS (
      SELECT 1 FROM public.threads t
      WHERE t.id::text = split_part(realtime.topic(), ':', 2)
        AND (t.client_id = auth.uid() OR t.creative_id = auth.uid())
    )
  )
);
