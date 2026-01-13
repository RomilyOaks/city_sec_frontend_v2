/**
 * File: src/pages/operativos/vehiculos/AsignarVehiculoForm.jsx
 * @version 1.0.0
 * @description Formulario para asignar un vehículo a un turno operativo
 */

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { X, AlertCircle } from "lucide-react";

import { createVehiculoOperativo } from "../../../services/operativosVehiculosService.js";
import { listVehiculosDisponibles } from "../../../services/vehiculosService.js";
import { listPersonal } from "../../../services/personalService.js";
import { listRadiosTetraActivos } from "../../../services/radiosTetraService.js";
import { listEstadosOperativosActivos } from "../../../services/estadosOperativoService.js";
import { listTiposCopilotoActivos } from "../../../services/tiposCopilotoService.js";

// Opciones de nivel de combustible
const NIVELES_COMBUSTIBLE = [
  { value: "LLENO", label: "Lleno" },
  { value: "3/4", label: "3/4" },
  { value: "1/2", label: "1/2" },
  { value: "1/4", label: "1/4" },
  { value: "RESERVA", label: "Reserva" },
];

// Función para obtener fecha/hora actual en formato YYYY-MM-DDTHH:mm
const getCurrentDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * AsignarVehiculoForm
 * @param {Object} props
 * @param {number} props.turnoId - ID del turno operativo
 * @param {Array} props.vehiculosAsignados - Vehículos ya asignados al turno
 * @param {Function} props.onSuccess - Callback cuando se asigna exitosamente
 * @param {Function} props.onCancel - Callback para cancelar
 */
