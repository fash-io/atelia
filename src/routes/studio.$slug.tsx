import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Briefcase, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudio } from '@/api/hooks/studio/useStudio';
import { queryClient } from '@/lib/query-client';
import { studioService } from '@/api/services/studio.service';

export const Route = createFileRoute('/studio/$slug')({
  head: ({ params }) => ({ meta: [{ title: `${params.slug} studio — Atelier` }] }),
  component: StudioProfile,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="display-lg">Couldn't load studio</h1>
        <p className="mt-2 text-foreground/60">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 underline"
        >
          Try again
        </button>
      </div>
    );
  },
  loader: ({ params }) =>
    queryClient.ensureQueryData({
      queryKey: ['public-studio', params.slug],
      queryFn: () => studioService.getPublicStudioProfile(params.slug),
    }),
});

function StudioProfile() {
  const { slug } = Route.useParams();
  const [tab, setTab] = useState<'Work' | 'Case studies' | 'People'>('Work');

  const { data } = useStudio(slug);
  if (!data) return null;

  const { members = [], projects = [], studio = null, works = [] } = data!;
  if (!studio) return null;

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <Link
        to="/search"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Find creatives
      </Link>
      <header className="pb-10 border-b border-foreground/10">
        {studio.cover_url && (
          <img
            src={studio.cover_url}
            alt=""
            className="mb-8 h-64 w-full object-cover rounded-2xl"
          />
        )}
        <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10">
          <div className="h-28 w-28 rounded-2xl bg-foreground text-background grid place-items-center font-display text-4xl overflow-hidden shrink-0">
            {studio.avatar_url ? (
              <img src={studio.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              studio.name.charAt(0)
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="lime-pill">Studio</span>
              <span className="text-xs text-foreground/55 inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {members.length} collaborators
              </span>
            </div>
            <h1 className="display-lg">{studio.name}</h1>
            {studio.bio && <p className="mt-3 max-w-2xl text-foreground/70">{studio.bio}</p>}
            {studio.custom_domain && (
              <a
                href={`https://${studio.custom_domain}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                {studio.custom_domain}
              </a>
            )}
          </div>
          <Button asChild variant="outline">
            <Link to="/jobs">
              <Briefcase className="h-4 w-4" /> Jobs
            </Link>
          </Button>
        </div>
      </header>

      <div className="mt-8 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-foreground/10">
        {(['Work', 'Case studies', 'People'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative shrink-0 px-5 py-4 text-sm ${tab === t ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground'}`}
          >
            {t}
            {tab === t && (
              <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <div className="py-10">
        {tab === 'Work' &&
          (works.length ? (
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {works.map(w => (
                <Link key={w.id} to="/works/$workId" params={{ workId: w.id }} className="group">
                  <div className="aspect-4/3 rounded-2xl overflow-hidden bg-muted">
                    <img
                      src={w.cover_url}
                      alt={w.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="mt-3 font-medium">{w.title}</div>
                  {w.discipline && <div className="text-xs text-foreground/55">{w.discipline}</div>}
                </Link>
              ))}
            </div>
          ) : (
            <Empty>No shared work yet.</Empty>
          ))}
        {tab === 'Case studies' &&
          (projects.length ? (
            <div className="grid gap-6 sm:grid-cols-2">
              {projects.map(p => (
                <Link
                  key={p.id}
                  to="/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="group rounded-2xl overflow-hidden border border-foreground/10"
                >
                  <div className="aspect-video overflow-hidden bg-muted">
                    <img
                      src={p.cover_url}
                      alt={p.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="font-display text-xl">{p.title}</div>
                    {p.subtitle && <p className="text-sm text-foreground/60 mt-1">{p.subtitle}</p>}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty>No shared case studies yet.</Empty>
          ))}
        {tab === 'People' && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map(m =>
              m.profile?.username ? (
                <Link
                  key={m.id}
                  to="/u/$username"
                  params={{ username: m.profile.username }}
                  className="rounded-2xl border border-foreground/10 p-4 flex items-center gap-4 hover:border-foreground/30"
                >
                  <Avatar p={m.profile} />
                  <div>
                    <div className="font-medium">{m.profile.full_name ?? m.profile.username}</div>
                    <div className="text-xs text-foreground/55">
                      {m.role}
                      {m.profile.discipline ? ` · ${m.profile.discipline}` : ''}
                    </div>
                  </div>
                </Link>
              ) : null,
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Avatar({ p }: { p: Profile }) {
  return (
    <div className="h-12 w-12 rounded-full overflow-hidden bg-foreground text-background grid place-items-center font-display shrink-0">
      {p.avatar_url ? (
        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        (p.full_name ?? p.username ?? 'A').charAt(0)
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-foreground/15 p-10 text-center text-foreground/55">
      {children}
    </div>
  );
}
