/**
 * File: src/components/calles/CalleViewModal.jsx
 * @version 1.0.0
 * @description Modal de solo lectura para ver información completa de una calle
 *
 * @module src/components/calles/CalleViewModal
 */

import { useEffect } from "react";
import { X, MapPin } from "lucide-react";

/**
 * CalleViewModal - Modal de solo consulta
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.calle - Calle a mostrar
 */
export default function CalleViewModal({ isOpen, onClose, calle }) {
  if (!isOpen || !calle) return null;

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
              <MapPin size={24} className="text-primary-600 dark:text-primary-400" />
              Información de Calle
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
          {/* Código */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <label className="block text-xs font-medium text-primary-700 dark:text-primary-400 mb-1">
              Código de Calle
            </label>
            <p className="text-lg font-mono font-bold text-primary-900 dark:text-primary-300">
              {calle.calle_code || calle.codigo}
            </p>
          </div>

          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nombre Completo
            </label>
            <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {calle.nombre_completo}
            </p>
          </div>

          {/* Detalles de Vía */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Vía
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calle.tipo_via?.nombre ? (
                  <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-sm font-medium text-primary-800 dark:text-primary-300">
                    {calle.tipo_via.abreviatura} - {calle.tipo_via.nombre}
                  </span>
                ) : (
                  "No especificado"
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calle.nombre}
              </p>
            </div>
          </div>

          {/* Urbanización */}
          {calle.urbanizacion && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Urbanización / AAHH
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calle.urbanizacion}
              </p>
            </div>
          )}

          {/* Clasificación */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Vía Principal
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calle.es_principal ? (
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-300">
                    Sí
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-sm font-medium text-slate-800 dark:text-slate-300">
                    No
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Categoría
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {calle.categoria_via || "-"}
              </p>
            </div>
          </div>

          {/* Descripción */}
          {calle.descripcion && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descripción
              </label>
              <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                {calle.descripcion}
              </p>
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
                  {calle.creadorCalle?.username || calle.created_by || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fecha de Creación
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calle.created_at ? new Date(calle.created_at).toLocaleString("es-PE") : "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Actualizado Por
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calle.actualizadorCalle?.username || calle.updated_by || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Última Actualización
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {calle.updated_at ? new Date(calle.updated_at).toLocaleString("es-PE") : "-"}
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
