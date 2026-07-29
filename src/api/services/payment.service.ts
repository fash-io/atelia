import { toast } from "sonner";
import { authService } from "./auth.service";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const paymentService = {
    async verifyPayment(ref: string) {
        const access_token = authService.getCurrentSessionAccessToken()
        const res = await fetch('/api/public/paystack/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
            },
            body: JSON.stringify({ reference: ref }),
        });
        const j = await res.json().catch(() => ({}));
        return { j, res }

    },
    async initPayment({ access_token, planId }: { access_token: string, planId: string }) {
        try {
            const res = await fetch('/api/public/paystack/init', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${access_token}`,
                },
                body: JSON.stringify({
                    plan_id: planId,
                    callback_url: `${window.location.origin}/pricing`,
                }),
            });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Could not start payment');
            }
            const j = (await res.json()) as { authorization_url: string };
            // Paystack refuses to load inside an iframe (X-Frame-Options: DENY),
            // which causes a blank "refused to connect" page in the Lovable preview.
            // Break out of the iframe; fall back to a new tab if blocked.
            try {
                if (window.top && window.top !== window.self) {
                    window.top.location.href = j.authorization_url;
                } else {
                    window.location.href = j.authorization_url;
                }
            } catch {
                const popup = window.open(j.authorization_url, '_blank', 'noopener,noreferrer');
                if (!popup) {
                    toast.message('Click below to complete payment', {
                        description: 'Your browser blocked the redirect.',
                        action: {
                            label: 'Open Paystack',
                            onClick: () => window.open(j.authorization_url, '_blank', 'noopener,noreferrer'),
                        },
                    });
                }
            }
        } catch (e: any) {
            toast.error(e?.message ?? 'Could not start payment');
        }
    },
    async cancelSubscription(id: string) {
        const data = await authService.getCurrentUserIdAndAccessToken()
        const { access_token, user_id } = data!
        if (!user_id || !access_token) throw new Error("User not logged in")


        const { data: sub, error } = await supabase
            .from("subscriptions")
            .select('*')
            .eq("id", id)
            .single()


        if (error || !sub) throw new Error("Substription not found")

        if (!confirm("Cancel at the end of the current period? You'll keep Pro until then.")) return;
        await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: true })
            .eq('user_id', user_id);
        toast.success(
            'Subscription will end on ' +
            (sub.current_period_end
                ? format(new Date(sub.current_period_end), 'd MMM yyyy')
                : 'the period end'),
        );
    },
    async resumeSubscription() {
        const user_id = await authService.getCurrentUserId()
        if (!user_id) return;
        await supabase
            .from('subscriptions')
            .update({ cancel_at_period_end: false })
            .eq('user_id', user_id);
        toast.success('Subscription resumed');
    },
    async initSaveCard(access_token: string) {
        const res = await fetch('/api/public/card/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
            body: JSON.stringify({ callback_url: `${window.location.origin}/settings/billing` }),
        });
        if (!res.ok) throw new Error((await res.text()) || 'Could not start card verification');
        const j = (await res.json()) as { authorization_url: string };
        window.location.href = j.authorization_url;
    },

    async verifySaveCard(ref: string, access_token: string) {
        const res = await fetch('/api/public/card/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
            body: JSON.stringify({ reference: ref }),
        });
        const j = await res.json().catch(() => ({}));
        return { j, res };
    },
}
