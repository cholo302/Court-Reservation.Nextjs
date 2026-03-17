'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

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

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center h-16 border-b border-gray-100 ${collapsed ? 'justify-center px-2' : 'px-5'}`}>
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src="/olopsc-logo.png" alt="OLOPSC" className="w-full h-full object-cover" />
            </div>
            <span className="font-extrabold text-gray-900 tracking-tight">OLOPSC Court Reservation</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600 ${collapsed ? '' : 'ml-auto'}`}
        >
          <i className={`fas text-xs ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* User Info */}
      {!collapsed && session?.user && (
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  active
                    ? 'bg-ph-blue/10 text-ph-blue'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <i className={`fas ${item.icon} w-5 text-center text-sm ${active ? 'text-ph-blue' : ''}`}></i>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-100 p-3 space-y-0.5">
        <a
          href="/"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-blue-50 hover:text-ph-blue transition ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Client View' : undefined}
        >
          <i className="fas fa-eye w-5 text-center text-sm"></i>
          {!collapsed && <span>Client View</span>}
        </a>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <i className="fas fa-right-from-bracket w-5 text-center text-sm"></i>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
