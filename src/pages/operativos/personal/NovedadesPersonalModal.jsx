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
import { ConfirmModal } from "../../../components/common";

// Usar getNowLocal desde dateHelper (respeta APP_TIMEZONE)

// Servicios
import {
  listNovedadesByCuadrante,
  updateNovedadPersonal,
  deleteNovedadPersonal,
  formatPersonalNombre,
  getPrioridadConfig,
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
import {
  formatForDisplay,
  getNowLocal,
  safeConvertToTimezone,
} from "../../../utils/dateHelper";

// Componentes
import NovedadDetalleModal from "../../../components/NovedadDetalleModal.jsx";
import EyePersonalModal from "./EyePersonalModal.jsx";

/**
 * Función helper para abreviar título de novedad
 */
const abreviarTituloNovedad = (tipoNombre, subtipoNombre) => {
  if (!tipoNombre) return "Novedad";

  // Si no hay subtipo, devolver tipo completo
  if (!subtipoNombre) return tipoNombre;

  // Buscar primer slash en el tipo
  const primerSlashIndex = tipoNombre.indexOf("/");

  if (primerSlashIndex === -1) {
    // Si no hay slash, devolver tipo completo + subtipo
    return `${tipoNombre} / ${subtipoNombre}`;
  }

  // Tomar desde el inicio hasta el primer slash (excluyendo el slash)
  const tipoAbreviado = tipoNombre.substring(0, primerSlashIndex).trim();

  // Concatenar con subtipo completo
  return `${tipoAbreviado} / ${subtipoNombre}`;
};

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
  const canCreate = canPerformAction(
    user,
    "operativos.personal.novedades.create",
  );
  const canUpdate = canPerformAction(
    user,
    "operativos.personal.novedades.update",
  );
  const canDelete = canPerformAction(
    user,
    "operativos.personal.novedades.delete",
  );

  // Estados - Lista principal
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

    
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingNovedad, setDeletingNovedad] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estados - Modal editar/resolver
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);

  // Estados - Modal ver detalle
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingNovedad, setViewingNovedad] = useState(null);

  // Estado para modal EYE
  const [showEyeModal, setShowEyeModal] = useState(false);
  const [selectedEyeOperativo, setSelectedEyeOperativo] = useState(null);

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
    usar_fecha_actual: false,
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
        } else {
          onClose();
        }
        return;
      }

      
      // Alt+G: Guardar (submit del formulario activo)
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.stopPropagation();
        // Buscar el formulario activo y hacer submit
        const activeForm = document.querySelector("form");
        if (activeForm && showEditModal) {
          activeForm.requestSubmit();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    isOpen,
    onClose,
    showEditModal,
    showViewModal,
    canCreate,
  ]);

  // Cargar novedades atendidas
  const fetchNovedades = useCallback(async () => {
    if (!turnoId || !personal?.id || !cuadrante?.id) return;

    setLoading(true);
    try {
      const response = await listNovedadesByCuadrante(
        turnoId,
        personal.id,
        cuadrante.id,
      );
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
      setShowEditModal(false);
      setShowViewModal(false);
      setSelectedNovedad(null);
      setViewingNovedad(null);
      setEditData({
        estado_novedad_id: "",
        resultado: "",
        acciones_tomadas: "",
        observaciones: "",
        fecha_llegada: "",
        usar_fecha_actual: false,
        num_personas_afectadas: 0,
        perdidas_materiales_estimadas: 0,
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

  // ============================================================================
  // HANDLERS
  // ============================================================================

  
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
        .map(
          (e) => `${e.field || e.path || "Campo"}: ${e.msg || e.message || e}`,
        )
        .join("\n");
      return `${data.message || "Error de validación"}:\n${errorsDetail}`;
    }

    return data.message || "Error al procesar la solicitud";
  };

  
  const handleViewNovedad = (novedad) => {
    setViewingNovedad(novedad);
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewingNovedad(null);
  };

  
  // Función helper para detectar si una novedad está RESUELTA
  const esNovedadResuelta = useCallback((novedad) => {
    const resultadoActual = novedad?.resultado;
    const estadoActualId = novedad?.novedad?.estado_novedad_id;
    // Detectar si está RESUELTA por resultado o por estado (ID 6 = RESUELTA)
    return resultadoActual === "RESUELTO" || estadoActualId === 6;
  }, []);

  // 🔥 NUEVA FUNCIÓN: Verificar si se puede editar según nuevas reglas
  // - Si está RESUELTO y atendido IS NULL: permitir editar campos específicos
  // - Si está RESUELTO y atendido tiene dato: solo lectura (ocultar botón pencil)
  const puedeEditarNovedadResuelta = useCallback((novedad) => {
    const resultadoActual = novedad?.resultado;
    const estadoActualId = novedad?.novedad?.estado_novedad_id;
    const atendido = novedad?.atendido;
    
    // Solo aplica si está RESUELTO
    const estaResuelto = resultadoActual === "RESUELTO" || estadoActualId === 6;
    
    if (!estaResuelto) {
      return true; // Si no está resuelto, se puede editar normalmente
    }
    
    // Si está resuelto, verificar si atendido es NULL
    return !atendido; // TRUE si atendido es NULL (puede editar), FALSE si tiene dato (solo lectura)
  }, []);

  // 🔥 FUNCIÓN: Determinar si los campos específicos deben ser de solo lectura
  // - Si está RESUELTO y atendido IS NULL: permitir editar estos campos
  // - Si está RESUELTO y atendido tiene dato: campos de solo lectura
  // - Si no está RESUELTO: comportamiento normal (usar esNovedadResuelta)
  const debeSerReadOnly = useCallback((novedad) => {
    const resultadoActual = novedad?.resultado;
    const estadoActualId = novedad?.novedad?.estado_novedad_id;
    
    // Solo aplica si está RESUELTO (ya no se verifica atendido)
    const estaResuelto = resultadoActual === "RESUELTO" || estadoActualId === 6;
    
    // Si está resuelto, los campos son de solo lectura (excepto acciones_tomadas y observaciones)
    return estaResuelto;
  }, []);

  const handleUpdateNovedad = async (e) => {
    e.preventDefault();

    setSaving(true);
    
    const observacionesOperativo = editData.observaciones?.trim() || "";
    const tieneAcciones = editData.acciones_tomadas?.trim();
    const novedadPrincipalId =
      selectedNovedad.novedad_id || selectedNovedad.novedad?.id;
    const estadoActualId = selectedNovedad.novedad?.estado_novedad_id;
    const nuevoEstadoId = editData.estado_novedad_id
      ? Number(editData.estado_novedad_id)
      : null;
    const cambioEstado = nuevoEstadoId && nuevoEstadoId !== estadoActualId;
    const esResuelta = esNovedadResuelta(selectedNovedad);

    // 2. Preparar payload para actualización (definido antes del try-catch para estar disponible)
    // Usar dateHelper seguro para manejo correcto de timezone
    const fechaLlegadaPayload = editData.fecha_llegada
      ? safeConvertToTimezone(editData.fecha_llegada)
      : undefined;
    let payload = {
      resultado: editData.resultado,
      acciones_tomadas: editData.acciones_tomadas?.trim() || "", // Guardar acciones del formulario
      observaciones: observacionesOperativo,
      num_personas_afectadas: editData.num_personas_afectadas || 0,
      perdidas_materiales_estimadas:
        editData.perdidas_materiales_estimadas || 0,
      ...(fechaLlegadaPayload ? { fecha_llegada: fechaLlegadaPayload } : {}),
    };

    // 🐛 FIX: Simplificar como en vehículos - no enviar estado_novedad_id
    // El backend debería actualizar automáticamente cuando resultado = RESUELTO
    
    
    try {

      // 🎯 CASO ESPECIAL: Novedad RESUELTA - Verificar si se puede editar
      if (esResuelta && !puedeEditarNovedadResuelta(selectedNovedad)) {
        
        // Solo crear historial si hay nuevas observaciones
        const nuevasObservaciones = editData.observaciones?.trim();
        if (
          nuevasObservaciones &&
          nuevasObservaciones !== (selectedNovedad.observaciones || "")
        ) {
          try {
            const fechaLocal = getNowLocal();

            
            await crearHistorialNovedad(
              novedadPrincipalId,
              nuevasObservaciones, // Usar observaciones como mensaje del historial
              null, // No cambiar estado
              fechaLocal,
            );

            toast.success("Información complementaria agregada al historial");
          } catch (historialError) {
            console.error("Error al grabar historial:", historialError);
            toast.error("Error al guardar en historial");
          }
        } else {
          toast.info("No hay cambios para guardar");
        }

        setShowEditModal(false);
        setSelectedNovedad(null);
        fetchNovedades();
        return;
      }

      
        // 🎯 CASO NORMAL: Actualización completa
        // 1. Si hay cambio de estado, crear historial
        if (cambioEstado && novedadPrincipalId) {
          try {
            const timestamp = formatForDisplay(new Date());
            const nombrePersonal = formatPersonalNombre(personal?.personal);
            const estadoNuevo = estadosRol.find((e) => e.id === nuevoEstadoId);

            // Usar getNowLocal() igual que en vehículos para consistencia
            const fechaLocal = getNowLocal();

            // Si hay cambio de estado, enviarlo al historial con fecha local
            await crearHistorialNovedad(
              novedadPrincipalId,
              `[${timestamp} - ${nombrePersonal}] Cambio de estado a: ${estadoNuevo?.nombre || "Nuevo estado"}`,
              nuevoEstadoId,
              fechaLocal, // Agregar fecha_cambio en formato local
            );
          } catch (historialError) {
            console.error("Error en crearHistorialNovedad:", historialError);
            toast.error(
              "Error al guardar en historial, pero se actualizará el registro local",
            );
          }
        }

        await updateNovedadPersonal(
          turnoId,
          personal.id,
          cuadrante.id,
          selectedNovedad.id,
          payload,
        );

        toast.success(
          cambioEstado || tieneAcciones
            ? "Novedad actualizada. Cambios registrados en historial."
            : "Novedad actualizada.",
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

    const handleEliminarNovedad = (novedad) => {
      setDeletingNovedad(novedad);
      setShowDeleteModal(true);
    };

    const handleConfirmDeleteNovedad = async () => {
      if (!deletingNovedad) return;

      setDeleteLoading(true);
      try {
        await deleteNovedadPersonal(
          turnoId,
          personal.id,
          cuadrante.id,
          deletingNovedad.id,
        );
        toast.success("Novedad eliminada");
        fetchNovedades();
        setShowDeleteModal(false);
        setDeletingNovedad(null);
      } catch (error) {
        console.error("Error eliminando novedad:", error);
        const msg = formatBackendError(error);
        toast.error(msg);
      } finally {
        setDeleteLoading(false);
      }
    };

  // Manejar modal EYE para personal
  const handleOpenEdit = useCallback((novedad) => {
    setSelectedNovedad(novedad);

    // Obtener el estado actual de la novedad principal
    const estadoActualId = novedad.novedad?.estado_novedad_id || 1;

    setEditData({
      estado_novedad_id: estadoActualId,
      resultado: novedad.resultado === "PENDIENTE" ? "RESUELTO" : (novedad.resultado || "RESUELTO"),
      acciones_tomadas: "", // Siempre vacío - las anteriores ya están en observaciones/historial
      observaciones: novedad.observaciones || "",
      fecha_llegada: "",
      usar_fecha_actual: false, // Agregar control para checkbox
      num_personas_afectadas: novedad.novedad?.num_personas_afectadas || 0,
      perdidas_materiales_estimadas:
        novedad.novedad?.perdidas_materiales_estimadas || 0,
    });
    setShowEditModal(true);
  }, []);

  // Abrir modal EYE
  const handleEyeOperativo = useCallback((novedad) => {
    setSelectedEyeOperativo(novedad);
    setShowEyeModal(true);
  }, []);

  // Cerrar modal EYE
  const handleCloseEyeModal = useCallback(() => {
    setShowEyeModal(false);
    setSelectedEyeOperativo(null);
  }, []);

  // ============================================================================
  // HELPERS
  // ============================================================================

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  
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
                  Patrullaje a Pie - Novedades en{" "}
                  {cuadrante?.datosCuadrante?.nombre || "Cuadrante"}
                </h2>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personal: {formatPersonalNombre(personal?.personal)} • Código:{" "}
                {cuadrante?.datosCuadrante?.cuadrante_code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* ================================================================== */}
        {/* RESUMEN */}
        {/* ================================================================== */}
        {summary && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
            {/* Mobile: Stack layout, Desktop: Side by side */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Total: <strong>{summary.total || 0}</strong>
                </span>
                {summary.porResultado && (
                  <>
                    <span className="text-amber-600">
                      Pendientes:{" "}
                      <strong>{summary.porResultado.pendientes || 0}</strong>
                    </span>
                    <span className="text-emerald-600">
                      Resueltas:{" "}
                      <strong>{summary.porResultado.resueltas || 0}</strong>
                    </span>
                    <span className="text-purple-600">
                      Escaladas:{" "}
                      <strong>{summary.porResultado.escaladas || 0}</strong>
                    </span>
                  </>
                )}
                <span className="text-slate-600 dark:text-slate-400">
                  {novedades.length} novedad{novedades.length !== 1 ? "es" : ""}{" "}
                  atendida{novedades.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchNovedades}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm"
                  title="Refrescar"
                >
                  <RefreshCw size={14} />
                  <span className="hidden sm:inline">Refrescar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* CONTENIDO */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-6">
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
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {novedades.map((novedad) => {
                const prioridadConfig = getPrioridadConfig(novedad.prioridad);

                return (
                  <div
                    key={novedad.id}
                    role="button"
                    onClick={(e) => {
                      if (e.target.closest("button")) return;
                      handleViewNovedad(novedad);
                    }}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] overflow-hidden cursor-pointer"
                  >
                    {/* Header del card */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                          #
                          {novedad.novedad?.novedad_code ||
                            novedad.novedad?.id ||
                            "---"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {canUpdate && puedeEditarNovedadResuelta(novedad) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(novedad);
                            }}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20 rounded-lg"
                            title="Editar/Resolver"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEyeOperativo(novedad);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Consultar Operativo (READ ONLY)"
                        >
                          <Eye size={14} />
                        </button>
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEliminarNovedad(novedad);
                            }}
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
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioridadConfig.color}`}
                      >
                        {prioridadConfig.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          novedad.novedad?.novedadEstado?.color_hex
                            ? ""
                            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                        style={
                          novedad.novedad?.novedadEstado?.color_hex
                            ? {
                                backgroundColor: `${novedad.novedad.novedadEstado.color_hex}20`,
                                color: novedad.novedad.novedadEstado.color_hex,
                              }
                            : {}
                        }
                      >
                        {novedad.novedad?.novedadEstado?.nombre || "Sin estado"}
                      </span>
                    </div>

                    {/* Tipo + Subtipo */}
                    <div className="mb-2">
                      <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                        {abreviarTituloNovedad(
                          novedad.novedad?.novedadTipoNovedad?.nombre,
                          novedad.novedad?.novedadSubtipoNovedad?.nombre,
                        )}
                      </p>
                    </div>

                    {/* Dirección */}
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 dark:text-slate-400 break-words">
                        {novedad.novedad?.localizacion
                          ? novedad.novedad?.referencia_ubicacion
                            ? `${novedad.novedad.localizacion} (${novedad.novedad.referencia_ubicacion})`
                            : novedad.novedad.localizacion
                          : novedad.novedad?.referencia_ubicacion ||
                            "Sin dirección"}
                      </p>
                    </div>

                    {/* Fechas */}
                    <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>
                          Despachado: {formatForDisplay(novedad.reportado)}
                        </span>
                      </div>
                      {novedad.atendido && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={12} className="text-green-500" />
                          <span>
                            Atendido: {formatForDisplay(novedad.atendido)}
                          </span>
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
      {/* Modal de Edición */}
      {showEditModal && selectedNovedad && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          style={{ overflow: "hidden" }}
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Actualizar Novedad
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cambiar estado o agregar información
              </p>
            </div>

            <form
              onSubmit={handleUpdateNovedad}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Estado actual de la Novedad - solo informativo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Estado Actual
                  </label>
                  <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center gap-2">
                    <span className="inline-flex px-2 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      {selectedNovedad?.novedad?.novedadEstado?.nombre ||
                        estadosRol.find(
                          (e) => e.id === Number(editData.estado_novedad_id),
                        )?.nombre ||
                        `Estado #${editData.estado_novedad_id}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    El estado se actualiza automáticamente según el Resultado
                    Operativo
                  </p>
                </div>

                {/* Hora de Llegada - obligatorio si está vacío */}
                {(() => {
                  const fechaLlegadaActual =
                    selectedNovedad?.novedad?.fecha_llegada;
                  const yaRegistrada = !!fechaLlegadaActual;
                  return (
                    <div>
                      <label
                        className={`block text-sm font-medium mb-1 ${
                          !yaRegistrada
                            ? "text-green-700 dark:text-green-400 font-bold"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        Hora de Llegada
                        {!yaRegistrada && (
                          <span className="ml-1 text-green-600 dark:text-green-400">
                            ★ Requerido
                          </span>
                        )}
                      </label>
                      {yaRegistrada ? (
                        <div className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-300">
                          {formatForDisplay(fechaLlegadaActual)}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Checkbox para usar fecha actual */}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="usar_fecha_actual"
                              checked={editData.usar_fecha_actual}
                              onChange={(e) => {
                                const usarActual = e.target.checked;
                                setEditData({
                                  ...editData,
                                  usar_fecha_actual: usarActual,
                                  fecha_llegada: usarActual ? getNowLocal() : "",
                                });
                              }}
                              className="mr-2 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                            />
                            <label 
                              htmlFor="usar_fecha_actual" 
                              className="text-sm text-slate-700 dark:text-slate-300 cursor-pointer"
                            >
                              Usar fecha y hora actual
                            </label>
                          </div>
                          
                          {/* Campo de fecha/hora */}
                          {!editData.usar_fecha_actual && (
                            <div className="relative">
                              <input
                                type="datetime-local"
                                value={editData.fecha_llegada || ""}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    fecha_llegada: e.target.value,
                                  })
                                }
                                required
                                className="w-full px-3 py-2 rounded-lg border-2 border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-green-400/40"
                              />
                              {/* Botón del calendario mejorado para dark mode */}
                              <style jsx>{`
                                input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                                  filter: invert(0.5);
                                  cursor: pointer;
                                  border-radius: 4px;
                                  margin-right: 4px;
                                }
                                input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
                                  filter: invert(0.8);
                                  background-color: rgba(34, 197, 94, 0.1);
                                }
                                .dark input[type="datetime-local"]::-webkit-calendar-picker-indicator {
                                  filter: invert(0.8);
                                }
                                .dark input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
                                  filter: invert(1);
                                  background-color: rgba(34, 197, 94, 0.2);
                                }
                              `}</style>
                            </div>
                          )}
                          
                          {/* Mostrar fecha actual cuando está seleccionada */}
                          {editData.usar_fecha_actual && (
                            <div className="w-full px-3 py-2 rounded-lg border border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/30 text-sm text-green-700 dark:text-green-300">
                              {formatForDisplay(getNowLocal())}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Resultado/Estado del operativo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Resultado Operativo
                    {esNovedadResuelta(selectedNovedad) && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        (Solo lectura - Novedad resuelta)
                      </span>
                    )}
                  </label>
                  <select
                    value={editData.resultado}
                    onChange={(e) =>
                      setEditData({ ...editData, resultado: e.target.value })
                    }
                    disabled={esNovedadResuelta(selectedNovedad)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      esNovedadResuelta(selectedNovedad)
                        ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    }`}
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
                    {debeSerReadOnly(selectedNovedad) && (
                      <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                        (Solo lectura - Novedad ya atendida)
                      </span>
                    )}
                  </label>
                  <textarea
                    value={editData.acciones_tomadas}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        acciones_tomadas: e.target.value,
                      })
                    }
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border resize-none border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white`}
                    placeholder="Descripción de acciones realizadas..."
                  />
                  <p
                    className={`mt-1 text-xs ${
                      debeSerReadOnly(selectedNovedad)
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {debeSerReadOnly(selectedNovedad)
                      ? "Esta novedad ya fue atendida y registrada."
                      : "Las acciones se guardarán en el historial de la novedad."}
                  </p>
                </div>

                {/* Número de Personas Afectadas y Pérdidas Materiales */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nro. de Personas Afectadas
                      {debeSerReadOnly(selectedNovedad) && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          (Solo lectura)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editData.num_personas_afectadas}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          num_personas_afectadas: parseInt(e.target.value) || 0,
                        })
                      }
                      disabled={debeSerReadOnly(selectedNovedad)}
                                            className={`w-full px-3 py-2 rounded-lg border ${
                        debeSerReadOnly(selectedNovedad)
                          ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Pérdidas Materiales Estimadas (S/)
                      {debeSerReadOnly(selectedNovedad) && (
                        <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          (Solo lectura)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editData.perdidas_materiales_estimadas}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          perdidas_materiales_estimadas:
                            parseFloat(e.target.value) || 0,
                        })
                      }
                      disabled={debeSerReadOnly(selectedNovedad)}
                                            className={`w-full px-3 py-2 rounded-lg border ${
                        debeSerReadOnly(selectedNovedad)
                          ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
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
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        observaciones: e.target.value,
                      })
                    }
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
                    setEditData({
                      estado_novedad_id: "",
                      resultado: "",
                      acciones_tomadas: "",
                      observaciones: "",
                      fecha_llegada: "",
                      usar_fecha_actual: false,
                      num_personas_afectadas: 0,
                      perdidas_materiales_estimadas: 0,
                    });
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
                    {saving ? "Guardando..." : "Grabar"}{" "}
                    <span className="text-xs opacity-75">(ALT+G)</span>
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

      {/* Modal Confirmar Eliminación */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingNovedad(null);
        }}
        onConfirm={handleConfirmDeleteNovedad}
        title="Eliminar Novedad"
        message="¿Está seguro de eliminar esta novedad de la lista de atendidas?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        loading={deleteLoading}
        disabled={deleteLoading}
      />

      {/* Modal EYE para personal */}
      <EyePersonalModal
        isOpen={showEyeModal}
        onClose={handleCloseEyeModal}
        cuadranteId={cuadrante?.id}
        operativoId={selectedEyeOperativo?.id}
      />
    </div>
  );
}
