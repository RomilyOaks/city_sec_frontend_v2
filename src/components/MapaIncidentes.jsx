/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\components\\MapaIncidentes.jsx
 * @version 2.0.0
 * @description Componente de mapa que renderiza incidentes con Leaflet y clusters. Incluye filtros, creación de iconos personalizados y modal de detalle.
 * Documentación educativa: se añadieron JSDoc y comentarios explicativos sin alterar la lógica.
 *
 * @module src/components/MapaIncidentes.jsx
 */

import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Eye } from "lucide-react";
import MarkerClusterGroup from "react-leaflet-cluster";
import NovedadDetalleModal from "./NovedadDetalleModal";
import L from "leaflet";
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

/**
 * createCustomIcon - Crea un icono SVG para marcador de novedad.
 *
 * @param {string} color - Color en formato hex usado en el SVG.
 * @returns {L.DivIcon} Elemento de icono para Leaflet.
 */
const createCustomIcon = (color) => {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      position: relative;
      width: 30px;
      height: 40px;
    ">
      <svg viewBox="0 0 24 36" width="30" height="40" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.4 0 0 5.4 0 12c0 7.2 12 24 12 24s12-16.8 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
        <text x="12" y="15" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">!</text>
      </svg>
    </div>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
};

const PRIORIDAD_COLORS = {
  ALTA: "#ef4444", // Rojo
  MEDIA: "#f59e0b", // Amarillo/Naranja
  BAJA: "#22c55e", // Verde
  default: "#6b7280", // Gris
};

const ESTADO_COLORS = {
  "Pendiente De Registro": "#9ca3af",
  DESPACHADO: "#3b82f6",
  "EN RUTA": "#8b5cf6",
  "EN ATENCION": "#f59e0b",
  CERRADO: "#22c55e",
  CANCELADO: "#ef4444",
  default: "#6b7280",
};

/**
 * ScrollWheelZoomOnFocus - Habilita scroll wheel zoom solo cuando el mapa tiene foco.
 *
 * @component
 * @category Components | Maps
 * @description Añade listeners para habilitar/deshabilitar zoom por scroll cuando el usuario hace foco en el mapa,
 * y aplica estilos visuales de foco para mejorar la accesibilidad.
 * @returns {null}
 */

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

    // Deshabilitar al hacer click fuera (blur)
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        disableZoom();
      }
    });

    return () => {
      container.removeEventListener("click", enableZoom);
      document.removeEventListener("click", disableZoom);
    };
  }, [map]);

  return null;
}

/**
 * FitBounds - Ajusta la vista del mapa para que todas las `novedades` visibles queden dentro de los bounds.
 *
 * @component
 * @category Components | Maps
 * @param {Array} props.novedades - Array de novedades con latitud/longitud válidas
 * @returns {null}
 */

