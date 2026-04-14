'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'

export default function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [isVerifying, setIsVerifying] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('No verification token provided')
      setIsVerifying(false)
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Verification failed')
        }
        setVerified(true)
        toast.success('Email verified successfully!')
        setTimeout(() => router.push('/login'), 2000)
      } catch (err: any) {
        setError(err.message || 'An error occurred during verification')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-ph-blue to-blue-800"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-ph-yellow rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
              <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4">
              <BallSpinner />
              <p className="text-gray-600 text-center">Verifying your email...</p>
            </div>
          ) : verified ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <i className="fas fa-check text-green-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
              <p className="text-gray-600">Your account is now active. You can log in and start booking courts.</p>
              <div className="mt-6 w-full">
                <Link
                  href="/login"
                  className="block w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition text-center"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fas fa-times text-red-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
              <p className="text-gray-600">{error || 'Something went wrong during email verification.'}</p>
              <div className="mt-6 w-full space-y-2">
                <Link
                  href="/login"
                  className="block w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition text-center"
                >
                  Back to Login
                </Link>
                <Link
                  href="/register"
                  className="block w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition text-center"
                >
                  Create New Account
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
