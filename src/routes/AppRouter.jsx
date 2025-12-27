/**
 * File: src/routes/AppRouter.jsx
 * @version 2.1.0
 * @description Router principal de la aplicación con rutas públicas y protegidas.
 *
 * CHANGELOG v2.1.0:
 * - ✅ Agregadas rutas del módulo Calles
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

// ============================================
// IMPORTAR PÁGINAS DEL MÓDULO CALLES
// ============================================
import CallesPage from "../pages/calles/CallesPage.jsx";
import TiposViaPage from "../pages/calles/TiposViaPage.jsx";
import SectoresCuadrantesPage from "../pages/calles/SectoresCuadrantesPage.jsx";
import CallesCuadrantesPage from "../pages/calles/CallesCuadrantesPage.jsx";
import DireccionesPage from "../pages/direcciones/DireccionesPage.jsx";
import DireccionesEliminadasPage from "../pages/direcciones/DireccionesEliminadasPage.jsx";

/**
 * AppRouter - Router principal con rutas públicas y protegidas
 *
 * @component
 * @category Components | Routing
 * @returns {JSX.Element}
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
        {/* Dashboard */}
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Administración */}
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

        {/* Operaciones */}
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

        {/* ============================================
            MÓDULO CALLES (NUEVO)
            ============================================ */}
        <Route
          path="calles"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.calles}>
              <CallesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/tipos-via"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.calles_tipos_via}>
              <TiposViaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/sectores-cuadrantes"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.calles_sectores_cuadrantes}>
              <SectoresCuadrantesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/calles-cuadrantes"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.calles_calles_cuadrantes}>
              <CallesCuadrantesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/direcciones"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.calles_direcciones}>
              <DireccionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/direcciones-eliminadas"
          element={
            <ProtectedRoute allowedRoles={ROUTE_ACCESS.calles_direcciones}>
              <DireccionesEliminadasPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
