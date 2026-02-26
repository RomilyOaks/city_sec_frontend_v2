/**
 * File: src/components/admin/permisos/EditarPermisoModal.jsx
 * @version 1.0.0
 * @description Modal para editar permisos existentes del sistema
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { X, Save, Lock, Info } from "lucide-react";

import { updatePermiso } from "../../../services/permisosService.js";

/**
 * EditarPermisoModal - Modal para editar permisos
 * @component
 */
export default function EditarPermisoModal({ permiso, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    descripcion: permiso?.descripcion || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Manejar cambios en la descripción
  const handleChange = (e) => {
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
        descripcion: formData.descripcion.trim() || null,
      };
      
      await updatePermiso(permiso.id, payload);
      
      toast.success("Permiso actualizado exitosamente");
      onSuccess && onSuccess();
    } catch (error) {
      console.error("Error actualizando permiso:", error);
      const errorMessage = error.response?.data?.message || "Error al actualizar el permiso";
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

  if (!permiso) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Editar Permiso
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Modifica la descripción del permiso
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
          {/* Información del permiso (solo lectura) */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={16} className="text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Información del Permiso (Solo lectura)
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Slug</label>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 bg-white dark:bg-slate-800 text-xs font-mono rounded border border-slate-300 dark:border-slate-600">
                      {permiso.slug}
                    </code>
                    {permiso.es_sistema && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Sistema
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Módulo</label>
                    <div className="px-2 py-1 bg-white dark:bg-slate-800 text-sm rounded border border-slate-300 dark:border-slate-600">
                      {permiso.modulo}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Recurso</label>
                    <div className="px-2 py-1 bg-white dark:bg-slate-800 text-sm rounded border border-slate-300 dark:border-slate-600">
                      {permiso.recurso}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400">Acción</label>
                    <div className="px-2 py-1 bg-white dark:bg-slate-800 text-sm rounded border border-slate-300 dark:border-slate-600">
                      {permiso.accion}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400">Estado</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      permiso.estado
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}>
                      {permiso.estado ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campo editable: Descripción */}
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
              onChange={handleChange}
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
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <Info size={16} className="text-amber-600 dark:text-amber-400 mt-0.5" />
              </div>
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">Restricciones de edición:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                  <li>Solo se puede modificar la descripción del permiso</li>
                  <li>El slug, módulo, recurso y acción son inmutables</li>
                  <li>Los permisos del sistema no se pueden editar</li>
                  <li>El estado se cambia desde la lista principal</li>
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
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
