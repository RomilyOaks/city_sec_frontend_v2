/**
 * File: src/pages/catalogos/UnidadesOficinaPage.jsx
 * @version 1.0.0
 * @description Página de gestión de Unidades y Oficinas (SERENAZGO, PNP, BOMBEROS, etc.)
 *
 * @module src/pages/catalogos/UnidadesOficinaPage
 */

import { useState, useEffect } from "react";
import { Plus, Eye, Edit2, Trash2, Search, Building2, MapPin, Clock, Phone } from "lucide-react";
import {
  listUnidadesOficina,
  deleteUnidadOficina,
  checkUnidadOficinaCanDelete,
  getUnidadOficinaById,
} from "../../services/unidadesOficinaService";
import UnidadOficinaFormModal from "../../components/catalogos/UnidadOficinaFormModal";
import UnidadOficinaViewModal from "../../components/catalogos/UnidadOficinaViewModal";

const TIPOS_UNIDAD = [
  { value: "SERENAZGO", label: "Serenazgo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "PNP", label: "PNP", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "BOMBEROS", label: "Bomberos", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { value: "AMBULANCIA", label: "Ambulancia", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { value: "DEFENSA_CIVIL", label: "Defensa Civil", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { value: "TRANSITO", label: "Tránsito", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { value: "OTROS", label: "Otros", color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
];

export default function UnidadesOficinaPage() {
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filtros
  const [search, setSearch] = useState("");
  const [tipoUnidadFilter, setTipoUnidadFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [activo24hFilter, setActivo24hFilter] = useState("");

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadUnidades();
  }, [currentPage, search, tipoUnidadFilter, estadoFilter, activo24hFilter]);

  async function loadUnidades() {
    try {
      setLoading(true);
      const data = await listUnidadesOficina({
        page: currentPage,
        limit: 20,
        search,
        tipo_unidad: tipoUnidadFilter || null,
        estado: estadoFilter !== "" ? parseInt(estadoFilter) : null,
        activo_24h: activo24hFilter !== "" ? parseInt(activo24hFilter) : null,
      });

      setUnidades(data.unidades || data.rows || data || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || data.count || 0);
    } catch (error) {
      console.error("Error al cargar unidades:", error);
      alert("Error al cargar las unidades y oficinas");
    } finally {
      setLoading(false);
    }
  }

  function handleCreate() {
    setSelectedUnidad(null);
    setIsEditing(false);
    setShowFormModal(true);
  }

  function handleEdit(unidad) {
    setSelectedUnidad(unidad);
    setIsEditing(true);
    setShowFormModal(true);
  }

  function handleView(unidad) {
    setSelectedUnidad(unidad);
    setShowViewModal(true);
  }

  async function handleDelete(id) {
    try {
      const unidadInfo = await getUnidadOficinaById(id);
      const nombre = unidadInfo?.nombre || "";

      const checkResult = await checkUnidadOficinaCanDelete(id);
      if (checkResult && !checkResult.canDelete) {
        const count = checkResult.count || 0;
        const message = `No se puede eliminar la unidad/oficina:\n"${nombre}"\n\nHay ${count} novedad(es) asociada(s)`;
        alert(message);
        return;
      }

      if (confirm(`¿Está seguro de eliminar la unidad/oficina "${nombre}"?`)) {
        await deleteUnidadOficina(id);
        alert("Unidad/Oficina eliminada correctamente");
        loadUnidades();
      }
    } catch (error) {
      console.error("Error al eliminar unidad:", error);
      alert(error.response?.data?.message || "Error al eliminar la unidad/oficina");
    }
  }

  function handleCloseFormModal() {
    setShowFormModal(false);
    setSelectedUnidad(null);
    setIsEditing(false);
    loadUnidades();
  }

  function handleCloseViewModal() {
    setShowViewModal(false);
    setSelectedUnidad(null);
  }

  function handleClearFilters() {
    setSearch("");
    setTipoUnidadFilter("");
    setEstadoFilter("");
    setActivo24hFilter("");
    setCurrentPage(1);
  }

  function getTipoUnidadLabel(tipo) {
    const found = TIPOS_UNIDAD.find(t => t.value === tipo);
    return found ? found.label : tipo;
  }

  function getTipoUnidadColor(tipo) {
    const found = TIPOS_UNIDAD.find(t => t.value === tipo);
    return found ? found.color : "bg-gray-100 text-gray-800";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Unidades y Oficinas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión de unidades de emergencia y oficinas de atención
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600/50 dark:bg-primary-600 dark:hover:bg-primary-700"
        >
          <Plus size={18} />
          Nueva Unidad/Oficina
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, código, teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-10 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Unidad
            </label>
            <select
              value={tipoUnidadFilter}
              onChange={(e) => setTipoUnidadFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              <option value="">Todos los tipos</option>
              {TIPOS_UNIDAD.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Estado
            </label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              <option value="">Todos</option>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Operación 24h
            </label>
            <select
              value={activo24hFilter}
              onChange={(e) => setActivo24hFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              <option value="">Todos</option>
              <option value="1">24 horas</option>
              <option value="0">Horario limitado</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleClearFilters}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary-700 dark:hover:text-primary-500"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {totalRecords} {totalRecords === 1 ? "registro encontrado" : "registros encontrados"}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
          </div>
        ) : unidades.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              No hay unidades/oficinas
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Comienza creando una nueva unidad u oficina
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Horario
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {unidades.map((unidad) => (
                  <tr key={unidad.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-slate-400" />
                        {unidad.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getTipoUnidadColor(unidad.tipo_unidad)}`}>
                        {getTipoUnidadLabel(unidad.tipo_unidad)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-mono">
                      {unidad.codigo || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Phone size={14} className="text-slate-400" />
                        {unidad.telefono || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-slate-400" />
                        <span className="truncate max-w-[200px]" title={unidad.direccion}>
                          {unidad.direccion || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-slate-400" />
                        {unidad.activo_24h ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">24h</span>
                        ) : (
                          <span className="text-xs">
                            {unidad.horario_inicio && unidad.horario_fin
                              ? `${unidad.horario_inicio}-${unidad.horario_fin}`
                              : "-"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {unidad.estado ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2 py-1 text-xs font-medium text-green-800 dark:text-green-200">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900 px-2 py-1 text-xs font-medium text-red-800 dark:text-red-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(unidad)}
                          className="text-slate-600 hover:text-primary-700 dark:text-slate-400 dark:hover:text-primary-500"
                          title="Ver detalle"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(unidad)}
                          className="text-slate-600 hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-500"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(unidad.id)}
                          className="text-slate-600 hover:text-red-700 dark:text-slate-400 dark:hover:text-red-500"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <UnidadOficinaFormModal
          isOpen={showFormModal}
          onClose={handleCloseFormModal}
          unidadInicial={selectedUnidad}
          isEditing={isEditing}
        />
      )}

      {showViewModal && (
        <UnidadOficinaViewModal
          isOpen={showViewModal}
          onClose={handleCloseViewModal}
          unidadInicial={selectedUnidad}
        />
      )}
    </div>
  );
}
