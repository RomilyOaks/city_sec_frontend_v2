/**
 * File: src/services/tiposNovedadService.js
 * @version 1.0.0
 * @description Servicio para gestionar tipos de novedad
 */

import api from "./api.js";

/**
 * Obtener todos los tipos de novedad activos
 * @returns {Promise<Array>} Lista de tipos de novedad
 */
export const listTiposNovedad = async () => {
  const response = await api.get("/tipos-novedad");
  console.log("[tiposNovedadService] listTiposNovedad - response.data:", response.data);

  // El backend puede devolver diferentes formatos:
  // Formato 1: Array directamente
  // Formato 2: { data: Array }
  // Formato 3: { success: true, data: Array }
  // Formato 4: { items: Array, pagination: {...} }
  const rawData = response?.data;

  // Si tiene propiedad 'data', extraerla
  if (rawData && rawData.data && Array.isArray(rawData.data)) {
    console.log("[tiposNovedadService] Formato detectado: { data: Array }");
    return rawData.data;
  }

  // Si tiene propiedad 'items', extraerla
  if (rawData && rawData.items && Array.isArray(rawData.items)) {
    console.log("[tiposNovedadService] Formato detectado: { items: Array }");
    return rawData.items;
  }

  // Si es un array directamente
  if (Array.isArray(rawData)) {
    console.log("[tiposNovedadService] Formato detectado: Array directo");
    return rawData;
  }

  console.warn("[tiposNovedadService] Formato no reconocido, retornando array vacío");
  return [];
};

/**
 * Obtener un tipo de novedad por ID
 * @param {number} id - ID del tipo de novedad
 * @returns {Promise<Object>} Tipo de novedad encontrado
 */
export const getTipoNovedadById = async (id) => {
  const response = await api.get(`/tipos-novedad/${id}`);
  return response.data;
};

/**
 * Crear un nuevo tipo de novedad
 * @param {Object} data - Datos del tipo de novedad
 * @returns {Promise<Object>} Tipo de novedad creado
 */
export const createTipoNovedad = async (data) => {
  const response = await api.post("/tipos-novedad", data);
  return response.data;
};

/**
 * Actualizar un tipo de novedad
 * @param {number} id - ID del tipo de novedad
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Tipo de novedad actualizado
 */
export const updateTipoNovedad = async (id, data) => {
  const response = await api.put(`/tipos-novedad/${id}`, data);
  return response.data;
};

/**
 * Eliminar (soft delete) un tipo de novedad
 * @param {number} id - ID del tipo de novedad
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteTipoNovedad = async (id) => {
  const response = await api.delete(`/tipos-novedad/${id}`);
  return response.data;
};

/**
 * Obtener tipos de novedad eliminados (soft-deleted)
 * @returns {Promise<Array>} Lista de tipos eliminados
 */
export const getTiposNovedadEliminados = async () => {
  const response = await api.get("/tipos-novedad/eliminadas");
  return response.data;
};

/**
 * Reactivar un tipo de novedad eliminado
 * @param {number} id - ID del tipo de novedad a reactivar
 * @returns {Promise<Object>} Tipo de novedad reactivado
 */
export const reactivarTipoNovedad = async (id) => {
  const response = await api.patch(`/tipos-novedad/${id}/reactivar`);
  return response.data;
};

export default {
  listTiposNovedad,
  getTipoNovedadById,
  createTipoNovedad,
  updateTipoNovedad,
  deleteTipoNovedad,
  getTiposNovedadEliminados,
  reactivarTipoNovedad,
};
