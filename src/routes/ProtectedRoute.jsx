import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '../store/useAuthStore'

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
