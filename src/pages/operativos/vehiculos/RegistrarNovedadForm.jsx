/**
 * File: src/pages/operativos/vehiculos/RegistrarNovedadForm.jsx
 * @version 1.0.0
 * @description Formulario para registrar y editar novedades de cuadrantes operativos
 * @module src/pages/operativos/vehiculos/RegistrarNovedadForm.jsx
 */

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Save,
  X,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import operativosNovedadesService from "../../../services/operativosNovedadesService.js";

/**
 * Formatea fecha/hora para input datetime-local
 */
const formatDateTimeForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convierte datetime-local a UTC para backend
 */
const toUTCDateTime = (localDateTime) => {
  if (!localDateTime) return null;
  const date = new Date(localDateTime);
  return date.toISOString();
};

/**
 * Opciones para selects
 */
const PRIORIDADES = [
  { value: "BAJA", label: "Baja", color: "text-green-600" },
  { value: "MEDIA", label: "Media", color: "text-yellow-600" },
  { value: "ALTA", label: "Alta", color: "text-orange-600" },
  { value: "URGENTE", label: "Urgente", color: "text-red-600" },
];

const RESULTADOS = [
  { value: "PENDIENTE", label: "Pendiente", color: "text-yellow-600" },
  { value: "RESUELTO", label: "Resuelto", color: "text-green-600" },
  { value: "ESCALADO", label: "Escalado", color: "text-red-600" },
  { value: "CANCELADO", label: "Cancelado", color: "text-gray-600" },
];

/**
 * RegistrarNovedadForm - Formulario para crear/editar novedades
 * @component
 */
