import { useQuery } from "@tanstack/react-query";
import { studioService } from "../../services/studio.service";

export function useStudioDetails(studioId: string) {
    return useQuery({
        queryKey: ["studio-details", studioId],
        queryFn: () => studioService.getStudioDetails(studioId),
        enabled: !!studioId,
        
    });
}