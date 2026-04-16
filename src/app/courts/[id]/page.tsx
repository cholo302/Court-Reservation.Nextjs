'use client'

import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'
import toast from 'react-hot-toast'
import { Footer } from '@/components/layout'

interface TimeSlot {
  start: string
  end: string
  available: boolean
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
  rating: number
  capacity: number | null
  amenities: string[]
  rules: string | null
  photos: { id: number; url: string; sortOrder: number }[]
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
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  const [isClosed, setIsClosed] = useState(false)
  const [closedReason, setClosedReason] = useState('')
  const [activePhoto, setActivePhoto] = useState(0)
  const touchStartX = useRef<number | null>(null)

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
          // Apply client-side past-slot filtering to handle server timezone mismatch
          const now = new Date()
          const clientToday = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
          ].join('-')
          const clientHour = now.getHours()
          const processedSlots = (data.slots || []).map((slot: TimeSlot) => {
            if (selectedDate === clientToday) {
              const slotHour = parseInt(slot.start.split(':')[0])
              if (slotHour <= clientHour) return { ...slot, available: false }
            }
            return slot
          })
          setSlots(processedSlots)
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

  const isAdmin = session?.user?.role === 'admin'

  const isSlotSelected = (slot: TimeSlot) => {
    return selectedSlots.some((s) => s.start === slot.start)
  }

  const handleBookNow = () => {
    if (isAdmin) {
      toast.error('Admins cannot book courts. This is view-only mode.')
      return
    }

    if (!session) {
      toast.error('Please login to book a court')
      router.push('/login')
      return
    }

    const vs = session.user?.verificationStatus
    if (vs === 'none' || vs === 'rejected') {
      toast.error(vs === 'rejected' ? 'Your ID was rejected. Please resubmit.' : 'Please verify your ID first')
      router.push('/verify')
      return
    }

    if (vs === 'pending') {
      toast.error('Please wait for your ID to be verified')
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
        <BouncingBallLoader />
      </div>
    )
  }

  if (!court) {
    return null
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-ph-blue hover:text-blue-700 font-medium mb-6 sm:mb-8 transition-colors"
      >
        <i className="fas fa-arrow-left"></i>
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="flex-1 space-y-4 sm:space-y-6">
          {/* Court Image Gallery */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {(() => {
              const allImages = court.photos?.length > 0
                ? court.photos.map((p) => p.url)
                : court.thumbnail
                ? [court.thumbnail]
                : []
              return (
                <div
                  className="h-72 sm:h-96 lg:h-[28rem] bg-gradient-to-br from-ph-blue to-blue-700 relative select-none"
                  onTouchStart={(e) => { if (allImages.length > 1) touchStartX.current = e.touches[0].clientX }}
                  onTouchEnd={(e) => {
                    if (touchStartX.current === null || allImages.length <= 1) return
                    const diff = e.changedTouches[0].clientX - touchStartX.current
                    touchStartX.current = null
                    if (Math.abs(diff) < 40) return
                    setActivePhoto((p) => diff < 0 ? (p + 1) % allImages.length : (p - 1 + allImages.length) % allImages.length)
                  }}
                >
                  {allImages.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-basketball-ball text-white/30 text-8xl"></i>
                    </div>
                  ) : (
                    <>
                      <img
                        src={allImages[activePhoto] || allImages[0]}
                        alt={court.name}
                        className="w-full h-full object-cover"
                      />
                      {allImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setActivePhoto((p) => (p - 1 + allImages.length) % allImages.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
                          >
                            <i className="fas fa-chevron-left text-sm"></i>
                          </button>
                          <button
                            onClick={() => setActivePhoto((p) => (p + 1) % allImages.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition"
                          >
                            <i className="fas fa-chevron-right text-sm"></i>
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {allImages.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setActivePhoto(i)}
                                className={`w-2 h-2 rounded-full transition ${i === activePhoto ? 'bg-white scale-125' : 'bg-white/50'}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

              <div className="absolute top-4 left-4 flex space-x-2">
                <span className="bg-white/90 text-ph-blue text-sm font-semibold px-3 py-1 rounded-full">
                  {court.courtType?.name || 'Court'}
                </span>
              </div>
              {court.photos?.length > 1 && (
                <div className="absolute top-4 right-4">
                  <span className="bg-black/50 text-white text-xs px-2.5 py-1 rounded-full">
                    {activePhoto + 1} / {court.photos.length}
                  </span>
                </div>
              )}
                </div>
              )
            })()}

            {/* Thumbnail strip */}
            {court.photos?.length > 1 && (
              <div className="flex gap-1 p-2 bg-gray-50 overflow-x-auto">
                {court.photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => setActivePhoto(i)}
                    className={`shrink-0 w-20 h-14 rounded-md overflow-hidden border-2 transition ${
                      i === activePhoto ? 'border-ph-blue' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Court Info */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Name + location header strip */}
            <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{court.name}</h1>
                  {(court.location || court.city) && (
                    <div className="flex items-start gap-1.5 mt-2 text-sm text-gray-500">
                      <i className="fas fa-location-dot text-yellow-500 mt-0.5 shrink-0"></i>
                      <span className="leading-snug break-words">
                        {[court.location, court.barangay, court.city].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <span className="shrink-0 self-start bg-blue-50 text-ph-blue text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100">
                  {court.courtType?.name || 'Court'}
                </span>
              </div>
            </div>

            {/* Description */}
            {court.description && (
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">About</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{court.description}</p>
              </div>
            )}

            {/* Rules */}
            {court.rules && (
              <div className="px-4 sm:px-6 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <i className="fas fa-triangle-exclamation text-amber-500 text-xs"></i>
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">Court Rules</h3>
                </div>
                <div className="space-y-2">
                  {court.rules.split('\n').filter(line => line.trim()).map((line, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                      <span className="break-words">{line.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Schedule/Availability */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
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
                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent w-full sm:w-auto"
              />
            </div>

            <div id="time-slots" className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-4">
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
                    className={`time-slot text-center py-3 px-2 rounded-lg cursor-pointer transition touch-manipulation
                      ${
                        isSlotSelected(slot)
                          ? 'bg-ph-blue text-white ring-2 ring-ph-blue ring-offset-1'
                          : slot.available
                          ? 'bg-green-100 hover:bg-green-200 active:bg-green-300 text-green-800'
                          : 'bg-red-100 text-red-400 cursor-not-allowed'
                      }`}
                  >
                    <div className="text-sm font-medium">{formatTime(slot.start)}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center text-gray-500 py-8">
                  <BouncingBallLoader size={60} text="Loading slots..." />
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded mr-1.5 sm:mr-2"></span> Available
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 rounded mr-1.5 sm:mr-2"></span> Not Available
              </span>
              <span className="flex items-center">
                <span className="w-3 h-3 sm:w-4 sm:h-4 bg-ph-blue rounded mr-1.5 sm:mr-2"></span> Selected
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar - Booking Card */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-24">
            <div className="text-center mb-4">
              <span className="text-2xl sm:text-3xl font-bold text-ph-blue">
                {formatPrice(court.hourlyRate)}
              </span>
              <span className="text-gray-500 text-sm sm:text-base">/hour</span>
            </div>

            {selectedSlots.length > 0 && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Selected Slots:</h4>
                <div className="space-y-1 text-sm">
                  {selectedSlots.map((slot) => (
                    <div key={slot.start} className="flex justify-between">
                      <span>
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-medium">
                  <span>Total Hours:</span>
                  <span>{selectedSlots.length}</span>
                </div>
              </div>
            )}

            {/* Verification status messages */}
            {session?.user?.verificationStatus === 'pending' && !isAdmin && (
              <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <i className="fas fa-hourglass-half text-amber-500 mr-1.5"></i>
                <span className="text-sm text-amber-700 font-medium">Waiting for ID verification</span>
              </div>
            )}
            {session?.user?.verificationStatus === 'none' && !isAdmin && (
              <div className="mb-3">
                <Link
                  href="/verify"
                  className="block bg-amber-50 border border-amber-200 rounded-lg p-3 text-center hover:bg-amber-100 transition"
                >
                  <i className="fas fa-shield-halved text-amber-500 mr-1.5"></i>
                  <span className="text-sm text-amber-700 font-medium">Verify your ID to book</span>
                </Link>
              </div>
            )}
            {session?.user?.verificationStatus === 'rejected' && !isAdmin && (
              <div className="mb-3">
                <Link
                  href="/verify"
                  className="block bg-red-50 border border-red-200 rounded-lg p-3 text-center hover:bg-red-100 transition"
                >
                  <i className="fas fa-triangle-exclamation text-red-500 mr-1.5"></i>
                  <span className="text-sm text-red-700 font-medium">ID rejected — Resubmit</span>
                </Link>
              </div>
            )}

            {isAdmin ? (
              <div className="w-full py-3 rounded-lg bg-gray-100 border border-gray-200 text-center text-sm text-gray-500 font-medium">
                <i className="fas fa-eye mr-2"></i>Admin View Only — Booking disabled
              </div>
            ) : (
            <button
              onClick={handleBookNow}
              disabled={selectedSlots.length === 0 || session?.user?.verificationStatus === 'pending'}
              className={`w-full py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                session?.user?.verificationStatus === 'pending'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-ph-blue text-white hover:bg-blue-800'
              }`}
            >
              <i className={`fas ${session?.user?.verificationStatus === 'pending' ? 'fa-clock' : 'fa-calendar-check'} mr-2`}></i>
              {session?.user?.verificationStatus === 'pending'
                ? 'Waiting for Verification'
                : selectedSlots.length > 0
                ? `Book ${selectedSlots.length} Hour${selectedSlots.length > 1 ? 's' : ''}`
                : 'Select Time Slots'}
            </button>
            )}

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
    <Footer />
    </>
  )
}