export default function AsignarVehiculoForm({ turnoId, vehiculosAsignados = [], onSuccess, onCancel }) {
  // Catálogos
  const [vehiculos, setVehiculos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [radios, setRadios] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tiposCopiloto, setTiposCopiloto] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    vehiculo_id: "",
    conductor_id: "",
    copiloto_id: "",
    tipo_copiloto_id: "",
    radio_tetra_id: "",
    estado_operativo_id: "1", // Por defecto: OPERATIVO ACTIVO
    kilometraje_inicio: "",
    hora_inicio: getCurrentDateTime(),
    nivel_combustible_inicio: "LLENO",
    observaciones: "",
  });

  const [saving, setSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogos = async () => {
      setLoadingCatalogos(true);
      try {
        const [vehiculosRes, personalRes, radiosRes, estadosRes, tiposRes] = await Promise.all([
          listVehiculosDisponibles(),
          listPersonal({ limit: 100 }),
          listRadiosTetraActivos(),
          listEstadosOperativosActivos(),
          listTiposCopilotoActivos(),
        ]);

        // Procesar vehículos y filtrar los ya asignados
        const vehiculosData = Array.isArray(vehiculosRes)
          ? vehiculosRes
          : vehiculosRes?.data || [];

        // Obtener IDs de vehículos ya asignados
        const vehiculosAsignadosIds = vehiculosAsignados.map(v => v.vehiculo_id);

        // Filtrar vehículos disponibles (excluir los ya asignados)
        const vehiculosDisponibles = vehiculosData.filter(
          v => !vehiculosAsignadosIds.includes(v.id)
        );

        setVehiculos(vehiculosDisponibles);

        // Procesar personal y filtrar conductores ya asignados
        let personalData = [];
        if (Array.isArray(personalRes)) {
          personalData = personalRes;
        } else if (personalRes?.personal) {
          personalData = personalRes.personal;
        } else if (personalRes?.data) {
          personalData = personalRes.data;
        }

        // Filtrar solo personal activo
        const personalActivo = personalData.filter(p => p.estado === 1 || p.estado === true);

        // Obtener IDs de conductores ya asignados en este turno
        const conductoresAsignadosIds = vehiculosAsignados
          .map(v => v.conductor_id)
          .filter(Boolean); // Filtrar null/undefined

        // Filtrar personal disponible (excluir conductores ya asignados)
        const personalDisponible = personalActivo.filter(
          p => !conductoresAsignadosIds.includes(p.id)
        );

        // Ordenar alfabéticamente por nombres
        const personalOrdenado = personalDisponible.sort((a, b) => {
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

        setPersonal(personalOrdenado);

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

        // Procesar tipos copiloto
        const tiposData = Array.isArray(tiposRes)
          ? tiposRes
          : tiposRes?.data || [];
        setTiposCopiloto(Array.isArray(tiposData) ? tiposData : []);

      } catch (err) {
        console.error("Error cargando catálogos:", err);
        const errorMsg = err?.response?.data?.message || err?.message || "Error al cargar catálogos";
        toast.error(errorMsg);
        // Asegurar que los arrays estén inicializados incluso en caso de error
        setVehiculos([]);
        setPersonal([]);
        setRadios([]);
        setEstados([]);
        setTiposCopiloto([]);
      } finally {
        setLoadingCatalogos(false);
      }
    };

    loadCatalogos();
  }, [vehiculosAsignados]);

  // Validar formulario
  const validateForm = useCallback(() => {
    if (!formData.vehiculo_id) return false;
    if (!formData.estado_operativo_id) return false;
    if (!formData.kilometraje_inicio) return false;
    if (!formData.hora_inicio) return false;

    // Si hay copiloto, debe tener tipo_copiloto
    if (formData.copiloto_id && !formData.tipo_copiloto_id) {
      toast.error("Si selecciona un copiloto, debe indicar el tipo de copiloto");
      return false;
    }

    return true;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    setShowValidation(true);
    if (!validateForm()) {
      toast.error("Por favor complete los campos requeridos");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehiculo_id: Number(formData.vehiculo_id),
        estado_operativo_id: Number(formData.estado_operativo_id),
        kilometraje_inicio: Number(formData.kilometraje_inicio),
        hora_inicio: formData.hora_inicio,
      };

      // Agregar campos opcionales (solo si tienen valor válido)
      if (formData.conductor_id && formData.conductor_id !== "") {
        payload.conductor_id = Number(formData.conductor_id);
      }
      if (formData.copiloto_id && formData.copiloto_id !== "") {
        payload.copiloto_id = Number(formData.copiloto_id);
      }
      if (formData.tipo_copiloto_id && formData.tipo_copiloto_id !== "") {
        payload.tipo_copiloto_id = Number(formData.tipo_copiloto_id);
      }
      if (formData.radio_tetra_id && formData.radio_tetra_id !== "") {
        payload.radio_tetra_id = Number(formData.radio_tetra_id);
      }
      if (formData.nivel_combustible_inicio) {
        payload.nivel_combustible_inicio = formData.nivel_combustible_inicio;
      }
      if (formData.observaciones?.trim()) {
        payload.observaciones = formData.observaciones.trim();
      }

      await createVehiculoOperativo(turnoId, payload);
      toast.success("Vehículo asignado al turno exitosamente");
      onSuccess();
    } catch (err) {
      console.error("Error asignando vehículo:", err);

      // Extraer mensaje de error detallado del backend
      const data = err?.response?.data;
      let errorMsg = "Error al asignar vehículo";

      // PRIORIZAR: Si hay array de errores específicos, usar eso primero
      if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        const firstError = data.errors[0];
        const field = firstError.path || firstError.param || firstError.field || "";
        const msg = firstError.msg || firstError.message || "";

        if (field && msg) {
          const fieldNames = {
            vehiculo_id: "Vehículo",
            conductor_id: "Conductor",
            copiloto_id: "Copiloto",
            tipo_copiloto_id: "Tipo Copiloto",
            radio_tetra_id: "Radio TETRA",
            estado_operativo_id: "Estado Operativo",
            kilometraje_inicio: "Kilometraje Inicial",
            hora_inicio: "Hora Inicio",
            nivel_combustible_inicio: "Nivel Combustible Inicial"
          };
          const translatedField = fieldNames[field] || field;
          errorMsg = `${translatedField}: ${msg}`;
        } else if (msg) {
          errorMsg = msg;
        }
      } else if (data?.message) {
        // FALLBACK: Mensaje genérico solo si no hay errores específicos
        errorMsg = data.message;
      } else if (data?.error) {
        errorMsg = data.error;
      }

      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  }, [formData, turnoId, onSuccess, validateForm]);

  const formatPersonalNombre = (persona) => {
    const nombres = [persona.nombres, persona.apellido_paterno, persona.apellido_materno]
      .filter(Boolean)
      .join(" ");
    const doc = persona.dni || persona.doc_numero;
    const tipoDoc = persona.doc_tipo || "DNI";
    return `${nombres}${doc ? ` - ${tipoDoc} ${doc}` : ""}`;
  };

  // Manejar tecla ESC
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !saving) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onCancel, saving]);

  // Manejar tecla Alt+G
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

  if (loadingCatalogos) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando formulario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Nota informativa */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex gap-2">
          <AlertCircle size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> Los datos de licencia y vehículo solo aplican para personal que conduce vehículos (conductores).
            Policías, serenos y otro personal que participa en operativos pero no conduce, no requieren estos datos.
          </p>
        </div>
      </div>

      {/* Advertencia si no hay vehículos disponibles */}
      {vehiculos.length === 0 && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Advertencia:</strong> Todos los vehículos disponibles ya han sido asignados a este turno.
              No hay vehículos disponibles para asignar.
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Vehículo */}
          <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Vehículo *
                </label>
                <select
                  value={formData.vehiculo_id}
                  onChange={(e) => setFormData({ ...formData, vehiculo_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                >
                  <option value="">— Sin vehículo asignado —</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} - {v.nombre || `${v.marca || ""} ${v.modelo || ""}`.trim()} ({v.tipo_vehiculo?.descripcion || "Tipo"})
                    </option>
                  ))}
                </select>
                {showValidation && !formData.vehiculo_id && (
                  <p className="mt-1 text-xs text-red-500">Este campo es requerido</p>
                )}
              </div>

              {/* Conductor */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Conductor
                </label>
                <select
                  value={formData.conductor_id}
                  onChange={(e) => setFormData({ ...formData, conductor_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                >
                  <option value="">— Sin conductor —</option>
                  {personal.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPersonalNombre(p)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Copiloto */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Copiloto
                </label>
                <select
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
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                >
                  <option value="">— Sin copiloto —</option>
                  {personal.map((p) => (
                    <option key={p.id} value={p.id}>
                      {formatPersonalNombre(p)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Copiloto */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Tipo Copiloto {formData.copiloto_id && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.tipo_copiloto_id}
                  onChange={(e) => setFormData({ ...formData, tipo_copiloto_id: e.target.value })}
                  disabled={!formData.copiloto_id}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">— Seleccione tipo —</option>
                  {tiposCopiloto.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre || t.descripcion}
                    </option>
                  ))}
                </select>
                {showValidation && formData.copiloto_id && !formData.tipo_copiloto_id && (
                  <p className="mt-1 text-xs text-red-500">Requerido cuando hay copiloto</p>
                )}
              </div>

              {/* Radio TETRA */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Radio TETRA
                </label>
                <select
                  value={formData.radio_tetra_id}
                  onChange={(e) => setFormData({ ...formData, radio_tetra_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                >
                  <option value="">— Sin radio —</option>
                  {radios.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.radio_tetra_code || r.codigo} - {r.descripcion || r.numero_serie}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado Operativo */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Estado Operativo *
                </label>
                <select
                  value={formData.estado_operativo_id}
                  onChange={(e) => setFormData({ ...formData, estado_operativo_id: e.target.value })}
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

              {/* Kilometraje Inicio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Kilometraje Inicio *
                </label>
                <input
                  type="number"
                  value={formData.kilometraje_inicio}
                  onChange={(e) => setFormData({ ...formData, kilometraje_inicio: e.target.value })}
                  min="0"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  placeholder="45000"
                />
                {showValidation && !formData.kilometraje_inicio && (
                  <p className="mt-1 text-xs text-red-500">Este campo es requerido</p>
                )}
              </div>

              {/* Hora Inicio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Hora Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                />
                {showValidation && !formData.hora_inicio && (
                  <p className="mt-1 text-xs text-red-500">Este campo es requerido</p>
                )}
              </div>

              {/* Nivel Combustible Inicio */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Nivel Combustible Inicio
                </label>
                <select
                  value={formData.nivel_combustible_inicio}
                  onChange={(e) => setFormData({ ...formData, nivel_combustible_inicio: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                >
                  {NIVELES_COMBUSTIBLE.map((n) => (
                    <option key={n.value} value={n.value}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Observaciones */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
                  placeholder="Observaciones del vehículo al inicio del turno..."
                />
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
                  disabled={saving || vehiculos.length === 0}
                  className="px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50"
                  title={vehiculos.length === 0 ? "No hay vehículos disponibles para asignar" : ""}
                >
                  {saving ? "Guardando..." : "Asignar Vehículo"}
                </button>
              </div>
            </div>
        </div>
      </div>
  );
}
