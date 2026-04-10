'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'

interface Stats {
  today: { totalBookings: number; completed: number; revenue: number }
  week: { totalBookings: number; revenue: number }
  month: { totalBookings: number; revenue: number }
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
  paymentReference: string
  amount: number
  status: string
  createdAt: string
  bookingCode: string
  courtName: string
  userName: string
}

interface RevenueMonth {
  month: string
  revenue: number
}

interface TopCourt {
  name: string
  bookings: number
  revenue: number
}

interface StatusCount {
  status: string
  count: number
}

interface ActivityLog {
  id: number
  action: string
  description: string | null
  entityType: string | null
  entityId: number | null
  userName: string
  userEmail: string | null
  createdAt: string
}

const statusColors: Record<string, { bg: string; text: string; bar: string }> = {
  confirmed: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', bar: 'bg-red-400' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', bar: 'bg-amber-400' },
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([])
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalCourts, setTotalCourts] = useState(0)
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueMonth[]>([])
  const [topCourts, setTopCourts] = useState<TopCourt[]>([])
  const [bookingsByStatus, setBookingsByStatus] = useState<StatusCount[]>([])
  const [totalBookings, setTotalBookings] = useState(0)
  const [awaitingPaymentCount, setAwaitingPaymentCount] = useState(0)
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        const data = await response.json()
        setStats(data.stats)
        setUpcomingBookings(data.upcomingBookings || [])
        setPendingPayments(data.pendingPayments || [])
        setTotalUsers(data.totalUsers || 0)
        setTotalCourts(data.totalCourts || 0)
        setRevenueByMonth(data.revenueByMonth || [])
        setTopCourts(data.topCourts || [])
        setBookingsByStatus(data.bookingsByStatus || [])
        setTotalBookings(data.totalBookings || 0)
        setAwaitingPaymentCount(data.awaitingPaymentCount || 0)
        setActivityLogs(data.recentActivityLogs || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchDashboardData()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Poll activity logs every 10 seconds for live updates
  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const response = await fetch('/api/admin/activity-logs')
        const data = await response.json()
        if (data.logs) {
          setActivityLogs(data.logs)
        }
      } catch (error) {
        // Silently fail on polling errors
      }
    }

    const interval = setInterval(fetchActivityLogs, 10000)
    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)

  const formatCompact = (price: number) => {
    if (price >= 1000) return `₱${(price / 1000).toFixed(1)}k`
    return `₱${price}`
  }

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BouncingBallLoader />
      </div>
    )
  }

  const maxRevenue = Math.max(...revenueByMonth.map((r) => r.revenue), 1)
  const totalStatusCount = bookingsByStatus.reduce((sum, s) => sum + s.count, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your court reservation system</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/scanner"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ph-blue text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition shadow-sm"
          >
            <i className="fas fa-qrcode"></i>
            Scan QR
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-[40px] -mr-2 -mt-2 opacity-50"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-day text-ph-blue text-xs"></i>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">Today</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{stats?.today.totalBookings || 0}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">{stats?.today.completed || 0} completed</span>
              {(stats?.today.revenue || 0) > 0 && (
                <>
                  <span className="text-xs text-gray-300">&middot;</span>
                  <span className="text-xs font-medium text-green-600">{formatPrice(stats?.today.revenue || 0)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-[40px] -mr-2 -mt-2 opacity-50"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-peso-sign text-green-600 text-xs"></i>
              </div>
              <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wider">Revenue</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{formatPrice(stats?.month.revenue || 0)}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">{stats?.month.totalBookings || 0} bookings this month</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 rounded-bl-[40px] -mr-2 -mt-2 opacity-50"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-receipt text-orange-600 text-xs"></i>
              </div>
              <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">Payments</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{pendingPayments.length + awaitingPaymentCount}</p>
            <div className="flex items-center gap-2 mt-1.5">
              {(pendingPayments.length + awaitingPaymentCount) > 0 ? (
                <span className="text-xs font-medium text-orange-600">
                  <i className="fas fa-circle text-[6px] animate-pulse mr-1 align-middle"></i>
                  {pendingPayments.length > 0 ? `${pendingPayments.length} to verify` : ''}
                  {pendingPayments.length > 0 && awaitingPaymentCount > 0 ? ' · ' : ''}
                  {awaitingPaymentCount > 0 ? `${awaitingPaymentCount} awaiting payment` : ''}
                </span>
              ) : (
                <span className="text-xs text-gray-400">All caught up</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-50 rounded-bl-[40px] -mr-2 -mt-2 opacity-50"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-purple-600 text-xs"></i>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 uppercase tracking-wider">Users</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900">{totalUsers}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-xs text-gray-400">{totalCourts} active courts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payments Alert Banner */}
      {pendingPayments.length > 0 && (
        <Link href="/admin/payments" className="block mb-6 group">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 flex items-center gap-4 hover:border-orange-300 transition">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-bell text-orange-600 text-sm"></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-orange-900">
                {pendingPayments.length} payment{pendingPayments.length > 1 ? 's' : ''} awaiting verification
              </p>
              <p className="text-xs text-orange-600/70 mt-0.5 truncate">
                {pendingPayments.slice(0, 3).map((p) => p.bookingCode).join(', ')}
                {pendingPayments.length > 3 && ` +${pendingPayments.length - 3} more`}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-orange-700">
                {formatPrice(pendingPayments.reduce((sum, p) => sum + p.amount, 0))}
              </span>
              <i className="fas fa-arrow-right text-orange-400 text-xs group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </Link>
      )}

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Revenue Overview</h2>
              <p className="text-xs text-gray-400 mt-0.5">Last 6 months</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-extrabold text-gray-900">{formatPrice(stats?.month.revenue || 0)}</p>
              <p className="text-[11px] text-gray-400">This month</p>
            </div>
          </div>
          <div className="flex items-end gap-3 h-40">
            {revenueByMonth.map((item, i) => {
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
              const isLast = i === revenueByMonth.length - 1
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500">{formatCompact(item.revenue)}</span>
                  <div className="w-full relative" style={{ height: '100px' }}>
                    <div
                      className={`absolute bottom-0 w-full rounded-t-md transition-all ${
                        isLast ? 'bg-ph-blue' : 'bg-gray-200'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                    ></div>
                  </div>
                  <span className={`text-[11px] font-medium ${isLast ? 'text-ph-blue' : 'text-gray-400'}`}>
                    {item.month}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Booking Status Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Booking Status</h2>
              <p className="text-xs text-gray-400 mt-0.5">This month&apos;s breakdown</p>
            </div>
            <span className="text-lg font-extrabold text-gray-900">{totalBookings}</span>
          </div>

          {/* Stacked bar */}
          {totalStatusCount > 0 && (
            <div className="flex rounded-full overflow-hidden h-3 mb-5 bg-gray-100">
              {bookingsByStatus.map((s) => {
                const pct = (s.count / totalStatusCount) * 100
                const color = statusColors[s.status]?.bar || 'bg-gray-300'
                return (
                  <div
                    key={s.status}
                    className={`${color} transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`${s.status}: ${s.count}`}
                  ></div>
                )
              })}
            </div>
          )}

          <div className="space-y-3">
            {bookingsByStatus.map((s) => {
              const color = statusColors[s.status] || statusColors.pending
              const pct = totalStatusCount > 0 ? ((s.count / totalStatusCount) * 100).toFixed(0) : 0
              return (
                <div key={s.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${color.bar}`}></div>
                    <span className="text-sm text-gray-700 capitalize">{s.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{pct}%</span>
                    <span className="text-sm font-bold text-gray-900 w-8 text-right">{s.count}</span>
                  </div>
                </div>
              )
            })}
            {bookingsByStatus.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No booking data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm">Today&apos;s Schedule</h2>
              {upcomingBookings.filter((b) => {
                const d = new Date(b.bookingDate)
                const now = new Date()
                return d.toDateString() === now.toDateString()
              }).length > 0 && (
                <span className="text-[10px] font-bold text-white bg-ph-blue rounded-full w-5 h-5 flex items-center justify-center">
                  {upcomingBookings.filter((b) => {
                    const d = new Date(b.bookingDate)
                    const now = new Date()
                    return d.toDateString() === now.toDateString()
                  }).length}
                </span>
              )}
            </div>
            <Link href="/admin/bookings" className="text-xs text-ph-blue hover:underline font-medium">
              All bookings
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(() => {
              const todayBookings = upcomingBookings.filter((b) => {
                const d = new Date(b.bookingDate)
                const now = new Date()
                return d.toDateString() === now.toDateString()
              })
              if (todayBookings.length === 0) {
                return (
                  <div className="px-5 py-10 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fas fa-calendar-xmark text-gray-300 text-lg"></i>
                    </div>
                    <p className="text-sm font-medium text-gray-400">No bookings today</p>
                    <p className="text-xs text-gray-300 mt-1">Enjoy the quiet!</p>
                  </div>
                )
              }
              return todayBookings.map((b) => (
                <div key={b.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50/50 transition">
                  <div className="w-12 text-center shrink-0">
                    <p className="text-xs font-bold text-ph-blue leading-tight">{formatTime(b.startTime)}</p>
                    <p className="text-[10px] text-gray-300 my-0.5">to</p>
                    <p className="text-[10px] font-medium text-gray-400">{formatTime(b.endTime)}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.courtName}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {b.userName} &middot; {b.bookingCode}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                    b.status === 'paid' || b.status === 'completed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {b.status === 'paid' ? 'Paid' : b.status === 'completed' ? 'Done' : 'Confirmed'}
                  </span>
                </div>
              ))
            })()}
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm">Recent Activity</h2>
              {activityLogs.length > 0 && (
                <span className="text-[10px] font-bold text-white bg-gray-500 rounded-full w-5 h-5 flex items-center justify-center">
                  {activityLogs.length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {activityLogs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-clock-rotate-left text-gray-300 text-lg"></i>
                </div>
                <p className="text-sm font-medium text-gray-400">No activity yet</p>
                <p className="text-xs text-gray-300 mt-1">Actions will appear here</p>
              </div>
            ) : (
              activityLogs.map((log) => {
                const actionConfig: Record<string, { icon: string; color: string; bg: string }> = {
                  resubmit_documents: { icon: 'fa-file-arrow-up', color: 'text-amber-600', bg: 'bg-amber-50' },
                  submit_documents: { icon: 'fa-id-card', color: 'text-blue-600', bg: 'bg-blue-50' },
                  verify_id: { icon: 'fa-circle-check', color: 'text-green-600', bg: 'bg-green-50' },
                  reject_id: { icon: 'fa-circle-xmark', color: 'text-red-600', bg: 'bg-red-50' },
                  create_booking: { icon: 'fa-calendar-plus', color: 'text-blue-600', bg: 'bg-blue-50' },
                  cancel_booking: { icon: 'fa-calendar-xmark', color: 'text-red-600', bg: 'bg-red-50' },
                  payment_submitted: { icon: 'fa-receipt', color: 'text-blue-600', bg: 'bg-blue-50' },
                  payment_verified: { icon: 'fa-credit-card', color: 'text-green-600', bg: 'bg-green-50' },
                  user_registered: { icon: 'fa-user-plus', color: 'text-purple-600', bg: 'bg-purple-50' },
                  login: { icon: 'fa-right-to-bracket', color: 'text-blue-600', bg: 'bg-blue-50' },
                  update_profile: { icon: 'fa-user-pen', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  check_in: { icon: 'fa-qrcode', color: 'text-green-600', bg: 'bg-green-50' },
                }
                const cfg = actionConfig[log.action] || { icon: 'fa-circle-info', color: 'text-gray-500', bg: 'bg-gray-50' }

                return (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50/50 transition">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                      <i className={`fas ${cfg.icon} ${cfg.color} text-xs`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-snug">
                        <span className="font-semibold">{log.userName}</span>
                        {' '}
                        <span className="text-gray-500">
                          {log.description || log.action.replace(/_/g, ' ')}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-gray-400">{timeAgo(log.createdAt)}</span>
                        {log.entityType && (
                          <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {log.entityType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Courts */}
      {topCourts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Top Courts</h2>
              <p className="text-xs text-gray-400 mt-0.5">By revenue this month</p>
            </div>
            <Link href="/admin/courts" className="text-xs text-ph-blue hover:underline font-medium">
              Manage courts
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {topCourts.map((court, i) => {
              const maxCourtRev = Math.max(...topCourts.map((c) => c.revenue), 1)
              const pct = (court.revenue / maxCourtRev) * 100
              return (
                <div key={court.name} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100/80 transition">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ${
                      i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{court.name}</p>
                      <p className="text-[11px] text-gray-400">{court.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-ph-blue h-full rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-gray-700 shrink-0">{formatPrice(court.revenue)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
