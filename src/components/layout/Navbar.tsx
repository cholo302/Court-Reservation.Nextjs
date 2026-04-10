'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { BallSpinner } from '@/components/ui/BouncingBallLoader'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  readAt: string | null
  createdAt: string
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'id_verified':
    case 'id_valid':
      return { icon: 'fa-circle-check', color: 'text-green-500', bg: 'bg-green-50' }
    case 'id_invalid':
    case 'id_unverified':
    case 'documents_resubmit':
      return { icon: 'fa-triangle-exclamation', color: 'text-red-500', bg: 'bg-red-50' }
    case 'account_activated':
      return { icon: 'fa-user-check', color: 'text-green-500', bg: 'bg-green-50' }
    case 'booking_confirmed':
    case 'booking_created':
      return { icon: 'fa-calendar-check', color: 'text-blue-500', bg: 'bg-blue-50' }
    case 'booking_cancelled':
      return { icon: 'fa-calendar-xmark', color: 'text-red-500', bg: 'bg-red-50' }
    case 'booking_completed':
    case 'booking_checked_in':
      return { icon: 'fa-circle-check', color: 'text-green-500', bg: 'bg-green-50' }
    case 'booking_no_show':
      return { icon: 'fa-user-xmark', color: 'text-red-500', bg: 'bg-red-50' }
    case 'payment_received':
    case 'payment_verified':
    case 'payment_confirmed':
      return { icon: 'fa-credit-card', color: 'text-green-500', bg: 'bg-green-50' }
    case 'payment_submitted':
      return { icon: 'fa-receipt', color: 'text-blue-500', bg: 'bg-blue-50' }
    case 'payment_rejected':
      return { icon: 'fa-credit-card', color: 'text-red-500', bg: 'bg-red-50' }
    case 'verification_submitted':
    case 'verification_pending':
    case 'id_resubmitted':
      return { icon: 'fa-clock', color: 'text-amber-500', bg: 'bg-amber-50' }
    default:
      return { icon: 'fa-bell', color: 'text-blue-500', bg: 'bg-blue-50' }
  }
}

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifLoading, setNotifLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch notifications (skip for admins in client view)
  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return
    if (session?.user?.role === 'admin') return
    try {
      const res = await fetch('/api/notifications?limit=15')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }, [session?.user?.id, session?.user?.role])

  // Fetch on mount and periodically
  useEffect(() => {
    if (session?.user?.id && session?.user?.role !== 'admin') {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 30000) // every 30s
      return () => clearInterval(interval)
    }
  }, [session?.user?.id, fetchNotifications])

  const handleOpenNotifications = async () => {
    const willOpen = !isNotifOpen
    setIsNotifOpen(willOpen)
    setIsDropdownOpen(false)
    if (willOpen) {
      setNotifLoading(true)
      await fetchNotifications()
      setNotifLoading(false)
    }
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  const markOneRead = async (id: number) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [id] }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/95 backdrop-blur-md shadow-lg'
        : 'bg-white shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <div className="w-10 h-10 rounded-full overflow-hidden mr-2.5 flex-shrink-0 group-hover:scale-105 transition-transform shadow-md">
                <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm sm:text-lg font-bold bg-gradient-to-r from-ph-blue to-blue-600 bg-clip-text text-transparent leading-tight">
                OLOPSC<br/>Court Reservation
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-9 w-24 rounded-lg"></div>
            ) : session ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleOpenNotifications}
                    className="relative p-2 rounded-lg text-gray-500 hover:text-ph-blue hover:bg-blue-50 transition-all"
                    aria-label="Notifications"
                  >
                    <i className="fas fa-bell text-lg"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white animate-bounce-once">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 mt-2 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-ph-blue hover:underline font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                        {notifLoading ? (
                          <div className="py-12 text-center">
                            <BallSpinner className="text-gray-300" />
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="py-12 text-center">
                            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                              <i className="fas fa-bell-slash text-gray-300 text-xl"></i>
                            </div>
                            <p className="text-sm text-gray-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const { icon, color, bg } = getNotificationIcon(notif.type)
                            const isUnread = !notif.readAt
                            const href = notif.type.includes('id_') || notif.type === 'documents_resubmit' || notif.type === 'verification_submitted' || notif.type === 'verification_pending' || notif.type === 'id_resubmitted'
                              ? '/verify'
                              : notif.type.includes('booking')
                              ? '/bookings'
                              : notif.type.includes('payment')
                              ? '/bookings'
                              : '#'

                            return (
                              <Link
                                key={notif.id}
                                href={href}
                                onClick={() => {
                                  if (isUnread) markOneRead(notif.id)
                                  setIsNotifOpen(false)
                                }}
                                className={`flex gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                                  isUnread ? 'bg-blue-50/40' : ''
                                }`}
                              >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                                  <i className={`fas ${icon} ${color} text-sm`}></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm leading-tight ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                      {notif.title}
                                    </p>
                                    {isUnread && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                  <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                                </div>
                              </Link>
                            )
                          })
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="border-t border-gray-100 bg-gray-50/50">
                          <Link
                            href="/notifications"
                            onClick={() => setIsNotifOpen(false)}
                            className="block text-center py-2.5 text-xs font-medium text-ph-blue hover:bg-gray-100 transition"
                          >
                            View all notifications
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href="/bookings"
                  className="text-gray-600 hover:text-ph-blue hover:bg-blue-50 px-2 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                  title="My Bookings"
                >
                  <i className="fas fa-calendar-check sm:mr-1.5"></i>
                  <span className="hidden sm:inline">My Bookings</span>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(!isDropdownOpen)
                      setIsNotifOpen(false)
                    }}
                    className="flex items-center gap-2 text-gray-600 hover:text-ph-blue hover:bg-blue-50 pl-2 pr-3 py-1.5 rounded-lg transition-all"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden">
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-ph-blue to-blue-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {(session.user?.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{session.user?.name || 'User'}</span>
                    <i className={`fas fa-chevron-down text-[10px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="fas fa-user w-4 text-center text-gray-400"></i> Profile
                      </Link>
                      
                      {session.user?.role !== 'admin' && (
                      <div className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-500">
                        <i className="fas fa-id-card w-4 text-center text-gray-400"></i>
                        ID Status
                        <span className="ml-auto">
                          {session.user?.verificationStatus === 'verified' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <i className="fas fa-circle-check text-xs"></i> Verified
                            </span>
                          ) : session.user?.verificationStatus === 'pending' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              <i className="fas fa-clock text-xs"></i> Pending
                            </span>
                          ) : session.user?.verificationStatus === 'rejected' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <i className="fas fa-xmark text-xs"></i> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              <i className="fas fa-minus text-xs"></i> Not Verified
                            </span>
                          )}
                        </span>
                      </div>
                      )}
                      
                      {session.user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <i className="fas fa-gauge-high w-4 text-center text-gray-400"></i> Admin Panel
                        </Link>
                      )}
                      <hr className="my-1.5 border-gray-100" />
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <i className="fas fa-arrow-right-from-bracket w-4 text-center"></i> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-ph-blue px-3.5 py-2 rounded-lg text-sm font-medium transition-all hover:bg-blue-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-ph-blue to-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
