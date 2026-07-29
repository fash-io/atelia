import { searchService } from "@/api/services/search.service";
import { UserFilters } from "@/api/types/user";
import { useQuery } from "@tanstack/react-query";

export function useSearchUsers(filters: UserFilters) {
    return useQuery({
        queryKey: ['search-users', filters],
        queryFn: () => searchService.searchUsers(filters),
        placeholderData: prev => prev,
    })
} 