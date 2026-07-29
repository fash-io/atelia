import { planService } from "@/api/services/plan.service";
import { useQuery } from "@tanstack/react-query";

export function usePlans() {
    return useQuery({
        queryKey: ['plans'],
        queryFn: () => planService.getPlans(),
    })
} 