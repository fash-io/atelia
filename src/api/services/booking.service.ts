import { supabase } from "@/integrations/supabase/client";
import { authService } from "./auth.service";

export const bookingService = {
    async getForUser(userId: string): Promise<{ bookings: Booking[]; participants: Map<string, string> }> {
        const { data: b, error } = await supabase
            .from("bookings")
            .select("*")
            .or(`client_id.eq.${userId},creative_id.eq.${userId}`)
            .order("scheduled_at", { ascending: true });
        if (error) throw error;

        const bookings = (b as Booking[]) ?? [];
        const ids = [...new Set(bookings.flatMap(x => [x.client_id, x.creative_id]).filter(id => id !== userId))];

        let participants = new Map<string, string>();
        if (ids.length) {
            const { data: ps, error: pErr } = await supabase
                .from("profiles")
                .select("id, full_name, username")
                .in("id", ids);
            if (pErr) throw pErr;
            participants = new Map((ps ?? []).map(x => [x.id, x.full_name ?? x.username ?? "Atelier user"]));
        }

        return { bookings, participants };
    },

    async setStatus(id: string, status: string): Promise<void> {
        const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
        if (error) throw error;
    },

    async reschedule(id: string, scheduledAt: string): Promise<void> {
        const { error } = await supabase
            .from("bookings")
            .update({ scheduled_at: scheduledAt, status: "rescheduled" })
            .eq("id", id);
        if (error) throw error;
    },

    async book(b: NewBooking) {
        const userId = await authService.getCurrentUserId()
        if (!userId) throw new Error("User not Logged in")

        const { data, error } = await supabase.from('bookings').insert({
            client_id: userId,
            creative_id: b.creative_id,
            service_id: b.service_id || null,
            title: b.title.trim(),
            notes: b.notes?.trim() || null,
            scheduled_at: b.scheduled_at.toString(),
            duration_minutes: b.duration_minutes,
        });

        if (error) throw error
    }
};