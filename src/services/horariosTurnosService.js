/**
 * File: src/services/horariosTurnosService.js
 * @version 1.0.0
 * @description Servicio para gestionar horarios de turnos
 */

import api from "./api.js";

/**
 * Obtiene el horario/turno activo en el momento actual
 * @param {string} [timestamp] - Timestamp ISO8601 para pruebas (opcional)
 * @returns {Promise<Object>} Datos del turno activo
 */
export const getHorarioActivo = async (timestamp) => {
  const params = timestamp ? { timestamp } : {};
  const response = await api.get("/horarios-turnos/activo", { params });
  return response.data;
};

/**
 * Lista todos los horarios de turnos
 * @returns {Promise<Array>} Lista de horarios
 */
export const listHorariosTurnos = async () => {
  const response = await api.get("/horarios-turnos");
  return response.data?.data || response.data || [];
};

/**
 * Actualiza un horario de turno existente (MAÑANA, TARDE, NOCHE)
 * @param {string} turno - Identificador del turno
 * @param {Object} data - Campos a actualizar
 * @returns {Promise<Object>}
 */
export const updateHorarioTurno = async (turno, data) => {
  const response = await api.put(`/horarios-turnos/${turno}`, data);
  return response.data;
};

export default {
  getHorarioActivo,
  listHorariosTurnos,
  updateHorarioTurno,
};
