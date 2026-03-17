'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void
  onFileSelect: (file: File, previewUrl: string) => void
  onRemove: () => void
  preview: string | null
  label: string
  required?: boolean
  accept?: string
  helpText?: string
  facingMode?: 'user' | 'environment'
  id: string
}

export default function CameraCapture({
  onCapture,
  onFileSelect,
  onRemove,
  preview,
  label,
  required = false,
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  helpText = 'JPG, PNG, GIF or WebP - Max 5MB',
  facingMode = 'environment',
  id,
}: CameraCaptureProps) {
  const [showCamera, setShowCamera] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [flashEffect, setFlashEffect] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setCameraReady(false)
    setShowCamera(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setCameraReady(true)
        }
      }
    } catch (err: any) {
      console.error('Camera error:', err)
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not access camera. Try uploading a file instead.'
      )
    }
  }, [facingMode])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraReady(false)
    setShowCamera(false)
    setCameraError(null)
  }, [])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    setFlashEffect(true)
    setTimeout(() => setFlashEffect(false), 200)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' })
        const previewUrl = URL.createObjectURL(blob)
        onCapture(file, previewUrl)
        stopCamera()
      },
      'image/jpeg',
      0.92
    )
  }, [onCapture, stopCamera])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so the same file can be re-selected
    if (e.target) e.target.value = ''
  }

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    onFileSelect(file, previewUrl)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Upload area */}
      {!preview && !showCamera && (
        <div
          ref={dropRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
            isDragging
              ? 'border-ph-blue bg-blue-50 scale-[1.01]'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
          }`}
        >
          <div className="px-4 py-5">
            <div className="flex justify-center mb-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                isDragging ? 'bg-ph-blue/10 text-ph-blue' : 'bg-gray-100 text-gray-400'
              }`}>
                <i className={`fas ${isDragging ? 'fa-cloud-arrow-down' : 'fa-cloud-arrow-up'} text-lg`}></i>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mb-0.5">
              {isDragging ? (
                <span className="text-ph-blue font-medium">Drop your image here</span>
              ) : (
                <>Drag & drop an image here</>
              )}
            </p>
            <p className="text-center text-xs text-gray-400 mb-3">or choose an option below</p>

            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                <i className="fas fa-folder-open text-gray-400 text-xs"></i>
                Browse
              </button>
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-ph-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm"
              >
                <i className="fas fa-camera text-xs"></i>
                Camera
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            id={id}
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Camera view */}
      {showCamera && (
        <div className="relative rounded-xl overflow-hidden bg-black shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto min-h-[200px] max-h-[280px] object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {flashEffect && (
            <div className="absolute inset-0 bg-white z-10" style={{ animation: 'fadeOut 0.2s forwards' }}></div>
          )}

          {/* Viewfinder corners */}
          {cameraReady && !cameraError && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-white/50 rounded-tl"></div>
              <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-white/50 rounded-tr"></div>
              <div className="absolute bottom-14 left-3 w-5 h-5 border-b-2 border-l-2 border-white/50 rounded-bl"></div>
              <div className="absolute bottom-14 right-3 w-5 h-5 border-b-2 border-r-2 border-white/50 rounded-br"></div>
            </div>
          )}

          {/* Camera error */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 p-5">
              <div className="text-center max-w-xs">
                <div className="w-11 h-11 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-video-slash text-yellow-400"></i>
                </div>
                <p className="text-white text-sm mb-4">{cameraError}</p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera()
                      setTimeout(() => fileInputRef.current?.click(), 50)
                    }}
                    className="px-3.5 py-2 bg-white text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
                  >
                    <i className="fas fa-upload mr-1.5"></i> Upload Instead
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3.5 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Camera controls bar */}
          {!cameraError && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-3 px-4">
              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
                  title="Cancel"
                >
                  <i className="fas fa-times text-sm"></i>
                </button>

                {cameraReady && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-14 h-14 bg-white rounded-full border-[3px] border-white/30 hover:scale-105 transition-transform flex items-center justify-center shadow-lg group"
                    title="Take Photo"
                  >
                    <div className="w-11 h-11 bg-white rounded-full border-2 border-gray-200 group-hover:border-ph-blue transition-colors"></div>
                  </button>
                )}

                <div className="w-9 h-9"></div>
              </div>
            </div>
          )}

          {/* Camera loading spinner */}
          {!cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-white/70 text-sm">Accessing camera...</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-44 object-cover"
          />

          {/* Ready badge */}
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500 text-white text-[10px] font-semibold rounded-full shadow">
              <i className="fas fa-check text-[8px]"></i> Ready
            </span>
          </div>

          {/* Hover actions (desktop) */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  startCamera()
                }}
                className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition shadow"
              >
                <i className="fas fa-camera mr-1"></i> Retake
              </button>
              <button
                type="button"
                onClick={() => {
                  onRemove()
                  setTimeout(() => fileInputRef.current?.click(), 50)
                }}
                className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition shadow"
              >
                <i className="fas fa-arrows-rotate mr-1"></i> Replace
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition shadow"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          {/* Mobile action bar (always visible) */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex justify-end gap-1.5 sm:hidden">
            <button
              type="button"
              onClick={() => {
                onRemove()
                startCamera()
              }}
              className="px-2 py-1.5 bg-white/90 rounded text-[11px] font-medium text-gray-700"
            >
              <i className="fas fa-camera mr-1"></i> Retake
            </button>
            <button
              type="button"
              onClick={() => {
                onRemove()
                setTimeout(() => fileInputRef.current?.click(), 50)
              }}
              className="px-2 py-1.5 bg-white/90 rounded text-[11px] font-medium text-gray-700"
            >
              <i className="fas fa-arrows-rotate mr-1"></i> Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="px-2 py-1.5 bg-red-500/90 text-white rounded text-[11px] font-medium"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      )}

      <p className="mt-1.5 text-xs text-gray-400">{helpText}</p>
    </div>
  )
}
