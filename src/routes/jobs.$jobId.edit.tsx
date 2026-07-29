// jobs.$jobId.edit.tsx;

import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ArrowLeft, X, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { DISCIPLINES_FULL } from '@/lib/disciplines';
import { useIsPro } from '@/api/hooks/user/useIsPro';
import { useJob } from '@/api/hooks/job/useJob';
import { useUpdateJob, useDeleteJob } from '@/api/hooks/job/useJobMutations';

export const Route = createFileRoute('/jobs/$jobId/edit')({
  head: () => ({ meta: [{ title: 'Edit job — Atelier' }] }),
  component: EditJob,
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Job not found</h1>
      <Link to="/jobs" className="mt-6 inline-block underline">
        Back to jobs
      </Link>
    </div>
  ),
});

const schema = z.object({
  title: z.string().trim().min(4).max(140),
  company: z.string().trim().max(120).optional(),
  description: z.string().trim().min(20).max(4000),
  discipline: z.string().min(1, 'Pick a discipline'),
  job_type: z.enum(['project', 'full-time', 'contract', 'freelance']),
  location: z.string().trim().max(120).optional(),
  remote: z.boolean(),
  budget_min: z.number().int().min(0).optional(),
  budget_max: z.number().int().min(0).optional(),
  currency: z.string().min(3).max(4),
  deadline: z.string().optional(),
  status: z.enum(['open', 'closed']),
  is_featured: z.boolean(),
});

function EditJob() {
  const { jobId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: isPro = false } = useIsPro(user?.id);
  const { data: job } = useJob(jobId);
  const updateJob = useUpdateJob();
  const deleteJob = useDeleteJob();

  const [form, setForm] = useState({
    title: '',
    company: '',
    description: '',
    discipline: '',
    job_type: 'project' as 'project' | 'full-time' | 'contract' | 'freelance',
    location: '',
    remote: false,
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    deadline: '',
    status: 'open' as 'open' | 'closed',
    is_featured: false,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!job || !user) return;
    if (job.user_id !== user.id) {
      toast.error('You can only edit your own jobs');
      navigate({ to: '/jobs' });
      return;
    }
    setForm({
      title: job.title,
      company: job.company ?? '',
      description: job.description,
      discipline: job.discipline,
      job_type: job.job_type as any,
      location: job.location ?? '',
      remote: job.remote,
      budget_min: job.budget_min?.toString() ?? '',
      budget_max: job.budget_max?.toString() ?? '',
      currency: job.currency,
      deadline: job.deadline ?? '',
      status: (job.status as any) ?? 'open',
      is_featured: Boolean(job.is_featured),
    });
    setTags(job.tags ?? []);
  }, [job, user, navigate]);

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags([...tags, t]);
    setTagInput('');
  }

  async function save() {
    if (!user) return;
    const parsed = schema.safeParse({
      ...form,
      company: form.company || undefined,
      location: form.location || undefined,
      budget_min: form.budget_min ? Number(form.budget_min) : undefined,
      budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      deadline: form.deadline || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (
      parsed.data.budget_min != null &&
      parsed.data.budget_max != null &&
      parsed.data.budget_max < parsed.data.budget_min
    ) {
      return toast.error('Budget max must be greater than or equal to min');
    }

    try {
      await updateJob.mutateAsync({
        id: jobId,
        userId: user.id,
        data: {
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
          status: parsed.data.status,
          tags,
          is_featured: parsed.data.is_featured,
          isPro,
        },
      });
      toast.success('Job updated');
      navigate({ to: '/jobs/$jobId', params: { jobId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update job');
    }
  }

  async function remove() {
    if (!confirm('Delete this job permanently? Applications will also be removed.')) return;
    try {
      await deleteJob.mutateAsync(jobId);
      toast.success('Job deleted');
      navigate({ to: '/jobs' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete job');
    }
  }

  if (!user || !job)
    return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;

  const u = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-2xl px-5 lg:px-10 py-12">
      <Link
        to="/jobs/$jobId"
        params={{ jobId }}
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to job
      </Link>
      <p className="eyebrow">Edit job</p>
      <h1 className="display-lg mt-2">{form.title || 'Edit your post'}</h1>

      <div className="mt-10 space-y-6">
        <Field label="Title">
          <input
            value={form.title}
            onChange={e => u('title', e.target.value)}
            className={input}
            maxLength={140}
          />
        </Field>
        <Field label="Company / Client">
          <input
            value={form.company}
            onChange={e => u('company', e.target.value)}
            className={input}
            maxLength={120}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Discipline">
            <select
              value={form.discipline}
              onChange={e => u('discipline', e.target.value)}
              className={input}
            >
              <option value="">Select…</option>
              {DISCIPLINES_FULL.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select
              value={form.job_type}
              onChange={e => u('job_type', e.target.value)}
              className={input}
            >
              <option value="project">Project</option>
              <option value="full-time">Full-time</option>
              <option value="contract">Contract</option>
              <option value="freelance">Freelance</option>
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-[1fr,auto] gap-4 items-end">
          <Field label="Location">
            <input
              value={form.location}
              onChange={e => u('location', e.target.value)}
              className={input}
              maxLength={120}
            />
          </Field>
          <label className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-foreground/10 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={e => u('remote', e.target.checked)}
              className="h-4 w-4 accent-lime"
            />
            Remote OK
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Budget min">
            <input
              type="number"
              min={0}
              value={form.budget_min}
              onChange={e => u('budget_min', e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Budget max">
            <input
              type="number"
              min={0}
              value={form.budget_max}
              onChange={e => u('budget_max', e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Currency">
            <select
              value={form.currency}
              onChange={e => u('currency', e.target.value)}
              className={input}
            >
              {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Deadline">
            <input
              type="date"
              value={form.deadline}
              onChange={e => u('deadline', e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={e => u('status', e.target.value)}
              className={input}
            >
              <option value="open">Open — accepting applications</option>
              <option value="closed">Closed — no longer hiring</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={form.description}
            onChange={e => u('description', e.target.value)}
            className={input + ' min-h-50 py-3'}
            maxLength={4000}
          />
        </Field>

        <div>
          <Lbl>Tags</Lbl>
          <div className="mt-2 flex flex-wrap gap-2 mb-3">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-foreground/5 text-sm"
              >
                #{t}
                <button onClick={() => setTags(tags.filter(x => x !== t))}>
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
              className={input}
              placeholder="Add tag"
              maxLength={30}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <div
          className={`rounded-2xl border p-5 ${isPro ? 'border-lime/40 bg-lime/5' : 'border-foreground/10 bg-foreground/2'}`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_featured && isPro}
              disabled={!isPro}
              onChange={e => u('is_featured', e.target.checked)}
              className="mt-1 h-4 w-4 accent-lime disabled:opacity-40"
            />
            <div className="flex-1">
              <div className="font-medium">Feature this job (Pro)</div>
              <p className="text-sm text-foreground/60 mt-1">
                {isPro ? (
                  'Pin to the top 10 in search results for 30 days from save.'
                ) : (
                  <>
                    Available on Pro.{' '}
                    <Link
                      to="/pricing"
                      className="underline"
                      search={{ reference: undefined, trxref: undefined }}
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

        <div className="flex justify-between gap-3 pt-6 border-t border-foreground/10">
          <Button
            variant="outline"
            onClick={remove}
            disabled={deleteJob.isPending}
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/jobs/$jobId', params: { jobId } })}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={updateJob.isPending}>
              {updateJob.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {updateJob.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const input =
  'w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm';
function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-widest text-foreground/60">{children}</label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <div className="mt-2">{children}</div>
    </div>
  );
}
