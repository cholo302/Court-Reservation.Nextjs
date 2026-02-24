'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

const ID_TYPES = [
  { value: 'lto_license', label: "LTO Driver's License" },
  { value: 'passport', label: 'Philippine Passport' },
  { value: 'nbi', label: 'NBI Clearance' },
  { value: 'national_id', label: 'National ID' },
  { value: 'barangay_id', label: 'Barangay ID' },
  { value: 'sss_id', label: 'SSS ID' },
  { value: 'tin_id', label: 'TIN ID' },
  { value: 'prc_id', label: 'PRC License' },
  { value: 'postal_id', label: 'Postal ID' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirmation: '',
    govIdType: '',
    terms: false,
  })
  const [govIdPhoto, setGovIdPhoto] = useState<File | null>(null)
  const [govIdPreview, setGovIdPreview] = useState<string | null>(null)
  const [facePhoto, setFacePhoto] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)

  const handleGovIdPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGovIdPhoto(file)
      setGovIdPreview(URL.createObjectURL(file))
    }
  }

  const handleFacePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFacePhoto(file)
      setFacePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.passwordConfirmation) {
      toast.error('Passwords do not match')
      return
    }

    if (!formData.terms) {
      toast.error('Please agree to the Terms of Service')
      return
    }

    if (!govIdPhoto || !facePhoto) {
      toast.error('Please upload both ID and face photos')
      return
    }

    setIsLoading(true)

    try {
      const submitData = new FormData()
      submitData.append('name', formData.name)
      submitData.append('email', formData.email)
      submitData.append('phone', formData.phone)
      submitData.append('password', formData.password)
      submitData.append('govIdType', formData.govIdType)
      submitData.append('govIdPhoto', govIdPhoto)
      submitData.append('facePhoto', facePhoto)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: submitData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      toast.success(
        'Account created successfully! Please wait for admin verification (5 minutes to 1 hour).'
      )
      router.push('/login')
    } catch (error: any) {
      toast.error(error.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <i className="fas fa-basketball-ball text-ph-blue text-3xl mr-2"></i>
            <span className="text-2xl font-bold text-ph-blue">Court Reservation</span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="mt-2 text-gray-600">Join and start booking courts</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-user text-gray-400"></i>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  placeholder="Juan Dela Cruz"
                />
              </div>
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  placeholder="juan@example.com"
                />
              </div>
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
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  placeholder="09171234567"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Philippine mobile number format</p>
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">At least 6 characters</p>
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
                  onChange={(e) => setFormData({ ...formData, passwordConfirmation: e.target.value })}
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Government ID Verification Section */}
            <div className="border-t pt-5 mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Government ID Verification
              </h3>

              <div>
                <label htmlFor="govIdType" className="block text-sm font-medium text-gray-700 mb-1">
                  ID Type
                </label>
                <select
                  id="govIdType"
                  name="govIdType"
                  value={formData.govIdType}
                  onChange={(e) => setFormData({ ...formData, govIdType: e.target.value })}
                  required
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                >
                  <option value="">-- Select ID Type --</option>
                  {ID_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ID Card Photo Upload */}
              <div className="mt-3">
                <label htmlFor="govIdPhoto" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload ID Card Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="govIdPhoto"
                  name="govIdPhoto"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleGovIdPhotoChange}
                  required
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG, GIF or WebP - Max 5MB - Clear photo of your ID
                </p>

                {govIdPreview && (
                  <div className="mt-3">
                    <img
                      src={govIdPreview}
                      alt="ID Preview"
                      className="w-full h-auto rounded-lg border border-gray-300 max-h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setGovIdPhoto(null)
                        setGovIdPreview(null)
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      <i className="fas fa-trash mr-1"></i> Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Face Photo Section */}
            <div className="border-t pt-5 mt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Face Photo (Profile)</h3>

              <div>
                <label htmlFor="facePhoto" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Face Photo <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  id="facePhoto"
                  name="facePhoto"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFacePhotoChange}
                  required
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG, GIF or WebP - Max 5MB - Clear frontal face photo
                </p>

                {facePreview && (
                  <div className="mt-3">
                    <img
                      src={facePreview}
                      alt="Face Preview"
                      className="w-full h-auto rounded-lg border border-gray-300 max-h-40 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFacePhoto(null)
                        setFacePreview(null)
                      }}
                      className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      <i className="fas fa-trash mr-1"></i> Remove Photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={formData.terms}
                onChange={(e) => setFormData({ ...formData, terms: e.target.checked })}
                required
                className="h-4 w-4 mt-1 text-ph-blue focus:ring-ph-blue border-gray-300 rounded"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{' '}
                <Link href="/terms" className="text-ph-blue hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-ph-blue hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i> Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i> Create Account
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or sign up with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <i className="fab fa-facebook text-blue-600 text-xl mr-2"></i>
                <span className="text-sm font-medium text-gray-700">Facebook</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                <i className="fab fa-google text-red-500 text-xl mr-2"></i>
                <span className="text-sm font-medium text-gray-700">Google</span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-ph-blue font-semibold hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
