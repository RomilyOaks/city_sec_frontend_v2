/**
 * File: src/components/catalogos/SubtipoNovedadFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar subtipos de novedad
 */

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { createSubtipoNovedad, updateSubtipoNovedad } from "../../services/subtiposNovedadService";
import { listTiposNovedad } from "../../services/tiposNovedadService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import toast from "react-hot-toast";

export default function SubtipoNovedadFormModal({ subtipo, tipoId, onClose, onSuccess }) {
  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(true);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    prioridad: "BAJA",
    color: "#6B7280",
    tipo_novedad_id: tipoId || "",
  });
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);

  // Cargar tipos de novedad
  useEffect(() => {
    const fetchTipos = async () => {
      setLoadingTipos(true);
      try {
        const data = await listTiposNovedad();
        setTipos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando tipos de novedad:", error);
        toast.error("Error al cargar tipos de novedad");
      } finally {
        setLoadingTipos(false);
      }
    };

    fetchTipos();
  }, []);

  // Inicializar formulario si estamos editando
  useEffect(() => {
    if (subtipo) {
      setFormData({
        nombre: subtipo.nombre || "",
        descripcion: subtipo.descripcion || "",
        prioridad: subtipo.prioridad || "BAJA",
        color: subtipo.color || "#6B7280",
        tipo_novedad_id: subtipo.tipo_novedad_id || tipoId || "",
      });
    } else if (tipoId) {
      setFormData(prev => ({ ...prev, tipo_novedad_id: tipoId }));
    }
  }, [subtipo, tipoId]);

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

    if (!formData.tipo_novedad_id) {
      toast.error("Debe seleccionar un tipo de novedad");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        prioridad: formData.prioridad,
        color: formData.color,
        tipo_novedad_id: Number(formData.tipo_novedad_id),
      };

      if (subtipo) {
        await updateSubtipoNovedad(subtipo.id, payload);
        toast.success("Subtipo de novedad actualizado");
      } else {
        await createSubtipoNovedad(payload);
        toast.success("Subtipo de novedad creado");
      }

      onSuccess();
    } catch (error) {
      console.error("Error guardando subtipo de novedad:", error);
      toast.error(error.response?.data?.message || "Error al guardar subtipo de novedad");
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
              {subtipo ? "Editar Subtipo de Novedad" : "Nuevo Subtipo de Novedad"}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subtipo ? "Modifica los datos del subtipo de novedad" : "Crea un nuevo subtipo de novedad para el sistema"}
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
            {/* Tipo de Novedad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Novedad <span className="text-red-500">*</span>
              </label>
              {loadingTipos ? (
                <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-slate-500 dark:text-slate-400">Cargando tipos...</span>
                  </div>
                </div>
              ) : (
                <select
                  name="tipo_novedad_id"
                  value={formData.tipo_novedad_id}
                  onChange={handleChange}
                  disabled={!!tipoId}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona un tipo</option>
                  {tipos.map((tipo) => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              )}
              {tipoId && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tipo preseleccionado desde la vista principal
                </p>
              )}
            </div>

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
                placeholder="Ej: Accidente Vehicular"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/25"
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
                placeholder="Describe brevemente este subtipo de novedad..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/25 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {formData.descripcion.length}/500 caracteres
              </p>
            </div>

            {/* Prioridad */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prioridad
              </label>
              <select
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/25"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Nivel de prioridad para este subtipo de novedad
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
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-600/25"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Color para identificar visualmente este subtipo de novedad
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
                {subtipo ? "Actualizar" : "Crear"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
