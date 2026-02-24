'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TimeSlot {
  start: string
  end: string
  available: boolean
  isPeak: boolean
}

interface Review {
  id: number
  rating: number
  comment: string
  userName: string
  createdAt: string
}

interface Court {
  id: number
  name: string
  description: string | null
  location: string
  barangay: string | null
  city: string
  thumbnail: string | null
  hourlyRate: number
  peakHourRate: number | null
  rating: number
  totalReviews: number
  capacity: number | null
  amenities: string[]
  rules: string | null
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

export default function CourtDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()

  const [court, setCourt] = useState<Court | null>(null)
  const [slots, setSlots] = useState<TimeSlot[] | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  const [isClosed, setIsClosed] = useState(false)
  const [closedReason, setClosedReason] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const response = await fetch(`/api/courts/${params.id}`)
        if (!response.ok) {
          throw new Error('Court not found')
        }
        const data = await response.json()
        setCourt(data.court)
        setReviews(data.reviews || [])
      } catch (error) {
        console.error('Error fetching court:', error)
        toast.error('Court not found')
        router.push('/courts')
      } finally {
        setLoading(false)
      }
    }

    fetchCourt()
  }, [params.id, router])

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const response = await fetch(`/api/courts/${params.id}/slots?date=${selectedDate}`)
        const data = await response.json()

        if (data.closed) {
          setIsClosed(true)
          setClosedReason(data.reason || '')
          setSlots([])
        } else {
          setIsClosed(false)
          setClosedReason('')
          setSlots(data.slots || [])
        }
        setSelectedSlots([])
      } catch (error) {
        console.error('Error fetching slots:', error)
      }
    }

    if (params.id) {
      fetchSlots()
    }
  }, [params.id, selectedDate])

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.available) return

    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.start === slot.start)
      if (exists) {
        return prev.filter((s) => s.start !== slot.start)
      } else {
        return [...prev, slot].sort((a, b) => a.start.localeCompare(b.start))
      }
    })
  }

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some((s) => s.start === slot.start)
  }

  const handleBookNow = () => {
    if (!session) {
      toast.error('Please login to book a court')
      router.push('/login')
      return
    }

    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot')
      return
    }

    // Store booking info in session storage and redirect to booking page
    const bookingData = {
      courtId: params.id,
      date: selectedDate,
      slots: selectedSlots,
    }
    sessionStorage.setItem('bookingData', JSON.stringify(bookingData))
    router.push(`/bookings/create/${params.id}`)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  if (!court) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500">
          <li>
            <Link href="/" className="hover:text-ph-blue">
              Home
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li>
            <Link href="/courts" className="hover:text-ph-blue">
              Courts
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li className="text-gray-900">{court.name}</li>
        </ol>
      </nav>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Court Image */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="h-80 bg-gradient-to-br from-ph-blue to-blue-700 relative">
              {court.thumbnail ? (
                <img
                  src={court.thumbnail}
                  alt={court.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <i className="fas fa-basketball-ball text-white/30 text-8xl"></i>
                </div>
              )}

              <div className="absolute top-4 left-4 flex space-x-2">
                <span className="bg-white/90 text-ph-blue text-sm font-semibold px-3 py-1 rounded-full">
                  {court.courtType?.name || 'Court'}
                </span>
                {court.rating > 0 && (
                  <span className="bg-ph-yellow text-ph-blue text-sm font-semibold px-3 py-1 rounded-full">
                    <i className="fas fa-star mr-1"></i>
                    {court.rating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Court Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{court.name}</h1>

            <div className="flex items-center text-gray-500 mb-4">
              <i className="fas fa-map-marker-alt mr-2"></i>
              <span>
                {court.location}
                {court.barangay && `, ${court.barangay}`}, {court.city}
              </span>
            </div>

            {court.description && (
              <p className="text-gray-600 mb-6 whitespace-pre-line">{court.description}</p>
            )}

            {/* Amenities */}
            {court.amenities && court.amenities.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-3">
                  {court.amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg"
                    >
                      <i
                        className={`fas ${amenityIcons[amenity] || 'fa-check'} mr-2 text-ph-blue`}
                      ></i>
                      {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {court.rules && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
                  Court Rules
                </h3>
                <p className="text-gray-600 text-sm whitespace-pre-line">{court.rules}</p>
              </div>
            )}
          </div>

          {/* Schedule/Availability */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              <i className="fas fa-calendar-alt mr-2 text-ph-blue"></i>Availability
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                max={maxDate}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              />
            </div>

            <div id="time-slots" className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {isClosed ? (
                <div className="col-span-full text-center text-gray-500 py-8">
                  <i className="fas fa-ban text-4xl mb-2"></i>
                  <p>Closed on this date</p>
                  {closedReason && <p className="text-sm">Reason: {closedReason}</p>}
                </div>
              ) : slots && slots.length > 0 ? (
                slots.map((slot) => (
                  <div
                    key={slot.start}
                    onClick={() => handleSlotClick(slot)}
                    className={`time-slot text-center py-2 px-1 rounded-lg cursor-pointer transition
                      ${
                        isSlotSelected(slot)
                          ? 'bg-ph-blue text-white ring-2 ring-ph-blue ring-offset-2'
                          : slot.available
                          ? slot.isPeak
                            ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'
                            : 'bg-green-100 hover:bg-green-200 text-green-800'
                          : 'bg-red-100 text-red-400 cursor-not-allowed'
                      }`}
                  >
                    <div className="text-sm font-medium">{formatTime(slot.start)}</div>
                    {slot.isPeak && !isSlotSelected(slot) && (
                      <div className="text-xs">Peak</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                  <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading slots...</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center space-x-4 text-sm">
              <span className="flex items-center">
                <span className="w-4 h-4 bg-green-100 rounded mr-2"></span> Available
              </span>
              <span className="flex items-center">
                <span className="w-4 h-4 bg-yellow-100 rounded mr-2"></span> Peak Hour
              </span>
              <span className="flex items-center">
                <span className="w-4 h-4 bg-red-100 rounded mr-2"></span> Booked
              </span>
              <span className="flex items-center">
                <span className="w-4 h-4 bg-ph-blue rounded mr-2"></span> Selected
              </span>
            </div>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                <i className="fas fa-star mr-2 text-ph-yellow"></i>Reviews ({court.totalReviews})
              </h3>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4">
                    <div className="flex items-center mb-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i className="fas fa-user text-gray-500"></i>
                      </div>
                      <div>
                        <p className="font-medium">{review.userName}</p>
                        <div className="flex items-center text-sm text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`fas fa-star ${
                                i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            ></i>
                          ))}
                          <span className="text-gray-400 ml-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {review.comment && <p className="text-gray-600 text-sm">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Booking Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-ph-blue">
                {formatPrice(court.hourlyRate)}
              </span>
              <span className="text-gray-500">/hour</span>
            </div>

            {court.peakHourRate && (
              <p className="text-center text-sm text-gray-500 mb-4">
                Peak hours:{' '}
                <span className="font-semibold text-ph-yellow">
                  {formatPrice(court.peakHourRate)}
                </span>
                /hour
              </p>
            )}

            {selectedSlots.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Selected Slots:</h4>
                <div className="space-y-1 text-sm">
                  {selectedSlots.map((slot) => (
                    <div key={slot.start} className="flex justify-between">
                      <span>
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </span>
                      {slot.isPeak && (
                        <span className="text-ph-yellow text-xs">Peak</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                  <span>Total Hours:</span>
                  <span>{selectedSlots.length}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBookNow}
              disabled={selectedSlots.length === 0}
              className="w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-calendar-check mr-2"></i>
              {selectedSlots.length > 0
                ? `Book ${selectedSlots.length} Hour${selectedSlots.length > 1 ? 's' : ''}`
                : 'Select Time Slots'}
            </button>

            {court.capacity && (
              <p className="text-center text-sm text-gray-500 mt-4">
                <i className="fas fa-users mr-1"></i>
                Capacity: Up to {court.capacity} players
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
