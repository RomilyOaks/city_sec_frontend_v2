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
  sort,
  order,
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
  if (sort) params.append("sort", sort);
  if (order) params.append("order", order);

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
 * @param {Object} data - Datos de la novedad a crear
 * @returns {Promise<Object>} Respuesta exitosa del servidor
 * @throws {Error} Con detalles completos del error del backend
 */
export async function createNovedad(data) {
  try {
    const res = await api.post("/novedades", data);
    return res?.data;
  } catch (error) {
    // 🔥 IMPORTANTE: Manejo específico para errores de validación (Status 400)
    if (error.response?.status === 400 && error.response?.data?.errors) {
      // Extraer errores específicos del backend
      const validationErrors = error.response.data.errors;
      
      // Crear error personalizado con estructura para el frontend
      const customError = new Error(error.response.data.message || 'Errores de validación');
      customError.validationErrors = validationErrors;
      customError.status = error.response.status;
      customError.isValidationError = true;
      customError.response = error.response; // Mantener referencia completa
      
      throw customError;
    }
    
    // Si el error tiene respuesta del servidor (otros status)
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Datos del error (backend):", error.response.data);
      console.error("Headers:", error.response.headers);

      const errorMessage =
        error.response.data?.message ||
        error.response.data?.error ||
        "Error desconocido del servidor";

      throw new Error(errorMessage, {
        cause: {
          status: error.response.status,
          data: error.response.data,
        },
      });
    }
    // Si el error es por red (no llegó al servidor)
    else if (error.request) {
      console.error("No se recibió respuesta del servidor:", error.request);
      throw new Error(
        "No se pudo conectar con el servidor. Verifique su conexión."
      );
    }
    // Error de configuración o algo inesperado
    else {
      console.error("Error inesperado:", error.message);
      throw new Error("Error inesperado al crear la novedad.");
    }
  }
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
      const exact = searchRes.find((u) => u.ubigeo_code === code);
      if (exact) {
        return exact;
      }
      return searchRes[0];
    }

    return null;
  } catch (err) {
    console.error("❌ Error al obtener Ubigeo Code:", err);
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
export const getHistorialEstados = async (novedadId) => {
  try {
    const response = await api.get(`/novedades/${novedadId}/historial`);
    // Asegurar que siempre retorne un array
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // Si response.data tiene una propiedad data que es un array, usar esa
    if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    // Si no es array, retornar array vacío
    return [];
  } catch (error) {
    console.error("Error obteniendo historial de estados:", error);
    // En caso de error, retornar array vacío para evitar que se caiga el componente
    return [];
  }
};

/**
 * Agregar entrada al historial de estados de una novedad.
 * Endpoint: POST /novedades/:novedadId/historial
 *
 * @param {number} novedadId - ID de la novedad principal
 * @param {string} observaciones - Observaciones/acciones tomadas
 * @param {number|null} [estadoNuevoId] - ID del nuevo estado (opcional, si no se envía mantiene el actual)
 * @returns {Promise<Object>} - Resultado de la operación
 */
export async function crearHistorialNovedad(novedadId, observaciones, estadoNuevoId = null) {
  const payload = {
    observaciones: observaciones,
  };

  // Solo incluir estado_nuevo_id si se quiere cambiar el estado
  if (estadoNuevoId) {
    payload.estado_nuevo_id = estadoNuevoId;
  }

  try {
    const res = await api.post(`/novedades/${novedadId}/historial`, payload);
    return res?.data;
  } catch (error) {
    console.error("Error en crearHistorialNovedad:", error);
    throw error;
  }
}

/**
 * Obtener estados siguientes válidos para una novedad.
 * Endpoint: GET /estados-novedad/siguientes/:estadoActualId
 * Solo retorna estados con orden >= al estado actual.
 *
 * @param {number} estadoActualId - ID del estado actual de la novedad
 * @returns {Promise<Object>} - { data: [...estados], estadoActual: {...} }
 */
export async function getEstadosSiguientes(estadoActualId) {
  try {
    const res = await api.get(`/estados-novedad/siguientes/${estadoActualId}`);
    return {
      estados: res?.data?.data || [],
      estadoActual: res?.data?.estadoActual || null,
    };
  } catch (error) {
    console.error("Error obteniendo estados siguientes:", error);
    // Si falla, retornar array vacío para no bloquear la UI
    return { estados: [], estadoActual: null };
  }
}

export const listRadiosTetra = async () => {
  try {
    const response = await api.get("/radios-tetra/disponibles");
    // La respuesta viene como: { success: true, data: { radios: [...], total: N } }
    return response.data?.data?.radios || [];
  } catch (error) {
    console.error("Error obteniendo radios TETRA:", error);
    throw error;
  }
};

/**
 * Obtener estadísticas para dashboard
 */
export async function getDashboardStats() {
  const res = await api.get("/novedades/dashboard/stats");
  return res?.data?.data || res?.data || {};
}

/**
 * Obtener novedades en atención (estados 2-5: Despachada, En Ruta, En Lugar, En Atención)
 */
export async function getNovedadesEnAtencion() {
  const res = await api.get("/novedades/dashboard/en-atencion");
  return res?.data?.data || res?.data || {};
}
