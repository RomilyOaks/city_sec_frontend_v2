/**
 * @file sseManager.js
 * @description Singleton que gestiona UNA sola conexión EventSource al stream SSE
 * del backend. Distribuye los eventos a todos los suscriptores registrados sin
 * abrir conexiones adicionales.
 *
 * Uso:
 *   import { subscribe } from "./sseManager.js";
 *   const unsub = subscribe("nueva_novedad", (data) => { ... });
 *   // Al desmontar:
 *   unsub();
 */

import { API_URL } from "../config/constants";

const RECONNECT_DELAY_MS = 5000;

// ── Estado del singleton ────────────────────────────────────────────────────
let eventSource = null;
let reconnectTimer = null;
let connectTimer = null;

// Map<eventName, Set<callback>>
const listeners = new Map();

// ── Helpers ─────────────────────────────────────────────────────────────────

function getFreshToken() {
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token || null;
    }
  } catch {
    // silencioso
  }
  return null;
}

function totalListeners() {
  let n = 0;
  for (const set of listeners.values()) n += set.size;
  return n;
}

/** Enruta un MessageEvent al/los callbacks registrados para ese nombre de evento */
function dispatch(eventName, event) {
  const set = listeners.get(eventName);
  if (!set || set.size === 0) return;
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    data = event.data;
  }
  for (const cb of set) {
    try { cb(data); } catch (err) {
      console.error(`[SSE Manager] Error en listener de '${eventName}':`, err);
    }
  }
}

/** Registra listeners de eventos en el EventSource activo */
function attachListeners(es) {
  for (const eventName of listeners.keys()) {
    es.addEventListener(eventName, (e) => dispatch(eventName, e));
  }
}

// ── Conexión ─────────────────────────────────────────────────────────────────

function connect() {
  const token = getFreshToken();
  if (!token) {
    console.warn("[SSE Manager] Sin token JWT — no se conecta");
    return;
  }

  if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
    eventSource.close();
  }
  eventSource = null;

  const url = `${API_URL}/novedades/stream?token=${token}`;
  console.info("[SSE Manager] Conectando...");
  const es = new EventSource(url);

  es.addEventListener("connected", (e) => {
    try {
      const d = JSON.parse(e.data);
      console.info(`[SSE Manager] ✅ Conectado. ClientID: ${d.clientId}`);
    } catch {
      console.info("[SSE Manager] ✅ Conectado");
    }
  });

  attachListeners(es);

  es.onerror = () => {
    console.warn(`[SSE Manager] ⚠️ Conexión perdida. Reconectando en ${RECONNECT_DELAY_MS / 1000}s...`);
    es.close();
    eventSource = null;
    reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
  };

  eventSource = es;
}

function disconnect() {
  clearTimeout(reconnectTimer);
  clearTimeout(connectTimer);
  reconnectTimer = null;
  connectTimer = null;
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    console.info("[SSE Manager] 🔌 Desconectado");
  }
}

function ensureConnected() {
  if (eventSource && eventSource.readyState !== EventSource.CLOSED) return;
  clearTimeout(connectTimer);
  // Pequeño delay para sobrevivir StrictMode double-mount
  connectTimer = setTimeout(connect, 100);
}

// ── API pública ──────────────────────────────────────────────────────────────

/**
 * Suscribe un callback a un evento SSE específico.
 * Abre la conexión si es la primera suscripción.
 *
 * @param {string} eventName - Nombre del evento SSE (ej: "nueva_novedad")
 * @param {Function} callback - Función que recibe el payload ya parseado
 * @returns {Function} Función de desuscripción — llamar al desmontar
 */
export function subscribe(eventName, callback) {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
    // Si el EventSource ya está abierto, registrar el listener en él
    if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
      eventSource.addEventListener(eventName, (e) => dispatch(eventName, e));
    }
  }
  listeners.get(eventName).add(callback);
  ensureConnected();

  return function unsubscribe() {
    const set = listeners.get(eventName);
    if (set) {
      set.delete(callback);
      if (set.size === 0) listeners.delete(eventName);
    }
    if (totalListeners() === 0) {
      disconnect();
    }
  };
}
