/**
 * File: src/components/calles/CuadranteVehiculoFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar asignaciones de vehículos a cuadrantes
 * 
 * Funcionalidades:
 * - Formulario con validaciones
 * - Dropdowns para cuadrantes y vehículos
 * - Manejo de errores específicos
 * - Modos create/edit
 * 
 * @module src/components/calles/CuadranteVehiculoFormModal.jsx
 */

import { useState, useEffect, useCallback } from "react";
import { X, Car, Save, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import cuadranteVehiculoAsignadoService from "../../services/cuadranteVehiculoAsignadoService.js";
import { listVehiculos } from "../../services/vehiculosService.js";

/**
 * Modal para formulario de asignación vehículo-cuadrante
 * @param {Object} props - Props del componente
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Función para cerrar el modal
 * @param {Function} props.onSuccess - Función para éxito
 * @param {string} props.mode - Modo: "create" o "edit"
 * @param {Object} props.cuadrante - Datos del cuadrante
 * @param {Object} props.asignacion - Datos de la asignación (modo edit)
 * @returns {JSX.Element}
 */
export default function CuadranteVehiculoFormModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode, 
  cuadrante, 
  asignacion 
}) {
  // Estado del formulario
  const [formData, setFormData] = useState({
    cuadrante_id: cuadrante?.id || "",
    vehiculo_id: "",
    observaciones: "",
    estado: true
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculosLoading, setVehiculosLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar vehículos disponibles
  const cargarVehiculos = useCallback(async () => {
    setVehiculosLoading(true);
    try {
      const response = await listVehiculos({
        estado: true, // Solo vehículos activos
        limit: 100
      });

      let vehiculosData = [];
      if (response.data?.data?.vehiculos) {
        vehiculosData = response.data.data.vehiculos;
      } else if (response.data?.vehiculos) {
        vehiculosData = response.data.vehiculos;
      } else if (Array.isArray(response.data)) {
        vehiculosData = response.data;
      }

      setVehiculos(vehiculosData);
    } catch (error) {
      console.error("Error cargando vehículos:", error);
      toast.error("Error al cargar los vehículos disponibles");
    } finally {
      setVehiculosLoading(false);
    }
  }, []);

  // Efecto para cargar vehículos al abrir el modal
  useEffect(() => {
    if (isOpen) {
      cargarVehiculos();
    }
  }, [isOpen, cargarVehiculos]);

  // Efecto para inicializar formulario en modo edición
  useEffect(() => {
    if (mode === "edit" && asignacion) {
      setFormData({
        cuadrante_id: asignacion.cuadrante_id || cuadrante?.id || "",
        vehiculo_id: asignacion.vehiculo_id || "",
        observaciones: asignacion.observaciones || "",
        estado: asignacion.estado !== undefined ? asignacion.estado : true
      });
    } else if (mode === "create") {
      setFormData({
        cuadrante_id: cuadrante?.id || "",
        vehiculo_id: "",
        observaciones: "",
        estado: true
      });
    }
  }, [mode, asignacion, cuadrante]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehiculo_id) {
      newErrors.vehiculo_id = "Debe seleccionar un vehículo";
    }

    if (formData.observaciones && formData.observaciones.length > 500) {
      newErrors.observaciones = "Las observaciones no pueden exceder 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrija los errores del formulario");
      return;
    }

    setSaving(true);
    try {
      const dataToSubmit = {
        cuadrante_id: formData.cuadrante_id,
        vehiculo_id: Number(formData.vehiculo_id),
        observaciones: formData.observaciones || null,
        estado: formData.estado
      };

      let response;
      if (mode === "create") {
        response = await cuadranteVehiculoAsignadoService.createAsignacion(dataToSubmit);
        toast.success("Asignación creada exitosamente");
      } else {
        response = await cuadranteVehiculoAsignadoService.updateAsignacion(asignacion.id, dataToSubmit);
        toast.success("Asignación actualizada exitosamente");
      }

      onSuccess();
    } catch (error) {
      console.error("Error en el formulario:", error);
      
      // Manejar errores específicos del backend
      if (error.response?.data?.code === 'DUPLICATE_ASSIGNMENT') {
        toast.error("Ya existe una asignación para este cuadrante y vehículo");
        setErrors({ vehiculo_id: "Este vehículo ya está asignado a este cuadrante" });
      } else if (error.response?.data?.code === 'CUADRANTE_NOT_FOUND') {
        toast.error("El cuadrante especificado no existe");
      } else if (error.response?.data?.code === 'VEHICULO_NOT_FOUND') {
        toast.error("El vehículo especificado no existe");
        setErrors({ vehiculo_id: "El vehículo seleccionado no existe" });
      } else if (error.response?.data?.code === 'FOREIGN_KEY_ERROR') {
        toast.error("Error de referencia: El ID proporcionado no existe");
      } else {
        toast.error(error.response?.data?.message || "Error al guardar la asignación");
      }
    } finally {
      setSaving(false);
    }
  };

  // Manejar tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !saving) {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Car size={24} className="text-blue-600" />
              {mode === "create" ? "Nueva Asignación" : "Editar Asignación"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Cuadrante: {cuadrante?.nombre || cuadrante?.cuadrante_code}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Información del cuadrante (solo lectura) */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Información del Cuadrante
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Código:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {cuadrante?.cuadrante_code}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Nombre:</span>
                  <span className="ml-2 font-medium text-slate-900 dark:text-white">
                    {cuadrante?.nombre}
                  </span>
                </div>
              </div>
            </div>

            {/* Selección de vehículo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Vehículo <span className="text-red-500">*</span>
              </label>
              <select
                name="vehiculo_id"
                value={formData.vehiculo_id}
                onChange={handleChange}
                disabled={vehiculosLoading || saving}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white ${
                  errors.vehiculo_id 
                    ? "border-red-300 focus:ring-red-500" 
                    : "border-slate-300 dark:border-slate-600"
                }`}
              >
                <option value="">Seleccione un vehículo...</option>
                {vehiculos.map((vehiculo) => (
                  <option key={vehiculo.id} value={vehiculo.id}>
                    {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                  </option>
                ))}
              </select>
              {errors.vehiculo_id && (
                <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.vehiculo_id}
                </div>
              )}
              {vehiculosLoading && (
                <div className="mt-1 text-sm text-slate-500">
                  Cargando vehículos disponibles...
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                maxLength={500}
                placeholder="Observaciones adicionales sobre la asignación..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white resize-none ${
                  errors.observaciones 
                    ? "border-red-300 focus:ring-red-500" 
                    : "border-slate-300 dark:border-slate-600"
                }`}
              />
              {errors.observaciones && (
                <div className="mt-1 flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle size={14} />
                  {errors.observaciones}
                </div>
              )}
              <div className="mt-1 text-xs text-slate-500">
                {formData.observaciones.length}/500 caracteres
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="estado"
                  checked={formData.estado}
                  onChange={handleChange}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Asignación activa
                </span>
              </label>
              <p className="mt-1 text-xs text-slate-500">
                Las asignaciones inactivas no se mostrarán en las listas principales
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || vehiculosLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                {mode === "create" ? "Crear" : "Actualizar"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
