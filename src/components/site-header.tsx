import { Link, useNavigate } from '@tanstack/react-router';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { NotificationsBell } from '@/components/notifications-bell';
import { UserMenu } from '@/components/user-menu';
import logo from '@/assets/logo/1.svg';

const nav = [
  { to: '/explore', label: 'Explore' },
  { to: '/search', label: 'Find creatives' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/pricing', label: 'Go Pro' },
];

function NavLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="relative py-1 text-foreground/65 hover:text-foreground transition-colors group"
      activeProps={{ className: 'text-foreground' }}
    >
      {label}
      <span className="absolute -bottom-1 left-0 h-px w-full bg-lime scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 in-[.active]:scale-x-100" />
    </Link>
  );
}

export function SiteHeader() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const mobileLinks = [
    { key: 'search', node: 'search' as const },
    { key: 'divider-1', node: 'divider' as const },
    ...nav.map(n => ({ key: n.to, node: 'link' as const, ...n })),
    ...(!user
      ? [
          { key: 'divider-2', node: 'divider' as const },
          { key: 'signin', node: 'signin' as const },
          { key: 'join', node: 'join' as const },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-foreground/5">
      <div className="mx-auto max-w-350 px-5 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="" className="h-9 w-9" />
            <span className="font-display text-2xl tracking-tight">Atelier</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            {nav.map(n => (
              <NavLink key={n.to} to={n.to} label={n.label} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ to: '/search' })}
            className="hidden md:flex items-center gap-2.5 h-10 pl-4 pr-3 rounded-full border border-foreground/10 hover:border-foreground/30 hover:bg-foreground/[0.03] transition-colors w-64 group"
          >
            <Search className="h-3.5 w-3.5 text-foreground/40 group-hover:text-foreground/60" />
            <span className="eyebrow font-normal tracking-normal normal-case text-foreground/45 group-hover:text-foreground/60 text-[13px]">
              Search creatives, work…
            </span>
          </button>

          {user ? (
            <>
              <NotificationsBell />
              <UserMenu />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild curve={'custom-l'}>
                <Link to="/auth">Join Atelier</Link>
              </Button>
            </>
          )}

          <button
            className="md:hidden h-10 w-10 grid place-items-center relative"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
          >
            <Menu
              className={`h-5 w-5 absolute transition-all duration-300 ease-out-soft ${
                open ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
            <X
              className={`h-5 w-5 absolute transition-all duration-300 ease-out-soft ${
                open ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
              }`}
            />
          </button>
        </div>
      </div>

      {/* mobile drawer — height+opacity animated, items stagger in on open */}
      <div
        className={`md:hidden overflow-hidden border-t transition-all duration-300 ease-out-soft ${
          open
            ? 'max-h-[28rem] opacity-100 border-foreground/5'
            : 'max-h-0 opacity-0 border-transparent'
        }`}
      >
        <div className="px-5 py-4 flex flex-col gap-1 bg-background">
          {mobileLinks.map((item, i) => {
            const style = open ? { animationDelay: `${i * 40}ms` } : undefined;
            const animClass = open ? 'animate-menu-item' : '';

            if (item.node === 'divider') {
              return <div key={item.key} className="h-px bg-foreground/5 my-1" />;
            }
            if (item.node === 'search') {
              return (
                <button
                  key={item.key}
                  style={style}
                  className={`flex items-center gap-2.5 py-2.5 text-foreground/60 ${animClass}`}
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: '/search' });
                  }}
                >
                  <Search className="h-4 w-4" /> Search creatives, work…
                </button>
              );
            }
            if (item.node === 'signin') {
              return (
                <Link
                  key={item.key}
                  to="/auth"
                  style={style}
                  onClick={() => setOpen(false)}
                  className={`py-2.5 text-foreground/80 ${animClass}`}
                >
                  Sign in
                </Link>
              );
            }
            if (item.node === 'join') {
              return (
                <Link
                  key={item.key}
                  to="/auth"
                  style={style}
                  onClick={() => setOpen(false)}
                  className={`py-2.5 font-medium ${animClass}`}
                >
                  Join Atelier
                </Link>
              );
            }
            return (
              <Link
                key={item.key}
                to={item.to!}
                style={style}
                onClick={() => setOpen(false)}
                className={`py-2.5 text-foreground/80 ${animClass}`}
                activeProps={{ className: 'text-foreground font-medium' }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
