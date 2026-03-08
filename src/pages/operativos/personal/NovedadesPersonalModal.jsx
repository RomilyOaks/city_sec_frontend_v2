/**
 * File: src/pages/operativos/personal/NovedadesPersonalModal.jsx
 * @version 1.0.0
 * @description Modal para gestionar novedades atendidas en un cuadrante por personal operativo.
 * Permite ver novedades disponibles, registrar atención y actualizar estado.
 *
 * @author Claude AI
 * @date 2026-01-18
 */

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";

// Servicios
import {
  listNovedadesByCuadrante,
  getNovedadesDisponibles,
  createNovedadPersonal,
  updateNovedadPersonal,
  deleteNovedadPersonal,
  formatPersonalNombre,
  getPrioridadConfig,
  PRIORIDADES_NOVEDAD,
  RESULTADOS_NOVEDAD,
} from "../../../services/operativosPersonalService.js";
import {
  listUnidadesOficina,
  listVehiculos,
  listPersonalSeguridad,
  crearHistorialNovedad,
} from "../../../services/novedadesService.js";

// RBAC
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";
import { useEstadosPorRol } from "../../../hooks/useEstadosPorRol.js";
import useBodyScrollLock from "../../../hooks/useBodyScrollLock";

// Componentes
import NovedadDetalleModal from "../../../components/NovedadDetalleModal.jsx";

/**
 * NovedadesPersonalModal
 * Modal para gestionar las novedades atendidas en un cuadrante
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {number} props.turnoId - ID del turno operativo
 * @param {Object} props.personal - Objeto del personal operativo
 * @param {Object} props.cuadrante - Objeto del cuadrante operativo
 */
