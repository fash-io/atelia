import { useQuery } from "@tanstack/react-query";
import { ProjectFilters } from "../../types/project";
import { projectService } from "../../services/project.service";

export function useProjects(filters: ProjectFilters) {
    return useQuery({
        queryKey: ['projects', filters],
        queryFn: () => projectService.getAll(filters)
    })
}