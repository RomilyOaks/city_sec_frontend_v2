/**
 * File: src/pages/operativos/vehiculos/EditarCuadranteForm.jsx
 * @version 1.0.0
 * @description Formulario para editar cuadrantes asignados a vehículos operativos
 * @module src/pages/operativos/vehiculos/EditarCuadranteForm.jsx
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  MapPin,
  Clock,
  Save,
  X,
  AlertTriangle,
} from "lucide-react";

import api from "../../../services/api.js";

/**
 * Formatea fecha/hora a formato para input datetime-local (zona horaria local)
 */
const formatDateTimeForInput = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  // Usar zona horaria local en lugar de UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convierte hora local a formato UTC para enviar al backend
 */
const toUTCDateTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString(); // Convierte a UTC
};

/**
 * EditarCuadranteForm - Formulario para editar cuadrantes asignados
 * @component
 */
export default function EditarCuadranteForm({ 
  cuadrante,
  turnoId, 
  vehiculoId,
  onSuccess, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    hora_salida: "",
    observaciones: "",
    incidentes_reportados: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Inicializar formulario con datos del cuadrante
  useEffect(() => {
    if (cuadrante) {
      setFormData({
        hora_salida: formatDateTimeForInput(cuadrante.hora_salida),
        observaciones: cuadrante.observaciones || "",
        incidentes_reportados: cuadrante.incidentes_reportados || "",
      });
    }
  }, [cuadrante]);

  // Manejar tecla ESC para cancelar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onCancel]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Si hay hora_salida, debe ser posterior a hora_ingreso del cuadrante original
    if (formData.hora_salida && cuadrante?.hora_ingreso) {
      const ingreso = new Date(cuadrante.hora_ingreso);
      const salida = new Date(formData.hora_salida);
      if (salida <= ingreso) {
        newErrors.hora_salida = "La hora de salida debe ser posterior a la hora de ingreso";
      }
    }

    // Validar longitud de observaciones (max 500)
    if (formData.observaciones && formData.observaciones.length > 500) {
      newErrors.observaciones = "Las observaciones no pueden exceder 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor corrija los errores del formulario");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        hora_salida: toUTCDateTime(formData.hora_salida),
        observaciones: formData.observaciones && formData.observaciones.trim() !== "" ? formData.observaciones : null,
        incidentes_reportados: formData.incidentes_reportados && formData.incidentes_reportados.trim() !== "" ? formData.incidentes_reportados : null,
      };
      
      await api.put(`/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes/${cuadrante.id}`, payload);
      
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error actualizando cuadrante:", err);
      
      // Manejar errores de validación del backend
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const backendErrors = {};
        err.response.data.errors.forEach(error => {
          backendErrors[error.field] = error.message;
        });
        setErrors(backendErrors);
        toast.error(err.response.data.message || "Error de validación");
      } else {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error al actualizar cuadrante";
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener datos del cuadrante para mostrar
  const cuadranteInfo = cuadrante?.datosCuadrante || cuadrante?.cuadrante || {};

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <MapPin size={24} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Editar Cuadrante Asignado
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {cuadranteInfo.cuadrante_code || cuadranteInfo.codigo} - {cuadranteInfo.nombre}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Cancelar (ESC)"
        >
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información del cuadrante (solo lectura) */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Información del Cuadrante
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">Código</label>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {cuadranteInfo.cuadrante_code || cuadranteInfo.codigo || "-"}
              </p>
            </div>
            <div>
              <label className="text-xs text-slate-500 dark:text-slate-400">Nombre</label>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                {cuadranteInfo.nombre || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Clock size={14} className="inline mr-1" />
              Hora de Ingreso
            </label>
            <p className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
              {cuadrante?.hora_ingreso ? new Date(cuadrante.hora_ingreso).toLocaleString("es-PE") : "-"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              <Clock size={14} className="inline mr-1" />
              Hora de Salida
            </label>
            <input
              type="datetime-local"
              name="hora_salida"
              value={formData.hora_salida}
              onChange={handleChange}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.hora_salida 
                  ? "border-red-500 dark:border-red-500" 
                  : "border-slate-300 dark:border-slate-700"
              } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
            />
            {errors.hora_salida && (
              <p className="mt-1 text-xs text-red-500">{errors.hora_salida}</p>
            )}
          </div>
        </div>

        {/* Incidentes Reportados */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            <AlertTriangle size={14} className="inline mr-1" />
            Incidentes Reportados
          </label>
          <textarea
            name="incidentes_reportados"
            value={formData.incidentes_reportados}
            onChange={handleChange}
            rows={2}
            placeholder="Describa los incidentes reportados durante el patrullaje..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Observaciones */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Observaciones
            <span className="text-xs text-slate-400 ml-2">
              ({formData.observaciones.length}/500)
            </span>
          </label>
          <textarea
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            rows={3}
            maxLength={500}
            placeholder="Observaciones adicionales..."
            className={`w-full px-3 py-2 rounded-lg border ${
              errors.observaciones 
                ? "border-red-500 dark:border-red-500" 
                : "border-slate-300 dark:border-slate-700"
            } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none`}
          />
          {errors.observaciones && (
            <p className="mt-1 text-xs text-red-500">{errors.observaciones}</p>
          )}
        </div>

        {/* Botones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
