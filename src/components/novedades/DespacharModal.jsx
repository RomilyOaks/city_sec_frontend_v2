/**
 * File: src/components/novedades/DespacharModal.jsx
 * @version 1.1.0
 * @description Modal mejorado para despachar novedad con:
 * - Info del turno activo en header
 * - Pestañas READ-ONLY con datos de la novedad
 * - Pestaña de recursos editables
 * - Observaciones para historial
 * - Cronómetro de fecha/hora en tiempo real
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  Truck,
  Clock,
  MapPin,
  FileText,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import { getHorarioActivo } from "../../services/horariosTurnosService.js";
import {
  getTurnoActivo,
  findOrCreateOperativoTurno,
  getVehiculosDisponiblesParaDespacho,
  findOrCreateVehiculoEnTurno,
  findOrCreateCuadranteEnVehiculo,
  findOrCreateNovedadEnCuadrante,
  despacharPersonalAPieWrapper,
  mostrarErroresEspecificos,
} from "../../services/operativosHelperService.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { updateNovedad } from "../../services/novedadesService.js";
import { geocodificarDireccion } from "../../services/direccionesService.js";
import UbicacionMiniMapa from "../UbicacionMiniMapa";

/**
 * Obtiene la fecha/hora actual local en formato "YYYY-MM-DD HH:mm:ss" (sin Z).
 * El backend interpreta este formato como hora local Peru sin conversión timezone.
 */
const getLocalDatetime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * Obtiene la fecha actual local en formato YYYY-MM-DD
 * Compatible con backend que usa timezone America/Lima
 */
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calcula la fecha correcta para un turno que puede cruzar medianoche
 * @param {Object} turnoActivo - Datos del turno activo desde backend
 * @param {string} fechaLocal - Fecha local actual (YYYY-MM-DD)
 * @returns {string} Fecha correcta para el operativo (YYYY-MM-DD)
 */
const getFechaCorrectaParaTurno = (turnoActivo, fechaLocal) => {
  // Si el backend ya envía la fecha, usarla
  if (turnoActivo?.fecha) {
    return turnoActivo.fecha;
  }
  
  // Si el turno no cruza medianoche, usar fecha local
  if (!turnoActivo?.cruza_medianoche) {
    return fechaLocal;
  }
  
  // Si el turno cruza medianoche, calcular la fecha de inicio
  const horaActual = turnoActivo?.hora_actual || "00:00:00";
  const horaInicio = turnoActivo?.hora_inicio || "00:00:00";
  
  // Convertir a minutos para comparación
  const [hActual, mActual] = horaActual.split(':').map(Number);
  const [hInicio, mInicio] = horaInicio.split(':').map(Number);
  
  const minutosActuales = hActual * 60 + mActual;
  const minutosInicio = hInicio * 60 + mInicio;
  
  // Si la hora actual es anterior a la hora de inicio, el turno empezó el día anterior
  if (minutosActuales < minutosInicio) {
    const fecha = new Date(fechaLocal);
    fecha.setDate(fecha.getDate() - 1); // Restar un día
    const fechaAnterior = fecha.toISOString().split('T')[0];
    return fechaAnterior;
  }
  
  // Si no, usar fecha local
  return fechaLocal;
};

/**
 * DespacharModal - Modal para despachar novedad enlazado con Operativos
 */
