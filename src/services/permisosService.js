/**
 * File: c:\Project\city_sec_frontend_v2\src\services\permisosService.js
 * @version 3.0.0
 * @description CRUD completo de permisos con endpoints del backend
 */

import api from "./api";

/**
 * Obtener todos los permisos disponibles en el sistema
 */
export async function listPermisos({
  page = 1,
  limit = 50,
  search = "",
  modulo = "",
  recurso = "",
  activos = "true",
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (modulo) params.append("modulo", modulo);
  if (recurso) params.append("recurso", recurso);
  if (activos) params.append("activos", activos);

  const res = await api.get(`/permisos?${params.toString()}`);
  return res?.data?.data || res?.data || { permisos: [], pagination: null };
}

/**
 * Obtener permiso por ID
 */
export async function getPermisoById(id) {
  const res = await api.get(`/permisos/${id}`);
  return res?.data?.data || res?.data;
}

/**
 * Obtener permiso por slug
 */
export async function getPermisoBySlug(slug) {
  const res = await api.get(`/permisos/slug/${slug}`);
  return res?.data?.data || res?.data;
}

/**
 * Listar permisos por módulo
 */
export async function getPermisosByModulo(modulo) {
  const res = await api.get(`/permisos/modulo/${modulo}`);
  return res?.data?.data || res?.data || { permisos: [], total: 0 };
}

/**
 * Crear nuevo permiso
 */
export async function createPermiso(data) {
  const res = await api.post("/permisos", data);
  return res?.data;
}

/**
 * Actualizar permiso (solo descripción)
 */
export async function updatePermiso(id, data) {
  const res = await api.put(`/permisos/${id}`, data);
  return res?.data;
}

/**
 * Cambiar estado de permiso
 */
export async function cambiarEstadoPermiso(id, estado) {
  const res = await api.patch(`/permisos/${id}/estado`, { estado });
  return res?.data;
}

/**
 * Eliminar permiso (permanente)
 */
export async function deletePermiso(id) {
  const res = await api.delete(`/permisos/${id}`);
  return res?.data;
}

/**
 * Obtiene permisos de un rol específico.
 * @param {number|string} rolId
 * @returns {Promise<Array>} Array de permisos
 */
export async function getPermisosDeRol(rolId) {
  const res = await api.get(`/roles/${rolId}/permisos`);
  return res?.data?.data || res?.data || [];
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
 * Quita (desasigna) un permiso específico de un rol.
 * @param {number|string} rolId
 * @param {number|string} permisoId
 * @returns {Promise<any>}
 */
export async function quitarPermisoDeRol(rolId, permisoId) {
  const res = await api.delete(`/roles/${rolId}/permisos/${permisoId}`);
  return res?.data;
}

/**
 * Obtener permisos agrupados por módulo y recurso
 */
export async function getPermisosAgrupados() {
  const res = await api.get("/permisos?limit=500");
  const permisos = res?.data?.data?.permisos || res?.data?.permisos || [];

  // Agrupar por módulo > recurso
  const agrupados = permisos.reduce((acc, permiso) => {
    const modulo = permiso.modulo || "otros";
    const recurso = permiso.recurso || "general";
    const key = `${modulo}.${recurso}`;

    if (!acc[key]) {
      acc[key] = {
        modulo,
        recurso,
        permisos: [],
      };
    }
    acc[key].permisos.push(permiso);
    return acc;
  }, {});

  return agrupados;
}
