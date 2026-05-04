/**
 * 🔍 Componente Filtros Reportes - Reportes Operativos v2.0
 * 
 * Panel de filtros unificado para todos los tipos de reportes
 * con validación y persistencia
 * 
 * @version 2.1.0
 * @author CitySec Frontend Team
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  Filter,
  X,
  Search,
  Phone,
  Car,
  User
} from 'lucide-react';

import { useDropdownsData } from '../../../hooks/useDropdownsData';

const FiltrosReportes = ({ 
  filters, 
  onApplyFilters, 
  onResetFilters, 
  loading = false,
  showTitle = true,
  activeQuickFilter = ''
}) => {
  // Hook para datos de dropdowns
  const { data: dropdownsData, loading: dropdownsLoading, errors: dropdownsErrors } = useDropdownsData();

  // Estados locales para los filtros
  const [localFilters, setLocalFilters] = useState(filters);
  const [errors, setErrors] = useState({});

  // Opciones estáticas para selects
  const PRIORIDADES = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'BAJA', label: '🟢 Baja' },
    { value: 'MEDIA', label: '🟡 Media' },
    { value: 'ALTA', label: '🔴 Alta' },
    { value: 'CRÍTICA', label: '🟣 Crítica' }
  ];

  // Opciones dinámicas para Origen Llamada
  const ORIGEN_LLAMADA_OPTIONS = [
    { value: '', label: 'Todos los orígenes' },
    { value: 'TELEFONO_107', label: '📞 Teléfono 107' },
    { value: 'RADIO_TETRA', label: '📻 Radio Tetra' },
    { value: 'REDES_SOCIALES', label: '📱 Redes Sociales' },
    { value: 'BOTON_EMERGENCIA_ALERTA', label: '🚨 Botón Emergencia' },
    { value: 'BOTON_DENUNCIA_VECINO_ALERTA', label: '🏠 App VECINO ALERTA' },
    { value: 'INTERVENCION_DIRECTA', label: '👮 Intervención Directa' },
    { value: 'PERSONAL', label: '👤 Personal' },
    { value: 'SISTEMA_ELECTRONICO', label: '💻 Sistema Electrónico' },
    { value: 'OTROS', label: '📋 Otros' }
  ];

  // Sincronizar filtros locales con props
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  /**
   * 🔍 Validar fechas
   */
  const validateDates = () => {
    const newErrors = {};
    
    if (localFilters.fecha_inicio && localFilters.fecha_fin) {
      const start = new Date(localFilters.fecha_inicio);
      const end = new Date(localFilters.fecha_fin);
      
      if (start > end) {
        newErrors.fecha_fin = 'La fecha fin debe ser posterior a la fecha inicio';
      }
      
      // Validar que no sea un rango muy grande (máximo 31 días)
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (diffDays > 31) {
        newErrors.fecha_fin = 'El rango máximo es de 31 días';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 🔄 Actualizar filtro local
   */
  const handleFilterChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando se modifica
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  /**
   * ✅ Aplicar filtros
   */
  const handleApply = () => {
    if (validateDates()) {
      onApplyFilters(localFilters);
    }
  };

  /**
   * 🔄 Resetear filtros
   */
  const handleReset = () => {
    let resetFilters;
    
    // Si hay un filtro rápido activo, mantener las fechas actuales
    if (activeQuickFilter === 7 || activeQuickFilter === 30) {
      resetFilters = {
        ...localFilters,
        turno: '',
        sector_id: '',
        prioridad: '',
        vehiculo_id: '',
        conductor_id: '',
        cuadrante_id: '',
        estado_novedad_id: '',
        origen_llamada: '',
        generico: '',
        sort: 'fecha_hora_ocurrencia',
        order: 'DESC'
      };
    } else {
      const today = new Date().toISOString().split('T')[0];
      resetFilters = {
        fecha_inicio: today,
        fecha_fin: today,
        turno: '',
        sector_id: '',
        prioridad: '',
        vehiculo_id: '',
        conductor_id: '',
        cuadrante_id: '',
        estado_novedad_id: '',
        origen_llamada: '',
        generico: '',
        sort: 'fecha_hora_ocurrencia',
        order: 'DESC'
      };
    }
    
    setLocalFilters(resetFilters);
    setErrors({});
    onResetFilters();
  };

  /**
   * 📅 Establecer rango de fechas rápido
   */
  const setQuickDateRange = (days) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    setLocalFilters(prev => ({
      ...prev,
      fecha_inicio: startDate.toISOString().split('T')[0],
      fecha_fin: today.toISOString().split('T')[0]
    }));
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Filtros del Reporte
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickDateRange(7)}
              className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Últimos 7 días
            </button>
            <button
              onClick={() => setQuickDateRange(30)}
              className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              Últimos 30 días
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Fecha Inicio */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <Calendar className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Fecha Inicio
          </label>
          <input
            type="date"
            value={localFilters.fecha_inicio}
            onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
            className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
              errors.fecha_inicio
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40'
            } text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]`}
          />
          {errors.fecha_inicio && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.fecha_inicio}</p>
          )}
        </div>

        {/* Fecha Fin */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <Calendar className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Fecha Fin
          </label>
          <input
            type="date"
            value={localFilters.fecha_fin}
            onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
            className={`w-full px-2 py-1.5 rounded-lg border text-xs ${
              errors.fecha_fin
                ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40'
            } text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]`}
          />
          {errors.fecha_fin && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.fecha_fin}</p>
          )}
        </div>

        {/* Turno */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <Clock className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Turno
          </label>
          {dropdownsLoading.turnos ? (
            <div className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-500">
              Cargando turnos...
            </div>
          ) : dropdownsErrors.turnos ? (
            <div className="w-full px-2 py-1.5 rounded-lg border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
              Error: {dropdownsErrors.turnos}
            </div>
          ) : (
            <select
              value={localFilters.turno}
              onChange={(e) => handleFilterChange('turno', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="">Todos los turnos</option>
              {dropdownsData.turnos.map((turno) => (
                <option key={turno.value} value={turno.value}>
                  {turno.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Sector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <MapPin className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Sector
          </label>
          {dropdownsLoading.sectores ? (
            <div className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-500">
              Cargando sectores...
            </div>
          ) : dropdownsErrors.sectores ? (
            <div className="w-full px-2 py-1.5 rounded-lg border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
              Error: {dropdownsErrors.sectores}
            </div>
          ) : (
            <select
              value={localFilters.sector_id}
              onChange={(e) => handleFilterChange('sector_id', e.target.value)}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
            >
              <option value="">Todos los sectores</option>
              {dropdownsData.sectores.map((sector) => (
                <option key={sector.value} value={sector.value}>
                  {sector.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Prioridad */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <AlertTriangle className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Prioridad
          </label>
          <select
            value={localFilters.prioridad}
            onChange={(e) => handleFilterChange('prioridad', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
          >
            {PRIORIDADES.map((prioridad) => (
              <option key={prioridad.value} value={prioridad.value}>
                {prioridad.label}
              </option>
            ))}
          </select>
        </div>

        {/* Búsqueda Genérica */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <Search className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Búsqueda Genérica
          </label>
          <input
            type="text"
            value={localFilters.generico || ''}
            onChange={(e) => handleFilterChange('generico', e.target.value)}
            placeholder="Descripción, ubicación o reportante..."
            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

        {/* Filtros Combinados - Cuadrante, Estado Novedad, Origen Llamada */}
        <div className="xl:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Cuadrante */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <MapPin className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
                Cuadrante
              </label>
              <input
                type="number"
                value={localFilters.cuadrante_id || ''}
                onChange={(e) => handleFilterChange('cuadrante_id', e.target.value)}
                placeholder="ID del cuadrante"
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            {/* Estado Novedad */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <AlertTriangle className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
                Estado Novedad
              </label>
              {dropdownsLoading.estadosNovedad ? (
                <div className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-500">
                  Cargando estados...
                </div>
              ) : dropdownsErrors.estadosNovedad ? (
                <div className="w-full px-2 py-1.5 rounded-lg border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
                  Error: {dropdownsErrors.estadosNovedad}
                </div>
              ) : (
                <select
                  value={localFilters.estado_novedad_id || ''}
                  onChange={(e) => handleFilterChange('estado_novedad_id', e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
                >
                  <option value="">Todos los estados</option>
                  {dropdownsData.estadosNovedad.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Origen Llamada */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Phone className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
                Origen Llamada
              </label>
              <select
                value={localFilters.origen_llamada || ''}
                onChange={(e) => handleFilterChange('origen_llamada', e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
              >
                {ORIGEN_LLAMADA_OPTIONS.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Filtros Específicos para Operativos Vehiculares */}
        {localFilters.vehiculo_id !== undefined && (
          <div className="xl:col-span-3">
            <div className="grid grid-cols-1 gap-3 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              {/* Vehículo */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Car className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
                  Vehículo
                </label>
                {dropdownsLoading.vehiculos ? (
                  <div className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-500">
                    Cargando vehículos...
                  </div>
                ) : dropdownsErrors.vehiculos ? (
                  <div className="w-full px-2 py-1.5 rounded-lg border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
                    Error: {dropdownsErrors.vehiculos}
                  </div>
                ) : (
                  <select
                    value={localFilters.vehiculo_id || ''}
                    onChange={(e) => handleFilterChange('vehiculo_id', e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
                  >
                    <option value="">Todos los vehículos</option>
                    {dropdownsData.vehiculos.map((vehiculo) => (
                      <option key={vehiculo.value} value={vehiculo.value}>
                        {vehiculo.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Botones de Acción */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          {localFilters.fecha_inicio && localFilters.fecha_fin && (
            <span>
              Rango: {localFilters.fecha_inicio} → {localFilters.fecha_fin}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
          
          <button
            onClick={handleApply}
            disabled={loading}
            className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            {loading ? 'Aplicando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosReportes;
