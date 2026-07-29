import { notificationService } from "@/api/services/notification.service"
import { useMutation } from "@tanstack/react-query"

export function useNotificationMutations() {
    const markRead = useMutation({
        mutationFn: notificationService.markRead
    })
    const markAllRead = useMutation({
        mutationFn: notificationService.markAllRead
    })
    const remove = useMutation({
        mutationFn: notificationService.delete
    })
    return { markAllRead, markRead, remove }
}