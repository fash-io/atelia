import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/user.service";


export function useUserWorks(id: string) {
    return useQuery({
        queryKey: ['user-works', id],
        queryFn: () => userService.getWorks(id),
        enabled: !!id
    })
}