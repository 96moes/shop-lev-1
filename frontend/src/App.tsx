import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { router } from './routes'

/**
 * Application root.
 *
 * `QueryClient` is held in state so a single instance survives re-renders
 * (creating it inside render would discard the cache on every render).
 * `AuthProvider` sits inside the query provider so it can clear cached data on
 * sign-in and sign-out. All rendering below is delegated to the router.
 */
function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
