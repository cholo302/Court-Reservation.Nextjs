import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/profile/', '/bookings/', '/verify/', '/resubmit/'],
      },
    ],
    sitemap: 'https://courtreserve.site/sitemap.xml',
  }
}
