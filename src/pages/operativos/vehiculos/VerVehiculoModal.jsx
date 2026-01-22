/**
 * File: src/pages/operativos/vehiculos/VerVehiculoModal.jsx
 * @version 1.0.0
 * @description Modal de solo lectura para ver detalles de un vehículo asignado a turno
 * @module src/pages/operativos/vehiculos/VerVehiculoModal.jsx
 */

import { useEffect } from "react";
import { X, Car } from "lucide-react";

/**
 * VerVehiculoModal
 * Modal de solo lectura para ver todos los detalles de un vehículo asignado
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.vehiculo - Objeto con datos del vehículo asignado
 */
export default function VerVehiculoModal({ isOpen, onClose, vehiculo }) {
  // Manejar tecla ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true); // capture phase
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose]);

  const formatPersonalNombre = (persona) => {
    if (!persona) return "—";
    const nombres = [
      persona.nombres,
      persona.apellido_paterno,
      persona.apellido_materno,
    ]
      .filter(Boolean)
      .join(" ");
    return nombres || "—";
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    try {
      return new Date(fecha).toLocaleString("es-ES", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  if (!isOpen || !vehiculo) return null;

  const kmRecorridos = vehiculo.kilometros_recorridos || "—";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Car size={24} className="text-blue-600" />
              Detalle de Vehículo Asignado
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Información completa del vehículo en turno operativo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Información del Vehículo */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Información del Vehículo
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Placa
                  </label>
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.placa || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Código
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.codigo_vehiculo || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Tipo de Vehículo
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.tipo?.nombre || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Unidad/Oficina
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.unidad?.nombre || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Marca
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.marca || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Modelo
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.modelo_vehiculo || vehiculo.vehiculo?.modelo || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Año
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.anio_vehiculo || vehiculo.vehiculo?.anio || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Color
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.color_vehiculo || vehiculo.vehiculo?.color || "—"}
                  </p>
                </div>
                <div className="col-span-4">
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Estado Operativo
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.vehiculo?.estado_operativo || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Asignado */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Personal Asignado
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Conductor
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {formatPersonalNombre(vehiculo.conductor)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Copiloto
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {formatPersonalNombre(vehiculo.copiloto)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Tipo Copiloto
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.tipo_copiloto?.descripcion || vehiculo.tipo_copiloto?.codigo || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipamiento */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Equipamiento
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Radio TETRA
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.radio_tetra?.radio_tetra_code || vehiculo.radio_tetra?.codigo || vehiculo.radio_tetra?.numero || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Estado Operativo
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.estado_operativo?.descripcion || vehiculo.estado_operativo?.nombre || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Kilometraje y Horarios */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Kilometraje y Horarios
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Km Inicio
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {vehiculo.kilometraje_inicio?.toLocaleString() || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Km Fin
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {vehiculo.kilometraje_fin?.toLocaleString() || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Km Recorridos
                  </label>
                  <p className="text-base font-semibold text-primary-600 dark:text-primary-400">
                    {typeof kmRecorridos === "number"
                      ? kmRecorridos.toLocaleString()
                      : kmRecorridos}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Hora Inicio
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.hora_inicio || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Hora Fin
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.hora_fin || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Combustible */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Nivel de Combustible
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Nivel Inicio
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.nivel_combustible_inicio || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Nivel Fin
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {vehiculo.nivel_combustible_fin || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {vehiculo.observaciones && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                  Observaciones
                </h3>
                <p className="text-base text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                  {vehiculo.observaciones}
                </p>
              </div>
            )}

            {/* Metadatos */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Información del Registro
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Creado
                  </label>
                  <p className="text-slate-900 dark:text-slate-50">
                    {formatFecha(vehiculo.created_at || vehiculo.createdAt)}
                  </p>
                  {(vehiculo.creador || vehiculo.created_by) && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Por: {vehiculo.creador ? `${vehiculo.creador.username} (${vehiculo.creador.nombres} ${vehiculo.creador.apellidos})` : `ID Usuario: ${vehiculo.created_by}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Actualizado
                  </label>
                  <p className="text-slate-900 dark:text-slate-50">
                    {formatFecha(vehiculo.updated_at || vehiculo.updatedAt)}
                  </p>
                  {(vehiculo.actualizador || vehiculo.updated_by) && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Por: {vehiculo.actualizador ? `${vehiculo.actualizador.username} (${vehiculo.actualizador.nombres} ${vehiculo.actualizador.apellidos})` : `ID Usuario: ${vehiculo.updated_by}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Estado del Registro
                  </label>
                  <p className="text-slate-900 dark:text-slate-50">
                    {vehiculo.estado_registro === 1 ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium">
                        Inactivo
                      </span>
                    )}
                  </p>
                </div>
                {vehiculo.deleted_at && (
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      Eliminado
                    </label>
                    <p className="text-slate-900 dark:text-slate-50">
                      {formatFecha(vehiculo.deleted_at)}
                    </p>
                    {(vehiculo.eliminador || vehiculo.deleted_by) && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Por: {vehiculo.eliminador ? `${vehiculo.eliminador.username} (${vehiculo.eliminador.nombres} ${vehiculo.eliminador.apellidos})` : `ID Usuario: ${vehiculo.deleted_by}`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
