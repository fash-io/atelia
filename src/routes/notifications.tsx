import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

export const Route = createFileRoute('/notifications')({
  head: () => ({
    meta: [
      { title: 'Notifications — Atelier' },
      {
        name: 'description',
        content: 'Your latest job, message, booking, and application updates on Atelier.',
      },
    ],
  }),
  component: NotificationsPage,
});

type N = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'application', label: 'Applications', match: (k: string) => k.startsWith('application') },
  { id: 'message', label: 'Messages', match: (k: string) => k === 'message' },
  { id: 'booking', label: 'Bookings', match: (k: string) => k === 'booking' },
  { id: 'job', label: 'Jobs', match: (k: string) => k === 'job' },
] as const;

function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<N[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      setItems((data as N[]) ?? []);
    })();
  }, [user]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.filter(n => !n.read_at).length };
    for (const f of FILTERS) {
      if (f.id === 'all') continue;
      c[f.id] = items.filter(n => !n.read_at && (f as any).match(n.kind)).length;
    }
    return c;
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    const f = FILTERS.find(x => x.id === filter);
    if (!f || f.id === 'all') return items;
    return items.filter(n => (f as any).match(n.kind));
  }, [items, filter]);

  async function markAllRead() {
    if (!user) return;
    setItems(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
  }

  async function markOne(id: string) {
    setItems(prev =>
      prev.map(n => (n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n)),
    );
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  }

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 lg:px-10 py-12">
      <div className="flex items-end justify-between border-b border-foreground/10 pb-6">
        <div>
          <p className="eyebrow">Activity</p>
          <h1 className="display-lg mt-2">Notifications</h1>
        </div>
        <button onClick={markAllRead} className="text-sm text-foreground/60 hover:text-foreground">
          Mark all read
        </button>
      </div>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-foreground/10">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`relative shrink-0 px-4 py-3 text-sm inline-flex items-center gap-2 ${filter === f.id ? 'text-foreground font-medium' : 'text-foreground/55 hover:text-foreground'}`}
          >
            {f.label}
            {counts[f.id] > 0 && (
              <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-foreground text-[10px] font-medium">
                {counts[f.id]}
              </span>
            )}
            {filter === f.id && (
              <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-foreground/50">Nothing here yet.</p>
      ) : (
        <ul className="mt-2 divide-y divide-foreground/5">
          {filtered.map(n => {
            const inner = (
              <div
                className={`py-5 flex gap-4 ${n.read_at ? '' : 'bg-primary/5 -mx-4 px-4 rounded-xl'}`}
              >
                <span
                  className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                  style={{ background: n.read_at ? 'transparent' : 'var(--color-primary)' }}
                />
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-widest text-foreground/45">
                    {n.kind.replace(/_/g, ' ')}
                  </div>
                  <div className="font-medium mt-0.5">{n.title}</div>
                  {n.body && <div className="text-sm text-foreground/65 mt-1">{n.body}</div>}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-foreground/45">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </div>
                    {!n.read_at && (
                      <button
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          markOne(n.id);
                        }}
                        className="text-xs text-foreground/55 hover:text-foreground"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? (
                  <Link to={n.link as any} onClick={() => !n.read_at && markOne(n.id)}>
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
