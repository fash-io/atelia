
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_ngn integer NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'per month',
  blurb text NOT NULL DEFAULT '',
  cta text NOT NULL DEFAULT 'Choose plan',
  features text[] NOT NULL DEFAULT '{}'::text[],
  highlight boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans viewable by everyone" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins insert plans" ON public.plans FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update plans" ON public.plans FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete plans" ON public.plans FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER touch_plans_updated_at BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.plans (id, name, price_ngn, period, blurb, cta, features, highlight, sort_order) VALUES
('free', 'Free', 0, 'forever',
 'Showcase your work and start building an audience.', 'Current plan',
 ARRAY['Unlimited works','Project case studies','Public profile','Standard search visibility'], false, 1),
('pro', 'Pro', 15000, 'per month',
 'Stand out, get hired faster, win the inbox.', 'Upgrade to Pro',
 ARRAY['Top search placement','First access to jobs (12-hour window)','Featured profile badge','Cover banner & gallery layouts','Visitor & engagement analytics','Priority booking inquiries'], true, 2),
('studio', 'Studio', 55000, 'per month',
 'For teams managing multiple creatives.', 'Choose Studio',
 ARRAY['Up to 8 team profiles','Shared booking calendar','Team job board','Custom domain'], false, 3);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL,
  amount_ngn integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'succeeded',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_created_idx ON public.transactions(created_at DESC);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins update transactions" ON public.transactions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete transactions" ON public.transactions
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
