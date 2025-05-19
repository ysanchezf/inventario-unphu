// pages/_app.tsx
import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../styles/global.css'

// 1) Crea un QueryClient de React Query
const queryClient = new QueryClient()

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    // 2) Proveedor de sesión de NextAuth
    <SessionProvider session={session}>
      {/* 3) Proveedor de React Query */}
      <QueryClientProvider client={queryClient}>
        {/* 4) Renderiza la página */}
        <Component {...pageProps} />
      </QueryClientProvider>
    </SessionProvider>
  )
}
