import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "../../services/booking.service";

export function useBookingMutations(userId?: string) {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["bookings", userId] });

    const setStatus = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => bookingService.setStatus(id, status),
        onSuccess: invalidate,
    });

    const reschedule = useMutation({
        mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
            bookingService.reschedule(id, scheduledAt),
        onSuccess: invalidate,
    });
    const book = useMutation({
        mutationFn: (b: NewBooking) =>
            bookingService.book(b),
        onSuccess: invalidate,
    });
    return { setStatus, reschedule, book };
}