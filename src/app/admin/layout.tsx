'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session || (session.user as any)?.role !== 'admin') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BouncingBallLoader />
      </div>
    )
  }

  if (!session || (session.user as any)?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AdminSidebar />
      <main className="lg:ml-64 min-h-screen transition-all duration-300 overflow-x-hidden">
        <div className="pt-16 lg:pt-0 px-4 lg:px-8 py-4 lg:py-8 w-full overflow-x-hidden">
          <div className="max-w-full lg:max-w-7xl mx-auto">{children}</div>
        </div>
      </main>
    </div>
  )
}
