import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

type N = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<N[]>([]);
  const unread = items.filter(n => !n.read_at).length;

  useEffect(() => {
    if (!user) return;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setItems((data as N[]) ?? []);
    })();
    channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        payload => setItems(prev => [payload.new as N, ...prev].slice(0, 20)),
      )
      .subscribe();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  async function markAllRead() {
    if (!user || unread === 0) return;
    const ids = items.filter(n => !n.read_at).map(n => n.id);
    setItems(prev => prev.map(n => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .in('id', ids);
  }

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative h-10 w-10 grid place-items-center rounded-full hover:bg-foreground/5"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] grid place-items-center font-medium text-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-90 max-h-[80vh] overflow-y-auto rounded-2xl border border-foreground/10 bg-background shadow-(--shadow-lift) z-50">
            <div className="flex items-center justify-between p-4 border-b border-foreground/5">
              <span className="font-display text-lg">Notifications</span>
              <button
                onClick={markAllRead}
                className="text-xs text-foreground/55 hover:text-foreground"
              >
                Mark all read
              </button>
            </div>
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-foreground/55">
                You're all caught up.
              </div>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {items.map(n => {
                  const inner = (
                    <div
                      className={`p-4 flex gap-3 hover:bg-foreground/2 ${n.read_at ? '' : 'bg-primary/6'}`}
                    >
                      <span
                        className="mt-1 h-2 w-2 rounded-full shrink-0"
                        style={{ background: n.read_at ? 'transparent' : 'var(--color-primary)' }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{n.title}</div>
                        {n.body && (
                          <div className="text-xs text-foreground/60 line-clamp-2 mt-0.5">
                            {n.body}
                          </div>
                        )}
                        <div className="text-[10px] uppercase tracking-wider text-foreground/40 mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id} onClick={() => setOpen(false)}>
                      {n.link ? <a href={n.link}>{inner}</a> : inner}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="p-3 border-t border-foreground/5 text-center">
              <Link
                to="/notifications"
                onClick={() => setOpen(false)}
                className="text-sm text-foreground/70 hover:text-foreground"
              >
                View all
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
