'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: 'fa-gauge' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'fa-calendar-check' },
  { href: '/admin/payments', label: 'Payments', icon: 'fa-money-bill-wave' },
  { href: '/admin/courts', label: 'Courts', icon: 'fa-basketball' },
  { href: '/admin/users', label: 'Users', icon: 'fa-user-group' },
  { href: '/admin/scanner', label: 'QR Scanner', icon: 'fa-qrcode' },
  { href: '/admin/reports', label: 'Reports', icon: 'fa-chart-pie' },
  { href: '/admin/settings', label: 'Settings', icon: 'fa-gear' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [counts, setCounts] = useState<{ pendingBookings: number; pendingPayments: number; pendingUsers: number }>({
    pendingBookings: 0, pendingPayments: 0, pendingUsers: 0,
  })

  // Fetch sidebar notification counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/admin/sidebar-counts')
        if (res.ok) {
          const data = await res.json()
          setCounts(data)
        }
      } catch {}
    }
    fetchCounts()
    const interval = setInterval(fetchCounts, 30000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchCounts()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Build badge map
  const badgeMap: Record<string, number> = {
    '/admin/bookings': counts.pendingBookings,
    '/admin/payments': counts.pendingPayments,
    '/admin/users': counts.pendingUsers,
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'A'

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-gray-100 ${collapsed && !mobileOpen ? 'justify-center px-2' : 'px-5'}`}>
        {(!collapsed || mobileOpen) && (
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-gray-900 tracking-tight text-sm">OLOPSC Court Reservation</span>
          </Link>
        )}
        {/* Desktop collapse button */}
        <button
          onClick={() => mobileOpen ? setMobileOpen(false) : setCollapsed(!collapsed)}
          className={`p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 hidden lg:block ${collapsed && !mobileOpen ? '' : 'ml-auto'}`}
        >
          <i className={`fas text-xs ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 lg:hidden ml-auto"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>

      {/* User Info */}
      {(!collapsed || mobileOpen) && session?.user && (
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-ph-blue to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-gray-900 text-sm truncate">{session.user.name}</p>
              <p className="text-xs text-gray-400 truncate">Administrator</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        <div className="space-y-0.5">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            const badge = badgeMap[item.href] || 0
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-ph-blue/10 text-ph-blue'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                } ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
                title={collapsed && !mobileOpen ? item.label : undefined}
              >
                <div className="relative">
                  <i className={`fas ${item.icon} w-5 text-center text-sm ${active ? 'text-ph-blue' : ''}`}></i>
                  {badge > 0 && collapsed && !mobileOpen && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                {(!collapsed || mobileOpen) && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {badge > 0 && (
                      <span className="min-w-[20px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-100 p-3 space-y-0.5">
        <a
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-blue-50 hover:text-ph-blue transition ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
          title={collapsed && !mobileOpen ? 'Client View' : undefined}
        >
          <i className="fas fa-eye w-5 text-center text-sm"></i>
          {(!collapsed || mobileOpen) && <span>Client View</span>}
        </a>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition ${collapsed && !mobileOpen ? 'justify-center' : ''}`}
          title={collapsed && !mobileOpen ? 'Logout' : undefined}
        >
          <i className="fas fa-right-from-bracket w-5 text-center text-sm"></i>
          {(!collapsed || mobileOpen) && <span>Logout</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center px-4">
        <div className="relative">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition text-gray-600"
          >
            <i className="fas fa-bars text-lg"></i>
          </button>
          {Object.values(counts).some(c => c > 0) && (
            <span className="absolute top-0 right-0 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {Object.values(counts).reduce((a, b) => a + b, 0) > 99 ? '99+' : Object.values(counts).reduce((a, b) => a + b, 0)}
            </span>
          )}
        </div>
        <Link href="/admin" className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
            <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-gray-900 tracking-tight text-sm">OLOPSC Admin</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - mobile: slide-over overlay, desktop: fixed */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 flex flex-col transition-all duration-300
          ${mobileOpen ? 'w-64 translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 ${collapsed ? 'lg:w-[72px]' : 'lg:w-64'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
