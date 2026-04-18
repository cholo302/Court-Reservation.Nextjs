'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'

interface BookingDetail {
  id: number
  bookingCode: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  downpaymentAmount: number
  balanceAmount: number
  status: string
  courtName: string
  courtType: string
  userName: string
  userEmail: string
  userPhone: string
  playerCount: number
  durationHours: number
  hourlyRate: number
  paymentType: string | null
}

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'fa-clock' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'fa-check-circle' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', icon: 'fa-check-double' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', icon: 'fa-flag-checkered' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: 'fa-times-circle' },
}

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`)
        if (!response.ok) {
          toast.error('Booking not found')
          router.push('/admin/bookings')
          return
        }
        const data = await response.json()
        setBooking(data.booking || data)
      } catch (error) {
        console.error('Error fetching booking:', error)
        toast.error('Failed to load booking details')
        router.push('/admin/bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [bookingId, router])

  const handleAction = async (action: string) => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Action failed')

      toast.success(`Booking ${action}ed successfully`)
      router.push('/admin/bookings')
    } catch (error) {
      toast.error('Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BouncingBallLoader />
      </div>
    )
  }

  if (!booking) return null

  const config = statusConfig[booking.status] || statusConfig.pending

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin/bookings" className="inline-flex items-center gap-2 text-ph-blue hover:text-blue-700 mb-4 font-medium">
            <i className="fas fa-arrow-left"></i>
            Back to Bookings
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Booking {booking.bookingCode}</h1>
        </div>
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
          <i className={`fas ${config.icon}`}></i>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Court Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-building text-ph-blue"></i> Court Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Court Name:</span>
                <span className="font-semibold text-gray-900">{booking.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Court Type:</span>
                <span className="font-semibold text-gray-900">{booking.courtType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hourly Rate:</span>
                <span className="font-semibold text-gray-900">{formatPrice(booking.hourlyRate)}</span>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-calendar text-ph-blue"></i> Booking Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold text-gray-900">{formatDate(booking.bookingDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-semibold text-gray-900">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-semibold text-gray-900">{booking.durationHours} hour(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Players:</span>
                <span className="font-semibold text-gray-900">{booking.playerCount}</span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-user text-ph-blue"></i> Customer Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold text-gray-900">{booking.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold text-gray-900 text-sm">{booking.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold text-gray-900">{booking.userPhone}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-credit-card text-ph-blue"></i> Payment Summary
            </h2>
            <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatPrice(booking.hourlyRate * booking.durationHours)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-ph-blue">{formatPrice(booking.totalAmount)}</span>
              </div>
            </div>
            <div className="space-y-2">
              {booking.paymentType === 'venue' ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Downpayment:</span>
                    <span className="font-semibold text-green-600">{formatPrice(booking.downpaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-semibold text-amber-600">{formatPrice(booking.balanceAmount)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-semibold text-green-600">Full Payment</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'confirmed' && (
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Actions</h2>
              <button
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-50"
              >
                <i className="fas fa-trash mr-2"></i>
                Cancel Booking
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
