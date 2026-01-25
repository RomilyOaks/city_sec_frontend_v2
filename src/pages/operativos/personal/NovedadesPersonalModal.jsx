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
  getResultadoConfig,
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

  const [editData, setEditData] = useState({
    resultado: "",
    acciones_tomadas: "",
    observaciones: "",
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

  const handleOpenEdit = (novedad) => {
    setSelectedNovedad(novedad);
    setEditData({
      resultado: novedad.resultado || "PENDIENTE",
      acciones_tomadas: "", // Siempre vacío - las anteriores ya están en observaciones/historial
      observaciones: novedad.observaciones || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateNovedad = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      // 1. Preparar observaciones locales para operativos_personal_novedades
      let observacionesOperativo = editData.observaciones?.trim() || "";

      // 2. Si hay acciones tomadas, las grabamos en historial_estado_novedades
      const tieneAcciones = editData.acciones_tomadas?.trim();
      const novedadPrincipalId = selectedNovedad.novedad_id || selectedNovedad.novedad?.id;

      // 🔍 DEBUG: Ver estructura de selectedNovedad
      console.log("🔍 DEBUG handleUpdateNovedad - selectedNovedad:", selectedNovedad);
      console.log("🔍 DEBUG handleUpdateNovedad - selectedNovedad.novedad_id:", selectedNovedad.novedad_id);
      console.log("🔍 DEBUG handleUpdateNovedad - selectedNovedad.novedad?.id:", selectedNovedad.novedad?.id);
      console.log("🔍 DEBUG handleUpdateNovedad - novedadPrincipalId:", novedadPrincipalId);
      console.log("🔍 DEBUG handleUpdateNovedad - tieneAcciones:", tieneAcciones);
      console.log("🔍 DEBUG handleUpdateNovedad - editData:", editData);

      if (tieneAcciones && novedadPrincipalId) {
        const timestamp = new Date().toLocaleString("es-PE", {
          dateStyle: "short",
          timeStyle: "short"
        });

        // Obtener el personal que realiza la acción
        const nombrePersonal = formatPersonalNombre(personal?.personal);
        const accionesTexto = `[${timestamp} - ${nombrePersonal}] Acciones: ${editData.acciones_tomadas.trim()}`;

        // Estado de la novedad principal (si no está definido, usar 2=DESPACHADO ya que está siendo atendida)
        const estadoNovedadId = selectedNovedad.novedad?.estado_novedad_id || 2;

        console.log("🔍 DEBUG - Llamando a crearHistorialNovedad con:");
        console.log("   - novedadPrincipalId:", novedadPrincipalId);
        console.log("   - estadoNovedadId:", estadoNovedadId);
        console.log("   - accionesTexto:", accionesTexto);
        console.log("   - user?.id:", user?.id);

        // Crear entrada en historial_estado_novedades
        try {
          const resultadoHistorial = await crearHistorialNovedad(novedadPrincipalId, {
            estado_anterior_id: estadoNovedadId,
            estado_nuevo_id: estadoNovedadId, // Mismo estado - solo registramos acciones, no cambiamos estado
            observaciones: accionesTexto,
            tiempo_en_estado_min: 0,
            created_by: user?.id || null,
          });
          console.log("✅ crearHistorialNovedad - Resultado:", resultadoHistorial);
        } catch (historialError) {
          console.error("❌ Error en crearHistorialNovedad:", historialError);
          console.error("❌ Error response:", historialError.response?.data);
          // No lanzar el error, continuar con la actualización del operativo
          toast.error("Error al guardar en historial, pero se actualizará el registro local");
        }

        console.log("✅ Acciones grabadas en historial_estado_novedades para novedad:", novedadPrincipalId);
      } else {
        console.log("⚠️ No se grabó historial porque:");
        console.log("   - tieneAcciones:", tieneAcciones);
        console.log("   - novedadPrincipalId:", novedadPrincipalId);
      }

      // 3. Actualizar el registro operativo (operativos_personal_novedades)
      const payload = {
        resultado: editData.resultado,
        acciones_tomadas: "", // Limpiar para permitir nuevas acciones
        observaciones: observacionesOperativo,
      };

      await updateNovedadPersonal(turnoId, personal.id, cuadrante.id, selectedNovedad.id, payload);

      toast.success(
        tieneAcciones
          ? "Novedad actualizada. Acciones registradas en historial."
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

  const getResultadoIcon = (resultado) => {
    switch (resultado) {
      case "RESUELTO":
        return <CheckCircle size={16} className="text-emerald-600" />;
      case "ESCALADO":
        return <ArrowUpCircle size={16} className="text-purple-600" />;
      case "CANCELADO":
        return <XCircle size={16} className="text-slate-600" />;
      default:
        return <Clock size={16} className="text-amber-600" />;
    }
  };

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
                const resultadoConfig = getResultadoConfig(novedad.resultado);

                return (
                  <div
                    key={novedad.id}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
                  >
                    <div className="flex items-start justify-between">
                      {/* Info de la novedad */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getResultadoIcon(novedad.resultado)}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadConfig.color}`}>
                            {prioridadConfig.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultadoConfig.color}`}>
                            {resultadoConfig.label}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Reportado: {new Date(novedad.reportado).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          {novedad.atendido && (
                            <span className="text-xs text-emerald-600">
                              Atendido: {new Date(novedad.atendido).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          )}
                        </div>

                        {/* Descripción de la novedad del sistema */}
                        <p className="text-sm text-slate-900 dark:text-white mb-2">
                          <span className="font-medium text-slate-600 dark:text-slate-400">
                            [{novedad.novedad?.novedadTipoNovedad?.nombre || "Novedad"}]
                          </span>{" "}
                          {novedad.novedad?.descripcion || "Sin descripción"}
                        </p>

                        {/* Acciones tomadas */}
                        {novedad.acciones_tomadas && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            <strong>Acciones:</strong> {novedad.acciones_tomadas}
                          </p>
                        )}

                        {/* Observaciones */}
                        {novedad.observaciones && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            <strong>Obs:</strong> {novedad.observaciones}
                          </p>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={() => handleViewNovedad(novedad)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                          title="Ver detalle de la novedad"
                        >
                          <Eye size={16} />
                        </button>
                        {canUpdate && (
                          <button
                            onClick={() => handleOpenEdit(novedad)}
                            className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            title="Editar/Resolver"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleEliminarNovedad(novedad)}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Actualizar Novedad
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cambiar estado o agregar información
              </p>
            </div>

            <form onSubmit={handleUpdateNovedad} className="p-6 space-y-4">
              {/* Resultado/Estado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estado
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

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-2">
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
