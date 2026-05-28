/**
 * @file useNovedadesStream.js
 * @description Hook para conectarse al stream SSE de novedades en tiempo real.
 * Delega la conexión al singleton sseManager para compartir UNA sola EventSource
 * con otros hooks (useTrackingStream, etc.).
 *
 * La API pública es idéntica a la versión anterior — todos los componentes que
 * usan este hook funcionan sin cambios.
 */

import { useEffect, useRef } from "react";
import { subscribe } from "../services/sseManager.js";

/**
 * Hook que escucha el evento 'nueva_novedad' del stream SSE.
 *
 * @param {Function} onNuevaNovedad - Callback que recibe la novedad nueva
 * @param {Object} options
 * @param {boolean} options.enabled - Si false, no se suscribe (default: true)
 */
export function useNovedadesStream(onNuevaNovedad, { enabled = true } = {}) {
  // Guardar el callback en un ref para siempre llamar la versión más reciente
  // sin necesidad de re-suscribirse.
  const callbackRef = useRef(onNuevaNovedad);
  useEffect(() => {
    callbackRef.current = onNuevaNovedad;
  }); // sin deps → actualiza en cada render

  useEffect(() => {
    if (!enabled) return;

    const unsub = subscribe("nueva_novedad", (novedad) => {
      try {
        console.info(`[SSE] 🚨 Nueva novedad: ${novedad.novedad_code}`);
        callbackRef.current(novedad);
      } catch (err) {
        console.error("[SSE] Error en callback nueva_novedad:", err);
      }
    });

    return unsub;
  }, [enabled]);
}
