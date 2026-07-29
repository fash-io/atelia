// jobs.$jobId.index.tsx
import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Sparkles,
  Pencil,
  Lock,
  Unlock,
  Eye,
  Users,
  TrendingUp,
  Loader2,
  FileText,
  Paperclip,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { uploadApplicationFile } from '@/lib/upload';
import { useJob } from '@/api/hooks/job/useJob';
import { useIncrementJobView } from '@/api/hooks/job/useJobMutations';
import { useJobApplication } from '@/api/hooks/job/useJobApplication';

export const Route = createFileRoute('/jobs/$jobId/')({
  component: JobDetail,
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Job not found</h1>
      <Link to="/jobs" className="mt-6 inline-block underline">
        Back to jobs
      </Link>
    </div>
  ),
});

const STATUSES = ['submitted', 'shortlisted', 'accepted', 'rejected'] as const;
const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-foreground/10 text-foreground',
  shortlisted: 'bg-[#CDDD00]/20 text-foreground',
  accepted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-destructive/15 text-destructive',
};

function JobDetail() {
  const { jobId } = Route.useParams();
  const { user } = useAuth();

  const { data: job } = useJob(jobId);
  const { data: apps = [], refetch: refetchApps } = useJobApplication(jobId);

  const incrementView = useIncrementJobView();
  const [showApply, setShowApply] = useState(false);
  const viewedRef = useRef(false);

  const isOwner = user && job && user.id === job.user_id;
  const myApp = apps?.find(a => a.applicant_id === user?.id);

  useEffect(() => {
    if (!job || viewedRef.current) return;
    if (user && user.id === job.user_id) return;
    const key = `viewed_job_${job.id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return;
    viewedRef.current = true;
    if (typeof window !== 'undefined') sessionStorage.setItem(key, '1');

    incrementView.mutate(job.id);
  }, [job, user, incrementView]);

  if (!job) return <div className="px-5 py-20 text-center">Not found</div>;

  const budget =
    job.budget_min || job.budget_max
      ? `${job.currency} ${job.budget_min ?? '—'}${job.budget_max ? ` – ${job.budget_max}` : ''}`
      : 'Negotiable';
  const isClosed = job.status === 'closed';

  async function toggleStatus() {
    if (!job) return;
    const next = isClosed ? 'open' : 'closed';
    const { error } = await supabase.from('jobs').update({ status: next }).eq('id', job.id);
    if (error) return toast.error(error.message);
    toast.success(next === 'open' ? 'Job reopened' : 'Job closed');
  }

  const engagement =
    job.views_count > 0 ? Math.min(100, Math.round((apps.length / job.views_count) * 100)) : 0;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>

      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="lime-pill">{job.discipline}</span>
        {job.is_featured && (
          <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-foreground/80">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
        {isClosed && (
          <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-widest text-destructive">
            <Lock className="h-3 w-3" /> Closed
          </span>
        )}
      </div>
      <h1 className="display-lg">{job.title}</h1>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground/60">
        {job.company && (
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" />
            {job.company}
          </span>
        )}
        {(job.location || job.remote) && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {job.location}
            {job.remote ? ' · Remote OK' : ''}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {job.job_type}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5" />
          {budget}
        </span>
      </div>

      {/* Owner analytics */}
      {isOwner && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat
            icon={<Eye className="h-4 w-4" />}
            label="Views"
            value={job.views_count.toLocaleString()}
          />
          <Stat
            icon={<Users className="h-4 w-4" />}
            label="Applications"
            value={apps.length.toLocaleString()}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Engagement"
            value={`${engagement}%`}
          />
        </div>
      )}

      <p className="mt-8 text-foreground/85 leading-relaxed whitespace-pre-wrap">
        {job.description}
      </p>

      {job.tags && job.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {job.tags.map(t => (
            <span
              key={t}
              className="px-3 h-8 inline-flex items-center rounded-full bg-foreground/5 text-sm"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mt-10 pt-8 border-t border-foreground/10">
        {isOwner ? (
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/jobs/$jobId/edit" params={{ jobId: job.id }}>
                <Pencil className="h-4 w-4" /> Edit job
              </Link>
            </Button>
            <Button variant="outline" onClick={toggleStatus}>
              {isClosed ? (
                <>
                  <Unlock className="h-4 w-4" /> Reopen
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" /> Close job
                </>
              )}
            </Button>
          </div>
        ) : !user ? (
          <Button asChild>
            <Link to="/auth">Sign in to apply</Link>
          </Button>
        ) : isClosed ? (
          <p className="text-foreground/60">
            This job is closed and no longer accepting applications.
          </p>
        ) : myApp ? (
          <div className="rounded-2xl border border-foreground/10 p-5">
            <p className="text-sm text-foreground/60">Your application status</p>
            <div className="mt-2 flex items-center gap-3">
              <span
                className={`inline-flex items-center px-3 h-7 rounded-full text-xs uppercase tracking-widest font-medium ${STATUS_STYLES[myApp.status] ?? STATUS_STYLES.submitted}`}
              >
                {myApp.status}
              </span>
              <span className="text-xs text-foreground/50">
                Applied {new Date(myApp.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ) : (
          <Button size="lg" onClick={() => setShowApply(true)}>
            Apply / Send quote
          </Button>
        )}
      </div>

      {/* Applications panel for owner */}
      {isOwner && (
        <div className="mt-12 pt-8 border-t border-foreground/10">
          <h2 className="font-display text-2xl mb-4">Applications ({apps.length})</h2>
          {apps.length === 0 ? (
            <p className="text-foreground/55">No applications yet.</p>
          ) : (
            <ul className="space-y-3">
              {apps.map(a => (
                <ApplicationRow key={a.id} app={a} onChange={() => refetchApps()} />
              ))}
            </ul>
          )}
        </div>
      )}

      {showApply && job && (
        <ApplyModal
          job={job}
          onClose={() => setShowApply(false)}
          onSent={() => {
            setShowApply(false);
            refetchApps();
          }}
        />
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-4">
      <div className="flex items-center gap-2 text-foreground/55 text-xs uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}

function ApplicationRow({ app, onChange }: { app: App; onChange: () => void }) {
  const [profile, setProfile] = useState<{
    full_name: string | null;
    username: string | null;
    discipline: string | null;
  } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('full_name, username, discipline')
      .eq('id', app.applicant_id)
      .maybeSingle()
      .then(({ data }) => setProfile(data as any));
  }, [app.applicant_id]);

  async function setStatus(s: string) {
    setUpdating(s);
    const { error } = await supabase.from('applications').update({ status: s }).eq('id', app.id);
    setUpdating(null);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Marked ${s}`);
      onChange();
    }
  }

  return (
    <li className="rounded-2xl border border-foreground/10 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-medium">{profile?.full_name ?? profile?.username ?? 'Creative'}</div>
          {profile?.discipline && (
            <div className="text-xs text-foreground/55">{profile.discipline}</div>
          )}
        </div>
        <div className="text-right">
          {app.quote_amount && (
            <div className="font-mono text-sm">
              {app.currency} {app.quote_amount.toLocaleString()}
            </div>
          )}
          <span
            className={`mt-1 inline-flex items-center px-2.5 h-6 rounded-full text-[10px] uppercase tracking-widest font-medium ${STATUS_STYLES[app.status] ?? STATUS_STYLES.submitted}`}
          >
            {app.status}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-foreground/80 whitespace-pre-wrap">{app.message}</p>
      {(app.resume_url || app.proof_url) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {app.resume_url && (
            <a
              href={app.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10"
            >
              <FileText className="h-3.5 w-3.5" /> Resume
            </a>
          )}
          {app.proof_url && (
            <a
              href={app.proof_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 h-8 rounded-full bg-foreground/5 hover:bg-foreground/10"
            >
              <Paperclip className="h-3.5 w-3.5" /> Proof of work
            </a>
          )}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUSES.filter(s => s !== app.status).map(s => (
          <Button
            key={s}
            size="sm"
            variant={s === 'rejected' ? 'ghost' : 'outline'}
            disabled={updating !== null}
            onClick={() => setStatus(s)}
          >
            {updating === s && <Loader2 className="h-3 w-3 animate-spin" />}
            Mark {s}
          </Button>
        ))}
      </div>
    </li>
  );
}

const applySchema = z.object({
  message: z.string().trim().min(20, 'Tell them a bit more (20+ characters)').max(2000),
  quote_amount: z.number().int().min(0).optional(),
});

function ApplyModal({
  job,
  onClose,
  onSent,
}: {
  job: Job;
  onClose: () => void;
  onSent: () => void;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [quote, setQuote] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{ message?: string; quote?: string; files?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (message.trim().length < 20) errs.message = 'Tell them a bit more (20+ characters)';
    if (message.length > 2000) errs.message = 'Keep it under 2000 characters';
    if (quote && (Number.isNaN(Number(quote)) || Number(quote) < 0))
      errs.quote = 'Enter a valid amount';
    if (resumeFile && resumeFile.size > 15 * 1024 * 1024) errs.files = 'Resume must be under 15MB';
    if (proofFile && proofFile.size > 15 * 1024 * 1024)
      errs.files = 'Proof of work must be under 15MB';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function send() {
    if (!validate()) return;
    if (!user) {
      toast.error('Please sign in');
      return;
    }
    setSending(true);
    try {
      let resumeUrl: string | null = null;
      let proofUrl: string | null = null;
      if (resumeFile)
        resumeUrl = await uploadApplicationFile(user.id, job.id, resumeFile, 'resume');
      if (proofFile) proofUrl = await uploadApplicationFile(user.id, job.id, proofFile, 'proof');

      const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        applicant_id: user.id,
        message: message.trim(),
        quote_amount: quote ? Number(quote) : null,
        currency: job.currency,
        status: 'submitted',
        resume_url: resumeUrl,
        proof_url: proofUrl,
      });
      if (error) {
        if (error.code === '23505') {
          toast.error("You've already applied to this job");
          return;
        }
        toast.error(error.message);
        return;
      }
      toast.success('Application sent');
      onSent();
    } catch (err: any) {
      toast.error(err.message ?? 'Could not submit application');
    } finally {
      setSending(false);
    }
  }

  function onBackdropMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !sending) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center overflow-y-auto max-lg:p-4"
      onMouseDown={onBackdropMouseDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-title"
    >
      <div
        className="bg-background rounded-3xl max-w-xl w-full p-8 shadow-(--shadow-lift)"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="apply-title" className="font-display text-2xl">
          Apply to {job.title}
        </h2>
        <p className="text-sm text-foreground/55 mt-1">
          Send a short pitch, attach your resume, and add proof of work if you have it.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              Your message
            </label>
            <textarea
              value={message}
              onChange={e => {
                setMessage(e.target.value);
                if (errors.message) setErrors({ ...errors, message: undefined });
              }}
              className={`mt-2 w-full px-4 py-3 rounded-xl border bg-background min-h-40 focus:outline-none text-sm ${errors.message ? 'border-destructive focus:border-destructive' : 'border-foreground/10 focus:border-foreground/40'}`}
              maxLength={2000}
              placeholder="Why you're a fit, similar projects, timeline…"
              disabled={sending}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className="text-destructive">{errors.message}</span>
              <span className="text-foreground/40">{message.length}/2000</span>
            </div>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-foreground/60">
              Quote ({job.currency}) — optional
            </label>
            <input
              type="number"
              min={0}
              value={quote}
              onChange={e => {
                setQuote(e.target.value);
                if (errors.quote) setErrors({ ...errors, quote: undefined });
              }}
              className={`mt-2 w-full h-11 px-4 rounded-xl border bg-background focus:outline-none text-sm ${errors.quote ? 'border-destructive focus:border-destructive' : 'border-foreground/10 focus:border-foreground/40'}`}
              disabled={sending}
            />
            {errors.quote && <p className="mt-1 text-xs text-destructive">{errors.quote}</p>}
          </div>

          <FileInput
            label="Resume / CV"
            hint="PDF, DOC or DOCX up to 15MB"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            file={resumeFile}
            onFile={setResumeFile}
            disabled={sending}
          />
          <FileInput
            label="Proof of work (optional)"
            hint="PDF, image, or zipped portfolio up to 15MB"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,image/*,application/pdf,application/zip"
            file={proofFile}
            onFile={setProofFile}
            disabled={sending}
          />
          {errors.files && <p className="text-xs text-destructive">{errors.files}</p>}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={send} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 animate-spin" />}
            {sending ? 'Sending…' : 'Send application'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FileInput({
  label,
  hint,
  accept,
  file,
  onFile,
  disabled,
}: {
  label: string;
  hint: string;
  accept: string;
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-foreground/60">{label}</label>
      {file ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 h-11 text-sm">
          <span className="inline-flex items-center gap-2 truncate">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">{file.name}</span>
          </span>
          <button
            type="button"
            onClick={() => onFile(null)}
            disabled={disabled}
            className="h-7 w-7 grid place-items-center rounded-full hover:bg-foreground/5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label
          className={`mt-2 flex items-center gap-2 cursor-pointer rounded-xl border border-dashed border-foreground/15 hover:border-foreground/40 px-4 h-11 text-sm text-foreground/60 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Paperclip className="h-4 w-4" /> Choose file
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={disabled}
            onChange={e => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <p className="mt-1 text-xs text-foreground/40">{hint}</p>
    </div>
  );
}
