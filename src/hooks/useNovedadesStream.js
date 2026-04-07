/**
 * @file useNovedadesStream.js
 * @description Hook para conectarse al stream SSE de novedades en tiempo real.
 * Se conecta al backend, escucha el evento 'nueva_novedad' y llama al callback
 * cada vez que llega una novedad nueva desde WhatsApp, App Móvil o cualquier canal.
 */

import { useEffect, useRef, useCallback } from "react";

const RECONNECT_DELAY_MS = 5000; // Reconectar tras 5s si se pierde conexión

/**
 * Hook que mantiene una conexión SSE abierta con el backend.
 *
 * @param {Function} onNuevaNovedad - Callback que recibe la novedad nueva
 * @param {Object} options
 * @param {boolean} options.enabled - Si false, no se conecta (default: true)
 */
export function useNovedadesStream(onNuevaNovedad, { enabled = true } = {}) {
    const eventSourceRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    // Estabilizar el callback para no re-conectar si el padre re-renderiza
    const onNuevaNovedad_stable = useCallback(onNuevaNovedad, []); // eslint-disable-line

    useEffect(() => {
        if (!enabled) return;

        // Leer desde el store de Zustand persistido
        let token = null;
        try {
            const authStorage = localStorage.getItem("auth-storage");
            if (authStorage) {
                const parsed = JSON.parse(authStorage);
                token = parsed?.state?.token || null;
            }
        } catch {
            console.warn("[SSE] Error leyendo token del storage");
        }

        if (!token) {
            console.warn("[SSE] No hay token JWT disponible");
            return;
        }

        /**
         * Establece la conexión SSE.
         * Se llama al montar el componente y cada vez que hay que reconectar.
         */
        function connect() {
            // Cerrar conexión previa si existe
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }

            // EventSource no soporta headers Authorization
            // Por eso el token va como query param (el backend lo acepta)
            const baseUrl = import.meta.env.VITE_API_URL || "";
            const url = `${baseUrl}/novedades/stream?token=${token}`;

            console.info("[SSE] Conectando al stream de novedades...");
            const eventSource = new EventSource(url);
            eventSourceRef.current = eventSource;

            // ── Evento: conexión confirmada por el backend ──────────────────────────
            eventSource.addEventListener("connected", (e) => {
                try {
                    const data = JSON.parse(e.data);
                    console.info(`[SSE] ✅ Conectado. ClientID: ${data.clientId}`);
                } catch {
                    console.info("[SSE] ✅ Conectado al stream");
                }
            });

            // ── Evento: nueva novedad llegó al sistema ──────────────────────────────
            eventSource.addEventListener("nueva_novedad", (e) => {
                try {
                    const novedad = JSON.parse(e.data);
                    console.info(`[SSE] 🚨 Nueva novedad: ${novedad.novedad_code}`);
                    onNuevaNovedad_stable(novedad);
                } catch (error) {
                    console.error("[SSE] Error parseando nueva_novedad:", error);
                }
            });

            // ── Error: reconectar automáticamente ──────────────────────────────────
            eventSource.onerror = () => {
                console.warn(`[SSE] ⚠️ Conexión perdida. Reconectando en ${RECONNECT_DELAY_MS / 1000}s...`);
                eventSource.close();
                eventSourceRef.current = null;
                reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
            };
        }

        // connect();   //Se desconectaba de inmediato por eso se comenta
        // Pequeño delay para sobrevivir StrictMode double-mount
        const connectTimer = setTimeout(connect, 100);

        // ── Cleanup al desmontar ────────────────────────────────────────────────
        return () => {
            clearTimeout(connectTimer);  
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            console.info("[SSE] 🔌 Desconectado del stream");
        };
    }, [enabled, onNuevaNovedad_stable]);
}