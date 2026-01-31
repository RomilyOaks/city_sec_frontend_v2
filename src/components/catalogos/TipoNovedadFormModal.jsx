/**
 * File: src/components/catalogos/TipoNovedadFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar tipos de novedad
 */

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { createTipoNovedad, updateTipoNovedad } from "../../services/tiposNovedadService";
import toast from "react-hot-toast";

export default function TipoNovedadFormModal({ tipo, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    color: "#6B7280",
  });
  const [loading, setLoading] = useState(false);

  // Inicializar formulario si estamos editando
  useEffect(() => {
    if (tipo) {
      setFormData({
        nombre: tipo.nombre || "",
        descripcion: tipo.descripcion || "",
        color: tipo.color || "#6B7280",
      });
    }
  }, [tipo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (formData.nombre.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        color: formData.color,
      };

      if (tipo) {
        await updateTipoNovedad(tipo.id, payload);
        toast.success("Tipo de novedad actualizado");
      } else {
        await createTipoNovedad(payload);
        toast.success("Tipo de novedad creado");
      }

      onSuccess();
    } catch (error) {
      console.error("Error guardando tipo de novedad:", error);
      toast.error(error.response?.data?.message || "Error al guardar tipo de novedad");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejo de tecla ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation(); // Evitar que otros handlers procesen el evento
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true); // Usar capture phase
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {tipo ? "Editar Tipo de Novedad" : "Nuevo Tipo de Novedad"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {tipo ? "Modifica los datos del tipo de novedad" : "Crea un nuevo tipo de novedad para el sistema"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Emergencia Médica"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                maxLength={100}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.nombre.length}/100 caracteres
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe brevemente este tipo de novedad..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-primary-600/25 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.descripcion.length}/500 caracteres
              </p>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Color de Identificación
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="h-10 w-20 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#6B7280"
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950/40 focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Color para identificar visualmente este tipo de novedad
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                {tipo ? "Actualizar" : "Crear"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
