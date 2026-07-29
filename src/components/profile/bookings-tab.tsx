import { useBookingMutations } from '@/api/hooks/booking/useBookingMutations';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { useState } from 'react';
import { format } from 'date-fns';
import { useBookings } from '@/api/hooks/booking/useBookings';

export function BookingsTab({ userId }: { userId: string }) {
  const { setStatus, reschedule } = useBookingMutations(userId);
  const { data: bookingsData } = useBookings(userId);
  const bookings = bookingsData?.bookings ?? [];
  const participants = bookingsData?.participants ?? new Map();

  const upcoming = bookings.filter(
    b =>
      new Date(b.scheduled_at) >= new Date() &&
      !['cancelled', 'declined', 'rejected'].includes(b.status),
  );
  const past = bookings.filter(
    b =>
      new Date(b.scheduled_at) < new Date() ||
      ['cancelled', 'declined', 'rejected'].includes(b.status),
  );

  async function handleSetStatus(b: Booking, status: string) {
    try {
      await setStatus.mutateAsync({ id: b.id, status });
      toast.success(`Booking ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update booking');
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Section title="Upcoming">
          {upcoming.length === 0 ? (
            <p className="text-sm text-foreground/55 py-6">No upcoming sessions.</p>
          ) : (
            <ul className="divide-y divide-foreground/5">
              {upcoming.map(b => (
                <BookingRow
                  key={b.id}
                  b={b}
                  userId={userId}
                  who={
                    participants.get(b.client_id === userId ? b.creative_id : b.client_id) ??
                    'Atelier user'
                  }
                  setStatus={handleSetStatus}
                  reschedule={reschedule}
                />
              ))}
            </ul>
          )}
        </Section>
        {past.length > 0 && (
          <Section title="Past & cancelled">
            <ul className="divide-y divide-foreground/5">
              {past.slice(0, 10).map(b => (
                <BookingRow
                  key={b.id}
                  b={b}
                  userId={userId}
                  who={
                    participants.get(b.client_id === userId ? b.creative_id : b.client_id) ??
                    'Atelier user'
                  }
                  setStatus={handleSetStatus}
                  reschedule={reschedule}
                  dim
                />
              ))}
            </ul>
          </Section>
        )}
      </div>
      <div className="rounded-2xl bg-foreground text-background p-6 h-fit">
        <h3 className="font-display text-xl text-background">How bookings work</h3>
        <ul className="mt-4 space-y-3 text-sm text-background/75">
          <li>1. A client books a slot from your public profile.</li>
          <li>2. You confirm, decline, or propose a different time.</li>
          <li>3. Both parties get reminders and can reschedule any time.</li>
        </ul>
      </div>
    </div>
  );
}

function BookingRow({
  b,
  userId,
  who,
  setStatus,
  reschedule,
  dim,
}: {
  b: Booking;
  userId: string;
  who: string;
  setStatus: (b: Booking, s: string) => void;
  reschedule: ReturnType<typeof useBookingMutations>['reschedule'];
  dim?: boolean;
}) {
  const isCreative = b.creative_id === userId;
  const d = new Date(b.scheduled_at);
  const [rescheduling, setRescheduling] = useState(false);
  const [newTime, setNewTime] = useState(d.toISOString().slice(0, 16));

  async function saveReschedule() {
    const next = new Date(newTime);
    if (Number.isNaN(next.getTime())) return toast.error('Pick a valid time');
    try {
      await reschedule.mutateAsync({ id: b.id, scheduledAt: next.toISOString() });
      toast.success('Booking rescheduled');
      setRescheduling(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reschedule');
    }
  }

  return (
    <li className={`py-4 flex items-start gap-4 ${dim ? 'opacity-60' : ''}`}>
      <div className="text-center w-20 shrink-0">
        <div className="text-xs text-foreground/50">{format(d, 'EEE, d MMM')}</div>
        <div className="font-display text-2xl leading-tight">{format(d, 'HH:mm')}</div>
        <div className="text-[10px] uppercase tracking-wider text-foreground/45 mt-1">
          {b.duration_minutes} min
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{b.title}</span>
          <StatusPill status={b.status} />
        </div>
        <div className="text-sm text-foreground/55 mt-0.5">
          {isCreative ? 'with' : 'from'} {who}
        </div>
        {b.notes && <p className="text-sm text-foreground/65 mt-2 line-clamp-2">{b.notes}</p>}
        {rescheduling && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <input
              type="datetime-local"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="h-9 px-3 rounded-lg border border-foreground/15 bg-background text-sm"
            />
            <Button size="sm" onClick={saveReschedule}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        {(b.status === 'requested' || b.status === 'rescheduled') && isCreative && (
          <>
            <Button size="sm" onClick={() => setStatus(b, 'confirmed')}>
              Confirm
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus(b, 'rejected')}>
              Reject
            </Button>
          </>
        )}
        {b.status === 'confirmed' && new Date(b.scheduled_at) >= new Date() && (
          <>
            <Button size="sm" variant="outline" onClick={() => setRescheduling(v => !v)}>
              Reschedule
            </Button>
            <Button size="sm" variant="outline" onClick={() => setStatus(b, 'cancelled')}>
              Cancel
            </Button>
          </>
        )}
        {(b.status === 'cancelled' || b.status === 'rejected' || b.status === 'declined') && (
          <Button size="sm" variant="outline" onClick={() => setStatus(b, 'requested')}>
            Revive
          </Button>
        )}
      </div>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    requested: 'bg-foreground/10 text-foreground/70',
    confirmed: 'bg-primary text-foreground',
    rescheduled: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    declined: 'bg-foreground/5 text-foreground/45',
    rejected: 'bg-destructive/15 text-destructive',
    cancelled: 'bg-foreground/5 text-foreground/45',
    completed: 'bg-foreground/5 text-foreground/55',
  };
  return (
    <span
      className={`inline-flex h-5 px-2 items-center rounded-full text-[10px] uppercase tracking-wider ${cls[status] ?? 'bg-foreground/5'}`}
    >
      {status}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-foreground/10 p-6">
      <h3 className="font-display text-xl mb-2">{title}</h3>
      {children}
    </div>
  );
}
