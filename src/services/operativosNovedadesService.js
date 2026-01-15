/**
 * File: src/services/operativosNovedadesService.js
 * @version 1.0.0
 * @description Servicio para gestionar novedades de vehículos operativos
 * @module src/services/operativosNovedadesService.js
 */

import api from "./api.js";

/**
 * Servicio para operaciones CRUD de novedades en cuadrantes operativos
 */
class OperativosNovedadesService {
  /**
   * Obtiene todas las novedades de un cuadrante específico
   * @param {number} turnoId - ID del turno
   * @param {number} vehiculoId - ID del vehículo operativo
   * @param {number} cuadranteId - ID del cuadrante asignado
   * @returns {Promise<Object>} - Lista de novedades con resumen estadístico
   */
  async getNovedadesByCuadrante(turnoId, vehiculoId, cuadranteId) {
    const response = await api.get(
      `/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadranteId}/novedades`
    );
    return response.data;
  }

  /**
   * Registra una nueva novedad en un cuadrante
   * @param {number} turnoId - ID del turno
   * @param {number} vehiculoId - ID del vehículo operativo
   * @param {number} cuadranteId - ID del cuadrante asignado
   * @param {Object} novedadData - Datos de la novedad
   * @returns {Promise<Object>} - Novedad creada con información completa
   */
  async createNovedad(turnoId, vehiculoId, cuadranteId, novedadData) {
    const response = await api.post(
      `/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadranteId}/novedades`,
      novedadData
    );
    return response.data;
  }

  /**
   * Actualiza una novedad existente
   * @param {number} turnoId - ID del turno
   * @param {number} vehiculoId - ID del vehículo operativo
   * @param {number} cuadranteId - ID del cuadrante asignado
   * @param {number} novedadId - ID de la novedad
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} - Novedad actualizada
   */
  async updateNovedad(turnoId, vehiculoId, cuadranteId, novedadId, updateData) {
    const response = await api.put(
      `/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadranteId}/novedades/${novedadId}`,
      updateData
    );
    return response.data;
  }

  /**
   * Elimina una novedad (soft delete)
   * @param {number} turnoId - ID del turno
   * @param {number} vehiculoId - ID del vehículo operativo
   * @param {number} cuadranteId - ID del cuadrante asignado
   * @param {number} novedadId - ID de la novedad
   * @returns {Promise<Object>} - Confirmación de eliminación
   */
  async deleteNovedad(turnoId, vehiculoId, cuadranteId, novedadId) {
    const response = await api.delete(
      `/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadranteId}/novedades/${novedadId}`
    );
    return response.data;
  }

  /**
   * Obtiene lista de tipos de novedades disponibles
   * @returns {Promise<Object>} - Lista de tipos de novedades
   */
  async getTiposNovedades() {
    const response = await api.get("/novedades");
    return response.data;
  }
}

// Exportar una instancia única del servicio
export default new OperativosNovedadesService();
