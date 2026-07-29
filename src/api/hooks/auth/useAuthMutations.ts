import { useMutation } from "@tanstack/react-query";
import { authService } from "../../services/auth.service";

export function useSignUp() {
    return useMutation({ mutationFn: authService.signUp });
}

export function useSignIn() {
    return useMutation({ mutationFn: authService.signIn });
}

export function useGoogleSignIn() {
    return useMutation({ mutationFn: authService.signInWithGoogle });
}