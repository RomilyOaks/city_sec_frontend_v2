/**
 * File: src/components/catalogos/RadioTetraFilters.jsx
 * @version 1.0.0
 * @description Componente de filtros para radios TETRA
 *
 * @module src/components/catalogos/RadioTetraFilters.jsx
 */

import React, { useState } from "react";
import { Search, X, Filter } from "lucide-react";

/**
 * Componente de filtros para radios TETRA
 * @component
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function RadioTetraFilters({ filtros, onAplicar, onCancelar }) {
  // Estado local para filtros
  const [filtrosLocales, setFiltrosLocales] = useState({
    search: filtros.search || "",
    estado: filtros.estado !== undefined ? filtros.estado.toString() : "",
    asignado: filtros.asignado || "all",
  });

  // Manejar cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltrosLocales((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Aplicar filtros
  const handleAplicar = () => {
    const filtrosAplicados = {
      ...filtrosLocales,
      estado: filtrosLocales.estado === "" ? "" : filtrosLocales.estado === "true",
    };
    onAplicar(filtrosAplicados);
  };

  // Limpiar filtros
  const handleLimpiar = () => {
    setFiltrosLocales({
      search: "",
      estado: "",
      asignado: "all",
    });
  };

  // Renderizado
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Filtros de Búsqueda
          </h3>
        </div>
        <button
          onClick={onCancelar}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Búsqueda general */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Búsqueda
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              name="search"
              value={filtrosLocales.search}
              onChange={handleChange}
              placeholder="Buscar por código o descripción..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <select
            name="estado"
            value={filtrosLocales.estado}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Asignación */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Asignación
          </label>
          <select
            name="asignado"
            value={filtrosLocales.asignado}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="true">Asignados</option>
            <option value="false">Disponibles</option>
          </select>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={handleLimpiar}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          Limpiar
        </button>
        <button
          onClick={handleAplicar}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
        >
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}
