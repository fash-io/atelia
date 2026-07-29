import { useQuery } from "@tanstack/react-query";
import { workService } from "../../services/work.service";


export function useWork(id: string) {
    return useQuery({
        queryKey: ['work', id],
        queryFn: () => workService.getById(id),
        enabled: !!id
    })
}