/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\pages\\novedades\\NovedadesPage.jsx
 * @version 2.1.0
 * @description Página principal para la gestión de novedades/incidentes.
 * Contiene listado con filtros, creación de nuevas novedades, visualización de detalle
 * y modales para atención (asignación de recursos y seguimiento).
 *
 * Documentación educativa: se agregaron JSDoc y comentarios en funciones clave para facilitar
 * la comprensión del flujo sin modificar la lógica existente.
 *
 * Organización:
 *  - Constantes y helpers (colores, formatos) arriba
 *  - Estado y hooks (useState/useEffect) en la parte superior del componente
 *  - Funciones de fetch y handlers (CRUD) agrupadas por responsabilidad
 *  - Render con tabla y modales al final
 *
 * @module src/pages/novedades/NovedadesPage.jsx
 */
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { showValidationError } from "../../utils/errorUtils";
import ValidationErrorDisplay from "../../components/common/ValidationErrorDisplay";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  MapPin,
  Phone,
  User,
  FileText,
  Clock,
  Calendar,
  Bell,
  Radio,
  Camera,
  Car,
  Users,
  Shield,
  Truck,
  Share2,
  Home,
  BarChart3,
  Scale,
  Video,
  Loader2,
  Bot,
} from "lucide-react";
import DespacharModal from "../../components/novedades/DespacharModal";
import NovedadDetalleModal from "../../components/NovedadDetalleModal";
import OrigenLlamadaCell from "../../components/novedades/OrigenLlamadaCell";

import {
  listNovedades,
  deleteNovedad,
  createNovedad,
  listTiposNovedad,
  listEstadosNovedad,
  listSubtiposNovedad,
  listSectores,
  listCuadrantes,
  listUbigeos,
  getUbigeoByCode,
  asignarRecursos,
  listUnidadesOficina,
  listVehiculos,
  listPersonalSeguridad,
  getHistorialEstados,
  getNovedadById,
  listRadiosTetra,
} from "../../services/novedadesService.js";
import {
  searchDirecciones,
  createDireccion,
} from "../../services/direccionesService.js";
import { listSectores as listSectoresService } from "../../services/sectoresService.js";
import { listCuadrantes as listCuadrantesService } from "../../services/cuadrantesService.js";
import { listCalles } from "../../services/callesService.js";
import { getCuadrantesPorCalle } from "../../services/callesCuadrantesService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { canPerformAction, canAccessRoute } from "../../rbac/rbac.js";
import { getDefaultUbigeo } from "../../config/defaults.js";
import { geocodificarDireccion, validarCoordenadasPeru, getDescripcionLocationType, getDescripcionFuente } from "../../services/geocodingService.js";

// Constantes
const ORIGEN_LLAMADA_OPTIONS = [
  { value: "TELEFONO_107", label: "Llamada Telefónica (107)", icon: Phone },
  { value: "RADIO_TETRA", label: "Radio TETRA", icon: Radio },
  { value: "REDES_SOCIALES", label: "Redes Sociales", icon: Share2 },
  { value: "BOTON_EMERGENCIA_ALERTA", label: "Botón Emergencia", icon: AlertTriangle },
  { value: "BOTON_DENUNCIA_VECINO_ALERTA", label: "Botón Denuncia", icon: Home },
  { value: "INTERVENCION_DIRECTA", label: "Intervención Directa", icon: Shield },
  { value: "VIDEO_CCO", label: "Video CCO", icon: Video },
  { value: "ANALITICA", label: "Analítica", icon: BarChart3 },
  { value: "APP_PODER_JUDICIAL", label: "APP Poder Judicial", icon: Scale },
  { value: "BOT", label: "Bot", icon: Bot },
];

const PRIORIDAD_OPTIONS = ["ALTA", "MEDIA", "BAJA"];

// 🆕 Constantes para Panel REGISTRO DE LA NOVEDAD
const PAGE_TABS = {
  LISTADO: "listado",
  REGISTRO: "registro",
};

const REGISTRO_STAGES = {
  REGISTRO: "registro",
  DESPACHADOR: "despachador",
  ATENCION: "atencion",
  CIERRE: "cierre",
};

const NUEVOS_ORIGEN_LLAMADA_OPTIONS = [
  { 
    value: "TELEFONO_107", 
    label: "Llamada Telefónica (107)", 
    icon: Phone,
    color: "text-blue-600"
  },
  { 
    value: "RADIO_TETRA", 
    label: "Llamada Radio TETRA", 
    icon: Radio,
    color: "text-green-600"
  },
  { 
    value: "REDES_SOCIALES", 
    label: "Redes Sociales", 
    icon: Share2,
    color: "text-purple-600"
  },
  {
    value: "BOTON_EMERGENCIA_ALERTA",
    label: "Botón Emergencia",
    icon: AlertTriangle,
    color: "text-red-600"
  },
  {
    value: "BOTON_DENUNCIA_VECINO_ALERTA",
    label: "Botón Denuncia (App VECINO ALERTA)",
    icon: Home,
    color: "text-orange-600"
  },
  {
    value: "INTERVENCION_DIRECTA",
    label: "Intervención Directa",
    icon: Shield,
    color: "text-teal-600"
  },
  {
    value: "ANALITICA",
    label: "Analítica",
    icon: BarChart3,
    color: "text-indigo-600"
  },
  { 
    value: "APP_PODER_JUDICIAL", 
    label: "APP Poder Judicial", 
    icon: Scale,
    color: "text-gray-700"
  },
  {
    value: "VIDEO_CCO",
    label: "Video CCO",
    icon: Video,
    color: "text-cyan-600"
  },
  {
    value: "BOT",
    label: "Bot",
    icon: Bot,
    color: "text-violet-600"
  }
];

const TIPO_DOCUMENTO_OPTIONS = [
  { value: "DNI", label: "DNI" },
  { value: "CARNET_EXTRANJERIA", label: "Carnet de Extranjería" },
  { value: "PASAPORTE", label: "Pasaporte" },
  { value: "PTP", label: "PTP" },
];

const TIPO_COMPLEMENTO_OPTIONS = [
  { value: "DEPARTAMENTO", label: "Departamento" },
  { value: "CASA", label: "Casa" },
  { value: "OFICINA", label: "Oficina" },
  { value: "LOCAL", label: "Local Comercial" },
  { value: "LOTE", label: "Lote" },
  { value: "OTROS", label: "Otros" },
];

/**
 * Helper para obtener fecha/hora actual en formato datetime-local
 */
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convierte un valor datetime-local a formato para backend (sin Z, sin T).
 * El backend interpreta este formato como hora local Peru sin conversión timezone.
 * Ejemplo: "2026-02-08T18:37" → "2026-02-08 18:37:00"
 */
const toBackendDatetime = (datetimeLocalValue) => {
  if (!datetimeLocalValue) return null;
  // Reemplazar T por espacio y asegurar formato con segundos
  const clean = datetimeLocalValue.replace("T", " ");
  // Si no tiene segundos, agregarlos
  return clean.length <= 16 ? clean + ":00" : clean;
};

/**
 * Helper para obtener rango de fechas por defecto (últimos 7 días)
 * Retorna { fecha_inicio: "YYYY-MM-DD", fecha_fin: "YYYY-MM-DD" }
 */
const getDefaultDateRange = () => {
  const now = new Date();
  const fechaFin = now.toISOString().split("T")[0];

  const hace7Dias = new Date(now);
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  const fechaInicio = hace7Dias.toISOString().split("T")[0];

  return { fecha_inicio: fechaInicio, fecha_fin: fechaFin };
};

/**
 * Helper para formatear dirección completa para display
 */
const formatDireccionCompleta = (direccion) => {
  if (!direccion) return "";

  const parts = [];

  // Calle principal
  if (direccion.calle?.nombre_completo) {
    parts.push(direccion.calle.nombre_completo);
  }

  // Número municipal
  if (direccion.numero_municipal) {
    parts.push(`N° ${direccion.numero_municipal}`);
  }

  // Manzana y Lote
  if (direccion.manzana && direccion.lote) {
    parts.push(`Mz. ${direccion.manzana} Lt. ${direccion.lote}`);
  }

  // Urbanización
  if (direccion.urbanizacion) {
    parts.push(`- ${direccion.urbanizacion}`);
  }

  // Complemento
  if (direccion.tipo_complemento && direccion.numero_complemento) {
    parts.push(
      `(${direccion.tipo_complemento} ${direccion.numero_complemento})`
    );
  }

  // NO incluir referencia aquí - va separado

  return parts.join(" ");
};

/**
 * Helper para formatear dirección manual desde formulario
 */
const formatDireccionManual = (formData, callesList) => {
  const parts = [];

  // Calle seleccionada
  if (formData.calle_id && callesList) {
    const calle = callesList.find(c => c.id === parseInt(formData.calle_id));
    if (calle?.nombre_completo) {
      parts.push(calle.nombre_completo);
    }
  }

  // Número municipal
  if (formData.numero_municipal) {
    parts.push(`N° ${formData.numero_municipal}`);
  }

  // Manzana y Lote
  if (formData.manzana && formData.lote) {
    parts.push(`Mz. ${formData.manzana} Lt. ${formData.lote}`);
  }

  // Urbanización
  if (formData.urbanizacion) {
    parts.push(`- ${formData.urbanizacion}`);
  }

  // Complemento
  if (formData.tipo_complemento && formData.numero_complemento) {
    parts.push(`(${formData.tipo_complemento} ${formData.numero_complemento})`);
  }

  // NO incluir detalles_ubicacion aquí - va separado en referencia_ubicacion

  return parts.join(" ");
};

/**
 * NovedadesPage - Página de gestión de incidentes y novedades
 *
 * @version 2.0.0
 * @component
 * @category Pages
 * @description Componente principal para listar, crear, ver y atender novedades.
 *
 * Reglas:
 *  - No se modifica la lógica: sólo se añaden comentarios y JSDoc para aprendizaje.
 *  - El componente agrupa estado, efectos, helpers y render.
 *
 * @returns {JSX.Element} UI completa con filtros, tabla y modales.
 *
 * @example
 * <NovedadesPage />
 */

