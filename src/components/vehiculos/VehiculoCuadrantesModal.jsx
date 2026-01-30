/**
 * File: src/components/vehiculos/VehiculoCuadrantesModal.jsx
 * @version 1.0.0
 * @description Modal para mostrar los cuadrantes asignados a un vehículo
 * 
 * Funcionalidades:
 * - Muestra información principal del vehículo
 * - Lista cuadrantes asignados agrupados por sector
 * - Filtrado por sector y cuadrantes
 * - Manejo de tecla ESC para cerrar
 * 
 * @module src/components/vehiculos/VehiculoCuadrantesModal.jsx
 */

import { useState, useEffect } from "react";
import { X, MapPin, Building, Search, Loader2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import cuadranteVehiculoAsignadoService from "../../services/cuadranteVehiculoAsignadoService.js";
import CuadranteMapaModal from "../calles/CuadranteMapaModal.jsx";
import { getCuadranteById } from "../../services/cuadrantesService.js";

/**
 * Modal para mostrar cuadrantes asignados a un vehículo
 * @param {Object} props - Props del componente
 * @param {Object} props.vehiculo - Datos del vehículo
 * @param {Function} props.onClose - Función para cerrar el modal
 * @returns {JSX.Element}
 */
export default function VehiculoCuadrantesModal({ vehiculo, onClose }) {
  const [cuadrantesAsignados, setCuadrantesAsignados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSector, setSearchSector] = useState("");
  const [selectedSector, setSelectedSector] = useState(null);
  const [showCuadranteModal, setShowCuadranteModal] = useState(null); // Para mostrar mapa del cuadrante

  // Función para cargar cuadrante completo con datos de ubicación
  const loadCuadranteCompleto = async (cuadranteBasico) => {
    try {
      const response = await getCuadranteById(cuadranteBasico.id);
      
      // Los datos están directamente en response, no en response.data
      const datosCuadrante = response.data || response;
      
      // Combinar datos básicos con datos completos
      const cuadranteCompleto = {
        ...cuadranteBasico,
        ...datosCuadrante,
        // Mantener sector si no viene en la respuesta completa
        sector: cuadranteBasico.sector || datosCuadrante?.sector
      };
      
      setShowCuadranteModal(cuadranteCompleto);
    } catch (error) {
      console.error("Error cargando cuadrante completo:", error);
      // Si hay error, mostrar con datos básicos
      setShowCuadranteModal(cuadranteBasico);
    }
  };

  // Desactivar scroll exterior cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Cargar cuadrantes asignados al vehículo
  useEffect(() => {
    if (!vehiculo?.id) return;

    const cargarCuadrantes = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await cuadranteVehiculoAsignadoService.getCuadrantesByVehiculo(vehiculo.id, {
          estado: true // Solo asignaciones activas (por defecto)
        });
        
        let asignaciones = [];
        
        // Manejar estructura de respuesta según indicaciones del backend
        // Respuesta esperada: { success: true, message: "...", data: [...], count: 3 }
        if (response?.success && Array.isArray(response?.data)) {
          asignaciones = response.data;
        } else if (Array.isArray(response?.data)) {
          asignaciones = response.data;
        } else if (Array.isArray(response)) {
          asignaciones = response;
        } else {
          asignaciones = [];
        }

        setCuadrantesAsignados(asignaciones);
      } catch (error) {
        console.error("Error cargando cuadrantes del vehículo:", error);
        setError(error.message || "Error al cargar cuadrantes asignados");
        toast.error("Error al cargar cuadrantes asignados");
      } finally {
        setLoading(false);
      }
    };

    cargarCuadrantes();
  }, [vehiculo?.id]);

  // Manejar tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  // Agrupar cuadrantes por sector
  const cuadrantesPorSector = (cuadrantesAsignados || []).reduce((acc, asignacion) => {
    const sector = asignacion.cuadrante?.sector;
    if (!sector) return acc;

    if (!acc[sector.id]) {
      acc[sector.id] = {
        ...sector,
        cuadrantes: []
      };
    }

    acc[sector.id].cuadrantes.push(asignacion.cuadrante);
    return acc;
  }, {});

  // Filtrar sectores por búsqueda
  const sectoresFiltrados = Object.values(cuadrantesPorSector).filter(sector =>
    sector.nombre.toLowerCase().includes(searchSector.toLowerCase()) ||
    sector.sector_code.toLowerCase().includes(searchSector.toLowerCase())
  );

  // Filtrar cuadrantes si hay un sector seleccionado
  const cuadrantesFiltrados = selectedSector
    ? (cuadrantesPorSector[selectedSector]?.cuadrantes || [])
    : [];

  if (!vehiculo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <MapPin className="text-blue-600" />
              Cuadrantes Asignados
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Sectores y cuadrantes donde está asignado este vehículo
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Información del vehículo */}
        <div className="bg-slate-50 dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <MapPin className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                {vehiculo.placa} - {vehiculo.nombre}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {vehiculo.marca} {vehiculo.modelo_vehiculo} • {vehiculo.tipo?.nombre || 'Tipo no especificado'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Total de cuadrantes
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {cuadrantesAsignados.length}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="animate-spin" size={20} />
                Cargando cuadrantes...
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="text-red-600 dark:text-red-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Error al cargar datos
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{error}</p>
              </div>
            </div>
          ) : cuadrantesAsignados.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Sin cuadrantes asignados
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Este vehículo no tiene cuadrantes asignados actualmente
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full">
              {/* Lista de sectores */}
              <div className="w-80 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={searchSector}
                      onChange={(e) => setSearchSector(e.target.value)}
                      placeholder="Buscar sector..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {sectoresFiltrados.map((sector) => (
                    <button
                      key={sector.id}
                      onClick={() => setSelectedSector(selectedSector === sector.id ? null : sector.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedSector === sector.id
                          ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="text-slate-400" size={16} />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-50">
                            {sector.nombre}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {sector.sector_code}
                          </p>
                        </div>
                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                          {sector.cuadrantes.length}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuadrantes del sector seleccionado */}
              <div className="flex-1 p-4 overflow-y-auto">
                {selectedSector ? (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <Building size={20} />
                        {cuadrantesPorSector[selectedSector]?.nombre}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {cuadrantesFiltrados.length} cuadrante{cuadrantesFiltrados.length !== 1 ? 's' : ''} asignado{cuadrantesFiltrados.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cuadrantesFiltrados.map((cuadrante) => (
                        <div
                          key={cuadrante.id}
                          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                              style={{ backgroundColor: cuadrante.color_mapa || '#64748b' }}
                            >
                              {cuadrante.cuadrante_code?.charAt(0) || 'C'}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 dark:text-slate-50">
                                {cuadrante.nombre}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {cuadrante.cuadrante_code}
                              </p>
                              {cuadrante.observaciones && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {cuadrante.observaciones}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                // Verificar si tiene datos de ubicación
                                const tieneDatosUbicacion = cuadrante.coordenadas || cuadrante.poligono || 
                                  cuadrante.poligono_json || (cuadrante.latitud && cuadrante.longitud);
                                
                                if (tieneDatosUbicacion) {
                                  setShowCuadranteModal(cuadrante);
                                } else {
                                  loadCuadranteCompleto(cuadrante);
                                }
                              }}
                              className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                              title="Ver mapa del cuadrante"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Building className="text-slate-300 dark:text-slate-600 mx-auto mb-4" size={48} />
                      <p className="text-slate-600 dark:text-slate-400">
                        Seleccione un sector para ver sus cuadrantes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal del Cuadrante con Mapa */}
      {showCuadranteModal && (
        <CuadranteMapaModal
          isOpen={true}
          cuadrante={showCuadranteModal}
          onClose={() => setShowCuadranteModal(null)}
        />
      )}
    </div>
  );
}
