/**
 * File: src/components/catalogos/RadioTetraFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar radios TETRA
 *
 * @module src/components/catalogos/RadioTetraFormModal.jsx
 */

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { X, Save } from "lucide-react";
import { radioTetraService } from "../../services/radiosTetraService.js";

/**
 * Modal para crear/editar radios TETRA
 * @component
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function RadioTetraFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "create", // "create" | "edit"
  radio = null,
}) {
  // Estados del formulario
  const [formData, setFormData] = useState({
    radio_tetra_code: "",
    descripcion: "",
    fecha_fabricacion: "",
    estado: true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Efecto para cargar datos en modo edición
  useEffect(() => {
    if (mode === "edit" && radio) {
      setFormData({
        radio_tetra_code: radio.radio_tetra_code || "",
        descripcion: radio.descripcion || "",
        fecha_fabricacion: radio.fecha_fabricacion || "",
        estado: radio.estado ?? true,
      });
    } else {
      // Resetear formulario en modo creación
      setFormData({
        radio_tetra_code: "",
        descripcion: "",
        fecha_fabricacion: "",
        estado: true,
      });
    }
  }, [mode, radio, isOpen]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.radio_tetra_code.trim()) {
      newErrors.radio_tetra_code = "El código del radio es requerido";
    } else if (formData.radio_tetra_code.length > 10) {
      newErrors.radio_tetra_code = "El código no puede exceder 10 caracteres";
    }

    if (formData.descripcion && formData.descripcion.length > 50) {
      newErrors.descripcion = "La descripción no puede exceder 50 caracteres";
    }

    if (formData.fecha_fabricacion) {
      const fecha = new Date(formData.fecha_fabricacion);
      const hoy = new Date();
      if (fecha > hoy) {
        newErrors.fecha_fabricacion = "La fecha de fabricación no puede ser futura";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const dataToSubmit = {
        ...formData,
        radio_tetra_code: formData.radio_tetra_code.trim(),
        descripcion: formData.descripcion.trim() || null,
        fecha_fabricacion: formData.fecha_fabricacion || null,
      };

      if (mode === "create") {
        await radioTetraService.createRadio(dataToSubmit);
        toast.success("Radio creado exitosamente");
      } else {
        await radioTetraService.updateRadio(radio.id, dataToSubmit);
        toast.success("Radio actualizado exitosamente");
      }

      onSuccess();
    } catch (error) {
      console.error("Error guardando radio:", error);
      
      // Manejar errores específicos
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        const formattedErrors = {};
        
        serverErrors.forEach((err) => {
          formattedErrors[err.field] = err.message;
        });
        
        setErrors(formattedErrors);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(mode === "create" ? "Error al crear el radio" : "Error al actualizar el radio");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (!loading) {
      setErrors({});
      onClose();
    }
  };

  // Renderizado
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === "create" ? "Nuevo Radio TETRA" : "Editar Radio TETRA"}
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Código del radio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Código del Radio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="radio_tetra_code"
                value={formData.radio_tetra_code}
                onChange={handleChange}
                disabled={loading}
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.radio_tetra_code
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Ej: TETRA-001"
              />
              {errors.radio_tetra_code && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.radio_tetra_code}
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                disabled={loading}
                maxLength={50}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none ${
                  errors.descripcion
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder="Descripción del radio (opcional)"
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.descripcion}
                </p>
              )}
            </div>

            {/* Fecha de fabricación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de Fabricación
              </label>
              <input
                type="date"
                name="fecha_fabricacion"
                value={formData.fecha_fabricacion}
                onChange={handleChange}
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                  errors.fecha_fabricacion
                    ? "border-red-500 dark:border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              />
              {errors.fecha_fabricacion && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.fecha_fabricacion}
                </p>
              )}
            </div>

            {/* Estado */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="estado"
                id="estado"
                checked={formData.estado}
                onChange={handleChange}
                disabled={loading}
                className="h-4 w-4 text-primary-600 focus:ring-primary-600/25 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <label
                htmlFor="estado"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Radio activo
              </label>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? "Guardando..." : mode === "create" ? "Crear" : "Actualizar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
