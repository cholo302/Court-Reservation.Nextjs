'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

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
              <div className="w-9 h-9 bg-gradient-to-br from-ph-blue to-blue-600 rounded-xl flex items-center justify-center mr-2.5 group-hover:scale-105 transition-transform shadow-md">
                <i className="fas fa-basketball text-white text-sm"></i>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-ph-blue to-blue-600 bg-clip-text text-transparent">
                CourtReserve
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-9 w-24 rounded-lg"></div>
            ) : session ? (
              <>
                <Link
                  href="/bookings"
                  className="text-gray-600 hover:text-ph-blue hover:bg-blue-50 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
                >
                  <i className="fas fa-calendar-check mr-1.5"></i>
                  My Bookings
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-gray-600 hover:text-ph-blue hover:bg-blue-50 pl-2 pr-3 py-1.5 rounded-lg transition-all"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-ph-blue to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(session.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
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
                      <Link
                        href="/bookings"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="fas fa-calendar w-4 text-center text-gray-400"></i> My Bookings
                      </Link>
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
