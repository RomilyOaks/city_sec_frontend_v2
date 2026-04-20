/**
 * File: src/services/cargosService.js
 * @version 1.0.0
 * @description Servicio para gestión de cargos/puestos de trabajo
 *
 * @module src/services/cargosService.js
 */

import api from "./api.js";

/**
 * Listar cargos con filtros opcionales
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Object>} Respuesta con datos y paginación
 */
export async function getCargos(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    // Agregar filtros si existen
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.requiere_licencia !== undefined) params.append('requiere_licencia', filters.requiere_licencia);
    if (filters.activos !== undefined) params.append('activos', filters.activos);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    const response = await api.get(`/cargos?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cargos:', error);
    throw error;
  }
}

/**
 * Obtener cargo por ID
 * @param {number} id - ID del cargo
 * @returns {Promise<Object>} Datos del cargo
 */
export async function getCargoById(id) {
  try {
    const response = await api.get(`/cargos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cargo:', error);
    throw error;
  }
}

/**
 * Crear nuevo cargo
 * @param {Object} cargoData - Datos del cargo
 * @returns {Promise<Object>} Cargo creado
 */
export async function createCargo(cargoData) {
  try {
    const response = await api.post('/cargos', cargoData);
    return response.data;
  } catch (error) {
    console.error('Error creando cargo:', error);
    throw error;
  }
}

/**
 * Actualizar cargo existente
 * @param {number} id - ID del cargo
 * @param {Object} cargoData - Datos a actualizar
 * @returns {Promise<Object>} Cargo actualizado
 */
export async function updateCargo(id, cargoData) {
  try {
    const response = await api.put(`/cargos/${id}`, cargoData);
    return response.data;
  } catch (error) {
    console.error('Error actualizando cargo:', error);
    throw error;
  }
}

/**
 * Verificar si un cargo puede ser eliminado
 * @param {number} id - ID del cargo
 * @returns {Promise<Object>} Respuesta con canDelete y reason
 */
export async function checkCanDeleteCargo(id) {
  try {
    const response = await api.get(`/cargos/${id}/can-delete`);
    return response.data;
  } catch (error) {
    console.error('Error verificando si se puede eliminar cargo:', error);
    throw error;
  }
}

/**
 * Eliminar cargo (soft delete)
 * @param {number} id - ID del cargo
 * @returns {Promise<Object>} Respuesta del servidor
 */
export async function deleteCargo(id) {
  try {
    const response = await api.delete(`/cargos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error eliminando cargo:', error);
    throw error;
  }
}

/**
 * Restaurar cargo eliminado
 * @param {number} id - ID del cargo
 * @returns {Promise<Object>} Cargo restaurado
 */
export async function restoreCargo(id) {
  try {
    const response = await api.post(`/cargos/${id}/restore`);
    return response.data;
  } catch (error) {
    console.error('Error restaurando cargo:', error);
    throw error;
  }
}

/**
 * Obtener estadísticas de cargos
 * @returns {Promise<Object>} Estadísticas
 */
export async function getCargosStats() {
  try {
    const response = await api.get('/cargos/stats');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Obtener personas asociadas a un cargo
 * @param {number} id - ID del cargo
 * @returns {Promise<Object>} Lista de personas asociadas
 */
export async function getPersonasAsociadasCargo(id) {
  try {
    const response = await api.get(`/cargos/${id}/personas-asociadas`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo personas asociadas:', error);
    throw error;
  }
}

/**
 * Verificar si un cargo puede ser eliminado
 * @param {number} id - ID del cargo
 * @returns {Promise<Object>} Resultado de verificación
 */
export async function checkCargoCanDelete(id) {
  try {
    const response = await api.get(`/cargos/${id}/can-delete`);
    return response.data;
  } catch (error) {
    console.error('Error verificando si puede eliminar:', error);
    throw error;
  }
}

/**
 * Obtener cargos por categoría
 * @param {string} categoria - Categoría a filtrar
 * @returns {Promise<Object>} Lista de cargos por categoría
 */
export async function getCargosByCategoria(categoria) {
  try {
    const response = await api.get(`/cargos?categoria=${categoria}&activos=true`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cargos por categoría:', error);
    throw error;
  }
}

/**
 * Obtener cargos que requieren licencia
 * @returns {Promise<Object>} Lista de cargos con licencia requerida
 */
export async function getCargosConLicencia() {
  try {
    const response = await api.get('/cargos?requiere_licencia=true&activos=true');
    return response.data;
  } catch (error) {
    console.error('Error obteniendo cargos con licencia:', error);
    throw error;
  }
}
