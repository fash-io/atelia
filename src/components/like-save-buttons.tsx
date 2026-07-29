import { Eye } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { useToggleLike, useToggleBookmark } from '@/api/hooks/interaction/useInteractionMutations';
import { LikeButton } from './like-button';
import { BookmarkButton } from './bookmark-button';

type Props = {
  targetType: 'work' | 'project';
  targetId: string;
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  views: number;
};

export function LikeSaveBar({ targetType, targetId, likes, liked, bookmarked, views }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { mutate: toggleLike } = useToggleLike(targetType);
  const { mutate: toggleBookmark } = useToggleBookmark(targetType);

  function handleLike() {
    if (!user) return navigate({ to: '/auth' });
    toggleLike({ id: targetId, wasLiked: liked });
  }

  function handleSave() {
    if (!user) return navigate({ to: '/auth' });
    toggleBookmark(
      { id: targetId, wasBookmarked: bookmarked },
      {
        onSuccess: () => toast.success(bookmarked ? 'Removed from bookmarked' : 'Bookmarked'),
      },
    );
  }

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleLike}
        className="inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-foreground transition-colors"
      >
        <LikeButton
          liked={liked}
          count={likes}
          onToggle={handleLike}
          size="h-4 w-4"
          textSize="text-sm"
        />
      </button>

      <span className="inline-flex items-center gap-1.5 text-sm text-foreground/60">
        <Eye className="h-4 w-4" />
        <span>{views.toLocaleString()}</span>
      </span>

      <button
        onClick={handleSave}
        className={`inline-flex items-center gap-1.5 h-8 px-4 rounded-full border text-sm transition-colors cursor-pointer ${
          bookmarked
            ? 'bg-foreground text-background border-foreground'
            : 'border-foreground/20 hover:border-foreground/40'
        }`}
      >
        <BookmarkButton
          bookmarked={bookmarked}
          onToggle={handleSave}
          size="h-4 w-4"
          standalone={false}
        />
        {bookmarked ? 'Saved' : 'Save'}
      </button>
    </div>
  );
}
