import { useQuery } from "@tanstack/react-query";
import { collaboratorService } from "@/api/services/collaborator.service";


export function useCollaborators(id: string) {
    return useQuery({
        queryKey: ['collaborators', id],
        queryFn: () => collaboratorService.getCollaborators(id),
        enabled: !!id
    })
}