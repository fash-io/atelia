// jobs.new.tsx;
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ArrowLeft,
  X,
  Plus,
  Loader2,
  Sparkles,
  Briefcase,
  MapPin,
  Wallet,
  FileText,
  Tag as TagIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { DISCIPLINES_FULL } from '@/lib/disciplines';
import { useIsPro } from '@/api/hooks/user/useIsPro';
import { useCreateJob } from '@/api/hooks/job/useCreateJob';

export const Route = createFileRoute('/jobs/new')({
  head: () => ({ meta: [{ title: 'Post a job — Atelier' }] }),
  component: NewJob,
});

const JOB_TYPES = [
  { v: 'project', label: 'Project' },
  { v: 'full-time', label: 'Full-time' },
  { v: 'contract', label: 'Contract' },
  { v: 'freelance', label: 'Freelance' },
] as const;

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'] as const;

const schema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters').max(140),
  company: z.string().trim().max(120).optional(),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(4000),
  discipline: z.string().min(1, 'Pick a discipline'),
  job_type: z.enum(['project', 'full-time', 'contract', 'freelance']),
  location: z.string().trim().max(120).optional(),
  remote: z.boolean(),
  budget_min: z.number().int().min(0).optional(),
  budget_max: z.number().int().min(0).optional(),
  currency: z.string().min(3).max(4),
  deadline: z.string().optional(),
});

