import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook para gestionar permisos específicos de Reportes Operativos
 * Implementa los nuevos slugs de permisos granulares
 * super_admin tiene acceso automático a todo
 */
export const useReportesPermissions = () => {
  const { user } = useAuthStore();
  
  // super_admin tiene todos los permisos (misma lógica que useAuthStore)
  const roles = user?.roles || [];
  const isSuperAdmin = roles.some((r) => r?.slug === "super_admin");
  
  const permissions = {
    dashboard: {
      read: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.read') || false,
      export: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.export') || false,
    },
    vehiculares: {
      read: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.read') || false,
      export: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.export') || false,
    },
    operativosPie: {
      read: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.read') || false,
      export: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.export') || false,
    },
    noAtendidas: {
      read: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.read') || false,
      export: isSuperAdmin || user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.export') || false,
    }
  };
  
  return permissions;
};

/**
 * Hook para verificar un permiso específico
 * super_admin tiene acceso automático a cualquier permiso
 */
export const usePermission = (permissionSlug) => {
  const { user } = useAuthStore();
  
  // super_admin tiene todos los permisos (misma lógica que useAuthStore)
  const roles = user?.roles || [];
  const isSuperAdmin = roles.some((r) => r?.slug === "super_admin");
  
  const hasPermission = isSuperAdmin || user?.permisos?.some(p => p.slug === permissionSlug) || false;
  
  return hasPermission;
};
