/**
 * File: src/services/sectoresService.js
 * @version 1.0.0
 * @description Servicio para gestión de sectores
 */

import api from "./api";

/**
 * Listar sectores con filtros y paginación
 */
export async function listSectores({
  page = 1,
  limit = 100,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  // No enviamos el parámetro estado ya que el backend no lo acepta
  if (search) params.append("search", search);

  const url = `/sectores?${params.toString()}`;

  const res = await api.get(url);

  // El backend puede devolver varios formatos:
  // Formato 1: { success: true, data: Array }
  // Formato 2: { success: true, data: { sectores: Array, pagination: Object } }
  const rawData = res?.data?.data || res?.data;

  let finalResult;

  // Si rawData tiene la propiedad 'sectores', usar ese formato
  if (rawData && rawData.sectores && Array.isArray(rawData.sectores)) {
    finalResult = {
      items: rawData.sectores,
      pagination: rawData.pagination || {
        current_page: page,
        total_items: rawData.sectores.length,
        total_pages: 1,
        items_per_page: limit
      }
    };
  }
  // Si rawData es un array directamente
  else if (Array.isArray(rawData)) {
    finalResult = {
      items: rawData,
      pagination: {
        current_page: page,
        total_items: rawData.length,
        total_pages: 1,
        items_per_page: limit
      }
    };
  }
  // Si ya tiene el formato correcto con 'items'
  else {
    finalResult = rawData;
  }

  return finalResult;
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
export async function deleteSector(id, deleted_by) {
  const res = await api.delete(`/sectores/${id}`, {
    data: { deleted_by }
  });

  return res?.data?.data || res?.data;
}
