/**
 * File: src/components/admin/permisos/CrearPermisoModal.jsx
 * @version 1.0.0
 * @description Modal para crear nuevos permisos del sistema
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { X, Save, Eye, EyeOff } from "lucide-react";

import { createPermiso } from "../../../services/permisosService.js";

/**
 * CrearPermisoModal - Modal para crear permisos
 * @component
 */
export default function CrearPermisoModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    modulo: "",
    recurso: "",
    accion: "",
    descripcion: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Generar slug automáticamente
  const generateSlug = () => {
    const { modulo, recurso, accion } = formData;
    if (modulo && recurso && accion) {
      return `${modulo.toLowerCase()}.${recurso.toLowerCase()}.${accion.toLowerCase()}`;
    }
    return "";
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Solo permitir letras minúsculas y guiones bajos
    const sanitizedValue = value.toLowerCase().replace(/[^a-z_]/g, "");
    
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Manejar cambios en descripción (permite caracteres normales)
  const handleDescripcionChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      descripcion: value
    }));
    
    // Limpiar error del campo
    if (errors.descripcion) {
      setErrors(prev => ({
        ...prev,
        descripcion: ""
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.modulo.trim()) {
      newErrors.modulo = "El módulo es requerido";
    } else if (!/^[a-z_]+$/.test(formData.modulo)) {
      newErrors.modulo = "Solo se permiten letras minúsculas y guiones bajos";
    }

    if (!formData.recurso.trim()) {
      newErrors.recurso = "El recurso es requerido";
    } else if (!/^[a-z_]+$/.test(formData.recurso)) {
      newErrors.recurso = "Solo se permiten letras minúsculas y guiones bajos";
    }

    if (!formData.accion.trim()) {
      newErrors.accion = "La acción es requerida";
    } else if (!/^[a-z_]+$/.test(formData.accion)) {
      newErrors.accion = "Solo se permiten letras minúsculas y guiones bajos";
    }

    if (formData.descripcion && formData.descripcion.length > 500) {
      newErrors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Por favor corrija los errores del formulario");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        modulo: formData.modulo,
        recurso: formData.recurso,
        accion: formData.accion,
        descripcion: formData.descripcion.trim() || null,
      };
      
      await createPermiso(payload);
      
      toast.success("Permiso creado exitosamente");
      onSuccess && onSuccess();
    } catch (error) {
      console.error("Error creando permiso:", error);
      const errorMessage = error.response?.data?.message || "Error al crear el permiso";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Manejar tecla ESC
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  const slug = generateSlug();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Crear Nuevo Permiso
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Define un nuevo permiso de acceso para el sistema
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Módulo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Módulo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="modulo"
                value={formData.modulo}
                onChange={handleChange}
                placeholder="ej: usuarios"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.modulo ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-700"
                }`}
              />
              {errors.modulo && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.modulo}</p>
              )}
            </div>

            {/* Recurso */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recurso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="recurso"
                value={formData.recurso}
                onChange={handleChange}
                placeholder="ej: roles"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.recurso ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-700"
                }`}
              />
              {errors.recurso && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.recurso}</p>
              )}
            </div>

            {/* Acción */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Acción <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="accion"
                value={formData.accion}
                onChange={handleChange}
                placeholder="ej: create"
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  errors.accion ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-700"
                }`}
              />
              {errors.accion && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.accion}</p>
              )}
            </div>
          </div>

          {/* Preview del Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Slug (Identificador Técnico)
            </label>
            <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <code className="flex-1 font-mono text-sm text-slate-700 dark:text-slate-300">
                {slug || "modulo.recurso.accion"}
              </code>
              {slug && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <Eye size={14} />
                  Auto-generado
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              El slug se genera automáticamente combinando módulo.recurso.acción
            </p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Descripción
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                (Opcional - Máx. 500 caracteres)
              </span>
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleDescripcionChange}
              rows={3}
              maxLength={500}
              placeholder="Describe qué permite este permiso..."
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none ${
                errors.descripcion ? "border-red-300 dark:border-red-600" : "border-slate-300 dark:border-slate-700"
              }`}
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.descripcion}</p>
            )}
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 text-right">
              {formData.descripcion.length}/500 caracteres
            </div>
          </div>

          {/* Nota importante */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <EyeOff size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Nota importante:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>Los campos se guardarán automáticamente en minúsculas</li>
                  <li>Solo se permiten letras minúsculas y guiones bajos (_)</li>
                  <li>El slug no se puede modificar después de crear el permiso</li>
                  <li>Los permisos del sistema (es_sistema: true) no se pueden editar ni eliminar</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !slug}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Creando..." : "Crear Permiso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
