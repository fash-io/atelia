import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Pencil, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LikeSaveBar } from '@/components/like-save-buttons';
import { CollaboratorsList } from '@/components/collaborators-editor';
import { useProjectMutations } from '@/api/hooks/project/useProjectMutations';
import { useProject } from '@/api/hooks/project/useProject';

export const Route = createFileRoute('/projects/$projectId/')({
  component: ProjectDetail,
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Case study not found</h1>
      <Link to="/explore" className="mt-6 inline-block underline">
        Back to explore
      </Link>
    </div>
  ),
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { user } = useAuth();

  const { incrementView } = useProjectMutations();
  const { data } = useProject(projectId);

  const viewedRef = useRef(false);

  useEffect(() => {
    if (!data || viewedRef.current) return;
    const { project } = data;

    if (user && user.id === project.user_id) return;
    const key = `viewed_project_${project.id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return;
    viewedRef.current = true;
    if (typeof window !== 'undefined') sessionStorage.setItem(key, '1');

    incrementView.mutate(project.id);
  }, [data, user]);

  if (!data) return null;

  const { project, author } = data;

  return (
    <article className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      <p className="eyebrow">{project.discipline ?? 'Case study'}</p>
      <h1 className="display-xl mt-3">{project.title}</h1>

      <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
        {author && (
          <Link
            to="/u/$username"
            params={{ username: author.username ?? '' }}
            className="flex items-center gap-3 group"
          >
            <div className="h-12 w-12 rounded-full overflow-hidden bg-foreground text-background grid place-items-center font-display shrink-0">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (author.full_name ?? 'A').charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium group-hover:underline">
                  {author.full_name ?? author.username}
                </span>
                {author.is_pro && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-foreground/60">
                    <Sparkles className="h-3 w-3" />
                    Pro
                  </span>
                )}
              </div>
              {author.location && (
                <div className="text-foreground/55 text-xs inline-flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {author.location}
                </div>
              )}
            </div>
          </Link>
        )}
        <div className="flex items-center gap-3">
          <LikeSaveBar
            targetType="project"
            targetId={project.id}
            likes={project.likes_count}
            views={project.views_count}
            bookmarked={project.is_bookmarked}
            liked={project.is_liked}
          />
          {user?.id === project.user_id && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/projects/$projectId/edit" params={{ projectId: project.id }}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl overflow-hidden">
        <img src={project.cover_url} alt={project.title} className="w-full" />
      </div>

      {project.subtitle && (
        <p className="mt-10 text-lg text-foreground/85 leading-relaxed">{project.subtitle}</p>
      )}

      <CollaboratorsList targetType="project" targetId={project.id} />

      {author && (
        <Link
          to="/u/$username"
          params={{ username: author.username ?? '' }}
          className="mt-10 flex items-center gap-4 rounded-2xl border border-foreground/10 p-4 hover:border-foreground/30 transition-colors"
        >
          <div className="h-12 w-12 rounded-full overflow-hidden bg-foreground text-background grid place-items-center font-display shrink-0">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (author.full_name ?? 'A').charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium">{author.full_name ?? author.username}</div>
            {(author.headline || author.bio) && (
              <div className="text-sm text-foreground/60 truncate">
                {author.headline ?? author.bio}
              </div>
            )}
          </div>
        </Link>
      )}

      <dl className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 pb-8 border-b border-foreground/10">
        {[
          ['Discipline', project.discipline],
          ['Client', project.client],
          ['Location', project.location],
          ['Year', project.year],
        ]
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k as string}>
              <dt className="eyebrow">{k}</dt>
              <dd className="mt-2 text-sm">{v}</dd>
            </div>
          ))}
      </dl>

      <div className="mt-12 space-y-12">
        {project.sections?.map((s, i) =>
          s.type === 'text' ? (
            <section key={i}>
              {s.heading && <h2 className="font-display text-3xl mb-4">{s.heading}</h2>}
              <p className="text-lg text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {s.body}
              </p>
            </section>
          ) : (
            <figure key={i}>
              <img src={s.url} alt={s.caption} className="w-full rounded-2xl" />
              {s.caption && (
                <figcaption className="mt-3 text-sm text-foreground/55">{s.caption}</figcaption>
              )}
            </figure>
          ),
        )}
      </div>

      {project.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-foreground/10 flex flex-wrap gap-2">
          {project.tags.map(t => (
            <span
              key={t}
              className="px-3 h-8 inline-flex items-center rounded-full bg-foreground/5 text-sm"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {author && (
        <div className="mt-12 rounded-3xl bg-foreground text-background p-6 sm:p-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-60">Featured creative</p>
            <h3 className="font-display text-2xl mt-1">
              Work with {(author.full_name ?? author.username ?? 'this creative').split(' ')[0]}
            </h3>
            <p className="text-sm opacity-70 mt-1">
              Send a brief, request a quote, or schedule a consultation.
            </p>
          </div>
          <Button
            asChild
            className="bg-primary text-primary-foreground hover:brightness-105 rounded-full px-6"
          >
            <Link to="/u/$username" params={{ username: author.username ?? '' }}>
              Get in touch
            </Link>
          </Button>
        </div>
      )}
    </article>
  );
}
