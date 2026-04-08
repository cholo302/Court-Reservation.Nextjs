'use client'

import Link from 'next/link'
import { useState, Suspense, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const error = searchParams.get('error')
  const resubmitPending = searchParams.get('resubmit-pending') === 'true'

  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  })

  // Clear all toasts when arriving with resubmit-pending
  useEffect(() => {
    if (resubmitPending) {
      // Clear any pending toasts
      toast.dismiss()
      // Also clear error state
      setLoginError(null)
    }
  }, [resubmitPending])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setLoginError(null)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setLoginError(result.error)
        setFormData((prev) => ({ ...prev, password: '' }))
        // Don't show error toast if user is already waiting for resubmission review
        if (!resubmitPending) {
          toast.error(result.error)
        }
      } else {
        // Fetch user session to check role and verification status
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        
        if (session?.user?.role === 'admin') {
          toast.success('Welcome back!')
          router.push('/admin')
        } else {
          // Check if maintenance mode is on for non-admin users
          try {
            const maintRes = await fetch('/api/settings/maintenance')
            const maintData = await maintRes.json()
            if (maintData.maintenanceMode) {
              toast.error('The site is currently under maintenance. Please try again later.')
              router.push('/maintenance')
              router.refresh()
              return
            }
          } catch (e) {}
          
          toast.success('Welcome back!')
          if (session?.user?.verificationStatus && session.user.verificationStatus !== 'verified') {
            // Redirect unverified users to verification page (shows form, pending, or resubmit)
            router.push('/verify')
          } else {
            router.push(callbackUrl)
          }
        }
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
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
          <h2 className="mt-8 text-3xl font-extrabold text-white">Welcome back!</h2>
          <p className="mt-2 text-blue-200">Sign in to your account</p>
        </div>

        {resubmitPending && (
          <div className="mb-4 bg-blue-500/10 backdrop-blur-sm border border-blue-400/20 text-blue-200 p-4 rounded-xl">
            <p className="font-semibold">
              <i className="fas fa-clock mr-2"></i>
              Documents Under Review
            </p>
            <p className="text-sm mt-1">Your verification documents are under admin review. You can still login and browse courts.</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl p-8">
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
                  name="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent focus:bg-white transition-colors text-sm"
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="block w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent focus:bg-white transition-colors text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  className="h-4 w-4 text-ph-blue focus:ring-ph-blue border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-500">
                  Remember me
                </label>
              </div>
              <Link href="/forgot-password" className="text-sm text-ph-blue hover:text-blue-700 font-semibold">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-ph-blue to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <BallSpinner className="mr-2" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <i className="fas fa-arrow-right ml-2 text-sm"></i>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-blue-200">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-white font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
      <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-ph-blue to-blue-800">
        <BallSpinner className="text-white" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
