import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, MapPin, Pencil, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LikeSaveBar } from '@/components/like-save-buttons';
import { CollaboratorsList } from '@/components/collaborators-editor';
import { useWorkMutations } from '@/api/hooks/work/useWorkMutations';
import { useWork } from '@/api/hooks/work/useWork';
import { Avatar } from '@/components/avatar';

export const Route = createFileRoute('/works/$workId/')({
  component: WorkDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-5 py-20 text-center">
      <h1 className="display-lg">Work not found</h1>
      <Link to="/explore" className="mt-6 inline-block underline">
        Back to explore
      </Link>
    </div>
  ),
});

function WorkDetail() {
  const { workId } = Route.useParams();
  const { user } = useAuth();
  const { incrementView } = useWorkMutations();
  const { data } = useWork(workId);

  const [isMounted, setIsMounted] = useState(false);
  const viewedRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!data) return;
    const { work } = data;

    if (viewedRef.current) return;
    if (user && user.id === work.user_id) return;
    const key = `viewed_work_${work.id}`;
    if (typeof window !== 'undefined' && sessionStorage.getItem(key)) return;
    viewedRef.current = true;
    if (typeof window !== 'undefined') sessionStorage.setItem(key, '1');

    incrementView.mutate(work.id);
  }, [data, user]);

  if (!data) return null;

  const { work, author } = data;

  return (
    <article className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/explore"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to explore
      </Link>

      {work.discipline && <p className="eyebrow">{work.discipline}</p>}
      <h1 className="display-lg mt-2">{work.title}</h1>

      <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
        {author && (
          <Link
            to="/u/$username"
            params={{ username: author.username ?? '' }}
            className="flex items-center gap-3 group"
          >
            <Avatar p={author} size={'h-12 w-12'} />
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
            targetType="work"
            targetId={work.id}
            likes={work.likes_count}
            views={work.views_count}
            liked={work.is_liked}
            bookmarked={work.is_bookmarked}
          />
          {isMounted && user?.id === work.user_id && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/works/$workId/edit" params={{ workId: work.id }}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-10 rounded-2xl overflow-hidden">
        <img src={work.cover_url} alt={work.title} className="w-full" />
      </div>

      {work.description && (
        <p className="mt-10 text-lg text-foreground/85 leading-relaxed">{work.description}</p>
      )}

      <CollaboratorsList targetType="work" targetId={work.id} />

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

      <div className="mt-10 space-y-8">
        {work.gallery.map((g, i) => (
          <figure key={i}>
            <img src={g.url} alt={g.caption!} className="w-full rounded-2xl" />
            {g.caption && (
              <figcaption className="mt-3 text-sm text-foreground/55">{g.caption}</figcaption>
            )}
          </figure>
        ))}
      </div>

      {work.tags.length > 0 && (
        <div className="mt-12 pt-8 border-t border-foreground/10 flex flex-wrap gap-2">
          {work.tags.map((t: string) => (
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
