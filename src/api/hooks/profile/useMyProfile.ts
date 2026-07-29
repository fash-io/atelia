import { useQuery } from "@tanstack/react-query";
import { profileService } from "../../services/profile.service";

export function useMyProfile(userId?: string) {
    return useQuery({
        queryKey: ["my-profile", userId],
        queryFn: () => profileService.getMine(),
        enabled: !!userId,
    });
}