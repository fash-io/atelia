import { useQuery } from "@tanstack/react-query";
import { serviceService } from "../../services/service.service";

export function useServices(userId?: string) {
    return useQuery({
        queryKey: ["services", userId],
        queryFn: () => serviceService.getByUser(userId!),
        enabled: !!userId,
    });
}