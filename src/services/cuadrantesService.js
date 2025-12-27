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
  // NO filtrar por estado aquí - el backend debe manejarlo
  if (search) params.append("search", search);
  if (sector_id) params.append("sector_id", sector_id);

  // Cache buster para evitar respuestas cacheadas
  params.append("_t", Date.now());

  const url = `/cuadrantes?${params.toString()}`;

  const res = await api.get(url);

  // El backend puede devolver varios formatos:
  // Formato 1: { success: true, data: Array }
  // Formato 2: { success: true, data: { cuadrantes: Array, pagination: Object } }
  const rawData = res?.data?.data || res?.data;

  let finalResult;

  // Si rawData tiene la propiedad 'cuadrantes', usar ese formato
  if (rawData && rawData.cuadrantes && Array.isArray(rawData.cuadrantes)) {
    finalResult = {
      items: rawData.cuadrantes,
      pagination: rawData.pagination || {
        current_page: page,
        total_items: rawData.cuadrantes.length,
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
export async function deleteCuadrante(id, deleted_by) {
  const res = await api.delete(`/cuadrantes/${id}`, {
    data: { deleted_by }
  });

  return res?.data?.data || res?.data;
}
