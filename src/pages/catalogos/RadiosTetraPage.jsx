/**
 * File: src/pages/catalogos/RadiosTetraPage.jsx
 * @version 1.0.0
 * @description Página principal de mantenimiento de Radios TETRA
 *
 * Funcionalidades:
 * - Listado de radios con paginación y filtros
 * - CRUD completo (Crear, Leer, Actualizar, Eliminar)
 * - Asignación/Desasignación de personal
 * - Búsqueda optimizada de personal
 *
 * @module src/pages/catalogos/RadiosTetraPage.jsx
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Radio,
  Search,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  ToggleLeft,
  ToggleRight,
  Filter,
  RefreshCw,
} from "lucide-react";

// Importar componentes
import RadioTetraList from "../../components/catalogos/RadioTetraList.jsx";
import RadioTetraFormModal from "../../components/catalogos/RadioTetraFormModal.jsx";
import AsignarPersonalModal from "../../components/catalogos/AsignarPersonalModal.jsx";
import RadioTetraFilters from "../../components/catalogos/RadioTetraFilters.jsx";

// Importar servicios
import { radioTetraService } from "../../services/radiosTetraService.js";
import { useAuthStore } from "../../store/useAuthStore";
import { canPerformAction, getUserRoleSlugs, ROLE_SLUGS } from "../../rbac/rbac.js";
import { extractValidationErrors } from "../../utils/errorUtils";

/**
 * Página principal de mantenimiento de Radios TETRA
 * @component
 * @returns {JSX.Element}
 */
