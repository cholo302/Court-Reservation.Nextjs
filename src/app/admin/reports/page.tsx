'use client'

import { useEffect, useState } from 'react'

interface ReportData {
  totalBookings: number
  totalRevenue: number
  totalUsers: number
  totalCourts: number
  bookingsByStatus: { status: string; count: number }[]
  revenueByMonth: { month: string; revenue: number }[]
  topCourts: { name: string; bookings: number; revenue: number }[]
  recentBookings: {
    id: number
    bookingCode: string
    courtName: string
    userName: string
    totalAmount: number
    status: string
    bookingDate: string
  }[]
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        // Fetch dashboard data for reports
        const response = await fetch(`/api/admin/dashboard?range=${dateRange}`)
        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (error) {
        console.error('Error fetching report data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [dateRange])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    paid: 'bg-green-500',
    completed: 'bg-green-600',
    cancelled: 'bg-red-500',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">View business insights and statistics</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                dateRange === range
                  ? 'bg-ph-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'all' ? 'All Time' : `This ${range.charAt(0).toUpperCase() + range.slice(1)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalBookings || 0}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-calendar-check text-2xl text-blue-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">
                {formatPrice(data?.totalRevenue || 0)}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-peso-sign text-2xl text-green-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Registered Users</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalUsers || 0}</p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-2xl text-purple-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Courts</p>
              <p className="text-3xl font-bold text-gray-900">{data?.totalCourts || 0}</p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <i className="fas fa-basketball text-2xl text-orange-600"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bookings by Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Bookings by Status</h2>
          {data?.bookingsByStatus && data.bookingsByStatus.length > 0 ? (
            <div className="space-y-4">
              {data.bookingsByStatus.map((item) => {
                const total = data.bookingsByStatus.reduce((sum, s) => sum + s.count, 0)
                const percentage = total > 0 ? (item.count / total) * 100 : 0
                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{item.status}</span>
                      <span className="text-gray-500">{item.count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${statusColors[item.status] || 'bg-gray-500'}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-chart-pie text-4xl mb-2"></i>
              <p>No booking data available</p>
            </div>
          )}
        </div>

        {/* Top Performing Courts */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Top Performing Courts</h2>
          {data?.topCourts && data.topCourts.length > 0 ? (
            <div className="space-y-4">
              {data.topCourts.map((court, index) => (
                <div key={court.name} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0
                        ? 'bg-yellow-100 text-yellow-600'
                        : index === 1
                        ? 'bg-gray-100 text-gray-600'
                        : index === 2
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{court.name}</p>
                    <p className="text-sm text-gray-500">{court.bookings} bookings</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatPrice(court.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-trophy text-4xl mb-2"></i>
              <p>No court data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
        {data?.revenueByMonth && data.revenueByMonth.length > 0 ? (
          <div className="h-64 flex items-end gap-2">
            {data.revenueByMonth.map((month, index) => {
              const maxRevenue = Math.max(...data.revenueByMonth.map((m) => m.revenue))
              const height = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-ph-blue to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={formatPrice(month.revenue)}
                  ></div>
                  <p className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                    {month.month}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <i className="fas fa-chart-bar text-4xl mb-2"></i>
              <p>No revenue data available</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Bookings */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Recent Bookings</h2>
        </div>
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
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.recentBookings && data.recentBookings.length > 0 ? (
              data.recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{booking.bookingCode}</p>
                      <p className="text-sm text-gray-500">{booking.courtName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{booking.userName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>{formatDate(booking.bookingDate)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ph-blue">
                      {formatPrice(booking.totalAmount)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'paid' || booking.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : booking.status === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-2"></i>
                  <p>No recent bookings</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Export Options */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => alert('Export functionality coming soon!')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <i className="fas fa-file-excel"></i>
          Export to Excel
        </button>
        <button
          onClick={() => window.print()}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          <i className="fas fa-print"></i>
          Print Report
        </button>
      </div>
    </div>
  )
}
