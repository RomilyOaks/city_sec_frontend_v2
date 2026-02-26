/**
 * File: src/pages/admin/PermisosPage.jsx
 * @version 1.0.0
 * @description Página principal de gestión de permisos del sistema
 */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from "lucide-react";

import {
  listPermisos,
  cambiarEstadoPermiso,
  deletePermiso,
} from "../../services/permisosService.js";
import CrearPermisoModal from "../../components/admin/permisos/CrearPermisoModal.jsx";
import EditarPermisoModal from "../../components/admin/permisos/EditarPermisoModal.jsx";

/**
 * PermisosPage - Página de gestión de permisos
 * @component
 */
export default function PermisosPage() {
  const [permisos, setPermisos] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    modulo: "",
    recurso: "",
    activos: "true",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPermiso, setSelectedPermiso] = useState(null);

  // Cargar permisos
  const loadPermisos = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 50,
        ...filters,
      };
      
      const response = await listPermisos(params);
      setPermisos(response.permisos || []);
      setPagination(response.pagination);
      
      // Extraer módulos únicos para el filtro
      const modulosUnicos = [...new Set(response.permisos?.map(p => p.modulo) || [])]
        .filter(Boolean)
        .sort();
      setModulos(modulosUnicos);
    } catch (error) {
      console.error("Error cargando permisos:", error);
      toast.error("Error al cargar los permisos");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Cambiar estado de permiso
  const handleToggleEstado = async (permiso) => {
    if (permiso.es_sistema) {
      toast.error("No se puede cambiar el estado de un permiso del sistema");
      return;
    }

    try {
      await cambiarEstadoPermiso(permiso.id, !permiso.estado);
      toast.success(`Permiso ${!permiso.estado ? "activado" : "desactivado"} exitosamente`);
      loadPermisos();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      toast.error(error.response?.data?.message || "Error al cambiar estado del permiso");
    }
  };

  // Eliminar permiso
  const handleDelete = async (permiso) => {
    if (permiso.es_sistema) {
      toast.error("No se puede eliminar un permiso del sistema");
      return;
    }

    if (!confirm(`¿Está seguro de eliminar el permiso "${permiso.slug}"?\n\nEsta acción es permanente y puede afectar roles y usuarios que tengan este permiso asignado.`)) {
      return;
    }

    try {
      await deletePermiso(permiso.id);
      toast.success("Permiso eliminado exitosamente");
      loadPermisos();
    } catch (error) {
      console.error("Error eliminando permiso:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el permiso");
    }
  };

  // Editar permiso
  const handleEdit = (permiso) => {
    if (permiso.es_sistema) {
      toast.error("No se puede editar un permiso del sistema");
      return;
    }
    setSelectedPermiso(permiso);
    setShowEditModal(true);
  };

  // Cambiar página
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setFilters({
      search: "",
      modulo: "",
      recurso: "",
      activos: "true",
    });
    setCurrentPage(1);
  };

  // Efectos
  useEffect(() => {
    loadPermisos();
  }, [loadPermisos]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Permisos del Sistema
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestiona los permisos de acceso del sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Nuevo Permiso
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por slug o descripción..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Módulo */}
          <select
            value={filters.modulo}
            onChange={(e) => setFilters(prev => ({ ...prev, modulo: e.target.value }))}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los módulos</option>
            {modulos.map(modulo => (
              <option key={modulo} value={modulo}>{modulo}</option>
            ))}
          </select>

          {/* Recurso */}
          <input
            type="text"
            placeholder="Filtrar por recurso..."
            value={filters.recurso}
            onChange={(e) => setFilters(prev => ({ ...prev, recurso: e.target.value }))}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          {/* Estado */}
          <select
            value={filters.activos}
            onChange={(e) => setFilters(prev => ({ ...prev, activos: e.target.value }))}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
            <option value="">Todos</option>
          </select>
        </div>

        {/* Botones de filtro */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Filter size={14} />
            Limpiar filtros
          </button>
          <button
            onClick={loadPermisos}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Tabla de permisos */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    Cargando permisos...
                  </td>
                </tr>
              ) : permisos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No se encontraron permisos
                  </td>
                </tr>
              ) : (
                permisos.map((permiso) => (
                  <tr key={permiso.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-xs font-mono rounded text-slate-700 dark:text-slate-300">
                          {permiso.slug}
                        </code>
                        {permiso.es_sistema && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Sistema
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50">
                      {permiso.modulo}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50">
                      {permiso.recurso}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50">
                      {permiso.accion}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {permiso.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleEstado(permiso)}
                        disabled={permiso.es_sistema}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          permiso.estado
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        } ${permiso.es_sistema ? "opacity-50 cursor-not-allowed" : "hover:opacity-80"}`}
                      >
                        {permiso.estado ? <Shield size={12} /> : <ShieldOff size={12} />}
                        {permiso.estado ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(permiso)}
                          disabled={permiso.es_sistema}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Editar permiso"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(permiso)}
                          disabled={permiso.es_sistema}
                          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Eliminar permiso"
                        >
                          <Trash2 size={14} />
                        </button>
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
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-1 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreateModal && (
        <CrearPermisoModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPermisos();
          }}
        />
      )}

      {showEditModal && selectedPermiso && (
        <EditarPermisoModal
          permiso={selectedPermiso}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPermiso(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedPermiso(null);
            loadPermisos();
          }}
        />
      )}
    </div>
  );
}
