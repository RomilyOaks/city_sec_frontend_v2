/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\pages\\vehiculos\\VehiculosPage.jsx
 * @version 2.0.0
 * @description Página para la gestión de vehículos: listado, creación, edición, restauración y detalle.
 * Contiene validaciones frontend, helpers para formateo y funciones que interactúan con los servicios.
 *
 * Documentación educativa: se añadieron JSDoc y comentarios explicativos en funciones clave sin alterar lógica.
 *
 * Organización: constantes y validadores arriba, estado y hooks, funciones CRUD y helpers, render al final.
 *
 * @module src/pages/vehiculos/VehiculosPage.jsx
 */
////import { useEffect, useState, useRef, useCallback } from "react";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  RotateCcw,
  X,
} from "lucide-react";

import {
  listVehiculos,
  deleteVehiculo,
  restoreVehiculo,
  createVehiculo,
  updateVehiculo,
} from "../../services/vehiculosService.js";
import {
  listTiposVehiculo,
  listUnidades,
} from "../../services/catalogosService.js";
import { listConductores } from "../../services/personalService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { canPerformAction } from "../../rbac/rbac.js";

const ESTADO_OPERATIVO_OPTIONS = [
  { value: "DISPONIBLE", label: "Disponible" },
  { value: "EN_SERVICIO", label: "En Servicio" },
  { value: "MANTENIMIENTO", label: "En Mantenimiento" },
  { value: "REPARACION", label: "En Reparación" },
  { value: "FUERA_DE_SERVICIO", label: "Fuera de Servicio" },
  { value: "INACTIVO", label: "Inactivo" },
];

// Validación de placa peruana (formato: ABC-123 o AB-1234)
const PLACA_REGEX = /^[A-Z]{2,3}-?\d{3,4}$/i;

/**
 * validatePlaca
 * Valida la placa de un vehículo según el patrón nacional.
 * - Acepta formatos con o sin guión y permite hasta 4 dígitos.
 *
 * @param {string} placa
 * @returns {string|null} - Mensaje de error o null si es válido
 */
function validatePlaca(placa) {
  if (!placa) return "La placa es requerida";
  if (!PLACA_REGEX.test(placa.replace(/\s/g, ""))) {
    return "Formato de placa inválido. Use: ABC-123 o ABC1234";
  }
  return null;
}

/**
 * validateAnio
 * Valida que el año del vehículo sea un número razonable (entre 1900 y año+1).
 *
 * @param {string|number} anio
 * @returns {string|null}
 */
function validateAnio(anio) {
  if (!anio) return null;
  const year = Number(anio);
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < 1900 || year > currentYear + 1) {
    return `El año debe estar entre 1900 y ${currentYear + 1}`;
  }
  return null;
}

/**
 * extractErrorMessage
 * Extrae un mensaje legible desde la respuesta de error del backend:
 * - Maneja estructura `{ errors: [...] }`, `message`, `error` y fallback.
 *
 * @param {Error} err
 * @returns {string}
 */
function extractErrorMessage(err) {
  const data = err?.response?.data;
  if (!data) return err?.message || "Error desconocido";

  if (data.errors && Array.isArray(data.errors)) {
    const messages = data.errors.map((e) => {
      const field = e.path || e.param || e.field || "";
      const msg = e.msg || e.message || "";
      return field ? `${field}: ${msg}` : msg;
    });
    return messages.join(". ");
  }

  if (data.message) return data.message;
  if (data.error) return data.error;

  return "Error de validación";
}

/**
 * formatNumber
 * Formatea un número usando locale 'es-PE' para presentar con separadores de miles.
 *
 * @param {number|string} value
 * @returns {string}
 */
const formatNumber = (value) => {
  if (!value && value !== 0) return "";
  const num = Number(value);
  if (isNaN(num)) return value;
  // Usar locale es-PE para Perú (coma como separador de miles)
  return num.toLocaleString("es-PE");
};

