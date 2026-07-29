import { useServices } from '@/api/hooks/service/useServices';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/routes/u.$username';
import { Clock } from 'lucide-react';

export function ServicesList({
  userId,
  canBook,
  onBook,
}: {
  userId: string;
  canBook: boolean;
  onBook: (s: Service) => void;
}) {
  const { data: services = [] } = useServices(userId);

  if (services.length === 0) {
    return <div className="text-center py-12 text-foreground/55">No public services yet.</div>;
  }
  return (
    <ul className="space-y-3 max-w-3xl">
      {services.map(s => (
        <li
          key={s.id}
          className="rounded-2xl border border-foreground/10 p-5 flex items-start justify-between gap-6"
        >
          <div>
            <h4 className="font-display text-xl">{s.title}</h4>
            {s.description && <p className="mt-1 text-sm text-foreground/65">{s.description}</p>}
            {s.delivery_days && (
              <p className="mt-2 text-xs text-foreground/50 inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> {s.delivery_days} day
                {s.delivery_days === 1 ? '' : 's'} delivery
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-sm">{formatPrice(s)}</div>
            {canBook && (
              <Button size="sm" variant="outline" className="mt-2" onClick={() => onBook(s)}>
                Book
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
