/**
 * File: src/pages/catalogos/TiposSubtiposNovedadPage.jsx
 * @version 1.0.0
 * @description Página de gestión de tipos y subtipos de novedad (Master-Detail)
 */

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, FileText, ArrowLeft, Eye, RotateCcw } from "lucide-react";
import {
  listTiposNovedad,
  deleteTipoNovedad,
  getTiposNovedadEliminados,
  reactivarTipoNovedad,
} from "../../services/tiposNovedadService";
import {
  listSubtiposNovedad,
  deleteSubtipoNovedad,
  getSubtiposNovedadEliminados,
  reactivarSubtipoNovedad,
} from "../../services/subtiposNovedadService";
import { useAuthStore } from "../../store/useAuthStore";
import TipoNovedadFormModal from "../../components/catalogos/TipoNovedadFormModal";
import SubtipoNovedadFormModal from "../../components/catalogos/SubtipoNovedadFormModal";
import TipoNovedadViewModal from "../../components/catalogos/TipoNovedadViewModal";
import SubtipoNovedadViewModal from "../../components/catalogos/SubtipoNovedadViewModal";
import toast from "react-hot-toast";
import { canPerformAction } from "../../rbac/rbac.js";

export default function TiposSubtiposNovedadPage() {
  const user = useAuthStore((s) => s.user);

  // Vista actual: "tipos" o "subtipos"
  const [view, setView] = useState("tipos");
  const [selectedTipo, setSelectedTipo] = useState(null);

  // Estado de Tipos de Novedad
  const [tipos, setTipos] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [searchTipos, setSearchTipos] = useState("");
  const [showCreateTipoModal, setShowCreateTipoModal] = useState(false);
  const [showEditTipoModal, setShowEditTipoModal] = useState(false);
  const [showViewTipoModal, setShowViewTipoModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [viewingTipo, setViewingTipo] = useState(null);
  const [showEliminadosTipos, setShowEliminadosTipos] = useState(false);

  // Estado de Subtipos de Novedad
  const [subtipos, setSubtipos] = useState([]);
  const [loadingSubtipos, setLoadingSubtipos] = useState(false);
  const [searchSubtipos, setSearchSubtipos] = useState("");
  const [showCreateSubtipoModal, setShowCreateSubtipoModal] = useState(false);
  const [showEditSubtipoModal, setShowEditSubtipoModal] = useState(false);
  const [showViewSubtipoModal, setShowViewSubtipoModal] = useState(false);
  const [editingSubtipo, setEditingSubtipo] = useState(null);
  const [viewingSubtipo, setViewingSubtipo] = useState(null);
  const [showEliminadosSubtipos, setShowEliminadosSubtipos] = useState(false);

  // Permisos
  const canCreateTipos = canPerformAction(user, "catalogos.tipos_novedad.create");
  const canEditTipos = canPerformAction(user, "catalogos.tipos_novedad.update");
  const canDeleteTipos = canPerformAction(user, "catalogos.tipos_novedad.delete");
  const canCreateSubtipos = canPerformAction(user, "catalogos.subtipos_novedad.create");
  const canEditSubtipos = canPerformAction(user, "catalogos.subtipos_novedad.update");
  const canDeleteSubtipos = canPerformAction(user, "catalogos.subtipos_novedad.delete");

  // Cargar tipos de novedad
  const fetchTipos = async () => {
    setLoadingTipos(true);
    try {
      const data = showEliminadosTipos
        ? await getTiposNovedadEliminados()
        : await listTiposNovedad();
      console.log("[TiposSubtiposNovedadPage] fetchTipos - data recibida:", data);
      console.log("[TiposSubtiposNovedadPage] Array.isArray(data):", Array.isArray(data));
      setTipos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar tipos de novedad");
      console.error(error);
    } finally {
      setLoadingTipos(false);
    }
  };

  // Cargar subtipos de novedad
  const fetchSubtipos = async () => {
    if (!selectedTipo?.id) return;

    setLoadingSubtipos(true);
    try {
      const data = showEliminadosSubtipos
        ? await getSubtiposNovedadEliminados()
        : await listSubtiposNovedad(selectedTipo.id);
      console.log("[TiposSubtiposNovedadPage] fetchSubtipos - data recibida:", data);
      setSubtipos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar subtipos de novedad");
      console.error(error);
    } finally {
      setLoadingSubtipos(false);
    }
  };

  useEffect(() => {
    if (view === "tipos") {
      fetchTipos();
    }
  }, [view, showEliminadosTipos]);

  useEffect(() => {
    if (view === "subtipos" && selectedTipo) {
      fetchSubtipos();
    }
  }, [view, selectedTipo, showEliminadosSubtipos]);

  // Manejo de tecla ESC - Solo para navegación entre vistas (no modales)
  // Los modales manejan su propio ESC internamente
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        // Si hay algún modal abierto, no hacer nada aquí
        // Los modales tienen su propio handler de ESC
        const hayModalAbierto =
          showCreateTipoModal ||
          showEditTipoModal ||
          showViewTipoModal ||
          showCreateSubtipoModal ||
          showEditSubtipoModal ||
          showViewSubtipoModal;

        if (hayModalAbierto) {
          return; // Dejar que el modal maneje el ESC
        }

        // Si estamos en vista de subtipos y no hay modal, volver a tipos
        if (view === "subtipos") {
          setView("tipos");
          setSelectedTipo(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    view,
    showCreateTipoModal,
    showEditTipoModal,
    showViewTipoModal,
    showCreateSubtipoModal,
    showEditSubtipoModal,
    showViewSubtipoModal,
  ]);

  const handleDeleteTipo = async (tipo) => {
    const confirmed = window.confirm(`¿Eliminar tipo de novedad "${tipo.nombre}"?`);
    if (!confirmed) return;

    try {
      await deleteTipoNovedad(tipo.id);
      toast.success("Tipo de novedad eliminado");
      fetchTipos();
    } catch (error) {
      toast.error("Error al eliminar tipo de novedad");
      console.error(error);
    }
  };

  const handleDeleteSubtipo = async (subtipo) => {
    const confirmed = window.confirm(`¿Eliminar subtipo de novedad "${subtipo.nombre}"?`);
    if (!confirmed) return;

    try {
      await deleteSubtipoNovedad(subtipo.id);
      toast.success("Subtipo de novedad eliminado");
      fetchSubtipos();
    } catch (error) {
      toast.error("Error al eliminar subtipo de novedad");
      console.error(error);
    }
  };

  const handleReactivarTipo = async (tipo) => {
    try {
      await reactivarTipoNovedad(tipo.id);
      toast.success("Tipo de novedad reactivado");
      fetchTipos();
    } catch (error) {
      toast.error("Error al reactivar tipo de novedad");
      console.error(error);
    }
  };

  const handleReactivarSubtipo = async (subtipo) => {
    try {
      await reactivarSubtipoNovedad(subtipo.id);
      toast.success("Subtipo de novedad reactivado");
      fetchSubtipos();
    } catch (error) {
      toast.error("Error al reactivar subtipo de novedad");
      console.error(error);
    }
  };

  const openEditTipoModal = (tipo) => {
    setEditingTipo(tipo);
    setShowEditTipoModal(true);
  };

  const openEditSubtipoModal = (subtipo) => {
    setEditingSubtipo(subtipo);
    setShowEditSubtipoModal(true);
  };

  const openViewTipoModal = (tipo) => {
    setViewingTipo(tipo);
    setShowViewTipoModal(true);
  };

  const openViewSubtipoModal = (subtipo) => {
    setViewingSubtipo(subtipo);
    setShowViewSubtipoModal(true);
  };

  const handleSelectTipo = (tipo) => {
    setSelectedTipo(tipo);
    setView("subtipos");
  };

  // Filtrado
  const tiposFiltrados = tipos.filter((tipo) =>
    tipo.nombre?.toLowerCase().includes(searchTipos.toLowerCase()) ||
    tipo.descripcion?.toLowerCase().includes(searchTipos.toLowerCase())
  );

  const subtiposFiltrados = subtipos.filter((subtipo) =>
    subtipo.nombre?.toLowerCase().includes(searchSubtipos.toLowerCase()) ||
    subtipo.descripcion?.toLowerCase().includes(searchSubtipos.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {view === "tipos" ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                Tipos de Novedad
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Gestiona los tipos de novedad del sistema
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setView("tipos")}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                    Subtipos de Novedad
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Tipo:{" "}
                    <span className="font-semibold text-primary-700 dark:text-primary-400">
                      {selectedTipo?.nombre}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {view === "tipos" ? (
            <>
              <button
                onClick={() => setShowEliminadosTipos(!showEliminadosTipos)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showEliminadosTipos
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {showEliminadosTipos ? "Ver Activos" : "Ver Eliminados"}
              </button>
              {canCreateTipos && (
                <button
                  onClick={() => setShowCreateTipoModal(true)}
                  className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium flex items-center gap-2"
                >
                  <Plus size={16} />
                  Nuevo Tipo
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setShowEliminadosSubtipos(!showEliminadosSubtipos)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showEliminadosSubtipos
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {showEliminadosSubtipos ? "Ver Activos" : "Ver Eliminados"}
              </button>
              {canCreateSubtipos && (
                <button
                  onClick={() => setShowCreateSubtipoModal(true)}
                  className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium flex items-center gap-2"
                >
                  <Plus size={16} />
                  Nuevo Subtipo
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Vista de Tipos */}
      {view === "tipos" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {/* Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar tipos de novedad..."
                value={searchTipos}
                onChange={(e) => setSearchTipos(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loadingTipos ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Cargando...</p>
              </div>
            ) : tiposFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                  No se encontraron tipos de novedad
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {searchTipos ? "Intenta con otra búsqueda" : "Crea tu primer tipo de novedad"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {tiposFiltrados.map((tipo) => (
                    <tr
                      key={tipo.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                      onClick={() => handleSelectTipo(tipo)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: tipo.color_hex || tipo.color || "#6B7280" }}
                          >
                            {tipo.nombre?.charAt(0) || "T"}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-50">
                            {tipo.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {tipo.descripcion || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openViewTipoModal(tipo);
                            }}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ver detalle"
                          >
                            <Eye size={14} />
                          </button>
                          {canEditTipos && !tipo.deleted_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditTipoModal(tipo);
                              }}
                              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {canDeleteTipos && !tipo.deleted_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTipo(tipo);
                              }}
                              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {canDeleteTipos && tipo.deleted_at && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReactivarTipo(tipo);
                              }}
                              className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Reactivar"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Vista de Subtipos */}
      {view === "subtipos" && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {/* Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar subtipos de novedad..."
                value={searchSubtipos}
                onChange={(e) => setSearchSubtipos(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loadingSubtipos ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                <p className="mt-2 text-slate-600 dark:text-slate-400">Cargando...</p>
              </div>
            ) : subtiposFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                  No se encontraron subtipos de novedad
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {searchSubtipos ? "Intenta con otra búsqueda" : "Crea tu primer subtipo de novedad"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Prioridad
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {subtiposFiltrados.map((subtipo) => (
                    <tr key={subtipo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                            style={{ backgroundColor: subtipo.color || "#6B7280" }}
                          >
                            {subtipo.nombre?.charAt(0) || "S"}
                          </div>
                          <span className="font-medium text-slate-900 dark:text-slate-50">
                            {subtipo.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {subtipo.descripcion || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            subtipo.prioridad === "ALTA"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : subtipo.prioridad === "MEDIA"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {subtipo.prioridad || "BAJA"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewSubtipoModal(subtipo)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Ver detalle"
                          >
                            <Eye size={14} />
                          </button>
                          {canEditSubtipos && !subtipo.deleted_at && (
                            <button
                              onClick={() => openEditSubtipoModal(subtipo)}
                              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {canDeleteSubtipos && !subtipo.deleted_at && (
                            <button
                              onClick={() => handleDeleteSubtipo(subtipo)}
                              className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                          {canDeleteSubtipos && subtipo.deleted_at && (
                            <button
                              onClick={() => handleReactivarSubtipo(subtipo)}
                              className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                              title="Reactivar"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modales de Tipos */}
      {showCreateTipoModal && (
        <TipoNovedadFormModal
          onClose={() => setShowCreateTipoModal(false)}
          onSuccess={() => {
            setShowCreateTipoModal(false);
            fetchTipos();
          }}
        />
      )}

      {showEditTipoModal && editingTipo && (
        <TipoNovedadFormModal
          tipo={editingTipo}
          onClose={() => {
            setShowEditTipoModal(false);
            setEditingTipo(null);
          }}
          onSuccess={() => {
            setShowEditTipoModal(false);
            setEditingTipo(null);
            fetchTipos();
          }}
        />
      )}

      {showViewTipoModal && viewingTipo && (
        <TipoNovedadViewModal
          tipo={viewingTipo}
          onClose={() => {
            setShowViewTipoModal(false);
            setViewingTipo(null);
          }}
        />
      )}

      {/* Modales de Subtipos */}
      {showCreateSubtipoModal && (
        <SubtipoNovedadFormModal
          tipoId={selectedTipo?.id}
          onClose={() => setShowCreateSubtipoModal(false)}
          onSuccess={() => {
            setShowCreateSubtipoModal(false);
            fetchSubtipos();
          }}
        />
      )}

      {showEditSubtipoModal && editingSubtipo && (
        <SubtipoNovedadFormModal
          subtipo={editingSubtipo}
          tipoId={selectedTipo?.id}
          onClose={() => {
            setShowEditSubtipoModal(false);
            setEditingSubtipo(null);
          }}
          onSuccess={() => {
            setShowEditSubtipoModal(false);
            setEditingSubtipo(null);
            fetchSubtipos();
          }}
        />
      )}

      {showViewSubtipoModal && viewingSubtipo && (
        <SubtipoNovedadViewModal
          subtipo={viewingSubtipo}
          onClose={() => {
            setShowViewSubtipoModal(false);
            setViewingSubtipo(null);
          }}
        />
      )}
    </div>
  );
}
