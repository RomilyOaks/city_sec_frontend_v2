/**
 * File: src/pages/calles/SectoresCuadrantesPage.jsx
 * @version 1.0.0
 * @description Página de gestión de sectores y cuadrantes con tabs
 */

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Map } from "lucide-react";
import {
  listSectores,
  deleteSector,
} from "../../services/sectoresService";
import {
  listCuadrantes,
  deleteCuadrante,
} from "../../services/cuadrantesService";
import { useAuthStore } from "../../store/useAuthStore";
import SectorFormModal from "../../components/calles/SectorFormModal";
import CuadranteFormModal from "../../components/calles/CuadranteFormModal";
import toast from "react-hot-toast";

export default function SectoresCuadrantesPage() {
  const { can } = useAuthStore();
  const [activeTab, setActiveTab] = useState("sectores"); // "sectores" o "cuadrantes"

  // Estado de Sectores
  const [sectores, setSectores] = useState([]);
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [searchSectores, setSearchSectores] = useState("");
  const [paginationSectores, setPaginationSectores] = useState(null);
  const [currentPageSectores, setCurrentPageSectores] = useState(1);
  const [showCreateSectorModal, setShowCreateSectorModal] = useState(false);
  const [showEditSectorModal, setShowEditSectorModal] = useState(false);
  const [selectedSector, setSelectedSector] = useState(null);

  // Estado de Cuadrantes
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(true);
  const [searchCuadrantes, setSearchCuadrantes] = useState("");
  const [filterSectorId, setFilterSectorId] = useState("");
  const [paginationCuadrantes, setPaginationCuadrantes] = useState(null);
  const [currentPageCuadrantes, setCurrentPageCuadrantes] = useState(1);
  const [showCreateCuadranteModal, setShowCreateCuadranteModal] = useState(false);
  const [showEditCuadranteModal, setShowEditCuadranteModal] = useState(false);
  const [selectedCuadrante, setSelectedCuadrante] = useState(null);

  // Lista de todos los sectores para filtro
  const [allSectores, setAllSectores] = useState([]);

  const limit = 15;

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    if (activeTab === "sectores") {
      loadSectores();
    } else {
      loadCuadrantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPageSectores, currentPageCuadrantes, searchSectores, searchCuadrantes, filterSectorId]);

  useEffect(() => {
    // Cargar todos los sectores para el filtro de cuadrantes
    loadAllSectores();
  }, []);

  const loadSectores = async () => {
    setLoadingSectores(true);
    try {
      console.log("🔍 [DEBUG] Cargando sectores con parámetros:", {
        page: currentPageSectores,
        limit,
        search: searchSectores || undefined,
      });

      const result = await listSectores({
        page: currentPageSectores,
        limit,
        search: searchSectores || undefined,
      });

      console.log("📦 [DEBUG] Resultado completo de listSectores:", result);
      console.log("📋 [DEBUG] result.items:", result.items);
      console.log("📊 [DEBUG] result.pagination:", result.pagination);
      console.log("🔢 [DEBUG] Cantidad de items:", result.items?.length || 0);

      setSectores(result.items || []);
      setPaginationSectores(result.pagination);

      console.log("✅ [DEBUG] Sectores actualizados en estado");
    } catch (error) {
      console.error("❌ [DEBUG] Error al cargar sectores:", error);
      console.error("❌ [DEBUG] Error completo:", JSON.stringify(error, null, 2));
      toast.error("Error al cargar sectores");
    } finally {
      setLoadingSectores(false);
    }
  };

  const loadCuadrantes = async () => {
    setLoadingCuadrantes(true);
    try {
      console.log("🔍 [DEBUG] Cargando cuadrantes con parámetros:", {
        page: currentPageCuadrantes,
        limit,
        search: searchCuadrantes || undefined,
        sector_id: filterSectorId || undefined,
      });

      const result = await listCuadrantes({
        page: currentPageCuadrantes,
        limit,
        search: searchCuadrantes || undefined,
        sector_id: filterSectorId || undefined,
      });

      console.log("📦 [DEBUG] Resultado completo de listCuadrantes:", result);
      console.log("📋 [DEBUG] result.items:", result.items);
      console.log("📊 [DEBUG] result.pagination:", result.pagination);
      console.log("🔢 [DEBUG] Cantidad de items:", result.items?.length || 0);

      setCuadrantes(result.items || []);
      setPaginationCuadrantes(result.pagination);

      console.log("✅ [DEBUG] Cuadrantes actualizados en estado");
    } catch (error) {
      console.error("❌ [DEBUG] Error al cargar cuadrantes:", error);
      console.error("❌ [DEBUG] Error completo:", JSON.stringify(error, null, 2));
      toast.error("Error al cargar cuadrantes");
    } finally {
      setLoadingCuadrantes(false);
    }
  };

  const loadAllSectores = async () => {
    try {
      console.log("🔍 [DEBUG] Cargando TODOS los sectores (limit: 100)");
      const result = await listSectores({ limit: 100 });
      console.log("📦 [DEBUG] Resultado loadAllSectores:", result);
      console.log("🔢 [DEBUG] Total sectores para filtro:", result.items?.length || 0);
      setAllSectores(result.items || []);
    } catch (error) {
      console.error("❌ [DEBUG] Error al cargar todos los sectores:", error);
    }
  };

  // ============================================
  // HANDLERS - SECTORES
  // ============================================

  const handleCreateSector = () => {
    setSelectedSector(null);
    setShowCreateSectorModal(true);
  };

  const handleEditSector = (sector) => {
    setSelectedSector(sector);
    setShowEditSectorModal(true);
  };

  const handleDeleteSector = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este sector?")) return;

    try {
      await deleteSector(id);
      toast.success("Sector eliminado correctamente");
      loadSectores();
    } catch (error) {
      console.error("Error al eliminar sector:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el sector");
    }
  };

  const handleSearchSectores = (e) => {
    e.preventDefault();
    setCurrentPageSectores(1);
    loadSectores();
  };

  const handleClearSearchSectores = () => {
    setSearchSectores("");
    setCurrentPageSectores(1);
    // Recargar inmediatamente después de limpiar
    setTimeout(() => loadSectores(), 0);
  };

  // ============================================
  // HANDLERS - CUADRANTES
  // ============================================

  const handleCreateCuadrante = () => {
    setSelectedCuadrante(null);
    setShowCreateCuadranteModal(true);
  };

  const handleEditCuadrante = (cuadrante) => {
    setSelectedCuadrante(cuadrante);
    setShowEditCuadranteModal(true);
  };

  const handleDeleteCuadrante = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este cuadrante?")) return;

    try {
      await deleteCuadrante(id);
      toast.success("Cuadrante eliminado correctamente");
      loadCuadrantes();
    } catch (error) {
      console.error("Error al eliminar cuadrante:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el cuadrante");
    }
  };

  const handleSearchCuadrantes = (e) => {
    e.preventDefault();
    setCurrentPageCuadrantes(1);
    loadCuadrantes();
  };

  const handleClearSearchCuadrantes = () => {
    setSearchCuadrantes("");
    setCurrentPageCuadrantes(1);
    // Recargar inmediatamente después de limpiar
    setTimeout(() => loadCuadrantes(), 0);
  };

  const handleClearFilterSector = () => {
    setFilterSectorId("");
    setCurrentPageCuadrantes(1);
    // Recargar inmediatamente después de limpiar el filtro
    setTimeout(() => loadCuadrantes(), 0);
  };

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    function handleKeyDown(e) {
      // ALT+N para crear nuevo
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        if (activeTab === "sectores" && can("sectores_create")) {
          handleCreateSector();
        } else if (activeTab === "cuadrantes" && can("cuadrantes_create")) {
          handleCreateCuadrante();
        }
      }
      // PageDown
      if (e.key === "PageDown") {
        e.preventDefault();
        if (activeTab === "sectores") {
          if (paginationSectores?.current_page < paginationSectores?.total_pages) {
            setCurrentPageSectores((prev) => prev + 1);
          }
        } else {
          if (paginationCuadrantes?.current_page < paginationCuadrantes?.total_pages) {
            setCurrentPageCuadrantes((prev) => prev + 1);
          }
        }
      }
      // PageUp
      if (e.key === "PageUp") {
        e.preventDefault();
        if (activeTab === "sectores") {
          if (paginationSectores?.current_page > 1) {
            setCurrentPageSectores((prev) => prev - 1);
          }
        } else {
          if (paginationCuadrantes?.current_page > 1) {
            setCurrentPageCuadrantes((prev) => prev - 1);
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, paginationSectores, paginationCuadrantes]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Map className="text-primary-700" size={28} />
            Sectores y Cuadrantes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestión de división territorial
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("sectores")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "sectores"
                ? "border-blue-600 text-primary-700 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Sectores ({paginationSectores?.total_items || 0})
          </button>
          <button
            onClick={() => setActiveTab("cuadrantes")}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "cuadrantes"
                ? "border-blue-600 text-primary-700 dark:text-blue-400"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Cuadrantes ({paginationCuadrantes?.total_items || 0})
          </button>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === "sectores" ? (
        <SectoresTab
          sectores={sectores}
          loading={loadingSectores}
          search={searchSectores}
          setSearch={setSearchSectores}
          onSearch={handleSearchSectores}
          onClearSearch={handleClearSearchSectores}
          onCreate={handleCreateSector}
          onEdit={handleEditSector}
          onDelete={handleDeleteSector}
          pagination={paginationSectores}
          currentPage={currentPageSectores}
          setCurrentPage={setCurrentPageSectores}
          can={can}
        />
      ) : (
        <CuadrantesTab
          cuadrantes={cuadrantes}
          loading={loadingCuadrantes}
          search={searchCuadrantes}
          setSearch={setSearchCuadrantes}
          onSearch={handleSearchCuadrantes}
          onClearSearch={handleClearSearchCuadrantes}
          sectores={allSectores}
          filterSectorId={filterSectorId}
          setFilterSectorId={setFilterSectorId}
          onClearFilterSector={handleClearFilterSector}
          onCreate={handleCreateCuadrante}
          onEdit={handleEditCuadrante}
          onDelete={handleDeleteCuadrante}
          pagination={paginationCuadrantes}
          currentPage={currentPageCuadrantes}
          setCurrentPage={setCurrentPageCuadrantes}
          can={can}
        />
      )}

      {/* Modales - Sectores */}
      <SectorFormModal
        isOpen={showCreateSectorModal}
        onClose={() => setShowCreateSectorModal(false)}
        onSuccess={loadSectores}
      />
      <SectorFormModal
        isOpen={showEditSectorModal}
        onClose={() => setShowEditSectorModal(false)}
        sector={selectedSector}
        onSuccess={loadSectores}
      />

      {/* Modales - Cuadrantes */}
      <CuadranteFormModal
        isOpen={showCreateCuadranteModal}
        onClose={() => setShowCreateCuadranteModal(false)}
        onSuccess={loadCuadrantes}
      />
      <CuadranteFormModal
        isOpen={showEditCuadranteModal}
        onClose={() => setShowEditCuadranteModal(false)}
        cuadrante={selectedCuadrante}
        onSuccess={loadCuadrantes}
      />
    </div>
  );
}

