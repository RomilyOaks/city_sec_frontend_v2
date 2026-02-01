/**
 * File: src/components/calles/CuadranteMapaModal.jsx
 * @version 1.0.0
 * @description Modal reutilizable para visualizar el mapa de un cuadrante
 */

import { useState, useEffect, useMemo } from "react";
import { X, MapPin, Map, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCuadranteById } from "../../services/cuadrantesService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

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

// Componente para ajustar bounds del mapa al polígono
function FitBoundsToPolygon({ positions, center }) {
  const map = useMap();

  useEffect(() => {
    if (positions && positions.length > 0) {
      const validPositions = positions.filter(
        (pos) =>
          Array.isArray(pos) &&
          pos.length >= 2 &&
          typeof pos[0] === "number" &&
          typeof pos[1] === "number" &&
          !isNaN(pos[0]) &&
          !isNaN(pos[1])
      );

      if (validPositions.length > 0) {
        try {
          const bounds = L.latLngBounds(validPositions);
          map.fitBounds(bounds, { padding: [30, 30] });
        } catch (e) {
          console.error("Error fitting bounds:", e);
          if (center) map.setView(center, 15);
        }
      } else if (center) {
        map.setView(center, 15);
      }
    } else if (center) {
      map.setView(center, 15);
    }
  }, [positions, center, map]);

  return null;
}

// Función para calcular el centroide de un polígono
function calcularCentroide(positions) {
  if (!positions || positions.length === 0) return null;

  let sumLat = 0;
  let sumLng = 0;
  const n = positions.length;

  for (const pos of positions) {
    sumLat += pos[0];
    sumLng += pos[1];
  }

  return [sumLat / n, sumLng / n];
}

// Función para parsear polígono JSON a posiciones Leaflet
function parsePolygonJson(poligonoJson) {
  if (!poligonoJson) return null;

  try {
    const parsed =
      typeof poligonoJson === "string" ? JSON.parse(poligonoJson) : poligonoJson;

    let coordinates = null;

    if (parsed.type === "Polygon" && parsed.coordinates) {
      coordinates = parsed.coordinates[0];
    } else if (parsed.type === "Feature" && parsed.geometry?.type === "Polygon") {
      coordinates = parsed.geometry.coordinates[0];
    } else if (Array.isArray(parsed)) {
      if (parsed.length > 0 && Array.isArray(parsed[0])) {
        if (Array.isArray(parsed[0][0])) {
          coordinates = parsed[0];
        } else {
          coordinates = parsed;
        }
      }
    }

    if (coordinates && coordinates.length > 0) {
      const validCoords = coordinates
        .filter(
          (coord) =>
            Array.isArray(coord) &&
            coord.length >= 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number" &&
            !isNaN(coord[0]) &&
            !isNaN(coord[1])
        )
        .map((coord) => [coord[1], coord[0]]);

      return validCoords.length > 0 ? validCoords : null;
    }
  } catch (e) {
    console.error("Error parsing polygon JSON:", e);
  }
  return null;
}

/**
 * CuadranteMapaModal - Modal para visualizar el mapa de un cuadrante
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Object} props.cuadrante - Objeto cuadrante completo (opcional)
 * @param {number} props.cuadranteId - ID del cuadrante a cargar (opcional)
 */
export default function CuadranteMapaModal({
  isOpen,
  onClose,
  cuadrante: cuadranteProp = null,
  cuadranteId = null,
}) {
  const [cuadrante, setCuadrante] = useState(cuadranteProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // Cargar cuadrante por ID si no se pasa el objeto completo
  useEffect(() => {
    if (!isOpen) return;

    if (cuadranteProp) {
      setCuadrante(cuadranteProp);
      setError(null);
    } else if (cuadranteId) {
      loadCuadrante(cuadranteId);
    }
  }, [isOpen, cuadranteProp, cuadranteId]);

  const loadCuadrante = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCuadranteById(id);
      setCuadrante(data);
    } catch (err) {
      console.error("Error cargando cuadrante:", err);
      setError("Error al cargar el cuadrante");
    } finally {
      setLoading(false);
    }
  };

  // Parsear polígono
  const polygonPositions = useMemo(
    () => parsePolygonJson(cuadrante?.poligono_json),
    [cuadrante?.poligono_json]
  );

  // Calcular centro
  const center = useMemo(() => {
    if (polygonPositions && polygonPositions.length > 0) {
      const centroide = calcularCentroide(polygonPositions);
      if (centroide) return centroide;
    }
    if (cuadrante?.latitud && cuadrante?.longitud) {
      return [parseFloat(cuadrante.latitud), parseFloat(cuadrante.longitud)];
    }
    return [-12.1328, -76.9853]; // Surco, Lima por defecto
  }, [polygonPositions, cuadrante?.latitud, cuadrante?.longitud]);

  const hasPolygon = polygonPositions && polygonPositions.length > 0;
  const colorMapa = cuadrante?.color_mapa || "#108981";

  // Keyboard: ESC para cerrar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${colorMapa}20` }}
            >
              <Map size={24} style={{ color: colorMapa }} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {cuadrante?.nombre || "Mapa del Cuadrante"}
              </h2>
              {cuadrante?.cuadrante_code && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Código: {cuadrante.cuadrante_code}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Cerrar (ESC)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 size={40} className="animate-spin text-primary-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">Cargando mapa...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <Map size={48} className="mb-3 opacity-50" />
              <p>{error}</p>
            </div>
          ) : !hasPolygon && !cuadrante?.latitud ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
              <Map size={48} className="mb-3 opacity-50" />
              <p className="text-center">
                Este cuadrante no tiene datos de ubicación.
                <br />
                <span className="text-sm">
                  Edite el cuadrante para agregar coordenadas o un polígono.
                </span>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mapa */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                <MapContainer
                  center={center}
                  zoom={15}
                  style={{ height: "400px", width: "100%" }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <FitBoundsToPolygon positions={polygonPositions} center={center} />

                  {hasPolygon && (
                    <Polygon
                      positions={polygonPositions}
                      pathOptions={{
                        color: colorMapa,
                        fillColor: colorMapa,
                        fillOpacity: 0.3,
                        weight: 3,
                        opacity: 0.9,
                        lineCap: "round",
                        lineJoin: "round",
                        dashArray: null,
                      }}
                    />
                  )}

                  <Marker position={center} />
                </MapContainer>
              </div>

              {/* Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                {hasPolygon && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: colorMapa,
                        opacity: 0.5,
                        borderColor: colorMapa,
                      }}
                    />
                    <span>
                      Área del cuadrante ({polygonPositions.length} puntos)
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>
                    Centro: {center[0].toFixed(6)}, {center[1].toFixed(6)}
                  </span>
                </div>
                {cuadrante?.sector?.nombre && (
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <span>Sector: {cuadrante.sector.nombre}</span>
                  </div>
                )}
                {cuadrante?.cuadrante_code && (
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <span>Código Cuadrante: {cuadrante.cuadrante_code}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
