/**
 * File: src/pages/operativos/personal/OperativosPersonalModal.jsx
 * @version 2.2.2
 * @description Modal principal para gestionar personal asignado a patrullaje a pie
 * en un turno operativo. Muestra grid con personal asignado y permite CRUD.
 *
 * Jerarquía: OperativosTurno → [Este Modal] → Cuadrantes → Novedades
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-18
 * @module src/pages/operativos/personal/OperativosPersonalModal.jsx
 */

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  X,
  Plus,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  PersonStanding,
  MapPin,
  Radio,
  Shield,
} from "lucide-react";

// Servicios
import {
  listPersonalByTurno,
  deletePersonalOperativo,
  formatPersonalNombre,
  getTipoPatrullajeConfig,
  contarEquipamiento,
} from "../../../services/operativosPersonalService.js";

// RBAC y Auth
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";

// Componentes hijos
import AsignarPersonalForm from "./AsignarPersonalForm.jsx";
import EditarPersonalForm from "./EditarPersonalForm.jsx";
import VerPersonalModal from "./VerPersonalModal.jsx";

/**
 * OperativosPersonalModal
 * Modal para ver y gestionar personal asignado a patrullaje a pie en un turno operativo
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.turno - Turno operativo seleccionado (con datos de sector, supervisor, operador)
 */
