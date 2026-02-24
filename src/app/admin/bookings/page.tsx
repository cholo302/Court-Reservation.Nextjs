'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Booking {
  id: number
  bookingCode: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  courtName: string
  userName: string
  userEmail: string
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  paid: { bg: 'bg-green-100', text: 'text-green-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
}

export default function AdminBookingsPage() {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || ''

  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const params = new URLSearchParams()
        if (currentStatus) params.set('status', currentStatus)

        const response = await fetch(`/api/admin/bookings?${params.toString()}`)
        const data = await response.json()
        setBookings(data.items || [])
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [currentStatus])

  const handleAction = async (bookingId: number, action: string) => {
    if (action === 'cancel' && !confirm('Cancel this booking?')) return

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success(`Booking ${action}ed successfully`)
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: action === 'confirm' ? 'confirmed' : action === 'cancel' ? 'cancelled' : b.status } : b))
      )
    } catch (error) {
      toast.error('Action failed')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  const statuses = ['', 'pending', 'confirmed', 'paid', 'completed', 'cancelled']

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="text-gray-600">View and manage all court reservations</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={s ? `/admin/bookings?status=${s}` : '/admin/bookings'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentStatus === s
                  ? 'bg-ph-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Booking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-calendar-times text-4xl mb-2"></i>
                  <p>No bookings found</p>
                </td>
              </tr>
            ) : (
              bookings.map((booking) => {
                const config = statusConfig[booking.status] || statusConfig.pending
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{booking.bookingCode}</p>
                        <p className="text-sm text-gray-500">{booking.courtName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{booking.userName}</p>
                        <p className="text-sm text-gray-500">{booking.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p>{formatDate(booking.bookingDate)}</p>
                        <p className="text-sm text-gray-500">
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-ph-blue">{formatPrice(booking.totalAmount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-medium`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/bookings/${booking.id}`}
                          className="text-ph-blue hover:underline text-sm"
                        >
                          View
                        </Link>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAction(booking.id, 'confirm')}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleAction(booking.id, 'cancel')}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
