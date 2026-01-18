/**
 * File: src/pages/operativos/personal/VerPersonalModal.jsx
 * @version 2.2.2
 * @description Modal de solo lectura para ver detalles de personal asignado a patrullaje a pie.
 * Muestra información completa del personal, compañero, equipamiento, horarios y metadatos.
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-18
 * @module src/pages/operativos/personal/VerPersonalModal.jsx
 */

import { useEffect } from "react";
import { X, PersonStanding, Check, Minus } from "lucide-react";

// Servicios
import {
  formatPersonalNombre,
  getTipoPatrullajeConfig,
  EQUIPAMIENTO_ITEMS,
} from "../../../services/operativosPersonalService.js";

/**
 * VerPersonalModal
 * Modal de solo lectura para ver todos los detalles de personal asignado a patrullaje
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.personal - Objeto con datos del personal asignado
 */
export default function VerPersonalModal({ isOpen, onClose, personal }) {
  // ============================================================================
  // EFECTOS
  // ============================================================================

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
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose]);

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  /**
   * Formatear fecha/hora completa
   */
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

  /**
   * Formatear solo hora
   */
  const formatHora = (datetime) => {
    if (!datetime) return "—";
    try {
      return new Date(datetime).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen || !personal) return null;

  // Configuración del tipo de patrullaje
  const tipoConfig = getTipoPatrullajeConfig(personal.tipo_patrullaje);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <PersonStanding size={24} className="text-green-600" />
              Detalle de Personal Asignado
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Información completa del personal en patrullaje a pie
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
            {/* Información del Personal Principal */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <h3 className="text-sm font-semibold text-green-700 dark:text-green-200 mb-3 uppercase tracking-wide">
                Personal de Patrullaje
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs text-green-600 dark:text-green-400">
                    Nombre Completo
                  </label>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-50">
                    {formatPersonalNombre(personal.personal)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-green-600 dark:text-green-400">
                    Tipo de Patrullaje
                  </label>
                  <p className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${tipoConfig.color}`}
                    >
                      {tipoConfig.label}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Compañero de Patrullaje */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Compañero de Patrullaje
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Sereno / Compañero
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {formatPersonalNombre(personal.sereno)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Estado Operativo
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {personal.estado_operativo?.descripcion || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipamiento */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Equipamiento
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {EQUIPAMIENTO_ITEMS.map((item) => {
                  const portado = personal[item.key] === true;
                  return (
                    <div
                      key={item.key}
                      className={`
                        flex items-center gap-2 p-3 rounded-lg border
                        ${
                          portado
                            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }
                      `}
                    >
                      {portado ? (
                        <Check
                          size={16}
                          className="text-green-600 dark:text-green-400"
                        />
                      ) : (
                        <Minus
                          size={16}
                          className="text-slate-400 dark:text-slate-500"
                        />
                      )}
                      <span className="text-lg">{item.icon}</span>
                      <span
                        className={`text-xs ${
                          portado
                            ? "text-green-700 dark:text-green-300 font-medium"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comunicación */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Comunicación
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Radio TETRA
                  </label>
                  <p className="text-base text-slate-900 dark:text-slate-50">
                    {personal.radio_tetra?.radio_tetra_code ||
                      personal.radio_tetra?.codigo ||
                      "— Sin radio asignado —"}
                  </p>
                  {personal.radio_tetra?.descripcion && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {personal.radio_tetra.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                Horarios del Patrullaje
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Hora Inicio
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {formatHora(personal.hora_inicio)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {personal.hora_inicio
                      ? new Date(personal.hora_inicio).toLocaleDateString(
                          "es-ES"
                        )
                      : ""}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Hora Fin
                  </label>
                  <p className="text-base font-medium text-slate-900 dark:text-slate-50">
                    {formatHora(personal.hora_fin)}
                  </p>
                  {personal.hora_fin && (
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(personal.hora_fin).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Estado
                  </label>
                  <p className="mt-1">
                    {personal.hora_fin ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium">
                        Finalizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                        En Patrullaje
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {personal.observaciones && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 uppercase tracking-wide">
                  Observaciones
                </h3>
                <p className="text-base text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                  {personal.observaciones}
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
                    {formatFecha(personal.created_at || personal.createdAt)}
                  </p>
                  {(personal.creador || personal.created_by) && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Por:{" "}
                      {personal.creador
                        ? `${personal.creador.username} (${personal.creador.nombres} ${personal.creador.apellidos})`
                        : `ID Usuario: ${personal.created_by}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Actualizado
                  </label>
                  <p className="text-slate-900 dark:text-slate-50">
                    {formatFecha(personal.updated_at || personal.updatedAt)}
                  </p>
                  {(personal.actualizador || personal.updated_by) && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Por:{" "}
                      {personal.actualizador
                        ? `${personal.actualizador.username} (${personal.actualizador.nombres} ${personal.actualizador.apellidos})`
                        : `ID Usuario: ${personal.updated_by}`}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Estado del Registro
                  </label>
                  <p className="text-slate-900 dark:text-slate-50">
                    {personal.estado_registro === 1 ? (
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
                {personal.deleted_at && (
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                      Eliminado
                    </label>
                    <p className="text-slate-900 dark:text-slate-50">
                      {formatFecha(personal.deleted_at)}
                    </p>
                    {(personal.eliminador || personal.deleted_by) && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Por:{" "}
                        {personal.eliminador
                          ? `${personal.eliminador.username} (${personal.eliminador.nombres} ${personal.eliminador.apellidos})`
                          : `ID Usuario: ${personal.deleted_by}`}
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
