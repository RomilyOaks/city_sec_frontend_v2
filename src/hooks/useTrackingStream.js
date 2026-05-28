/**
 * @file useTrackingStream.js
 * @description Hook que escucha el evento SSE 'vehiculo:posicion' y mantiene
 * en estado un Map de vehiculo_id → posición GPS actual.
 *
 * Reutiliza la misma conexión EventSource del singleton sseManager —
 * no abre una segunda conexión al backend.
 *
 * Payload del evento (del backend):
 *   { vehiculo_id, placa, lat, lng, velocidad, timestamp }
 *
 * Estado devuelto:
 *   vehiculos — Map<number, { vehiculo_id, placa, lat, lng, velocidad, timestamp, activo }>
 *     · activo=true  → última actualización hace menos de 10 minutos
 *     · activo=false → sin señal en los últimos 10 minutos
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { subscribe } from "../services/sseManager.js";

const INACTIVIDAD_MS = 10 * 60 * 1000; // 10 minutos
const PURGA_INTERVAL_MS = 60 * 1000;   // revisar cada 1 minuto

/**
 * @param {Object} options
 * @param {boolean} options.enabled - Si false, no se suscribe (default: true)
 * @returns {{ vehiculos: Map, totalActivos: number }}
 */
export function useTrackingStream({ enabled = true } = {}) {
  // Map<vehiculo_id, { vehiculo_id, placa, lat, lng, velocidad, timestamp, activo }>
  const [vehiculos, setVehiculos] = useState(() => new Map());

  // Ref de la misma Map para leerla en el intervalo sin dependencia reactiva
  const vehiculosRef = useRef(vehiculos);
  useEffect(() => {
    vehiculosRef.current = vehiculos;
  }, [vehiculos]);

  // ── Handler de evento SSE ─────────────────────────────────────────────────
  const handlePosicion = useCallback((data) => {
    const { vehiculo_id, placa, lat, lng, velocidad, timestamp } = data;
    if (!vehiculo_id || lat === undefined || lng === undefined) return;

    setVehiculos((prev) => {
      const next = new Map(prev);
      next.set(vehiculo_id, {
        vehiculo_id,
        placa: placa || prev.get(vehiculo_id)?.placa || `V-${vehiculo_id}`,
        lat: typeof lat === "number" ? lat : parseFloat(lat),
        lng: typeof lng === "number" ? lng : parseFloat(lng),
        velocidad: velocidad !== null && velocidad !== undefined ? parseFloat(velocidad) : null,
        timestamp: timestamp || new Date().toISOString(),
        activo: true,
      });
      return next;
    });
  }, []);

  // ── Suscripción al singleton SSE ─────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return;
    const unsub = subscribe("vehiculo:posicion", handlePosicion);
    return unsub;
  }, [enabled, handlePosicion]);

  // ── Purga periódica: marcar vehículos inactivos ──────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let hayInactivos = false;

      for (const v of vehiculosRef.current.values()) {
        const msDesdeActualizacion = now - new Date(v.timestamp).getTime();
        if (v.activo && msDesdeActualizacion > INACTIVIDAD_MS) {
          hayInactivos = true;
          break;
        }
      }

      if (!hayInactivos) return;

      setVehiculos((prev) => {
        const next = new Map(prev);
        for (const [id, v] of next.entries()) {
          const ms = now - new Date(v.timestamp).getTime();
          if (ms > INACTIVIDAD_MS) {
            next.set(id, { ...v, activo: false });
          }
        }
        return next;
      });
    }, PURGA_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled]);

  const totalActivos = [...vehiculos.values()].filter((v) => v.activo).length;

  return { vehiculos, totalActivos };
}
