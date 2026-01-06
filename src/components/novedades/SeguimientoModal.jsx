/**
 * File: src/components/novedades/SeguimientoModal.jsx
 * @version 2.0.0
 * @description Modal para despachar novedad y asignar recursos
 */

import { useState, useEffect } from "react";
import { X, Truck } from "lucide-react";
import toast from "react-hot-toast";

/**
 * SeguimientoModal - Modal para despachar novedad
 * Cuando estado_novedad_id = 1 (Pendiente De Registro), cambia a 2 (Despachado)
 */
export default function SeguimientoModal({
  isOpen,
  onClose,
  novedad,
  vehiculos = [],
  personalSeguridad = [],
  onSubmit,
}) {
  const [formData, setFormData] = useState({
    vehiculo_id: "",
    personal_cargo_id: "",
    observaciones: "",
    fecha_despacho: "",
    km_inicial: "",
  });

  const [saving, setSaving] = useState(false);

  // Inicializar fecha_despacho con fecha y hora actual
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData((prev) => ({
        ...prev,
        fecha_despacho: defaultDateTime,
      }));
    }
  }, [isOpen]);

  // Cuando se selecciona un vehículo, cargar su km_inicial
  const handleVehiculoChange = (e) => {
    const vehiculoId = e.target.value;
    const vehiculo = vehiculos.find((v) => v.id === Number(vehiculoId));

    setFormData({
      ...formData,
      vehiculo_id: vehiculoId,
      km_inicial: vehiculo?.kilometraje_actual || "",
    });
  };

  // Manejar tecla ESC y ALT+G
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC para cerrar
      if (e.key === "Escape" && !saving) {
        console.log("⌨️ ESC presionado - cerrando modal");
        handleClose();
      }

      // ALT+G para guardar
      if (e.altKey && e.key === "g") {
        console.log("⌨️ ALT+G presionado", { saving, isOpen });

        if (saving) {
          console.warn("⚠️ ALT+G bloqueado - Ya hay un guardado en proceso");
          e.preventDefault();
          return;
        }

        e.preventDefault();
        const form = document.querySelector('form[data-seguimiento-form]');
        if (form) {
          console.log("⌨️ ALT+G ejecutando form.requestSubmit()");
          form.requestSubmit();
        } else {
          console.error("❌ Formulario no encontrado");
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, saving]);

  const handleClose = () => {
    if (saving) return;
    setFormData({
      vehiculo_id: "",
      personal_cargo_id: "",
      observaciones: "",
      fecha_despacho: "",
      km_inicial: "",
    });
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🟡 SeguimientoModal - handleSubmit INICIADO", {
      timestamp: new Date().toISOString(),
      saving,
      novedadId: novedad?.id,
    });

    // Prevenir doble submit
    if (saving) {
      console.warn("⚠️ Submit bloqueado - Ya hay un guardado en proceso");
      return;
    }

    // Validaciones
    if (!formData.vehiculo_id && !formData.personal_cargo_id) {
      toast.error("Debe seleccionar al menos un vehículo o personal");
      return;
    }

    setSaving(true);
    try {
      // Refrescar fecha_despacho justo antes de grabar
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const fechaDespachoActual = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Preparar payload
      const payload = {
        // Estado
        estado_novedad_id: 2, // Cambiar a DESPACHADO

        // Asignación de recursos
        vehiculo_id: formData.vehiculo_id ? Number(formData.vehiculo_id) : null,
        personal_cargo_id: formData.personal_cargo_id ? Number(formData.personal_cargo_id) : null,

        // Fechas y observaciones - usar fecha refrescada
        fecha_despacho: fechaDespachoActual,
        observaciones: formData.observaciones || "",

        // Kilometraje
        km_inicial: formData.km_inicial ? Number(formData.km_inicial) : null,

        // Para historial
        novedad_id: novedad?.id,
        estado_anterior_id: novedad?.estado_novedad_id || 1,
      };

      console.log("📋 SeguimientoModal - Payload de seguimiento:", payload);
      console.log("🕐 SeguimientoModal - Fecha despacho actualizada:", fechaDespachoActual);
      console.log("🚀 SeguimientoModal - ANTES de llamar onSubmit");

      await onSubmit(payload);

      console.log("✅ SeguimientoModal - DESPUÉS de llamar onSubmit");
      handleClose();
    } catch (error) {
      console.error("❌ SeguimientoModal - Error al guardar seguimiento:", error);
      // El error ya se maneja en onSubmit
    } finally {
      console.log("🔚 SeguimientoModal - Finally block, setSaving(false)");
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
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
                  Código: {novedad?.novedad_code || "—"}
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

        {/* Body */}
        <form onSubmit={handleSubmit} data-seguimiento-form className="p-6 space-y-6">
          {/* Info del estado actual */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Estado actual:</strong> {novedad?.novedadEstado?.nombre || "Pendiente De Registro"}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Al guardar, la novedad cambiará a estado <strong>DESPACHADO</strong>
            </p>
          </div>

          {/* Asignación de recursos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Asignar Recursos
            </h3>

            {/* Vehículo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Vehículo
              </label>
              <select
                value={formData.vehiculo_id}
                onChange={handleVehiculoChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar vehículo (opcional)</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} - {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>

            {/* KM Inicial - auto llenado */}
            {formData.vehiculo_id && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  KM Inicial
                </label>
                <input
                  type="number"
                  value={formData.km_inicial}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cargado automáticamente desde el vehículo
                </p>
              </div>
            )}

            {/* Personal */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Personal a Cargo
              </label>
              <select
                value={formData.personal_cargo_id}
                onChange={(e) =>
                  setFormData({ ...formData, personal_cargo_id: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar personal (opcional)</option>
                {personalSeguridad.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombres} {p.apellidos} - {p.cargo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha de despacho */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha y Hora de Despacho
            </label>
            <input
              type="datetime-local"
              value={formData.fecha_despacho}
              readOnly
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Se actualizará automáticamente al momento de grabar
            </p>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) =>
                setFormData({ ...formData, observaciones: e.target.value })
              }
              rows={4}
              placeholder="Ingrese observaciones sobre el despacho..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Se guardará en el historial de estados
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              onClick={() => {
                console.log("🖱️ Click en botón Despachar", {
                  timestamp: new Date().toISOString(),
                  saving,
                  disabled: saving,
                });
              }}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-700 text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? "Guardando..." : "Despachar Novedad (ALT+G)"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
