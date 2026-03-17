'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

const IDLE_TIMEOUT = 20 * 60 * 1000      // 20 minutes
const WARNING_BEFORE = 60 * 1000          // warn 1 minute before logout

const ACTIVITY_EVENTS = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click',
]

export function IdleLogout() {
  const { data: session } = useSession()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warnTimerRef.current) clearTimeout(warnTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
  }

  const startCountdown = () => {
    setCountdown(60)
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const resetTimer = () => {
    clearAll()
    setShowWarning(false)

    warnTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      startCountdown()
    }, IDLE_TIMEOUT - WARNING_BEFORE)

    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: '/login' })
    }, IDLE_TIMEOUT)
  }

  const handleStayLoggedIn = () => {
    setShowWarning(false)
    resetTimer()
  }

  useEffect(() => {
    if (!session) return

    resetTimer()

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetTimer, { passive: true })
    )

    return () => {
      clearAll()
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  if (!session || !showWarning) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-clock text-amber-500 text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Still there?</h2>
        <p className="text-gray-500 text-sm mb-1">
          You've been idle for a while.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          You'll be logged out in{' '}
          <span className="font-bold text-red-500">{countdown}s</span>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
          <button
            onClick={handleStayLoggedIn}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Stay logged in
          </button>
        </div>
      </div>
    </div>
  )
}
