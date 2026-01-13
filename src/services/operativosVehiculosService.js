/**
 * File: src/services/operativosVehiculosService.js
 * @version 1.0.0
 * @description Servicio para gestionar vehículos de operativos de patrullaje
 * Interactúa con el endpoint /api/v1/operativos/:turnoId/vehiculos
 * @module src/services/operativosVehiculosService.js
 */

import api from "./api.js";

/**
 * Listar vehículos de un turno específico
 * @param {number} turnoId - ID del turno operativo
 * @param {Object} params - Parámetros adicionales
 * @param {boolean} [params.include_relations=true] - Incluir relaciones (vehiculo, conductor, copiloto, etc.)
 * @returns {Promise<Array>} - Lista de vehículos del turno
 */
export async function listVehiculosByTurno(turnoId, params = {}) {
  // Por defecto, solicitamos que incluya las relaciones
  const queryParams = {
    include_relations: true,
    ...params
  };
  const response = await api.get(`/operativos/${turnoId}/vehiculos`, { params: queryParams });
  return response.data;
}

/**
 * Listar todos los vehículos operativos con filtros globales
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} [params.page=1] - Número de página
 * @param {number} [params.limit=20] - Registros por página
 * @param {string} [params.search] - Búsqueda en placa, marca, conductor, copiloto
 * @param {number} [params.turno_id] - Filtrar por turno operativo
 * @param {number} [params.vehiculo_id] - Filtrar por vehículo
 * @param {number} [params.conductor_id] - Filtrar por conductor
 * @param {number} [params.copiloto_id] - Filtrar por copiloto
 * @param {number} [params.estado_operativo_id] - Filtrar por estado operativo
 * @param {string} [params.fecha_inicio] - Filtro desde fecha (YYYY-MM-DD)
 * @param {string} [params.fecha_fin] - Filtro hasta fecha (YYYY-MM-DD)
 * @param {string} [params.sort] - Campo para ordenar
 * @param {string} [params.order] - ASC o DESC
 * @returns {Promise<Object>} - { data, pagination }
 */
export async function listOperativosVehiculos(params = {}) {
  const response = await api.get("/operativos-vehiculos", { params });
  return response.data;
}

/**
 * Crear vehículo en un turno operativo
 * @param {number} turnoId - ID del turno operativo
 * @param {Object} payload - Datos del vehículo
 * @param {number} payload.vehiculo_id - ID del vehículo (requerido)
 * @param {number} [payload.conductor_id] - ID del conductor
 * @param {number} [payload.copiloto_id] - ID del copiloto
 * @param {number} [payload.tipo_copiloto_id] - ID del tipo de copiloto
 * @param {number} [payload.radio_tetra_id] - ID del radio TETRA
 * @param {number} payload.estado_operativo_id - ID del estado operativo (requerido)
 * @param {number} payload.kilometraje_inicio - Kilometraje inicial (requerido)
 * @param {string} payload.hora_inicio - Hora de inicio ISO8601 (requerido)
 * @param {string} [payload.nivel_combustible_inicio] - LLENO, 3/4, 1/2, 1/4, RESERVA
 * @param {string} [payload.observaciones] - Observaciones
 * @returns {Promise<Object>} - Vehículo operativo creado
 */
export async function createVehiculoOperativo(turnoId, payload) {
  const response = await api.post(`/operativos/${turnoId}/vehiculos`, payload);
  return response.data;
}

/**
 * Actualizar vehículo operativo (cierre de turno, recarga, etc.)
 * @param {number} turnoId - ID del turno operativo
 * @param {number} id - ID del vehículo operativo
 * @param {Object} payload - Datos a actualizar (todos opcionales)
 * @param {number} [payload.kilometraje_fin] - Kilometraje final
 * @param {string} [payload.hora_fin] - Hora de fin ISO8601
 * @param {string} [payload.nivel_combustible_fin] - Nivel final de combustible
 * @param {number} [payload.kilometraje_recarga] - Km cuando se recargó
 * @param {string} [payload.hora_recarga] - Hora de recarga ISO8601
 * @param {number} [payload.combustible_litros] - Litros recargados
 * @param {number} [payload.importe_recarga] - Costo de recarga
 * @param {string} [payload.nivel_combustible_recarga] - Nivel después de recargar
 * @param {string} [payload.observaciones] - Observaciones
 * @returns {Promise<Object>} - Vehículo operativo actualizado
 */
export async function updateVehiculoOperativo(turnoId, id, payload) {
  const response = await api.put(`/operativos/${turnoId}/vehiculos/${id}`, payload);
  return response.data;
}

/**
 * Eliminar vehículo operativo (soft delete)
 * @param {number} turnoId - ID del turno operativo
 * @param {number} id - ID del vehículo operativo
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
export async function deleteVehiculoOperativo(turnoId, id) {
  const response = await api.delete(`/operativos/${turnoId}/vehiculos/${id}`);
  return response.data;
}
