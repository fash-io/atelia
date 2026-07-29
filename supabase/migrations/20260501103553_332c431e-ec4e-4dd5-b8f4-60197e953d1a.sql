
-- =========== SERVICES ===========
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price_amount integer,
  currency text NOT NULL DEFAULT 'USD',
  price_unit text NOT NULL DEFAULT 'fixed',
  delivery_days integer,
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Services are viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Users insert own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own services" ON public.services FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own services" ON public.services FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_services_user ON public.services(user_id, sort_order);

-- =========== BOOKINGS ===========
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  creative_id uuid NOT NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  title text NOT NULL,
  notes text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  status text NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Booking parties view own" ON public.bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creative_id);
CREATE POLICY "Authed users insert booking" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Booking parties update" ON public.bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = creative_id);
CREATE POLICY "Booking parties delete" ON public.bookings FOR DELETE USING (auth.uid() = client_id OR auth.uid() = creative_id);
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_bookings_creative ON public.bookings(creative_id, scheduled_at);
CREATE INDEX idx_bookings_client ON public.bookings(client_id, scheduled_at);

-- =========== THREADS / MESSAGES ===========
CREATE TABLE public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  creative_id uuid NOT NULL,
  subject text NOT NULL DEFAULT 'New inquiry',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Thread parties view" ON public.threads FOR SELECT USING (auth.uid() = client_id OR auth.uid() = creative_id);
CREATE POLICY "Authed users start thread" ON public.threads FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Thread parties update" ON public.threads FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = creative_id);
CREATE INDEX idx_threads_creative ON public.threads(creative_id, last_message_at DESC);
CREATE INDEX idx_threads_client ON public.threads(client_id, last_message_at DESC);

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Thread parties read messages" ON public.messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id AND (auth.uid() = t.client_id OR auth.uid() = t.creative_id))
);
CREATE POLICY "Thread parties send messages" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id AND (auth.uid() = t.client_id OR auth.uid() = t.creative_id))
);
CREATE POLICY "Sender updates own message" ON public.messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.threads t WHERE t.id = thread_id AND (auth.uid() = t.client_id OR auth.uid() = t.creative_id))
);
CREATE INDEX idx_messages_thread ON public.messages(thread_id, created_at);

-- =========== NOTIFICATIONS ===========
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  related_id uuid,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- =========== TRIGGERS ===========
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t public.threads%ROWTYPE; recipient uuid;
BEGIN
  SELECT * INTO t FROM public.threads WHERE id = NEW.thread_id;
  UPDATE public.threads SET last_message_at = NEW.created_at WHERE id = NEW.thread_id;
  recipient := CASE WHEN NEW.sender_id = t.client_id THEN t.creative_id ELSE t.client_id END;
  INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
  VALUES (recipient, 'message', 'New message', LEFT(NEW.body, 140), '/inbox/' || NEW.thread_id::text, NEW.thread_id);
  RETURN NEW;
END;$$;
CREATE TRIGGER messages_after_insert AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

CREATE OR REPLACE FUNCTION public.handle_booking_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (NEW.creative_id, 'booking', 'New booking request', NEW.title, '/profile?tab=Bookings', NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (NEW.client_id, 'booking', 'Booking ' || NEW.status, NEW.title, '/profile?tab=Bookings', NEW.id);
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER bookings_notify AFTER INSERT OR UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.handle_booking_event();

CREATE OR REPLACE FUNCTION public.handle_application_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE poster uuid; job_title text;
BEGIN
  SELECT user_id, title INTO poster, job_title FROM public.jobs WHERE id = NEW.job_id;
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (poster, 'application', 'New application', 'Someone applied to: ' || job_title, '/jobs/' || NEW.job_id::text, NEW.id);
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
    VALUES (NEW.applicant_id, 'application', 'Application ' || NEW.status, job_title, '/jobs/' || NEW.job_id::text, NEW.id);
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER applications_notify AFTER INSERT OR UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.handle_application_event();

CREATE OR REPLACE FUNCTION public.handle_new_job()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, kind, title, body, link, related_id)
  SELECT p.id, 'job', 'New ' || NEW.discipline || ' job', NEW.title, '/jobs/' || NEW.id::text, NEW.id
  FROM public.profiles p
  WHERE p.available_for_hire = true
    AND p.discipline = NEW.discipline
    AND p.id <> NEW.user_id;
  RETURN NEW;
END;$$;
CREATE TRIGGER jobs_notify AFTER INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.handle_new_job();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
