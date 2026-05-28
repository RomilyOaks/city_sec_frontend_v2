/**
 * @file MapaOperativo.jsx
 * @version 1.0.0
 * @description Página de mapa operativo GPS en tiempo real.
 * Muestra la posición actual de los vehículos de patrullaje en un mapa Leaflet,
 * actualizándose en tiempo real vía SSE (Server-Sent Events).
 *
 * Datos:
 *  - Carga inicial: GET /api/v1/tracking/activos (snapshot de la BD)
 *  - Actualizaciones en tiempo real: evento SSE 'vehiculo:posicion' via useTrackingStream
 *  - Ambas fuentes se fusionan; SSE tiene prioridad al ser más reciente
 *
 * Indicadores de estado por color de marcador:
 *  🟢 Verde  → activo + en movimiento (velocidad > 0)
 *  🔵 Azul   → activo + detenido (velocidad = 0)
 *  ⚫ Gris   → sin señal en los últimos 10 minutos
 *
 * Centro del mapa: Chorrillos, Lima (-12.1628, -77.0135), zoom 14
 *
 * @module src/pages/MapaOperativo.jsx
 */

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapPin,
  RefreshCw,
  Car,
  Clock,
  Navigation,
  Wifi,
  WifiOff,
  AlertCircle,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore.js";
import { canPerformAction } from "../rbac/rbac.js";
import { useTrackingStream } from "../hooks/useTrackingStream.js";
import { getVehiculosActivos } from "../services/trackingService.js";

// ── Fix iconos Leaflet en React (solo si no fue aplicado antes) ───────────────
if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

// ── Constantes ────────────────────────────────────────────────────────────────
const CHORRILLOS_CENTER = [-12.1628, -77.0135];
const DEFAULT_ZOOM = 14;

const COLOR_MOVING  = "#22c55e"; // verde  — activo + en movimiento
const COLOR_STOPPED = "#3b82f6"; // azul   — activo + detenido
const COLOR_INACTIVE = "#6b7280"; // gris   — sin señal

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Determina el color del marcador según el estado del vehículo.
 * @param {{ activo: boolean, velocidad: number|null }} v
 * @returns {string} color hex
 */
function getMarkerColor(v) {
  if (!v.activo) return COLOR_INACTIVE;
  if (v.velocidad !== null && v.velocidad > 0) return COLOR_MOVING;
  return COLOR_STOPPED;
}

/**
 * Crea un icono personalizado (car pin) con el color indicado.
 * @param {string} color
 * @param {boolean} [selected]
 */
