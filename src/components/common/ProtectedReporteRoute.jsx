import React from 'react';
import { usePermission } from '../../hooks/useReportesPermissions';

/**
 * Componente de protección para rutas de reportes
 */
const ProtectedReporteRoute = ({ 
  children, 
  requiredPermission, 
  fallback = null 
}) => {
  const hasPermission = usePermission(requiredPermission);
  
  if (!hasPermission) {
    return fallback || (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Acceso Restringido
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            Permiso requerido: {requiredPermission}
          </p>
        </div>
      </div>
    );
  }
  
  return children;
};

export default ProtectedReporteRoute;
