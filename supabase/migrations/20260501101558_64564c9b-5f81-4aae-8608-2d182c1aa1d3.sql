
-- WORKS (portfolio entries with image gallery)
CREATE TABLE public.works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  cover_url text NOT NULL,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{url, caption}]
  discipline text,
  tags text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  likes_count int NOT NULL DEFAULT 0,
  views_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Works are viewable by everyone" ON public.works FOR SELECT USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "Users insert own works" ON public.works FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own works" ON public.works FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own works" ON public.works FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER works_touch BEFORE UPDATE ON public.works FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX works_user_idx ON public.works(user_id);
CREATE INDEX works_discipline_idx ON public.works(discipline);
CREATE INDEX works_tags_idx ON public.works USING GIN(tags);

-- PROJECTS (case studies)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  subtitle text,
  cover_url text NOT NULL,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{type:'text'|'image', heading, body, url, caption}]
  discipline text,
  tags text[] NOT NULL DEFAULT '{}',
  client text,
  location text,
  year text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects viewable by everyone" ON public.projects FOR SELECT USING (is_published = true OR auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX projects_user_idx ON public.projects(user_id);

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL, -- poster
  title text NOT NULL,
  company text,
  description text NOT NULL,
  discipline text NOT NULL,
  job_type text NOT NULL DEFAULT 'project', -- project | full-time | contract
  location text,
  remote boolean NOT NULL DEFAULT false,
  budget_min int,
  budget_max int,
  currency text NOT NULL DEFAULT 'USD',
  deadline date,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'open', -- open | closed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs viewable by everyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Users insert own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX jobs_discipline_idx ON public.jobs(discipline);
CREATE INDEX jobs_status_idx ON public.jobs(status);

-- APPLICATIONS
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  message text NOT NULL,
  quote_amount int,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending', -- pending | shortlisted | accepted | declined
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Applicants can see their own applications; job posters can see apps to their jobs
CREATE POLICY "Applicants view own applications" ON public.applications FOR SELECT
  USING (auth.uid() = applicant_id OR auth.uid() = (SELECT user_id FROM public.jobs WHERE id = job_id));
CREATE POLICY "Users insert own applications" ON public.applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Applicant or job poster update" ON public.applications FOR UPDATE
  USING (auth.uid() = applicant_id OR auth.uid() = (SELECT user_id FROM public.jobs WHERE id = job_id));
CREATE POLICY "Applicant deletes own application" ON public.applications FOR DELETE
  USING (auth.uid() = applicant_id);
CREATE TRIGGER applications_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX applications_job_idx ON public.applications(job_id);
CREATE INDEX applications_applicant_idx ON public.applications(applicant_id);

-- Add skills column to profiles for search
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS profiles_skills_idx ON public.profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS profiles_discipline_idx ON public.profiles(discipline);

-- STORAGE bucket for work uploads (public read)
INSERT INTO storage.buckets (id, name, public) VALUES ('work-images', 'work-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Work images publicly readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'work-images');
CREATE POLICY "Users upload own work images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'work-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own work images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'work-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own work images" ON storage.objects FOR DELETE
  USING (bucket_id = 'work-images' AND auth.uid()::text = (storage.foldername(name))[1]);
