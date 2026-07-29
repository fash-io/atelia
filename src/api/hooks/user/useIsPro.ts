import { useQuery } from "@tanstack/react-query";
import { authService } from "@/api/services/auth.service";

export function useIsPro(userId?: string) {
    return useQuery({
        queryKey: ["is-pro", userId],
        queryFn: () => authService.getIsPro(),
        enabled: !!userId,
    });
}