export default function NovedadesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const canRead = canAccessRoute(user, "novedades");
  const canCreate = canPerformAction(user, "novedades_create");
  const canEdit = canPerformAction(user, "novedades_update");
  const canDelete = canPerformAction(user, "novedades_delete");

  const [permissionErrorShown, setPermissionErrorShown] = useState(false);
  const [novedades, setNovedades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterEstado, setFilterEstado] = useState("1"); // Por defecto: Pendiente de registro
  const [filterPrioridad, setFilterPrioridad] = useState("");
  const [filterOrigenLlamada, setFilterOrigenLlamada] = useState("");
  const [filters, setFilters] = useState(() => getDefaultDateRange()); // Últimos 7 días por defecto

  // Catálogos
  const [tipos, setTipos] = useState([]);
  const [subtipos, setSubtipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [cuadrantes, setCuadrantes] = useState([]);
  const [ubigeos, setUbigeos] = useState([]);
  const [ubigeoSearch, setUbigeoSearch] = useState("");
  const [registroUbigeoInfo, setRegistroUbigeoInfo] = useState(null);
  const [searchTipoSubtipo, setSearchTipoSubtipo] = useState("");
  const [showTipoSubtipoDropdown, setShowTipoSubtipoDropdown] = useState(false);
  const tipoSubtipoRef = useRef(null);
  const [defaultUbigeo, setDefaultUbigeo] = useState(null); // Ubigeo por defecto desde backend

  // Modal de atención
  const [showAtencionModal, setShowAtencionModal] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [atencionTab, setAtencionTab] = useState(0);

  // Catálogos para atención
  const [unidadesOficina, setUnidadesOficina] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [personalSeguridad, setPersonalSeguridad] = useState([]);
  const [radiosTetra, setRadiosTetra] = useState([]);
  const [loadingRadios, setLoadingRadios] = useState(false);
  const [errorRadios, setErrorRadios] = useState("");
  const [historialEstados, setHistorialEstados] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Errores de validación
  const [validationError, setValidationError] = useState(null);

  // Modales
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingNovedad, setViewingNovedad] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [viewingFromTruck, setViewingFromTruck] = useState(false); // Track si se abrió desde Truck o Eye
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showSeguimientoModal, setShowSeguimientoModal] = useState(false);
  const [selectedNovedadSeguimiento, setSelectedNovedadSeguimiento] = useState(null);

  // Estados para geocodificación en formulario manual
  const [geocodingData, setGeocodingData] = useState(null);
  const [loadingGeocoding, setLoadingGeocoding] = useState(false);

  // Form data para creación
  const [formData, setFormData] = useState({
    tipo_novedad_id: "",
    subtipo_novedad_id: "",
    fecha_hora_ocurrencia: "",
    origen_llamada: "TELEFONO_107",
    localizacion: "",
    referencia_ubicacion: "",
    sector_id: "",
    cuadrante_id: "",
    ubigeo_code: "",
    latitud: "",
    longitud: "",
    reportante_nombre: "",
    reportante_telefono: "",
    reportante_tipo_doc: "DNI",
    reportante_doc_identidad: "",
    num_personas_afectadas: "",
    es_anonimo: false,
    descripcion: "",
    observaciones: "",
  });

  const DOC_TIPOS = ["DNI", "Carnet Extranjeria", "Pasaporte", "PTP"];

  // 🆕 Estado para Panel REGISTRO DE LA NOVEDAD
  const [pageTab, setPageTab] = useState(PAGE_TABS.LISTADO);

  // Validación de dirección
  const [direccionMatch, setDireccionMatch] = useState(null);
  const [searchingDireccion, setSearchingDireccion] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [direccionesOptions, setDireccionesOptions] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [selectedDireccionId, setSelectedDireccionId] = useState(""); // Mantenido para reset

  // Datos del formulario REGISTRO
  const [registroFormData, setRegistroFormData] = useState({
    // Origen
    origen_llamada: "TELEFONO_107",
    reportante_telefono: "",
    radio_tetra_id: null, // Nuevo campo para Radio TETRA
    fecha_hora_ocurrencia: getCurrentDateTimeLocal(),

    // Reportante
    es_anonimo: 0,
    reportante_tipo_doc: "DNI",
    reportante_doc_identidad: "",
    reportante_nombre: "",

    // Ubicación
    referencia_ubicacion: "",
    detalles_ubicacion: "", // Detalles adicionales que se concatenan a la dirección
    direccion_id: "",
    calle_id: "",
    numero_municipal: "",
    sector_id: "",
    cuadrante_id: "",
    localizacion: "",
    ubigeo_code: "",

    // Complemento (solo si dirección nueva)
    tipo_complemento: "",
    numero_complemento: "",
    manzana: "",
    lote: "",
    urbanizacion: "",

    // Incidente
    tipo_novedad_id: "",
    subtipo_novedad_id: "",
    descripcion: "",
    prioridad_actual: "",

    // Asignación
    personal_cargo_id: "",
    estado_novedad_id: 2, // Default "DESPACHADO"
  });

  // Catálogos para REGISTRO
  const [calles, setCalles] = useState([]);
  const [calleSearchText, setCalleSearchText] = useState("");
  const [callesFiltered, setCallesFiltered] = useState([]);
  const [showCalleDropdown, setShowCalleDropdown] = useState(false);
  const [sectoresRegistro, setSectoresRegistro] = useState([]);
  const [cuadrantesRegistro, setCuadrantesRegistro] = useState([]);
  const [autoPopulatedFromCalle, setAutoPopulatedFromCalle] = useState(false); // Track if sector/cuadrante auto-populated from calle

  // Form data para atención de novedad
  const [atencionData, setAtencionData] = useState({
    unidad_oficina_id: "",
    vehiculo_id: "",
    personal_cargo_id: "",
    personal_seguridad2_id: "",
    personal_seguridad3_id: "",
    personal_seguridad4_id: "",
    fecha_despacho: "",
    turno: "",
    tiempo_respuesta_minutos: "",
    observaciones: "",
    estado_novedad_id: "",
    requiere_seguimiento: false,
    fecha_llegada: "",
    fecha_cierre: "",
    km_inicial: "",
    km_final: "",
    fecha_proxima_revision: "",
    perdidas_materiales_estimadas: "",
  });

  /**
   * fetchNovedades
   * Consulta paginada de novedades desde el backend usando los filtros actuales.
   * - Maneja permisos (no intenta la llamada si el usuario no tiene acceso).
   * - Actualiza el estado local: `novedades` y `pagination`.
   *
   * @param {Object} options - Opciones para la consulta
   * @param {number} [options.nextPage=1] - Página a solicitar
   * @returns {Promise<void>}
   */
  const fetchNovedades = async ({ nextPage = 1 } = {}) => {
    if (!canRead) {
      if (!permissionErrorShown) {
        toast.error("No tienes los permisos necesarios para ver esta sección");
        setPermissionErrorShown(true);
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        page: nextPage,
        limit: 15,
        tipo_novedad_id: filterTipo || undefined,
        estado_novedad_id: filterEstado || undefined,
        prioridad_actual: filterPrioridad || undefined,
        origen_llamada: filterOrigenLlamada || undefined,
        search: search || undefined,
        sort: "prioridad_actual,novedad_code",
        order: "asc,desc", // Ordenar por prioridad ASC, luego novedad_code DESC (usando índice idx_novedad_prioridad)
      };
      
      // Agregar fechas si tienen valores válidos (basado en ReportesOperativosPage)
      if (filters.fecha_inicio) {
        payload.fecha_inicio = filters.fecha_inicio;
      }
      if (filters.fecha_fin) {
        payload.fecha_fin = filters.fecha_fin;
      }
      
      const result = await listNovedades(payload);
      setNovedades(Array.isArray(result.novedades) ? result.novedades : []);
      setPagination(result.pagination);
    } catch (err) {
      const msg = err?.response?.data?.message || "Error al cargar novedades";
      if (!permissionErrorShown) {
        toast.error(msg);
        if (err?.response?.status === 403) {
          setPermissionErrorShown(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * fetchCatalogos
   * Carga catálogos iniciales usados en el filtro y en el formulario de creación:
   * - tipos de novedad, estados y sectores.
   * Intenta las llamadas en paralelo para mejorar rendimiento.
   *
   * @returns {Promise<void>}
   */
  const fetchCatalogos = async () => {
    try {
      const [tiposRes, estadosRes, sectoresRes, subtiposRes] = await Promise.all([
        listTiposNovedad(),
        listEstadosNovedad(),
        listSectores(),
        listSubtiposNovedad(),
      ]);
      setTipos(Array.isArray(tiposRes) ? tiposRes : []);
      setEstados(Array.isArray(estadosRes) ? estadosRes : []);
      setSectores(Array.isArray(sectoresRes) ? sectoresRes : []);
      setSubtipos(Array.isArray(subtiposRes) ? subtiposRes : []);
    } catch (err) {
      console.error("Error cargando catálogos:", err);
    }
  };

  // Cargar subtipos cuando cambia el tipo
  /**
   * fetchSubtipos
   * - Dado un `tipoId` obtiene los subtipos asociados y actualiza `subtipos`.
   * - Si no hay `tipoId`, limpia el arreglo.
   *
   * @param {number|string} tipoId - Identificador del tipo de novedad
   * @returns {Promise<void>}
   */
  const fetchSubtipos = async (tipoId) => {
    if (!tipoId) {
      setSubtipos([]);
      return;
    }
    try {
      const res = await listSubtiposNovedad(tipoId);
      setSubtipos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error cargando subtipos:", err);
    }
  };

  // Cargar cuadrantes cuando cambia el sector
  /**
   * fetchCuadrantes
   * Carga los cuadrantes asociados a un sector seleccionado.
   *
   * @param {number|string} sectorId
   * @returns {Promise<void>}
   */
  const fetchCuadrantes = async (sectorId) => {
    if (!sectorId) {
      setCuadrantes([]);
      return;
    }
    try {
      const res = await listCuadrantes(sectorId);
      setCuadrantes(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error cargando cuadrantes:", err);
    }
  };

  // Buscar ubigeos
  /**
   * fetchUbigeos
   * - Realiza búsqueda de ubigeos cuando el texto supera 1 carácter.
   * - Evita llamadas innecesarias con entradas muy cortas.
   *
   * @param {string} searchTerm
   * @returns {Promise<void>}
   */
  const fetchUbigeos = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUbigeos([]);
      return;
    }
    try {
      const res = await listUbigeos(searchTerm);
      setUbigeos(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Error buscando ubigeos:", err);
    }
  };

  useEffect(() => {
    fetchCatalogos();
  }, []);

  // Click fuera cierra dropdown de tipo/subtipo
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tipoSubtipoRef.current && !tipoSubtipoRef.current.contains(e.target)) {
        setShowTipoSubtipoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cargar ubigeo por defecto al montar el componente
  useEffect(() => {
    getDefaultUbigeo()
      .then((ubigeo) => {
        setDefaultUbigeo(ubigeo);
      })
      .catch((err) => {
        console.error("Error cargando ubigeo default:", err);
      });
  }, []);

  useEffect(() => {
    fetchNovedades({ nextPage: page });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, canRead]);

  // Abrir detalle si viene id en la URL
  useEffect(() => {
    const novedadId = searchParams.get("id");
    if (novedadId && novedades.length > 0) {
      const novedad = novedades.find((n) => n.id === parseInt(novedadId));
      if (novedad) {
        openViewingModal(novedad);
        // Limpiar el parámetro de la URL
        setSearchParams({});
      } else {
        // Si no está en la lista actual, cargar por ID
        getNovedadById(novedadId)
          .then((data) => {
            if (data) {
              openViewingModal(data);
              setSearchParams({});
            }
          })
          .catch((err) => console.error("Error cargando novedad:", err));
      }
    }
  }, [searchParams, novedades]);

  // Atajo de teclado ALT+N para abrir formulario de creación
  // PageDown/PageUp para navegación de pestañas en el modal
  // ESC para cerrar modales
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        // Usar la nueva pestaña REGISTRO en lugar del modal antiguo
        if (canCreate && !showCreateForm && !showAtencionModal && !viewingNovedad) {
          setPageTab(PAGE_TABS.REGISTRO);
          resetRegistroForm();
          // Poner foco en el primer campo después de que se renderice
          setTimeout(() => {
            document.getElementById("tipo_novedad_select")?.focus();
          }, 100);
        }
        return;
      }
      // ESC para cerrar modales
      if (e.key === "Escape") {
        // ESC en tab REGISTRO con confirmación
        if (pageTab === PAGE_TABS.REGISTRO) {
          const hasData =
            registroFormData.descripcion ||
            registroFormData.referencia_ubicacion;
          if (hasData) {
            if (
              window.confirm(
                "¿Cancelar registro? Se perderán los datos ingresados."
              )
            ) {
              resetRegistroForm();
              setPageTab(PAGE_TABS.LISTADO);
            }
          } else {
            setPageTab(PAGE_TABS.LISTADO);
          }
          return;
        }
        if (showCreateForm) {
          setShowCreateForm(false);
        }
        if (showAtencionModal) {
          setShowAtencionModal(false);
          setSelectedNovedad(null);
        }
        if (viewingNovedad) {
          setViewingNovedad(null);
        }
      }
      // PageDown = siguiente pestaña, PageUp = pestaña anterior
      if (showCreateForm) {
        if (e.key === "PageDown") {
          e.preventDefault();
          setActiveTab((prev) => Math.min(prev + 1, 3));
        } else if (e.key === "PageUp") {
          e.preventDefault();
          setActiveTab((prev) => Math.max(prev - 1, 0));
        }
      }
      // ALT+G para guardar (Nueva Novedad o Atención o REGISTRO)
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        // 🆕 Guardar desde tab REGISTRO
        if (pageTab === PAGE_TABS.REGISTRO && !saving) {
          handleSaveRegistro();
          return;
        }
        if (showCreateForm && !saving) {
          // Disparar click en el botón de guardar para usar el estado actual
          document.getElementById("btn_guardar_novedad")?.click();
        } else if (showAtencionModal && !saving) {
          document.getElementById("btn_guardar_atencion")?.click();
        }
      }

      // ALT+N para abrir Nueva Novedad
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate && !showCreateForm && !showAtencionModal && !viewingNovedad) {
          setPageTab(PAGE_TABS.REGISTRO);
          resetRegistroForm();

          // Hacer focus en el campo Origen de Llamada después de un pequeño delay
          setTimeout(() => {
            const origenLlamadaSelect = document.getElementById("select_origen_llamada");
            if (origenLlamadaSelect) {
              origenLlamadaSelect.focus();
            }
          }, 100);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canCreate,
    showCreateForm,
    showAtencionModal,
    viewingNovedad,
    saving,
    pageTab,
    registroFormData,
  ]);

  // 🆕 useEffect hooks para Panel REGISTRO DE LA NOVEDAD

  // Debounced search de dirección
  useEffect(() => {
    if (pageTab !== PAGE_TABS.REGISTRO) return;
    
    // No hacer búsqueda si ya hay una dirección seleccionada
    if (direccionMatch) return;

    const timer = setTimeout(() => {
      if (registroFormData.referencia_ubicacion) {
        handleDireccionSearch(registroFormData.referencia_ubicacion);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [registroFormData.referencia_ubicacion, pageTab, direccionMatch]);

  // Cargar catálogos al entrar a tab REGISTRO
  useEffect(() => {
    if (pageTab === PAGE_TABS.REGISTRO) {
      const loadCatalogos = async () => {
        try {
          const [callesData, sectoresData] = await Promise.all([
            listCalles({ limit: 100 }), // Backend requiere límite máximo de 100
            listSectoresService({ limit: 100 }),
          ]);

          setCalles(callesData?.items || callesData?.data || callesData || []);
          setSectoresRegistro(
            sectoresData?.items || sectoresData?.data || sectoresData || []
          );

          // Cargar radios TETRA por separado con manejo de errores
          setLoadingRadios(true);
          setErrorRadios("");
          
          try {
            const radiosData = await listRadiosTetra();
            setRadiosTetra(Array.isArray(radiosData) ? radiosData : []);
            
            if (radiosData.length === 0) {
              setErrorRadios("No hay radios TETRA disponibles");
            }
          } catch (radioError) {
            console.error("Error cargando radios TETRA:", radioError);
            if (radioError.response?.status === 401) {
              setErrorRadios("No autorizado - Inicie sesión nuevamente");
            } else if (radioError.response?.status === 403) {
              setErrorRadios("No tiene permisos para ver radios TETRA");
            } else {
              setErrorRadios("Error al cargar radios TETRA");
            }
          } finally {
            setLoadingRadios(false);
          }
          
        } catch (error) {
          console.error("Error al cargar catálogos:", error);
          toast.error("Error al cargar catálogos");
        }
      };

      loadCatalogos();
    }
  }, [pageTab]);

  // Cargar cuadrantes cuando cambia sector (manual)
  useEffect(() => {
    if (
      pageTab === PAGE_TABS.REGISTRO &&
      registroFormData.sector_id &&
      showManualLocation
    ) {
      const loadCuadrantes = async () => {
        try {
          const cuadrantesData = await listCuadrantesService({
            sector_id: registroFormData.sector_id,
            limit: 100,
          });
          setCuadrantesRegistro(
            cuadrantesData?.items ||
              cuadrantesData?.data ||
              cuadrantesData ||
              []
          );
        } catch (error) {
          console.error("Error al cargar cuadrantes:", error);
          toast.error("Error al cargar cuadrantes");
        }
      };

      loadCuadrantes();
    } else {
      setCuadrantesRegistro([]);
    }
  }, [registroFormData.sector_id, pageTab, showManualLocation]);

  // Auto-buscar sector/cuadrante cuando se tiene calle_id + (numero_municipal OR manzana)
  useEffect(() => {
    if (
      pageTab === PAGE_TABS.REGISTRO &&
      showManualLocation &&
      registroFormData.calle_id &&
      (registroFormData.numero_municipal || registroFormData.manzana) &&
      !autoPopulatedFromCalle // Solo buscar si no ya fue auto-poblado
    ) {
      lookupCallesCuadrantes(registroFormData.calle_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    registroFormData.calle_id,
    registroFormData.numero_municipal,
    registroFormData.manzana,
    pageTab,
    showManualLocation,
  ]);

  // Cargar información de ubigeo cuando cambia el ubigeo_code
  useEffect(() => {
    const loadUbigeoInfo = async () => {
      if (registroFormData.ubigeo_code && registroFormData.ubigeo_code.length === 6) {
        try {
          const ubigeo = await getUbigeoByCode(registroFormData.ubigeo_code);
          if (ubigeo) {
            setRegistroUbigeoInfo(ubigeo);
          } else {
            setRegistroUbigeoInfo(null);
          }
        } catch (error) {
          console.error("Error al cargar ubigeo:", error);
          setRegistroUbigeoInfo(null);
        }
      } else {
        setRegistroUbigeoInfo(null);
      }
    };

    loadUbigeoInfo();
  }, [registroFormData.ubigeo_code]);

  const handleSearch = () => {
    setPage(1);
    fetchNovedades({ nextPage: 1 });
  };

  // Ref para evitar ejecutar el auto-filtro en el montaje inicial
  const isFirstFilterRender = useRef(true);

  // Auto-ejecutar filtro cuando cambian los dropdowns
  useEffect(() => {
    // Evitar ejecutar en el montaje inicial (ya lo hace el useEffect de [page, canRead])
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    setPage(1);
    fetchNovedades({ nextPage: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipo, filterEstado, filterPrioridad, filterOrigenLlamada]);

  const handleDelete = async (n) => {
    const confirmed = window.confirm(`¿Eliminar novedad "${n.novedad_code}"?`);
    if (!confirmed) return;
    try {
      await deleteNovedad(n.id);
      toast.success("Novedad eliminada");
      fetchNovedades({ nextPage: page });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al eliminar");
    }
  };

  /**
   * resetForm
   * Restaura el formulario de creación a valores por defecto y resetea subcatálogos.
   * Utilizado al abrir el formulario o después de crear una novedad satisfactoriamente.
   */
  const resetForm = () => {
    setFormData({
      tipo_novedad_id: "",
      subtipo_novedad_id: "",
      fecha_hora_ocurrencia: new Date(
        Date.now() - new Date().getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 16),
      origen_llamada: "TELEFONO_107",
      localizacion: "",
      referencia_ubicacion: "",
      sector_id: "",
      cuadrante_id: "",
      ubigeo_code: "",
      latitud: "",
      longitud: "",
      reportante_nombre: "",
      reportante_telefono: "",
      reportante_tipo_doc: "DNI",
      reportante_doc_identidad: "",
      num_personas_afectadas: "",
      es_anonimo: false,
      descripcion: "",
      observaciones: "",
    });
    setSubtipos([]);
    setCuadrantes([]);
    setActiveTab(0);
    setGpsEnabled(false);
  };

  // Capturar ubicación GPS del usuario
  /**
   * captureGPS
   * - Intenta obtener la geolocalización del navegador y guarda lat/lng en el formulario.
   * - Maneja errores comunes y muestra mensajes de ayuda al usuario.
   */
  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitud: position.coords.latitude.toFixed(6),
          longitud: position.coords.longitude.toFixed(6),
        }));
        setGpsEnabled(true);
        setGpsLoading(false);
        toast.success("Ubicación GPS capturada");
      },
      (error) => {
        setGpsLoading(false);
        let msg = "Error al obtener ubicación";
        if (error.code === 1) msg = "Permiso de ubicación denegado";
        else if (error.code === 2) msg = "Ubicación no disponible";
        else if (error.code === 3) msg = "Tiempo de espera agotado";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const toggleGpsMode = () => {
    if (gpsEnabled) {
      setGpsEnabled(false);
    } else {
      captureGPS();
    }
  };

  /**
   * handleCreate
   * Valida y envía los datos de creación de novedad al backend.
   * - Convierte tipos y campos opcionales a la forma esperada por la API.
   * - Muestra toast con el resultado y refresca la lista.
   *
   * @returns {Promise<void>}
   */
  const handleCreate = async () => {
    if (
      !formData.tipo_novedad_id ||
      !formData.subtipo_novedad_id ||
      !formData.descripcion
    ) {
      toast.error(
        "Complete los campos requeridos: Tipo, Subtipo y Descripción"
      );
      return;
    }
    if (!formData.sector_id || !formData.cuadrante_id) {
      toast.error("Debe seleccionar Sector y Cuadrante");
      setActiveTab(1);
      return;
    }
    if (!formData.fecha_hora_ocurrencia) {
      toast.error("Ingrese la fecha y hora de ocurrencia");
      return;
    }
    setSaving(true);
    try {
      await createNovedad({
        tipo_novedad_id: Number(formData.tipo_novedad_id),
        subtipo_novedad_id: Number(formData.subtipo_novedad_id),
        fecha_hora_ocurrencia: toBackendDatetime(formData.fecha_hora_ocurrencia),
        origen_llamada: formData.origen_llamada,
        localizacion: formData.localizacion || undefined,
        referencia_ubicacion: formData.referencia_ubicacion || undefined,
        sector_id: formData.sector_id ? Number(formData.sector_id) : undefined,
        cuadrante_id: formData.cuadrante_id
          ? Number(formData.cuadrante_id)
          : undefined,
        ubigeo_code: formData.ubigeo_code || undefined,
        latitud: formData.latitud ? parseFloat(formData.latitud) : undefined,
        longitud: formData.longitud ? parseFloat(formData.longitud) : undefined,
        reportante_nombre: formData.reportante_nombre || undefined,
        reportante_telefono: formData.reportante_telefono || undefined,
        reportante_doc_identidad: formData.reportante_doc_identidad
          ? `${formData.reportante_tipo_doc} ${formData.reportante_doc_identidad}`
          : undefined,
        num_personas_afectadas: formData.num_personas_afectadas
          ? Number(formData.num_personas_afectadas)
          : undefined,
        es_anonimo: formData.es_anonimo ? 1 : 0,
        descripcion: formData.descripcion,
        observaciones: formData.observaciones || undefined,
      });
      toast.success("Novedad creada exitosamente");
      setShowCreateForm(false);
      resetForm();
      setPage(1);
      fetchNovedades({ nextPage: 1 });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al crear novedad");
    } finally {
      setSaving(false);
    }
  };

  // Cargar catálogos para atención
  const fetchCatalogosAtencion = async () => {
    try {
      const [unidades, vehic, personal, radios] = await Promise.all([
        listUnidadesOficina(),
        listVehiculos(),
        listPersonalSeguridad(),
        listRadiosTetra(),
      ]);
      setUnidadesOficina(Array.isArray(unidades) ? unidades : []);
      setVehiculos(Array.isArray(vehic) ? vehic : []);
      setPersonalSeguridad(Array.isArray(personal) ? personal : []);
      setRadiosTetra(Array.isArray(radios) ? radios : []);
    } catch (err) {
      console.error("Error cargando catálogos de atención:", err);
      toast.error("Error al cargar catálogos de atención");
    }
  };

  // Cargar historial de estados
  const fetchHistorialEstados = async (novedadId) => {
    setLoadingHistorial(true);
    try {
      const historial = await getHistorialEstados(novedadId);
      setHistorialEstados(Array.isArray(historial) ? historial : []);
    } catch (err) {
      console.error("Error cargando historial:", err);
      setHistorialEstados([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Abrir modal de atención
  /**
   * openAtencionModal
   * - Prepara los datos y muestra el modal para asignar recursos y hacer seguimiento.
   * - Se asegura de cargar catálogos y el historial de estados.
   *
   * @param {Object} novedad - Objeto novedad seleccionado
   * @returns {Promise<void>}
   */
  const openAtencionModal = async (novedad) => {
    setSelectedNovedad(novedad);
    setAtencionData({
      unidad_oficina_id: novedad.unidad_oficina_id || "",
      vehiculo_id: novedad.vehiculo_id || "",
      personal_cargo_id: novedad.personal_cargo_id || "",
      personal_seguridad2_id: novedad.personal_seguridad2_id || "",
      personal_seguridad3_id: novedad.personal_seguridad3_id || "",
      personal_seguridad4_id: novedad.personal_seguridad4_id || "",
      fecha_despacho: novedad.fecha_despacho
        ? new Date(novedad.fecha_despacho).toISOString().slice(0, 16)
        : new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16),
      turno: novedad.turno || "",
      tiempo_respuesta_minutos: novedad.tiempo_respuesta_minutos || "",
      observaciones: novedad.observaciones || "",
      estado_novedad_id: novedad.estado_novedad_id || 2,
      requiere_seguimiento: novedad.requiere_seguimiento || false,
      fecha_llegada: novedad.fecha_llegada
        ? new Date(novedad.fecha_llegada).toISOString().slice(0, 16)
        : "",
      fecha_cierre: novedad.fecha_cierre
        ? new Date(novedad.fecha_cierre).toISOString().slice(0, 16)
        : "",
      km_inicial: novedad.km_inicial || "",
      km_final: novedad.km_final || "",
      fecha_proxima_revision: novedad.fecha_proxima_revision
        ? new Date(novedad.fecha_proxima_revision).toISOString().slice(0, 10)
        : "",
      perdidas_materiales_estimadas:
        novedad.perdidas_materiales_estimadas || "",
    });
    setAtencionTab(0);
    setHistorialEstados([]);
    setShowAtencionModal(true);
    // Cargar catálogos si no están cargados
    if (
      unidadesOficina.length === 0 ||
      vehiculos.length === 0 ||
      personalSeguridad.length === 0
    ) {
      await fetchCatalogosAtencion();
    }
    // Cargar historial de estados
    fetchHistorialEstados(novedad.id);
  };

  /**
   * openSeguimientoModal
   * - Abre el modal de seguimiento para una novedad
   * - Carga los catálogos si no están disponibles
   */
  const openSeguimientoModal = async (novedad) => {
    setSelectedNovedadSeguimiento(novedad);
    setShowSeguimientoModal(true);
    // Cargar catálogos si no están cargados
    if (
      unidadesOficina.length === 0 ||
      vehiculos.length === 0 ||
      personalSeguridad.length === 0
    ) {
      await fetchCatalogosAtencion();
    }
  };

  /**
   * handleSaveSeguimiento
   * - Guarda la información de seguimiento de una novedad
   * - Cambia estado a DESPACHADO (2)
   * - Calcula tiempo transcurrido desde el estado anterior
   * - Guarda en historial_estado_novedades
   */
  const handleSaveSeguimiento = async (seguimientoData) => {
    try {
      // Calcular tiempo transcurrido en minutos desde el estado anterior
      const fechaActual = new Date(seguimientoData.fecha_despacho);
      const fechaEstadoAnterior = selectedNovedadSeguimiento.updated_at
        ? new Date(selectedNovedadSeguimiento.updated_at)
        : new Date(selectedNovedadSeguimiento.created_at);

      const tiempoTranscurridoMs = fechaActual - fechaEstadoAnterior;
      const tiempo_en_estado_min = Math.floor(tiempoTranscurridoMs / (1000 * 60));

      // Buscar descripción del estado DESPACHADO (id=2) para usar si no hay observaciones
      const estadoDespachado = estados.find((e) => e.id === 2);
      const observacionesFinal = seguimientoData.observaciones?.trim()
        ? seguimientoData.observaciones
        : (estadoDespachado?.descripcion || "Novedad despachada");

      const payload = {
        novedad_id: selectedNovedadSeguimiento.id,

        // Cambio de estado
        estado_novedad_id: 2, // DESPACHADO

        // Asignación de recursos
        vehiculo_id: seguimientoData.vehiculo_id,
        personal_cargo_id: seguimientoData.personal_cargo_id,
        unidad_oficina_id: seguimientoData.unidad_oficina_id,
        personal_seguridad2_id: seguimientoData.personal_seguridad2_id,

        // Fechas y kilometraje (sin Z, backend interpreta como hora local Peru)
        fecha_despacho: toBackendDatetime(seguimientoData.fecha_despacho) || toBackendDatetime(getCurrentDateTimeLocal()),
        km_inicial: seguimientoData.km_inicial,

        // Observaciones de la novedad (se graba en novedades_incidentes.observaciones)
        observaciones: observacionesFinal,

        // Historial de estados (el trigger fue eliminado, frontend envía el historial)
        historial: {
          novedad_id: selectedNovedadSeguimiento.id,
          estado_anterior_id: selectedNovedadSeguimiento.estado_novedad_id || 1,
          estado_nuevo_id: 2, // DESPACHADO
          observaciones: observacionesFinal,
          fecha_cambio: toBackendDatetime(seguimientoData.fecha_despacho) || toBackendDatetime(getCurrentDateTimeLocal()),
          tiempo_en_estado_min: tiempo_en_estado_min >= 0 ? tiempo_en_estado_min : 0,
          created_by: user?.id || null,
          updated_by: user?.id || null,
        },
      };

      await asignarRecursos(selectedNovedadSeguimiento.id, payload);

      toast.success("Novedad despachada exitosamente");
      setShowSeguimientoModal(false);
      setSelectedNovedadSeguimiento(null);
      // Recargar lista de novedades
      fetchNovedades({ nextPage: page });
      
      // Si hay una novedad en visualización, actualizar sus datos
      if (viewingNovedad && viewingNovedad.id === selectedNovedadSeguimiento.id) {
        try {
          const updatedNovedad = await getNovedadById(selectedNovedadSeguimiento.id);
          setViewingNovedad(updatedNovedad);
        } catch (error) {
          console.error("Error al actualizar datos de la novedad visualizada:", error);
        }
      }
    } catch (error) {
      console.error("Error al guardar seguimiento:", error);
      toast.error(error.response?.data?.message || "Error al despachar novedad");
      throw error;
    }
  };

  // Guardar atención de novedad
  /**
   * handleGuardarAtencion
   * - Valida asignaciones (no duplicar personal) y envía al backend la asignación de recursos.
   * - Muestra estado (toast) y refresca la lista de novedades.
   *
   * @returns {Promise<void>}
   */
  const handleGuardarAtencion = async () => {
    if (!selectedNovedad) return;

    // Validar que no se repita el mismo personal
    const personalIds = [
      atencionData.personal_cargo_id,
      atencionData.personal_seguridad2_id,
      atencionData.personal_seguridad3_id,
      atencionData.personal_seguridad4_id,
    ].filter((id) => id && id !== "");

    const uniqueIds = new Set(personalIds);
    if (personalIds.length !== uniqueIds.size) {
      toast.error(
        "No puede asignar la misma persona en múltiples campos de personal"
      );
      return;
    }

    setSaving(true);
    try {
      await asignarRecursos(selectedNovedad.id, {
        unidad_oficina_id: atencionData.unidad_oficina_id
          ? Number(atencionData.unidad_oficina_id)
          : undefined,
        vehiculo_id: atencionData.vehiculo_id
          ? Number(atencionData.vehiculo_id)
          : undefined,
        personal_cargo_id: atencionData.personal_cargo_id
          ? Number(atencionData.personal_cargo_id)
          : undefined,
        personal_seguridad2_id: atencionData.personal_seguridad2_id
          ? Number(atencionData.personal_seguridad2_id)
          : undefined,
        personal_seguridad3_id: atencionData.personal_seguridad3_id
          ? Number(atencionData.personal_seguridad3_id)
          : undefined,
        personal_seguridad4_id: atencionData.personal_seguridad4_id
          ? Number(atencionData.personal_seguridad4_id)
          : undefined,
        fecha_despacho: toBackendDatetime(atencionData.fecha_despacho) || undefined,
        turno: atencionData.turno || undefined,
        tiempo_respuesta_minutos: atencionData.tiempo_respuesta_minutos
          ? Number(atencionData.tiempo_respuesta_minutos)
          : undefined,
        observaciones: atencionData.observaciones || undefined,
        estado_novedad_id: atencionData.estado_novedad_id
          ? Number(atencionData.estado_novedad_id)
          : undefined,
        requiere_seguimiento: atencionData.requiere_seguimiento ? 1 : 0,
        fecha_llegada: atencionData.fecha_llegada || undefined,
        fecha_cierre: atencionData.fecha_cierre || undefined,
        km_inicial: atencionData.km_inicial
          ? Number(atencionData.km_inicial)
          : undefined,
        km_final: atencionData.km_final
          ? Number(atencionData.km_final)
          : undefined,
        fecha_proxima_revision:
          atencionData.fecha_proxima_revision || undefined,
        perdidas_materiales_estimadas:
          atencionData.perdidas_materiales_estimadas
            ? Number(atencionData.perdidas_materiales_estimadas)
            : undefined,
      });
      toast.success("Atención registrada exitosamente");
      setShowAtencionModal(false);
      setSelectedNovedad(null);
      fetchNovedades({ nextPage: page });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Error al registrar atención"
      );
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleLimpiarFiltros
   * Limpia los filtros de búsqueda y recarga la lista inicial de novedades.
   *
   * @returns {Promise<void>}
   */
  const handleLimpiarFiltros = async () => {
    setSearch("");
    setFilterTipo("");
    setFilterEstado(""); // Cambiar a "Todos" en lugar de "1"
    setFilterPrioridad("");
    setFilterOrigenLlamada("");
    setFilters({
      fecha_inicio: "",
      fecha_fin: "",
    });
    setPage(1);
    // Fetch con filtros vacíos directamente (sin esperar actualización de estado)
    setLoading(true);
    try {
      const result = await listNovedades({
        page: 1,
        limit: 10,
      });
      setNovedades(result?.novedades || []);
      setPagination(result?.pagination || null);
    } catch (err) {
      console.error("Error al limpiar filtros:", err);
      toast.error("Error al cargar novedades");
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Helpers para Panel REGISTRO DE LA NOVEDAD

  /**
   * handleDireccionSearch - Busca direcciones mientras el usuario escribe
   */
  const handleDireccionSearch = async (value) => {
    if (!value || value.trim().length < 3) {
      setDireccionMatch(null);
      setShowManualLocation(false);
      setDireccionesOptions([]);
      setSelectedDireccionId("");
      return;
    }

    setSearchingDireccion(true);
    try {
      const results = await searchDirecciones({ calle: value });
      if (results && results.length > 0) {
        // Guardar opciones para el dropdown
        setDireccionesOptions(results);
        // No auto-completar, esperar selección del usuario
        setDireccionMatch(null);
        setShowManualLocation(false);
      } else {
        // No match - no mostrar dropdown
        setDireccionesOptions([]);
        setDireccionMatch(null);
        setShowManualLocation(false);
      }
    } catch (error) {
      console.error("Error al buscar dirección:", error);
      setDireccionesOptions([]);
    } finally {
      setSearchingDireccion(false);
    }
  };

  /**
   * handleCalleSearch - Filtra calles mientras el usuario escribe (para ingreso manual)
   */
  const handleCalleSearch = (searchText) => {
    setCalleSearchText(searchText);

    if (!searchText || searchText.length < 2) {
      setCallesFiltered([]);
      setShowCalleDropdown(false);
      return;
    }

    const searchLower = searchText.toLowerCase().trim();
    const filtered = calles.filter((calle) => {
      const nombreCompleto = (calle.nombre_completo || "").toLowerCase();
      return nombreCompleto.includes(searchLower);
    });

    setCallesFiltered(filtered.slice(0, 15)); // Limitar a 15 resultados
    setShowCalleDropdown(filtered.length > 0);
  };

  /**
   * handleCalleSelect - Cuando el usuario selecciona una calle del dropdown
   */
  const handleCalleSelect = (calle) => {
    setRegistroFormData((prev) => ({
      ...prev,
      calle_id: String(calle.id),
    }));
    setCalleSearchText(calle.nombre_completo || `${calle.tipo_via?.abreviatura || ""} ${calle.nombre_via}`.trim());
    setShowCalleDropdown(false);
    setCallesFiltered([]);
  };

  /**
   * handleClearCalle - Limpia la selección de calle
   */
  const handleClearCalle = () => {
    setRegistroFormData((prev) => ({
      ...prev,
      calle_id: "",
      sector_id: "",
      cuadrante_id: "",
    }));
    setCalleSearchText("");
    setCallesFiltered([]);
    setShowCalleDropdown(false);
    setAutoPopulatedFromCalle(false);
    setCuadrantesRegistro([]);
  };

  /**
   * lookupCallesCuadrantes - Busca en calles_cuadrantes para auto-poblar sector/cuadrante
   * Se ejecuta cuando se tiene calle_id + (numero_municipal OR manzana)
   */
  const lookupCallesCuadrantes = async (calleId) => {
    if (!calleId) return;

    try {
      const cuadrantesData = await getCuadrantesPorCalle(calleId);

      // getCuadrantesPorCalle retorna array de relaciones calle-cuadrante
      // Cada item tiene: calle_id, cuadrante_id, y posiblemente sector_id
      const items = Array.isArray(cuadrantesData) ? cuadrantesData : (cuadrantesData?.items || []);

      if (items.length > 0) {
        // Tomar el primer cuadrante encontrado para la calle
        const firstRelation = items[0];
        const cuadranteId = firstRelation.cuadrante_id;
        const sectorId = firstRelation.sector_id || firstRelation.cuadrante?.sector_id;

        if (sectorId && cuadranteId) {
          // Cargar los cuadrantes del sector primero
          await loadCuadrantesForSector(sectorId);

          // Actualizar el form con sector y cuadrante
          setRegistroFormData((prev) => ({
            ...prev,
            sector_id: String(sectorId),
            cuadrante_id: String(cuadranteId),
          }));

          // Marcar que fueron auto-poblados
          setAutoPopulatedFromCalle(true);
        }
      }
    } catch (error) {
      console.error("Error al buscar cuadrantes por calle:", error);
      // No mostrar error al usuario, simplemente no auto-poblar
    }
  };

  /**
   * handleSelectDireccion - Cuando el usuario selecciona una dirección del dropdown
   * Ahora también actualiza latitud, longitud y ubigeo_code
   */
  const handleSelectDireccion = (direccionId) => {
    if (!direccionId) {
      setSelectedDireccionId("");
      setDireccionMatch(null);
      setShowManualLocation(false);
      return;
    }

    const selected = direccionesOptions.find(
      (d) => d.id === parseInt(direccionId)
    );
    if (selected) {
      setSelectedDireccionId(direccionId);
      setDireccionMatch(selected);
      setShowManualLocation(false);

      // Obtener sector_id y cuadrante_id de la dirección
      const sectorId =
        selected.sector_id || selected.cuadrante?.sector_id || "";
      const cuadranteId = selected.cuadrante_id || "";

      // Formatear la dirección completa para mostrar en el campo de búsqueda
      const direccionFormateada = formatDireccionCompleta(selected);

      setRegistroFormData((prev) => ({
        ...prev,
        direccion_id: selected.id,
        referencia_ubicacion: direccionFormateada, // Actualizar con la dirección seleccionada
        detalles_ubicacion: "", // Limpiar detalles al seleccionar nueva dirección
        sector_id: sectorId ? String(sectorId) : "",
        cuadrante_id: cuadranteId ? String(cuadranteId) : "",
        latitud: selected.latitud || "",
        longitud: selected.longitud || "",
        ubigeo_code: selected.ubigeo_code || "",
      }));

      // Cargar cuadrantes del sector si existe
      if (sectorId) {
        loadCuadrantesForSector(sectorId);
      }
    }
  };

  /**
   * Función para construir dirección completa para geocodificación en formulario manual
   */
  const construirDireccionManualParaGeocodificar = () => {
    const partes = [];
    
    // Obtener nombre de la calle seleccionada
    if (registroFormData.calle_id && calles) {
      const calle = calles.find(c => c.id === parseInt(registroFormData.calle_id));
      if (calle?.nombre_completo) {
        partes.push(calle.nombre_completo);
      }
    }
    
    // Número municipal
    if (registroFormData.numero_municipal) {
      partes.push(registroFormData.numero_municipal);
    }
    
    // Manzana y Lote
    if (registroFormData.manzana && registroFormData.lote) {
      partes.push(`Mz. ${registroFormData.manzana} Lt. ${registroFormData.lote}`);
    }
    
    // Urbanización
    if (registroFormData.urbanizacion) {
      partes.push(registroFormData.urbanizacion);
    }
    
    // Referencia
    if (registroFormData.referencia_ubicacion) {
      partes.push(`(${registroFormData.referencia_ubicacion})`);
    }
    
    return partes.join(" ");
  };

  /**
   * Handler para geocodificar dirección manual en formulario de novedades
   */
  const handleGeocodificarDireccionManual = async () => {
    const direccionCompleta = construirDireccionManualParaGeocodificar();
    
    if (!direccionCompleta || direccionCompleta.length < 5) {
      toast.error("Por favor, ingrese al menos una calle y número");
      return;
    }
    
    setLoadingGeocoding(true);
    setGeocodingData(null);
    
    try {
      const resultado = await geocodificarDireccion(direccionCompleta);
      
      // Validar que las coordenadas sean válidas para Perú
      if (!validarCoordenadasPeru(resultado.latitud, resultado.longitud)) {
        toast("Las coordenadas obtenidas están fuera del territorio peruano", { icon: "⚠️" });
      }
      
      // Actualizar el formulario de registro con las coordenadas
      setRegistroFormData(prev => ({
        ...prev,
        latitud: resultado.latitud != null ? resultado.latitud.toString() : "",
        longitud: resultado.longitud != null ? resultado.longitud.toString() : ""
      }));
      
      // Guardar datos de geocodificación para mostrar información
      setGeocodingData(resultado);
      
      // Mostrar toast de éxito con información detallada
      const locationType = getDescripcionLocationType(resultado.location_type);
      const fuente = getDescripcionFuente(resultado.fuente_geocodificacion);
      
      toast.success(`📍 Dirección geocodificada (${locationType}) - Fuente: ${fuente}`);

    } catch (error) {
      console.error('Error en geocodificación manual:', error);
      toast.error(error.message || "No se pudo geocodificar la dirección");
      setGeocodingData(null);
    } finally {
      setLoadingGeocoding(false);
    }
  };

  /**
   * handleSaveRegistro - Guarda la novedad desde el panel REGISTRO
   */
  const handleSaveRegistro = async () => {
    // 0. Auto-generar referencia_ubicacion si estamos en modo manual y no existe
    let workingFormData = { ...registroFormData };

    if (!direccionMatch && showManualLocation && !workingFormData.referencia_ubicacion) {
      // Buscar la calle seleccionada para obtener su nombre
      const calleSeleccionada = calles.find(c => String(c.id) === String(workingFormData.calle_id));
      if (calleSeleccionada) {
        const calleName = calleSeleccionada.nombre_completo ||
          `${calleSeleccionada.tipo_via?.abreviatura || ""} ${calleSeleccionada.nombre_via}`.trim();

        // Construir referencia_ubicacion desde los datos manuales
        let referenciaAuto = calleName;
        if (workingFormData.numero_municipal) {
          referenciaAuto += ` N° ${workingFormData.numero_municipal}`;
        }
        if (workingFormData.manzana && workingFormData.lote) {
          referenciaAuto += ` Mz. ${workingFormData.manzana} Lt. ${workingFormData.lote}`;
        } else if (workingFormData.manzana) {
          referenciaAuto += ` Mz. ${workingFormData.manzana}`;
        }
        if (workingFormData.urbanizacion) {
          referenciaAuto += `, ${workingFormData.urbanizacion}`;
        }

        workingFormData.referencia_ubicacion = referenciaAuto;
        // Actualizar el estado también
        setRegistroFormData(prev => ({ ...prev, referencia_ubicacion: referenciaAuto }));
      }
    }

    // 1. Validar formulario (usando workingFormData actualizado)
    const errors = [];

    // Campos requeridos básicos
    if (!workingFormData.fecha_hora_ocurrencia) {
      errors.push("Fecha y hora de ocurrencia es requerida");
    }

    if (!workingFormData.referencia_ubicacion) {
      errors.push("Dirección de referencia es requerida");
    }

    // Validación condicional según origen_llamada
    if (workingFormData.origen_llamada === "RADIO_TETRA") {
      if (!workingFormData.radio_tetra_id) {
        errors.push("Debe seleccionar un radio TETRA");
      }
    } else {
      // Para otros orígenes, validar teléfono si no es anónimo
      if (workingFormData.es_anonimo === 0 && !workingFormData.reportante_telefono) {
        errors.push("Teléfono del reportante es requerido");
      }
    }

    // Si no hay match de dirección, validar campos manuales
    if (!direccionMatch && showManualLocation) {
      if (!workingFormData.calle_id) errors.push("Debe seleccionar una calle");
      if (!workingFormData.sector_id) errors.push("Debe seleccionar un sector");
      if (!workingFormData.cuadrante_id) errors.push("Debe seleccionar un cuadrante");
    }

    // Incidente
    if (!workingFormData.tipo_novedad_id) errors.push("Tipo de novedad es requerido");
    if (!workingFormData.subtipo_novedad_id) errors.push("Subtipo es requerido");
    if (!workingFormData.descripcion || workingFormData.descripcion.trim().length < 10) {
      errors.push("Descripción debe tener al menos 10 caracteres");
    }

    // Reportante (solo si NO es anónimo)
    if (workingFormData.es_anonimo === 0) {
      if (!workingFormData.reportante_nombre) {
        errors.push("Nombre del reportante es requerido");
      }
      if (!workingFormData.reportante_doc_identidad) {
        errors.push("Documento de identidad es requerido");
      }
    }

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    // Limpiar errores de validación previos
    setValidationError(null);

    setSaving(true);
    let finalDireccionId = workingFormData.direccion_id;

    try {
      // 2. Crear dirección SI NO existe match (dirección manual)
      if (!direccionMatch && showManualLocation) {
        // Construir direccion_completa para la nueva dirección (sin detalles_ubicacion que va a novedad)
        const direccionCompletaTexto = formatDireccionManual(
          { ...workingFormData, detalles_ubicacion: "" }, // Sin detalles, esos van a novedad
          calles
        );

        const direccionPayload = {
          calle_id: workingFormData.calle_id ? Number(workingFormData.calle_id) : null,
          sector_id: workingFormData.sector_id ? Number(workingFormData.sector_id) : null,
          cuadrante_id: workingFormData.cuadrante_id ? Number(workingFormData.cuadrante_id) : null,
          numero_municipal: workingFormData.numero_municipal || null,
          referencia: workingFormData.detalles_ubicacion || null, // Solo detalles adicionales como referencia
          direccion_completa: direccionCompletaTexto || null, // Texto concatenado de la dirección
          tipo_complemento: workingFormData.tipo_complemento || null,
          numero_complemento: workingFormData.numero_complemento || null,
          manzana: workingFormData.manzana || null,
          lote: workingFormData.lote || null,
          urbanizacion: workingFormData.urbanizacion || null,
          ubigeo_code: workingFormData.ubigeo_code || defaultUbigeo?.code || null,
          // Latitud y longitud son opcionales
          latitud: workingFormData.latitud && workingFormData.latitud !== "" ? parseFloat(workingFormData.latitud) : null,
          longitud: workingFormData.longitud && workingFormData.longitud !== "" ? parseFloat(workingFormData.longitud) : null,
          // Datos de geocodificación (si se geocodificó la dirección)
          geocodificada: geocodingData ? 1 : 0,
          fuente_geocodificacion: geocodingData?.fuente_geocodificacion || null,
          location_type: geocodingData?.location_type || null,
          verificada: 0, // Marcar como no verificada
        };

        const nuevaDireccion = await createDireccion(direccionPayload);
        finalDireccionId = nuevaDireccion.id;
        toast.success("Nueva dirección creada");
      }

      // 3. Crear novedad (latitud y longitud son opcionales)
      const latitudValue = workingFormData.latitud && workingFormData.latitud !== "" ? parseFloat(workingFormData.latitud) : null;
      const longitudValue = workingFormData.longitud && workingFormData.longitud !== "" ? parseFloat(workingFormData.longitud) : null;

      const novedadPayload = {
        origen_llamada: workingFormData.origen_llamada,
        reportante_telefono: workingFormData.origen_llamada === "RADIO_TETRA" ? null : workingFormData.reportante_telefono,
        radio_tetra_id: workingFormData.origen_llamada === "RADIO_TETRA" ? workingFormData.radio_tetra_id : null,
        fecha_hora_ocurrencia: toBackendDatetime(workingFormData.fecha_hora_ocurrencia),
        es_anonimo: workingFormData.es_anonimo,
        reportante_tipo_doc: workingFormData.reportante_tipo_doc,
        // Concatenar tipo de documento con número
        reportante_doc_identidad: workingFormData.reportante_doc_identidad
          ? `${workingFormData.reportante_tipo_doc} ${workingFormData.reportante_doc_identidad}`
          : "",
        reportante_nombre: workingFormData.reportante_nombre,
        direccion_id: finalDireccionId ? Number(finalDireccionId) : null,
        // Solo guardar detalles adicionales en referencia_ubicacion (no el campo de búsqueda)
        referencia_ubicacion: workingFormData.detalles_ubicacion || null,
        // Si hay dirección seleccionada, usar su direccion_completa, sino construir desde datos manuales
        localizacion: direccionMatch
          ? formatDireccionCompleta(direccionMatch)
          : formatDireccionManual(workingFormData, calles),
        tipo_novedad_id: Number(workingFormData.tipo_novedad_id),
        subtipo_novedad_id: Number(workingFormData.subtipo_novedad_id),
        descripcion: workingFormData.descripcion,
        prioridad_actual: workingFormData.prioridad_actual || "MEDIA",
        personal_cargo_id: workingFormData.personal_cargo_id ? Number(workingFormData.personal_cargo_id) : null,
        estado_novedad_id: 1, // Pendiente De Registro
        created_by: user?.id,
        sector_id: workingFormData.sector_id ? Number(workingFormData.sector_id) : null,
        cuadrante_id: workingFormData.cuadrante_id ? Number(workingFormData.cuadrante_id) : null,
        latitud: latitudValue,
        longitud: longitudValue,
        ubigeo_code: workingFormData.ubigeo_code || defaultUbigeo?.code || null,
      };

      const resultado = await createNovedad(novedadPayload);

      toast.success(
        `Novedad ${resultado?.data?.novedad_code || "creada"} exitosamente`
      );
      resetRegistroForm();
      setPageTab(PAGE_TABS.LISTADO);

      // Recargar lista
      await fetchNovedades({ nextPage: 1 });
    } catch (error) {
      console.error("Error al guardar novedad:", error);
      
      // Usar la nueva utilidad de errores
      setValidationError(error);
      showValidationError(error, toast, "Error al crear novedad");
    } finally {
      setSaving(false);
    }
  };

  /**
   * loadCuadrantesForSector - Carga cuadrantes cuando se selecciona un sector manualmente
   */
  const loadCuadrantesForSector = async (sectorId) => {
    try {
      const data = await listCuadrantesService({
        sector_id: sectorId,
        limit: 100, // Backend requiere límite máximo de 100
      });
      setCuadrantesRegistro(data.items || data || []);
    } catch (error) {
      console.error("Error al cargar cuadrantes del sector:", error);
      toast.error(
        `Error al cargar cuadrantes del sector: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  /**
   * resetRegistroForm - Limpia el formulario REGISTRO
   */
  const resetRegistroForm = () => {
    setRegistroFormData({
      origen_llamada: "TELEFONO_107",
      reportante_telefono: "",
      radio_tetra_id: null,
      fecha_hora_ocurrencia: getCurrentDateTimeLocal(),
      es_anonimo: 0,
      reportante_tipo_doc: "DNI",
      reportante_doc_identidad: "",
      reportante_nombre: "",
      referencia_ubicacion: "",
      detalles_ubicacion: "",
      direccion_id: "",
      calle_id: "",
      numero_municipal: "",
      sector_id: "",
      cuadrante_id: "",
      localizacion: "",
      ubigeo_code: defaultUbigeo?.code || "", // Usar ubigeo por defecto
      tipo_complemento: "",
      numero_complemento: "",
      manzana: "",
      lote: "",
      urbanizacion: "",
      tipo_novedad_id: "",
      subtipo_novedad_id: "",
      descripcion: "",
      prioridad_actual: "",
      personal_cargo_id: "",
      estado_novedad_id: 2,
    });
    setDireccionMatch(null);
    setSearchingDireccion(false);
    setShowManualLocation(false);
    setDireccionesOptions([]);
    setSelectedDireccionId("");
    // Limpiar estados de autocomplete de calle
    setCalleSearchText("");
    setCallesFiltered([]);
    setShowCalleDropdown(false);
    setAutoPopulatedFromCalle(false);
    setCuadrantesRegistro([]);
    // Limpiar buscador tipo/subtipo
    setSearchTipoSubtipo("");
    setShowTipoSubtipoDropdown(false);
    // Limpiar errores de validación y datos de geocodificación
    setValidationError(null);
    setGeocodingData(null);
  };

  /**
   * openViewingModal
   * - Abre el modal de visualización desde el botón Eye
   * - Siempre carga datos actualizados desde el backend
   */
  const openViewingModal = async (novedad) => {
    setViewingFromTruck(false); // Abierto desde Eye
    
    // Cargar catálogos si no están disponibles
    if (
      unidadesOficina.length === 0 ||
      vehiculos.length === 0 ||
      personalSeguridad.length === 0
    ) {
      await fetchCatalogosAtencion();
    }
    
    try {
      // Cargar siempre datos actualizados desde backend
      const [novedadCompleta] = await Promise.all([
        getNovedadById(novedad.id),
        getHistorialEstados(novedad.id),
      ]);
      if (novedadCompleta) {
        setViewingNovedad(novedadCompleta);
      }
    } catch (err) {
      console.error("Error cargando detalles de novedad:", err);
      toast.error("Error al cargar detalles de la novedad");
    }
  };

  /**
   * openViewingModalFromTruck
   * - Abre el modal de visualización desde el botón Truck
   * - Siempre carga datos actualizados desde el backend
   */
  const openViewingModalFromTruck = async (novedad) => {
    setViewingFromTruck(true); // Abierto desde Truck - DEBE SER ANTES
    setViewingNovedad(novedad); // Mostrar datos básicos inmediatamente
    
    // Cargar catálogos si no están disponibles
    if (
      unidadesOficina.length === 0 ||
      vehiculos.length === 0 ||
      personalSeguridad.length === 0
    ) {
      await fetchCatalogosAtencion();
    }
    
    try {
      const [novedadCompleta] = await Promise.all([
        getNovedadById(novedad.id),
        getHistorialEstados(novedad.id),
      ]);
      if (novedadCompleta) {
        setViewingNovedad(novedadCompleta);
      }
    } catch (err) {
      console.error("Error cargando detalles de novedad:", err);
    }
  };

  // Helpers para colores
  /**
   * prioridadColor
   * Retorna clases CSS para representar la prioridad visualmente.
   *
   * @param {string} prioridad - 'ALTA'|'MEDIA'|'BAJA'
   * @returns {string} - clases CSS
   */
  const prioridadColor = (prioridad) => {
    switch (prioridad) {
      case "ALTA":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "MEDIA":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "BAJA":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  /**
   * estadoColor
   * Devuelve estilos o clases según el estado recibido. Soporta color_hex proveniente del backend.
   *
   * @param {Object} estado - Objeto estado que puede contener `color_hex` y `nombre`
   * @returns {string|Object} - cadena de clases o un objeto style
   */
  const estadoColor = (estado) => {
    const colorHex = estado?.color_hex;
    if (colorHex) {
      return { backgroundColor: colorHex + "20", color: colorHex };
    }
    const nombre = estado?.nombre?.toLowerCase() || "";
    if (nombre.includes("registrad"))
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    if (nombre.includes("atenci") || nombre.includes("proceso"))
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    if (nombre.includes("despach"))
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    if (nombre.includes("resuel") || nombre.includes("cerrad"))
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  };

  // Tabs del formulario
  const FORM_TABS = [
    { id: 0, label: "Datos Básicos", icon: FileText },
    { id: 1, label: "Ubicación", icon: MapPin },
    { id: 2, label: "Reportante", icon: User },
    { id: 3, label: "Descripción", icon: FileText },
  ];

  // Formatear fecha para mostrar
  /**
   * formatFecha
   * Formatea fechas en el locale 'es-PE' para mostrar en la UI con día/mes/año y hora.
   *
   * @param {string|Date} fecha
   * @returns {string}
   */
  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    const d = new Date(fecha);
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Novedades
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registro de incidentes y novedades
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchNovedades({ nextPage: page })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Refrescar
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setPageTab(PAGE_TABS.REGISTRO);
                resetRegistroForm();
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800"
            >
              <Plus size={16} />
              Nueva Novedad
            </button>
          )}
        </div>
      </div>

      {/* 🆕 Tabs de Página (LISTADO | REGISTRO) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={() => setPageTab(PAGE_TABS.LISTADO)}
            className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors ${
              pageTab === PAGE_TABS.LISTADO
                ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={18} />
              <span>LISTADO</span>
            </div>
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setPageTab(PAGE_TABS.REGISTRO);
                resetRegistroForm();
              }}
              className={`flex-1 sm:flex-none px-6 py-3 text-sm font-medium transition-colors ${
                pageTab === PAGE_TABS.REGISTRO
                  ? "bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus size={18} />
                <span>REGISTRO DE LA NOVEDAD</span>
              </div>
            </button>
          )}
        </div>

        {/* Tab Content - LISTADO */}
        {pageTab === PAGE_TABS.LISTADO && (
          <div className="p-6 space-y-6">
            {/* Filtros */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
              {/* Primera fila - Búsqueda y filtros principales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
                <div className="relative lg:col-span-2">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                    size={16}
                  />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      if (e.target.value) {
                        setFilterTipo("");
                        setFilterEstado("");
                        setFilterPrioridad("");
                        setFilterOrigenLlamada("");
                      }
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Buscar por código, descripción, ubicación, teléfono..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  />
                </div>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-2 py-1.5 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                >
                  <option value="">Todos los tipos</option>
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-2 py-1.5 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                >
                  <option value="">Todos los estados</option>
                  {estados.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
                <select
                  value={filterPrioridad}
                  onChange={(e) => setFilterPrioridad(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-2 py-1.5 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                >
                  <option value="">Todas las prioridades</option>
                  {PRIORIDAD_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 text-xs rounded-lg bg-slate-800 dark:bg-slate-700 text-white px-3 py-1.5 font-medium hover:bg-slate-900 dark:hover:bg-slate-600"
                  >
                    Buscar
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Limpiar filtros"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              
              {/* Segunda fila - Filtros de fecha + Origen Llamada */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                <div>
                  <input
                    type="date"
                    value={filters.fecha_inicio}
                    onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
                    placeholder="Fecha inicio"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={filters.fecha_fin}
                    onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
                    placeholder="Fecha fin"
                  />
                </div>
                <select
                  value={filterOrigenLlamada}
                  onChange={(e) => setFilterOrigenLlamada(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-2 py-1.5 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                >
                  <option value="">Todos los orígenes</option>
                  {ORIGEN_LLAMADA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="overflow-x-auto" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-20">
                        Código
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-32">
                        Fecha/Hora
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-40">
                        Origen
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-48">
                        Tipo
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-36 hidden md:table-cell">
                        Ubicación
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-20">
                        Prioridad
                      </th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-700 dark:text-slate-200 w-32">
                        Acciones
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200 w-32">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Cargando...
                        </td>
                      </tr>
                    ) : novedades.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No hay registros
                        </td>
                      </tr>
                    ) : (
                      novedades.map((n) => (
                        <tr
                          key={n.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                            n.deleted_at ? "opacity-50" : ""
                          }`}
                        >
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-50 font-mono font-medium whitespace-nowrap">
                            {n.novedad_code || "—"}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {formatFecha(n.fecha_hora_ocurrencia)}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            <OrigenLlamadaCell 
                              origen={n.origen_llamada} 
                              showLabel={false}
                              size="sm"
                            />
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {n.novedadTipoNovedad?.nombre || "—"}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {n.novedadSubtipoNovedad?.nombre || ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-200 max-w-[150px] truncate hidden md:table-cell">
                            {n.localizacion
                              ? n.referencia_ubicacion
                                ? `${n.localizacion} (${n.referencia_ubicacion})`
                                : n.localizacion
                              : n.referencia_ubicacion || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${prioridadColor(
                                n.prioridad_actual
                              )}`}
                            >
                              {n.prioridad_actual || "MEDIA"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openViewingModal(n)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Ver detalle"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (n.estado_novedad_id === 1) {
                                    // Abrir directamente DespacharModal cuando estado es 1 (Pendiente de Registro)
                                    openSeguimientoModal(n);
                                  } else {
                                    // Abrir panel intermedio para otros estados
                                    openViewingModalFromTruck(n);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Despachar novedad"
                              >
                                <Truck size={14} />
                              </button>
                              {canEdit && !n.deleted_at && (
                                <button
                                  onClick={() => openAtencionModal(n)}
                                  className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  title="Atender novedad"
                                >
                                  <Shield size={14} />
                                </button>
                              )}
                              {canDelete && !n.deleted_at && (
                                <button
                                  onClick={() => handleDelete(n)}
                                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                typeof estadoColor(n.novedadEstado) === "string"
                                  ? estadoColor(n.novedadEstado)
                                  : ""
                              }`}
                              style={
                                typeof estadoColor(n.novedadEstado) === "object"
                                  ? estadoColor(n.novedadEstado)
                                  : {}
                              }
                            >
                              {n.novedadEstado?.nombre || "—"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pagination && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-500">
                    Mostrando {novedades.length} de {pagination.total || 0}
                  </span>
                  <div className="flex gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-3 py-2 text-sm">
                      {page} / {pagination.totalPages || 1}
                    </span>
                    <button
                      disabled={page >= (pagination.totalPages || 1)}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content - REGISTRO */}
        {pageTab === PAGE_TABS.REGISTRO && (
          <div className="p-6">
            {/* Mostrar errores de validación si existen */}
            {validationError && (
              <div className="mb-6">
                <ValidationErrorDisplay
                  error={validationError}
                  onClose={() => setValidationError(null)}
                  variant="detailed"
                />
              </div>
            )}
            
            {/* Formulario REGISTRO - Versión Completa */}
            <div className="space-y-8">
              {/* Grupo 1: Información de Origen */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Phone
                    className="text-primary-600 dark:text-primary-400"
                    size={20}
                  />
                  Información de Origen
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Origen de Llamada <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="select_origen_llamada"
                      value={registroFormData.origen_llamada}
                      onChange={(e) => {
                        const nuevoOrigen = e.target.value;
                        setRegistroFormData({
                          ...registroFormData,
                          origen_llamada: nuevoOrigen,
                          // Limpiar campos según el nuevo origen
                          reportante_telefono: nuevoOrigen === "RADIO_TETRA" ? "" : registroFormData.reportante_telefono,
                          radio_tetra_id: nuevoOrigen === "RADIO_TETRA" ? null : registroFormData.radio_tetra_id,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      {NUEVOS_ORIGEN_LLAMADA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Campo condicional: Teléfono del Reportante O Radio TETRA */}
                  {registroFormData.origen_llamada === "RADIO_TETRA" ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Radio TETRA <span className="text-red-500">*</span>
                      </label>
                      
                      {loadingRadios && (
                        <div className="flex items-center gap-2 p-3 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                          <span>Cargando radios...</span>
                        </div>
                      )}
                      
                      {errorRadios && !loadingRadios && (
                        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span>{errorRadios}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setLoadingRadios(true);
                                setErrorRadios("");
                                listRadiosTetra()
                                  .then((data) => {
                                    setRadiosTetra(Array.isArray(data) ? data : []);
                                    if (data.length === 0) {
                                      setErrorRadios("No hay radios TETRA disponibles");
                                    }
                                  })
                                  .catch((err) => {
                                    console.error("Error recargando radios:", err);
                                    setErrorRadios("Error al cargar radios TETRA");
                                  })
                                  .finally(() => setLoadingRadios(false));
                              }}
                              className="ml-2 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Reintentar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!loadingRadios && !errorRadios && (
                        <select
                          value={registroFormData.radio_tetra_id || ""}
                          onChange={(e) => {
                            const radioId = e.target.value ? Number(e.target.value) : null;
                            const selectedRadio = radiosTetra.find(r => r.id === radioId);

                            // Auto-poblar datos del reportante si el radio tiene personal asignado
                            if (selectedRadio?.personalAsignado) {
                              const personal = selectedRadio.personalAsignado;
                              const nombreCompleto = [personal.nombres, personal.apellido_paterno, personal.apellido_materno]
                                .filter(Boolean).join(' ');

                              setRegistroFormData({
                                ...registroFormData,
                                radio_tetra_id: radioId,
                                reportante_nombre: nombreCompleto || registroFormData.reportante_nombre,
                                reportante_tipo_doc: personal.doc_tipo || "DNI",
                                reportante_doc_identidad: personal.doc_numero || registroFormData.reportante_doc_identidad,
                              });
                            } else {
                              setRegistroFormData({
                                ...registroFormData,
                                radio_tetra_id: radioId,
                              });
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccione un radio...</option>
                          {radiosTetra.map((radio) => (
                            <option key={radio.id} value={radio.id}>
                              {radio.radio_tetra_code} - {radio.descripcion || 'Sin descripción'}
                              {radio.personalAsignado && ` (${radio.personalAsignado.nombres || ''} ${radio.personalAsignado.apellido_paterno || ''})`}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {!loadingRadios && !errorRadios && radiosTetra.length === 0 && (
                        <div className="p-3 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                          <span>No hay radios TETRA disponibles en este momento</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Teléfono del Reportante
                      </label>
                      <input
                        type="tel"
                        value={registroFormData.reportante_telefono}
                        onChange={(e) =>
                          setRegistroFormData({
                            ...registroFormData,
                            reportante_telefono: e.target.value,
                          })
                        }
                        placeholder="999 999 999"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Fecha y Hora de Ocurrencia{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={registroFormData.fecha_hora_ocurrencia}
                      readOnly
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Se asigna automáticamente la fecha y hora actual
                    </p>
                  </div>
                </div>
              </div>
              {/* Grupo 2: Información del Reportante */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User
                    className="text-primary-600 dark:text-primary-400"
                    size={20}
                  />
                  Información del Reportante
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={registroFormData.es_anonimo === 1}
                        onChange={(e) =>
                          setRegistroFormData({
                            ...registroFormData,
                            es_anonimo: e.target.checked ? 1 : 0,
                            reportante_nombre: e.target.checked
                              ? ""
                              : registroFormData.reportante_nombre,
                            reportante_doc_identidad: e.target.checked
                              ? ""
                              : registroFormData.reportante_doc_identidad,
                          })
                        }
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Reportante Anónimo
                      </span>
                    </label>
                  </div>
                  {registroFormData.es_anonimo === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Nombre Completo{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={registroFormData.reportante_nombre}
                          onChange={(e) =>
                            setRegistroFormData({
                              ...registroFormData,
                              reportante_nombre: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="Nombres y apellidos"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Tipo de Documento{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={registroFormData.reportante_tipo_doc}
                          onChange={(e) =>
                            setRegistroFormData({
                              ...registroFormData,
                              reportante_tipo_doc: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        >
                          {TIPO_DOCUMENTO_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Documento de Identidad{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={registroFormData.reportante_doc_identidad}
                          onChange={(e) =>
                            setRegistroFormData({
                              ...registroFormData,
                              reportante_doc_identidad: e.target.value,
                            })
                          }
                          placeholder="Ej: 12345678"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Grupo 3: Información de Ubicación */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin
                    className="text-primary-600 dark:text-primary-400"
                    size={20}
                  />
                  Información de Ubicación
                </h3>
                <div className="space-y-4">
                  {/* Campo de búsqueda de dirección con sugerencias inline */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      {direccionMatch ? "Dirección Seleccionada" : "Buscar Dirección"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={registroFormData.referencia_ubicacion}
                        onChange={(e) => {
                          // Solo permitir búsqueda si no hay dirección seleccionada
                          if (!direccionMatch) {
                            setRegistroFormData({
                              ...registroFormData,
                              referencia_ubicacion: e.target.value,
                            });
                            handleDireccionSearch(e.target.value);
                          }
                        }}
                        readOnly={!!direccionMatch}
                        placeholder="Escriba para buscar una dirección..."
                        className={`w-full px-3 py-2 rounded-lg border text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                          direccionMatch
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                        }`}
                      />
                      {searchingDireccion && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        </div>
                      )}
                      {/* Botón X para limpiar cuando hay dirección seleccionada */}
                      {direccionMatch && (
                        <button
                          type="button"
                          onClick={() => {
                            setDireccionMatch(null);
                            setSelectedDireccionId("");
                            setRegistroFormData((prev) => ({
                              ...prev,
                              direccion_id: "",
                              referencia_ubicacion: "",
                              detalles_ubicacion: "",
                              sector_id: "",
                              cuadrante_id: "",
                              latitud: "",
                              longitud: "",
                              ubigeo_code: "",
                            }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500"
                          title="Cambiar dirección"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {/* Sugerencias inline de direcciones */}
                    {direccionesOptions.length > 0 && !direccionMatch && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {direccionesOptions.map((dir) => (
                          <button
                            key={dir.id}
                            type="button"
                            onClick={() => handleSelectDireccion(String(dir.id))}
                            className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-600 last:border-0"
                          >
                            <div className="font-medium text-slate-900 dark:text-slate-50">
                              {formatDireccionCompleta(dir)}
                            </div>
                            <div className="flex gap-2 mt-1">
                              {dir.sector?.nombre && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                  {dir.sector.nombre}
                                </span>
                              )}
                              {dir.cuadrante?.nombre && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  {dir.cuadrante.nombre}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Mensaje cuando no hay resultados */}
                    {registroFormData.referencia_ubicacion &&
                      registroFormData.referencia_ubicacion.length >= 3 &&
                      direccionesOptions.length === 0 &&
                      !searchingDireccion &&
                      !direccionMatch && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          No se encontraron direcciones. Puede{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setDireccionesOptions([]);
                              setDireccionMatch(null);
                              setSelectedDireccionId("");
                              setShowManualLocation(true);
                            }}
                            className="text-primary-600 hover:underline font-medium"
                          >
                            ingresar manualmente
                          </button>
                        </p>
                      )}

                    {/* Helper con mínimo de caracteres */}
                    {!direccionMatch &&
                      registroFormData.referencia_ubicacion &&
                      registroFormData.referencia_ubicacion.length < 3 &&
                      registroFormData.referencia_ubicacion.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Escriba al menos 3 caracteres para buscar
                        </p>
                      )}
                  </div>
                  {/* Dirección seleccionada con badges */}
                  {direccionMatch && (
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                            ✓ Dirección seleccionada:
                          </p>
                          <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                            {formatDireccionCompleta(direccionMatch)}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium">
                              Sector:{" "}
                              {direccionMatch.sector?.nombre ||
                                direccionMatch.cuadrante?.sector?.nombre ||
                                sectoresRegistro.find(
                                  (s) => s.id === direccionMatch.sector_id
                                )?.nombre ||
                                sectoresRegistro.find(
                                  (s) =>
                                    s.id ===
                                    parseInt(registroFormData.sector_id)
                                )?.nombre ||
                                (registroFormData.sector_id
                                  ? `ID: ${registroFormData.sector_id}`
                                  : "N/A")}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                              Cuadrante:{" "}
                              {direccionMatch.cuadrante?.nombre ||
                                cuadrantesRegistro.find(
                                  (c) => c.id === direccionMatch.cuadrante_id
                                )?.nombre ||
                                cuadrantesRegistro.find(
                                  (c) =>
                                    c.id ===
                                    parseInt(registroFormData.cuadrante_id)
                                )?.nombre ||
                                (registroFormData.cuadrante_id
                                  ? `ID: ${registroFormData.cuadrante_id}`
                                  : "N/A")}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setDireccionMatch(null);
                            setSelectedDireccionId("");
                            setRegistroFormData((prev) => ({
                              ...prev,
                              direccion_id: "",
                              referencia_ubicacion: "",
                              detalles_ubicacion: "",
                              sector_id: "",
                              cuadrante_id: "",
                              latitud: "",
                              longitud: "",
                              ubigeo_code: "",
                            }));
                          }}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Cambiar dirección"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Checkbox para entrada manual */}
                  {/* Mostrar siempre la opción de ingreso manual cuando NO hay una dirección seleccionada y no está en búsqueda. */}
                  {!direccionMatch && !searchingDireccion && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showManualLocation}
                          onChange={(e) => {
                            setShowManualLocation(e.target.checked);
                            // Reset auto-populated state when toggling manual location off
                            if (!e.target.checked) {
                              setAutoPopulatedFromCalle(false);
                              setCuadrantesRegistro([]);
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-600"
                        />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          No se encontró la dirección. Ingresar datos
                          manualmente
                        </span>
                      </label>
                    </div>
                  )}
                  {/* Formulario manual de dirección */}
                  {showManualLocation && !direccionMatch && (
                    <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
                        Complete los datos de la nueva dirección:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Calle con autocomplete */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Calle <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={calleSearchText}
                              onChange={(e) => handleCalleSearch(e.target.value)}
                              onFocus={() => {
                                if (calleSearchText.length >= 2) {
                                  handleCalleSearch(calleSearchText);
                                }
                              }}
                              placeholder="Escriba para buscar una calle..."
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            />
                            {/* Botón X para limpiar cuando hay calle seleccionada */}
                            {registroFormData.calle_id && (
                              <button
                                type="button"
                                onClick={handleClearCalle}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500"
                                title="Limpiar selección"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>

                          {/* Dropdown de resultados de calles */}
                          {showCalleDropdown && callesFiltered.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                              {callesFiltered.map((calle) => (
                                <button
                                  key={calle.id}
                                  type="button"
                                  onClick={() => handleCalleSelect(calle)}
                                  className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-600 last:border-0"
                                >
                                  <div className="font-medium text-slate-900 dark:text-slate-50 text-sm">
                                    {calle.nombre_completo || `${calle.tipo_via?.abreviatura || ""} ${calle.nombre_via}`.trim()}
                                  </div>
                                  {calle.urbanizacion && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {calle.urbanizacion}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Mensaje de ayuda */}
                          {calleSearchText && calleSearchText.length < 2 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              Escriba al menos 2 caracteres
                            </p>
                          )}
                          {calleSearchText && calleSearchText.length >= 2 && callesFiltered.length === 0 && !registroFormData.calle_id && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              No se encontraron calles
                            </p>
                          )}
                          {/* Indicador de calle seleccionada */}
                          {registroFormData.calle_id && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              ✓ Calle seleccionada
                            </p>
                          )}
                        </div>

                        {/* Número Municipal */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Número Municipal/Letra
                          </label>
                          <input
                            type="text"
                            value={registroFormData.numero_municipal || ""}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                numero_municipal: e.target.value,
                              })
                            }
                            placeholder="Ej: 123, 45-A"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        {/* Manzana */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Manzana
                          </label>
                          <input
                            type="text"
                            value={registroFormData.manzana}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                manzana: e.target.value,
                              })
                            }
                            placeholder="Ej: A, B, 1"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        {/* Lote */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Lote
                          </label>
                          <input
                            type="text"
                            value={registroFormData.lote}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                lote: e.target.value,
                              })
                            }
                            placeholder="Ej: 10, 15"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        {/* Urbanización - Solo si hay Manzana Y Lote */}
                        {registroFormData.manzana && registroFormData.lote && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Urbanización/AAHH
                            </label>
                            <input
                              type="text"
                              value={registroFormData.urbanizacion}
                              onChange={(e) =>
                                setRegistroFormData({
                                  ...registroFormData,
                                  urbanizacion: e.target.value,
                                })
                              }
                              placeholder="Nombre de urbanización o AAHH"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        )}

                        {/* Tipo de Complemento */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Tipo de Complemento
                          </label>
                          <select
                            value={registroFormData.tipo_complemento}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                tipo_complemento: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Sin complemento</option>
                            {TIPO_COMPLEMENTO_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Número de Complemento - Solo si se seleccionó tipo */}
                        {registroFormData.tipo_complemento && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Número de Complemento
                            </label>
                            <input
                              type="text"
                              value={registroFormData.numero_complemento}
                              onChange={(e) =>
                                setRegistroFormData({
                                  ...registroFormData,
                                  numero_complemento: e.target.value,
                                })
                              }
                              placeholder="Ej: 101, A, B"
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        )}

                        {/* Sector */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Sector <span className="text-red-500">*</span>
                            {autoPopulatedFromCalle && (
                              <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                                (auto)
                              </span>
                            )}
                          </label>
                          <select
                            value={registroFormData.sector_id}
                            onChange={(e) => {
                              setRegistroFormData({
                                ...registroFormData,
                                sector_id: e.target.value,
                                cuadrante_id: "",
                              });
                              if (e.target.value) {
                                loadCuadrantesForSector(e.target.value);
                              }
                            }}
                            disabled={autoPopulatedFromCalle}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 ${
                              autoPopulatedFromCalle
                                ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            }`}
                          >
                            <option value="">Seleccionar sector</option>
                            {sectoresRegistro.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.sector_code} - {s.nombre}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cuadrante */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Cuadrante <span className="text-red-500">*</span>
                            {autoPopulatedFromCalle && (
                              <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                                (auto)
                              </span>
                            )}
                          </label>
                          <select
                            value={registroFormData.cuadrante_id}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                cuadrante_id: e.target.value,
                              })
                            }
                            disabled={!registroFormData.sector_id || autoPopulatedFromCalle}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary-500 disabled:opacity-50 ${
                              autoPopulatedFromCalle
                                ? "border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-900/20 text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            }`}
                          >
                            <option value="">Seleccionar cuadrante</option>
                            {cuadrantesRegistro.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.cuadrante_code} - {c.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Detalles Adicionales */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Detalles Adicionales de Ubicación
                    </label>
                    <input
                      type="text"
                      value={registroFormData.detalles_ubicacion}
                      onChange={(e) => {
                        const detalles = e.target.value;
                        // En modo manual, solo guardar detalles sin tocar referencia_ubicacion
                        // En modo con dirección seleccionada, actualizar también referencia_ubicacion
                        if (showManualLocation && !direccionMatch) {
                          // Modo manual: solo guardar detalles
                          setRegistroFormData({
                            ...registroFormData,
                            detalles_ubicacion: detalles,
                          });
                        } else if (direccionMatch) {
                          // Modo con dirección seleccionada: concatenar a la dirección
                          const direccionBase = formatDireccionCompleta(direccionMatch);
                          const direccionCompleta = detalles
                            ? `${direccionBase} - ${detalles}`
                            : direccionBase;
                          setRegistroFormData({
                            ...registroFormData,
                            detalles_ubicacion: detalles,
                            referencia_ubicacion: direccionCompleta,
                          });
                        } else {
                          // Fallback: solo guardar detalles
                          setRegistroFormData({
                            ...registroFormData,
                            detalles_ubicacion: detalles,
                          });
                        }
                      }}
                      placeholder="Ej. Frente al parque, al costado del colegio..."
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {showManualLocation && !direccionMatch
                        ? "Este detalle se guardará como referencia adicional de la dirección"
                        : "Este detalle se agregará al final de la dirección seleccionada"}
                    </p>
                  </div>
                  {/* Campos para latitud, longitud y ubigeo (read-only si vienen de dirección seleccionada) */}
                    {/* Botón de geocodificación - solo visible en modo manual */}
                    {showManualLocation && !direccionMatch && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            📍 Geocodificación Automática
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Obtenga coordenadas GPS automáticamente para la dirección ingresada
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleGeocodificarDireccionManual}
                          disabled={loadingGeocoding || !registroFormData.calle_id}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {loadingGeocoding ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              Geocodificando...
                            </>
                          ) : (
                            <>
                              <MapPin size={16} />
                              Geocodificar
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Información de geocodificación */}
                    {geocodingData && showManualLocation && !direccionMatch && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-green-600 dark:text-green-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                              ✅ Dirección geocodificada exitosamente
                            </p>
                            <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                              <p>
                                <strong>Precisión:</strong> {getDescripcionLocationType(geocodingData.location_type)}
                              </p>
                              <p>
                                <strong>Fuente:</strong> {getDescripcionFuente(geocodingData.fuente_geocodificacion)}
                              </p>
                              <p>
                                <strong>Coordenadas:</strong> {parseFloat(geocodingData.latitud).toFixed(6)}, {parseFloat(geocodingData.longitud).toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Latitud{" "}
                        {direccionMatch && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            (auto)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={registroFormData.latitud || ""}
                        onChange={(e) => {
                          if (!direccionMatch) {
                            setRegistroFormData({
                              ...registroFormData,
                              latitud: e.target.value,
                            });
                          }
                        }}
                        readOnly={!!direccionMatch}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-900 dark:text-slate-50 ${
                          direccionMatch
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40"
                        }`}
                        placeholder="-12.0464"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Longitud{" "}
                        {direccionMatch && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            (auto)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={registroFormData.longitud || ""}
                        onChange={(e) => {
                          if (!direccionMatch) {
                            setRegistroFormData({
                              ...registroFormData,
                              longitud: e.target.value,
                            });
                          }
                        }}
                        readOnly={!!direccionMatch}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-900 dark:text-slate-50 ${
                          direccionMatch
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40"
                        }`}
                        placeholder="-77.0428"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                        Código Ubigeo{" "}
                        {direccionMatch && (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            (auto)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={registroFormData.ubigeo_code || ""}
                        onChange={(e) => {
                          if (!direccionMatch) {
                            setRegistroFormData({
                              ...registroFormData,
                              ubigeo_code: e.target.value,
                            });
                          }
                        }}
                        readOnly={!!direccionMatch}
                        className={`w-full rounded-lg border px-3 py-2 text-slate-900 dark:text-slate-50 ${
                          direccionMatch
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20 cursor-not-allowed"
                            : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40"
                        }`}
                        placeholder="150101"
                      />
                      {registroUbigeoInfo && (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          {registroUbigeoInfo.distrito} - {registroUbigeoInfo.provincia}, {registroUbigeoInfo.departamento}
                        </p>
                      )}
                    </div>
                  </div>{" "}
                  {/* Fin grid latitud/longitud/ubigeo */}
                </div>{" "}
                {/* Fin space-y-4 del Grupo 3 */}
              </div>{" "}
              {/* Fin Grupo 3: Información de Ubicación */}
              {/* Grupo 4: Información del Incidente */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle
                    className="text-primary-600 dark:text-primary-400"
                    size={20}
                  />
                  Información del Incidente
                </h3>
                <div ref={tipoSubtipoRef} className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipo / Subtipo de Novedad <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={searchTipoSubtipo}
                      onChange={(e) => {
                        setSearchTipoSubtipo(e.target.value);
                        setShowTipoSubtipoDropdown(true);
                        if (!e.target.value) {
                          setRegistroFormData({
                            ...registroFormData,
                            tipo_novedad_id: "",
                            subtipo_novedad_id: "",
                            prioridad_actual: "",
                          });
                        }
                      }}
                      onFocus={() => setShowTipoSubtipoDropdown(true)}
                      placeholder="Buscar tipo/subtipo de novedad..."
                      className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                    {searchTipoSubtipo && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTipoSubtipo("");
                          setShowTipoSubtipoDropdown(false);
                          setRegistroFormData({
                            ...registroFormData,
                            tipo_novedad_id: "",
                            subtipo_novedad_id: "",
                            prioridad_actual: "",
                          });
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {showTipoSubtipoDropdown && searchTipoSubtipo.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {(() => {
                        const words = searchTipoSubtipo.toLowerCase().split(/\s+/).filter(Boolean);
                        const filtered = subtipos.filter((st) => {
                          const tipo = tipos.find((t) => t.id == st.tipo_novedad_id);
                          const tipoNom = (tipo?.nombre || "").toLowerCase();
                          const subtipoNom = st.nombre.toLowerCase();
                          if (words.length === 1) {
                            return tipoNom.includes(words[0]) || subtipoNom.includes(words[0]);
                          }
                          // Primera palabra busca en tipo, resto en subtipo
                          const matchTipo = tipoNom.includes(words[0]);
                          const restoWords = words.slice(1);
                          const matchSubtipo = restoWords.every((w) => subtipoNom.includes(w));
                          // También permitir búsqueda general por si el orden no importa
                          const combined = `${tipoNom} ${subtipoNom}`;
                          const matchCombined = words.every((w) => combined.includes(w));
                          return (matchTipo && matchSubtipo) || matchCombined;
                        });
                        if (filtered.length === 0) {
                          return (
                            <div className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                              No se encontraron resultados
                            </div>
                          );
                        }
                        return filtered.map((st) => {
                          const tipo = tipos.find((t) => t.id == st.tipo_novedad_id);
                          const tipoNombre = tipo?.nombre || "Sin tipo";
                          return (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => {
                                setRegistroFormData({
                                  ...registroFormData,
                                  tipo_novedad_id: String(st.tipo_novedad_id),
                                  subtipo_novedad_id: String(st.id),
                                  prioridad_actual: st.prioridad || "",
                                });
                                setSearchTipoSubtipo(`${tipoNombre} - ${st.nombre}`);
                                setShowTipoSubtipoDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                            >
                              <span className="font-medium text-primary-700 dark:text-primary-400">{tipoNombre}</span>
                              <span className="text-slate-500 dark:text-slate-400"> - </span>
                              <span className="text-slate-900 dark:text-white">{st.nombre}</span>
                              {st.prioridad && (
                                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                                  st.prioridad === "ALTA" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                  st.prioridad === "MEDIA" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                }`}>
                                  {st.prioridad}
                                </span>
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Descripción del Incidente{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={registroFormData.descripcion}
                    onChange={(e) => {
                      setRegistroFormData({
                        ...registroFormData,
                        descripcion: e.target.value,
                      });
                    }}
                    placeholder="Describa el incidente con el mayor detalle posible (mínimo 10 caracteres)..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {registroFormData.descripcion.length} caracteres
                  </p>
                </div>{" "}
                {/* Fin div mt-4 descripción */}
              </div>{" "}
              {/* Fin Grupo 4: Información del Incidente */}
              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => {
                    const hasData =
                      registroFormData.descripcion ||
                      registroFormData.referencia_ubicacion;
                    if (hasData) {
                      if (
                        window.confirm(
                          "¿Cancelar registro? Se perderán los datos ingresados."
                        )
                      ) {
                        resetRegistroForm();
                        setPageTab(PAGE_TABS.LISTADO);
                      }
                    } else {
                      setPageTab(PAGE_TABS.LISTADO);
                    }
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveRegistro}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving ? "Guardando..." : "Guardar (ALT+G)"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ❌ MODAL CREAR DESHABILITADO - Campos migrados a tab REGISTRO */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="shieldGradCreate"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#4F7942", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#2D4A22", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M16 2 L28 6 L28 14 C28 22 22 28 16 30 C10 28 4 22 4 14 L4 6 Z"
                    fill="url(#shieldGradCreate)"
                    stroke="#1a2e14"
                    strokeWidth="1"
                  />
                  <text
                    x="16"
                    y="20"
                    fontFamily="Arial, sans-serif"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#FFFFFF"
                    textAnchor="middle"
                  >
                    C
                  </text>
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Nueva Novedad
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Complete los datos del incidente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
              {FORM_TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary-600 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab 0: Datos Básicos */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Tipo de Novedad *
                      </label>
                      <select
                        id="tipo_novedad_select"
                        value={formData.tipo_novedad_id}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            tipo_novedad_id: e.target.value,
                            subtipo_novedad_id: "",
                          });
                          fetchSubtipos(e.target.value);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione tipo...</option>
                        {tipos.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Subtipo *
                      </label>
                      <select
                        value={formData.subtipo_novedad_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            subtipo_novedad_id: e.target.value,
                          })
                        }
                        disabled={!formData.tipo_novedad_id}
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 disabled:opacity-50"
                      >
                        <option value="">Seleccione subtipo...</option>
                        {subtipos.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Fecha y Hora de Ocurrencia *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.fecha_hora_ocurrencia}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_hora_ocurrencia: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                      Origen de la Llamada
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ORIGEN_LLAMADA_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected =
                          formData.origen_llamada === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                origen_llamada: opt.value,
                              })
                            }
                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors ${
                              isSelected
                                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                            }`}
                          >
                            <Icon size={20} />
                            <span className="text-center">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 1: Ubicación */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Dirección / Localización
                    </label>
                    <input
                      value={formData.localizacion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          localizacion: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      placeholder="Av. Principal 123, cerca al parque..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Referencia
                    </label>
                    <input
                      value={formData.referencia_ubicacion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          referencia_ubicacion: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      placeholder="Frente a la bodega, esquina con..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Sector *
                      </label>
                      <select
                        value={formData.sector_id}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            sector_id: e.target.value,
                            cuadrante_id: "",
                          });
                          fetchCuadrantes(e.target.value);
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione sector...</option>
                        {sectores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.sector_code} - {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Cuadrante *
                      </label>
                      <select
                        value={formData.cuadrante_id}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cuadrante_id: e.target.value,
                          })
                        }
                        disabled={!formData.sector_id}
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 disabled:opacity-50"
                      >
                        <option value="">Seleccione cuadrante...</option>
                        {cuadrantes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.cuadrante_code} - {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        UBIGEO
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={ubigeoSearch}
                          onChange={(e) => {
                            setUbigeoSearch(e.target.value);
                            fetchUbigeos(e.target.value);
                          }}
                          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                          placeholder="Buscar distrito..."
                        />
                        {ubigeos.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {ubigeos.map((u) => (
                              <div
                                key={u.ubigeo_code}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    ubigeo_code: u.ubigeo_code,
                                  });
                                  setUbigeoSearch(
                                    `${u.departamento}/${u.provincia}/${u.distrito}`
                                  );
                                  setUbigeos([]);
                                }}
                                className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm text-slate-900 dark:text-slate-100"
                              >
                                <span className="font-semibold text-primary-600 dark:text-primary-400">
                                  {u.ubigeo_code}
                                </span>
                                <span className="text-slate-600 dark:text-slate-300">
                                  {" "}
                                  - {u.departamento}/{u.provincia}/{u.distrito}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {formData.ubigeo_code && (
                        <p className="mt-1 text-xs text-green-600">
                          Seleccionado: {formData.ubigeo_code}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Botón GPS */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="gps_enabled"
                        checked={gpsEnabled}
                        onChange={toggleGpsMode}
                        disabled={gpsLoading}
                        className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <label
                        htmlFor="gps_enabled"
                        className="text-sm font-medium text-slate-700 dark:text-slate-200"
                      >
                        Usar mi ubicación actual (GPS)
                      </label>
                    </div>
                    {gpsLoading && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>⏳ Obteniendo ubicación GPS...</span>
                      </div>
                    )}
                    {gpsEnabled && !gpsLoading && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        ✓ GPS activo
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Latitud
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitud}
                        onChange={(e) =>
                          setFormData({ ...formData, latitud: e.target.value })
                        }
                        readOnly={gpsEnabled}
                        className={`mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 ${
                          gpsEnabled
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="-12.0464"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Longitud
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitud}
                        onChange={(e) =>
                          setFormData({ ...formData, longitud: e.target.value })
                        }
                        readOnly={gpsEnabled}
                        className={`mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 ${
                          gpsEnabled
                            ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="-77.0428"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Reportante */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <input
                      type="checkbox"
                      id="es_anonimo"
                      checked={formData.es_anonimo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          es_anonimo: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <label
                      htmlFor="es_anonimo"
                      className="text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      Reporte anónimo
                    </label>
                  </div>
                  {!formData.es_anonimo && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Nombre del Reportante
                        </label>
                        <input
                          value={formData.reportante_nombre}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              reportante_nombre: e.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                          placeholder="Nombre completo"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Teléfono
                          </label>
                          <input
                            value={formData.reportante_telefono}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                reportante_telefono: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                            placeholder="999 999 999"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Tipo Documento
                          </label>
                          <select
                            value={formData.reportante_tipo_doc}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                reportante_tipo_doc: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                          >
                            {DOC_TIPOS.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Nro. Documento
                          </label>
                          <input
                            value={formData.reportante_doc_identidad}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                reportante_doc_identidad: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                            placeholder="Número de documento"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Nro. Personas Afectadas
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={formData.num_personas_afectadas}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                num_personas_afectadas: e.target.value,
                              })
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 3: Descripción */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Descripción del Incidente *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descripcion: e.target.value,
                        })
                      }
                      rows={5}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      placeholder="Describa detalladamente lo ocurrido..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Observaciones Adicionales
                    </label>
                    <textarea
                      value={formData.observaciones}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          observaciones: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      placeholder="Información adicional relevante..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                {activeTab > 0 && (
                  <button
                    onClick={() => setActiveTab(activeTab - 1)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Anterior
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                {activeTab < FORM_TABS.length - 1 ? (
                  <button
                    onClick={() => setActiveTab(activeTab + 1)}
                    className="rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    id="btn_guardar_novedad"
                    disabled={saving}
                    onClick={handleCreate}
                    className="rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800 disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Crear Novedad"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle con componente NovedadDetalleModal */}
      <NovedadDetalleModal
        isOpen={!!viewingNovedad}
        novedad={viewingNovedad}
        onClose={() => {
          setViewingNovedad(null);
          setViewingFromTruck(false);
        }}
        onDespachar={(novedad) => {
          // Abrir modal de despacho/seguimiento
          openSeguimientoModal(novedad);
        }}
        showDespacharButton={viewingFromTruck}
        unidadesOficina={unidadesOficina}
        vehiculos={vehiculos}
        personalSeguridad={personalSeguridad}
      />

      {/* Modal de Atención/Seguimiento */}
      {showAtencionModal && selectedNovedad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="shieldGradAtencion"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        style={{ stopColor: "#4F7942", stopOpacity: 1 }}
                      />
                      <stop
                        offset="100%"
                        style={{ stopColor: "#2D4A22", stopOpacity: 1 }}
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d="M16 2 L28 6 L28 14 C28 22 22 28 16 30 C10 28 4 22 4 14 L4 6 Z"
                    fill="url(#shieldGradAtencion)"
                    stroke="#1a2e14"
                    strokeWidth="1"
                  />
                  <text
                    x="16"
                    y="20"
                    fontFamily="Arial, sans-serif"
                    fontSize="14"
                    fontWeight="bold"
                    fill="#FFFFFF"
                    textAnchor="middle"
                  >
                    C
                  </text>
                </svg>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    Atención de Novedad
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedNovedad.novedad_code} -{" "}
                    {selectedNovedad.novedadTipoNovedad?.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAtencionModal(false);
                  setSelectedNovedad(null);
                }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setAtencionTab(0)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  atencionTab === 0
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Recursos Asignados
              </button>
              <button
                onClick={() => setAtencionTab(1)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  atencionTab === 1
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Clock size={16} className="inline mr-2" />
                Seguimiento
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Tab 0: Recursos Asignados */}
              {atencionTab === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Unidad/Oficina
                      </label>
                      <select
                        value={atencionData.unidad_oficina_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            unidad_oficina_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione unidad...</option>
                        {unidadesOficina.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Vehículo
                      </label>
                      <select
                        value={atencionData.vehiculo_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            vehiculo_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione vehículo...</option>
                        {vehiculos.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.placa} - {v.marca} {v.modelo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Personal a Cargo (Principal)
                      </label>
                      <select
                        value={atencionData.personal_cargo_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            personal_cargo_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione personal...</option>
                        {personalSeguridad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.doc_identidad || p.codigo} - {p.nombres}{" "}
                            {p.apellido_paterno}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Personal Seguridad #2
                      </label>
                      <select
                        value={atencionData.personal_seguridad2_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            personal_seguridad2_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione personal...</option>
                        {personalSeguridad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.doc_identidad || p.codigo} - {p.nombres}{" "}
                            {p.apellido_paterno}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Personal Seguridad #3
                      </label>
                      <select
                        value={atencionData.personal_seguridad3_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            personal_seguridad3_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione personal...</option>
                        {personalSeguridad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.doc_identidad || p.codigo} - {p.nombres}{" "}
                            {p.apellido_paterno}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Personal Seguridad #4
                      </label>
                      <select
                        value={atencionData.personal_seguridad4_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            personal_seguridad4_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione personal...</option>
                        {personalSeguridad.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.doc_identidad || p.codigo} - {p.nombres}{" "}
                            {p.apellido_paterno}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Estado de Novedad *
                      </label>
                      <select
                        value={atencionData.estado_novedad_id}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            estado_novedad_id: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione estado...</option>
                        {estados.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Fecha/Hora Despacho
                      </label>
                      <input
                        type="datetime-local"
                        value={atencionData.fecha_despacho}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            fecha_despacho: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Turno
                      </label>
                      <select
                        value={atencionData.turno}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            turno: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      >
                        <option value="">Seleccione turno...</option>
                        <option value="MAÑANA">Mañana</option>
                        <option value="TARDE">Tarde</option>
                        <option value="NOCHE">Noche</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Tiempo Respuesta (min)
                      </label>
                      <input
                        type="number"
                        value={atencionData.tiempo_respuesta_minutos}
                        onChange={(e) =>
                          setAtencionData({
                            ...atencionData,
                            tiempo_respuesta_minutos: e.target.value,
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                        placeholder="Minutos"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Observaciones
                    </label>
                    <textarea
                      rows={3}
                      value={atencionData.observaciones}
                      onChange={(e) =>
                        setAtencionData({
                          ...atencionData,
                          observaciones: e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      placeholder="Observaciones de la atención..."
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <input
                      type="checkbox"
                      id="requiere_seguimiento"
                      checked={atencionData.requiere_seguimiento}
                      onChange={(e) =>
                        setAtencionData({
                          ...atencionData,
                          requiere_seguimiento: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="requiere_seguimiento"
                      className="text-sm font-medium text-amber-800 dark:text-amber-200"
                    >
                      ¿Requiere Seguimiento? (Habilita campos adicionales en
                      pestaña Seguimiento)
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 1: Seguimiento */}
              {atencionTab === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">
                      Información de la Novedad
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Estado actual:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.novedadEstado?.nombre || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Prioridad:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.prioridad_actual || "MEDIA"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">
                          Fecha ocurrencia:
                        </span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {formatFecha(selectedNovedad.fecha_hora_ocurrencia)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Ubicación:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.localizacion || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">
                      Historial de Estados
                    </h4>
                    {loadingHistorial ? (
                      <p className="text-sm text-slate-500">
                        Cargando historial...
                      </p>
                    ) : historialEstados.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No hay cambios de estado registrados.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {[...historialEstados]
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
                                {h.tiempo_en_estado_min &&
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

                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">
                      Recursos Asignados Actuales
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Unidad:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.novedadUnidadOficina?.nombre ||
                            selectedNovedad.unidad_oficina_id ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Vehículo:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.novedadVehiculo?.placa ||
                            selectedNovedad.vehiculo_id ||
                            "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Fecha despacho:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.fecha_despacho
                            ? formatFecha(selectedNovedad.fecha_despacho)
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Turno:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
                          {selectedNovedad.turno || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Campos de Seguimiento */}
                  <div
                    className={`p-4 rounded-lg border ${
                      atencionData.requiere_seguimiento
                        ? "border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10"
                        : "border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/30"
                    }`}
                  >
                    <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">
                      Datos de Seguimiento
                      {!atencionData.requiere_seguimiento && (
                        <span className="text-xs text-slate-500 ml-2">
                          (Solo lectura - Active "Requiere Seguimiento" para
                          editar)
                        </span>
                      )}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Fecha Llegada
                        </label>
                        <input
                          type="datetime-local"
                          value={atencionData.fecha_llegada}
                          onChange={(e) =>
                            setAtencionData({
                              ...atencionData,
                              fecha_llegada: e.target.value,
                            })
                          }
                          disabled={!atencionData.requiere_seguimiento}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                            atencionData.requiere_seguimiento
                              ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Fecha Cierre
                        </label>
                        <input
                          type="datetime-local"
                          value={atencionData.fecha_cierre}
                          onChange={(e) =>
                            setAtencionData({
                              ...atencionData,
                              fecha_cierre: e.target.value,
                            })
                          }
                          disabled={!atencionData.requiere_seguimiento}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                            atencionData.requiere_seguimiento
                              ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Km Inicial
                        </label>
                        <input
                          type="number"
                          value={atencionData.km_inicial}
                          onChange={(e) =>
                            setAtencionData({
                              ...atencionData,
                              km_inicial: e.target.value,
                            })
                          }
                          disabled={!atencionData.requiere_seguimiento}
                          placeholder="0"
                          className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                            atencionData.requiere_seguimiento
                              ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Km Final
                        </label>
                        <input
                          type="number"
                          value={atencionData.km_final}
                          onChange={(e) =>
                            setAtencionData({
                              ...atencionData,
                              km_final: e.target.value,
                            })
                          }
                          disabled={!atencionData.requiere_seguimiento}
                          placeholder="0"
                          className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                            atencionData.requiere_seguimiento
                              ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Fecha Próxima Revisión
                        </label>
                        <input
                          type="date"
                          value={atencionData.fecha_proxima_revision}
                          onChange={(e) =>
                            setAtencionData({
                              ...atencionData,
                              fecha_proxima_revision: e.target.value,
                            })
                          }
                          disabled={!atencionData.requiere_seguimiento}
                          className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                            atencionData.requiere_seguimiento
                              ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                          Pérdidas Materiales Estimadas (S/.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={atencionData.perdidas_materiales_estimadas}
                          onChange={(e) =>
                            setAtencionData({
                              ...atencionData,
                              perdidas_materiales_estimadas: e.target.value,
                            })
                          }
                          disabled={!atencionData.requiere_seguimiento}
                          placeholder="0.00"
                          className={`mt-1 w-full rounded-lg border px-3 py-2 ${
                            atencionData.requiere_seguimiento
                              ? "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50"
                              : "border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowAtencionModal(false);
                  setSelectedNovedad(null);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                id="btn_guardar_atencion"
                onClick={handleGuardarAtencion}
                disabled={saving}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar Atención"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seguimiento */}
      <DespacharModal
        isOpen={showSeguimientoModal}
        onClose={() => {
          setShowSeguimientoModal(false);
          setSelectedNovedadSeguimiento(null);
        }}
        novedad={selectedNovedadSeguimiento}
        vehiculos={vehiculos}
        personalSeguridad={personalSeguridad}
        unidadesOficina={unidadesOficina}
        onSubmit={handleSaveSeguimiento}
      />
  </div>
);
}
