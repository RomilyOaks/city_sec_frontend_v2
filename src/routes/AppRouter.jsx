/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\routes\\AppRouter.jsx
 * @version 2.0.0
 * @description Router principal de la aplicación con rutas públicas y protegidas.
 * Se consolidaron JSDoc blocks y se añadió cabecera de archivo.
 *
 * @module src/routes/AppRouter.jsx
 */

import { Navigate, Route, Routes } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage.jsx";
import SignupPage from "../pages/auth/SignupPage.jsx";
import DashboardPage from "../pages/dashboard/DashboardPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import AppShell from "../layouts/AppShell.jsx";
import PersonalPage from "../pages/personal/PersonalPage.jsx";
import VehiculosPage from "../pages/vehiculos/VehiculosPage.jsx";
import NovedadesPage from "../pages/novedades/NovedadesPage.jsx";
import { ROUTE_ACCESS } from "../rbac/rbac.js";
import AdminUsuariosPage from "../pages/admin/AdminUsuariosPage.jsx";
import RolesPermisosPage from "../pages/admin/RolesPermisosPage.jsx";

/**
 * AppRouter - Router principal con rutas públicas y protegidas
 *
 * @component
 * @category Components | Routing
 * @returns {JSX.Element}
 */

/**
 * * COMPONENTE: AppRouter
 *
 * @component
 * @category General
 * @description Componente de CitySecure para general
 *
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 *
 * @example
 * <AppRouter />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

export default function AppRouter() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route
          path="admin/usuarios"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.admin_usuarios}>
              <AdminUsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/roles"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.admin_roles}>
              <RolesPermisosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="personal"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.personal}>
              <PersonalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="vehiculos"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.vehiculos}>
              <VehiculosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="novedades"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.novedades}>
              <NovedadesPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
