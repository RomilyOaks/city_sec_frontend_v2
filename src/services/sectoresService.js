/**
 * File: src/services/sectoresService.js
 * @version 1.0.0
 * @description Servicio para gestión de sectores
 */

import api from "../api/axiosConfig";

/**
 * Listar sectores con filtros y paginación
 */
export async function listSectores({
  page = 1,
  limit = 20,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  params.append("estado", "1"); // Solo sectores activos
  if (search) params.append("search", search);

  const res = await api.get(`/sectores?${params.toString()}`);
  return res?.data?.data || res?.data || { items: [], pagination: null };
}

/**
 * Obtener sector por ID
 */
export async function getSectorById(id) {
  const res = await api.get(`/sectores/${id}`);
  return res?.data?.data || res?.data;
}

/**
 * Crear nuevo sector
 */
export async function createSector(data) {
  const res = await api.post("/sectores", data);
  return res?.data?.data || res?.data;
}

/**
 * Actualizar sector existente
 */
export async function updateSector(id, data) {
  const res = await api.put(`/sectores/${id}`, data);
  return res?.data?.data || res?.data;
}

/**
 * Eliminar sector (soft delete)
 */
export async function deleteSector(id) {
  const res = await api.delete(`/sectores/${id}`);
  return res?.data?.data || res?.data;
}
