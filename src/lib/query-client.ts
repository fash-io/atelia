import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 100 * 60 * 5,
            gcTime: 100 * 60 * 30,
            retry: 2,
        }
    }
})