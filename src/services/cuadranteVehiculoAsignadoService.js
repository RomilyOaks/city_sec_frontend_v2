/**
 * File: src/services/cuadranteVehiculoAsignadoService.js
 * @version 1.0.0
 * @description Servicio para gestión de asignaciones de vehículos a cuadrantes
 * 
 * Funcionalidades:
 * - CRUD completo de asignaciones
 * - Reactivación de soft-deletes
 * - Listado con filtros y paginación
 * 
 * @module src/services/cuadranteVehiculoAsignadoService.js
 */

import api from "./api.js";

/**
 * Servicio para gestión de asignaciones vehículo-cuadrante
 */
export const cuadranteVehiculoAsignadoService = {
  /**
   * Obtener todas las asignaciones con filtros y paginación
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Respuesta del backend
   */
  getAllAsignaciones: async (params = {}) => {
    const response = await api.get('/cuadrantes-vehiculos-asignados', { params });
    return response.data;
  },

  /**
   * Obtener asignación por ID
   * @param {number} id - ID de la asignación
   * @returns {Promise<Object>} Asignación encontrada
   */
  getAsignacionById: async (id) => {
    const response = await api.get(`/cuadrantes-vehiculos-asignados/${id}`);
    return response.data;
  },

  /**
   * Crear nueva asignación
   * @param {Object} data - Datos de la asignación
   * @returns {Promise<Object>} Asignación creada
   */
  createAsignacion: async (data) => {
    const response = await api.post('/cuadrantes-vehiculos-asignados', data);
    return response.data;
  },

  /**
   * Actualizar asignación existente
   * @param {number} id - ID de la asignación
   * @param {Object} data - Datos a actualizar
   * @returns {Promise<Object>} Asignación actualizada
   */
  updateAsignacion: async (id, data) => {
    const response = await api.put(`/cuadrantes-vehiculos-asignados/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar asignación (soft delete)
   * @param {number} id - ID de la asignación
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  deleteAsignacion: async (id) => {
    const response = await api.delete(`/cuadrantes-vehiculos-asignados/${id}`);
    return response.data;
  },

  /**
   * Reactivar asignación eliminada
   * @param {number} id - ID de la asignación a reactivar
   * @returns {Promise<Object>} Asignación reactivada
   */
  reactivarAsignacion: async (id) => {
    const response = await api.patch(`/cuadrantes-vehiculos-asignados/${id}/reactivar`);
    return response.data;
  },

  /**
   * Cambiar estado de asignación (activo/inactivo)
   * @param {number} id - ID de la asignación
   * @param {boolean} estado - Nuevo estado
   * @returns {Promise<Object>} Asignación actualizada
   */
  toggleEstado: async (id, estado) => {
    const response = await api.patch(`/cuadrantes-vehiculos-asignados/${id}/estado`, { estado });
    return response.data;
  },

  /**
   * Obtener asignaciones eliminadas (soft-deleted)
   * @param {Object} params - Parámetros de paginación
   * @returns {Promise<Object>} Lista de eliminadas
   */
  getEliminadas: async (params = {}) => {
    const response = await api.get('/cuadrantes-vehiculos-asignados/eliminadas', { params });
    return response.data;
  },

  /**
   * Obtener asignaciones por cuadrante específico
   * @param {number} cuadranteId - ID del cuadrante
   * @param {Object} params - Parámetros adicionales
   * @returns {Promise<Object>} Asignaciones del cuadrante
   */
  getAsignacionesByCuadrante: async (cuadranteId, params = {}) => {
    const response = await api.get(`/cuadrantes-vehiculos-asignados`, { 
      params: { ...params, cuadrante_id: cuadranteId } 
    });
    return response.data;
  },

  /**
   * Obtener asignaciones por vehículo específico
   * @param {number} vehiculoId - ID del vehículo
   * @param {Object} params - Parámetros adicionales
   * @returns {Promise<Object>} Asignaciones del vehículo
   */
  getAsignacionesByVehiculo: async (vehiculoId, params = {}) => {
    const response = await api.get(`/cuadrantes-vehiculos-asignados`, { 
      params: { ...params, vehiculo_id: vehiculoId } 
    });
    return response.data;
  }
};

export default cuadranteVehiculoAsignadoService;
