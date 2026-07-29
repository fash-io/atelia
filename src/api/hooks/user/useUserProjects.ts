import { useQuery } from "@tanstack/react-query";
import { userService } from "../../services/user.service";


export function useUserProjects(id: string) {
    return useQuery({
        queryKey: ['user-projects', id],
        queryFn: () => userService.getProjects(id),
        enabled: !!id
    })
}