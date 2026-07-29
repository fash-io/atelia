import { useMutation, useQueryClient } from "@tanstack/react-query";
import { jobService } from "../../services/job.service";

export function useUpdateJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: jobService.update,
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: ["job", id] });
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        },
    });
}

export function useDeleteJob() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: jobService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        },
    });
}

export function useIncrementJobView() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: jobService.incrementViews,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["jobs"] });
        },
    });
}
