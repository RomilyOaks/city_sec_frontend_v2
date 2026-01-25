/**
 * File: src/services/radiosTetraService.js
 * @version 1.0.0
 * @description Servicio para gestionar radios TETRA
 * @module src/services/radiosTetraService.js
 */

import api from "./api.js";

/**
 * 🔥 NUEVO: Obtener radios disponibles para dropdown (según indicaciones backend)
 * @returns {Promise<Object>} - { success: true, data: { radios: [...], total: N } }
 */
export const radioTetraService = {
  // Obtener radios disponibles para dropdown
  getRadiosDisponibles: async () => {
    try {
      const response = await api.get("/radios-tetra/disponibles", {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Debug para verificar estructura
      console.log('🔥 DEBUG - Respuesta completa:', response);
      console.log('🔥 DEBUG - response.data:', response.data);
      console.log('🔥 DEBUG - response.data?.data:', response.data?.data);
      console.log('🔥 DEBUG - response.data?.data?.radios:', response.data?.data?.radios);
      
      return response.data;
    } catch (error) {
      console.error('Error obteniendo radios TETRA disponibles:', error);
      
      // Manejo específico de errores
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      }
      
      throw error;
    }
  },

  // Obtener todos los radios (no solo disponibles)
  getAllRadios: async (params = {}) => {
    try {
      const response = await api.get("/radios-tetra", {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo todos los radios TETRA:', error);
      throw error;
    }
  },

  // Obtener radio por ID
  getRadioById: async (id) => {
    try {
      const response = await api.get(`/radios-tetra/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo radio TETRA:', error);
      throw error;
    }
  }
};

/**
 * Listar radios TETRA disponibles (para dropdowns) - VERSIÓN LEGADA
 * @returns {Promise<Array>} - Lista de radios disponibles
 */
export async function listRadiosTetraActivos() {
  const response = await api.get("/radios-tetra/disponibles");
  
  // Debug para verificar estructura
  console.log('🔥 DEBUG - Respuesta radios disponibles:', response.data);
  console.log('🔥 DEBUG - response.data?.data:', response.data?.data);
  console.log('🔥 DEBUG - response.data?.data?.radios:', response.data?.data?.radios);
  
  // ✅ Estructura correcta según indicaciones: response.data?.data?.radios
  return response.data?.data?.radios || response.data?.radios || response.data?.data || [];
}

/**
 * Listar todos los radios TETRA con paginación
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} [params.page=1] - Número de página
 * @param {number} [params.limit=100] - Registros por página
 * @returns {Promise<Object>} - { data, pagination }
 */
export async function listRadiosTetra(params = {}) {
  const response = await api.get("/radios-tetra", { params });
  // El backend devuelve { success: { radios: [...], pagination: {...} } }
  if (response.data?.success?.radios) {
    return {
      data: response.data.success.radios,
      pagination: response.data.success.pagination
    };
  }
  return response.data;
}
