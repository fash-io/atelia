import { supabase } from "@/integrations/supabase/client";
import { authService } from "./auth.service";


export const planService = {
    async getPlan(id: string): Promise<Plan | null> {
        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single()

        return plan
    },
    async getPlans(): Promise<Plan[] | null> {
        const { data: pls } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        return pls
    },

    async getUserPlan(): Promise<{ s: Sub | null; isPro: boolean; plan: Plan | null } | null> {
        const user_id = await authService.getCurrentUserId();
        if (!user_id) return null;

        const [{ data: s }, { data: p }] = await Promise.all([
            supabase.from('subscriptions').select('*').eq('user_id', user_id).maybeSingle(),
            supabase.from('profiles').select('is_pro').eq('id', user_id).maybeSingle(),
        ]);

        const isPro = p?.is_pro ?? false;
        const planId = s?.plan ?? (isPro ? 'pro' : 'free');

        const { data: plan } = await supabase
            .from('plans')
            .select('*')
            .eq('id', planId)
            .eq('is_active', true)
            .maybeSingle();

        return { s: s ?? null, isPro, plan: plan ?? null };
    },

    async choosePlan(id: string) {
        const data = await authService.getCurrentUserIdAndAccessToken();
        const { access_token, user_id } = data ?? {};
        if (!user_id || !access_token) throw new Error('User not logged in');

        const plan = await this.getPlan(id);
        if (!plan) throw new Error('Plan not found');

        if (plan.price_ngn > 0) {
            throw new Error('choosePlan only handles free plans — use paymentService.initPayment for paid plans');
        }

        await supabase.from('subscriptions').upsert(
            {
                user_id,
                plan: 'free',
                status: 'active',
                current_period_end: null,
                cancel_at_period_end: false,
            },
            { onConflict: 'user_id' },
        );
        return plan;
    },

}