export default function DespacharModal({
  isOpen,
  onClose,
  novedad,
  vehiculos = [],
  personalSeguridad = [],
  unidadesOficina = [],
  onSubmit,
}) {
  // Obtener usuario autenticado
  const user = useAuthStore((s) => s.user);

  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  // Estado del turno activo
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [loadingTurno, setLoadingTurno] = useState(true);
  const [errorTurno, setErrorTurno] = useState(null);

  // Estado para operativos y vehículos
  const [OPERATIVO_TURNO, setOperativoTurno] = useState(null);
  const [vehiculosDisponibles, setVehiculosDisponibles] = useState([]);
  const [personalDisponible, setPersonalDisponible] = useState([]); // 🔥 NUEVO
  const [loadingOperativos, setLoadingOperativos] = useState(false);

  // Estado para ajuste de coordenadas en el mapa
  const [editedCoordinates, setEditedCoordinates] = useState(null);
  const [savingCoordinates, setSavingCoordinates] = useState(false);

  // Pestaña activa: 0=Info General, 1=Ubicación, 2=Recursos (editable)
  const [activeTab, setActiveTab] = useState(2); // Por defecto en Recursos

  // Cronómetro de fecha/hora actual
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const timerRef = useRef(null);

  // Datos del formulario (solo recursos y observaciones son editables)
  const [formData, setFormData] = useState({
    vehiculo_id: "",
    personal_cargo_id: "",
    personal_seguridad2_id: "",
    observaciones_despacho: "",
    unidad_oficina_id: "1", // Pre-cargado con id=1 por defecto
  });

  const [saving, setSaving] = useState(false);

  const fetchTurnoActivo = async () => {
    setLoadingTurno(true);
    setErrorTurno(null);
    try {
      const response = await getHorarioActivo();
      if (response.success && response.data) {
        setTurnoActivo(response.data);
      } else {
        setErrorTurno("No hay turno activo en este momento");
        setTurnoActivo(null);
      }
    } catch (err) {
      console.error("Error al obtener turno activo:", err);
      if (err.response?.status === 404) {
        setErrorTurno(err.response?.data?.message || "No hay turno activo");
        if (err.response?.data?.data?.horarios_disponibles) {
          setTurnoActivo({
            esta_en_turno: false,
            horarios_disponibles: err.response.data.data.horarios_disponibles,
            hora_actual: err.response.data.data.hora_actual,
          });
        }
      } else {
        setErrorTurno("Error al consultar turno activo");
      }
    } finally {
      setLoadingTurno(false);
    }
  };

  const loadOperativosData = useCallback(async () => {
    if (!novedad?.sector_id || !turnoActivo?.turno) {
      return;
    }

    setLoadingOperativos(true);
    try {
      const today = getLocalDate();
      const fechaOperativo = getFechaCorrectaParaTurno(turnoActivo, today);

      // Buscar o crear operativo de turno
      const operativo = await findOrCreateOperativoTurno(
        fechaOperativo,
        turnoActivo.turno,
        novedad.sector_id,
        user?.personal_seguridad_id,
        null
      );

      setOperativoTurno(operativo);

      // Obtener vehículos disponibles
      const vehiculosDisp = await getVehiculosDisponiblesParaDespacho();
      setVehiculosDisponibles(vehiculosDisp);

      // Usar todo el personal activo (fallback)
      setPersonalDisponible([]);
    } catch (error) {
      console.error("Error cargando datos de operativos:", error);
      toast.error("Error al cargar datos de operativos");
    } finally {
      setLoadingOperativos(false);
    }
  }, [novedad?.sector_id, turnoActivo?.turno, user?.personal_seguridad_id, getLocalDate]);

  const initializeForm = useCallback(() => {
    setFormData({
      vehiculo_id: "",
      personal_cargo_id: "",
      personal_seguridad2_id: "",
      observaciones_despacho: "",
      unidad_oficina_id: "1", // Por defecto id=1
    });
  }, []);

  // Cargar turno activo, operativo de turno y vehículos disponibles al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchTurnoActivo();
      initializeForm();
      // loadOperativosData se ejecutará cuando turnoActivo esté disponible (ver siguiente useEffect)
      // Iniciar cronómetro
      timerRef.current = setInterval(() => {
        setCurrentDateTime(new Date());
      }, 1000);
    } else {
      // Limpiar cronómetro al cerrar
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, initializeForm]);

  // Cargar datos de operativos cuando turnoActivo esté disponible
  useEffect(() => {
    if (isOpen && turnoActivo?.turno) {
      loadOperativosData();
    }
  }, [isOpen, turnoActivo?.turno, loadOperativosData]);

  // Handler para ajustar coordenadas desde el mapa
  const handleCoordinatesChange = useCallback(async (newLat, newLng) => {
    if (!novedad?.id) {
      toast.error("No se puede actualizar: falta ID de la novedad");
      return;
    }

    setSavingCoordinates(true);
    try {
      // 1. Actualizar coordenadas en la novedad
      await updateNovedad(novedad.id, {
        latitud: newLat,
        longitud: newLng,
      });

      // 2. Si tiene dirección asociada, actualizar también
      if (novedad.direccion_id) {
        await geocodificarDireccion(novedad.direccion_id, {
          latitud: newLat,
          longitud: newLng,
          fuente: "Ajuste manual en mapa",
        });
      }

      setEditedCoordinates({ latitud: newLat, longitud: newLng });
      toast.success("Ubicación actualizada correctamente");
    } catch (error) {
      console.error("Error al actualizar coordenadas:", error);
      toast.error(error.response?.data?.message || "Error al actualizar la ubicación");
      setEditedCoordinates(null);
    } finally {
      setSavingCoordinates(false);
    }
  }, [novedad?.id, novedad?.direccion_id]);

  const handleClose = useCallback(() => {
    if (saving) return;
    setFormData({
      vehiculo_id: "",
      personal_cargo_id: "",
      personal_seguridad2_id: "",
      observaciones_despacho: "",
      unidad_oficina_id: "1",
    });
    setActiveTab(2);
    setEditedCoordinates(null);
    onClose();
  }, [saving, onClose]);

  // Manejar tecla ESC y ALT+G
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        handleClose();
      }
      if (e.altKey && e.key.toLowerCase() === "g") {
        if (saving) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        const form = document.querySelector("form[data-despachar-form]");
        if (form) {
          form.requestSubmit();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, saving, handleClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (saving) return;

    // Validaciones
    if (!formData.vehiculo_id && !formData.personal_cargo_id) {
      toast.error("Debe seleccionar al menos un vehículo o personal");
      setActiveTab(2);
      return;
    }

    // Validar que la novedad tenga sector asignado (requerido para crear operativo)
    if (!novedad?.sector_id) {
      toast.error("La novedad no tiene sector asignado. Edite la novedad y asigne un sector antes de despachar.");
      return;
    }

    // Validar personal duplicado
    const personalIds = [
      formData.personal_cargo_id,
      formData.personal_seguridad2_id,
    ].filter((id) => id && id !== "");
    const uniqueIds = new Set(personalIds);
    if (personalIds.length !== uniqueIds.size) {
      toast.error("No puede asignar la misma persona en múltiples campos");
      setActiveTab(2);
      return;
    }

    setSaving(true);
    try {
      // Obtener turno activo actual
      let turnoActual = await getTurnoActivo();

      // Si getTurnoActivo retorna undefined, reintentar una vez
      if (!turnoActual?.turno) {
        await new Promise(resolve => setTimeout(resolve, 500));
        turnoActual = await getTurnoActivo();
      }

      // Si sigue sin turno, usar el que se cargó al abrir el modal
      if (!turnoActual?.turno && turnoActivo?.turno) {
        turnoActual = { turno: turnoActivo.turno };
      }

      if (!turnoActual?.turno) {
        throw new Error("No se pudo determinar el turno activo");
      }

      const datosTurno = turnoActivo;
      const today = getLocalDate();
      const fechaOperativo = getFechaCorrectaParaTurno(datosTurno, today);

      // Buscar o crear operativo de turno
      const operativoActualizado = await findOrCreateOperativoTurno(
        fechaOperativo,
        datosTurno.turno,
        novedad.sector_id,
        user?.personal_seguridad_id,
        null
      );

      // Si se seleccionó vehículo, crear registros en operativos
      if (formData.vehiculo_id) {
        // Obtener datos del vehículo seleccionado para pre-poblar campos
        const vehiculoSeleccionado =
          vehiculosDisponibles.find((v) => v.id == formData.vehiculo_id) ||
          vehiculos.find((v) => v.id == formData.vehiculo_id);

        const vehiculoExtraData = {};
        if (vehiculoSeleccionado?.conductor_asignado_id) {
          vehiculoExtraData.conductor_id = vehiculoSeleccionado.conductor_asignado_id;
        }
        if (vehiculoSeleccionado?.radio_tetra_id || novedad?.radio_tetra_id) {
          vehiculoExtraData.radio_tetra_id =
            vehiculoSeleccionado?.radio_tetra_id ?? novedad.radio_tetra_id;
        }
        const kmInicio = vehiculoSeleccionado?.kilometraje_actual ?? 0;

        const vehiculoOperativo = await findOrCreateVehiculoEnTurno(
          operativoActualizado.id,
          Number(formData.vehiculo_id),
          kmInicio,
          vehiculoExtraData
        );

        const cuadranteAsignado = await findOrCreateCuadranteEnVehiculo(
          operativoActualizado.id,
          vehiculoOperativo.id,
          novedad.cuadrante_id
        );

        try {
          await findOrCreateNovedadEnCuadrante(
            operativoActualizado.id,
            vehiculoOperativo.id,
            cuadranteAsignado.id,
            {
              novedad_id: novedad.id,
              prioridad_actual: novedad.prioridad_actual,
              fecha_despacho: getLocalDatetime(),
              observaciones: formData.observaciones_despacho
            }
          );
        } catch (error) {
          if (error.message === "Novedad ya fue reportada para este cuadrante") {
            toast.error("Novedad ya fue reportada para este cuadrante");
            return;
          }
          throw error;
        }
      }

      // Si se seleccionó personal, despachar patrullaje a pie
      if (formData.personal_cargo_id) {
        try {
          const novedadDataForPersonal = {
            id: novedad.id,
            personal_cargo_id: formData.personal_cargo_id,
            cuadrante_id: novedad.cuadrante_id,
            prioridad_actual: novedad.prioridad_actual || 'MEDIA',
            turno_id: operativoActualizado.id,
            observaciones: formData.observaciones_despacho || `Despacho personal - ${new Date().toLocaleString()}`
          };

          await despacharPersonalAPieWrapper(novedadDataForPersonal);
        } catch (personalError) {
          console.error("Error despachando personal:", personalError);
          throw new Error(`Error en personal: ${personalError.message}`);
        }
      }

      // Usar fecha/hora actual sin Z (backend interpreta como hora local Peru)
      const fechaDespachoActual = getLocalDatetime();

      // Construir payload para el backend de novedades
      const payload = {
        estado_novedad_id: 2,
        fecha_despacho: fechaDespachoActual,
        observaciones: formData.observaciones_despacho || "",
        novedad_id: novedad?.id,
        estado_anterior_id: novedad?.estado_novedad_id || 1,
        turno_activo: turnoActual?.turno || null,
        operativo_turno_id: operativoActualizado.id,
      };

      if (formData.unidad_oficina_id) {
        payload.unidad_oficina_id = Number(formData.unidad_oficina_id);
      }
      if (formData.vehiculo_id) {
        payload.vehiculo_id = Number(formData.vehiculo_id);
      }
      if (formData.personal_cargo_id) {
        payload.personal_cargo_id = Number(formData.personal_cargo_id);
      }
      if (formData.personal_seguridad2_id) {
        payload.personal_seguridad2_id = Number(formData.personal_seguridad2_id);
      }

      // Mensaje de éxito combinado para ambos recursos
      const mensajesExito = [];
      if (formData.vehiculo_id) {
        mensajesExito.push("Vehículo despachado correctamente");
      }
      if (formData.personal_cargo_id) {
        mensajesExito.push("Personal despachado a pie correctamente");
      }

      if (mensajesExito.length > 0) {
        toast.success(mensajesExito.join(" y "));
      }

      await onSubmit(payload);
      handleClose();
    } catch (error) {
      console.error("Error al despachar:", error);
      
      // 🔥 Usar utilidad genérica de manejo de errores
      mostrarErroresEspecificos(error, "Error al despachar novedad");
    } finally {
      setSaving(false);
    }
  };

  // Formatear fecha para mostrar
  const formatFecha = (fecha) => {
    if (!fecha) return "—";
    try {
      const d = new Date(fecha);
      return d.toLocaleDateString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  // Formatear fecha/hora del cronómetro
  const formatCronometro = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* =============================================== */}
        {/* HEADER CON INFO DEL TURNO ACTIVO */}
        {/* =============================================== */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Truck className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Despachar Novedad
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {novedad?.novedad_code || "—"}
                  </p>
                  {novedad?.prioridad_actual && (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        novedad.prioridad_actual === "ALTA"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : novedad.prioridad_actual === "MEDIA"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}
                    >
                      {novedad.prioridad_actual}
                    </span>
                  )}
                </div>
                {(novedad?.localizacion || novedad?.referencia_ubicacion) && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5 truncate max-w-md" title={
                    novedad.localizacion
                      ? novedad.referencia_ubicacion
                        ? `${novedad.localizacion} (${novedad.referencia_ubicacion})`
                        : novedad.localizacion
                      : novedad.referencia_ubicacion
                  }>
                    <MapPin size={12} className="inline mr-1" />
                    {novedad.localizacion
                      ? novedad.referencia_ubicacion
                        ? `${novedad.localizacion} (${novedad.referencia_ubicacion})`
                        : novedad.localizacion
                      : novedad.referencia_ubicacion}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          {/* Banner del Turno Activo */}
          <div
            className={`rounded-lg p-3 ${
              loadingTurno
                ? "bg-slate-100 dark:bg-slate-800"
                : turnoActivo?.esta_en_turno
                ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800"
                : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
            }`}
          >
            {loadingTurno ? (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Consultando turno activo...</span>
              </div>
            ) : turnoActivo?.esta_en_turno ? (
              <div className="flex items-center gap-3">
                <CheckCircle
                  size={20}
                  className="text-emerald-600 dark:text-emerald-400"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Turno Activo: {turnoActivo.turno}
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">
                    Horario: {turnoActivo.hora_inicio} - {turnoActivo.hora_fin}
                    {turnoActivo.cruza_medianoche
                      ? " (cruza medianoche)"
                      : ""}{" "}
                    | Hora actual: {turnoActivo.hora_actual}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertCircle
                  size={20}
                  className="text-amber-600 dark:text-amber-400"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    {errorTurno || "No hay turno activo"}
                  </p>
                  {turnoActivo?.hora_actual && (
                    <p className="text-xs text-amber-600 dark:text-amber-300">
                      Hora actual: {turnoActivo.hora_actual}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =============================================== */}
        {/* TABS */}
        {/* =============================================== */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => setActiveTab(0)}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 0
                ? "text-primary-600 border-b-2 border-primary-600 bg-white dark:bg-slate-900"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <FileText size={16} />
            Info General
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 1
                ? "text-primary-600 border-b-2 border-primary-600 bg-white dark:bg-slate-900"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <MapPin size={16} />
            Ubicación
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
              activeTab === 2
                ? "text-primary-600 border-b-2 border-primary-600 bg-white dark:bg-slate-900"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Users size={16} />
            Recursos
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
              Editable
            </span>
          </button>
        </div>

        {/* =============================================== */}
        {/* CONTENT */}
        {/* =============================================== */}
        <form
          onSubmit={handleSubmit}
          data-despachar-form
          className="flex-1 overflow-y-auto"
        >
          <div className="p-6">
            {/* ===================== TAB 0: INFO GENERAL (READ-ONLY) ===================== */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={16} className="text-slate-400" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Información de solo lectura
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Código
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {novedad?.novedad_code || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Estado Actual
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {novedad?.novedadEstado?.nombre || "Pendiente De Registro"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Tipo de Novedad
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {novedad?.novedadTipoNovedad?.nombre || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Subtipo
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {novedad?.novedadSubtipoNovedad?.nombre || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Prioridad
                    </label>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        novedad?.prioridad_actual === "ALTA"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : novedad?.prioridad_actual === "MEDIA"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      }`}
                    >
                      {novedad?.prioridad_actual || "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Fecha Registro
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {formatFecha(novedad?.fecha_hora_registro || novedad?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Descripción
                  </label>
                  <p className="text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                    {novedad?.descripcion || "—"}
                  </p>
                </div>

                {novedad?.observaciones && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Observaciones Registradas
                    </label>
                    <p className="text-slate-900 dark:text-slate-50 whitespace-pre-wrap">
                      {novedad.observaciones}
                    </p>
                  </div>
                )}

                {/* Info del comunicante/reportante */}
                {(novedad?.comunicante_nombre || novedad?.comunicante_telefono || novedad?.reportante_nombre || novedad?.reportante_telefono) && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <label className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      Comunicante / Reportante
                    </label>
                    <p className="text-blue-900 dark:text-blue-100">
                      {novedad.comunicante_nombre || novedad.reportante_nombre || "—"}
                      {(novedad.comunicante_telefono || novedad.reportante_telefono) && (
                        <span className="ml-2 text-blue-600 dark:text-blue-300">
                          Tel: {novedad.comunicante_telefono || novedad.reportante_telefono}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ===================== TAB 1: UBICACIÓN (READ-ONLY) ===================== */}
            {activeTab === 1 && (
              <div className="space-y-4">
                {/* Bloqueo de edición si la novedad fue despachada por otro usuario */}
                {(() => {
                  const dispatchUserId = novedad?.usuarioDespacho?.id ?? novedad?.usuario_despacho_id;
                  return dispatchUserId && dispatchUserId !== user?.id ? (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>
                        Solo <strong>{novedad.usuarioDespacho?.username || "el usuario que despachó"}</strong> puede ajustar la ubicación.
                      </span>
                    </div>
                  ) : null;
                })()}

                {/* Mapa prominente con modo editable */}
                <div className="relative">
                  {savingCoordinates && (
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-[1000]">
                      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl flex items-center gap-3">
                        <Loader2 className="animate-spin text-blue-600" size={20} />
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          Guardando ubicación...
                        </p>
                      </div>
                    </div>
                  )}
                  {(() => {
                    const dispatchUserId = novedad?.usuarioDespacho?.id ?? novedad?.usuario_despacho_id;
                    const canEditUbicacion = !dispatchUserId || dispatchUserId === user?.id;
                    return (
                      <UbicacionMiniMapa
                        latitud={editedCoordinates?.latitud ?? novedad?.latitud}
                        longitud={editedCoordinates?.longitud ?? novedad?.longitud}
                        height="350px"
                        zoom={16}
                        showCoordinates={false}
                        editable={canEditUbicacion}
                        onCoordinatesChange={canEditUbicacion ? handleCoordinatesChange : undefined}
                      />
                    );
                  })()}
                </div>

                {/* Coordenadas con estilo amber */}
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      Coordenadas
                    </label>
                    {editedCoordinates && (
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        (Actualizado)
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm text-amber-900 dark:text-amber-100">
                    {(editedCoordinates?.latitud ?? novedad?.latitud) && (editedCoordinates?.longitud ?? novedad?.longitud)
                      ? `${parseFloat(editedCoordinates?.latitud ?? novedad.latitud).toFixed(6)}, ${parseFloat(editedCoordinates?.longitud ?? novedad.longitud).toFixed(6)}`
                      : "Sin coordenadas"}
                  </p>
                </div>

                {/* Sector y Cuadrante */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Sector
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {novedad?.novedadSector?.nombre || "—"}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Cuadrante
                    </label>
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {novedad?.novedadCuadrante?.nombre ||
                        novedad?.novedadCuadrante?.cuadrante_code ||
                        "—"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================== TAB 2: RECURSOS (EDITABLE) ===================== */}
            {activeTab === 2 && (
              <div className="space-y-6">
                {/* Aviso de cambio de estado */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Estado actual:</strong>{" "}
                    {novedad?.novedadEstado?.nombre || "Pendiente De Registro"}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Al guardar, la novedad cambiará a estado{" "}
                    <strong>DESPACHADO</strong>
                  </p>
                </div>

                {/* Fila 1: Vehículo + Personal a Cargo (Principal) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Vehículo
                      {loadingOperativos && (
                        <span className="ml-2 text-xs text-blue-600">
                          <Loader2 className="inline w-3 h-3 animate-spin" />
                          Cargando disponibles...
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.vehiculo_id}
                      onChange={(e) =>
                        setFormData({ ...formData, vehiculo_id: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      disabled={loadingOperativos}
                    >
                      <option value="">Seleccione vehículo (opcional)</option>
                      {/* Lógica inteligente de vehículos */}
                      {vehiculosDisponibles.length > 0 ? (
                        <>
                          <optgroup label="🟢 Vehículos Disponibles">
                            {vehiculosDisponibles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.placa} - {v.marca} {v.modelo_vehiculo || v.modelo}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <optgroup label="📋 Todos los Vehículos">
                            {vehiculos.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.placa} - {v.marca} {v.modelo_vehiculo || v.modelo}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    {vehiculosDisponibles.length > 0 && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        {vehiculosDisponibles.length} vehículos disponibles
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      <Users size={16} className="inline mr-1" />
                      Personal de Patrullaje a Pie
                      {loadingOperativos && (
                        <span className="ml-2 text-xs text-blue-600">
                          <Loader2 className="inline w-3 h-3 animate-spin" />
                          Cargando disponibles...
                        </span>
                      )}
                    </label>
                    <select
                      value={formData.personal_cargo_id}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          personal_cargo_id: e.target.value 
                          // 🔥 NO limpiar vehículo - permitir ambos
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      disabled={loadingOperativos}
                    >
                      <option value="">Seleccione personal (opcional)</option>
                      {personalDisponible.length > 0 ? (
                        <>
                          <optgroup label="🟢 Personal Disponible">
                            {personalDisponible.map((p) => (
                              <option key={p.id} value={p.personal_id}>
                                {p.personal?.nombres} {p.personal?.apellido_paterno} ({p.personal?.codigo_personal || 'N/A'})
                              </option>
                            ))}
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <optgroup label="📋 Todo el Personal">
                            {personalSeguridad.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.doc_tipo || ''} {p.doc_numero || 'N/A'} - {p.nombres}{" "}
                                {p.apellido_paterno}
                              </option>
                            ))}
                          </optgroup>
                        </>
                      )}
                    </select>
                    {personalDisponible.length > 0 && (
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                        {personalDisponible.length} personales disponibles
                      </p>
                    )}
                  </div>
                </div>

                {/* 🔥 Mensaje informativo de recursos asignados */}
                {(formData.vehiculo_id || formData.personal_cargo_id) && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <Info size={16} />
                        <span className="font-medium">Recursos asignados:</span>
                      </div>
                      <div className="ml-6 space-y-1 text-sm text-blue-700 dark:text-blue-300">
                        {formData.vehiculo_id && (
                          <div className="flex items-center gap-2">
                            <Truck size={14} />
                            <span>Patrullaje vehicular</span>
                          </div>
                        )}
                        {formData.personal_cargo_id && (
                          <div className="flex items-center gap-2">
                            <Users size={14} />
                            <span>Patrullaje a pie (personal)</span>
                          </div>
                        )}
                        {formData.vehiculo_id && formData.personal_cargo_id && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 italic">
                            Se despacharán ambos recursos
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fila 2: Personal Seguridad #2 + Fecha/Hora de Despacho (cronómetro) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Personal Seguridad #2
                    </label>
                    <select
                      value={formData.personal_seguridad2_id}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          personal_seguridad2_id: e.target.value,
                        })
                      }
                      disabled={!formData.personal_cargo_id}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        !formData.personal_cargo_id
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      }`}
                    >
                      <option value="">Seleccione personal (opcional)</option>
                      {personalSeguridad.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.doc_tipo || ''} {p.doc_numero || 'N/A'} - {p.nombres}{" "}
                          {p.apellido_paterno}
                        </option>
                      ))}
                    </select>
                    {!formData.personal_cargo_id && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Primero seleccione un Personal a Cargo para habilitar esta opción
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Fecha y Hora de Despacho
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20">
                      <Clock size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <span className="font-mono text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                        {formatCronometro(currentDateTime)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Se usará esta hora al momento de grabar
                    </p>
                  </div>
                </div>

                {/* Observaciones del despacho */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Observaciones del Despacho
                  </label>
                  <textarea
                    value={formData.observaciones_despacho}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        observaciones_despacho: e.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Ingrese observaciones sobre el despacho... (se guardarán en el historial de estados)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Unidad/Oficina (debajo de observaciones) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Unidad/Oficina
                  </label>
                  <select
                    value={formData.unidad_oficina_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unidad_oficina_id: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione unidad (opcional)</option>
                    {unidadesOficina.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Por defecto: Central de Despacho
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* =============================================== */}
          {/* FOOTER */}
          {/* =============================================== */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                ALT+G = Guardar | ESC = Cancelar
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Truck size={16} />
                      Despachar Novedad
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
