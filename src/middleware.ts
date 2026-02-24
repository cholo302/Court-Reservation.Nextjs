import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes protection
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/courts',
          '/forgot-password',
        ]

        // Check if it's a public route or public API
        if (publicRoutes.some((route) => path === route || path.startsWith('/courts/'))) {
          return true
        }

        // API routes that are public
        if (path.startsWith('/api/courts') && req.method === 'GET') {
          return true
        }

        if (path.startsWith('/api/auth')) {
          return true
        }

        // All other routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/bookings/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/api/bookings/:path*',
    '/api/admin/:path*',
    '/api/profile/:path*',
  ],
}
