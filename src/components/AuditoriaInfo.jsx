/**
 * File: src/components/AuditoriaInfo.jsx
 * @version 1.0.0
 * @description Componente reutilizable para mostrar información de auditoría
 * @module src/components/AuditoriaInfo.jsx
 */

import React from 'react';
import { formatUsuarioCompleto, formatUsuarioCorto } from '../utils/usuarioUtils.js';

const AuditoriaInfo = ({ item, showDeleted = false, compact = false }) => {
  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try {
      return new Date(fecha).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  };

  // Fallback temporal mientras el backend implementa la nueva estructura
  const getCreadoPorUsuario = () => {
    return item.creadoPorUsuario || item.usuarioRegistro || null;
  };

  const getActualizadoPorUsuario = () => {
    return item.actualizadoPorUsuario || item.usuarioActualizacion || null;
  };

  const getEliminadoPorUsuario = () => {
    return item.eliminadoPorUsuario || item.usuarioEliminacion || null;
  };

  if (compact) {
    return (
      <div className="auditoria-info-compact text-xs text-slate-500 dark:text-slate-400">
        {getCreadoPorUsuario() && (
          <div>
            Creado: {formatUsuarioCorto(getCreadoPorUsuario())}
            {item.created_at && <span> - {formatFecha(item.created_at)}</span>}
          </div>
        )}
        
        {getActualizadoPorUsuario() && (
          <div>
            Actualizado: {formatUsuarioCorto(getActualizadoPorUsuario())}
            {item.updated_at && <span> - {formatFecha(item.updated_at)}</span>}
          </div>
        )}
        
        {showDeleted && getEliminadoPorUsuario() && (
          <div className="text-red-600 dark:text-red-400">
            Eliminado: {formatUsuarioCorto(getEliminadoPorUsuario())}
            {item.deleted_at && <span> - {formatFecha(item.deleted_at)}</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="auditoria-info text-sm">
      <div className="space-y-2">
        {getCreadoPorUsuario() && (
          <div className="flex flex-col">
            <span className="font-medium text-slate-700 dark:text-slate-300">Creado:</span>
            <span className="text-slate-900 dark:text-slate-50">
              {formatUsuarioCompleto(getCreadoPorUsuario())}
            </span>
            {item.created_at && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatFecha(item.created_at)}
              </span>
            )}
          </div>
        )}
        
        {getActualizadoPorUsuario() && (
          <div className="flex flex-col">
            <span className="font-medium text-slate-700 dark:text-slate-300">Actualizado:</span>
            <span className="text-slate-900 dark:text-slate-50">
              {formatUsuarioCompleto(getActualizadoPorUsuario())}
            </span>
            {item.updated_at && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatFecha(item.updated_at)}
              </span>
            )}
          </div>
        )}
        
        {showDeleted && getEliminadoPorUsuario() && (
          <div className="flex flex-col">
            <span className="font-medium text-red-600 dark:text-red-400">Eliminado:</span>
            <span className="text-red-700 dark:text-red-300">
              {formatUsuarioCompleto(getEliminadoPorUsuario())}
            </span>
            {item.deleted_at && (
              <span className="text-xs text-red-500 dark:text-red-400">
                {formatFecha(item.deleted_at)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditoriaInfo;
