/**
 * File: src/services/operativosPersonalService.js
 * @version 2.2.2
 * @description Servicio para gestionar personal asignado a operativos de patrullaje a pie.
 * Interactúa con los endpoints /api/v1/operativos/:turnoId/personal
 *
 * Jerarquía:
 * OperativosTurno → OperativosPersonal → Cuadrantes → Novedades
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-18
 * @module src/services/operativosPersonalService.js
 */

import api from "./api.js";

// ============================================================================
// CONSTANTES - Valores ENUM del backend
// ============================================================================

/**
 * Tipos de patrullaje disponibles
 * @constant {Array<Object>}
 */
export const TIPOS_PATRULLAJE = [
  { value: "SERENAZGO", label: "Serenazgo", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "PPFF", label: "Policía (PPFF)", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  { value: "GUARDIA", label: "Guardia", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  { value: "VIGILANTE", label: "Vigilante", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "OTRO", label: "Otro", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" },
];

/**
 * Items de equipamiento que puede portar el personal
 * @constant {Array<Object>}
 */
export const EQUIPAMIENTO_ITEMS = [
  { key: "chaleco_balistico", label: "Chaleco Balístico", icon: "🦺" },
  { key: "porra_policial", label: "Porra Policial", icon: "🏏" },
  { key: "esposas", label: "Esposas", icon: "⛓️" },
  { key: "linterna", label: "Linterna", icon: "🔦" },
  { key: "kit_primeros_auxilios", label: "Kit Primeros Auxilios", icon: "🩹" },
];

// ============================================================================
// FUNCIONES CRUD - Personal Operativo
// ============================================================================

/**
 * Listar todo el personal operativo con filtros y paginación (vista global)
 * GET /api/v1/operativos-personal
 *
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} [params.page=1] - Número de página
 * @param {number} [params.limit=20] - Registros por página
 * @param {string} [params.search] - Búsqueda por nombre del personal
 * @param {number} [params.turno_id] - Filtrar por turno operativo
 * @param {string} [params.tipo_patrullaje] - Filtrar por tipo: SERENAZGO, PPFF, GUARDIA, VIGILANTE, OTRO
 * @param {number} [params.estado_operativo_id] - Filtrar por estado operativo
 * @param {string} [params.fecha_inicio] - Fecha inicio ISO 8601
 * @param {string} [params.fecha_fin] - Fecha fin ISO 8601
 * @param {string} [params.sort] - Campo para ordenar (default: hora_inicio)
 * @param {string} [params.order] - ASC o DESC (default: DESC)
 * @returns {Promise<Object>} - { success, data, pagination }
 */
export async function listOperativosPersonal(params = {}) {
  const response = await api.get("/operativos-personal", { params });
  return response.data;
}

/**
 * Listar personal asignado a un turno específico
 * GET /api/v1/operativos/:turnoId/personal
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {Object} [params] - Parámetros adicionales
 * @returns {Promise<Object>} - { success, data: Array<PersonalOperativo> }
 */
export async function listPersonalByTurno(turnoId, params = {}) {
  // Solicitar que incluya las relaciones (personal, sereno, estado_operativo, radio_tetra)
  const queryParams = {
    include_relations: true,
    ...params
  };
  const response = await api.get(`/operativos/${turnoId}/personal`, { params: queryParams });
  return response.data;
}

/**
 * Obtener detalle de un personal asignado por ID
 * GET /api/v1/operativos/:turnoId/personal/:id
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} id - ID del registro en operativos_personal (NO es personal_id)
 * @returns {Promise<Object>} - { success, data: PersonalOperativo }
 */
export async function getPersonalOperativo(turnoId, id) {
  const response = await api.get(`/operativos/${turnoId}/personal/${id}`);
  return response.data;
}

/**
 * Asignar personal a un turno operativo
 * POST /api/v1/operativos/:turnoId/personal
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {Object} payload - Datos del personal a asignar
 * @param {number} payload.personal_id - ID del personal de seguridad (requerido)
 * @param {string} payload.hora_inicio - Fecha/hora inicio ISO 8601 (requerido)
 * @param {number} payload.estado_operativo_id - ID del estado operativo (requerido)
 * @param {string} [payload.tipo_patrullaje='SERENAZGO'] - Tipo de patrullaje
 * @param {number} [payload.sereno_id] - ID del compañero de patrullaje (debe ser diferente a personal_id)
 * @param {number} [payload.radio_tetra_id] - ID del radio TETRA asignado
 * @param {boolean} [payload.chaleco_balistico=false] - ¿Porta chaleco balístico?
 * @param {boolean} [payload.porra_policial=false] - ¿Porta porra policial?
 * @param {boolean} [payload.esposas=false] - ¿Porta esposas?
 * @param {boolean} [payload.linterna=false] - ¿Porta linterna?
 * @param {boolean} [payload.kit_primeros_auxilios=false] - ¿Porta kit de primeros auxilios?
 * @param {string} [payload.observaciones] - Observaciones (máx 500 caracteres)
 * @returns {Promise<Object>} - { success, message, data }
 */
export async function createPersonalOperativo(turnoId, payload) {
  const response = await api.post(`/operativos/${turnoId}/personal`, payload);
  return response.data;
}

/**
 * Actualizar asignación de personal (editar datos o registrar cierre)
 * PUT /api/v1/operativos/:turnoId/personal/:id
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} id - ID del registro en operativos_personal
 * @param {Object} payload - Datos a actualizar (todos opcionales)
 * @param {string} [payload.hora_fin] - Hora de fin del turno ISO 8601
 * @param {string} [payload.tipo_patrullaje] - Tipo de patrullaje
 * @param {number} [payload.sereno_id] - Compañero de patrullaje
 * @param {number} [payload.radio_tetra_id] - Radio TETRA
 * @param {number} [payload.estado_operativo_id] - Estado operativo
 * @param {boolean} [payload.chaleco_balistico] - Equipamiento
 * @param {boolean} [payload.porra_policial] - Equipamiento
 * @param {boolean} [payload.esposas] - Equipamiento
 * @param {boolean} [payload.linterna] - Equipamiento
 * @param {boolean} [payload.kit_primeros_auxilios] - Equipamiento
 * @param {string} [payload.observaciones] - Observaciones
 * @returns {Promise<Object>} - { success, message, data }
 */
export async function updatePersonalOperativo(turnoId, id, payload) {
  const response = await api.put(`/operativos/${turnoId}/personal/${id}`, payload);
  return response.data;
}

/**
 * Eliminar asignación de personal (soft delete)
 * DELETE /api/v1/operativos/:turnoId/personal/:id
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} id - ID del registro en operativos_personal
 * @returns {Promise<Object>} - { success, message }
 */
export async function deletePersonalOperativo(turnoId, id) {
  const response = await api.delete(`/operativos/${turnoId}/personal/${id}`);
  return response.data;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Obtener configuración de color para un tipo de patrullaje
 * @param {string} tipo - Tipo de patrullaje (SERENAZGO, PPFF, etc.)
 * @returns {Object} - { value, label, color }
 */
export function getTipoPatrullajeConfig(tipo) {
  return TIPOS_PATRULLAJE.find(t => t.value === tipo) || TIPOS_PATRULLAJE[4]; // Default: OTRO
}

/**
 * Formatear nombre completo del personal
 * @param {Object} persona - Objeto con datos del personal
 * @returns {string} - Nombre formateado "NOMBRES APELLIDO_PATERNO APELLIDO_MATERNO"
 */
export function formatPersonalNombre(persona) {
  if (!persona) return "—";
  const partes = [
    persona.nombres,
    persona.apellido_paterno,
    persona.apellido_materno
  ].filter(Boolean);
  return partes.join(" ") || "—";
}

/**
 * Contar equipamiento que porta el personal
 * @param {Object} personal - Registro de personal operativo
 * @returns {number} - Cantidad de items de equipamiento
 */
export function contarEquipamiento(personal) {
  if (!personal) return 0;
  return EQUIPAMIENTO_ITEMS.filter(item => personal[item.key] === true).length;
}

/**
 * Obtener lista de equipamiento que porta el personal
 * @param {Object} personal - Registro de personal operativo
 * @returns {Array<Object>} - Lista de items de equipamiento con sus datos
 */
export function getEquipamientoPortado(personal) {
  if (!personal) return [];
  return EQUIPAMIENTO_ITEMS.filter(item => personal[item.key] === true);
}

// ============================================================================
// CONSTANTES - Cuadrantes y Novedades
// ============================================================================

/**
 * Prioridades de novedades
 * @constant {Array<Object>}
 */
export const PRIORIDADES_NOVEDAD = [
  { value: "BAJA", label: "Baja", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" },
  { value: "MEDIA", label: "Media", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "ALTA", label: "Alta", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "URGENTE", label: "Urgente", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
];

/**
 * Resultados de atención de novedades
 * @constant {Array<Object>}
 */
export const RESULTADOS_NOVEDAD = [
  { value: "PENDIENTE", label: "Pendiente", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  { value: "RESUELTO", label: "Resuelto", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  { value: "ESCALADO", label: "Escalado", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  { value: "CANCELADO", label: "Cancelado", color: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300" },
];

// ============================================================================
// FUNCIONES CRUD - Cuadrantes del Personal
// ============================================================================

/**
 * Listar cuadrantes asignados a un personal operativo
 * GET /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @returns {Promise<Object>} - { success, data: Array<CuadrantePersonal> }
 */
export async function listCuadrantesByPersonal(turnoId, personalId) {
  const response = await api.get(`/operativos/${turnoId}/personal/${personalId}/cuadrantes`);
  return response.data;
}

/**
 * Asignar cuadrante a personal operativo
 * POST /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {Object} payload - Datos del cuadrante
 * @param {number} payload.cuadrante_id - ID del cuadrante (requerido)
 * @param {string} payload.hora_ingreso - Hora de ingreso ISO 8601 (requerido)
 * @param {string} [payload.observaciones] - Observaciones
 * @returns {Promise<Object>} - { success, message, data }
 */
export async function createCuadrantePersonal(turnoId, personalId, payload) {
  const response = await api.post(`/operativos/${turnoId}/personal/${personalId}/cuadrantes`, payload);
  return response.data;
}

/**
 * Actualizar cuadrante de personal (registrar salida)
 * PUT /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @param {Object} payload - Datos a actualizar
 * @param {string} [payload.hora_salida] - Hora de salida ISO 8601
 * @param {string} [payload.observaciones] - Observaciones
 * @param {string} [payload.incidentes_reportados] - Incidentes reportados
 * @returns {Promise<Object>} - { success, message, data }
 */
export async function updateCuadrantePersonal(turnoId, personalId, cuadranteId, payload) {
  const response = await api.put(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}`, payload);
  return response.data;
}

/**
 * Eliminar asignación de cuadrante
 * DELETE /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @returns {Promise<Object>} - { success, message }
 */
export async function deleteCuadrantePersonal(turnoId, personalId, cuadranteId) {
  const response = await api.delete(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}`);
  return response.data;
}

// ============================================================================
// FUNCIONES CRUD - Novedades del Personal
// ============================================================================

/**
 * Obtener novedades disponibles para un cuadrante (del sistema general)
 * GET /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId/novedades/disponibles
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @returns {Promise<Object>} - { status, data, cuadranteInfo, summary }
 */
export async function getNovedadesDisponibles(turnoId, personalId, cuadranteId) {
  const response = await api.get(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}/novedades/disponibles`);
  return response.data;
}

/**
 * Listar novedades atendidas en un cuadrante
 * GET /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId/novedades
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @returns {Promise<Object>} - { status, data, cuadranteInfo, summary }
 */
export async function listNovedadesByCuadrante(turnoId, personalId, cuadranteId) {
  const response = await api.get(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}/novedades`);
  return response.data;
}

/**
 * Registrar novedad atendida en cuadrante
 * POST /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId/novedades
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @param {Object} payload - Datos de la novedad
 * @param {number} payload.novedad_id - ID de la novedad del sistema (requerido)
 * @param {string} [payload.reportado] - Fecha/hora del reporte ISO 8601 (default: ahora)
 * @param {string} [payload.prioridad='MEDIA'] - Prioridad: BAJA, MEDIA, ALTA, URGENTE
 * @param {string} [payload.resultado='PENDIENTE'] - Estado: PENDIENTE, RESUELTO, ESCALADO, CANCELADO
 * @param {string} [payload.observaciones] - Observaciones de la atención
 * @param {string} [payload.acciones_tomadas] - Acciones realizadas
 * @returns {Promise<Object>} - { status, message, data }
 */
export async function createNovedadPersonal(turnoId, personalId, cuadranteId, payload) {
  const response = await api.post(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}/novedades`, payload);
  return response.data;
}

/**
 * Actualizar novedad (resolver, escalar, etc.)
 * PUT /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId/novedades/:novedadId
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @param {number} novedadId - ID del registro en operativos_personal_novedades
 * @param {Object} payload - Datos a actualizar
 * @param {string} [payload.resultado] - Nuevo estado: PENDIENTE, RESUELTO, ESCALADO, CANCELADO
 * @param {string} [payload.acciones_tomadas] - Acciones realizadas
 * @param {string} [payload.observaciones] - Observaciones adicionales
 * @returns {Promise<Object>} - { status, message, data }
 */
export async function updateNovedadPersonal(turnoId, personalId, cuadranteId, novedadId, payload) {
  const response = await api.put(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}/novedades/${novedadId}`, payload);
  return response.data;
}

/**
 * Eliminar novedad del cuadrante
 * DELETE /api/v1/operativos/:turnoId/personal/:personalId/cuadrantes/:cuadranteId/novedades/:novedadId
 *
 * @param {number} turnoId - ID del turno operativo
 * @param {number} personalId - ID del registro en operativos_personal
 * @param {number} cuadranteId - ID del registro en operativos_personal_cuadrantes
 * @param {number} novedadId - ID del registro en operativos_personal_novedades
 * @returns {Promise<Object>} - { status, message }
 */
export async function deleteNovedadPersonal(turnoId, personalId, cuadranteId, novedadId) {
  const response = await api.delete(`/operativos/${turnoId}/personal/${personalId}/cuadrantes/${cuadranteId}/novedades/${novedadId}`);
  return response.data;
}

// ============================================================================
// FUNCIONES AUXILIARES - Cuadrantes y Novedades
// ============================================================================

/**
 * Obtener configuración de color para una prioridad
 * @param {string} prioridad - Prioridad: BAJA, MEDIA, ALTA, URGENTE
 * @returns {Object} - { value, label, color }
 */
export function getPrioridadConfig(prioridad) {
  return PRIORIDADES_NOVEDAD.find(p => p.value === prioridad) || PRIORIDADES_NOVEDAD[1]; // Default: MEDIA
}

/**
 * Obtener configuración de color para un resultado
 * @param {string} resultado - Resultado: PENDIENTE, RESUELTO, ESCALADO, CANCELADO
 * @returns {Object} - { value, label, color }
 */
export function getResultadoConfig(resultado) {
  return RESULTADOS_NOVEDAD.find(r => r.value === resultado) || RESULTADOS_NOVEDAD[0]; // Default: PENDIENTE
}

/**
 * Formatear duración entre dos fechas
 * @param {string} inicio - Fecha/hora inicio ISO 8601
 * @param {string} [fin] - Fecha/hora fin ISO 8601 (null = en curso)
 * @returns {string} - Duración formateada "Xh Ym" o "En curso"
 */
export function formatDuracion(inicio, fin) {
  if (!inicio) return "—";
  if (!fin) return "En curso";

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  const diffMs = fechaFin - fechaInicio;

  if (diffMs < 0) return "—";

  const horas = Math.floor(diffMs / (1000 * 60 * 60));
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  }
  return `${minutos}m`;
}
