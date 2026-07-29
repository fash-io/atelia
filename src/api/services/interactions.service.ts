import { supabase } from "@/integrations/supabase/client";
import { authService } from "./auth.service";


export const interactionService = {
    async attachToWorks<T extends { id: string }>(
        items: T[],
        targetType: string = 'work',
    ): Promise<(T & { is_liked: boolean; is_bookmarked: boolean })[]> {
        if (items.length === 0) return [];

        const user_id = await authService.getCurrentUserId();
        if (!user_id) {
            return items.map(w => ({ ...w, is_liked: false, is_bookmarked: false }));
        }

        const ids = items.map(w => w.id);

        const [{ data: likes, error: likesError }, { data: favs, error: favsError }] = await Promise.all([
            supabase.from('likes').select('target_id')
                .eq('user_id', user_id).eq('target_type', targetType).in('target_id', ids),
            supabase.from('favorites').select('target_id')
                .eq('user_id', user_id).eq('target_type', targetType).in('target_id', ids),
        ]);

        if (likesError) throw likesError;
        if (favsError) throw favsError;

        const likedIds = new Set((likes ?? []).map(l => l.target_id));
        const bookmarkedIds = new Set((favs ?? []).map(f => f.target_id));

        return items.map(w => ({
            ...w,
            is_liked: likedIds.has(w.id),
            is_bookmarked: bookmarkedIds.has(w.id),
        }));
    },

    async attachToOne<T extends { id: string }>(item: T, targetType: string = 'work') {
        const [withInteractions] = await this.attachToWorks([item], targetType);
        return withInteractions;
    },

    async like({ id, targetType = 'work' }: { id: string; targetType?: string }) {
        const user_id = await authService.getCurrentUserIdOrThrow();
        const { error } = await supabase.from('likes')
            .insert({ user_id, target_type: targetType, target_id: id });
        if (error) throw error;
    },

    async unlike({ id, targetType = 'work' }: { id: string; targetType?: string }) {
        const user_id = await authService.getCurrentUserIdOrThrow();
        const { error } = await supabase.from('likes')
            .delete()
            .eq('user_id', user_id).eq('target_type', targetType).eq('target_id', id);
        if (error) throw error;
    },

    async bookmark({ id, targetType = 'work' }: { id: string; targetType?: string }) {
        const user_id = await authService.getCurrentUserIdOrThrow();
        const { error } = await supabase.from('favorites')
            .insert({ user_id, target_type: targetType, target_id: id });
        if (error) throw error;
    },

    async unbookmark({ id, targetType = 'work' }: { id: string; targetType?: string }) {
        const user_id = await authService.getCurrentUserIdOrThrow();
        const { error } = await supabase.from('favorites')
            .delete()
            .eq('user_id', user_id).eq('target_type', targetType).eq('target_id', id);
        if (error) throw error;
    },
};