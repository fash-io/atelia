import { useQuery } from "@tanstack/react-query";
import { studioService } from "../../services/studio.service";

export function useMyStudios(userId?: string) {
    return useQuery({
        queryKey: ["my-studios", userId],
        queryFn: () => studioService.getMyStudios(userId!),
        enabled: !!userId,
    });
}