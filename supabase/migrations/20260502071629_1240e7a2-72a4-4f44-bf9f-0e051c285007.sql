
-- Add analytics + featured columns to jobs
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE INDEX IF NOT EXISTS jobs_featured_idx ON public.jobs (is_featured, created_at DESC);

-- Update default application status from 'pending' to 'submitted' and migrate existing
UPDATE public.applications SET status = 'submitted' WHERE status = 'pending';
UPDATE public.applications SET status = 'rejected' WHERE status = 'declined';
ALTER TABLE public.applications ALTER COLUMN status SET DEFAULT 'submitted';

-- RPC to atomically increment job views
CREATE OR REPLACE FUNCTION public.increment_job_views(_job_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.jobs SET views_count = views_count + 1 WHERE id = _job_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_job_views(uuid) TO anon, authenticated;
