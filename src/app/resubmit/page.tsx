'use client'

import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'

export default function ResubmitPage() {
  const [step, setStep] = useState<'email' | 'upload'>('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [formData, setFormData] = useState({
    govIdType: 'national_id',
    govIdPhoto: null as File | null,
    facePhoto: null as File | null,
  })

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`)

      if (!res.ok) {
        toast.error('Email not found in our system')
        return
      }

      const data = await res.json()
      setUserId(data.id)
      setStep('upload')
      toast.success('Email verified! Please upload your documents.')
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'govIdPhoto' | 'facePhoto') => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, [field]: file })
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.govIdPhoto || !formData.facePhoto) {
      toast.error('Please upload both documents')
      return
    }
    if (!termsAccepted) {
      toast.error('Please agree to the Terms of Service and Privacy Policy')
      return
    }

    setIsLoading(true)
    const uploadFormData = new FormData()
    uploadFormData.append('email', email)
    uploadFormData.append('govIdType', formData.govIdType)
    uploadFormData.append('govIdPhoto', formData.govIdPhoto)
    uploadFormData.append('facePhoto', formData.facePhoto)

    try {
      const res = await fetch('/api/profile/resubmit-documents', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!res.ok) {
        let errorMessage = 'Upload failed'
        try {
          const data = await res.json()
          errorMessage = data.error || errorMessage
        } catch {
          errorMessage = `Server error (${res.status}). Please try again.`
        }
        throw new Error(errorMessage)
      }

      toast.success('Documents submitted successfully! Our admin will review them shortly.')
      setEmail('')
      setStep('email')
      setFormData({
        govIdType: 'national_id',
        govIdPhoto: null,
        facePhoto: null,
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      // Handle network errors specifically
      if (error?.message === 'Failed to fetch' || error?.name === 'TypeError') {
        toast.error('Network error. Please check your connection and try again.')
      } else {
        toast.error(error?.message || 'Failed to upload documents. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900"></div>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-all">
              <span className="text-white font-bold">CR</span>
            </div>
          </Link>
          <h2 className="mt-8 text-3xl font-extrabold text-white">Resubmit Documents</h2>
          <p className="mt-2 text-blue-200">Upload your ID and selfie photo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                    className="block w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-colors text-sm"
                    placeholder="juan@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <BallSpinner className="mr-2" /> Verifying...
                  </>
                ) : (
                  <>
                    Verify Email <i className="fas fa-arrow-right ml-2 text-sm"></i>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleUpload} className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <i className="fas fa-info-circle mr-2"></i>
                Verified as: <strong>{email}</strong>
              </div>

              <div>
                <label htmlFor="govIdType" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Government ID Type
                </label>
                <select
                  id="govIdType"
                  value={formData.govIdType}
                  onChange={(e) => setFormData({ ...formData, govIdType: e.target.value })}
                  className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="national_id">National ID</option>
                  <option value="passport">Passport</option>
                  <option value="drivers_license">Driver's License</option>
                </select>
              </div>

              <div>
                <label htmlFor="govIdPhoto" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Government ID Photo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="govIdPhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'govIdPhoto')}
                    required
                    className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {formData.govIdPhoto && (
                    <div className="text-xs text-green-600 mt-1">
                      <i className="fas fa-check mr-1"></i>
                      {formData.govIdPhoto.name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="facePhoto" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Selfie Photo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="facePhoto"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'facePhoto')}
                    required
                    className="block w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {formData.facePhoto && (
                    <div className="text-xs text-green-600 mt-1">
                      <i className="fas fa-check mr-1"></i>
                      {formData.facePhoto.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="border-t pt-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 mt-1 text-ph-blue focus:ring-ph-blue border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-ph-blue hover:underline font-medium">Terms of Service</button>{' '}
                    and{' '}
                    <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-ph-blue hover:underline font-medium">Privacy Policy</button>
                    . I confirm that the documents I&apos;m uploading are genuine and belong to me.
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <BallSpinner className="mr-2" /> Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload mr-2"></i> Submit Documents
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-blue-200">
          <Link href="/login" className="text-white font-semibold hover:underline">
            Back to Login
          </Link>
        </p>
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
