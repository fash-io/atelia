import { createFileRoute, Link, useRouter, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { MapPin, Globe, Sparkles, Calendar, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { WorksTab } from '@/components/profile/public/works-tab';
import { PostsTab } from '@/components/profile/public/posts-tab';
import { useProfile } from '@/api/hooks/profile/useProfile';
import { ServicesList } from '@/components/profile/public/service-tab';
import { BookForm } from '@/components/profile/public/book-form';
import { SocialLinks } from '@/components/profile/public/social-link';
import { ContactForm } from '@/components/profile/public/contact-form';

export const Route = createFileRoute('/u/$username')({
  head: ({ params }) => ({ meta: [{ title: `@${params.username} — Atelier` }] }),
  component: PublicProfile,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="display-lg">Couldn't load profile</h1>
        <p className="mt-2 text-foreground/60">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 underline"
        >
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Creative not found</h1>
      <Link to="/explore" className="mt-6 inline-block underline">
        Back to explore
      </Link>
    </div>
  ),
});

const TABS = ['Works', 'Posts', 'Services', 'Book', 'Contact'] as const;
type Tab = (typeof TABS)[number];

function PublicProfile() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [tab, setTab] = useState<Tab>('Works');

  const { data: profile } = useProfile(username);

  if (!profile) return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;

  const isOwn = user?.id === profile.id;
  const requireAuth = () => {
    if (!user) {
      navigate({ to: '/auth' });
      return false;
    }
    return true;
  };

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 pb-10 border-b border-foreground/10">
        <div className="h-28 w-28 rounded-2xl bg-foreground text-background grid place-items-center font-display text-4xl shrink-0 overflow-hidden">
          {profile.avatar_url ? (
            <img className="size-full" src={profile.avatar_url} />
          ) : (
            <span>{(profile.full_name || profile.username || 'A').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {profile.discipline && <span className="lime-pill">{profile.discipline}</span>}
            {profile.is_pro && (
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/60 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Pro
              </span>
            )}
            {profile.available_for_hire && (
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/60">
                Available for hire
              </span>
            )}
          </div>
          <h1 className="display-lg">{profile.full_name || 'Unnamed creative'}</h1>
          {profile.headline && (
            <p className="mt-2 text-foreground/70 text-lg">{profile.headline}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground/50">
            {profile.username && <span>@{profile.username}</span>}
            {profile.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}
            {profile.website && /^https?:\/\//i.test(profile.website) && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Globe className="h-3.5 w-3.5" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
          <SocialLinks profile={profile} />
        </div>
        {!isOwn && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => requireAuth() && setTab('Book')}>
              <Calendar className="h-4 w-4" /> Book
            </Button>
            <Button onClick={() => requireAuth() && setTab('Contact')}>
              <Send className="h-4 w-4" /> Contact
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-foreground/10">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative shrink-0 px-5 py-4 text-sm transition-colors ${tab === t ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground'}`}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-foreground" />}
          </button>
        ))}
      </div>

      <div className="py-10">
        {tab === 'Works' && <WorksTab userId={profile.id} />}

        {tab === 'Posts' && <PostsTab userId={profile.id} />}

        {tab === 'Services' && (
          <ServicesList
            userId={profile.id}
            canBook={!isOwn}
            onBook={s => {
              if (requireAuth()) setTab('Book');
            }}
          />
        )}

        {tab === 'Book' && (
          <BookForm
            creativeId={profile.id}
            onDone={() => navigate({ to: '/u/$username', params: { username } })}
            isOwn={isOwn}
            userId={user?.id ?? null}
          />
        )}

        {tab === 'Contact' &&
          (isOwn ? (
            <div className="text-center py-12 text-foreground/55">
              Messages clients send you appear in your{' '}
              <Link to="/inbox" className="underline">
                Inbox
              </Link>
              .
            </div>
          ) : (
            <ContactForm
              creativeId={profile.id}
              creativeName={profile.full_name ?? profile.username ?? 'this creative'}
            />
          ))}
      </div>
    </div>
  );
}

export function formatPrice(s: {
  price_amount: number | null;
  currency: string;
  price_unit: string;
}) {
  if (s.price_amount == null) return 'On request';
  const sym = s.currency === 'USD' ? '$' : s.currency + ' ';
  const unit =
    s.price_unit === 'hour'
      ? ' / hr'
      : s.price_unit === 'day'
        ? ' / day'
        : s.price_unit === 'project'
          ? ' / project'
          : '';
  return `${sym}${s.price_amount.toLocaleString()}${unit}`;
}
