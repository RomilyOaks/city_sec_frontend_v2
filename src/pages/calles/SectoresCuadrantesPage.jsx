/**
 * File: src/pages/calles/SectoresCuadrantesPage.jsx
 * @version 3.0.0
 * @description Página de gestión de sectores, subsectores y cuadrantes (Master-Detail 3 niveles)
 * Jerarquía: Sector -> Subsector -> Cuadrante
 */

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, Map, ChevronRight, ArrowLeft, Eye, Info, Car, Layers } from "lucide-react";
import {
  listSectores,
  deleteSector,
} from "../../services/sectoresService";
import {
  listSubsectoresBySector,
  deleteSubsector,
  createSubsector,
  updateSubsector,
} from "../../services/subsectoresService";
import {
  listCuadrantes,
  deleteCuadrante,
} from "../../services/cuadrantesService";
import { useAuthStore } from "../../store/useAuthStore";
import SectorFormModal from "../../components/calles/SectorFormModal";
import CuadranteFormModal from "../../components/calles/CuadranteFormModal";
import SectorViewModal from "../../components/calles/SectorViewModal";
import CuadranteViewModal from "../../components/calles/CuadranteViewModal";
import CuadranteMapaModal from "../../components/calles/CuadranteMapaModal";
import CuadranteVehiculosModal from "../../components/calles/CuadranteVehiculosModal";
import SubsectorFormModal from "../../components/calles/SubsectorFormModal";
import toast from "react-hot-toast";

