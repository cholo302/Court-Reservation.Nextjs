'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface TimeSlot {
  start: string
  end: string
  available: boolean
  rate: number
}

interface Court {
  id: number
  name: string
  hourlyRate: number
  halfCourtRate: number | null
  thumbnail: string | null
  courtType: {
    slug: string
    name: string
  }
}

export default function CreateBookingPage({ params }: { params: { courtId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [court, setCourt] = useState<Court | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(30)

  const today = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + maxAdvanceDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    bookingDate: today,
    startTime: '',
    endTime: '',
    isHalfCourt: false,
    paymentType: 'online',
  })

  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([])
  const [lastFetchedDate, setLastFetchedDate] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    // Redirect users who haven't submitted docs or were rejected
    if (status === 'authenticated') {
      const vs = session?.user?.verificationStatus
      if (vs === 'none' || vs === 'rejected') {
        toast.error(vs === 'rejected' ? 'Your ID was rejected. Please resubmit.' : 'Please verify your ID before booking a court')
        router.push('/verify')
        return
      }
    }

    const fetchCourt = async () => {
      try {
        const response = await fetch(`/api/courts/${params.courtId}`)
        if (!response.ok) throw new Error('Court not found')
        const data = await response.json()
        setCourt(data.court)
      } catch (error) {
        toast.error('Court not found')
        router.push('/courts')
      } finally {
        setLoading(false)
      }
    }

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/booking')
        if (res.ok) {
          const data = await res.json()
          if (data.maxAdvanceBookingDays) setMaxAdvanceDays(data.maxAdvanceBookingDays)
        }
      } catch {}
    }

    fetchCourt()
    fetchSettings()

    // Check if there's booking data from the court detail page
    const storedData = sessionStorage.getItem('bookingData')
    if (storedData) {
      const bookingData = JSON.parse(storedData)
      if (bookingData.courtId === params.courtId) {
        setFormData((prev) => ({ ...prev, bookingDate: bookingData.date }))
        setSelectedSlots(bookingData.slots)
      }
      sessionStorage.removeItem('bookingData')
    }
  }, [params.courtId, status, router, session])

  useEffect(() => {
    const abortController = new AbortController()

    const fetchSlots = async () => {
      try {
        const response = await fetch(
          `/api/courts/${params.courtId}/slots?date=${formData.bookingDate}`,
          { signal: abortController.signal }
        )
        const data = await response.json()
        if (abortController.signal.aborted) return
        setSlots(data.slots || [])
        // Only clear selected slots if the date actually changed
        if (lastFetchedDate && lastFetchedDate !== formData.bookingDate) {
          setSelectedSlots([])
        }
        setLastFetchedDate(formData.bookingDate)
      } catch (error: any) {
        if (error?.name === 'AbortError') return
        console.error('Error fetching slots:', error)
      }
    }

    if (params.courtId && formData.bookingDate) {
      fetchSlots()
    }

    return () => abortController.abort()
  }, [params.courtId, formData.bookingDate])

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

  const calculateTotal = () => {
    if (!court || selectedSlots.length === 0) return 0

    let total = 0
    selectedSlots.forEach((slot) => {
      const rate = court.hourlyRate
      total += formData.isHalfCourt && court.halfCourtRate ? court.halfCourtRate : rate
    })
    return total
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedSlots.length === 0) {
      toast.error('Please select at least one time slot')
      return
    }

    setSubmitting(true)

    try {
      // Sort slots and get start/end times
      const sortedSlots = [...selectedSlots].sort((a, b) => a.start.localeCompare(b.start))
      const startTime = sortedSlots[0].start
      const lastSlot = sortedSlots[sortedSlots.length - 1]
      const endTime = lastSlot.end

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: parseInt(params.courtId),
          bookingDate: formData.bookingDate,
          startTime,
          endTime,
          isHalfCourt: formData.isHalfCourt,
          paymentType: formData.paymentType,

          totalAmount: calculateTotal(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      toast.success('Booking confirmed! Complete your payment.')
      router.push(`/bookings/${data.booking.id}/pay`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BouncingBallLoader />
      </div>
    )
  }

  if (!court) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Link href={`/courts/${court.id}`} className="hover:text-ph-blue">
              {court.name}
            </Link>
          </li>
          <li>
            <i className="fas fa-chevron-right text-xs"></i>
          </li>
          <li className="text-gray-900">Book</li>
        </ol>
      </nav>

      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-ph-blue mb-1">Book</p>
        <h1 className="text-3xl font-extrabold text-gray-900 uppercase">{court.name}</h1>
      </div>

      {/* Pending Verification Banner */}
      {session?.user?.verificationStatus === 'pending' && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-hourglass-half text-amber-600"></i>
          </div>
          <div>
            <p className="font-semibold text-amber-900">ID Verification Pending</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Your documents are under review. You&apos;ll be able to book courts once your ID is verified by an admin.
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="md:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm p-6 space-y-6"
          >
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={formData.bookingDate}
                onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                min={today}
                max={maxDate}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                required
              />
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time Slots
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Click to select time slots (select multiple for longer sessions)
              </p>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-4">
                {slots.map((slot) => (
                  <button
                    key={slot.start}
                    type="button"
                    onClick={() => handleSlotClick(slot)}
                    disabled={!slot.available}
                    className={`py-3 px-2 rounded-lg text-center text-sm font-medium transition
                      ${
                        isSlotSelected(slot)
                          ? 'bg-ph-blue text-white ring-2 ring-ph-blue ring-offset-2'
                          : slot.available
                          ? 'bg-green-100 hover:bg-green-200 text-green-800 border-2 border-transparent'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {formatTime(slot.start)}
                  </button>
                ))}
              </div>

              {selectedSlots.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <span className="font-medium">Selected: </span>
                  <span>
                    {formatTime(selectedSlots[0].start)} -{' '}
                    {formatTime(selectedSlots[selectedSlots.length - 1].end)}
                  </span>
                  <span className="ml-2 text-gray-500">
                    ({selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>

            {/* Half Court Option */}
            {court.courtType?.slug === 'basketball' && court.halfCourtRate && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="half-court"
                  checked={formData.isHalfCourt}
                  onChange={(e) =>
                    setFormData({ ...formData, isHalfCourt: e.target.checked })
                  }
                  className="h-5 w-5 text-ph-blue focus:ring-ph-blue border-gray-300 rounded"
                />
                <label htmlFor="half-court" className="ml-3 text-gray-700">
                  Half Court Only ({formatPrice(court.halfCourtRate)}/hr)
                </label>
              </div>
            )}

            {/* Payment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Option
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:border-ph-blue transition">
                  <input
                    type="radio"
                    name="paymentType"
                    value="online"
                    checked={formData.paymentType === 'online'}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentType: e.target.value })
                    }
                    className="sr-only peer"
                  />
                  <div className="text-center peer-checked:text-ph-blue">
                    <i className="fas fa-qrcode text-2xl mb-2"></i>
                    <p className="font-medium">Pay Now (QR)</p>
                    <p className="text-xs text-gray-500">Full payment via GCash</p>
                  </div>
                  <div className="absolute inset-0 border-2 border-transparent peer-checked:border-ph-blue rounded-lg"></div>
                </label>

                <label className="relative flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer hover:border-ph-blue transition">
                  <input
                    type="radio"
                    name="paymentType"
                    value="venue"
                    checked={formData.paymentType === 'venue'}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentType: e.target.value })
                    }
                    className="sr-only peer"
                  />
                  <div className="text-center peer-checked:text-ph-blue">
                    <i className="fas fa-hand-holding-usd text-2xl mb-2"></i>
                    <p className="font-medium">Downpayment</p>
                    <p className="text-xs text-gray-500">Pay 50% now, balance on-site</p>
                  </div>
                  <div className="absolute inset-0 border-2 border-transparent peer-checked:border-ph-blue rounded-lg"></div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedSlots.length === 0 || submitting || session?.user?.verificationStatus === 'pending'}
              className="w-full bg-ph-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {session?.user?.verificationStatus === 'pending' ? (
                <>
                  <i className="fas fa-clock mr-2"></i>Waiting for ID Verification
                </>
              ) : submitting ? (
                <>
                  <BallSpinner className="mr-2" />Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-calendar-check mr-2"></i>Confirm Booking
                </>
              )}
            </button>
          </form>
        </div>

        {/* Price Summary */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            {/* Court Info */}
            <div className="flex items-center mb-4 pb-4 border-b">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden mr-3">
                {court.thumbnail ? (
                  <img
                    src={court.thumbnail}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-basketball-ball text-gray-400"></i>
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{court.name}</h3>
                <p className="text-sm text-gray-500">{court.courtType?.name || 'Court'}</p>
              </div>
            </div>

            {/* Price Details */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rate per hour</span>
                <span>{formatPrice(court.hourlyRate)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Hours selected</span>
                <span>{selectedSlots.length}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-2xl font-bold text-ph-blue">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
              {formData.paymentType === 'venue' && calculateTotal() > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Downpayment (50%)</span>
                    <span className="font-medium text-green-600">
                      {formatPrice(Math.ceil(calculateTotal() * 0.5))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Balance (pay on-site)</span>
                    <span className="font-medium text-orange-600">
                      {formatPrice(calculateTotal() - Math.ceil(calculateTotal() * 0.5))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
