'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
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
  court: {
    id: number
    name: string
    thumbnail: string | null
  }
  hasReview: boolean
  payment: {
    status: string
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

export default function BookingsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentStatus = searchParams.get('status') || ''

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentStatus) params.set('status', currentStatus)

      const response = await fetch(`/api/bookings?${params.toString()}`)
      const data = await response.json()
      setBookings(data.bookings || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [currentStatus])

  const handleCancel = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return

    try {
      const response = await fetch(`/api/bookings/${bookingId}?action=cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User cancelled' }),
      })

      if (!response.ok) {
        throw new Error('Failed to cancel booking')
      }

      toast.success('Booking cancelled successfully')
      fetchBookings()
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
      month: 'short',
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

  const statuses = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
    { value: 'paid', label: 'Paid', color: 'bg-green-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-600' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-gray-600 mt-2">View and manage your court reservations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-700 font-medium">Filter by status:</span>
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <Link
                key={status.value}
                href={status.value ? `/bookings?status=${status.value}` : '/bookings'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  currentStatus === status.value
                    ? `${status.color || 'bg-ph-blue'} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <i className="fas fa-calendar-times text-gray-300 text-5xl mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h3>
          <p className="text-gray-500 mb-6">
            {currentStatus
              ? `You don't have any ${currentStatus} bookings.`
              : "You haven't made any reservations yet."}
          </p>
          <Link
            href="/courts"
            className="inline-flex items-center bg-ph-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            <i className="fas fa-search mr-2"></i>
            Browse Courts
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const config = statusConfig[booking.status] || statusConfig.pending

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Court Image */}
                  <div className="md:w-48 h-32 md:h-auto bg-gray-200 flex-shrink-0">
                    {booking.court.thumbnail ? (
                      <img
                        src={booking.court.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fas fa-basketball-ball text-gray-400 text-3xl"></i>
                      </div>
                    )}
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-medium`}
                          >
                            <i className={`fas ${config.icon} mr-1`}></i>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {booking.payment?.status === 'paid' && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                              <i className="fas fa-check-circle mr-1"></i>Paid
                            </span>
                          )}
                          <span className="text-gray-400 text-sm ml-3">
                            #{booking.bookingCode || 'N/A'}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.court.name}
                        </h3>

                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <span>
                            <i className="fas fa-calendar text-ph-blue mr-1"></i>
                            {formatDate(booking.bookingDate)}
                          </span>
                          <span>
                            <i className="fas fa-clock text-ph-blue mr-1"></i>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </span>
                          <span>
                            <i className="fas fa-users text-ph-blue mr-1"></i>
                            {booking.playerCount || 1} player(s)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-ph-blue">
                          {formatPrice(booking.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">Total Amount</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Link
                        href={`/bookings/${booking.id}`}
                        className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
                      >
                        <i className="fas fa-eye mr-2"></i>View Details
                      </Link>

                      {booking.status === 'pending' && (
                        <>
                          <Link
                            href={`/bookings/${booking.id}/pay`}
                            className="inline-flex items-center px-4 py-2 bg-ph-blue text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                          >
                            <i className="fas fa-credit-card mr-2"></i>Pay Now
                          </Link>
                          <button
                            onClick={() => handleCancel(booking.id)}
                            className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                          >
                            <i className="fas fa-times mr-2"></i>Cancel
                          </button>
                        </>
                      )}

                      {['paid', 'confirmed'].includes(booking.status) && (
                        <Link
                          href={`/bookings/${booking.id}/qr`}
                          className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition"
                        >
                          <i className="fas fa-qrcode mr-2"></i>View QR Code
                        </Link>
                      )}

                      {booking.status === 'completed' && !booking.hasReview && (
                        <Link
                          href={`/bookings/${booking.id}/review`}
                          className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition"
                        >
                          <i className="fas fa-star mr-2"></i>Leave Review
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
