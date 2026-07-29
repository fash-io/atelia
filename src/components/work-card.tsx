import { Link, useNavigate } from '@tanstack/react-router';
import { Eye } from 'lucide-react';
import { formatCount } from '@/lib/format-count';
import { randomBlobKey } from '@/lib/random-pill';
import { Avatar } from './avatar';
import { Author, DisplayWork } from '@/api/types/work';
import { useToggleBookmark, useToggleLike } from '@/api/hooks/interaction/useInteractionMutations';
import { LikeButton } from './like-button';
import { BookmarkButton } from './bookmark-button';
import { useAuth } from '@/lib/auth';

export function WorkCard({ work }: { work: DisplayWork }) {
  const { mutate: toggleLike } = useToggleLike();
  const { mutate: toggleBookmark } = useToggleBookmark();
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleLike() {
    if (!user) return navigate({ to: '/auth' });
    toggleLike({ id: work.id, wasLiked: !!work.is_liked });
  }

  function handleBookmark() {
    if (!user) return navigate({ to: '/auth' });
    toggleBookmark({ id: work.id, wasBookmarked: !!work.is_bookmarked });
  }

  return (
    <article className="group">
      <Link to="/works/$workId" params={{ workId: work.id }} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-muted aspect-4/3">
          <img
            src={work.cover_url}
            alt={work.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out-soft group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-foreground/70 via-foreground/0 to-foreground/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <span className="text-background text-sm font-medium drop-shadow line-clamp-1">
              {work.title}
            </span>
            <BookmarkButton
              bookmarked={!!work.is_bookmarked}
              onToggle={handleBookmark}
              size="h-4 w-4"
              containerSize="h-9 w-9"
            />
          </div>
          {work.author?.is_pro && (
            <span className={`absolute top-3 left-3 lime-pill ${randomBlobKey()}`}>PRO</span>
          )}
        </div>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Link
          to="/u/$username"
          params={{ username: work.author?.username ?? '' }}
          className="flex items-center gap-2 min-w-0"
        >
          <Avatar p={work.author as Author} />
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              {work.author?.full_name ?? work.author?.username}
            </div>
            <div className="text-xs text-foreground/55 truncate">{work.discipline}</div>
          </div>
        </Link>
        <div className="flex items-center gap-3 text-xs text-foreground/50">
          <LikeButton liked={!!work.is_liked} count={work.likes_count ?? 0} onToggle={handleLike} />
          {work.views_count ? (
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCount(work.views_count)}
            </span>
          ) : (
            ''
          )}
        </div>
      </div>
    </article>
  );
}
