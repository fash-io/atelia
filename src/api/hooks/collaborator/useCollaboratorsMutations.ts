import { collaboratorService } from "@/api/services/collaborator.service";
import { useMutation } from "@tanstack/react-query";

export function useCollaboratorMutations() {
    const addCollaborator = useMutation({
        mutationFn: collaboratorService.addCollaborator
    })
    const removeCollaborator = useMutation({
        mutationFn: collaboratorService.removeCollaborator,
    })
    const updateRole = useMutation({
        mutationFn: collaboratorService.updateRole
    })

    return { addCollaborator, removeCollaborator, updateRole }
}