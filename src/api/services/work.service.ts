import { supabase } from "@/integrations/supabase/client";
import { Author, NewWork, WorkFilters } from "../types/work";
import { notFound } from '@tanstack/react-router';
import { CollaboratorDraft } from "@/components/collaborators-editor";
import { authService } from "./auth.service";
import { interactionService } from "./interactions.service";


export const workService = {
    async getAll(filters?: WorkFilters) {
        let query = supabase
            .from('works')
            .select('id, title, cover_url, discipline, tags, user_id, likes_count, views_count')
            .eq('is_published', true)

        if (filters?.category && filters.category.toLowerCase() !== "all") {
            query = query.eq("discipline", filters.category)
        }
        if (filters?.featured) {
            query = query.eq("is_featured", filters.featured)
        }
        if (filters?.search) {
            query = query.ilike("title", `%${filters.search}%`)
        }
        if (filters?.order) {
            query = query.order(filters.order.by, { ascending: filters.order.asc ?? false })
        }

        const { data: works, error } = await query
            .order('created_at', { ascending: false })
            .limit(filters?.limit ?? 60);

        if (error) throw error

        const ws = (works as Work[]) ?? [];
        const withAuthors = await this.attachAuthors(ws);
        return interactionService.attachToWorks(withAuthors);
    },

    async getById(id: string) {
        const { data: w, error } = await supabase.from('works').select('*').eq('id', id).single();

        if (!w) throw notFound();
        if (error) throw error

        const { data: a, error: oerror } = await supabase
            .from('profiles')
            .select('id, username, full_name, location, avatar_url, is_pro, bio, headline')
            .eq('id', (w as unknown as Work).user_id)
            .maybeSingle();

        if (oerror) throw oerror

        const workWithInteractions = await interactionService.attachToOne(w as unknown as Work);

        return { work: workWithInteractions, author: a as Author | null };
    },

    async create({ w, collaborators }: { w: NewWork, collaborators: CollaboratorDraft[] }) {
        const user_id = await authService.getCurrentUserIdOrThrow()
        const { data, error } = await supabase
            .from("works")
            .insert({
                user_id,
                title: w.title,
                description: w.description ?? null,
                discipline: w.discipline,
                cover_url: w.cover_url,
                gallery: w.gallery,
                tags: w.tags,
            })
            .select()
            .single();

        if (error) throw error

        if (collaborators.length > 0) {
            await supabase.from("content_collaborators").insert(
                collaborators.map((c, idx) => ({
                    target_type: "work",
                    target_id: data.id,
                    user_id: c.user_id,
                    role: c.role,
                    sort_order: idx,
                })),
            );
        }
        return data as unknown as Work
    },

    async update({ id, data }: { id: string, data: NewWork }) {
        const { error, success } = await supabase
            .from('works')
            .update({
                title: data.title,
                description: data.description ?? null,
                discipline: data.discipline,
                cover_url: data.cover_url,
                gallery: data.gallery,
                tags: data.tags,
                is_published: data.is_published ? true : false,
            })
            .eq('id', id);
        if (error) throw error
        return success
    },

    async delete(id: string) {
        const { error, success } = await supabase.from("works").delete().eq("id", id);
        if (error) throw error
        return success
    },

    async incrementViews(id: string) {
        await supabase.rpc('increment_work_views', { _id: id });
    },

    async feature(id: string) {
        const { error, success } = await supabase.from("works").update({ is_featured: true }).eq("id", id)
        if (error) throw error

        return success
    },

    async archive(id: string) {
        const { error, success } = await supabase.from("works").update({ is_published: false }).eq("id", id)
        if (error) throw error

        return success
    },

    async publish(id: string) {
        const { error, success } = await supabase.from("works").update({ is_published: true }).eq("id", id)
        if (error) throw error

        return success
    },

    async getFeatured() {
        const { data, error } = await supabase.from("works")
            .select('id, title, cover_url, discipline, tags, user_id')
            .eq('is_featured', false)
        if (error) throw error

        return this.attachAuthors((data ?? []) as Work[]);
    },

    async getTrending() {
        const { data, error } = await supabase.from("works")
            .select('id, title, cover_url, discipline, tags, user_id')
            .order('likes_count', { ascending: false })
        // .gte("views_count", 10)
        if (error) throw error

        return this.attachAuthors((data ?? []) as Work[]);
    },

    async getHeroWork() {
        const { data, error } = await supabase.from("works")
            .select('id, title, cover_url, discipline, tags, user_id')
            .order('likes_count', { ascending: false })
            .limit(1)
            .single()

        if (error) throw error


        const { data: a, error: oerror } = await supabase
            .from('profiles')
            .select('id, username, full_name, location, avatar_url, is_pro, bio, headline')
            .eq('id', (data as unknown as Work).user_id)
            .maybeSingle();

        if (oerror) throw oerror


        return { ...data, author: a as Author | null };

    },

    async getByUser(id: string) {
        const { data, error } = await supabase.from("works")
            .select('id, title, cover_url, discipline, tags, user_id')
            .eq('user_id', id)
        if (error) throw error

        return data
    },

    async getByUserFull(userId: string) {
        const { data, error } = await supabase
            .from('works')
            .select('id, title, cover_url, discipline, tags')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data ?? [];
    },

    async attachAuthors(works: Work[]) {
        const ids = [...new Set(works.map(w => w.user_id))];


        const { data: profiles, error } = await supabase
            .from("profiles")
            .select('id, username, full_name, location, avatar_url, is_pro')
            .in("id", ids)


        if (error) throw error;

        const authorMap = new Map(
            (profiles ?? []).map(profile => [profile.id, profile])
        );

        return works.map(work => ({
            ...work,
            author: authorMap.get(work.user_id) ?? null,
        }));
    },

    async getInteractions(targetIds: string[], targetType: string) {
        const user_id = await authService.getCurrentUserId();
        if (!targetIds.length) return new Map();

        if (!user_id) return new Map(targetIds.map(id => [id, {
            liked: false,
            bookmarked: false,
        }]));

        const [{ data: likes }, { data: favs }] = await Promise.all([
            supabase.from('likes').select('target_id')
                .eq('user_id', user_id).eq('target_type', targetType).in('target_id', targetIds),
            supabase.from('favorites').select('target_id')
                .eq('user_id', user_id).eq('target_type', targetType).in('target_id', targetIds),
        ]);

        const likedIds = new Set((likes ?? []).map(l => l.target_id));
        const bookmarkedIds = new Set((favs ?? []).map(f => f.target_id));

        return new Map(targetIds.map(id => [id, {
            liked: likedIds.has(id),
            bookmarked: bookmarkedIds.has(id),
        }]));
    },
}