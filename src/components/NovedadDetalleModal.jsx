/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\components\\NovedadDetalleModal.jsx
 * @version 2.0.0
 * @description Modal que muestra detalle completo de una novedad, incluyendo historial y tabs para datos, ubicación, reportante y seguimiento.
 * Documentación educativa: se añadieron JSDoc y helpers explicativos.
 *
 * @module src/components/NovedadDetalleModal.jsx
 */

import { useEffect, useState } from "react";
import {
  X,
  FileText,
  MapPin,
  User,
  Users,
  Clock,
  Phone,
  Bell,
  Camera,
  Car,
  Shield,
  Radio,
  Truck,
} from "lucide-react";
import {
  getNovedadById,
  getHistorialEstados,
} from "../services/novedadesService";
import UbicacionMiniMapa from "./UbicacionMiniMapa";

const ORIGEN_LLAMADA_OPTIONS = [
  { value: "TELEFONO_107", label: "Teléfono 107", icon: Phone },
  { value: "BOTON_PANICO", label: "Botón de Pánico", icon: Bell },
  { value: "CAMARA", label: "Cámara", icon: Camera },
  { value: "PATRULLAJE", label: "Patrullaje", icon: Car },
  { value: "CIUDADANO", label: "Ciudadano", icon: Users },
  {
    value: "INTERVENCION_DIRECTA",
    label: "Intervención Directa",
    icon: Shield,
  },
  { value: "OTROS", label: "Otros", icon: Radio },
];

/**
 * formatFecha - Formatea fecha/hora a formato legible (es-PE).
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
 * prioridadColor - Devuelve clases CSS según nivel de prioridad.
 *
 * @param {string} prioridad
 * @returns {string}
 */
const prioridadColor = (prioridad) => {
  switch (prioridad) {
    case "ALTA":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "MEDIA":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "BAJA":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  }
};

/**
 * estadoColor - Devuelve clases CSS o estilo inline para representar el color de un estado.
 *
 * @param {Object|null} estado
 * @returns {string|Object}
 */
const estadoColor = (estado) => {
  if (!estado)
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  if (estado.color_hex) {
    return {
      backgroundColor: `${estado.color_hex}20`,
      color: estado.color_hex,
    };
  }
  return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
};

/**
 * NovedadDetalleModal - Modal de detalle de novedad
 *
 * @version 2.2.0
 * @component
 * @category Components | Modals
 * @description Muestra información completa de una novedad e historial de cambios de estado. Si no se pasa `novedad` cargará los datos desde `getNovedadById`.
 *
 * @param {Object} props
 * @param {number|string} [props.novedadId] - ID de la novedad a cargar
 * @param {Object|null} [props.novedad] - Objeto novedad inicial (opcional)
 * @param {boolean} props.isOpen - Indica si el modal está abierto
 * @param {Function} props.onClose - Callback para cerrar el modal
 * @param {Function} [props.onDespachar] - Callback para abrir modal de despacho (solo si estado_novedad_id === 1)
 * @param {boolean} [props.showDespacharButton=false] - Mostrar botón Despachar (true solo desde Truck, false desde Eye)
 * @returns {JSX.Element}
 */
