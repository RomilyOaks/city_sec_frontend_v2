/**
 * File: src/services/abastecimientosService.js
 * @version 1.0.0
 * @description Servicio para gestión de abastecimientos de combustible
 *
 * @module src/services/abastecimientosService.js
 */

import api from "./api.js";

/**
 * Obtener sugerencias de grifos para autocompletar
 * @param {string} query - Término de búsqueda (mínimo 2 caracteres)
 * @returns {Promise<Array>} Lista de grifos sugeridos
 */
export async function getSugerenciasGrifos(query = '') {
  try {
    if (query.length < 2) return [];
    
    const response = await api.get('/grifos/sugerencias', {
      params: { q: query.toUpperCase() }
    });
    
    return response.data || [];
  } catch (error) {
    console.error('Error obteniendo sugerencias de grifos:', error);
    return [];
  }
}

/**
 * Listar abastecimientos con filtros opcionales
 * @param {Object} filters - Filtros de búsqueda
 * @returns {Promise<Object>} Respuesta con datos y paginación
 */
export async function getAbastecimientos(filters = {}) {
  try {
    const params = new URLSearchParams();
    
    // Agregar filtros si existen
    if (filters.vehiculo_id) params.append('vehiculo_id', filters.vehiculo_id);
    if (filters.personal_id) params.append('personal_id', filters.personal_id);
    if (filters.fecha_inicio) params.append('fecha_inicio', filters.fecha_inicio);
    if (filters.fecha_fin) params.append('fecha_fin', filters.fecha_fin);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const res = await api.get(`/abastecimientos?${params}`);
    return res.data;
  } catch (err) {
    console.error("Error obteniendo abastecimientos:", err);
    throw err;
  }
}

/**
 * Obtener un abastecimiento por ID
 * @param {number} id - ID del abastecimiento
 * @returns {Promise<Object>} Datos del abastecimiento
 */
export async function getAbastecimiento(id) {
  try {
    const res = await api.get(`/abastecimientos/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error obteniendo abastecimiento:", err);
    throw err;
  }
}

/**
 * Crear nuevo abastecimiento
 * @param {Object} data - Datos del abastecimiento
 * @returns {Promise<Object>} Abastecimiento creado
 */
export async function createAbastecimiento(data) {
  try {
    console.log('=== DEBUG CREATE ABASTECIMIENTO ===');
    console.log('Datos recibidos en servicio:', data);
    console.log('Endpoint: POST /abastecimientos');
    
    const res = await api.post('/abastecimientos', data);
    console.log('Respuesta cruda del API:', res);
    console.log('Respuesta data:', res.data);
    
    return res.data;
  } catch (err) {
    console.error("Error creando abastecimiento:", err);
    console.error("Error response:", err.response);
    console.error("Error status:", err.response?.status);
    console.error("Error data:", err.response?.data);
    throw err;
  }
}

/**
 * Actualizar abastecimiento existente
 * @param {number} id - ID del abastecimiento
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Abastecimiento actualizado
 */
export async function updateAbastecimiento(id, data) {
  try {
    const res = await api.put(`/abastecimientos/${id}`, data);
    return res.data;
  } catch (err) {
    console.error("Error actualizando abastecimiento:", err);
    throw err;
  }
}

/**
 * Eliminar abastecimiento (soft delete)
 * @param {number} id - ID del abastecimiento
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export async function deleteAbastecimiento(id) {
  try {
    const res = await api.delete(`/abastecimientos/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error eliminando abastecimiento:", err);
    throw err;
  }
}

/**
 * Obtener tipos de combustible disponibles
 * @returns {Promise<Array>} Lista de tipos de combustible
 */
export async function getTiposCombustible() {
  // NOTA: Backend no tiene endpoint para tipos de combustible
  // Usar datos estáticos que coinciden con el enum del backend
  return [
    { value: 'GASOLINA_REGULAR', label: 'Gasolina Regular' },
    { value: 'GASOLINA_PREMIUM', label: 'Gasolina Premium' },
    { value: 'GASOHOL_REGULAR', label: 'Gasohol Regular' },
    { value: 'GASOHOL_PREMIUM', label: 'Gasohol Premium' },
    { value: 'DIESEL_B2', label: 'Diesel B2' },
    { value: 'DIESEL_B5', label: 'Diesel B5' },
    { value: 'DIESEL_S50', label: 'Diesel S50' },
    { value: 'GLP', label: 'GLP' },
    { value: 'GNV', label: 'GNV' }
  ];
}

/**
 * Obtener grifos disponibles
 * @returns {Promise<Array>} Lista de grifos
 */
export async function getGrifos() {
  // NOTA: Backend no tiene endpoint para grifos, están como grifo_ruc y grifo_nombre en abastecimientos
  // Usar datos estáticos hasta que se implemente catálogo
  return [
    { value: 'REPSOL', label: 'Repsol' },
    { value: 'PRIMAX', label: 'Primax' },
    { value: 'PETROPERU', label: 'Petroperú' },
    { value: 'SHELL', label: 'Shell' },
    { value: 'MOBIL', label: 'Mobil' },
    { value: 'BP', label: 'BP' },
    { value: 'TOTAL', label: 'Total' },
    { value: 'OTRO', label: 'Otro' }
  ];
}

/**
 * Utilidad para formatear fecha y hora
 * @param {string} fechaHora - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export function formatFechaHora(fechaHora) {
  if (!fechaHora) return '';
  
  const fecha = new Date(fechaHora);
  return fecha.toLocaleString('es-PE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calcular consumo de combustible
 * @param {number} kmAnterior - Kilometraje anterior
 * @param {number} kmActual - Kilometraje actual
 * @param {number} cantidad - Cantidad de combustible
 * @returns {number} Consumo por km
 */
export function calcularConsumo(kmAnterior, kmActual, cantidad) {
  if (!kmAnterior || !kmActual || !cantidad) return 0;
  
  const kmRecorridos = kmActual - kmAnterior;
  if (kmRecorridos <= 0) return 0;
  
  return Number((cantidad / kmRecorridos).toFixed(2));
}

/**
 * Validar datos de abastecimiento
 * @param {Object} data - Datos a validar
 * @returns {Object} Resultado de validación
 */
export function validarAbastecimiento(data) {
  const errores = [];

  // Validaciones requeridas
  if (!data.vehiculo_id) {
    errores.push('El vehículo es requerido');
  }
  
  if (!data.fecha_hora) {
    errores.push('La fecha y hora son requeridas');
  }
  
  if (!data.tipo_combustible) {
    errores.push('El tipo de combustible es requerido');
  }
  
  if (!data.cantidad || data.cantidad <= 0) {
    errores.push('La cantidad es requerida y debe ser mayor a 0');
  }
  
  if (!data.precio_unitario || data.precio_unitario <= 0) {
    errores.push('El precio unitario es requerido y debe ser mayor a 0');
  }
  
  if (!data.grifo_nombre) {
    errores.push('El nombre del grifo es requerido');
  }

  // Validaciones opcionales
  if (data.km_actual !== undefined && data.km_actual < 0) {
    errores.push('El kilometraje debe ser mayor o igual a 0');
  }

  return {
    isValid: errores.length === 0,
    errores
  };
}
