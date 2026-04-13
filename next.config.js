/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase body size limit for file uploads (10MB)
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Serve dynamically uploaded files via API route
  // In production, Next.js only serves public/ files that existed at build time.
  // Files uploaded after the build (user photos, payment proofs) need this rewrite
  // to be served via the /api/uploads/ route instead.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

module.exports = nextConfig
