/**
 * 🔍 Componente Filtros Reportes - Reportes Operativos v2.0
 * 
 * Panel de filtros unificado para todos los tipos de reportes
 * con validación y persistencia
 * 
 * @version 2.0.0
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
  Search
} from 'lucide-react';

const FiltrosReportes = ({ 
  filters, 
  onApplyFilters, 
  onResetFilters, 
  loading = false,
  showTitle = true 
}) => {
  // Estados locales para los filtros
  const [localFilters, setLocalFilters] = useState(filters);
  const [errors, setErrors] = useState({});

  // Opciones para selects
  const TURNOS = [
    { value: '', label: 'Todos los turnos' },
    { value: 'MAÑANA', label: 'Mañana (06:00-14:00)' },
    { value: 'TARDE', label: 'Tarde (14:00-22:00)' },
    { value: 'NOCHE', label: 'Noche (22:00-06:00)' }
  ];

  const PRIORIDADES = [
    { value: '', label: 'Todas las prioridades' },
    { value: 'BAJA', label: 'Baja' },
    { value: 'MEDIA', label: 'Media' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'CRÍTICA', label: 'Crítica' }
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
    setLocalFilters({
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date().toISOString().split('T')[0],
      turno: '',
      sector_id: '',
      prioridad: '',
      search: ''
    });
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
          <select
            value={localFilters.turno}
            onChange={(e) => handleFilterChange('turno', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
          >
            {TURNOS.map((turno) => (
              <option key={turno.value} value={turno.value}>
                {turno.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <MapPin className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Sector
          </label>
          <select
            value={localFilters.sector_id}
            onChange={(e) => handleFilterChange('sector_id', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
          >
            <option value="">Todos los sectores</option>
            {/* TODO: Cargar sectores desde API */}
            <option value="1">CENTRO</option>
            <option value="2">NORTE</option>
            <option value="3">SUR</option>
            <option value="4">ESTE</option>
            <option value="5">OESTE</option>
          </select>
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

        {/* Búsqueda */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            <Search className="inline w-3 h-3 mr-1 text-slate-600 dark:text-white" />
            Búsqueda
          </label>
          <input
            type="text"
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Código, descripción..."
            className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-xs text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

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
