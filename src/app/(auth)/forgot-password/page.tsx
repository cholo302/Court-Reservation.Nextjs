'use client'

import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong')
        return
      }

      setEmailSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-ph-blue to-blue-800"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ph-yellow rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white">Forgot Password</h1>
          <p className="mt-2 text-blue-200 text-sm">Enter your email to reset your password</p>
        </div>

        {emailSent ? (
          /* Success State */
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <i className="fas fa-envelope-circle-check text-green-500 text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Check Your Email</h2>
              <p className="text-gray-600 text-sm mb-1">
                If that email is registered, a password reset link has been sent.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Please check your inbox and spam folder.
              </p>
              <p className="text-green-600 text-xs mb-6">The link will expire in 30 minutes.</p>

              <button
                onClick={() => { setEmailSent(false); setEmail('') }}
                className="text-ph-blue hover:text-blue-700 font-semibold text-sm mb-4 block mx-auto"
              >
                <i className="fas fa-rotate-right mr-1.5"></i>
                Try a different email
              </button>

              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-700 text-sm font-medium block"
              >
                <i className="fas fa-arrow-left mr-1.5"></i>
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          /* Email Form */
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent focus:bg-white transition-colors text-sm"
                    placeholder="juan@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-ph-blue to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <BallSpinner className="mr-2" /> Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i> Send Reset Link
                  </>
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-ph-blue hover:text-blue-700 font-semibold">
                  <i className="fas fa-arrow-left mr-1.5"></i>
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
