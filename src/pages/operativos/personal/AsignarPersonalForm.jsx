/**
 * File: src/pages/operativos/personal/AsignarPersonalForm.jsx
 * @version 2.2.2
 * @description Formulario para asignar personal a patrullaje a pie en un turno operativo.
 * Incluye selección de personal, compañero (sereno), tipo de patrullaje, equipamiento y radio TETRA.
 *
 * Campos requeridos:
 * - personal_id: Personal de seguridad a asignar
 * - hora_inicio: Fecha/hora de inicio del patrullaje
 * - estado_operativo_id: Estado operativo inicial
 *
 * @author Claude AI
 * @supervisor Romily Oaks
 * @date 2026-01-18
 * @module src/pages/operativos/personal/AsignarPersonalForm.jsx
 */

import { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { AlertCircle } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore.js";

// Servicios
import {
  createPersonalOperativo,
  TIPOS_PATRULLAJE,
  EQUIPAMIENTO_ITEMS,
} from "../../../services/operativosPersonalService.js";
import { listPersonalSelector } from "../../../services/personalService.js";
import { listRadiosTetraActivos } from "../../../services/radiosTetraService.js";
import { listEstadosOperativosActivos } from "../../../services/estadosOperativoService.js";

/**
 * Obtener fecha/hora actual en formato YYYY-MM-DDTHH:mm (para input datetime-local)
 * @returns {string} - Fecha/hora formateada
 */
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * AsignarPersonalForm
 * Formulario para asignar personal a un turno de patrullaje a pie
 *
 * @param {Object} props
 * @param {number} props.turnoId - ID del turno operativo
 * @param {Array} props.personalAsignado - Personal ya asignado al turno (para filtrar)
 * @param {Function} props.onSuccess - Callback cuando se asigna exitosamente
 * @param {Function} props.onCancel - Callback para cancelar
 */
export default function AsignarPersonalForm({
  turnoId,
  personalAsignado = [],
  onSuccess,
  onCancel,
}) {
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================

  const { isAuthenticated, token } = useAuthStore();
  const hasFetchedRef = useRef(false); // Control anti-bucle

  // Catálogos
  const [personal, setPersonal] = useState([]);
  const [radios, setRadios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Datos del formulario
  const [formData, setFormData] = useState({
    personal_id: "",
    sereno_id: "", // Compañero de patrullaje
    tipo_patrullaje: "SERENAZGO",
    radio_tetra_id: "",
    estado_operativo_id: "1", // Por defecto: OPERATIVO
    hora_inicio: getCurrentDateTime(),
    // Equipamiento (booleanos)
    chaleco_balistico: false,
    porra_policial: false,
    esposas: false,
    linterna: false,
    kit_primeros_auxilios: false,
    // Observaciones
    observaciones: "",
  });

  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // ============================================================================
  // EFECTOS - Cargar catálogos
  // ============================================================================

  useEffect(() => {
    // Anti-bucle: Solo cargar una vez
    if (hasFetchedRef.current) return;

    // Protección: No cargar si no está autenticado
    if (!isAuthenticated || !token) {
      setLoadingCatalogos(false);
      return;
    }

    hasFetchedRef.current = true;

    const loadCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        // Cargar catálogos en paralelo
        const [personalRes, radiosRes, estadosRes] = await Promise.all([
          listPersonalSelector(), // Endpoint optimizado sin paginación, ya ordenado
          listRadiosTetraActivos(),
          listEstadosOperativosActivos(),
        ]);

        // Procesar personal - listPersonalSelector ya devuelve personal activo y ordenado
        const personalData = Array.isArray(personalRes) ? personalRes : [];

        // Obtener IDs de personal ya asignado en este turno
        const personalAsignadoIds = personalAsignado
          .map((p) => p.personal_id)
          .filter(Boolean);

        // Filtrar personal disponible (excluir ya asignados)
        const personalDisponible = personalData.filter(
          (p) => !personalAsignadoIds.includes(p.id)
        );

        setPersonal(personalDisponible);

        // Procesar radios
        const radiosData = Array.isArray(radiosRes)
          ? radiosRes
          : radiosRes?.data || [];
        setRadios(Array.isArray(radiosData) ? radiosData : []);

        // Procesar estados
        const estadosData = Array.isArray(estadosRes)
          ? estadosRes
          : estadosRes?.data || [];
        setEstados(Array.isArray(estadosData) ? estadosData : []);
      } catch (err) {
        console.error("Error cargando catálogos:", err);

        if (err?.response?.status === 401) {
          toast.error("Sesión expirada. Por favor inicie sesión nuevamente.");
          return;
        }

        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Error al cargar catálogos"
        );

        // Inicializar arrays vacíos en caso de error
        setPersonal([]);
        setRadios([]);
        setEstados([]);
      } finally {
        setLoadingCatalogos(false);
      }
    };

    loadCatalogos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // VALIDACIÓN Y SUBMIT
  // ============================================================================

  /**
   * Validar formulario
   * @returns {boolean} - True si es válido
   */
  const validateForm = useCallback(() => {
    if (!formData.personal_id) return false;
    if (!formData.estado_operativo_id) return false;
    if (!formData.hora_inicio) return false;

    // Sereno (compañero) no puede ser el mismo que el personal principal
    if (
      formData.sereno_id &&
      formData.sereno_id === formData.personal_id
    ) {
      toast.error("El compañero de patrullaje debe ser diferente al personal principal");
      return false;
    }

    return true;
  }, [formData]);

  /**
   * Enviar formulario
   */
  const handleSubmit = useCallback(async () => {
    setShowValidation(true);

    if (!validateForm()) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    setSaving(true);
    try {
      // Construir payload
      const payload = {
        personal_id: Number(formData.personal_id),
        estado_operativo_id: Number(formData.estado_operativo_id),
        hora_inicio: formData.hora_inicio,
        tipo_patrullaje: formData.tipo_patrullaje,
        // Equipamiento
        chaleco_balistico: formData.chaleco_balistico,
        porra_policial: formData.porra_policial,
        esposas: formData.esposas,
        linterna: formData.linterna,
        kit_primeros_auxilios: formData.kit_primeros_auxilios,
      };

      // Campos opcionales
      if (formData.sereno_id && formData.sereno_id !== "") {
        payload.sereno_id = Number(formData.sereno_id);
      }
      if (formData.radio_tetra_id && formData.radio_tetra_id !== "") {
        payload.radio_tetra_id = Number(formData.radio_tetra_id);
      }
      if (formData.observaciones?.trim()) {
        payload.observaciones = formData.observaciones.trim();
      }

      await createPersonalOperativo(turnoId, payload);
      toast.success("Personal asignado al turno exitosamente");
      onSuccess();
    } catch (err) {
      console.error("Error asignando personal:", err);

      // Extraer mensaje de error
      const data = err?.response?.data;
      let errorMsg = "Error al asignar personal";

      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const firstError = data.errors[0];
        const field = firstError.path || firstError.param || firstError.field || "";
        const msg = firstError.msg || firstError.message || "";

        if (field && msg) {
          const fieldNames = {
            personal_id: "Personal",
            sereno_id: "Compañero de Patrullaje",
            tipo_patrullaje: "Tipo de Patrullaje",
            radio_tetra_id: "Radio TETRA",
            estado_operativo_id: "Estado Operativo",
            hora_inicio: "Hora Inicio",
          };
          const translatedField = fieldNames[field] || field;
          errorMsg = `${translatedField}: ${msg}`;
        } else if (msg) {
          errorMsg = msg;
        }
      } else if (data?.message) {
        errorMsg = data.message;
      } else if (data?.error) {
        errorMsg = data.error;
      }

      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }, [formData, turnoId, onSuccess, validateForm]);

  // ============================================================================
  // HANDLERS DE TECLADO
  // ============================================================================

  // ESC para cancelar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !saving) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, saving]);

  // Alt+G para guardar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "g" && !saving) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [saving, handleSubmit]);

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  /**
   * Formatear nombre de personal para mostrar en select
   */
  const formatPersonalNombre = (persona) => {
    const nombres = [persona.nombres, persona.apellido_paterno, persona.apellido_materno]
      .filter(Boolean)
      .join(" ");
    const doc = persona.dni || persona.doc_numero;
    const tipoDoc = persona.doc_tipo || "DNI";
    return `${nombres}${doc ? ` - ${tipoDoc} ${doc}` : ""}`;
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

  // ============================================================================
  // RENDER
  // ============================================================================

  // Loading
  if (loadingCatalogos) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">
            Cargando formulario...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nota informativa */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle
            size={18}
            className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
          />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Patrullaje a Pie:</strong> Asigne personal de seguridad para
            patrullaje a pie. Puede asignar un compañero de patrullaje (sereno)
            y el equipamiento que porta.
          </p>
        </div>
      </div>

      {/* Advertencia si no hay personal disponible */}
      {personal.length === 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle
              size={18}
              className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Advertencia:</strong> Todo el personal disponible ya ha
              sido asignado a este turno.
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Personal Principal */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Personal de Seguridad *
            </label>
            <select
              value={formData.personal_id}
              onChange={(e) =>
                setFormData({ ...formData, personal_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione personal —</option>
              {personal.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPersonalNombre(p)}
                </option>
              ))}
            </select>
            {showValidation && !formData.personal_id && (
              <p className="mt-1 text-xs text-red-500">Este campo es requerido</p>
            )}
          </div>

          {/* Compañero de Patrullaje (Sereno) */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Compañero de Patrullaje
            </label>
            <select
              value={formData.sereno_id}
              onChange={(e) =>
                setFormData({ ...formData, sereno_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Sin compañero —</option>
              {personal
                .filter((p) => String(p.id) !== String(formData.personal_id))
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPersonalNombre(p)}
                  </option>
                ))}
            </select>
          </div>

          {/* Tipo de Patrullaje */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Tipo de Patrullaje
            </label>
            <select
              value={formData.tipo_patrullaje}
              onChange={(e) =>
                setFormData({ ...formData, tipo_patrullaje: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              {TIPOS_PATRULLAJE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Radio TETRA */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Radio TETRA
            </label>
            <select
              value={formData.radio_tetra_id}
              onChange={(e) =>
                setFormData({ ...formData, radio_tetra_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Sin radio —</option>
              {radios.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.radio_tetra_code || r.codigo} -{" "}
                  {r.descripcion || r.numero_serie}
                </option>
              ))}
            </select>
          </div>

          {/* Estado Operativo */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Estado Operativo *
            </label>
            <select
              value={formData.estado_operativo_id}
              onChange={(e) =>
                setFormData({ ...formData, estado_operativo_id: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            >
              <option value="">— Seleccione estado —</option>
              {estados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.descripcion}
                </option>
              ))}
            </select>
            {showValidation && !formData.estado_operativo_id && (
              <p className="mt-1 text-xs text-red-500">Este campo es requerido</p>
            )}
          </div>

          {/* Hora Inicio */}
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Hora Inicio *
            </label>
            <input
              type="datetime-local"
              value={formData.hora_inicio}
              onChange={(e) =>
                setFormData({ ...formData, hora_inicio: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
            />
            {showValidation && !formData.hora_inicio && (
              <p className="mt-1 text-xs text-red-500">Este campo es requerido</p>
            )}
          </div>

          {/* Equipamiento - Sección con checkboxes */}
          <div className="col-span-2">
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

          {/* Observaciones */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              placeholder="Observaciones sobre el personal o el patrullaje..."
            />
            <p className="mt-1 text-xs text-slate-400 text-right">
              {formData.observaciones.length}/500
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-400">
            Alt+G = Guardar | Esc = Cancelar
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || personal.length === 0}
              className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
              title={
                personal.length === 0
                  ? "No hay personal disponible para asignar"
                  : ""
              }
            >
              {saving ? "Guardando..." : "Asignar Personal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
