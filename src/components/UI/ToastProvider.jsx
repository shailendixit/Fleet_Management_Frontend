import React from 'react'
import { Toaster, toast as hotToast } from 'react-hot-toast'

const defaultOptions = {
  position: 'top-right',
  duration: 4000,
  // default visual style applied to toasts
  style: {
    borderRadius: '10px',
    background: '#111827',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  },
  iconTheme: {
    primary: '#4F46E5',
    secondary: '#fff',
  },
}

export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toaster toastOptions={defaultOptions} />
    </>
  )
}

export function useToast() {
  return {
    show: (type, message) => {
      if (type === 'error') hotToast.error(message)
      else if (type === 'success') hotToast.success(message)
      else hotToast(message)
    },
    hide: () => hotToast.dismiss(),
  }
}

export default ToastProvider
