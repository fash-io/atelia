import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useTicketMutations } from '@/api/hooks/ticket/useTicketMutations';

export const Route = createFileRoute('/contact')({
  head: () => ({
    meta: [
      { title: 'Contact & Support — Atelier' },
      {
        name: 'description',
        content:
          'Get in touch with Atelier. Send a message or raise a support ticket — our team will get back to you.',
      },
    ],
  }),
  component: ContactPage,
});

const CATEGORIES = ['general', 'billing', 'bug', 'account', 'feature_request', 'other'] as const;
const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(180),
  subject: z.string().trim().min(4).max(180),
  body: z.string().trim().min(10).max(4000),
  category: z.enum(CATEGORIES),
});

function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: user?.email ?? '',
    subject: '',
    body: '',
    category: 'general' as (typeof CATEGORIES)[number],
  });
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const { createTicket } = useTicketMutations();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0].message);
    }
    setSaving(true);
    const error = await createTicket.mutateAsync(parsed.data);
    setSaving(false);
    if (error) return toast.error(error.message ?? 'Could not submit ticket');
    setSent(true);
    toast.success("Ticket submitted — we'll get back to you soon.");
    setForm({ name: '', email: user?.email ?? '', subject: '', body: '', category: 'general' });
  }

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-16">
      <p className="eyebrow">Contact & Support</p>
      <h1 className="display-lg mt-2">Get in touch</h1>
      <p className="mt-4 text-foreground/70 max-w-xl">
        Have a question, found a bug, or need help with your account? Send us a ticket and the team
        will respond as soon as possible.
      </p>

      {sent ? (
        <div className="mt-10 rounded-2xl border border-foreground/10 p-8 text-center">
          <Mail className="h-8 w-8 mx-auto text-foreground/60" />
          <h2 className="display-md mt-4">Thanks for reaching out</h2>
          <p className="mt-2 text-foreground/60">
            We received your ticket and will reply to {form.email || 'you'} as soon as possible.
          </p>
          <Button className="mt-6" onClick={() => setSent(false)}>
            Send another
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Your name">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={input}
                maxLength={120}
                required
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className={input}
                maxLength={180}
                required
              />
            </Field>
          </div>
          <Field label="Category">
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as any })}
              className={input}
            >
              <option value="general">General question</option>
              <option value="billing">Billing</option>
              <option value="bug">Bug report</option>
              <option value="account">Account help</option>
              <option value="feature_request">Feature request</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Subject">
            <input
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              className={input}
              maxLength={180}
              required
            />
          </Field>
          <Field label="Message">
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              className={input + ' min-h-45 py-3'}
              maxLength={4000}
              required
            />
          </Field>
          <div className="flex items-center justify-between pt-4 border-t border-foreground/10">
            <p className="text-xs text-foreground/55">
              Already have an account?{' '}
              <Link to="/inbox" className="underline">
                Check your inbox
              </Link>
              .
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {saving ? 'Sending…' : 'Submit ticket'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

const input =
  'w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-foreground/60">{label}</label>
      <div className="mt-2">{children}</div>
    </div>
  );
}
