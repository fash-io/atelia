import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/paystack/init")({
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

          const body = (await request.json()) as { plan_id?: string; callback_url?: string };
          if (!body.plan_id) return new Response("plan_id required", { status: 400 });

          const { data: plan, error: pErr } = await supabaseAdmin
            .from("plans" as any)
            .select("*")
            .eq("id", body.plan_id)
            .eq("is_active", true)
            .maybeSingle();
          if (pErr || !plan) return new Response("Plan not found", { status: 404 });

          const amountNgn = (plan as any).price_ngn as number;
          if (!amountNgn || amountNgn <= 0) {
            return new Response("Plan has no price", { status: 400 });
          }

          const secret = process.env.PAYSTACK_SECRET_KEY;
          if (!secret) return new Response("Paystack not configured", { status: 500 });

          const reference = `atl_${user.id.slice(0, 8)}_${Date.now()}`;

          const res = await fetch("https://api.paystack.co/transaction/initialize", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${secret}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              amount: amountNgn * 100, // kobo
              currency: "NGN",
              reference,
              callback_url: body.callback_url,
              metadata: { user_id: user.id, plan_id: body.plan_id },
            }),
          });
          const payload = (await res.json()) as any;
          if (!res.ok || !payload?.status) {
            return new Response(JSON.stringify(payload), { status: 502 });
          }

          // Log pending transaction
          await supabaseAdmin.from("transactions" as any).insert({
            user_id: user.id,
            plan: body.plan_id,
            amount_ngn: amountNgn,
            status: "pending",
            description: `${(plan as any).name} — ref ${reference}`,
          });

          return Response.json({
            authorization_url: payload.data.authorization_url,
            reference: payload.data.reference,
          });
        } catch (e: any) {
          return new Response(e?.message ?? "Error", { status: 500 });
        }
      },
    },
  },
});
