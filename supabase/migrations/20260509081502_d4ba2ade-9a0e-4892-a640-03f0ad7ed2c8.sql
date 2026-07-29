UPDATE public.applications SET status = 'submitted' WHERE status NOT IN ('submitted','shortlisted','accepted','rejected');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'applications_status_allowed'
      AND conrelid = 'public.applications'::regclass
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_status_allowed
      CHECK (status IN ('submitted','shortlisted','accepted','rejected'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS applications_one_per_applicant_job
ON public.applications(job_id, applicant_id);
