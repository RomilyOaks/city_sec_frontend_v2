import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  createUnidadOficina,
  updateUnidadOficina,
  getUnidadOficinaById,
} from "../../services/unidadesOficinaService";
import { listUbigeos, getUbigeoByCode } from "../../services/novedadesService";
import { toast } from "react-hot-toast";
import { getDefaultUbigeo } from "../../config/defaults";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

/**
 * File: src/components/catalogos/UnidadOficinaFormModal.jsx
 * @version 1.0.2
 * @description Modal para crear/editar Unidades y Oficinas
 *
 * FEATURES:
 * - 7 tipos de unidades (SERENAZGO, PNP, BOMBEROS, AMBULANCIA, DEFENSA_CIVIL, TRANSITO, OTROS)
 * - Ubicación GPS con radio de cobertura
 * - Horarios de operación (24h o limitado) - Formato HH:MM:SS para backend
 * - Validación en tiempo real
 * - UBIGEO autocomplete
 * - Shortcuts: ESC para cerrar, ALT+G para guardar
 *
 * @module src/components/catalogos/UnidadOficinaFormModal
 */

export default function UnidadOficinaFormModal({
  isOpen,
  onClose,
  unidadOficina: unidadOficinaInicial = null,
}) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  const TIPOS_UNIDAD = [
    { value: "SERENAZGO", label: "Serenazgo" },
    { value: "PNP", label: "PNP (Policía Nacional)" },
    { value: "BOMBEROS", label: "Bomberos" },
    { value: "AMBULANCIA", label: "Ambulancia" },
    { value: "DEFENSA_CIVIL", label: "Defensa Civil" },
    { value: "TRANSITO", label: "Tránsito" },
    { value: "OTROS", label: "Otros" },
  ];

  const [loading, setLoading] = useState(false);
  const [loadingUnidad, setLoadingUnidad] = useState(true);
  const [unidadOficina, setUnidadOficina] = useState(null);
  const [ubigeoSearch, setUbigeoSearch] = useState("");
  const [ubigeoOptions, setUbigeoOptions] = useState([]);
  const [showUbigeoDropdown, setShowUbigeoDropdown] = useState(false);
  const [defaultUbigeo, setDefaultUbigeo] = useState(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo_unidad: "",
    codigo: "",
    telefono: "",
    email: "",
    direccion: "",
    ubigeo_code: "",
    latitud: "",
    longitud: "",
    radio_cobertura_km: "",
    activo_24h: true,
    horario_inicio: "",
    horario_fin: "",
    estado: true,
  });

  // Funciones para convertir formato de tiempo
  const parseTimeFromBackend = (timeString) => {
    if (!timeString) return "";
    // Convierte HH:MM:SS a HH:MM para el input type="time"
    const parts = timeString.split(":");
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  };

  const formatTimeForBackend = (timeString) => {
    if (!timeString) return null;
    // Asegura formato HH:MM:SS para el backend
    const parts = timeString.split(":");
    if (parts.length === 2) {
      return `${timeString}:00`;
    }
    return timeString;
  };

  // Cargar ubigeo por defecto al montar
  useEffect(() => {
    getDefaultUbigeo()
      .then((ubigeo) => {
        setDefaultUbigeo(ubigeo);
      })
      .catch((err) => {
        console.error("Error cargando ubigeo default:", err);
      });
  }, []);

  // Cargar unidad completa cuando se abre en modo edit
  useEffect(() => {
    const loadUnidadCompleta = async () => {
      if (!unidadOficinaInicial?.id) {
        setLoadingUnidad(false);
        return;
      }

      try {
        setLoadingUnidad(true);
        const unidadCompleta = await getUnidadOficinaById(
          unidadOficinaInicial.id
        );
        setUnidadOficina(unidadCompleta);
      } catch (error) {
        console.error(
          "❌ [UnidadOficinaFormModal] Error al cargar unidad completa:",
          error
        );
        setUnidadOficina(unidadOficinaInicial);
      } finally {
        setLoadingUnidad(false);
      }
    };

    if (isOpen && unidadOficinaInicial) {
      loadUnidadCompleta();
    } else if (isOpen && !unidadOficinaInicial) {
      setUnidadOficina(null);
      setLoadingUnidad(false);
    }
  }, [isOpen, unidadOficinaInicial]);

  // Inicializar formData al editar O crear
  useEffect(() => {
    if (isOpen && unidadOficina) {
      // MODO EDIT
      // Si está activo 24h y no tiene horarios, establecer valores por defecto
      let horario_inicio = parseTimeFromBackend(unidadOficina.horario_inicio);
      let horario_fin = parseTimeFromBackend(unidadOficina.horario_fin);

      if (unidadOficina.activo_24h && (!horario_inicio || !horario_fin)) {
        horario_inicio = "00:00";
        horario_fin = "23:59";
      }

      setFormData({
        nombre: unidadOficina.nombre || "",
        tipo_unidad: unidadOficina.tipo_unidad || "",
        codigo: unidadOficina.codigo || "",
        telefono: unidadOficina.telefono || "",
        email: unidadOficina.email || "",
        direccion: unidadOficina.direccion || "",
        ubigeo_code: unidadOficina.ubigeo || "",
        latitud: unidadOficina.latitud || "",
        longitud: unidadOficina.longitud || "",
        radio_cobertura_km: unidadOficina.radio_cobertura_km || "",
        activo_24h:
          unidadOficina.activo_24h !== undefined
            ? unidadOficina.activo_24h
            : true,
        horario_inicio: horario_inicio,
        horario_fin: horario_fin,
        estado:
          unidadOficina.estado !== undefined ? unidadOficina.estado : true,
      });

      // Mostrar ubigeo si existe
      if (unidadOficina.ubigeo || unidadOficina.unidadOficinaUbigeo) {
        const code = unidadOficina.ubigeo;
        if (unidadOficina.unidadOficinaUbigeo) {
          const u = unidadOficina.unidadOficinaUbigeo;
          setUbigeoSearch(`${u.distrito} - ${u.provincia}, ${u.departamento}`);
        } else if (code) {
          loadUbigeoByCode(code);
        }
      }
    } else if (isOpen && !unidadOficina && defaultUbigeo) {
      // MODO CREATE: Inicializar con valores por defecto
      // Al crear, si activo_24h es true, llenar automáticamente los horarios
      const horario_inicio = "00:00";
      const horario_fin = "23:59";

      setFormData({
        nombre: "",
        tipo_unidad: "",
        codigo: "",
        telefono: "",
        email: "",
        direccion: "",
        ubigeo_code: defaultUbigeo.code,
        latitud: "",
        longitud: "",
        radio_cobertura_km: "",
        activo_24h: true,
        horario_inicio: horario_inicio,
        horario_fin: horario_fin,
        estado: true,
      });
      setUbigeoSearch(
        `${defaultUbigeo.distrito} - ${defaultUbigeo.provincia}, ${defaultUbigeo.departamento}`
      );
    }
  }, [isOpen, unidadOficina, defaultUbigeo]);

  const loadUbigeoByCode = async (code) => {
    try {
      const ubigeo = await getUbigeoByCode(code);
      if (ubigeo) {
        setUbigeoSearch(
          `${ubigeo.distrito} - ${ubigeo.provincia}, ${ubigeo.departamento}`
        );
      } else {
        setUbigeoSearch("");
      }
    } catch (err) {
      console.error("Error al buscar ubigeo:", err);
      setUbigeoSearch("");
    }
  };

  const handleClose = () => {
    setFormData({
      nombre: "",
      tipo_unidad: "",
      codigo: "",
      telefono: "",
      email: "",
      direccion: "",
      ubigeo_code: defaultUbigeo?.code || "",
      latitud: "",
      longitud: "",
      radio_cobertura_km: "",
      activo_24h: true,
      horario_inicio: "",
      horario_fin: "",
      estado: true,
    });
    setUbigeoSearch("");
    setUbigeoOptions([]);
    setShowUbigeoDropdown(false);
    if (onClose) onClose();
  };

  // Keyboard shortcuts: ESC y ALT+G
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        e.preventDefault();
        handleClose();
      }
      if (e.altKey && e.key === "g" && isOpen && !loading) {
        e.preventDefault();
        document.getElementById("unidad-oficina-form")?.requestSubmit();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, loading]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Si es el checkbox de 24h, manejar lógica especial
    if (name === "activo_24h") {
      const newActivo24h = checked;

      // Si se marca 24h, llenar automáticamente los horarios
      if (newActivo24h) {
        setFormData((prev) => ({
          ...prev,
          activo_24h: newActivo24h,
          horario_inicio: "00:00",
          horario_fin: "23:59",
        }));
      } else {
        // Si se desmarca 24h, limpiar los horarios
        setFormData((prev) => ({
          ...prev,
          activo_24h: newActivo24h,
          horario_inicio: "",
          horario_fin: "",
        }));
      }
    } else {
      // Para otros campos, comportamiento normal
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones frontend
    if (!formData.nombre || formData.nombre.trim().length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }

    if (!formData.tipo_unidad) {
      toast.error("Debe seleccionar un tipo de unidad");
      return;
    }

    if (!formData.ubigeo_code) {
      toast.error("Debe seleccionar un UBIGEO");
      return;
    }

    // Si no es activo_24h, validar que los horarios estén completos
    if (!formData.activo_24h) {
      if (!formData.horario_inicio || !formData.horario_fin) {
        toast.error(
          "Debe especificar horario de inicio y fin cuando no opera 24h"
        );
        return;
      }

      // Validar que la hora de fin sea mayor a la hora de inicio
      if (formData.horario_inicio >= formData.horario_fin) {
        toast.error("La hora de fin debe ser mayor a la hora de inicio");
        return;
      }
    }

    try {
      setLoading(true);

      // Preparar payload con formato correcto para backend
      const payload = {
        nombre: formData.nombre.trim(),
        tipo_unidad: formData.tipo_unidad,
        codigo: formData.codigo?.trim() || null,
        telefono: formData.telefono?.trim() || null,
        email: formData.email?.trim() || null,
        direccion: formData.direccion?.trim() || null,
        ubigeo: formData.ubigeo_code || null,
        latitud: formData.latitud || null,
        longitud: formData.longitud || null,
        radio_cobertura_km: formData.radio_cobertura_km || null,
        activo_24h: formData.activo_24h,
        // Siempre enviar en formato HH:MM:SS, incluso para 24h
        horario_inicio: formData.activo_24h
          ? "00:00:00"
          : formatTimeForBackend(formData.horario_inicio) || null,
        horario_fin: formData.activo_24h
          ? "23:59:59"
          : formatTimeForBackend(formData.horario_fin) || null,
        estado: formData.estado,
      };

      if (unidadOficina) {
        // Actualizar unidad existente
        await updateUnidadOficina(unidadOficina.id, payload);
        toast.success("Unidad/Oficina actualizada correctamente");
      } else {
        // Crear nueva unidad
        await createUnidadOficina(payload);
        toast.success("Unidad/Oficina creada correctamente");
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar unidad/oficina:", error);

      // Mostrar errores detallados del backend
      const errorData = error.response?.data;
      let errorMessage = "Error al guardar la unidad/oficina";

      if (errorData?.errors && Array.isArray(errorData.errors)) {
        // Errores de validación
        errorMessage = errorData.errors
          .map((err) => {
            const field = err.field || err.path || "Campo";
            const msg = err.message || "Error desconocido";
            return `${field}: ${msg}`;
          })
          .join("\n");
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {unidadOficina ? "Editar Unidad/Oficina" : "Nueva Unidad/Oficina"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              ESC para cerrar • ALT+G para guardar
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form
          id="unidad-oficina-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Loading Spinner */}
          {loadingUnidad && unidadOficinaInicial && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cargando datos de la unidad...
                </p>
              </div>
            </div>
          )}

          {!loadingUnidad && (
            <>
              {/* Datos Básicos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Datos Básicos
                </h3>

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Comisaría PNP Surco"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                    required
                    minLength={3}
                    maxLength={100}
                  />
                </div>

                {/* Tipo de Unidad y Código */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tipo de Unidad <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipo_unidad"
                      value={formData.tipo_unidad}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      required
                    >
                      <option value="">Seleccione tipo</option>
                      {TIPOS_UNIDAD.map((tipo) => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Código (opcional)
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleChange}
                      placeholder="Ej: PNP-SURCO"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Teléfono y Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 01-4115858"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      maxLength={20}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contacto@unidad.gob.pe"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      maxLength={100}
                    />
                  </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <input
                    type="checkbox"
                    id="estado"
                    name="estado"
                    checked={formData.estado}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label
                    htmlFor="estado"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Unidad activa
                  </label>
                </div>
              </div>

              {/* Ubicación */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Ubicación
                </h3>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Dirección
                  </label>
                  <textarea
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Ej: Av. Benavides 495, Santiago de Surco"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                    maxLength={255}
                  />
                </div>

                {/* UBIGEO */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    UBIGEO <span className="text-red-500">*</span>
                  </label>
                  {formData.ubigeo_code && unidadOficina ? (
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-primary-700 dark:text-primary-400">
                          {formData.ubigeo_code}
                        </span>
                        {ubigeoSearch && (
                          <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            {ubigeoSearch}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={ubigeoSearch}
                        onChange={async (e) => {
                          const value = e.target.value;
                          setUbigeoSearch(value);
                          if (value.length >= 3) {
                            try {
                              const results = await listUbigeos(value);
                              setUbigeoOptions(results || []);
                              setShowUbigeoDropdown(true);
                            } catch {
                              setUbigeoOptions([]);
                            }
                          } else {
                            setUbigeoOptions([]);
                            setShowUbigeoDropdown(false);
                          }
                        }}
                        onFocus={() =>
                          ubigeoOptions.length > 0 &&
                          setShowUbigeoDropdown(true)
                        }
                        placeholder="Buscar distrito..."
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                        required
                      />
                      {showUbigeoDropdown && ubigeoOptions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {ubigeoOptions.map((u) => (
                            <button
                              key={u.ubigeo_code}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  ubigeo_code: u.ubigeo_code,
                                }));
                                setUbigeoSearch(
                                  `${u.distrito} - ${u.provincia}, ${u.departamento}`
                                );
                                setShowUbigeoDropdown(false);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between"
                            >
                              <span>
                                {u.distrito}
                                <span className="text-slate-500 ml-2">
                                  {u.provincia} - {u.departamento}
                                </span>
                              </span>
                              <span className="text-xs font-mono text-primary-600">
                                {u.ubigeo_code}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Coordenadas GPS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Latitud
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      name="latitud"
                      value={formData.latitud}
                      onChange={handleChange}
                      placeholder="Ej: -12.123456"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      min="-90"
                      max="90"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Longitud
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      name="longitud"
                      value={formData.longitud}
                      onChange={handleChange}
                      placeholder="Ej: -77.012345"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      min="-180"
                      max="180"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Radio Cobertura (km)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="radio_cobertura_km"
                      value={formData.radio_cobertura_km}
                      onChange={handleChange}
                      placeholder="Ej: 5.5"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                      min="0"
                      max="999.99"
                    />
                  </div>
                </div>
              </div>

              {/* Horario de Operación */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                  Horario de Operación
                </h3>

                {/* Activo 24h */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <input
                    type="checkbox"
                    id="activo_24h"
                    name="activo_24h"
                    checked={formData.activo_24h}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label
                    htmlFor="activo_24h"
                    className="text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Opera 24 horas
                  </label>
                  {formData.activo_24h && (
                    <span className="text-xs text-green-600 dark:text-green-400 italic">
                      (Se enviará como 00:00:00 - 23:59:59 al backend)
                    </span>
                  )}
                </div>

                {/* Horarios */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hora Inicio{" "}
                      {!formData.activo_24h && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="time"
                      step="1"
                      name="horario_inicio"
                      value={formData.horario_inicio}
                      onChange={handleChange}
                      className={`w-full rounded-lg border px-3 py-2 ${
                        formData.activo_24h
                          ? "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 cursor-not-allowed"
                          : "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-50"
                      }`}
                      required={!formData.activo_24h}
                      disabled={formData.activo_24h}
                      title={
                        formData.activo_24h
                          ? "Horario automático para 24 horas"
                          : ""
                      }
                    />
                    {formData.activo_24h && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Se enviará como 00:00:00 al backend
                      </p>
                    )}
                    {!formData.activo_24h && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Formato: HH:MM (se convertirá a HH:MM:SS)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hora Fin{" "}
                      {!formData.activo_24h && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="time"
                      step="1"
                      name="horario_fin"
                      value={formData.horario_fin}
                      onChange={handleChange}
                      className={`w-full rounded-lg border px-3 py-2 ${
                        formData.activo_24h
                          ? "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 cursor-not-allowed"
                          : "border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-50"
                      }`}
                      required={!formData.activo_24h}
                      disabled={formData.activo_24h}
                      title={
                        formData.activo_24h
                          ? "Horario automático para 24 horas"
                          : ""
                      }
                    />
                    {formData.activo_24h && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Se enviará como 23:59:59 al backend
                      </p>
                    )}
                    {!formData.activo_24h && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Formato: HH:MM (se convertirá a HH:MM:SS)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="unidad-oficina-form"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Guardando..."
              : unidadOficina
              ? "Actualizar"
              : "Crear Unidad/Oficina"}
          </button>
        </div>
      </div>
    </div>
  );
}
