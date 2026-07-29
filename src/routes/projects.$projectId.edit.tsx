import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ImagePlus,
  Loader2,
  X,
  ArrowLeft,
  Type,
  Image as ImgIcon,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { uploadWorkImage } from '@/lib/upload';
import { DISCIPLINES_FULL } from '@/lib/disciplines';
import { CollaboratorsEditor } from '@/components/collaborators-editor';
import { useProjectMutations } from '@/api/hooks/project/useProjectMutations';
import { useProject } from '@/api/hooks/project/useProject';

export const Route = createFileRoute('/projects/$projectId/edit')({
  head: () => ({ meta: [{ title: 'Edit case study — Atelier' }] }),
  component: EditProject,
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Project not found</h1>
      <Link to="/profile" className="mt-6 inline-block underline">
        Back to profile
      </Link>
    </div>
  ),
});

const schema = z.object({
  title: z.string().trim().min(2).max(140),
  subtitle: z.string().trim().max(200).optional(),
  discipline: z.string().min(1),
  cover_url: z.string().url('Add a cover image'),
  client: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  year: z.string().max(10).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10),
  is_published: z.boolean(),
});

function EditProject() {
  const { projectId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { remove, update } = useProjectMutations();
  const { data } = useProject(projectId);
  const project = data?.project;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [cover, setCover] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!project) return;
    setTitle(project.title);
    setSubtitle(project.subtitle ?? '');
    setDiscipline(project.discipline ?? '');
    setCover(project.cover_url);
    setClient(project.client ?? '');
    setLocation(project.location ?? '');
    setYear(project.year ?? '');
    setSections((project.sections as any) ?? []);
    setTags(project.tags ?? []);
    setIsPublished(project.is_published);
  }, [project]);

  async function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadingCover(true);
    try {
      setCover(await uploadWorkImage(user!.id, f));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingCover(false);
    }
  }

  async function uploadSectionImage(idx: number, file: File) {
    try {
      const url = await uploadWorkImage(user!.id, file);
      setSections(s => {
        const next = [...s];
        next[idx] = { type: 'image', url, caption: (next[idx] as any).caption ?? '' };
        return next;
      });
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function addTag() {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || tags.includes(t) || tags.length >= 10) return;
    setTags([...tags, t]);
    setTagInput('');
  }

  async function save() {
    const parsed = schema.safeParse({
      title,
      subtitle: subtitle || undefined,
      discipline,
      cover_url: cover,
      client: client || undefined,
      location: location || undefined,
      year: year || undefined,
      tags,
      is_published: isPublished,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);

    try {
      // await update.mutateAsync({ id: projectId, data: {parsed.data} });
      toast.success('Case study updated');
      navigate({ to: '/projects/$projectId', params: { projectId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update this project');
    } finally {
      setSaving(false);
    }
    toast.success('Case study updated');
  }

  async function deleteProject() {
    if (!confirm('Delete this case study permanently?')) return;
    try {
      await remove.mutateAsync(projectId);
      toast.success('Case study deleted');
      navigate({ to: '/profile' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete this Case Study');
    }
  }

  if (!user || loading || !project)
    return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/projects/$projectId"
        params={{ projectId }}
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <p className="eyebrow">Edit case study</p>
      <h1 className="display-lg mt-2">{title || 'Edit your case study'}</h1>

      <div className="mt-10 space-y-8">
        <section>
          <Lbl>Cover image</Lbl>
          {cover ? (
            <div className="mt-3 relative rounded-2xl overflow-hidden border border-foreground/10 aspect-video">
              <img src={cover} alt="" className="h-full w-full object-cover" />
              <button
                onClick={() => setCover('')}
                className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-background shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="mt-3 flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-foreground/15 hover:border-foreground/40 cursor-pointer">
              {uploadingCover ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-8 w-8 text-foreground/40" />
              )}
              <span className="mt-3 text-sm text-foreground/60">Upload a hero cover</span>
              <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
            </label>
          )}
        </section>

        <Field label="Project title">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={input}
            maxLength={140}
          />
        </Field>
        <Field label="Subtitle">
          <input
            value={subtitle}
            onChange={e => setSubtitle(e.target.value)}
            className={input}
            maxLength={200}
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
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
          <Field label="Client">
            <input
              value={client}
              onChange={e => setClient(e.target.value)}
              className={input}
              maxLength={80}
            />
          </Field>
          <Field label="Year">
            <input
              value={year}
              onChange={e => setYear(e.target.value)}
              className={input}
              maxLength={10}
            />
          </Field>
        </div>
        <Field label="Location">
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            className={input}
            maxLength={80}
          />
        </Field>

        <section>
          <Lbl>Sections</Lbl>
          <div className="mt-3 space-y-4">
            {sections.map((s, i) => (
              <div key={i} className="rounded-2xl border border-foreground/10 p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-widest text-foreground/50">
                    {s.type === 'text' ? 'Text' : 'Image'} block
                  </span>
                  <button
                    onClick={() => setSections(sections.filter((_, j) => j !== i))}
                    className="text-foreground/50 hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {s.type === 'text' ? (
                  <>
                    <input
                      value={s.heading}
                      onChange={e => {
                        const n = [...sections];
                        (n[i] as any).heading = e.target.value;
                        setSections(n);
                      }}
                      placeholder="Section heading"
                      className="w-full font-display text-xl bg-transparent focus:outline-none mb-3"
                      maxLength={140}
                    />
                    <textarea
                      value={s.body}
                      onChange={e => {
                        const n = [...sections];
                        (n[i] as any).body = e.target.value;
                        setSections(n);
                      }}
                      placeholder="Write…"
                      className="w-full min-h-30 bg-transparent focus:outline-none text-foreground/85 leading-relaxed"
                      maxLength={3000}
                    />
                  </>
                ) : (
                  <>
                    {s.url ? (
                      <img src={s.url} alt="" className="w-full rounded-xl mb-3" />
                    ) : (
                      <label className="flex items-center justify-center aspect-video rounded-xl border-2 border-dashed border-foreground/15 cursor-pointer mb-3">
                        <span className="text-sm text-foreground/60 inline-flex items-center gap-2">
                          <ImagePlus className="h-4 w-4" /> Upload image
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            if (f) uploadSectionImage(i, f);
                          }}
                        />
                      </label>
                    )}
                    <input
                      value={s.caption}
                      onChange={e => {
                        const n = [...sections];
                        (n[i] as any).caption = e.target.value;
                        setSections(n);
                      }}
                      placeholder="Caption"
                      className="w-full bg-transparent focus:outline-none text-sm"
                      maxLength={200}
                    />
                  </>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSections([...sections, { type: 'text', heading: '', body: '' }])}
              >
                <Type className="h-4 w-4" /> Add text
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSections([...sections, { type: 'image', url: '', caption: '' }])}
              >
                <ImgIcon className="h-4 w-4" /> Add image
              </Button>
            </div>
          </div>
        </section>

        <section>
          <Lbl>Tags</Lbl>
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
              placeholder="Add tag"
              maxLength={30}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </section>

        <CollaboratorsEditor targetType="project" targetId={projectId} />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
          />
          Published
        </label>

        <div className="flex justify-between gap-3 pt-6 border-t border-foreground/10">
          <Button
            variant="outline"
            onClick={deleteProject}
            className="text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/projects/$projectId', params: { projectId } })}
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

const input =
  'w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm';
function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-widest text-foreground/60">{children}</label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Lbl>{label}</Lbl>
      <div className="mt-2">{children}</div>
    </div>
  );
}
