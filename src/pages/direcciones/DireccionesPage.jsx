/**
 * File: src/pages/direcciones/DireccionesPage.jsx
 * @version 1.0.0
 * @description Página principal de gestión de direcciones normalizadas
 *
 * FEATURES:
 * - Listado con paginación y filtros avanzados
 * - Búsqueda por dirección completa, número, manzana, lote
 * - Filtros por calle, cuadrante, sector, geocodificada
 * - CRUD completo con validación de sistema dual
 * - Shortcuts de teclado (ALT+N para nueva dirección)
 * - Indicadores visuales de geocodificación
 *
 * @module src/pages/direcciones/DireccionesPage.jsx
 */

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, MapPin, Filter, X, Map as MapIcon, Navigation, RefreshCw } from "lucide-react";
import { listDirecciones, deleteDireccion } from "../../services/direccionesService";
import { listCallesActivas } from "../../services/callesService";
import { useAuthStore } from "../../store/useAuthStore";
import DireccionFormModal from "../../components/direcciones/DireccionFormModal";
import { toast } from "react-hot-toast";

/**
 * DireccionesPage - Página principal de gestión de direcciones
 * @component
 * @category Pages
 * @returns {JSX.Element}
 */
export default function DireccionesPage() {
  // ============================================
  // ESTADO
  // ============================================
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [calles, setCalles] = useState([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [calle_id, setCalleId] = useState("");
  const [geocodificada, setGeocodificada] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDireccion, setSelectedDireccion] = useState(null);

  // Permisos
  const hasPermission = useAuthStore((s) => s.hasAnyPermission);
  const canCreate = hasPermission(["calles.direcciones.create"]);
  const canUpdate = hasPermission(["calles.direcciones.update"]);
  const canDelete = hasPermission(["calles.direcciones.delete"]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDirecciones();
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, calle_id, geocodificada]);

  useEffect(() => {
    loadCalles();
  }, []);

  // Shortcuts de teclado
  useEffect(() => {
    function handleKeyDown(e) {
      // ALT + N = Nueva Dirección
      if (e.altKey && e.key === "n" && canCreate) {
        e.preventDefault();
        setShowCreateModal(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCreate]);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  async function loadDirecciones() {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit,
      };

      if (search) params.search = search;
      if (calle_id) params.calle_id = calle_id;
      if (geocodificada !== "") params.geocodificada = geocodificada;

      const result = await listDirecciones(params);

      console.log("📊 [DireccionesPage] Resultado del API:", result);
      console.log("📊 [DireccionesPage] Items recibidos:", result.items || result.data?.items || []);
      console.log("📊 [DireccionesPage] Total items:", result.pagination?.totalItems || result.data?.pagination?.totalItems);

      setDirecciones(result.items || result.data?.items || []);
      setPagination(result.pagination || result.data?.pagination);
    } catch (err) {
      console.error("Error al cargar direcciones:", err);
      setError("Error al cargar direcciones. Por favor, intente nuevamente.");
      toast.error("Error al cargar direcciones");
    } finally {
      setLoading(false);
    }
  }

  async function loadCalles() {
    try {
      const result = await listCallesActivas();
      setCalles(result || []);
    } catch (err) {
      console.error("Error al cargar calles:", err);
    }
  }

  // ============================================
  // HANDLERS
  // ============================================
  function handleSearch(e) {
    e.preventDefault();
    setCurrentPage(1);
    loadDirecciones();
  }

  function handleClearFilters() {
    setSearch("");
    setCalleId("");
    setGeocodificada("");
    setCurrentPage(1);
  }

  function handleEdit(direccion) {
    setSelectedDireccion(direccion);
    setShowEditModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Está seguro de eliminar esta dirección?")) return;

    try {
      await deleteDireccion(id);
      toast.success("Dirección eliminada exitosamente");
      loadDirecciones();
    } catch (err) {
      console.error("Error al eliminar dirección:", err);
      const errorMsg = err.response?.data?.message || "Error al eliminar dirección";
      toast.error(errorMsg);
    }
  }

  function handleModalClose() {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedDireccion(null);
    loadDirecciones();
  }

  // ============================================
  // UTILIDADES
  // ============================================
  function formatDireccion(dir) {
    if (dir.direccion_completa) return dir.direccion_completa;

    const partes = [];
    if (dir.calle?.nombre_completo) partes.push(dir.calle.nombre_completo);
    if (dir.numero_municipal) partes.push(`N° ${dir.numero_municipal}`);
    if (dir.manzana && dir.lote) partes.push(`Mz. ${dir.manzana} Lt. ${dir.lote}`);
    return partes.join(" ") || "Sin especificar";
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
            Direcciones Normalizadas
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Gestiona el catálogo de direcciones con geocodificación
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            title="Atajo: ALT + N"
          >
            <Plus size={18} />
            Nueva Dirección
          </button>
        )}
      </div>

      {/* ============================================
          MENSAJE DE ERROR
          ============================================ */}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* ============================================
          BÚSQUEDA Y FILTROS
          ============================================ */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Búsqueda principal */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por dirección, número, manzana, lote..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
                showFilters
                  ? "border-primary-600 bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              }`}
            >
              <Filter size={18} />
              Filtros
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
            >
              <Search size={18} />
              Buscar
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentPage(1);
                loadDirecciones();
              }}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              title="Recargar datos"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Calle
                </label>
                <select
                  value={calle_id}
                  onChange={(e) => setCalleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Todas las calles</option>
                  {calles.map((calle) => (
                    <option key={calle.id} value={calle.id}>
                      {calle.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Geocodificación
                </label>
                <select
                  value={geocodificada}
                  onChange={(e) => setGeocodificada(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Todas</option>
                  <option value="1">Con coordenadas GPS</option>
                  <option value="0">Sin coordenadas</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ============================================
          TABLA
          ============================================ */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Dirección Completa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Cuadrante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  GPS
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Cargando direcciones...
                  </td>
                </tr>
              ) : direcciones.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No hay direcciones registradas
                  </td>
                </tr>
              ) : (
                direcciones.map((dir) => (
                  <tr
                    key={dir.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      <div>{formatDireccion(dir)}</div>
                      {dir.urbanizacion && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {dir.urbanizacion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {dir.cuadrante?.cuadrante_code || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {dir.sector?.sector_code || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {dir.geocodificada === 1 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                          <Navigation size={12} />
                          Sí
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <MapIcon size={12} />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(dir)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(dir.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
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
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Mostrando página {pagination.currentPage} de {pagination.totalPages}
              {" • "}
              {pagination.totalItems} direcciones en total
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800"
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
      {showCreateModal && (
        <DireccionFormModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
        />
      )}

      {showEditModal && selectedDireccion && (
        <DireccionFormModal
          isOpen={showEditModal}
          onClose={handleModalClose}
          direccion={selectedDireccion}
        />
      )}
    </div>
  );
}
