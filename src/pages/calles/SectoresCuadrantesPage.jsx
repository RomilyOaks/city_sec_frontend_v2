/**
 * File: src/pages/calles/SectoresCuadrantesPage.jsx
 * @version 2.0.0
 * @description Página de gestión de sectores y cuadrantes (Master-Detail)
 */

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Map, ChevronRight, ArrowLeft } from "lucide-react";
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

  // Vista actual: "sectores" o "cuadrantes"
  const [view, setView] = useState("sectores");
  const [selectedSector, setSelectedSector] = useState(null);

  // Estado de Sectores
  const [sectores, setSectores] = useState([]);
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [searchSectores, setSearchSectores] = useState("");
  const [paginationSectores, setPaginationSectores] = useState(null);
  const [currentPageSectores, setCurrentPageSectores] = useState(1);
  const [showCreateSectorModal, setShowCreateSectorModal] = useState(false);
  const [showEditSectorModal, setShowEditSectorModal] = useState(false);
  const [editingSector, setEditingSector] = useState(null);

  // Estado de Cuadrantes
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(false);
  const [searchCuadrantes, setSearchCuadrantes] = useState("");
  const [paginationCuadrantes, setPaginationCuadrantes] = useState(null);
  const [currentPageCuadrantes, setCurrentPageCuadrantes] = useState(1);
  const [showCreateCuadranteModal, setShowCreateCuadranteModal] = useState(false);
  const [showEditCuadranteModal, setShowEditCuadranteModal] = useState(false);
  const [editingCuadrante, setEditingCuadrante] = useState(null);

  const limit = 15;

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadSectores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageSectores, searchSectores]);

  useEffect(() => {
    if (view === "cuadrantes" && selectedSector) {
      loadCuadrantes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedSector, currentPageCuadrantes, searchCuadrantes]);

  const loadSectores = async () => {
    setLoadingSectores(true);
    try {
      const result = await listSectores({
        page: currentPageSectores,
        limit,
        search: searchSectores || undefined,
      });

      setSectores(result.items || []);
      setPaginationSectores(result.pagination);
    } catch (error) {
      console.error("Error al cargar sectores:", error);
      toast.error("Error al cargar sectores");
    } finally {
      setLoadingSectores(false);
    }
  };

  const loadCuadrantes = async () => {
    if (!selectedSector) return;

    setLoadingCuadrantes(true);
    try {
      const result = await listCuadrantes({
        page: currentPageCuadrantes,
        limit,
        search: searchCuadrantes || undefined,
        sector_id: selectedSector.id,
      });

      setCuadrantes(result.items || []);
      setPaginationCuadrantes(result.pagination);
    } catch (error) {
      console.error("Error al cargar cuadrantes:", error);
      toast.error("Error al cargar cuadrantes");
    } finally {
      setLoadingCuadrantes(false);
    }
  };

  // ============================================
  // HANDLERS - SECTORES
  // ============================================

  const handleCreateSector = () => {
    setEditingSector(null);
    setShowCreateSectorModal(true);
  };

  const handleEditSector = (sector) => {
    setEditingSector(sector);
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
  };

  const handleViewSectorDetail = (sector) => {
    setSelectedSector(sector);
    setView("cuadrantes");
    setSearchCuadrantes("");
    setCurrentPageCuadrantes(1);
  };

  const handleBackToSectores = () => {
    setView("sectores");
    setSelectedSector(null);
    setCuadrantes([]);
    setPaginationCuadrantes(null);
  };

  // ============================================
  // HANDLERS - CUADRANTES
  // ============================================

  const handleCreateCuadrante = () => {
    setEditingCuadrante(null);
    setShowCreateCuadranteModal(true);
  };

  const handleEditCuadrante = (cuadrante) => {
    setEditingCuadrante(cuadrante);
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
  };

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.altKey && e.key === "n") {
        e.preventDefault();
        if (view === "sectores") {
          handleCreateSector();
        } else if (view === "cuadrantes") {
          handleCreateCuadrante();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {view === "cuadrantes" && (
              <button
                onClick={handleBackToSectores}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Volver a sectores"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="text-primary-700" size={28} />
              {view === "sectores" ? "Sectores" : `Cuadrantes de ${selectedSector?.nombre}`}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {view === "sectores"
              ? "Gestión de división territorial - Seleccione un sector para ver sus cuadrantes"
              : "Gestión de cuadrantes del sector seleccionado"
            }
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      {view === "cuadrantes" && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <button
            onClick={handleBackToSectores}
            className="hover:text-primary-700 dark:hover:text-primary-500 transition-colors"
          >
            Sectores
          </button>
          <ChevronRight size={16} />
          <span className="text-slate-900 dark:text-white font-medium">
            {selectedSector?.sector_code || selectedSector?.codigo} - {selectedSector?.nombre}
          </span>
        </div>
      )}

      {/* Vista de Sectores */}
      {view === "sectores" && (
        <div className="space-y-4">
          {/* Búsqueda y acciones */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchSectores} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar sectores..."
                  value={searchSectores}
                  onChange={(e) => setSearchSectores(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchSectores && (
                  <button
                    type="button"
                    onClick={handleClearSearchSectores}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>

            {can("sectores_create") && (
              <button
                onClick={handleCreateSector}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                title="Nuevo Sector (ALT+N)"
              >
                <Plus size={20} />
                <span>Nuevo Sector</span>
              </button>
            )}
          </div>

          {/* Tabla de Sectores */}
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
                  {loadingSectores ? (
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
                      <tr
                        key={sector.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => handleViewSectorDetail(sector)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700 dark:text-primary-500">
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
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSector(sector);
                                }}
                                className="p-1 text-primary-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("sectores_delete") && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSector(sector.id);
                                }}
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

            {/* Paginación de Sectores */}
            {paginationSectores && paginationSectores.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {sectores.length} de {paginationSectores.total_items} sectores
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageSectores(Math.max(1, currentPageSectores - 1))}
                    disabled={currentPageSectores === 1}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                    Página {currentPageSectores} de {paginationSectores.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPageSectores(Math.min(paginationSectores.total_pages, currentPageSectores + 1))}
                    disabled={currentPageSectores === paginationSectores.total_pages}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de Cuadrantes */}
      {view === "cuadrantes" && selectedSector && (
        <div className="space-y-4">
          {/* Card con información del sector */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Código del Sector</p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">
                  {selectedSector.sector_code || selectedSector.codigo}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Nombre</p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">{selectedSector.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Descripción</p>
                <p className="text-lg text-primary-900 dark:text-primary-300">{selectedSector.descripcion || "-"}</p>
              </div>
            </div>
          </div>

          {/* Búsqueda y acciones de cuadrantes */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchCuadrantes} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar cuadrantes..."
                  value={searchCuadrantes}
                  onChange={(e) => setSearchCuadrantes(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchCuadrantes && (
                  <button
                    type="button"
                    onClick={handleClearSearchCuadrantes}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </form>

            {can("cuadrantes_create") && (
              <button
                onClick={handleCreateCuadrante}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                title="Nuevo Cuadrante (ALT+N)"
              >
                <Plus size={20} />
                <span>Nuevo Cuadrante</span>
              </button>
            )}
          </div>

          {/* Tabla de Cuadrantes */}
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
                  {loadingCuadrantes ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        Cargando...
                      </td>
                    </tr>
                  ) : cuadrantes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        No hay cuadrantes registrados para este sector
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
                          {cuadrante.descripcion || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {can("cuadrantes_update") && (
                              <button
                                onClick={() => handleEditCuadrante(cuadrante)}
                                className="p-1 text-primary-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("cuadrantes_delete") && (
                              <button
                                onClick={() => handleDeleteCuadrante(cuadrante.id)}
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

            {/* Paginación de Cuadrantes */}
            {paginationCuadrantes && paginationCuadrantes.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {cuadrantes.length} de {paginationCuadrantes.total_items} cuadrantes
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageCuadrantes(Math.max(1, currentPageCuadrantes - 1))}
                    disabled={currentPageCuadrantes === 1}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                    Página {currentPageCuadrantes} de {paginationCuadrantes.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPageCuadrantes(Math.min(paginationCuadrantes.total_pages, currentPageCuadrantes + 1))}
                    disabled={currentPageCuadrantes === paginationCuadrantes.total_pages}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateSectorModal && (
        <SectorFormModal
          isOpen={showCreateSectorModal}
          onClose={() => setShowCreateSectorModal(false)}
          sector={null}
          onSuccess={() => {
            loadSectores();
            setShowCreateSectorModal(false);
          }}
        />
      )}

      {showEditSectorModal && (
        <SectorFormModal
          isOpen={showEditSectorModal}
          onClose={() => setShowEditSectorModal(false)}
          sector={editingSector}
          onSuccess={() => {
            loadSectores();
            setShowEditSectorModal(false);
          }}
        />
      )}

      {showCreateCuadranteModal && (
        <CuadranteFormModal
          isOpen={showCreateCuadranteModal}
          onClose={() => setShowCreateCuadranteModal(false)}
          cuadrante={null}
          onSuccess={() => {
            loadCuadrantes();
            setShowCreateCuadranteModal(false);
          }}
          preselectedSectorId={selectedSector?.id}
        />
      )}

      {showEditCuadranteModal && (
        <CuadranteFormModal
          isOpen={showEditCuadranteModal}
          onClose={() => setShowEditCuadranteModal(false)}
          cuadrante={editingCuadrante}
          onSuccess={() => {
            loadCuadrantes();
            setShowEditCuadranteModal(false);
          }}
        />
      )}
    </div>
  );
}
