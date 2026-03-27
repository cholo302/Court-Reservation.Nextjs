'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'

interface BouncingBallLoaderProps {
  /** Width/height of the Lottie animation in px */
  size?: number
  /** For full-screen/section overlay */
  fullPage?: boolean
  /** Text below the animation */
  text?: string
}

/**
 * Bouncing ball Lottie loading animation.
 * Usage:
 *   Full page:  <BouncingBallLoader fullPage />
 *   Section:    <BouncingBallLoader />
 *   Custom size: <BouncingBallLoader size={80} />
 */
export default function BouncingBallLoader({
  size = 100,
  fullPage = false,
  text,
}: BouncingBallLoaderProps) {
  const inner = (
    <div className="flex flex-col items-center gap-2">
      <DotLottieReact
        src="/Bouncing Ball.lottie"
        loop
        autoplay
        style={{ width: size, height: size }}
      />
      {text && <p className="text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {inner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-10">
      {inner}
    </div>
  )
}

/** Tiny inline Lottie spinner for buttons */
export function BallSpinner({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center ${className}`} style={{ verticalAlign: 'middle' }}>
      <DotLottieReact
        src="/Bouncing Ball.lottie"
        loop
        autoplay
        style={{ width: 24, height: 24 }}
      />
    </span>
  )
}
