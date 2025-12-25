import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Car,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  Key,
  Shield,
} from "lucide-react";

import ThemeToggle from "../components/common/ThemeToggle.jsx";
import ChangePasswordModal from "../components/ChangePasswordModal.jsx";
import { useAuthStore } from "../store/useAuthStore.js";
import { canAccessRoute } from "../rbac/rbac.js";
import { APP_VERSION } from "../config/version.js";

/**
 * * COMPONENTE: SidebarLink
 *
 * @component
 * @category General
 * @description Componente de CitySecure para general
 *
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 *
 * @example
 * <SidebarLink />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

function SidebarLink({ to, icon, children }) {
  const Icon = icon;
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition",
          isActive
            ? "bg-primary-100 text-primary-900 dark:bg-slate-800 dark:text-primary-100"
            : "text-slate-700 hover:bg-primary-50 dark:text-slate-200 dark:hover:bg-slate-800",
        ].join(" ")
      }
      end
    >
      <Icon size={18} />
      <span>{children}</span>
    </NavLink>
  );
}

/**
 * * COMPONENTE: AppShell
 *
 * @component
 * @category General
 * @description Componente de CitySecure para estructura principal de la aplicación
 *
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 *
 * @example
 * <AppShell />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

/**
 * * COMPONENTE: AppShell
 *
 * @component
 * @category General
 * @description Componente de CitySecure para estructura principal de la aplicación
 *
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 *
 * @example
 * <AppShell />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

export default function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const canAccess = (routeKey) => canAccessRoute(user, routeKey);

  const displayName =
    user?.nombre ||
    user?.name ||
    user?.username ||
    user?.email ||
    user?.usuario ||
    "Usuario";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="shieldGradHeader"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    style={{ stopColor: "#4F7942", stopOpacity: 1 }}
                  />
                  <stop
                    offset="100%"
                    style={{ stopColor: "#2D4A22", stopOpacity: 1 }}
                  />
                </linearGradient>
              </defs>
              <path
                d="M16 2 L28 6 L28 14 C28 22 22 28 16 30 C10 28 4 22 4 14 L4 6 Z"
                fill="url(#shieldGradHeader)"
                stroke="#1a2e14"
                strokeWidth="1"
              />
              <text
                x="16"
                y="20"
                fontFamily="Arial, sans-serif"
                fontSize="14"
                fontWeight="bold"
                fill="#FFFFFF"
                textAnchor="middle"
              >
                C
              </text>
            </svg>
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              CitySecure
            </span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2">
              <User size={16} className="text-slate-500 dark:text-slate-300" />
              <span className="text-sm text-slate-700 dark:text-slate-200">
                {displayName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Cambiar contraseña"
            >
              <Key size={16} />
              <span className="hidden sm:inline">Contraseña</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-700/30 bg-white px-3 py-2 text-sm font-medium text-primary-900 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:border-slate-700 dark:bg-slate-900 dark:text-primary-200 dark:hover:bg-slate-800"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-sm h-fit">
          <nav className="space-y-1">
            <SidebarLink to="/dashboard" icon={LayoutDashboard}>
              Dashboard
            </SidebarLink>
            {canAccess("admin_usuarios") && (
              <SidebarLink to="/admin/usuarios" icon={User}>
                Usuarios
              </SidebarLink>
            )}
            {canAccess("admin_roles") && (
              <SidebarLink to="/admin/roles" icon={Shield}>
                Roles y Permisos
              </SidebarLink>
            )}
            {canAccess("personal") && (
              <SidebarLink to="/personal" icon={Users}>
                Personal
              </SidebarLink>
            )}
            {canAccess("vehiculos") && (
              <SidebarLink to="/vehiculos" icon={Car}>
                Vehículos
              </SidebarLink>
            )}
            {canAccess("novedades") && (
              <SidebarLink to="/novedades" icon={AlertTriangle}>
                Novedades
              </SidebarLink>
            )}
          </nav>

          {/* Versión de la aplicación */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-400 dark:text-slate-500 block text-center">
              {APP_VERSION}
            </span>
          </div>
        </aside>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Modal de cambio de contraseña */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
}
