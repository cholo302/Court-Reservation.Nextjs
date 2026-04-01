'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'

interface Booking {
  id: number
  bookingCode: string
  bookingDate: string
  startTime: string
  endTime: string
  totalAmount: number
  status: string
  paymentStatus: string
  courtName: string
  userName: string
  userEmail: string
  userAvatar: string | null
}

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'fa-clock', label: 'Pending' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'fa-circle-check', label: 'Confirmed' },
  paid: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: 'fa-money-bill', label: 'Paid' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', icon: 'fa-flag-checkered', label: 'Completed' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: 'fa-times-circle', label: 'Cancelled' },
}

function BookingsContent() {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || ''

  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const fetchBookings = async () => {
    setLoading(true)
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

  useEffect(() => {
    fetchBookings()
  }, [currentStatus])

  const filteredBookings = bookings.filter(
    (b) =>
      b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.courtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    } catch {
      toast.error('Action failed')
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BouncingBallLoader />
      </div>
    )
  }

  const statuses = ['', 'confirmed', 'paid', 'completed', 'cancelled']
  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = s ? bookings.filter((b) => b.status === s).length : bookings.length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Bookings</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage all court reservations</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {statuses.map((s) => {
          const isActive = currentStatus === s
          return (
            <Link
              key={s}
              href={s ? `/admin/bookings?status=${s}` : '/admin/bookings'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-ph-blue text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              {!isActive && statusCounts[s] > 0 && (
                <span className="ml-1.5 text-[10px] text-gray-400">{statusCounts[s]}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search by booking code, court, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent outline-none transition"
          />
        </div>
        <button
          onClick={() => fetchBookings()}
          className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors font-medium text-sm"
          title="Refresh"
        >
          <i className="fas fa-refresh"></i>
        </button>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Table Header - desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-3">Booking</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Schedule</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Actions</div>
        </div>

        {bookings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <i className="fas fa-calendar-xmark text-gray-200 text-4xl mb-3"></i>
            <p className="text-sm text-gray-400">No bookings found</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <i className="fas fa-search text-gray-200 text-4xl mb-3"></i>
            <p className="text-sm text-gray-400">No bookings match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredBookings.map((booking) => {
              const config = statusConfig[booking.status] || statusConfig.pending
              return (
                <div key={booking.id}>
                  {/* Mobile card */}
                  <div className="md:hidden p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{booking.bookingCode}</p>
                        <p className="text-xs text-gray-400 truncate">{booking.courtName}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${config.bg} ${config.text}`}>
                        <i className={`fas ${config.icon} text-[10px]`}></i>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                        {booking.userAvatar ? (
                          <img src={booking.userAvatar} alt={booking.userName} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-user text-gray-400 text-[10px]"></i>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate">{booking.userName}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {formatDate(booking.bookingDate)} &middot; {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
                      </p>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(booking.totalAmount)}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-medium border border-gray-200"
                      >
                        <i className="fas fa-eye"></i> View
                      </Link>
                      {booking.status === 'confirmed' && !booking.paymentStatus?.includes('paid') && (
                        <button
                          onClick={() => handleAction(booking.id, 'cancel')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200"
                        >
                          <i className="fas fa-times-circle"></i> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50 transition">
                    <div className="col-span-3 min-w-0">
                      <p className="font-semibold text-sm text-gray-900">{booking.bookingCode}</p>
                      <p className="text-xs text-gray-400 truncate">{booking.courtName}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                          {booking.userAvatar ? (
                            <img src={booking.userAvatar} alt={booking.userName} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fas fa-user text-gray-400 text-xs"></i>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{booking.userName}</p>
                          <p className="text-xs text-gray-400 truncate">{booking.userEmail}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-900">{formatDate(booking.bookingDate)}</p>
                      <p className="text-xs text-gray-400">
                        {formatTime(booking.startTime)}-{formatTime(booking.endTime)}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(booking.totalAmount)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                        <i className={`fas ${config.icon} text-xs`}></i>
                        {config.label}
                      </span>
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center gap-1.5">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 text-xs font-medium border border-gray-200 transition-colors"
                      >
                        <i className="fas fa-eye"></i>
                        View
                      </Link>
                      {booking.status === 'confirmed' && !booking.paymentStatus?.includes('paid') && (
                        <button
                          onClick={() => handleAction(booking.id, 'cancel')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200 transition-colors"
                        >
                          <i className="fas fa-times-circle"></i>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><BouncingBallLoader /></div>}>
      <BookingsContent />
    </Suspense>
  )
}
