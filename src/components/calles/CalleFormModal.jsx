/**
 * File: src/components/calles/CalleFormModal.jsx
 * @version 1.1.0
 * @description Modal con pestañas para crear/editar calles
 *
 * CHANGELOG v1.1.0:
 * - ✅ Corregido problema de espacios en inputs
 * - ✅ Tecla ESC para cerrar modal
 * - ✅ Keys únicas en listas
 *
 * @module src/components/calles/CalleFormModal.jsx
 */

import { useState, useEffect } from "react";
import {
  X,
  FileText,
  MapPin,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  createCalle,
  updateCalle,
  listTiposVia,
} from "../../services/callesService";
import { listUbigeos, getUbigeoByCode } from "../../services/novedadesService";
import { getDefaultUbigeo } from "../../config/defaults";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import toast from "react-hot-toast";

/**
 * Capitaliza la primera letra de cada palabra
 * Mantiene siglas comunes en mayúsculas (AAHH, AA.HH., JR., AV., etc.)
 */
function capitalizeWords(str) {
  if (!str) return "";

  // Siglas que deben mantenerse en mayúsculas
  const siglas = [
    "AAHH",
    "AA.HH.",
    "AV.",
    "JR.",
    "CA.",
    "PSJE.",
    "URB.",
    "APV.",
  ];

  const words = str.trim().split(/\s+/);

  return words
    .map((word) => {
      const upperWord = word.toUpperCase();

      // Si es una sigla conocida, mantener en mayúsculas
      if (siglas.includes(upperWord)) {
        return upperWord;
      }

      // Si la palabra está toda en mayúsculas Y tiene 2-4 letras, mantenerla
      // Esto captura siglas como "AA", "HH", etc.
      if (word === upperWord && word.length >= 2 && word.length <= 4) {
        return upperWord;
      }

      // Capitalizar normalmente (primera letra mayúscula, resto minúscula)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * CalleFormModal - Modal con pestañas para CRUD de calles
 * @component
 */
export default function CalleFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  mode = "create", // "create" | "edit"
}) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // ============================================
  // ESTADO
  // ============================================
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tiposVia, setTiposVia] = useState([]);
  const [ubigeos, setUbigeos] = useState([]);
  const [ubigeoSearch, setUbigeoSearch] = useState("");
  const [showUbigeoDropdown, setShowUbigeoDropdown] = useState(false);
  const [defaultUbigeo, setDefaultUbigeo] = useState(null); // Ubigeo por defecto

  const [formData, setFormData] = useState({
    tipo_via_id: "",
    nombre_via: "",
    ubigeo_code: "",
    urbanizacion: "",
    referencia: "",
    es_principal: false,
    categoria_via: "LOCAL",
    latitud: "",
    longitud: "",
    tipo_pavimento: "",
    sentido_via: "",
  });

  // ============================================
  // EFECTOS
  // ============================================
  // Cargar ubigeo por defecto al montar
  useEffect(() => {
    getDefaultUbigeo()
      .then((ubigeo) => {
        setDefaultUbigeo(ubigeo);
        console.log("📍 Ubigeo default cargado (Calles):", ubigeo);
      })
      .catch((err) => {
        console.error("Error cargando ubigeo default:", err);
      });
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTiposVia();
      // ❌ NO cargar todos los UBIGEOs al inicio (son miles)
      // La búsqueda se hace en tiempo real conforme escribe

      if (initialData && mode === "edit") {
        setFormData({
          tipo_via_id: initialData.tipo_via_id || "",
          nombre_via: initialData.nombre_via || "",
          ubigeo_code: initialData.ubigeo_code || "",
          urbanizacion: initialData.urbanizacion || "",
          referencia: initialData.observaciones || initialData.referencia || "", // ← Mapeo
          es_principal: initialData.es_principal || false,
          categoria_via: initialData.categoria_via || "LOCAL",
          latitud: initialData.latitud || "",
          longitud: initialData.longitud || "",
          tipo_pavimento: initialData.tipo_pavimento || "",
          sentido_via: initialData.sentido_via || "",
        });

        // Set UBIGEO search text
        if (initialData.Ubigeo) {
          // Caso 1: Viene con la relación cargada
          setUbigeoSearch(
            `${initialData.Ubigeo.departamento}/${initialData.Ubigeo.provincia}/${initialData.Ubigeo.distrito}`
          );
        } else if (initialData.ubigeo_code) {
          // Caso 2: Buscar el UBIGEO por código via API
          fetchUbigeoByCode(initialData.ubigeo_code);
        }
      } else if (mode === "create" && defaultUbigeo) {
        // Modo create: usar ubigeo por defecto
        setFormData(prev => ({
          ...prev,
          ubigeo_code: defaultUbigeo.code,
        }));
        setUbigeoSearch(`${defaultUbigeo.departamento}/${defaultUbigeo.provincia}/${defaultUbigeo.distrito}`);
      }
    }
  }, [isOpen, initialData, mode, defaultUbigeo]);

  // Función para buscar UBIGEO por código (modo edit)
  async function fetchUbigeoByCode(code) {
    try {
      const ubigeo = await getUbigeoByCode(code);
      if (ubigeo) {
        setUbigeoSearch(
          `${ubigeo.departamento}/${ubigeo.provincia}/${ubigeo.distrito}`
        );
      } else {
        setUbigeoSearch("");
      }
    } catch (err) {
      console.error("Error buscando UBIGEO por código:", err);
      setUbigeoSearch("");
    }
  }

  // ❌ ELIMINADO: Ya no necesitamos este useEffect
  // El UBIGEO se carga directamente en el useEffect principal

  // Shortcuts de teclado para navegación de pestañas
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      // ESC = Cerrar modal
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      // ALT + G = Guardar
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        document.getElementById("submit-calle-btn")?.click();
        return;
      }

      // Av.Pag (PageDown) = Siguiente pestaña
      if (e.key === "PageDown") {
        e.preventDefault();
        if (activeTab < 2) setActiveTab(activeTab + 1);
      }
      // Re.Pag (PageUp) = Pestaña anterior
      if (e.key === "PageUp") {
        e.preventDefault();
        if (activeTab > 0) setActiveTab(activeTab - 1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab]);

  // ============================================
  // FUNCIONES DE CARGA
  // ============================================
  async function loadTiposVia() {
    try {
      const data = await listTiposVia();
      setTiposVia(data || []);
    } catch (error) {
      console.error("Error al cargar tipos de vía:", error);
    }
  }

  // ============================================
  // HANDLERS
  // ============================================
  // ============================================
  // BÚSQUEDA DINÁMICA DE UBIGEOS (como Novedades)
  // ============================================
  async function fetchUbigeos(searchTerm) {
    if (!searchTerm || searchTerm.length < 2) {
      setUbigeos([]);
      setShowUbigeoDropdown(false);
      return;
    }

    try {
      const res = await listUbigeos(searchTerm);
      const ubigeosList = Array.isArray(res) ? res : [];
      setUbigeos(ubigeosList);
      setShowUbigeoDropdown(ubigeosList.length > 0);
    } catch (err) {
      console.error("Error buscando ubigeos:", err);
      setUbigeos([]);
      setShowUbigeoDropdown(false);
    }
  }

  function handleUbigeoSearch(e) {
    const value = e.target.value;
    setUbigeoSearch(value);
    fetchUbigeos(value); // ← Buscar en tiempo real
  }

  function handleUbigeoSelect(ubigeo) {
    // Actualizar formData con el código
    setFormData({ ...formData, ubigeo_code: ubigeo.ubigeo_code });

    // Actualizar el texto del campo con el distrito completo (formato: LIMA/LIMA/CHORRILLOS)
    const ubigeoText = `${ubigeo.departamento}/${ubigeo.provincia}/${ubigeo.distrito}`;
    setUbigeoSearch(ubigeoText);

    // Cerrar dropdown
    setShowUbigeoDropdown(false);
  }

  function handleUrbanizacionChange(e) {
    const value = e.target.value;
    // Solo actualizar el valor, NO capitalizar en tiempo real
    setFormData({ ...formData, urbanizacion: value });
  }

  function handleUrbanizacionBlur(e) {
    const value = e.target.value;
    // Capitalizar solo al salir del campo
    const capitalized = capitalizeWords(value);
    setFormData({ ...formData, urbanizacion: capitalized });
  }

  function handleNextTab() {
    if (activeTab < 2) setActiveTab(activeTab + 1);
  }

  function handlePrevTab() {
    if (activeTab > 0) setActiveTab(activeTab - 1);
  }

  async function handleSubmit() {
    // Validaciones básicas
    if (!formData.tipo_via_id) {
      window.alert("⚠️ ERROR DE VALIDACIÓN\n\nDebe seleccionar un tipo de vía");
      setActiveTab(0);
      return;
    }

    if (!formData.nombre_via.trim()) {
      window.alert(
        "⚠️ ERROR DE VALIDACIÓN\n\nDebe ingresar el nombre de la vía"
      );
      setActiveTab(0);
      return;
    }

    if (!formData.ubigeo_code) {
      window.alert(
        "⚠️ ERROR DE VALIDACIÓN\n\nDebe seleccionar un UBIGEO\n\nPor favor, busque y seleccione un distrito válido."
      );
      setActiveTab(1);
      return;
    }

    try {
      setLoading(true);

      // CONVERTIR es_principal a 0 o 1 y mapear campos
      const dataToSend = {
        ...formData,
        es_principal: formData.es_principal ? 1 : 0,
        observaciones: formData.referencia || null, // Mapear referencia → observaciones
      };

      if (mode === "create") {
        await createCalle(dataToSend);
        toast.success("Calle creada exitosamente");
      } else {
        await updateCalle(initialData.id, dataToSend);
        toast.success("Calle actualizada exitosamente");
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("❌ Error al guardar calle:", error);
      console.error("📋 Detalles del error:", error.response?.data);

      // 🔥 MEJORAR MENSAJE DE ERROR
      const errorData = error.response?.data;
      let errorTitle = "❌ ERROR AL GUARDAR CALLE";
      let errorMessage = "";

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Errores de validación del backend
        errorMessage = errorData.errors
          .map((err) => {
            const field = err.field || err.path || "Campo";
            const msg = err.message || "Error desconocido";
            return `• ${field}: ${msg}`;
          })
          .join("\n");
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Error desconocido al guardar la calle";
      }

      window.alert(`${errorTitle}\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFormData({
      tipo_via_id: "",
      nombre_via: "",
      ubigeo_code: "",
      urbanizacion: "",
      referencia: "",
      es_principal: false,
      categoria_via: "LOCAL",
      latitud: "",
      longitud: "",
      tipo_pavimento: "",
      sentido_via: "",
    });
    setActiveTab(0);
    setUbigeoSearch("");
    onClose();
  }

  // ============================================
  // DROPDOWN UBIGEO (API ya filtra)
  // ============================================
  // La API ya devuelve solo los distritos que coinciden con la búsqueda
  const filteredUbigeos = ubigeos;

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  const tabs = [
    { id: 0, label: "Datos Básicos", icon: FileText },
    { id: 1, label: "Ubicación", icon: MapPin },
    { id: 2, label: "Información Adicional", icon: Info },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <MapPin
                size={20}
                className="text-primary-700 dark:text-primary-400"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {mode === "create" ? "Nueva Calle" : "Editar Calle"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complete los datos de la calle
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* ============================================
            PESTAÑAS
            ============================================ */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex" role="tablist">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                    isActive
                      ? "border-primary-600 text-primary-700 dark:text-primary-400"
                      : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ============================================
            CONTENIDO DE PESTAÑAS
            ============================================ */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ========== TAB 0: DATOS BÁSICOS ========== */}
          {activeTab === 0 && (
            <div className="space-y-4">
              {/* Tipo de Vía */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Tipo de Vía <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo_via_id}
                  onChange={(e) => {
                    setFormData({ ...formData, tipo_via_id: e.target.value });
                    // Auto-foco al campo nombre de vía
                    setTimeout(() => {
                      document.getElementById('nombre_via_input')?.focus();
                    }, 100);
                  }}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  required
                  autoFocus
                >
                  <option value="">Seleccione tipo de vía</option>
                  {tiposVia.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} ({tipo.abreviatura})
                    </option>
                  ))}
                </select>
              </div>

              {/* Nombre de Vía */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Nombre de la Vía <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre_via_input"
                  value={formData.nombre_via}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre_via: e.target.value })
                  }
                  onBlur={(e) =>
                    setFormData({
                      ...formData,
                      nombre_via: capitalizeWords(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  placeholder="Ejemplo: Los Héroes"
                  required
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Se capitalizará al salir del campo
                </p>
              </div>

              {/* Tipo de Pavimento y Sentido de Vía */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo de Pavimento */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Tipo de Pavimento
                  </label>
                  <select
                    value={formData.tipo_pavimento}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_pavimento: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="ASFALTO">Asfalto</option>
                    <option value="CONCRETO">Concreto</option>
                    <option value="AFIRMADO">Afirmado</option>
                    <option value="TROCHA">Trocha</option>
                    <option value="ADOQUIN">Adoquín</option>
                    <option value="SIN_PAVIMENTO">Sin Pavimento</option>
                  </select>
                </div>

                {/* Sentido de Vía */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Sentido de Vía
                  </label>
                  <select
                    value={formData.sentido_via}
                    onChange={(e) =>
                      setFormData({ ...formData, sentido_via: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="UNA_VIA">Una Vía</option>
                    <option value="DOBLE_VIA">Doble Vía</option>
                    <option value="VARIABLE">Variable</option>
                  </select>
                </div>
              </div>

              {/* Vía Principal y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vía Principal */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <input
                    type="checkbox"
                    id="es_principal"
                    checked={formData.es_principal}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        es_principal: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label
                    htmlFor="es_principal"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Vía Principal
                  </label>
                </div>

                {/* Categoría de Vía */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria_via}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoria_via: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  >
                    <option value="ARTERIAL">Arterial</option>
                    <option value="COLECTORA">Colectora</option>
                    <option value="LOCAL">Local</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========== TAB 1: UBICACIÓN ========== */}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* UBIGEO Autocomplete */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  UBIGEO <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ubigeoSearch}
                  onChange={handleUbigeoSearch}
                  onFocus={() => {
                    if (ubigeoSearch.length >= 1) {
                      setShowUbigeoDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay para permitir click en dropdown
                    setTimeout(() => setShowUbigeoDropdown(false), 200);
                  }}
                  placeholder="Buscar distrito... (mín. 1 carácter)"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                />

                {/* Mostrar código UBIGEO seleccionado */}
                {formData.ubigeo_code && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="text-slate-600 dark:text-slate-400">
                      Código seleccionado:
                    </span>
                    <span className="font-mono font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                      {formData.ubigeo_code}
                    </span>
                  </div>
                )}

                {/* Dropdown de UBIGEO */}
                {showUbigeoDropdown && filteredUbigeos.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
                    {filteredUbigeos.slice(0, 50).map((ubigeo) => (
                      <div
                        key={ubigeo.ubigeo_code}
                        onMouseDown={(e) => {
                          e.preventDefault(); // ← Evita que se ejecute onBlur del input
                          handleUbigeoSelect(ubigeo);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-50 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{ubigeo.distrito}</div>
                          <div className="text-xs font-mono text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                            {ubigeo.ubigeo_code}
                          </div>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {ubigeo.provincia} - {ubigeo.departamento}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Urbanización */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Urbanización / Zona
                </label>
                <input
                  type="text"
                  value={formData.urbanizacion}
                  onChange={handleUrbanizacionChange}
                  onBlur={handleUrbanizacionBlur}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  placeholder="Ejemplo: AAHH Villa El Salvador"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Se capitalizará al salir del campo
                </p>
              </div>

            </div>
          )}

          {/* ========== TAB 2: INFORMACIÓN ADICIONAL ========== */}
          {activeTab === 2 && (
            <div className="space-y-4">
              {/* Referencia */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Referencias Adicionales
                </label>
                <textarea
                  value={formData.referencia}
                  onChange={(e) =>
                    setFormData({ ...formData, referencia: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  placeholder="Ingrese referencias geográficas, puntos de interés cercanos, etc."
                />
              </div>

              {/* Resumen de datos */}
              <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">
                  Resumen de la Calle
                </h3>
                <div className="space-y-2 text-sm">
                  {/* Mostrar código solo en modo EDIT */}
                  {mode === "edit" && initialData?.calle_code && (
                    <div className="flex justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="text-slate-600 dark:text-slate-400">
                        Código:
                      </span>
                      <span className="font-mono font-semibold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                        {initialData.calle_code}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Tipo:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {tiposVia.find(
                        (t) => t.id === parseInt(formData.tipo_via_id)
                      )?.nombre || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Nombre:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {formData.nombre_via || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Urbanización:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {formData.urbanizacion || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Tipo de Pavimento:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {formData.tipo_pavimento ? formData.tipo_pavimento.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      Sentido de Vía:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {formData.sentido_via ? formData.sentido_via.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">
                      UBIGEO:
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {ubigeoSearch || "-"}
                    </span>
                  </div>
                </div>

                {/* Campos de Auditoría */}
                {mode === "edit" && initialData && (
                  <div className="mt-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-3">
                      📋 Información de Auditoría
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400">
                          Creado por:
                        </span>
                        <span className="font-medium text-amber-900 dark:text-amber-200">
                          {initialData.created_by?.username || initialData.created_by || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400">
                          Fecha de Creación:
                        </span>
                        <span className="font-medium text-amber-900 dark:text-amber-200">
                          {initialData.created_at 
                            ? new Date(initialData.created_at).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400">
                          Actualizado por:
                        </span>
                        <span className="font-medium text-amber-900 dark:text-amber-200">
                          {initialData.updated_by?.username || initialData.updated_by || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-amber-700 dark:text-amber-400">
                          Última Actualización:
                        </span>
                        <span className="font-medium text-amber-900 dark:text-amber-200">
                          {initialData.updated_at 
                            ? new Date(initialData.updated_at).toLocaleString('es-PE', {
                                day: '2-digit',
                                month: '2-digit', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ============================================
            FOOTER (NAVEGACIÓN)
            ============================================ */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
          <button
            onClick={handlePrevTab}
            disabled={activeTab === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atajo: Re.Pag"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>

            {activeTab < 2 ? (
              <button
                onClick={handleNextTab}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
                title="Atajo: Av.Pag"
              >
                Siguiente
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                id="submit-calle-btn"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Atajo: ALT + G"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === "create" ? "Crear Calle" : "Actualizar Calle"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
