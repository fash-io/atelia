import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/card/verify")({
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
                    const payload = await res.json();
                    if (!res.ok || !payload?.status) {
                        return new Response(JSON.stringify(payload), { status: 502 });
                    }

                    const data = payload.data;
                    if (data?.metadata?.user_id !== user.id) {
                        return new Response("Reference does not belong to user", { status: 403 });
                    }
                    if (data.status !== "success") {
                        return Response.json({ ok: false, status: data.status });
                    }

                    const authz = data.authorization;
                    if (!authz?.reusable) {
                        return Response.json({ ok: false, status: "not_reusable" });
                    }

                    const { count } = await supabaseAdmin
                        .from("billing_methods")
                        .select("*", { count: "exact", head: true })
                        .eq("user_id", user.id);
                    const hasExisting = (count ?? 0) > 0;

                    if (hasExisting) {
                        await supabaseAdmin.from("billing_methods").update({ is_default: false }).eq("user_id", user.id);
                    }

                    await supabaseAdmin.from("billing_methods").insert({
                        user_id: user.id,
                        brand: authz.card_type ?? authz.brand ?? "Card",
                        last4: authz.last4,
                        exp_month: Number(authz.exp_month),
                        exp_year: Number(authz.exp_year),
                        cardholder: data.customer?.first_name
                            ? `${data.customer.first_name} ${data.customer.last_name ?? ""}`.trim()
                            : null,
                        is_default: true,
                        // authorization_code: authz.authorization_code,
                    });

                    await fetch("https://api.paystack.co/refund", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ transaction: reference }),
                    }).catch(() => { });

                    return Response.json({ ok: true });
                } catch (e: any) {
                    return new Response(e?.message ?? "Error", { status: 500 });
                }
            },
        },
    },
});