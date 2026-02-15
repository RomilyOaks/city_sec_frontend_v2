/**
 * File: src/services/unidadesOficinaService.js
 * @version 1.0.0
 * @description Service para gestión de Unidades y Oficinas
 *
 * ENDPOINTS:
 * - GET    /unidades-oficina                  - Listar con paginación y filtros
 * - GET    /unidades-oficina/activas          - Listar solo activas
 * - GET    /unidades-oficina/:id              - Obtener por ID
 * - POST   /unidades-oficina                  - Crear unidad/oficina
 * - PUT    /unidades-oficina/:id              - Actualizar unidad/oficina
 * - DELETE /unidades-oficina/:id              - Eliminar (soft delete)
 * - PATCH  /unidades-oficina/:id/reactivar    - Reactivar eliminada
 * - GET    /unidades-oficina/:id/can-delete   - Verificar si puede eliminarse
 *
 * @module src/services/unidadesOficinaService
 */

import api from "./api";

/**
 * Listar unidades y oficinas con paginación y filtros
 * @param {Object} params - Parámetros de consulta
 * @param {number} params.page - Página actual
 * @param {number} params.limit - Registros por página
 * @param {string} params.search - Búsqueda general
 * @param {string} params.tipo_unidad - Filtrar por tipo
 * @param {number} params.estado - Filtrar por estado (1=activo, 0=inactivo)
 * @param {number} params.activo_24h - Filtrar por 24h (1=sí, 0=no)
 * @param {string} params.ubigeo_code - Filtrar por ubigeo
 * @returns {Promise<Object>} Lista de unidades con paginación
 */
export const listUnidadesOficina = async ({
  page = 1,
  limit = 20,
  search = "",
  tipo_unidad = null,
  estado = null,
  activo_24h = null,
  ubigeo_code = null,
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (tipo_unidad) params.append("tipo_unidad", tipo_unidad);
  if (estado !== null) params.append("estado", estado);
  if (activo_24h !== null) params.append("activo_24h", activo_24h);
  if (ubigeo_code) params.append("ubigeo_code", ubigeo_code);

  const url = `/unidades-oficina?${params.toString()}`;
  const res = await api.get(url);
  return res.data?.data || res.data;
};

/**
 * Listar unidades y oficinas activas (para selects)
 * @returns {Promise<Array>} Lista de unidades activas
 */
export const listUnidadesOficinaActivas = async () => {
  const res = await api.get("/unidades-oficina/activas");
  return res.data?.data || res.data;
};

/**
 * Obtener unidad/oficina por ID
 * @param {number} id - ID de la unidad/oficina
 * @returns {Promise<Object>} Unidad/oficina completa
 */
export const getUnidadOficinaById = async (id) => {
  const res = await api.get(`/unidades-oficina/${id}`);

  // Manejar diferentes estructuras de respuesta del backend
  if (res.data?.data) {
    return res.data.data;
  } else if (res.data?.unidad) {
    return res.data.unidad;
  } else if (res.data && typeof res.data === 'object' && res.data.id) {
    // La respuesta directa es el objeto
    return res.data;
  }

  return res.data;
};

/**
 * Crear nueva unidad/oficina
 * @param {Object} unidadData - Datos de la unidad/oficina
 * @returns {Promise<Object>} Unidad/oficina creada
 */
export const createUnidadOficina = async (unidadData) => {
  const res = await api.post("/unidades-oficina", unidadData);
  return res.data?.data || res.data;
};

/**
 * Actualizar unidad/oficina existente
 * @param {number} id - ID de la unidad/oficina
 * @param {Object} unidadData - Datos actualizados
 * @returns {Promise<Object>} Unidad/oficina actualizada
 */
export const updateUnidadOficina = async (id, unidadData) => {
  const res = await api.put(`/unidades-oficina/${id}`, unidadData);
  return res.data?.data || res.data;
};

/**
 * Eliminar unidad/oficina (soft delete)
 * @param {number} id - ID de la unidad/oficina
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteUnidadOficina = async (id) => {
  const res = await api.delete(`/unidades-oficina/${id}`);
  return res.data?.data || res.data;
};

/**
 * Reactivar unidad/oficina eliminada (soft-deleted)
 * @param {number} id - ID de la unidad/oficina a reactivar
 * @returns {Promise<Object>} Unidad/oficina reactivada
 */
export const reactivarUnidadOficina = async (id) => {
  const res = await api.patch(`/unidades-oficina/${id}/reactivar`);
  return res.data?.data || res.data;
};

/**
 * Verificar si una unidad/oficina puede ser eliminada
 * @param {number} id - ID de la unidad/oficina a verificar
 * @returns {Promise<Object>} { canDelete: boolean, message: string, count: number }
 */
export const checkUnidadOficinaCanDelete = async (id) => {
  try {
    const res = await api.get(`/unidades-oficina/${id}/can-delete`);
    return res.data?.data || res.data;
  } catch {
    console.warn("Endpoint /can-delete no disponible, usando método alternativo");
    return { canDelete: true, message: "", count: 0 };
  }
};

export default {
  listUnidadesOficina,
  listUnidadesOficinaActivas,
  getUnidadOficinaById,
  createUnidadOficina,
  updateUnidadOficina,
  deleteUnidadOficina,
  reactivarUnidadOficina,
  checkUnidadOficinaCanDelete,
};
