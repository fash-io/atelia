import { Link } from '@tanstack/react-router';
import { Button } from '../ui/button';
import { Pencil, Plus } from 'lucide-react';
import { useMyProjects } from '@/api/hooks/project/useMyProjects';

export function PostsTab({ userId }: { userId: string }) {
  const { data: projects = [] } = useMyProjects(userId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="eyebrow">Project case studies</p>
        <Button size="sm" asChild>
          <Link to="/projects/new">
            <Plus className="h-4 w-4" /> New case study
          </Link>
        </Button>
      </div>
      {projects.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-dashed border-foreground/15 p-10 text-center">
          <h3 className="font-display text-2xl">Tell the story behind a project</h3>
          <p className="mt-2 text-foreground/60 text-sm max-w-md mx-auto">
            Use our case-study template — Brief, Concept, Materials, Outcome — to publish in-depth
            posts that win clients.
          </p>
          <Button asChild className="mt-6">
            <Link to="/projects/new">Start a case study</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map(p => (
            <div
              key={p.id}
              className="group relative rounded-2xl overflow-hidden border border-foreground/10 hover:border-foreground/30 transition-colors"
            >
              <Link to="/projects/$projectId" params={{ projectId: p.id }}>
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={p.cover_url}
                    alt={p.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5">
                  <div className="font-display text-xl">{p.title}</div>
                  {p.subtitle && (
                    <div className="text-sm text-foreground/60 mt-1 line-clamp-2">{p.subtitle}</div>
                  )}
                </div>
              </Link>
              <Link
                to="/projects/$projectId/edit"
                params={{ projectId: p.id }}
                className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-background/95 shadow text-xs font-medium hover:bg-background"
                aria-label="Edit case study"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
