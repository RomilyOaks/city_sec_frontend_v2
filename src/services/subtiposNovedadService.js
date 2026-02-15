/**
 * File: src/services/subtiposNovedadService.js
 * @version 1.0.0
 * @description Servicio para gestionar subtipos de novedad
 */

import api from "./api.js";

/**
 * Obtener todos los subtipos de novedad activos
 * @param {number} tipoNovedadId - ID del tipo de novedad (opcional, para filtrar)
 * @returns {Promise<Array>} Lista de subtipos de novedad
 */
export const listSubtiposNovedad = async (tipoNovedadId = null) => {
  // Intentar filtrar por backend usando tipo_novedad_id
  let url = "/subtipos-novedad";
  if (tipoNovedadId) {
    url += `?tipo_novedad_id=${tipoNovedadId}`;
  }
  const response = await api.get(url);

  // El backend puede devolver diferentes formatos:
  const rawData = response?.data;
  let result = [];

  // Si tiene propiedad 'data', extraerla
  if (rawData && rawData.data && Array.isArray(rawData.data)) {
    result = rawData.data;
  }
  // Si tiene propiedad 'items', extraerla
  else if (rawData && rawData.items && Array.isArray(rawData.items)) {
    result = rawData.items;
  }
  // Si es un array directamente
  else if (Array.isArray(rawData)) {
    result = rawData;
  } else {
    console.warn("[subtiposNovedadService] Formato no reconocido, retornando array vacío");
    return [];
  }

  // Filtrar en frontend si el backend no filtró correctamente
  if (tipoNovedadId && result.length > 0) {
    const filtered = result.filter((s) => s.tipo_novedad_id === tipoNovedadId);
    return filtered;
  }

  return result;
};

/**
 * Obtener un subtipo de novedad por ID
 * @param {number} id - ID del subtipo de novedad
 * @returns {Promise<Object>} Subtipo de novedad encontrado
 */
export const getSubtipoNovedadById = async (id) => {
  const response = await api.get(`/subtipos-novedad/${id}`);
  const rawData = response?.data;

  // Extraer data si viene envuelta
  if (rawData && rawData.data && typeof rawData.data === "object") {
    return rawData.data;
  }

  return rawData;
};

/**
 * Crear un nuevo subtipo de novedad
 * @param {Object} data - Datos del subtipo de novedad
 * @returns {Promise<Object>} Subtipo de novedad creado
 */
export const createSubtipoNovedad = async (data) => {
  const response = await api.post("/subtipos-novedad", data);
  return response.data;
};

/**
 * Actualizar un subtipo de novedad
 * @param {number} id - ID del subtipo de novedad
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Subtipo de novedad actualizado
 */
export const updateSubtipoNovedad = async (id, data) => {
  const response = await api.put(`/subtipos-novedad/${id}`, data);
  return response.data;
};

/**
 * Eliminar (soft delete) un subtipo de novedad
 * @param {number} id - ID del subtipo de novedad
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteSubtipoNovedad = async (id) => {
  const response = await api.delete(`/subtipos-novedad/${id}`);
  return response.data;
};

/**
 * Obtener subtipos de novedad eliminados (soft-deleted)
 * @returns {Promise<Array>} Lista de subtipos eliminados
 */
export const getSubtiposNovedadEliminados = async () => {
  const response = await api.get("/subtipos-novedad/eliminados");
  return response.data;
};

/**
 * Reactivar un subtipo de novedad eliminado
 * @param {number} id - ID del subtipo de novedad a reactivar
 * @returns {Promise<Object>} Subtipo de novedad reactivado
 */
export const reactivarSubtipoNovedad = async (id) => {
  const response = await api.patch(`/subtipos-novedad/${id}/reactivar`);
  return response.data;
};

export default {
  listSubtiposNovedad,
  getSubtipoNovedadById,
  createSubtipoNovedad,
  updateSubtipoNovedad,
  deleteSubtipoNovedad,
  getSubtiposNovedadEliminados,
  reactivarSubtipoNovedad,
};
