'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'

interface Booking {
  id: number
  bookingCode: string
  status: string
  bookingDate: string
  startTime: string
  endTime: string
  playerCount: number
  totalAmount: number
  downpaymentAmount: number
  balanceAmount: number
  paymentType: string | null
  isHalfCourt: boolean
  notes: string | null
  createdAt: string
  checkedInAt: string | null
  checkedOutAt: string | null
  court: {
    id: number
    name: string
    location: string
    city: string
    thumbnail: string | null
    hourlyRate: number
  }
  user: {
    name: string
    email: string
    phone: string
  }
  payment: {
    id: number
    referenceNumber: string
    status: string
    method: string
    amount: number
    transactionId: string | null
    proofScreenshot: string | null
  } | null
}

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'fa-clock' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'fa-check-circle' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', icon: 'fa-check-double' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', icon: 'fa-flag-checkered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: 'fa-times-circle' },
  no_show: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'fa-user-slash' },
  expired: { bg: 'bg-gray-100', text: 'text-gray-800', icon: 'fa-hourglass-end' },
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const prevPaymentStatus = useRef<string | null>(null)

  const fetchBooking = async (silent = false) => {
    try {
      const response = await fetch(`/api/bookings/${params.id}`)
      if (!response.ok) throw new Error('Booking not found')
      const data = await response.json()
      const newStatus = data.booking?.payment?.status ?? null

      if (silent) {
        if (prevPaymentStatus.current === 'pending' && newStatus === 'downpayment') {
          toast.success('Your payment has been approved! Your QR code is now available.')
        } else if (prevPaymentStatus.current === 'pending' && newStatus === 'rejected') {
          toast.error('Your payment was rejected. Please resubmit your proof.')
        }
      }

      prevPaymentStatus.current = newStatus
      setBooking(data.booking)
    } catch (error) {
      if (!silent) {
        toast.error('Booking not found')
        router.push('/bookings')
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
    const interval = setInterval(() => fetchBooking(true), 15000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchBooking(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [params.id])

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(`/api/bookings/${params.id}?action=cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User cancelled' }),
      })

      if (!response.ok) throw new Error('Failed to cancel booking')

      toast.success('Booking cancelled successfully')
      router.push('/bookings')
    } catch (error) {
      toast.error('Failed to cancel booking')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BouncingBallLoader />
      </div>
    )
  }

  if (!booking) return null

  const config = statusConfig[booking.status] || statusConfig.pending

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <li className="text-gray-900">#{booking.bookingCode}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}
              >
                <i className={`fas ${config.icon} mr-1`}></i>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
              {booking.payment?.status === 'downpayment' && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-hand-holding-usd mr-1"></i>Downpayment
                </span>
              )}
              {booking.payment?.status === 'paid' && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <i className="fas fa-check-circle mr-1"></i>Paid
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.bookingCode}</h1>
            <p className="text-gray-500">
              Created on {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {booking.status === 'confirmed' && !booking.payment && (
              <>
                <Link
                  href={`/bookings/${booking.id}/pay`}
                  className="inline-flex items-center px-4 py-2 bg-ph-blue text-white rounded-lg font-medium hover:bg-blue-800 transition"
                >
                  <i className="fas fa-credit-card mr-2"></i>Pay Now
                </Link>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition whitespace-nowrap"
                >
                  <i className="fas fa-times mr-2"></i>Cancel
                </button>
              </>
            )}

            {booking.payment?.status === 'processing' && (
              <span
                className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
              >
                <i className="fas fa-hourglass-half mr-2"></i>Awaiting Payment Verification
              </span>
            )}

            {(booking.payment?.status === 'downpayment' || booking.payment?.status === 'paid') && (
              <Link
                href={`/bookings/${booking.id}/qr`}
                className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition"
              >
                <i className="fas fa-qrcode mr-2"></i>View QR Code
              </Link>
            )}

            {booking.status === 'completed' && booking.checkedOutAt && (
              <span className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium">
                <i className="fas fa-door-open mr-2"></i>Session Ended
              </span>
            )}

            {booking.status === 'completed' && !booking.checkedOutAt && (
              <>
                <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
                  <i className="fas fa-check-double mr-2"></i>Checked In
                </span>
                <Link
                  href={`/bookings/${booking.id}/qr`}
                  className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition"
                >
                  <i className="fas fa-qrcode mr-2"></i>Exit Pass
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Court Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            <i className="fas fa-basketball-ball mr-2 text-ph-blue"></i>Court Information
          </h2>

          <div className="flex items-start mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden mr-4 flex-shrink-0">
              {booking.court.thumbnail ? (
                <img
                  src={booking.court.thumbnail}
                  alt={booking.court.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-basketball-ball text-gray-400 text-2xl"></i>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{booking.court.name}</h3>
              <p className="text-sm text-gray-500">
                <i className="fas fa-map-marker-alt mr-1"></i>
                {booking.court.location}, {booking.court.city}
              </p>
              <Link
                href={`/courts/${booking.court.id}`}
                className="text-sm text-ph-blue hover:underline"
              >
                View Court Details
              </Link>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            <i className="fas fa-calendar-alt mr-2 text-ph-blue"></i>Booking Details
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">{formatDate(booking.bookingDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time</span>
              <span className="font-medium">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Players</span>
              <span className="font-medium">{booking.playerCount}</span>
            </div>
            {booking.isHalfCourt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Court Type</span>
                <span className="font-medium">Half Court</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            <i className="fas fa-credit-card mr-2 text-ph-blue"></i>Payment Information
          </h2>

          {booking.payment ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Reference</span>
                <span className="font-medium">{booking.payment.referenceNumber}</span>
              </div>
              {booking.payment.transactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">GCash Ref</span>
                  <span className="font-medium">{booking.payment.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">{booking.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`font-medium capitalize ${
                    booking.payment.status === 'paid'
                      ? 'text-green-600'
                      : booking.payment.status === 'downpayment'
                      ? 'text-orange-600'
                      : booking.payment.status === 'processing'
                      ? 'text-blue-600'
                      : booking.payment.status === 'rejected'
                      ? 'text-red-600'
                      : 'text-yellow-600'
                  }`}
                >
                  {booking.payment.status === 'paid' && booking.paymentType === 'venue'
                    ? 'Fully Paid'
                    : booking.payment.status === 'paid'
                    ? 'Verified'
                    : booking.payment.status === 'downpayment'
                    ? 'Downpayment Verified'
                    : booking.payment.status === 'processing'
                    ? 'Awaiting Verification'
                    : booking.payment.status}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">
                  {booking.payment.status === 'paid' ? 'Amount Paid' : 
                   booking.payment.status === 'downpayment' ? 'Downpayment Paid' : 
                   'Amount Submitted'}
                </span>
                <span className="text-xl font-bold text-ph-blue">
                  {formatPrice(booking.payment.amount)}
                </span>
              </div>
              {booking.payment.status === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-blue-700">
                    <i className="fas fa-info-circle mr-1"></i>
                    Your payment proof has been submitted and is waiting for admin verification.
                  </p>
                </div>
              )}
              {booking.payment.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-red-700">
                    <i className="fas fa-exclamation-circle mr-1"></i>
                    Your payment was rejected. Please contact support or submit a new payment.
                  </p>
                </div>
              )}
              {booking.payment.status === 'downpayment' && booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-orange-700">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    <strong>Remaining Balance:</strong> {formatPrice(booking.balanceAmount)} — to be paid on-site at the venue.
                  </p>
                </div>
              )}
              {booking.payment.status === 'paid' && booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                  <p className="text-sm text-green-700">
                    <i className="fas fa-check-circle mr-1"></i>
                    <strong>Fully Paid:</strong> Total of {formatPrice(booking.totalAmount)} has been collected (downpayment + balance).
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-clock text-yellow-500 text-3xl mb-2"></i>
              <p className="text-gray-600">Payment pending</p>
              <p className="text-2xl font-bold text-ph-blue mt-2">
                {formatPrice(booking.totalAmount)}
              </p>
              {booking.status === 'confirmed' && (
                <Link
                  href={`/bookings/${booking.id}/pay`}
                  className="inline-block mt-4 bg-ph-blue text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition"
                >
                  Pay Now
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            <i className="fas fa-user mr-2 text-ph-blue"></i>Contact Information
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name</span>
              <span className="font-medium">{booking.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email</span>
              <span className="font-medium">{booking.user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone</span>
              <span className="font-medium">{booking.user.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            <i className="fas fa-sticky-note mr-2 text-ph-blue"></i>Notes
          </h2>
          <p className="text-gray-600">{booking.notes}</p>
        </div>
      )}

      {/* Check-in / Check-out Timeline */}
      {(booking.checkedInAt || booking.checkedOutAt) && (
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            <i className="fas fa-clock mr-2 text-ph-blue"></i>Session Timeline
          </h2>
          <div className="space-y-3">
            {booking.checkedInAt && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-sign-in-alt text-green-600 text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Checked In</p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.checkedInAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </p>
                </div>
              </div>
            )}
            {booking.checkedOutAt && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-door-open text-indigo-600 text-xs"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Checked Out</p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.checkedOutAt).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit', hour12: true,
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
