// api/hooks/plan/usePlanMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/api/services/auth.service';
import { toast } from 'sonner';
import { planService } from '@/api/services/plan.service';
import { paymentService } from '@/api/services/payment.service';

export function useChoosePlan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (planId: string) => {
            const plan = await planService.getPlan(planId);
            if (!plan) throw new Error('Plan not found');

            if (plan.price_ngn <= 0) {
                await planService.choosePlan(planId);
                return { kind: 'free' as const };
            }

            const access_token = await authService.getCurrentSessionAccessToken();
            if (!access_token) throw new Error('User not logged in');
            await paymentService.initPayment({ access_token, planId }); // navigates away on success
            return { kind: 'paid' as const };
        },
        onSuccess: (result) => {
            if (result.kind === 'free') {
                toast.success("You're on the Free plan");
                queryClient.invalidateQueries({ queryKey: ['user-plan'] });
            }
            // paid case: browser is navigating to Paystack, nothing to invalidate yet
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : 'Could not update plan');
        },
    });
}

export function useCancelSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (subId: string) => paymentService.cancelSubscription(subId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-plan'] }),
    });
}

export function useResumeSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => paymentService.resumeSubscription(),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-plan'] }),
    });
}