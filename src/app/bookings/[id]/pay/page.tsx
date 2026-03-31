'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'
import QRCode from 'qrcode'

interface Booking {
  id: number
  bookingCode: string
  totalAmount: number
  downpaymentAmount: number
  balanceAmount: number
  paymentType: string | null
  expiresAt: string | null
  court: {
    name: string
  }
}

export default function PayBookingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)
  const [referenceNumber, setReferenceNumber] = useState('')
  const [gcashPhone, setGcashPhone] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const res = await fetch('/api/settings/payment')
        if (res.ok) {
          const data = await res.json()
          const phone = data.gcashNumber || '09123456789'
          setGcashPhone(phone)
          setGcashName(data.gcashName || 'Marikina Sports Center')
          // Generate QR code from phone number
          try {
            const dataUrl = await QRCode.toDataURL(phone, {
              errorCorrectionLevel: 'H',
              margin: 1,
              width: 300,
            })
            setQrDataUrl(dataUrl)
          } catch {}
        }
      } catch {
        setGcashPhone('09123456789')
        setGcashName('Marikina Sports Center')
      }
    }
    fetchPaymentSettings()
  }, [])

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.id}`)
        if (!response.ok) throw new Error('Booking not found')
        const data = await response.json()
        
        if (data.booking.status !== 'confirmed') {
          toast.error('This booking has already been processed')
          router.push(`/bookings/${params.id}`)
          return
        }
        
        setBooking(data.booking)
      } catch (error) {
        toast.error('Booking not found')
        router.push('/bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [params.id, router])

  // Countdown timer for payment expiry
  useEffect(() => {
    if (!booking?.expiresAt) return

    const expiryTime = new Date(booking.expiresAt).getTime()

    const tick = () => {
      const remaining = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setExpired(true)
        // Auto-cancel on the server
        fetch(`/api/bookings/${params.id}?action=cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Payment not submitted within the allowed time' }),
        }).then(() => {
          toast.error('Booking cancelled — payment time expired')
          router.push(`/bookings/${params.id}`)
        })
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [booking?.expiresAt, params.id, router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProofFile(file)
      setProofPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!proofFile) {
      toast.error('Please upload payment proof')
      return
    }

    if (!referenceNumber.trim()) {
      toast.error('Please enter the reference number')
      return
    }

    setUploading(true)

    try {
      // Upload proof image first
      const formData = new FormData()
      formData.append('proof', proofFile)
      formData.append('referenceNumber', referenceNumber)
      formData.append('bookingId', params.id)
      formData.append('amount', String(booking?.paymentType === 'venue' ? booking?.downpaymentAmount : booking?.totalAmount))

      const response = await fetch('/api/payments/upload-proof', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit payment')
      }

      toast.success('Payment proof uploaded! Waiting for admin verification.')
      router.push(`/bookings/${params.id}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment')
    } finally {
      setUploading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BouncingBallLoader />
      </div>
    )
  }

  if (!booking) return null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-ph-blue">
              Home
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li>
            <Link href="/bookings" className="hover:text-ph-blue">
              Bookings
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li>
            <Link href={`/bookings/${params.id}`} className="hover:text-ph-blue">
              #{booking.bookingCode}
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li className="text-gray-900">Pay</li>
        </ol>
      </nav>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-600 mb-4">
          Booking #{booking.bookingCode} - {booking.court.name}
        </p>

        {/* Countdown Timer */}
        {timeLeft !== null && (
          <div className={`rounded-lg p-4 mb-6 flex items-center gap-3 ${
            expired
              ? 'bg-red-50 border border-red-200'
              : timeLeft <= 300
                ? 'bg-red-50 border border-red-200'
                : 'bg-orange-50 border border-orange-200'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              expired || timeLeft <= 300 ? 'bg-red-100' : 'bg-orange-100'
            }`}>
              <i className={`fas fa-clock ${expired || timeLeft <= 300 ? 'text-red-600' : 'text-orange-600'}`}></i>
            </div>
            <div className="flex-1">
              {expired ? (
                <>
                  <p className="text-sm font-semibold text-red-700">Payment time expired</p>
                  <p className="text-xs text-red-500">Your booking has been cancelled</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-700">Time remaining to submit payment</p>
                  <p className={`text-lg font-bold tabular-nums ${timeLeft <= 300 ? 'text-red-600' : 'text-orange-600'}`}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="bg-ph-blue/5 border border-ph-blue/20 rounded-lg p-6 mb-6 text-center">
          {booking.paymentType === 'venue' ? (
            <>
              <p className="text-gray-600 mb-1">Downpayment Amount</p>
              <p className="text-4xl font-bold text-ph-blue">
                {formatPrice(booking.downpaymentAmount)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Total: {formatPrice(booking.totalAmount)} &middot; Remaining balance of{' '}
                <span className="font-semibold text-orange-600">{formatPrice(booking.balanceAmount)}</span>{' '}
                to be paid on-site
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-1">Amount to Pay</p>
              <p className="text-4xl font-bold text-ph-blue">
                {formatPrice(booking.totalAmount)}
              </p>
            </>
          )}
        </div>

        {/* Payment Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            <i className="fas fa-info-circle text-yellow-500 mr-2"></i>
            Payment Instructions
          </h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
            <li>Open your GCash app</li>
            <li>Scan the QR code below or send to: <strong>{gcashPhone}</strong></li>
            <li>Account name: <strong>{gcashName}</strong></li>
            <li>Enter the exact amount: <strong>{formatPrice(booking.paymentType === 'venue' ? booking.downpaymentAmount : booking.totalAmount)}</strong></li>
            <li>Take a screenshot of the payment confirmation</li>
            <li>Upload the screenshot below and enter the reference number</li>
          </ol>
        </div>

        {/* GCash QR Code */}
        <div className="bg-gray-100 rounded-lg p-8 mb-6 text-center">
          <div className="w-64 h-64 bg-white mx-auto rounded-lg flex items-center justify-center border border-gray-300 overflow-hidden">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl}
                alt="GCash QR Code"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-ph-blue rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Generating QR code...</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Or send to: <strong>{gcashPhone}</strong>
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GCash Reference Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., 1234567890"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Payment Screenshot <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-ph-blue transition">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="proof-upload"
                required
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                {proofPreview ? (
                  <img
                    src={proofPreview}
                    alt="Payment proof"
                    className="max-h-48 mx-auto rounded-lg"
                  />
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    <p className="text-gray-600">Click to upload payment screenshot</p>
                    <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
                  </>
                )}
              </label>
            </div>
            {proofPreview && (
              <button
                type="button"
                onClick={() => {
                  setProofFile(null)
                  setProofPreview(null)
                }}
                className="text-sm text-red-600 hover:text-red-800 mt-2"
              >
                <i className="fas fa-trash mr-1"></i> Remove
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || !proofFile || !referenceNumber.trim() || expired}
            className="w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <BallSpinner className="mr-2" />Uploading...
              </>
            ) : (
              <>
                <i className="fas fa-check mr-2"></i>Submit Payment Proof
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Payment verification usually takes 5-15 minutes during business hours.
        </p>
      </div>
    </div>
  )
}
