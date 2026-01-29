/**
 * File: src/components/calles/CuadranteVehiculosModal.jsx
 * @version 1.0.0
 * @description Modal para gestionar vehículos asignados a un cuadrante
 * 
 * Funcionalidades:
 * - Listado de vehículos asignados al cuadrante
 * - CRUD completo de asignaciones
 * - Reactivación de soft-deletes
 * - Filtros y búsqueda
 * 
 * @module src/components/calles/CuadranteVehiculosModal.jsx
 */

import { useState, useEffect, useCallback } from "react";
import { 
  X, 
  Car, 
  Plus, 
  Edit2, 
  Trash2, 
  RotateCcw, 
  Search,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle,
  Eye
} from "lucide-react";
import toast from "react-hot-toast";
import cuadranteVehiculoAsignadoService from "../../services/cuadranteVehiculoAsignadoService.js";
import CuadranteVehiculoFormModal from "./CuadranteVehiculoFormModal.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";

/**
 * Modal para gestión de vehículos asignados a cuadrante
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.cuadrante - Datos del cuadrante seleccionado
 * @returns {JSX.Element}
 */
export default function CuadranteVehiculosModal({ isOpen, onClose, cuadrante }) {
  const { can, user } = useAuthStore();

  // Estados principales
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [viewAsignacionData, setViewAsignacionData] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Estados de filtros
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");

  // Permisos
  const canCreate = can("cuadrantes_vehiculos_create");
  const canEdit = can("cuadrantes_vehiculos_update");
  const canDelete = can("cuadrantes_vehiculos_delete");
  const canReactivate = user?.roles?.some(r => r.slug === "super_admin");

  // Cerrar modal de vista (declarado antes de useEffect)
  const handleCloseViewModal = () => {
    setShowViewModal(false);
    setViewAsignacionData(null);
  };

  // Cargar asignaciones
  const cargarAsignaciones = useCallback(async () => {
    if (!cuadrante?.id) return;

    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: search || undefined,
        estado: estado !== "" ? estado : undefined,
        cuadrante_id: cuadrante.id
      };

      let response;
      try {
        // Usar endpoint general con lógica unificada
        response = await cuadranteVehiculoAsignadoService.getAllAsignaciones(params);
      } catch (error) {
        console.error("Error cargando asignaciones:", error);
        throw error;
      }

      // Manejar diferentes estructuras de respuesta
      let asignacionesData, paginationData;

      if (response.data?.data?.asignaciones) {
        asignacionesData = response.data.data.asignaciones;
        paginationData = response.data.data.pagination;
      } else if (response.data?.asignaciones) {
        asignacionesData = response.data.asignaciones;
        paginationData = response.data.pagination;
      } else if (Array.isArray(response.data)) {
        asignacionesData = response.data;
        paginationData = { currentPage: 1, totalPages: 1, total: asignacionesData.length };
      } else {
        asignacionesData = [];
        paginationData = { currentPage: 1, totalPages: 1, total: 0 };
      }

      // Filtrar asignaciones por cuadrante si es necesario
      const asignacionesFiltradas = cuadrante.id 
        ? asignacionesData.filter(asig => asig.cuadrante_id === cuadrante.id)
        : asignacionesData;

      setAsignaciones(asignacionesFiltradas);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error cargando asignaciones:", error);
      
      // Manejo específico de errores del backend
      if (error.response?.status === 500) {
        if (error.response?.data?.error?.includes('Unknown column')) {
          toast.error("Error en el backend: El campo 'cuadrante.codigo' no existe. Debe ser 'cuadrante.cuadrante_code'");
        } else {
          toast.error("Error interno del servidor. Contacte al administrador.");
        }
      } else if (error.response?.status === 404) {
        toast.error("El endpoint no está disponible. Contacte al administrador.");
      } else {
        toast.error("Error al cargar las asignaciones");
      }
    } finally {
      setLoading(false);
    }
  }, [cuadrante?.id, currentPage, search, estado]);

  // Efecto para controlar el scroll del body
  useEffect(() => {
    if (isOpen || showViewModal) {
      // Desactivar scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      // Restaurar scroll del body
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
    };
  }, [isOpen, showViewModal]);

  // Efecto para cargar datos cuando cambia el cuadrante o filtros
  useEffect(() => {
    if (isOpen && cuadrante?.id) {
      cargarAsignaciones();
    }
  }, [isOpen, cuadrante?.id, cargarAsignaciones]);

  // Manejar tecla ESC - solo si no hay formularios abiertos
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        
        // Prioridad: cerrar modales internos primero
        if (showViewModal) {
          handleCloseViewModal();
        } else if (showCreateModal) {
          setShowCreateModal(false);
        } else if (showEditModal) {
          setShowEditModal(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };

    if (isOpen || showViewModal) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose, showCreateModal, showEditModal, showViewModal, handleCloseViewModal]);

  // Hot key ALT + N para nueva asignación (aislado por entorno)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ALT + N solo si el modal principal está abierto y no hay otros modales abiertos
      if (e.altKey && e.key === 'n' && isOpen && !showCreateModal && !showEditModal && !showViewModal && canCreate) {
        e.preventDefault();
        handleCrear();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, showCreateModal, showEditModal, showViewModal, canCreate]);

  // Manejar creación
  const handleCrear = () => {
    setAsignacionSeleccionada(null);
    setShowCreateModal(true);
  };

  // Manejar edición
  const handleEditar = (asignacion) => {
    setAsignacionSeleccionada(asignacion);
    setShowEditModal(true);
  };

  // Manejar eliminación
  const handleEliminar = async (asignacion) => {
    if (!window.confirm(`¿Está seguro de eliminar esta asignación?`)) {
      return;
    }

    try {
      await cuadranteVehiculoAsignadoService.deleteAsignacion(asignacion.id);
      toast.success("Asignación eliminada exitosamente");
      await cargarAsignaciones();
    } catch (error) {
      toast.error("Error al eliminar la asignación");
    }
  };

  // Manejar reactivación
  const handleReactivar = async (asignacion) => {
    if (!window.confirm(
      "¿Está seguro que desea reactivar esta asignación?\n\n" +
      "Esta acción cambiará el estado a ACTIVO y eliminará la marca de eliminación."
    )) {
      return;
    }

    try {
      await cuadranteVehiculoAsignadoService.reactivarAsignacion(asignacion.id);
      toast.success("Asignación reactivada exitosamente");
      await cargarAsignaciones();
    } catch (error) {
      toast.error("Error al reactivar la asignación");
    }
  };

  // Manejar vista de asignación
  const handleViewAsignacion = async (asignacionId) => {
    setViewLoading(true);
    try {
      const response = await cuadranteVehiculoAsignadoService.getAsignacionById(asignacionId);
      
      // Corregir: usar response.data en lugar de response.data.data
      const asignacionData = response.data.data || response.data;
      
      setViewAsignacionData(asignacionData);
      setShowViewModal(true);
    } catch (error) {
      console.error("Error cargando asignación:", error);
      toast.error("Error al cargar los detalles de la asignación");
    } finally {
      setViewLoading(false);
    }
  };

  // Manejar cambio de estado
  const handleCambiarEstado = async (asignacion) => {
    try {
      const nuevoEstado = !asignacion.estado;
      await cuadranteVehiculoAsignadoService.toggleEstado(asignacion.id, nuevoEstado);
      toast.success(`Asignación ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`);
      await cargarAsignaciones();
    } catch (error) {
      toast.error("Error al cambiar el estado");
    }
  };

  // Manejar éxito en formulario
  const handleFormSuccess = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setAsignacionSeleccionada(null);
    cargarAsignaciones();
  };

  // Renderizar estado
  const renderEstado = (asignacion) => {
    if (asignacion.deleted_at) {
      return (
        <button
          onClick={() => handleReactivar(asignacion)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 cursor-pointer transition-colors"
          title="Click para reactivar esta asignación"
        >
          <RotateCcw size={12} />
          Reactivar
        </button>
      );
    }

    // Para activos e inactivos no eliminados: mostrar texto simple
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
        asignacion.estado
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}>
        {asignacion.estado ? "Activo" : "Inactivo"}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Car size={24} className="text-blue-600" />
              Vehículos Asignados - {cuadrante?.nombre || cuadrante?.cuadrante_code}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Sector: {cuadrante?.sector?.sector_code}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Filtros y acciones */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar por placa, marca, modelo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
              
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="1">Activos</option>
                <option value="0">Eliminados</option>
              </select>
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                {pagination && (
                  <>Mostrando {asignaciones.length} de {pagination.total} asignaciones</>
                )}
              </div>
              
              {canCreate && (
                <button
                  onClick={handleCrear}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                  title="Nueva Asignación (ALT + N)"
                >
                  <Plus size={16} />
                  Nueva Asignación
                </button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Observaciones
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Cargando...
                      </div>
                    </td>
                  </tr>
                ) : asignaciones.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <Car size={32} className="text-slate-300" />
                        <span>
                          {estado === "0" 
                            ? "No hay asignaciones eliminadas" 
                            : "No hay vehículos asignados a este cuadrante"
                          }
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  asignaciones.map((asignacion) => (
                    <tr key={asignacion.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <Car size={20} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-white">
                              {asignacion.vehiculo?.placa}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {asignacion.vehiculo?.marca} {asignacion.vehiculo?.modelo}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {renderEstado(asignacion)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {asignacion.observaciones || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {asignacion.deleted_at ? (
                            // Es eliminado (soft-deleted) - mostrar ver y reactivar
                            <>
                              <button
                                onClick={() => handleViewAsignacion(asignacion.id)}
                                className="p-1 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                                title="Ver detalles"
                              >
                                <Eye size={18} />
                              </button>
                              {canReactivate && (
                                <button
                                  onClick={() => handleReactivar(asignacion)}
                                  className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                  title="Reactivar asignación"
                                >
                                  <RotateCcw size={18} />
                                </button>
                              )}
                            </>
                          ) : (
                            // Es activo - mostrar ver, editar y eliminar
                            <>
                              <button
                                onClick={() => handleViewAsignacion(asignacion.id)}
                                className="p-1 text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300"
                                title="Ver detalles"
                              >
                                <Eye size={18} />
                              </button>
                              {canEdit && (
                                <button
                                  onClick={() => handleEditar(asignacion)}
                                  className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Editar asignación"
                                >
                                  <Edit2 size={18} />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => handleEliminar(asignacion)}
                                  className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                  title="Eliminar asignación"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Página {pagination.currentPage} de {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modales */}
        {showCreateModal && (
          <CuadranteVehiculoFormModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleFormSuccess}
            mode="create"
            cuadrante={cuadrante}
          />
        )}

        {showEditModal && (
          <CuadranteVehiculoFormModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            onSuccess={handleFormSuccess}
            mode="edit"
            cuadrante={cuadrante}
            asignacion={asignacionSeleccionada}
          />
        )}

        {/* Modal de Vista */}
        {showViewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                    Detalles de Asignación
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    Información completa de la asignación
                  </p>
                </div>
                <button
                  onClick={handleCloseViewModal}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto p-6">
                {viewLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-slate-600 dark:text-slate-400">Cargando...</span>
                  </div>
                ) : viewAsignacionData ? (
                  <div className="space-y-6">
                    {/* Información del Vehículo */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                        <Car size={16} />
                        Información del Vehículo
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Placa</label>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {viewAsignacionData.vehiculo?.placa || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Marca</label>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {viewAsignacionData.vehiculo?.marca || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Modelo</label>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {viewAsignacionData.vehiculo?.modelo_vehiculo || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información del Cuadrante */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Información del Cuadrante</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Código</label>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {viewAsignacionData.cuadrante?.cuadrante_code || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Nombre</label>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {viewAsignacionData.cuadrante?.nombre || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Estado */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Estado</h3>
                      <div className="flex items-center gap-2">
                        {viewAsignacionData.deleted_at ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            <AlertCircle size={12} />
                            Eliminado
                          </span>
                        ) : viewAsignacionData.estado ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            <CheckCircle size={12} />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            <AlertCircle size={12} />
                            Inactivo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Observaciones */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Observaciones</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {viewAsignacionData.observaciones || 'Sin observaciones'}
                      </p>
                    </div>

                    {/* Auditoría */}
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Auditoría</h3>
                      <div className="space-y-3">
                        {/* Creado por */}
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Creado por: {viewAsignacionData.creadorAsignacion?.nombres && viewAsignacionData.creadorAsignacion?.apellidos 
                                ? `${viewAsignacionData.creadorAsignacion.nombres} ${viewAsignacionData.creadorAsignacion.apellidos}`
                                : viewAsignacionData.creadorAsignacion?.username || 'Sistema'}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {viewAsignacionData.created_at 
                                ? new Date(viewAsignacionData.created_at).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Actualizado por */}
                        {viewAsignacionData.actualizadorAsignacion && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Actualizado por: {viewAsignacionData.actualizadorAsignacion.nombres && viewAsignacionData.actualizadorAsignacion.apellidos 
                                  ? `${viewAsignacionData.actualizadorAsignacion.nombres} ${viewAsignacionData.actualizadorAsignacion.apellidos}`
                                  : viewAsignacionData.actualizadorAsignacion.username}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {viewAsignacionData.updated_at 
                                  ? new Date(viewAsignacionData.updated_at).toLocaleString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Eliminado por */}
                        {viewAsignacionData.deleted_at && viewAsignacionData.eliminadorAsignacion && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                Eliminado por: {viewAsignacionData.eliminadorAsignacion.nombres && viewAsignacionData.eliminadorAsignacion.apellidos 
                                  ? `${viewAsignacionData.eliminadorAsignacion.nombres} ${viewAsignacionData.eliminadorAsignacion.apellidos}`
                                  : viewAsignacionData.eliminadorAsignacion.username}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {viewAsignacionData.deleted_at 
                                  ? new Date(viewAsignacionData.deleted_at).toLocaleString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                  : 'N/A'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600 dark:text-slate-400">No se pudo cargar la información</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-end">
                  <button
                    onClick={handleCloseViewModal}
                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