export default function RadiosTetraPage() {
  const user = useAuthStore((s) => s.user);
  const canCreate = canPerformAction(user, "catalogos.radios_tetra.create");
  const canEdit = canPerformAction(user, "catalogos.radios_tetra.update");
  const canDelete = canPerformAction(user, "catalogos.radios_tetra.delete");
  const canAsignar = canPerformAction(user, "catalogos.radios_tetra.asignar");
  const canCambiarEstado = getUserRoleSlugs(user).some((r) =>
    [ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.ADMIN, ROLE_SLUGS.SUPERVISOR].includes(r)
  );

  // Estados principales
  const [radios, setRadios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Estados de modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Estados de datos
  const [radioSeleccionado, setRadioSeleccionado] = useState(null);
  const [filtros, setFiltros] = useState({
    search: "",
    estado: "",
    asignado: "all",
    page: 1,
    limit: 10,
  });

  // Cargar radios
  const cargarRadios = async (nuevosFiltros = {}) => {
    setLoading(true);
    try {
      const filtrosAplicados = { ...filtros, ...nuevosFiltros };
      const response = await radioTetraService.getAllRadios(filtrosAplicados);

      // Manejar diferentes estructuras de respuesta
      let radiosData, paginationData;

      if (response.data?.data?.radios) {
        // Estructura: { data: { radios: [...], pagination: {...} } }
        radiosData = response.data.data.radios;
        paginationData = response.data.data.pagination;
      } else if (response.data?.radios) {
        // Estructura: { radios: [...], pagination: {...} }
        radiosData = response.data.radios;
        paginationData = response.data.pagination;
      } else if (response.data?.success?.radios) {
        // Estructura: { success: { radios: [...], pagination: {...} } }
        radiosData = response.data.success.radios;
        paginationData = response.data.success.pagination;
      } else if (Array.isArray(response.data)) {
        // Estructura: [...]
        radiosData = response.data;
        paginationData = { currentPage: 1, totalPages: 1, total: radiosData.length };
      } else {
        console.error("🚨 Estructura de respuesta no reconocida:", response);
        toast.error("Error en la estructura de datos del servidor");
        return;
      }

      setRadios(radiosData || []);
      setPagination(paginationData || { currentPage: 1, totalPages: 1, total: 0 });
      setFiltros(filtrosAplicados);
    } catch (error) {
      console.error("Error cargando radios:", error);
      toast.error("Error al cargar los radios TETRA");
    } finally {
      setLoading(false);
    }
  };

  // Efecto inicial
  useEffect(() => {
    cargarRadios();
  }, []);

  // Manejar creación
  const handleCrear = () => {
    setRadioSeleccionado(null);
    setShowCreateModal(true);
  };

  // Manejar edición
  const handleEditar = (radio) => {
    setRadioSeleccionado(radio);
    setShowEditModal(true);
  };

  // Manejar eliminación
  const handleEliminar = async (radio) => {
    if (!window.confirm(`¿Está seguro de eliminar el radio "${radio.radio_tetra_code}"?`)) {
      return;
    }

    try {
      await radioTetraService.deleteRadio(radio.id);
      toast.success("Radio eliminado exitosamente");
      await cargarRadios();
    } catch (error) {
      console.error("Error eliminando radio:", error);
      toast.error(extractValidationErrors(error) || "Error al eliminar el radio");
    }
  };

  // Manejar asignación
  const handleAsignar = (radio) => {
    setRadioSeleccionado(radio);
    setShowAsignarModal(true);
  };

  // Manejar desasignación
  const handleDesasignar = async (radio) => {
    try {
      await radioTetraService.desasignarRadio(radio.id);
      toast.success("Radio desasignado exitosamente");
      await cargarRadios();
    } catch (error) {
      console.error("Error desasignando radio:", error);
      toast.error(extractValidationErrors(error) || "Error al desasignar el radio");
    }
  };

  // Manejar cambio de estado
  const handleCambiarEstado = async (radio) => {
    try {
      const accion = radio.estado ? "desactivar" : "activar";
      await radioTetraService[accion === "activar" ? "activarRadio" : "desactivarRadio"](
        radio.id
      );
      toast.success(`Radio ${accion}do exitosamente`);
      await cargarRadios();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      toast.error(extractValidationErrors(error) || "Error al cambiar el estado del radio");
    }
  };

  // Manejar cambio de página
  const handleCambioPagina = (pagina) => {
    cargarRadios({ page: pagina });
  };

  // Manejar filtros
  const handleAplicarFiltros = (nuevosFiltros) => {
    cargarRadios({ ...nuevosFiltros, page: 1 });
  };

  // Manejar refresh
  const handleRefresh = () => {
    cargarRadios();
  };

  // Renderizado
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Radios TETRA
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Mantenimiento de radios de comunicación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
          >
            <Filter size={16} />
            Filtros
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>

          {canCreate && (
            <button
              onClick={handleCrear}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            >
              <Plus size={16} />
              Nuevo Radio
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <RadioTetraFilters
          filtros={filtros}
          onAplicar={handleAplicarFiltros}
          onCancelar={() => setShowFilters(false)}
        />
      )}

      {/* Lista de radios */}
      <RadioTetraList
        radios={radios}
        loading={loading}
        pagination={pagination}
        onEditar={handleEditar}
        onEliminar={handleEliminar}
        onAsignar={handleAsignar}
        onDesasignar={handleDesasignar}
        onCambiarEstado={handleCambiarEstado}
        onCambioPagina={handleCambioPagina}
        canEdit={canEdit}
        canDelete={canDelete}
        canAsignar={canAsignar}
        canCambiarEstado={canCambiarEstado}
      />

      {/* Modal de creación */}
      {showCreateModal && (
        <RadioTetraFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            cargarRadios();
          }}
          mode="create"
        />
      )}

      {/* Modal de edición */}
      {showEditModal && (
        <RadioTetraFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            cargarRadios();
          }}
          mode="edit"
          radio={radioSeleccionado}
        />
      )}

      {/* Modal de asignación */}
      {showAsignarModal && (
        <AsignarPersonalModal
          isOpen={showAsignarModal}
          onClose={() => setShowAsignarModal(false)}
          onSuccess={() => {
            setShowAsignarModal(false);
            cargarRadios();
          }}
          radio={radioSeleccionado}
        />
      )}
    </div>
  );
}
