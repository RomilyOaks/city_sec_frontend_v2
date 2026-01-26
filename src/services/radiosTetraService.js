/**
 * File: src/services/radiosTetraService.js
 * @version 1.1.0
 * @description Servicio para gestionar radios TETRA
 * @module src/services/radiosTetraService.js
 */

import api from "./api.js";

/**
 * Servicio de radios TETRA
 */
export const radioTetraService = {
  /**
   * Obtener radios disponibles para dropdown (solo sin asignar)
   * @returns {Promise<Object>} - { success: true, data: { radios: [...], total: N } }
   */
  getRadiosDisponibles: async () => {
    try {
      const response = await api.get("/radios-tetra/disponibles");
      return response.data;
    } catch (error) {
      console.error('Error obteniendo radios TETRA disponibles:', error);
      throw error;
    }
  },

  /**
   * Obtener TODOS los radios para dropdown con información de asignación
   * Incluye personal_seguridad_id y personalAsignado para precarga inteligente
   * Endpoint: GET /radios-tetra/para-dropdown
   * @returns {Promise<Object>} - { success: true, data: { radios: [...], resumen: {...} } }
   */
  getRadiosParaDropdown: async () => {
    try {
      const response = await api.get("/radios-tetra/para-dropdown");
      return response.data;
    } catch (error) {
      console.error('Error obteniendo radios para dropdown:', error);
      throw error;
    }
  },

  /**
   * Asignar radio a un personal de seguridad
   * Endpoint: PATCH /radios-tetra/:id/asignar
   * @param {number} radioId - ID del radio
   * @param {number} personalSeguridadId - ID del personal a asignar
   * @returns {Promise<Object>}
   */
  asignarRadio: async (radioId, personalSeguridadId) => {
    try {
      const response = await api.patch(`/radios-tetra/${radioId}/asignar`, {
        personal_seguridad_id: personalSeguridadId
      });
      return response.data;
    } catch (error) {
      console.error('Error asignando radio TETRA:', error);
      throw error;
    }
  },

  /**
   * Desasignar radio (liberar)
   * Endpoint: PATCH /radios-tetra/:id/desasignar
   * @param {number} radioId - ID del radio
   * @returns {Promise<Object>}
   */
  desasignarRadio: async (radioId) => {
    try {
      const response = await api.patch(`/radios-tetra/${radioId}/desasignar`);
      return response.data;
    } catch (error) {
      console.error('Error desasignando radio TETRA:', error);
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
      return response;
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
  },

  /**
   * Crear un nuevo radio TETRA
   * @param {Object} data - Datos del radio
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  createRadio: async (data) => {
    try {
      const response = await api.post("/radios-tetra", data);
      return response.data;
    } catch (error) {
      console.error('Error creando radio TETRA:', error);
      throw error;
    }
  },

  /**
   * Actualizar un radio existente
   * @param {number} id - ID del radio
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  updateRadio: async (id, data) => {
    try {
      const response = await api.put(`/radios-tetra/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error actualizando radio TETRA:', error);
      throw error;
    }
  },

  /**
   * Eliminar un radio (soft delete)
   * @param {number} id - ID del radio
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  deleteRadio: async (id) => {
    try {
      const response = await api.delete(`/radios-tetra/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando radio TETRA:', error);
      throw error;
    }
  },

  /**
   * Activar un radio
   * @param {number} id - ID del radio
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  activarRadio: async (id) => {
    try {
      const response = await api.patch(`/radios-tetra/${id}/activar`);
      return response.data;
    } catch (error) {
      console.error('Error activando radio TETRA:', error);
      throw error;
    }
  },

  /**
   * Desactivar un radio
   * @param {number} id - ID del radio
   * @returns {Promise<Object>} - Respuesta del servidor
   */
  desactivarRadio: async (id) => {
    try {
      const response = await api.patch(`/radios-tetra/${id}/desactivar`);
      return response.data;
    } catch (error) {
      console.error('Error desactivando radio TETRA:', error);
      throw error;
    }
  },

  /**
   * Validar si un radio sigue disponible antes de guardar
   * @param {string|number} radioId - ID del radio a validar
   * @param {string|number} conductorId - ID del conductor
   * @param {string|number} copilotoId - ID del copiloto
   * @returns {Promise<Object>} - { valido: boolean, mensaje?: string, radiosActualizados?: Array }
   */
  validarRadioDisponible: async (radioId, conductorId, copilotoId) => {
    if (!radioId) return { valido: true };

    try {
      const response = await api.get("/radios-tetra/para-dropdown");
      const radios = response.data?.data?.radios || [];
      const radio = radios.find(r => r.id.toString() === radioId.toString());

      if (!radio) {
        return { valido: false, mensaje: 'Radio no encontrado' };
      }

      // Verificar si el radio está asignado a alguien más
      if (radio.personal_seguridad_id &&
          radio.personal_seguridad_id !== parseInt(conductorId) &&
          radio.personal_seguridad_id !== parseInt(copilotoId)) {
        const nombre = radio.personalAsignado
          ? `${radio.personalAsignado.nombres} ${radio.personalAsignado.apellido_paterno}`
          : 'otro personal';
        return {
          valido: false,
          mensaje: `Radio ${radio.radio_tetra_code} ya fue asignado a ${nombre}`,
          radiosActualizados: radios
        };
      }

      return { valido: true };
    } catch (err) {
      console.error('Error validando radio:', err);
      return { valido: false, mensaje: 'Error al validar disponibilidad' };
    }
  }
};

/**
 * Listar radios TETRA disponibles (para dropdowns) - VERSIÓN LEGADA
 * @returns {Promise<Array>} - Lista de radios disponibles
 */
export async function listRadiosTetraActivos() {
  const response = await api.get("/radios-tetra/disponibles");
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
