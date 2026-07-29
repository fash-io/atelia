import { notificationService } from "@/api/services/notification.service";
import { useQuery } from "@tanstack/react-query";

export function useNotifications(id: string) {
    return useQuery({
        queryKey: ['notifications', id],
        queryFn: () => notificationService.getAll(id)
    })
}