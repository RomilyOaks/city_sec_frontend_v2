/**
 * File: src/routes/AppRouter.jsx
 * @version 2.2.0
 * @description Router principal de la aplicación con rutas públicas y protegidas.
 *
 * CHANGELOG v2.2.0:
 * - ✅ Agregada ruta del módulo Catálogos (Unidades y Oficinas)
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
import AdminUsuariosPage from "../pages/admin/AdminUsuariosPage.jsx";
import RolesPermisosPage from "../pages/admin/RolesPermisosPage.jsx";
import PermisosPage from "../pages/admin/PermisosPage.jsx";

// ============================================
// IMPORTAR PÁGINAS DEL MÓDULO CALLES
// ============================================
import CallesPage from "../pages/calles/CallesPage.jsx";
import TiposViaPage from "../pages/calles/TiposViaPage.jsx";
import SectoresCuadrantesPage from "../pages/calles/SectoresCuadrantesPage.jsx";
import CallesCuadrantesPage from "../pages/calles/CallesCuadrantesPage.jsx";
import DireccionesPage from "../pages/direcciones/DireccionesPage.jsx";
import DireccionesEliminadasPage from "../pages/direcciones/DireccionesEliminadasPage.jsx";

// ============================================
// IMPORTAR PÁGINAS DEL MÓDULO CATÁLOGOS
// ============================================
import UnidadesOficinaPage from "../pages/catalogos/UnidadesOficinaPage.jsx";
import RadiosTetraPage from "../pages/catalogos/RadiosTetraPage.jsx";
import TiposSubtiposNovedadPage from "../pages/catalogos/TiposSubtiposNovedadPage.jsx";

// ============================================
// IMPORTAR PÁGINAS DEL MÓDULO OPERATIVOS
// ============================================
import OperativosTurnoPage from "../pages/operativos/OperativosTurnoPage.jsx";
import OperativosVehiculosPage from "../pages/operativos/vehiculos/OperativosVehiculosPage.jsx";
import CuadrantesPorVehiculo from "../pages/operativos/vehiculos/CuadrantesPorVehiculo.jsx";
import NovedadesPorCuadrante from "../pages/operativos/vehiculos/NovedadesPorCuadrante.jsx";
import ReportesOperativosPage from "../pages/operativos/ReportesOperativosPage.jsx";

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
          path="admin/permisos"
          element={
            <ProtectedRoute routeKey="admin_permisos">
              <PermisosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/usuarios"
          element={
            <ProtectedRoute routeKey="admin_usuarios">
              <AdminUsuariosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/roles"
          element={
            <ProtectedRoute routeKey="admin_roles">
              <RolesPermisosPage />
            </ProtectedRoute>
          }
        />

        {/* Operaciones */}
        <Route
          path="personal"
          element={
            <ProtectedRoute routeKey="personal">
              <PersonalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="vehiculos"
          element={
            <ProtectedRoute routeKey="vehiculos">
              <VehiculosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="novedades"
          element={
            <ProtectedRoute routeKey="novedades">
              <NovedadesPage />
            </ProtectedRoute>
          }
        />

        {/* ============================================
            MÓDULO OPERATIVOS DE PATRULLAJE
            ============================================ */}
        <Route
          path="operativos/turnos"
          element={
            <ProtectedRoute routeKey="operativos_turnos">
              <OperativosTurnoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operativos/turnos/:turnoId/vehiculos"
          element={
            <ProtectedRoute routeKey="operativos_turnos">
              <OperativosVehiculosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="operativos/turnos/:turnoId/vehiculos/:vehiculoId/cuadrantes"
          element={
            <ProtectedRoute routeKey="operativos_turnos">
              <CuadrantesPorVehiculo />
            </ProtectedRoute>
          }
        />
        <Route
          path="operativos/turnos/:turnoId/vehiculos/:vehiculoId/cuadrantes/:cuadranteId/novedades"
          element={
            <ProtectedRoute routeKey="operativos_turnos">
              <NovedadesPorCuadrante />
            </ProtectedRoute>
          }
        />
        <Route
          path="operativos/reportes"
          element={
            <ProtectedRoute routeKey="operativos_turnos">
              <ReportesOperativosPage />
            </ProtectedRoute>
          }
        />

        {/* ============================================
            MÓDULO CALLES (NUEVO)
            ============================================ */}
        <Route
          path="calles"
          element={
            <ProtectedRoute routeKey="calles">
              <CallesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/tipos-via"
          element={
            <ProtectedRoute routeKey="calles_tipos_via">
              <TiposViaPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/sectores-cuadrantes"
          element={
            <ProtectedRoute routeKey="calles_sectores_cuadrantes">
              <SectoresCuadrantesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/calles-cuadrantes"
          element={
            <ProtectedRoute routeKey="calles_calles_cuadrantes">
              <CallesCuadrantesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/direcciones"
          element={
            <ProtectedRoute routeKey="calles_direcciones">
              <DireccionesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="calles/direcciones-eliminadas"
          element={
            <ProtectedRoute routeKey="calles_direcciones">
              <DireccionesEliminadasPage />
            </ProtectedRoute>
          }
        />

        {/* ============================================
            MÓDULO CATÁLOGOS
            ============================================ */}
        <Route
          path="catalogos/unidades-oficinas"
          element={<UnidadesOficinaPage />}
        />
        <Route
          path="catalogos/radios-tetra"
          element={<RadiosTetraPage />}
        />
        <Route
          path="catalogos/tipos-subtipos-novedad"
          element={<TiposSubtiposNovedadPage />}
        />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
