/**
 * File: src/utils/novedadCodeHelper.js
 * @version 1.0.0
 * @description Utilidades para manejar códigos de novedades (incidentes)
 *
 * Sistema de código: XXXXXXXXXX (10 dígitos con padding)
 * Ejemplos: 0000000001, 0000000123, 1234567890
 *
 * @module src/utils/novedadCodeHelper
 */

/**
 * Normaliza un código de novedad agregando ceros faltantes
 * Permite al usuario escribir "123" y lo convierte a "0000000123"
 *
 * @param {string} input - Código ingresado por el usuario
 * @returns {string} Código normalizado con padding
 *
 * @example
 * normalizeNovedadCode("123")    → "0000000123"
 * normalizeNovedadCode("1")      → "0000000001"
 * normalizeNovedadCode("0000000456") → "0000000456"
 * normalizeNovedadCode("1234567890") → "1234567890"
 */
export function normalizeNovedadCode(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Convertir a mayúsculas y limpiar espacios
  let codigo = input.trim();

  // Extraer la parte numérica
  const match = codigo.match(/^(\d+)$/);

  if (!match) {
    // Si no coincide con el patrón, retornar sin cambios
    return input;
  }

  const numero = match[1];

  // Validar que no exceda 10 dígitos
  if (numero.length > 10) {
    return input; // Retornar sin cambios si excede el límite
  }

  // Agregar padding de ceros a la izquierda (10 dígitos)
  const numeroPadded = numero.padStart(10, '0');

  return numeroPadded;
}

/**
 * Valida si un código de novedad tiene el formato correcto
 *
 * @param {string} codigo - Código a validar
 * @returns {boolean} true si es válido
 *
 * @example
 * isValidNovedadCode("0000000123") → true
 * isValidNovedadCode("123")    → false (faltan ceros)
 * isValidNovedadCode("00000000123") → false (demasiados dígitos)
 */
export function isValidNovedadCode(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return false;
  }

  // Debe ser exactamente XXXXXXXXXX (10 dígitos)
  return /^\d{10}$/.test(codigo.trim());
}

/**
 * Extrae el número de un código de novedad
 *
 * @param {string} codigo - Código de novedad
 * @returns {number|null} Número extraído o null si es inválido
 *
 * @example
 * extractNovedadNumber("0000000123") → 123
 * extractNovedadNumber("0000000001") → 1
 * extractNovedadNumber("invalid")  → null
 */
export function extractNovedadNumber(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return null;
  }

  const match = codigo.trim().match(/^(\d{10})$/);

  if (!match) {
    return null;
  }

  return parseInt(match[1], 10);
}

/**
 * Formatea un número a código de novedad de 10 dígitos
 *
 * @param {number} numero - Número a formatear
 * @returns {string} Código formateado
 *
 * @example
 * formatNovedadCode(123) → "0000000123"
 * formatNovedadCode(1) → "0000000001"
 * formatNovedadCode(1234567890) → "1234567890"
 */
export function formatNovedadCode(numero) {
  if (typeof numero !== 'number' || isNaN(numero)) {
    return '';
  }

  return String(numero).padStart(10, '0');
}

/**
 * Detecta si un input parece ser un código de novedad
 * Útil para decidir si aplicar normalización automática
 *
 * @param {string} input - Input del usuario
 * @returns {boolean} true si parece un código de novedad
 *
 * @example
 * looksLikeNovedadCode("123")  → true
 * looksLikeNovedadCode("1234567890")    → true
 * looksLikeNovedadCode("Av. Los Proceres") → false
 */
export function looksLikeNovedadCode(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim();

  // Es solo números y no más de 10 dígitos (probable código abreviado)
  if (/^\d{1,10}$/.test(trimmed)) {
    return true;
  }

  return false;
}

export default {
  normalizeNovedadCode,
  isValidNovedadCode,
  extractNovedadNumber,
  formatNovedadCode,
  looksLikeNovedadCode,
};
