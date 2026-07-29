// api/hooks/billing/useCards.ts
import { useQuery } from "@tanstack/react-query";
import { billingService } from "../../services/billing.service";

export function useCards(userId?: string) {
    return useQuery({
        queryKey: ["cards", userId],
        queryFn: () => billingService.getCards(userId!),
        enabled: !!userId,
    });
}