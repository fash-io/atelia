import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Briefcase, CreditCard, FileText, LifeBuoy, Package, Shield, Star, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatNGN } from "@/lib/format";
import { format } from "date-fns";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Platform owner dashboard — Atelier" }] }),
  component: AdminPage,
});

type Profile = { id: string; full_name: string | null; username: string | null; is_pro: boolean; created_at: string; discipline: string | null };
type RoleRow = { user_id: string; role: "admin" | "moderator" | "user" };
type Sub = { user_id: string; plan: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean };
type Job = { id: string; title: string; user_id: string; status: string; created_at: string; views_count: number; is_featured: boolean };
type Content = { id: string; title: string; cover_url: string; user_id: string; likes_count: number; views_count: number; is_featured?: boolean; created_at: string; kind: "work" | "project" };
type Plan = { id: string; name: string; price_ngn: number; period: string; blurb: string; cta: string; features: string[]; highlight: boolean; is_active: boolean; sort_order: number };
type Ticket = { id: string; name: string; email: string; subject: string; body: string; category: string; status: string; priority: string; admin_notes: string | null; created_at: string };
type Tx = { id: string; user_id: string; plan: string; amount_ngn: number; status: string; created_at: string };

type TabKey = "analytics" | "users" | "plans" | "subs" | "jobs" | "content" | "tickets";

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabKey>("analytics");

  useEffect(() => { if (!loading && !user) navigate({ to: "/auth" }); }, [loading, user, navigate]);
  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle().then(({ data }) => setIsAdmin(Boolean(data)));
  }, [user]);

  if (!user || isAdmin === null) return <div className="px-5 py-20 text-center text-foreground/50">Loading…</div>;
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-5 py-20 text-center">
        <Shield className="h-10 w-10 mx-auto text-foreground/40" />
        <h1 className="display-lg mt-4">Platform owners only</h1>
        <p className="mt-3 text-foreground/65">Sign in with a platform owner account to manage users, plans, jobs, posted works, and case studies.</p>
        <Link to="/" className="mt-8 inline-block underline text-sm">Back home</Link>
      </div>
    );
  }

  const tabs: { k: TabKey; label: string; icon: any }[] = [
    { k: "analytics", label: "Analytics", icon: BarChart3 },
    { k: "users", label: "Users", icon: Users },
    { k: "plans", label: "Plans", icon: Package },
    { k: "subs", label: "Subscriptions", icon: CreditCard },
    { k: "jobs", label: "Job posts", icon: Briefcase },
    { k: "content", label: "Works & case studies", icon: FileText },
    { k: "tickets", label: "Support", icon: LifeBuoy },
  ];

  return (
    <div className="mx-auto max-w-350 px-5 lg:px-10 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Back home</Link>
      <p className="eyebrow">Super admin · CMS</p>
      <h1 className="display-lg mt-2">Platform owner dashboard</h1>
      <div className="mt-8 flex gap-1 border-b border-foreground/10 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`px-5 py-3 text-sm inline-flex items-center gap-2 relative whitespace-nowrap ${tab === t.k ? "text-foreground font-medium" : "text-foreground/55 hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" />{t.label}
            {tab === t.k && <span className="absolute -bottom-px left-2 right-2 h-0.5 bg-foreground" />}
          </button>
        ))}
      </div>
      <div className="py-10">
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "users" && <UsersTab currentId={user.id} />}
        {tab === "plans" && <PlansTab />}
        {tab === "subs" && <SubsTab />}
        {tab === "jobs" && <JobsTab />}
        {tab === "content" && <ContentTab />}
        {tab === "tickets" && <TicketsTab />}
      </div>
    </div>
  );
}

