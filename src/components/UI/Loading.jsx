import React from 'react'

export default function Loading({ size = 20, className = '', color = '#fff', overlay = false }) {
  const s = typeof size === 'number' ? `${size}px` : size

  const spinner = (
    <svg className={className} width={s} height={s} viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="25" cy="25" r="20" strokeWidth="5" stroke={color} strokeOpacity="0.18" fill="none" />
      <path d="M45 25a20 20 0 0 0-20-20" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
      </path>
    </svg>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        {spinner}
      </div>
    )
  }

  return spinner
}
