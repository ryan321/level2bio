import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import { ROUTES } from '@/lib/constants'
import type { ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authUser, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  // Redirect to home if not authenticated
  if (!authUser) {
    // Save the attempted URL for redirecting after login
    return <Navigate to={ROUTES.HOME} state={{ from: location }} replace />
  }

  return <>{children}</>
}
