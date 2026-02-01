/**
 * File: src/pages/operativos/personal/CuadrantesPersonalModal.jsx
 * @version 1.0.0
 * @description Modal para gestionar cuadrantes asignados a un personal operativo.
 * Permite ver, asignar, registrar salida y eliminar cuadrantes.
 *
 * @author Claude AI
 * @date 2026-01-18
 */

import { useState, useEffect, useCallback } from "react";
import {
  X,
  MapPin,
  Plus,
  Clock,
  LogOut,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

// Servicios
import {
  listCuadrantesByPersonal,
  createCuadrantePersonal,
  updateCuadrantePersonal,
  deleteCuadrantePersonal,
  formatPersonalNombre,
  formatDuracion,
} from "../../../services/operativosPersonalService.js";
import { listCuadrantes } from "../../../services/cuadrantesService.js";

// RBAC
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";
import useBodyScrollLock from "../../../hooks/useBodyScrollLock";

/**
 * CuadrantesPersonalModal
 * Modal para gestionar los cuadrantes de un personal operativo
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {number} props.turnoId - ID del turno operativo
 * @param {Object} props.personal - Objeto del personal operativo seleccionado
 * @param {Function} props.onOpenNovedades - Callback para abrir modal de novedades
 * @param {boolean} props.isNovedadesModalOpen - Si el modal de novedades está abierto (para bloquear ESC)
 */
export default function CuadrantesPersonalModal({
  isOpen,
  onClose,
  turnoId,
  personal,
  onOpenNovedades,
  isNovedadesModalOpen = false,
}) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // Auth y permisos
  const user = useAuthStore((s) => s.user);
  const canCreate = canPerformAction(user, "operativos.personal.cuadrantes.create");
  const canUpdate = canPerformAction(user, "operativos.personal.cuadrantes.update");
  const canDelete = canPerformAction(user, "operativos.personal.cuadrantes.delete");

  // Estados
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAsignarForm, setShowAsignarForm] = useState(false);
  const [cuadrantesDisponibles, setCuadrantesDisponibles] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);

  // Form de asignar cuadrante
  const [formData, setFormData] = useState({
    cuadrante_id: "",
    hora_ingreso: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);

  // Modal de registrar salida
  const [showSalidaModal, setShowSalidaModal] = useState(false);
  const [selectedCuadrante, setSelectedCuadrante] = useState(null);
  const [salidaData, setSalidaData] = useState({
    hora_salida: "",
    observaciones: "",
    incidentes_reportados: "",
  });

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Cerrar con ESC y hotkeys Alt+N (asignar), Alt+G (guardar)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // NO procesar si el modal de Novedades está abierto (lo maneja NovedadesPersonalModal)
      if (isNovedadesModalOpen) return;

      // ESC: Cerrar form/modal o volver al panel anterior
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (showSalidaModal) {
          setShowSalidaModal(false);
          setSelectedCuadrante(null);
        } else if (showAsignarForm) {
          setShowAsignarForm(false);
          resetForm();
        } else {
          onClose();
        }
        return;
      }

      // Alt+N: Abrir formulario de asignar cuadrante
      if (e.altKey && e.key.toLowerCase() === "n" && canCreate && !showAsignarForm && !showSalidaModal) {
        e.preventDefault();
        e.stopPropagation();
        setShowAsignarForm(true);
        return;
      }

      // Alt+G: Guardar (submit del formulario activo)
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        e.stopPropagation();
        // Buscar el formulario activo y hacer submit
        const activeForm = document.querySelector("form");
        if (activeForm && (showAsignarForm || showSalidaModal)) {
          activeForm.requestSubmit();
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose, showAsignarForm, showSalidaModal, canCreate, isNovedadesModalOpen]);

  // Cargar cuadrantes al abrir
  const fetchCuadrantes = useCallback(async () => {
    if (!turnoId || !personal?.id) return;

    setLoading(true);
    try {
      const response = await listCuadrantesByPersonal(turnoId, personal.id);
      const data = response?.data || response || [];
      setCuadrantes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando cuadrantes:", error);
      toast.error("Error al cargar cuadrantes");
      setCuadrantes([]);
    } finally {
      setLoading(false);
    }
  }, [turnoId, personal?.id]);

  useEffect(() => {
    if (isOpen && turnoId && personal?.id) {
      fetchCuadrantes();
    }
  }, [isOpen, turnoId, personal?.id, fetchCuadrantes]);

  // Cargar catálogo de cuadrantes disponibles
  const fetchCuadrantesDisponibles = useCallback(async () => {
    setLoadingCatalogos(true);
    try {
      const response = await listCuadrantes({ limit: 100 });
      const items = response?.items || response?.data || response || [];
      setCuadrantesDisponibles(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error cargando cuadrantes disponibles:", error);
      setCuadrantesDisponibles([]);
    } finally {
      setLoadingCatalogos(false);
    }
  }, []);

  useEffect(() => {
    if (showAsignarForm) {
      fetchCuadrantesDisponibles();
      // Establecer hora actual como default
      const now = new Date();
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setFormData((prev) => ({ ...prev, hora_ingreso: localDateTime }));
    }
  }, [showAsignarForm, fetchCuadrantesDisponibles]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const resetForm = () => {
    setFormData({
      cuadrante_id: "",
      hora_ingreso: "",
      observaciones: "",
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

  const handleAsignarCuadrante = async (e) => {
    e.preventDefault();

    if (!formData.cuadrante_id) {
      toast.error("Seleccione un cuadrante");
      return;
    }
    if (!formData.hora_ingreso) {
      toast.error("Ingrese la hora de ingreso");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        cuadrante_id: Number(formData.cuadrante_id),
        hora_ingreso: new Date(formData.hora_ingreso).toISOString(),
        observaciones: formData.observaciones?.trim() || undefined,
      };

      await createCuadrantePersonal(turnoId, personal.id, payload);
      toast.success("Cuadrante asignado correctamente");
      setShowAsignarForm(false);
      resetForm();
      fetchCuadrantes();
    } catch (error) {
      console.error("Error asignando cuadrante:", error);
      const msg = formatBackendError(error);
      toast.error(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSalida = (cuadrante) => {
    setSelectedCuadrante(cuadrante);
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setSalidaData({
      hora_salida: localDateTime,
      observaciones: cuadrante.observaciones || "",
      incidentes_reportados: cuadrante.incidentes_reportados || "",
    });
    setShowSalidaModal(true);
  };

  const handleRegistrarSalida = async (e) => {
    e.preventDefault();

    if (!salidaData.hora_salida) {
      toast.error("Ingrese la hora de salida");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        hora_salida: new Date(salidaData.hora_salida).toISOString(),
        observaciones: salidaData.observaciones?.trim() || undefined,
        incidentes_reportados: salidaData.incidentes_reportados?.trim() || undefined,
      };

      await updateCuadrantePersonal(turnoId, personal.id, selectedCuadrante.id, payload);
      toast.success("Salida registrada correctamente");
      setShowSalidaModal(false);
      setSelectedCuadrante(null);
      fetchCuadrantes();
    } catch (error) {
      console.error("Error registrando salida:", error);
      const msg = formatBackendError(error);
      toast.error(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarCuadrante = async (cuadrante) => {
    const confirmed = window.confirm(
      `¿Eliminar asignación del cuadrante "${cuadrante.datosCuadrante?.nombre || cuadrante.cuadrante_id}"?`
    );
    if (!confirmed) return;

    try {
      await deleteCuadrantePersonal(turnoId, personal.id, cuadrante.id);
      toast.success("Asignación eliminada");
      fetchCuadrantes();
    } catch (error) {
      console.error("Error eliminando cuadrante:", error);
      const msg = formatBackendError(error);
      toast.error(msg, { duration: 5000, style: { whiteSpace: "pre-line" } });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  // Filtrar cuadrantes ya asignados
  const cuadrantesYaAsignados = cuadrantes.map((c) => c.cuadrante_id);
  const cuadrantesFiltrados = cuadrantesDisponibles.filter(
    (c) => !cuadrantesYaAsignados.includes(c.id)
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Cuadrantes de {formatPersonalNombre(personal?.personal)}
                </h2>
                {/* Indicador de hotkeys */}
                {canCreate && !showAsignarForm && !showSalidaModal && (
                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                    Alt+N = Asignar
                  </span>
                )}
                {(showAsignarForm || showSalidaModal) && (
                  <span className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
                    Alt+G = Guardar | ESC = Cancelar
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestionar cuadrantes asignados
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
        {/* TOOLBAR */}
        {/* ================================================================== */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {cuadrantes.length} cuadrante{cuadrantes.length !== 1 ? "s" : ""} asignado{cuadrantes.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={fetchCuadrantes}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refrescar"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {canCreate && !showAsignarForm && cuadrantes.length > 0 && (
            <button
              onClick={() => setShowAsignarForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800"
            >
              <Plus size={16} />
              Asignar Cuadrante
            </button>
          )}
        </div>

        {/* ================================================================== */}
        {/* CONTENIDO */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-auto p-6">
          {/* Formulario de asignar cuadrante */}
          {showAsignarForm && (
            <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl">
              <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-4">
                Asignar Nuevo Cuadrante
              </h3>
              <form onSubmit={handleAsignarCuadrante} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cuadrante */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Cuadrante *
                    </label>
                    <select
                      value={formData.cuadrante_id}
                      onChange={(e) => setFormData({ ...formData, cuadrante_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      disabled={loadingCatalogos}
                    >
                      <option value="">— Seleccione cuadrante —</option>
                      {cuadrantesFiltrados.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.cuadrante_code} - {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hora ingreso */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Hora de Ingreso *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.hora_ingreso}
                      onChange={(e) => setFormData({ ...formData, hora_ingreso: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
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
                      placeholder="Observaciones del ingreso..."
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAsignarForm(false);
                      resetForm();
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
                    {saving ? "Guardando..." : "Asignar"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de cuadrantes */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : cuadrantes.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                No hay cuadrantes asignados a este personal
              </p>
              {canCreate && (
                <button
                  onClick={() => setShowAsignarForm(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white text-sm font-medium hover:bg-primary-800"
                >
                  <Plus size={16} />
                  Asignar primer cuadrante
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {cuadrantes.map((cuadrante) => {
                const enCurso = !cuadrante.hora_salida;

                return (
                  <div
                    key={cuadrante.id}
                    className={`p-4 rounded-xl border w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] ${
                      enCurso
                        ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      {/* Info del cuadrante */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono font-semibold text-slate-900 dark:text-white">
                            {cuadrante.datosCuadrante?.cuadrante_code || "—"}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {cuadrante.datosCuadrante?.nombre || "Cuadrante"}
                          </span>
                          {enCurso && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                              En curso
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Ingreso: {new Date(cuadrante.hora_ingreso).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                          </span>
                          {cuadrante.hora_salida && (
                            <span className="flex items-center gap-1">
                              <LogOut size={14} />
                              Salida: {new Date(cuadrante.hora_salida).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          )}
                          <span className="font-medium">
                            Duración: {formatDuracion(cuadrante.hora_ingreso, cuadrante.hora_salida)}
                          </span>
                        </div>

                        {cuadrante.observaciones && (
                          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            {cuadrante.observaciones}
                          </p>
                        )}

                        {cuadrante.incidentes_reportados && (
                          <div className="mt-2 flex items-start gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <AlertTriangle size={14} className="text-amber-600 mt-0.5" />
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                              {cuadrante.incidentes_reportados}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-1">
                        {/* Botón Novedades */}
                        {onOpenNovedades && (
                          <button
                            onClick={() => onOpenNovedades(cuadrante)}
                            className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="Ver/Gestionar Novedades"
                          >
                            <AlertTriangle size={16} />
                          </button>
                        )}

                        {/* Botón Registrar Salida */}
                        {canUpdate && enCurso && (
                          <button
                            onClick={() => handleOpenSalida(cuadrante)}
                            className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                            title="Registrar Salida"
                          >
                            <LogOut size={16} />
                          </button>
                        )}

                        {/* Botón Eliminar */}
                        {canDelete && (
                          <button
                            onClick={() => handleEliminarCuadrante(cuadrante)}
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
      {/* MODAL REGISTRAR SALIDA */}
      {/* ================================================================== */}
      {showSalidaModal && selectedCuadrante && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Registrar Salida del Cuadrante
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {selectedCuadrante.datosCuadrante?.cuadrante_code} - {selectedCuadrante.datosCuadrante?.nombre}
              </p>
            </div>

            <form onSubmit={handleRegistrarSalida} className="p-6 space-y-4">
              {/* Hora salida */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hora de Salida *
                </label>
                <input
                  type="datetime-local"
                  value={salidaData.hora_salida}
                  onChange={(e) => setSalidaData({ ...salidaData, hora_salida: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={salidaData.observaciones}
                  onChange={(e) => setSalidaData({ ...salidaData, observaciones: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  placeholder="Observaciones finales..."
                />
              </div>

              {/* Incidentes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Incidentes Reportados
                </label>
                <textarea
                  value={salidaData.incidentes_reportados}
                  onChange={(e) => setSalidaData({ ...salidaData, incidentes_reportados: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white resize-none"
                  placeholder="Descripción de incidentes (si los hubo)..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSalidaModal(false);
                    setSelectedCuadrante(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Registrar Salida"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
