'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MaintenancePage() {
  const router = useRouter()

  // Poll every 10 seconds to check if maintenance mode is turned off
  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/settings/maintenance')
        if (res.ok) {
          const data = await res.json()
          if (!data.maintenanceMode) {
            router.push('/')
          }
        }
      } catch (e) {}
    }

    const interval = setInterval(checkMaintenance, 10000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-sm p-10">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-tools text-yellow-500 text-3xl"></i>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3">Under Maintenance</h1>
          <p className="text-gray-500 mb-6">
            We&apos;re currently performing scheduled maintenance. We&apos;ll be back online shortly.
            Thank you for your patience.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-700">
            <i className="fas fa-clock mr-2"></i>
            Please check back in a few minutes.
          </div>
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs text-gray-400 mb-2">Are you an admin?</p>
            <a
              href="/login"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              Admin Login &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
