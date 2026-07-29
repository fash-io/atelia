import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/card/init")({
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

                    const { callback_url } = (await request.json()) as { callback_url?: string };
                    const secret = process.env.PAYSTACK_SECRET_KEY;
                    if (!secret) return new Response("Paystack not configured", { status: 500 });

                    const res = await fetch("https://api.paystack.co/transaction/initialize", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
                        body: JSON.stringify({
                            email: user.email,
                            amount: 5000,
                            currency: "NGN",
                            channels: ["card"],
                            callback_url,
                            metadata: { purpose: "save_card", user_id: user.id },
                        }),
                    });
                    const payload = await res.json();
                    if (!res.ok || !payload?.status) {
                        return new Response(JSON.stringify(payload), { status: 502 });
                    }
                    return Response.json({ authorization_url: payload.data.authorization_url });
                } catch (e: any) {
                    return new Response(e?.message ?? "Error", { status: 500 });
                }
            },
        },
    },
});