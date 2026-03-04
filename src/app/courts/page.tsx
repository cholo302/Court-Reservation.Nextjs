'use client'

import Link from 'next/link'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface Court {
  id: number
  name: string
  location: string
  city: string
  thumbnail: string | null
  hourlyRate: number
  peakHourRate: number | null
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
  const query = searchParams.get('q') || ''

  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(query)

  const fetchCourts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)

      const response = await fetch(`/api/courts?${params.toString()}`)
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCourts()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header + Search */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Browse Courts</h1>
        <p className="text-gray-500 mb-6">Find and book available sports courts</p>
        <form onSubmit={handleSearch}>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, location, sport type..."
                className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent shadow-sm text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-ph-blue text-white px-7 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm active:scale-[0.98]"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results count */}
      {!loading && courts.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="bg-ph-blue/10 text-ph-blue text-sm font-semibold px-3 py-1 rounded-full">
            {courts.length} court{courts.length !== 1 ? 's' : ''}
          </span>
          {query && (
            <span className="text-gray-500 text-sm">for &ldquo;{query}&rdquo;</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-4xl text-ph-blue mb-4"></i>
          <p className="text-gray-400 text-sm">Loading courts...</p>
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <i className="fas fa-search text-gray-300 text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No courts found</h2>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <Link href="/courts" className="text-ph-blue font-semibold hover:underline text-sm">
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
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

                {court.peakHourRate && (
                  <span className="absolute top-3 right-3 bg-ph-yellow/90 backdrop-blur-sm text-ph-blue text-xs font-bold px-2.5 py-1 rounded-lg">
                    Peak Hours
                  </span>
                )}
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

                {/* Amenities */}
                {court.amenities && court.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {court.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-gray-50 text-gray-500 text-xs px-2 py-1 rounded-md border border-gray-100"
                      >
                        <i
                          className={`fas ${amenityIcons[amenity] || 'fa-check'} mr-1`}
                        ></i>
                        {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                      </span>
                    ))}
                  </div>
                )}

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
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    }>
      <CourtsContent />
    </Suspense>
  )
}
