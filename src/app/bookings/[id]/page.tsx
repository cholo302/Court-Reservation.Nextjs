'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Booking {
  id: number
  bookingCode: string
  status: string
  bookingDate: string
  startTime: string
  endTime: string
  playerCount: number
  totalAmount: number
  isHalfCourt: boolean
  notes: string | null
  createdAt: string
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

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.id}`)
        if (!response.ok) throw new Error('Booking not found')
        const data = await response.json()
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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(`/api/bookings/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
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
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
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
            <div className="flex items-center mb-2">
              <span
                className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-sm font-medium`}
              >
                <i className={`fas ${config.icon} mr-1`}></i>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Booking #{booking.bookingCode}</h1>
            <p className="text-gray-500">
              Created on {new Date(booking.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            {booking.status === 'pending' && (
              <>
                <Link
                  href={`/bookings/${booking.id}/pay`}
                  className="inline-flex items-center px-4 py-2 bg-ph-blue text-white rounded-lg font-medium hover:bg-blue-800 transition"
                >
                  <i className="fas fa-credit-card mr-2"></i>Pay Now
                </Link>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition"
                >
                  <i className="fas fa-times mr-2"></i>Cancel
                </button>
              </>
            )}

            {['paid', 'confirmed'].includes(booking.status) && (
              <Link
                href={`/bookings/${booking.id}/qr`}
                className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition"
              >
                <i className="fas fa-qrcode mr-2"></i>View QR Code
              </Link>
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
              <div className="flex justify-between">
                <span className="text-gray-600">Method</span>
                <span className="font-medium capitalize">{booking.payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span
                  className={`font-medium capitalize ${
                    booking.payment.status === 'verified'
                      ? 'text-green-600'
                      : booking.payment.status === 'pending'
                      ? 'text-yellow-600'
                      : 'text-gray-600'
                  }`}
                >
                  {booking.payment.status}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="font-semibold">Amount Paid</span>
                <span className="text-xl font-bold text-ph-blue">
                  {formatPrice(booking.payment.amount)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-clock text-yellow-500 text-3xl mb-2"></i>
              <p className="text-gray-600">Payment pending</p>
              <p className="text-2xl font-bold text-ph-blue mt-2">
                {formatPrice(booking.totalAmount)}
              </p>
              {booking.status === 'pending' && (
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
    </div>
  )
}
