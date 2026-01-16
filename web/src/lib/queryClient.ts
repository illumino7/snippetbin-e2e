import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 14 * 60 * 1000, // 14 minutes (presigned URLs valid for 15 min)
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
