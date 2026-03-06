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
import { X, Car, Save, AlertCircle, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import cuadranteVehiculoAsignadoService from "../../services/cuadranteVehiculoAsignadoService.js";
import { listVehiculosDisponibles } from "../../services/vehiculosService.js";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

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
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // Estado del formulario
  const [formData, setFormData] = useState({
    cuadrante_id: cuadrante?.id || "",
    vehiculo_id: "",
    observaciones: "",
    estado: true
  });

  // Estados de UI
  const [saving, setSaving] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculosAsignadosCuadrante, setVehiculosAsignadosCuadrante] = useState([]);
  const [vehiculosLoading, setVehiculosLoading] = useState(false);
  const [vehiculosError, setVehiculosError] = useState(null);
  const [errors, setErrors] = useState({});
  const [vehiculosCargados, setVehiculosCargados] = useState(false);
  const [forceReload, setForceReload] = useState(0); // Para forzar recargas

  // Cargar vehículos disponibles y asignados al cuadrante
  const cargarVehiculos = useCallback(async () => {
    // Evitar múltiples cargas simultáneas y usar el flag de control
    if (vehiculosLoading || vehiculosCargados) {
      return;
    }

    setVehiculosLoading(true);
    setVehiculosError(null);
    
    try {
      // Cargar vehículos disponibles
      const disponiblesResponse = await listVehiculosDisponibles();
      let vehiculosDisponibles = [];
      if (disponiblesResponse.data?.data?.vehiculos) {
        vehiculosDisponibles = disponiblesResponse.data.data.vehiculos;
      } else if (disponiblesResponse.data?.vehiculos) {
        vehiculosDisponibles = disponiblesResponse.data.vehiculos;
      } else if (Array.isArray(disponiblesResponse.data)) {
        vehiculosDisponibles = disponiblesResponse.data;
      } else if (Array.isArray(disponiblesResponse)) {
        vehiculosDisponibles = disponiblesResponse;
      }

      // Cargar vehículos ya asignados al cuadrante
      let vehiculosAsignados = [];
      if (cuadrante?.id) {
        try {
          const asignadosResponse = await cuadranteVehiculoAsignadoService.getAsignacionesByCuadrante(cuadrante.id);
          
          if (asignadosResponse.data?.data?.asignaciones) {
            vehiculosAsignados = asignadosResponse.data.data.asignaciones;
          } else if (asignadosResponse.data?.asignaciones) {
            vehiculosAsignados = asignadosResponse.data.asignaciones;
          } else if (Array.isArray(asignadosResponse.data)) {
            vehiculosAsignados = asignadosResponse.data;
          } else if (Array.isArray(asignadosResponse)) {
            vehiculosAsignados = asignadosResponse;
          }

          // Filtrar solo asignaciones activas (excluir las que están inactivas o eliminadas)
          vehiculosAsignados = vehiculosAsignados.filter(asig => {
            const estaActivo = asig.estado === true || asig.estado === 1;
            const noEliminado = !asig.deleted_at;
            return estaActivo && noEliminado; // Solo considerar asignaciones activas y no eliminadas
          });
        } catch (error) {
          console.warn("⚠️ No se pudieron cargar vehículos asignados al cuadrante:", error);
          // Continuar con vehículos disponibles aunque falle la carga de asignados
        }
      }

      // Filtrar vehículos disponibles excluyendo los ya asignados
      const vehiculosAsignadosIds = new Set(vehiculosAsignados.map(asig => asig.vehiculo_id));
      let vehiculosFiltrados = vehiculosDisponibles.filter(v => !vehiculosAsignadosIds.has(v.id));

      // En modo edición, incluir el vehículo actual de la asignación
      if (mode === "edit" && asignacion?.vehiculo_id) {
        const vehiculoActual = vehiculosDisponibles.find(v => v.id === asignacion.vehiculo_id);
        if (vehiculoActual && !vehiculosFiltrados.includes(vehiculoActual)) {
          vehiculosFiltrados.push(vehiculoActual);
        }
      }

      setVehiculos(vehiculosFiltrados);
      setVehiculosAsignadosCuadrante(vehiculosAsignados);
      setVehiculosCargados(true); // Marcar como cargado
    } catch (error) {
      console.error("Error cargando vehículos:", error);
      setVehiculosError(error.message || "Error al cargar vehículos");
      
      // Si es error 429, mostrar mensaje específico
      if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 60;
        toast.error(`Demasiadas solicitudes. Espere ${retryAfter} segundos e intente nuevamente.`);
      } else {
        toast.error("Error al cargar los vehículos disponibles");
      }
    } finally {
      setVehiculosLoading(false);
    }
  }, [vehiculosLoading, vehiculosCargados, cuadrante?.id, forceReload]); // Dependencias estables

  // Resetear vehículos al cerrar modal
  const resetVehiculos = useCallback(() => {
    setVehiculos([]);
    setVehiculosAsignadosCuadrante([]);
    setVehiculosError(null);
    setVehiculosCargados(false); // Resetear flag
  }, []);

  // Efecto para cargar vehículos al abrir el modal
  useEffect(() => {
    if (isOpen && !vehiculosCargados) {
      cargarVehiculos();
    }
  }, [isOpen, vehiculosCargados, cargarVehiculos]);

  // Efecto para resetear al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      resetVehiculos();
      setForceReload(0); // Resetear force reload al cerrar
    }
  }, [isOpen, resetVehiculos]);

  // Manejar tecla ESC - solo cerrar si no está guardando
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !saving) {
        e.preventDefault();
        e.stopPropagation(); // Prevenir que otros manejadores capturen este evento
        onClose(); // Comportamiento idéntico al botón X
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown, true); // Mayor prioridad con capture: true
      return () => document.removeEventListener("keydown", handleKeyDown, true);
    }
  }, [isOpen, onClose, saving]);

  // Efecto para inicializar formulario en modo edición
  useEffect(() => {
    if (mode === "edit" && asignacion) {
      setFormData({
        cuadrante_id: asignacion.cuadrante_id || cuadrante?.id || "",
        vehiculo_id: asignacion.vehiculo_id || "", // Asegurar que el vehículo_id se cargue
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
  }, [mode, asignacion, cuadrante?.id]);

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

  // Verificar si existe asignación anulada para reactivar
  const verificarAsignacionAnulada = async (cuadranteId, vehiculoId) => {
    try {
      // Primero buscar asignaciones activas (sin soft delete)
      const response = await cuadranteVehiculoAsignadoService.getAsignacionesByCuadrante(cuadranteId);
      let asignaciones = [];
      
      if (response.data?.data?.asignaciones) {
        asignaciones = response.data.data.asignaciones;
      } else if (response.data?.asignaciones) {
        asignaciones = response.data.asignaciones;
      } else if (Array.isArray(response.data)) {
        asignaciones = response.data;
      } else if (Array.isArray(response)) {
        asignaciones = response;
      }

      // Buscar asignación con mismo vehículo pero estado = 0 (anulada) en las activas
      const asignacionAnulada = asignaciones.find(asig => {
        const mismoVehiculo = asig.vehiculo_id === Number(vehiculoId);
        const estaAnulada = asig.estado === false || asig.estado === 0;
        const tieneSoftDelete = asig.deleted_at;
        
        return mismoVehiculo && estaAnulada && tieneSoftDelete;
      });

      if (asignacionAnulada) {
        return asignacionAnulada;
      }

      // Si no encuentra en activas, buscar en eliminadas
      
      try {
        // Buscar asignaciones eliminadas para este cuadrante
        const responseEliminadas = await cuadranteVehiculoAsignadoService.getEliminadas({ cuadrante_id: cuadranteId });
        
        let asignacionesEliminadas = [];
        if (responseEliminadas.data?.data?.asignaciones) {
          asignacionesEliminadas = responseEliminadas.data.data.asignaciones;
        } else if (responseEliminadas.data?.asignaciones) {
          asignacionesEliminadas = responseEliminadas.data.asignaciones;
        } else if (Array.isArray(responseEliminadas.data)) {
          asignacionesEliminadas = responseEliminadas.data;
        } else if (Array.isArray(responseEliminadas)) {
          asignacionesEliminadas = responseEliminadas;
        }

        // Buscar en asignaciones eliminadas
        const asignacionEliminada = asignacionesEliminadas.find(asig => {
          const mismoVehiculo = asig.vehiculo_id === Number(vehiculoId);
          const estaAnulada = asig.estado === false || asig.estado === 0;
          const tieneSoftDelete = asig.deleted_at;
          
          return mismoVehiculo && (estaAnulada || !asig.estado) && tieneSoftDelete;
        });

        if (asignacionEliminada) {
          return asignacionEliminada;
        }
      } catch {
        // No se pudo buscar en eliminadas
      }

      return null;
    } catch (error) {
      console.error("❌ Error verificando asignaciones existentes:", error);
      return null;
    }
  };

  // Reactivar asignación existente
  const reactivarAsignacion = async (asignacionId) => {
    try {
      await cuadranteVehiculoAsignadoService.reactivarAsignacion(asignacionId);
      
      // NO actualizar observaciones después de reactivar para evitar inconsistencias
      // La reactivación debe ser limpia sin modificaciones adicionales
      
      toast.success("Asignación reactivada exitosamente");
      onSuccess();
    } catch (error) {
      console.error("Error reactivando asignación:", error);
      
      // Si el endpoint de reactivación no funciona, mostrar error amigable
      if (error.response?.status === 404 || error.response?.status === 405) {
        toast.error("No se puede reactivar la asignación. El endpoint de reactivación no está disponible.");
      } else {
        toast.error("Error al reactivar la asignación");
      }
      throw error;
    }
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
      // Si es modo creación, verificar si existe asignación anulada
      if (mode === "create") {
        const asignacionAnulada = await verificarAsignacionAnulada(
          formData.cuadrante_id, 
          formData.vehiculo_id
        );

        if (asignacionAnulada) {
          // Mostrar confirmación para reactivar
          const confirmarReactivacion = window.confirm(
            "Esta asignación ya fue realizada pero está anulada. ¿Desea reactivarla?"
          );

          if (confirmarReactivacion) {
            await reactivarAsignacion(asignacionAnulada.id);
            return;
          } else {
            setSaving(false);
            return; // Usuario canceló la reactivación
          }
        }
      }

      // Si no hay asignación anulada o el usuario no quiere reactivar, proceder normalmente
      const dataToSubmit = {
        cuadrante_id: formData.cuadrante_id,
        vehiculo_id: Number(formData.vehiculo_id),
        observaciones: formData.observaciones || null,
        estado: formData.estado
      };

      if (mode === "create") {
        await cuadranteVehiculoAsignadoService.createAsignacion(dataToSubmit);
        toast.success("Asignación creada exitosamente");
      } else {
        await cuadranteVehiculoAsignadoService.updateAsignacion(asignacion.id, dataToSubmit);
        toast.success("Asignación actualizada exitosamente");
      }

      onSuccess();
    } catch (error) {
      console.error("Error en el formulario:", error);
      
      // Manejar errores específicos del backend
      if (error.response?.status === 400 && error.response?.data?.errors) {
        // Error de validación con detalles específicos
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => `${err.msg || err.message || 'Error de validación'}`);
        
        toast.error(`Error de validación: ${errorMessages.join(', ')}`);
        
        // Mapear errores a campos específicos
        const fieldErrors = {};
        validationErrors.forEach(err => {
          if (err.path) {
            fieldErrors[err.path] = err.msg || err.message || 'Error de validación';
          }
        });
        setErrors(fieldErrors);
        
      } else if (error.response?.status === 400 && error.response?.data?.message) {
        // Error 400 genérico con mensaje
        toast.error(error.response.data.message);
        
      } else if (error.response?.status === 409) {
        // Error de conflicto (duplicado)
        const message = error.response?.data?.message || "Conflicto de datos";
        toast.error(`Error: ${message}`);
        setErrors({ vehiculo_id: message });
        
      } else if (error.response?.data?.code === 'DUPLICATE_ASSIGNMENT') {
        toast.error("Ya existe una asignación para este cuadrante y vehículo");
        setErrors({ vehiculo_id: "Este vehículo ya está asignado a este cuadrante" });
        
      } else if (error.response?.data?.code === 'CUADRANTE_NOT_FOUND') {
        toast.error("El cuadrante especificado no existe");
        
      } else if (error.response?.data?.code === 'VEHICULO_NOT_FOUND') {
        toast.error("El vehículo especificado no existe");
        setErrors({ vehiculo_id: "El vehículo seleccionado no existe" });
        
      } else if (error.response?.data?.code === 'FOREIGN_KEY_ERROR') {
        toast.error("Error de referencia: El ID proporcionado no existe");
        
      } else if (error.response?.status === 429) {
        // Error de demasiadas solicitudes
        const retryAfter = error.response?.data?.retryAfter || 60;
        toast.error(`Demasiadas solicitudes. Espere ${retryAfter} segundos e intente nuevamente.`);
        
      } else {
        // Error genérico con información detallada
        const status = error.response?.status || 'desconocido';
        const message = error.response?.data?.message || error.message || "Error al guardar la asignación";
        toast.error(`Error ${status}: ${message}`);
      }
    } finally {
      setSaving(false);
    }
  };

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
              Sector: {cuadrante?.sector?.sector_code}
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
                disabled={vehiculosLoading || saving || vehiculosError}
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
                <div className="mt-1 text-sm text-slate-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Cargando vehículos disponibles...
                </div>
              )}
              {vehiculosError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        {vehiculosError}
                      </p>
                      <button
                        onClick={() => {
                          resetVehiculos();
                          setTimeout(() => cargarVehiculos(), 1000);
                        }}
                        className="mt-1 text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                      >
                        <RefreshCw size={12} />
                        Reintentar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {vehiculos.length > 0 && !vehiculosLoading && !vehiculosError && (
                <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                  🚗 {vehiculos.length} vehículos disponibles
                  {vehiculosAsignadosCuadrante.length > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 ml-2">
                      ⚠️ {vehiculosAsignadosCuadrante.length} ya asignados a este cuadrante
                    </span>
                  )}
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50"
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
