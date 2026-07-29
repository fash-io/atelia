import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Inbox as InboxIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

export const Route = createFileRoute('/inbox')({
  head: () => ({ meta: [{ title: 'Inbox — Atelier' }] }),
  component: InboxPage,
});

type Thread = {
  id: string;
  subject: string;
  client_id: string;
  creative_id: string;
  last_message_at: string;
};
type ProfileLite = { id: string; full_name: string | null; username: string | null };

function InboxPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [profiles, setProfiles] = useState<Map<string, ProfileLite>>(new Map());
  const [loadingT, setLoadingT] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('threads')
        .select('*')
        .or(`client_id.eq.${user.id},creative_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false });
      const ts = (data as Thread[]) ?? [];
      setThreads(ts);
      const ids = [...new Set(ts.flatMap(t => [t.client_id, t.creative_id]))];
      if (ids.length) {
        const { data: ps } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', ids);
        setProfiles(new Map((ps ?? []).map(p => [p.id, p as ProfileLite])));
      }
      setLoadingT(false);
    })();
  }, [user]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <p className="eyebrow">Conversations</p>
      <h1 className="display-lg mt-2">Inbox</h1>

      {loadingT ? (
        <div className="mt-12 text-foreground/50">Loading…</div>
      ) : threads.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-foreground/15 p-12 text-center">
          <InboxIcon className="h-8 w-8 mx-auto text-foreground/40" />
          <h3 className="font-display text-2xl mt-4">No messages yet</h3>
          <p className="mt-2 text-foreground/60 text-sm max-w-md mx-auto">
            When someone reaches out from a profile, the conversation will appear here.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-foreground/10 border-y border-foreground/10">
          {threads.map(t => {
            const otherId = t.client_id === user.id ? t.creative_id : t.client_id;
            const other = profiles.get(otherId);
            return (
              <li key={t.id}>
                <Link
                  to="/inbox/$threadId"
                  params={{ threadId: t.id }}
                  className="flex items-center gap-4 py-5 hover:bg-foreground/2"
                >
                  <div className="h-11 w-11 rounded-full bg-foreground text-background grid place-items-center font-display shrink-0">
                    {(other?.full_name ?? other?.username ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {other?.full_name ?? other?.username ?? 'Atelier user'}
                    </div>
                    <div className="text-sm text-foreground/60 truncate">{t.subject}</div>
                  </div>
                  <div className="text-xs text-foreground/45 shrink-0">
                    {formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
