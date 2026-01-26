/**
 * File: src/pages/operativos/personal/EditarPersonalForm.jsx
 * @version 2.2.2
 * @description Formulario para editar personal asignado a patrullaje a pie.
 * Permite modificar compañero, tipo de patrullaje, radio TETRA, equipamiento,
 * estado operativo y registrar hora de fin del patrullaje.
 *
 * No permite cambiar el personal principal, solo datos adicionales.
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-18
 * @module src/pages/operativos/personal/EditarPersonalForm.jsx
 */

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Save, X } from "lucide-react";

// Servicios
import {
  updatePersonalOperativo,
  formatPersonalNombre,
  TIPOS_PATRULLAJE,
  EQUIPAMIENTO_ITEMS,
} from "../../../services/operativosPersonalService.js";
import { listPersonalSelector } from "../../../services/personalService.js";
import { radioTetraService } from "../../../services/radiosTetraService.js";
import { listEstadosOperativosActivos } from "../../../services/estadosOperativoService.js";
import RadioTetraDropdown from "../../../components/RadioTetraDropdown.jsx";

/**
 * EditarPersonalForm
 * Formulario para editar datos de personal ya asignado a un turno de patrullaje a pie
 *
 * @param {Object} props
 * @param {number} props.turnoId - ID del turno operativo
 * @param {Object} props.personal - Registro de personal operativo a editar
 * @param {Array} props.personalAsignado - Personal ya asignado al turno (para filtrar)
 * @param {Function} props.onSuccess - Callback cuando se actualiza exitosamente
 * @param {Function} props.onCancel - Callback para cancelar
 */
