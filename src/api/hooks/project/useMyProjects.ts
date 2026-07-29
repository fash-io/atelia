import { useQuery } from "@tanstack/react-query";
import { projectService } from "../../services/project.service";

export function useMyProjects(userId?: string) {
    return useQuery({
        queryKey: ["my-projects", userId],
        queryFn: () => projectService.getByUser(userId!),
        enabled: !!userId,
    });
}