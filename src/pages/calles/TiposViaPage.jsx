/**
 * File: src/pages/calles/TiposViaPage.jsx
 * @version 1.0.0
 * @description Página principal de gestión de tipos de vía con tabla, filtros, paginación y CRUD completo
 * @module src/pages/calles/TiposViaPage.jsx
 */

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Type, X } from "lucide-react";
import {
  listTiposVia,
  deleteTipoVia,
} from "../../services/tiposViaService";
import { useAuthStore } from "../../store/useAuthStore";
import TipoViaFormModal from "../../components/calles/TipoViaFormModal";

/**
 * TiposViaPage - Página principal de gestión de tipos de vía
 * @component
 * @category Pages
 * @returns {JSX.Element}
 */
export default function TiposViaPage() {
  // ============================================
  // ESTADO
  // ============================================
  const [tiposVia, setTiposVia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState("orden"); // "orden" | "nombre" | "codigo"

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTipoVia, setSelectedTipoVia] = useState(null);

  // Permisos
  const hasPermission = useAuthStore((s) => s.hasAnyPermission);
  const canCreate = hasPermission(["calles.tipos_via.create"]);
  const canUpdate = hasPermission(["calles.tipos_via.update"]);
  const canDelete = hasPermission(["calles.tipos_via.delete"]);

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    loadTiposVia();
  }, [currentPage, search, orderBy]);

  // Shortcuts de teclado
  useEffect(() => {
    function handleKeyDown(e) {
      // ALT + N = Nuevo Tipo de Vía
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
  async function loadTiposVia() {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit,
      };

      if (search) params.search = search;

      console.log("📡 Llamando listTiposVia con params:", params);
      const response = await listTiposVia(params);
      console.log("📦 Respuesta completa del backend:", response);

      // Manejar diferentes formatos de respuesta
      let tiposViaData = [];
      let paginationData = null;

      if (response.items && Array.isArray(response.items)) {
        tiposViaData = response.items;
        paginationData = response.pagination || null;
      } else if (response.data && Array.isArray(response.data)) {
        tiposViaData = response.data;
        paginationData = response.pagination || null;
      } else if (Array.isArray(response)) {
        tiposViaData = response;
      } else {
        console.warn("⚠️ Formato de respuesta desconocido:", response);
        tiposViaData = [];
      }

      console.log("✅ Tipos de vía procesados:", tiposViaData.length);

      // Ordenar los datos según el criterio seleccionado
      const sortedData = [...tiposViaData].sort((a, b) => {
        if (orderBy === "orden") {
          // Ordenar por orden (números menores primero, null/undefined al final)
          const ordenA = a.orden ?? 999999;
          const ordenB = b.orden ?? 999999;
          return ordenA - ordenB;
        } else if (orderBy === "nombre") {
          // Ordenar alfabéticamente por nombre
          return (a.nombre || "").localeCompare(b.nombre || "");
        } else if (orderBy === "codigo") {
          // Ordenar alfabéticamente por código
          return (a.codigo || "").localeCompare(b.codigo || "");
        }
        return 0;
      });

      setTiposVia(sortedData);
      setPagination(paginationData);
    } catch (error) {
      console.error("❌ Error al cargar tipos de vía:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Error al cargar tipos de vía"
      );
      setTiposVia([]);
    } finally {
      setLoading(false);
    }
  }

  // ============================================
  // HANDLERS
  // ============================================
  function handleSearch(e) {
    e.preventDefault();
    setCurrentPage(1);
    loadTiposVia();
  }

  function handleClearSearch() {
    setSearch("");
    setCurrentPage(1);
  }

  function handleEdit(tipoVia) {
    setSelectedTipoVia(tipoVia);
    setShowEditModal(true);
  }

  async function handleDelete(id) {
    if (!window.confirm("¿Está seguro de eliminar este tipo de vía?")) return;

    try {
      await deleteTipoVia(id);
      alert("Tipo de vía eliminado exitosamente");
      loadTiposVia();
    } catch (error) {
      console.error("Error al eliminar tipo de vía:", error);
      alert(error.response?.data?.message || "Error al eliminar tipo de vía");
    }
  }

  function handlePageChange(newPage) {
    setCurrentPage(newPage);
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
            Tipos de Vía
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Administra el catálogo de tipos de vía del sistema
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            title="Atajo: ALT + N"
          >
            <Plus size={18} />
            Nuevo Tipo de Vía
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
                Error al cargar tipos de vía
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
            <button
              onClick={() => {
                setError(null);
                loadTiposVia();
              }}
              className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ============================================
          BÚSQUEDA Y ORDENAMIENTO
          ============================================ */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o abreviatura..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-10 pr-10 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Limpiar búsqueda"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            title="Ordenar por"
          >
            <option value="orden">Ordenar por: Orden</option>
            <option value="nombre">Ordenar por: Nombre</option>
            <option value="codigo">Ordenar por: Código</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* ============================================
          TABLA DE TIPOS DE VÍA
          ============================================ */}
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando...</div>
        ) : tiposVia.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No se encontraron tipos de vía
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Orden
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Abreviatura
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-300 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tiposVia.map((tipoVia) => (
                  <tr
                    key={tipoVia.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {tipoVia.orden || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {tipoVia.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/30 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:text-primary-300">
                        {tipoVia.abreviatura}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {tipoVia.descripcion || "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(tipoVia)}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(tipoVia.id)}
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
      <TipoViaFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadTiposVia}
        mode="create"
      />

      <TipoViaFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedTipoVia(null);
        }}
        onSuccess={loadTiposVia}
        initialData={selectedTipoVia}
        mode="edit"
      />
    </div>
  );
}
