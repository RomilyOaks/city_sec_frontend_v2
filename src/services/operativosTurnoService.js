/**
 * File: src/services/operativosTurnoService.js
 * @version 1.0.0
 * @description Servicio para gestionar operativos de turno (patrullaje)
 * Interactúa con el endpoint /api/v1/operativos
 * @module src/services/operativosTurnoService.js
 */

import api from "./api.js";

/**
 * Listar operativos de turno con filtros y paginación
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} [params.page=1] - Número de página
 * @param {number} [params.limit=15] - Registros por página
 * @param {number} [params.sector_id] - Filtrar por sector
 * @param {string} [params.fecha] - Filtrar por fecha (YYYY-MM-DD)
 * @param {string} [params.turno] - Filtrar por turno (MAÑANA/TARDE/NOCHE)
 * @param {number} [params.estado] - Filtrar por estado (1=Activo, 0=Inactivo)
 * @param {string} [params.search] - Búsqueda general
 * @returns {Promise<Object>} - { data, pagination }
 */
export async function listOperativosTurno(params = {}) {
  const response = await api.get("/operativos", { params });
  return response.data;
}

/**
 * Obtener un operativo de turno por ID
 * @param {number} id - ID del operativo de turno
 * @returns {Promise<Object>} - Datos del operativo de turno
 */
export async function getOperativosTurnoById(id) {
  const response = await api.get(`/operativos/${id}`);
  return response.data;
}

/**
 * Crear un nuevo operativo de turno
 * @param {Object} payload - Datos del operativo de turno
 * @param {number} payload.operador_id - ID del usuario operador (requerido)
 * @param {number} [payload.supervisor_id] - ID del usuario supervisor (opcional)
 * @param {number} payload.sector_id - ID del sector (requerido)
 * @param {string} payload.fecha - Fecha del turno (YYYY-MM-DD) (requerido)
 * @param {string} [payload.fecha_hora_inicio] - Fecha/hora de inicio (ISO8601)
 * @param {string} [payload.fecha_hora_fin] - Fecha/hora de fin (ISO8601)
 * @param {string} payload.turno - Turno: "MAÑANA" | "TARDE" | "NOCHE" (requerido)
 * @param {number} [payload.estado=1] - Estado: 1 (Activo) | 0 (Inactivo)
 * @param {string} [payload.observaciones] - Observaciones del turno
 * @returns {Promise<Object>} - Operativo de turno creado
 */
export async function createOperativosTurno(payload) {
  const response = await api.post("/operativos", payload);
  return response.data;
}

/**
 * Actualizar un operativo de turno existente
 * @param {number} id - ID del operativo de turno
 * @param {Object} payload - Datos a actualizar
 * @returns {Promise<Object>} - Operativo de turno actualizado
 */
export async function updateOperativosTurno(id, payload) {
  const response = await api.put(`/operativos/${id}`, payload);
  return response.data;
}

/**
 * Eliminar un operativo de turno (soft delete)
 * @param {number} id - ID del operativo de turno
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export async function deleteOperativosTurno(id) {
  const response = await api.delete(`/operativos/${id}`);
  return response.data;
}
