import { useMutation, useQueryClient } from "@tanstack/react-query";
import { serviceService } from "../../services/service.service";

export function useServiceMutations(userId?: string) {
    const queryClient = useQueryClient();
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["services", userId] });

    const create = useMutation({
        mutationFn: (payload: NewService) => serviceService.create(payload),
        onSuccess: invalidate,
    });
    const update = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateService }) =>
            serviceService.update(id, payload),
        onSuccess: invalidate,
    });
    const remove = useMutation({
        mutationFn: (id: string) => serviceService.delete(id),
        onSuccess: invalidate,
    });
    const toggle = useMutation({
        mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
            serviceService.toggleVisibility(id, isVisible),
        onSuccess: invalidate,
    });
    const swap = useMutation({
        mutationFn: ({ a, b }: { a: Service; b: Service }) => serviceService.swapOrder(a, b),
        onSuccess: invalidate,
    });

    return { create, update, remove, toggle, swap };
}