// =================== Analytics ===================
function AnalyticsTab() {
  const [data, setData] = useState<{
    users: number; pros: number; jobs: number; works: number; projects: number;
    tickets: number; revenue: number; txs: Tx[]; topWorks: Content[]; topProjects: Content[]; topAccounts: (Profile & { score: number })[];
    monthly: { month: string; total: number }[];
  } | null>(null);

  useEffect(() => {
    (async () => {
      const [{ count: users }, { count: pros }, { count: jobs }, { count: works }, { count: projects }, { count: tickets }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_pro", true),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase.from("works").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      const { data: txs } = await supabase.from("transactions" as any).select("*").order("created_at", { ascending: false }).limit(50);
      const txList = ((txs as any[]) ?? []) as Tx[];
      const revenue = txList.filter((t) => t.status === "succeeded").reduce((s, t) => s + (t.amount_ngn ?? 0), 0);

      const { data: tw } = await supabase.from("works").select("id,title,cover_url,user_id,likes_count,views_count,created_at").order("likes_count", { ascending: false }).limit(5);
      const { data: tp } = await supabase.from("projects").select("id,title,cover_url,user_id,likes_count,views_count,created_at").order("likes_count", { ascending: false }).limit(5);
      const { data: profs } = await supabase.from("profiles").select("id,full_name,username,is_pro,created_at,discipline").limit(500);

      // Build top accounts by aggregate views across their works+projects
      const wList = (tw ?? []) as any[]; const pList = (tp ?? []) as any[];
      const scoreMap = new Map<string, number>();
      for (const w of wList) scoreMap.set(w.user_id, (scoreMap.get(w.user_id) ?? 0) + (w.views_count ?? 0) + (w.likes_count ?? 0) * 3);
      for (const p of pList) scoreMap.set(p.user_id, (scoreMap.get(p.user_id) ?? 0) + (p.views_count ?? 0) + (p.likes_count ?? 0) * 3);
      const topAccounts = ((profs as Profile[]) ?? [])
        .map((p) => ({ ...p, score: scoreMap.get(p.id) ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Monthly revenue last 6 months
      const monthlyMap = new Map<string, number>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthlyMap.set(format(d, "MMM yyyy"), 0);
      }
      for (const t of txList) {
        if (t.status !== "succeeded") continue;
        const k = format(new Date(t.created_at), "MMM yyyy");
        if (monthlyMap.has(k)) monthlyMap.set(k, (monthlyMap.get(k) ?? 0) + (t.amount_ngn ?? 0));
      }
      const monthly = Array.from(monthlyMap.entries()).map(([month, total]) => ({ month, total }));

      setData({
        users: users ?? 0, pros: pros ?? 0, jobs: jobs ?? 0, works: works ?? 0, projects: projects ?? 0,
        tickets: tickets ?? 0, revenue, txs: txList,
        topWorks: wList.map((x) => ({ ...x, kind: "work" as const })),
        topProjects: pList.map((x) => ({ ...x, kind: "project" as const })),
        topAccounts, monthly,
      });
    })();
  }, []);

  if (!data) return <div className="text-foreground/55">Loading analytics…</div>;
  const maxMonthly = Math.max(1, ...data.monthly.map((m) => m.total));

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total revenue" value={formatNGN(data.revenue)} sub={`${data.txs.filter(t => t.status === "succeeded").length} transactions`} accent />
        <Metric label="Total users" value={data.users.toLocaleString()} sub={`${data.pros} Pro / ${data.users - data.pros} Free`} />
        <Metric label="Jobs posted" value={data.jobs.toLocaleString()} />
        <Metric label="Works & case studies" value={(data.works + data.projects).toLocaleString()} sub={`${data.works} works · ${data.projects} case studies`} />
        <Metric label="Open support tickets" value={data.tickets.toLocaleString()} sub="Needs response" />
      </div>

      <div className="rounded-2xl border border-foreground/10 p-6 bg-card">
        <p className="eyebrow">Revenue · last 6 months</p>
        <div className="mt-6 flex items-end gap-3 h-44">
          {data.monthly.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-[10px] text-foreground/55">{formatNGN(m.total)}</div>
              <div className="w-full bg-foreground rounded-t" style={{ height: `${(m.total / maxMonthly) * 100}%`, minHeight: m.total > 0 ? "4px" : "0" }} />
              <div className="text-[10px] text-foreground/55">{m.month}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-foreground/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between">
            <span className="font-medium text-sm">Recent transactions</span>
            <span className="text-xs text-foreground/55">{data.txs.length} latest</span>
          </div>
          {data.txs.length === 0 ? <div className="p-6 text-foreground/55 text-sm">No transactions yet.</div> : (
            <ul className="divide-y divide-foreground/5">
              {data.txs.slice(0, 8).map((t) => (
                <li key={t.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium capitalize">{t.plan} plan</div>
                    <div className="text-xs text-foreground/55">{format(new Date(t.created_at), "d MMM yyyy · HH:mm")} · {t.status}</div>
                  </div>
                  <div className="font-medium">{formatNGN(t.amount_ngn)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-foreground/10 overflow-hidden">
          <div className="px-5 py-3 border-b border-foreground/10 font-medium text-sm">Top accounts</div>
          {data.topAccounts.length === 0 ? <div className="p-6 text-foreground/55 text-sm">No data yet.</div> : (
            <ul className="divide-y divide-foreground/5">
              {data.topAccounts.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{a.full_name ?? a.username ?? "—"}</div>
                    <div className="text-xs text-foreground/55">@{a.username ?? "—"}{a.discipline ? ` · ${a.discipline}` : ""}</div>
                  </div>
                  <div className="text-xs text-foreground/60">{a.score.toLocaleString()} engagement</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopContentList title="Best performing works" items={data.topWorks} kind="work" />
        <TopContentList title="Best performing case studies" items={data.topProjects} kind="project" />
      </div>
    </div>
  );
}

function Metric({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 ${accent ? "bg-foreground text-background" : "border border-foreground/10 bg-card"}`}>
      <div className={`text-xs uppercase tracking-wider ${accent ? "text-background/60" : "text-foreground/55"}`}>{label}</div>
      <div className="font-display text-3xl mt-2">{value}</div>
      {sub && <div className={`text-xs mt-1 ${accent ? "text-background/65" : "text-foreground/55"}`}>{sub}</div>}
    </div>
  );
}

function TopContentList({ title, items, kind }: { title: string; items: Content[]; kind: "work" | "project" }) {
  return (
    <div className="rounded-2xl border border-foreground/10 overflow-hidden">
      <div className="px-5 py-3 border-b border-foreground/10 font-medium text-sm">{title}</div>
      {items.length === 0 ? <div className="p-6 text-foreground/55 text-sm">No data yet.</div> : (
        <ul className="divide-y divide-foreground/5">
          {items.map((it) => (
            <li key={it.id} className="px-5 py-3 flex items-center gap-3">
              <img src={it.cover_url} alt="" className="h-10 w-10 rounded-lg object-cover bg-foreground/5" />
              <div className="flex-1 min-w-0">
                <Link to={kind === "work" ? "/works/$workId" : "/projects/$projectId" as any} params={kind === "work" ? { workId: it.id } : { projectId: it.id } as any} className="text-sm font-medium hover:underline truncate block">{it.title}</Link>
                <div className="text-xs text-foreground/55">{it.likes_count} likes · {it.views_count} views</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// =================== Users ===================
function UsersTab({ currentId }: { currentId: string }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [q, setQ] = useState("");
  async function load() {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, username, is_pro, created_at, discipline").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    setProfiles((p as Profile[]) ?? []); setRoles((r as RoleRow[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  const filtered = profiles.filter((p) => ((p.full_name ?? "") + " " + (p.username ?? "")).toLowerCase().includes(q.toLowerCase()));
  const rolesOf = (id: string) => roles.filter((r) => r.user_id === id).map((r) => r.role);
  async function toggleRole(userId: string, role: "moderator" | "admin") {
    const has = rolesOf(userId).includes(role);
    const { error } = has ? await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role) : await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) return toast.error(error.message);
    toast.success(has ? `Removed ${role}` : `Granted ${role}`); load();
  }
  async function togglePro(p: Profile) {
    const { error } = await supabase.from("profiles").update({ is_pro: !p.is_pro }).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(p.is_pro ? "Pro removed" : "Pro granted"); load();
  }
  return (
    <TableWrap search={q} setSearch={setQ} placeholder="Search users…">
      <table className="w-full text-sm">
        <Head cols={["User", "Joined", "Plan", "Roles", "Actions"]} />
        <tbody className="divide-y divide-foreground/5">
          {filtered.map((p) => {
            const rs = rolesOf(p.id);
            return (
              <tr key={p.id}>
                <td className="px-4 py-3"><div className="font-medium">{p.full_name ?? p.username ?? "Unnamed"}</div><div className="text-xs text-foreground/55">@{p.username ?? "—"}{p.discipline ? ` · ${p.discipline}` : ""}</div></td>
                <td className="px-4 py-3 text-foreground/60">{format(new Date(p.created_at), "d MMM yyyy")}</td>
                <td className="px-4 py-3">{p.is_pro ? <span className="lime-pill">Pro</span> : <span className="text-foreground/55">Free</span>}</td>
                <td className="px-4 py-3">{rs.length ? rs.map((r) => <span key={r} className="mr-1 inline-flex h-5 px-2 items-center rounded-full bg-foreground/10 text-[10px] uppercase tracking-wider">{r}</span>) : <span className="text-foreground/45">—</span>}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => togglePro(p)}>{p.is_pro ? "Remove Pro" : "Grant Pro"}</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleRole(p.id, "moderator")}>{rs.includes("moderator") ? "Unmod" : "Mod"}</Button>
                    {p.id !== currentId && <Button size="sm" variant="ghost" onClick={() => toggleRole(p.id, "admin")}>{rs.includes("admin") ? "Revoke admin" : "Make admin"}</Button>}
                    {p.id === currentId && <span className="text-xs text-foreground/45 self-center">You</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}

// =================== Plans ===================
function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Plan | null>(null);
  async function load() {
    const { data } = await supabase.from("plans" as any).select("*").order("sort_order", { ascending: true });
    setPlans(((data as any[]) ?? []) as Plan[]);
  }
  useEffect(() => { load(); }, []);

  async function save(p: Plan) {
    const payload: any = { name: p.name, price_ngn: Number(p.price_ngn) || 0, period: p.period, blurb: p.blurb, cta: p.cta, features: p.features, highlight: p.highlight, is_active: p.is_active, sort_order: p.sort_order };
    const exists = plans.find((x) => x.id === p.id);
    const { error } = exists
      ? await supabase.from("plans" as any).update(payload).eq("id", p.id)
      : await supabase.from("plans" as any).insert({ id: p.id, ...payload });
    if (error) return toast.error(error.message);
    toast.success("Plan saved"); setEditing(null); load();
  }
  async function remove(id: string) {
    if (!confirm(`Delete plan "${id}"? Existing subscribers won't be affected.`)) return;
    const { error } = await supabase.from("plans" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Plan deleted"); load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-foreground/60">Plans are stored in Naira and shown live on the pricing page.</p>
        <Button onClick={() => setEditing({ id: "", name: "", price_ngn: 0, period: "per month", blurb: "", cta: "Choose plan", features: [], highlight: false, is_active: true, sort_order: (plans.at(-1)?.sort_order ?? 0) + 1 })}>Add plan</Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`rounded-2xl border ${p.highlight ? "border-foreground" : "border-foreground/10"} p-6 bg-card`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/55">{p.id}</div>
                <h3 className="font-display text-2xl mt-1">{p.name}</h3>
              </div>
              {!p.is_active && <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-foreground/10">Hidden</span>}
            </div>
            <div className="mt-3 font-display text-3xl">{formatNGN(p.price_ngn)}<span className="text-sm text-foreground/55 font-normal"> / {p.period}</span></div>
            <p className="text-sm text-foreground/60 mt-2">{p.blurb}</p>
            <ul className="mt-4 text-xs text-foreground/65 space-y-1">
              {p.features.slice(0, 4).map((f) => <li key={f}>· {f}</li>)}
              {p.features.length > 4 && <li className="text-foreground/45">+ {p.features.length - 4} more</li>}
            </ul>
            <div className="mt-5 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(p)}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
      {editing && <PlanEditor plan={editing} isNew={!plans.find((x) => x.id === editing.id)} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function PlanEditor({ plan, isNew, onClose, onSave }: { plan: Plan; isNew: boolean; onClose: () => void; onSave: (p: Plan) => void }) {
  const [f, setF] = useState<Plan>(plan);
  const [featuresText, setFeaturesText] = useState(plan.features.join("\n"));
  function submit() {
    const features = featuresText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!f.id.trim() || !f.name.trim()) return toast.error("ID and name are required");
    onSave({ ...f, features });
  }
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-background rounded-3xl max-w-lg w-full p-7 shadow-(--shadow-lift)" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-2xl">{isNew ? "New plan" : `Edit ${plan.name}`}</h2>
        <div className="mt-5 space-y-3">
          <Field label="Plan ID (e.g. pro)"><input className={inp} value={f.id} disabled={!isNew} onChange={(e) => setF({ ...f, id: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })} /></Field>
          <Field label="Name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₦)"><input type="number" className={inp} value={f.price_ngn} onChange={(e) => setF({ ...f, price_ngn: Number(e.target.value) })} /></Field>
            <Field label="Period"><input className={inp} value={f.period} onChange={(e) => setF({ ...f, period: e.target.value })} /></Field>
          </div>
          <Field label="Blurb"><textarea rows={2} className={inp + " py-2"} value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} /></Field>
          <Field label="CTA label"><input className={inp} value={f.cta} onChange={(e) => setF({ ...f, cta: e.target.value })} /></Field>
          <Field label="Features (one per line)"><textarea rows={5} className={inp + " py-2"} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Sort order"><input type="number" className={inp} value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></Field>
            <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={f.highlight} onChange={(e) => setF({ ...f, highlight: e.target.checked })} /> Highlighted</label>
            <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={f.is_active} onChange={(e) => setF({ ...f, is_active: e.target.checked })} /> Active</label>
          </div>
        </div>
        <div className="mt-7 flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit}>Save plan</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium uppercase tracking-wider text-foreground/55 mb-2">{label}</span>{children}</label>;
}
const inp = "w-full h-11 px-4 rounded-xl border border-foreground/10 bg-background focus:outline-none focus:border-foreground/40";

// =================== Subscriptions ===================
function SubsTab() {
  const [subs, setSubs] = useState<(Sub & { profile?: { full_name: string | null; username: string | null } })[]>([]);
  async function load() {
    const { data } = await supabase.from("subscriptions").select("*").order("current_period_end", { ascending: false }).limit(500);
    const ss = (data as Sub[]) ?? [];
    const ids = [...new Set(ss.map((s) => s.user_id))];
    const { data: ps } = ids.length ? await supabase.from("profiles").select("id, full_name, username").in("id", ids) : { data: [] as any[] };
    const map = new Map((ps ?? []).map((p: any) => [p.id, p]));
    setSubs(ss.map((s) => ({ ...s, profile: map.get(s.user_id) })));
  }
  useEffect(() => { load(); }, []);
  async function setPlan(s: Sub, plan: string) {
    const { error: e1 } = await supabase.from("subscriptions").update({ plan, status: "active", cancel_at_period_end: false }).eq("user_id", s.user_id);
    const { error: e2 } = await supabase.from("profiles").update({ is_pro: plan !== "free" }).eq("id", s.user_id);
    if (e1 || e2) return toast.error((e1 ?? e2)!.message);
    toast.success(`Plan set to ${plan}`); load();
  }
  async function cancelAtEnd(s: Sub) {
    const { error } = await supabase.from("subscriptions").update({ cancel_at_period_end: !s.cancel_at_period_end }).eq("user_id", s.user_id);
    if (error) return toast.error(error.message);
    toast.success(s.cancel_at_period_end ? "Will renew" : "Will cancel at period end"); load();
  }
  return (
    <TableWrap>
      <table className="w-full text-sm">
        <Head cols={["User", "Plan", "Renews / ends", "Status", "Set plan", ""]} />
        <tbody className="divide-y divide-foreground/5">
          {subs.map((s) => (
            <tr key={s.user_id}>
              <td className="px-4 py-3"><div className="font-medium">{s.profile?.full_name ?? s.profile?.username ?? "—"}</div><div className="text-xs text-foreground/55">@{s.profile?.username ?? "—"}</div></td>
              <td className="px-4 py-3 capitalize">{s.plan}</td>
              <td className="px-4 py-3">{s.current_period_end ? format(new Date(s.current_period_end), "d MMM yyyy") : "—"}</td>
              <td className="px-4 py-3">{s.cancel_at_period_end ? "Cancelling" : s.status}</td>
              <td className="px-4 py-3"><div className="inline-flex gap-1">{(["free", "pro", "studio"] as const).map((p) => <Button key={p} size="sm" variant={s.plan === p ? "outline" : "ghost"} onClick={() => setPlan(s, p)} disabled={s.plan === p}>{p}</Button>)}</div></td>
              <td className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => cancelAtEnd(s)}>{s.cancel_at_period_end ? "Undo cancel" : "Cancel"}</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

// =================== Jobs ===================
function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  async function load() {
    const { data } = await supabase.from("jobs").select("id, title, user_id, status, created_at, views_count, is_featured").order("created_at", { ascending: false }).limit(500);
    setJobs((data as Job[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  async function setStatus(j: Job, status: string) {
    const { error } = await supabase.from("jobs").update({ status }).eq("id", j.id);
    if (error) return toast.error(error.message);
    toast.success(`Job ${status}`); load();
  }
  async function feature(j: Job) {
    const { error } = await supabase.from("jobs").update({ is_featured: !j.is_featured }).eq("id", j.id);
    if (error) return toast.error(error.message);
    load();
  }
  async function remove(j: Job) {
    if (!confirm(`Delete job "${j.title}"?`)) return;
    const { error } = await supabase.from("jobs").delete().eq("id", j.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }
  return (
    <TableWrap>
      <table className="w-full text-sm">
        <Head cols={["Job", "Status", "Views", "Posted", "Actions"]} />
        <tbody className="divide-y divide-foreground/5">
          {jobs.map((j) => (
            <tr key={j.id}>
              <td className="px-4 py-3"><Link to="/jobs/$jobId" params={{ jobId: j.id }} className="font-medium hover:underline">{j.title}</Link>{j.is_featured && <span className="ml-2 lime-pill">Featured</span>}</td>
              <td className="px-4 py-3 capitalize">{j.status}</td>
              <td className="px-4 py-3">{j.views_count}</td>
              <td className="px-4 py-3">{format(new Date(j.created_at), "d MMM yyyy")}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => feature(j)}><Star className="h-3.5 w-3.5" />{j.is_featured ? "Unfeature" : "Feature"}</Button>
                  <Button size="sm" variant="outline" onClick={() => setStatus(j, j.status === "closed" ? "open" : "closed")}>{j.status === "closed" ? "Reopen" : "Close"}</Button>
                  <button onClick={() => remove(j)} className="h-8 w-8 grid place-items-center rounded-full text-foreground/45 hover:text-destructive hover:bg-destructive/5"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

// =================== Works & projects ===================
function ContentTab() {
  const [items, setItems] = useState<Content[]>([]);
  async function load() {
    const [{ data: w }, { data: p }] = await Promise.all([
      supabase.from("works").select("id, title, cover_url, user_id, likes_count, views_count, is_featured, created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("projects").select("id, title, cover_url, user_id, likes_count, views_count, created_at").order("created_at", { ascending: false }).limit(200),
    ]);
    setItems([...(w ?? []).map((x: any) => ({ ...x, kind: "work" as const })), ...(p ?? []).map((x: any) => ({ ...x, kind: "project" as const }))].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
  }
  useEffect(() => { load(); }, []);
  async function remove(item: Content) {
    if (!confirm(`Delete ${item.kind} "${item.title}"?`)) return;
    const { error } = await supabase.from(item.kind === "work" ? "works" : "projects").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }
  async function feature(item: Content) {
    if (item.kind !== "work") return;
    const { error } = await supabase.from("works").update({ is_featured: !item.is_featured }).eq("id", item.id);
    if (error) return toast.error(error.message);
    load();
  }
  return (
    <TableWrap>
      <table className="w-full text-sm">
        <Head cols={["Content", "Type", "Stats", "Posted", "Actions"]} />
        <tbody className="divide-y divide-foreground/5">
          {items.map((item) => (
            <tr key={`${item.kind}-${item.id}`}>
              <td className="px-4 py-3"><Link to={item.kind === "work" ? "/works/$workId" : "/projects/$projectId" as any} params={item.kind === "work" ? { workId: item.id } : { projectId: item.id } as any} className="font-medium hover:underline">{item.title}</Link>{item.is_featured && <span className="ml-2 lime-pill">Featured</span>}</td>
              <td className="px-4 py-3 capitalize">{item.kind}</td>
              <td className="px-4 py-3">{item.likes_count} likes · {item.views_count} views</td>
              <td className="px-4 py-3">{format(new Date(item.created_at), "d MMM yyyy")}</td>
              <td className="px-4 py-3 text-right">
                <div className="inline-flex gap-1">
                  {item.kind === "work" && <Button size="sm" variant="outline" onClick={() => feature(item)}><Star className="h-3.5 w-3.5" /> {item.is_featured ? "Unfeature" : "Feature"}</Button>}
                  <button onClick={() => remove(item)} className="h-8 w-8 grid place-items-center rounded-full text-foreground/45 hover:text-destructive hover:bg-destructive/5"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

// =================== Support tickets ===================
function TicketsTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<string>("all");
  async function load() {
    const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(200);
    setTickets((data as Ticket[]) ?? []);
  }
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => filter === "all" ? tickets : tickets.filter((t) => t.status === filter), [tickets, filter]);

  async function setStatus(t: Ticket, status: string) {
    const { error } = await supabase.from("support_tickets").update({ status }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${status}`); load(); if (active?.id === t.id) setActive({ ...t, status });
  }
  async function saveNotes(t: Ticket, notes: string) {
    const { error } = await supabase.from("support_tickets").update({ admin_notes: notes }).eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Notes saved"); load();
  }
  async function remove(t: Ticket) {
    if (!confirm(`Delete ticket "${t.subject}"?`)) return;
    const { error } = await supabase.from("support_tickets").delete().eq("id", t.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); setActive(null); load();
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`h-9 px-4 text-sm rounded-full border ${filter === s ? "bg-foreground text-background border-foreground" : "border-foreground/15 hover:border-foreground/40"}`}>{s.replace("_", " ")}</button>
        ))}
      </div>
      <TableWrap>
        <table className="w-full text-sm">
          <Head cols={["Subject", "From", "Category", "Status", "Submitted", "Actions"]} />
          <tbody className="divide-y divide-foreground/5">
            {filtered.map((t) => (
              <tr key={t.id} className="cursor-pointer hover:bg-foreground/2" onClick={() => setActive(t)}>
                <td className="px-4 py-3"><div className="font-medium">{t.subject}</div><div className="text-xs text-foreground/55 line-clamp-1">{t.body}</div></td>
                <td className="px-4 py-3">{t.name}<div className="text-xs text-foreground/55">{t.email}</div></td>
                <td className="px-4 py-3 capitalize">{t.category}</td>
                <td className="px-4 py-3 capitalize">{t.status.replace("_", " ")}</td>
                <td className="px-4 py-3">{format(new Date(t.created_at), "d MMM yyyy")}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => remove(t)} className="h-8 w-8 grid place-items-center rounded-full text-foreground/45 hover:text-destructive hover:bg-destructive/5"><Trash2 className="h-3.5 w-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {active && <TicketDrawer ticket={active} onClose={() => setActive(null)} onStatus={setStatus} onSaveNotes={saveNotes} />}
    </div>
  );
}

function TicketDrawer({ ticket, onClose, onStatus, onSaveNotes }: { ticket: Ticket; onClose: () => void; onStatus: (t: Ticket, s: string) => void; onSaveNotes: (t: Ticket, n: string) => void }) {
  const [notes, setNotes] = useState(ticket.admin_notes ?? "");
  useEffect(() => { setNotes(ticket.admin_notes ?? ""); }, [ticket.id]);
  return (
    <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-lg bg-background overflow-y-auto p-7 shadow-(--shadow-lift)" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="eyebrow">Ticket</p>
          <button onClick={onClose} className="text-foreground/55 hover:text-foreground">Close</button>
        </div>
        <h2 className="font-display text-2xl mt-2">{ticket.subject}</h2>
        <div className="mt-1 text-sm text-foreground/60">{ticket.name} · {ticket.email}</div>
        <div className="mt-1 text-xs text-foreground/50">{format(new Date(ticket.created_at), "d MMM yyyy · HH:mm")} · {ticket.category} · {ticket.priority} priority</div>
        <div className="mt-6 rounded-xl bg-foreground/4 p-4 text-sm whitespace-pre-wrap">{ticket.body}</div>
        <div className="mt-6">
          <p className="eyebrow">Internal admin notes</p>
          <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full mt-2 rounded-xl border border-foreground/10 bg-background p-3 text-sm" placeholder="Notes visible to admins only…" />
          <div className="mt-2 flex justify-end"><Button size="sm" variant="outline" onClick={() => onSaveNotes(ticket, notes)}>Save notes</Button></div>
        </div>
        <div className="mt-8">
          <p className="eyebrow">Update status</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["open", "in_progress", "resolved", "closed"].map((s) => (
              <Button key={s} size="sm" variant={ticket.status === s ? "default" : "outline"} onClick={() => onStatus(ticket, s)} disabled={ticket.status === s}>{s.replace("_", " ")}</Button>
            ))}
          </div>
        </div>
        <p className="mt-8 text-xs text-foreground/45">Reply directly via email at <a href={`mailto:${ticket.email}?subject=Re: ${encodeURIComponent(ticket.subject)}`} className="underline">{ticket.email}</a>.</p>
      </aside>
    </div>
  );
}

// =================== shared ===================
function TableWrap({ children, search, setSearch, placeholder }: { children: React.ReactNode; search?: string; setSearch?: (v: string) => void; placeholder?: string }) {
  return <div>{setSearch && <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={placeholder} className="w-full max-w-sm h-11 px-4 rounded-full border border-foreground/10 bg-background mb-6" />}<div className="rounded-2xl border border-foreground/10 overflow-auto">{children}</div></div>;
}
function Head({ cols }: { cols: string[] }) { return <thead className="bg-foreground/3 text-left"><tr>{cols.map((c, i) => <th key={c || `col-${i}`} className={`px-4 py-3 font-medium ${i === cols.length - 1 ? "text-right" : ""}`}>{c}</th>)}</tr></thead>; }
