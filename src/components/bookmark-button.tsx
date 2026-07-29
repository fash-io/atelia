import { useState } from 'react';
import { Bookmark } from 'lucide-react';

export function BookmarkButton({
  bookmarked,
  onToggle,
  size = 'h-3.5 w-3.5',
  containerSize = 'h-8 w-8',
  standalone = true,
}: {
  bookmarked: boolean;
  onToggle: () => void;
  size?: string;
  containerSize?: string;
  standalone?: boolean;
}) {
  const [dropping, setDropping] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!bookmarked) {
      setDropping(true);
      window.setTimeout(() => setDropping(false), 500);
    }
    onToggle();
  };

  return (
    <span
      onClick={standalone ? handleClick : undefined}
      role={standalone ? 'button' : undefined}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark'}
      className={
        standalone
          ? `${containerSize} grid place-items-center rounded-full shadow-md transition-colors duration-200 ${bookmarked ? 'bg-accent-foreground hover:bg-accent-foreground/50' : 'bg-background hover:bg-primary'}`
          : 'inline-flex items-center cursor-pointer'
      }
    >
      <span className="inline-flex items-center gap-1 cursor-pointer text-foreground/50 duration-150">
        <span
          className={`relative inline-grid place-items-center ${size} shrink-0 ${
            dropping ? 'animate-bookmark-drop' : ''
          } ${bookmarked ? '' : ''}`}
        >
          <Bookmark
            strokeWidth={2}
            className={`absolute inset-0 ${size} transition-colors duration-200 ${
              bookmarked ? 'text-lime' : 'text-current'
            }`}
          />
          <Bookmark
            strokeWidth={2}
            className={`absolute inset-0 ${size} fill-lime text-lime transition-[clip-path] duration-450 ease-out`}
            style={{
              clipPath: bookmarked ? 'inset(0% 0 0 0)' : 'inset(100% 0 0 0)',
            }}
          />
        </span>
      </span>
    </span>
  );
}
