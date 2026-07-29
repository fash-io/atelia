import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { MapPin, Globe, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useMyProfile } from '@/api/hooks/profile/useMyProfile';
import { BookingsTab } from '@/components/profile/bookings-tab';
import { ServicesTab } from '@/components/profile/service-tab';
import { WorksTab } from '@/components/profile/works-tab';
import { PostsTab } from '@/components/profile/posts-tab';
import { ContactTab } from '@/components/profile/contact-tab';
import { EditProfileModal } from '@/components/profile/edit-modal';

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [{ title: 'Your profile — Atelier' }] }),
  component: ProfilePage,
});

const TABS = ['Works', 'Posts', 'Bookings', 'Services', 'Contact'] as const;
type Tab = (typeof TABS)[number];

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>('Works');

  const { data: profile } = useMyProfile(user?.id);

  if (!loading && !user) {
    navigate({ to: '/auth' });
    return null;
  }

  if (loading || !user || !profile)
    return (
      <div className="mx-auto max-w-350 px-5 lg:px-10 py-20 text-foreground/50">
        Loading your atelier…
      </div>
    );

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-10 pb-10 border-b border-foreground/10">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name ?? 'Avatar'}
            className="h-28 w-28 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <div className="h-28 w-28 rounded-2xl bg-foreground text-background grid place-items-center font-display text-4xl shrink-0">
            {(profile.full_name || profile.username || 'A').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            {profile.discipline && <span className="lime-pill">{profile.discipline}</span>}
            {profile.is_pro && (
              <span className="text-xs font-mono uppercase tracking-widest text-foreground/60 inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Pro member
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
        </div>
        <div className="flex gap-2 flex-wrap">
          {profile.username && (
            <Button variant="outline" asChild>
              <Link to="/u/$username" params={{ username: profile.username }}>
                View public profile
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit profile
          </Button>
          {profile.is_pro ? (
            <Button variant="outline" asChild>
              <Link to="/settings/billing">
                <Sparkles className="h-4 w-4" /> Manage subscription
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/pricing">
                <Sparkles className="h-4 w-4" /> Go Pro
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-foreground/10 overflow-y-hidden">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative shrink-0 px-5 py-4 text-sm transition-colors  ${tab === t ? 'text-foreground font-medium' : 'text-foreground/50 hover:text-foreground'}`}
          >
            {t}
            {tab === t && (
              <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      <div className="py-10">
        {tab === 'Works' && <WorksTab userId={user.id} bio={profile.bio} />}

        {tab === 'Posts' && <PostsTab userId={user.id} />}

        {tab === 'Bookings' && <BookingsTab userId={user.id} />}

        {tab === 'Services' && <ServicesTab userId={user.id} />}

        {tab === 'Contact' && (
          <ContactTab userEmail={user.email ?? ''} location={profile.location} />
        )}
      </div>

      {editing && <EditProfileModal profile={profile} onClose={() => setEditing(false)} />}
    </div>
  );
}
