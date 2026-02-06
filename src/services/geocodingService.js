/**
 * File: src/services/geocodingService.js
 * @version 1.0.0
 * @description Servicio para geocodificación de direcciones
 * 
 * Este servicio se comunica con el backend para obtener coordenadas
 * de direcciones textuales usando el endpoint de geocodificación.
 */

import api from "./api.js";

/**
 * Geocodifica una dirección textual para obtener coordenadas
 * 
 * @param {string} direccion - Texto de la dirección a geocodificar
 * @returns {Promise<Object>} - Datos de geocodificación
 * 
 * @example
 * const result = await geocodificarDireccion("Ca. Santa Teresa 115");
 * console.log(result);
 * // {
 * //   latitud: -12.123456,
 * //   longitud: -77.123456,
 * //   geocodificada: true,
 * //   location_type: "exacta",
 * //   fuente_geocodificacion: "nominatim"
 * // }
 */
export const geocodificarDireccion = async (direccion) => {
  try {
    if (!direccion || typeof direccion !== 'string' || direccion.trim().length < 3) {
      throw new Error("La dirección debe tener al menos 3 caracteres");
    }

    const response = await api.get('/direcciones/geocodificar-texto', {
      params: {
        direccion: direccion.trim()
      }
    });

    if (!response.data) {
      throw new Error("No se recibió respuesta del servidor");
    }

    // El backend retorna {data: {...}, message, success} - extraer la data interna
    const apiResponse = response.data;
    if (apiResponse.data) {
      return apiResponse.data;
    }

    // Fallback: si la respuesta no tiene wrapper, retornar directamente
    return apiResponse;
  } catch (error) {
    console.error('Error en geocodificación:', error);
    
    // Propagar el error con más contexto
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    } else if (error.response?.status === 404) {
      throw new Error("No se pudo encontrar la dirección");
    } else if (error.response?.status === 400) {
      throw new Error("Dirección inválida o incompleta");
    } else if (error.message) {
      throw error;
    } else {
      throw new Error("Error en el servicio de geocodificación");
    }
  }
};

/**
 * Formatea coordenadas para display
 * 
 * @param {number} latitud - Latitud
 * @param {number} longitud - Longitud
 * @returns {string} - Coordenadas formateadas
 */
export const formatearCoordenadas = (latitud, longitud) => {
  if (!latitud || !longitud) return "No disponible";
  
  return `${parseFloat(latitud).toFixed(6)}, ${parseFloat(longitud).toFixed(6)}`;
};

/**
 * Valida si las coordenadas son válidas para Perú
 * 
 * @param {number} latitud - Latitud
 * @param {number} longitud - Longitud
 * @returns {boolean} - True si son coordenadas válidas
 */
export const validarCoordenadasPeru = (latitud, longitud) => {
  if (!latitud || !longitud) return false;
  
  // Límites aproximados de Perú
  const latMin = -18.5;
  const latMax = -0.0;
  const lngMin = -81.5;
  const lngMax = -68.5;
  
  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);
  
  return lat >= latMin && lat <= latMax && lng >= lngMin && lng <= lngMax;
};

/**
 * Obtiene el tipo de ubicación basado en la precisión
 * 
 * @param {string} locationType - Tipo de ubicación del backend
 * @returns {string} - Descripción amigable
 */
export const getDescripcionLocationType = (locationType) => {
  if (!locationType) return 'Desconocido';

  const tipos = {
    // Valores del backend (uppercase English - Google-style)
    'ROOFTOP': 'Ubicación exacta',
    'RANGE_INTERPOLATED': 'Ubicación interpolada',
    'GEOMETRIC_CENTER': 'Centro geométrico',
    'APPROXIMATE': 'Ubicación aproximada',
    // Valores en español (legacy/alternativos)
    'exacta': 'Ubicación exacta',
    'aproximada': 'Ubicación aproximada',
    'interpolada': 'Ubicación interpolada',
    'estimada': 'Ubicación estimada',
    'centro_calle': 'Centro de calle',
    'centro_cuadra': 'Centro de cuadra'
  };

  return tipos[locationType] || locationType;
};

/**
 * Obtiene la fuente de geocodificación con descripción
 * 
 * @param {string} fuente - Fuente del backend
 * @returns {string} - Descripción amigable
 */
export const getDescripcionFuente = (fuente) => {
  if (!fuente) return 'No disponible';

  const fuentes = {
    'database': 'Base de datos interna',
    'nominatim': 'OpenStreetMap Nominatim',
    'google': 'Google Maps API',
    'manual': 'Ingreso manual'
  };

  // Si existe mapeo exacto, usarlo
  if (fuentes[fuente]) return fuentes[fuente];

  // El backend puede enviar texto descriptivo completo (ej: "Base de datos (dirección aproximada)")
  // En ese caso, retornar tal cual ya que es legible
  return fuente;
};

export default {
  geocodificarDireccion,
  formatearCoordenadas,
  validarCoordenadasPeru,
  getDescripcionLocationType,
  getDescripcionFuente
};
