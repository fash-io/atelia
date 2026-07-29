import { useQuery } from "@tanstack/react-query";
import { jobService } from "../../services/job.service";

export function useJobApplicationCounts(jobIds: string[], enabled: boolean) {
    return useQuery({
        queryKey: ["job-application-counts", jobIds],
        queryFn: () => jobService.getApplicationCounts(jobIds),
        enabled: enabled && jobIds.length > 0,
    });
}