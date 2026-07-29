import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  User as UserIcon,
  Inbox,
  Sparkles,
  Settings,
  LogOut,
  LayoutDashboard,
  Bookmark,
  Users,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

type Mini = { full_name: string | null; username: string | null; avatar_url: string | null };

export function UserMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState<Mini | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle(),
      ]);
      setMe(p as Mini);
      setIsAdmin(Boolean(r));
    })();
  }, [user]);

  if (!user) return null;
  const initial = (me?.full_name || me?.username || user.email || 'A').charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-10 w-10 rounded-full overflow-hidden border border-foreground/10 hover:border-foreground/30 transition-colors grid place-items-center bg-foreground/5">
          {me?.avatar_url ? (
            <img
              src={me.avatar_url}
              alt={me.full_name ?? 'You'}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-sm">{initial}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center gap-3 py-3">
          <div className="h-9 w-9 rounded-full overflow-hidden bg-foreground/5 grid place-items-center shrink-0">
            {me?.avatar_url ? (
              <img src={me.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-display">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-medium truncate">
              {me?.full_name ?? me?.username ?? 'Atelier user'}
            </div>
            <div className="text-xs text-foreground/55 truncate">{user.email}</div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: '/profile' })}>
          <UserIcon className="h-4 w-4" /> Your profile
        </DropdownMenuItem>
        {me?.username && (
          <DropdownMenuItem
            onClick={() => navigate({ to: '/u/$username', params: { username: me.username! } })}
          >
            <Sparkles className="h-4 w-4" /> View public profile
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate({ to: '/inbox' })}>
          <Inbox className="h-4 w-4" /> Inbox
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: '/favorites' })}>
          <Bookmark className="h-4 w-4" /> Favourites
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate({ to: '/settings/billing' })}>
          <Settings className="h-4 w-4" /> Manage subscription
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: '/settings/studio' })}>
          <Users className="h-4 w-4" /> Studio team
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: '/pricing' })}>
          <Sparkles className="h-4 w-4" /> Plans & pricing
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: '/admin' })}>
              <LayoutDashboard className="h-4 w-4" /> Admin dashboard
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate({ to: '/' });
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
