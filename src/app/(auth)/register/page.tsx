'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'

export default function RegisterPage() {
  const router = useRouter()
  
  const genCaptcha = () => {
    const a = Math.floor(Math.random() * 9) + 1
    const b = Math.floor(Math.random() * 9) + 1
    return { a, b, answer: String(a + b) }
  }

  const [isLoading, setIsLoading] = useState(false)
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, answer: '' })
  const [captchaInput, setCaptchaInput] = useState('')

  // Generate captcha only on client to avoid hydration mismatch
  useEffect(() => {
    setCaptcha(genCaptcha())
  }, [])
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
    terms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = (name: string, value: string | boolean): string => {
    switch (name) {
      case 'firstName':
        if (!value) return 'First name is required'
        if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value as string)) return 'Only letters, spaces, hyphens allowed'
        return ''
      case 'lastName':
        if (!value) return 'Last name is required'
        if (!/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value as string)) return 'Only letters, spaces, hyphens allowed'
        return ''
      case 'middleName':
        if (value && !/^[a-zA-ZÀ-ÿ\s\-']+$/.test(value as string)) return 'Only letters, spaces, hyphens allowed'
        return ''
      case 'email':
        if (!value) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) return 'Enter a valid email address'
        return ''
      case 'phone':
        if (!value) return 'Phone number is required'
        if (!/^(09|\+639)\d{9}$/.test((value as string).replace(/\s/g, ''))) return 'Enter a valid PH mobile number (e.g. 09171234567)'
        return ''
      case 'password':
        if (!value) return 'Password is required'
        if ((value as string).length < 6) return 'Password must be at least 6 characters'
        if (!/[A-Za-z]/.test(value as string)) return 'Password must contain at least one letter'
        return ''
      case 'passwordConfirmation':
        if (!value) return 'Please confirm your password'
        return ''
      case 'terms':
        if (!value) return 'You must agree to the Terms of Service'
        return ''
      default:
        return ''
    }
  }

  const handleChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
    }
    // Live check confirm password when password changes
    if (name === 'password' && touched['passwordConfirmation']) {
      const confirmVal = formData.passwordConfirmation
      setErrors((prev) => ({
        ...prev,
        passwordConfirmation: confirmVal && confirmVal !== value ? 'Passwords do not match' : validateField('passwordConfirmation', confirmVal),
      }))
    }
    if (name === 'passwordConfirmation') {
      setErrors((prev) => ({
        ...prev,
        passwordConfirmation: value && value !== formData.password ? 'Passwords do not match' : validateField('passwordConfirmation', value),
      }))
    }
  }

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
    const value = name === 'terms' ? formData.terms : (formData as any)[name]
    let error = validateField(name, value)
    if (name === 'passwordConfirmation' && formData.passwordConfirmation && formData.passwordConfirmation !== formData.password) {
      error = 'Passwords do not match'
    }
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const validateAll = (): boolean => {
    const fields = ['firstName', 'lastName', 'middleName', 'email', 'phone', 'password', 'passwordConfirmation', 'terms']
    const newErrors: Record<string, string> = {}
    const newTouched: Record<string, boolean> = {}
    fields.forEach((f) => {
      newTouched[f] = true
      const value = f === 'terms' ? formData.terms : (formData as any)[f]
      newErrors[f] = validateField(f, value)
    })
    if (formData.passwordConfirmation && formData.passwordConfirmation !== formData.password) {
      newErrors['passwordConfirmation'] = 'Passwords do not match'
    }
    setTouched(newTouched)
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  const fieldClass = (name: string) =>
    `block w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent transition-colors ${
      errors[name] && touched[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  const fieldClassWithIcon = (name: string) =>
    `block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent transition-colors ${
      errors[name] && touched[name] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  const ErrorMsg = ({ name }: { name: string }) =>
    errors[name] && touched[name] ? (
      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
        <i className="fas fa-circle-exclamation text-xs"></i>{errors[name]}
      </p>
    ) : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateAll()) return

    if (captchaInput.trim() !== captcha.answer) {
      toast.error('Incorrect answer. Please try again.')
      setCaptcha(genCaptcha())
      setCaptchaInput('')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Registration failed'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          errorMessage = `Server error (${response.status}). Please try again later.`
        }
        throw new Error(errorMessage)
      }

      toast.success('Account created successfully! You can now sign in.')
      router.push('/login')
    } catch (error: any) {
      toast.error(error?.message || 'An error occurred. Please try again.')
      setCaptcha(genCaptcha())
      setCaptchaInput('')
    } finally {
      setIsLoading(false)
    }
  }

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
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
              <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">OLOPSC Court Reservation</span>
          </Link>
          <h2 className="mt-8 text-3xl font-extrabold text-white">Create Account</h2>
          <p className="mt-2 text-blue-200">Join and start booking courts</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  onBlur={() => handleBlur('firstName')}
                  className={fieldClass('firstName')}
                  placeholder="Juan"
                />
                <ErrorMsg name="firstName" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  onBlur={() => handleBlur('lastName')}
                  className={fieldClass('lastName')}
                  placeholder="Dela Cruz"
                />
                <ErrorMsg name="lastName" />
              </div>
            </div>

            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="middleName"
                name="middleName"
                value={formData.middleName}
                onChange={(e) => handleChange('middleName', e.target.value)}
                onBlur={() => handleBlur('middleName')}
                className={fieldClass('middleName')}
                placeholder="Santos"
              />
              <ErrorMsg name="middleName" />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-envelope text-gray-400"></i>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={fieldClassWithIcon('email')}
                  placeholder="juan@example.com"
                />
              </div>
              <ErrorMsg name="email" />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-phone text-gray-400"></i>
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  className={fieldClassWithIcon('phone')}
                  placeholder="09171234567"
                />
              </div>
              <ErrorMsg name="phone" />
              {!errors['phone'] && <p className="mt-1 text-xs text-gray-500">Philippine mobile number format</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={fieldClassWithIcon('password')}
                  placeholder="••••••••"
                />
              </div>
              <ErrorMsg name="password" />
              {!errors['password'] && <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>}
            </div>

            <div>
              <label
                htmlFor="passwordConfirmation"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-lock text-gray-400"></i>
                </div>
                <input
                  type="password"
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  value={formData.passwordConfirmation}
                  onChange={(e) => handleChange('passwordConfirmation', e.target.value)}
                  onBlur={() => handleBlur('passwordConfirmation')}
                  className={fieldClassWithIcon('passwordConfirmation')}
                  placeholder="••••••••"
                />
              </div>
              <ErrorMsg name="passwordConfirmation" />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={(e) => { handleChange('terms', e.target.checked); handleBlur('terms') }}
                className="h-4 w-4 mt-1 text-ph-blue focus:ring-ph-blue border-gray-300 rounded"
              />
              <div className="ml-2">
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="text-ph-blue hover:underline">Terms of Service</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-ph-blue hover:underline">Privacy Policy</Link>
                </label>
                <ErrorMsg name="terms" />
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-1.5">
                <i className="fas fa-shield-alt text-ph-blue text-xs"></i> Verify you&apos;re human
              </p>
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-4 py-2 select-none tracking-widest">
                  {captcha.a > 0 ? `${captcha.a} + ${captcha.b} = ?` : '...'}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="?"
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent text-center font-bold text-lg"
                />
                <button
                  type="button"
                  onClick={() => { setCaptcha(genCaptcha()); setCaptchaInput('') }}
                  className="text-gray-400 hover:text-ph-blue transition p-1"
                  title="New question"
                >
                  <i className="fas fa-rotate-right"></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || captchaInput.trim() === ''}
              className="w-full bg-gradient-to-r from-ph-blue to-blue-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <BallSpinner className="mr-2" /> Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i>
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-blue-200">
          Already have an account?{' '}
          <Link href="/login" className="text-white font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
