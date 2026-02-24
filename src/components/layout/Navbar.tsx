'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

export default function Navbar() {
  const { data: session, status } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <i className="fas fa-basketball-ball text-ph-blue text-2xl mr-2"></i>
              <span className="text-xl font-bold text-ph-blue">Court Reservation</span>
            </Link>

            <div className="hidden md:flex ml-10 space-x-4">
              <Link
                href="/courts"
                className="text-gray-700 hover:text-ph-blue px-3 py-2 rounded-md text-sm font-medium transition"
              >
                <i className="fas fa-map-marker-alt mr-1"></i> Browse Courts
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            ) : session ? (
              <>
                <Link
                  href="/bookings"
                  className="text-gray-700 hover:text-ph-blue px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  <i className="fas fa-calendar-check mr-1"></i> My Bookings
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center text-gray-700 hover:text-ph-blue"
                  >
                    <i className="fas fa-user-circle text-2xl mr-2"></i>
                    <span className="text-sm font-medium">{session.user?.name || 'User'}</span>
                    <i className="fas fa-chevron-down ml-1 text-xs"></i>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <i className="fas fa-user mr-2"></i> Profile
                      </Link>
                      {session.user?.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <i className="fas fa-cog mr-2"></i> Admin Dashboard
                        </Link>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i> Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-ph-blue px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-ph-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
