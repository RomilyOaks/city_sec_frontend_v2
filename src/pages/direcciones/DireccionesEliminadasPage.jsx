/**
 * File: src/pages/direcciones/DireccionesEliminadasPage.jsx
 * @version 1.0.0
 * @description Página para gestionar direcciones eliminadas (soft-deleted) y reactivarlas
 *
 * @module src/pages/direcciones/DireccionesEliminadasPage
 */

import { useState, useEffect } from "react";
import { Trash2, RefreshCw, RotateCcw, MapPin, Navigation, Map as MapIcon, X, Search, Eye } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { canPerformAction } from "../../rbac/rbac";
import api from "../../services/api";
import { reactivarDireccion } from "../../services/direccionesService";
import DireccionViewModal from "../../components/direcciones/DireccionViewModal";

export default function DireccionesEliminadasPage() {
  const { user } = useAuthStore();

  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDireccion, setSelectedDireccion] = useState(null);

  // Permisos - Solo super_admin puede reactivar según las especificaciones del backend
  const canReactivate = user?.roles?.some(r => r.slug === "super_admin");

  useEffect(() => {
    loadDireccionesEliminadas();
  }, [currentPage, search]);

  /**
   * Cargar direcciones eliminadas desde el backend
   */
  async function loadDireccionesEliminadas() {
    try {
      setLoading(true);

      // Construir params - usar paranoid=false para obtener registros eliminados
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", 20);
      if (search) params.append("search", search);
      params.append("paranoid", "false"); // Flag para incluir soft-deleted en Sequelize

      const url = `/direcciones?${params.toString()}`;
      console.log("🔗 [DireccionesEliminadasPage] Llamando a:", url);

      const res = await api.get(url);
      console.log("📦 [DireccionesEliminadasPage] Respuesta raw:", res.data);

      const data = res.data?.data || res.data;

      // Filtrar solo las que tienen deleted_at NOT NULL
      const eliminadas = (data.items || data || []).filter(d => d.deleted_at !== null);

      console.log("📦 [DireccionesEliminadasPage] Direcciones eliminadas encontradas:", eliminadas.length);

      setDirecciones(eliminadas);
      setPagination({
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        totalItems: eliminadas.length,
        limit: data.limit || 20,
      });
    } catch (error) {
      console.error("❌ Error al cargar direcciones eliminadas:", error);
      console.error("❌ Detalles del error:", error.response?.data || error.message);
      alert("Error al cargar direcciones eliminadas: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Formatear dirección completa
   */
  function formatDireccion(dir) {
    if (dir.direccion_completa) return dir.direccion_completa;

    const partes = [];
    if (dir.calle?.nombre_completo) partes.push(dir.calle.nombre_completo);
    if (dir.numero_municipal) partes.push(`N° ${dir.numero_municipal}`);
    if (dir.manzana && dir.lote) partes.push(`Mz. ${dir.manzana} Lt. ${dir.lote}`);
    if (dir.tipo_complemento && dir.numero_complemento) {
      partes.push(`${dir.tipo_complemento} ${dir.numero_complemento}`);
    }
    return partes.join(" ") || "Sin especificar";
  }

  /**
   * Ver información completa
   */
  function handleView(direccion) {
    setSelectedDireccion(direccion);
    setShowViewModal(true);
  }

  /**
   * Reactivar dirección eliminada
   */
  async function handleReactivar(id) {
    const confirmacion = window.confirm(
      "¿Está seguro que desea reactivar esta dirección?\n\n" +
      "Esta acción:\n" +
      "• Cambiará el estado a ACTIVO (estado = 1)\n" +
      "• Eliminará la marca de eliminación (deleted_at = NULL)\n" +
      "• La dirección volverá a aparecer en la lista principal"
    );

    if (!confirmacion) return;

    try {
      setLoading(true);
      console.log("♻️ Reactivando dirección ID:", id);

      await reactivarDireccion(id);

      alert("✅ Dirección reactivada exitosamente");

      // Recargar lista
      loadDireccionesEliminadas();
    } catch (error) {
      console.error("❌ Error al reactivar dirección:", error);

      if (error.response?.status === 403) {
        alert("❌ No tiene permisos para reactivar direcciones (solo super_admin)");
      } else if (error.response?.status === 404) {
        alert("❌ Dirección no encontrada");
      } else {
        alert("❌ Error al reactivar dirección: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trash2 size={28} className="text-red-600 dark:text-red-400" />
            Direcciones Eliminadas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gestión y reactivación de direcciones eliminadas (solo super_admin)
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCurrentPage(1);
            loadDireccionesEliminadas();
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
          title="Recargar datos"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 gap-4">
          {/* Búsqueda */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por dirección, número, manzana, lote..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 pl-10 pr-10 py-2 focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white"
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
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Dirección Completa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Eliminado Por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Fecha Eliminación
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
                    Cargando direcciones eliminadas...
                  </td>
                </tr>
              ) : direcciones.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No hay direcciones eliminadas
                  </td>
                </tr>
              ) : (
                direcciones.map((dir) => (
                  <tr
                    key={dir.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-900 dark:text-white">
                      {dir.direccion_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                      <div>{formatDireccion(dir)}</div>
                      {dir.urbanizacion && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {dir.urbanizacion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {dir.deleted_by || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {dir.deleted_at ? new Date(dir.deleted_at).toLocaleString("es-PE") : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(dir)}
                          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                          title="Ver información completa"
                        >
                          <Eye size={18} />
                        </button>
                        {canReactivate && (
                          <button
                            onClick={() => handleReactivar(dir.id)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400"
                            title="Reactivar dirección"
                          >
                            <RotateCcw size={18} />
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
              {pagination.totalItems} direcciones eliminadas
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

      {/* Modal de Vista */}
      {showViewModal && selectedDireccion && (
        <DireccionViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedDireccion(null);
          }}
          direccion={selectedDireccion}
        />
      )}
    </div>
  );
}
