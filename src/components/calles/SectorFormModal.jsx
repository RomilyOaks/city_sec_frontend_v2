/**
 * File: src/components/calles/SectorFormModal.jsx
 * @version 2.0.0
 * @description Modal para crear/editar sectores con tabs y datos georeferenciados
 */

import { useState, useEffect } from "react";
import { X, MapPin, FileText } from "lucide-react";
import { createSector, updateSector } from "../../services/sectoresService";
import { listUbigeos, getUbigeoByCode } from "../../services/novedadesService";
import { listPersonalSelector } from "../../services/personalService";
import toast from "react-hot-toast";
import { getDefaultUbigeo } from "../../config/defaults";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function SectorFormModal({ isOpen, onClose, sector, onSuccess }) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState("basicos");
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    supervisor_id: "",
    ubigeo: "",
    zona_code: "",
    poligono_json: "",
    color_mapa: "#4A6126",
  });
  const [loading, setLoading] = useState(false);
  const [ubigeos, setUbigeos] = useState([]);
  const [ubigeoSearch, setUbigeoSearch] = useState("");
  const [showUbigeoDropdown, setShowUbigeoDropdown] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [defaultUbigeo, setDefaultUbigeo] = useState(null); // Ubigeo por defecto
  const [personalList, setPersonalList] = useState([]); // Lista de personal para supervisor

  // Cargar ubigeo por defecto y lista de personal al montar
  useEffect(() => {
    getDefaultUbigeo()
      .then((ubigeo) => {
        setDefaultUbigeo(ubigeo);
      })
      .catch((error) => {
        console.error("Error cargando ubigeo default:", error);
      });

    // Cargar lista de personal para selector de supervisor
    listPersonalSelector()
      .then((data) => {
        setPersonalList(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error cargando lista de personal:", error);
        setPersonalList([]);
      });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (sector) {
      setFormData({
        codigo: sector.sector_code || sector.codigo || "",
        nombre: sector.nombre || "",
        descripcion: sector.descripcion || "",
        supervisor_id: sector.supervisor_id || "",
        ubigeo: sector.ubigeo || "",
        zona_code: sector.zona_code || "",
        poligono_json: sector.poligono_json || "",
        color_mapa: sector.color_mapa || "#4A6126",
      });

      // Cargar texto del ubigeo si existe
      if (sector.Ubigeo) {
        // Caso 1: Objeto Ubigeo completo desde el backend
        const ubigeoText = `${sector.Ubigeo.departamento}/${sector.Ubigeo.provincia}/${sector.Ubigeo.distrito}`;
        setUbigeoSearch(ubigeoText);
      } else if (sector.ubigeo) {
        // Caso 2: Solo código, mostrar el código como fallback
        // Intentar buscar por código, pero si falla mostrar solo el código
        fetchUbigeoByCode(sector.ubigeo).then((found) => {
          if (!found) {
            // Si no se encuentra, mostrar el código como fallback
            setUbigeoSearch(sector.ubigeo);
          }
        });
      } else {
        setUbigeoSearch("");
      }
    } else {
      // Modo create: usar ubigeo por defecto
      setFormData({
        codigo: "",
        nombre: "",
        descripcion: "",
        supervisor_id: "",
        ubigeo: defaultUbigeo?.code || "",
        zona_code: "",
        poligono_json: "",
        color_mapa: "#4A6126",
      });
      if (defaultUbigeo) {
        setUbigeoSearch(`${defaultUbigeo.departamento}/${defaultUbigeo.provincia}/${defaultUbigeo.distrito}`);
      } else {
        setUbigeoSearch("");
      }
    }
    setActiveTab("basicos");
     
  }, [sector, isOpen, defaultUbigeo]);

  // Función para buscar UBIGEO por código (modo edit)
  async function fetchUbigeoByCode(code) {
    try {
      const ubigeo = await getUbigeoByCode(code);

      if (ubigeo) {
        const ubigeoText = `${ubigeo.departamento}/${ubigeo.provincia}/${ubigeo.distrito}`;
        setUbigeoSearch(ubigeoText);
        return true; // Encontrado
      } else {
        return false; // No encontrado
      }
    } catch (err) {
      return false; // Error
    }
  }

  // Búsqueda dinámica de UBIGEOs
  async function fetchUbigeos(searchTerm) {
    if (!searchTerm || searchTerm.trim().length === 0) {
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
      setUbigeos([]);
      setShowUbigeoDropdown(false);
    }
  }

  function handleUbigeoSearch(e) {
    const value = e.target.value;
    setUbigeoSearch(value);
    fetchUbigeos(value);
  }

  function handleUbigeoSelect(ubigeo) {
    setFormData({ ...formData, ubigeo: ubigeo.ubigeo_code });
    const ubigeoText = `${ubigeo.departamento}/${ubigeo.provincia}/${ubigeo.distrito}`;
    setUbigeoSearch(ubigeoText);
    setShowUbigeoDropdown(false);
  }

  // Autofocus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById("sector-codigo")?.focus();
      }, 100);
    }
  }, [isOpen]);

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
        document.getElementById("submit-sector-btn")?.click();
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
  }, [isOpen]);

  const handleClose = () => {
    setFormData({
      codigo: "",
      nombre: "",
      descripcion: "",
      supervisor_id: "",
      ubigeo: "",
      zona_code: "",
      poligono_json: "",
      color_mapa: "#4A6126",
    });
    setUbigeoSearch("");
    setUbigeos([]);
    setShowUbigeoDropdown(false);
    setValidationError("");
    setActiveTab("basicos");
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationError(""); // Limpiar errores previos

    try {
      // Validación de campos requeridos
      if (!formData.codigo || !formData.codigo.trim()) {
        const errorMsg = "El campo Código es requerido";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("sector-codigo")?.focus(), 100);
        setLoading(false);
        return;
      }

      if (!formData.nombre || !formData.nombre.trim()) {
        const errorMsg = "El campo Nombre es requerido";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("sector-nombre")?.focus(), 100);
        setLoading(false);
        return;
      }

      // Validación de ubigeo (si se proporciona, debe tener 6 dígitos)
      if (formData.ubigeo && formData.ubigeo.trim()) {
        if (!/^\d{6}$/.test(formData.ubigeo)) {
          const errorMsg = "El Ubigeo debe contener exactamente 6 dígitos";
          setValidationError(errorMsg);
          toast.error(errorMsg);
          setActiveTab("georeferenciados");
          setTimeout(() => document.getElementById("sector-ubigeo")?.focus(), 100);
          setLoading(false);
          return;
        }
      }

      // Validación de color_mapa (debe ser formato hex válido)
      if (formData.color_mapa && !/^#[0-9A-Fa-f]{6}$/.test(formData.color_mapa)) {
        const errorMsg = "El color debe tener formato hexadecimal válido (ej: #4A6126)";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setActiveTab("georeferenciados");
        setTimeout(() => document.getElementById("sector-color")?.focus(), 100);
        setLoading(false);
        return;
      }

      // Backend ahora usa "sector_code" tanto para crear como para actualizar
      const dataToSend = {
        sector_code: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion?.trim() || null,
        supervisor_id: formData.supervisor_id ? Number(formData.supervisor_id) : null,
        ubigeo: formData.ubigeo?.trim() || null,
        zona_code: formData.zona_code?.trim() || null,
        poligono_json: formData.poligono_json?.trim() || null,
        color_mapa: formData.color_mapa || "#4A6126",
      };

      if (sector) {
        await updateSector(sector.id, dataToSend);
        toast.success("Sector actualizado correctamente");
      } else {
        await createSector(dataToSend);
        toast.success("Sector creado correctamente");
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("❌ Error al guardar sector:", error);
      console.error("📦 Response data:", error.response?.data);
      console.error("📊 Response status:", error.response?.status);

      // Extraer mensaje de error del backend en diferentes formatos posibles
      const backendData = error.response?.data;
      let errorMessage = "";
      let fieldWithError = "";

      // Formato 1: { message: "texto del error" }
      if (backendData?.message) {
        errorMessage = backendData.message;
      }
      // Formato 2: { error: "texto del error" }
      else if (backendData?.error) {
        errorMessage = backendData.error;
      }
      // Formato 3: { errors: { field: "mensaje" } } o { errors: ["mensaje1", "mensaje2"] } o { errors: [{field, message}] }
      else if (backendData?.errors) {
        if (Array.isArray(backendData.errors)) {
          // Es un array de errores
          if (backendData.errors.length > 0 && typeof backendData.errors[0] === 'object' && backendData.errors[0].field) {
            // Array de objetos con estructura {field, message, ...}
            const firstError = backendData.errors[0];
            fieldWithError = firstError.field;
            errorMessage = firstError.message || "";

            // Si hay más errores, agregarlos al mensaje
            if (backendData.errors.length > 1) {
              const otherErrors = backendData.errors.slice(1).map(e => `${e.field}: ${e.message}`).join(", ");
              errorMessage = `${errorMessage}. También: ${otherErrors}`;
            }
          } else {
            // Array de strings simples
            errorMessage = backendData.errors.join(", ");
          }
        } else if (typeof backendData.errors === 'object') {
          // Es un objeto con campos específicos
          const errorFields = Object.keys(backendData.errors);
          if (errorFields.length > 0) {
            fieldWithError = errorFields[0];
            errorMessage = `Error en ${fieldWithError}: ${backendData.errors[fieldWithError]}`;
          }
        }
      }
      // Formato 4: String directo
      else if (typeof backendData === 'string') {
        errorMessage = backendData;
      }

      // Si no se encontró mensaje, usar genérico con más info
      if (!errorMessage) {
        const statusCode = error.response?.status;
        if (statusCode === 400) {
          errorMessage = "Error de validación. Por favor, revise los datos ingresados.";
        } else if (statusCode === 409) {
          errorMessage = "Conflicto: El sector ya existe o hay datos duplicados.";
        } else if (statusCode === 422) {
          errorMessage = "Datos inválidos. Verifique que todos los campos cumplan los requisitos.";
        } else if (statusCode === 500) {
          errorMessage = "Error interno del servidor. Contacte al administrador.";
        } else {
          errorMessage = `Error ${statusCode || 'desconocido'}. No se pudo procesar la solicitud.`;
        }
      }

      // Determinar qué campo tiene el error y enfocar
      let specificError = errorMessage;

      // Verificar si el error menciona campos específicos
      const lowerError = errorMessage.toLowerCase();

      if (lowerError.includes("codigo") || lowerError.includes("sector_code") || fieldWithError === "codigo" || fieldWithError === "sector_code") {
        specificError = errorMessage.includes("ya existe")
          ? "Error: El código del sector ya existe"
          : `Error en Código: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("sector-codigo")?.focus(), 100);
      }
      else if (lowerError.includes("nombre") || fieldWithError === "nombre") {
        specificError = errorMessage.includes("ya existe")
          ? "Error: El nombre del sector ya existe"
          : `Error en Nombre: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("sector-nombre")?.focus(), 100);
      }
      else if (lowerError.includes("descripcion") || fieldWithError === "descripcion") {
        specificError = `Error en Descripción: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("sector-descripcion")?.focus(), 100);
      }
      else if (lowerError.includes("ubigeo") || fieldWithError === "ubigeo") {
        specificError = `Error en Ubigeo: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("georeferenciados");
        setTimeout(() => document.getElementById("sector-ubigeo")?.focus(), 100);
      }
      else if (lowerError.includes("zona") || fieldWithError === "zona_code") {
        specificError = `Error en Zona: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("georeferenciados");
        setTimeout(() => document.getElementById("sector-zona")?.focus(), 100);
      }
      else if (lowerError.includes("color") || fieldWithError === "color_mapa") {
        specificError = `Error en Color: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("georeferenciados");
        setTimeout(() => document.getElementById("sector-color")?.focus(), 100);
      }
      else if (lowerError.includes("poligono") || fieldWithError === "poligono_json") {
        specificError = `Error en Polígono: ${errorMessage}`;
        setValidationError(specificError);
        setActiveTab("georeferenciados");
        setTimeout(() => document.getElementById("sector-poligono")?.focus(), 100);
      }
      else {
        // Error genérico pero con el mensaje real del backend
        setValidationError(errorMessage);
      }

      toast.error(specificError);
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
            {sector ? "Editar Sector" : "Nuevo Sector"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Cerrar (ESC)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mensaje de error de validación */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {validationError}
              </p>
            </div>
          </div>
        )}

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
              <span>Datos Georeferenciados</span>
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
                  htmlFor="sector-codigo"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sector-codigo"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: S01"
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="sector-nombre"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sector-nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Sector Centro"
                />
              </div>

              {/* Descripción */}
              <div>
                <label
                  htmlFor="sector-descripcion"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Descripción
                </label>
                <textarea
                  id="sector-descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Descripción del sector..."
                />
              </div>

              {/* Supervisor */}
              <div>
                <label
                  htmlFor="sector-supervisor"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Supervisor
                </label>
                <select
                  id="sector-supervisor"
                  name="supervisor_id"
                  value={formData.supervisor_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">— Sin supervisor asignado —</option>
                  {personalList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apellido_paterno} {p.apellido_materno}, {p.nombres} - {p.doc_tipo} {p.doc_numero}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Persona responsable del sector
                </p>
              </div>
            </div>
          )}

          {/* Tab: Datos Georeferenciados */}
          {activeTab === "georeferenciados" && (
            <div className="space-y-4">
              {/* Ubigeo - Autocomplete */}
              <div className="relative">
                <label
                  htmlFor="sector-ubigeo"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Ubigeo
                </label>
                <input
                  type="text"
                  id="sector-ubigeo"
                  value={ubigeoSearch}
                  onChange={handleUbigeoSearch}
                  onFocus={() => {
                    if (ubigeoSearch.length >= 1) {
                      setShowUbigeoDropdown(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowUbigeoDropdown(false), 200);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Buscar distrito..."
                  autoComplete="off"
                />

                {/* Mostrar código UBIGEO seleccionado */}
                {formData.ubigeo && (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Código:
                    </span>
                    <span className="text-xs font-mono font-semibold text-primary-700 dark:text-primary-400">
                      {formData.ubigeo}
                    </span>
                  </div>
                )}

                {/* Dropdown de UBIGEO */}
                {showUbigeoDropdown && ubigeos.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {ubigeos.slice(0, 50).map((ubigeo) => (
                      <button
                        type="button"
                        key={ubigeo.ubigeo_code}
                        onClick={() => handleUbigeoSelect(ubigeo)}
                        className="w-full px-4 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-600 border-b border-slate-200 dark:border-slate-600 last:border-0"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{ubigeo.distrito}</div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {ubigeo.ubigeo_code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {ubigeo.provincia} - {ubigeo.departamento}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Busque y seleccione el distrito (departamento/provincia/distrito)
                </p>
              </div>

              {/* Zona Code */}
              <div>
                <label
                  htmlFor="sector-zona"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código de Zona
                </label>
                <input
                  type="text"
                  id="sector-zona"
                  name="zona_code"
                  value={formData.zona_code}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Z01"
                />
              </div>

              {/* Color de Mapa */}
              <div>
                <label
                  htmlFor="sector-color"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Color en Mapa
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    id="sector-color"
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
                    placeholder="#4A6126"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: formData.color_mapa }}
                    title="Vista previa del color"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Color que se mostrará en el mapa para este sector
                </p>
              </div>

              {/* Polígono JSON */}
              <div>
                <label
                  htmlFor="sector-poligono"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Polígono (JSON)
                </label>
                <textarea
                  id="sector-poligono"
                  name="poligono_json"
                  value={formData.poligono_json}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder='{"type":"Polygon","coordinates":[...]}'
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Formato GeoJSON del polígono que delimita el sector
                </p>
              </div>
            </div>
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
              id="submit-sector-btn"
              className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              title="Guardar (ALT+G)"
            >
              {loading ? "Guardando..." : sector ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
