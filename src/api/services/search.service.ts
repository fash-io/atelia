import { supabase } from "@/integrations/supabase/client"
import { UserFilters } from "../types/user"
import { projectService } from "./project.service"
import { workService } from "./work.service"
import { Author } from "../types/work"
import { User } from "@supabase/supabase-js"

export const searchService = {
    async search(q: string) {
        const works = await this.searchWorks(q)
        const projects = await this.searchProjects(q)

        return { works, projects }
    },
    async searchWorks(q: string) {
        return await workService.getAll({ search: q })
    },
    async searchProjects(q: string) {
        return await projectService.getAll({ search: q })
    },
    async searchUsers(filters: UserFilters) {
        let query = supabase.from('profiles').select('*').limit(60);

        if (filters.discipline && filters.discipline !== 'All') {
            query = query.eq('discipline', filters.discipline);
        }
        if (filters.accountType && filters.accountType !== 'any') {
            query = query.eq('account_type', filters.accountType);
        }
        if (filters.location?.trim()) {
            query = query.ilike('location', `%${filters.location.trim()}%`);
        }
        if (filters.hireOnly) {
            query = query.eq('available_for_hire', true);
        }
        if (filters.q?.trim()) {
            const term = `%${filters.q.trim()}%`;
            query = query.or(`full_name.ilike.${term},username.ilike.${term},headline.ilike.${term}`);
        }

        if (filters.order) {
            if (filters.order.by === 'is_pro') {
                const { data, error } = await query;
                if (error) throw error;
                return sortByProThenHireThenName((data as unknown as Author[]) ?? []);
            }
            query = query.order(filters.order.by, { ascending: filters.order.asc ?? false });
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data) ?? [];
    },
}

function sortByProThenHireThenName(profiles: Author[]) {
    return [...profiles].sort((a, b) => {
        if (a.is_pro !== b.is_pro) return a.is_pro ? -1 : 1;
        if (a.available_for_hire !== b.available_for_hire) return a.available_for_hire ? -1 : 1;
        return (a.full_name ?? '').localeCompare(b.full_name ?? '');
    });
}