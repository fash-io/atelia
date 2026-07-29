import { searchService } from "@/api/services/search.service";
import { useQuery } from "@tanstack/react-query";

export function useSearchProjects(q: string) {
    return useQuery({
        queryKey: ['search-projects', q],
        queryFn: () => searchService.searchProjects(q)
    })
} 