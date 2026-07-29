import { useUpdateAvatar, useUpdateProfile } from '@/api/hooks/profile/useProfileMutations';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import z from 'zod';
import { ImagePlus, Loader2, User, FileText, Tag as TagIcon, Link2, Briefcase } from 'lucide-react';
import { Field } from './field';
import { Button } from '../ui/button';

const profileSchema = z.object({
  full_name: z.string().trim().max(100).optional(),
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .max(40)
    .regex(/^[a-z0-9_-]+$/i, 'Letters, numbers, _ or -'),
  headline: z.string().trim().max(140).optional(),
  bio: z.string().trim().max(800).optional(),
  discipline: z.string().trim().max(60).optional(),
  location: z.string().trim().max(80).optional(),
  website: z.string().trim().url('Enter a full URL, e.g. https://…').or(z.literal('')).optional(),
  available_for_hire: z.boolean(),
  skills: z.array(z.string().min(1).max(40)).max(20),
  instagram: z.string().trim().max(80).optional(),
  behance: z.string().trim().max(80).optional(),
  dribbble: z.string().trim().max(80).optional(),
  linkedin: z.string().trim().max(120).optional(),
  twitter: z.string().trim().max(80).optional(),
});

export function EditProfileModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const updateProfile = useUpdateProfile();
  const updateAvatar = useUpdateAvatar();

  const [form, setForm] = useState({
    full_name: profile.full_name ?? '',
    username: profile.username ?? '',
    headline: profile.headline ?? '',
    bio: profile.bio ?? '',
    discipline: profile.discipline ?? '',
    location: profile.location ?? '',
    website: profile.website ?? '',
    available_for_hire: profile.available_for_hire,
    skills: profile.skills ?? [],
    instagram: profile.instagram ?? '',
    behance: profile.behance ?? '',
    dribbble: profile.dribbble ?? '',
    linkedin: profile.linkedin ?? '',
    twitter: profile.twitter ?? '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);

  const parsed = useMemo(() => profileSchema.safeParse(form), [form]);

  const fieldError = (key: string) => {
    if (!attempted && !touched[key]) return undefined;
    if (parsed.success) return undefined;
    return parsed.error.issues.find(i => i.path[0] === key)?.message;
  };

  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));
  const update = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please pick an image file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setUploadingAvatar(true);
    try {
      const { uploadAvatar } = await import('@/lib/upload');
      const url = await uploadAvatar(profile.id, file);
      await updateAvatar.mutateAsync({ userId: profile.id, avatarUrl: url });
      setAvatarUrl(url);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function save() {
    setAttempted(true);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    try {
      await updateProfile.mutateAsync({ userId: profile.id, payload: parsed.data });
      toast.success('Profile updated');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update profile');
    }
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s || form.skills.includes(s) || form.skills.length >= 20) return;
    update('skills', [...form.skills, s]);
    setSkillInput('');
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-3xl max-w-2xl w-full shadow-(--shadow-lift) my-8 max-h-[calc(100vh-4rem)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 pb-1 border-b shrink-0">
          <h2 className="font-display text-3xl">Edit profile</h2>
          <p className="text-sm text-foreground/55 mt-1">
            Tell people who you are and what you do.
          </p>
        </div>

        <div className="px-8 pt-6 pb-4 overflow-y-auto space-y-10">
          {/* SECTION: Photo */}
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your avatar"
                className="h-20 w-20 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-foreground/10 grid place-items-center font-display text-2xl text-foreground/50 shrink-0">
                {(form.full_name || form.username || 'A').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <label className="inline-flex items-center gap-2 justify-center h-10 px-4 rounded-full bg-foreground text-background text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity">
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-3.5 w-3.5" />{' '}
                    {avatarUrl ? 'Change picture' : 'Upload picture'}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
              <p className="text-xs text-foreground/50 mt-2">PNG or JPG, max 5MB.</p>
            </div>
          </div>

          {/* SECTION: Basics */}
          <Section icon={User} title="Basics">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name">
                <input
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  className={inputCls(false)}
                />
              </Field>
              <Field label="Username" error={fieldError('username')} required>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 text-sm select-none">
                    @
                  </span>
                  <input
                    value={form.username}
                    onChange={e => update('username', e.target.value.toLowerCase())}
                    onBlur={() => touch('username')}
                    className={inputCls(!!fieldError('username')) + ' pl-8'}
                  />
                </div>
              </Field>
              <Field label="Discipline">
                <input
                  value={form.discipline}
                  onChange={e => update('discipline', e.target.value)}
                  className={inputCls(false)}
                  placeholder="e.g. Architecture"
                />
              </Field>
              <Field label="Location">
                <input
                  value={form.location}
                  onChange={e => update('location', e.target.value)}
                  className={inputCls(false)}
                  placeholder="e.g. Lagos, Nigeria"
                />
              </Field>
            </div>
            <Field label="Headline" hint={`${form.headline.length}/140`}>
              <input
                value={form.headline}
                onChange={e => update('headline', e.target.value)}
                className={inputCls(false)}
                maxLength={140}
                placeholder="A one-line summary of what you do"
              />
            </Field>
            <Field label="Website" error={fieldError('website')}>
              <input
                value={form.website}
                onChange={e => update('website', e.target.value)}
                onBlur={() => touch('website')}
                className={inputCls(!!fieldError('website'))}
                placeholder="https://yoursite.com"
              />
            </Field>
          </Section>

          {/* SECTION: About */}
          <Section icon={FileText} title="About" hint={`${form.bio.length}/800`}>
            <textarea
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              className={inputCls(false) + ' min-h-30 py-3'}
              maxLength={800}
              placeholder="A short bio — your background, focus, and what makes your work distinct."
            />
          </Section>

          {/* SECTION: Skills */}
          <Section icon={TagIcon} title="Skills" hint={`${form.skills.length}/20`}>
            <div className="flex flex-wrap gap-2 mb-1 min-h-8">
              {form.skills.length === 0 && (
                <p className="text-xs text-foreground/40">No skills added yet.</p>
              )}
              {form.skills.map(s => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-foreground/5 text-sm"
                >
                  {s}
                  <button
                    onClick={() =>
                      update(
                        'skills',
                        form.skills.filter(x => x !== s),
                      )
                    }
                    aria-label={`Remove ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                disabled={form.skills.length >= 20}
                className={inputCls(false) + ' disabled:opacity-40'}
                placeholder={
                  form.skills.length >= 20 ? 'Limit reached' : 'e.g. Revit — press Enter to add'
                }
                maxLength={40}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                disabled={form.skills.length >= 20}
              >
                Add
              </Button>
            </div>
          </Section>

          {/* SECTION: Social links */}
          <Section icon={Link2} title="Social links" optional>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Instagram">
                <input
                  value={form.instagram}
                  onChange={e => update('instagram', e.target.value)}
                  className={inputCls(false)}
                  placeholder="username or URL"
                />
              </Field>
              <Field label="Behance">
                <input
                  value={form.behance}
                  onChange={e => update('behance', e.target.value)}
                  className={inputCls(false)}
                  placeholder="username or URL"
                />
              </Field>
              <Field label="Dribbble">
                <input
                  value={form.dribbble}
                  onChange={e => update('dribbble', e.target.value)}
                  className={inputCls(false)}
                  placeholder="username or URL"
                />
              </Field>
              <Field label="LinkedIn">
                <input
                  value={form.linkedin}
                  onChange={e => update('linkedin', e.target.value)}
                  className={inputCls(false)}
                  placeholder="username or URL"
                />
              </Field>
              <Field label="X (Twitter)" className="sm:col-span-2">
                <input
                  value={form.twitter}
                  onChange={e => update('twitter', e.target.value)}
                  className={inputCls(false)}
                  placeholder="handle or URL"
                />
              </Field>
            </div>
          </Section>

          {/* SECTION: Availability */}
          <Section icon={Briefcase} title="Availability">
            <button
              type="button"
              onClick={() => update('available_for_hire', !form.available_for_hire)}
              className={`w-full flex items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                form.available_for_hire
                  ? 'border-lime/40 bg-lime/5'
                  : 'border-foreground/10 hover:border-foreground/20'
              }`}
            >
              <span
                className={`h-5 w-9 rounded-full shrink-0 relative transition-colors ${
                  form.available_for_hire ? 'bg-lime' : 'bg-foreground/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all ${
                    form.available_for_hire ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </span>
              <div>
                <div className="text-sm font-medium">Available for hire</div>
                <div className="text-xs text-foreground/55 mt-0.5">
                  Shows on your profile and in search results.
                </div>
              </div>
            </button>
          </Section>
        </div>

        <div className="p-8 pt-4 border-t border-foreground/10 flex gap-2 justify-end shrink-0">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={updateProfile.isPending}>
            {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {updateProfile.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  optional,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-foreground/40" />
        <h3 className="text-sm font-medium">{title}</h3>
        {optional && <span className="text-xs text-foreground/35">optional</span>}
        {hint && <span className="text-xs text-foreground/35 ml-auto">{hint}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function inputCls(hasError: boolean) {
  return `w-full h-11 px-4 rounded-xl border bg-background focus:outline-none text-sm transition-colors ${
    hasError
      ? 'border-destructive/50 focus:border-destructive'
      : 'border-foreground/10 focus:border-foreground/40'
  }`;
}
