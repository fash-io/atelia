import { supabase } from "@/integrations/supabase/client";

export const notificationService = {
    async getAll(user_id: string) {
        const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(200);
        if (error) throw error
        return data
    },
    async markRead(id: string) {
        const { error, success } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id)
        if (error) throw error
        return success
    },
    async markAllRead(user_id: string) {
        const { error, success } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user_id).is("read_at", null);
        if (error) throw error
        return success
    },
    async delete(id: string) {
        const { error, success } = await supabase.from("notifications").delete().eq("id", id);
        if (error) throw error
        return success
    },
}