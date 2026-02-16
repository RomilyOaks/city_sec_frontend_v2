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
import { listSubsectoresBySector } from "../../services/subsectoresService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
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
    const parsed = typeof poligonoJson === "string" ? JSON.parse(poligonoJson) : poligonoJson;

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
}

// Componente para visualizar el mapa con el polígono
function MapaVisualizacion({ poligonoJson, latitud, longitud, colorMapa, nombre }) {
  // Parsear el polígono JSON
  const polygonPositions = useMemo(() => parsePolygonJson(poligonoJson), [poligonoJson]);

  // Calcular centro: prioridad al centroide del polígono, luego lat/lng manuales
  const center = useMemo(() => {
    // Si hay polígono, calcular su centroide
    if (polygonPositions && polygonPositions.length > 0) {
      const centroide = calcularCentroide(polygonPositions);
      if (centroide) return centroide;
    }
    // Si hay coordenadas manuales
    if (latitud && longitud) {
      return [parseFloat(latitud), parseFloat(longitud)];
    }
    // Surco, Lima por defecto
    return [-12.1328, -76.9853];
  }, [polygonPositions, latitud, longitud]);

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
                fillOpacity: 0.2,
                weight: 3,
                opacity: 0.7,
              }}
            />
          )}

          {/* Mostrar marcador en el centro calculado */}
          <Marker position={center} />
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
        <div className="flex items-center gap-2">
          <MapPin size={14} />
          <span>Centro: {center[0].toFixed(6)}, {center[1].toFixed(6)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CuadranteFormModal({ isOpen, onClose, cuadrante, onSuccess, preselectedSectorId, preselectedSubsectorId }) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState("basicos");
  const [formData, setFormData] = useState({
    cuadrante_code: "",
    nombre: "",
    sector_id: "",
    subsector_id: "",
    referencia: "",
    zona_code: "",
    latitud: "",
    longitud: "",
    poligono_json: "",
    radio_metros: "",
    color_mapa: "#108981",
  });
  const [sectores, setSectores] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSectores, setLoadingSectores] = useState(false);
  const [loadingSubsectores, setLoadingSubsectores] = useState(false);

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

  // Cargar subsectores cuando cambia el sector
  useEffect(() => {
    if (formData.sector_id) {
      loadSubsectores(formData.sector_id);
    } else {
      setSubsectores([]);
    }
  }, [formData.sector_id]);

  const loadSubsectores = async (sectorId) => {
    setLoadingSubsectores(true);
    try {
      const result = await listSubsectoresBySector(sectorId, { limit: 100 });
      setSubsectores(result.items || []);
    } catch (error) {
      console.error("Error al cargar subsectores:", error);
      setSubsectores([]);
    } finally {
      setLoadingSubsectores(false);
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
        subsector_id: cuadrante.subsector_id || "",
        referencia: cuadrante.referencia || "",
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
        subsector_id: preselectedSubsectorId || "",
        referencia: "",
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
      subsector_id: "",
      referencia: "",
      zona_code: "",
      latitud: "",
      longitud: "",
      poligono_json: "",
      radio_metros: "",
      color_mapa: "#108981",
    });
    setSubsectores([]);
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
      // Validar campos requeridos
      if (!formData.sector_id) {
        toast.error("Debe seleccionar un sector");
        setLoading(false);
        return;
      }

      if (!formData.subsector_id) {
        toast.error("Debe seleccionar un subsector");
        setLoading(false);
        return;
      }

      // Parsear IDs
      const sectorId = Number(formData.sector_id);
      const subsectorId = Number(formData.subsector_id);

      // Validar que sean números válidos
      if (isNaN(sectorId) || sectorId <= 0) {
        toast.error("ID de sector inválido");
        setLoading(false);
        return;
      }

      if (isNaN(subsectorId) || subsectorId <= 0) {
        toast.error("ID de subsector inválido");
        setLoading(false);
        return;
      }

      // Calcular lat/lng desde el polígono si no están definidos
      let latitud = formData.latitud ? parseFloat(formData.latitud) : null;
      let longitud = formData.longitud ? parseFloat(formData.longitud) : null;

      if ((!latitud || !longitud) && formData.poligono_json) {
        const polygonPositions = parsePolygonJson(formData.poligono_json);
        if (polygonPositions && polygonPositions.length > 0) {
          const centroide = calcularCentroide(polygonPositions);
          if (centroide) {
            latitud = centroide[0];
            longitud = centroide[1];
          }
        }
      }

      // Preparar datos para envío
      const dataToSend = {
        cuadrante_code: formData.cuadrante_code,
        nombre: formData.nombre,
        sector_id: sectorId,
        subsector_id: subsectorId,
        referencia: formData.referencia?.trim() || null,
        zona_code: formData.zona_code || null,
        latitud: latitud,
        longitud: longitud,
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
      
      // Manejar errores de validación específicos
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => 
          `${err.field}: ${err.message}`
        ).join('\n');
        
        toast.error(`Errores de validación:\n${errorMessages}`, {
          duration: 8000,
          style: {
            whiteSpace: 'pre-line',
            maxWidth: '500px'
          }
        });
      } else {
        // Error genérico
        const errorMessage = error.response?.data?.message || 
                         error.message || 
                         "Error al guardar el cuadrante";
        toast.error(errorMessage);
      }
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
                  onChange={(e) => {
                    handleChange(e);
                    // Limpiar subsector al cambiar de sector
                    setFormData(prev => ({ ...prev, sector_id: e.target.value, subsector_id: "" }));
                  }}
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

              {/* Subsector */}
              <div>
                <label
                  htmlFor="cuadrante-subsector"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Subsector <span className="text-red-500">*</span>
                </label>
                <select
                  id="cuadrante-subsector"
                  name="subsector_id"
                  value={formData.subsector_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.sector_id || loadingSubsectores || (!!preselectedSubsectorId && !cuadrante)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">
                    {!formData.sector_id
                      ? "Primero seleccione un sector"
                      : loadingSubsectores
                      ? "Cargando..."
                      : subsectores.length === 0
                      ? "No hay subsectores disponibles"
                      : "Seleccione un subsector"}
                  </option>
                  {subsectores.map((subsector) => (
                    <option key={subsector.id} value={subsector.id}>
                      {subsector.subsector_code} - {subsector.nombre}
                    </option>
                  ))}
                </select>
                {preselectedSubsectorId && !cuadrante && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    El subsector está preseleccionado según el subsector actual
                  </p>
                )}
              </div>

              {/* Referencia */}
              <div>
                <label
                  htmlFor="cuadrante-referencia"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Referencia
                </label>
                <textarea
                  id="cuadrante-referencia"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descripción o referencia del cuadrante..."
                />
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
