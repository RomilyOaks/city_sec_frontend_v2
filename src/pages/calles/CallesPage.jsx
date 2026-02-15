/**
 * File: src/pages/calles/CallesPage.jsx
 * @version 1.1.0
 * @description Página principal de gestión de calles con tabla, filtros, paginación y CRUD completo
 *
 * CHANGELOG v1.1.0:
 * - ✅ Agregado manejo de errores mejorado
 * - ✅ Shortcuts de teclado (ALT+N, Av.Pag, Re.Pag)
 *
 * @module src/pages/calles/CallesPage.jsx
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit, Trash2, MapPin, Filter, X, Eye } from "lucide-react";
import {
  listCalles,
  deleteCalle,
  listTiposVia,
} from "../../services/callesService";
import { useAuthStore } from "../../store/useAuthStore";
import CalleFormModal from "../../components/calles/CalleFormModal";
import CalleViewModal from "../../components/calles/CalleViewModal";

/**
 * CallesPage - Página principal de gestión de calles
 * @component
 * @category Pages
 * @returns {JSX.Element}
 */
export default function CallesPage() {
  // ============================================
  // ESTADO
  // ============================================
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuthStore();
  const [calles, setCalles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [tiposVia, setTiposVia] = useState([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [tipo_via_id, setTipoViaId] = useState("");
  const [es_principal, setEsPrincipal] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCalle, setSelectedCalle] = useState(null);

  // Permisos
  const canCreate = hasAnyPermission(["calles.calles.create"]);
  const canUpdate = hasAnyPermission(["calles.calles.update"]);
  const canDelete = hasAnyPermission(["calles.calles.delete"]);
  const canReadCuadrantes = hasAnyPermission(["calles.calles_cuadrantes.read"]);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  const loadCalles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir parámetros solo si tienen valor
      const params = {
        page: currentPage,
        limit,
      };

      if (search) params.search = search;
      if (tipo_via_id) params.tipo_via_id = tipo_via_id;
      if (es_principal !== "") params.es_principal = es_principal; // Solo si tiene valor

      const response = await listCalles(params);

      // Manejar diferentes formatos de respuesta
      let callesData = [];
      let paginationData = null;

      // 🔥 NUEVO: Buscar en items primero (Railway devuelve así)
      if (response.items && Array.isArray(response.items)) {
        callesData = response.items;
        paginationData = response.pagination || null;
      } else if (response.data && Array.isArray(response.data)) {
        callesData = response.data;
        paginationData = response.data?.pagination || null;
      }

      setCalles(callesData);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error al cargar calles:", error);
      setError("Error al cargar las calles");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, tipo_via_id, es_principal, limit]);

  async function loadTiposVia() {
    try {
      const data = await listTiposVia();
      setTiposVia(data || []);
    } catch (error) {
      console.error("Error al cargar tipos de vía:", error);
    }
  }

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    loadCalles();
  }, [loadCalles]);

  useEffect(() => {
    loadTiposVia();
  }, []);

  // Shortcuts de teclado
  useEffect(() => {
    function handleKeyDown(e) {
      // ALT + N = Nueva Calle
      if (e.altKey && e.key === "n" && canCreate) {
        e.preventDefault();
        setShowCreateModal(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCreate]);

  // ============================================
  // HANDLERS
  // ============================================
  function handleSearch(e) {
    e.preventDefault();
    setCurrentPage(1);
    loadCalles();
  }

  function handleClearFilters() {
    setSearch("");
    setTipoViaId("");
    setEsPrincipal("");
    setCurrentPage(1);
  }

  function handleView(calle) {
    setSelectedCalle(calle);
    setShowViewModal(true);
  }

  function handleEdit(calle) {
    setSelectedCalle(calle);
    setShowEditModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Está seguro de eliminar esta calle?")) return;

    try {
      await deleteCalle(id);
      alert("Calle eliminada exitosamente");
      loadCalles();
    } catch (error) {
      console.error("Error al eliminar calle:", error);
      alert(error.response?.data?.message || "Error al eliminar calle");
    }
  }

  function handlePageChange(newPage) {
    setCurrentPage(newPage);
  }

  function handleViewCuadrantes(calle) {
    navigate("/calles/calles-cuadrantes", { state: { calle } });
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* ============================================
          HEADER
          ============================================ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Maestro de Calles
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Administra el catálogo de calles del distrito
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            title="Atajo: ALT + N"
          >
            <Plus size={18} />
            Nueva Calle
          </button>
        )}
      </div>

      {/* ============================================
          MENSAJE DE ERROR
          ============================================ */}
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <X size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error al cargar calles
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadCalles();
              }}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          FILTROS Y BÚSQUEDA
          ============================================ */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        {/* Barra de búsqueda y botón de filtros */}
        <div className="flex gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre de calle..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Limpiar búsqueda"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
            >
              Buscar
            </button>
          </form>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Filter size={18} />
            Filtros
          </button>
        </div>

        {/* Panel de filtros avanzados */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tipo de vía */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Vía
              </label>
              <select
                value={tipo_via_id}
                onChange={(e) => {
                  setTipoViaId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {tiposVia.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Vía principal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Vía Principal
              </label>
              <select
                value={es_principal}
                onChange={(e) => {
                  setEsPrincipal(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                <option value="1">Sí</option>
                <option value="0">No</option>
              </select>
            </div>

            {/* Botón limpiar filtros */}
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Limpiar todos los filtros"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          TABLA DE CALLES
          ============================================ */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando...</div>
        ) : calles.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No se encontraron calles
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Urbanización
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Principal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Sentido
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {calles.map((calle) => (
                  <tr
                    key={calle.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {calle.nombre_completo ||
                        `${
                          calle.TipoVia?.nombre || calle.tipoVia?.nombre || ""
                        } ${calle.nombre_via || ""}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {calle.urbanizacion || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {calle.es_principal ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300">
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-800 dark:text-slate-300">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {calle.categoria_via || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {calle.sentido_via ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                          {calle.sentido_via.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-800 dark:text-slate-300">
                          Doble Vía
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(calle)}
                          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          title="Ver información completa"
                        >
                          <Eye size={16} />
                        </button>
                        {canReadCuadrantes && (
                          <button
                            onClick={() => handleViewCuadrantes(calle)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                            title="Ver cuadrantes"
                          >
                            <MapPin size={16} />
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(calle)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(calle.id)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ============================================
            PAGINACIÓN
            ============================================ */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando página {pagination.page} de {pagination.totalPages} (
              {pagination.total} total)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.totalPages}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          MODALES
          ============================================ */}
      <CalleFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadCalles}
        mode="create"
      />

      <CalleFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCalle(null);
        }}
        onSuccess={loadCalles}
        initialData={selectedCalle}
        mode="edit"
      />

      {showViewModal && selectedCalle && (
        <CalleViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCalle(null);
          }}
          calle={selectedCalle}
        />
      )}
    </div>
  );
}
