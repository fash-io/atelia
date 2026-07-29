import { useMutation } from "@tanstack/react-query";
import { projectService } from "../../services/project.service";

export function useProjectMutations() {
    const create = useMutation({
        mutationFn: projectService.create,
    })
    const update = useMutation({
        mutationFn: projectService.update,
    })
    const remove = useMutation({
        mutationFn: projectService.delete,
    })
    const incrementView = useMutation({
        mutationFn: projectService.incrementViews
    })

    return { create, update, remove, incrementView }
}