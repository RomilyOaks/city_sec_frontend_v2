/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\services\\novedadesService.js
 * @version 2.0.0
 * @description Servicio central para operaciones sobre novedades (incidentes): listados, creación, actualización, asignación de recursos y catálogos relacionados.
 * Normaliza respuestas y encapsula parámetros de consulta.
 * @module src/services/novedadesService.js
 */

import api from "./api";

/**
 * listNovedades
 * Consulta paginada de novedades con filtros de fecha, tipo, estado y prioridad.
 * @param {Object} [options]
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.estado_novedad_id]
 * @param {string} [options.tipo_novedad_id]
 * @param {string} [options.prioridad_actual]
 * @param {string} [options.sector_id]
 * @param {string} [options.fecha_inicio]
 * @param {string} [options.fecha_fin]
 * @param {string} [options.search]
 * @returns {Promise<{novedades:Array,pagination:Object|null}>}
 */
export async function listNovedades({
  page = 1,
  limit = 20,
  estado_novedad_id,
  tipo_novedad_id,
  prioridad_actual,
  sector_id,
  fecha_inicio,
  fecha_fin,
  search,
} = {}) {
  const params = new URLSearchParams();
  params.append("page", page);
  params.append("limit", limit);
  if (estado_novedad_id) params.append("estado_novedad_id", estado_novedad_id);
  if (tipo_novedad_id) params.append("tipo_novedad_id", tipo_novedad_id);
  if (prioridad_actual) params.append("prioridad_actual", prioridad_actual);
  if (sector_id) params.append("sector_id", sector_id);
  if (fecha_inicio) params.append("fecha_inicio", fecha_inicio);
  if (fecha_fin) params.append("fecha_fin", fecha_fin);
  if (search) params.append("search", search);

  const res = await api.get(`/novedades?${params.toString()}`);
  const payload = res?.data || {};
  return {
    novedades: payload.data || [],
    pagination: payload.pagination || null,
  };
}

/**
 * Obtener novedad por ID
 */
export async function getNovedadById(id) {
  const res = await api.get(`/novedades/${id}`);
  return res?.data?.data || res?.data || null;
}

/**
 * Crear nueva novedad
 */
export async function createNovedad(data) {
  const res = await api.post("/novedades", data);
  return res?.data;
}

/**
 * Actualizar novedad
 */
export async function updateNovedad(id, data) {
  const res = await api.put(`/novedades/${id}`, data);
  return res?.data;
}

/**
 * Eliminar novedad (soft delete)
 */
export async function deleteNovedad(id) {
  const res = await api.delete(`/novedades/${id}`);
  return res?.data;
}

/**
 * Cambiar estado de novedad
 */
export async function cambiarEstadoNovedad(id, estado_id, observaciones) {
  const res = await api.patch(`/novedades/${id}/estado`, {
    estado_id,
    observaciones,
  });
  return res?.data;
}

/**
 * Obtener estadísticas de novedades
 */
export async function getEstadisticasNovedades() {
  const res = await api.get("/novedades/dashboard/stats");
  return res?.data?.data || res?.data || {};
}

/**
 * Listar tipos de novedad
 */
export async function listTiposNovedad() {
  const res = await api.get("/tipos-novedad");
  return res?.data?.data || res?.data || [];
}

/**
 * Listar estados de novedad
 */
export async function listEstadosNovedad() {
  const res = await api.get("/estados-novedad");
  return res?.data?.data || res?.data || [];
}

/**
 * Listar subtipos de novedad
 */
export async function listSubtiposNovedad(tipoId) {
  const url = tipoId
    ? `/subtipos-novedad?tipo_novedad_id=${tipoId}`
    : "/subtipos-novedad";
  const res = await api.get(url);
  return res?.data?.data || res?.data || [];
}

/**
 * Listar sectores
 */
export async function listSectores() {
  const res = await api.get("/sectores");
  return res?.data?.data || res?.data || [];
}

/**
 * Listar ubigeos (distritos) - usa endpoint existente /catalogos/ubigeo
 */
export async function listUbigeos(search = "") {
  const url = search
    ? `/catalogos/ubigeo?search=${search}&limit=50`
    : "/catalogos/ubigeo?limit=50";
  const res = await api.get(url);
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener ubigeo por código exacto
 */
export async function getUbigeoByCode(code) {
  try {
    // Intentar obtener por código exacto usando el parámetro ubigeo_code
    const url = `/catalogos/ubigeo?ubigeo_code=${code}`;
    const res = await api.get(url);
    const data = res?.data?.data || res?.data || [];

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    // Si no funcionó con ubigeo_code, intentar buscar por search
    const searchRes = await listUbigeos(code);
    if (searchRes && searchRes.length > 0) {
      // Buscar el que coincida exactamente con el código
      const exact = searchRes.find(u => u.ubigeo_code === code);
      if (exact) {
        return exact;
      }
      return searchRes[0];
    }

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Listar cuadrantes por sector
 */
export async function listCuadrantes(sectorId) {
  const url = sectorId
    ? `/cuadrantes?sector_id=${sectorId}&limit=100`
    : "/cuadrantes?limit=100";
  const res = await api.get(url);
  // Backend responde: { success: true, data: { cuadrantes: [...], pagination: {...} } }
  return (
    res?.data?.data?.cuadrantes ||
    res?.data?.cuadrantes ||
    res?.data?.data ||
    res?.data ||
    []
  );
}

/**
 * Listar unidades/oficinas - usa endpoint /catalogos/unidades
 */
export async function listUnidadesOficina() {
  const res = await api.get("/catalogos/unidades");
  const unidades =
    res?.data?.data?.unidades ||
    res?.data?.unidades ||
    res?.data?.data ||
    res?.data ||
    [];
  return Array.isArray(unidades) ? unidades : [];
}

/**
 * Listar vehículos disponibles
 */
export async function listVehiculos() {
  const res = await api.get("/vehiculos?limit=100");
  // Backend responde: { vehiculos: [...], pagination: {...} }
  return res?.data?.vehiculos || res?.data?.data || res?.data || [];
}

/**
 * Listar personal de seguridad (sin parámetros obligatorios)
 */
export async function listPersonalSeguridad() {
  const res = await api.get("/personal/disponibles");
  // Backend responde: { personal: [...] }
  return res?.data?.personal || res?.data?.data || res?.data || [];
}

/**
 * Asignar recursos a una novedad
 */
export async function asignarRecursos(novedadId, data) {
  const res = await api.post(`/novedades/${novedadId}/asignar`, data);
  return res?.data;
}

/**
 * Obtener historial de estados de una novedad
 */
export async function getHistorialEstados(novedadId) {
  const res = await api.get(`/novedades/${novedadId}/historial`);
  return res?.data?.data || res?.data || [];
}

/**
 * Obtener estadísticas para dashboard
 */
export async function getDashboardStats() {
  const res = await api.get("/novedades/dashboard/stats");
  return res?.data?.data || res?.data || {};
}
