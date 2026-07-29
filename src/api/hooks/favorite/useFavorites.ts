import { favoritesService } from "@/api/services/favorite.service";
import { useQuery } from "@tanstack/react-query";

export function useFavorites(userId?: string) {
    return useQuery({
        queryKey: ["favorites", userId],
        queryFn: () => favoritesService.getFavoriteItems(userId!),
        enabled: !!userId,
    });
}