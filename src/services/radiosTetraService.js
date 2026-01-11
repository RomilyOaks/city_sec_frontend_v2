/**
 * File: src/services/radiosTetraService.js
 * @version 1.0.0
 * @description Servicio para gestionar radios TETRA
 * @module src/services/radiosTetraService.js
 */

import api from "./api.js";

/**
 * Listar radios TETRA disponibles (para dropdowns)
 * @returns {Promise<Array>} - Lista de radios disponibles
 */
export async function listRadiosTetraActivos() {
  const response = await api.get("/radios-tetra/disponibles");
  return response.data;
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
  return response.data;
}
