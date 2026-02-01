/**
 * File: src/components/calles/CalleCuadranteFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar relaciones calle-cuadrante
 */

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  createCalleCuadrante,
  updateCalleCuadrante,
} from "../../services/callesCuadrantesService";
import { listCuadrantes } from "../../services/cuadrantesService";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/useAuthStore";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const LADOS = [
  { value: "AMBOS", label: "Ambos lados" },
  { value: "PAR", label: "Solo pares" },
  { value: "IMPAR", label: "Solo impares" },
  { value: "TODOS", label: "Todos" },
];

export default function CalleCuadranteFormModal({
  isOpen,
  onClose,
  calleCuadrante,
  calleId,
  calleNombre,
  onSuccess,
}) {
  const { user } = useAuthStore();

  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(isOpen);

  const [loading, setLoading] = useState(false);
  const [cuadrantes, setCuadrantes] = useState([]);
  const [loadingCuadrantes, setLoadingCuadrantes] = useState(true);
  const [validationError, setValidationError] = useState("");

  const [formData, setFormData] = useState({
    calle_id: calleId || "",
    cuadrante_id: "",
    numero_inicio: "",
    numero_fin: "",
    manzana: "",
    lado: "AMBOS",
    desde_interseccion: "",
    hasta_interseccion: "",
    prioridad: 1,
    observaciones: "",
  });

  // Cargar datos del formulario si es edición
  useEffect(() => {
    if (isOpen) {
      setValidationError("");

      if (calleCuadrante) {
        // Modo edición
        setFormData({
          calle_id: calleCuadrante.calle_id || calleId,
          cuadrante_id: calleCuadrante.cuadrante_id || "",
          numero_inicio: calleCuadrante.numero_inicio || "",
          numero_fin: calleCuadrante.numero_fin || "",
          manzana: calleCuadrante.manzana || "",
          lado: calleCuadrante.lado || "AMBOS",
          desde_interseccion: calleCuadrante.desde_interseccion || "",
          hasta_interseccion: calleCuadrante.hasta_interseccion || "",
          prioridad: calleCuadrante.prioridad || 1,
          observaciones: calleCuadrante.observaciones || "",
        });
      } else {
        // Modo creación
        setFormData({
          calle_id: calleId || "",
          cuadrante_id: "",
          numero_inicio: "",
          numero_fin: "",
          manzana: "",
          lado: "AMBOS",
          desde_interseccion: "",
          hasta_interseccion: "",
          prioridad: 1,
          observaciones: "",
        });
      }
    }
  }, [calleCuadrante, calleId, isOpen]);

  // Cargar lista de cuadrantes
  useEffect(() => {
    const loadCuadrantes = async () => {
      try {
        setLoadingCuadrantes(true);
        console.log("📡 [Modal] Cargando cuadrantes para dropdown...");
        const result = await listCuadrantes({ limit: 100 }); // Límite razonable
        console.log("✅ [Modal] Cuadrantes recibidos:", result);
        setCuadrantes(result.items || []);
      } catch (error) {
        console.error("❌ [Modal] Error al cargar cuadrantes:", error);
        console.error("❌ [Modal] Error response:", error.response?.data);
        toast.error("Error al cargar cuadrantes");
      } finally {
        setLoadingCuadrantes(false);
      }
    };

    if (isOpen) {
      loadCuadrantes();
    }
  }, [isOpen]);

  // Keyboard shortcuts: ESC para cerrar, ALT+G para guardar, P/I/A para cambiar Lado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC - Cerrar modal
      if (e.key === "Escape" && isOpen && !loading) {
        e.preventDefault();
        handleClose();
      }
      // ALT + G - Guardar/Crear
      if (e.altKey && e.key === "g" && isOpen && !loading) {
        e.preventDefault();
        // Trigger form submit
        document.getElementById("calle-cuadrante-form")?.requestSubmit();
      }
      // Atajos de teclado para el campo Lado (solo si el select está enfocado)
      const activeElement = document.activeElement;
      const isLadoSelect = activeElement?.name === "lado";

      if (isOpen && !loading && isLadoSelect) {
        // P = PAR
        if (e.key === "p" || e.key === "P") {
          e.preventDefault();
          setFormData((prev) => ({ ...prev, lado: "PAR" }));
        }
        // I = IMPAR
        if (e.key === "i" || e.key === "I") {
          e.preventDefault();
          setFormData((prev) => ({ ...prev, lado: "IMPAR" }));
        }
        // A = AMBOS
        if (e.key === "a" || e.key === "A") {
          e.preventDefault();
          setFormData((prev) => ({ ...prev, lado: "AMBOS" }));
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, loading]);

  const handleClose = () => {
    setFormData({
      calle_id: calleId || "",
      cuadrante_id: "",
      numero_inicio: "",
      numero_fin: "",
      manzana: "",
      lado: "AMBOS",
      desde_interseccion: "",
      hasta_interseccion: "",
      prioridad: 1,
      observaciones: "",
    });
    setValidationError("");
    onClose();
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    // Normalizar manzana a MAYÚSCULAS y limitar a 10 caracteres
    if (name === "manzana") {
      value = value.toUpperCase().slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationError(""); // Limpiar error al cambiar
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setValidationError("");

    try {
      // Validaciones frontend
      if (!formData.cuadrante_id) {
        setValidationError("Debe seleccionar un cuadrante");
        toast.error("Debe seleccionar un cuadrante");
        setLoading(false);
        return;
      }

      // Validar: manzana es obligatoria SOLO si NO hay numeración municipal (numero_inicio y numero_fin)
      const hasNumericRange = formData.numero_inicio && formData.numero_fin;
      if (!hasNumericRange && !formData.manzana.trim()) {
        setValidationError(
          "La manzana es obligatoria cuando no hay numeración municipal (número inicial + final)"
        );
        toast.error(
          "La manzana es obligatoria cuando no hay numeración municipal"
        );
        setLoading(false);
        return;
      }

      // Validar rango de numeración si se proporciona
      if (formData.numero_inicio && formData.numero_fin) {
        const inicio = parseInt(formData.numero_inicio);
        const fin = parseInt(formData.numero_fin);

        if (fin < inicio) {
          setValidationError(
            "El número final debe ser mayor o igual al número inicial"
          );
          toast.error(
            "El número final debe ser mayor o igual al número inicial"
          );
          setLoading(false);
          return;
        }
      }

      // Preparar datos para enviar
      const dataToSend = {
        calle_id: parseInt(formData.calle_id),
        cuadrante_id: parseInt(formData.cuadrante_id),
        numero_inicio: formData.numero_inicio
          ? parseInt(formData.numero_inicio)
          : null,
        numero_fin: formData.numero_fin ? parseInt(formData.numero_fin) : null,
        manzana: formData.manzana?.trim().toUpperCase() || null,
        lado: formData.lado,
        desde_interseccion: formData.desde_interseccion?.trim() || null,
        hasta_interseccion: formData.hasta_interseccion?.trim() || null,
        prioridad: parseInt(formData.prioridad) || 1,
        observaciones: formData.observaciones?.trim() || null,
        created_by: user?.id,
        updated_by: user?.id,
      };

      if (calleCuadrante) {
        await updateCalleCuadrante(calleCuadrante.id, dataToSend);
        toast.success("Relación actualizada correctamente");
      } else {
        await createCalleCuadrante(dataToSend);
        toast.success("Relación creada correctamente");
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error al guardar relación:", error);

      // Extraer mensaje de error del backend
      const backendData = error.response?.data;
      let errorMessage = "";

      if (backendData?.message) {
        errorMessage = backendData.message;
      } else if (backendData?.error) {
        errorMessage = backendData.error;
      } else if (backendData?.errors) {
        if (Array.isArray(backendData.errors)) {
          errorMessage = backendData.errors
            .map((e) => e.message || e)
            .join(", ");
        } else if (typeof backendData.errors === "object") {
          errorMessage = Object.values(backendData.errors).join(", ");
        }
      } else if (typeof backendData === "string") {
        errorMessage = backendData;
      }

      const finalError = errorMessage || "Error al guardar la relación";
      setValidationError(finalError);
      toast.error(finalError);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {calleCuadrante ? "Editar" : "Nuevo"} Cuadrante para {calleNombre}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Error de validación */}
        {validationError && (
          <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              {validationError}
            </p>
          </div>
        )}

        {/* Form */}
        <form
          id="calle-cuadrante-form"
          onSubmit={handleSubmit}
          className="p-6 space-y-6"
        >
          {/* Cuadrante - Campo obligatorio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Cuadrante <span className="text-red-500">*</span>
            </label>
            <select
              name="cuadrante_id"
              value={formData.cuadrante_id}
              onChange={handleChange}
              required
              disabled={loadingCuadrantes || !!calleCuadrante}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingCuadrantes ? "Cargando..." : "Seleccione un cuadrante"}
              </option>
              {cuadrantes.map((cuad) => (
                <option key={cuad.id} value={cuad.id}>
                  {cuad.cuadrante_code || cuad.codigo} -{" "}
                  {cuad.Sector?.sector_code ||
                    cuad.sector?.sector_code ||
                    "S/N"}{" "}
                  {cuad.Sector?.nombre || cuad.sector?.nombre || cuad.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {calleCuadrante
                ? "No puede modificar el cuadrante al editar. Si necesita cambiarlo, elimine este registro y cree uno nuevo."
                : 'Seleccione el cuadrante por donde pasa esta calle. Puede asignar el mismo cuadrante con diferente "Lado" (PAR/IMPAR/AMBOS).'}
            </p>
          </div>

          {/* Tip de ayuda */}
          <div className="flex justify-end mb-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Tip:
              </span>{" "}
              ESC para cerrar • ALT+G para guardar
            </p>
          </div>

          {/* NOTE: Manzana moved next to Lado further below */}

          {/* Rango de numeración */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número Inicial
              </label>
              <input
                type="number"
                name="numero_inicio"
                value={formData.numero_inicio}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="Ej: 100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Número Final
              </label>
              <input
                type="number"
                name="numero_fin"
                value={formData.numero_fin}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="Ej: 299"
              />
            </div>
          </div>

          {/* Lado + Manzana (Manzana ahora a la derecha del Lado en la misma fila) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Lado
              </label>
              <select
                name="lado"
                value={formData.lado}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              >
                {LADOS.map((lado) => (
                  <option key={lado.value} value={lado.value}>
                    {lado.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Manzana{" "}
                {!formData.numero_inicio && !formData.numero_fin && (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="text"
                name="manzana"
                value={formData.manzana}
                onChange={handleChange}
                maxLength="10"
                placeholder="Ej: A1 (se guardará en MAYÚSCULAS)"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.numero_inicio && formData.numero_fin
                  ? "Opcional — manzana adicional (máx 10 caracteres)."
                  : "Obligatoria si NO hay numeración municipal. Máx 10 caracteres."}
              </p>
            </div>
          </div>

          {/* Intersecciones */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Desde Intersección
              </label>
              <input
                type="text"
                name="desde_interseccion"
                value={formData.desde_interseccion}
                onChange={handleChange}
                maxLength="200"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="Ej: Av. Arequipa"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Hasta Intersección
              </label>
              <input
                type="text"
                name="hasta_interseccion"
                value={formData.hasta_interseccion}
                onChange={handleChange}
                maxLength="200"
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
                placeholder="Ej: Jr. Lampa"
              />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Prioridad
            </label>
            <input
              type="number"
              name="prioridad"
              value={formData.prioridad}
              onChange={handleChange}
              min="1"
              max="10"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              1 = mayor prioridad, 10 = menor prioridad (para resolver
              conflictos de solapamiento)
            </p>
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
              rows="3"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-slate-700 dark:text-white resize-none"
              placeholder="Notas adicionales sobre este tramo..."
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? "Guardando..."
                : calleCuadrante
                ? "Actualizar"
                : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
