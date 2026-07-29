import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paystack/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.replace(/^Bearer\s+/i, "").trim();
          if (!token) return new Response("Unauthorized", { status: 401 });

          const { data: u, error: uErr } = await supabaseAdmin.auth.getUser(token);
          if (uErr || !u.user) return new Response("Unauthorized", { status: 401 });
          const user = u.user;

          const { reference } = (await request.json()) as { reference?: string };
          if (!reference) return new Response("reference required", { status: 400 });

          const secret = process.env.PAYSTACK_SECRET_KEY;
          if (!secret) return new Response("Paystack not configured", { status: 500 });

          const res = await fetch(
            `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
            { headers: { Authorization: `Bearer ${secret}` } },
          );
          const payload = (await res.json()) as any;
          if (!res.ok || !payload?.status) {
            return new Response(JSON.stringify(payload), { status: 502 });
          }

          const data = payload.data;
          const meta = data?.metadata ?? {};
          if (meta.user_id !== user.id) {
            return new Response("Reference does not belong to user", { status: 403 });
          }

          if (data.status !== "success") {
            await supabaseAdmin
              .from("transactions" as any)
              .update({ status: "failed", description: `Failed — ${reference}` })
              .eq("user_id", user.id)
              .like("description", `%${reference}%`);
            return Response.json({ ok: false, status: data.status });
          }

          const planId = meta.plan_id as string;
          const periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: user.id,
              plan: planId,
              status: "active",
              current_period_end: periodEnd.toISOString(),
              cancel_at_period_end: false,
            },
            { onConflict: "user_id" },
          );
          await supabaseAdmin
            .from("profiles")
            .update({ is_pro: planId === "pro" || planId === "studio" })
            .eq("id", user.id);
          await supabaseAdmin
            .from("transactions" as any)
            .update({ status: "succeeded" })
            .eq("user_id", user.id)
            .like("description", `%${reference}%`);

          return Response.json({ ok: true, plan: planId });
        } catch (e: any) {
          return new Response(e?.message ?? "Error", { status: 500 });
        }
      },
    },
  },
});
