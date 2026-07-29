import { useQuery } from "@tanstack/react-query";
import { profileService } from "../../services/profile.service";

export function useProfile(username?: string) {
    return useQuery({
        queryKey: ["profile", username],
        queryFn: () => profileService.getByUsername(username!),
        enabled: !!username,
    });
}