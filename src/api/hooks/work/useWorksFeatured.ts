import { useQuery } from "@tanstack/react-query";
import { workService } from "../../services/work.service";

export function useWorksFeatured() {
    return useQuery({
        queryKey: ['works-featured'],
        queryFn: () => workService.getFeatured()
    })
}