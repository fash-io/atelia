import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ImagePlus, Loader2, X, ArrowLeft, Type, Image as ImgIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { uploadWorkImage } from '@/lib/upload';
import { DISCIPLINES_FULL } from '@/lib/disciplines';
import { CollaboratorsEditor, type CollaboratorDraft } from '@/components/collaborators-editor';

export const Route = createFileRoute('/projects/new')({
  head: () => ({ meta: [{ title: 'Publish case study — Atelier' }] }),
  component: NewProject,
});

type Section =
  { type: 'text'; heading: string; body: string } | { type: 'image'; url: string; caption: string };

const TEMPLATE: Section[] = [
  {
    type: 'text',
    heading: 'The brief',
    body: 'What was the client looking for? What constraints shaped the project?',
  },
  {
    type: 'text',
    heading: 'Concept & approach',
    body: 'How did you respond? What ideas led the design?',
  },
  {
    type: 'text',
    heading: 'Materials & process',
    body: 'Materials, methods, drawings, prototypes…',
  },
  { type: 'text', heading: 'Outcome', body: 'What was delivered? Reception, learnings.' },
];

const schema = z.object({
  title: z.string().trim().min(2).max(140),
  subtitle: z.string().trim().max(200).optional(),
  discipline: z.string().min(1),
  cover_url: z.string().url('Add a cover image'),
  client: z.string().max(80).optional(),
  location: z.string().max(80).optional(),
  year: z.string().max(10).optional(),
});

function NewProject() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [cover, setCover] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [year, setYear] = useState('');
  const [sections, setSections] = useState<Section[]>(TEMPLATE);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [collaborators, setCollaborators] = useState<CollaboratorDraft[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: '/auth' });
  }, [loading, user, navigate]);
  if (!user) return null;

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

  async function publish() {
    const parsed = schema.safeParse({
      title,
      subtitle: subtitle || undefined,
      discipline,
      cover_url: cover,
      client: client || undefined,
      location: location || undefined,
      year: year || undefined,
    });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user!.id,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle ?? null,
        cover_url: parsed.data.cover_url,
        discipline: parsed.data.discipline,
        client: parsed.data.client ?? null,
        location: parsed.data.location ?? null,
        year: parsed.data.year ?? null,
        sections,
        tags,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (collaborators.length > 0) {
      const { error: collabError } = await supabase.from('content_collaborators').insert(
        collaborators.map((c, idx) => ({
          target_type: 'project',
          target_id: data.id,
          user_id: c.user_id,
          role: c.role,
          sort_order: idx,
        })),
      );
      if (collabError) toast.error(collabError.message);
    }
    toast.success('Case study published');
    navigate({ to: '/projects/$projectId', params: { projectId: data.id } });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-12">
      <Link
        to="/profile"
        className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>
      <p className="eyebrow">New case study</p>
      <h1 className="display-lg mt-2">Tell the story behind a project</h1>
      <p className="mt-3 text-foreground/60">
        Use the template below — Brief, Concept, Materials, Outcome — to publish a long-form post.
      </p>

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
            placeholder="A one-line description"
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
              placeholder="2025"
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
                      className="w-full min-h-[120px] bg-transparent focus:outline-none text-foreground/85 leading-relaxed"
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

        <CollaboratorsEditor value={collaborators} onChange={setCollaborators} />

        <div className="flex justify-end gap-3 pt-6 border-t border-foreground/10">
          <Button variant="ghost" onClick={() => navigate({ to: '/profile' })}>
            Cancel
          </Button>
          <Button onClick={publish} disabled={saving}>
            {saving ? 'Publishing…' : 'Publish case study'}
          </Button>
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