export default function RegistrarNovedadForm({ 
  turnoId, 
  vehiculoId, 
  cuadranteId, 
  novedad = null, 
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [novedadesDisponibles, setNovedadesDisponibles] = useState([]);
  const [loadingNovedades, setLoadingNovedades] = useState(true);
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [errors, setErrors] = useState({});

  // Form data
  const [formData, setFormData] = useState({
    novedad_id: "",
    reportado: formatDateTimeForInput(new Date()),
    atendido: "",
    estado: "1", // Activo por defecto
    prioridad: "MEDIA",
    observaciones: "",
    acciones_tomadas: "",
    resultado: "PENDIENTE",
  });

  // Cargar novedades disponibles del cuadrante (filtrando las ya asignadas)
  const fetchNovedadesDisponibles = useCallback(async () => {
    try {
      setLoadingNovedades(true);
      
      // Cargar en paralelo: novedades disponibles y novedades ya asignadas al cuadrante
      const [disponiblesResponse, asignadasResponse] = await Promise.all([
        operativosNovedadesService.getNovedadesDisponibles(turnoId, vehiculoId, cuadranteId),
        operativosNovedadesService.getNovedadesByCuadrante(turnoId, vehiculoId, cuadranteId)
      ]);
      
      // Procesar novedades disponibles
      let novedadesData = [];
      if (disponiblesResponse.data) {
        novedadesData = disponiblesResponse.data;
      } else if (disponiblesResponse) {
        novedadesData = disponiblesResponse;
      }
      
      // Procesar novedades ya asignadas al cuadrante
      let asignadasData = [];
      if (asignadasResponse.data) {
        asignadasData = asignadasResponse.data;
      } else if (asignadasResponse) {
        asignadasData = asignadasResponse;
      }
      
      // Obtener IDs de novedades ya asignadas
      const idsAsignados = new Set(asignadasData.map(n => n.novedad_id || n.novedad?.id));

      // Filtrar novedades disponibles que NO estén ya asignadas
      const novedadesFiltradas = novedadesData.filter(n => !idsAsignados.has(n.id));
      
      setNovedadesDisponibles(novedadesFiltradas);
    } catch (err) {
      console.error("Error cargando novedades disponibles:", err);
      toast.error("Error al cargar novedades disponibles");
      // Datos de demo
      const demoData = [
        {
          id: 40,
          novedad_code: "000029",
          descripcion: "Alarma activada en domicilio",
          prioridad_actual: "ALTA",
          localizacion: "Ca. San Martín N° 852",
          novedadTipoNovedad: {
            tipo_novedad: "EMERGENCIA",
            subtipo_novedad: "ALARMA_RESIDENCIAL"
          }
        },
        {
          id: 41,
          novedad_code: "000030",
          descripcion: "Vehículo sospechoso estacionado",
          prioridad_actual: "MEDIA",
          localizacion: "Av. Principal con Jr. Los Pinos",
          novedadTipoNovedad: {
            tipo_novedad: "SEGURIDAD",
            subtipo_novedad: "VIGILANCIA"
          }
        }
      ];
      setNovedadesDisponibles(demoData);
    } finally {
      setLoadingNovedades(false);
    }
  }, [turnoId, vehiculoId, cuadranteId]);

  // Cargar datos si es edición
  useEffect(() => {
    if (novedad) {
      setFormData({
        novedad_id: novedad.novedad_id?.toString() || "",
        reportado: formatDateTimeForInput(novedad.reportado),
        atendido: formatDateTimeForInput(novedad.atendido),
        estado: novedad.estado?.toString() || "1",
        prioridad: novedad.prioridad || "MEDIA",
        observaciones: novedad.observaciones || "",
        acciones_tomadas: novedad.acciones_tomadas || "",
        resultado: novedad.resultado || "PENDIENTE",
      });
    }
  }, [novedad]);

  // Cargar novedades disponibles al montar
  useEffect(() => {
    fetchNovedadesDisponibles();
  }, [fetchNovedadesDisponibles]);

  // Hotkey ALT+G para guardar y ESC para cerrar
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ALT+G para guardar
      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (!loading) {
          // Simular submit del formulario
          const form = document.getElementById('novedad-cuadrante-form');
          if (form) {
            form.requestSubmit();
          }
        }
      }
      // ESC para cerrar
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.novedad_id) {
      newErrors.novedad_id = "Seleccione un tipo de novedad";
    }

    if (!formData.reportado) {
      newErrors.reportado = "La fecha y hora de reporte es requerida";
    }

    if (!formData.prioridad) {
      newErrors.prioridad = "Seleccione una prioridad";
    }

    if (!formData.observaciones?.trim()) {
      newErrors.observaciones = "Las observaciones son requeridas";
    } else if (formData.observaciones.length > 1000) {
      newErrors.observaciones = "Máximo 1000 caracteres";
    }

    if (formData.acciones_tomadas && formData.acciones_tomadas.length > 2000) {
      newErrors.acciones_tomadas = "Máximo 2000 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si es selección de novedad, actualizar la novedad seleccionada
    if (name === 'novedad_id') {
      const selected = novedadesDisponibles.find(n => n.id.toString() === value);
      setSelectedNovedad(selected);
      
      // Auto-llenar prioridad si la novedad tiene una
      if (selected?.prioridad_actual) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          prioridad: selected.prioridad_actual
        }));
      }
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Guardar novedad
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrija los errores del formulario");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        novedad_id: parseInt(formData.novedad_id),
        reportado: toUTCDateTime(formData.reportado),
        estado: parseInt(formData.estado),
        prioridad: formData.prioridad,
        observaciones: formData.observaciones.trim(),
        resultado: formData.resultado,
      };

      // 🔥 Solo agregar campos opcionales si tienen valor
      if (formData.atendido) {
        payload.atendido = toUTCDateTime(formData.atendido);
      }
      if (formData.acciones_tomadas?.trim()) {
        payload.acciones_tomadas = formData.acciones_tomadas.trim();
      }

      let response;
      if (novedad) {
        // Editar novedad existente
        response = await operativosNovedadesService.updateNovedad(
          turnoId,
          vehiculoId,
          cuadranteId,
          novedad.id,
          payload
        );
        toast.success("Novedad actualizada exitosamente");
      } else {
        // Crear nueva novedad
        response = await operativosNovedadesService.createNovedad(
          turnoId,
          vehiculoId,
          cuadranteId,
          payload
        );
        toast.success("Novedad registrada exitosamente");
      }

      onSuccess && onSuccess(response.data?.data || response.data);
      onClose && onClose();
    } catch (err) {
      console.error("Error guardando novedad:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error al guardar novedad";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FileText size={20} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {novedad ? "Editar Novedad" : "Registrar Nueva Novedad"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Cuadrante ID: {cuadranteId} | Vehículo ID: {vehiculoId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar (ESC)"
          >
            <X size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Form */}
        <form id="novedad-cuadrante-form" onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Novedad */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Novedad <span className="text-red-500">*</span>
              </label>
              {loadingNovedades ? (
                <div className="flex items-center gap-2 p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">Cargando novedades...</span>
                </div>
              ) : (
                <select
                  name="novedad_id"
                  value={formData.novedad_id}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.novedad_id ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <option value="">Seleccione una novedad</option>
                  {novedadesDisponibles.map(novedad => (
                    <option key={novedad.id} value={novedad.id}>
                      {novedad.novedad_code} - {novedad.descripcion}
                    </option>
                  ))}
                </select>
              )}
              {errors.novedad_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.novedad_id}</p>
              )}
              
              {/* Mostrar información de la novedad seleccionada */}
              {selectedNovedad && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Código:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-50">{selectedNovedad.novedad_code}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Tipo:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-50">
                        {selectedNovedad.novedadTipoNovedad?.nombre || selectedNovedad.tipo_novedad?.nombre || 'No especificado'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Subtipo:</span>
                      <span className="ml-2 text-slate-900 dark:text-slate-50">
                        {selectedNovedad.novedadSubtipoNovedad?.nombre || selectedNovedad.subtipo_novedad?.nombre || 'No especificado'}
                      </span>
                    </div>
                    {selectedNovedad.localizacion && (
                      <div className="md:col-span-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Ubicación:</span>
                        <span className="ml-2 text-slate-900 dark:text-slate-50">{selectedNovedad.localizacion}</span>
                      </div>
                    )}
                    {selectedNovedad.prioridad_actual && (
                      <div className="md:col-span-3">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Prioridad Actual:</span>
                        <span className={`ml-2 font-medium ${
                          selectedNovedad.prioridad_actual === 'URGENTE' ? 'text-red-600' :
                          selectedNovedad.prioridad_actual === 'ALTA' ? 'text-orange-600' :
                          selectedNovedad.prioridad_actual === 'MEDIA' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {selectedNovedad.prioridad_actual}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Fecha y Hora Reportado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Clock size={14} className="inline mr-1" />
                Fecha y Hora Reportado <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="reportado"
                value={formData.reportado}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.reportado ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              {errors.reportado && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.reportado}</p>
              )}
            </div>

            {/* Fecha y Hora Atendido */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <CheckCircle size={14} className="inline mr-1" />
                Fecha y Hora Atendido
              </label>
              <input
                type="datetime-local"
                name="atendido"
                value={formData.atendido}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Opcional: Dejar en blanco si no ha sido atendido
              </p>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <AlertTriangle size={14} className="inline mr-1" />
                Prioridad <span className="text-red-500">*</span>
              </label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.prioridad ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                }`}
              >
                {PRIORIDADES.map(prioridad => (
                  <option key={prioridad.value} value={prioridad.value}>
                    {prioridad.label}
                  </option>
                ))}
              </select>
              {errors.prioridad && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.prioridad}</p>
              )}
            </div>

            {/* Estado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Estado
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="0">Inactivo</option>
                <option value="1">Activo</option>
                <option value="2">Atendido</option>
              </select>
            </div>

            {/* Resultado */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Resultado
              </label>
              <select
                name="resultado"
                value={formData.resultado}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {RESULTADOS.map(resultado => (
                  <option key={resultado.value} value={resultado.value}>
                    {resultado.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Observaciones */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Observaciones <span className="text-red-500">*</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  ({formData.observaciones.length}/1000 caracteres)
                </span>
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows={4}
                maxLength={1000}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                  errors.observaciones ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                }`}
                placeholder="Describa detalladamente la novedad reportada..."
              />
              {errors.observaciones && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.observaciones}</p>
              )}
            </div>

            {/* Acciones Tomadas */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Acciones Tomadas
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                  ({formData.acciones_tomadas.length}/2000 caracteres)
                </span>
              </label>
              <textarea
                name="acciones_tomadas"
                value={formData.acciones_tomadas}
                onChange={handleInputChange}
                rows={3}
                maxLength={2000}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                  errors.acciones_tomadas ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                }`}
                placeholder="Describa las acciones realizadas para atender la novedad..."
              />
              {errors.acciones_tomadas && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.acciones_tomadas}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Guardar (ALT+G)"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  {novedad ? "Actualizar" : "Guardar"} <span className="text-xs opacity-75">(ALT+G)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
