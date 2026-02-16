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
  subsector_id,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  // NO filtrar por estado aquí - el backend debe manejarlo
  if (search) params.append("search", search);
  if (sector_id) params.append("sector_id", sector_id);
  if (subsector_id) params.append("subsector_id", subsector_id);

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
 * Obtener cuadrantes por subsector_id
 */
export async function listCuadrantesBySubsector(subsectorId, { page = 1, limit = 100, search } = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (search) params.append("search", search);

  // Cache buster para evitar respuestas cacheadas
  params.append("_t", Date.now());

  const url = `/cuadrantes/subsector/${subsectorId}?${params.toString()}`;

  const res = await api.get(url);

  const rawData = res?.data?.data || res?.data;

  let finalResult;

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
  // Preparar el payload asegurando tipos correctos
  const payload = {
    cuadrante_code: data.cuadrante_code,
    nombre: data.nombre,
    sector_id: Number(data.sector_id),
    subsector_id: Number(data.subsector_id),
    referencia: data.referencia || null,
    zona_code: data.zona_code || null,
    latitud: data.latitud ? Number(data.latitud) : null,
    longitud: data.longitud ? Number(data.longitud) : null,
    radio_metros: data.radio_metros ? Number(data.radio_metros) : null,
    color_mapa: data.color_mapa || "#108981",
  };

  // Parsear poligono_json si es string
  if (data.poligono_json) {
    try {
      payload.poligono_json = typeof data.poligono_json === "string"
        ? JSON.parse(data.poligono_json)
        : data.poligono_json;
    } catch {
      // poligono_json no es JSON válido
      payload.poligono_json = null;
    }
  } else {
    payload.poligono_json = null;
  }

  const res = await api.post("/cuadrantes", payload);
  return res?.data?.data || res?.data;
}

/**
 * Actualizar cuadrante existente
 */
export async function updateCuadrante(id, data) {
  // Preparar el payload asegurando tipos correctos
  const payload = {
    cuadrante_code: data.cuadrante_code,
    nombre: data.nombre,
    sector_id: Number(data.sector_id),
    subsector_id: Number(data.subsector_id),
    referencia: data.referencia || null,
    zona_code: data.zona_code || null,
    latitud: data.latitud ? Number(data.latitud) : null,
    longitud: data.longitud ? Number(data.longitud) : null,
    radio_metros: data.radio_metros ? Number(data.radio_metros) : null,
    color_mapa: data.color_mapa || "#108981",
  };

  // Parsear poligono_json si es string
  if (data.poligono_json) {
    try {
      payload.poligono_json = typeof data.poligono_json === "string"
        ? JSON.parse(data.poligono_json)
        : data.poligono_json;
    } catch {
      // poligono_json no es JSON válido
      payload.poligono_json = null;
    }
  } else {
    payload.poligono_json = null;
  }

  const res = await api.put(`/cuadrantes/${id}`, payload);

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
