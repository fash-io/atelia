import { supabase } from "@/integrations/supabase/client";
import { JobFilters } from "../types/job";
import { notFound } from "@tanstack/react-router";

export const jobService = {
    async getAll(filters: JobFilters): Promise<Job[]> {
        let query = supabase.from("jobs").select("*").limit(200);

        if (filters.tab === "mine" && filters.userId) {
            query = query.eq("user_id", filters.userId);
        }
        if (!filters.showClosed) {
            query = query.eq("status", "open");
        }
        if (filters.discipline) {
            query = query.eq("discipline", filters.discipline);
        }
        if (filters.jobType) {
            query = query.eq("job_type", filters.jobType);
        }
        if (filters.remote === "remote") {
            query = query.eq("remote", true);
        }
        if (filters.remote === "onsite") {
            query = query.eq("remote", false);
        }

        const { data, error } = await query;
        if (error) throw error;

        let rows = (data as Job[]) ?? [];

        if (filters.minBudget != null || filters.maxBudget != null) {
            rows = rows.filter((j) => {
                const jMin = j.budget_min ?? j.budget_max ?? null;
                const jMax = j.budget_max ?? j.budget_min ?? null;
                if (jMin == null && jMax == null) return false;
                if (filters.minBudget != null && jMax != null && jMax < filters.minBudget) return false;
                if (filters.maxBudget != null && jMin != null && jMin > filters.maxBudget) return false;
                return true;
            });
        }

        return rows;
    },

    async getApplicationCounts(jobIds: string[]): Promise<Record<string, number>> {
        if (jobIds.length === 0) return {};
        const { data, error } = await supabase
            .from("applications")
            .select("job_id")
            .in("job_id", jobIds);
        if (error) throw error;

        const counts: Record<string, number> = {};
        (data ?? []).forEach((a: { job_id: string }) => {
            counts[a.job_id] = (counts[a.job_id] ?? 0) + 1;
        });
        return counts;
    },
    async getApplications(jobId: string): Promise<App[] | []> {
        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('job_id', jobId)
            .order('created_at', { ascending: false })
        if (error) throw error;

        return data;
    },

    async create(job: NewJob): Promise<{ id: string }> {
        const featuredUntil =
            job.feature && job.isPro
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : null;

        const { data, error } = await supabase
            .from("jobs")
            .insert({
                user_id: job.user_id,
                title: job.title,
                company: job.company ?? null,
                description: job.description,
                discipline: job.discipline,
                job_type: job.job_type,
                location: job.location ?? null,
                remote: job.remote,
                budget_min: job.budget_min ?? null,
                budget_max: job.budget_max ?? null,
                currency: job.currency,
                deadline: job.deadline ?? null,
                tags: job.tags,
                is_featured: job.feature && job.isPro,
                featured_until: featuredUntil,
            })
            .select("id")
            .single();

        if (error) throw error;
        return data;
    },

    async getById(id: string) {
        const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Job not found");

        return data as Job;
    },

    async update({ id, userId, data }: { id: string; userId: string; data: UpdateJob }): Promise<void> {
        const job = await this.getById(id);
        if (job.user_id !== userId) throw new Error("You can only edit your own jobs");

        const wantsFeatured = data.is_featured && data.isPro;
        const featuredUntil = wantsFeatured
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const { error } = await supabase
            .from("jobs")
            .update({
                title: data.title,
                company: data.company ?? null,
                description: data.description,
                discipline: data.discipline,
                job_type: data.job_type,
                location: data.location ?? null,
                remote: data.remote,
                budget_min: data.budget_min ?? null,
                budget_max: data.budget_max ?? null,
                currency: data.currency,
                deadline: data.deadline ?? null,
                status: data.status,
                is_featured: wantsFeatured,
                featured_until: featuredUntil,
                tags: data.tags,
            })
            .eq("id", id);

        if (error) throw error;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from("jobs").delete().eq("id", id);
        if (error) throw error;
    },
    async incrementViews(id: string) {
        await supabase.rpc('increment_job_views', { _job_id: id });
    },
};