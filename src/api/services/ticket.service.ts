import { supabase } from "@/integrations/supabase/client"
import { Ticket } from "../types/ticket"
import { authService } from "./auth.service"

export const tciketService = {
    async getAll() {
        const { data, error } = await supabase.from('support_tickets')
            .select('*')
            .order('created_at', { ascending: true })

        return { data, error }
    },
    async getPending() {
        const { data, error } = await supabase.from('support_tickets')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: true })

        return { error, data }
    },

    async createTicket(t: Ticket) {
        const user_id = await authService.getCurrentUserId()
        if (!user_id) throw new Error("Log in")

        const { error } = await supabase.from('support_tickets').insert({
            ...t,
            user_id
        })

        return error
    },

}