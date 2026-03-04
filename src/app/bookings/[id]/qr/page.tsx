'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface BookingDetails {
  id: number
  bookingCode: string
  status: string
  bookingDate: string
  startTime: string
  endTime: string
  courtName: string
  courtLocation: string
  totalAmount: number
  downpaymentAmount: number
  balanceAmount: number
  paymentType: string | null
  entryQrCode: string | null
}

export default function BookingQRPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${params.id}`)
        if (!response.ok) throw new Error('Booking not found')
        const data = await response.json()
        
        const b = data.booking
        setBooking({
          id: b.id,
          bookingCode: b.bookingCode,
          status: b.status,
          bookingDate: b.bookingDate,
          startTime: b.startTime,
          endTime: b.endTime,
          courtName: b.courtName || b.court?.name,
          courtLocation: b.courtLocation || b.court?.location,
          totalAmount: Number(b.totalAmount),
          downpaymentAmount: Number(b.downpaymentAmount),
          balanceAmount: Number(b.balanceAmount),
          paymentType: b.paymentType,
          entryQrCode: b.entryQrCode,
        })
      } catch (error) {
        toast.error('Booking not found')
        router.push('/bookings')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [params.id, router])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  // Generate QR code URL using a free QR code API
  const getQRCodeUrl = (code: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}`
  }

  const handleDownload = async () => {
    if (!booking) return

    try {
      const qrUrl = getQRCodeUrl(booking.bookingCode)
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `booking-${booking.bookingCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('QR code downloaded!')
    } catch (error) {
      toast.error('Failed to download QR code')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    )
  }

  // Check if booking is valid for QR display
  const isValidForEntry = ['paid', 'confirmed'].includes(booking.status)

  if (!isValidForEntry) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-md">
          <Link
            href={`/bookings/${params.id}`}
            className="inline-flex items-center text-ph-blue hover:underline mb-6"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Booking
          </Link>

          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-3xl text-yellow-600"></i>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">QR Code Not Available</h1>
            <p className="text-gray-600 mb-6">
              {booking.status === 'pending'
                ? 'Please complete payment to get your entry QR code.'
                : booking.status === 'cancelled'
                ? 'This booking has been cancelled.'
                : booking.status === 'completed'
                ? 'This booking has already been completed.'
                : 'QR code is not available for this booking status.'}
            </p>
            {booking.status === 'pending' && (
              <Link
                href={`/bookings/${params.id}/pay`}
                className="inline-flex items-center px-6 py-3 bg-ph-blue text-white rounded-lg font-medium hover:bg-blue-800 transition"
              >
                <i className="fas fa-credit-card mr-2"></i>
                Pay Now
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Link
          href={`/bookings/${params.id}`}
          className="inline-flex items-center text-ph-blue hover:underline mb-6 print:hidden"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Booking
        </Link>

        {/* QR Card - Printable */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden" id="qr-card">
          {/* Header */}
          <div className="bg-gradient-to-r from-ph-blue to-blue-600 text-white p-6 text-center relative">
            {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
              <span className="absolute top-3 right-3 bg-orange-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                DOWNPAYMENT
              </span>
            )}
            <h1 className="text-xl font-bold mb-1">Entry Pass</h1>
            <p className="text-blue-100 text-sm">Show this QR code at the venue</p>
          </div>

          {/* QR Code */}
          <div className="p-8 flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl border-2 border-gray-100 mb-4">
              <img
                src={getQRCodeUrl(booking.bookingCode)}
                alt="Booking QR Code"
                className="w-64 h-64"
              />
            </div>

            <div className="text-center mb-6">
              <p className="text-2xl font-mono font-bold text-gray-900">
                {booking.bookingCode}
              </p>
              <p className="text-sm text-gray-500">Booking Code</p>
            </div>

            {/* Booking Details */}
            <div className="w-full border-t pt-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Court</span>
                <span className="font-medium text-gray-900">{booking.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{formatDate(booking.bookingDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-medium text-gray-900">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-green-600">
                  {booking.paymentType === 'venue' && booking.balanceAmount > 0
                    ? formatPrice(booking.downpaymentAmount)
                    : formatPrice(booking.totalAmount)
                  }
                </span>
              </div>
              {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Downpayment Paid</span>
                    <span className="font-medium text-green-600">{formatPrice(booking.downpaymentAmount)}</span>
                  </div>
                  <div className="flex justify-between bg-orange-50 -mx-2 px-2 py-1 rounded">
                    <span className="text-orange-700 font-medium">Remaining Balance</span>
                    <span className="font-bold text-orange-600">{formatPrice(booking.balanceAmount)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <div className="flex gap-1">
                  {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Downpayment
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    booking.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 text-center print:hidden">
            <p className="text-xs text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              Present this QR code to the staff upon arrival
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 print:hidden">
          <button
            onClick={handleDownload}
            className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-download"></i>
            Download
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 bg-ph-blue text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-print"></i>
            Print
          </button>
        </div>

        {/* Balance Due Notice */}
        {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-300 rounded-xl p-4 print:hidden">
            <h3 className="font-semibold text-orange-900 mb-2">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Balance Payment Due
            </h3>
            <p className="text-sm text-orange-800 mb-2">
              You still need to pay <strong>{formatPrice(booking.balanceAmount)}</strong> on-site when you arrive.
            </p>
            <p className="text-xs text-orange-700">
              Total: {formatPrice(booking.totalAmount)} | Already paid: {formatPrice(booking.downpaymentAmount)}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 print:hidden">
          <h3 className="font-medium text-blue-900 mb-2">
            <i className="fas fa-lightbulb mr-2"></i>
            Instructions
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Arrive at least 15 minutes before your scheduled time</li>
            <li>• Show this QR code to the staff for check-in</li>
            <li>• Bring a valid ID for verification</li>
            <li>• Make sure your phone has enough battery</li>
            {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
              <li>• Bring payment for the remaining balance: <strong>{formatPrice(booking.balanceAmount)}</strong></li>
            )}
          </ul>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #qr-card, #qr-card * {
            visibility: visible;
          }
          #qr-card {
            position: absolute;
            left: 50%;
            top: 0;
            transform: translateX(-50%);
            width: 400px;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}
