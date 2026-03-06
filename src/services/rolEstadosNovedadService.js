/**
 * File: src/services/rolEstadosNovedadService.js
 * @version 1.0.0
 * @description Servicio para el CRUD de configuraciones Rol-Estados de Novedad.
 * Base URL: /api/v1/rol-estados-novedad
 */

import api from "./api";

/**
 * Lista todas las configuraciones rol-estado de novedad.
 * @param {{rol_id?:number, estado_novedad_id?:number, estado?:number, page?:number, limit?:number}} params
 * @returns {Promise<{data:Array, pagination:Object}>}
 */
export async function listRolEstadosNovedad(params = {}) {
  const res = await api.get("/rol-estados-novedad", { params });
  return res?.data || { data: [], pagination: {} };
}

/**
 * Obtiene una configuración por ID.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getRolEstadoNovedadById(id) {
  const res = await api.get(`/rol-estados-novedad/${id}`);
  return res?.data?.data || null;
}

/**
 * Obtiene los estados disponibles para un rol específico.
 * @param {number} rolId
 * @returns {Promise<{rol:Object, data:Array}>}
 */
export async function getEstadosByRol(rolId) {
  const res = await api.get(`/rol-estados-novedad/rol/${rolId}/estados`);
  return res?.data || { data: [] };
}

/**
 * Crea una nueva configuración rol-estado.
 * @param {{rol_id:number, estado_novedad_id:number, descripcion?:string, observaciones?:string}} data
 * @returns {Promise<Object>}
 */
export async function createRolEstadoNovedad(data) {
  const res = await api.post("/rol-estados-novedad", data);
  return res?.data;
}

/**
 * Actualiza descripción, observaciones o estado de una configuración.
 * @param {number} id
 * @param {{descripcion?:string, observaciones?:string, estado?:boolean}} data
 * @returns {Promise<Object>}
 */
export async function updateRolEstadoNovedad(id, data) {
  const res = await api.put(`/rol-estados-novedad/${id}`, data);
  return res?.data;
}

/**
 * Activa o desactiva una configuración.
 * @param {number} id
 * @param {boolean} estado
 * @returns {Promise<Object>}
 */
export async function toggleRolEstadoNovedad(id, estado) {
  const res = await api.patch(`/rol-estados-novedad/${id}/estado`, { estado });
  return res?.data;
}

/**
 * Elimina (soft-delete) una configuración.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function deleteRolEstadoNovedad(id) {
  const res = await api.delete(`/rol-estados-novedad/${id}`);
  return res?.data;
}
