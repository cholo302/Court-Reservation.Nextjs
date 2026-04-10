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

      toast.success('Check your email for the reset link!')
      setEmailSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-ph-blue to-blue-800"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-ph-yellow rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
              <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">OLOPSC Court Reservation</span>
          </Link>
          <h2 className="mt-8 text-3xl font-extrabold text-white">Forgot Password</h2>
          <p className="mt-2 text-blue-200">Enter your email to reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {emailSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-envelope-circle-check text-green-500 text-2xl"></i>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-gray-500 text-sm mb-6">
                We&apos;ve sent a password reset link to <strong>{email}</strong>. Please check your inbox and spam folder.
              </p>
              <p className="text-gray-400 text-xs mb-4">The link will expire in 30 minutes.</p>
              <button
                onClick={() => { setEmailSent(false); setEmail('') }}
                className="text-sm text-ph-blue hover:text-blue-700 font-semibold"
              >
                <i className="fas fa-redo mr-1 text-xs"></i>
                Try a different email
              </button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent focus:bg-white transition-colors text-sm"
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-ph-blue to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
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
          </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-ph-blue hover:text-blue-700 font-semibold">
              <i className="fas fa-arrow-left mr-1 text-xs"></i>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
