import { useMutation } from "@tanstack/react-query";
import { jobService } from "../../services/job.service";

export function useCreateJob() {
    return useMutation({
        mutationFn: jobService.create,
    });
}