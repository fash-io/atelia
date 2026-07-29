import { useQuery } from "@tanstack/react-query";
import { jobService } from "../../services/job.service";
import { JobFilters } from "../../types/job";

export function useJobs(filters: JobFilters) {
    return useQuery({
        queryKey: ["jobs", filters],
        queryFn: () => jobService.getAll(filters),
        enabled: filters.tab === "all" || !!filters.userId,
        placeholderData: (prev) => prev,
    });
}