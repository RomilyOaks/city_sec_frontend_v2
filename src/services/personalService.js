/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\services\\personalService.js
 * @version 2.0.0
 * @description Servicio para gestión de personal: listado, creación, actualización y utilidades.
 * Documentación añadida sin cambiar la implementación.
 *
 * @module src/services/personalService.js
 */

import api from "./api";

/**
 * Listar personal con filtros y paginación
 */
export async function listPersonal({
  page = 1,
  limit = 20,
  status,
  cargo_id,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (status) params.append("status", status);
  if (cargo_id) params.append("cargo_id", cargo_id);
  if (search) params.append("search", search);

  const res = await api.get(`/personal?${params.toString()}`);
  return res?.data?.data || res?.data || { personal: [], pagination: null };
}

/**
 * Obtener personal por ID
 */
export async function getPersonalById(id) {
  const res = await api.get(`/personal/${id}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Crear nuevo personal
 */
export async function createPersonal(data) {
  const res = await api.post("/personal", data);
  return res?.data;
}

/**
 * Actualizar personal
 */
export async function updatePersonal(id, data) {
  const res = await api.put(`/personal/${id}`, data);
  return res?.data;
}

/**
 * Eliminar personal (soft delete)
 */
export async function deletePersonal(id) {
  const res = await api.delete(`/personal/${id}`);
  return res?.data;
}

/**
 * Restaurar personal eliminado
 */
export async function restorePersonal(id) {
  const res = await api.post(`/personal/${id}/restore`);
  return res?.data;
}

/**
 * Cambiar status de personal
 */
export async function cambiarStatusPersonal(id, status, observaciones) {
  const res = await api.patch(`/personal/${id}/status`, {
    status,
    observaciones,
  });
  return res?.data;
}

/**
 * Obtener estadísticas de personal
 */
export async function getEstadisticasPersonal() {
  const res = await api.get("/personal/stats");
  return res?.data?.data || res?.data || {};
}

/**
 * Listar conductores (personal con licencia)
 * @param {{ disponible?: boolean }} [options]
 * @param {boolean} [options.disponible] - Si true, solo devuelve conductores sin vehículo asignado
 * @returns {Promise<Array>}
 */
export async function listConductores({ disponible } = {}) {
  try {
    const params = {};
    if (disponible) params.disponible = true;
    const res = await api.get("/personal/conductores", { params });
    const data =
      res?.data?.data?.conductores ||
      res?.data?.conductores ||
      res?.data?.data ||
      res?.data ||
      [];
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn("[listConductores] Error:", err?.response?.status, err?.response?.data || err?.message);
    // Fallback: obtener todo el personal y filtrar los que tienen licencia
    const res = await api.get("/personal?limit=100");
    const personal =
      res?.data?.data?.personal ||
      res?.data?.personal ||
      res?.data?.data ||
      res?.data ||
      [];
    const list = Array.isArray(personal) ? personal : [];
    const filtered = list.filter((p) => p.licencia && p.estado === 1);
    return filtered;
  }
}

/**
 * Listar personal disponible (sin vehículo asignado)
 */
export async function listPersonalDisponible() {
  const res = await api.get("/personal/disponibles");
  return res?.data?.data || res?.data || [];
}

/**
 * Listar personal para selectores/dropdowns
 * Endpoint optimizado sin paginación que devuelve solo campos básicos
 * Ordenado alfabéticamente por apellido_paterno, apellido_materno, nombres
 * @returns {Promise<Array>} Lista de personal con campos: id, nombres, apellido_paterno, apellido_materno, doc_tipo, doc_numero, sexo, nacionalidad
 */
export async function listPersonalSelector() {
  const res = await api.get("/personal/selector");
  return res?.data?.data || res?.data || [];
}
