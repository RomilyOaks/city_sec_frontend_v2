/**
 * File: src/pages/operativos/vehiculos/NovedadesPorCuadrante.jsx
 * @version 1.0.0
 * @description Página para visualizar y gestionar novedades de un cuadrante operativo
 * @module src/pages/operativos/vehiculos/NovedadesPorCuadrante.jsx
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  AlertTriangle,
  FileText,
  Clock,
  MapPin,
  Car,
  User,
  Calendar,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";

import operativosNovedadesService from "../../../services/operativosNovedadesService.js";
import { 
  listUnidadesOficina,
  listVehiculos,
  listPersonalSeguridad,
} from "../../../services/novedadesService.js";
import { canPerformAction } from "../../../rbac/rbac.js";
import { useAuthStore } from "../../../store/useAuthStore.js";
import RegistrarNovedadForm from "./RegistrarNovedadForm.jsx";
import NovedadDetalleModal from "../../../components/NovedadDetalleModal.jsx";

/**
 * Formatea fecha/hora a formato legible
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Obtiene color según prioridad
 */
const getPrioridadColor = (prioridad) => {
  switch (prioridad) {
    case "URGENTE":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "ALTA":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "MEDIA":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "BAJA":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

/**
 * Obtiene color según estado
 */
const getEstadoColor = (estado) => {
  switch (estado) {
    case 0:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"; // Inactivo
    case 1:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"; // Activo
    case 2:
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"; // Atendido
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

/**
 * Obtiene color según resultado
 */
const getResultColor = (resultado) => {
  switch (resultado) {
    case "PENDIENTE":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "RESUELTO":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "ESCALADO":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "CANCELADO":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
};

/**
 * NovedadesPorCuadrante - Página para mostrar novedades de un cuadrante
 * @component
 */
export default function NovedadesPorCuadrante() {
  const { turnoId, vehiculoId, cuadranteId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  // Permisos
  const canRead = canPerformAction(user, "operativos.vehiculos.novedades.read");
  const canCreate = canPerformAction(user, "operativos.vehiculos.novedades.create");
  const canUpdate = canPerformAction(user, "operativos.vehiculos.novedades.update");
  const canDelete = canPerformAction(user, "operativos.vehiculos.novedades.delete");

  // Estados
  const [novedades, setNovedades] = useState([]);
  const [cuadrante, setCuadrante] = useState(null);
  const [vehiculo, setVehiculo] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNovedad, setEditingNovedad] = useState(null);
  const [viewingNovedad, setViewingNovedad] = useState(null);
  const [deletingNovedad, setDeletingNovedad] = useState(null);
  const [filters, setFilters] = useState({
    estado: "todos",
    prioridad: "todos",
    resultado: "todos",
  });

  // Estados para recursos (para la pestaña RECURSOS del modal)
  const [unidadesOficina, setUnidadesOficina] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [personalSeguridad, setPersonalSeguridad] = useState([]);

  // Cargar datos del cuadrante y novedades
  const fetchNovedades = useCallback(async () => {
    if (!canRead) {
      setError("No tienes permisos para ver novedades");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await operativosNovedadesService.getNovedadesByCuadrante(
        turnoId,
        vehiculoId,
        cuadranteId
      );
      
      console.log("Datos del backend - Novedades:", response);
      
      const novedadesData = response.data || [];
      setNovedades(novedadesData);
      setSummary(response.summary || null);
      
      // Extraer información del cuadrante y vehículo desde cuadranteInfo (SIEMPRE INCLUIDO)
      if (response.cuadranteInfo) {
        console.log("Usando cuadranteInfo:", response.cuadranteInfo);
        setCuadrante(response.cuadranteInfo.cuadrante || null);
        setVehiculo(response.cuadranteInfo.operativoVehiculo?.vehiculo || null);
      } else if (novedadesData.length > 0) {
        // Fallback: extraer de la primera novedad (por si acaso)
        const firstNovedad = novedadesData[0];
        setCuadrante(firstNovedad.cuadranteOperativo?.cuadrante || null);
        setVehiculo(firstNovedad.cuadranteOperativo?.operativoVehiculo?.vehiculo || null);
      }
    } catch (err) {
      console.error("Error cargando novedades:", err);
      setError("Error al cargar novedades del servidor");
    } finally {
      setLoading(false);
    }
  }, [canRead, turnoId, vehiculoId, cuadranteId]);

  // Cargar datos de recursos para el modal
  const fetchRecursos = useCallback(async () => {
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
      console.error("Error cargando recursos:", err);
      // No mostrar error al usuario, solo log
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (turnoId && vehiculoId && cuadranteId) {
      fetchNovedades();
      fetchRecursos(); // Cargar recursos para el modal
    }
  }, [turnoId, vehiculoId, cuadranteId, canRead, fetchNovedades, fetchRecursos]);

  // Navegar hacia atrás
  const handleBack = useCallback(() => {
    navigate(`/operativos/turnos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes`);
  }, [navigate, turnoId, vehiculoId]);

  // Manejar creación de novedad
  const handleCreateNovedad = useCallback(() => {
    setEditingNovedad(null);
    setShowCreateForm(true);
  }, []);

  // Manejar edición de novedad
  const handleEditNovedad = useCallback((novedad) => {
    setEditingNovedad(novedad);
    setShowCreateForm(true);
  }, []);

  // Manejar cierre del formulario
  const handleCloseForm = useCallback(() => {
    setShowCreateForm(false);
    setEditingNovedad(null);
  }, []);

  // Manejar éxito del formulario
  const handleFormSuccess = useCallback(() => {
    setShowCreateForm(false);
    setEditingNovedad(null);
    fetchNovedades();
  }, [fetchNovedades]);

  // Manejar ver detalle de novedad
  const handleViewNovedad = useCallback((novedad) => {
    setViewingNovedad(novedad);
  }, []);

  // Manejar cierre del modal de detalle
  const handleCloseViewModal = useCallback(() => {
    setViewingNovedad(null);
  }, []);

  // Manejar eliminación de novedad (soft delete)
  const handleDeleteNovedad = useCallback(async (novedad) => {
    if (!canDelete) {
      toast.error("No tienes permisos para eliminar novedades");
      return;
    }
    setDeletingNovedad(novedad);
  }, [canDelete]);

  // Confirmar eliminación
  const confirmDeleteNovedad = useCallback(async () => {
    if (!deletingNovedad) return;
    
    try {
      await operativosNovedadesService.deleteNovedad(
        turnoId,
        vehiculoId,
        cuadranteId,
        deletingNovedad.id
      );
      toast.success("Novedad eliminada correctamente");
      setDeletingNovedad(null);
      fetchNovedades();
    } catch (err) {
      console.error("Error eliminando novedad:", err);
      toast.error(err.response?.data?.message || "Error al eliminar novedad");
    }
  }, [deletingNovedad, turnoId, vehiculoId, cuadranteId, fetchNovedades]);

  // Cancelar eliminación
  const cancelDeleteNovedad = useCallback(() => {
    setDeletingNovedad(null);
  }, []);

  // Filtrar novedades
  const filteredNovedades = novedades.filter((novedad) => {
    if (filters.estado !== "todos" && novedad.estado !== parseInt(filters.estado)) {
      return false;
    }
    if (filters.prioridad !== "todos" && novedad.prioridad !== filters.prioridad) {
      return false;
    }
    if (filters.resultado !== "todos" && novedad.resultado !== filters.resultado) {
      return false;
    }
    return true;
  });

  // Manejar hotkey ALT+N para registrar novedad y ESC
  useEffect(() => {
    const handleKeyDown = (event) => {
      // ALT+N para registrar novedad
      if (event.altKey && event.key === 'n') {
        event.preventDefault();
        if (canCreate && filteredNovedades.length > 0) {
          handleCreateNovedad();
        } else if (canCreate && filteredNovedades.length === 0) {
          handleCreateNovedad();
        }
      }
      // ESC: Cerrar modales en orden de prioridad o volver atrás
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();

        // Prioridad 1: Cerrar modal de detalle de novedad
        if (viewingNovedad) {
          handleCloseViewModal();
          return;
        }

        // Prioridad 2: Cerrar modal de confirmación de eliminación
        if (deletingNovedad) {
          cancelDeleteNovedad();
          return;
        }

        // Prioridad 3: Cerrar formulario de registro/edición
        if (showCreateForm) {
          handleCloseForm();
          return;
        }

        // Prioridad 4: Volver al panel anterior
        handleBack();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [canCreate, filteredNovedades.length, handleBack, showCreateForm, handleCloseForm, handleCreateNovedad, viewingNovedad, handleCloseViewModal, deletingNovedad, cancelDeleteNovedad]);

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">
                Cargando novedades...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              <button
                onClick={handleBack}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Volver a Cuadrantes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Volver (ESC)"
              >
                <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Novedades del Cuadrante
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Gestión de novedades atendidas durante el operativo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchNovedades}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Actualizar"
              >
                <RefreshCw size={20} className="text-slate-600 dark:text-slate-300" />
              </button>
              {canCreate && filteredNovedades.length > 0 && (
                <button
                  onClick={handleCreateNovedad}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  title="Registrar Novedad (ALT+N)"
                >
                  <Plus size={18} />
                  Registrar Novedad
                </button>
              )}
            </div>
          </div>

          {/* Información del cuadrante y vehículo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-green-600" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Cuadrante</p>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {cuadrante?.codigo || cuadrante?.cuadrante_code || "-"} - {cuadrante?.nombre || "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Car size={20} className="text-blue-600" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Vehículo</p>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {vehiculo?.placa || "-"} - {vehiculo?.marca} {vehiculo?.modelo}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={20} className="text-purple-600" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Turno</p>
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  Turno #{turnoId}
                </p>
              </div>
            </div>
          </div>

          {/* Resumen estadístico */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {summary.total || 0}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Total Novedades</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {summary.porResultado?.pendientes || 0}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Pendientes</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {summary.porResultado?.resueltas || 0}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">Resueltas</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {summary.porPrioridad?.urgente || 0}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">Urgentes</p>
              </div>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-slate-600 dark:text-slate-300" />
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-50">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Estado
              </label>
              <select
                value={filters.estado}
                onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
              >
                <option value="todos">Todos los estados</option>
                <option value="0">Inactivo</option>
                <option value="1">Activo</option>
                <option value="2">Atendido</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Prioridad
              </label>
              <select
                value={filters.prioridad}
                onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
              >
                <option value="todos">Todas las prioridades</option>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Resultado
              </label>
              <select
                value={filters.resultado}
                onChange={(e) => setFilters({ ...filters, resultado: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
              >
                <option value="todos">Todos los resultados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="RESUELTO">Resuelto</option>
                <option value="ESCALADO">Escalado</option>
                <option value="CANCELADO">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de novedades */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Lista de Novedades ({filteredNovedades.length})
            </h2>
          </div>
          
          {filteredNovedades.length === 0 ? (
            <div className="p-12 text-center">
              <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                Sin novedades registradas
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No hay novedades para este cuadrante con los filtros seleccionados.
              </p>
              {canCreate && (
                <button
                  onClick={handleCreateNovedad}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  title="Registrar Primera Novedad (ALT+N)"
                >
                  <Plus size={18} />
                  Registrar Primera Novedad
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
              {filteredNovedades.map((novedad) => (
                <div
                  key={novedad.id}
                  className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                        {novedad.novedad?.nombre || novedad.novedad?.novedad_code || "Novedad"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {novedad.novedad?.novedad_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => handleViewNovedad(novedad)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg"
                        title="Ver detalle"
                      >
                        <Eye size={14} />
                      </button>
                      {canUpdate && (
                        <button
                          onClick={() => handleEditNovedad(novedad)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg"
                          title="Editar novedad"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteNovedad(novedad)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                          title="Eliminar novedad"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPrioridadColor(novedad.prioridad)}`}>
                      {novedad.prioridad}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getEstadoColor(novedad.estado)}`}>
                      {novedad.estado === 0 ? "Inactivo" : novedad.estado === 1 ? "Activo" : "Atendido"}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getResultColor(novedad.resultado)}`}>
                      {novedad.resultado}
                    </span>
                  </div>
                  
                  {/* Descripción */}
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                    {novedad.novedad?.descripcion || novedad.observaciones || "Sin descripción"}
                  </p>
                  
                  {/* Fechas */}
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>Reportado: {formatDateTime(novedad.reportado)}</span>
                    </div>
                    {novedad.atendido && (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={12} className="text-green-500" />
                        <span>Atendido: {formatDateTime(novedad.atendido)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Observaciones (truncadas) */}
                  {novedad.observaciones && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                        <span className="font-medium">Obs:</span> {novedad.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal del formulario */}
      {showCreateForm && (
        <RegistrarNovedadForm
          turnoId={turnoId}
          vehiculoId={vehiculoId}
          cuadranteId={cuadranteId}
          novedad={editingNovedad}
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Modal de detalle de novedad - Reutilizando NovedadDetalleModal completo */}
      <NovedadDetalleModal
        novedadId={viewingNovedad?.novedad_id || viewingNovedad?.novedad?.id}
        novedad={viewingNovedad?.novedad}
        isOpen={!!viewingNovedad}
        onClose={handleCloseViewModal}
        showDespacharButton={false}
        unidadesOficina={unidadesOficina}
        vehiculos={vehiculos}
        personalSeguridad={personalSeguridad}
      />

      {/* Modal de confirmación de eliminación */}
      {deletingNovedad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                ¿Está seguro que desea eliminar la novedad <strong>{deletingNovedad.novedad?.nombre || deletingNovedad.novedad?.novedad_code}</strong>?
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDeleteNovedad}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteNovedad}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
