import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

// Protects routes — waits while auth.loading then redirects to /login if not authenticated
export default function RequireAuth({ redirectTo = '/login' }) {
  const auth = useSelector((s) => s.auth)
  if (auth.loading) return null // caller shows a loading UI
  return auth.isAuthenticated ? <Outlet /> : <Navigate to={redirectTo} replace />
}
