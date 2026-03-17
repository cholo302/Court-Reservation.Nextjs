'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const ID_TYPE_LABELS: Record<string, string> = {
  lto_license: "LTO Driver's License",
  passport: 'Philippine Passport',
  nbi: 'NBI Clearance',
  national_id: 'National ID',
  barangay_id: 'Barangay ID',
  sss_id: 'SSS ID',
  tin_id: 'TIN ID',
  prc_id: 'PRC License',
  postal_id: 'Postal ID',
}

const ID_NUMBER_LABELS: Record<string, string> = {
  lto_license: 'License No.',
  passport: 'Passport No.',
  nbi: 'NBI Clearance No.',
  national_id: 'PhilSys No.',
  barangay_id: 'Barangay ID No.',
  sss_id: 'SSS No.',
  tin_id: 'TIN No.',
  prc_id: 'PRC License No.',
  postal_id: 'Postal ID No.',
}

interface IdInfo {
  id: number
  govIdType: string | null
  govIdPhoto: string | null
  govIdNumber: string | null
  govIdName: string | null
  govIdBirthdate: string | null
  govIdExpiry: string | null
  govIdAddress: string | null
  govIdDetails: string | null
  facePhoto: string | null
  profileImage: string | null
}

export default function IdInfoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [idInfo, setIdInfo] = useState<IdInfo | null>(null)
  const [showIdImage, setShowIdImage] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }

    const fetchIdInfo = async () => {
      try {
        const response = await fetch('/api/profile/id-info')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setIdInfo(data.idInfo)
      } catch (error) {
        console.error('Error fetching ID info:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchIdInfo()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  if (!idInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500">No ID information found.</p>
        <Link href="/profile" className="text-ph-blue hover:underline mt-2 inline-block">
          Back to Profile
        </Link>
      </div>
    )
  }

  const idTypeLabel = idInfo.govIdType ? ID_TYPE_LABELS[idInfo.govIdType] || idInfo.govIdType : 'Unknown'
  const idNumberLabel = idInfo.govIdType ? ID_NUMBER_LABELS[idInfo.govIdType] || 'ID No.' : 'ID No.'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-ph-blue hover:text-blue-700 font-medium mb-8 transition-colors"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Profile
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        <i className="fas fa-id-card mr-2 text-ph-blue"></i>
        My ID Information
      </h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ID Card Preview */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile Photo */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Profile Photo</h3>
            {idInfo.facePhoto ? (
              <img
                src={idInfo.facePhoto}
                alt="Profile Photo"
                className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-ph-blue/20"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <i className="fas fa-user text-gray-400 text-4xl"></i>
              </div>
            )}
          </div>

          {/* ID Card Image */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Government ID</h3>
            {idInfo.govIdPhoto ? (
              <div>
                <img
                  src={idInfo.govIdPhoto}
                  alt="Government ID"
                  className={`w-full h-auto rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition ${
                    showIdImage ? '' : 'max-h-48 object-cover'
                  }`}
                  onClick={() => setShowIdImage(!showIdImage)}
                />
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Click to {showIdImage ? 'collapse' : 'expand'}
                </p>
              </div>
            ) : (
              <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-400 text-sm">No ID uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* ID Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-ph-blue to-blue-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-id-card text-white"></i>
                </div>
                <div>
                  <h2 className="text-white font-semibold">{idTypeLabel}</h2>
                  <p className="text-blue-200 text-sm">Government ID Details</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="p-6">
              <div className="space-y-4">
                {/* ID Number */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-ph-blue/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-hashtag text-ph-blue text-sm"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{idNumberLabel}</p>
                    <p className="text-gray-900 font-semibold text-lg">
                      {idInfo.govIdNumber || <span className="text-gray-400 text-base font-normal italic">Not available</span>}
                    </p>
                  </div>
                </div>

                {/* Name on ID */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-user text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Name on ID</p>
                    <p className="text-gray-900 font-medium">
                      {idInfo.govIdName || <span className="text-gray-400 font-normal italic">Not available</span>}
                    </p>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-calendar text-purple-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date of Birth</p>
                    <p className="text-gray-900 font-medium">
                      {idInfo.govIdBirthdate || <span className="text-gray-400 font-normal italic">Not available</span>}
                    </p>
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-clock text-orange-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Expiry Date</p>
                    <p className="text-gray-900 font-medium">
                      {idInfo.govIdExpiry || <span className="text-gray-400 font-normal italic">Not available</span>}
                    </p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fas fa-map-marker-alt text-red-600 text-sm"></i>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Address</p>
                    <p className="text-gray-900 font-medium">
                      {idInfo.govIdAddress || <span className="text-gray-400 font-normal italic">Not available</span>}
                    </p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-800">
                  <i className="fas fa-info-circle mr-1"></i>
                  ID information was captured during registration. If any details are incorrect or missing,
                  please contact admin support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {showIdImage && idInfo.govIdPhoto && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setShowIdImage(false)}
        >
          <div className="max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowIdImage(false)}
                className="text-white hover:text-gray-300 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <img
              src={idInfo.govIdPhoto}
              alt="Government ID"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
