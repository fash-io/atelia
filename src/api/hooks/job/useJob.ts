import { useQuery } from "@tanstack/react-query";
import { jobService } from "../../services/job.service";

export function useJob(id: string) {
    return useQuery({
        queryKey: ["job", id],
        queryFn: () => jobService.getById(id),
        enabled: !!id,
    });
}