export default function SectoresCuadrantesPage() {
  const { can, user } = useAuthStore();

  // Vista actual: "sectores", "subsectores" o "cuadrantes"
  const [view, setView] = useState("sectores");
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedSubsector, setSelectedSubsector] = useState(null);

  // Estado de Sectores
  const [sectores, setSectores] = useState([]);
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [searchSectores, setSearchSectores] = useState("");
  const [paginationSectores, setPaginationSectores] = useState(null);
  const [currentPageSectores, setCurrentPageSectores] = useState(1);
  const [showCreateSectorModal, setShowCreateSectorModal] = useState(false);
  const [showEditSectorModal, setShowEditSectorModal] = useState(false);
  const [showViewSectorModal, setShowViewSectorModal] = useState(false);
  const [editingSector, setEditingSector] = useState(null);
  const [viewingSector, setViewingSector] = useState(null);

  // Estado de Subsectores
  const [subsectores, setSubsectores] = useState([]);
  const [loadingSubsectores, setLoadingSubsectores] = useState(false);
  const [searchSubsectores, setSearchSubsectores] = useState("");
  const [paginationSubsectores, setPaginationSubsectores] = useState(null);
  const [currentPageSubsectores, setCurrentPageSubsectores] = useState(1);
  const [showCreateSubsectorModal, setShowCreateSubsectorModal] = useState(false);
  const [showEditSubsectorModal, setShowEditSubsectorModal] = useState(false);
  const [editingSubsector, setEditingSubsector] = useState(null);

  // Estado de Cuadrantes
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(false);
  const [searchCuadrantes, setSearchCuadrantes] = useState("");
  const [paginationCuadrantes, setPaginationCuadrantes] = useState(null);
  const [currentPageCuadrantes, setCurrentPageCuadrantes] = useState(1);
  const [showCreateCuadranteModal, setShowCreateCuadranteModal] = useState(false);
  const [showEditCuadranteModal, setShowEditCuadranteModal] = useState(false);
  const [showViewCuadranteModal, setShowViewCuadranteModal] = useState(false);
  const [showMapaCuadranteModal, setShowMapaCuadranteModal] = useState(false);
  const [showVehiculosCuadranteModal, setShowVehiculosCuadranteModal] = useState(false);
  const [editingCuadrante, setEditingCuadrante] = useState(null);
  const [viewingCuadrante, setViewingCuadrante] = useState(null);
  const [mapaCuadrante, setMapaCuadrante] = useState(null);
  const [vehiculosCuadrante, setVehiculosCuadrante] = useState(null);

  const limit = 15;

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSectores();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPageSectores, searchSectores]);

  useEffect(() => {
    if (view === "subsectores" && selectedSector) {
      const timeoutId = setTimeout(() => {
        loadSubsectores();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [view, selectedSector, currentPageSubsectores, searchSubsectores]);

  useEffect(() => {
    if (view === "cuadrantes" && selectedSubsector) {
      const timeoutId = setTimeout(() => {
        loadCuadrantes();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [view, selectedSubsector, currentPageCuadrantes, searchCuadrantes]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 33) { // PageUp
        e.preventDefault();
        handleBack();
      }
    };
    if (view !== "sectores") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [view]);

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

  const loadSubsectores = async () => {
    if (!selectedSector) return;
    setLoadingSubsectores(true);
    try {
      const result = await listSubsectoresBySector(selectedSector.id, {
        page: currentPageSubsectores,
        limit,
        search: searchSubsectores || undefined,
      });
      setSubsectores(result.items || []);
      setPaginationSubsectores(result.pagination);
    } catch (error) {
      console.error("Error al cargar subsectores:", error);
      toast.error("Error al cargar subsectores");
    } finally {
      setLoadingSubsectores(false);
    }
  };

  const loadCuadrantes = async () => {
    if (!selectedSubsector) return;
    setLoadingCuadrantes(true);
    try {
      // Usar listCuadrantes con subsector_id como query parameter
      const result = await listCuadrantes({
        page: currentPageCuadrantes,
        limit,
        search: searchCuadrantes || undefined,
        subsector_id: selectedSubsector.id,
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
  // NAVIGATION HANDLERS
  // ============================================

  const handleViewSectorDetail = (sector) => {
    setSelectedSector(sector);
    setView("subsectores");
    setSearchSubsectores("");
    setCurrentPageSubsectores(1);
  };

  const handleViewSubsectorDetail = (subsector) => {
    setSelectedSubsector(subsector);
    setView("cuadrantes");
    setSearchCuadrantes("");
    setCurrentPageCuadrantes(1);
  };

  const handleBack = () => {
    if (view === "cuadrantes") {
      setView("subsectores");
      setSelectedSubsector(null);
      setCuadrantes([]);
      setPaginationCuadrantes(null);
    } else if (view === "subsectores") {
      setView("sectores");
      setSelectedSector(null);
      setSubsectores([]);
      setPaginationSubsectores(null);
    }
  };

  const handleBackToSectores = () => {
    setView("sectores");
    setSelectedSector(null);
    setSelectedSubsector(null);
    setSubsectores([]);
    setCuadrantes([]);
    setPaginationSubsectores(null);
    setPaginationCuadrantes(null);
  };

  const handleBackToSubsectores = () => {
    setView("subsectores");
    setSelectedSubsector(null);
    setCuadrantes([]);
    setPaginationCuadrantes(null);
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

  const handleViewSector = (sector) => {
    setViewingSector(sector);
    setShowViewSectorModal(true);
  };

  const handleDeleteSector = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este sector?")) return;
    try {
      await deleteSector(id, user?.id);
      toast.success("Sector eliminado correctamente");
      loadSectores();
    } catch (error) {
      console.error("Error al eliminar sector:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el sector");
    }
  };

  const handleClearSearchSectores = () => {
    setSearchSectores("");
    setCurrentPageSectores(1);
  };

  // ============================================
  // HANDLERS - SUBSECTORES
  // ============================================

  const handleCreateSubsector = () => {
    setEditingSubsector(null);
    setShowCreateSubsectorModal(true);
  };

  const handleEditSubsector = (subsector) => {
    setEditingSubsector(subsector);
    setShowEditSubsectorModal(true);
  };

  const handleDeleteSubsector = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este subsector?")) return;
    try {
      await deleteSubsector(id, user?.id);
      toast.success("Subsector eliminado correctamente");
      loadSubsectores();
    } catch (error) {
      console.error("Error al eliminar subsector:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el subsector");
    }
  };

  const handleClearSearchSubsectores = () => {
    setSearchSubsectores("");
    setCurrentPageSubsectores(1);
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

  const handleViewCuadrante = (cuadrante) => {
    setViewingCuadrante(cuadrante);
    setShowViewCuadranteModal(true);
  };

  const handleViewMapaCuadrante = (cuadrante) => {
    setMapaCuadrante(cuadrante);
    setShowMapaCuadranteModal(true);
  };

  const handleViewVehiculosCuadrante = (cuadrante) => {
    setVehiculosCuadrante(cuadrante);
    setShowVehiculosCuadranteModal(true);
  };

  const handleDeleteCuadrante = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar este cuadrante?")) return;
    try {
      await deleteCuadrante(id, user?.id);
      toast.success("Cuadrante eliminado correctamente");
      loadCuadrantes();
    } catch (error) {
      console.error("Error al eliminar cuadrante:", error);
      toast.error(error.response?.data?.message || "Error al eliminar el cuadrante");
    }
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
        if (view === "sectores" && can("sectores_create")) {
          handleCreateSector();
        } else if (view === "subsectores" && can("subsectores_create")) {
          handleCreateSubsector();
        } else if (view === "cuadrantes" && can("cuadrantes_create")) {
          handleCreateCuadrante();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  const getTitle = () => {
    if (view === "sectores") return "Sectores";
    if (view === "subsectores") return `Subsectores de ${selectedSector?.nombre}`;
    if (view === "cuadrantes") return `Cuadrantes de ${selectedSubsector?.nombre}`;
    return "Sectores";
  };

  const getSubtitle = () => {
    if (view === "sectores") return "Haz clic en una fila para ver sus subsectores";
    if (view === "subsectores") return "Haz clic en una fila para ver sus cuadrantes";
    if (view === "cuadrantes") return "Presiona Re Pág para regresar";
    return "";
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            {view !== "sectores" && (
              <button
                onClick={handleBack}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Volver (Re Pág)"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Map className="text-primary-700" size={28} />
              {getTitle()}
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
            <Info size={16} className="text-primary-600 dark:text-primary-400" />
            <span>{getSubtitle()}</span>
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      {view !== "sectores" && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <button
            onClick={handleBackToSectores}
            className="hover:text-primary-700 dark:hover:text-primary-500 transition-colors"
          >
            Sectores
          </button>
          {selectedSector && (
            <>
              <ChevronRight size={16} />
              {view === "subsectores" ? (
                <span className="text-slate-900 dark:text-white font-medium">
                  {selectedSector.sector_code} - {selectedSector.nombre}
                </span>
              ) : (
                <button
                  onClick={handleBackToSubsectores}
                  className="hover:text-primary-700 dark:hover:text-primary-500 transition-colors"
                >
                  {selectedSector.sector_code} - {selectedSector.nombre}
                </button>
              )}
            </>
          )}
          {selectedSubsector && view === "cuadrantes" && (
            <>
              <ChevronRight size={16} />
              <span className="text-slate-900 dark:text-white font-medium">
                {selectedSubsector.subsector_code} - {selectedSubsector.nombre}
              </span>
            </>
          )}
        </div>
      )}

      {/* Vista de Sectores */}
      {view === "sectores" && (
        <div className="space-y-4">
          {/* Búsqueda y acciones */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
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
            </div>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Zona</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loadingSectores ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Cargando...</td>
                    </tr>
                  ) : sectores.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No hay sectores registrados</td>
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
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{sector.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{sector.zona_code || "-"}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {sector.supervisor
                            ? `${sector.supervisor.apellido_paterno || ''} ${sector.supervisor.apellido_materno || ''}, ${sector.supervisor.nombres || ''}`.trim()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewSector(sector); }}
                              className="p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition-colors"
                              title="Ver información"
                            >
                              <Eye size={18} />
                            </button>
                            {can("sectores_update") && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditSector(sector); }}
                                className="p-1 text-primary-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("sectores_delete") && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSector(sector.id); }}
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

            {/* Paginación Sectores */}
            {paginationSectores && paginationSectores.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {sectores.length} de {paginationSectores.total_items} sectores
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageSectores(Math.max(1, currentPageSectores - 1))}
                    disabled={currentPageSectores === 1}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                    Página {currentPageSectores} de {paginationSectores.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPageSectores(Math.min(paginationSectores.total_pages, currentPageSectores + 1))}
                    disabled={currentPageSectores === paginationSectores.total_pages}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista de Subsectores */}
      {view === "subsectores" && selectedSector && (
        <div className="space-y-4">
          {/* Card del Sector */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Código del Sector</p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">{selectedSector.sector_code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Nombre</p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">{selectedSector.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Zona</p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">{selectedSector.zona_code || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Descripción</p>
                <p className="text-lg text-primary-900 dark:text-primary-300">{selectedSector.descripcion || "-"}</p>
              </div>
            </div>
          </div>

          {/* Búsqueda y acciones */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar subsectores..."
                  value={searchSubsectores}
                  onChange={(e) => setSearchSubsectores(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                {searchSubsectores && (
                  <button
                    type="button"
                    onClick={handleClearSearchSubsectores}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>

            {can("subsectores_create") && (
              <button
                onClick={handleCreateSubsector}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                title="Nuevo Subsector (ALT+N)"
              >
                <Plus size={20} />
                <span>Nuevo Subsector</span>
              </button>
            )}
          </div>

          {/* Tabla de Subsectores */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Supervisor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Referencia</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Color</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loadingSubsectores ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Cargando...</td>
                    </tr>
                  ) : subsectores.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        No hay subsectores registrados para este sector
                      </td>
                    </tr>
                  ) : (
                    subsectores.map((subsector) => (
                      <tr
                        key={subsector.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => handleViewSubsectorDetail(subsector)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700 dark:text-primary-500">
                          {subsector.subsector_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{subsector.nombre}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {subsector.supervisor
                            ? `${subsector.supervisor.apellido_paterno || ''} ${subsector.supervisor.nombres || ''}`.trim()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                          {subsector.referencia || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div
                            className="w-6 h-6 rounded-full mx-auto border border-slate-300"
                            style={{ backgroundColor: subsector.color_mapa || "#10B981" }}
                            title={subsector.color_mapa || "#10B981"}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleViewSubsectorDetail(subsector); }}
                              className="p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition-colors"
                              title="Ver cuadrantes"
                            >
                              <Layers size={18} />
                            </button>
                            {can("subsectores_update") && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditSubsector(subsector); }}
                                className="p-1 text-primary-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("subsectores_delete") && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteSubsector(subsector.id); }}
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

            {/* Paginación Subsectores */}
            {paginationSubsectores && paginationSubsectores.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {subsectores.length} de {paginationSubsectores.total_items} subsectores
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageSubsectores(Math.max(1, currentPageSubsectores - 1))}
                    disabled={currentPageSubsectores === 1}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                    Página {currentPageSubsectores} de {paginationSubsectores.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPageSubsectores(Math.min(paginationSubsectores.total_pages, currentPageSubsectores + 1))}
                    disabled={currentPageSubsectores === paginationSubsectores.total_pages}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
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
      {view === "cuadrantes" && selectedSubsector && (
        <div className="space-y-4">
          {/* Card del Subsector */}
          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Código del Subsector</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{selectedSubsector.subsector_code}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Nombre</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{selectedSubsector.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Sector</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300">{selectedSector?.nombre || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Referencia</p>
                <p className="text-lg text-emerald-900 dark:text-emerald-300">{selectedSubsector.referencia || "-"}</p>
              </div>
            </div>
          </div>

          {/* Búsqueda y acciones */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex gap-2">
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
            </div>

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
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Descripción</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loadingCuadrantes ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Cargando...</td>
                    </tr>
                  ) : cuadrantes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        No hay cuadrantes registrados para este subsector
                      </td>
                    </tr>
                  ) : (
                    cuadrantes.map((cuadrante) => (
                      <tr key={cuadrante.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {cuadrante.cuadrante_code || cuadrante.codigo}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">{cuadrante.nombre}</td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{cuadrante.descripcion || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {cuadrante.poligono_json && (
                              <button
                                onClick={() => handleViewMapaCuadrante(cuadrante)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                title="Ver mapa"
                              >
                                <Map size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewVehiculosCuadrante(cuadrante)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                              title="Ver vehículos"
                            >
                              <Car size={18} />
                            </button>
                            <button
                              onClick={() => handleViewCuadrante(cuadrante)}
                              className="p-1 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded transition-colors"
                              title="Ver información"
                            >
                              <Eye size={18} />
                            </button>
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

            {/* Paginación Cuadrantes */}
            {paginationCuadrantes && paginationCuadrantes.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {cuadrantes.length} de {paginationCuadrantes.total_items} cuadrantes
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPageCuadrantes(Math.max(1, currentPageCuadrantes - 1))}
                    disabled={currentPageCuadrantes === 1}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
                    Página {currentPageCuadrantes} de {paginationCuadrantes.total_pages}
                  </span>
                  <button
                    onClick={() => setCurrentPageCuadrantes(Math.min(paginationCuadrantes.total_pages, currentPageCuadrantes + 1))}
                    disabled={currentPageCuadrantes === paginationCuadrantes.total_pages}
                    className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
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
          onSuccess={() => { loadSectores(); setShowCreateSectorModal(false); }}
        />
      )}

      {showEditSectorModal && (
        <SectorFormModal
          isOpen={showEditSectorModal}
          onClose={() => setShowEditSectorModal(false)}
          sector={editingSector}
          onSuccess={() => { loadSectores(); setShowEditSectorModal(false); }}
        />
      )}

      {showCreateSubsectorModal && (
        <SubsectorFormModal
          isOpen={showCreateSubsectorModal}
          onClose={() => setShowCreateSubsectorModal(false)}
          subsector={null}
          onSuccess={() => { loadSubsectores(); setShowCreateSubsectorModal(false); }}
          preselectedSectorId={selectedSector?.id}
          sectorNombre={selectedSector?.nombre}
        />
      )}

      {showEditSubsectorModal && (
        <SubsectorFormModal
          isOpen={showEditSubsectorModal}
          onClose={() => setShowEditSubsectorModal(false)}
          subsector={editingSubsector}
          onSuccess={() => { loadSubsectores(); setShowEditSubsectorModal(false); }}
          preselectedSectorId={selectedSector?.id}
          sectorNombre={selectedSector?.nombre}
        />
      )}

      {showCreateCuadranteModal && (
        <CuadranteFormModal
          isOpen={showCreateCuadranteModal}
          onClose={() => setShowCreateCuadranteModal(false)}
          cuadrante={null}
          onSuccess={() => { loadCuadrantes(); setShowCreateCuadranteModal(false); }}
          preselectedSectorId={selectedSector?.id}
          preselectedSubsectorId={selectedSubsector?.id}
        />
      )}

      {showEditCuadranteModal && (
        <CuadranteFormModal
          isOpen={showEditCuadranteModal}
          onClose={() => setShowEditCuadranteModal(false)}
          cuadrante={editingCuadrante}
          onSuccess={() => { setTimeout(() => loadCuadrantes(), 500); setShowEditCuadranteModal(false); }}
        />
      )}

      {showViewSectorModal && (
        <SectorViewModal
          isOpen={showViewSectorModal}
          onClose={() => { setShowViewSectorModal(false); setViewingSector(null); }}
          sector={viewingSector}
        />
      )}

      {showViewCuadranteModal && (
        <CuadranteViewModal
          isOpen={showViewCuadranteModal}
          onClose={() => { setShowViewCuadranteModal(false); setViewingCuadrante(null); }}
          cuadrante={viewingCuadrante}
        />
      )}

      {showMapaCuadranteModal && (
        <CuadranteMapaModal
          isOpen={showMapaCuadranteModal}
          onClose={() => { setShowMapaCuadranteModal(false); setMapaCuadrante(null); }}
          cuadrante={mapaCuadrante}
        />
      )}

      {showVehiculosCuadranteModal && (
        <CuadranteVehiculosModal
          isOpen={showVehiculosCuadranteModal}
          onClose={() => { setShowVehiculosCuadranteModal(false); setVehiculosCuadrante(null); }}
          cuadrante={vehiculosCuadrante}
        />
      )}
    </div>
  );
}
