/**
 * File: src/utils/direccionCodeHelper.js
 * @version 1.0.0
 * @description Utilidades para manejar códigos de direcciones
 *
 * Sistema de código: D-XXXXXX (6 dígitos con padding)
 * Ejemplos: D-000001, D-000123, D-123456
 *
 * @module src/utils/direccionCodeHelper
 */

/**
 * Normaliza un código de dirección agregando ceros faltantes
 * Permite al usuario escribir "D-123" y lo convierte a "D-000123"
 *
 * @param {string} input - Código ingresado por el usuario
 * @returns {string} Código normalizado con padding
 *
 * @example
 * normalizeDireccionCode("D-123")    → "D-000123"
 * normalizeDireccionCode("D-1")      → "D-000001"
 * normalizeDireccionCode("D-000456") → "D-000456"
 * normalizeDireccionCode("123")      → "D-000123"
 * normalizeDireccionCode("d-123")    → "D-000123"
 */
export function normalizeDireccionCode(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Convertir a mayúsculas y limpiar espacios
  let codigo = input.trim().toUpperCase();

  // Si no empieza con "D-", agregarlo
  if (!codigo.startsWith('D-')) {
    // Si es solo números, agregar el prefijo
    if (/^\d+$/.test(codigo)) {
      codigo = `D-${codigo}`;
    } else if (codigo.startsWith('D') && !codigo.includes('-')) {
      // Si empieza con D sin guión, agregarlo
      codigo = `D-${codigo.substring(1)}`;
    } else {
      // Formato inválido, retornar sin cambios
      return input;
    }
  }

  // Extraer la parte numérica
  const match = codigo.match(/^D-(\d+)$/);

  if (!match) {
    // Si no coincide con el patrón, retornar sin cambios
    return input;
  }

  const numero = match[1];

  // Validar que no exceda 6 dígitos
  if (numero.length > 6) {
    return input; // Retornar sin cambios si excede el límite
  }

  // Agregar padding de ceros a la izquierda (6 dígitos)
  const numeroPadded = numero.padStart(6, '0');

  return `D-${numeroPadded}`;
}

/**
 * Valida si un código de dirección tiene el formato correcto
 *
 * @param {string} codigo - Código a validar
 * @returns {boolean} true si es válido
 *
 * @example
 * isValidDireccionCode("D-000123") → true
 * isValidDireccionCode("D-123")    → false (faltan ceros)
 * isValidDireccionCode("d-000123") → false (minúscula)
 */
export function isValidDireccionCode(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return false;
  }

  // Debe ser exactamente D-XXXXXX (6 dígitos)
  return /^D-\d{6}$/.test(codigo.trim());
}

/**
 * Extrae el número de un código de dirección
 *
 * @param {string} codigo - Código de dirección
 * @returns {number|null} Número extraído o null si es inválido
 *
 * @example
 * extractDireccionNumber("D-000123") → 123
 * extractDireccionNumber("D-000001") → 1
 * extractDireccionNumber("invalid")  → null
 */
export function extractDireccionNumber(codigo) {
  if (!codigo || typeof codigo !== 'string') {
    return null;
  }

  const match = codigo.trim().match(/^D-(\d{6})$/);

  if (!match) {
    return null;
  }

  return parseInt(match[1], 10);
}

/**
 * Detecta si un input parece ser un código de dirección
 * Útil para decidir si aplicar normalización automática
 *
 * @param {string} input - Input del usuario
 * @returns {boolean} true si parece un código de dirección
 *
 * @example
 * looksLikeDireccionCode("D-123")  → true
 * looksLikeDireccionCode("123")    → true (solo números cortos)
 * looksLikeDireccionCode("d123")   → true
 * looksLikeDireccionCode("Av. Los Proceres") → false
 */
export function looksLikeDireccionCode(input) {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const trimmed = input.trim().toUpperCase();

  // Empieza con D (con o sin guión)
  if (trimmed.startsWith('D')) {
    return true;
  }

  // Es solo números y no más de 6 dígitos (probable código abreviado)
  if (/^\d{1,6}$/.test(trimmed)) {
    return true;
  }

  return false;
}

export default {
  normalizeDireccionCode,
  isValidDireccionCode,
  extractDireccionNumber,
  looksLikeDireccionCode,
};
