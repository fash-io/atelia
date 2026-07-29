import { studioService } from "@/api/services/studio.service";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

export function useStudio(slug: string) {
    return useSuspenseQuery({
        queryKey: ['public-studio', slug],
        queryFn: () => studioService.getPublicStudioProfile(slug),
    })
}