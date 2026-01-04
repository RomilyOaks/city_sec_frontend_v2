/**
 * File: src/services/callesCuadrantesService.js
 * @version 1.0.0
 * @description Servicio para gestión de relaciones calles-cuadrantes
 */

import api from "./api";

/**
 * Listar calles-cuadrantes con filtros y paginación
 */
export async function listCallesCuadrantes({
  page = 1,
  limit = 20,
  search,
  calle_id,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  // NO filtrar por estado aquí - el backend debe manejarlo
  if (search) params.append("search", search);
  if (calle_id) params.append("calle_id", calle_id);

  // Cache buster para evitar respuestas cacheadas
  params.append("_t", Date.now());

  const url = `/calles-cuadrantes?${params.toString()}`;

  const res = await api.get(url);

  // El backend puede devolver varios formatos:
  // Formato 1: { success: true, data: Array }
  // Formato 2: { success: true, data: { items: Array, pagination: Object } }
  const rawData = res?.data?.data || res?.data;

  let finalResult;

  // Si rawData es un array directamente
  if (Array.isArray(rawData)) {
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
 * Obtener relación calle-cuadrante por ID
 */
export async function getCalleCuadranteById(id) {
  const res = await api.get(`/calles-cuadrantes/${id}`);
  return res?.data?.data || res?.data;
}

/**
 * Obtener cuadrantes de una calle específica
 */
export async function getCuadrantesPorCalle(calleId) {
  const res = await api.get(`/calles-cuadrantes/calle/${calleId}`);
  return res?.data?.data || res?.data;
}

/**
 * Crear nueva relación calle-cuadrante
 */
export async function createCalleCuadrante(data) {
  const res = await api.post("/calles-cuadrantes", data);
  return res?.data?.data || res?.data;
}

/**
 * Actualizar relación calle-cuadrante existente
 */
export async function updateCalleCuadrante(id, data) {
  const res = await api.put(`/calles-cuadrantes/${id}`, data);
  return res?.data?.data || res?.data;
}

/**
 * Eliminar relación calle-cuadrante (soft delete)
 */
export async function deleteCalleCuadrante(id, deleted_by) {
  const res = await api.delete(`/calles-cuadrantes/${id}`, {
    data: { deleted_by }
  });

  return res?.data?.data || res?.data;
}