/**
 * parseFormattedNumber
 * Convierte una cadena formateada (p.ej. 1,234.56) a su representación limpia sin separadores.
 *
 * @param {string} value
 * @returns {string}
 */
const parseFormattedNumber = (value) => {
  if (!value) return "";
  // Remover comas (separador de miles en Perú)
  const cleaned = value.toString().replace(/,/g, "");
  return cleaned;
};

const initialFormData = {
  tipo_id: "",
  nombre: "",
  placa: "",
  marca: "",
  modelo_vehiculo: "",
  anio_vehiculo: "",
  color_vehiculo: "",
  unidad_oficina_id: "",
  numero_motor: "",
  numero_chasis: "",
  kilometraje_inicial: "",
  kilometraje_actual: "",
  capacidad_combustible: "",
  soat: "",
  fec_soat: "",
  fec_manten: "",
  conductor_asignado_id: "",
  estado_operativo: "DISPONIBLE",
  observaciones: "",
};

/**
 * VehiculosPage - Página para gestión de vehículos
 *
 * @version 2.0.0
 * @component
 * @category Pages
 * @description Componente principal para listar, crear, editar y ver vehículos. Incluye validaciones
 * front-end y utilidades de formateo para la interfaz.
 *
 * Reglas:
 *  - No se modifica la lógica: sólo se añaden comentarios y JSDoc para aprendizaje.
 *  - Mantener coherencia con estilos y accesos por permisos.
 *
 * @returns {JSX.Element}
 */

