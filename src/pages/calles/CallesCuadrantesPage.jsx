/**
 * File: src/pages/calles/CallesCuadrantesPage.jsx
 * @version 1.0.0
 * @description Página de gestión de calles y sus cuadrantes (Master-Detail)
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  MapPin,
  Eye,
  Map,
} from "lucide-react";
import { listCalles, deleteCalle } from "../../services/callesService";
import {
  listCallesCuadrantes,
  deleteCalleCuadrante,
} from "../../services/callesCuadrantesService";
import { useAuthStore } from "../../store/useAuthStore";
import CalleFormModal from "../../components/calles/CalleFormModal";
import CalleCuadranteFormModal from "../../components/calles/CalleCuadranteFormModal";
import CalleCuadranteViewModal from "../../components/calles/CalleCuadranteViewModal";
import CuadranteMapaModal from "../../components/calles/CuadranteMapaModal";
import toast from "react-hot-toast";

export default function CallesCuadrantesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can, user } = useAuthStore();

  // Vista actual: "calles" o "cuadrantes"
  const [view, setView] = useState(
    location.state?.calle ? "cuadrantes" : "calles"
  );
  const [selectedCalle, setSelectedCalle] = useState(
    location.state?.calle || null
  );

  // Efecto para manejar el estado inicial cuando viene de otra página
  useEffect(() => {
    if (location.state?.calle && !selectedCalle) {
      setSelectedCalle(location.state.calle);
    }
  }, [location.state?.calle, selectedCalle]);

  // Detectar si vino desde otra página (Maestro de Calles)
  const [cameFromExternalPage] = useState(!!location.state?.calle);

  // Estado de Calles
  const [calles, setCalles] = useState([]);
  const [loadingCalles, setLoadingCalles] = useState(true);
  const [paginationCalles, setPaginationCalles] = useState(null);
  const [currentPageCalles, setCurrentPageCalles] = useState(1);
  const [searchCalles, setSearchCalles] = useState("");

  // Estado de Cuadrantes (relaciones calle-cuadrante)
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(false);
  const [paginationCuadrantes, setPaginationCuadrantes] = useState(null);
  const [currentPageCuadrantes, setCurrentPageCuadrantes] = useState(1);
  const [searchCuadrantes, setSearchCuadrantes] = useState("");

  // Modales
  const [showEditCalleModal, setShowEditCalleModal] = useState(false);
  const [editingCalle, setEditingCalle] = useState(null);

  const [showEditCuadranteModal, setShowEditCuadranteModal] = useState(false);
  const [editingCuadrante, setEditingCuadrante] = useState(null);

  const [showViewCuadranteModal, setShowViewCuadranteModal] = useState(false);
  const [viewingCuadrante, setViewingCuadrante] = useState(null);
  const [showMapaCuadranteModal, setShowMapaCuadranteModal] = useState(false);
  const [mapaCuadrante, setMapaCuadrante] = useState(null);

  const limit = 15;

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      loadCalles();
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageCalles, searchCalles]);

  useEffect(() => {
    if (view === "cuadrantes" && selectedCalle) {
      // Debounce para búsqueda
      const timeoutId = setTimeout(() => {
        loadCuadrantes();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedCalle, currentPageCuadrantes, searchCuadrantes]);

  // Hook para manejar teclas cuando se está en vista de cuadrantes
  useEffect(() => {
    const handleKeyDown = (e) => {
      // PageUp key: e.key === "PageUp" o e.keyCode === 33 - Volver a calles
      if ((e.key === "PageUp" || e.keyCode === 33) && view === "cuadrantes") {
        e.preventDefault();
        handleBackToCalles();
      }
      // ALT + N - Nuevo cuadrante
      if (
        e.altKey &&
        e.key === "n" &&
        view === "cuadrantes" &&
        can("calles_cuadrantes_create")
      ) {
        e.preventDefault();
        handleCreateCuadrante();
      }
    };

    if (view === "cuadrantes") {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const loadCalles = async () => {
    setLoadingCalles(true);

    try {
      const result = await listCalles({
        page: currentPageCalles,
        limit,
        search: searchCalles || undefined,
      });

      setCalles(result.items || result.data?.items || []);
      setPaginationCalles(result.pagination || result.data?.pagination);
    } catch (error) {
      console.error("Error al cargar calles:", error);
      toast.error("Error al cargar calles");
    } finally {
      setLoadingCalles(false);
    }
  };

  const loadCuadrantes = async () => {
    if (!selectedCalle) {
      console.warn("⚠️ loadCuadrantes: No hay calle seleccionada");
      return;
    }

    setLoadingCuadrantes(true);

    try {
      const result = await listCallesCuadrantes({
        calle_id: selectedCalle.id,
        page: currentPageCuadrantes,
        limit,
        search: searchCuadrantes || undefined,
      });

      const cuadrantesData =
        result.items || result.data?.items || result.data || [];

      setCuadrantes(cuadrantesData);
      setPaginationCuadrantes(result.pagination || result.data?.pagination);
    } catch (error) {
      console.error("❌ Error al cargar cuadrantes:", error);
      toast.error("Error al cargar cuadrantes de la calle");
    } finally {
      setLoadingCuadrantes(false);
    }
  };

  // ============================================
  // HANDLERS - CALLES
  // ============================================

  const handleViewCalleDetail = (calle) => {
    setSelectedCalle(calle);
    setView("cuadrantes");
    setCurrentPageCuadrantes(1);
    setSearchCuadrantes("");
  };

  const handleBackToCalles = () => {
    // Si vino desde otra página (Maestro de Calles), usar navigate para ir atrás en el historial
    if (cameFromExternalPage) {
      navigate(-1); // Regresar a la página anterior
    } else {
      // Si ya estaba en esta página, solo cambiar la vista interna
      setView("calles");
      setSelectedCalle(null);
      setCurrentPageCuadrantes(1);
      setSearchCuadrantes("");
      setCuadrantes([]);
    }
  };

  const handleEditCalle = (e, calle) => {
    e.stopPropagation();
    setEditingCalle(calle);
    setShowEditCalleModal(true);
  };

  const handleDeleteCalle = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("¿Está seguro de eliminar esta calle?")) return;

    try {
      await deleteCalle(id, user?.id);
      toast.success("Calle eliminada correctamente");
      loadCalles();
    } catch (error) {
      console.error("Error al eliminar calle:", error);
      toast.error(
        error.response?.data?.message || "Error al eliminar la calle"
      );
    }
  };

  const handleSearchCalles = (e) => {
    e.preventDefault();
    setCurrentPageCalles(1);
  };

  // ============================================
  // HANDLERS - CUADRANTES
  // ============================================

  const handleCreateCuadrante = () => {
    setEditingCuadrante(null);
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

  const handleEditCuadrante = (cuadrante) => {
    setEditingCuadrante(cuadrante);
    setShowEditCuadranteModal(true);
  };

  const handleDeleteCuadrante = async (id) => {
    if (!window.confirm("¿Está seguro de eliminar esta relación?")) return;

    try {
      await deleteCalleCuadrante(id, user?.id);
      toast.success("Relación eliminada correctamente");
      loadCuadrantes();
    } catch (error) {
      console.error("Error al eliminar relación:", error);
      toast.error(
        error.response?.data?.message || "Error al eliminar la relación"
      );
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {view === "calles"
                ? "Calles"
                : `Cuadrantes de ${selectedCalle?.nombre_completo}`}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {view === "calles"
                ? "Gestión de calles y sus cuadrantes"
                : "Gestión de cuadrantes por donde pasa la calle (Re Pag para volver, Alt+N para nuevo)"}
            </p>
          </div>
        </div>
      </div>

      {/* Vista de Calles */}
      {view === "calles" && (
        <div className="space-y-4">
          {/* Búsqueda y filtros */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearchCalles} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar calles..."
                  value={searchCalles}
                  onChange={(e) => setSearchCalles(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Tabla de Calles */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Urbanización
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loadingCalles ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        Cargando...
                      </td>
                    </tr>
                  ) : calles.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        No hay calles registradas
                      </td>
                    </tr>
                  ) : (
                    calles.map((calle) => (
                      <tr
                        key={calle.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => handleViewCalleDetail(calle)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700 dark:text-primary-500">
                          {calle.calle_code || calle.codigo}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                          {calle.nombre_completo}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {calle.urbanizacion || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {can("calles_update") && (
                              <button
                                onClick={(e) => handleEditCalle(e, calle)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("calles_delete") && (
                              <button
                                onClick={(e) => handleDeleteCalle(e, calle.id)}
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

            {/* Paginación Calles */}
            {paginationCalles && paginationCalles.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando página {paginationCalles.current_page} de{" "}
                  {paginationCalles.total_pages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPageCalles((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPageCalles === 1}
                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageCalles((prev) =>
                        Math.min(paginationCalles.total_pages, prev + 1)
                      )
                    }
                    disabled={
                      currentPageCalles === paginationCalles.total_pages
                    }
                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50"
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
      {view === "cuadrantes" && selectedCalle && (
        <div className="space-y-4">
          {/* Card con información de la calle */}
          <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                  Código de la Calle
                </p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">
                  {selectedCalle.calle_code || selectedCalle.codigo}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                  Nombre
                </p>
                <p className="text-lg font-bold text-primary-900 dark:text-primary-300">
                  {selectedCalle.nombre_completo}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700 dark:text-primary-400">
                  Urbanización
                </p>
                <p className="text-lg text-primary-900 dark:text-primary-300">
                  {selectedCalle.urbanizacion || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Búsqueda y acciones de cuadrantes */}
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToCalles}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Volver a Calles
            </button>

            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar por cuadrante, sector o número..."
                  value={searchCuadrantes}
                  onChange={(e) => {
                    setSearchCuadrantes(e.target.value);
                    setCurrentPageCuadrantes(1); // Reset a página 1 al buscar
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>

            {can("calles_cuadrantes_create") && (
              <button
                onClick={handleCreateCuadrante}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Nuevo Cuadrante
              </button>
            )}
          </div>

          {/* Tabla de Cuadrantes */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Cuadrante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Números
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Manzana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Lado
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loadingCuadrantes ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        Cargando...
                      </td>
                    </tr>
                  ) : cuadrantes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                      >
                        No hay cuadrantes asociados a esta calle
                      </td>
                    </tr>
                  ) : (
                    cuadrantes.map((cuad) => (
                      <tr
                        key={cuad.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-700 dark:text-primary-500">
                          {cuad.cuadrante?.cuadrante_code ||
                            cuad.Cuadrante?.cuadrante_code ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                          {cuad.cuadrante?.sector?.sector_code ||
                            cuad.Cuadrante?.Sector?.sector_code ||
                            "-"}{" "}
                          -{" "}
                          {cuad.cuadrante?.sector?.nombre ||
                            cuad.Cuadrante?.Sector?.nombre ||
                            ""}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {cuad.numero_inicio && cuad.numero_fin
                            ? `${cuad.numero_inicio} - ${cuad.numero_fin}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {cuad.manzana ? cuad.manzana : "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {cuad.lado || "AMBOS"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botón de mapa si tiene polígono */}
                            {cuad.cuadrante?.poligono_json && (
                              <button
                                onClick={() => handleViewMapaCuadrante(cuad.cuadrante)}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                title="Ver mapa"
                              >
                                <Map size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleViewCuadrante(cuad)}
                              className="text-slate-600 hover:text-slate-800 dark:text-slate-400"
                              title="Ver información completa"
                            >
                              <Eye size={18} />
                            </button>
                            {can("calles_cuadrantes_update") && (
                              <button
                                onClick={() => handleEditCuadrante(cuad)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                title="Editar"
                              >
                                <Edit size={18} />
                              </button>
                            )}
                            {can("calles_cuadrantes_delete") && (
                              <button
                                onClick={() => handleDeleteCuadrante(cuad.id)}
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

            {/* Paginación Cuadrantes */}
            {paginationCuadrantes && paginationCuadrantes.total_pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando página {paginationCuadrantes.current_page} de{" "}
                  {paginationCuadrantes.total_pages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPageCuadrantes((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPageCuadrantes === 1}
                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPageCuadrantes((prev) =>
                        Math.min(paginationCuadrantes.total_pages, prev + 1)
                      )
                    }
                    disabled={
                      currentPageCuadrantes === paginationCuadrantes.total_pages
                    }
                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modales */}
      {showEditCalleModal && (
        <CalleFormModal
          isOpen={showEditCalleModal}
          onClose={() => setShowEditCalleModal(false)}
          calle={editingCalle}
          onSuccess={() => {
            loadCalles();
            setShowEditCalleModal(false);
          }}
        />
      )}

      {showEditCuadranteModal && (
        <CalleCuadranteFormModal
          isOpen={showEditCuadranteModal}
          onClose={() => setShowEditCuadranteModal(false)}
          calleCuadrante={editingCuadrante}
          calleId={selectedCalle?.id}
          calleNombre={selectedCalle?.nombre_completo}
          onSuccess={() => {
            setTimeout(() => {
              loadCuadrantes();
            }, 500);
            setShowEditCuadranteModal(false);
          }}
        />
      )}

      {showViewCuadranteModal && viewingCuadrante && (
        <CalleCuadranteViewModal
          isOpen={showViewCuadranteModal}
          onClose={() => {
            setShowViewCuadranteModal(false);
            setViewingCuadrante(null);
          }}
          calleCuadrante={viewingCuadrante}
        />
      )}

      {showMapaCuadranteModal && mapaCuadrante && (
        <CuadranteMapaModal
          isOpen={showMapaCuadranteModal}
          onClose={() => {
            setShowMapaCuadranteModal(false);
            setMapaCuadrante(null);
          }}
          cuadrante={mapaCuadrante}
        />
      )}
    </div>
  );
}
