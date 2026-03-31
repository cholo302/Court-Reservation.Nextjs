/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Ensure dynamic pages are not statically optimized at build time
  // This prevents build errors from API calls that require a running server
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
