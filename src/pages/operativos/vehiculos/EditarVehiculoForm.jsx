/**
 * File: src/pages/operativos/vehiculos/EditarVehiculoForm.jsx
 * @version 1.0.0
 * @description Formulario para editar vehículo asignado a turno operativo
 * @module src/pages/operativos/vehiculos/EditarVehiculoForm.jsx
 */

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

import { updateVehiculoOperativo } from "../../../services/operativosVehiculosService.js";
import { listPersonal } from "../../../services/personalService.js";
import { listRadiosTetraActivos } from "../../../services/radiosTetraService.js";
import { listEstadosOperativosActivos } from "../../../services/estadosOperativoService.js";
import { listTiposCopilotoActivos } from "../../../services/tiposCopilotoService.js";

const NIVELES_COMBUSTIBLE = [
  { value: "LLENO", label: "Lleno" },
  { value: "3/4", label: "3/4" },
  { value: "1/2", label: "1/2" },
  { value: "1/4", label: "1/4" },
  { value: "RESERVA", label: "Reserva" },
];

/**
 * EditarVehiculoForm
 * Formulario para editar datos de un vehículo ya asignado a un turno operativo
 * No permite cambiar el vehículo, solo actualizar conductor, copiloto, radio, estado, y datos de cierre
 */
