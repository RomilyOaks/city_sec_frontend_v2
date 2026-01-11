/**
 * File: src/services/estadosOperativoService.js
 * @version 1.0.0
 * @description Servicio para gestionar estados operativos de recursos
 * @module src/services/estadosOperativoService.js
 */

import api from "./api.js";

/**
 * Listar estados operativos activos (para dropdowns)
 * @returns {Promise<Array>} - Lista de estados activos
 */
export async function listEstadosOperativosActivos() {
  const response = await api.get("/estados-operativo-recurso/activos");
  return response.data;
}

/**
 * Listar todos los estados operativos con paginación
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} [params.page=1] - Número de página
 * @param {number} [params.limit=100] - Registros por página
 * @returns {Promise<Object>} - { data, pagination }
 */
export async function listEstadosOperativos(params = {}) {
  const response = await api.get("/estados-operativo-recurso", { params });
  return response.data;
}