// ============================================
// SUB-COMPONENTES
// ============================================

function SectoresTab({
  sectores,
  loading,
  search,
  setSearch,
  onSearch,
  onClearSearch,
  onCreate,
  onEdit,
  onDelete,
  pagination,
  currentPage,
  setCurrentPage,
  can,
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <form onSubmit={onSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sectores..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
              title="Limpiar filtro"
            >
              <X size={20} />
            </button>
          )}
        </form>

        {/* Botón Crear */}
        {can("sectores_create") && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
            title="Nuevo Sector (ALT+N)"
          >
            <Plus size={20} />
            <span>Nuevo Sector</span>
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descripción
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
                    Cargando...
                  </td>
                </tr>
              ) : sectores.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No hay sectores registrados
                  </td>
                </tr>
              ) : (
                sectores.map((sector) => (
                  <tr key={sector.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {sector.sector_code || sector.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      {sector.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {sector.descripcion || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {can("sectores_update") && (
                          <button
                            onClick={() => onEdit(sector)}
                            className="p-1 text-primary-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {can("sectores_delete") && (
                          <button
                            onClick={() => onDelete(sector.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
      </div>

      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.total_pages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function CuadrantesTab({
  cuadrantes,
  loading,
  search,
  setSearch,
  onSearch,
  onClearSearch,
  sectores,
  filterSectorId,
  setFilterSectorId,
  onClearFilterSector,
  onCreate,
  onEdit,
  onDelete,
  pagination,
  currentPage,
  setCurrentPage,
  can,
}) {
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 flex gap-2 flex-wrap">
          {/* Search */}
          <form onSubmit={onSearch} className="flex gap-2">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cuadrantes..."
                className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {search && (
              <button
                type="button"
                onClick={onClearSearch}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Limpiar búsqueda"
              >
                <X size={20} />
              </button>
            )}
          </form>

          {/* Filtro de Sector */}
          <div className="flex gap-2">
            <select
              value={filterSectorId}
              onChange={(e) => setFilterSectorId(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los sectores</option>
              {sectores.map((sector) => (
                <option key={sector.id} value={sector.id}>
                  {sector.codigo} - {sector.nombre}
                </option>
              ))}
            </select>
            {filterSectorId && (
              <button
                type="button"
                onClick={onClearFilterSector}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 p-2 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Limpiar filtro de sector"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Botón Crear */}
        {can("cuadrantes_create") && (
          <button
            onClick={onCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
            title="Nuevo Cuadrante (ALT+N)"
          >
            <Plus size={20} />
            <span>Nuevo Cuadrante</span>
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Sector
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Cargando...
                  </td>
                </tr>
              ) : cuadrantes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No hay cuadrantes registrados
                  </td>
                </tr>
              ) : (
                cuadrantes.map((cuadrante) => (
                  <tr key={cuadrante.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {cuadrante.cuadrante_code || cuadrante.codigo}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      {cuadrante.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {cuadrante.sector?.sector_code || cuadrante.sector?.codigo} - {cuadrante.sector?.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {cuadrante.descripcion || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        {can("cuadrantes_update") && (
                          <button
                            onClick={() => onEdit(cuadrante)}
                            className="p-1 text-primary-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        {can("cuadrantes_delete") && (
                          <button
                            onClick={() => onDelete(cuadrante.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
      </div>

      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.total_pages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  return (
    <div className="flex items-center justify-between bg-white dark:bg-slate-800 px-4 py-3 rounded-lg shadow">
      <div className="text-sm text-slate-700 dark:text-slate-300">
        Página <span className="font-medium">{currentPage}</span> de{" "}
        <span className="font-medium">{totalPages}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="Página anterior (Re Pág)"
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="Página siguiente (Av Pág)"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
