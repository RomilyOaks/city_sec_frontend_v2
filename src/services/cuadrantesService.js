/**
 * File: src/services/cuadrantesService.js
 * @version 1.0.0
 * @description Servicio para gestión de cuadrantes
 */

import api from "./api";

/**
 * Listar cuadrantes con filtros y paginación
 */
export async function listCuadrantes({
  page = 1,
  limit = 20,
  search,
  sector_id,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  params.append("estado", "1"); // Solo cuadrantes activos
  if (search) params.append("search", search);
  if (sector_id) params.append("sector_id", sector_id);

  const res = await api.get(`/cuadrantes?${params.toString()}`);
  return res?.data?.data || res?.data || { items: [], pagination: null };
}

/**
 * Obtener cuadrante por ID
 */
export async function getCuadranteById(id) {
  const res = await api.get(`/cuadrantes/${id}`);
  return res?.data?.data || res?.data;
}

/**
 * Crear nuevo cuadrante
 */
export async function createCuadrante(data) {
  const res = await api.post("/cuadrantes", data);
  return res?.data?.data || res?.data;
}

/**
 * Actualizar cuadrante existente
 */
export async function updateCuadrante(id, data) {
  const res = await api.put(`/cuadrantes/${id}`, data);
  return res?.data?.data || res?.data;
}

/**
 * Eliminar cuadrante (soft delete)
 */
export async function deleteCuadrante(id) {
  const res = await api.delete(`/cuadrantes/${id}`);
  return res?.data?.data || res?.data;
}
