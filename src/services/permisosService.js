/**
 * File: c:\Project\city_sec_frontend_v2\src\services\permisosService.js
 * @version 2.0.0
 * @description Helpers para consultar y manipular permisos: listado, agrupación y asignaciones por rol.
 */

import api from "./api";

/**
 * Obtener todos los permisos disponibles en el sistema
 */
export async function listPermisos({
  page = 1,
  limit = 100,
  search = "",
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);

  const res = await api.get(`/permisos?${params.toString()}`);
  return res?.data?.data || res?.data || { permisos: [], pagination: null };
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
