'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import jsQR from 'jsqr'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'

type InputMode = 'camera' | 'upload' | 'manual'

interface ScanResult {
  bookingCode: string
  userName: string
  courtName: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  paymentStatus: string
  paymentType: string | null
  totalAmount: number
  downpaymentAmount: number
  balanceAmount: number
}

interface CheckIn {
  bookingCode: string
  userName: string
  courtName: string
  checkedInAt: Date
}

export default function QRScannerPage() {
  const [mode, setMode] = useState<InputMode>(() => {
    // Default to camera on mobile devices for easier scanning
    if (typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return 'camera'
    }
    return 'manual'
  })
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [uploadDecoding, setUploadDecoding] = useState(false)
  const [cameraError, setCameraError] = useState(false)
  const [cameraErrorMsg, setCameraErrorMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])

  // Stop scanning when switching modes
  useEffect(() => {
    stopScanning()
    setUploadPreview(null)
    setCameraError(false)
    // Auto-start camera only if permission was already granted
    // (Chrome Android blocks getUserMedia without a user tap gesture)
    if (mode === 'camera') {
      navigator.permissions?.query({ name: 'camera' as PermissionName }).then(result => {
        if (result.state === 'granted') {
          startScanning()
        }
      }).catch(() => {})
    }
  }, [mode])

  const startScanning = async () => {
    try {
      // Check for secure context (HTTPS or localhost)
      if (!window.isSecureContext) {
        setCameraError(true)
        setCameraErrorMsg('Camera requires HTTPS or localhost. Current URL is not secure — open via localhost:3000 instead of an IP address.')
        return
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(true)
        setCameraErrorMsg('Camera API not available in this browser. Try Chrome or Edge.')
        return
      }

      // List available video devices and try by device ID
      let videoDevices: MediaDeviceInfo[] = []
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        videoDevices = devices.filter(d => d.kind === 'videoinput')
        // On mobile, enumerateDevices often returns empty until permission is granted
        // so don't treat 0 devices as fatal — fall through to generic strategies
        if (videoDevices.length === 0 && !isMobile) {
          setCameraError(true)
          setCameraErrorMsg('No camera devices found. Please check your device camera permissions in browser settings.')
          return
        }
      } catch (enumErr) {
        console.warn('Could not enumerate devices:', enumErr)
      }

      // Build strategies: on mobile, try generic facingMode first; on desktop, try device IDs first
      let stream: MediaStream | null = null
      const errors: string[] = []

      // On mobile, skip device-specific attempts and go straight to generic strategies
      // because device IDs from enumerateDevices are often empty/invalid before permission grant
      if (!isMobile) {
        // Strategy 1: Try each specific device by ID (desktop only)
        for (const device of videoDevices) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: { exact: device.deviceId } },
            })
            break
          } catch (e: any) {
            errors.push(`Device "${device.label || device.deviceId}": ${e?.name} - ${e?.message}`)
          }
        }
      }

      // Strategy 2: Generic fallbacks (prefer back camera on mobile for QR scanning)
      if (!stream) {
        const genericStrategies = isMobile
          ? [
              { video: { facingMode: 'environment' } },
              { video: { facingMode: { exact: 'environment' } } },
              { video: true },
              { video: { facingMode: 'user' } },
            ]
          : [
              { video: true },
              { video: { width: { ideal: 640 }, height: { ideal: 480 } } },
              { video: { facingMode: 'user' } },
              { video: { facingMode: 'environment' } },
            ]
        for (const constraints of genericStrategies) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints)
            break
          } catch (e: any) {
            errors.push(`Generic ${JSON.stringify(constraints.video)}: ${e?.name} - ${e?.message}`)
          }
        }
      }

      if (!stream) {
        const errorDetail = errors.join('\n')
        console.error('All camera attempts failed:\n', errorDetail)
        setCameraError(true)
        const firstError = errors[0] || 'Unknown error'
        if (firstError.includes('NotAllowed') || firstError.includes('Permission')) {
          if (isMobile) {
            setCameraErrorMsg('Camera permission denied. Steps to fix:\n1. Tap the lock icon (or ⋮ menu) in the address bar\n2. Tap "Permissions" or "Site settings"\n3. Set Camera to "Allow"\n4. Reload the page and tap Start Camera')
          } else {
            setCameraErrorMsg('Camera permission denied. Steps to fix:\n1. Click the lock/camera icon in the address bar → Allow camera\n2. Windows Settings → Privacy & Security → Camera → Turn ON "Camera access" and "Let desktop apps access your camera"')
          }
        } else if (firstError.includes('NotReadable') || firstError.includes('TrackStart')) {
          setCameraErrorMsg('Camera is in use by another app. Close any other app using the camera, then try again.')
        } else if (firstError.includes('NotFound')) {
          if (isMobile) {
            setCameraErrorMsg('Camera not found. Check that your phone camera is working and no other app is using it.')
          } else {
            setCameraErrorMsg('Camera not found. Make sure your USB camera is plugged in properly.')
          }
        } else {
          if (isMobile) {
            setCameraErrorMsg(`Camera error: ${firstError}\n\nTap the lock icon in the address bar → Site settings → Allow Camera.`)
          } else {
            setCameraErrorMsg(`Camera error: ${firstError}\n\nCheck Windows Settings → Privacy & Security → Camera → Make sure "Let desktop apps access your camera" is ON.`)
          }
        }
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        const video = videoRef.current
        video.srcObject = stream
        video.setAttribute('autoplay', '')
        video.setAttribute('playsinline', '')
        
        // Wait for video to actually receive data before starting QR scan
        await new Promise<void>((resolve) => {
          const onPlaying = () => {
            video.removeEventListener('playing', onPlaying)
            resolve()
          }
          video.addEventListener('playing', onPlaying)
          video.play().catch(() => resolve())
          // Safety timeout — resolve after 3s even if event doesn't fire
          setTimeout(resolve, 3000)
        })
      }
      setScanning(true)
      toast.success('Camera started — point at QR code')

      // Give USB camera time to warm up before scanning frames
      setTimeout(() => {
        scanIntervalRef.current = setInterval(() => {
          scanVideoFrame()
        }, 150)
      }, 500)
    } catch (error: any) {
      console.error('Camera error:', error)
      setCameraError(true)
      const msg = error?.message || 'Unknown error'
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setCameraErrorMsg(isMobile
          ? 'Camera permission was denied. Tap the lock icon in the address bar → Site settings → Allow Camera, then reload.'
          : 'Camera permission was denied. Click the lock/camera icon in the address bar to allow access.')
      } else if (msg.includes('NotFound') || msg.includes('device')) {
        setCameraErrorMsg(isMobile
          ? 'Camera not found. Make sure no other app is using your camera.'
          : 'No camera found. Make sure your USB camera is plugged in and not being used by another application.')
      } else {
        setCameraErrorMsg(msg)
      }
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setScanning(false)
  }

  // Shared multi-pass QR decoder — tolerant of blur, green lines, poor lighting
  const decodeQR = useCallback((sourceImageData: ImageData, width: number, height: number): string | null => {
    // Pass 1: Normal scan
    let code = jsQR(sourceImageData.data, width, height, { inversionAttempts: 'attemptBoth' })
    if (code?.data) return code.data

    // Pass 2: Center crop 70%
    if (width > 100 && height > 100) {
      const cx = Math.floor(width * 0.15), cy = Math.floor(height * 0.15)
      const cw = Math.floor(width * 0.7), ch = Math.floor(height * 0.7)
      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = cw
      cropCanvas.height = ch
      const cropCtx = cropCanvas.getContext('2d')
      if (cropCtx) {
        cropCtx.putImageData(sourceImageData, -cx, -cy)
        const cropData = cropCtx.getImageData(0, 0, cw, ch)
        code = jsQR(cropData.data, cw, ch, { inversionAttempts: 'attemptBoth' })
        if (code?.data) return code.data
      }
    }

    // Pass 3: Sharpen (unsharp mask to help with blur)
    const sharpened = new ImageData(new Uint8ClampedArray(sourceImageData.data), width, height)
    if (width > 2 && height > 2) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4
          for (let c = 0; c < 3; c++) {
            const center = sourceImageData.data[idx + c]
            const neighbors = (
              sourceImageData.data[((y-1)*width+x)*4+c] +
              sourceImageData.data[((y+1)*width+x)*4+c] +
              sourceImageData.data[(y*width+x-1)*4+c] +
              sourceImageData.data[(y*width+x+1)*4+c]
            ) / 4
            // Sharpen: amplify difference from neighbors
            sharpened.data[idx + c] = Math.min(255, Math.max(0, Math.round(center + (center - neighbors) * 1.5)))
          }
        }
      }
      code = jsQR(sharpened.data, width, height, { inversionAttempts: 'attemptBoth' })
      if (code?.data) return code.data
    }

    // Pass 4: Multiple threshold levels (handles different brightness levels)
    for (const threshold of [90, 110, 127, 145, 170]) {
      const thresh = new ImageData(new Uint8ClampedArray(sourceImageData.data), width, height)
      for (let i = 0; i < thresh.data.length; i += 4) {
        const avg = (thresh.data[i] + thresh.data[i+1] + thresh.data[i+2]) / 3
        const val = avg > threshold ? 255 : 0
        thresh.data[i] = val
        thresh.data[i+1] = val
        thresh.data[i+2] = val
      }
      code = jsQR(thresh.data, width, height, { inversionAttempts: 'attemptBoth' })
      if (code?.data) return code.data
    }

    // Pass 5: Green line removal (ignore green channel)
    const degreen = new ImageData(new Uint8ClampedArray(sourceImageData.data), width, height)
    for (let i = 0; i < degreen.data.length; i += 4) {
      const rb = Math.round(degreen.data[i] * 0.5 + degreen.data[i+2] * 0.5)
      degreen.data[i] = rb
      degreen.data[i+1] = rb
      degreen.data[i+2] = rb
    }
    code = jsQR(degreen.data, width, height, { inversionAttempts: 'attemptBoth' })
    if (code?.data) return code.data

    // Pass 6: Vertical smoothing + threshold (horizontal line artifacts)
    if (height > 2) {
      const smoothed = new ImageData(new Uint8ClampedArray(sourceImageData.data), width, height)
      for (let y = 1; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const above = ((y-1)*width+x)*4
          const below = ((y+1)*width+x)*4
          for (let c = 0; c < 3; c++) {
            smoothed.data[idx+c] = Math.round(
              smoothed.data[above+c]*0.25 + smoothed.data[idx+c]*0.5 + smoothed.data[below+c]*0.25
            )
          }
        }
      }
      for (let i = 0; i < smoothed.data.length; i += 4) {
        const avg = (smoothed.data[i]+smoothed.data[i+1]+smoothed.data[i+2]) / 3
        const val = avg > 120 ? 255 : 0
        smoothed.data[i] = val; smoothed.data[i+1] = val; smoothed.data[i+2] = val
      }
      code = jsQR(smoothed.data, width, height, { inversionAttempts: 'attemptBoth' })
      if (code?.data) return code.data
    }

    // Pass 7: Sharpen + threshold combo (blurry + bad lighting)
    for (const threshold of [100, 127, 150]) {
      const combo = new ImageData(new Uint8ClampedArray(sharpened.data), width, height)
      for (let i = 0; i < combo.data.length; i += 4) {
        const avg = (combo.data[i]+combo.data[i+1]+combo.data[i+2]) / 3
        const val = avg > threshold ? 255 : 0
        combo.data[i] = val; combo.data[i+1] = val; combo.data[i+2] = val
      }
      code = jsQR(combo.data, width, height, { inversionAttempts: 'attemptBoth' })
      if (code?.data) return code.data
    }

    return null
  }, [])

  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    const canvas = canvasRef.current
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (!vw || !vh) return

    canvas.width = vw
    canvas.height = vh
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.drawImage(video, 0, 0, vw, vh)
    const imageData = ctx.getImageData(0, 0, vw, vh)

    const result = decodeQR(imageData, vw, vh)
    if (result) {
      const bookingCode = extractBookingCode(result)
      if (bookingCode) {
        stopScanning()
        toast.success(`QR detected: ${bookingCode}`)
        verifyBooking(bookingCode)
      }
    }
  }, [decodeQR])

  const extractBookingCode = (data: string): string | null => {
    // Could be just the code, a URL containing the code, or JSON
    const trimmed = data.trim()
    
    // Direct booking code (e.g. CR260304N0LY)
    if (/^CR[A-Z0-9]{8,}$/i.test(trimmed)) {
      return trimmed.toUpperCase()
    }

    // URL pattern: .../bookings/CODE/... or ...code=CODE
    const urlMatch = trimmed.match(/bookings\/([A-Z0-9]+)/i) || trimmed.match(/code=([A-Z0-9]+)/i)
    if (urlMatch) return urlMatch[1].toUpperCase()

    // JSON with bookingCode
    try {
      const json = JSON.parse(trimmed)
      if (json.bookingCode) return json.bookingCode
    } catch {}

    // Fallback: if it looks alphanumeric, try it
    if (/^[A-Z0-9]{6,20}$/i.test(trimmed)) {
      return trimmed.toUpperCase()
    }

    return trimmed.toUpperCase()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const url = URL.createObjectURL(file)
    setUploadPreview(url)
    setUploadDecoding(true)

    try {
      const img = new Image()
      img.src = url
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      // Scan at original size
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) throw new Error('Canvas not available')

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      let result = decodeQR(imageData, canvas.width, canvas.height)

      // If not found, try upscaled 2x (helps with tiny/blurry QR)
      if (!result) {
        const upCanvas = document.createElement('canvas')
        const scale = 2
        upCanvas.width = img.width * scale
        upCanvas.height = img.height * scale
        const upCtx = upCanvas.getContext('2d', { willReadFrequently: true })
        if (upCtx) {
          upCtx.imageSmoothingEnabled = true
          upCtx.imageSmoothingQuality = 'high'
          upCtx.drawImage(img, 0, 0, upCanvas.width, upCanvas.height)
          const upData = upCtx.getImageData(0, 0, upCanvas.width, upCanvas.height)
          result = decodeQR(upData, upCanvas.width, upCanvas.height)
        }
      }

      // If not found, try downscaled (helps with noisy high-res images)
      if (!result && img.width > 800) {
        const downCanvas = document.createElement('canvas')
        const scale = 640 / img.width
        downCanvas.width = 640
        downCanvas.height = Math.round(img.height * scale)
        const downCtx = downCanvas.getContext('2d', { willReadFrequently: true })
        if (downCtx) {
          downCtx.drawImage(img, 0, 0, downCanvas.width, downCanvas.height)
          const downData = downCtx.getImageData(0, 0, downCanvas.width, downCanvas.height)
          result = decodeQR(downData, downCanvas.width, downCanvas.height)
        }
      }

      if (result) {
        const bookingCode = extractBookingCode(result)
        if (bookingCode) {
          toast.success(`QR decoded: ${bookingCode}`)
          verifyBooking(bookingCode)
        } else {
          toast.error('QR found but could not extract booking code')
        }
      } else {
        toast.error('No QR code detected. Try taking a clearer, closer photo of the QR code.')
      }
    } catch (error) {
      toast.error('Failed to process image')
      console.error('Image decode error:', error)
    } finally {
      setUploadDecoding(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
        userName: booking.user?.name || booking.userName || 'N/A',
        courtName: booking.court?.name || booking.courtName || 'N/A',
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentType: booking.paymentType,
        totalAmount: Number(booking.totalAmount),
        downpaymentAmount: Number(booking.downpaymentAmount || 0),
        balanceAmount: Number(booking.balanceAmount || 0),
      })

      if (booking.status === 'paid' || booking.status === 'confirmed') {
        toast.success('Valid booking found!')
      } else if (booking.status === 'completed') {
        toast.success('Booking already checked in')
      } else {
        toast.error(`Booking status: ${booking.status}`)
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to verify booking')
    } finally {
      setLoading(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    verifyBooking(manualCode)
  }

  const confirmBalancePayment = async () => {
    if (!result) return
    if (!confirm(`Confirm that the remaining balance of ${formatPrice(result.balanceAmount)} has been collected from the customer?`)) return

    setConfirmingPayment(true)
    try {
      const response = await fetch(`/api/bookings/${result.bookingCode}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to confirm payment')
      }
      toast.success('Balance payment confirmed!')
      setResult({ ...result, paymentStatus: 'paid' })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to confirm payment')
    } finally {
      setConfirmingPayment(false)
    }
  }

  const markAsCheckedIn = async () => {
    if (!result) return

    setCheckingIn(true)
    try {
      const response = await fetch(`/api/bookings/${result.bookingCode}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to check in')
      }

      setCheckIns([
        {
          bookingCode: result.bookingCode,
          userName: result.userName,
          courtName: result.courtName,
          checkedInAt: new Date(),
        },
        ...checkIns,
      ])

      toast.success('Customer checked in successfully!')
      setResult({ ...result, status: 'completed' })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to check in')
    } finally {
      setCheckingIn(false)
    }
  }

  const resetScan = () => {
    setResult(null)
    setManualCode('')
    setUploadPreview(null)
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const formatTime = (time: string) =>
    new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'downpayment':
      case 'partial':
        return 'bg-orange-100 text-orange-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isDownpaymentBooking = result?.paymentType === 'venue'
  const isUnpaid = result?.paymentStatus === 'unpaid'
  const isProcessing = result?.paymentStatus === 'processing'
  const isBalancePending = isDownpaymentBooking && result?.paymentStatus === 'downpayment'
  const isFullyPaid = result?.paymentStatus === 'paid'
  const canCheckIn = result && (result.status === 'paid' || result.status === 'confirmed') && isFullyPaid

  return (
    <div>
      {/* Hidden canvas for camera frame decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">QR Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">Verify bookings via camera, QR image, or booking code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Mode Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { key: 'camera' as InputMode, icon: 'fa-camera', label: 'Camera' },
              { key: 'upload' as InputMode, icon: 'fa-image', label: 'Upload QR' },
              { key: 'manual' as InputMode, icon: 'fa-keyboard', label: 'Manual' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-semibold transition-all border-b-2 ${
                  mode === tab.key
                    ? 'border-ph-blue text-ph-blue bg-blue-50/40'
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
                }`}
              >
                <i className={`fas ${tab.icon} text-[11px]`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* CAMERA MODE */}
            {mode === 'camera' && (
              <div>
                {cameraError ? (
                  /* Camera not available — show fallback */
                  <div>
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-4 p-6">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                        <i className="fas fa-video-slash text-red-400 text-xl"></i>
                      </div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Camera Not Available</p>
                      <div className="text-xs text-gray-500 text-center max-w-[300px] mb-2 whitespace-pre-line leading-relaxed">
                        {cameraErrorMsg || 'No camera detected on this device, or browser permission was denied.'}
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 max-w-[300px]">
                        <p className="text-[11px] text-blue-700 font-semibold mb-1">
                          <i className="fas fa-wrench mr-1"></i>Quick Fix Steps:
                        </p>
                        <ol className="text-[10px] text-blue-600 space-y-0.5 list-decimal list-inside">
                          <li>Tap the <strong>lock icon</strong> in the address bar</li>
                          <li>Allow <strong>Camera</strong> permission</li>
                          <li>Ensure the site uses <strong>HTTPS</strong></li>
                          <li>Close any other app using the camera</li>
                          <li>Refresh the page and try again</li>
                        </ol>
                      </div>
                      <div className="flex flex-col gap-2 w-full max-w-[240px]">
                        <button
                          onClick={() => setMode('upload')}
                          className="w-full bg-ph-blue text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-image text-xs"></i>
                          Upload QR Image
                        </button>
                        <button
                          onClick={() => setMode('manual')}
                          className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2"
                        >
                          <i className="fas fa-keyboard text-xs"></i>
                          Enter Code Manually
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => { setCameraError(false); setCameraErrorMsg(''); startScanning(); }}
                      className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs font-medium hover:bg-gray-50 transition"
                    >
                      <i className="fas fa-rotate-right mr-1.5"></i>
                      Try Camera Again
                    </button>
                  </div>
                ) : (
                  /* Normal camera UI */
                  <div>
                    <div className="aspect-[4/3] bg-gray-900 rounded-xl overflow-hidden mb-4 relative">
                      {/* Video always in DOM so ref is available when stream is assigned */}
                      <video
                        ref={videoRef}
                        className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
                        playsInline
                        autoPlay
                        muted
                      />
                      {scanning ? (
                        <>
                          {/* Scan overlay */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-52 h-52 relative">
                              <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-white rounded-tl-lg"></div>
                              <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-white rounded-tr-lg"></div>
                              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-white rounded-bl-lg"></div>
                              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-white rounded-br-lg"></div>
                              <div className="absolute left-2 right-2 h-0.5 bg-ph-blue/80 animate-bounce shadow-[0_0_8px_rgba(0,56,168,0.5)]" style={{ top: '50%' }}></div>
                            </div>
                          </div>
                          <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                            <span className="bg-black/50 backdrop-blur text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                              Scanning...
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
                            <i className="fas fa-camera text-gray-500 text-2xl"></i>
                          </div>
                          <p className="text-sm text-gray-500 font-medium">Camera Preview</p>
                          <p className="text-xs text-gray-600 mt-1">Start scanning to activate camera</p>
                        </div>
                      )}
                    </div>

                    {!scanning ? (
                      <button
                        onClick={startScanning}
                        className="w-full bg-ph-blue text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-camera text-xs"></i>
                        Start Camera
                      </button>
                    ) : (
                      <button
                        onClick={stopScanning}
                        className="w-full bg-red-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
                      >
                        <i className="fas fa-stop text-xs"></i>
                        Stop Camera
                      </button>
                    )}

                    <p className="text-[11px] text-gray-400 text-center mt-3">
                      <i className="fas fa-info-circle mr-1"></i>
                      Point your camera at the booking QR code. It will auto-detect.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* UPLOAD MODE */}
            {mode === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="relative mb-4">
                    <div className="aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <img
                        src={uploadPreview}
                        alt="QR Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    {uploadDecoding && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                        <BouncingBallLoader size={60} text="Decoding QR code..." />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 hover:border-ph-blue/40 hover:bg-blue-50/30 transition flex flex-col items-center justify-center cursor-pointer group mb-4"
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mb-3 group-hover:border-ph-blue/30 group-hover:bg-blue-50 transition shadow-sm">
                      <i className="fas fa-cloud-arrow-up text-gray-400 text-xl group-hover:text-ph-blue transition"></i>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 group-hover:text-ph-blue transition">
                      Upload QR Image
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Click to select or drag & drop
                    </p>
                    <p className="text-[10px] text-gray-300 mt-2">
                      JPG, PNG, WEBP supported
                    </p>
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-ph-blue text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-image text-xs"></i>
                    {uploadPreview ? 'Upload Another' : 'Choose Image'}
                  </button>
                  {uploadPreview && (
                    <button
                      onClick={() => setUploadPreview(null)}
                      className="px-4 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-3">
                  <i className="fas fa-info-circle mr-1"></i>
                  Upload a screenshot or photo of the booking QR code
                </p>
              </div>
            )}

            {/* MANUAL MODE */}
            {mode === 'manual' && (
              <div>
                <div className="aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mb-4 p-6">
                  <div className="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                    <i className="fas fa-hashtag text-gray-400 text-xl"></i>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Enter Booking Code</p>
                  <p className="text-xs text-gray-400 text-center mb-5">
                    Type the booking reference code (e.g. CR260304N0LY)
                  </p>
                  
                  <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-3">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                      placeholder="CR260304N0LY"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-center font-mono font-semibold tracking-widest focus:ring-2 focus:ring-ph-blue/20 focus:border-ph-blue transition placeholder:font-normal placeholder:tracking-normal"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={loading || !manualCode.trim()}
                      className="w-full bg-ph-blue text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <BallSpinner />
                      ) : (
                        <i className="fas fa-search text-xs"></i>
                      )}
                      Look Up Booking
                    </button>
                  </form>
                </div>

                <p className="text-[11px] text-gray-400 text-center mt-1">
                  <i className="fas fa-info-circle mr-1"></i>
                  Find the code on the customer&apos;s booking confirmation
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <i className="fas fa-ticket text-purple-600 text-sm"></i>
            </div>
            Booking Details
          </h2>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <BouncingBallLoader size={60} text="Looking up booking..." />
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xl font-extrabold text-gray-900">{result.bookingCode}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                  {result.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Customer</p>
                  <p className="text-sm font-semibold text-gray-900">{result.userName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Court</p>
                  <p className="text-sm font-semibold text-gray-900">{result.courtName}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(result.bookingDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Time</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatTime(result.startTime)} - {formatTime(result.endTime)}
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                  <i className="fas fa-peso-sign text-ph-blue text-xs"></i>
                  Payment Details
                </h3>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total Amount</span>
                  <span className="font-bold text-base text-gray-900">{formatPrice(result.totalAmount)}</span>
                </div>

                {isDownpaymentBooking && !isUnpaid && !isProcessing ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Downpayment (50%)</span>
                      <span className="text-sm font-semibold text-green-600">{formatPrice(result.downpaymentAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">Balance (50%)</span>
                      {isBalancePending ? (
                        <span className="text-sm font-semibold text-orange-600">{formatPrice(result.balanceAmount)}</span>
                      ) : (
                        <span className="text-sm font-semibold text-green-600"><s>{formatPrice(result.balanceAmount)}</s> <span className="ml-1">Collected</span></span>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs font-medium text-gray-600">Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isBalancePending ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
                      }`}>
                        {isBalancePending ? 'Downpayment Only' : 'Fully Paid'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <span className="text-xs font-medium text-gray-600">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isUnpaid ? 'bg-red-50 text-red-700' : isProcessing ? 'bg-yellow-50 text-yellow-700' : getStatusColor(result.paymentStatus)
                    }`}>
                      {isUnpaid ? 'Unpaid' : isProcessing ? 'Processing' : result.paymentStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* Validation Status */}
              <div className={`p-4 rounded-xl ${
                result.status === 'completed'
                  ? 'bg-blue-50 border border-blue-100'
                  : (result.status === 'paid' || result.status === 'confirmed')
                  ? isUnpaid
                    ? 'bg-red-50 border border-red-100'
                    : isProcessing
                    ? 'bg-yellow-50 border border-yellow-200'
                    : isBalancePending
                    ? 'bg-orange-50 border border-orange-100'
                    : 'bg-green-50 border border-green-100'
                  : 'bg-red-50 border border-red-100'
              }`}>
                <div className="flex items-center gap-3">
                  <i className={`fas text-xl ${
                    result.status === 'completed'
                      ? 'fa-check-double text-blue-600'
                      : (result.status === 'paid' || result.status === 'confirmed')
                      ? isUnpaid
                        ? 'fa-times-circle text-red-600'
                        : isProcessing
                        ? 'fa-clock text-yellow-600'
                        : isBalancePending
                        ? 'fa-exclamation-triangle text-orange-600'
                        : 'fa-check-circle text-green-600'
                      : 'fa-times-circle text-red-600'
                  }`}></i>
                  <div>
                    <p className="font-bold text-sm">
                      {result.status === 'completed'
                        ? 'Already Checked In'
                        : (result.status === 'paid' || result.status === 'confirmed')
                        ? isUnpaid
                          ? 'Payment Not Made'
                          : isProcessing
                          ? 'Payment Under Review'
                          : isBalancePending
                          ? 'Balance Payment Required'
                          : 'Ready for Check-in'
                        : 'Invalid - Do Not Allow Entry'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {result.status === 'completed'
                        ? 'This booking has already been used'
                        : (result.status === 'paid' || result.status === 'confirmed')
                        ? isUnpaid
                          ? 'Customer has not paid yet. Do not allow entry.'
                          : isProcessing
                          ? 'Payment proof submitted but not yet verified by admin.'
                          : isBalancePending
                          ? `Collect ${formatPrice(result.balanceAmount)} balance first`
                          : 'Customer may enter the facility'
                        : `Booking status: ${result.status}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(result.status === 'paid' || result.status === 'confirmed') && !isUnpaid && !isProcessing && (
                <div className="space-y-2">
                  {isDownpaymentBooking && isBalancePending && (
                    <button
                      onClick={confirmBalancePayment}
                      disabled={confirmingPayment}
                      className="w-full bg-orange-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {confirmingPayment ? (
                        <BallSpinner />
                      ) : (
                        <i className="fas fa-hand-holding-usd"></i>
                      )}
                      Confirm Balance Paid ({formatPrice(result.balanceAmount)})
                    </button>
                  )}

                  <button
                    onClick={markAsCheckedIn}
                    disabled={!canCheckIn || checkingIn}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                      canCheckIn
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {checkingIn ? (
                      <BallSpinner />
                    ) : (
                      <i className="fas fa-check-double"></i>
                    )}
                    Mark as Checked In
                    {!canCheckIn && isBalancePending && (
                      <span className="text-[10px] ml-1">(confirm payment first)</span>
                    )}
                  </button>
                </div>
              )}

              <button
                onClick={resetScan}
                className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                <i className="fas fa-rotate-right mr-2 text-xs"></i>
                Scan Another
              </button>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                <i className="fas fa-qrcode text-gray-300 text-3xl"></i>
              </div>
              <p className="text-sm font-medium text-gray-400">No booking scanned yet</p>
              <p className="text-xs text-gray-300 mt-1.5 text-center max-w-[200px]">
                Use the camera, upload a QR image, or enter a booking code
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Check-ins */}
      {checkIns.length > 0 && (
        <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <i className="fas fa-history text-green-600 text-sm"></i>
            </div>
            Recent Check-ins
            <span className="text-[10px] font-bold text-white bg-green-500 rounded-full w-5 h-5 flex items-center justify-center">
              {checkIns.length}
            </span>
          </h2>
          <div className="divide-y divide-gray-50">
            {checkIns.map((checkIn, index) => (
              <div key={index} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <i className="fas fa-check text-green-600 text-xs"></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{checkIn.bookingCode}</p>
                    <p className="text-xs text-gray-400">{checkIn.userName} &middot; {checkIn.courtName}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {checkIn.checkedInAt.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
