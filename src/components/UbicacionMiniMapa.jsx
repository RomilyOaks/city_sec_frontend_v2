/**
 * File: src/components/UbicacionMiniMapa.jsx
 * @version 2.0.0
 * @description Componente reutilizable de mini mapa para mostrar una ubicación con marcador.
 *              Soporta modo editable para ajustar la ubicación haciendo clic o arrastrando el pin.
 * @module src/components/UbicacionMiniMapa.jsx
 */

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Crosshair, Check, X } from "lucide-react";
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

// Componente para habilitar scroll zoom solo al hacer click en el mapa
function ScrollWheelZoomOnFocus() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    const enableZoom = () => {
      map.scrollWheelZoom.enable();
      container.style.cursor = "grab";
    };

    const disableZoom = () => {
      map.scrollWheelZoom.disable();
      container.style.cursor = "default";
    };

    // Inicialmente deshabilitado
    map.scrollWheelZoom.disable();

    // Habilitar al hacer click dentro del mapa
    container.addEventListener("click", enableZoom);
    container.addEventListener("mouseenter", () => {
      container.style.outline = "2px solid #3b82f6";
      container.style.outlineOffset = "-2px";
    });
    container.addEventListener("mouseleave", () => {
      disableZoom();
      container.style.outline = "none";
    });

    // Deshabilitar al hacer click fuera
    const handleOutsideClick = (e) => {
      if (!container.contains(e.target)) {
        disableZoom();
      }
    };
    document.addEventListener("click", handleOutsideClick);

    return () => {
      container.removeEventListener("click", enableZoom);
      document.removeEventListener("click", handleOutsideClick);
    };
  }, [map]);

  return null;
}

// Componente para capturar clicks en el mapa (solo en modo edición)
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Componente para cambiar el cursor del mapa en modo edición
function EditCursor({ isEditing }) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (isEditing) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
    return () => {
      container.style.cursor = "";
    };
  }, [isEditing, map]);

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
 * @param {boolean} [props.editable=false] - Habilitar modo de edición (click/drag para reposicionar)
 * @param {Function} [props.onCoordinatesChange] - Callback(lat, lng) al confirmar nueva ubicación
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
  editable = false,
  onCoordinatesChange,
}) {
  // Parsear coordenadas
  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);

  // Estado de edición
  const [isEditing, setIsEditing] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);
  const markerRef = useRef(null);

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

  // Posición actual del marcador (temporal si está editando, original si no)
  const markerPosition = useMemo(() => {
    if (tempCoords) return tempCoords;
    return center;
  }, [tempCoords, center]);

  // Seleccionar icono según color
  const markerIcon = useMemo(() => {
    if (markerColor === "red") return redIcon;
    return undefined; // Usa el icono por defecto (azul)
  }, [markerColor]);

  // Handler de click en el mapa
  const handleMapClick = useCallback((clickLat, clickLng) => {
    setTempCoords([clickLat, clickLng]);
  }, []);

  // Handler de drag end del marcador
  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const pos = marker.getLatLng();
      setTempCoords([pos.lat, pos.lng]);
    }
  }, []);

  // Confirmar nueva ubicación
  const handleConfirm = useCallback(() => {
    if (tempCoords && onCoordinatesChange) {
      onCoordinatesChange(tempCoords[0], tempCoords[1]);
    }
    setIsEditing(false);
    setTempCoords(null);
  }, [tempCoords, onCoordinatesChange]);

  // Cancelar edición
  const handleCancel = useCallback(() => {
    setTempCoords(null);
    setIsEditing(false);
  }, []);

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
        className={`rounded-lg overflow-hidden shadow-sm transition-all ${
          isEditing
            ? "border-2 border-blue-500 dark:border-blue-400"
            : "border border-slate-200 dark:border-slate-700"
        }`}
        style={{ height }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={false}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <ScrollWheelZoomOnFocus />
          <RecenterMap center={tempCoords || center} zoom={zoom} />

          {/* Captura de clicks solo en modo edición */}
          {isEditing && <MapClickHandler onMapClick={handleMapClick} />}
          {editable && <EditCursor isEditing={isEditing} />}

          <Marker
            position={markerPosition}
            icon={markerIcon}
            draggable={isEditing}
            ref={markerRef}
            eventHandlers={
              isEditing
                ? { dragend: handleDragEnd }
                : {}
            }
          />
        </MapContainer>
      </div>

      {/* Controles de edición */}
      {editable && (
        <div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Crosshair size={16} />
              Ajustar Ubicación
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Haz clic en el mapa o arrastra el marcador para ajustar la ubicación
              </p>
              {tempCoords && (
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Nueva posición: {tempCoords[0].toFixed(6)}, {tempCoords[1].toFixed(6)}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!tempCoords}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check size={16} />
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
