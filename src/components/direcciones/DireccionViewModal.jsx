/**
 * File: src/components/direcciones/DireccionViewModal.jsx
 * @version 1.0.0
 * @description Modal de solo lectura para ver información completa de una dirección
 *
 * @module src/components/direcciones/DireccionViewModal
 */

import { X, MapPin, Navigation, Map as MapIcon } from "lucide-react";

/**
 * DireccionViewModal - Modal de solo consulta
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.direccion - Dirección a mostrar
 */
export default function DireccionViewModal({ isOpen, onClose, direccion }) {
  if (!isOpen || !direccion) return null;

  const handleClose = () => {
    onClose();
  };

  // Formatear dirección completa
  const formatDireccion = () => {
    if (direccion.direccion_completa) return direccion.direccion_completa;

    const partes = [];
    if (direccion.calle?.nombre_completo) partes.push(direccion.calle.nombre_completo);
    if (direccion.numero_municipal) partes.push(`N° ${direccion.numero_municipal}`);
    if (direccion.manzana && direccion.lote) partes.push(`Mz. ${direccion.manzana} Lt. ${direccion.lote}`);
    if (direccion.tipo_complemento && direccion.numero_complemento) {
      partes.push(`${direccion.tipo_complemento} ${direccion.numero_complemento}`);
    }
    return partes.join(" ") || "Sin especificar";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin size={24} className="text-primary-600 dark:text-primary-400" />
              Información de Dirección
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
              Código de Dirección
            </label>
            <p className="text-lg font-mono font-bold text-primary-900 dark:text-primary-300">
              {direccion.direccion_code}
            </p>
          </div>

          {/* Dirección Completa */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Dirección Completa
            </label>
            <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {formatDireccion()}
            </p>
          </div>

          {/* Calle */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Calle
            </label>
            <p className="text-base text-slate-900 dark:text-white">
              {direccion.calle?.nombre_completo || "No especificado"}
            </p>
          </div>

          {/* Sistema de Direccionamiento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número Municipal
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {direccion.numero_municipal || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Manzana / Lote
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {direccion.manzana && direccion.lote
                  ? `Mz. ${direccion.manzana} Lt. ${direccion.lote}`
                  : "-"}
              </p>
            </div>
          </div>

          {/* Urbanización */}
          {direccion.urbanizacion && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Urbanización / AAHH
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {direccion.urbanizacion}
              </p>
            </div>
          )}

          {/* Complementos */}
          {(direccion.tipo_complemento || direccion.numero_complemento) && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tipo de Complemento
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {direccion.tipo_complemento || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Número
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {direccion.numero_complemento || "-"}
                </p>
              </div>
            </div>
          )}

          {/* Referencia */}
          {direccion.referencia && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Referencia
              </label>
              <p className="text-base text-slate-900 dark:text-white">
                {direccion.referencia}
              </p>
            </div>
          )}

          {/* Ubicación Geográfica */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapIcon size={18} />
              Ubicación Geográfica
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Cuadrante
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {direccion.cuadrante?.cuadrante_code
                    ? `${direccion.cuadrante.cuadrante_code} - ${direccion.cuadrante.nombre || ""}`
                    : "No asignado"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Sector
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {direccion.sector?.sector_code
                    ? `${direccion.sector.sector_code} - ${direccion.sector.nombre || ""}`
                    : "No asignado"}
                </p>
              </div>
            </div>
          </div>

          {/* Geocodificación */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Navigation size={18} />
              Geocodificación
            </h3>
            {direccion.geocodificada === 1 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Navigation size={16} />
                  <span className="text-sm font-medium">Dirección geocodificada</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Latitud
                    </label>
                    <p className="text-base font-mono text-slate-900 dark:text-white">
                      {direccion.latitud}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Longitud
                    </label>
                    <p className="text-base font-mono text-slate-900 dark:text-white">
                      {direccion.longitud}
                    </p>
                  </div>
                </div>
                {direccion.fuente_geocodificacion && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Fuente
                    </label>
                    <p className="text-base text-slate-900 dark:text-white">
                      {direccion.fuente_geocodificacion}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <MapIcon size={16} />
                <span className="text-sm">Sin coordenadas GPS</span>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {direccion.observaciones && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Observaciones
              </label>
              <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap">
                {direccion.observaciones}
              </p>
            </div>
          )}
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
