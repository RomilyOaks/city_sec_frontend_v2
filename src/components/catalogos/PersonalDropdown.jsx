/**
 * File: src/components/catalogos/PersonalDropdown.jsx
 * @version 1.0.0
 * @description Dropdown optimizado para búsqueda de personal
 *
 * @module src/components/catalogos/PersonalDropdown.jsx
 */

import React, { useState, useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { Search, User, AlertCircle } from "lucide-react";
import api from "../../services/api.js";

/**
 * Dropdown optimizado para búsqueda de personal
 * @component
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function PersonalDropdown({
  onSeleccionar,
  value,
  disabled = false,
  placeholder = "Buscar personal...",
}) {
  // Estados
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [error, setError] = useState("");

  // Búsqueda optimizada con debounce
  const buscarPersonal = useCallback(
    debounce(async (termino) => {
      if (termino.length < 3) {
        setResultados([]);
        setMostrarResultados(false);
        return;
      }

      setCargando(true);
      setError("");

      try {
        const response = await api.get("/personal/buscar-para-dropdown", {
          params: {
            q: termino,
            limit: 20,
          },
        });

        setResultados(response.data.data || []);
        setMostrarResultados(true);
      } catch (err) {
        console.error("Error buscando personal:", err);
        setError("Error al buscar personal");
        setResultados([]);
        setMostrarResultados(false);
      } finally {
        setCargando(false);
      }
    }, 300),
    []
  );

  // Manejar cambio en búsqueda
  const handleBusquedaChange = (e) => {
    const termino = e.target.value;
    setBusqueda(termino);
    buscarPersonal(termino);
  };

  // Manejar selección
  const handleSeleccionar = (personal) => {
    onSeleccionar(personal);
    setBusqueda("");
    setResultados([]);
    setMostrarResultados(false);
    setError("");
  };

  // Manejar foco
  const handleFocus = () => {
    if (busqueda.length >= 3) {
      setMostrarResultados(true);
    }
  };

  // Manejar blur
  const handleBlur = () => {
    // Pequeño delay para permitir clic en resultados
    setTimeout(() => {
      setMostrarResultados(false);
    }, 200);
  };

  // Formato de display para valor seleccionado
  const valorSeleccionadoDisplay = useMemo(() => {
    if (!value) return "";
    return value.display_text || `${value.apellido_paterno} ${value.apellido_materno}, ${value.nombres}`;
  }, [value]);

  // Renderizado
  return (
    <div className="relative">
      {/* Input de búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {cargando ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          ) : (
            <Search size={16} className="text-gray-400" />
          )}
        </div>
        
        <input
          type="text"
          value={value ? valorSeleccionadoDisplay : busqueda}
          onChange={handleBusquedaChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={value ? valorSeleccionadoDisplay : placeholder}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
            error
              ? "border-red-500 dark:border-red-500"
              : "border-gray-300 dark:border-gray-600"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        
        {value && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={() => {
                onSeleccionar(null);
                setBusqueda("");
                setResultados([]);
                setMostrarResultados(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-1 flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Resultados de búsqueda */}
      {mostrarResultados && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {cargando ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Buscando...
              </span>
            </div>
          ) : resultados.length > 0 ? (
            <div className="py-1">
              {resultados.map((personal) => (
                <div
                  key={personal.id}
                  onClick={() => handleSeleccionar(personal)}
                  className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                        <User size={16} className="text-primary-600 dark:text-primary-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {personal.nombre_completo}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {personal.documento} • {personal.codigo_acceso}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : busqueda.length >= 3 ? (
            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No se encontraron resultados para "{busqueda}"
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Escriba al menos 3 caracteres para buscar
            </div>
          )}
        </div>
      )}
    </div>
  );
}
