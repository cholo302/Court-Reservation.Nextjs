'use client'

import { useEffect, useState } from 'react'

interface FlashMessageProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

export default function FlashMessage({ type, message, onClose }: FlashMessageProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const styles = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700',
  }

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle',
  }

  return (
    <div className={`border-l-4 p-4 ${styles[type]}`} role="alert">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <p>
          <i className={`fas ${icons[type]} mr-2`}></i>
          {message}
        </p>
        <button
          onClick={() => {
            setIsVisible(false)
            onClose?.()
          }}
          className="hover:opacity-75"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  )
}
