import { useState } from 'react';
import { Heart } from 'lucide-react';
import { formatCount } from '@/lib/format-count';

export function LikeButton({
  liked,
  count,
  onToggle,
  size = 'h-3.5 w-3.5',
  textSize = 'text-xs',
  standalone = true,
}: {
  liked: boolean;
  count: number;
  onToggle: () => void;
  size?: string;
  textSize?: string;
  standalone?: boolean;
}) {
  const [popping, setPopping] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (standalone) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!liked) {
      setPopping(true);
      window.setTimeout(() => setPopping(false), 550);
    }
    onToggle();
  };

  return (
    <span
      onClick={standalone ? handleClick : undefined}
      role={standalone ? 'button' : undefined}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`inline-flex items-center gap-1 ${standalone ? 'cursor-pointer' : ''} text-current hover:text-red-400 duration-150`}
    >
      <span
        className={`relative inline-grid place-items-center ${size} shrink-0 ${popping ? 'animate-heart-pop' : ''}`}
      >
        <Heart
          strokeWidth={2}
          className={`absolute inset-0 ${size} transition-colors duration-200 ${liked ? 'text-red-500' : 'text-current'}`}
        />
        <Heart
          strokeWidth={2}
          className={`absolute inset-0 ${size} fill-red-500 text-red-500 transition-[clip-path] duration-500 ease-out`}
          style={{ clipPath: liked ? 'circle(75% at 50% 50%)' : 'circle(0% at 50% 50%)' }}
        />
      </span>
      <span className={`${textSize} ${liked ? 'text-red-500' : ''}`}>{formatCount(count)}</span>
    </span>
  );
}
