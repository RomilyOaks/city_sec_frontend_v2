/**
 * File: src/components/catalogos/RadioTetraList.jsx
 * @version 1.0.0
 * @description Componente de lista de radios TETRA
 *
 * @module src/components/catalogos/RadioTetraList.jsx
 */

import React from "react";
import {
  Radio,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * Componente de lista de radios TETRA
 * @component
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function RadioTetraList({
  radios,
  loading,
  pagination,
  onEditar,
  onEliminar,
  onAsignar,
  onDesasignar,
  onCambiarEstado,
  onCambioPagina,
  canEdit = false,
  canDelete = false,
  canAsignar = false,
  canCambiarEstado = false,
}) {
  // Manejar cambio de página
  const handleCambioPagina = (pagina) => {
    if (pagina >= 1 && pagina <= pagination.totalPages) {
      onCambioPagina(pagina);
    }
  };

  // Renderizar estado del radio
  const renderEstado = (radio) => {
    const baseClass = `inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
      radio.estado
        ? "bg-green-100 text-green-800"
        : "bg-red-100 text-red-800"
    }`;
    const content = radio.estado ? (
      <><ToggleRight size={12} />Activo</>
    ) : (
      <><ToggleLeft size={12} />Inactivo</>
    );

    if (canCambiarEstado) {
      return (
        <button
          onClick={() => onCambiarEstado(radio)}
          className={`${baseClass} hover:opacity-80 cursor-pointer`}
          title="Cambiar estado"
        >
          {content}
        </button>
      );
    }
    return <span className={baseClass}>{content}</span>;
  };

  // Renderizar asignación
  const renderAsignacion = (radio) => {
    if (radio.personal_seguridad_id) {
      return (
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              {radio.personalAsignado?.nombres} {radio.personalAsignado?.apellido_paterno}
            </div>
            <div className="text-gray-500 dark:text-gray-400">
              {radio.personalAsignado?.doc_tipo}-{radio.personalAsignado?.doc_numero}
            </div>
          </div>
          {canAsignar && (
            <button
              onClick={() => onDesasignar(radio)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              title="Desasignar personal"
            >
              <UserMinus size={16} />
            </button>
          )}
        </div>
      );
    }

    if (!canAsignar) return null;

    return (
      <button
        onClick={() => onAsignar(radio)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900 dark:hover:bg-blue-800"
      >
        <UserPlus size={12} />
        Asignar
      </button>
    );
  };

  // Renderizar acciones
  const renderAcciones = (radio) => {
    return (
      <div className="flex items-center gap-2">
        {canEdit && (
          <button
            onClick={() => onEditar(radio)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            title="Editar radio"
          >
            <Edit2 size={16} />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => onEliminar(radio)}
            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            title="Eliminar radio"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    );
  };

  // Renderizar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando...</span>
      </div>
    );
  }

  // Renderizar lista vacía
  if (radios.length === 0) {
    return (
      <div className="text-center py-12">
        <Radio size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No se encontraron radios
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          No hay radios TETRA que coincidan con los filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de radios */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Personal Asignado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {radios.map((radio) => (
                <tr key={radio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Radio size={16} className="text-gray-400 dark:text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {radio.radio_tetra_code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {radio.descripcion || "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderAsignacion(radio)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderEstado(radio)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderAcciones(radio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando{" "}
            <span className="font-medium">
              {(pagination.currentPage - 1) * pagination.limit + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.limit, pagination.total)}
            </span>{" "}
            de{" "}
            <span className="font-medium">{pagination.total}</span> resultados
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCambioPagina(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>

            <span className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Página {pagination.currentPage} de {pagination.totalPages}
            </span>

            <button
              onClick={() => handleCambioPagina(pagination.currentPage + 1)}
              disabled={!pagination.hasNext}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
