'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Footer } from '@/components/layout'

interface Court {
  id: number
  name: string
  location: string
  city: string
  thumbnail: string | null
  hourlyRate: number
  rating: number
  capacity: number | null
  amenities: string[]
  courtType: {
    name: string
  }
}

const amenityIcons: Record<string, string> = {
  parking: 'fa-parking',
  shower: 'fa-shower',
  locker: 'fa-lock',
  lights: 'fa-lightbulb',
  aircon: 'fa-snowflake',
}

function CourtsContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'
  const query = searchParams.get('q') || ''

  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(query)

  const fetchCourts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/courts')
      const data = await response.json()
      setCourts(data.courts || [])
    } catch (error) {
      console.error('Error fetching courts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourts()
  }, [])

  const filteredCourts = courts.filter(
    (court) =>
      court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      court.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      court.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      court.courtType.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-ph-blue hover:text-blue-700 font-medium mb-8 transition-colors"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Dashboard
      </Link>

      {/* Header + Search */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Browse Courts</h1>
        <p className="text-gray-500 mb-6">Find and book available sports courts</p>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courts by name, location, or type..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-ph-blue/10 text-ph-blue text-sm font-semibold px-3 py-1 rounded-full">
            {filteredCourts.length} court{filteredCourts.length !== 1 ? 's' : ''}
          </span>
          {searchQuery && (
            <span className="text-gray-500 text-sm">for &ldquo;{searchQuery}&rdquo;</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-ph-blue mb-4"></i>
          <p className="text-gray-400 text-sm">Loading courts...</p>
        </div>
      ) : filteredCourts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="fas fa-search text-gray-300 text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No courts found</h2>
          <p className="text-gray-500 mb-6">Try adjusting your search</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-ph-blue font-semibold hover:underline text-sm">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => (
            <Link
              key={court.id}
              href={`/courts/${court.id}`}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover group block"
            >
              <div className="relative h-48 bg-gradient-to-br from-ph-blue to-blue-700 overflow-hidden">
                {court.thumbnail ? (
                  <img
                    src={court.thumbnail}
                    alt={court.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-basketball text-white/20 text-7xl"></i>
                  </div>
                )}

                {/* Badge */}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-ph-blue text-xs font-bold px-2.5 py-1 rounded-lg">
                  {court.courtType?.name || 'Court'}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 group-hover:text-ph-blue transition-colors">
                    {court.name}
                  </h3>
                </div>

                <p className="text-gray-500 text-sm mb-3">
                  <i className="fas fa-location-dot mr-1.5 text-gray-400"></i>
                  {court.location}, {court.city}
                </p>

                {court.capacity && (
                  <p className="text-gray-500 text-sm mb-3">
                    <i className="fas fa-users mr-1.5 text-gray-400"></i>
                    Up to {court.capacity} players
                  </p>
                )}

                {/* Amenities removed */}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-ph-blue font-extrabold text-xl">
                      {formatPrice(court.hourlyRate)}
                    </span>
                    <span className="text-gray-400 text-sm">/hr</span>
                  </div>
                  <span className="bg-ph-blue/10 text-ph-blue px-4 py-2 rounded-lg text-sm font-semibold group-hover:bg-ph-blue group-hover:text-white transition-colors">
                    View Details
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CourtsPage() {
  return (
    <>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
        </div>
      }>
        <CourtsContent />
      </Suspense>
      <Footer />
    </>
  )
}
