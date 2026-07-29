import { useQuery } from "@tanstack/react-query";
import { bookingService } from "../../services/booking.service";

export function useBookings(userId?: string) {
    return useQuery({
        queryKey: ["bookings", userId],
        queryFn: () => bookingService.getForUser(userId!),
        enabled: !!userId,
    });
}