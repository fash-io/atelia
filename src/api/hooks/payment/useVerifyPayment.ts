import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '@/api/services/payment.service';
import { toast } from 'sonner';

export function useVerifyPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ref: string) => paymentService.verifyPayment(ref),
        onSuccess: ({ j, res }) => {
            if (res.ok && j.ok) {
                toast.success(`Payment confirmed — ${j.plan} plan active`);
                queryClient.invalidateQueries({ queryKey: ['user-plan'] });
            } else {
                toast.error('Payment not completed', { description: j?.status ?? 'Please try again.' });
            }
        },
    });
}