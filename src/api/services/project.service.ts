import { supabase } from "@/integrations/supabase/client"
import { ProjectFilters } from "../types/project"
import { Author } from "../types/work"
import { notFound } from '@tanstack/react-router';
import { CollaboratorDraft } from "@/components/collaborators-editor";
import { interactionService } from "./interactions.service";


export const projectService = {
    async getAll(filters?: ProjectFilters) {
        let query = supabase
            .from('projects')
            .select('id, title, cover_url, discipline, tags, user_id, location, subtitle, client')
            .eq('is_published', true)

        if (filters?.category && filters.category.toLowerCase() !== "all") {
            query = query.eq("discipline", filters.category)
        }
        if (filters?.search) {
            query = query.ilike("title", `%${filters.search}%`)
        }
        if (filters?.order) {
            query = query.order(filters.order.by, { ascending: filters.order.asc ?? false })
        }

        const { data: projects, error } = await query
            .order('created_at', { ascending: false })
            .limit(60);

        if (error) throw error

        const ps = (projects) ?? [];
        const ids = [...new Set(ps.map((p) => p.user_id))];

        const { data: profiles } = ids.length
            ? await supabase.from('profiles').select('id, full_name, username, is_pro').in('id', ids)
            : { data: [] as Author[] };

        const map = new Map(((profiles as Author[] | null) ?? []).map((p) => [p.id, p]));

        return ps.map((p) => ({ ...p, author: map.get(p.user_id) ?? null }))
    },

    async getById(id: string) {
        const { data: p, error } = await supabase.from('projects').select('*').eq('id', id).maybeSingle();

        if (!p) {
            throw notFound();
        }
        if (error) throw error

        const { data: a, error: oerror } = await supabase
            .from('profiles')
            .select('id, username, full_name, location, avatar_url, is_pro, bio, headline')
            .eq('id', p.user_id)
            .maybeSingle();

        if (oerror) throw oerror

        const projectWithInteractions = await interactionService.attachToOne(p as unknown as Project, 'project');

        return { project: projectWithInteractions, author: a as Author | null };

    },

    async create({ user_id, p, collaborators }: { user_id: string, p: NewProject, collaborators: CollaboratorDraft[] }) {
        const { data, error } = await supabase
            .from("projects")
            .insert({
                user_id,
                title: p.title,
                location: p.location ?? null,
                discipline: p.discipline,
                cover_url: p.cover_url,
                sections: p.sections,
                tags: p.tags,
            })
            .select()
            .single();

        if (error) throw error


        if (collaborators.length > 0) {
            await supabase.from("content_collaborators").insert(
                collaborators.map((c, idx) => ({
                    target_type: "project",
                    target_id: data.id,
                    user_id: c.user_id,
                    role: c.role,
                    sort_order: idx,
                })),
            );
        }
        return data
    },

    async update({ id, data }: { id: string, data: UpdateProject }) {
        const { error, success } = await supabase
            .from('projects')
            .update({
                title: data.title,
                location: data.location ?? null,
                discipline: data.discipline,
                cover_url: data.cover_url,
                sections: data.sections,
                tags: data.tags,
                is_published: data.is_published ? true : false,
            })
            .eq('id', id);

        if (error) throw error
        return success
    },

    async delete(id: string) {
        const { error, success } = await supabase.from("projects").delete().eq("id", id);
        if (error) throw error

        return success
    },
    async archive(id: string) {
        const { error, success } = await supabase.from("projects").update({ is_published: false }).eq("id", id)
        if (error) throw error

        return success
    },

    async publish(id: string) {
        const { error, success } = await supabase.from("projects").update({ is_published: true }).eq("id", id)
        if (error) throw error

        return success
    },

    async getTrending() {
        return supabase.from("projects")
            .select('id, title, cover_url, discipline, tags, user_id')
            .order('likes_count', { ascending: false })
            .gte("views_count", 10)
    },

    async getByUser(userId: string): Promise<ProjectSummary[]> {
        const { data, error } = await supabase
            .from("projects")
            .select("id, title, subtitle, cover_url, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data as ProjectSummary[]) ?? [];
    },
    async incrementViews(id: string) {
        await supabase.rpc('increment_project_views', { _id: id });
    },

}