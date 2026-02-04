/**
 * File: src/services/subsectoresService.js
 * @version 1.0.0
 * @description Servicio para gestión de subsectores
 */

import api from "./api";

/**
 * Listar todos los subsectores con filtros y paginación
 */
export async function listSubsectores({
  page = 1,
  limit = 100,
  search,
  sector_id,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);
  if (sector_id) params.append("sector_id", sector_id);

  const url = `/subsectores?${params.toString()}`;
  const res = await api.get(url);

  const rawData = res?.data?.data || res?.data;

  let finalResult;

  if (rawData && rawData.subsectores && Array.isArray(rawData.subsectores)) {
    finalResult = {
      items: rawData.subsectores,
      pagination: rawData.pagination || {
        current_page: page,
        total_items: rawData.subsectores.length,
        total_pages: 1,
        items_per_page: limit
      }
    };
  } else if (Array.isArray(rawData)) {
    finalResult = {
      items: rawData,
      pagination: {
        current_page: page,
        total_items: rawData.length,
        total_pages: 1,
        items_per_page: limit
      }
    };
  } else {
    finalResult = rawData;
  }

  return finalResult;
}

/**
 * Obtener subsectores por sector_id
 */
export async function listSubsectoresBySector(sectorId, { page = 1, limit = 100, search } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);

  const url = `/subsectores/sector/${sectorId}?${params.toString()}`;
  const res = await api.get(url);

  const rawData = res?.data?.data || res?.data;

  let finalResult;

  if (rawData && rawData.subsectores && Array.isArray(rawData.subsectores)) {
    finalResult = {
      items: rawData.subsectores,
      pagination: rawData.pagination || {
        current_page: page,
        total_items: rawData.subsectores.length,
        total_pages: 1,
        items_per_page: limit
      }
    };
  } else if (Array.isArray(rawData)) {
    finalResult = {
      items: rawData,
      pagination: {
        current_page: page,
        total_items: rawData.length,
        total_pages: 1,
        items_per_page: limit
      }
    };
  } else {
    finalResult = rawData;
  }

  return finalResult;
}

/**
 * Obtener subsector por ID
 */
export async function getSubsectorById(id) {
  const res = await api.get(`/subsectores/${id}`);
  return res?.data?.data || res?.data;
}

/**
 * Crear nuevo subsector
 */
export async function createSubsector(data) {
  const res = await api.post("/subsectores", data);
  return res?.data?.data || res?.data;
}

/**
 * Actualizar subsector existente
 */
export async function updateSubsector(id, data) {
  const res = await api.put(`/subsectores/${id}`, data);
  return res?.data?.data || res?.data;
}

/**
 * Eliminar subsector (soft delete)
 */
export async function deleteSubsector(id, deleted_by) {
  const res = await api.delete(`/subsectores/${id}`, {
    data: { deleted_by }
  });
  return res?.data?.data || res?.data;
}