export default function NovedadesPersonalModal({
  isOpen,
  onClose,
  turnoId,
  personal,
  cuadrante,
}) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // Auth y permisos
  const user = useAuthStore((s) => s.user);
  const canCreate = canPerformAction(user, "operativos.personal.novedades.create");
  const canUpdate = canPerformAction(user, "operativos.personal.novedades.update");
  const canDelete = canPerformAction(user, "operativos.personal.novedades.delete");

  // Estados - Lista principal
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  // Estados - Novedades disponibles
  const [novedadesDisponibles, setNovedadesDisponibles] = useState([]);
  const [loadingDisponibles, setLoadingDisponibles] = useState(false);
  const [showRegistrarForm, setShowRegistrarForm] = useState(false);

  // Estados - Formulario registrar
  const [formData, setFormData] = useState({
    novedad_id: "",
    prioridad: "MEDIA",
    observaciones: "",
    acciones_tomadas: "",
  });
  const [saving, setSaving] = useState(false);

  // Estados - Modal editar/resolver
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);

  // Estados - Modal ver detalle
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingNovedad, setViewingNovedad] = useState(null);

  // Estados - Catálogos para el modal de detalle
  const [unidadesOficina, setUnidadesOficina] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [personalSeguridad, setPersonalSeguridad] = useState([]);

  // Estados habilitados para el rol del usuario (desde rol_estados_novedad)
  const { estadosRol } = useEstadosPorRol();

  const [editData, setEditData] = useState({
    estado_novedad_id: "",
    resultado: "",
    acciones_tomadas: "",
    observaciones: "",
    fecha_llegada: "",
    num_personas_afectadas: 0,
    perdidas_materiales_estimadas: 0,
  });

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Cerrar con ESC y hotkeys Alt+N (registrar), Alt+G (guardar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // ESC: Cerrar form/modal o volver al panel anterior
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (showViewModal) {
          setShowViewModal(false);
          setViewingNovedad(null);
        } else if (showEditModal) {
          setShowEditModal(false);
          setSelectedNovedad(null);
        } else if (showRegistrarForm) {
          setShowRegistrarForm(false);
          resetForm();
        } else {
          onClose();
        }
        return;
      }

      // Alt+N: Abrir formulario de registrar novedad
      if (e.altKey && e.key.toLowerCase() === "n" && canCreate && !showRegistrarForm && !showEditModal && !showViewModal) {
        e.preventDefault();
        e.stopPropagation();
        setShowRegistrarForm(true);
        return;
      }

      // Alt+G: Guardar (submit del formulario activo)
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.stopPropagation();
        // Buscar el formulario activo y hacer submit
        const activeForm = document.querySelector("form");
        if (activeForm && (showRegistrarForm || showEditModal)) {
          activeForm.requestSubmit();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose, showRegistrarForm, showEditModal, showViewModal, canCreate]);

  // Cargar novedades atendidas
  const fetchNovedades = useCallback(async () => {
    if (!turnoId || !personal?.id || !cuadrante?.id) return;

    setLoading(true);
    try {
      const response = await listNovedadesByCuadrante(turnoId, personal.id, cuadrante.id);
      const data = response?.data || response || [];
      setNovedades(Array.isArray(data) ? data : []);
      setSummary(response?.summary || null);
    } catch (error) {
      console.error("Error cargando novedades:", error);
      toast.error("Error al cargar novedades");
      setNovedades([]);
    } finally {
      setLoading(false);
    }
  }, [turnoId, personal?.id, cuadrante?.id]);

  useEffect(() => {
    if (isOpen && turnoId && personal?.id && cuadrante?.id) {
      fetchNovedades();
    }
  }, [isOpen, turnoId, personal?.id, cuadrante?.id, fetchNovedades]);

  // Resetear estados cuando el modal se cierra
  useEffect(() => {
    if (!isOpen) {
      // Limpiar formularios y estados internos al cerrar
      setShowRegistrarForm(false);
      setShowEditModal(false);
      setShowViewModal(false);
      setSelectedNovedad(null);
      setViewingNovedad(null);
      setFormData({
        novedad_id: "",
        prioridad: "MEDIA",
        observaciones: "",
        acciones_tomadas: "",
      });
    }
  }, [isOpen]);

  // Cargar catálogos para el modal de detalle
  const fetchCatalogos = useCallback(async () => {
    try {
      const [unidades, vehic, personal] = await Promise.all([
        listUnidadesOficina(),
        listVehiculos(),
        listPersonalSeguridad(),
      ]);
      setUnidadesOficina(Array.isArray(unidades) ? unidades : []);
      setVehiculos(Array.isArray(vehic) ? vehic : []);
      setPersonalSeguridad(Array.isArray(personal) ? personal : []);
    } catch (err) {
      console.error("Error cargando catálogos:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCatalogos();
    }
  }, [isOpen, fetchCatalogos]);

  // Cargar novedades disponibles cuando se abre el form
  const fetchNovedadesDisponibles = useCallback(async () => {
    if (!turnoId || !personal?.id || !cuadrante?.id) return;

    setLoadingDisponibles(true);
    try {
      const response = await getNovedadesDisponibles(turnoId, personal.id, cuadrante.id);
      const data = response?.data || response || [];
      setNovedadesDisponibles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando novedades disponibles:", error);
      setNovedadesDisponibles([]);
    } finally {
      setLoadingDisponibles(false);
    }
  }, [turnoId, personal?.id, cuadrante?.id]);

  useEffect(() => {
    if (showRegistrarForm) {
      fetchNovedadesDisponibles();
    }
  }, [showRegistrarForm, fetchNovedadesDisponibles]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const resetForm = () => {
    setFormData({
      novedad_id: "",
      prioridad: "MEDIA",
      observaciones: "",
      acciones_tomadas: "",
    });
  };

  /**
   * Formatear errores del backend para mostrar al usuario
   * @param {Object} error - Error de axios
   * @returns {string} - Mensaje de error formateado
   */
  const formatBackendError = (error) => {
    const data = error?.response?.data;
    if (!data) return "Error de conexión con el servidor";

    // Si hay array de errores detallados
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const errorsDetail = data.errors
        .map((e) => `${e.field || e.path || "Campo"}: ${e.msg || e.message || e}`)
        .join("\n");
      return `${data.message || "Error de validación"}:\n${errorsDetail}`;
    }

    return data.message || "Error al procesar la solicitud";
  };

  const handleRegistrarNovedad = async (e) => {
    e.preventDefault();

    if (!formData.novedad_id) {
      toast.error("Seleccione una novedad");
      return;
    }

    setSaving(true);
    try {
      // Obtener prioridad de la novedad seleccionada
      const novedadesYaRegistradasLocal = novedades.map((n) => n.novedad_id);
      const novedadesFiltradasLocal = novedadesDisponibles.filter(
        (n) => !novedadesYaRegistradasLocal.includes(n.id)
      );
      const selectedNovedadData = novedadesFiltradasLocal.find(n => n.id === Number(formData.novedad_id));
      const prioridadFromNovedad = selectedNovedadData?.prioridad || "MEDIA";

      const payload = {
        novedad_id: Number(formData.novedad_id),
        reportado: new Date().toISOString(),
        prioridad: prioridadFromNovedad,
        resultado: "PENDIENTE",
        observaciones: formData.observaciones?.trim() || undefined,
        acciones_tomadas: formData.acciones_tomadas?.trim() || undefined,
      };

      await createNovedadPersonal(turnoId, personal.id, cuadrante.id, payload);
      toast.success("Novedad registrada correctamente");
      setShowRegistrarForm(false);
      resetForm();
      fetchNovedades();
    } catch (error) {
      console.error("Error registrando novedad:", error);
      const msg = formatBackendError(error);
      toast.error(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
    } finally {
      setSaving(false);
    }
  };

  const handleViewNovedad = (novedad) => {
    setViewingNovedad(novedad);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingNovedad(null);
  };

  const handleOpenEdit = async (novedad) => {
    setSelectedNovedad(novedad);

    // Obtener el estado actual de la novedad principal
    const estadoActualId = novedad.novedad?.estado_novedad_id || novedad.estado_novedad_id || 1;

    setEditData({
      estado_novedad_id: estadoActualId,
      resultado: novedad.resultado || "PENDIENTE",
      acciones_tomadas: "", // Siempre vacío - las anteriores ya están en observaciones/historial
      observaciones: novedad.observaciones || "",
      fecha_llegada: "",
      num_personas_afectadas: novedad.novedad?.num_personas_afectadas || 0,
      perdidas_materiales_estimadas: novedad.novedad?.perdidas_materiales_estimadas || 0,
    });
    setShowEditModal(true);
  };

  const handleUpdateNovedad = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      const observacionesOperativo = editData.observaciones?.trim() || "";
      const tieneAcciones = editData.acciones_tomadas?.trim();
      const novedadPrincipalId = selectedNovedad.novedad_id || selectedNovedad.novedad?.id;
      const estadoActualId = selectedNovedad.novedad?.estado_novedad_id || selectedNovedad.estado_novedad_id;
      const nuevoEstadoId = editData.estado_novedad_id ? Number(editData.estado_novedad_id) : null;
      const cambioEstado = nuevoEstadoId && nuevoEstadoId !== estadoActualId;

      // 1. Si hay cambio de estado o acciones tomadas, crear historial
      if (novedadPrincipalId && (tieneAcciones || cambioEstado)) {
        const timestamp = new Date().toLocaleString("es-PE", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const nombrePersonal = formatPersonalNombre(personal?.personal);

        // Construir texto de observaciones para el historial
        let observacionesHistorial = "";
        if (cambioEstado) {
          const estadoNuevo = estadosRol.find((e) => e.id === nuevoEstadoId);
          observacionesHistorial = `[${timestamp} - ${nombrePersonal}] Cambio de estado a: ${estadoNuevo?.nombre || "Nuevo estado"}`;
        }
        if (tieneAcciones) {
          const accionesTexto = `[${timestamp} - ${nombrePersonal}] Acciones: ${editData.acciones_tomadas.trim()}`;
          observacionesHistorial = observacionesHistorial
            ? `${observacionesHistorial}\n${accionesTexto}`
            : accionesTexto;
        }

        try {
          await crearHistorialNovedad(
            novedadPrincipalId,
            observacionesHistorial,
            cambioEstado ? nuevoEstadoId : null
          );
        } catch (historialError) {
          console.error("Error en crearHistorialNovedad:", historialError);
          toast.error("Error al guardar en historial, pero se actualizará el registro local");
        }
      }

      // 2. Actualizar el registro operativo (operativos_personal_novedades)
      const fechaLlegadaPayload = editData.fecha_llegada
        ? new Date(editData.fecha_llegada).toISOString().replace("T", " ").slice(0, 19)
        : undefined;
      const payload = {
        resultado: editData.resultado,
        acciones_tomadas: "", // Limpiar para permitir nuevas acciones
        observaciones: observacionesOperativo,
        num_personas_afectadas: editData.num_personas_afectadas || 0,
        perdidas_materiales_estimadas: editData.perdidas_materiales_estimadas || 0,
        ...(fechaLlegadaPayload ? { fecha_llegada: fechaLlegadaPayload } : {}),
      };

      // Incluir estado_novedad_id si cambió
      if (cambioEstado) {
        payload.estado_novedad_id = nuevoEstadoId;
      }

      await updateNovedadPersonal(turnoId, personal.id, cuadrante.id, selectedNovedad.id, payload);

      toast.success(
        cambioEstado || tieneAcciones
          ? "Novedad actualizada. Cambios registrados en historial."
          : "Novedad actualizada."
      );
      setShowEditModal(false);
      setSelectedNovedad(null);
      fetchNovedades();
    } catch (error) {
      console.error("Error actualizando novedad:", error);
      const msg = formatBackendError(error);
      toast.error(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarNovedad = async (novedad) => {
    const confirmed = window.confirm("¿Eliminar esta novedad de la lista de atendidas?");
    if (!confirmed) return;

    try {
      await deleteNovedadPersonal(turnoId, personal.id, cuadrante.id, novedad.id);
      toast.success("Novedad eliminada");
      fetchNovedades();
    } catch (error) {
      console.error("Error eliminando novedad:", error);
      const msg = formatBackendError(error);
      toast.error(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  
  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  // Filtrar novedades ya registradas
  const novedadesYaRegistradas = novedades.map((n) => n.novedad_id);
  const novedadesFiltradas = novedadesDisponibles.filter(
    (n) => !novedadesYaRegistradas.includes(n.id)
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Patrullaje a Pie - Novedades en {cuadrante?.datosCuadrante?.nombre || "Cuadrante"}
                </h2>
                {/* Indicador de hotkeys */}
                {canCreate && !showRegistrarForm && !showEditModal && (
                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                    Alt+N = Registrar
                  </span>
                )}
                {(showRegistrarForm || showEditModal) && (
                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                    Alt+G = Guardar | ESC = Cancelar
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personal: {formatPersonalNombre(personal?.personal)} • Código: {cuadrante?.datosCuadrante?.cuadrante_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================================== */}
        {/* RESUMEN */}
        {/* ================================================================== */}
        {summary && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Total: <strong>{summary.total || 0}</strong>
              </span>
              {summary.porResultado && (
                <>
                  <span className="text-amber-600">
                    Pendientes: <strong>{summary.porResultado.pendientes || 0}</strong>
                  </span>
                  <span className="text-emerald-600">
                    Resueltas: <strong>{summary.porResultado.resueltas || 0}</strong>
                  </span>
                  <span className="text-purple-600">
                    Escaladas: <strong>{summary.porResultado.escaladas || 0}</strong>
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* TOOLBAR */}
        {/* ================================================================== */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {novedades.length} novedad{novedades.length !== 1 ? "es" : ""} atendida{novedades.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={fetchNovedades}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refrescar"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {canCreate && !showRegistrarForm && novedades.length > 0 && (
            <button
              onClick={() => setShowRegistrarForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800"
            >
              <Plus size={16} />
              Registrar Novedad
            </button>
          )}
        </div>

        {/* ================================================================== */}
        {/* CONTENIDO */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-6">
          {/* Formulario de registrar novedad */}
          {showRegistrarForm && (
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
              <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-4">
                Registrar Novedad Atendida
              </h3>
              <form onSubmit={handleRegistrarNovedad} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Novedad */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Novedad del Sistema *
                    </label>
                    <select
                      value={formData.novedad_id}
                      onChange={(e) => setFormData({ ...formData, novedad_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      disabled={loadingDisponibles}
                    >
                      <option value="">— Seleccione novedad —</option>
                      {novedadesFiltradas.map((n) => (
                        <option key={n.id} value={n.id}>
                          [{n.novedadTipoNovedad?.nombre || "Sin tipo"}] {n.descripcion?.substring(0, 80)}...
                        </option>
                      ))}
                    </select>
                    {loadingDisponibles && (
                      <p className="mt-1 text-xs text-slate-500">Cargando novedades...</p>
                    )}
                    {!loadingDisponibles && novedadesFiltradas.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">No hay novedades disponibles para este cuadrante</p>
                    )}
                  </div>

                  {/* Prioridad (read-only, viene de la novedad seleccionada) */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Prioridad
                    </label>
                    {(() => {
                      const selectedNovedadData = novedadesFiltradas.find(n => n.id === Number(formData.novedad_id));
                      const prioridadConfig = selectedNovedadData ? getPrioridadConfig(selectedNovedadData.prioridad) : null;
                      return (
                        <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white">
                          {prioridadConfig ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadConfig.color}`}>
                              {prioridadConfig.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-sm">Seleccione una novedad</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Acciones tomadas */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Acciones Tomadas
                    </label>
                    <input
                      type="text"
                      value={formData.acciones_tomadas}
                      onChange={(e) => setFormData({ ...formData, acciones_tomadas: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Acciones realizadas..."
                    />
                  </div>

                  {/* Observaciones */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                      placeholder="Observaciones de la atención..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegistrarForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formData.novedad_id}
                    className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Registrar"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de novedades atendidas */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : novedades.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                No hay novedades registradas en este cuadrante
              </p>
              {canCreate && (
                <button
                  onClick={() => setShowRegistrarForm(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800"
                >
                  <Plus size={16} />
                  Registrar primera novedad
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {novedades.map((novedad) => {
                const prioridadConfig = getPrioridadConfig(novedad.prioridad);

                return (
                  <div
                    key={novedad.id}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] overflow-hidden"
                  >
                    {/* Header del card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                          #{novedad.novedad?.novedad_code || novedad.novedad?.id || "---"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleViewNovedad(novedad)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-lg"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(novedad)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Editar/Resolver"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleEliminarNovedad(novedad)}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Badges - Prioridad y Estado */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioridadConfig.color}`}>
                        {prioridadConfig.label}
                      </span>
                      <span 
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          novedad.estadoNovedadPersonal?.color_hex 
                            ? "" 
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                        style={
                          novedad.estadoNovedadPersonal?.color_hex 
                            ? {
                                backgroundColor: `${novedad.estadoNovedadPersonal.color_hex}20`,
                                color: novedad.estadoNovedadPersonal.color_hex
                              }
                            : {}
                        }
                      >
                        {novedad.estadoNovedadPersonal?.nombre || "Sin estado"}
                      </span>
                    </div>
                    
                    {/* Tipo + Subtipo */}
                    <div className="mb-2">
                      <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                        {novedad.novedad?.novedadTipoNovedad?.nombre || "Tipo"} - {novedad.novedad?.novedadSubtipoNovedad?.nombre || "Subtipo"}
                      </p>
                    </div>
                    
                    {/* Dirección */}
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
                        {novedad.novedad?.localizacion
                          ? novedad.novedad?.referencia_ubicacion
                            ? `${novedad.novedad.localizacion} (${novedad.novedad.referencia_ubicacion})`
                            : novedad.novedad.localizacion
                          : novedad.novedad?.referencia_ubicacion || "Sin dirección"}
                      </p>
                    </div>
                    
                    {/* Fechas */}
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>Reportado: {new Date(novedad.reportado).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}</span>
                      </div>
                      {novedad.atendido && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-green-500" />
                          <span>Atendido: {new Date(novedad.atendido).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* FOOTER */}
        {/* ================================================================== */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* MODAL EDITAR/RESOLVER */}
      {/* ================================================================== */}
      {showEditModal && selectedNovedad && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" style={{ overflow: 'hidden' }}>
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Actualizar Novedad
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cambiar estado o agregar información
              </p>
            </div>

            <form onSubmit={handleUpdateNovedad} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Estado actual de la Novedad - solo informativo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado Actual
                </label>
                <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                  <span className="inline-flex px-2 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {selectedNovedad?.novedad?.novedadEstado?.nombre ||
                      estadosRol.find((e) => e.id === Number(editData.estado_novedad_id))?.nombre ||
                      `Estado #${editData.estado_novedad_id}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  El estado se actualiza automáticamente según el Resultado Operativo
                </p>
              </div>

              {/* Hora de Llegada - obligatorio si está vacío */}
              {(() => {
                const fechaLlegadaActual = selectedNovedad?.novedad?.fecha_llegada;
                const yaRegistrada = !!fechaLlegadaActual;
                return (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      !yaRegistrada
                        ? "text-green-700 dark:text-green-400 font-bold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}>
                      Hora de Llegada
                      {!yaRegistrada && <span className="ml-1 text-green-600 dark:text-green-400">★ Requerido</span>}
                    </label>
                    {yaRegistrada ? (
                      <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(fechaLlegadaActual).toLocaleString("es-PE", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                          timeZone: "America/Lima",
                        })}
                      </div>
                    ) : (
                      <input
                        type="datetime-local"
                        value={editData.fecha_llegada || ""}
                        onChange={(e) => setEditData({ ...editData, fecha_llegada: e.target.value })}
                        required
                        className="w-full px-3 py-2 rounded-lg border-2 border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-green-400/40"
                      />
                    )}
                  </div>
                );
              })()}

              {/* Resultado/Estado del operativo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Resultado Operativo
                </label>
                <select
                  value={editData.resultado}
                  onChange={(e) => setEditData({ ...editData, resultado: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {RESULTADOS_NOVEDAD.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Acciones tomadas */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nuevas Acciones Tomadas
                </label>
                <textarea
                  value={editData.acciones_tomadas}
                  onChange={(e) => setEditData({ ...editData, acciones_tomadas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  placeholder="Descripción de acciones realizadas..."
                />
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  Las acciones se guardarán en el historial y este campo quedará vacío para nuevas acciones.
                </p>
              </div>

              {/* Número de Personas Afectadas y Pérdidas Materiales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nro. de Personas Afectadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editData.num_personas_afectadas}
                    onChange={(e) => setEditData({ ...editData, num_personas_afectadas: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pérdidas Materiales (S/)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editData.perdidas_materiales_estimadas}
                    onChange={(e) => setEditData({ ...editData, perdidas_materiales_estimadas: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={editData.observaciones}
                  onChange={(e) => setEditData({ ...editData, observaciones: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  placeholder="Observaciones adicionales..."
                />
              </div>
              </div>

              {/* Botones - fijos en la parte inferior */}
              <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedNovedad(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MODAL VER DETALLE DE NOVEDAD */}
      {/* ================================================================== */}
      {/* IMPORTANTE: Pasar novedadId para que el modal cargue la novedad completa con getNovedadById */}
      {/* No pasar novedad inicial para forzar la carga desde el backend */}
      <NovedadDetalleModal
        novedadId={viewingNovedad?.novedad_id || viewingNovedad?.novedad?.id}
        novedad={null}
        isOpen={showViewModal}
        onClose={handleCloseViewModal}
        showDespacharButton={false}
        unidadesOficina={unidadesOficina}
        vehiculos={vehiculos}
        personalSeguridad={personalSeguridad}
      />
    </div>
  );
}