function NewJob() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: isPro = false } = useIsPro(user?.id);
  const createJob = useCreateJob();

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    discipline: '',
    job_type: 'project' as const,
    location: '',
    remote: false,
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    deadline: '',
  });
  const [feature, setFeature] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  // live-parse on every change so we can show inline errors without waiting for submit
  const parsed = useMemo(
    () =>
      schema.safeParse({
        ...form,
        company: form.company || undefined,
        location: form.location || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
        deadline: form.deadline || undefined,
      }),
    [form],
  );

  const fieldError = (key: string) => {
    if (!attempted && !touched[key]) return undefined;
    if (parsed.success) return undefined;
    return parsed.error.issues.find(i => i.path[0] === key)?.message;
  };

  const budgetOrderError =
    form.budget_min && form.budget_max && Number(form.budget_max) < Number(form.budget_min)
      ? 'Max must be greater than or equal to min'
      : undefined;

  const deadlineError = useMemo(() => {
    if (!form.deadline) return undefined;
    const d = new Date(form.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today ? "Deadline can't be in the past" : undefined;
  }, [form.deadline]);

  if (loading) return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;
  if (!user) return null;

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags([...tags, t]);
    setTagInput('');
  }

  async function post() {
    setAttempted(true);
    if (!user) {
      toast.error('Please sign in to post');
      return;
    }
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (budgetOrderError) return toast.error(budgetOrderError);
    if (deadlineError) return toast.error(deadlineError);

    try {
      const job = await createJob.mutateAsync({
        user_id: user.id,
        title: parsed.data.title,
        company: parsed.data.company,
        description: parsed.data.description,
        discipline: parsed.data.discipline,
        job_type: parsed.data.job_type,
        location: parsed.data.location,
        remote: parsed.data.remote,
        budget_min: parsed.data.budget_min,
        budget_max: parsed.data.budget_max,
        currency: parsed.data.currency,
        deadline: parsed.data.deadline,
        tags,
        feature,
        isPro,
      });
      toast.success('Job posted');
      navigate({ to: '/jobs/$jobId', params: { jobId: job.id } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post job');
    }
  }

  const u = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));
  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));

  return (
    <div className="mx-auto max-w-2xl px-5 lg:px-10 py-12 pb-32">
      <Link
        to="/jobs"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>
      <p className="eyebrow">New request</p>
      <h1 className="display-lg mt-2">Post a job or project</h1>
      <p className="mt-2 text-sm text-foreground/50">
        Takes about 2 minutes. You can edit anything after posting.
      </p>

      <div className="mt-10 space-y-10">
        {/* SECTION: Basics */}
        <Section icon={Briefcase} title="The basics">
          <Field label="Title" error={fieldError('title')} required>
            <input
              value={form.title}
              onChange={e => u('title', e.target.value)}
              onBlur={() => touch('title')}
              className={inputCls(!!fieldError('title'))}
              placeholder="e.g. Lead Architect — Boutique Hotel"
              maxLength={140}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company / Client" hint="optional">
              <input
                value={form.company}
                onChange={e => u('company', e.target.value)}
                className={inputCls(false)}
                placeholder="e.g. Atelier Studios"
                maxLength={120}
              />
            </Field>
            <Field label="Discipline" error={fieldError('discipline')} required>
              <select
                value={form.discipline}
                onChange={e => {
                  u('discipline', e.target.value);
                  touch('discipline');
                }}
                className={inputCls(!!fieldError('discipline'))}
              >
                <option value="">Select…</option>
                {DISCIPLINES_FULL.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Job type">
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map(t => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => u('job_type', t.v)}
                  className={`h-9 px-4 rounded-full border text-sm transition-colors ${
                    form.job_type === t.v
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-foreground/15 text-foreground/60 hover:border-foreground/40'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* SECTION: Where */}
        <Section icon={MapPin} title="Where">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Field label="Location" hint={form.remote ? 'optional while remote' : undefined}>
                <input
                  value={form.location}
                  onChange={e => u('location', e.target.value)}
                  className={inputCls(false)}
                  placeholder="e.g. Lagos, Nigeria"
                  maxLength={120}
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() => u('remote', !form.remote)}
              className={`sm:mt-6 h-11 px-4 rounded-xl border text-sm inline-flex items-center gap-2 justify-center transition-colors shrink-0 ${
                form.remote
                  ? 'bg-lime/10 border-lime/40 text-foreground'
                  : 'border-foreground/10 text-foreground/60 hover:border-foreground/30'
              }`}
            >
              <span
                className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                  form.remote ? 'bg-lime border-lime' : 'border-foreground/30'
                }`}
              >
                {form.remote && <span className="h-1.5 w-1.5 rounded-full bg-foreground" />}
              </span>
              Remote OK
            </button>
          </div>
        </Section>

        {/* SECTION: Compensation */}
        <Section icon={Wallet} title="Compensation" optional>
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3">
            <Field label="Min">
              <input
                type="number"
                min={0}
                value={form.budget_min}
                onChange={e => u('budget_min', e.target.value)}
                className={inputCls(!!budgetOrderError)}
                placeholder="0"
              />
            </Field>
            <Field label="Max" error={budgetOrderError}>
              <input
                type="number"
                min={0}
                value={form.budget_max}
                onChange={e => u('budget_max', e.target.value)}
                className={inputCls(!!budgetOrderError)}
                placeholder="No cap"
              />
            </Field>
            <Field label="Currency">
              <select
                value={form.currency}
                onChange={e => u('currency', e.target.value)}
                className={inputCls(false) + ' sm:w-24'}
              >
                {CURRENCIES.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-xs text-foreground/40 -mt-2">
            Leave blank to keep the budget negotiable — it'll show as "Negotiable" to applicants.
          </p>

          <Field label="Application deadline" hint="optional" error={deadlineError}>
            <input
              type="date"
              value={form.deadline}
              onChange={e => u('deadline', e.target.value)}
              className={inputCls(!!deadlineError)}
            />
          </Field>
        </Section>

        {/* SECTION: Description */}
        <Section icon={FileText} title="The brief">
          <Field
            label="Description"
            error={fieldError('description')}
            required
            hint={`${form.description.length}/4000`}
          >
            <textarea
              value={form.description}
              onChange={e => u('description', e.target.value)}
              onBlur={() => touch('description')}
              className={inputCls(!!fieldError('description')) + ' min-h-50 py-3'}
              placeholder="Describe the brief, scope, deliverables and timeline. The clearer this is, the better the applicants."
              maxLength={4000}
            />
          </Field>
        </Section>

        {/* SECTION: Tags */}
        <Section icon={TagIcon} title="Tags" optional hint={`${tags.length}/10`}>
          <div className="flex flex-wrap gap-2 mb-1 min-h-8">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-foreground/5 text-sm"
              >
                #{t}
                <button
                  onClick={() => setTags(tags.filter(x => x !== t))}
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              disabled={tags.length >= 10}
              className={inputCls(false) + ' disabled:opacity-40'}
              placeholder={
                tags.length >= 10
                  ? 'Tag limit reached'
                  : 'e.g. residential, hospitality — press Enter'
              }
              maxLength={30}
            />
            <Button type="button" variant="outline" onClick={addTag} disabled={tags.length >= 10}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </Section>

        {/* Pro feature toggle */}
        <div
          className={`rounded-2xl border p-5 ${isPro ? 'border-lime/40 bg-lime/5' : 'border-foreground/10 bg-foreground/2'}`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={feature && isPro}
              disabled={!isPro}
              onChange={e => setFeature(e.target.checked)}
              className="mt-1 h-4 w-4 accent-lime disabled:opacity-40"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">Feature this job (Pro)</span>
              </div>
              <p className="text-sm text-foreground/60 mt-1">
                {isPro ? (
                  'Pin to the top 10 in search results for 30 days. Pro members also see new requests 12h before everyone else.'
                ) : (
                  <>
                    Available on Pro.{' '}
                    <Link
                      to="/pricing"
                      className="underline"
                      search={{
                        reference: undefined,
                        trxref: undefined,
                      }}
                    >
                      Upgrade
                    </Link>{' '}
                    to feature your jobs.
                  </>
                )}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* sticky action bar so the primary action is always reachable, even in a long form */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-foreground/10 bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-2xl px-5 lg:px-10 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-foreground/40 hidden sm:block">
            {attempted && !parsed.success
              ? 'Fix the highlighted fields to continue'
              : 'Ready when you are'}
          </p>
          <div className="flex gap-3 ml-auto">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/jobs' })}
              disabled={createJob.isPending}
            >
              Cancel
            </Button>
            <Button onClick={post} disabled={createJob.isPending}>
              {createJob.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {createJob.isPending ? 'Posting…' : 'Post job'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full h-11 px-4 rounded-xl border bg-background focus:outline-none text-sm transition-colors ${
    hasError
      ? 'border-destructive/50 focus:border-destructive'
      : 'border-foreground/10 focus:border-foreground/40'
  }`;
}

function Section({
  icon: Icon,
  title,
  optional,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-foreground/40" />
        <h2 className="text-sm font-medium">{title}</h2>
        {optional && <span className="text-xs text-foreground/35">optional</span>}
        {hint && <span className="text-xs text-foreground/35 ml-auto">{hint}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  error,
  required,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="text-xs uppercase tracking-widest text-foreground/60">{label}</label>
        {hint && !error && <span className="text-xs text-foreground/35">{hint}</span>}
      </div>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}
