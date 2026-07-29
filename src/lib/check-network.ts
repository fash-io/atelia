export async function checkInternetConnection() {
    if (!navigator.onLine) return false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
        // ping your own Supabase project instead of a third-party origin
        await fetch(`${import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL}/auth/v1/health`, {
            method: 'GET',
            signal: controller.signal,
        });
        return true;
    } catch (error) {
        return false;
    } finally {
        clearTimeout(timeoutId);
    }
}