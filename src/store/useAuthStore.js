/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\store\\useAuthStore.js
 * @version 2.0.0
 * @description Store Zustand para autenticación y gestión de sesión de usuario.
 * Documentación educativa: cabecera añadida y JSDoc mejorado sin cambiar la lógica.
 *
 * @module src/store/useAuthStore.js
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * * STORE ZUSTAND: useAuthStore
 *
 * @module useAuthStore
 * @description Store de estado global para gestión de autenticación y sesión de usuario
 *
 * @property {Object} state - Estado del store
 * @property {Function} actions - Acciones para modificar el estado
 *
 * ! NO modificar el estado directamente - usar las acciones provistas
 * TODO: Documentar propiedades específicas del estado
 * TODO: Documentar todas las acciones disponibles
 *
 * @example
 * const { state, action } = useAuthStore();
 */

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: Boolean(token) }),

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      // Verificar si el usuario tiene alguno de los roles especificados
      hasAnyRole: (allowedRoles) => {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        const user = get().user;
        const roles = user?.roles || user?.Roles || [];
        const slugs = roles
          .map((r) => r?.slug || r?.Slug || r?.nombre || r?.name)
          .filter(Boolean);
        return slugs.some((slug) => allowedRoles.includes(slug));
      },

      // Obtener los slugs de roles del usuario
      getRoleSlugs: () => {
        const user = get().user;
        const roles = user?.roles || user?.Roles || [];
        return roles
          .map((r) => r?.slug || r?.Slug || r?.nombre || r?.name)
          .filter(Boolean);
      },

      // Obtener los permisos del usuario
      getPermisos: () => {
        const user = get().user;
        return user?.permisos || [];
      },

      // Verificar si el usuario tiene alguno de los permisos especificados
      hasAnyPermission: (requiredPermisos) => {
        if (!requiredPermisos || requiredPermisos.length === 0) return true;
        const user = get().user;
        const userPermisos = user?.permisos || [];

        // super_admin tiene todos los permisos
        const roles = user?.roles || [];
        const isSuperAdmin = roles.some((r) => r?.slug === "super_admin");
        if (isSuperAdmin) return true;

        return requiredPermisos.some((p) => userPermisos.includes(p));
      },

      // Verificar si el usuario tiene TODOS los permisos especificados
      hasAllPermissions: (requiredPermisos) => {
        if (!requiredPermisos || requiredPermisos.length === 0) return true;
        const user = get().user;
        const userPermisos = user?.permisos || [];

        // super_admin tiene todos los permisos
        const roles = user?.roles || [];
        const isSuperAdmin = roles.some((r) => r?.slug === "super_admin");
        if (isSuperAdmin) return true;

        return requiredPermisos.every((p) => userPermisos.includes(p));
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
