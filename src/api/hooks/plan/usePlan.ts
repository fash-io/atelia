import { planService } from "@/api/services/plan.service";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

export function usePlan() {
    const { user } = useAuth()

    return useQuery({
        queryKey: ['user-plan', user?.id],
        queryFn: () => planService.getUserPlan(),
        enabled: !!user,
    })
} 