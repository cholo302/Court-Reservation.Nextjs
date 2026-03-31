'use client'

import { SessionProvider } from 'next-auth/react'
import { IdleLogout } from '@/components/IdleLogout'
import { useEffect } from 'react'

function StaleActionHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      const msg = event.message || ''
      if (
        msg.includes('Failed to find Server Action') ||
        msg.includes('Server Action') ||
        msg.includes('NEXT_NOT_FOUND')
      ) {
        // Stale client JS from previous build — force reload
        console.warn('Stale build detected, reloading page...')
        window.location.reload()
      }
    }

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const msg = String(event.reason?.message || event.reason || '')
      if (
        msg.includes('Failed to find Server Action') ||
        msg.includes('Server Action')
      ) {
        console.warn('Stale build detected, reloading page...')
        window.location.reload()
      }
    }

    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StaleActionHandler />
      <IdleLogout />
      {children}
    </SessionProvider>
  )
}
