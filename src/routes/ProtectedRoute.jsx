/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\routes\\ProtectedRoute.jsx
 * @version 2.0.0
 * @description Wrapper de rutas que protege acceso según autenticación y roles/permissions.
 * Añadida documentación y consolidación de JSDoc.
 *
 * @module src/routes/ProtectedRoute.jsx
 */

import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";

/**
 * ProtectedRoute - Protege rutas según autenticación y roles
 *
 * @component
 * @category Components | Routing
 * @param {Object} props
 * @param {Array<string>} [props.allowedRoles] - Roles permitidos (slugs)
 * @returns {JSX.Element}
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
