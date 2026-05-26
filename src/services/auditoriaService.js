/**
 * File: src/services/auditoriaService.js
 * @description Servicio para el módulo de Auditoría de acciones del sistema.
 */

import api from "./api.js";

/**
 * Obtiene el listado de registros de auditoría con filtros y paginación.
 * @param {Object} params - Parámetros de filtrado y paginación
 */
export const getAuditoria = (params = {}) => {
  const filtros = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) filtros[k] = v;
  });
  return api.get("/auditoria", { params: filtros });
};

/**
 * Obtiene estadísticas agregadas de auditoría.
 * @param {Object} params - fecha_inicio, fecha_fin opcionales
 */
export const getAuditoriaStats = (params = {}) =>
  api.get("/auditoria/stats", { params });

/**
 * Obtiene un registro de auditoría por ID.
 * @param {number|string} id
 */
export const getAuditoriaById = (id) => api.get(`/auditoria/${id}`);

/**
 * Exporta el CSV de auditoría con los mismos filtros del listado.
 * Retorna la URL de descarga para disparar desde el navegador.
 * @param {Object} params - mismos filtros que getAuditoria
 */
export const buildCsvUrl = (params = {}) => {
  const filtros = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== null && v !== undefined) filtros[k] = v;
  });
  const qs = new URLSearchParams(filtros).toString();
  const base = api.defaults.baseURL || "";
  return `${base}/auditoria/export/csv${qs ? `?${qs}` : ""}`;
};

/**
 * Obtiene el historial de auditoría de una entidad específica.
 * @param {string} entidad - nombre de la entidad (ej: "usuarios")
 * @param {number|string} id - ID del registro
 */
export const getAuditoriaEntidad = (entidad, id) =>
  api.get(`/auditoria/entidad/${entidad}/${id}`);
