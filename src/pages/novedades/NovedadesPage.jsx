/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\pages\\novedades\\NovedadesPage.jsx
 * @version 2.0.0
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
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
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
} from "lucide-react";

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
  asignarRecursos,
  listUnidadesOficina,
  listVehiculos,
  listPersonalSeguridad,
  getHistorialEstados,
  getNovedadById,
} from "../../services/novedadesService.js";
import {
  searchDirecciones,
  createDireccion,
} from "../../services/direccionesService.js";
import { listCargos } from "../../services/catalogosService.js";
import { listCalles } from "../../services/callesService.js";
import { listSectores as listSectoresService } from "../../services/sectoresService.js";
import { listCuadrantes as listCuadrantesService } from "../../services/cuadrantesService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { canPerformAction, canAccessRoute } from "../../rbac/rbac.js";

// Constantes
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
  { value: "TELEFONO_107", label: "Llamada Telefónica (107)" },
  { value: "RADIO_TETRA", label: "Llamada Radio TETRA" },
  { value: "REDES_SOCIALES", label: "Redes Sociales" },
  {
    value: "BOTON_EMERGENCIA_ALERTA_SURCO",
    label: "Botón Emergencia (App ALERTA SURCO)",
  },
  {
    value: "BOTON_DENUNCIA_VECINO_ALERTA",
    label: "Botón Denuncia (App VECINO ALERTA)",
  },
  { value: "ANALITICA", label: "Analítica" },
  { value: "APP_PODER_JUDICIAL", label: "APP Poder Judicial" },
  { value: "VIDEO_CCO", label: "Video CCO" },
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

  // Referencia
  if (direccion.referencia) {
    parts.push(`(${direccion.referencia})`);
  }

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
  const [filterEstado, setFilterEstado] = useState("");
  const [filterPrioridad, setFilterPrioridad] = useState("");
  const [filterFechaInicio, setFilterFechaInicio] = useState("");
  const [filterFechaFin, setFilterFechaFin] = useState("");

  // Catálogos
  const [tipos, setTipos] = useState([]);
  const [subtipos, setSubtipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [cuadrantes, setCuadrantes] = useState([]);
  const [ubigeos, setUbigeos] = useState([]);
  const [ubigeoSearch, setUbigeoSearch] = useState("");

  // Modal de atención
  const [showAtencionModal, setShowAtencionModal] = useState(false);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [atencionTab, setAtencionTab] = useState(0);

  // Catálogos para atención
  const [unidadesOficina, setUnidadesOficina] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [personalSeguridad, setPersonalSeguridad] = useState([]);
  const [historialEstados, setHistorialEstados] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [viewingHistorial, setViewingHistorial] = useState([]);
  const [loadingViewingHistorial, setLoadingViewingHistorial] = useState(false);

  // Modales
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingNovedad, setViewingNovedad] = useState(null);
  const [viewingTab, setViewingTab] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

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
  const [registroStage, setRegistroStage] = useState(REGISTRO_STAGES.REGISTRO);

  // Validación de dirección
  const [direccionMatch, setDireccionMatch] = useState(null);
  const [searchingDireccion, setSearchingDireccion] = useState(false);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [direccionesOptions, setDireccionesOptions] = useState([]);
  const [selectedDireccionId, setSelectedDireccionId] = useState("");

  // Datos del formulario REGISTRO
  const [registroFormData, setRegistroFormData] = useState({
    // Origen
    origen_llamada: "TELEFONO_107",
    reportante_telefono: "",
    fecha_hora_ocurrencia: getCurrentDateTimeLocal(),

    // Reportante
    es_anonimo: 0,
    reportante_tipo_doc: "DNI",
    reportante_doc_identidad: "",
    reportante_nombre: "",

    // Ubicación
    referencia_ubicacion: "",
    direccion_id: "",
    calle_id: "",
    numero_municipal: "",
    sector_id: "",
    cuadrante_id: "",
    localizacion: "",

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

    // Asignación
    personal_cargo_id: "",
    estado_novedad_id: 1, // Default "Pendiente"
  });

  // Catálogos para REGISTRO
  const [cargos, setCargos] = useState([]);
  const [calles, setCalles] = useState([]);
  const [sectoresRegistro, setSectoresRegistro] = useState([]);
  const [cuadrantesRegistro, setCuadrantesRegistro] = useState([]);

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
      const result = await listNovedades({
        page: nextPage,
        limit: 15,
        tipo_novedad_id: filterTipo || undefined,
        estado_novedad_id: filterEstado || undefined,
        prioridad_actual: filterPrioridad || undefined,
        fecha_inicio: filterFechaInicio || undefined,
        fecha_fin: filterFechaFin || undefined,
        search: search || undefined,
      });
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
      const [tiposRes, estadosRes, sectoresRes] = await Promise.all([
        listTiposNovedad(),
        listEstadosNovedad(),
        listSectores(),
      ]);
      setTipos(Array.isArray(tiposRes) ? tiposRes : []);
      setEstados(Array.isArray(estadosRes) ? estadosRes : []);
      setSectores(Array.isArray(sectoresRes) ? sectoresRes : []);
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
        if (canCreate && !showCreateForm) {
          resetForm();
          setShowCreateForm(true);
          // Poner foco en el primer campo después de que se renderice
          setTimeout(() => {
            document.getElementById("tipo_novedad_select")?.focus();
          }, 100);
        }
      }
      // ESC para cerrar modales
      if (e.key === "Escape") {
        // 🆕 ESC en tab REGISTRO con confirmación
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

    const timer = setTimeout(() => {
      if (registroFormData.referencia_ubicacion) {
        handleDireccionSearch(registroFormData.referencia_ubicacion);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [registroFormData.referencia_ubicacion, pageTab]);

  // Cargar catálogos al entrar a tab REGISTRO
  useEffect(() => {
    if (pageTab === PAGE_TABS.REGISTRO) {
      const loadCatalogos = async () => {
        try {
          const [cargosData, callesData, sectoresData] = await Promise.all([
            listCargos(),
            listCalles({ limit: 1000 }),
            listSectoresService({ limit: 100 }),
          ]);

          setCargos(cargosData || []);
          setCalles(callesData?.items || callesData?.data || callesData || []);
          setSectoresRegistro(
            sectoresData?.items || sectoresData?.data || sectoresData || []
          );
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

  const handleSearch = () => {
    setPage(1);
    fetchNovedades({ nextPage: 1 });
  };

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
        fecha_hora_ocurrencia: formData.fecha_hora_ocurrencia,
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
  /**
   * fetchCatalogosAtencion
   * - Carga recursos necesarios para la atención (unidades, vehículos, personal)
   * - Se ejecuta antes de abrir el modal de atención si aún no están cargados.
   *
   * @returns {Promise<void>}
   */
  const fetchCatalogosAtencion = async () => {
    try {
      const [unidades, vehic, personal] = await Promise.all([
        listUnidadesOficina(),
        listVehiculos(),
        listPersonalSeguridad(),
      ]);
      setUnidadesOficina(Array.isArray(unidades) ? unidades : []);
      setVehiculos(Array.isArray(vehic) ? vehic : []);
      setPersonalSeguridad(Array.isArray(personal) ? personal : []);
    } catch (err) {
      console.error("Error cargando catálogos de atención:", err);
    }
  };

  // Cargar historial de estados
  const fetchHistorialEstados = async (novedadId) => {
    setLoadingHistorial(true);
    try {
      const data = await getHistorialEstados(novedadId);
      setHistorialEstados(Array.isArray(data) ? data : []);
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
        fecha_despacho: atencionData.fecha_despacho || undefined,
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
    setFilterEstado("");
    setFilterPrioridad("");
    setFilterFechaInicio("");
    setFilterFechaFin("");
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
   * handleSelectDireccion - Cuando el usuario selecciona una dirección del dropdown
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
      setRegistroFormData((prev) => ({
        ...prev,
        direccion_id: selected.id,
        sector_id: selected.sector_id || selected.cuadrante?.sector_id || "",
        cuadrante_id: selected.cuadrante_id || "",
      }));
    }
  };

  /**
   * validateRegistroForm - Valida el formulario REGISTRO
   */
  const validateRegistroForm = () => {
    const errors = [];

    // Campos requeridos básicos
    if (!registroFormData.fecha_hora_ocurrencia) {
      errors.push("Fecha y hora de ocurrencia es requerida");
    }

    if (!registroFormData.referencia_ubicacion) {
      errors.push("Dirección de referencia es requerida");
    }

    // Si no hay match de dirección, validar campos manuales
    if (!direccionMatch) {
      if (!registroFormData.calle_id) errors.push("Debe seleccionar una calle");
      if (!registroFormData.sector_id)
        errors.push("Debe seleccionar un sector");
      if (!registroFormData.cuadrante_id)
        errors.push("Debe seleccionar un cuadrante");
    }

    // Incidente
    if (!registroFormData.tipo_novedad_id)
      errors.push("Tipo de novedad es requerido");
    if (!registroFormData.subtipo_novedad_id)
      errors.push("Subtipo es requerido");
    if (
      !registroFormData.descripcion ||
      registroFormData.descripcion.trim().length < 10
    ) {
      errors.push("Descripción debe tener al menos 10 caracteres");
    }

    // Reportante (solo si NO es anónimo)
    if (registroFormData.es_anonimo === 0) {
      if (!registroFormData.reportante_nombre) {
        errors.push("Nombre del reportante es requerido");
      }
      if (!registroFormData.reportante_doc_identidad) {
        errors.push("Documento de identidad es requerido");
      }
    }

    return errors;
  };

  /**
   * handleSaveRegistro - Guarda la novedad desde el panel REGISTRO
   */
  const handleSaveRegistro = async () => {
    // 1. Validar formulario
    const errors = validateRegistroForm();
    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    setSaving(true);
    let finalDireccionId = registroFormData.direccion_id;

    try {
      // 2. Crear dirección SI NO existe match
      if (!direccionMatch && showManualLocation) {
        const nuevaDireccion = await createDireccion({
          calle_id: registroFormData.calle_id,
          sector_id: registroFormData.sector_id,
          cuadrante_id: registroFormData.cuadrante_id,
          referencia: registroFormData.referencia_ubicacion,
          tipo_complemento: registroFormData.tipo_complemento || null,
          numero_complemento: registroFormData.numero_complemento || null,
          manzana: registroFormData.manzana || null,
          lote: registroFormData.lote || null,
          urbanizacion: registroFormData.urbanizacion || null,
          verificada: 0, // Marcar como no verificada
        });
        finalDireccionId = nuevaDireccion.id;
        toast.success("Nueva dirección creada");
      }

      // 3. Crear novedad
      const novedadPayload = {
        origen_llamada: registroFormData.origen_llamada,
        reportante_telefono: registroFormData.reportante_telefono,
        fecha_hora_ocurrencia: registroFormData.fecha_hora_ocurrencia,
        es_anonimo: registroFormData.es_anonimo,
        reportante_tipo_doc: registroFormData.reportante_tipo_doc,
        reportante_doc_identidad: registroFormData.reportante_doc_identidad,
        reportante_nombre: registroFormData.reportante_nombre,
        direccion_id: finalDireccionId,
        referencia_ubicacion: registroFormData.referencia_ubicacion,
        localizacion: registroFormData.localizacion,
        tipo_novedad_id: registroFormData.tipo_novedad_id,
        subtipo_novedad_id: registroFormData.subtipo_novedad_id,
        descripcion: registroFormData.descripcion,
        personal_cargo_id: registroFormData.personal_cargo_id || null,
        estado_novedad_id: 1, // Pendiente
        created_by: user?.id,
        sector_id: registroFormData.sector_id || null,
        cuadrante_id: registroFormData.cuadrante_id || null,
        latitud: registroFormData.latitud || null,
        longitud: registroFormData.longitud || null,
        ubigeo_code: registroFormData.ubigeo_code || null,
      };

      console.log("DEBUG novedadPayload:", novedadPayload);
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
      toast.error(error.response?.data?.message || "Error al crear novedad");
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
        limit: 1000,
      });
      setCuadrantesRegistro(data.items || data || []);
    } catch (error) {
      console.error("Error al cargar cuadrantes:", error);
      toast.error("Error al cargar cuadrantes del sector");
    }
  };

  /**
   * loadSubtipos - Carga subtipos cuando se selecciona un tipo de novedad
   */
  const loadSubtipos = async (tipoId) => {
    try {
      const data = await listSubtiposNovedad(tipoId);
      setSubtipos(data || []);
    } catch (error) {
      console.error("Error al cargar subtipos:", error);
      toast.error("Error al cargar subtipos de novedad");
    }
  };

  /**
   * resetRegistroForm - Limpia el formulario REGISTRO
   */
  const resetRegistroForm = () => {
    setRegistroFormData({
      origen_llamada: "TELEFONO_107",
      reportante_telefono: "",
      fecha_hora_ocurrencia: getCurrentDateTimeLocal(),
      es_anonimo: 0,
      reportante_tipo_doc: "DNI",
      reportante_doc_identidad: "",
      reportante_nombre: "",
      referencia_ubicacion: "",
      direccion_id: "",
      calle_id: "",
      numero_municipal: "",
      sector_id: "",
      cuadrante_id: "",
      localizacion: "",
      tipo_complemento: "",
      numero_complemento: "",
      manzana: "",
      lote: "",
      urbanizacion: "",
      tipo_novedad_id: "",
      subtipo_novedad_id: "",
      descripcion: "",
      personal_cargo_id: "",
      estado_novedad_id: 1,
    });
    setDireccionMatch(null);
    setSearchingDireccion(false);
    setShowManualLocation(false);
    setDireccionesOptions([]);
    setSelectedDireccionId("");
  };

  // Abrir modal de consulta con datos completos
  /**
   * openViewingModal
   * - Muestra el modal de detalle y carga información completa y el historial en paralelo.
   *
   * @param {Object} novedad - novedad básica (puede venir de la lista)
   * @returns {Promise<void>}
   */
  const openViewingModal = async (novedad) => {
    setViewingNovedad(novedad); // Mostrar datos básicos inmediatamente
    setViewingTab(0);
    setViewingHistorial([]);
    setLoadingViewingHistorial(true);
    try {
      const [novedadCompleta, historialData] = await Promise.all([
        getNovedadById(novedad.id),
        getHistorialEstados(novedad.id),
      ]);
      if (novedadCompleta) {
        setViewingNovedad(novedadCompleta);
      }
      setViewingHistorial(historialData || []);
    } catch (err) {
      console.error("Error cargando detalles de novedad:", err);
    } finally {
      setLoadingViewingHistorial(false);
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="relative lg:col-span-2">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Buscar por código, descripción, ubicación, teléfono..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                  />
                </div>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
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
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
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
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
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
                    className="flex-1 rounded-lg bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600"
                  >
                    Buscar
                  </button>
                  <button
                    onClick={handleLimpiarFiltros}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title="Limpiar filtros"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabla */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                        Código
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                        Fecha/Hora
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200 hidden md:table-cell">
                        Ubicación
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                        Prioridad
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">
                        Acciones
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
                          <td className="px-4 py-3 text-slate-900 dark:text-slate-50 font-mono font-medium whitespace-nowrap">
                            {n.novedad_code || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                            {formatFecha(n.fecha_hora_ocurrencia)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {n.novedadTipoNovedad?.nombre || "—"}
                              </span>
                              <span className="text-xs text-slate-500">
                                {n.novedadSubtipoNovedad?.nombre || ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-xs truncate hidden md:table-cell">
                            {n.localizacion || n.referencia_ubicacion || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${prioridadColor(
                                n.prioridad_actual
                              )}`}
                            >
                              {n.prioridad_actual || "MEDIA"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
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
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openViewingModal(n)}
                                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Ver detalle"
                              >
                                <Eye size={14} />
                              </button>
                              {canEdit && !n.deleted_at && (
                                <button
                                  onClick={() => openAtencionModal(n)}
                                  className="p-2 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  title="Atender novedad"
                                >
                                  <Shield size={14} />
                                </button>
                              )}
                              {canDelete && !n.deleted_at && (
                                <button
                                  onClick={() => handleDelete(n)}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
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
            {/* Sub-tabs de etapas */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
              <button className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium">
                REGISTRO
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 text-sm font-medium cursor-not-allowed"
              >
                DESPACHADOR
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 text-sm font-medium cursor-not-allowed"
              >
                ATENCION
              </button>
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-400 text-sm font-medium cursor-not-allowed"
              >
                CIERRE
              </button>
            </div>

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
                      value={registroFormData.origen_llamada}
                      onChange={(e) =>
                        setRegistroFormData({
                          ...registroFormData,
                          origen_llamada: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      {NUEVOS_ORIGEN_LLAMADA_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Fecha y Hora de Ocurrencia{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={registroFormData.fecha_hora_ocurrencia}
                      onChange={(e) =>
                        setRegistroFormData({
                          ...registroFormData,
                          fecha_hora_ocurrencia: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
                    />
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
                  {/* Campo de búsqueda de dirección */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Buscar Dirección <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={registroFormData.referencia_ubicacion}
                        onChange={(e) => {
                          setRegistroFormData({
                            ...registroFormData,
                            referencia_ubicacion: e.target.value,
                          });
                          handleDireccionSearch(e.target.value);
                        }}
                        placeholder="Ej: Arequipa, Benavides, etc."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      />
                      {searchingDireccion && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                        </div>
                      )}
                    </div>

                    {/* Helper visible para descubrir la entrada manual */}
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 pl-1">
                      ¿No encuentras la dirección?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          // Preparar el formulario de ingreso manual
                          setDireccionesOptions([]);
                          setDireccionMatch(null);
                          setSelectedDireccionId("");
                          setShowManualLocation(true);
                        }}
                        className="text-primary-600 hover:underline"
                      >
                        Ingresar manualmente
                      </button>
                    </div>
                  </div>

                  {/* Dropdown de direcciones encontradas */}
                  {direccionesOptions.length > 0 && !direccionMatch && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Seleccione una Dirección
                      </label>
                      <select
                        value={selectedDireccionId}
                        onChange={(e) => handleSelectDireccion(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Seleccionar dirección...</option>
                        {direccionesOptions.map((dir) => (
                          <option key={dir.id} value={dir.id}>
                            {formatDireccionCompleta(dir)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                                "N/A"}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium">
                              Cuadrante:{" "}
                              {direccionMatch.cuadrante?.nombre || "N/A"}
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
                              sector_id: "",
                              cuadrante_id: "",
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
                          onChange={(e) =>
                            setShowManualLocation(e.target.checked)
                          }
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
                        {/* Calle */}
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Calle <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={registroFormData.calle_id}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                calle_id: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Seleccionar calle</option>
                            {calles.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nombre_completo}
                              </option>
                            ))}
                          </select>
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
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
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
                          </label>
                          <select
                            value={registroFormData.cuadrante_id}
                            onChange={(e) =>
                              setRegistroFormData({
                                ...registroFormData,
                                cuadrante_id: e.target.value,
                              })
                            }
                            disabled={!registroFormData.sector_id}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
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
                    <textarea
                      value={registroFormData.localizacion}
                      onChange={(e) =>
                        setRegistroFormData({
                          ...registroFormData,
                          localizacion: e.target.value,
                        })
                      }
                      placeholder="Ej: Frente al parque, al costado del colegio..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Grupo 4: Información del Incidente */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle
                    className="text-primary-600 dark:text-primary-400"
                    size={20}
                  />
                  Información del Incidente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tipo de Novedad <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={registroFormData.tipo_novedad_id}
                      onChange={(e) => {
                        setRegistroFormData({
                          ...registroFormData,
                          tipo_novedad_id: e.target.value,
                          subtipo_novedad_id: "",
                        });
                        // Cargar subtipos
                        if (e.target.value) {
                          loadSubtipos(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Seleccionar tipo</option>
                      {tipos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Subtipo de Novedad <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={registroFormData.subtipo_novedad_id}
                      onChange={(e) =>
                        setRegistroFormData({
                          ...registroFormData,
                          subtipo_novedad_id: e.target.value,
                        })
                      }
                      disabled={!registroFormData.tipo_novedad_id}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <option value="">Seleccionar subtipo</option>
                      {subtipos
                        .filter(
                          (st) =>
                            st.tipo_novedad_id ==
                            registroFormData.tipo_novedad_id
                        )
                        .map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.nombre}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Descripción del Incidente{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={registroFormData.descripcion}
                    onChange={(e) =>
                      setRegistroFormData({
                        ...registroFormData,
                        descripcion: e.target.value,
                      })
                    }
                    placeholder="Describa el incidente con el mayor detalle posible (mínimo 10 caracteres)..."
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {registroFormData.descripcion.length} caracteres
                  </p>
                </div>
              </div>

              {/* Grupo 5: Asignación */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Shield
                    className="text-primary-600 dark:text-primary-400"
                    size={20}
                  />
                  Asignación
                </h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Derivar a
                  </label>
                  <select
                    value={registroFormData.personal_cargo_id}
                    onChange={(e) =>
                      setRegistroFormData({
                        ...registroFormData,
                        personal_cargo_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Sin asignar (se asignará después)</option>
                    {cargos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.cargo}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Puede derivar la novedad a un personal específico o dejarlo
                    sin asignar para derivarlo posteriormente
                  </p>
                </div>
              </div>

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
      {false && showCreateForm && (
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

      {/* ✅ Modal Ver Detalle con Pestañas - MANTENER */}
      {viewingNovedad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <svg
                  className="w-10 h-10"
                  viewBox="0 0 32 32"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient
                      id="shieldGradView"
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
                    fill="url(#shieldGradView)"
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-slate-500">
                      #{viewingNovedad.novedad_code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${prioridadColor(
                        viewingNovedad.prioridad_actual
                      )}`}
                    >
                      {viewingNovedad.prioridad_actual || "MEDIA"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        typeof estadoColor(viewingNovedad.novedadEstado) ===
                        "string"
                          ? estadoColor(viewingNovedad.novedadEstado)
                          : ""
                      }`}
                      style={
                        typeof estadoColor(viewingNovedad.novedadEstado) ===
                        "object"
                          ? estadoColor(viewingNovedad.novedadEstado)
                          : {}
                      }
                    >
                      {viewingNovedad.novedadEstado?.nombre || "—"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mt-1">
                    {viewingNovedad.novedadTipoNovedad?.nombre || "Novedad"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {viewingNovedad.novedadSubtipoNovedad?.nombre || ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingNovedad(null);
                  setViewingTab(0);
                }}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewingTab(0)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  viewingTab === 0
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <FileText size={16} className="inline mr-2" />
                Datos Básicos
              </button>
              <button
                onClick={() => setViewingTab(1)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  viewingTab === 1
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <MapPin size={16} className="inline mr-2" />
                Ubicación
              </button>
              <button
                onClick={() => setViewingTab(2)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  viewingTab === 2
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <User size={16} className="inline mr-2" />
                Reportante
              </button>
              <button
                onClick={() => setViewingTab(3)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  viewingTab === 3
                    ? "text-primary-600 border-b-2 border-primary-600"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Users size={16} className="inline mr-2" />
                Recursos
              </button>
              <button
                onClick={() => setViewingTab(4)}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  viewingTab === 4
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
              {/* Tab 0: Datos Básicos */}
              {viewingTab === 0 && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Descripción
                    </h4>
                    <p className="text-slate-900 dark:text-slate-50 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      {viewingNovedad.descripcion || "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Tipo de Novedad
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50 font-medium">
                        {viewingNovedad.novedadTipoNovedad?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Subtipo
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadSubtipoNovedad?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Fecha/Hora Ocurrencia
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {formatFecha(viewingNovedad.fecha_hora_ocurrencia)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Origen de Llamada
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {ORIGEN_LLAMADA_OPTIONS.find(
                          (o) => o.value === viewingNovedad.origen_llamada
                        )?.label ||
                          viewingNovedad.origen_llamada ||
                          "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Prioridad
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.prioridad_actual || "MEDIA"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Estado
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadEstado?.nombre || "—"}
                      </p>
                    </div>
                  </div>
                  {viewingNovedad.observaciones && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                        Observaciones
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        {viewingNovedad.observaciones}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 1: Ubicación */}
              {viewingTab === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Localización
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.localizacion || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Referencia
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.referencia_ubicacion || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Sector
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadSector?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Cuadrante
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadCuadrante?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Ubigeo
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.ubigeo_code || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Coordenadas GPS
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.latitud && viewingNovedad.longitud
                          ? `${viewingNovedad.latitud}, ${viewingNovedad.longitud}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Reportante */}
              {viewingTab === 2 && (
                <div className="space-y-4">
                  {viewingNovedad.es_anonimo ? (
                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                      <User size={32} className="mx-auto text-slate-400 mb-2" />
                      <p className="text-sm text-slate-500">Reporte anónimo</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Nombre
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {viewingNovedad.reportante_nombre || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Teléfono
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {viewingNovedad.reportante_telefono || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Documento de Identidad
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {viewingNovedad.reportante_doc_identidad || "—"}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-medium text-slate-500">
                          Personas Afectadas
                        </span>
                        <p className="text-sm text-slate-900 dark:text-slate-50">
                          {viewingNovedad.num_personas_afectadas || "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Recursos Asignados */}
              {viewingTab === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Unidad/Oficina
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadUnidadOficina?.nombre || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Vehículo
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadVehiculo?.placa || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Personal a Cargo
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadPersonalCargo
                          ? `${viewingNovedad.novedadPersonalCargo.nombres} ${viewingNovedad.novedadPersonalCargo.apellido_paterno}`
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Personal #2
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadPersonal2
                          ? `${viewingNovedad.novedadPersonal2.nombres} ${viewingNovedad.novedadPersonal2.apellido_paterno}`
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Personal #3
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadPersonal3
                          ? `${viewingNovedad.novedadPersonal3.nombres} ${viewingNovedad.novedadPersonal3.apellido_paterno}`
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Personal #4
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.novedadPersonal4
                          ? `${viewingNovedad.novedadPersonal4.nombres} ${viewingNovedad.novedadPersonal4.apellido_paterno}`
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Fecha Despacho
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.fecha_despacho
                          ? formatFecha(viewingNovedad.fecha_despacho)
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Turno
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.turno || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Tiempo Respuesta
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.tiempo_respuesta_minutos
                          ? `${viewingNovedad.tiempo_respuesta_minutos} min`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Seguimiento */}
              {viewingTab === 4 && (
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Requiere Seguimiento:{" "}
                      {viewingNovedad.requiere_seguimiento ? "Sí" : "No"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Fecha Llegada
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.fecha_llegada
                          ? formatFecha(viewingNovedad.fecha_llegada)
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Fecha Cierre
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.fecha_cierre
                          ? formatFecha(viewingNovedad.fecha_cierre)
                          : "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Km Inicial
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.km_inicial || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Km Final
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.km_final || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Fecha Próxima Revisión
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.fecha_proxima_revision || "—"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500">
                        Pérdidas Materiales Estimadas
                      </span>
                      <p className="text-sm text-slate-900 dark:text-slate-50">
                        {viewingNovedad.perdidas_materiales_estimadas
                          ? `S/. ${viewingNovedad.perdidas_materiales_estimadas}`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Historial de Estados */}
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">
                      Historial de Estados
                    </h4>
                    {loadingViewingHistorial ? (
                      <p className="text-sm text-slate-500">
                        Cargando historial...
                      </p>
                    ) : viewingHistorial.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No hay cambios de estado registrados.
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-48 overflow-y-auto">
                        {viewingHistorial.map((h) => (
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
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setViewingNovedad(null);
                  setViewingTab(0);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

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
                        {historialEstados.map((h) => (
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
    </div>
  );
}
