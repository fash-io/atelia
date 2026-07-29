import { searchService } from "@/api/services/search.service";
import { useQuery } from "@tanstack/react-query";

export function useSearch(q: string) {
    return useQuery({
        queryKey: ['search', q],
        queryFn: () => searchService.search(q)
    })
} 