export default function OperativosPersonalModal({ isOpen, onClose, turno }) {
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================

  // Usuario actual para verificar permisos
  const user = useAuthStore((s) => s.user);

  // Permisos RBAC para Personal Operativo
  const canCreate = canPerformAction(user, "operativos.personal.create");
  const canEdit = canPerformAction(user, "operativos.personal.update");
  const canDelete = canPerformAction(user, "operativos.personal.delete");
  const canReadCuadrantes = canPerformAction(user, "operativos.personal.cuadrantes.read");

  // Estado del componente
  const [personalList, setPersonalList] = useState([]); // Lista de personal asignado
  const [loading, setLoading] = useState(false);        // Indicador de carga
  const [showCreateForm, setShowCreateForm] = useState(false);  // Mostrar form de asignación
  const [showEditForm, setShowEditForm] = useState(false);      // Mostrar form de edición
  const [showViewModal, setShowViewModal] = useState(false);    // Mostrar modal de detalle
  const [selectedPersonal, setSelectedPersonal] = useState(null); // Personal seleccionado

  // ============================================================================
  // EFECTOS
  // ============================================================================

  /**
   * Manejar atajos de teclado
   * - ESC: Cerrar modal (si no hay formularios abiertos)
   * - Alt+P: Abrir formulario de asignación de personal
   * - Alt+N: Prevenir que se abra modal de Nuevo Turno
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC: Cerrar modal (solo si no hay formularios/modales internos abiertos)
      if (e.key === "Escape" && isOpen && !showCreateForm && !showEditForm && !showViewModal) {
        onClose();
      }

      // Alt+N: Prevenir que se abra Nuevo Turno cuando estamos en este modal
      if (e.altKey && e.key === "n" && isOpen) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Alt+P: Abrir formulario de asignación de personal (solo si tiene permiso)
      if (e.altKey && e.key === "p" && isOpen && !showCreateForm && !showEditForm && canCreate) {
        e.preventDefault();
        setShowCreateForm(true);
      }
    };

    // Registrar evento con capture phase para interceptar antes que otros handlers
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose, showCreateForm, showEditForm, showViewModal, canCreate]);

  // ============================================================================
  // FUNCIONES DE DATOS
  // ============================================================================

  /**
   * Cargar lista de personal asignado al turno
   * Llama al endpoint GET /api/v1/operativos/:turnoId/personal
   */
  const fetchPersonal = useCallback(async () => {
    if (!turno?.id) return;

    setLoading(true);
    try {
      const result = await listPersonalByTurno(turno.id);
      // El backend devuelve { success, data: [...] }
      const items = result?.data || result || [];
      setPersonalList(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Error cargando personal:", err);
      toast.error(err?.response?.data?.message || "Error al cargar personal del turno");
    } finally {
      setLoading(false);
    }
  }, [turno?.id]);

  /**
   * Efecto para cargar datos cuando se abre el modal
   */
  useEffect(() => {
    if (isOpen && turno?.id) {
      fetchPersonal();
    }
  }, [isOpen, turno?.id, fetchPersonal]);

  // ============================================================================
  // HANDLERS DE ACCIONES
  // ============================================================================

  /**
   * Abrir modal de detalle (solo lectura)
   */
  const handleView = (personal) => {
    setSelectedPersonal(personal);
    setShowViewModal(true);
  };

  /**
   * Abrir formulario de edición
   */
  const handleEdit = (personal) => {
    setSelectedPersonal(personal);
    setShowEditForm(true);
  };

  /**
   * Navegar a cuadrantes del personal
   * TODO: Implementar en FASE 3 - Por ahora muestra toast informativo
   * @param {Object} personalItem - Personal seleccionado (se usará en FASE 3)
   */
  // eslint-disable-next-line no-unused-vars
  const handleCuadrantes = (personalItem) => {
    toast("Función de cuadrantes se implementará en FASE 3", { icon: "🚧" });
    // En FASE 3: navigate(`/operativos/turnos/${turno.id}/personal/${personalItem.id}/cuadrantes`);
  };

  /**
   * Eliminar asignación de personal (soft delete)
   * Solicita confirmación antes de eliminar
   */
  const handleDelete = async (personal) => {
    // Obtener nombre del personal para mostrar en confirmación
    const nombrePersonal = formatPersonalNombre(personal.personal);

    const confirmed = window.confirm(
      `¿Eliminar la asignación de ${nombrePersonal} de este turno?`
    );
    if (!confirmed) return;

    try {
      await deletePersonalOperativo(turno.id, personal.id);
      toast.success("Personal eliminado del turno");
      fetchPersonal(); // Recargar lista
    } catch (err) {
      console.error("Error eliminando personal:", err);
      toast.error(err?.response?.data?.message || "Error al eliminar personal");
    }
  };

  // ============================================================================
  // FUNCIONES AUXILIARES DE FORMATO
  // ============================================================================

  /**
   * Obtener nombre del supervisor del turno
   */
  const getSupervisorNombre = () => {
    if (turno?.supervisor) return formatPersonalNombre(turno.supervisor);
    return "—";
  };

  /**
   * Obtener nombre del operador del turno
   */
  const getOperadorNombre = () => {
    if (turno?.operador) return formatPersonalNombre(turno.operador);
    return "—";
  };

  /**
   * Formatear hora desde datetime ISO
   * @param {string} datetime - Fecha/hora ISO 8601
   * @returns {string} - Hora formateada HH:MM
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

  // No renderizar si el modal no está abierto
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* ================================================================== */}
        {/* HEADER - Título, info del turno y botón cerrar */}
        {/* ================================================================== */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            {/* Título con ícono y atajo de teclado */}
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <PersonStanding size={28} className="text-green-600" />
                Personal de Patrullaje a Pie
              </h2>
              {/* Indicador de atajo de teclado según estado */}
              {canCreate && !showCreateForm && !showEditForm && (
                <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium">
                  Alt+P = Asignar Personal
                </span>
              )}
              {(showCreateForm || showEditForm) && (
                <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                  Alt+G = Guardar | Esc = Cancelar
                </span>
              )}
            </div>

            {/* Información del turno */}
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-400">
                  📅 {turno?.fecha} | 🌅 {turno?.turno} | 📍{" "}
                  {turno?.sector?.nombre || "Sector"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Supervisor:</span>{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getSupervisorNombre()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Operador:</span>{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {getOperadorNombre()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar (ESC)"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================================== */}
        {/* TOOLBAR - Botones de acción (solo si no hay formularios abiertos) */}
        {/* ================================================================== */}
        {!showCreateForm && !showEditForm && personalList.length > 0 && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 transition-colors"
                  title="Asignar Personal (Alt+P)"
                >
                  <Plus size={18} />
                  Asignar Personal
                </button>
              )}
            </div>
            <button
              onClick={fetchPersonal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Refrescar lista"
            >
              <RefreshCw size={18} />
              Refrescar
            </button>
          </div>
        )}

        {/* ================================================================== */}
        {/* CONTENIDO PRINCIPAL */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-6">

          {/* Estado: Formulario de creación */}
          {showCreateForm ? (
            <AsignarPersonalForm
              turnoId={turno?.id}
              personalAsignado={personalList}
              onSuccess={() => {
                setShowCreateForm(false);
                fetchPersonal();
              }}
              onCancel={() => setShowCreateForm(false)}
            />

          /* Estado: Formulario de edición */
          ) : showEditForm && selectedPersonal ? (
            <EditarPersonalForm
              turnoId={turno?.id}
              personal={selectedPersonal}
              personalAsignado={personalList}
              onSuccess={() => {
                setShowEditForm(false);
                setSelectedPersonal(null);
                fetchPersonal();
              }}
              onCancel={() => {
                setShowEditForm(false);
                setSelectedPersonal(null);
              }}
            />

          /* Estado: Cargando */
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400">
                  Cargando personal...
                </p>
              </div>
            </div>

          /* Estado: Lista vacía */
          ) : personalList.length === 0 ? (
            <div className="text-center py-12">
              <PersonStanding size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No hay personal asignado a este turno
              </p>
              {canCreate && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800"
                  title="Asignar Personal (Alt+P)"
                >
                  <Plus size={18} />
                  Asignar primer personal
                </button>
              )}
            </div>

          /* Estado: Mostrar tabla de personal */
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                {/* Encabezado de la tabla */}
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Personal
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Compañero
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                      <span title="Radio TETRA"><Radio size={16} className="inline" /></span>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                      <span title="Equipamiento"><Shield size={16} className="inline" /></span>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Hora Inicio
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Hora Fin
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Acciones
                    </th>
                  </tr>
                </thead>

                {/* Cuerpo de la tabla */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {personalList.map((p) => {
                    // Obtener configuración de color para el tipo de patrullaje
                    const tipoConfig = getTipoPatrullajeConfig(p.tipo_patrullaje);
                    // Contar items de equipamiento
                    const equipCount = contarEquipamiento(p);

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        {/* Personal principal */}
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                          {formatPersonalNombre(p.personal)}
                        </td>

                        {/* Tipo de patrullaje con badge de color */}
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tipoConfig.color}`}>
                            {tipoConfig.label}
                          </span>
                        </td>

                        {/* Compañero de patrullaje (sereno) */}
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {formatPersonalNombre(p.sereno)}
                        </td>

                        {/* Radio TETRA */}
                        <td className="px-4 py-3 text-center">
                          {p.radio_tetra ? (
                            <span
                              className="text-green-600 dark:text-green-400"
                              title={p.radio_tetra.radio_tetra_code || "Radio asignado"}
                            >
                              {p.radio_tetra.radio_tetra_code || "✓"}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Equipamiento (contador) */}
                        <td className="px-4 py-3 text-center">
                          {equipCount > 0 ? (
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium"
                              title={`${equipCount} items de equipamiento`}
                            >
                              {equipCount}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>

                        {/* Hora inicio */}
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {formatHora(p.hora_inicio)}
                        </td>

                        {/* Hora fin */}
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {formatHora(p.hora_fin)}
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Botón Cuadrantes */}
                            {canReadCuadrantes && (
                              <button
                                onClick={() => handleCuadrantes(p)}
                                className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                title="Ver Cuadrantes"
                              >
                                <MapPin size={14} />
                              </button>
                            )}

                            {/* Botón Ver detalle */}
                            <button
                              onClick={() => handleView(p)}
                              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Ver detalle"
                            >
                              <Eye size={14} />
                            </button>

                            {/* Botón Editar */}
                            {canEdit && (
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Editar"
                              >
                                <Pencil size={14} />
                              </button>
                            )}

                            {/* Botón Eliminar */}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(p)}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* MODAL DE DETALLE (Ver Personal) */}
        {/* ================================================================== */}
        <VerPersonalModal
          isOpen={showViewModal}
          personal={selectedPersonal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPersonal(null);
          }}
        />
      </div>
    </div>
  );
}