export default function VehiculosPage() {
  const user = useAuthStore((s) => s.user);
  const canCreate = canPerformAction(user, "vehiculos_create");
  const canEdit = canPerformAction(user, "vehiculos_update");
  const canDelete = canPerformAction(user, "vehiculos_delete");

  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [viewingVehiculo, setViewingVehiculo] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Catálogos
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [conductores, setConductores] = useState([]);

  // Refs para mantener valores actualizados en el event listener
  const formDataRef = useRef(formData);
  const savingRef = useRef(saving);
  const showCreateModalRef = useRef(showCreateModal);
  const editingVehiculoRef = useRef(editingVehiculo);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);
  useEffect(() => {
    showCreateModalRef.current = showCreateModal;
  }, [showCreateModal]);
  useEffect(() => {
    editingVehiculoRef.current = editingVehiculo;
  }, [editingVehiculo]);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      try {
        const [tiposRes, unidadesRes, conductoresRes] = await Promise.all([
          listTiposVehiculo(),
          listUnidades(),
          listConductores(),
        ]);
        setTiposVehiculo(Array.isArray(tiposRes) ? tiposRes : []);
        setUnidades(Array.isArray(unidadesRes) ? unidadesRes : []);
        setConductores(Array.isArray(conductoresRes) ? conductoresRes : []);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
      }
    };
    loadCatalogos();
  }, []);

  /**
   * fetchVehiculos
   * Consulta paginada de vehículos con filtros actuales y actualiza `vehiculos` y `pagination`.
   *
   * @param {Object} [options]
   * @param {number} [options.nextPage=1]
   * @returns {Promise<void>}
   */
  const fetchVehiculos = async ({ nextPage = 1 } = {}) => {
    setLoading(true);
    try {
      const result = await listVehiculos({
        page: nextPage,
        limit: 15,
        estado_operativo: filterEstado || undefined,
        search: search || undefined,
      });
      const items = result?.vehiculos || result?.data || result || [];
      setVehiculos(Array.isArray(items) ? items : []);
      setPagination(result?.pagination || null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiculos({ nextPage: page });
  }, [page, filterEstado]);

  const handleSearch = () => {
    setPage(1);
    fetchVehiculos({ nextPage: 1 });
  };

  const handleDelete = async (v) => {
    const confirmed = window.confirm(`¿Eliminar vehículo ${v.placa}?`);
    if (!confirmed) return;
    try {
      await deleteVehiculo(v.id);
      toast.success("Vehículo eliminado");
      fetchVehiculos({ nextPage: page });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al eliminar");
    }
  };

  const handleRestore = async (v) => {
    try {
      await restoreVehiculo(v.id);
      toast.success("Vehículo restaurado");
      fetchVehiculos({ nextPage: page });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error al restaurar");
    }
  };

  /**
   * resetForm
   * Restaura el formulario de vehículo a su estado inicial y resetea la pestaña activa.
   */
  const resetForm = () => {
    setFormData(initialFormData);
    setActiveTab(0);
  };

  /**
   * handleCreate
   * Valida y envía la creación de un vehículo al backend.
   * - Formatea y convierte campos antes de enviar.
   * - Muestra mensajes de éxito/errores y refresca el listado.
   *
   * @returns {Promise<void>}
   */
  const handleCreate = async () => {
    // Validaciones frontend
    if (!formData.tipo_id) {
      toast.error("Seleccione el tipo de vehículo");
      setActiveTab(0);
      return;
    }

    const placaError = validatePlaca(formData.placa);
    if (placaError) {
      toast.error(placaError);
      setActiveTab(0);
      return;
    }

    if (!formData.unidad_oficina_id) {
      toast.error("Seleccione la unidad/oficina");
      setActiveTab(0);
      return;
    }

    const anioError = validateAnio(formData.anio_vehiculo);
    if (anioError) {
      toast.error(anioError);
      setActiveTab(0);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tipo_id: Number(formData.tipo_id),
        nombre: formData.nombre?.trim().toUpperCase() || undefined,
        placa: formData.placa.toUpperCase().trim().replace(/\s/g, ""),
        marca: formData.marca?.trim() || undefined,
        modelo_vehiculo: formData.modelo_vehiculo?.trim() || undefined,
        anio_vehiculo: formData.anio_vehiculo
          ? Number(formData.anio_vehiculo)
          : undefined,
        color_vehiculo: formData.color_vehiculo?.trim() || undefined,
        unidad_oficina_id: Number(formData.unidad_oficina_id),
        numero_motor: formData.numero_motor?.trim() || undefined,
        numero_chasis: formData.numero_chasis?.trim() || undefined,
        kilometraje_inicial: formData.kilometraje_inicial
          ? Number(formData.kilometraje_inicial)
          : undefined,
        kilometraje_actual: formData.kilometraje_actual
          ? Number(formData.kilometraje_actual)
          : undefined,
        capacidad_combustible: formData.capacidad_combustible
          ? Number(formData.capacidad_combustible)
          : undefined,
        soat: formData.soat?.trim() || undefined,
        fec_soat: formData.fec_soat || undefined,
        fec_manten: formData.fec_manten || undefined,
        conductor_asignado_id: formData.conductor_asignado_id
          ? Number(formData.conductor_asignado_id)
          : undefined,
        estado_operativo: formData.estado_operativo || "DISPONIBLE",
        observaciones: formData.observaciones?.trim() || undefined,
      };

      await createVehiculo(payload);
      toast.success("Vehículo creado exitosamente");
      setShowCreateModal(false);
      resetForm();
      fetchVehiculos({ nextPage: 1 });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /**
   * handleUpdate
   * Valida y envía la actualización de un vehículo existente al backend.
   * - Similar a `handleCreate` pero usa `editingVehiculo.id`.
   *
   * @returns {Promise<void>}
   */
  const handleUpdate = async () => {
    if (!editingVehiculo) return;

    // Validaciones frontend
    if (!formData.tipo_id) {
      toast.error("Seleccione el tipo de vehículo");
      setActiveTab(0);
      return;
    }

    const placaError = validatePlaca(formData.placa);
    if (placaError) {
      toast.error(placaError);
      setActiveTab(0);
      return;
    }

    if (!formData.unidad_oficina_id) {
      toast.error("Seleccione la unidad/oficina");
      setActiveTab(0);
      return;
    }

    const anioError = validateAnio(formData.anio_vehiculo);
    if (anioError) {
      toast.error(anioError);
      setActiveTab(0);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        tipo_id: Number(formData.tipo_id),
        nombre: formData.nombre?.trim().toUpperCase() || undefined,
        placa: formData.placa.toUpperCase().trim().replace(/\s/g, ""),
        marca: formData.marca?.trim() || undefined,
        modelo_vehiculo: formData.modelo_vehiculo?.trim() || undefined,
        anio_vehiculo: formData.anio_vehiculo
          ? Number(formData.anio_vehiculo)
          : undefined,
        color_vehiculo: formData.color_vehiculo?.trim() || undefined,
        unidad_oficina_id: Number(formData.unidad_oficina_id),
        numero_motor: formData.numero_motor?.trim() || undefined,
        numero_chasis: formData.numero_chasis?.trim() || undefined,
        kilometraje_inicial: formData.kilometraje_inicial
          ? Number(formData.kilometraje_inicial)
          : undefined,
        kilometraje_actual: formData.kilometraje_actual
          ? Number(formData.kilometraje_actual)
          : undefined,
        capacidad_combustible: formData.capacidad_combustible
          ? Number(formData.capacidad_combustible)
          : undefined,
        soat: formData.soat?.trim() || undefined,
        fec_soat: formData.fec_soat || undefined,
        fec_manten: formData.fec_manten || undefined,
        conductor_asignado_id: formData.conductor_asignado_id
          ? Number(formData.conductor_asignado_id)
          : undefined,
        estado_operativo: formData.estado_operativo || "DISPONIBLE",
        observaciones: formData.observaciones?.trim() || undefined,
      };

      await updateVehiculo(editingVehiculo.id, payload);
      toast.success("Vehículo actualizado exitosamente");
      setEditingVehiculo(null);
      resetForm();
      fetchVehiculos({ nextPage: page });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  /**
   * openEditModal
   * Abre el modal de edición y precarga el formulario con los datos del vehículo seleccionado.
   *
   * @param {Object} v - vehículo seleccionado
   */
  const openEditModal = (v) => {
    setEditingVehiculo(v);
    setFormData({
      tipo_id: v.tipo_id || "",
      nombre: v.nombre || "",
      placa: v.placa || "",
      marca: v.marca || "",
      modelo_vehiculo: v.modelo_vehiculo || "",
      anio_vehiculo: v.anio_vehiculo || "",
      color_vehiculo: v.color_vehiculo || "",
      unidad_oficina_id: v.unidad_oficina_id || "",
      numero_motor: v.numero_motor || "",
      numero_chasis: v.numero_chasis || "",
      kilometraje_inicial: v.kilometraje_inicial || "",
      kilometraje_actual: v.kilometraje_actual || "",
      capacidad_combustible: v.capacidad_combustible || "",
      soat: v.soat || "",
      fec_soat: v.fec_soat || "",
      fec_manten: v.fec_manten || "",
      conductor_asignado_id: v.conductor_asignado_id || "",
      estado_operativo: v.estado_operativo || "DISPONIBLE",
      observaciones: v.observaciones || "",
    });
    setActiveTab(0);
  };

  /**
   * estadoColor
   * Retorna clases CSS para representar el estado operativo de un vehículo.
   *
   * @param {string} estado
   * @returns {string}
   */
  const estadoColor = (estado) => {
    switch (estado) {
      case "DISPONIBLE":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "EN_SERVICIO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "MANTENIMIENTO":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "REPARACION":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "FUERA_DE_SERVICIO":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "INACTIVO":
        return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Hotkey Alt+G para guardar, Alt+N para nuevo, Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+G = Guardar
      if (e.altKey && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (showCreateModalRef.current && !savingRef.current) {
          // Simular click en botón Crear
          document.getElementById("btn-crear-vehiculo")?.click();
        } else if (editingVehiculoRef.current && !savingRef.current) {
          // Simular click en botón Guardar
          document.getElementById("btn-guardar-vehiculo")?.click();
        }
      }
      // Alt+N = Nuevo vehículo
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (canCreate && !showCreateModal && !editingVehiculo) {
          setShowCreateModal(true);
        }
      }
      // Escape = Cerrar modal
      if (e.key === "Escape") {
        if (showCreateModal) {
          setShowCreateModal(false);
          resetForm();
        } else if (editingVehiculo) {
          setEditingVehiculo(null);
          resetForm();
        } else if (viewingVehiculo) {
          setViewingVehiculo(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showCreateModal, editingVehiculo, viewingVehiculo, canCreate]);

  /**
   * getTipoNombre
   * Obtiene el nombre del tipo de vehículo usando datos embebidos o catálogo local.
   *
   * @param {Object} vehiculo
   * @returns {string}
   */
  const getTipoNombre = (vehiculo) => {
    // Primero intentar con datos incluidos del backend
    if (vehiculo?.VehiculoTipo?.nombre) return vehiculo.VehiculoTipo.nombre;
    if (vehiculo?.tipo?.nombre) return vehiculo.tipo.nombre;
    // Fallback a buscar en catálogo local
    const tipo = tiposVehiculo.find((t) => t.id === vehiculo?.tipo_id);
    return tipo?.nombre || tipo?.tipo || "—";
  };

  /**
   * getUnidadNombre
   * Obtiene el nombre de la unidad/oficina asociada al vehículo.
   *
   * @param {Object} vehiculo
   * @returns {string}
   */
  const getUnidadNombre = (vehiculo) => {
    // Primero intentar con datos incluidos del backend
    if (vehiculo?.VehiculoUnidad?.nombre) return vehiculo.VehiculoUnidad.nombre;
    if (vehiculo?.unidad?.nombre) return vehiculo.unidad.nombre;
    if (vehiculo?.UnidadOficina?.nombre) return vehiculo.UnidadOficina.nombre;
    // Fallback a buscar en catálogo local
    const unidad = unidades.find((u) => u.id === vehiculo?.unidad_oficina_id);
    return unidad?.nombre || "—";
  };

  /**
   * capitalize
   * Capitaliza la primera letra de cada palabra para mejorar la presentación.
   *
   * @param {string} str
   * @returns {string}
   */
  const capitalize = (str) => {
    if (!str) return "";
    return str.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
  };

  // Tabs del formulario con iconos
  const tabs = [
    { id: 0, label: "Datos Básicos", icon: "1" },
    { id: 1, label: "Datos Técnicos", icon: "2" },
    { id: 2, label: "Documentos y Asignación", icon: "3" },
  ];

  // Formulario con pestañas
  const renderForm = () => (
    <div className="space-y-4">
      {/* Tabs mejorados con indicadores visuales */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? "bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-400 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                activeTab === tab.id
                  ? "bg-primary-600 text-white"
                  : activeTab > tab.id
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
              }`}
            >
              {activeTab > tab.id ? "✓" : tab.icon}
            </span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 0: Datos Básicos */}
      {activeTab === 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Tipo de Vehículo *
            </label>
            <select
              value={formData.tipo_id}
              onChange={(e) =>
                setFormData({ ...formData, tipo_id: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione —</option>
              {tiposVehiculo.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre || t.tipo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Placa *
            </label>
            <input
              value={formData.placa}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  placa: e.target.value.toUpperCase(),
                })
              }
              placeholder="ABC-123"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Nombre / Alias
            </label>
            <input
              value={formData.nombre}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  nombre: e.target.value.toUpperCase(),
                })
              }
              placeholder="Ej: PANTERA, HALCÓN-1, MÓVIL-5"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
            <p className="mt-1 text-xs text-slate-500">
              Nombre corto o alias para identificar el vehículo fácilmente
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Marca
            </label>
            <input
              value={formData.marca}
              onChange={(e) =>
                setFormData({ ...formData, marca: capitalize(e.target.value) })
              }
              placeholder="Ej: Toyota"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Modelo
            </label>
            <input
              value={formData.modelo_vehiculo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  modelo_vehiculo: capitalize(e.target.value),
                })
              }
              placeholder="Ej: Hi-Lux"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Año
            </label>
            <input
              type="number"
              value={formData.anio_vehiculo}
              onChange={(e) =>
                setFormData({ ...formData, anio_vehiculo: e.target.value })
              }
              min="1900"
              max={new Date().getFullYear() + 1}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Color
            </label>
            <input
              value={formData.color_vehiculo}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  color_vehiculo: capitalize(e.target.value),
                })
              }
              placeholder="Ej: Blanco"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Unidad/Oficina *
            </label>
            <select
              value={formData.unidad_oficina_id}
              onChange={(e) =>
                setFormData({ ...formData, unidad_oficina_id: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione —</option>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Estado Operativo
            </label>
            <select
              value={formData.estado_operativo}
              onChange={(e) =>
                setFormData({ ...formData, estado_operativo: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              {ESTADO_OPERATIVO_OPTIONS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mensaje guía para otras pestañas */}
          <div className="col-span-2 mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <span>
                <strong>Tip:</strong> Puede agregar más información usando las
                pestañas
                <button
                  type="button"
                  onClick={() => setActiveTab(1)}
                  className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-100"
                >
                  Datos Técnicos
                </button>{" "}
                y
                <button
                  type="button"
                  onClick={() => setActiveTab(2)}
                  className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-100"
                >
                  Documentos
                </button>
                .
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Tab 1: Datos Técnicos */}
      {activeTab === 1 && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Número de Motor
            </label>
            <input
              value={formData.numero_motor}
              onChange={(e) =>
                setFormData({ ...formData, numero_motor: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Número de Chasis
            </label>
            <input
              value={formData.numero_chasis}
              onChange={(e) =>
                setFormData({ ...formData, numero_chasis: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Kilometraje Inicial
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(formData.kilometraje_inicial)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kilometraje_inicial: parseFormattedNumber(e.target.value),
                })
              }
              placeholder="Ej: 10,500"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Kilometraje Actual
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formatNumber(formData.kilometraje_actual)}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kilometraje_actual: parseFormattedNumber(e.target.value),
                })
              }
              placeholder="Ej: 25,000"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Capacidad Combustible (galones)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.capacidad_combustible}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  capacidad_combustible: e.target.value,
                })
              }
              min="0"
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
        </div>
      )}

      {/* Tab 2: Documentos y Asignación */}
      {activeTab === 2 && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Número SOAT
            </label>
            <input
              value={formData.soat}
              onChange={(e) =>
                setFormData({ ...formData, soat: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Vencimiento SOAT
            </label>
            <input
              type="date"
              value={formData.fec_soat}
              onChange={(e) =>
                setFormData({ ...formData, fec_soat: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Próximo Mantenimiento
            </label>
            <input
              type="date"
              value={formData.fec_manten}
              onChange={(e) =>
                setFormData({ ...formData, fec_manten: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Conductor Asignado
            </label>
            <select
              value={formData.conductor_asignado_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  conductor_asignado_id: e.target.value,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Sin asignar —</option>
              {conductores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombres} {c.apellido_paterno} {c.apellido_materno} -{" "}
                  {c.licencia || "Sin licencia"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Solo personal con licencia de conducir
            </p>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              rows={3}
              className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Vehículos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestión de la flota vehicular
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchVehiculos({ nextPage: page })}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Refrescar
          </button>
          {canCreate && (
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 text-white px-4 py-2 text-sm font-medium hover:bg-primary-800"
            >
              <Plus size={16} />
              Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar por placa, marca, modelo..."
              className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            value={filterEstado}
            onChange={(e) => {
              setFilterEstado(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
          >
            <option value="">Todos los estados</option>
            {ESTADO_OPERATIVO_OPTIONS.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-slate-800 dark:bg-slate-700 text-white px-4 py-2 text-sm font-medium hover:bg-slate-900 dark:hover:bg-slate-600"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Placa
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Marca / Modelo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  Unidad
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Cargando...
                  </td>
                </tr>
              ) : vehiculos.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No hay registros
                  </td>
                </tr>
              ) : (
                vehiculos.map((v) => (
                  <tr
                    key={v.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                      v.deleted_at ? "opacity-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {getTipoNombre(v)}
                    </td>
                    <td className="px-4 py-3 text-slate-900 dark:text-slate-50 font-semibold font-mono">
                      {v.placa}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {v.marca} {v.modelo_vehiculo}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                      {getUnidadNombre(v)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor(
                          v.estado_operativo
                        )}`}
                      >
                        {ESTADO_OPERATIVO_OPTIONS.find(
                          (e) => e.value === v.estado_operativo
                        )?.label || v.estado_operativo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingVehiculo(v)}
                          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Ver detalle"
                        >
                          <Eye size={14} />
                        </button>
                        {canEdit && !v.deleted_at && (
                          <button
                            onClick={() => openEditModal(v)}
                            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Editar"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        {v.deleted_at ? (
                          <button
                            onClick={() => handleRestore(v)}
                            className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            title="Restaurar"
                          >
                            <RotateCcw size={14} />
                          </button>
                        ) : (
                          canDelete && (
                            <button
                              onClick={() => handleDelete(v)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Eliminar"
                            >
                              <Trash2 size={14} />
                            </button>
                          )
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
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Página {pagination.page} de {pagination.totalPages} (
              {pagination.total} registros)
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Nuevo Vehículo
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{renderForm()}</div>
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400">
                Alt+G = Guardar | Esc = Cancelar
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  id="btn-crear-vehiculo"
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Crear"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {editingVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Editar Vehículo: {editingVehiculo.placa}
              </h2>
              <button
                onClick={() => {
                  setEditingVehiculo(null);
                  resetForm();
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">{renderForm()}</div>
            <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-400">
                Alt+G = Guardar | Esc = Cancelar
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingVehiculo(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  id="btn-guardar-vehiculo"
                  onClick={handleUpdate}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ver Detalle */}
      {viewingVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Detalle del Vehículo
              </h2>
              <button
                onClick={() => setViewingVehiculo(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Car className="w-8 h-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.placa}
                  </h3>
                  <p className="text-slate-500">
                    {viewingVehiculo.marca} {viewingVehiculo.modelo_vehiculo}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Tipo</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {getTipoNombre(viewingVehiculo.tipo_id)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Unidad</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {getUnidadNombre(viewingVehiculo.unidad_oficina_id)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Año</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.anio_vehiculo || "—"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Color</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.color_vehiculo || "—"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">Estado</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoColor(
                      viewingVehiculo.estado_operativo
                    )}`}
                  >
                    {ESTADO_OPERATIVO_OPTIONS.find(
                      (e) => e.value === viewingVehiculo.estado_operativo
                    )?.label || viewingVehiculo.estado_operativo}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">
                    Kilometraje
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.kilometraje_actual?.toLocaleString() ||
                      "0"}{" "}
                    km
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">SOAT</p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.soat || "—"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400">
                    Venc. SOAT
                  </p>
                  <p className="font-medium text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.fec_soat || "—"}
                  </p>
                </div>
              </div>

              {viewingVehiculo.observaciones && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Observaciones
                  </p>
                  <p className="text-slate-900 dark:text-slate-50">
                    {viewingVehiculo.observaciones}
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewingVehiculo(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 dark:hover:bg-slate-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
