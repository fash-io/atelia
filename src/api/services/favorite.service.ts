import { supabase } from "@/integrations/supabase/client";

export const favoritesService = {
    async getFavoriteItems(userId: string): Promise<FavoriteItem[]> {
        const { data: favs, error } = await supabase
            .from("favorites")
            .select("target_type, target_id")
            .eq("user_id", userId);
        if (error) throw error;
        if (!favs || favs.length === 0) return [];

        const workIds = favs.filter(f => f.target_type === "work").map(f => f.target_id);
        const projectIds = favs.filter(f => f.target_type === "project").map(f => f.target_id);

        const [{ data: works, error: workError }, { data: projects, error: projectError }] = await Promise.all([
            workIds.length
                ? supabase.from("works").select("id, title, cover_url, discipline").in("id", workIds)
                : Promise.resolve({ data: [] as any[], error: null }),
            projectIds.length
                ? supabase.from("projects").select("id, title, cover_url, discipline").in("id", projectIds)
                : Promise.resolve({ data: [] as any[], error: null }),
        ]);
        if (workError) throw workError;
        if (projectError) throw projectError;

        return [
            ...(works ?? []).map((w): FavoriteItem => ({
                id: w.id,
                type: "work",
                title: w.title,
                cover: w.cover_url,
                discipline: w.discipline,
            })),
            ...(projects ?? []).map((p): FavoriteItem => ({
                id: p.id,
                type: "project",
                title: p.title,
                cover: p.cover_url,
                discipline: p.discipline,
            })),
        ];
    },
};