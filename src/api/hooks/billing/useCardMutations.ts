import { useMutation, useQueryClient } from "@tanstack/react-query";
import { billingService } from "../../services/billing.service";
import { paymentService } from "../../services/payment.service";
import { authService } from "../../services/auth.service";

export function useMakeDefaultCard(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (cardId: string) => billingService.makeDefault(userId!, cardId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards", userId] }),
    });
}

export function useRemoveCard(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (cardId: string) => billingService.removeCard(cardId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards", userId] }),
    });
}

export function useAddCard() {
    return useMutation({
        mutationFn: async () => {
            const access_token = await authService.getCurrentSessionAccessToken();
            if (!access_token) throw new Error("Not authenticated");
            await paymentService.initSaveCard(access_token); // redirects the browser
        },
    });
}

export function useVerifySaveCard(userId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ref: string) => {
            const access_token = await authService.getCurrentSessionAccessToken();
            if (!access_token) throw new Error("Not authenticated");
            return paymentService.verifySaveCard(ref, access_token);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cards", userId] }),
    });
}