import { Navigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '../store/useAuthStore'

/**
 * * COMPONENTE: ProtectedRoute
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para protección de rutas según permisos
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <ProtectedRoute />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

/**
 * * COMPONENTE: ProtectedRoute
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para protección de rutas según permisos
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <ProtectedRoute />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

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
