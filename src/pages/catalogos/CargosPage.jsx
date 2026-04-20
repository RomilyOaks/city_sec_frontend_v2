/**
 * File: src/pages/catalogos/CargosPage.jsx
 * @version 1.0.0
 * @description Página de gestión de Cargos/Puestos de trabajo
 *
 * @module src/pages/catalogos/CargosPage
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Users,
  Briefcase,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  X,
} from "lucide-react";
import ConfirmModal from "../../components/common/ConfirmModal";
import {
  getCargos,
  deleteCargo,
  restoreCargo,
  getCargosStats,
  checkCargoCanDelete,
  getPersonasAsociadasCargo,
} from "../../services/cargosService.js";
import CargoFormModal from "../../components/catalogos/CargoFormModal";
import CargoViewModal from "../../components/catalogos/CargoViewModal";
import PersonasAsociadasModal from "../../components/catalogos/PersonasAsociadasModal";
import { useAuthStore } from "../../store/useAuthStore";
import { canPerformAction } from "../../rbac/rbac.js";
import { toast } from "react-hot-toast";

function CargosPage() {
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    categoria: "",
    requiere_licencia: "",
    estado: "todos",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPersonasModal, setShowPersonasModal] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState(null);
  const [stats, setStats] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    cargoToDelete: null,
  });

  const { user } = useAuthStore();

  // Permisos
  const canCreate = canPerformAction(user, "catalogos.cargos.create");
  const canRead = canPerformAction(user, "catalogos.cargos.read");
  const canUpdate = canPerformAction(user, "catalogos.cargos.update");
  const canDelete = canPerformAction(user, "catalogos.cargos.delete");

  // Cargar cargos - recibe overrides para leer siempre valores frescos
  const cargarCargos = useCallback(async (overrides = {}) => {
    if (!canRead) return;

    setLoading(true);
    try {
      const { page, limit, inactive, currentFilters } = overrides;

      const filtersData = {
        page: page ?? pagination.page,
        limit: limit ?? pagination.limit,
        activos: !(inactive ?? showInactive),
      };

      const f = currentFilters ?? filters;
      if (f.categoria) {
        filtersData.categoria = f.categoria;
      }
      if (f.requiere_licencia !== "") {
        filtersData.requiere_licencia = f.requiere_licencia === "true";
      }

      const response = await getCargos(filtersData);
      setCargos(response.data.cargos || []);
      setPagination(prev => response.data.pagination || prev);
    } catch (error) {
      console.error("Error cargando cargos:", error);
      toast.error("Error al cargar los cargos");
    } finally {
      setLoading(false);
    }
  }, [canRead, filters, pagination.limit, pagination.page, showInactive]); // dependencias completas

  // Cargar estadísticas
  const cargarStats = useCallback(async () => {
    try {
      const response = await getCargosStats();
      setStats(response.data);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, []);

  // Efectos — reacciona a todos los filtros y pasa valores frescos a cargarCargos
  useEffect(() => {
    if (canRead) {
      cargarCargos({
        page: pagination.page,
        limit: pagination.limit,
        inactive: showInactive,
        currentFilters: filters,
      });
      cargarStats();
    }
  }, [canRead, cargarCargos, cargarStats, pagination.page, pagination.limit, showInactive, filters]);

  // Manejar búsqueda
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Filtrar cargos
  const cargosFiltrados = (cargos || []).filter((cargo) => {
    if (!cargo || !cargo.nombre) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      cargo.nombre.toLowerCase().includes(searchLower) ||
      (cargo.descripcion && cargo.descripcion.toLowerCase().includes(searchLower)) ||
      (cargo.codigo && cargo.codigo.toLowerCase().includes(searchLower)) ||
      (cargo.categoria && cargo.categoria.toLowerCase().includes(searchLower))
    );
  });

  // Manejar vista con doble clic
  const handleRowDoubleClick = (cargo) => {
    setSelectedCargo(cargo);
    setShowViewModal(true);
  };

  // Manejar eliminación
  const handleDelete = async (cargo) => {
    if (!canDelete) {
      toast.error("No tienes permisos para eliminar cargos");
      return;
    }

    try {
      // 1. Verificar si puede eliminar
      const checkResponse = await checkCargoCanDelete(cargo.id);
      
      if (!checkResponse.data.canDelete) {
        // 2. Si no puede eliminar, obtener y mostrar personas asociadas
        try {
          const personasResponse = await getPersonasAsociadasCargo(cargo.id);
          
          if (personasResponse.data && personasResponse.data.total_personas > 0) {
            // Mostrar modal con personas asociadas
            setSelectedCargo(cargo);
            setShowPersonasModal(true);
            return;
          } else {
            // Si no hay personas asociadas, mostrar mensaje genérico
            toast.error(checkResponse.data.reason || "No se puede eliminar este cargo");
            return;
          }
        } catch (error) {
          console.error("Error obteniendo personas asociadas:", error);
          toast.error(checkResponse.data.reason || "No se puede eliminar este cargo");
          return;
        }
      }

      // 3. Si puede eliminar, mostrar confirmación
      setConfirmModal({
        isOpen: true,
        title: "Eliminar Cargo",
        message: `¿Estás seguro de que deseas eliminar el cargo "${cargo.nombre}"? Esta acción se puede revertir.`,
        onConfirm: async () => {
          try {
            await deleteCargo(cargo.id);
            toast.success("Cargo eliminado correctamente");
            cargarCargos();
            cargarStats();
          } catch (error) {
            console.error("Error eliminando cargo:", error);
            if (error.response?.status === 400) {
              toast.error(error.response.data.message || "Error al eliminar el cargo");
            } else if (error.response?.status === 404) {
              toast.error("El cargo no existe");
            } else {
              toast.error("Error al eliminar el cargo");
            }
          } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        },
        cargoToDelete: cargo,
      });
    } catch (error) {
      console.error("Error verificando si puede eliminar:", error);
      toast.error("Error al verificar si puede eliminar el cargo");
    }
  };

  // Manejar restauración
  const handleRestore = async (cargo) => {
    if (!canDelete) {
      toast.error("No tienes permisos para restaurar cargos");
      return;
    }

    try {
      await restoreCargo(cargo.id);
      toast.success("Cargo restaurado correctamente");
      cargarCargos();
      cargarStats();
    } catch (error) {
      console.error("Error restaurando cargo:", error);
      toast.error("Error al restaurar el cargo");
    }
  };

  // Manejar edición
  const handleEdit = (cargo) => {
    if (!canUpdate) {
      toast.error("No tienes permisos para editar cargos");
      return;
    }
    setSelectedCargo(cargo);
    setShowFormModal(true);
  };

  // Manejar nuevo cargo
  const handleNew = () => {
    if (!canCreate) {
      toast.error("No tienes permisos para crear cargos");
      return;
    }
    setSelectedCargo(null);
    setShowFormModal(true);
  };

  // Manejar ver personas asociadas
  const handleViewPersonas = (cargo) => {
    setSelectedCargo(cargo);
    setShowPersonasModal(true);
  };

  // Éxito al guardar
  const handleSuccess = () => {
    setShowFormModal(false);
    setSelectedCargo(null);
    cargarCargos();
    cargarStats();
  };

  // Cambiar página
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (!canRead) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Acceso Denegado
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No tienes permisos para ver los cargos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Cargos y Puestos
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Gestiona los cargos y puestos de trabajo del sistema
          </p>
        </div>
        {canCreate && (
          <button
            onClick={handleNew}
            className="flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cargo
          </button>
        )}
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="w-6 h-6 text-blue-500" />
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Total
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Activos
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.activos}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Briefcase className="w-6 h-6 text-purple-500" />
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Con Licencia
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.conLicencia}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BarChart3 className="w-6 h-6 text-orange-500" />
              <div className="ml-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Categorías
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {Object.keys(stats.porCategoria || {}).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros y Búsqueda */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, descripción, código..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtros */}
          <div className="flex items-center space-x-2">
            <select
              value={filters.categoria}
              onChange={(e) => setFilters(prev => ({ ...prev, categoria: e.target.value }))}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todas las categorías</option>
              <option value="Operativo">Operativo</option>
              <option value="Supervisión">Supervisión</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Técnico">Técnico</option>
              <option value="Dirección">Dirección</option>
              <option value="Apoyo">Apoyo</option>
            </select>

            <select
              value={filters.requiere_licencia}
              onChange={(e) => setFilters(prev => ({ ...prev, requiere_licencia: e.target.value }))}
              className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Todos</option>
              <option value="true">Requiere licencia</option>
              <option value="false">No requiere licencia</option>
            </select>

            <button
              onClick={() => {
                const newValue = !showInactive;
                setShowInactive(newValue);
              }}
              className={`px-3 py-2 rounded-md text-sm ${
                showInactive
                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {showInactive ? "Activos" : "Inactivos"}
            </button>

            <button
              onClick={() => {
                cargarCargos();
                cargarStats();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Cargos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : cargosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Briefcase className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {showInactive 
                ? "No hay cargos inactivos"
                : (searchTerm || filters.categoria || filters.requiere_licencia
                  ? "No se encontraron cargos"
                  : "No hay cargos registrados")
              }
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {showInactive 
                ? "Todos los cargos están activos. No hay cargos eliminados."
                : (searchTerm || filters.categoria || filters.requiere_licencia
                  ? "Intenta con otros filtros de búsqueda"
                  : "Crea tu primer cargo para comenzar")
              }
            </p>
            {!searchTerm && !filters.categoria && !filters.requiere_licencia && canCreate && (
              <button
                onClick={handleNew}
                className="mt-4 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Cargo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nivel
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Salario
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Licencia
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cargosFiltrados.map((cargo) => (
                  <tr 
                    key={cargo.id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onDoubleClick={() => handleRowDoubleClick(cargo)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                          style={{ backgroundColor: cargo.color || "#3B82F6" }}
                        >
                          <Users className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cargo.nombre}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {cargo.codigo}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                        {cargo.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 w-12">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full"
                            style={{ width: `${(cargo.nivel_jerarquico / 10) * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-sm text-gray-900 dark:text-white">
                          {cargo.nivel_jerarquico}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      S/ {cargo.salario_base != null ? parseFloat(cargo.salario_base).toFixed(2) : "0.00"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cargo.requiere_licencia ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {cargo.estado ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Botón para ver personas asociadas */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPersonas(cargo);
                          }}
                          className="text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
                          title="Ver personas asociadas"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        
                        {canUpdate && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(cargo);
                            }}
                            className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          cargo.estado ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(cargo);
                              }}
                              className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(cargo);
                              }}
                              className="text-green-400 hover:text-green-600 dark:hover:text-green-300"
                              title="Restaurar"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-700 dark:text-gray-300">
                Mostrando {cargosFiltrados.length} de {pagination.total} resultados
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Anterior
                </button>
                <span className="px-2 py-1 text-xs">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <CargoFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        cargo={selectedCargo}
        onSuccess={handleSuccess}
      />

      <CargoViewModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        cargo={selectedCargo}
      />

      <PersonasAsociadasModal
        isOpen={showPersonasModal}
        onClose={() => setShowPersonasModal(false)}
        cargoId={selectedCargo?.id}
        cargoNombre={selectedCargo?.nombre}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        icon={Trash2}
      />
    </div>
  );
}

export default CargosPage;