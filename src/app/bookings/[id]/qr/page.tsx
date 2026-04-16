'use client'

import Link from 'next/link'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'
import QRCode from 'qrcode'

interface BookingDetails {
  id: number
  bookingCode: string
  status: string
  paymentStatus: string | null
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
          paymentStatus: b.payment?.status || null,
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

  // Generate QR code locally on canvas — works offline on all devices
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')

  const generateQR = useCallback(async (code: string) => {
    try {
      // Generate as data URL for download/fallback
      const dataUrl = await (QRCode as any).toDataURL(code, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        margin: 2,
        width: 300,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      setQrDataUrl(dataUrl)

      // Also render directly to canvas
      if (qrCanvasRef.current) {
        await (QRCode as any).toCanvas(qrCanvasRef.current, code, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 256,
          color: { dark: '#000000', light: '#FFFFFF' },
        })
      }
    } catch (err) {
      console.error('QR generation error:', err)
    }
  }, [])

  useEffect(() => {
    if (booking?.bookingCode) {
      generateQR(booking.bookingCode)
    }
  }, [booking?.bookingCode, generateQR])

  const handleDownload = async () => {
    if (!booking || !qrDataUrl) return

    try {
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `booking-${booking.bookingCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
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
        <BouncingBallLoader />
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
  const isPaymentApproved = booking.paymentStatus === 'downpayment' || booking.paymentStatus === 'paid'
  const isValidForEntry = ['paid', 'confirmed'].includes(booking.status) && isPaymentApproved

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
              {booking.status === 'cancelled'
                ? 'This booking has been cancelled.'
                : booking.status === 'completed'
                ? 'This booking has already been completed.'
                : !isPaymentApproved && booking.paymentStatus === 'pending'
                ? 'Your payment proof is being reviewed by the admin. QR code will be available once payment is approved.'
                : booking.status === 'pending'
                ? 'Please complete payment to get your entry QR code.'
                : 'QR code is not available for this booking.'}
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100" id="qr-card">
          {/* Header */}
          <div className="bg-gradient-to-br from-ph-blue via-blue-600 to-blue-800 text-white px-6 py-8 text-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border-[20px] border-white"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full border-[16px] border-white"></div>
            </div>
            <div className="relative">
              {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
                <span className="inline-block bg-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 tracking-wider uppercase">
                  Downpayment Only
                </span>
              )}
              <div className="flex items-center justify-center gap-2 mb-1">
                <i className="fas fa-ticket-alt text-blue-200"></i>
                <h1 className="text-2xl font-extrabold tracking-tight">Entry Pass</h1>
              </div>
              <p className="text-blue-200 text-sm">Show this QR code at the venue</p>
            </div>
          </div>

          {/* Ticket tear line */}
          <div className="relative">
            <div className="absolute -top-3 left-0 right-0 flex justify-between px-0">
              <div className="w-6 h-6 bg-gray-50 rounded-full -ml-3"></div>
              <div className="w-6 h-6 bg-gray-50 rounded-full -mr-3"></div>
            </div>
            <div className="border-t-2 border-dashed border-gray-200 mx-6"></div>
          </div>

          {/* QR Code Section */}
          <div className="px-6 pt-8 pb-6 flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
              <canvas
                ref={qrCanvasRef}
                className="w-56 h-56 print:hidden"
                style={{ imageRendering: 'pixelated' }}
              />
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Booking QR Code"
                  className="w-56 h-56 hidden print:block"
                />
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-xl font-mono font-bold text-gray-900 tracking-widest bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                {booking.bookingCode}
              </p>
              <p className="text-xs text-gray-400 mt-1.5 uppercase tracking-widest">Booking Code</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="mx-6 mb-6 bg-gray-50 rounded-xl p-5">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <i className="fas fa-basketball-ball text-xs"></i> Court
                </span>
                <span className="font-semibold text-gray-900 text-sm">{booking.courtName}</span>
              </div>
              <div className="border-t border-gray-200/60"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <i className="fas fa-calendar text-xs"></i> Date
                </span>
                <span className="font-semibold text-gray-900 text-sm">{formatDate(booking.bookingDate)}</span>
              </div>
              <div className="border-t border-gray-200/60"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <i className="fas fa-clock text-xs"></i> Time
                </span>
                <span className="font-semibold text-gray-900 text-sm">
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </span>
              </div>
              <div className="border-t border-gray-200/60"></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm flex items-center gap-2">
                  <i className="fas fa-peso-sign text-xs"></i> Total Amount
                </span>
                <span className="font-bold text-gray-900">{formatPrice(booking.totalAmount)}</span>
              </div>
              {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
                <>
                  <div className="border-t border-gray-200/60"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <i className="fas fa-check-circle text-xs text-green-400"></i> Paid
                    </span>
                    <span className="font-semibold text-green-600 text-sm">{formatPrice(booking.downpaymentAmount)}</span>
                  </div>
                  <div className="border-t border-orange-200"></div>
                  <div className="flex justify-between items-center bg-orange-50 -mx-2 px-3 py-2 rounded-lg">
                    <span className="text-orange-600 text-sm font-medium flex items-center gap-2">
                      <i className="fas fa-exclamation-circle text-xs"></i> Balance Due
                    </span>
                    <span className="font-bold text-orange-600">{formatPrice(booking.balanceAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="mx-6 mb-6 flex justify-center gap-2">
            {booking.paymentType === 'venue' && booking.balanceAmount > 0 && (
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                <i className="fas fa-coins mr-1"></i> Downpayment
              </span>
            )}
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
              booking.status === 'paid'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <i className={`fas ${booking.status === 'paid' ? 'fa-check-circle' : 'fa-shield-check'} mr-1`}></i>
              {booking.status.toUpperCase()}
            </span>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 text-center border-t border-gray-100">
            <p className="text-[11px] text-gray-400 print:text-gray-500">
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
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide everything except the card */
          nav, header, footer,
          .print\:hidden,
          [class*="print:hidden"] {
            display: none !important;
          }
          /* Reset the page container */
          #qr-card {
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 400px !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Ensure single page */
          @page {
            margin: 10mm;
            size: auto;
          }
        }
      `}</style>
    </div>
  )
}
