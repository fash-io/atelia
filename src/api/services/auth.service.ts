import { supabase } from "@/integrations/supabase/client";

export const authService = {
    async signOut() {
        await supabase.auth.signOut();
    },

    async getCurrentUserId(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user?.id ?? null;
    },
    async getCurrentUserIdAndAccessToken(): Promise<{ access_token: string | null, user_id: string | null } | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return { access_token: session?.access_token ?? null, user_id: session?.user?.id ?? null }
    },

    async getCurrentSessionAccessToken(): Promise<string | null> {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null
    },

    async getCurrentUserIdOrThrow(): Promise<string> {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) throw new Error('Not authenticated');
        return session.user.id;
    },

    async getIsPro(): Promise<boolean> {
        const userId = await this.getCurrentUserId()
        if (!userId) throw new Error('Not authenticated');

        const { data, error } = await supabase
            .from("profiles")
            .select("is_pro")
            .eq("id", userId)
            .maybeSingle();
        if (error) throw error;
        return Boolean(data?.is_pro);
    },

    async signUp({ email, password, fullName, accountType }: {
        email: string;
        password: string;
        fullName?: string;
        accountType: string;
    }) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: { full_name: fullName || undefined, account_type: accountType },
            },
        });
        if (error) throw error;
    },

    async signIn({ email, password }: { email: string; password: string }) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },

    async signInWithGoogle(): Promise<{ redirected: boolean }> {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin,
            },
        });
        if (error) throw new Error("Google sign-in failed.");
        // supabase.auth.signInWithOAuth triggers a full browser redirect to Google itself
        // (data.url is where the browser is being sent) — the function doesn't "return"
        // in the normal sense once redirect fires, but we keep the return shape
        // consistent with the old signature for the calling code in AuthPage.
        return { redirected: true };
    },
}