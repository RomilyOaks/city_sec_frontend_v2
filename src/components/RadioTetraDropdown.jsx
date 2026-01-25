/**
 * File: src/components/RadioTetraDropdown.jsx
 * @version 1.0.0
 * @description Componente dropdown para selección de radios TETRA
 * @module src/components/RadioTetraDropdown.jsx
 */

import React, { useState, useEffect } from 'react';
import { radioTetraService } from '../services/radiosTetraService';

const RadioTetraDropdown = ({ 
  value, 
  onChange, 
  disabled = false,
  placeholder = "Seleccione un radio TETRA...",
  showDescripcion = true,
  radiosExternos = null // 🔥 NUEVO: Permitir radios externos
}) => {
  const [radios, setRadios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // 🔥 Si se proporcionan radios externos, usarlos en lugar de cargar
    if (radiosExternos) {
      setRadios(radiosExternos);
      setLoading(false);
      setError('');
      return;
    }
    
    // Si no hay radios externos, cargarlos normalmente
    cargarRadiosDisponibles();
  }, [radiosExternos]);

  const cargarRadiosDisponibles = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await radioTetraService.getRadiosDisponibles();
      
      console.log('🔍 DEBUG RadioTetraDropdown - response:', response);
      console.log('🔍 DEBUG RadioTetraDropdown - response.success:', response.success);
      console.log('🔍 DEBUG RadioTetraDropdown - response.data:', response.data);
      console.log('🔍 DEBUG RadioTetraDropdown - response.data?.radios:', response.data?.radios);
      
      if (response.success) {
        // ✅ Acceso correcto: response.data?.radios (no response.data?.data?.radios)
        const radiosData = response.data?.radios || [];
        console.log('🔍 DEBUG RadioTetraDropdown - radiosData:', radiosData);
        setRadios(radiosData);
        
        if (radiosData.length === 0) {
          setError('No hay radios TETRA disponibles');
        }
      } else {
        setError('No se pudieron cargar los radios disponibles');
      }
    } catch (error) {
      console.error('Error cargando radios TETRA:', error);
      
      // Manejo específico de errores
      if (error.response?.status === 401) {
        setError('No autorizado - Inicie sesión nuevamente');
      } else if (error.response?.status === 403) {
        setError('No tiene permisos para ver radios TETRA');
      } else {
        setError('Error al cargar radios TETRA');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    cargarRadiosDisponibles();
  };

  return (
    <div className="radio-tetra-dropdown">
      <label htmlFor="radio_tetra_id" className="form-label">
        Radio TETRA:
      </label>
      
      {/* Estado de carga */}
      {loading && (
        <div className="d-flex align-items-center mb-2">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <span className="text-muted">Cargando radios disponibles...</span>
        </div>
      )}
      
      {/* Mensaje de error */}
      {error && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="fas fa-exclamation-triangle me-2"></i>
            <span>{error}</span>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-warning"
            onClick={handleRetry}
          >
            <i className="fas fa-redo me-1"></i>
            Reintentar
          </button>
        </div>
      )}
      
      {/* Dropdown principal */}
      <select
        id="radio_tetra_id"
        name="radio_tetra_id"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`form-select ${error ? 'is-invalid' : ''}`}
      >
        <option value="">{placeholder}</option>
        {radios.map(radio => (
          <option key={radio.id} value={radio.id}>
            {showDescripcion 
              ? `${radio.radio_tetra_code} - ${radio.descripcion || 'Sin descripción'}` 
              : radio.radio_tetra_code
            }
          </option>
        ))}
      </select>
      
      {/* Mensaje informativo */}
      {radios.length > 0 && !loading && (
        <div className="form-text text-muted">
          <i className="fas fa-info-circle me-1"></i>
          {radios.length} radio{radios.length !== 1 ? 's' : ''} disponible{radios.length !== 1 ? 's' : ''}
        </div>
      )}
      
      {/* Estado vacío */}
      {radios.length === 0 && !loading && !error && (
        <div className="text-muted mt-2">
          <i className="fas fa-inbox me-1"></i>
          No hay radios TETRA disponibles en este momento
        </div>
      )}
    </div>
  );
};

export default RadioTetraDropdown;
