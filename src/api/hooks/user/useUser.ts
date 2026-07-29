import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/user.service";


export function useUser(id: string) {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => userService.getById(id),
        enabled: !!id
    })
}