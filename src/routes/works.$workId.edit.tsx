import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ImagePlus, Loader2, X, ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { uploadWorkImage } from '@/lib/upload';
import { DISCIPLINES_FULL } from '@/lib/disciplines';
import { CollaboratorsEditor } from '@/components/collaborators-editor';
import { useWork } from '@/api/hooks/work/useWork';
import { useWorkMutations } from '@/api/hooks/work/useWorkMutations';

export const Route = createFileRoute('/works/$workId/edit')({
  head: () => ({ meta: [{ title: 'Edit work — Atelier' }] }),
  component: EditWork,
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Work not found</h1>
      <Link to="/profile" className="mt-6 inline-block underline">
        Back to profile
      </Link>
    </div>
  ),
});

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  discipline: z.string().min(1, 'Pick a discipline'),
  cover_url: z.string().url('Upload a cover image'),
  gallery: z.array(z.object({ url: z.string().url(), caption: z.string().max(140) })).max(20),
  tags: z.array(z.string().min(1).max(30)).max(10),
  is_published: z.boolean(),
});

function EditWork() {
  const { workId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { remove, update } = useWorkMutations();
  const { data } = useWork(workId);
  const work = data?.work;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [cover, setCover] = useState('');
  const [gallery, setGallery] = useState<{ url: string; caption: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!work) return;
    setTitle(work.title ?? '');
    setDescription(work.description ?? '');
    setDiscipline(work.discipline ?? '');
    setCover(work.cover_url ?? '');
    setGallery((work.gallery as { url: string; caption: string }[]) ?? []);
    setTags(work.tags ?? []);
    setIsPublished(work.is_published);
  }, [work]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);

  async function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error('Image must be under 8MB');
    setUploadingCover(true);
    try {
      const url = await uploadWorkImage(user!.id, f);
      setCover(url);
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploadingCover(false);
    }
  }

  async function onGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingGallery(true);
    try {
      const uploaded = await Promise.all(
        files.slice(0, 20 - gallery.length).map(async f => ({
          url: await uploadWorkImage(user!.id, f),
          caption: '',
        })),
      );
      setGallery(g => [...g, ...uploaded]);
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploadingGallery(false);
      e.target.value = '';
    }
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    if (tags.length >= 10) return toast.error('Max 10 tags');
    setTags([...tags, t]);
    setTagInput('');
  }

  async function save() {
    const parsed = schema.safeParse({
      title,
      description: description || undefined,
      discipline,
      cover_url: cover,
      gallery,
      tags,
      is_published: isPublished,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSaving(true);
    try {
      await update.mutateAsync({ id: workId, data: parsed.data });
      toast.success('Work updated');
      navigate({ to: '/works/$workId', params: { workId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update this work');
    } finally {
      setSaving(false);
    }
  }

  async function deleteWork() {
    if (!confirm("Delete this work permanently? This can't be undone.")) return;
    try {
      await remove.mutateAsync(workId);
      toast.success('Work deleted');
      navigate({ to: '/profile' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete this work');
    }
  }

  if (loading || !user || !work)
    return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;

  return (
    <article className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/works/$workId"
        params={{ workId }}
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to work
      </Link>
      <p className="eyebrow">Edit work</p>
      <h1 className="display-lg mt-2">{title || 'Edit your piece'}</h1>

      <div className="mt-10 space-y-8">
        <section>
          <Label>Cover image</Label>
          {cover ? (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-foreground/10 aspect-4/3">
              <img src={cover} alt="cover" className="h-full w-full object-cover" />
              <button
                onClick={() => setCover('')}
                className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="mt-3 flex flex-col items-center justify-center aspect-4/3 rounded-2xl border-2 border-dashed border-foreground/15 hover:border-foreground/40 cursor-pointer">
              {uploadingCover ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-8 w-8 text-foreground/40" />
              )}
              <span className="mt-3 text-sm text-foreground/60">Drop or click to upload</span>
              <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
            </label>
          )}
        </section>

        <Field label="Title">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={input}
            maxLength={120}
          />
        </Field>
        <Field label="Discipline">
          <select
            value={discipline}
            onChange={e => setDiscipline(e.target.value)}
            className={input}
          >
            <option value="">Select…</option>
            {DISCIPLINES_FULL.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description" hint="A short story about this piece (optional)">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className={input + ' min-h-30 py-3'}
            maxLength={1000}
          />
        </Field>

        <section>
          <Label>
            Gallery <span className="text-foreground/40 font-normal">({gallery.length}/20)</span>
          </Label>
          <div className="mt-3 grid sm:grid-cols-2 gap-4">
            {gallery.map((g, i) => (
              <div key={i} className="rounded-xl border border-foreground/10 p-3">
                <div className="relative rounded-lg overflow-hidden aspect-4/3 mb-3">
                  <img src={g.url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setGallery(gallery.filter((_, j) => j !== i))}
                    className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-background shadow"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  value={g.caption}
                  onChange={e => {
                    const n = [...gallery];
                    n[i] = { ...n[i], caption: e.target.value };
                    setGallery(n);
                  }}
                  placeholder="Caption…"
                  maxLength={140}
                  className="w-full text-sm bg-transparent focus:outline-none"
                />
              </div>
            ))}
            {gallery.length < 20 && (
              <label className="flex items-center justify-center aspect-4/3 rounded-xl border-2 border-dashed border-foreground/15 hover:border-foreground/40 cursor-pointer">
                {uploadingGallery ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="text-sm text-foreground/60 inline-flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" /> Add image(s)
                  </span>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onGalleryChange}
                />
              </label>
            )}
          </div>
        </section>

        <section>
          <Label>Tags</Label>
          <div className="mt-3 flex flex-wrap gap-2 mb-3">
            {tags.map(t => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-foreground/5 text-sm"
              >
                #{t}
                <button onClick={() => setTags(tags.filter(x => x !== t))}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className={input}
              placeholder="Add a tag and press Enter"
              maxLength={30}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
        </section>

        <CollaboratorsEditor targetType="work" targetId={workId} />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
          />
          Published (visible on your profile and in search)
        </label>

        <div className="flex justify-between gap-3 pt-6 border-t border-foreground/10">
          <Button
            variant="outline"
            onClick={deleteWork}
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/works/$workId', params: { workId } })}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || uploadingCover}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

const input =
  'w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm';
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-widest text-foreground/60">{children}</label>;
}
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="text-xs text-foreground/40 mt-1">{hint}</p>}
    </div>
  );
}
