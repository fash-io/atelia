import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/inbox/$threadId")({
  head: () => ({ meta: [{ title: "Conversation — Atelier" }] }),
  component: ThreadPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="display-lg">Couldn't open this conversation</h1>
        <p className="mt-2 text-foreground/60">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 underline">Try again</button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="px-5 py-20 text-center">
      <h1 className="display-lg">Conversation not found</h1>
      <Link to="/inbox" className="mt-6 inline-block underline">Back to inbox</Link>
    </div>
  ),
});

type Thread = { id: string; subject: string; client_id: string; creative_id: string };
type Message = { id: string; thread_id: string; sender_id: string; body: string; created_at: string };
type ProfileLite = { id: string; full_name: string | null; username: string | null };

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<ProfileLite | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: t } = await supabase.from("threads").select("*").eq("id", threadId).maybeSingle();
      if (!t) return;
      setThread(t as Thread);
      const otherId = (t as Thread).client_id === user.id ? (t as Thread).creative_id : (t as Thread).client_id;
      const [{ data: ms }, { data: p }] = await Promise.all([
        supabase.from("messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }),
        supabase.from("profiles").select("id, full_name, username").eq("id", otherId).maybeSingle(),
      ]);
      setMessages((ms as Message[]) ?? []);
      setOther(p as ProfileLite | null);
      // Mark unread incoming notifications related to this thread as read
      await supabase.from("notifications").update({ read_at: new Date().toISOString() })
        .eq("user_id", user.id).eq("related_id", threadId).is("read_at", null);
    })();

    const channel = supabase
      .channel(`thread:${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    if (!user || !thread || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("messages").insert({ thread_id: thread.id, sender_id: user.id, body: text });
    setSending(false);
    if (error) {
      setBody(text);
      toast.error("Couldn't send message");
    }
  }

  if (loading || !user) return null;
  if (!thread) return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-5 lg:px-10 py-8 flex flex-col" style={{ minHeight: "calc(100vh - 64px)" }}>
      <Link to="/inbox" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Inbox
      </Link>

      <div className="pb-5 border-b border-foreground/10">
        <p className="eyebrow">Conversation with</p>
        <h1 className="display-md mt-1">{other?.full_name ?? other?.username ?? "Atelier user"}</h1>
        <p className="text-sm text-foreground/60 mt-1">{thread.subject}</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-8 space-y-5">
        {messages.length === 0 && <p className="text-center text-sm text-foreground/50">No messages yet — say hello.</p>}
        {messages.map((m) => {
          const mine = m.sender_id === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${mine ? "bg-foreground text-background" : "bg-foreground/5"}`}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                <div className={`text-[10px] mt-1.5 ${mine ? "text-background/55" : "text-foreground/45"}`}>{format(new Date(m.created_at), "PPp")}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-3 pt-4 border-t border-foreground/10">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
          placeholder="Write a message…"
          rows={2}
          className="flex-1 rounded-xl border border-foreground/10 bg-background px-4 py-3 text-sm focus:outline-none focus:border-foreground/40 resize-none"
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </div>
  );
}
