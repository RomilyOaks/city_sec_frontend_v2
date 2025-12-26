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
  limit = 20,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  params.append("estado", "1"); // Solo sectores activos
  if (search) params.append("search", search);

  const url = `/sectores?${params.toString()}`;

  console.log("🔍 [SECTORES DEBUG] Parámetros de búsqueda:", { page, limit, search });
  console.log("🔍 [SECTORES DEBUG] search value:", search);
  console.log("🔍 [SECTORES DEBUG] search type:", typeof search);
  console.log("🌐 [SECTORES DEBUG] URL completa:", url);

  const res = await api.get(url);

  console.log("📨 [SERVICE DEBUG] Respuesta completa del servidor:", res);
  console.log("📨 [SERVICE DEBUG] res.data:", res.data);
  console.log("📨 [SERVICE DEBUG] res.data.data:", res?.data?.data);
  console.log("📨 [SERVICE DEBUG] res.status:", res.status);

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

  console.log("📤 [SERVICE DEBUG] Resultado final que se retorna:", finalResult);

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
  console.log("📝 [CREATE DEBUG] Datos enviados para crear sector:", data);
  const res = await api.post("/sectores", data);
  console.log("✅ [CREATE DEBUG] Respuesta del servidor:", res);
  return res?.data?.data || res?.data;
}

/**
 * Actualizar sector existente
 */
export async function updateSector(id, data) {
  console.log("🔄 [UPDATE DEBUG] ID del sector:", id);
  console.log("🔄 [UPDATE DEBUG] Datos enviados:", data);
  const res = await api.put(`/sectores/${id}`, data);
  console.log("✅ [UPDATE DEBUG] Respuesta del servidor:", res);
  return res?.data?.data || res?.data;
}

/**
 * Eliminar sector (soft delete)
 */
export async function deleteSector(id, deleted_by) {
  console.log("🗑️ [DELETE DEBUG] ID del sector:", id);
  console.log("🗑️ [DELETE DEBUG] deleted_by:", deleted_by);

  const res = await api.delete(`/sectores/${id}`, {
    data: { deleted_by }
  });

  console.log("✅ [DELETE DEBUG] Respuesta del servidor:", res);
  return res?.data?.data || res?.data;
}
