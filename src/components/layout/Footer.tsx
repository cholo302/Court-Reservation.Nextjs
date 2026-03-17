'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface SiteInfo {
  siteName: string
  siteEmail: string
  sitePhone: string
  siteAddress: string
}

const DEFAULTS: SiteInfo = {
  siteName: 'OLOPSC Court Reservation',
  siteEmail: 'contact@olopsc.edu.ph',
  sitePhone: '+63 912 345 6789',
  siteAddress: 'Marikina City, Metro Manila',
}

export default function Footer() {
  const [info, setInfo] = useState<SiteInfo>(DEFAULTS)

  useEffect(() => {
    fetch('/api/settings/site-info')
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => {})
  }, [])

  return (
    <footer className="bg-gray-950 text-white mt-auto border-t border-gray-800">
      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        {/* Logo + name */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 shadow-md bg-ph-yellow p-[3px]">
            <img src="/olopsc.jpg" alt="Logo" className="w-full h-full object-cover rounded-full" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">{info.siteName}</span>
        </div>
        <p className="text-gray-400 text-sm mb-8">
          Book sports courts online — Basketball, Badminton, Volleyball &amp; Ping Pong.
        </p>

        {/* Contact pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <a
            href={`mailto:${info.siteEmail}`}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition rounded-full px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            <i className="fas fa-envelope text-ph-yellow text-xs"></i>
            {info.siteEmail}
          </a>
          <a
            href={`tel:${info.sitePhone}`}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition rounded-full px-4 py-2 text-sm text-gray-300 hover:text-white"
          >
            <i className="fas fa-phone text-green-400 text-xs"></i>
            {info.sitePhone}
          </a>
          <span className="flex items-center gap-2 bg-gray-800 rounded-full px-4 py-2 text-sm text-gray-300">
            <i className="fas fa-location-dot text-yellow-400 text-xs"></i>
            {info.siteAddress}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {info.siteName}. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <span className="bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-md text-xs font-semibold">GCash</span>
            <span className="text-gray-700">|</span>
            <Link href="/terms" className="hover:text-gray-300 transition">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
