import { supabase } from "@/integrations/supabase/client";
import { authService } from "./auth.service";

export const serviceService = {
    async getByUser(userId: string): Promise<Service[]> {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', userId)
            .eq('is_visible', true)
            .order('sort_order', { ascending: true })
        if (error) throw error;
        return (data as Service[]) ?? [];
    },
    async getMine(): Promise<Service[]> {
        const userId = await authService.getCurrentUserId()
        if (!userId) throw new Error('Not Logged in')

        const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("user_id", userId)
            .order("sort_order", { ascending: true });
        if (error) throw error;
        return (data as Service[]) ?? [];
    },

    async create(payload: NewService): Promise<void> {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
    },

    async update(id: string, payload: UpdateService): Promise<void> {
        const { error } = await supabase.from("services").update(payload).eq("id", id);
        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from("services").delete().eq("id", id);
        if (error) throw error;
    },

    async toggleVisibility(id: string, isVisible: boolean): Promise<void> {
        const { error } = await supabase.from("services").update({ is_visible: isVisible }).eq("id", id);
        if (error) throw error;
    },

    async swapOrder(a: { id: string; sort_order: number }, b: { id: string; sort_order: number }): Promise<void> {
        const { error: e1 } = await supabase.from("services").update({ sort_order: b.sort_order }).eq("id", a.id);
        if (e1) throw e1;
        const { error: e2 } = await supabase.from("services").update({ sort_order: a.sort_order }).eq("id", b.id);
        if (e2) throw e2;
    },
};