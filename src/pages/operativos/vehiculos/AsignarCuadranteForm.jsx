/**
 * File: src/pages/operativos/vehiculos/AsignarCuadranteForm.jsx
 * @version 1.0.0
 * @description Formulario para asignar cuadrantes a vehículos operativos
 * @module src/pages/operativos/vehiculos/AsignarCuadranteForm.jsx
 */

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  MapPin,
  Clock,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import api from "../../../services/api.js";

const formatDateTime = (dateString) => {
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
 * AsignarCuadranteForm - Formulario para asignar cuadrantes
 * @component
 */
export default function AsignarCuadranteForm({ 
  vehiculo, 
  turnoId, 
  vehiculoId,
  sectorId,
  cuadrantesAsignados = [], // IDs de cuadrantes ya asignados al vehículo
  onSuccess, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    cuadrante_id: "",
    hora_ingreso: formatDateTime(new Date()),
    hora_salida: "",
    observaciones: "",
  });
  
  const [cuadrantesDisponibles, setCuadrantesDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar cuadrantes disponibles según el sector
  useEffect(() => {
    // Si no hay sectorId, cargar datos de demo inmediatamente
    if (!sectorId) {
      console.warn("No hay sectorId, usando datos de demostración");
      useDemoData();
      return;
    }
    
    fetchCuadrantesDisponibles();
  }, [sectorId]);

  const fetchCuadrantesDisponibles = async () => {
    setLoadingCuadrantes(true);
    try {
      const response = await api.get("/cuadrantes", {
        params: { 
          page: 1,
          limit: 100,
          sector_id: sectorId 
        }
      });
      
      // La respuesta tiene estructura: { success, data: { cuadrantes: [...], pagination: {...} } }
      const cuadrantes = response.data?.data?.cuadrantes || response.data?.cuadrantes || response.data?.data || [];
      
      if (Array.isArray(cuadrantes) && cuadrantes.length > 0) {
        setCuadrantesDisponibles(cuadrantes);
        setLoadingCuadrantes(false);
      } else {
        console.warn("No se encontraron cuadrantes para el sector, usando datos de demostración");
        useDemoData();
      }
    } catch (err) {
      console.error("Error cargando cuadrantes:", err);
      useDemoData();
    }
  };

  const useDemoData = () => {
    setCuadrantesDisponibles([
      { id: 45, cuadrante_code: "C015", nombre: "Centro Comercial Norte" },
      { id: 46, cuadrante_code: "C016", nombre: "Parque Central" },
      { id: 47, cuadrante_code: "C017", nombre: "Zona Residencial Este" },
      { id: 48, cuadrante_code: "C018", nombre: "Avenida Principal" },
      { id: 49, cuadrante_code: "C019", nombre: "Plaza de Armas" },
    ]);
    setLoadingCuadrantes(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cuadrante_id) {
      newErrors.cuadrante_id = "Debe seleccionar un cuadrante";
    }
    
    if (!formData.hora_ingreso) {
      newErrors.hora_ingreso = "Debe ingresar la hora de ingreso";
    }
    
    if (formData.hora_salida && formData.hora_ingreso) {
      const ingreso = new Date(formData.hora_ingreso);
      const salida = new Date(formData.hora_salida);
      
      if (salida <= ingreso) {
        newErrors.hora_salida = "La hora de salida debe ser posterior a la de ingreso";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor, corrija los errores del formulario");
      return;
    }
    
    setLoading(true);
    
    try {
      const payload = {
        operativo_vehiculo_id: parseInt(vehiculoId),
        cuadrante_id: parseInt(formData.cuadrante_id),
        hora_ingreso: toUTCDateTime(formData.hora_ingreso),
        hora_salida: toUTCDateTime(formData.hora_salida),
        observaciones: formData.observaciones && formData.observaciones.trim() !== "" ? formData.observaciones : null,
      };
      
      console.log("Payload enviado en creación:", payload); // Debug
      // Llamada real al API
      const response = await api.post(`/operativos/${turnoId}/vehiculos/${vehiculoId}/cuadrantes`, payload);
      console.log("Cuadrante asignado:", response.data);
      
      toast.success("Cuadrante asignado exitosamente");
      onSuccess && onSuccess(response.data?.data || response.data);
    } catch (err) {
      console.error("Error asignando cuadrante:", err);
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "Error al asignar cuadrante";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const calcularTiempo = () => {
    if (!formData.hora_ingreso || !formData.hora_salida) return null;
    
    const ingreso = new Date(formData.hora_ingreso);
    const salida = new Date(formData.hora_salida);
    const diffMs = salida - ingreso;
    const diffMinutes = Math.floor(diffMs / 60000);
    
    return diffMinutes > 0 ? `${diffMinutes} minutos` : "Tiempo inválido";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin size={24} className="text-green-600" />
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Asignar Cuadrante
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Vehículo: {vehiculo?.placa} - {vehiculo?.marca} {vehiculo?.modelo}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title="Cancelar"
        >
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cuadrante */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cuadrante <span className="text-red-500">*</span>
            </label>
            <select
              name="cuadrante_id"
              value={formData.cuadrante_id}
              onChange={handleInputChange}
              disabled={loadingCuadrantes}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50 disabled:cursor-wait ${
                errors.cuadrante_id
                  ? "border-red-300 dark:border-red-600"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              <option value="">
                {loadingCuadrantes ? "Cargando cuadrantes..." : "Seleccione un cuadrante"}
              </option>
              {cuadrantesDisponibles
                .filter((cuadrante) => !cuadrantesAsignados.includes(cuadrante.id))
                .map((cuadrante) => (
                <option key={cuadrante.id} value={cuadrante.id}>
                  {cuadrante.cuadrante_code} - {cuadrante.nombre}
                </option>
              ))}
            </select>
            {errors.cuadrante_id && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                {errors.cuadrante_id}
              </p>
            )}
          </div>

          {/* Hora de Ingreso */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hora de Ingreso <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="hora_ingreso"
              value={formData.hora_ingreso}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.hora_ingreso
                  ? "border-red-300 dark:border-red-600"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            />
            {errors.hora_ingreso && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                {errors.hora_ingreso}
              </p>
            )}
          </div>

          {/* Hora de Salida */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Hora de Salida
            </label>
            <input
              type="datetime-local"
              name="hora_salida"
              value={formData.hora_salida}
              onChange={handleInputChange}
              min={formData.hora_ingreso}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.hora_salida
                  ? "border-red-300 dark:border-red-600"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            />
            {errors.hora_salida && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertTriangle size={12} />
                {errors.hora_salida}
              </p>
            )}
          </div>

          {/* Tiempo Calculado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tiempo Estimado
            </label>
            <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Clock size={14} />
                {calcularTiempo() || "Seleccione ambas horas"}
              </span>
            </div>
          </div>
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
            onChange={handleInputChange}
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
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Asignar Cuadrante
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
