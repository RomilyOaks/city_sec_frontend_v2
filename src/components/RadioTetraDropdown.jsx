/**
 * File: src/components/RadioTetraDropdown.jsx
 * @version 2.0.0
 * @description Componente dropdown inteligente para selección de radios TETRA
 * - Precarga automática basada en piloto/copiloto
 * - Modo read-only cuando el radio está asignado a piloto/copiloto
 * - Validación al guardar para evitar conflictos de asignación
 * @module src/components/RadioTetraDropdown.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { Radio, Lock, User, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { radioTetraService } from '../services/radiosTetraService';

const RadioTetraDropdown = ({
  value,
  onChange,
  conductorId = null,
  copilotoId = null,
  disabled = false,
  placeholder = "Sin radio asignado",
  showDescripcion = true,
  className = "",
  label = "Radio TETRA",
}) => {
  const [radios, setRadios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [asignadoA, setAsignadoA] = useState(null); // 'conductor' | 'copiloto' | null
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [resumen, setResumen] = useState({ total: 0, disponibles: 0, asignados: 0 });

  /**
   * Determina si el conductor o copiloto ya tienen un radio asignado
   * y pre-selecciona el valor correspondiente
   */
  const determinarRadioAsignado = useCallback((radiosData, condId, copId) => {
    if (!radiosData || radiosData.length === 0) return;

    // Prioridad 1: Buscar radio del conductor
    if (condId) {
      const radioConductor = radiosData.find(r =>
        r.personal_seguridad_id === parseInt(condId)
      );

      if (radioConductor) {
        setAsignadoA('conductor');
        setIsReadOnly(true);
        onChange(radioConductor.id.toString());
        return;
      }
    }

    // Prioridad 2: Buscar radio del copiloto
    if (copId) {
      const radioCopiloto = radiosData.find(r =>
        r.personal_seguridad_id === parseInt(copId)
      );

      if (radioCopiloto) {
        setAsignadoA('copiloto');
        setIsReadOnly(true);
        onChange(radioCopiloto.id.toString());
        return;
      }
    }

    // Si ninguno tiene radio asignado, habilitar selección libre
    setAsignadoA(null);
    setIsReadOnly(false);
  }, [onChange]);

  /**
   * Cargar radios desde el endpoint para-dropdown
   */
  const cargarRadios = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await radioTetraService.getRadiosParaDropdown();

      if (response.success && response.data) {
        const radiosData = response.data.radios || [];
        setRadios(radiosData);
        setResumen(response.data.resumen || { total: 0, disponibles: 0, asignados: 0 });

        // Buscar si conductor o copiloto ya tienen radio asignado
        determinarRadioAsignado(radiosData, conductorId, copilotoId);
      } else {
        setError('No se pudieron cargar los radios');
      }
    } catch (err) {
      console.error('Error cargando radios TETRA:', err);
      if (err.response?.status === 401) {
        setError('No autorizado');
      } else if (err.response?.status === 403) {
        setError('Sin permisos');
      } else {
        setError('Error al cargar radios');
      }
    } finally {
      setLoading(false);
    }
  }, [conductorId, copilotoId, determinarRadioAsignado]);

  // Cargar radios al montar y cuando cambian conductor/copiloto
  useEffect(() => {
    cargarRadios();
  }, [cargarRadios]);

  // Re-evaluar cuando cambian conductor o copiloto
  useEffect(() => {
    if (radios.length > 0) {
      determinarRadioAsignado(radios, conductorId, copilotoId);
    }
  }, [conductorId, copilotoId, radios, determinarRadioAsignado]);

  /**
   * Obtener opciones filtradas para el dropdown
   * - Si hay radio asignado a conductor/copiloto: solo mostrar ese
   * - Si no: mostrar solo radios disponibles (sin asignar)
   */
  const getOpcionesDropdown = () => {
    if (isReadOnly && value) {
      // Solo mostrar el radio asignado
      return radios.filter(r => r.id.toString() === value);
    }

    // Mostrar solo radios disponibles (sin asignar) + el actualmente seleccionado
    return radios.filter(r =>
      !r.personal_seguridad_id || r.id.toString() === value
    );
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  const handleRefresh = () => {
    cargarRadios();
  };

  const opcionesDropdown = getOpcionesDropdown();

  return (
    <div className={`radio-tetra-dropdown ${className}`}>
      {/* Label con badge de asignación */}
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
          <Radio size={14} className="inline mr-1" />
          {label}
        </label>

        {asignadoA && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            asignadoA === 'conductor'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
          }`}>
            <Lock size={10} />
            Asignado a {asignadoA === 'conductor' ? 'Conductor' : 'Copiloto'}
          </span>
        )}
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-2">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-sm">Cargando radios...</span>
        </div>
      )}

      {/* Mensaje de error */}
      {error && !loading && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
            title="Reintentar"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Dropdown principal */}
      <div className="relative">
        <select
          id="radio_tetra_id"
          name="radio_tetra_id"
          value={value || ''}
          onChange={handleChange}
          disabled={disabled || loading || isReadOnly}
          className={`w-full px-4 py-2 rounded-lg border ${
            isReadOnly
              ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50'
          } ${error ? 'border-amber-300 dark:border-amber-700' : ''}`}
        >
          <option value="">{placeholder}</option>
          {opcionesDropdown.map(radio => (
            <option key={radio.id} value={radio.id}>
              {radio.radio_tetra_code}
              {showDescripcion && radio.descripcion ? ` - ${radio.descripcion}` : ''}
              {radio.personal_seguridad_id === parseInt(conductorId) ? ' (Conductor)' : ''}
              {radio.personal_seguridad_id === parseInt(copilotoId) ? ' (Copiloto)' : ''}
            </option>
          ))}
        </select>

        {/* Icono de candado si es read-only */}
        {isReadOnly && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Lock size={14} className="text-slate-400" />
          </div>
        )}
      </div>

      {/* Mensaje informativo */}
      {!loading && !error && (
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {isReadOnly ? (
            <span className="flex items-center gap-1">
              <User size={12} />
              Radio asignado al {asignadoA} del vehículo
            </span>
          ) : (
            <span>
              {resumen.disponibles} radio{resumen.disponibles !== 1 ? 's' : ''} disponible{resumen.disponibles !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RadioTetraDropdown;
