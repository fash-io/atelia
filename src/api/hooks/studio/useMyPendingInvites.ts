// api/hooks/studio/useMyPendingInvites.ts
import { useQuery } from "@tanstack/react-query";
import { studioService } from "../../services/studio.service";

export function useMyPendingInvites(userId?: string) {
    return useQuery({
        queryKey: ["my-pending-invites", userId],
        queryFn: () => studioService.getMyPendingInvites(userId!),
        enabled: !!userId,
    });
}