export default function EditarVehiculoForm({
  turnoId,
  vehiculo,
  vehiculosAsignados,
  onSuccess,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [personalActivo, setPersonalActivo] = useState([]);
  const [radios, setRadios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tiposCopiloto, setTiposCopiloto] = useState([]);

  const [formData, setFormData] = useState({
    conductor_id: "",
    copiloto_id: "",
    tipo_copiloto_id: "",
    radio_tetra_id: "",
    estado_operativo_id: "",
    kilometraje_fin: "",
    hora_fin: "",
    nivel_combustible_fin: "",
    observaciones: "",
  });

  // Inicializar formulario con datos del vehículo
  useEffect(() => {
    if (vehiculo) {
      setFormData({
        conductor_id: vehiculo.conductor_id || "",
        copiloto_id: vehiculo.copiloto_id || "",
        tipo_copiloto_id: vehiculo.tipo_copiloto_id || "",
        radio_tetra_id: vehiculo.radio_tetra_id || "",
        estado_operativo_id: vehiculo.estado_operativo_id || "",
        kilometraje_fin: vehiculo.kilometraje_fin || "",
        hora_fin: vehiculo.hora_fin || "",
        nivel_combustible_fin: vehiculo.nivel_combustible_fin || "",
        observaciones: vehiculo.observaciones || "",
      });
    }
  }, [vehiculo]);

  // Manejar tecla ESC para cancelar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true); // true = capture phase
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onCancel]);

  // Cargar catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [personalRes, radiosRes, estadosRes, tiposRes] = await Promise.all([
          listPersonal({ limit: 100 }),
          listRadiosTetraActivos(),
          listEstadosOperativosActivos(),
          listTiposCopilotoActivos(),
        ]);

        // Procesar personal y filtrar solo activos
        let personalData = [];
        if (Array.isArray(personalRes)) {
          personalData = personalRes;
        } else if (personalRes?.personal) {
          personalData = personalRes.personal;
        } else if (personalRes?.data) {
          personalData = personalRes.data;
        }
        const personalActivos = personalData.filter(p => p.estado === 1 || p.estado === true);
        setPersonalActivo(personalActivos);

        const radiosData = Array.isArray(radiosRes?.data || radiosRes) ? radiosRes?.data || radiosRes : [];
        const estadosData = Array.isArray(estadosRes?.data || estadosRes) ? estadosRes?.data || estadosRes : [];
        const tiposData = Array.isArray(tiposRes?.data || tiposRes) ? tiposRes?.data || tiposRes : [];

        setRadios(radiosData);
        setEstados(estadosData);
        setTiposCopiloto(tiposData);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        toast.error("Error al cargar catálogos");
      }
    };

    fetchCatalogos();
  }, []);

  // Filtrar conductores ya asignados (excepto el actual)
  const conductoresDisponibles = personalActivo.filter((p) => {
    if (!vehiculosAsignados || !vehiculo) return true;
    const conductoresAsignados = vehiculosAsignados
      .filter((v) => v.id !== vehiculo.id) // Excluir el vehículo actual
      .map((v) => v.conductor_id)
      .filter(Boolean);
    return !conductoresAsignados.includes(p.id);
  });

  // Ordenar personal alfabéticamente
  const personalOrdenado = conductoresDisponibles.sort((a, b) => {
    const nombreA = [a.nombres, a.apellido_paterno, a.apellido_materno]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const nombreB = [b.nombres, b.apellido_paterno, b.apellido_materno]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return nombreA.localeCompare(nombreB);
  });

  const formatPersonalNombre = (persona) => {
    return [persona.nombres, persona.apellido_paterno, persona.apellido_materno]
      .filter(Boolean)
      .join(" ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Función para extraer mensaje de error del backend
  const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Error desconocido";

    // PRIORIZAR: Si hay un array de errores de validación, usar eso primero
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      // Tomar el primer error y formatear
      const firstError = data.errors[0];
      const field = firstError.path || firstError.param || firstError.field || "";
      const msg = firstError.msg || firstError.message || "";

      // Si hay campo y mensaje, formatear como "Campo: mensaje"
      if (field && msg) {
        // Traducir nombres de campos comunes
        const fieldNames = {
          hora_fin: "Hora Fin",
          kilometraje_fin: "Kilometraje Final",
          nivel_combustible_fin: "Nivel Combustible Final",
          conductor_id: "Conductor",
          copiloto_id: "Copiloto",
          tipo_copiloto_id: "Tipo Copiloto",
          radio_tetra_id: "Radio TETRA",
          estado_operativo_id: "Estado Operativo"
        };
        const translatedField = fieldNames[field] || field;
        return `${translatedField}: ${msg}`;
      }

      // Si solo hay mensaje sin campo
      if (msg) return msg;
    }

    // FALLBACK: Si no hay errores específicos, usar mensaje genérico
    if (data.message) return data.message;
    if (data.error) return data.error;

    return "Error al actualizar vehículo";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación: si hay copiloto, debe tener tipo_copiloto
    if (formData.copiloto_id && !formData.tipo_copiloto_id) {
      toast.error("Si selecciona un copiloto, debe indicar el tipo de copiloto");
      return;
    }

    // Validación: kilometraje_fin debe ser >= kilometraje_inicio
    if (formData.kilometraje_fin) {
      const kmFin = parseFloat(formData.kilometraje_fin);
      const kmInicio = parseFloat(vehiculo.kilometraje_inicio);
      if (kmFin < kmInicio) {
        toast.error(`El kilometraje final (${kmFin}) no puede ser menor al inicial (${kmInicio})`);
        return;
      }
    }

    // Validación: hora_fin debe tener formato HH:MM válido
    if (formData.hora_fin) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(formData.hora_fin)) {
        toast.error("Hora Fin: Debe tener formato válido HH:MM (ejemplo: 14:30)");
        return;
      }

      // Validación: Si hay hora_inicio y hora_fin, verificar que sea coherente
      // Nota: En turnos nocturnos, la hora fin puede ser "menor" que la hora inicio
      // porque pasa al día siguiente. Esto es válido y esperado.
      if (vehiculo.hora_inicio) {
        const horaInicio = vehiculo.hora_inicio;
        const horaFin = formData.hora_fin;

        // Extraer horas y minutos
        const [horaInicioHH, horaInicioMM] = horaInicio.split(':').map(Number);
        const [horaFinHH, horaFinMM] = horaFin.split(':').map(Number);

        const minutosInicio = horaInicioHH * 60 + horaInicioMM;
        const minutosFin = horaFinHH * 60 + horaFinMM;

        // Si la hora fin es menor que la hora inicio, probablemente es turno nocturno
        // Validar que no sean exactamente iguales (no tiene sentido)
        if (minutosInicio === minutosFin) {
          toast.error("La hora de fin no puede ser igual a la hora de inicio");
          return;
        }

        // Opcional: Advertir si es turno muy largo (más de 24 horas teóricas)
        // Pero esto es complejo de validar sin la fecha, así que lo dejamos para el backend
      }
    }

    setLoading(true);

    try {
      // Construir payload solo con campos que tienen valor
      const payload = {};

      if (formData.conductor_id) payload.conductor_id = parseInt(formData.conductor_id);
      if (formData.copiloto_id) payload.copiloto_id = parseInt(formData.copiloto_id);
      if (formData.tipo_copiloto_id) payload.tipo_copiloto_id = parseInt(formData.tipo_copiloto_id);
      if (formData.radio_tetra_id) payload.radio_tetra_id = parseInt(formData.radio_tetra_id);
      if (formData.estado_operativo_id) payload.estado_operativo_id = parseInt(formData.estado_operativo_id);
      if (formData.kilometraje_fin) payload.kilometraje_fin = parseFloat(formData.kilometraje_fin);

      // Hora fin: Construir fecha-hora completa basada en hora_inicio
      if (formData.hora_fin) {
        // Obtener la fecha base del hora_inicio
        const fechaInicio = new Date(vehiculo.hora_inicio);
        const [horaFinHH, horaFinMM] = formData.hora_fin.split(':').map(Number);

        // Crear fecha con la misma fecha pero la hora de fin ingresada
        const fechaFin = new Date(fechaInicio);
        fechaFin.setHours(horaFinHH, horaFinMM, 0, 0);

        // Si la hora fin es menor que hora inicio, probablemente es turno nocturno (día siguiente)
        const [horaInicioHH, horaInicioMM] = vehiculo.hora_inicio.split(/[T: ]/).slice(-2).map(Number);
        const minutosInicio = horaInicioHH * 60 + horaInicioMM;
        const minutosFin = horaFinHH * 60 + horaFinMM;

        if (minutosFin < minutosInicio) {
          // Es turno nocturno, agregar un día
          fechaFin.setDate(fechaFin.getDate() + 1);
        }

        // Convertir a formato ISO string
        payload.hora_fin = fechaFin.toISOString();
      }

      if (formData.nivel_combustible_fin) payload.nivel_combustible_fin = formData.nivel_combustible_fin;
      if (formData.observaciones) payload.observaciones = formData.observaciones;

      await updateVehiculoOperativo(turnoId, vehiculo.id, payload);

      toast.success("Vehículo actualizado correctamente");
      onSuccess();
    } catch (err) {
      console.error("Error actualizando vehículo:", err);
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Manejar teclas Alt+G y ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+G: Guardar
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        handleSubmit(e);
      }
      // ESC: Cancelar
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [formData, onCancel]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Vehículo (solo lectura) */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
        <h3 className="text-sm font-semibold text-primary-900 dark:text-primary-100 mb-2">
          Vehículo Asignado (no modificable)
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-primary-700 dark:text-primary-300 font-medium">Placa:</span>{" "}
            <span className="text-primary-900 dark:text-primary-100">
              {vehiculo.vehiculo?.placa || "—"}
            </span>
          </div>
          <div>
            <span className="text-primary-700 dark:text-primary-300 font-medium">Marca/Modelo:</span>{" "}
            <span className="text-primary-900 dark:text-primary-100">
              {vehiculo.vehiculo
                ? `${vehiculo.vehiculo.marca || ""} ${vehiculo.vehiculo.modelo || ""}`.trim()
                : "—"}
            </span>
          </div>
          <div>
            <span className="text-primary-700 dark:text-primary-300 font-medium">Km Inicio:</span>{" "}
            <span className="text-primary-900 dark:text-primary-100">
              {vehiculo.kilometraje_inicio?.toLocaleString() || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Personal Asignado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Conductor
          </label>
          <select
            name="conductor_id"
            value={formData.conductor_id}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">Seleccione conductor</option>
            {personalOrdenado.map((p) => (
              <option key={p.id} value={p.id}>
                {formatPersonalNombre(p)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Copiloto (opcional)
          </label>
          <select
            name="copiloto_id"
            value={formData.copiloto_id}
            onChange={(e) => {
              const newValue = e.target.value;
              setFormData({
                ...formData,
                copiloto_id: newValue,
                // Si se quita el copiloto, también quitar el tipo
                tipo_copiloto_id: newValue ? formData.tipo_copiloto_id : ""
              });
            }}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">Sin copiloto</option>
            {personalActivo
              .sort((a, b) => {
                const nombreA = formatPersonalNombre(a).toLowerCase();
                const nombreB = formatPersonalNombre(b).toLowerCase();
                return nombreA.localeCompare(nombreB);
              })
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPersonalNombre(p)}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Tipo Copiloto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Tipo Copiloto {formData.copiloto_id && <span className="text-red-500">*</span>}
        </label>
        <select
          name="tipo_copiloto_id"
          value={formData.tipo_copiloto_id}
          onChange={handleChange}
          disabled={!formData.copiloto_id}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">— Seleccione tipo —</option>
          {tiposCopiloto.map((t) => (
            <option key={t.id} value={t.id}>
              {t.descripcion || t.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Radio TETRA y Estado Operativo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Radio TETRA (opcional)
          </label>
          <select
            name="radio_tetra_id"
            value={formData.radio_tetra_id}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">Sin radio asignado</option>
            {radios.map((r) => (
              <option key={r.id} value={r.id}>
                {r.radio_tetra_code || r.codigo} - {r.descripcion || r.numero_serie}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Estado Operativo
          </label>
          <select
            name="estado_operativo_id"
            value={formData.estado_operativo_id}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">Seleccione estado</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.descripcion || e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Datos de Cierre */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Datos de Cierre (opcionales)
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {/* Kilometraje Inicial - Read Only */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Km Inicial (Referencia)
            </label>
            <input
              type="text"
              value={vehiculo.kilometraje_inicio?.toLocaleString() || '—'}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Kilometraje Final - Editable */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Kilometraje Final
            </label>
            <input
              type="number"
              name="kilometraje_fin"
              value={formData.kilometraje_fin}
              onChange={handleChange}
              min={vehiculo.kilometraje_inicio}
              step="0.1"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
              placeholder={`Mínimo: ${vehiculo.kilometraje_inicio}`}
            />
          </div>

          {/* Hora Inicio - Read Only */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Hora Inicio (Referencia)
            </label>
            <input
              type="text"
              value={vehiculo.hora_inicio ? new Date(vehiculo.hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—'}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Hora Fin - Editable */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Hora Fin
            </label>
            <input
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Nivel Combustible Final
            </label>
            <select
              name="nivel_combustible_fin"
              value={formData.nivel_combustible_fin}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
            >
              <option value="">Seleccione nivel</option>
              {NIVELES_COMBUSTIBLE.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Observaciones (opcional)
        </label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          placeholder="Ingrese observaciones si es necesario..."
        />
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          disabled={loading}
        >
          <X size={18} className="inline mr-2" />
          Cancelar (Esc)
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} className="inline mr-2" />
              Guardar Cambios (Alt+G)
            </>
          )}
        </button>
      </div>
    </form>
  );
}
