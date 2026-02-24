'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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
  totalReviews: number
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

export default function CourtsPage() {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courts by name, location..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-ph-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {courts.length} Courts Found
          {query && (
            <span className="text-gray-500 font-normal"> for &ldquo;{query}&rdquo;</span>
          )}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
        </div>
      ) : courts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <i className="fas fa-search text-gray-300 text-6xl mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No courts found</h2>
          <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
          <Link href="/courts" className="text-ph-blue hover:underline">
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <div
              key={court.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition group"
            >
              <div className="relative h-48 bg-gradient-to-br from-ph-blue to-blue-700">
                {court.thumbnail ? (
                  <img
                    src={court.thumbnail}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-basketball-ball text-white/30 text-6xl"></i>
                  </div>
                )}

                {/* Badge */}
                <span className="absolute top-3 left-3 bg-white/90 text-ph-blue text-xs font-semibold px-2 py-1 rounded">
                  {court.courtType?.name || 'Court'}
                </span>

                {court.peakHourRate && (
                  <span className="absolute top-3 right-3 bg-ph-yellow text-ph-blue text-xs font-semibold px-2 py-1 rounded">
                    Peak Hours Available
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-ph-blue transition">
                    {court.name}
                  </h3>
                  {court.rating > 0 && (
                    <div className="flex items-center text-sm">
                      <i className="fas fa-star text-yellow-400 mr-1"></i>
                      <span>{court.rating.toFixed(1)}</span>
                      <span className="text-gray-400 ml-1">({court.totalReviews})</span>
                    </div>
                  )}
                </div>

                <p className="text-gray-500 text-sm mb-3">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  {court.location}, {court.city}
                </p>

                {court.capacity && (
                  <p className="text-gray-500 text-sm mb-3">
                    <i className="fas fa-users mr-1"></i>
                    Up to {court.capacity} players
                  </p>
                )}

                {/* Amenities */}
                {court.amenities && court.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {court.amenities.slice(0, 4).map((amenity) => (
                      <span
                        key={amenity}
                        className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                      >
                        <i
                          className={`fas ${amenityIcons[amenity] || 'fa-check'} mr-1`}
                        ></i>
                        {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <span className="text-ph-blue font-bold text-xl">
                      {formatPrice(court.hourlyRate)}
                    </span>
                    <span className="text-gray-400 text-sm">/hour</span>
                  </div>
                  <Link
                    href={`/courts/${court.id}`}
                    className="bg-ph-blue text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
