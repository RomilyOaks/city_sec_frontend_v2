/**
 * File: src/services/tiposCopilotoService.js
 * @version 1.0.0
 * @description Servicio para gestionar tipos de copiloto
 * @module src/services/tiposCopilotoService.js
 */

import api from "./api.js";

/**
 * Listar tipos de copiloto activos (para dropdowns)
 * @returns {Promise<Array>} - Lista de tipos activos
 */
export async function listTiposCopilotoActivos() {
  const response = await api.get("/tipos-copiloto/activos");
  return response.data;
}

/**
 * Listar todos los tipos de copiloto con paginación
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} [params.page=1] - Número de página
 * @param {number} [params.limit=100] - Registros por página
 * @returns {Promise<Object>} - { data, pagination }
 */
export async function listTiposCopiloto(params = {}) {
  const response = await api.get("/tipos-copiloto", { params });
  return response.data;
}
