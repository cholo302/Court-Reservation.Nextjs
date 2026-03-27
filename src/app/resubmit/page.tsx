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
        throw new Error('Upload failed')
      }

      toast.success('Documents submitted successfully! Our admin will review them shortly.')
      setEmail('')
      setStep('email')
      setFormData({
        govIdType: 'national_id',
        govIdPhoto: null,
        facePhoto: null,
      })
    } catch (error) {
      toast.error('Failed to upload documents. Please try again.')
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
    </div>
  )
}
