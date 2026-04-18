/**
 * File: src/components/vehiculos/AbastecimientoModal.jsx
 * @version 2.0.0
 * @description Modal para gestión completa de abastecimientos de combustible por vehículo.
 *
 * Muestra un panel izquierdo con la lista de registros (cards) y un panel derecho
 * con el formulario de creación/edición. Incluye filtros por rango de fechas y paginación.
 *
 * CORRECCIONES v2.0.0:
 * - Eliminado `loading` de las dependencias de useCallback → eliminaba el bucle infinito
 * - Separado el useEffect inicial del useEffect de carga → cada uno con responsabilidad única
 * - useEffect de carga reactivo a `filters.vehiculo_id` (primitivo) en vez de toda la función
 * - useEffect de paginación sin `cargarAbastecimientos` en dependencias
 * - Filtro de fechas vacío por defecto → muestra todos los registros del vehículo al abrir
 * - Eliminada duplicación del scroll lock (manejado solo en el useEffect de ESC)
 *
 * @module src/components/vehiculos/AbastecimientoModal.jsx
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Fuel, Calendar, Filter, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { abastecimientoSchema } from '../../forms/AbastecimientoSchema.js';
import {
  getAbastecimientos,
  createAbastecimiento,
  updateAbastecimiento,
  deleteAbastecimiento,
  getTiposCombustible,
  getGrifos,
  formatFechaHora
} from '../../services/abastecimientosService.js';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';
import { useAuthStore } from '../../store/useAuthStore.js';
import { canPerformAction } from '../../rbac/rbac.js';

/**
 * Modal principal para gestión de abastecimientos de combustible.
 *
 * @component
 * @param {Object}   props              - Props del componente
 * @param {boolean}  props.isOpen       - Controla si el modal está visible
 * @param {Function} props.onClose      - Callback para cerrar el modal
 * @param {Object}   props.vehicle      - Objeto del vehículo seleccionado (debe incluir `id`, `placa`, etc.)
 * @param {Function} props.onVehicleUpdate - Callback para actualizar datos del vehículo
 * @returns {JSX.Element|null}
 */
