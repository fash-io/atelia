import { useQuery } from "@tanstack/react-query";
import { jobService } from "../../services/job.service";

export function useJobApplication(jobId: string) {
    return useQuery({
        queryKey: ["job-application", jobId],
        queryFn: () => jobService.getApplications(jobId),
        enabled: !!jobId,
    });
}