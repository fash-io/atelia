import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function ContactForm({
  creativeId,
  creativeName,
}: {
  creativeId: string;
  creativeName: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState('New inquiry');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!user || !body.trim()) return;
    setSending(true);
    const { data: t, error: te } = await supabase
      .from('threads')
      .insert({
        client_id: user.id,
        creative_id: creativeId,
        subject: subject.trim() || 'New inquiry',
      })
      .select()
      .single();
    if (te || !t) {
      setSending(false);
      return toast.error(te?.message ?? "Couldn't start conversation");
    }
    const { error: me } = await supabase
      .from('messages')
      .insert({ thread_id: (t as any).id, sender_id: user.id, body: body.trim() });
    setSending(false);
    if (me) return toast.error(me.message);
    toast.success('Message sent');
    navigate({ to: '/inbox/$threadId', params: { threadId: (t as any).id } });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10 max-w-3xl">
      <div>
        <p className="eyebrow">Send a message</p>
        <h3 className="display-md mt-2">Reach {creativeName}</h3>
        <p className="mt-3 text-foreground/65">
          Send a brief, request a quote, or ask a question. Replies arrive in your inbox.
        </p>
      </div>
      <form
        onSubmit={e => {
          e.preventDefault();
          send();
        }}
        className="space-y-4 rounded-2xl border border-foreground/10 p-6"
      >
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          maxLength={100}
          className="w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background"
          placeholder="Subject"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          required
          minLength={10}
          className="w-full px-4 py-3 rounded-xl border border-foreground/10 bg-background min-h-40"
          placeholder="Tell them about your project, timing and budget…"
        />
        <Button type="submit" className="w-full" disabled={sending || !body.trim()}>
          {sending ? 'Sending…' : 'Send message'}
        </Button>
      </form>
    </div>
  );
}
