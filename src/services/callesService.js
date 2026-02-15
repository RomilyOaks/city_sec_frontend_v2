/**
 * File: src/services/callesService.js
 * @version 1.0.0
 * @description Servicio para operaciones relacionadas con calles: listados, CRUD y consultas especiales.
 * @module src/services/callesService.js
 */

import api from "./api";

/**
 * listCalles
 * Lista calles con paginación y filtros
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.search]
 * @param {number} [options.tipo_via_id]
 * @param {number} [options.es_principal]
 * @param {string} [options.categoria_via]
 * @returns {Promise<{calles:Array,pagination:Object|null}>}
 */
export async function listCalles({
  page = 1,
  limit = 20,
  search,
  tipo_via_id,
  es_principal,
  categoria_via,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (tipo_via_id) params.append("tipo_via_id", tipo_via_id);
  // ✅ Solo enviar si tiene valor (no vacío, no undefined, no null)
  if (
    es_principal !== undefined &&
    es_principal !== null &&
    es_principal !== ""
  ) {
    params.append("es_principal", es_principal);
  }
  if (categoria_via) params.append("categoria_via", categoria_via);

  const res = await api.get(`/calles?${params.toString()}`);
  return res?.data?.data || res?.data || { calles: [], pagination: null };
}

/**
 * Obtener calle por ID
 */
export async function getCalleById(id) {
  const res = await api.get(`/calles/${id}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Crear nueva calle
 */
export async function createCalle(data) {
  const res = await api.post("/calles", data);
  return res?.data;
}

/**
 * Actualizar calle
 */
export async function updateCalle(id, data) {
  const res = await api.put(`/calles/${id}`, data);
  return res?.data;
}

/**
 * Eliminar calle (soft delete)
 */
export async function deleteCalle(id) {
  const res = await api.delete(`/calles/${id}`);
  return res?.data;
}

/**
 * Listar calles activas (para selects/combos)
 */
export async function listCallesActivas() {
  const res = await api.get("/calles/activas");
  return res?.data?.data || res?.data || [];
}

/**
 * Autocomplete de calles
 */
export async function autocompleteCalles(query, limit = 20) {
  const res = await api.get(`/calles/autocomplete?q=${query}&limit=${limit}`);
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener calles por urbanización
 */
export async function getCallesByUrbanizacion(nombre) {
  const res = await api.get(
    `/calles/urbanizacion/${encodeURIComponent(nombre)}`
  );
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener cuadrantes de una calle
 */
export async function getCuadrantesByCalle(calleId) {
  const res = await api.get(`/calles/${calleId}/cuadrantes`);
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener direcciones de una calle
 */
export async function getDireccionesByCalle(calleId) {
  const res = await api.get(`/calles/${calleId}/direcciones`);
  return res?.data?.data || res?.data || [];
}

/**
 * Listar tipos de vía
 */
export async function listTiposVia() {
  const res = await api.get("/tipos-via/activos");
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener lista única de urbanizaciones
 * @returns {Promise<Array<string>>} Array de urbanizaciones únicas
 */
export async function getUrbanizaciones() {
  const res = await api.get("/calles/urbanizaciones");
  return res?.data?.data || res?.data || [];
}
