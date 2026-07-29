import { searchService } from "@/api/services/search.service";
import { useQuery } from "@tanstack/react-query";

export function useSearchWorks(q: string) {
    return useQuery({
        queryKey: ['search-works', q],
        queryFn: () => searchService.searchWorks(q)
    })
} 