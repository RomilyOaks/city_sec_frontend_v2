/**
 * 📋 Hook Personalizado para Dropdowns
 * 
 * Maneja la carga y estado de datos para todos los dropdowns del sistema
 * Basado en documentación: C:\Project\city_sec_backend_claude\docs\Endpoints-Dropdowns-Frontend.md
 * 
 * @version 1.0.0
 * @author CitySec Frontend Team
 */

import { useState, useEffect, useCallback } from 'react';
import dropdownsService from '../services/dropdownsService';

export const useDropdownsData = () => {
  const [data, setData] = useState({
    turnos: [],
    sectores: [],
    cuadrantes: [],
    vehiculos: [],
    personal: [],
    estadosNovedad: []
  });
  
  const [loading, setLoading] = useState({
    turnos: false,
    sectores: false,
    cuadrantes: false,
    vehiculos: false,
    personal: false,
    estadosNovedad: false,
    all: false
  });
  
  const [errors, setErrors] = useState({
    turnos: null,
    sectores: null,
    cuadrantes: null,
    vehiculos: null,
    personal: null,
    estadosNovedad: null,
    all: null
  });

  /**
   * 🔄 Función genérica para cargar datos
   */
  const fetchData = useCallback(async (key, endpoint, params = {}) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setErrors(prev => ({ ...prev, [key]: null }));
    
    try {
      let response;
      switch (endpoint) {
        case 'turnos':
          response = await dropdownsService.getHorariosTurnos(params);
          break;
        case 'sectores':
          response = await dropdownsService.getSectores(params);
          break;
        case 'cuadrantes':
          response = await dropdownsService.getCuadrantes(params);
          break;
        case 'vehiculos':
          response = await dropdownsService.getVehiculos(params);
          break;
        case 'personal':
          response = await dropdownsService.getPersonal(params);
          break;
        case 'estadosNovedad':
          response = await dropdownsService.getEstadosNovedad(params);
          break;
        default:
          throw new Error(`Endpoint no reconocido: ${endpoint}`);
      }

      const formattedData = dropdownsService.formatOptions(
        response.data?.data || response.data || response, 
        endpoint
      );
      
      setData(prev => ({ 
        ...prev, 
        [key]: formattedData
      }));
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      const errorMessage = error.response?.data?.message || 'Error al cargar datos';
      setErrors(prev => ({ 
        ...prev, 
        [key]: errorMessage
      }));
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  /**
   * 🔄 Cargar todos los datos iniciales
   */
  const loadAllData = useCallback(async () => {
    setLoading(prev => ({ ...prev, all: true }));
    setErrors(prev => ({ ...prev, all: null }));
    
    try {
      const result = await dropdownsService.getAllDropdownsData();
      setData(prev => ({ ...prev, ...result }));
    } catch (error) {
      console.error('Error loading all dropdowns data:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar todos los datos';
      setErrors(prev => ({ ...prev, all: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, all: false }));
    }
  }, []);

  /**
   * 🗺️ Cargar cuadrantes por sector
   */
  const loadCuadrantesBySector = useCallback(async (sectorId) => {
    if (!sectorId) {
      setData(prev => ({ ...prev, cuadrantes: [] }));
      return;
    }

    setLoading(prev => ({ ...prev, cuadrantes: true }));
    setErrors(prev => ({ ...prev, cuadrantes: null }));
    
    try {
      const response = await dropdownsService.getCuadrantesPorSector(sectorId);
      const formattedData = dropdownsService.formatOptions(
        response.data?.data || response.data || response, 
        'cuadrantes'
      );
      
      setData(prev => ({ 
        ...prev, 
        cuadrantes: formattedData
      }));
    } catch (error) {
      console.error('Error loading cuadrantes by sector:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar cuadrantes';
      setErrors(prev => ({ ...prev, cuadrantes: errorMessage }));
    } finally {
      setLoading(prev => ({ ...prev, cuadrantes: false }));
    }
  }, []);

  /**
   * 🔄 Refrescar datos específicos
   */
  const refetch = useCallback((key, params = {}) => {
    if (key === 'all') {
      return loadAllData();
    }
    return fetchData(key, key, params);
  }, [fetchData, loadAllData]);

  /**
   * 🧹 Limpiar errores
   */
  const clearErrors = useCallback((key = null) => {
    if (key) {
      setErrors(prev => ({ ...prev, [key]: null }));
    } else {
      setErrors({
        turnos: null,
        sectores: null,
        cuadrantes: null,
        vehiculos: null,
        personal: null,
        estadosNovedad: null,
        all: null
      });
    }
  }, []);

  /**
   * 🔄 Obtener opción por valor
   */
  const getOptionByValue = useCallback((key, value) => {
    const options = data[key] || [];
    return options.find(option => option.value === value);
  }, [data]);

  /**
   * 📊 Obtener estadísticas de carga
   */
  const getLoadingStats = useCallback(() => {
    const totalKeys = Object.keys(loading).length - 1; // Excluir 'all'
    const loadingKeys = Object.entries(loading)
      .filter(([key, isLoading]) => key !== 'all' && isLoading)
      .map(([key]) => key);
    
    return {
      total: totalKeys,
      loading: loadingKeys.length,
      completed: totalKeys - loadingKeys.length,
      keys: loadingKeys
    };
  }, [loading]);

  /**
   * 🎯 Efecto para cargar datos iniciales
   */
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // Datos
    data,
    
    // Estados de carga
    loading,
    isLoading: loading.all,
    getLoadingStats,
    
    // Estados de error
    errors,
    hasErrors: Object.values(errors).some(error => error !== null),
    
    // Acciones
    loadAllData,
    loadCuadrantesBySector,
    refetch,
    clearErrors,
    getOptionByValue,
    
    // Utilidades
    isDataLoaded: Object.keys(data).every(key => data[key].length > 0)
  };
};
