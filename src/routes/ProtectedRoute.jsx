/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\routes\\ProtectedRoute.jsx
 * @version 2.1.0
 * @description Wrapper de rutas que protege acceso según autenticación, roles y/o permisos.
 * Soporta dos modos:
 *  - `allowedRoles`: verifica que el usuario tenga alguno de los roles indicados.
 *  - `routeKey`: usa `canAccessRoute` que combina roles + permisos del backend (preferido).
 *
 * @module src/routes/ProtectedRoute.jsx
 */

import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";
import { canAccessRoute } from "../rbac/rbac.js";

/**
 * ProtectedRoute - Protege rutas según autenticación, roles y/o permisos
 *
 * @component
 * @category Components | Routing
 * @param {Object} props
 * @param {Array<string>} [props.allowedRoles] - Roles permitidos (slugs). Fallback cuando no se usa routeKey.
 * @param {string} [props.routeKey] - Clave de ruta en ROUTE_ACCESS/ROUTE_PERMISSIONS. Usa canAccessRoute (roles+permisos).
 * @returns {JSX.Element}
 */

export default function ProtectedRoute({ children, allowedRoles = [], routeKey }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole);
  const user = useAuthStore((s) => s.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Verificación combinada de roles + permisos cuando se provee routeKey
  if (routeKey) {
    if (!canAccessRoute(user, routeKey)) {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Verificación solo por roles (compatibilidad con rutas que pasan allowedRoles)
  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
