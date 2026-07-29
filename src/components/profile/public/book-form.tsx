import { useState } from 'react';
import { toast } from 'sonner';
import { Field } from '../field';
import { Button } from '@/components/ui/button';
import { useServices } from '@/api/hooks/service/useServices';
import { useBookingMutations } from '@/api/hooks/booking/useBookingMutations';

export function BookForm({
  isOwn,
  creativeId,
  onDone,
  userId,
}: {
  userId: string | null;
  isOwn: boolean;
  creativeId: string;
  onDone: () => void;
}) {
  if (isOwn) {
    return (
      <div className="text-center py-12 text-foreground/55">
        Bookings from clients appear in your profile's Bookings tab.
      </div>
    );
  }

  const { data: services = [] } = useServices(creativeId);

  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { book } = useBookingMutations();

  async function submit() {
    if (!userId || !date || !time || !title.trim()) return;
    const scheduled = new Date(`${date}T${time}:00`);
    if (isNaN(scheduled.getTime()) || scheduled < new Date())
      return toast.error('Pick a future date and time');
    setSaving(true);
    const b = {
      creative_id: creativeId,
      service_id: serviceId || null,
      title: title.trim(),
      notes: notes.trim() || null,
      scheduled_at: scheduled.toISOString(),
      duration_minutes: duration,
      status: 'pending',
    };
    try {
      await book.mutateAsync(b);
      toast.success('Booking request sent');
      setSaving(false);
      onDone();
    } catch (error) {
      setSaving(false);
      return toast.error('something went wrong');
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="eyebrow">Request a session</p>
      <h3 className="display-md mt-2">Schedule with this creative</h3>
      <p className="mt-2 text-foreground/65 text-sm">
        Pick a service, date and time. They'll confirm or propose a different slot.
      </p>

      <form
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
        className="mt-8 space-y-4"
      >
        {services.length > 0 && (
          <Field label="Service">
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
            >
              <option value="">— No specific service —</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="What's it about?">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={140}
            placeholder="e.g. Site walkthrough — Casa Lumen"
            className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 10)}
              className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
            />
          </Field>
          <Field label="Time">
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
            />
          </Field>
          <Field label="Duration">
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
            >
              {[30, 45, 60, 90, 120].map(m => (
                <option key={m} value={m}>
                  {m} min
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            maxLength={600}
            className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background"
            placeholder="Anything they should know in advance…"
          />
        </Field>
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? 'Sending request…' : 'Request booking'}
        </Button>
      </form>
    </div>
  );
}
