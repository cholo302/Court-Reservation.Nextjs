'use client'

import { useState, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

interface ScanResult {
  bookingCode: string
  userName: string
  courtName: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  paymentStatus: string
  totalAmount: number
}

export default function QRScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
      toast.success('Camera started. Point at QR code.')
    } catch (error) {
      toast.error('Failed to access camera. Please use manual entry.')
      console.error('Camera error:', error)
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  const verifyBooking = async (code: string) => {
    if (!code.trim()) {
      toast.error('Please enter a booking code')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/bookings/${code}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Booking not found')
      }

      const booking = data.booking
      setResult({
        bookingCode: booking.bookingCode,
        userName: booking.user?.name || 'N/A',
        courtName: booking.court?.name || 'N/A',
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmount: Number(booking.totalAmount),
      })

      if (booking.status === 'paid' || booking.status === 'confirmed') {
        toast.success('Valid booking found!')
      } else if (booking.status === 'completed') {
        toast.success('Booking already checked in')
      } else {
        toast.error(`Booking status: ${booking.status}`)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify booking')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyBooking(manualCode)
  }

  const markAsCompleted = async () => {
    if (!result) return

    try {
      const response = await fetch(`/api/admin/bookings/${result.bookingCode}?action=complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Failed to update')

      toast.success('Booking marked as completed!')
      setResult({ ...result, status: 'completed' })
    } catch (error) {
      toast.error('Failed to update booking')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">QR Scanner</h1>
        <p className="text-gray-600">Scan booking QR codes or enter codes manually</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            <i className="fas fa-qrcode mr-2"></i>
            Scan QR Code
          </h2>

          <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden mb-4 relative">
            {scanning ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-white rounded-lg opacity-75"></div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <i className="fas fa-camera text-6xl mb-4"></i>
                <p>Camera preview will appear here</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!scanning ? (
              <button
                onClick={startScanning}
                className="flex-1 bg-ph-blue text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-play"></i>
                Start Scanning
              </button>
            ) : (
              <button
                onClick={stopScanning}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <i className="fas fa-stop"></i>
                Stop Scanning
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Manual Entry</h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Enter booking code (e.g., BK-ABC123)"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-ph-blue text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
              </button>
            </form>
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            <i className="fas fa-ticket mr-2"></i>
            Booking Details
          </h2>

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{result.bookingCode}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{result.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Court</p>
                  <p className="font-medium">{result.courtName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{formatDate(result.bookingDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-medium">
                    {formatTime(result.startTime)} - {formatTime(result.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(result.paymentStatus)}`}>
                    {result.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-semibold text-ph-blue">{formatPrice(result.totalAmount)}</p>
                </div>
              </div>

              {/* Validation Status */}
              <div className={`p-4 rounded-lg ${
                result.status === 'paid' || result.status === 'confirmed'
                  ? 'bg-green-50 border border-green-200'
                  : result.status === 'completed'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <i className={`fas text-2xl ${
                    result.status === 'paid' || result.status === 'confirmed'
                      ? 'fa-check-circle text-green-600'
                      : result.status === 'completed'
                      ? 'fa-check-double text-blue-600'
                      : 'fa-times-circle text-red-600'
                  }`}></i>
                  <div>
                    <p className="font-semibold">
                      {result.status === 'paid' || result.status === 'confirmed'
                        ? 'Valid Booking - Allow Entry'
                        : result.status === 'completed'
                        ? 'Already Checked In'
                        : 'Invalid - Do Not Allow Entry'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {result.status === 'paid' || result.status === 'confirmed'
                        ? 'Customer may enter the facility'
                        : result.status === 'completed'
                        ? 'This booking has already been used'
                        : `Booking status is ${result.status}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(result.status === 'paid' || result.status === 'confirmed') && (
                <button
                  onClick={markAsCompleted}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                >
                  <i className="fas fa-check-double"></i>
                  Mark as Checked In
                </button>
              )}

              <button
                onClick={() => {
                  setResult(null)
                  setManualCode('')
                }}
                className="w-full border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition"
              >
                Scan Another
              </button>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <i className="fas fa-qrcode text-6xl mb-4"></i>
              <p>Scan a QR code or enter a booking code</p>
              <p className="text-sm">to view booking details</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">
          <i className="fas fa-history mr-2"></i>
          Recent Check-ins
        </h2>
        <p className="text-gray-500 text-center py-8">
          Recent check-ins will appear here during this session
        </p>
      </div>
    </div>
  )
}
