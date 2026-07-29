import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export type CollaboratorDraft = {
  user_id: string;
  role: string;
  full_name: string | null;
  username: string | null;
  avatar_url?: string | null;
};

type CollaboratorRow = {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
};

export function CollaboratorsEditor({
  targetType,
  targetId,
  value,
  onChange,
}: {
  targetType?: "work" | "project";
  targetId?: string;
  value?: CollaboratorDraft[];
  onChange?: (items: CollaboratorDraft[]) => void;
}) {
  const controlled = value !== undefined && onChange;
  const [items, setItems] = useState<CollaboratorDraft[]>(value ?? []);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("Collaborator");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value) setItems(value);
  }, [value]);

  useEffect(() => {
    if (!targetType || !targetId || controlled) return;
    (async () => {
      const { data } = await supabase
        .from("content_collaborators")
        .select("id, user_id, role")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("sort_order", { ascending: true });
      const rows = ((data as any) ?? []) as CollaboratorRow[];
      const ids = rows.map((r) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", ids)
        : { data: [] as any[] };
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      setItems(
        rows.map((r) => ({
          user_id: r.user_id,
          role: r.role,
          ...(profileMap.get(r.user_id) ?? {}),
        })),
      );
    })();
  }, [controlled, targetId, targetType]);

  function update(next: CollaboratorDraft[]) {
    if (controlled) onChange(next);
    setItems(next);
  }

  async function add() {
    const handle = username.trim().replace(/^@/, "");
    if (!handle) return;
    if (items.some((i) => i.username === handle)) return toast.error("Collaborator already added");
    setLoading(true);
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("username", handle)
      .maybeSingle();
    if (error || !profile) {
      setLoading(false);
      return toast.error("No profile found with that username");
    }

    const draft: CollaboratorDraft = {
      user_id: (profile as any).id,
      role: role.trim() || "Collaborator",
      full_name: (profile as any).full_name,
      username: (profile as any).username,
      avatar_url: (profile as any).avatar_url,
    };

    if (targetType && targetId && !controlled) {
      const { error: insertError } = await supabase.from("content_collaborators").upsert(
        {
          target_type: targetType,
          target_id: targetId,
          user_id: draft.user_id,
          role: draft.role,
          sort_order: items.length,
        },
        { onConflict: "target_type,target_id,user_id" },
      );
      if (insertError) {
        setLoading(false);
        return toast.error(insertError.message);
      }
    }

    update([...items, draft]);
    setUsername("");
    setRole("Collaborator");
    setLoading(false);
  }

  async function remove(item: CollaboratorDraft) {
    if (targetType && targetId && !controlled) {
      const { error } = await supabase
        .from("content_collaborators")
        .delete()
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("user_id", item.user_id);
      if (error) return toast.error(error.message);
    }
    update(items.filter((i) => i.user_id !== item.user_id));
  }

  return (
    <section className="rounded-2xl border border-foreground/10 p-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="eyebrow">Collaborators</p>
          <p className="mt-1 text-sm text-foreground/55">
            Add people involved in this work or case study by username.
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {items.map((c) => (
            <span
              key={c.user_id}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/10 bg-background px-3 py-1.5 text-sm"
            >
              <span className="font-medium">{c.full_name ?? c.username}</span>
              <span className="text-foreground/45">{c.role}</span>
              <button
                onClick={() => remove(c)}
                aria-label="Remove collaborator"
                className="text-foreground/40 hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr,180px,auto]">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={input}
          placeholder="username"
        />
        <Button
          type="button"
          variant="outline"
          onClick={add}
          disabled={loading || !username.trim()}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </section>
  );
}

export function CollaboratorsList({
  targetType,
  targetId,
}: {
  targetType: "work" | "project";
  targetId: string;
}) {
  const [items, setItems] = useState<CollaboratorDraft[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("content_collaborators")
        .select("user_id, role")
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .order("sort_order", { ascending: true });
      const rows = (data as any[]) ?? [];
      const ids = rows.map((r) => r.user_id);
      const { data: profiles } = ids.length
        ? await supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url")
            .in("id", ids)
        : { data: [] as any[] };
      const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      setItems(
        rows.map((r) => ({ user_id: r.user_id, role: r.role, ...(map.get(r.user_id) ?? {}) })),
      );
    })();
  }, [targetId, targetType]);

  if (items.length === 0) return null;

  return (
    <div className="mt-10 rounded-2xl border border-foreground/10 p-5">
      <p className="eyebrow">Collaborators</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {items.map((c) =>
          c.username ? (
            <Link
              key={c.user_id}
              to="/u/$username"
              params={{ username: c.username }}
              className="flex items-center gap-3 rounded-full border border-foreground/10 px-3 py-2 hover:border-foreground/30 transition-colors"
            >
              <Avatar item={c} />
              <span className="text-sm">
                <span className="font-medium">{c.full_name ?? c.username}</span>
                <span className="text-foreground/45"> · {c.role}</span>
              </span>
            </Link>
          ) : (
            <div
              key={c.user_id}
              className="flex items-center gap-3 rounded-full border border-foreground/10 px-3 py-2"
            >
              <Avatar item={c} />
              <span className="text-sm">
                <span className="font-medium">{c.full_name ?? "Collaborator"}</span>
                <span className="text-foreground/45"> · {c.role}</span>
              </span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function Avatar({ item }: { item: CollaboratorDraft }) {
  return (
    <span className="h-8 w-8 rounded-full overflow-hidden bg-foreground text-background grid place-items-center font-display text-xs shrink-0">
      {item.avatar_url ? (
        <img src={item.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        (item.full_name ?? item.username ?? "A").charAt(0)
      )}
    </span>
  );
}

const input =
  "w-full h-10 px-3 rounded-lg border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40 text-sm";
