'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: 'fa-tachometer-alt' },
  { href: '/admin/bookings', label: 'Bookings', icon: 'fa-calendar-alt' },
  { href: '/admin/payments', label: 'Payments', icon: 'fa-credit-card' },
  { href: '/admin/courts', label: 'Courts', icon: 'fa-basketball-ball' },
  { href: '/admin/users', label: 'Users', icon: 'fa-users' },
  { href: '/admin/reports', label: 'Reports', icon: 'fa-chart-bar' },
  { href: '/admin/scanner', label: 'QR Scanner', icon: 'fa-qrcode' },
  { href: '/admin/settings', label: 'Settings', icon: 'fa-cog' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        {!collapsed && (
          <Link href="/admin" className="flex items-center">
            <i className="fas fa-basketball-ball text-ph-yellow text-xl mr-2"></i>
            <span className="font-bold text-lg">Admin Panel</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-800 transition"
        >
          <i className={`fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
      </div>

      {/* User Info */}
      {!collapsed && session?.user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-ph-blue rounded-full flex items-center justify-center mr-3">
              <i className="fas fa-user"></i>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-2 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-3 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-ph-blue text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <i className={`fas ${item.icon} w-6 text-center`}></i>
                {!collapsed && <span className="ml-3">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-gray-800">
        <Link
          href="/"
          className="flex items-center px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
          title={collapsed ? 'View Site' : undefined}
        >
          <i className="fas fa-external-link-alt w-6 text-center"></i>
          {!collapsed && <span className="ml-3">View Site</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-3 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 transition"
          title={collapsed ? 'Logout' : undefined}
        >
          <i className="fas fa-sign-out-alt w-6 text-center"></i>
          {!collapsed && <span className="ml-3">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
