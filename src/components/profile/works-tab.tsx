import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { Pencil, Plus } from 'lucide-react';
import { useMyWorks } from '@/api/hooks/work/useMyWorks';

export function WorksTab({ userId, bio }: { userId: string; bio: string | null }) {
  const { data: works = [] } = useMyWorks(userId);

  return (
    <>
      {bio && <p className="max-w-2xl text-foreground/75 leading-relaxed mb-8">{bio}</p>}
      <div className="flex items-center justify-between mb-6">
        <p className="eyebrow">Portfolio</p>
        <Button size="sm" asChild>
          <Link to="/works/new">
            <Plus className="h-4 w-4" /> Add work
          </Link>
        </Button>
      </div>
      {works.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 p-10 text-center">
          <h3 className="font-display text-2xl">Publish your first piece</h3>
          <p className="mt-2 text-foreground/60 text-sm max-w-md mx-auto">
            Upload a cover, add a gallery, tag it — and it goes live for clients to discover.
          </p>
          <Button asChild className="mt-6">
            <Link to="/works/new">Add a work</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {works.map(w => (
            <div key={w.id} className="group relative">
              <Link to="/works/$workId" params={{ workId: w.id }}>
                <div className="overflow-hidden rounded-2xl bg-muted aspect-4/3">
                  <img
                    src={w.cover_url}
                    alt={w.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <div className="mt-3">
                  <div className="font-medium truncate">{w.title}</div>
                  {w.discipline && <div className="text-xs text-foreground/55">{w.discipline}</div>}
                </div>
              </Link>
              <Link
                to="/works/$workId/edit"
                params={{ workId: w.id }}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-background/95 shadow text-xs font-medium hover:bg-background"
                aria-label="Edit work"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
