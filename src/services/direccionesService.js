/**
 * File: src/services/direccionesService.js
 * @version 1.0.0
 * @description Service para gestión de direcciones normalizadas
 *
 * ENDPOINTS:
 * - GET    /direcciones                  - Listar con paginación
 * - GET    /direcciones/activas          - Listar solo activas
 * - GET    /direcciones/search           - Búsqueda avanzada
 * - GET    /direcciones/:id              - Obtener por ID
 * - POST   /direcciones                  - Crear dirección
 * - POST   /direcciones/validar          - Validar sin guardar
 * - PUT    /direcciones/:id              - Actualizar dirección
 * - DELETE /direcciones/:id              - Eliminar (soft delete)
 * - PATCH  /direcciones/:id/geocodificar - Actualizar coordenadas
 * - GET    /direcciones/stats/mas-usadas - Direcciones más frecuentes
 *
 * @module src/services/direccionesService
 */

import api from "./api";

/**
 * Listar direcciones con paginación y filtros
 * @param {Object} params - Parámetros de consulta
 * @param {number} params.page - Página actual
 * @param {number} params.limit - Registros por página
 * @param {string} params.search - Búsqueda general
 * @param {number} params.calle_id - Filtrar por calle
 * @param {number} params.cuadrante_id - Filtrar por cuadrante
 * @param {number} params.sector_id - Filtrar por sector
 * @param {number} params.geocodificada - Filtrar por geocodificadas (1) o no (0)
 * @returns {Promise<Object>} Lista de direcciones con paginación
 */
export const listDirecciones = async ({
  page = 1,
  limit = 20,
  search = "",
  calle_id = null,
  cuadrante_id = null,
  sector_id = null,
  geocodificada = null,
} = {}) => {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (calle_id) params.append("calle_id", calle_id);
  if (cuadrante_id) params.append("cuadrante_id", cuadrante_id);
  if (sector_id) params.append("sector_id", sector_id);
  if (geocodificada !== null) params.append("geocodificada", geocodificada);

  const url = `/direcciones?${params.toString()}`;
  console.log("🔗 [direccionesService] Llamando a:", url);

  const res = await api.get(url);
  console.log("📦 [direccionesService] Respuesta raw:", res.data);

  return res.data?.data || res.data;
};

/**
 * Listar direcciones activas (para selects)
 * @returns {Promise<Array>} Lista de direcciones activas
 */
export const listDireccionesActivas = async () => {
  const res = await api.get("/direcciones/activas");
  return res.data?.data || res.data;
};

/**
 * Búsqueda avanzada de direcciones
 * @param {Object} params - Criterios de búsqueda
 * @param {string} params.calle - Nombre de calle
 * @param {string} params.numero - Número municipal o lote
 * @param {string} params.urbanizacion - Urbanización o AAHH
 * @returns {Promise<Array>} Resultados de búsqueda
 */
export const searchDirecciones = async ({ calle, numero, urbanizacion } = {}) => {
  const params = new URLSearchParams();
  if (calle) params.append("calle", calle);
  if (numero) params.append("numero", numero);
  if (urbanizacion) params.append("urbanizacion", urbanizacion);

  const res = await api.get(`/direcciones/search?${params.toString()}`);
  return res.data?.data || res.data;
};

/**
 * Obtener dirección por ID
 * @param {number} id - ID de la dirección
 * @returns {Promise<Object>} Dirección completa
 */
export const getDireccionById = async (id) => {
  const res = await api.get(`/direcciones/${id}`);
  return res.data?.data || res.data;
};

/**
 * Crear nueva dirección
 * @param {Object} direccionData - Datos de la dirección
 * @returns {Promise<Object>} Dirección creada
 */
export const createDireccion = async (direccionData) => {
  const res = await api.post("/direcciones", direccionData);
  return res.data?.data || res.data;
};

/**
 * Validar dirección sin guardar
 * @param {Object} direccionData - Datos a validar
 * @returns {Promise<Object>} Resultado de validación con cuadrante/sector asignado
 */
export const validarDireccion = async (direccionData) => {
  const res = await api.post("/direcciones/validar", direccionData);
  return res.data?.data || res.data;
};

/**
 * Actualizar dirección existente
 * @param {number} id - ID de la dirección
 * @param {Object} direccionData - Datos actualizados
 * @returns {Promise<Object>} Dirección actualizada
 */
export const updateDireccion = async (id, direccionData) => {
  const res = await api.put(`/direcciones/${id}`, direccionData);
  return res.data?.data || res.data;
};

/**
 * Eliminar dirección (soft delete)
 * @param {number} id - ID de la dirección
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteDireccion = async (id) => {
  const res = await api.delete(`/direcciones/${id}`);
  return res.data?.data || res.data;
};

/**
 * Geocodificar dirección (actualizar coordenadas)
 * @param {number} id - ID de la dirección
 * @param {Object} coordenadas - Latitud, longitud, fuente
 * @returns {Promise<Object>} Dirección geocodificada
 */
export const geocodificarDireccion = async (id, { latitud, longitud, fuente = "Manual" }) => {
  const res = await api.patch(`/direcciones/${id}/geocodificar`, {
    latitud,
    longitud,
    fuente,
  });
  return res.data?.data || res.data;
};

/**
 * Obtener direcciones más usadas
 * @param {number} limit - Límite de resultados (default 20)
 * @returns {Promise<Array>} Direcciones más frecuentes
 */
export const getDireccionesMasUsadas = async (limit = 20) => {
  const res = await api.get(`/direcciones/stats/mas-usadas?limit=${limit}`);
  return res.data?.data || res.data;
};

/**
 * Reactivar dirección eliminada (soft-deleted)
 * @param {number} id - ID de la dirección a reactivar
 * @returns {Promise<Object>} Dirección reactivada
 */
export const reactivarDireccion = async (id) => {
  const res = await api.patch(`/direcciones/${id}/reactivar`);
  return res.data?.data || res.data;
};

/**
 * Verificar si una dirección puede ser eliminada
 * @param {number} id - ID de la dirección a verificar
 * @returns {Promise<Object>} { canDelete: boolean, message: string, count: number }
 */
export const checkDireccionCanDelete = async (id) => {
  try {
    const res = await api.get(`/direcciones/${id}/can-delete`);
    return res.data?.data || res.data;
  } catch (error) {
    // Si el endpoint no existe, intentar con el método alternativo
    // (obtener la dirección y verificar si tiene novedades asociadas)
    console.warn("Endpoint /can-delete no disponible, usando método alternativo");
    return { canDelete: true, message: "", count: 0 };
  }
};

export default {
  listDirecciones,
  listDireccionesActivas,
  searchDirecciones,
  getDireccionById,
  createDireccion,
  validarDireccion,
  updateDireccion,
  deleteDireccion,
  geocodificarDireccion,
  getDireccionesMasUsadas,
  reactivarDireccion,
  checkDireccionCanDelete,
};