function createVehicleIcon(color, selected = false) {
  const size = selected ? 38 : 32;
  const border = selected ? "white" : "rgba(255,255,255,0.8)";
  return L.divIcon({
    className: "",
    html: `<div style="
        width:${size}px;height:${size}px;
        background:${color};
        border:2.5px solid ${border};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
      ">
        <div style="transform:rotate(45deg);color:white;font-size:${selected ? 14 : 12}px;line-height:1;">
          🚐
        </div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

/**
 * Formatea el timestamp a hora local (America/Lima).
 * @param {string|null} ts
 */
function formatHora(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleTimeString("es-PE", {
      timeZone: "America/Lima",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * Devuelve cuántos minutos hace desde el timestamp.
 * @param {string|null} ts
 */
function minutosDesde(ts) {
  if (!ts) return null;
  try {
    const diff = Date.now() - new Date(ts).getTime();
    return Math.floor(diff / 60000);
  } catch {
    return null;
  }
}

// ── Sub-componente: volar al vehículo seleccionado ─────────────────────────
function MapFlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, Math.max(map.getZoom(), 16), { animate: true, duration: 0.8 });
    }
  }, [center, map]);
  return null;
}

// ── Sub-componente: tarjeta de vehículo en el panel lateral ───────────────
function VehicleCard({ v, selected, onSelect }) {
  const color = getMarkerColor(v);
  const mins = minutosDesde(v.timestamp);
  const etiquetaEstado = !v.activo
    ? "Sin señal"
    : v.velocidad > 0
    ? `${Math.round(v.velocidad)} km/h`
    : "Detenido";

  return (
    <button
      type="button"
      onClick={() => onSelect(v)}
      className={[
        "w-full text-left rounded-xl border px-3 py-2.5 transition-all",
        selected
          ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-slate-800 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Indicador de color + placa */}
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
            {v.placa || `V-${v.vehiculo_id}`}
          </span>
        </div>

        {/* Estado */}
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            backgroundColor: color + "22",
            color,
          }}
        >
          {etiquetaEstado}
        </span>
      </div>

      {/* Coordenadas y hora */}
      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {v.lat?.toFixed(5)}, {v.lng?.toFixed(5)}
        </span>
        {mins !== null && (
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {mins === 0 ? "ahora" : `hace ${mins} min`}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Componente principal ───────────────────────────────────────────────────
/**
 * MapaOperativo
 * Página de mapa GPS en tiempo real para seguimiento de patrullas.
 *
 * @component
 * @returns {JSX.Element}
 */
export default function MapaOperativo() {
  const user = useAuthStore((s) => s.user);
  const canRead = canPerformAction(user, "tracking.vehiculos.read");

  // ── Datos en tiempo real (SSE) ──────────────────────────────────────────
  const { vehiculos: vehiculosSSE, totalActivos } = useTrackingStream({
    enabled: canRead,
  });

  // ── Snapshot inicial desde la API ───────────────────────────────────────
  const [vehiculosApi, setVehiculosApi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchVehiculos = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVehiculosActivos({ limite: 100 });
      setVehiculosApi(Array.isArray(data) ? data : []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("[MapaOperativo] Error al cargar activos:", err);
      setError("No se pudo cargar la posición de los vehículos.");
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  // ── Fusión de datos: SSE tiene prioridad ────────────────────────────────
  const vehiculosMerged = useMemo(() => {
    const merged = new Map();

    // 1. Poblar con datos de API
    for (const v of vehiculosApi) {
      if (v.vehiculo_id && v.lat !== undefined && v.lng !== undefined) {
        merged.set(v.vehiculo_id, {
          ...v,
          lat: parseFloat(v.lat),
          lng: parseFloat(v.lng),
          velocidad:
            v.velocidad !== null && v.velocidad !== undefined
              ? parseFloat(v.velocidad)
              : null,
          activo: true,
          _fuente: "api",
        });
      }
    }

    // 2. Sobreescribir/añadir con datos SSE (más recientes)
    for (const [id, v] of vehiculosSSE.entries()) {
      merged.set(id, { ...v, _fuente: "sse" });
    }

    // 3. Ordenar: activos primero, luego por placa
    return [...merged.values()].sort((a, b) => {
      if (a.activo !== b.activo) return a.activo ? -1 : 1;
      return (a.placa || "").localeCompare(b.placa || "");
    });
  }, [vehiculosApi, vehiculosSSE]);

  // ── Vehículo seleccionado (click en panel o marcador) ───────────────────
  const [selectedId, setSelectedId] = useState(null);
  const selectedVehiculo = vehiculosMerged.find(
    (v) => v.vehiculo_id === selectedId
  );
  const flyCenter =
    selectedVehiculo?.lat !== undefined && selectedVehiculo?.lng !== undefined
      ? [selectedVehiculo.lat, selectedVehiculo.lng]
      : null;

  // Ref para los marcadores (abrir popup al seleccionar del panel)
  const markersRef = useRef({});

  const handleSelectVehiculo = useCallback(
    (v) => {
      setSelectedId((prev) => (prev === v.vehiculo_id ? null : v.vehiculo_id));
      // Abrir popup del marcador
      const marker = markersRef.current[v.vehiculo_id];
      if (marker) marker.openPopup();
    },
    []
  );

  // ── Buscador del panel lateral ──────────────────────────────────────────
  const [busqueda, setBusqueda] = useState("");
  const vehiculosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return vehiculosMerged;
    return vehiculosMerged.filter((v) =>
      (v.placa || `v-${v.vehiculo_id}`).toLowerCase().includes(q)
    );
  }, [vehiculosMerged, busqueda]);

  // ── Totales para el badge ───────────────────────────────────────────────
  const totalVehiculos = vehiculosMerged.length;

  // ── Sin permiso ─────────────────────────────────────────────────────────
  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={48} className="text-slate-400 dark:text-slate-500" />
        <div className="text-center">
          <p className="font-semibold text-slate-700 dark:text-slate-200">
            Acceso restringido
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            No tienes permiso para ver el mapa operativo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 dark:bg-slate-800">
            <Navigation size={20} className="text-primary-700 dark:text-primary-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Mapa Operativo
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seguimiento GPS en tiempo real · Chorrillos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badges de estado */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {totalActivos} activos (SSE)
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
              <Car size={12} />
              {totalVehiculos} total
            </span>
          </div>

          {/* SSE conectado */}
          <span
            className={`flex items-center gap-1 text-xs ${
              vehiculosSSE.size > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
            title={vehiculosSSE.size > 0 ? "SSE conectado" : "Sin actualizaciones SSE"}
          >
            {vehiculosSSE.size > 0 ? <Wifi size={14} /> : <WifiOff size={14} />}
          </span>

          {/* Botón actualizar */}
          <button
            type="button"
            onClick={fetchVehiculos}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Última actualización */}
      {lastRefresh && (
        <p className="text-xs text-slate-400 dark:text-slate-500 -mt-2">
          <Clock size={11} className="inline mr-1" />
          Snapshot cargado: {lastRefresh.toLocaleTimeString("es-PE", { timeZone: "America/Lima" })}
          {" · "}Actualizaciones en tiempo real via SSE
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} />
          {error}
          <button
            type="button"
            onClick={fetchVehiculos}
            className="ml-auto text-xs underline hover:no-underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Contenido principal: Mapa + Panel ─────────────────────────────── */}
      <div
        className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4"
        style={{ minHeight: "calc(100vh - 260px)" }}
      >
        {/* ── MAPA ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <MapContainer
            center={CHORRILLOS_CENTER}
            zoom={DEFAULT_ZOOM}
            scrollWheelZoom={true}
            style={{ height: "100%", minHeight: "480px", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Volar al vehículo seleccionado */}
            {flyCenter && <MapFlyTo center={flyCenter} />}

            {/* Marcadores */}
            {vehiculosMerged.map((v) => {
              if (!v.lat || !v.lng) return null;
              const color = getMarkerColor(v);
              const isSelected = selectedId === v.vehiculo_id;
              return (
                <Marker
                  key={v.vehiculo_id}
                  position={[v.lat, v.lng]}
                  icon={createVehicleIcon(color, isSelected)}
                  ref={(ref) => {
                    if (ref) markersRef.current[v.vehiculo_id] = ref;
                  }}
                  eventHandlers={{
                    click: () =>
                      setSelectedId((prev) =>
                        prev === v.vehiculo_id ? null : v.vehiculo_id
                      ),
                  }}
                >
                  <Popup>
                    <div className="text-sm min-w-[170px]">
                      <p className="font-bold text-base mb-1">
                        {v.placa || `Vehículo ${v.vehiculo_id}`}
                      </p>
                      <div className="space-y-0.5 text-slate-600">
                        <p>
                          <span className="font-medium">Estado: </span>
                          <span
                            style={{ color }}
                            className="font-semibold"
                          >
                            {!v.activo
                              ? "Sin señal"
                              : v.velocidad > 0
                              ? "En movimiento"
                              : "Detenido"}
                          </span>
                        </p>
                        {v.velocidad !== null && v.activo && (
                          <p>
                            <span className="font-medium">Velocidad: </span>
                            {Math.round(v.velocidad)} km/h
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Posición: </span>
                          {v.lat.toFixed(6)}, {v.lng.toFixed(6)}
                        </p>
                        <p>
                          <span className="font-medium">Últ. señal: </span>
                          {formatHora(v.timestamp)}
                          {v.timestamp && (() => {
                            const m = minutosDesde(v.timestamp);
                            return m !== null ? ` (hace ${m} min)` : "";
                          })()}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Fuente: {v._fuente === "sse" ? "⚡ SSE" : "📡 API"}
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* ── PANEL LATERAL ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Buscador */}
          <div className="relative">
            <Car
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Buscar por placa..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:focus:ring-primary-400/30"
            />
          </div>

          {/* Leyenda de colores */}
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              En movimiento
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Detenido
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              Sin señal
            </span>
          </div>

          {/* Lista de vehículos */}
          <div
            className="flex flex-col gap-2 overflow-y-auto pr-1"
            style={{ maxHeight: "calc(100vh - 320px)" }}
          >
            {loading && vehiculosMerged.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400 dark:text-slate-500">
                <RefreshCw size={20} className="animate-spin mr-2" />
                Cargando vehículos...
              </div>
            ) : vehiculosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400 dark:text-slate-500">
                <Car size={32} />
                <p className="text-sm">
                  {busqueda
                    ? "Sin resultados para la búsqueda"
                    : "No hay vehículos con señal GPS"}
                </p>
                {!busqueda && (
                  <p className="text-xs text-center">
                    Las posiciones aparecerán cuando los vehículos envíen actualizaciones
                  </p>
                )}
              </div>
            ) : (
              vehiculosFiltrados.map((v) => (
                <VehicleCard
                  key={v.vehiculo_id}
                  v={v}
                  selected={selectedId === v.vehiculo_id}
                  onSelect={handleSelectVehiculo}
                />
              ))
            )}
          </div>

          {/* Contador filtrado */}
          {vehiculosFiltrados.length > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
              {vehiculosFiltrados.length} vehículo
              {vehiculosFiltrados.length !== 1 ? "s" : ""}
              {busqueda ? " encontrados" : " en seguimiento"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
