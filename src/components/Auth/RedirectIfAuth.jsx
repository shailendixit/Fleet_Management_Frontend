import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

// If user is already authenticated, redirect to home; otherwise render children (login/signup)
export default function RedirectIfAuth({ redirectTo = '/' }) {
  const auth = useSelector((s) => s.auth)
  if (auth.loading) return null
  return auth.isAuthenticated ? <Navigate to={redirectTo} replace /> : <Outlet />
}
