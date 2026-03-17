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

const statusColors: Record<string, { bg: string; text: string; bar: string }> = {
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-400' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-400' },
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    const fetchReportData = async () => {
      try {
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

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)

  const formatCompact = (price: number) => {
    if (price >= 1000) return `₱${(price / 1000).toFixed(1)}k`
    return `₱${price}`
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-3xl text-ph-blue"></i>
      </div>
    )
  }

  const rangeLabel: Record<string, string> = {
    day: 'Today',
    week: 'This Week',
    month: 'This Month',
    year: 'This Year',
    all: 'All Time',
  }

  const maxRevenue = Math.max(...(data?.revenueByMonth?.map((r) => r.revenue) || []), 1)
  const totalStatusCount = data?.bookingsByStatus?.reduce((sum, s) => sum + s.count, 0) || 0

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          nav, aside, header, footer,
          [data-sidebar], [data-navbar],
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; font-size: 11px !important; }
          main, .receipt-wrapper { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; background: white !important; }
          main > div, [class*="container"] { padding: 0 !important; max-width: 100% !important; }
          .receipt-container { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .receipt-dashed { border-style: dashed !important; border-color: #9ca3af !important; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      {/* Screen Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-gray-500 text-sm mt-1">Business insights and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {['day', 'week', 'month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dateRange === range
                    ? 'bg-ph-blue text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
                }`}
              >
                {range === 'day' ? 'Today' : range === 'all' ? 'All Time' : `This ${range.charAt(0).toUpperCase() + range.slice(1)}`}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ph-blue text-white text-sm font-semibold hover:bg-blue-800 transition shadow-sm"
          >
            <i className="fas fa-print"></i>
            Print Report
          </button>
        </div>
      </div>

      {/* Receipt-Style Report */}
      <div className="receipt-wrapper max-w-3xl mx-auto">
        <div className="receipt-container bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          
          {/* Receipt Header */}
          <div className="bg-gradient-to-r from-[#1d3178] to-[#111d4e] text-white px-8 py-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs tracking-[0.25em] uppercase font-medium text-ph-yellow">OLOPSC Court Reservation</span>
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">Our Lady of Perpetual Succor College</h2>
            <p className="text-white/60 text-xs mt-1">Court Reservation Management Report</p>
          </div>

          {/* Report Period Bar */}
          <div className="bg-gray-50 px-8 py-3 flex items-center justify-between border-b border-dashed border-gray-300 receipt-dashed">
            <div className="flex items-center gap-2">
              <i className="fas fa-calendar text-gray-400 text-xs"></i>
              <span className="text-xs font-semibold text-gray-600">Period: {rangeLabel[dateRange]}</span>
            </div>
            <span className="text-xs text-gray-400">
              Generated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Summary Cards */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-2 gap-4 avoid-break">
              <div className="bg-blue-50/60 rounded-xl p-4 text-center border border-blue-100">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-calendar-check text-ph-blue text-sm"></i>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{data?.totalBookings || 0}</p>
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mt-1">Total Bookings</p>
              </div>
              <div className="bg-green-50/60 rounded-xl p-4 text-center border border-green-100">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-peso-sign text-green-600 text-sm"></i>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{formatPrice(data?.totalRevenue || 0)}</p>
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mt-1">Total Revenue</p>
              </div>
              <div className="bg-purple-50/60 rounded-xl p-4 text-center border border-purple-100">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-users text-purple-600 text-sm"></i>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{data?.totalUsers || 0}</p>
                <p className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider mt-1">Registered Users</p>
              </div>
              <div className="bg-orange-50/60 rounded-xl p-4 text-center border border-orange-100">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <i className="fas fa-basketball text-orange-600 text-sm"></i>
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{data?.totalCourts || 0}</p>
                <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider mt-1">Active Courts</p>
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-gray-300 mx-8 receipt-dashed"></div>

          {/* Booking Status Breakdown */}
          <div className="px-8 py-5 avoid-break">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-chart-pie text-gray-400"></i>
              Booking Status Breakdown
            </h3>
            {totalStatusCount > 0 && (
              <div className="flex rounded-full overflow-hidden h-2.5 mb-4 bg-gray-100">
                {data?.bookingsByStatus?.map((s) => {
                  const pct = (s.count / totalStatusCount) * 100
                  const color = statusColors[s.status]?.bar || 'bg-gray-300'
                  return (
                    <div key={s.status} className={`${color} transition-all`} style={{ width: `${pct}%` }} title={`${s.status}: ${s.count}`}></div>
                  )
                })}
              </div>
            )}
            <div className="space-y-2">
              {data?.bookingsByStatus?.map((s) => {
                const color = statusColors[s.status] || statusColors.pending
                const pct = totalStatusCount > 0 ? ((s.count / totalStatusCount) * 100).toFixed(0) : 0
                return (
                  <div key={s.status} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${color.bar}`}></div>
                      <span className="text-sm text-gray-700 capitalize">{s.status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-28 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`${color.bar} h-full rounded-full`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                      <span className="text-sm font-bold text-gray-900 w-6 text-right">{s.count}</span>
                    </div>
                  </div>
                )
              })}
              {(!data?.bookingsByStatus || data.bookingsByStatus.length === 0) && (
                <p className="text-sm text-gray-400 text-center py-4">No booking data yet</p>
              )}
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-gray-300 mx-8 receipt-dashed"></div>

          {/* Revenue Overview */}
          <div className="px-8 py-5 avoid-break">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <i className="fas fa-chart-bar text-gray-400"></i>
                Revenue Overview
              </h3>
              <span className="text-lg font-extrabold text-gray-900">{formatPrice(data?.totalRevenue || 0)}</span>
            </div>
            {data?.revenueByMonth && data.revenueByMonth.length > 0 ? (
              <div className="flex items-end gap-3 h-32">
                {data.revenueByMonth.map((item, i) => {
                  const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                  const isLast = i === data.revenueByMonth.length - 1
                  const hasRevenue = item.revenue > 0
                  return (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-gray-500">{formatCompact(item.revenue)}</span>
                      <div className="w-full relative" style={{ height: '80px' }}>
                        {hasRevenue && (
                          <div
                            className={`absolute bottom-0 w-full rounded-t-md transition-all ${
                              isLast ? 'bg-ph-blue' : 'bg-gray-200'
                            }`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                          ></div>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium ${isLast ? 'text-ph-blue font-bold' : 'text-gray-400'}`}>{item.month}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <i className="fas fa-chart-bar text-gray-200 text-2xl mb-2"></i>
                  <p className="text-sm">No revenue data</p>
                </div>
              </div>
            )}
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-gray-300 mx-8 receipt-dashed"></div>

          {/* Top Courts */}
          {data?.topCourts && data.topCourts.length > 0 && (
            <div className="px-8 py-5 avoid-break">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <i className="fas fa-trophy text-gray-400"></i>
                Top Performing Courts
              </h3>
              <div className="space-y-3">
                {data.topCourts.map((court, i) => {
                  const maxCourtRev = Math.max(...data.topCourts.map((c) => c.revenue), 1)
                  const pct = (court.revenue / maxCourtRev) * 100
                  return (
                    <div key={court.name} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                        i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{court.name}</p>
                          <span className="text-xs font-bold text-gray-700 shrink-0 ml-2">{formatPrice(court.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-ph-blue h-full rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">{court.bookings} bookings</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-gray-300 mx-8 receipt-dashed"></div>

          {/* Recent Bookings */}
          <div className="px-8 py-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="fas fa-list text-gray-400"></i>
              Recent Bookings
              {(data?.recentBookings?.length || 0) > 0 && (
                <span className="text-[10px] font-bold text-white bg-ph-blue rounded-full w-5 h-5 flex items-center justify-center no-print">
                  {data?.recentBookings?.length}
                </span>
              )}
            </h3>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="pb-2 pr-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Code</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Court</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="pb-2 pr-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                    <th className="pb-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.recentBookings && data.recentBookings.length > 0 ? (
                    data.recentBookings.map((booking) => {
                      const sc = statusColors[booking.status] || statusColors.pending
                      return (
                        <tr key={booking.id} className="hover:bg-gray-50/50 transition">
                          <td className="py-2.5 pr-3">
                            <span className="text-xs font-mono font-semibold text-gray-900">{booking.bookingCode}</span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="text-xs text-gray-600">{booking.courtName}</span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="text-xs text-gray-700">{booking.userName}</span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className="text-xs text-gray-500">{formatDate(booking.bookingDate)}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-right">
                            <span className="text-xs font-bold text-gray-900">{formatPrice(booking.totalAmount)}</span>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <i className="fas fa-inbox text-gray-200 text-2xl mb-2"></i>
                        <p className="text-sm text-gray-400">No recent bookings</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-dashed border-gray-300 mx-8 receipt-dashed"></div>
          <div className="px-8 py-5 text-center bg-gray-50/50">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
            </div>
            <p className="text-[10px] text-gray-400 font-medium">
              OLOPSC Court Reservation &mdash; Confidential Report
            </p>
            <p className="text-[10px] text-gray-300 mt-0.5">
              Generated on {new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
