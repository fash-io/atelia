import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "../../services/profile.service";

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, payload }: { userId: string; payload: UpdateProfile }) =>
            profileService.update(userId, payload),
        onSuccess: (_data, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
        },
    });
}

export function useUpdateAvatar() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, avatarUrl }: { userId: string; avatarUrl: string }) =>
            profileService.updateAvatar(userId, avatarUrl),
        onSuccess: (_data, { userId }) => {
            queryClient.invalidateQueries({ queryKey: ["my-profile", userId] });
        },
    });
}