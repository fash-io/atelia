import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, Plus, Trash2, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useMyStudios } from '@/api/hooks/studio/useMyStudios';
import { useMyPendingInvites } from '@/api/hooks/studio/useMyPendingInvites';
import { useStudioDetails } from '@/api/hooks/studio/useStudioDetails';
import { useStudioMutations } from '@/api/hooks/studio/useStudioMutations';

export const Route = createFileRoute('/settings/studio')({
  head: () => ({ meta: [{ title: 'Studio settings — Atelier' }] }),
  component: StudioSettings,
});

function StudioSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: studios = [], isLoading: studiosLoading } = useMyStudios(user?.id);
  const { data: myInvites = [] } = useMyPendingInvites(user?.id);
  const mutations = useStudioMutations(user?.id);

  const [selectedId, setSelectedId] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newStudio, setNewStudio] = useState({ name: '', slug: '' });
  const [inviteTo, setInviteTo] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [draft, setDraft] = useState<{
    name: string;
    bio: string | null;
    custom_domain: string | null;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!selectedId && studios[0]) setSelectedId(studios[0].id);
  }, [studios, selectedId]);

  const selected = useMemo(
    () => studios.find(s => s.id === selectedId) ?? null,
    [selectedId, studios],
  );

  useEffect(() => {
    if (selected) {
      setDraft({ name: selected.name, bio: selected.bio, custom_domain: selected.custom_domain });
    }
  }, [selected?.id, selected?.name, selected?.bio, selected?.custom_domain]);

  const { data: details } = useStudioDetails(selectedId);
  const members = details?.members ?? [];
  const invites = details?.invites ?? [];

  async function createStudio() {
    const name = newStudio.name.trim();
    const slug = (newStudio.slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!name) return toast.error('Give your studio a name');
    if (slug.length < 3) return toast.error('Slug needs at least 3 characters');

    try {
      const studio = await mutations.create.mutateAsync({ name, slug });
      setNewStudio({ name: '', slug: '' });
      setShowCreate(false);
      toast.success('Studio created');
      setSelectedId((studio as Studio).id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not create studio');
    }
  }

  async function saveStudio() {
    if (!selected || !draft) return;
    try {
      await mutations.update.mutateAsync({ studioId: selected.id, payload: draft });
      toast.success('Studio updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update studio');
    }
  }

  async function invite() {
    if (!selected) return;
    const value = inviteTo.trim();
    if (!value) return;
    try {
      await mutations.invite.mutateAsync({ studioId: selected.id, value, role: inviteRole });
      setInviteTo('');
      toast.success('Invite sent');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not send invite');
    }
  }

  async function updateMember(memberId: string, studioId: string, role: string) {
    try {
      await mutations.updateMemberRole.mutateAsync({ memberId, studioId, role });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update member');
    }
  }

  async function removeMember(memberId: string, studioId: string) {
    try {
      await mutations.removeMember.mutateAsync({ memberId, studioId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove member');
    }
  }

  async function accept(inviteId: string, studioId: string, role: string) {
    try {
      await mutations.acceptInvite.mutateAsync({ inviteId, studioId, role });
      toast.success('Studio invite accepted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not accept invite');
    }
  }

  if (loading || !user || studiosLoading)
    return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;

  const hasStudios = studios.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to profile
      </Link>

      {/* pending invites always show first, regardless of whether you have a studio yet */}
      {myInvites.length > 0 && (
        <div className="mb-8 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <p className="font-medium">
            {myInvites.length === 1
              ? "You've been invited to a studio"
              : `You've been invited to ${myInvites.length} studios`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {myInvites.map(inv => (
              <Button
                key={inv.id}
                size="sm"
                onClick={() => accept(inv.id, inv.studio_id, inv.role)}
              >
                Accept {inv.role} invite
              </Button>
            ))}
          </div>
        </div>
      )}

      {!hasStudios ? (
        // ============ EMPTY STATE — first-time setup, single focused flow ============
        <div className="text-center py-8">
          <p className="eyebrow">Studio</p>
          <h1 className="display-lg mt-2">Start your studio</h1>
          <p className="mt-3 text-foreground/60 max-w-md mx-auto">
            A studio lets you invite collaborators, assign roles, and publish work under a shared
            name — with its own public page.
          </p>

          <div className="mt-10 max-w-sm mx-auto rounded-2xl border border-foreground/10 p-6 text-left">
            <div className="space-y-3">
              <input
                value={newStudio.name}
                onChange={e => setNewStudio(s => ({ ...s, name: e.target.value }))}
                className={input}
                placeholder="Studio name"
                autoFocus
              />
              <input
                value={newStudio.slug}
                onChange={e => setNewStudio(s => ({ ...s, slug: e.target.value }))}
                className={input}
                placeholder="studio-slug (optional — we'll generate one)"
              />
            </div>
            <Button
              className="w-full mt-4"
              onClick={createStudio}
              disabled={mutations.create.isPending}
            >
              <Sparkles className="h-4 w-4" />
              {mutations.create.isPending ? 'Creating…' : 'Create studio'}
            </Button>
          </div>
        </div>
      ) : (
        // ============ HAS STUDIOS — normal management layout ============
        <>
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="eyebrow">Studio</p>
              <h1 className="display-lg mt-2">Team management</h1>
            </div>
            {selected && (
              <Button variant="outline" asChild>
                <Link to="/studio/$slug" params={{ slug: selected.slug }}>
                  <ExternalLink className="h-4 w-4" /> View studio
                </Link>
              </Button>
            )}
          </div>

          <div className="mt-10 grid lg:grid-cols-[240px,1fr] gap-8">
            <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
              {studios.length > 1 && (
                <div className="rounded-2xl border border-foreground/10 p-4">
                  <p className="eyebrow">Your studios</p>
                  <div className="mt-3 space-y-1">
                    {studios.map(s => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedId(s.id)}
                        className={`w-full text-left rounded-xl px-3 py-2 text-sm truncate transition-colors ${
                          selectedId === s.id
                            ? 'bg-foreground text-background'
                            : 'hover:bg-foreground/5'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showCreate ? (
                <div className="rounded-2xl border border-foreground/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="eyebrow">New studio</p>
                    <button
                      onClick={() => setShowCreate(false)}
                      className="text-xs text-foreground/40 hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    value={newStudio.name}
                    onChange={e => setNewStudio(s => ({ ...s, name: e.target.value }))}
                    className={input}
                    placeholder="Studio name"
                    autoFocus
                  />
                  <input
                    value={newStudio.slug}
                    onChange={e => setNewStudio(s => ({ ...s, slug: e.target.value }))}
                    className={input}
                    placeholder="studio-slug"
                  />
                  <Button
                    className="w-full"
                    onClick={createStudio}
                    disabled={mutations.create.isPending}
                  >
                    {mutations.create.isPending ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-dashed border-foreground/15 text-sm text-foreground/60 hover:border-foreground/30 hover:text-foreground transition-colors"
                >
                  <Plus className="h-4 w-4" /> New studio
                </button>
              )}
            </aside>

            {selected && draft ? (
              <main className="space-y-8">
                <section className="rounded-2xl border border-foreground/10 p-6">
                  <p className="eyebrow">Profile</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                      value={draft.name}
                      onChange={e => setDraft(d => (d ? { ...d, name: e.target.value } : d))}
                      className={input}
                    />
                    <input
                      value={draft.custom_domain ?? ''}
                      onChange={e =>
                        setDraft(d => (d ? { ...d, custom_domain: e.target.value || null } : d))
                      }
                      className={input}
                      placeholder="custom-domain.com"
                    />
                  </div>
                  <textarea
                    value={draft.bio ?? ''}
                    onChange={e => setDraft(d => (d ? { ...d, bio: e.target.value || null } : d))}
                    className={input + ' mt-4 min-h-27.5 py-3'}
                    placeholder="Studio bio"
                  />
                  <Button
                    className="mt-4"
                    onClick={saveStudio}
                    disabled={mutations.update.isPending}
                  >
                    Save studio
                  </Button>
                </section>

                <section className="rounded-2xl border border-foreground/10 p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="eyebrow">Members</p>
                      <h2 className="font-display text-2xl mt-1">Roles & invites</h2>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm text-foreground/55">
                      <Users className="h-4 w-4" /> {members.length}/8 seats
                    </span>
                  </div>

                  {members.length === 0 && invites.length === 0 && (
                    <p className="mt-4 text-sm text-foreground/55">
                      It's just you for now — invite a collaborator below.
                    </p>
                  )}

                  <div className="mt-5 grid gap-2 sm:grid-cols-[1fr,150px,auto]">
                    <input
                      value={inviteTo}
                      onChange={e => setInviteTo(e.target.value)}
                      className={input}
                      placeholder="username or email"
                    />
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className={input}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="collaborator">Collaborator</option>
                    </select>
                    <Button
                      variant="outline"
                      onClick={invite}
                      disabled={mutations.invite.isPending}
                    >
                      Invite
                    </Button>
                  </div>

                  {members.length > 0 && (
                    <ul className="mt-6 divide-y divide-foreground/5">
                      {members.map(m => (
                        <li key={m.id} className="py-3 flex items-center justify-between gap-4">
                          <div>
                            <div className="font-medium">
                              {m.profile?.full_name ?? m.profile?.username ?? 'Studio member'}
                            </div>
                            <div className="text-xs text-foreground/50">
                              @{m.profile?.username ?? '—'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={m.role}
                              onChange={e => updateMember(m.id, m.studio_id, e.target.value)}
                              className="h-9 px-3 rounded-lg border border-foreground/10 bg-background text-xs"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="collaborator">Collaborator</option>
                            </select>
                            <button
                              onClick={() => removeMember(m.id, m.studio_id)}
                              className="h-9 w-9 grid place-items-center rounded-full text-foreground/45 hover:text-destructive hover:bg-destructive/5"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {invites.length > 0 && (
                    <div className="mt-6 rounded-xl bg-foreground/3 p-4">
                      <p className="text-xs uppercase tracking-widest text-foreground/50">
                        Pending invites
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-foreground/65">
                        {invites.map(inv => (
                          <div key={inv.id}>
                            {inv.invited_email ?? inv.invited_user_id} · {inv.role} · {inv.status}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </main>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

const input =
  'w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm';
