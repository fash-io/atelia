import { supabase } from "@/integrations/supabase/client";

export type Card = {
    id: string;
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    cardholder: string | null;
    is_default: boolean;
};

export const billingService = {
    async getCards(userId: string): Promise<Card[]> {
        // authorization_code deliberately excluded — never fetched into the client
        const { data, error } = await supabase
            .from("billing_methods")
            .select("id, brand, last4, exp_month, exp_year, cardholder, is_default")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data as Card[]) ?? [];
    },

    async makeDefault(userId: string, cardId: string): Promise<void> {
        const { error: e1 } = await supabase.from("billing_methods").update({ is_default: false }).eq("user_id", userId);
        if (e1) throw e1;
        const { error: e2 } = await supabase.from("billing_methods").update({ is_default: true }).eq("id", cardId);
        if (e2) throw e2;
    },

    async removeCard(cardId: string): Promise<void> {
        const { error } = await supabase.from("billing_methods").delete().eq("id", cardId);
        if (error) throw error;
    },
};