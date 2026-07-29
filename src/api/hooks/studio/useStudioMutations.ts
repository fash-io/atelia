// api/hooks/studio/useStudioMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { studioService } from "../../services/studio.service";

export function useStudioMutations(userId?: string) {
    const queryClient = useQueryClient();
    const invalidateStudios = () => queryClient.invalidateQueries({ queryKey: ["my-studios", userId] });
    const invalidateDetails = (studioId: string) =>
        queryClient.invalidateQueries({ queryKey: ["studio-details", studioId] });
    const invalidateInvites = () => queryClient.invalidateQueries({ queryKey: ["my-pending-invites", userId] });

    const create = useMutation({
        mutationFn: (input: NewStudio) => studioService.create(userId!, input),
        onSuccess: invalidateStudios,
    });

    const update = useMutation({
        mutationFn: ({ studioId, payload }: { studioId: string; payload: StudioUpdate }) =>
            studioService.update(studioId, payload),
        onSuccess: (_data, { studioId }) => {
            invalidateStudios();
            invalidateDetails(studioId);
        },
    });

    const invite = useMutation({
        mutationFn: ({ studioId, value, role }: { studioId: string; value: string; role: string }) =>
            studioService.invite({ studioId, invitedBy: userId!, value, role }),
        onSuccess: (_data, { studioId }) => invalidateDetails(studioId),
    });

    const updateMemberRole = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string; role: string; studioId: string }) =>
            studioService.updateMemberRole(memberId, role),
        onSuccess: (_data, { studioId }) => invalidateDetails(studioId),
    });

    const removeMember = useMutation({
        mutationFn: ({ memberId }: { memberId: string; studioId: string }) => studioService.removeMember(memberId),
        onSuccess: (_data, { studioId }) => invalidateDetails(studioId),
    });

    const acceptInvite = useMutation({
        mutationFn: (args: { inviteId: string; studioId: string; role: string }) =>
            studioService.acceptInvite({ ...args, userId: userId! }),
        onSuccess: () => {
            invalidateStudios();
            invalidateInvites();
        },
    });

    return { create, update, invite, updateMemberRole, removeMember, acceptInvite };
}