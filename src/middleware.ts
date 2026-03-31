import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const AUTH_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-in-production'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Admin routes protection
    if (path.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    }

    // Maintenance mode check — skip for admin users, admin routes, API routes, login/register, and maintenance page itself
    const isAdmin = token?.role === 'admin'
    const skipMaintenance =
      isAdmin ||
      path.startsWith('/api') ||
      path.startsWith('/admin') ||
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path === '/maintenance'

    if (!skipMaintenance) {
      try {
        const res = await fetch(new URL('/api/settings/maintenance', req.url), {
          cache: 'no-store',
          headers: { 'x-middleware-check': '1' },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.maintenanceMode) {
            return NextResponse.redirect(new URL('/maintenance', req.url))
          }
        }
      } catch (e) {
        // If fetch fails, allow through
      }
    }

    return NextResponse.next()
  },
  {
    secret: AUTH_SECRET,
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
          '/reset-password',
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

        if (path.startsWith('/api/settings')) {
          return true
        }

        // Uploaded file serving API (public)
        if (path.startsWith('/api/uploads')) {
          return true
        }

        if (path.startsWith('/maintenance')) {
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
    '/((?!_next/static|_next/image|favicon\.ico|uploads|olopsc\\.jpg|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)',
  ],
}
