/**
 * File: c:\Project\city_sec_frontend_v2\src\services\rolesService.js
 * @version 2.0.0
 * @description Servicio de roles: listado, CRUD, permisos por rol y usuarios asociados.
 */

import api from "./api";

/**
 * Lista todos los roles disponibles.
 * @param {{incluirPermisos?:boolean}} options
 * @returns {Promise<Array>} Array de roles (normalizado)
 */
export async function listRoles({ incluirPermisos = false } = {}) {
  const params = new URLSearchParams();
  if (incluirPermisos) params.append("incluir_permisos", "true");

  const res = await api.get(`/roles?${params.toString()}`);
  const payload = res?.data?.data || res?.data || {};

  const roles =
    payload?.roles ||
    payload?.data?.roles ||
    payload?.items ||
    payload?.data?.items ||
    payload?.data ||
    [];

  return Array.isArray(roles) ? roles : [];
}

/**
 * Obtiene datos de un rol por su id.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function getRolById(id) {
  const res = await api.get(`/roles/${id}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Obtiene datos de un rol por su slug (identificador único).
 * @param {string} slug
 * @returns {Promise<Object|null>}
 */
export async function getRolBySlug(slug) {
  const res = await api.get(`/roles/slug/${slug}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Crea un nuevo rol
 * @param {Object} data - Objeto con campos del rol (nombre, slug, permisos, color, etc.)
 * @returns {Promise<any>} Respuesta del endpoint
 */
export async function createRol(data) {
  const res = await api.post("/roles", data);
  return res?.data;
}

/**
 * Actualiza un rol existente
 * @param {number|string} id
 * @param {Object} data
 * @returns {Promise<any>}
 */
export async function updateRol(id, data) {
  const res = await api.put(`/roles/${id}`, data);
  return res?.data;
}

/**
 * Elimina un rol (soft delete)
 * @param {number|string} id
 * @returns {Promise<any>}
 */
export async function deleteRol(id) {
  const res = await api.delete(`/roles/${id}`);
  return res?.data;
}

/**
 * Obtiene permisos asignados a un rol
 * @param {number|string} rolId
 * @returns {Promise<{permisos:Array}>}
 */
export async function getPermisosDeRol(rolId) {
  const res = await api.get(`/roles/${rolId}/permisos`);
  return res?.data?.data || res?.data || { permisos: [] };
}

/**
 * Asigna permisos a un rol (reemplaza los existentes).
 * @param {number|string} rolId
 * @param {Array<number|string>} permisoIds
 * @returns {Promise<any>}
 */
export async function asignarPermisosARol(rolId, permisoIds) {
  const res = await api.post(`/roles/${rolId}/permisos`, {
    permisos: permisoIds,
  });
  return res?.data;
}

/**
 * Obtener usuarios asignados a un rol * @param {number|string} rolId
 * @returns {Promise<{usuarios:Array, total:number}>} */
export async function getUsuariosDeRol(rolId) {
  const res = await api.get(`/roles/${rolId}/usuarios`);
  return res?.data?.data || res?.data || { usuarios: [], total: 0 };
}
