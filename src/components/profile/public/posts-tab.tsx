import { Link } from '@tanstack/react-router';
import { useUserProjects } from '@/api/hooks/user/useUserProjects';

export function PostsTab({ userId }: { userId: string }) {
  const { data: projects = [] } = useUserProjects(userId);

  if (projects.length === 0) {
    return <div className="text-center py-16 text-foreground/55">No case studies yet.</div>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {projects.map(p => (
        <Link
          to="/projects/$projectId"
          params={{ projectId: p.id }}
          key={p.id}
          className="group rounded-2xl overflow-hidden border border-foreground/10 hover:border-foreground/30 transition-colors"
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
            {p.subtitle && (
              <div className="text-sm text-foreground/60 mt-1 line-clamp-2">{p.subtitle}</div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
