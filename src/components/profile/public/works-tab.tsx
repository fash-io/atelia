import { Link } from '@tanstack/react-router';
import { useUserWorks } from '@/api/hooks/user/useUserWorks';

export function WorksTab({ userId }: { userId: string }) {
  const { data: works = [] } = useUserWorks(userId);
  if (works.length === 0) {
    return <div className="text-center py-16 text-foreground/55">No published works yet.</div>;
  }

  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {works.map(w => (
        <Link to="/works/$workId" params={{ workId: w.id }} key={w.id} className="group">
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
      ))}
    </div>
  );
}
