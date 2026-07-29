import { useQuery } from "@tanstack/react-query";
import { workService } from "../../services/work.service";
import { WorkFilters } from "../../types/work";

export function useWorks(filters: WorkFilters) {
    return useQuery({
        queryKey: ['works', filters],
        queryFn: () => workService.getAll(filters)
    })
}