export default function NovedadDetalleModal({
  novedadId,
  novedad: initialNovedad = null,
  isOpen,
  onClose,
  onDespachar,
  showDespacharButton = false,
  unidadesOficina = [],
  vehiculos = [],
  personalSeguridad = [],
}) {
  const [novedad, setNovedad] = useState(initialNovedad);
  const [loading, setLoading] = useState(!initialNovedad);
  const [activeTab, setActiveTab] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setLoadingHistorial(true);
      try {
        const id = novedadId || initialNovedad?.id;
        const [novedadData, historialData] = await Promise.all([
          getNovedadById(id),
          getHistorialEstados(id),
        ]);
        setNovedad(novedadData);
        setHistorial(historialData || []);
      } catch (err) {
        console.error("Error cargando novedad:", err);
        if (initialNovedad) setNovedad(initialNovedad);
      } finally {
        setLoading(false);
        setLoadingHistorial(false);
      }
    };

    fetchData();
  }, [isOpen, novedadId, initialNovedad]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      // ESC para cerrar
      if (e.key === "Escape") {
        onClose();
      }

      // PageDown (Av Pag)
      if (e.key === "PageDown") {
        e.preventDefault();

        // Si está en la pestaña 3 (Recursos) o 4 (Seguimiento) y el botón Despachar está visible
        if ((activeTab === 3 || activeTab === 4) && showDespacharButton && novedad?.estado_novedad_id === 1 && onDespachar) {
          // Simular click en botón Despachar
          onDespachar(novedad);
          onClose();
        } else if (activeTab < 4) {
          // Avanzar a siguiente pestaña
          setActiveTab((prev) => prev + 1);
        }
      }

      // PageUp (Re Pag) para pestaña anterior
      if (e.key === "PageUp") {
        e.preventDefault();
        setActiveTab((prev) => (prev > 0 ? prev - 1 : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, activeTab, showDespacharButton, novedad, onDespachar]);

  if (!isOpen) return null;

  const tabs = [
    { label: "Datos Básicos", icon: FileText },
    { label: "Ubicación", icon: MapPin },
    { label: "Reportante", icon: User },
    { label: "Recursos", icon: Users },
    { label: "Seguimiento", icon: Clock },
  ];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          {loading ? (
            <div className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
              <div>
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : novedad ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-500">
                    #{novedad.novedad_code}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadColor(
                      novedad.prioridad_actual
                    )}`}
                  >
                    {novedad.prioridad_actual || "MEDIA"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      typeof estadoColor(novedad.novedadEstado) === "string"
                        ? estadoColor(novedad.novedadEstado)
                        : ""
                    }`}
                    style={
                      typeof estadoColor(novedad.novedadEstado) === "object"
                        ? estadoColor(novedad.novedadEstado)
                        : {}
                    }
                  >
                    {novedad.novedadEstado?.nombre || "—"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                  {novedad.novedadTipoNovedad?.nombre || "Novedad"}
                </h3>
                <p className="text-sm text-slate-500">
                  {novedad.novedadSubtipoNovedad?.nombre || ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-slate-500">No se encontró la novedad</div>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 px-4 overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === idx
                  ? "border-primary-600 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              </div>
            </div>
          ) : novedad ? (
            <>
              {/* Tab 0: Datos Básicos */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Descripción
                    </h4>
                    <p className="text-slate-900 dark:text-slate-50 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      {novedad.descripcion || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Tipo de Novedad
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                        {novedad.novedadTipoNovedad?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Subtipo
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.novedadSubtipoNovedad?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Fecha/Hora Ocurrencia
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {formatFecha(novedad.fecha_hora_ocurrencia)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Origen de Llamada
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {ORIGEN_LLAMADA_OPTIONS.find(
                          (o) => o.value === novedad.origen_llamada
                        )?.label ||
                          novedad.origen_llamada ||
                          "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Prioridad
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.prioridad_actual || "MEDIA"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Estado
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.novedadEstado?.nombre || "—"}
                      </p>
                    </div>
                  </div>
                  {novedad.observaciones && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Observaciones
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        {novedad.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: Ubicación */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Localización
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.localizacion || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Referencia
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.referencia_ubicacion || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Sector
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.novedadSector?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Cuadrante
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.novedadCuadrante?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Ubigeo
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.novedadUbigeo?.nombre_completo ||
                          novedad.ubigeo_code ||
                          "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Coordenadas
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.latitud && novedad.longitud
                          ? `${novedad.latitud}, ${novedad.longitud}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Mapa de ubicación */}
                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                      Ubicación en Mapa
                    </h4>
                    <UbicacionMiniMapa
                      latitud={novedad.latitud}
                      longitud={novedad.longitud}
                      height="220px"
                      zoom={16}
                      showCoordinates={false}
                    />
                  </div>
                </div>
              )}

              {/* Tab 2: Reportante */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  {novedad.es_anonimo ? (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <p className="text-amber-800 dark:text-amber-200 font-medium">
                        Reporte Anónimo
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Nombre
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {novedad.reportante_nombre || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Teléfono
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {novedad.reportante_telefono || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Documento de Identidad
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {novedad.reportante_doc_identidad || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">
                      Personas Afectadas
                    </span>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {novedad.num_personas_afectadas || "0"}
                    </p>
                  </div>

                  {/* Observaciones (descripcion ya aparece en Datos Básicos) */}
                  {novedad.observaciones && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Observaciones
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        {novedad.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Recursos */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">
                      Unidad/Oficina
                    </span>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {(() => {
                        const unidad = unidadesOficina?.find(u => u.id === novedad.unidad_oficina_id);
                        return unidad?.nombre || "—";
                      })()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">
                      Vehículo Asignado
                    </span>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {(() => {
                        const vehiculo = vehiculos?.find(v => v.id === novedad.vehiculo_id);
                        return vehiculo 
                          ? `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo_vehiculo || vehiculo.modelo}`
                          : "—";
                      })()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">
                      Personal a Cargo (Principal)
                    </span>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {(() => {
                        const personal = personalSeguridad?.find(p => p.id === novedad.personal_cargo_id);
                        return personal 
                          ? `${personal.doc_tipo || ''} ${personal.doc_numero || 'N/A'} - ${personal.nombres} ${personal.apellido_paterno}`
                          : "—";
                      })()}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-xs font-medium text-slate-500">
                      Personal Seguridad #2
                    </span>
                    <p className="text-sm text-slate-900 dark:text-slate-50">
                      {(() => {
                        const personal = personalSeguridad?.find(p => p.id === novedad.personal_seguridad2_id);
                        return personal 
                          ? `${personal.doc_tipo || ''} ${personal.doc_numero || 'N/A'} - ${personal.nombres} ${personal.apellido_paterno}`
                          : "—";
                      })()}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Seguimiento */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Turno
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.turno || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Tiempo Respuesta
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {novedad.tiempo_respuesta_minutos
                          ? `${novedad.tiempo_respuesta_minutos} min`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                      Historial de Estados
                    </h4>
                    {loadingHistorial ? (
                      <p className="text-sm text-slate-500">
                        Cargando historial...
                      </p>
                    ) : !Array.isArray(historial) || historial.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No hay cambios de estado registrados.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {(Array.isArray(historial) ? historial : [])
                          .sort((a, b) => {
                            // Ordenar por fecha_cambio descendente (más reciente primero)
                            const fechaA = new Date(a.fecha_cambio || a.created_at);
                            const fechaB = new Date(b.fecha_cambio || b.created_at);
                            return fechaB - fechaA;
                          })
                          .map((h) => (
                          <div
                            key={h.id}
                            className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                          >
                            <div
                              className="flex-shrink-0 w-2 h-2 mt-2 rounded-full"
                              style={{
                                backgroundColor:
                                  h.estadoNuevo?.color_hex || "#6b7280",
                              }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {h.estadoAnterior && (
                                  <>
                                    <span
                                      className="text-xs px-2 py-0.5 rounded"
                                      style={{
                                        backgroundColor: `${h.estadoAnterior?.color_hex}20`,
                                        color: h.estadoAnterior?.color_hex,
                                      }}
                                    >
                                      {h.estadoAnterior?.nombre}
                                    </span>
                                    <span className="text-slate-400">→</span>
                                  </>
                                )}
                                <span
                                  className="text-xs px-2 py-0.5 rounded font-medium"
                                  style={{
                                    backgroundColor: `${h.estadoNuevo?.color_hex}30`,
                                    color: h.estadoNuevo?.color_hex,
                                  }}
                                >
                                  {h.estadoNuevo?.nombre}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatFecha(h.fecha_cambio || h.created_at)}
                                {h.historialEstadoNovedadUsuario &&
                                  ` • ${
                                    h.historialEstadoNovedadUsuario.nombres ||
                                    h.historialEstadoNovedadUsuario.username
                                  }`}
                                {h.tiempo_en_estado_min !== null && h.tiempo_en_estado_min !== undefined &&
                                  ` • ${h.tiempo_en_estado_min} min en estado anterior`}
                              </p>
                              {h.observaciones && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                                  "{h.observaciones}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No se encontró la novedad
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
          >
            Cerrar
          </button>

          {/* Botón Despachar - visible en pestaña 3 (Recursos) y 4 (Seguimiento) cuando showDespacharButton=true y estado_novedad_id === 1 */}
          {showDespacharButton && novedad?.estado_novedad_id === 1 && onDespachar && (activeTab === 3 || activeTab === 4) && (
            <button
              onClick={() => {
                onDespachar(novedad);
                onClose(); // Cerrar modal de detalle al abrir modal de despacho
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 font-medium"
            >
              <Truck size={18} />
              Despachar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
