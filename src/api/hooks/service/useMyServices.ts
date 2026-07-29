import { useQuery } from "@tanstack/react-query";
import { serviceService } from "../../services/service.service";

export function useMyServices(userId?: string) {
    return useQuery({
        queryKey: ["services", userId],
        queryFn: () => serviceService.getMine(),
        enabled: !!userId,
    });
}