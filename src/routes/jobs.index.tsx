//jobs.index.tsx
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { zodValidator, fallback } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useMemo, useState } from 'react';
import {
  Briefcase,
  MapPin,
  Clock,
  Sparkles,
  Plus,
  Pencil,
  Lock,
  Eye,
  Users,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { DISCIPLINES_FULL } from '@/lib/disciplines';
import { useJobs } from '@/api/hooks/job/useJobs';
import { useJobApplicationCounts } from '@/api/hooks/job/useJobApplicationCounts';

const JOB_TYPES = ['project', 'full-time', 'contract', 'freelance'] as const;
const REMOTE_OPTS = ['any', 'remote', 'onsite'] as const;
const SORTS = ['newest', 'oldest', 'views'] as const;
const TABS = ['all', 'mine'] as const;

const searchSchema = z.object({
  tab: fallback(z.enum(TABS), 'all').default('all'),
  sort: fallback(z.enum(SORTS), 'newest').default('newest'),
  showClosed: fallback(z.boolean(), false).default(false),
  discipline: fallback(z.string(), '').default(''),
  jobType: fallback(z.enum(['', ...JOB_TYPES] as const), '').default(''),
  remote: fallback(z.enum(REMOTE_OPTS), 'any').default('any'),
  minBudget: fallback(z.number().int().min(0).optional(), undefined),
  maxBudget: fallback(z.number().int().min(0).optional(), undefined),
});

export const Route = createFileRoute('/jobs/')({
  head: () => ({
    meta: [
      { title: 'Jobs — Atelier' },
      {
        name: 'description',
        content:
          'Open jobs and project requests for architects, interior designers, event organisers, civil engineers, artists and makers.',
      },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: JobsPage,
});

function JobsPage() {
  const { user, loading: authLoading } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: '/jobs/' });

  const { tab, sort, showClosed, discipline, jobType, remote, minBudget, maxBudget } = search;

  const [filtersOpen, setFiltersOpen] = useState(false);

  function setSearch(patch: Partial<typeof search>) {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });
  }

  function clearFilters() {
    navigate({
      search: (prev: typeof search) => ({
        ...prev,
        discipline: '',
        jobType: '' as const,
        remote: 'any' as const,
        minBudget: undefined,
        maxBudget: undefined,
      }),
    });
  }

  const activeFilterCount =
    (discipline ? 1 : 0) +
    (jobType ? 1 : 0) +
    (remote !== 'any' ? 1 : 0) +
    (minBudget != null ? 1 : 0) +
    (maxBudget != null ? 1 : 0);

  const { data: jobs = [], isLoading } = useJobs({
    tab,
    userId: user?.id,
    showClosed,
    discipline: discipline || undefined,
    jobType: jobType || undefined,
    remote,
    minBudget,
    maxBudget,
  });

  const jobIds = useMemo(() => jobs.map(j => j.id), [jobs]);
  const { data: myAppCounts = {} } = useJobApplicationCounts(jobIds, tab === 'mine' && !!user);

  const loading = authLoading || isLoading;

  const sorted = useMemo(() => {
    const now = Date.now();
    const isFeaturedActive = (j: Job) =>
      j.is_featured && (!j.featured_until || new Date(j.featured_until).getTime() > now);

    const compare = (a: Job, b: Job) => {
      switch (sort) {
        case 'oldest':
          return +new Date(a.created_at) - +new Date(b.created_at);
        case 'views':
          return (b.views_count ?? 0) - (a.views_count ?? 0);
        case 'newest':
        default:
          return +new Date(b.created_at) - +new Date(a.created_at);
      }
    };

    if (tab !== 'all') return [...jobs].sort(compare);

    const ranked = [...jobs].sort((a, b) => {
      const af = isFeaturedActive(a) ? 1 : 0;
      const bf = isFeaturedActive(b) ? 1 : 0;
      if (af !== bf) return bf - af;
      return compare(a, b);
    });
    const top10 = ranked.slice(0, 10);
    const top10Ids = new Set(top10.map(x => x.id));
    const rest = [...jobs].filter(j => !top10Ids.has(j.id)).sort(compare);
    return [...top10, ...rest];
  }, [jobs, sort, tab]);

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow">Hire & Get Hired</p>
          <h1 className="display-lg mt-2">Open jobs</h1>
          <p className="mt-3 text-foreground/60 text-sm inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Pro members get featured placement in the top 10
            results — every user can post and apply.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate({ to: user ? '/jobs/new' : '/auth' })}>
          <Plus className="h-4 w-4" /> Post a job
        </Button>
      </div>

      <div className="flex items-center justify-between border-b border-foreground/10 mb-4 flex-wrap gap-4">
        <div className="flex">
          <TabBtn active={tab === 'all'} onClick={() => setSearch({ tab: 'all' })}>
            All jobs
          </TabBtn>
          {user && (
            <TabBtn active={tab === 'mine'} onClick={() => setSearch({ tab: 'mine' })}>
              My jobs
            </TabBtn>
          )}
        </div>
        <div className="flex items-center gap-3 pb-3 flex-wrap">
          <button
            onClick={() => setFiltersOpen(v => !v)}
            className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-xs transition-colors ${activeFilterCount > 0 ? 'border-foreground bg-foreground text-background' : 'border-foreground/10 hover:border-foreground/30'}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ''}
          </button>
          <select
            value={sort}
            onChange={e => setSearch({ sort: e.target.value as any })}
            className="h-9 px-3 rounded-lg border border-foreground/10 bg-background text-xs"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="views">Most viewed</option>
          </select>
          <label className="inline-flex items-center gap-2 text-xs text-foreground/60 cursor-pointer">
            <input
              type="checkbox"
              checked={showClosed}
              onChange={e => setSearch({ showClosed: e.target.checked })}
              className="h-4 w-4 accent-lime"
            />
            Show closed
          </label>
        </div>
      </div>

      {filtersOpen && (
        <div className="mb-6 rounded-2xl border border-foreground/10 p-5 bg-foreground/2">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Discipline">
              <select
                value={discipline}
                onChange={e => setSearch({ discipline: e.target.value })}
                className={input}
              >
                <option value="">All disciplines</option>
                {DISCIPLINES_FULL.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Job type">
              <div className="flex flex-wrap gap-1.5 h-full">
                {JOB_TYPES.map(t => (
                  <PillOption
                    key={t}
                    active={jobType === t}
                    label={t}
                    onClick={() => setSearch({ jobType: jobType === t ? '' : t })}
                  />
                ))}
              </div>
            </Field>

            <Field label="Location">
              <div className="flex flex-wrap gap-1.5">
                <PillOption
                  active={remote === 'remote'}
                  label="Remote"
                  onClick={() => setSearch({ remote: remote === 'remote' ? 'any' : 'remote' })}
                />
                <PillOption
                  active={remote === 'onsite'}
                  label="On-site"
                  onClick={() => setSearch({ remote: remote === 'onsite' ? 'any' : 'onsite' })}
                />
              </div>
            </Field>

            <Field label="Budget range">
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={minBudget ?? ''}
                  onChange={e =>
                    setSearch({ minBudget: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={input}
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={maxBudget ?? ''}
                  onChange={e =>
                    setSearch({ maxBudget: e.target.value ? Number(e.target.value) : undefined })
                  }
                  className={input}
                />
              </div>
            </Field>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex flex-wrap gap-2">
                {discipline && (
                  <Chip onClear={() => setSearch({ discipline: '' })}>{discipline}</Chip>
                )}
                {jobType && <Chip onClear={() => setSearch({ jobType: '' })}>{jobType}</Chip>}
                {remote !== 'any' && (
                  <Chip onClear={() => setSearch({ remote: 'any' })}>
                    {remote === 'remote' ? 'Remote' : 'On-site'}
                  </Chip>
                )}
                {(minBudget != null || maxBudget != null) && (
                  <Chip onClear={() => setSearch({ minBudget: undefined, maxBudget: undefined })}>
                    {minBudget ?? 0}–{maxBudget ?? '∞'}
                  </Chip>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-xs underline text-foreground/60 hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}
          <p className="mt-4 text-xs text-foreground/45">
            Filters are saved in the URL — share or bookmark this view.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-foreground/50">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-foreground/15">
          <p className="text-foreground/60">
            {tab === 'mine'
              ? "You haven't posted any jobs yet."
              : activeFilterCount > 0
                ? 'No jobs match your filters.'
                : 'No jobs yet — be the first to post.'}
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button className="mt-4" onClick={() => navigate({ to: user ? '/jobs/new' : '/auth' })}>
              Post a job
            </Button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-foreground/5 border-y border-foreground/5">
          {sorted.map(j => {
            const isClosed = j.status === 'closed';
            const isOwner = user?.id === j.user_id;
            const featuredActive =
              j.is_featured &&
              (!j.featured_until || new Date(j.featured_until).getTime() > Date.now());
            const budget =
              j.budget_min || j.budget_max
                ? `${j.currency} ${j.budget_min ?? '—'}${j.budget_max ? ` – ${j.budget_max}` : ''}`
                : 'Negotiable';
            return (
              <li
                key={j.id}
                className={`py-6 flex flex-col md:flex-row md:items-center gap-4 group hover:bg-foreground/1.5 transition-colors px-2 -mx-2 rounded-xl ${isClosed ? 'opacity-70' : ''} ${featuredActive && tab === 'all' ? 'bg-lime/4' : ''}`}
              >
                <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="lime-pill">{j.discipline}</span>
                    {featuredActive && (
                      <span className="text-[10px] uppercase tracking-widest text-foreground/80 inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Featured
                      </span>
                    )}
                    {isClosed && (
                      <span className="text-[10px] uppercase tracking-widest text-destructive inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Closed
                      </span>
                    )}
                    {isOwner && tab === 'all' && (
                      <span className="text-[10px] uppercase tracking-widest text-foreground/55">
                        Your post
                      </span>
                    )}
                    <span className="text-xs text-foreground/40">{relativeTime(j.created_at)}</span>
                  </div>
                  <h3 className="text-xl font-display tracking-tight group-hover:underline underline-offset-4">
                    {j.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-foreground/60">
                    {j.company && (
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        {j.company}
                      </span>
                    )}
                    {(j.location || j.remote) && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {j.location}
                        {j.remote ? ' · Remote' : ''}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {j.job_type}
                    </span>
                    <span className="font-mono text-xs">{budget}</span>
                    {tab === 'mine' && (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" />
                          {j.views_count ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {myAppCounts[j.id] ?? 0}
                        </span>
                      </>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {isOwner && (
                    <Button variant="ghost" size="sm" asChild title="Edit">
                      <Link to="/jobs/$jobId/edit" params={{ jobId: j.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/jobs/$jobId" params={{ jobId: j.id }}>
                      {isOwner ? 'Manage' : isClosed ? 'View' : 'View & apply'}
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 h-7 rounded-full bg-foreground text-background text-xs">
      {children}
      <button onClick={onClear} aria-label="Remove filter">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm border-b-2 -mb-px transition-colors ${active ? 'border-foreground text-foreground' : 'border-transparent text-foreground/55 hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

const input =
  'w-full h-10 px-3 rounded-lg border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-foreground/55">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function relativeTime(ts: string) {
  const d = (Date.now() - new Date(ts).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function PillOption({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 px-3 rounded-full border text-xs capitalize transition-colors ${
        active
          ? 'bg-foreground text-background border-foreground'
          : 'border-foreground/15 text-foreground/60 hover:border-foreground/40'
      }`}
    >
      {label}
    </button>
  );
}