export default function AbastecimientoModal({ isOpen, onClose, vehicle, onVehicleUpdate }) {

  // Obtener usuario para RBAC
  const { user } = useAuthStore();

  // Verificar permisos RBAC
  const canCreate = canPerformAction(user, 'abastecimientos_create');
  const canUpdate = canPerformAction(user, 'abastecimientos_update');
  const canDelete = canPerformAction(user, 'abastecimientos_delete');

  // Estado para vista readonly (doble click)
  const [viewOnlyData, setViewOnlyData] = useState(null);
  const [showViewOnly, setShowViewOnly] = useState(false);

  // Estado local para vehicle actualizado
  const [currentVehicle, setCurrentVehicle] = useState(vehicle);

  // Bloqueo de scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // Actualizar currentVehicle cuando la prop vehicle cambia (pero no si ya está actualizado)
  useEffect(() => {
    if (vehicle) {
      setCurrentVehicle(vehicle);
    }
  }, [vehicle]);

  // ─── Estados locales ─────────────────────────────────────────────────────────
  const [abastecimientos, setAbastecimientos]     = useState([]);    // Lista de registros cargados
  const [loading, setLoading]                     = useState(false);  // Estado de carga del listado
  const [error, setError]                         = useState(null);   // Mensaje de error del listado
  const [editingId, setEditingId]                 = useState(null);   // ID del registro en edición (null = creación)
  const [isSubmitting, setIsSubmitting]           = useState(false);  // Previene doble envío del form
  const [usarFechaActual, setUsarFechaActual]     = useState(false);  // Checkbox "usar fecha actual"
  const [showForm, setShowForm]                   = useState(false);  // Muestra/oculta el formulario
  const [tiposCombustible, setTiposCombustible]   = useState([]);    // Catálogo de tipos de combustible

  /**
   * Estado de filtros para la lista.
   * vehiculo_id se rellena automáticamente al abrir el modal.
   * fecha_inicio / fecha_fin vacíos = sin filtro de fecha (muestra todos los registros).
   * 
   * NOTA: Se guardan en formato ISO para backend, pero los inputs muestran solo la parte de fecha.
   */
  const [filters, setFilters] = useState({
    fecha_inicio: '',
    fecha_fin:    '',
    vehiculo_id:  null
  });

  /** Estado de paginación del listado */
  const [pagination, setPagination] = useState({
    page:       1,
    limit:      20,
    total:      0,
    totalPages: 1
  });

  // ─── Formulario react-hook-form + Zod ────────────────────────────────────────
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm({
    resolver: zodResolver(abastecimientoSchema),
    defaultValues: {
      vehiculo_id:      vehicle?.id || null, // Pre-carga el ID del vehículo desde el inicio
      fecha_hora:       '',
      tipo_combustible: '',
      km_actual:        '',
      cantidad:         '',
      precio_unitario:  '',
      grifo_nombre:     '',
      grifo_ruc:        '',
      factura_boleta:   '',
      observaciones:    ''
    }
  });

  // ─── Carga de abastecimientos ─────────────────────────────────────────────────
  /**
   * Obtiene los abastecimientos del backend aplicando los filtros actuales.
   *
   * IMPORTANTE — Por qué `loading` NO está en las dependencias:
   * Si se incluye `loading`, cada cambio de estado (true → false) recrea la función.
   * Los useEffects que dependen de esta función se re-ejecutan → nueva petición →
   * loading cambia de nuevo → la función se recrea otra vez → bucle infinito.
   *
   * @function cargarAbastecimientos
   */
  const cargarAbastecimientos = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Mezclar los filtros del state con el vehiculo_id actual
    const currentFilters = {
      ...filters,
      vehiculo_id: vehicle?.id || null
    };

    console.log('[AbastecimientoModal] Cargando con filtros:', currentFilters);

    try {
      const response = await getAbastecimientos(currentFilters);
      console.log('[AbastecimientoModal] Respuesta del servidor:', response);

      if (response.success) {
        // Extraer correctamente el array de abastecimientos
        const data = Array.isArray(response.data?.abastecimientos) ? response.data.abastecimientos : [];
        setAbastecimientos(data);
        // Actualizar paginación con los valores que devuelve el backend
        setPagination(prev => ({ ...prev, ...response.pagination }));
      } else {
        setError(response.message || 'Error al cargar abastecimientos');
        setAbastecimientos([]);
      }
    } catch (err) {
      console.error('[AbastecimientoModal] Error cargando:', err);
      setError('Error al cargar abastecimientos');
      setAbastecimientos([]);
    } finally {
      setLoading(false);
    }
  // ✅ Solo `filters` y `vehicle?.id` — SIN `loading` para evitar el bucle infinito
  }, [filters, vehicle?.id]);

  // ─── useEffect #1: inicialización al abrir el modal ──────────────────────────
  /**
   * Se ejecuta SOLO cuando el modal se abre (isOpen cambia a true) o cambia el vehículo.
   *
   * Responsabilidades:
   *  1. Asignar vehiculo_id en los filtros (esto dispara el useEffect #2 para la carga)
   *  2. Cargar catálogos estáticos (tipos de combustible)
   *
   * ✅ NO incluye `cargarAbastecimientos` en dependencias para que no se re-ejecute
   *    cada vez que esa función se recrea (lo cual sucedería con cada cambio de filtros).
   */
  useEffect(() => {
    if (!isOpen || !vehicle) return;

    // Establecer el vehiculo_id en filtros — sin filtro de fechas para mostrar todos los registros
    setFilters({
      fecha_inicio: '',
      fecha_fin:    '',
      vehiculo_id:  vehicle.id
    });

    // Cargar catálogo de tipos de combustible (datos estáticos del servicio)
    const cargarCatalogos = async () => {
      try {
        const [tipos] = await Promise.all([
          getTiposCombustible(),
          getGrifos()
        ]);
        setTiposCombustible(tipos);
      } catch (err) {
        console.error('[AbastecimientoModal] Error cargando catálogos:', err);
      }
    };

    cargarCatalogos();

  }, [isOpen, vehicle]); // ✅ Solo isOpen y vehicle — sin cargarAbastecimientos

  // ─── useEffect #2: carga reactiva al vehiculo_id en filtros ──────────────────
  /**
   * Dispara la carga de abastecimientos cuando filters.vehiculo_id queda disponible.
   *
   * Se usa `filters.vehiculo_id` (valor primitivo numérico) en vez de `filters`
   * (objeto) para evitar re-renders causados por nueva identidad de referencia
   * del objeto en cada render, que harían que este effect se ejecute de más.
   */
  useEffect(() => {
    if (!isOpen || !vehicle || !filters.vehiculo_id) return;
    cargarAbastecimientos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filters.vehiculo_id]); // ✅ Solo el ID primitivo, no todo el objeto filters

  // ─── useEffect #3: tecla ESC + scroll lock ───────────────────────────────────
  /**
   * Escucha la tecla Escape para cerrar el modal.
   * Maneja el overflow del body de forma consolidada (sin duplicación).
   * No usa position:fixed para no romper el stacking context del modal.
   */
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) handleClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── useEffect #4: paginación ────────────────────────────────────────────────
  /**
   * Recarga los datos cuando el usuario navega a una página distinta de la primera.
   *
   * ✅ Sin `cargarAbastecimientos` en deps para no crear el bucle.
   *    La función se llama directamente, no como dependencia reactiva.
   */
  useEffect(() => {
    if (isOpen && filters.vehiculo_id && pagination.page > 1) {
      cargarAbastecimientos();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]); // Solo la página como primitivo

  // ─── useEffect #5: checkbox "usar fecha actual" ───────────────────────────────
  /**
   * Cuando el usuario activa el checkbox, rellena el campo fecha_hora con la
   * fecha y hora local actual en formato datetime-local (YYYY-MM-DDTHH:MM).
   * Al desactivarlo, limpia el campo para que el usuario ingrese manualmente.
   */
  useEffect(() => {
    if (usarFechaActual) {
      // Usar el mismo patrón que DespacharModal para consistencia
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      
      // Formato datetime-local para el input (YYYY-MM-DDTHH:MM)
      setValue('fecha_hora', `${year}-${month}-${day}T${hours}:${mins}`);
    } else {
      setValue('fecha_hora', '');
    }
  }, [usarFechaActual, setValue]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  /**
   * Cierra el modal y restaura el scroll del body.
   */
  const handleClose = useCallback(() => {
    onClose();
    document.body.style.overflow = '';
  }, [onClose]);

  /**
   * Refresca los datos del vehículo para mostrar kilometraje actualizado
   */
  const actualizarKilometrajeVehiculo = useCallback((abastecimientoResponse) => {
    try {
      // Extraer km_actual del response del abastecimiento creado/editado
      const kmActual = abastecimientoResponse?.data?.km_actual;
      
      if (kmActual && currentVehicle) {
        // Actualizar el objeto vehicle con el nuevo kilometraje
        const updatedVehicle = { 
          ...currentVehicle, 
          kilometraje_actual: kmActual 
        };
        
        // Forzar actualización del estado para asegurar que React re-pinte
        setCurrentVehicle(prev => {
          const newVehicle = prev?.id === updatedVehicle.id ? updatedVehicle : prev;
          console.log('setCurrentVehicle ejecutado, nuevo estado:', newVehicle);
          return newVehicle;
        });
        
        // Notificar al componente padre para que actualice su estado
        if (onVehicleUpdate) {
          onVehicleUpdate(updatedVehicle);
        }
        
        console.log('Kilometraje actualizado desde response:', kmActual);
        console.log('Vehículo actualizado:', updatedVehicle);
      }
    } catch (error) {
      console.error('Error actualizando kilometraje del vehículo:', error);
    }
  }, [currentVehicle, onVehicleUpdate]);

  /**
   * Maneja el envío del formulario (crear o actualizar).
   * Zod ya validó los campos antes de llegar aquí via handleSubmit.
   *
   * @param {Object} data - Datos validados por react-hook-form + Zod
   */
  const onSubmit = useCallback(async (data) => {
    try {
      setIsSubmitting(true);
      data.vehiculo_id = currentVehicle.id;
      data.moneda = import.meta.env.VITE_DEFAULT_CURRENCY || 'PEN';

      console.log('[AbastecimientoModal] Datos a enviar:', data);

      // Segunda línea de defensa — Zod debería haberlos capturado primero.
      // Se usa comparación explícita para no fallar con valores numéricos como km_actual=0.
      const requiredFields = ['vehiculo_id', 'fecha_hora', 'tipo_combustible', 'km_actual', 'cantidad', 'precio_unitario', 'grifo_nombre'];
      const missingFields  = requiredFields.filter(field =>
        data[field] === null || data[field] === undefined || data[field] === ''
      );

      if (missingFields.length > 0) {
        toast.error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        return;
      }

      let response;

      if (editingId) {
        // ── Modo edición ──
        response = await updateAbastecimiento(editingId, data);
        if (response.success) {
          toast.success('Abastecimiento actualizado correctamente');
          reset();
          setShowForm(false);
          setEditingId(null);
          setUsarFechaActual(false);
          await cargarAbastecimientos(); // Refrescar lista
          await actualizarKilometrajeVehiculo(response); // Actualizar kilometraje del vehículo
        } else {
          toast.error(response.message || 'Error al actualizar');
        }
      } else {
        // ── Modo creación ──
        response = await createAbastecimiento(data);
        if (response.success) {
          toast.success('Abastecimiento creado correctamente');
          reset();
          setShowForm(false);
          setEditingId(null);
          setUsarFechaActual(false);
          await cargarAbastecimientos(); // Refrescar lista para mostrar el nuevo registro
          await actualizarKilometrajeVehiculo(response); // Actualizar kilometraje del vehículo
        } else {
          toast.error(response.message || 'Error al crear');
        }
      }
    } catch (err) {
      console.error('[AbastecimientoModal] Error en submit:', err);
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false); // Siempre restaurar, incluso si hubo error
    }
  }, [currentVehicle?.id, isSubmitting, cargarAbastecimientos, reset, actualizarKilometrajeVehiculo]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Elimina un abastecimiento tras confirmación del usuario.
   * El backend aplica soft delete (no borra el registro físicamente).
   *
   * @param {number} id - ID del abastecimiento a eliminar
   */
  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este abastecimiento?')) return;

    try {
      const response = await deleteAbastecimiento(id);
      if (response.success) {
        toast.success('Abastecimiento eliminado correctamente');
        await cargarAbastecimientos();
      } else {
        toast.error(response.message || 'Error al eliminar');
      }
    } catch (err) {
      toast.error('Error al eliminar');
      console.error('[AbastecimientoModal] Error eliminando:', err);
    }
  };

  /**
   * Pre-carga los datos de un registro existente en el formulario para editarlo.
   *
   * @param {Object} abastecimiento - Objeto del registro a editar
   */
  const handleEdit = (abastecimiento) => {
    console.log('=== DEBUG EDITAR ABASTECIMIENTO ===');
    console.log('Abastecimiento a editar:', abastecimiento);
    console.log('fecha_hora recibida:', abastecimiento.fecha_hora);
    console.log('Tipo de dato:', typeof abastecimiento.fecha_hora);
    
    // Convertir formato de backend (YYYY-MM-DD HH:MM:SS) a datetime-local (YYYY-MM-DDTHH:MM)
    let fechaFormateada = '';
    if (abastecimiento.fecha_hora) {
      // Separar fecha y hora
      const [fecha, horaCompleta] = abastecimiento.fecha_hora.split(' ');
      if (fecha && horaCompleta) {
        // Tomar solo HH:MM de HH:MM:SS
        const [hora, minutos] = horaCompleta.split(':');
        fechaFormateada = `${fecha}T${hora}:${minutos}`;
        console.log('fecha_hora convertida:', fechaFormateada);
      }
    }
    
    console.log('================================');
    
    setEditingId(abastecimiento.id);
    setValue('vehiculo_id',      abastecimiento.vehiculo_id);
    setValue('fecha_hora',       fechaFormateada);
    setValue('tipo_combustible', abastecimiento.tipo_combustible);
    setValue('km_actual',        abastecimiento.km_actual);
    setValue('cantidad',         abastecimiento.cantidad);
    setValue('precio_unitario',  abastecimiento.precio_unitario);
    setValue('grifo_nombre',     abastecimiento.grifo_nombre);
    setValue('grifo_ruc',        abastecimiento.grifo_ruc      || '');
    setValue('factura_boleta',   abastecimiento.factura_boleta || '');
    setValue('observaciones',    abastecimiento.observaciones  || '');
    setShowForm(true);
  };

  /**
   * Muestra el formulario para crear un nuevo abastecimiento
   */
  const handleNuevoAbastecimiento = () => {
    setEditingId(null);
    reset(); // Limpiar formulario
    
    // Precargar datos del vehículo
    setValue('vehiculo_id', currentVehicle?.id || '');
    setValue('km_actual', currentVehicle?.kilometraje_actual || '');
    
    setShowForm(true);
    setUsarFechaActual(false);
  };

  /**
   * Muestra los datos de un abastecimiento en vista readonly (doble click)
   *
   * @param {Object} abastecimiento - Objeto del registro a ver
   */
  const handleViewOnly = (abastecimiento) => {
    setViewOnlyData(abastecimiento);
    setShowViewOnly(true);
  };

  /**
   * Cierra la vista readonly
   */
  const handleCloseViewOnly = () => {
    setShowViewOnly(false);
    setViewOnlyData(null);
  };

  // Agregar onVehicleUpdate a las props del componente

  // ─── Helpers de rangos de fechas ─────────────────────────────────────────────

  /** Establece el filtro de fechas en el día de hoy (solo fecha) */
  const setRangoHoy = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    setFilters(prev => ({
      ...prev,
      fecha_inicio: today,
      fecha_fin:    today
    }));
  };

  /** Establece el filtro de fechas en los últimos 7 días (solo fecha) */
  const setRangoUltimaSemana = () => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFilters(prev => ({
      ...prev,
      fecha_inicio: formatDate(lastWeek),
      fecha_fin:    formatDate(now)
    }));
  };

  /** Establece el filtro de fechas en los últimos 30 días (solo fecha) */
  const setRangoUltimoMes = () => {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFilters(prev => ({
      ...prev,
      fecha_inicio: formatDate(lastMonth),
      fecha_fin:    formatDate(now)
    }));
  };

  /**
   * Actualiza un campo del estado de filtros.
   * Backend necesita solo fecha en formato YYYY-MM-DD (sin hora).
   *
   * @param {string} field - Nombre del campo ('fecha_inicio' | 'fecha_fin')
   * @param {string} value - Valor del input date en formato YYYY-MM-DD
   */
  const handleFilterChange = (field, value) => {
    // Backend necesita solo fecha, sin hora ni tiempo
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Aplica los filtros actuales y recarga la lista desde la primera página.
   * Se llama al presionar el botón "Filtrar".
   */
  const handleFilter = async () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    await cargarAbastecimientos();
  };

  /**
   * Cambia la página actual. El useEffect #4 reacciona y llama a cargarAbastecimientos.
   *
   * @param {number} newPage - Número de página destino
   */
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // ─── Cálculo reactivo del importe total ──────────────────────────────────────
  // watch() suscribe a los campos en tiempo real para mostrar el total mientras el usuario escribe
  const cantidad       = watch('cantidad');
  const precioUnitario = watch('precio_unitario');
  const importeTotal   = (cantidad && precioUnitario)
    ? (parseFloat(cantidad) * parseFloat(precioUnitario)).toFixed(2)
    : '0.00';

  // ─── Guard de render ──────────────────────────────────────────────────────────
  // No renderizar nada si el modal está cerrado o no se pasó un vehículo
  if (!isOpen || !vehicle) return null;

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">

        {/* ── Backdrop oscuro — click cierra el modal ── */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* ── Contenedor principal del modal ── */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto my-4">

          {/* ════════════════════════════════════
              HEADER
              ════════════════════════════════════ */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Abastecimientos de {currentVehicle?.placa || 'Vehículo'}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span>{currentVehicle?.tipoVehiculo?.nombre || currentVehicle?.tipo_vehiculo?.nombre || 'Vehículo'}</span>
                <span className="text-gray-400">-</span>
                <span className="font-medium">{currentVehicle?.placa || 'N/A'}</span>
                <span className="text-gray-400">-</span>
                <span>{currentVehicle?.marca || 'N/A'} {currentVehicle?.modelo_vehiculo || ''}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* ════════════════════════════════════
              FICHA DEL VEHÍCULO
              ════════════════════════════════════ */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Código:</span>
                <span className="text-gray-900 dark:text-white ml-1">{vehicle.codigo_vehiculo}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Documento:</span>
                <span className="text-gray-900 dark:text-white ml-1">
                  {vehicle.conductorAsignado
                    ? `${vehicle.conductorAsignado.doc_tipo} ${vehicle.conductorAsignado.doc_numero}`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Conductor:</span>
                <span className="text-gray-900 dark:text-white ml-1">
                  {vehicle.conductorAsignado
                    ? `${vehicle.conductorAsignado.nombres} ${vehicle.conductorAsignado.apellido_paterno} ${vehicle.conductorAsignado.apellido_materno || ''}`
                    : 'Sin asignar'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Año:</span>
                <span className="text-gray-900 dark:text-white ml-1">{vehicle.anio_vehiculo || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Color:</span>
                <span className="text-gray-900 dark:text-white ml-1">{vehicle.color_vehiculo || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Kilometraje:</span>
                <span className="text-gray-900 dark:text-white ml-1">
                  {currentVehicle.kilometraje_actual?.toLocaleString() || 'N/A'} km
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                <span className={`ml-1 px-2 py-1 rounded text-xs font-medium ${
                  vehicle.estado_operativo === 'DISPONIBLE'    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                  vehicle.estado_operativo === 'EN_SERVICIO'   ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  vehicle.estado_operativo === 'MANTENIMIENTO' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                }`}>
                  {vehicle.estado_operativo}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700 dark:text-gray-300">Capacidad:</span>
                <span className="text-gray-900 dark:text-white ml-1">
                  {vehicle.capacidad_combustible || 'N/A'} L
                  {vehicle.capacidad_combustible && (
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      ({(vehicle.capacidad_combustible / 3.785).toFixed(1)} gal)
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════
              CUERPO: dos paneles lado a lado
              ════════════════════════════════════ */}
          <div className="flex flex-col lg:flex-row">

            {/* ════════════════════════════════════════════════════════
                PANEL IZQUIERDO — Lista de abastecimientos (cards)
                ════════════════════════════════════════════════════════ */}
            <div className="flex-1 p-6 border-r border-gray-200 dark:border-gray-700">

              {/* ── Filtros rápidos por rango de fechas ── */}
              <div className="mb-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={setRangoHoy}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={setRangoUltimaSemana}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
                  >
                    Última Semana
                  </button>
                  <button
                    onClick={setRangoUltimoMes}
                    className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-xs"
                  >
                    Último Mes
                  </button>
                  {/* Quita el filtro de fechas y muestra todos los registros del vehículo */}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, fecha_inicio: '', fecha_fin: '' }))}
                    className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-xs"
                  >
                    Todos
                  </button>
                </div>

                {/* ── Filtro manual por rango de fechas ── */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <input
                      type="date"
                      placeholder="Fecha inicio"
                      // Backend usa solo fecha, input usa mismo formato
                      value={filters.fecha_inicio || ''}
                      onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      placeholder="Fecha fin"
                      // Backend usa solo fecha, input usa mismo formato
                      value={filters.fecha_fin || ''}
                      onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={handleFilter}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-sm"
                    >
                      <Filter size={16} />
                      Filtrar
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Lista de cards con scroll interno ── */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">

                {loading ? (
                  /* Estado: cargando */
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
                    <span className="ml-3 text-sm text-gray-500">Cargando registros...</span>
                  </div>

                ) : error ? (
                  /* Estado: error de red o del servidor */
                  <div className="text-center py-8 text-red-600 text-sm">{error}</div>

                ) : !Array.isArray(abastecimientos) || abastecimientos.length === 0 ? (
                  /* Estado: sin registros */
                  <div className="text-center py-12">
                    <Fuel size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm">No se encontraron abastecimientos</p>
                    <p className="text-gray-400 text-xs mt-1">Crea el primer registro usando el formulario →</p>
                  </div>

                ) : (
                  /* Estado: lista de cards */
                  <div className="space-y-3">
                    {abastecimientos.map((ab) => (
                      <div
                        key={ab.id}
                        className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-700 dark:to-gray-600 border border-primary-200 dark:border-gray-500 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onDoubleClick={() => handleViewOnly(ab)}
                      >
                        {/* Fila superior: fecha + botones acción */}
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {formatFechaHora(ab.fecha_hora)}
                          </h4>
                          <div className="flex gap-2">
                            {/* Botón Editar - solo si tiene permiso de actualización */}
                            {canUpdate && (
                              <button
                                title="Editar"
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar que se active el doble click
                                  handleEdit(ab);
                                }}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit2 size={16} />
                              </button>
                            )}
                            {/* Botón Eliminar - solo si tiene permiso de eliminación */}
                            {canDelete && (
                              <button
                                title="Eliminar"
                                onClick={(e) => {
                                  e.stopPropagation(); // Evitar que se active el doble click
                                  handleDelete(ab.id);
                                }}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Grid de datos principales */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Tipo: </span>
                            <span className="text-gray-900 dark:text-white font-medium">{ab.tipo_combustible}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">KM: </span>
                            <span className="text-gray-900 dark:text-white">
                              {ab.km_actual?.toLocaleString() || '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Cantidad: </span>
                            <span className="text-gray-900 dark:text-white">{ab.cantidad} L</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Precio: </span>
                            <span className="text-gray-900 dark:text-white">
                              S/. {parseFloat(ab.precio_unitario).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Fila inferior: grifo + importe total destacado */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            <span>Grifo: </span>
                            <span className="text-gray-800 dark:text-gray-200">{ab.grifo_nombre}</span>
                            {ab.factura_boleta && (
                              <span className="ml-2 text-xs text-gray-400">· {ab.factura_boleta}</span>
                            )}
                          </div>
                          {/* Importe total calculado en tiempo real */}
                          <span className="text-base font-semibold text-primary-600 dark:text-primary-400">
                            S/. {parseFloat(ab.cantidad * ab.precio_unitario).toFixed(2)}
                          </span>
                        </div>

                        {/* Observaciones (solo si existen) */}
                        {ab.observaciones && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">
                            {ab.observaciones}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Paginación (visible solo si hay más de una página) ── */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Página {pagination.page} de {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════
                PANEL DERECHO — Formulario crear / editar
                ════════════════════════════════════════════════════════ */}
            <div className="w-full lg:w-[420px] p-6 flex-shrink-0">

              {/* Cabecera del panel con título dinámico */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {editingId ? 'Editar Abastecimiento' : 'Nuevo Abastecimiento'}
                </h3>
                {showForm && (
                  <button
                    onClick={() => { reset(); setShowForm(false); setEditingId(null); }}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {showForm ? (
                /* ────────────────────────────────────────────
                   FORMULARIO
                   El segundo argumento de handleSubmit (onError)
                   captura los errores de Zod y los muestra en consola
                   y como toast para facilitar el debug.
                   ──────────────────────────────────────────── */
                <form
                  onSubmit={handleSubmit(onSubmit, (erroresZod) => {
                    console.error('[AbastecimientoModal] Errores Zod:', erroresZod);
                    // Mostrar el primer error como toast para feedback inmediato al usuario
                    const primerCampo = Object.keys(erroresZod)[0];
                    if (primerCampo) {
                      toast.error(`${primerCampo}: ${erroresZod[primerCampo].message}`);
                    }
                  })}
                  className="space-y-4"
                >

                  {/* Campo: Fecha y Hora */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha y Hora <span className="text-red-500">*</span>
                    </label>
                    {/* Checkbox para autocompletar con la hora actual */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="usarFechaActual"
                        checked={usarFechaActual}
                        onChange={(e) => setUsarFechaActual(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="usarFechaActual" className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Usar fecha y hora actual
                      </label>
                    </div>
                    <input
                      type="datetime-local"
                      {...register('fecha_hora')}
                      disabled={usarFechaActual} // Se deshabilita cuando el checkbox está activo
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {errors.fecha_hora && (
                      <p className="text-red-500 text-xs mt-1">{errors.fecha_hora.message}</p>
                    )}
                  </div>

                  {/* Fila: Tipo combustible + KM actual */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tipo Combustible <span className="text-red-500">*</span>
                      </label>
                      <select
                        {...register('tipo_combustible')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seleccionar...</option>
                        {tiposCombustible.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                        ))}
                      </select>
                      {errors.tipo_combustible && (
                        <p className="text-red-500 text-xs mt-1">{errors.tipo_combustible.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        KM Actual <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        {...register('km_actual', {
                          required:      'El kilometraje es requerido',
                          min:           { value: 0, message: 'Debe ser ≥ 0' },
                          valueAsNumber: true
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.km_actual && (
                        <p className="text-red-500 text-xs mt-1">{errors.km_actual.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Fila: Cantidad (litros) + Precio unitario */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cantidad (L) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register('cantidad', {
                          required:      'Requerido',
                          min:           { value: 0.01, message: 'Debe ser > 0' },
                          valueAsNumber: true
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.cantidad && (
                        <p className="text-red-500 text-xs mt-1">{errors.cantidad.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Precio (S/) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register('precio_unitario', {
                          required:      'Requerido',
                          min:           { value: 0.01, message: 'Debe ser > 0' },
                          valueAsNumber: true
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                      {errors.precio_unitario && (
                        <p className="text-red-500 text-xs mt-1">{errors.precio_unitario.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Fila: Nombre del grifo + RUC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Grifo <span className="text-red-500">*</span>
                      </label>
                      <GrifoAutocomplete
                        value={watch('grifo_nombre') || ''}
                        onChange={(value) => setValue('grifo_nombre', value)}
                        error={errors.grifo_nombre?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        RUC Grifo
                      </label>
                      <input
                        type="text"
                        {...register('grifo_ruc')}
                        placeholder="Opcional"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Factura / Boleta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Factura / Boleta
                    </label>
                    <input
                      type="text"
                      {...register('factura_boleta')}
                      placeholder="Número de comprobante (opcional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Observaciones */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      {...register('observaciones')}
                      rows={2}
                      placeholder="Notas adicionales..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Importe total calculado + botones de acción */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total:{' '}
                      <span className="font-semibold text-primary-600 dark:text-primary-400">
                        S/. {importeTotal}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setEditingId(null);
                          reset();
                          setUsarFechaActual(false);
                        }}
                        className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {isSubmitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
                      </button>
                    </div>
                  </div>
                </form>

              ) : (
                /* Estado: placeholder cuando el formulario está oculto */
                <div className="text-center py-8">
                  <Fuel size={36} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm mb-4">Registra un nuevo abastecimiento</p>
                  {/* Botón de creación - solo si tiene permiso */}
                  {canCreate && (
                    <button
                      onClick={handleNuevoAbastecimiento}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-primary-600 text-white border border-transparent rounded-md hover:bg-primary-700"
                    >
                      <Plus size={16} />
                      Nuevo Abastecimiento
                    </button>
                  )}
                  {!canCreate && (
                    <p className="text-gray-400 text-xs mt-2">No tienes permisos para crear abastecimientos</p>
                  )}
                </div>
              )}
            </div>

          </div>{/* fin flex row (dos paneles) */}
        </div>{/* fin modal container */}
      </div>

      {/* Modal de vista readonly */}
      <ViewOnlyModal
        isOpen={showViewOnly}
        onClose={handleCloseViewOnly}
        abastecimiento={viewOnlyData}
        vehicle={vehicle}
      />
      
      {/* Indicador de carga */}
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * Componente de autocompletar para grifos
 */
function GrifoAutocomplete({ value, onChange, error }) {
  const [_sugerencias, setSugerencias] = useState([]);
  const [_isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Función para buscar sugerencias
  const buscarSugerencias = async (query) => {
    if (query.length < 2) {
      setSugerencias([]);
      return;
    }

    setLoading(true);
    try {
      const { getSugerenciasGrifos } = await import('../../services/abastecimientosService.js');
      const resultados = await getSugerenciasGrifos(query);
      
      // Extraer sugerencias de la estructura correcta
      const sugerenciasExtraidas = resultados?.data?.sugerencias || resultados || [];
      setSugerencias(sugerenciasExtraidas);
      setIsOpen(true);
    } catch (error) {
      console.error('Error buscando grifos:', error);
      setSugerencias([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el input con debounce
  const handleChange = (e) => {
    const valor = e.target.value.toUpperCase(); // Convertir a mayúsculas
    onChange(valor);
    
    // Limpiar debounce anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Nuevo debounce
    debounceRef.current = setTimeout(() => {
      buscarSugerencias(valor);
    }, 300);
  };

  // Seleccionar una sugerencia
  const _seleccionarSugerencia = (grifo) => {
    onChange(grifo.grifo_nombre);
    setIsOpen(false);
    setSugerencias([]);
  };

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={inputRef}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="Ej: REPSOL, PRIMAX"
        className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      
      {/* Indicador de carga */}
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Dropdown de sugerencias */}
      {_isOpen && _sugerencias.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
          {_sugerencias.map((grifo, index) => (
            <div
              key={grifo.id || index}
              onClick={() => _seleccionarSugerencia(grifo)}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {grifo.grifo_nombre}
                </div>
                {grifo.grifo_ruc && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    RUC: {grifo.grifo_ruc}
                  </div>
                )}
              </div>
              {grifo.frecuencia_uso && (
                <div className="text-xs text-gray-400">
                  {grifo.frecuencia_uso} usos
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * Modal de vista readonly para abastecimientos
 */
function ViewOnlyModal({ isOpen, onClose, abastecimiento, vehicle }) {
  // Hook para cerrar con tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // Prevenir que el ESC llegue al modal principal
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape, true); // true para capturar en fase de captura
    }

    return () => {
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !abastecimiento) return null;

  const importeTotal = (parseFloat(abastecimiento.cantidad) * parseFloat(abastecimiento.precio_unitario)).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4">
          {/* Header con información del vehículo */}
          <div className="bg-primary-700 dark:bg-primary-800 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Fuel size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Detalles de Abastecimiento
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-primary-100 mt-1">
                    <span>{abastecimiento?.vehiculo?.tipo_vehiculo?.nombre || vehicle?.tipo_vehiculo?.nombre || 'Vehículo'}</span>
                    <span className="text-primary-200">-</span>
                    <span className="font-medium">{abastecimiento?.vehiculo?.placa || vehicle?.placa || 'N/A'}</span>
                    <span className="text-primary-200">-</span>
                    <span>{abastecimiento?.vehiculo?.marca || vehicle?.marca?.nombre || 'N/A'} {abastecimiento?.vehiculo?.modelo_vehiculo || vehicle?.modelo?.nombre || ''}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-primary-200 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Fecha del abastecimiento */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <Calendar size={16} />
                <span>Fecha y hora del abastecimiento:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatFechaHora(abastecimiento.fecha_hora)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Columna izquierda */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Combustible
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {abastecimiento.tipo_combustible}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kilometraje Actual
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {abastecimiento.km_actual?.toLocaleString() || 'N/A'} km
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {abastecimiento.cantidad} {abastecimiento.unidad || 'LITROS'}
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      ({(parseFloat(abastecimiento.cantidad) * 0.264172).toFixed(2)} galones)
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio Unitario
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    S/. {parseFloat(abastecimiento.precio_unitario).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grifo
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {abastecimiento.grifo_nombre}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    RUC de Grifo
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {abastecimiento.grifo_ruc || 'No especificado'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Factura/Boleta
                  </label>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {abastecimiento.factura_boleta || 'No especificado'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Importe Total
                  </label>
                  <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    S/. {importeTotal}
                  </p>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {abastecimiento.observaciones && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones
                </label>
                <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                  {abastecimiento.observaciones}
                </p>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
