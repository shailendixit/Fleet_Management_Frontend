import React, { useEffect } from 'react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null

  useEffect(() => {
    const id = setTimeout(() => onClose && onClose(), 4000)
    return () => clearTimeout(id)
  }, [toast, onClose])

  const bg = toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm">
      <div className={`${bg} text-white px-4 py-3 rounded shadow-lg`} role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-sm">{toast.message}</div>
          <button onClick={onClose} className="text-white opacity-90 font-bold">×</button>
        </div>
      </div>
    </div>
  )
}
