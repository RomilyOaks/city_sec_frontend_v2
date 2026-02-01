/**
 * File: src/components/UbicacionMiniMapa.jsx
 * @version 1.0.0
 * @description Componente reutilizable de mini mapa para mostrar una ubicación con marcador
 * @module src/components/UbicacionMiniMapa.jsx
 */

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix para iconos de Leaflet en React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Icono personalizado rojo para el marcador
const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Componente para centrar el mapa cuando cambian las coordenadas
function RecenterMap({ center, zoom }) {
  const map = useMap();

  useMemo(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

/**
 * UbicacionMiniMapa - Componente reutilizable para mostrar ubicación en un mapa
 *
 * @param {Object} props
 * @param {number|string} props.latitud - Latitud de la ubicación
 * @param {number|string} props.longitud - Longitud de la ubicación
 * @param {number} [props.zoom=16] - Nivel de zoom del mapa
 * @param {string} [props.height="250px"] - Altura del contenedor del mapa
 * @param {boolean} [props.showCoordinates=true] - Mostrar coordenadas debajo del mapa
 * @param {string} [props.markerColor="red"] - Color del marcador (red, blue, default)
 * @param {string} [props.className=""] - Clases CSS adicionales
 * @returns {JSX.Element}
 */
export default function UbicacionMiniMapa({
  latitud,
  longitud,
  zoom = 16,
  height = "250px",
  showCoordinates = true,
  markerColor = "red",
  className = "",
}) {
  // Parsear coordenadas
  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);

  // Validar coordenadas
  const hasValidCoords =
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat !== 0 &&
    lng !== 0 &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  const center = useMemo(() => {
    if (hasValidCoords) {
      return [lat, lng];
    }
    return null;
  }, [lat, lng, hasValidCoords]);

  // Seleccionar icono según color
  const markerIcon = useMemo(() => {
    if (markerColor === "red") return redIcon;
    return undefined; // Usa el icono por defecto (azul)
  }, [markerColor]);

  // Si no hay coordenadas válidas, mostrar mensaje
  if (!hasValidCoords) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
        style={{ height }}
      >
        <MapPin size={32} className="text-slate-400 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
          Sin coordenadas disponibles
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Mapa */}
      <div
        className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm"
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <RecenterMap center={center} zoom={zoom} />

          <Marker position={center} icon={markerIcon} />
        </MapContainer>
      </div>

      {/* Coordenadas */}
      {showCoordinates && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MapPin size={14} />
          <span>
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}
