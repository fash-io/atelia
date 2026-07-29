import { supabase } from "@/integrations/supabase/client";
import { authService } from "./auth.service";

export const profileService = {
    async getMine(): Promise<Profile | null> {
        const userId = await authService.getCurrentUserId()
        if (!userId) throw new Error("User not Logged in")
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
        if (error) throw error;
        return data as Profile | null;
    },

    async getByUsername(username: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .maybeSingle();
        if (error) throw error;
        return data as Profile | null;
    },

    async update(userId: string, payload: UpdateProfile): Promise<Profile> {
        const cleaned = {
            ...payload,
            website: payload.website || null,
            instagram: payload.instagram || null,
            behance: payload.behance || null,
            dribbble: payload.dribbble || null,
            linkedin: payload.linkedin || null,
            twitter: payload.twitter || null,
        };
        const { data, error } = await supabase
            .from("profiles")
            .update(cleaned)
            .eq("id", userId)
            .select()
            .single();
        if (error) throw error;
        return data as Profile;
    },

    async updateAvatar(userId: string, avatarUrl: string): Promise<void> {
        const { error } = await supabase
            .from("profiles")
            .update({ avatar_url: avatarUrl })
            .eq("id", userId);
        if (error) throw error;
    },
};