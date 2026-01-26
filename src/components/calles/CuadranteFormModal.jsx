/**
 * File: src/components/calles/CuadranteFormModal.jsx
 * @version 5.0.0
 * @description Modal para crear/editar cuadrantes con tabs, navegación por teclado, color picker y visualización de mapa
 */

import { useState, useEffect, useMemo } from "react";
import { X, MapPin, FileText, Map } from "lucide-react";
import { MapContainer, TileLayer, Polygon, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createCuadrante, updateCuadrante } from "../../services/cuadrantesService";
import { listSectores } from "../../services/sectoresService";
import toast from "react-hot-toast";

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
      // Filtrar coordenadas válidas
      const validPositions = positions.filter(
        (pos) => Array.isArray(pos) &&
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

// Componente para visualizar el mapa con el polígono
function MapaVisualizacion({ poligonoJson, latitud, longitud, colorMapa, nombre }) {
  // Parsear el polígono JSON
  const polygonPositions = useMemo(() => {
    if (!poligonoJson) return null;

    try {
      const parsed = typeof poligonoJson === "string" ? JSON.parse(poligonoJson) : poligonoJson;

      // Soportar diferentes formatos de GeoJSON
      let coordinates = null;

      if (parsed.type === "Polygon" && parsed.coordinates) {
        coordinates = parsed.coordinates[0]; // Primera anilla del polígono
      } else if (parsed.type === "Feature" && parsed.geometry?.type === "Polygon") {
        coordinates = parsed.geometry.coordinates[0];
      } else if (Array.isArray(parsed)) {
        // Verificar si es array de arrays (coordenadas directas)
        if (parsed.length > 0 && Array.isArray(parsed[0])) {
          // Podría ser [[lng, lat], ...] o [[[lng, lat], ...]] (anidado extra)
          if (Array.isArray(parsed[0][0])) {
            coordinates = parsed[0]; // Desanidar un nivel
          } else {
            coordinates = parsed;
          }
        }
      }

      if (coordinates && coordinates.length > 0) {
        // GeoJSON usa [lng, lat], Leaflet usa [lat, lng]
        // Filtrar y validar coordenadas
        const validCoords = coordinates
          .filter(coord =>
            Array.isArray(coord) &&
            coord.length >= 2 &&
            typeof coord[0] === "number" &&
            typeof coord[1] === "number" &&
            !isNaN(coord[0]) &&
            !isNaN(coord[1])
          )
          .map(coord => [coord[1], coord[0]]);

        return validCoords.length > 0 ? validCoords : null;
      }
    } catch (e) {
      console.error("Error parsing polygon JSON:", e);
    }
    return null;
  }, [poligonoJson]);

  // Centro del mapa
  const center = useMemo(() => {
    if (latitud && longitud) {
      return [parseFloat(latitud), parseFloat(longitud)];
    }
    // Surco, Lima por defecto
    return [-12.1328, -76.9853];
  }, [latitud, longitud]);

  const hasPolygon = polygonPositions && polygonPositions.length > 0;
  const hasCenter = latitud && longitud;

  if (!hasPolygon && !hasCenter) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
        <Map size={48} className="mb-3 opacity-50" />
        <p className="text-center">
          No hay datos de ubicación para mostrar.<br />
          <span className="text-sm">Ingrese coordenadas o un polígono en la pestaña "Georeferenciados".</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Vista previa del cuadrante
        </p>
        {hasPolygon && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {polygonPositions.length} puntos en el polígono
          </span>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: "350px", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBoundsToPolygon positions={polygonPositions} center={center} />

          {/* Mostrar polígono si existe */}
          {hasPolygon && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: colorMapa || "#108981",
                fillColor: colorMapa || "#108981",
                fillOpacity: 0.3,
                weight: 3,
              }}
            />
          )}

          {/* Mostrar marcador en el centro si hay coordenadas */}
          {hasCenter && <Marker position={center} />}
        </MapContainer>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
        {hasPolygon && (
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border"
              style={{
                backgroundColor: colorMapa || "#108981",
                opacity: 0.5,
                borderColor: colorMapa || "#108981",
              }}
            />
            <span>Área del cuadrante {nombre && `"${nombre}"`}</span>
          </div>
        )}
        {hasCenter && (
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span>Centro: {parseFloat(latitud).toFixed(6)}, {parseFloat(longitud).toFixed(6)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CuadranteFormModal({ isOpen, onClose, cuadrante, onSuccess, preselectedSectorId }) {
  const [activeTab, setActiveTab] = useState("basicos");
  const [formData, setFormData] = useState({
    cuadrante_code: "",
    nombre: "",
    sector_id: "",
    zona_code: "",
    latitud: "",
    longitud: "",
    poligono_json: "",
    radio_metros: "",
    color_mapa: "#108981",
  });
  const [sectores, setSectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSectores, setLoadingSectores] = useState(false);

  // Cargar sectores
  useEffect(() => {
    if (isOpen) {
      loadSectores();
    }
  }, [isOpen]);

  const loadSectores = async () => {
    setLoadingSectores(true);
    try {
      const result = await listSectores({ limit: 100 });
      setSectores(result.items || []);
    } catch (error) {
      console.error("Error al cargar sectores:", error);
      toast.error("Error al cargar sectores");
    } finally {
      setLoadingSectores(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return; // Solo ejecutar cuando el modal se abre

    if (cuadrante) {
      // Convertir poligono_json a string si viene como objeto
      let poligonoStr = "";
      if (cuadrante.poligono_json) {
        poligonoStr = typeof cuadrante.poligono_json === "string"
          ? cuadrante.poligono_json
          : JSON.stringify(cuadrante.poligono_json, null, 2);
      }

      setFormData({
        cuadrante_code: cuadrante.cuadrante_code || cuadrante.codigo || "",
        nombre: cuadrante.nombre || "",
        sector_id: cuadrante.sector_id || "",
        zona_code: cuadrante.zona_code || "",
        latitud: cuadrante.latitud || "",
        longitud: cuadrante.longitud || "",
        poligono_json: poligonoStr,
        radio_metros: cuadrante.radio_metros || "",
        color_mapa: cuadrante.color_mapa || "#108981",
      });
    } else {
      setFormData({
        cuadrante_code: "",
        nombre: "",
        sector_id: preselectedSectorId || "",
        zona_code: "",
        latitud: "",
        longitud: "",
        poligono_json: "",
        radio_metros: "",
        color_mapa: "#108981",
      });
    }
    setActiveTab("basicos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuadrante, isOpen]);

  // Autofocus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById("cuadrante-codigo")?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleClose = () => {
    setFormData({
      cuadrante_code: "",
      nombre: "",
      sector_id: "",
      zona_code: "",
      latitud: "",
      longitud: "",
      poligono_json: "",
      radio_metros: "",
      color_mapa: "#108981",
    });
    setActiveTab("basicos");
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      // ESC para cerrar
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      // ALT+G para guardar
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        document.getElementById("submit-cuadrante-btn")?.click();
      }
      // PageDown para ir al tab derecho (georeferenciados)
      if (e.key === "PageDown") {
        e.preventDefault();
        setActiveTab("georeferenciados");
      }
      // PageUp para ir al tab izquierdo (basicos)
      if (e.key === "PageUp") {
        e.preventDefault();
        setActiveTab("basicos");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos para envío (sin incluir descripcion)
      const dataToSend = {
        cuadrante_code: formData.cuadrante_code,
        nombre: formData.nombre,
        sector_id: parseInt(formData.sector_id),
        zona_code: formData.zona_code || null,
        latitud: formData.latitud ? parseFloat(formData.latitud) : null,
        longitud: formData.longitud ? parseFloat(formData.longitud) : null,
        poligono_json: formData.poligono_json || null,
        radio_metros: formData.radio_metros ? parseFloat(formData.radio_metros) : null,
        color_mapa: formData.color_mapa || "#108981",
      };

      if (cuadrante) {
        await updateCuadrante(cuadrante.id, dataToSend);
        toast.success("Cuadrante actualizado correctamente");
      } else {
        await createCuadrante(dataToSend);
        toast.success("Cuadrante creado correctamente");
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error al guardar cuadrante:", error);
      toast.error(
        error.response?.data?.message || "Error al guardar el cuadrante"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {cuadrante ? "Editar Cuadrante" : "Nuevo Cuadrante"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Cerrar (ESC)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-[73px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 z-10">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("basicos")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "basicos"
                  ? "border-primary-700 text-primary-700 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Re Pag"
            >
              <FileText size={18} />
              <span>Datos Básicos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("georeferenciados")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "georeferenciados"
                  ? "border-primary-700 text-primary-700 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Av Pag"
            >
              <MapPin size={18} />
              <span>Georeferenciados</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mapa")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "mapa"
                  ? "border-primary-700 text-primary-700 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Ver Mapa"
            >
              <Map size={18} />
              <span>Mapa</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab: Datos Básicos */}
          {activeTab === "basicos" && (
            <div className="space-y-4">
              {/* Código */}
              <div>
                <label
                  htmlFor="cuadrante-codigo"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cuadrante-codigo"
                  name="cuadrante_code"
                  value={formData.cuadrante_code}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: C01"
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="cuadrante-nombre"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cuadrante-nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Cuadrante Norte"
                />
              </div>

              {/* Sector */}
              <div>
                <label
                  htmlFor="cuadrante-sector"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Sector <span className="text-red-500">*</span>
                </label>
                <select
                  id="cuadrante-sector"
                  name="sector_id"
                  value={formData.sector_id}
                  onChange={handleChange}
                  required
                  disabled={loadingSectores || (!!preselectedSectorId && !cuadrante)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">
                    {loadingSectores ? "Cargando..." : "Seleccione un sector"}
                  </option>
                  {sectores.map((sector) => (
                    <option key={sector.id} value={sector.id}>
                      {sector.sector_code || sector.codigo} - {sector.nombre}
                    </option>
                  ))}
                </select>
                {preselectedSectorId && !cuadrante && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    El sector está preseleccionado según el sector actual
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Datos Georeferenciados */}
          {activeTab === "georeferenciados" && (
            <div className="space-y-4">
              {/* Zona Code */}
              <div>
                <label
                  htmlFor="cuadrante-zona"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código de Zona
                </label>
                <input
                  type="text"
                  id="cuadrante-zona"
                  name="zona_code"
                  value={formData.zona_code}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Z01"
                />
              </div>

              {/* Coordenadas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cuadrante-latitud"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Latitud
                  </label>
                  <input
                    type="number"
                    id="cuadrante-latitud"
                    name="latitud"
                    value={formData.latitud}
                    onChange={handleChange}
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: -12.046374"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cuadrante-longitud"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Longitud
                  </label>
                  <input
                    type="number"
                    id="cuadrante-longitud"
                    name="longitud"
                    value={formData.longitud}
                    onChange={handleChange}
                    step="any"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ej: -77.042793"
                  />
                </div>
              </div>

              {/* Radio en metros */}
              <div>
                <label
                  htmlFor="cuadrante-radio"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Radio (metros)
                </label>
                <input
                  type="number"
                  id="cuadrante-radio"
                  name="radio_metros"
                  value={formData.radio_metros}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: 500"
                />
              </div>

              {/* Color de Mapa */}
              <div>
                <label
                  htmlFor="cuadrante-color"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Color en Mapa
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    id="cuadrante-color"
                    name="color_mapa"
                    value={formData.color_mapa}
                    onChange={handleChange}
                    className="h-10 w-20 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color_mapa}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_mapa: e.target.value }))}
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    placeholder="#108981"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: formData.color_mapa }}
                    title="Vista previa del color"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Color que se mostrará en el mapa para este cuadrante
                </p>
              </div>

              {/* Polígono JSON */}
              <div>
                <label
                  htmlFor="cuadrante-poligono"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Polígono (JSON)
                </label>
                <textarea
                  id="cuadrante-poligono"
                  name="poligono_json"
                  value={formData.poligono_json}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder='{"type":"Polygon","coordinates":[...]}'
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Formato GeoJSON del polígono que delimita el cuadrante
                </p>
              </div>
            </div>
          )}

          {/* Tab: Mapa */}
          {activeTab === "mapa" && (
            <MapaVisualizacion
              poligonoJson={formData.poligono_json}
              latitud={formData.latitud}
              longitud={formData.longitud}
              colorMapa={formData.color_mapa}
              nombre={formData.nombre}
            />
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="submit-cuadrante-btn"
              className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              title="Guardar (ALT+G)"
            >
              {loading ? "Guardando..." : cuadrante ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
