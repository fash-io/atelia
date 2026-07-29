import { useQuery } from "@tanstack/react-query";
import { workService } from "../../services/work.service";

export function useWorksTrending() {
    return useQuery({
        queryKey: ['works-trending'],
        queryFn: () => workService.getTrending()
    })
}