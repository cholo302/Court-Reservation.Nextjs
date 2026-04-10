'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'
import toast from 'react-hot-toast'
import CameraCapture from '@/components/ui/CameraCapture'

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

export default function VerifyPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [govIdType, setGovIdType] = useState('')
  const [govIdPhoto, setGovIdPhoto] = useState<File | null>(null)
  const [govIdPreview, setGovIdPreview] = useState<string | null>(null)
  const [facePhoto, setFacePhoto] = useState<File | null>(null)
  const [facePreview, setFacePreview] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const verificationStatus = session?.user?.verificationStatus ?? 'none'

  // If already verified, redirect
  if (verificationStatus === 'verified') {
    router.push('/')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!govIdType) {
      toast.error('Please select your ID type')
      return
    }
    if (!govIdPhoto) {
      toast.error('Please upload your government ID photo')
      return
    }
    if (!facePhoto) {
      toast.error('Please upload your face photo')
      return
    }
    if (!termsAccepted) {
      toast.error('Please agree to the Terms and Conditions')
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('govIdType', govIdType)
      formData.append('govIdPhoto', govIdPhoto)
      formData.append('facePhoto', facePhoto)

      const response = await fetch('/api/auth/verify-id', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Verification submission failed'
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
        } catch {
          errorMessage = `Server error (${response.status}). Please try again.`
        }
        throw new Error(errorMessage)
      }

      toast.success('ID verification submitted! Please wait for admin approval.')
      
      // Refresh session to pick up new verification status
      await updateSession()
      
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── Pending State ──
  if (verificationStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-200/50 mb-6">
            <i className="fas fa-clock text-white text-3xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Verification Under Review</h1>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Your documents have been submitted and are currently being reviewed by an admin. This usually takes 1-2 business days.
          </p>

          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-white text-sm"></i>
                </div>
                <span className="text-sm font-medium text-green-700">Submitted</span>
              </div>
              <div className="w-8 h-0.5 bg-amber-300"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-pulse">
                  <i className="fas fa-hourglass-half text-white text-sm"></i>
                </div>
                <span className="text-sm font-medium text-amber-700">Under Review</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-gray-400 text-sm"></i>
                </div>
                <span className="text-sm font-medium text-gray-400">Verified</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <i className="fas fa-info-circle text-amber-600 mt-0.5"></i>
                <div className="text-left">
                  <p className="text-sm font-medium text-amber-900">What happens next?</p>
                  <p className="text-sm text-amber-700 mt-1">
                    An admin will review your submitted ID and face photo. You&apos;ll be notified once your verification is approved. You can start booking courts after approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 text-ph-blue hover:underline font-medium text-sm"
          >
            <i className="fas fa-arrow-left"></i> Back to Home
          </Link>
        </div>
      </div>
    )
  }

  // ── Rejected / Resubmit State ──
  const isRejected = verificationStatus === 'rejected'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 ${isRejected ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gradient-to-br from-ph-blue to-blue-600'} rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
            <i className={`fas ${isRejected ? 'fa-exclamation-triangle' : 'fa-id-card'} text-white text-2xl`}></i>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
            {isRejected ? 'Resubmit Your Documents' : 'Verify Your Identity'}
          </h1>
          <p className="mt-2 text-gray-500">
            {isRejected
              ? 'Your previous submission was not approved. Please upload new documents.'
              : 'Upload your government ID and a face photo to start booking courts'}
          </p>
        </div>

        {/* Rejected Warning Banner */}
        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <i className="fas fa-triangle-exclamation text-red-600 mt-0.5"></i>
              <div>
                <p className="text-sm font-medium text-red-900">Verification Rejected</p>
                <p className="text-sm text-red-700 mt-1">
                  Your previous ID documents were not accepted. Common reasons include blurry photos, expired IDs, or mismatched information. Please resubmit with clear, valid documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Banner (only for first-time submission) */}
        {!isRejected && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-600 mt-0.5"></i>
              <div>
                <p className="text-sm font-medium text-blue-900">Why verify?</p>
                <p className="text-sm text-blue-700 mt-1">
                  ID verification is required to book courts. This helps us ensure the safety and security of all users. Your documents will be reviewed by an admin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ID Type Selection */}
            <div>
              <label htmlFor="govIdType" className="block text-sm font-semibold text-gray-700 mb-1.5">
                <i className="fas fa-id-badge mr-1.5 text-gray-400"></i>
                Government ID Type
              </label>
              <select
                id="govIdType"
                value={govIdType}
                onChange={(e) => setGovIdType(e.target.value)}
                required
                className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent bg-gray-50 transition-colors"
              >
                <option value="">-- Select ID Type --</option>
                {ID_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Government ID Photo Upload */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-id-card mr-1.5 text-gray-400"></i>
                Government ID Photo
              </h3>
              <CameraCapture
                id="govIdPhoto"
                label="Upload ID Card Photo"
                required
                facingMode="environment"
                preview={govIdPreview}
                helpText="JPG, PNG, GIF or WebP - Max 5MB - Clear photo of your ID"
                onCapture={(file, url) => {
                  setGovIdPhoto(file)
                  setGovIdPreview(url)
                }}
                onFileSelect={(file, url) => {
                  setGovIdPhoto(file)
                  setGovIdPreview(url)
                }}
                onRemove={() => {
                  setGovIdPhoto(null)
                  setGovIdPreview(null)
                }}
              />
            </div>

            {/* Face Photo Upload */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                <i className="fas fa-camera mr-1.5 text-gray-400"></i>
                Face Photo (Selfie)
              </h3>
              <p className="text-xs text-gray-500 mb-2">
                <i className="fas fa-info-circle mr-1"></i>
                This will be used as your profile photo in the app
              </p>
              <CameraCapture
                id="facePhoto"
                label="Upload Face Photo"
                required
                facingMode="user"
                preview={facePreview}
                helpText="JPG, PNG, GIF or WebP - Max 5MB - Clear frontal face photo"
                onCapture={(file, url) => {
                  setFacePhoto(file)
                  setFacePreview(url)
                }}
                onFileSelect={(file, url) => {
                  setFacePhoto(file)
                  setFacePreview(url)
                }}
                onRemove={() => {
                  setFacePhoto(null)
                  setFacePreview(null)
                }}
              />
            </div>

            {/* Terms and Conditions */}
            <div className="border-t pt-5">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${isRejected ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/25' : 'bg-gradient-to-r from-ph-blue to-blue-600 hover:shadow-blue-500/25'} text-white py-3.5 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]`}
            >
              {isLoading ? (
                <>
                  <BallSpinner className="mr-2" /> Submitting...
                </>
              ) : (
                <>
                  <i className={`fas ${isRejected ? 'fa-rotate-right' : 'fa-shield-check'} mr-2`}></i>
                  {isRejected ? 'Resubmit for Verification' : 'Submit for Verification'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Skip for now */}
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-ph-blue hover:underline font-medium">
            <i className="fas fa-arrow-left mr-1"></i> {isRejected ? 'Back to Home' : 'Skip for now'}
          </Link>
          {!isRejected && (
            <>
              <span className="mx-2">·</span>
              You won&apos;t be able to book courts until verified
            </>
          )}
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
