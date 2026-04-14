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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
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
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [successEmail, setSuccessEmail] = useState('')

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

      setRegistrationSuccess(true)
      setSuccessEmail(formData.email)
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
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 shadow-lg">
              <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">OLOPSC Court Reservation</span>
          </Link>
          <h2 className="mt-8 text-3xl font-extrabold text-white">Create Account</h2>
          <p className="mt-2 text-blue-200">Join and start booking courts</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {registrationSuccess ? (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <i className="fas fa-envelope text-green-600 text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
              <p className="text-gray-600 mb-1">
                We&apos;ve sent a verification link to
              </p>
              <p className="text-gray-900 font-semibold mb-6 break-all">{successEmail}</p>
              <p className="text-gray-600 text-sm mb-1">Please check your inbox and spam folder.</p>
              <p className="text-gray-500 text-xs mb-6">The link will expire in 24 hours.</p>
              
              <button
                onClick={() => {
                  setRegistrationSuccess(false)
                  setFormData({ ...formData, email: '', phone: '', password: '', passwordConfirmation: '' })
                  setErrors({})
                  setTouched({})
                  setCaptcha(genCaptcha())
                  setCaptchaInput('')
                }}
                className="text-ph-blue hover:text-blue-800 text-sm font-medium flex items-center gap-2 mb-8"
              >
                <i className="fas fa-redo"></i>
                Try a different email
              </button>

              <Link
                href="/login"
                className="w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition text-center"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
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
              {!errors.email && formData.email && (
                <p className="text-xs text-blue-500 mt-1">
                  <i className="fas fa-info-circle mr-1"></i>
                  A verification email will be sent to this address. Please verify to activate your account.
                </p>
              )}
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
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  className={fieldClassWithIcon('password')}
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
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="passwordConfirmation"
                  name="passwordConfirmation"
                  value={formData.passwordConfirmation}
                  onChange={(e) => handleChange('passwordConfirmation', e.target.value)}
                  onBlur={() => handleBlur('passwordConfirmation')}
                  className={fieldClassWithIcon('passwordConfirmation')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
                </button>
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
                  <button type="button" onClick={() => setShowTermsModal(true)} className="text-ph-blue hover:underline font-medium">Terms of Service</button>{' '}
                  and{' '}
                  <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-ph-blue hover:underline font-medium">Privacy Policy</button>
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
          )}
        </div>

        {!registrationSuccess && (
          <p className="mt-8 text-center text-blue-200">
            Already have an account?{' '}
            <Link href="/login" className="text-white font-bold hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Terms of Service</h2>
              <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
              <p className="text-xs text-gray-500">Last updated: April 10, 2026. By creating an OLOPSC Court Reservation account, you agree to these Terms.</p>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">1. Acceptance of Terms</h3>
                <p>By accessing or using the OLOPSC Court Reservation system (&quot;the Platform&quot;), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, you may not use the Platform.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">2. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate, current, and complete information during registration. The administration reserves the right to suspend or terminate accounts that violate these terms.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">3. Court Reservation Rules</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Reservations are subject to court availability and must be made through the Platform.</li>
                  <li>Users must complete ID verification before making reservations.</li>
                  <li>Reservations must be paid within the specified time frame or they will be automatically cancelled.</li>
                  <li>Users must present their QR code at check-in for entry.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">4. Payments & Refunds</h3>
                <p>All payments are processed via GCash QR code. Payment proofs must be uploaded for admin verification. Refund policies are determined by the administration on a case-by-case basis.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">5. Cancellation Policy</h3>
                <p>Users may cancel their reservations according to the cancellation policy set by the administration. Late cancellations or no-shows may result in penalties or restricted booking privileges.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">6. Prohibited Conduct</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Misuse of the reservation system, including false bookings.</li>
                  <li>Sharing or transferring reservations without authorization.</li>
                  <li>Damaging court facilities or equipment.</li>
                  <li>Any behavior that disrupts other users or the administration.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">7. Account Termination</h3>
                <p>The administration may suspend or terminate your account at any time for violation of these Terms, without prior notice.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Privacy Policy & Data Protection</h2>
              <button onClick={() => setShowPrivacyModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-700">
              <p className="text-xs text-gray-500">Last updated: April 10, 2026. OLOPSC Court Reservation is committed to protecting your personal data in compliance with applicable laws.</p>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">Applicable Laws & Standards</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Philippine Data Privacy Act of 2012 (R.A. 10173)</strong> — governs the collection, use, and protection of personal information of Philippine residents.</li>
                  <li><strong>Payment data</strong> — The Platform does not store payment card numbers. Payments are made via GCash QR code. Payment screenshots are stored securely and deleted after verification.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">What Data We Collect</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account data:</strong> name, email address, phone number, profile photo.</li>
                  <li><strong>Verification data:</strong> government ID photo, face photo, ID type.</li>
                  <li><strong>Booking data:</strong> reservation history, court preferences, payment records.</li>
                  <li><strong>Usage data:</strong> pages visited, features used (for platform improvement).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">How We Use Your Data</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To create and manage your account.</li>
                  <li>To process court reservations and payments.</li>
                  <li>To verify your identity for security purposes.</li>
                  <li>To send notifications (booking confirmations, payment updates).</li>
                  <li>To improve the Platform and user experience.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">Data Security</h3>
                <p>We implement appropriate security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. Passwords are encrypted and never stored in plain text.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">Your Rights</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access your personal data stored on the Platform.</li>
                  <li>Request correction of inaccurate data.</li>
                  <li>Request deletion of your account and associated data.</li>
                  <li>Withdraw consent for data processing at any time.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">Data Retention</h3>
                <p>Personal data is retained only as long as necessary for the purposes outlined above. Upon account deletion, your data will be permanently removed within a reasonable time frame.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-1">Contact</h3>
                <p>For questions or concerns about this Privacy Policy, please contact the OLOPSC administration.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