function FitBounds({ novedades }) {
  const map = useMap();

  useEffect(() => {
    if (novedades.length > 0) {
      const validNovedades = novedades.filter((n) => n.latitud && n.longitud);
      if (validNovedades.length > 0) {
        const bounds = L.latLngBounds(
          validNovedades.map((n) => [
            parseFloat(n.latitud),
            parseFloat(n.longitud),
          ])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [novedades, map]);

  return null;
}

/**
 * createClusterCustomIcon - Genera icono personalizado para un cluster.
 *
 * @param {Object} cluster - Cluster de MarkerClusterGroup
 * @returns {L.DivIcon}
 */
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  let size = "small";
  let bgColor = "#3b82f6";

  if (count >= 10) {
    size = "large";
    bgColor = "#ef4444";
  } else if (count >= 5) {
    size = "medium";
    bgColor = "#f59e0b";
  }

  const sizes = {
    small: { width: 30, height: 30, fontSize: 12 },
    medium: { width: 40, height: 40, fontSize: 14 },
    large: { width: 50, height: 50, fontSize: 16 },
  };

  const s = sizes[size];

  return L.divIcon({
    html: `<div style="
      background-color: ${bgColor};
      width: ${s.width}px;
      height: ${s.height}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: ${s.fontSize}px;
      border: 3px solid white;
      box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    ">${count}</div>`,
    className: "custom-cluster-icon",
    iconSize: L.point(s.width, s.height),
  });
};

/**
 * formatFecha - Formatea fecha a string con locale es-PE.
 *
 * @param {string|Date} fecha
 * @returns {string}
 */
const formatFecha = (fecha) => {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * MapaIncidentes - Mapa interactivo de incidentes
 *
 * @version 2.0.0
 * @component
 * @category Components | Maps
 * @param {Object} props
 * @param {Array} props.novedades - Lista de novedades con lat/lng
 * @param {string} [props.height] - Alto del mapa (CSS)
 * @param {Array} [props.center] - Coordenadas iniciales [lat, lng]
 * @param {number} [props.zoom] - Zoom inicial
 * @param {boolean} [props.showFilters] - Mostrar filtros UI
 * @param {Function} [props.onMarkerClick] - Callback al clicar un marcador
 * @returns {JSX.Element}
 */
export default function MapaIncidentes({
  novedades = [],
  height = "500px",
  center = [-12.0464, -77.0428], // Lima, Perú por defecto
  zoom = 12,
  showFilters = false,
  onMarkerClick = null,
}) {
  const [filterPrioridad, setFilterPrioridad] = useState("todas");
  const [filterEstado, setFilterEstado] = useState("todos");

  // Estado para modal de detalle
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [selectedNovedadId, setSelectedNovedadId] = useState(null);
  const [selectedNovedadData, setSelectedNovedadData] = useState(null);

  const filteredNovedades = useMemo(() => {
    let filtered = (novedades || []).filter((n) => n.latitud && n.longitud);

    if (filterPrioridad !== "todas") {
      filtered = filtered.filter((n) => n.prioridad_actual === filterPrioridad);
    }

    if (filterEstado !== "todos") {
      filtered = filtered.filter(
        (n) => n.novedadEstado?.nombre === filterEstado
      );
    }

    return filtered;
  }, [novedades, filterPrioridad, filterEstado]);

  const getMarkerIcon = (novedad) => {
    const prioridad = novedad.prioridad_actual || "default";
    const color = PRIORIDAD_COLORS[prioridad] || PRIORIDAD_COLORS.default;
    return createCustomIcon(color);
  };

  const getEstadoColor = (estado) => {
    return ESTADO_COLORS[estado] || ESTADO_COLORS.default;
  };

  // Obtener estados únicos para el filtro
  const estadosUnicos = [
    ...new Set(novedades.map((n) => n.novedadEstado?.nombre).filter(Boolean)),
  ];

  return (
    <div className="w-full">
      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterPrioridad}
            onChange={(e) => setFilterPrioridad(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="todas">Todas las prioridades</option>
            <option value="ALTA">🔴 Alta</option>
            <option value="MEDIA">🟡 Media</option>
            <option value="BAJA">🟢 Baja</option>
          </select>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="todos">Todos los estados</option>
            {estadosUnicos.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium">{filteredNovedades.length}</span>{" "}
            incidentes en el mapa
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height, width: "100%" }}
          scrollWheelZoom={false}
        >
          <ScrollWheelZoomOnFocus />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds novedades={filteredNovedades} />

          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
            {filteredNovedades.map((novedad) => (
              <Marker
                key={novedad.id}
                position={[
                  parseFloat(novedad.latitud),
                  parseFloat(novedad.longitud),
                ]}
                icon={getMarkerIcon(novedad)}
                eventHandlers={{
                  click: () => onMarkerClick && onMarkerClick(novedad),
                }}
              >
                <Popup>
                  <div className="min-w-[200px] p-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-800">
                        #{novedad.novedad_code || novedad.id}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium text-white"
                        style={{
                          backgroundColor:
                            PRIORIDAD_COLORS[novedad.prioridad_actual] ||
                            PRIORIDAD_COLORS.default,
                        }}
                      >
                        {novedad.prioridad_actual || "N/A"}
                      </span>
                    </div>

                    <div className="text-sm text-slate-700 mb-2">
                      <strong>
                        {novedad.novedadTipoNovedad?.nombre || "Sin tipo"}
                      </strong>
                      {novedad.novedadSubtipoNovedad?.nombre && (
                        <span className="text-slate-500">
                          {" "}
                          - {novedad.novedadSubtipoNovedad.nombre}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: getEstadoColor(
                              novedad.novedadEstado?.nombre
                            ),
                          }}
                        ></span>
                        <span>
                          {novedad.novedadEstado?.nombre || "Sin estado"}
                        </span>
                      </div>

                      {novedad.direccion && (
                        <div className="truncate" title={novedad.direccion}>
                          📍 {novedad.direccion}
                        </div>
                      )}

                      <div>🕐 {formatFecha(novedad.fecha_hora_ocurrencia)}</div>
                    </div>

                    {/* Priorizar localizacion + referencia, fallback a descripcion */}
                    {(novedad.localizacion ||
                      novedad.referencia_ubicacion ||
                      novedad.descripcion) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-600 line-clamp-2">
                        {novedad.localizacion || novedad.referencia_ubicacion
                          ? `${novedad.localizacion || ""}${
                              novedad.localizacion &&
                              novedad.referencia_ubicacion
                                ? " - "
                                : ""
                            }${novedad.referencia_ubicacion || ""}`
                          : novedad.descripcion}
                      </div>
                    )}

                    {/* Botón para ver detalle */}
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedNovedadId(novedad.id);
                          setSelectedNovedadData(novedad);
                          setShowDetalleModal(true);
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <Eye size={14} />
                        Ver detalle completo
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        <span className="font-medium">Prioridad:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Alta
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-amber-500"></span> Media
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> Baja
        </div>
      </div>

      {/* Modal de detalle de novedad */}
      <NovedadDetalleModal
        novedadId={selectedNovedadId}
        novedad={selectedNovedadData}
        isOpen={showDetalleModal}
        onClose={() => {
          setShowDetalleModal(false);
          setSelectedNovedadId(null);
          setSelectedNovedadData(null);
        }}
      />
    </div>
  );
}