export default function EditarPersonalForm({
  turnoId,
  personal,
  personalAsignado = [],
  onSuccess,
  onCancel,
}) {
  // ============================================================================
  // ESTADO
  // ============================================================================

  const [loading, setLoading] = useState(false);
  const [personalActivo, setPersonalActivo] = useState([]);
  const [estados, setEstados] = useState([]);

  // Datos del formulario
  const [formData, setFormData] = useState({
    sereno_id: "",
    tipo_patrullaje: "SERENAZGO",
    radio_tetra_id: "",
    estado_operativo_id: "",
    hora_fin: "",
    // Equipamiento
    chaleco_balistico: false,
    porra_policial: false,
    esposas: false,
    linterna: false,
    kit_primeros_auxilios: false,
    // Observaciones
    observaciones: "",
  });

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Inicializar formulario con datos del personal
  useEffect(() => {
    if (personal) {
      setFormData({
        sereno_id: personal.sereno_id || "",
        tipo_patrullaje: personal.tipo_patrullaje || "SERENAZGO",
        radio_tetra_id: personal.radio_tetra_id || "",
        estado_operativo_id: personal.estado_operativo_id || "",
        hora_fin: personal.hora_fin
          ? new Date(personal.hora_fin).toTimeString().slice(0, 5)
          : "",
        // Equipamiento
        chaleco_balistico: personal.chaleco_balistico || false,
        porra_policial: personal.porra_policial || false,
        esposas: personal.esposas || false,
        linterna: personal.linterna || false,
        kit_primeros_auxilios: personal.kit_primeros_auxilios || false,
        // Observaciones
        observaciones: personal.observaciones || "",
      });
    }
  }, [personal]);

  // ESC para cancelar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onCancel]);

  // Cargar catálogos (personal y estados)
  // Nota: Los radios se cargan dentro del componente RadioTetraDropdown
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [personalRes, estadosRes] = await Promise.all([
          listPersonalSelector(), // Endpoint optimizado sin paginación, ya ordenado
          listEstadosOperativosActivos(),
        ]);

        // Procesar personal - listPersonalSelector ya devuelve personal activo y ordenado
        const personalData = Array.isArray(personalRes) ? personalRes : [];
        setPersonalActivo(personalData);

        // Procesar estados
        const estadosData = Array.isArray(estadosRes?.data || estadosRes)
          ? estadosRes?.data || estadosRes
          : [];
        setEstados(estadosData);
      } catch (err) {
        console.error("Error cargando catálogos:", err);
        toast.error("Error al cargar catálogos");
      }
    };

    fetchCatalogos();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Manejar cambio genérico de input
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Manejar cambio en checkbox de equipamiento
   */
  const handleEquipamientoChange = (key) => {
    setFormData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * Extraer mensaje de error del backend
   */
  const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Error desconocido";

    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstError = data.errors[0];
      const field = firstError.path || firstError.param || firstError.field || "";
      const msg = firstError.msg || firstError.message || "";

      if (field && msg) {
        const fieldNames = {
          sereno_id: "Compañero de Patrullaje",
          tipo_patrullaje: "Tipo de Patrullaje",
          radio_tetra_id: "Radio TETRA",
          estado_operativo_id: "Estado Operativo",
          hora_fin: "Hora Fin",
        };
        const translatedField = fieldNames[field] || field;
        return `${translatedField}: ${msg}`;
      }
      if (msg) return msg;
    }

    if (data.message) return data.message;
    if (data.error) return data.error;

    return "Error al actualizar personal";
  };

  /**
   * Enviar formulario
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      // Validación: sereno_id no puede ser igual a personal_id
      if (
        formData.sereno_id &&
        String(formData.sereno_id) === String(personal.personal_id)
      ) {
        toast.error("El compañero de patrullaje debe ser diferente al personal principal");
        return;
      }

      // Validación: hora_fin debe tener formato válido
      if (formData.hora_fin) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(formData.hora_fin)) {
          toast.error("Hora Fin: Debe tener formato válido HH:MM (ejemplo: 14:30)");
          return;
        }
      }

      setLoading(true);

      try {
        // Asignar el radio TETRA al personal principal (prioridad) o sereno en la tabla radios_tetra
        const nuevoRadioId = formData.radio_tetra_id;
        const radioAnteriorId = personal.radio_tetra_id;

        // Si cambió el radio o se asignó uno nuevo
        if (nuevoRadioId && nuevoRadioId !== radioAnteriorId) {
          // Prioridad: personal principal, luego sereno (compañero)
          const personalId = personal.personal_id || formData.sereno_id;
          if (personalId) {
            try {
              await radioTetraService.asignarRadio(nuevoRadioId, parseInt(personalId));
            } catch (err) {
              console.error('Error asignando radio:', err);
              // No bloqueamos el guardado si falla la asignación
            }
          }
        }

        // Si se quitó el radio (antes tenía, ahora no)
        if (radioAnteriorId && !nuevoRadioId) {
          try {
            await radioTetraService.desasignarRadio(radioAnteriorId);
          } catch (err) {
            console.error('Error desasignando radio anterior:', err);
          }
        }

        // Construir payload
        const payload = {
          tipo_patrullaje: formData.tipo_patrullaje,
          // Equipamiento
          chaleco_balistico: formData.chaleco_balistico,
          porra_policial: formData.porra_policial,
          esposas: formData.esposas,
          linterna: formData.linterna,
          kit_primeros_auxilios: formData.kit_primeros_auxilios,
        };

        // Campos opcionales
        if (formData.sereno_id) {
          payload.sereno_id = parseInt(formData.sereno_id);
        }
        if (formData.radio_tetra_id) {
          payload.radio_tetra_id = parseInt(formData.radio_tetra_id);
        }
        if (formData.estado_operativo_id) {
          payload.estado_operativo_id = parseInt(formData.estado_operativo_id);
        }

        // Hora fin: Construir fecha-hora completa basada en hora_inicio
        if (formData.hora_fin) {
          const fechaInicio = new Date(personal.hora_inicio);
          const [horaFinHH, horaFinMM] = formData.hora_fin.split(":").map(Number);

          const fechaFin = new Date(fechaInicio);
          fechaFin.setHours(horaFinHH, horaFinMM, 0, 0);

          // Si la hora fin es menor que hora inicio, es turno nocturno (día siguiente)
          const horaInicioStr = personal.hora_inicio.split(/[T: ]/).slice(-2);
          const [horaInicioHH, horaInicioMM] = horaInicioStr.map(Number);
          const minutosInicio = horaInicioHH * 60 + horaInicioMM;
          const minutosFin = horaFinHH * 60 + horaFinMM;

          if (minutosFin < minutosInicio) {
            fechaFin.setDate(fechaFin.getDate() + 1);
          }

          payload.hora_fin = fechaFin.toISOString();
        }

        if (formData.observaciones?.trim()) {
          payload.observaciones = formData.observaciones.trim();
        }

        await updatePersonalOperativo(turnoId, personal.id, payload);

        toast.success("Personal actualizado correctamente");
        onSuccess();
      } catch (err) {
        console.error("Error actualizando personal:", err);
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [formData, turnoId, personal, onSuccess]
  );

  // Alt+G para guardar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleSubmit]);

  // ============================================================================
  // DATOS FILTRADOS
  // ============================================================================

  // Filtrar personal para compañero (excluir el principal y ya asignados)
  // El endpoint listPersonalSelector ya devuelve la lista ordenada alfabéticamente
  const personalDisponibleParaSereno = personalActivo.filter((p) => {
    // Excluir el personal principal
    if (p.id === personal?.personal_id) return false;

    // Excluir personal ya asignado en este turno (excepto el sereno actual)
    const asignadosIds = personalAsignado
      .filter((pa) => pa.id !== personal?.id)
      .map((pa) => pa.personal_id)
      .filter(Boolean);

    return !asignadosIds.includes(p.id);
  });

  /**
   * Formatear nombre para select
   */
  const formatNombre = (persona) => {
    return [persona.nombres, persona.apellido_paterno, persona.apellido_materno]
      .filter(Boolean)
      .join(" ");
  };

  /**
   * Formatear hora desde datetime ISO
   */
  const formatHora = (datetime) => {
    if (!datetime) return "—";
    try {
      return new Date(datetime).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información del Personal (solo lectura) */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
          Personal Asignado (no modificable)
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-green-700 dark:text-green-300 font-medium">
              Personal:
            </span>{" "}
            <span className="text-green-900 dark:text-green-100">
              {formatPersonalNombre(personal?.personal)}
            </span>
          </div>
          <div>
            <span className="text-green-700 dark:text-green-300 font-medium">
              Hora Inicio:
            </span>{" "}
            <span className="text-green-900 dark:text-green-100">
              {formatHora(personal?.hora_inicio)}
            </span>
          </div>
          <div>
            <span className="text-green-700 dark:text-green-300 font-medium">
              Estado:
            </span>{" "}
            <span className="text-green-900 dark:text-green-100">
              {personal?.estado_operativo?.descripcion || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Compañero y Tipo de Patrullaje */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Compañero de Patrullaje
          </label>
          <select
            name="sereno_id"
            value={formData.sereno_id}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            <option value="">— Sin compañero —</option>
            {personalDisponibleParaSereno.map((p) => (
              <option key={p.id} value={p.id}>
                {formatNombre(p)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Tipo de Patrullaje
          </label>
          <select
            name="tipo_patrullaje"
            value={formData.tipo_patrullaje}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          >
            {TIPOS_PATRULLAJE.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Radio TETRA y Estado Operativo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <RadioTetraDropdown
            value={formData.radio_tetra_id}
            onChange={(value) => setFormData(prev => ({ ...prev, radio_tetra_id: value }))}
            conductorId={personal?.personal_id}
            copilotoId={formData.sereno_id}
            disabled={loading}
            placeholder="Sin radio asignado"
            showDescripcion={true}
            labelConductor="Personal"
            labelCopiloto="Compañero"
          />
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
            <option value="">— Seleccione estado —</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.descripcion || e.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Equipamiento */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Equipamiento
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {EQUIPAMIENTO_ITEMS.map((item) => (
            <label
              key={item.key}
              className={`
                flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                ${
                  formData[item.key]
                    ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                }
              `}
            >
              <input
                type="checkbox"
                checked={formData[item.key]}
                onChange={() => handleEquipamientoChange(item.key)}
                className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Datos de Cierre */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
          Cierre de Patrullaje (opcional)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Hora Inicio - Read Only */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Hora Inicio (Referencia)
            </label>
            <input
              type="text"
              value={formatHora(personal?.hora_inicio)}
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
        </div>
      </div>

      {/* Observaciones */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Observaciones
        </label>
        <textarea
          name="observaciones"
          value={formData.observaciones}
          onChange={handleChange}
          rows={3}
          maxLength={500}
          className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50"
          placeholder="Observaciones sobre el patrullaje..."
        />
        <p className="mt-1 text-xs text-slate-400 text-right">
          {formData.observaciones.length}/500
        </p>
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
