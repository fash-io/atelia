import { useQuery } from "@tanstack/react-query";
import { workService } from "../../services/work.service";

export function useMyWorks(userId?: string) {
    return useQuery({
        queryKey: ["my-works", userId],
        queryFn: () => workService.getByUserFull(userId!),
        enabled: !!userId,
    });
}