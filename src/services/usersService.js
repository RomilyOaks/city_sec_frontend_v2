/**
 * File: c:\Project\city_sec_frontend_v2\src\services\usersService.js
 * @version 2.0.0
 * @description Servicio para operaciones CRUD sobre usuarios. Normaliza respuestas y ofrece helpers de paginación.
 */

import api from "./api";

/**
 * Crea un nuevo usuario.
 * @param {{username:string,email:string,password:string,nombres?:string,apellidos?:string,telefono?:string,roles?:Array,personal_seguridad_id?:number,estado?:boolean}} params
 * @returns {Promise<any>} Respuesta del endpoint de creación
 */
export async function createUser({
  username,
  email,
  password,
  nombres,
  apellidos,
  telefono,
  roles,
  personal_seguridad_id,
  estado,
}) {
  const res = await api.post("/usuarios", {
    username,
    email,
    password,
    nombres,
    apellidos,
    telefono,
    roles,
    personal_seguridad_id,
    estado,
  });
  return res?.data;
}

/**
 * Lista usuarios con paginación y filtros básicos (search, rol, estado, deleted).
 * Normaliza la respuesta para devolver { usuarios, pagination }.
 * @param {{page?:number,limit?:number,search?:string,rol?:string,estado?:string,deleted?:string,includeDeleted?:boolean,onlyDeleted?:boolean}} options
 * @returns {Promise<{usuarios:Array,pagination:Object|null}>}
 */
export async function listUsers({
  page = 1,
  limit = 10,
  search = "",
  rol = "",
  estado = "",
  deleted = "",
  includeDeleted = false,
  onlyDeleted = false,
} = {}) {
  const params = {};
  if (page) params.page = page;
  if (limit) params.limit = limit;
  if (search) params.search = search;
  if (rol) params.rol = rol;
  if (estado) params.estado = estado;
  if (deleted === "all" || includeDeleted) params.includeDeleted = 1;
  if (deleted === "deleted" || onlyDeleted) params.onlyDeleted = 1;

  const res = await api.get("/usuarios", { params });
  const payload = res?.data?.data || res?.data || {};
  const usuarios = payload?.usuarios || payload?.data?.usuarios || [];
  const pagination = payload?.pagination || payload?.data?.pagination || null;
  return { usuarios: Array.isArray(usuarios) ? usuarios : [], pagination };
}

/**
 * Cambia el estado (activo/inactivo) de un usuario.
 * @param {number|string} userId
 * @param {boolean|string} estado
 * @returns {Promise<any>}
 */
export async function changeUserEstado(userId, estado) {
  const res = await api.patch(`/usuarios/${userId}/estado`, { estado });
  return res?.data;
}

/**
 * Elimina un usuario (soft delete en el backend).
 * @param {number|string} userId
 * @returns {Promise<any>}
 */
export async function deleteUser(userId) {
  const res = await api.delete(`/usuarios/${userId}`);
  return res?.data;
}

/**
 * Restaura un usuario eliminado.
 * @param {number|string} userId
 * @returns {Promise<any>}
 */
export async function restoreUser(userId) {
  const res = await api.patch(`/usuarios/${userId}/restore`);
  return res?.data;
}

/**
 * Actualiza los datos de un usuario.
 * @param {number|string} userId
 * @param {Object} payload
 * @returns {Promise<any>}
 */
export async function updateUser(userId, payload) {
  const res = await api.put(`/usuarios/${userId}`, payload);
  return res?.data;
}

/**
 * Obtiene un usuario por su id.
 * @param {number|string} userId
 * @returns {Promise<Object|null>}
 */
export async function getUserById(userId) {
  const res = await api.get(`/usuarios/${userId}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Resetea la contraseña de un usuario (acción de admin).
 * @param {number|string} userId
 * @param {string} newPassword
 * @returns {Promise<any>}
 */
export async function resetUserPassword(userId, newPassword) {
  const res = await api.patch(`/usuarios/${userId}/reset-password`, { newPassword });
  return res?.data;
}
