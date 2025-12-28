/**
 * File: src/components/calles/TipoViaFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar tipos de vía
 * @module src/components/calles/TipoViaFormModal.jsx
 */

import { useState, useEffect } from "react";
import { X, Type, Loader2 } from "lucide-react";
import {
  createTipoVia,
  updateTipoVia,
  listTiposVia,
} from "../../services/tiposViaService";

/**
 * TipoViaFormModal - Modal para CRUD de tipos de vía
 * @component
 */
export default function TipoViaFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData = null,
  mode = "create", // "create" | "edit"
}) {
  // ============================================
  // ESTADO
  // ============================================
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    abreviatura: "",
    orden: "",
    descripcion: "",
  });

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    if (isOpen && initialData && mode === "edit") {
      setFormData({
        codigo: initialData.codigo || "",
        nombre: initialData.nombre || "",
        abreviatura: initialData.abreviatura || "",
        orden: initialData.orden || "",
        descripcion: initialData.descripcion || "",
      });
    }
  }, [isOpen, initialData, mode]);

  // Auto-calcular siguiente número de orden al crear
  useEffect(() => {
    async function calcularSiguienteOrden() {
      if (isOpen && mode === "create") {
        try {
          console.log("🔢 [TipoViaFormModal] Calculando siguiente orden...");
          const result = await listTiposVia({ page: 1, limit: 1000 });
          const items = result?.items || result?.data || [];

          // Encontrar el máximo orden
          const maxOrden = items.reduce((max, item) => {
            const orden = parseInt(item.orden) || 0;
            return orden > max ? orden : max;
          }, 0);

          const siguienteOrden = maxOrden + 1;
          console.log("🔢 [TipoViaFormModal] Máximo orden encontrado:", maxOrden);
          console.log("🔢 [TipoViaFormModal] Siguiente orden:", siguienteOrden);

          setFormData(prev => ({
            ...prev,
            orden: siguienteOrden.toString()
          }));
        } catch (error) {
          console.error("❌ [TipoViaFormModal] Error al calcular orden:", error);
          // Si hay error, usar 1 como default
          setFormData(prev => ({
            ...prev,
            orden: "1"
          }));
        }
      }
    }

    calcularSiguienteOrden();
  }, [isOpen, mode]);

  // Shortcuts de teclado
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      // ESC = Cerrar modal
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      // ALT + G = Guardar
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        document.getElementById("submit-tipo-via-btn")?.click();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // ============================================
  // HANDLERS
  // ============================================
  async function handleSubmit(e) {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.codigo.trim()) {
      window.alert("⚠️ ERROR DE VALIDACIÓN\n\nDebe ingresar el código del tipo de vía");
      return;
    }

    if (!formData.nombre.trim()) {
      window.alert("⚠️ ERROR DE VALIDACIÓN\n\nDebe ingresar el nombre del tipo de vía");
      return;
    }

    if (!formData.abreviatura.trim()) {
      window.alert("⚠️ ERROR DE VALIDACIÓN\n\nDebe ingresar la abreviatura");
      return;
    }

    try {
      setLoading(true);

      console.log("📤 [TipoViaFormModal] Enviando datos:", formData);

      if (mode === "create") {
        const response = await createTipoVia(formData);
        console.log("✅ [TipoViaFormModal] Respuesta crear:", response);
        window.alert("✅ ÉXITO\n\nTipo de vía creado exitosamente");
      } else {
        const response = await updateTipoVia(initialData.id, formData);
        console.log("✅ [TipoViaFormModal] Respuesta actualizar:", response);
        window.alert("✅ ÉXITO\n\nTipo de vía actualizado exitosamente");
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("❌ [TipoViaFormModal] Error completo:", error);
      console.error("❌ [TipoViaFormModal] error.response:", error.response);
      console.error("❌ [TipoViaFormModal] error.response.data:", error.response?.data);
      console.error("❌ [TipoViaFormModal] error.response.status:", error.response?.status);

      const errorData = error.response?.data;
      let errorTitle = "❌ ERROR AL GUARDAR TIPO DE VÍA";
      let errorMessage = "";

      // Mejor manejo de errores con más detalle
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorMessage = errorData.errors
          .map((err) => {
            const field = err.field || err.path || "Campo";
            const msg = err.message || "Error desconocido";
            return `• ${field}: ${msg}`;
          })
          .join("\n");
      } else if (errorData?.error) {
        // Algunos backends envían {error: "mensaje"}
        errorMessage = errorData.error;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = "Error desconocido al guardar el tipo de vía";
      }

      // Agregar información del código de estado HTTP si existe
      if (error.response?.status) {
        errorMessage = `[HTTP ${error.response.status}] ${errorMessage}`;
      }

      window.alert(`${errorTitle}\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setFormData({
      codigo: "",
      nombre: "",
      abreviatura: "",
      orden: "",
      descripcion: "",
    });
    onClose();
  }

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 p-4 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Type
                size={20}
                className="text-primary-700 dark:text-primary-400"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {mode === "create" ? "Nuevo Tipo de Vía" : "Editar Tipo de Vía"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complete los datos del tipo de vía
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* ============================================
            FORMULARIO
            ============================================ */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) =>
                setFormData({ ...formData, codigo: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              placeholder="Ejemplo: AV"
              required
              autoFocus
              maxLength={10}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Código único de 2-10 caracteres (solo letras y números, sin espacios)
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              placeholder="Ejemplo: Avenida"
              required
            />
          </div>

          {/* Abreviatura */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Abreviatura <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.abreviatura}
              onChange={(e) =>
                setFormData({ ...formData, abreviatura: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              placeholder="Ejemplo: Av."
              required
            />
          </div>

          {/* Orden */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Orden de Visualización
            </label>
            <input
              type="number"
              value={formData.orden}
              onChange={(e) =>
                setFormData({ ...formData, orden: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              placeholder="Ejemplo: 1, 2, 3..."
              min="0"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Orden para mostrar en listados (menor número aparece primero)
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-3 py-2 text-slate-900 dark:text-slate-50"
              placeholder="Descripción opcional del tipo de vía"
            />
          </div>

          {/* ============================================
              INFORMACIÓN DE AUDITORÍA (Solo al editar)
              ============================================ */}
          {mode === "edit" && initialData && (
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">
                Información de Auditoría
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Creado Por
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {initialData.creadorTipoVia?.username || initialData.created_by || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Fecha de Creación
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {initialData.created_at ? new Date(initialData.created_at).toLocaleString("es-PE") : "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Actualizado Por
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {initialData.actualizadorTipoVia?.username || initialData.updated_by || "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Última Actualización
                  </label>
                  <p className="text-sm text-slate-900 dark:text-slate-50">
                    {initialData.updated_at ? new Date(initialData.updated_at).toLocaleString("es-PE") : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================
              BOTONES
              ============================================ */}
          <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2 pt-4 pb-2 -mx-6 px-6 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="submit-tipo-via-btn"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Atajo: ALT + G"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {mode === "create" ? "Crear" : "Actualizar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
