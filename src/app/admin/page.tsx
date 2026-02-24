'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Stats {
  today: {
    totalBookings: number
    completed: number
  }
  month: {
    totalRevenue: number
    totalBookings: number
  }
}

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
}

interface Payment {
  id: number
  referenceNumber: string
  amount: number
  status: string
  createdAt: string
  booking: {
    bookingCode: string
  }
  user: {
    name: string
  }
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        const data = await response.json()

        setStats(data.stats)
        setPendingBookings(data.pendingBookings || [])
        setPendingPayments(data.pendingPayments || [])
        setTotalUsers(data.totalUsers || 0)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const handleBookingAction = async (bookingId: number, action: 'confirm' | 'cancel') => {
    if (action === 'cancel' && !confirm('Cancel this booking?')) return

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Failed to update booking')

      toast.success(`Booking ${action === 'confirm' ? 'confirmed' : 'cancelled'}`)
      setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId))
    } catch (error) {
      toast.error('Failed to update booking')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage bookings, payments, and users</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Bookings</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.today.totalBookings || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-day text-ph-blue text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            <i className="fas fa-check-circle mr-1"></i>
            {stats?.today.completed || 0} completed
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatPrice(stats?.month.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-peso-sign text-green-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <i className="fas fa-chart-line mr-1"></i>
            {stats?.month.totalBookings || 0} bookings this month
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-900">{pendingBookings.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-yellow-600 mt-2">
            <i className="fas fa-exclamation-circle mr-1"></i>
            {pendingPayments.length} payments to verify
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-purple-600 text-xl"></i>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            <i className="fas fa-user-plus mr-1"></i>
            Active members
          </p>
        </div>
      </div>

      {/* Pending Bookings Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Pending Bookings</h2>
          <Link
            href="/admin/bookings?status=pending"
            className="text-ph-blue text-sm hover:underline"
          >
            View All
          </Link>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Booking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Court
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-check-circle text-4xl mb-2"></i>
                  <p>No pending bookings</p>
                </td>
              </tr>
            ) : (
              pendingBookings.slice(0, 5).map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium">{booking.bookingCode}</p>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{booking.courtName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{formatDate(booking.bookingDate)}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{booking.userName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ph-blue">
                      {formatPrice(booking.totalAmount)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => handleBookingAction(booking.id, 'confirm')}
                        className="text-green-600 hover:underline text-xs"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleBookingAction(booking.id, 'cancel')}
                        className="text-red-600 hover:underline text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pending Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Pending Payments</h2>
          <Link
            href="/admin/payments?status=pending"
            className="text-ph-blue text-sm hover:underline"
          >
            View All
          </Link>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Booking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
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
            {pendingPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-check-circle text-4xl mb-2"></i>
                  <p>No pending payments</p>
                </td>
              </tr>
            ) : (
              pendingPayments.slice(0, 5).map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm">{payment.referenceNumber}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{payment.booking.bookingCode}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{payment.user.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ph-blue">
                      {formatPrice(payment.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/payments/${payment.referenceNumber}`}
                      className="text-ph-blue hover:underline text-xs"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
