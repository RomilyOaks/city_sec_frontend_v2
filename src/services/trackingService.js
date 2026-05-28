/**
 * @file trackingService.js
 * @version 1.0.0
 * @description Servicio para los endpoints de Tracking GPS.
 * Consulta posiciones actuales, rutas históricas y vehículos cercanos.
 *
 * @module src/services/trackingService.js
 */

import api from "./api";

/**
 * getVehiculosActivos
 * Devuelve la última posición conocida de todos los vehículos activos.
 * Activo = actualización en los últimos 15 minutos (definido en backend).
 *
 * @param {Object} [options]
 * @param {number} [options.limite=50]
 * @returns {Promise<Array<{vehiculo_id, placa, lat, lng, velocidad, timestamp, operativo_id}>>}
 */
export async function getVehiculosActivos({ limite = 50 } = {}) {
  const params = new URLSearchParams();
  params.append("limite", limite);
  const res = await api.get(`/tracking/activos?${params.toString()}`);
  return res?.data?.data ?? [];
}

/**
 * getRutaVehiculo
 * Devuelve el historial de posiciones GPS de un vehículo en un rango de fechas.
 *
 * @param {number|string} vehiculo_id
 * @param {Object} options
 * @param {string} options.desde  - ISO 8601 (ej: "2025-01-01T00:00:00")
 * @param {string} options.hasta  - ISO 8601 (ej: "2025-01-01T23:59:59")
 * @param {number} [options.limite=200]
 * @returns {Promise<{vehiculo_id, placa, total, puntos: Array}>}
 */
export async function getRutaVehiculo(vehiculo_id, { desde, hasta, limite = 200 } = {}) {
  const params = new URLSearchParams();
  if (desde) params.append("desde", desde);
  if (hasta) params.append("hasta", hasta);
  params.append("limite", limite);
  const res = await api.get(`/tracking/vehiculo/${vehiculo_id}/ruta?${params.toString()}`);
  return res?.data?.data ?? { vehiculo_id, placa: null, total: 0, puntos: [] };
}

/**
 * getVehiculosCercanos
 * Devuelve vehículos activos dentro de un radio dado a partir de una coordenada.
 * Útil para el panel "Unidades cercanas" en NovedadDetalleModal.
 *
 * @param {Object} params
 * @param {number} params.lat       - Latitud del punto de referencia
 * @param {number} params.lng       - Longitud del punto de referencia
 * @param {number} [params.radio_km=2] - Radio de búsqueda en kilómetros
 * @param {number} [params.limite=5]
 * @returns {Promise<Array<{vehiculo_id, placa, lat, lng, velocidad, timestamp, distancia_km}>>}
 */
export async function getVehiculosCercanos({ lat, lng, radio_km = 2, limite = 5 } = {}) {
  const params = new URLSearchParams();
  params.append("lat", lat);
  params.append("lng", lng);
  params.append("radio_km", radio_km);
  params.append("limite", limite);
  const res = await api.get(`/tracking/cercanos?${params.toString()}`);
  return res?.data?.data ?? [];
}
