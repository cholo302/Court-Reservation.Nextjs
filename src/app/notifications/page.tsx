'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getNotificationStyle(type: string) {
  switch (type) {
    case 'id_verified':
    case 'id_valid':
    case 'account_activated':
      return { icon: 'fa-circle-check', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
    case 'id_invalid':
    case 'id_unverified':
    case 'documents_resubmit':
      return { icon: 'fa-triangle-exclamation', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
    case 'booking_confirmed':
    case 'booking_created':
      return { icon: 'fa-calendar-check', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' }
    case 'booking_cancelled':
      return { icon: 'fa-calendar-xmark', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
    case 'booking_completed':
    case 'booking_checked_in':
      return { icon: 'fa-circle-check', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
    case 'booking_no_show':
      return { icon: 'fa-user-xmark', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
    case 'payment_received':
    case 'payment_verified':
    case 'payment_confirmed':
      return { icon: 'fa-credit-card', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
    case 'payment_submitted':
      return { icon: 'fa-receipt', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' }
    case 'payment_rejected':
      return { icon: 'fa-credit-card', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
    case 'verification_submitted':
    case 'verification_pending':
    case 'id_resubmitted':
      return { icon: 'fa-clock', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' }
    default:
      return { icon: 'fa-bell', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' }
  }
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status, router])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=50')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
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

  const getNotificationLink = (type: string) => {
    if (type.includes('id_') || type === 'documents_resubmit' || type === 'verification_submitted' || type === 'verification_pending' || type === 'id_resubmitted') return '/verify'
    if (type.includes('booking')) return '/bookings'
    if (type.includes('payment')) return '/bookings'
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BouncingBallLoader />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-ph-blue hover:text-blue-700 font-medium mb-6 transition-colors"
      >
        <i className="fas fa-arrow-left"></i>
        Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-ph-blue hover:underline font-medium"
          >
            <i className="fas fa-check-double mr-1"></i>
            Mark all as read
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-bell-slash text-gray-300 text-2xl"></i>
          </div>
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">
            You&apos;ll receive notifications about your bookings and verification status here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const { icon, color, bg } = getNotificationStyle(notif.type)
            const isUnread = !notif.readAt
            const link = getNotificationLink(notif.type)

            const content = (
              <div
                className={`bg-white rounded-xl border p-4 flex gap-4 transition-all hover:shadow-sm ${
                  isUnread ? 'border-blue-200 shadow-sm' : 'border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <i className={`fas ${icon} ${color}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{timeAgo(notif.createdAt)}</span>
                      {isUnread && (
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                </div>
              </div>
            )

            if (link) {
              return (
                <Link
                  key={notif.id}
                  href={link}
                  onClick={() => isUnread && markOneRead(notif.id)}
                >
                  {content}
                </Link>
              )
            }

            return (
              <div
                key={notif.id}
                onClick={() => isUnread && markOneRead(notif.id)}
                className={isUnread ? 'cursor-pointer' : ''}
              >
                {content}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
