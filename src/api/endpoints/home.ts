import { supabase } from '@/integrations/supabase/client';
import { DisplayWork } from '../types/work';
import { workService } from '../services/work.service';
export type HomePageData = {
    metrics: { creatives: number; projects: number; likes: number } | null;
    heroWork: DisplayWork | null
};

export async function getHomePageData(): Promise<HomePageData> {
    try {
        const [{ count: creatives }, { count: projectsCount }, { data: likeAgg }] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_published', true),
            supabase.from('works').select('likes_count').eq('is_published', true),
        ]);

        const works = (likeAgg as { likes_count: number }[] | null) ?? [];
        const heroWork = await workService.getHeroWork()

        return {
            metrics: {
                creatives: creatives ?? 0,
                projects: (projectsCount ?? 0) + works.length,
                likes: works.reduce((s, w) => s + (w.likes_count ?? 0), 0),
            },
            heroWork: heroWork as unknown as DisplayWork

        };
    } catch {
        return { metrics: null, heroWork: null };
    }
}