import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useFavorites } from '@/api/hooks/favorite/useFavorites';
import { useToggleBookmark } from '@/api/hooks/interaction/useInteractionMutations';

export const Route = createFileRoute('/favorites')({
  head: () => ({ meta: [{ title: 'Saved work — Atelier' }] }),
  component: FavoritesPage,
});

const FILTERS = [
  { v: 'all', label: 'All' },
  { v: 'work', label: 'Works' },
  { v: 'project', label: 'Case studies' },
] as const;

function FavoritesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: items = [], isLoading } = useFavorites(user?.id);
  const removeFavoriteWork = useToggleBookmark('work');
  const removeFavoriteProject = useToggleBookmark('project');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['v']>('all');

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  if (loading || !user) return null;

  const filtered = filter === 'all' ? items : items.filter(it => it.type === filter);

  function handleRemove(type: 'work' | 'project', id: string) {
    const mutation = type === 'work' ? removeFavoriteWork : removeFavoriteProject;
    mutation.mutate({ id, wasBookmarked: true });
  }

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="eyebrow">Saved</p>
          <h1 className="display-lg mt-2">Your saved work</h1>
        </div>
        {items.length > 0 && <p className="text-sm text-foreground/50">{items.length} saved</p>}
      </div>

      {items.length > 0 && (
        <div className="mt-6 flex gap-1.5">
          {FILTERS.map(f => (
            <button
              key={f.v}
              onClick={() => setFilter(f.v)}
              className={`h-8 px-3.5 rounded-full text-xs border transition-colors ${
                filter === f.v
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-foreground/15 text-foreground/60 hover:border-foreground/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-4/3 rounded-2xl bg-muted" />
              <div className="mt-3 h-3 w-16 rounded bg-muted" />
              <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-foreground/15 p-12 text-center">
          <Bookmark className="h-8 w-8 mx-auto text-foreground/40" />
          <h3 className="font-display text-2xl mt-4">Nothing saved yet</h3>
          <p className="mt-2 text-foreground/60 text-sm">
            Tap the bookmark icon on any work or case study to keep it here.
          </p>
          <Link to="/explore" className="mt-6 inline-block underline">
            Browse the gallery
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-12 text-center text-foreground/50 text-sm">
          Nothing saved in this category yet.
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map(it => {
            const key = `${it.type}-${it.id}`;
            return (
              <li key={key}>
                <div className="group relative">
                  <Link
                    to={it.type === 'work' ? '/works/$workId' : '/projects/$projectId'}
                    params={it.type === 'work' ? { workId: it.id } : { projectId: it.id }}
                    className="block"
                  >
                    <div className="aspect-4/3 rounded-2xl overflow-hidden bg-muted">
                      <img
                        src={it.cover}
                        alt={it.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-widest text-foreground/50">
                        {it.discipline ?? (it.type === 'project' ? 'Case study' : 'Work')}
                      </p>
                      <h3 className="font-display text-lg mt-1 truncate">{it.title}</h3>
                    </div>
                  </Link>

                  <button
                    onClick={() => handleRemove(it.type, it.id)}
                    aria-label="Remove from saved"
                    title="Remove from saved"
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background/95 shadow grid place-items-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-destructive/10"
                  >
                    <Bookmark className="h-4 w-4 fill-lime text-lime" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
