/**
 * File: src/services/tiposViaService.js
 * @version 1.0.0
 * @description Servicio para operaciones CRUD de tipos de vía
 * @module src/services/tiposViaService.js
 */

import api from "./api";

/**
 * listTiposVia
 * Lista tipos de vía con paginación y filtros (solo activos por defecto)
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.search]
 * @param {boolean} [options.includeInactive=false] - Incluir inactivos (no filtrar por estado)
 * @returns {Promise<{items:Array,pagination:Object|null}>}
 */
export async function listTiposVia({
  page = 1,
  limit = 20,
  search,
  includeInactive = false,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);

  // Solo filtrar por activos si no se pide incluir inactivos
  if (!includeInactive) {
    params.append("estado", "1");
  }

  if (search) params.append("search", search);

  const res = await api.get(`/tipos-via?${params.toString()}`);
  return res?.data?.data || res?.data || { items: [], pagination: null };
}

/**
 * Obtener tipo de vía por ID
 */
export async function getTipoViaById(id) {
  const res = await api.get(`/tipos-via/${id}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Crear nuevo tipo de vía
 */
export async function createTipoVia(data) {
  const res = await api.post("/tipos-via", data);
  return res?.data;
}

/**
 * Actualizar tipo de vía
 */
export async function updateTipoVia(id, data) {
  const res = await api.put(`/tipos-via/${id}`, data);
  return res?.data;
}

/**
 * Eliminar tipo de vía (soft delete)
 */
export async function deleteTipoVia(id) {
  const res = await api.delete(`/tipos-via/${id}`);
  return res?.data;
}

/**
 * Listar tipos de vía activos (para selects/combos)
 */
export async function listTiposViaActivos() {
  const res = await api.get("/tipos-via/activos");
  return res?.data?.data || res?.data || [];
}
