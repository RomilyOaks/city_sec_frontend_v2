/**
 * File: src/components/calles/CalleCuadranteViewModal.jsx
 * @version 1.0.0
 * @description Modal de solo lectura para ver información completa de una relación Calle-Cuadrante
 *
 * @module src/components/calles/CalleCuadranteViewModal
 */

import { useEffect } from "react";
import { X, MapPin } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

/**
 * CalleCuadranteViewModal - Modal de solo consulta
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.calleCuadrante - Relación Calle-Cuadrante a mostrar
 */
export default function CalleCuadranteViewModal({
  isOpen,
  onClose,
  calleCuadrante,
}) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  if (!isOpen || !calleCuadrante) return null;

  // Debug: Log del objeto completo para ver qué relaciones trae
  useEffect(() => {
    if (calleCuadrante) {
      console.log(
        "🔍 [CalleCuadranteViewModal] Objeto completo:",
        calleCuadrante
      );
      console.log(
        "🔍 [CalleCuadranteViewModal] created_by:",
        calleCuadrante.created_by
      );
      console.log(
        "🔍 [CalleCuadranteViewModal] updated_by:",
        calleCuadrante.updated_by
      );
      console.log(
        "🔍 [CalleCuadranteViewModal] creadorCalleCuadrante:",
        calleCuadrante.creadorCalleCuadrante
      );
      console.log(
        "🔍 [CalleCuadranteViewModal] actualizadorCalleCuadrante:",
        calleCuadrante.actualizadorCalleCuadrante
      );
    }
  }, [calleCuadrante]);

  // Manejo de tecla ESC para cerrar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin
                size={24}
                className="text-primary-600 dark:text-primary-400"
              />
              Información de Cuadrante de Calle
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Solo consulta • ESC para cerrar
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Calle */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <label className="block text-xs font-medium text-primary-700 dark:text-primary-400 mb-1">
              Calle
            </label>
            <p className="text-lg font-bold text-primary-900 dark:text-primary-300">
              {calleCuadrante.calle?.nombre_completo || "-"}
            </p>
          </div>

          {/* Cuadrante */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cuadrante
            </label>
            <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {calleCuadrante.cuadrante ? (
                <>
                  {calleCuadrante.cuadrante.cuadrante_code ||
                    calleCuadrante.cuadrante.codigo}{" "}
                  - {calleCuadrante.cuadrante.nombre}
                </>
              ) : (
                "No especificado"
              )}
            </p>
          </div>

          {/* Sector */}
          {calleCuadrante.cuadrante?.sector && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Sector
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-sm font-medium text-primary-800 dark:text-primary-300">
                  {calleCuadrante.cuadrante.sector.sector_code ||
                    calleCuadrante.cuadrante.sector.codigo}{" "}
                  - {calleCuadrante.cuadrante.sector.nombre}
                </span>
              </p>
            </div>
          )}

          {/* Numeración */}

          <div className="grid grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número Inicio
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calleCuadrante.numero_inicio || "-"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Número Fin
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calleCuadrante.numero_fin || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Lado
                </label>
                <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm font-medium text-slate-800 dark:text-slate-300">
                  {calleCuadrante.lado || "AMBOS"}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Prioridad
                </label>
                <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {calleCuadrante.prioridad || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Manzana, Desde/Intersección, Hasta/Intersección */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Manzana
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calleCuadrante.manzana || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Desde Intersección
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calleCuadrante.desde_interseccion || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hasta Intersección
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calleCuadrante.hasta_interseccion || "-"}
              </p>
            </div>
          </div>

          {/* Observaciones */}
          {calleCuadrante.observaciones && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Observaciones
              </label>
              <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                {calleCuadrante.observaciones}
              </p>
            </div>
          )}

          {/* Coordenadas GPS del Cuadrante */}
          {calleCuadrante.cuadrante && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Latitud
                </label>
                <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  {calleCuadrante.cuadrante.latitud || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Longitud
                </label>
                <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
                  {calleCuadrante.cuadrante.longitud || "-"}
                </p>
              </div>
            </div>
          )}

          {/* Información de Auditoría */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Información de Auditoría
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Creado Por
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calleCuadrante.creadorCallesCuadrantes?.username || calleCuadrante.created_by || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fecha de Creación
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calleCuadrante.created_at
                    ? new Date(calleCuadrante.created_at).toLocaleString(
                        "es-PE"
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Actualizado Por
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calleCuadrante.actualizadorCallesCuadrantes?.username || calleCuadrante.updated_by || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Última Actualización
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calleCuadrante.updated_at
                    ? new Date(calleCuadrante.updated_at).toLocaleString(
                        "es-PE"
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
