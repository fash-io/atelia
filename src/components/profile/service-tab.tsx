import { useServiceMutations } from '@/api/hooks/service/useServiceMutations';
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { formatPrice } from '@/routes/u.$username';
import { Field } from './field';
import { useMyServices } from '@/api/hooks/service/useMyServices';

export function ServicesTab({ userId }: { userId: string }) {
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const { toggle, remove, swap } = useServiceMutations(userId);

  const { data: services = [] } = useMyServices(userId);

  async function move(s: Service, dir: -1 | 1) {
    const idx = services.findIndex(x => x.id === s.id);
    const other = services[idx + dir];
    if (!other) return;
    try {
      await swap.mutateAsync({ a: s, b: other });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not reorder');
    }
  }
  async function handleToggle(s: Service) {
    try {
      await toggle.mutateAsync({ id: s.id, isVisible: !s.is_visible });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update visibility');
    }
  }
  async function handleRemove(s: Service) {
    if (!confirm(`Delete "${s.title}"?`)) return;
    try {
      await remove.mutateAsync(s.id);
      toast.success('Service removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete service');
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <p className="eyebrow">What you offer</p>
        <Button size="sm" onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-foreground/15 p-10 text-center">
          <h3 className="font-display text-2xl">List a service</h3>
          <p className="mt-2 text-foreground/60 text-sm max-w-md mx-auto">
            Set the offer, the price and the delivery window. Clients can book straight from your
            profile.
          </p>
          <Button className="mt-6" onClick={() => setEditing('new')}>
            Add your first service
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {services.map((s, i) => (
            <li
              key={s.id}
              className={`rounded-2xl border p-5 flex items-start justify-between gap-6 ${s.is_visible ? 'border-foreground/10' : 'border-dashed border-foreground/15 opacity-70'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-display text-xl">{s.title}</h4>
                  {!s.is_visible && (
                    <span className="text-[10px] uppercase tracking-wider text-foreground/45">
                      Hidden
                    </span>
                  )}
                </div>
                {s.description && (
                  <p className="mt-1 text-sm text-foreground/65">{s.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-foreground/55">
                  <span className="font-mono">{formatPrice(s)}</span>
                  {s.delivery_days && (
                    <span>
                      · {s.delivery_days} day{s.delivery_days === 1 ? '' : 's'} delivery
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => move(s, -1)}
                  disabled={i === 0}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => move(s, 1)}
                  disabled={i === services.length - 1}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggle(s)}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-foreground/5"
                  aria-label={s.is_visible ? 'Hide' : 'Show'}
                >
                  {s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditing(s)}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-foreground/5"
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleRemove(s)}
                  className="h-8 w-8 grid place-items-center rounded-full hover:bg-foreground/5 text-foreground/55 hover:text-foreground"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <ServiceModal
          userId={userId}
          service={editing === 'new' ? null : editing}
          nextOrder={services.length}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

const PRICE_UNITS = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hour', label: 'Per hour' },
  { value: 'day', label: 'Per day' },
  { value: 'project', label: 'Per project' },
];

function ServiceModal({
  userId,
  service,
  nextOrder,
  onClose,
}: {
  userId: string;
  service: Service | null;
  nextOrder: number;
  onClose: () => void;
}) {
  const { create, update } = useServiceMutations(userId);
  const [form, setForm] = useState({
    title: service?.title ?? '',
    description: service?.description ?? '',
    price_amount: service?.price_amount?.toString() ?? '',
    currency: service?.currency ?? 'USD',
    price_unit: service?.price_unit ?? 'fixed',
    delivery_days: service?.delivery_days?.toString() ?? '',
    is_visible: service?.is_visible ?? true,
  });

  const saving = create.isPending || update.isPending;

  async function save() {
    if (!form.title.trim()) return toast.error('Title is required');
    const payload = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      price_amount: form.price_amount ? Number(form.price_amount) : null,
      currency: form.currency,
      price_unit: form.price_unit,
      delivery_days: form.delivery_days ? Number(form.delivery_days) : null,
      is_visible: form.is_visible,
      sort_order: service?.sort_order ?? nextOrder,
    };
    try {
      if (service) {
        await update.mutateAsync({ id: service.id, payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast.success(service ? 'Service updated' : 'Service added');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save service');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl max-w-xl w-full p-8 shadow-(--shadow-lift) my-8"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-3xl">{service ? 'Edit service' : 'New service'}</h2>
        <p className="text-sm text-foreground/55 mt-1">
          Tell clients what they're booking, what it costs, and how long it takes.
        </p>

        <div className="mt-6 space-y-4">
          <Field label="Title">
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              maxLength={120}
              className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
              placeholder="e.g. Architectural concept design"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background"
              placeholder="What's included in this service…"
            />
          </Field>
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Price">
              <input
                type="number"
                min={0}
                value={form.price_amount}
                onChange={e => setForm({ ...form, price_amount: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
                placeholder="Leave blank for 'on request'"
              />
            </Field>
            <Field label="Currency">
              <select
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
              >
                {['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'JPY'].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit">
              <select
                value={form.price_unit}
                onChange={e => setForm({ ...form, price_unit: e.target.value })}
                className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
              >
                {PRICE_UNITS.map(u => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Typical delivery (days, optional)">
            <input
              type="number"
              min={0}
              value={form.delivery_days}
              onChange={e => setForm({ ...form, delivery_days: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
              placeholder="e.g. 14"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_visible}
              onChange={e => setForm({ ...form, is_visible: e.target.checked })}
            />
            Visible on my public profile
          </label>
        </div>

        <div className="mt-8 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : service ? 'Save changes' : 'Add service'}
          </Button>
        </div>
      </div>
    </div>
  );
}
