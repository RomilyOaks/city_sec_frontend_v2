import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook para gestionar permisos específicos de Reportes Operativos
 * Implementa los nuevos slugs de permisos granulares
 */
export const useReportesPermissions = () => {
  const { user } = useAuthStore();
  
  const permissions = {
    dashboard: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_dashboard.export') || false,
    },
    vehiculares: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_vehiculares.export') || false,
    },
    operativosPie: {
      read: user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.operativos_personales.export') || false,
    },
    noAtendidas: {
      read: user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.read') || false,
      export: user?.permisos?.some(p => p.slug === 'reportes.novedades_no_atendidas.export') || false,
    }
  };
  
  return permissions;
};

/**
 * Hook para verificar un permiso específico
 */
export const usePermission = (permissionSlug) => {
  const { user } = useAuthStore();
  
  const hasPermission = user?.permisos?.some(p => p.slug === permissionSlug) || false;
  
  return hasPermission;
};
