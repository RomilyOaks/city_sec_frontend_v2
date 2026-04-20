/**
 * File: src/components/catalogos/CargoFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar cargos
 *
 * @module src/components/catalogos/CargoFormModal
 */

import { useState, useEffect } from "react";
import { X, User, Briefcase, Hash, Palette, DollarSign, RefreshCw } from "lucide-react";
import { createCargo, updateCargo } from "../../services/cargosService.js";
import { toast } from "react-hot-toast";

// Opciones de categoría
const CATEGORIAS = [
  "Operativo",
  "Supervisión", 
  "Administrativo",
  "Técnico",
  "Dirección",
  "Apoyo"
];

// Colores predefinidos
const COLORES_PREDEFINIDOS = [
  "#3B82F6", // Azul
  "#10B981", // Verde
  "#F59E0B", // Amarillo
  "#EF4444", // Rojo
  "#8B5CF6", // Púrpura
  "#EC4899", // Rosa
  "#6B7280", // Gris
  "#059669", // Verde oscuro
  "#DC2626", // Rojo oscuro
  "#7C3AED", // Púrpura oscuro
];

function CargoFormModal({ isOpen, onClose, cargo, onSuccess }) {
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    nivel_jerarquico: 5,
    categoria: "Operativo",
    requiere_licencia: false,
    salario_base: 0,
    codigo: "",
    color: "#3B82F6",
  });
  const [errores, setErrores] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resetear formulario y cargar datos si es edición
  useEffect(() => {
    if (!isOpen) return;

    if (cargo) {
      // Modo edición
      setFormData({
        nombre: cargo.nombre || "",
        descripcion: cargo.descripcion || "",
        nivel_jerarquico: cargo.nivel_jerarquico || 5,
        categoria: cargo.categoria || "Operativo",
        requiere_licencia: cargo.requiere_licencia || false,
        salario_base: cargo.salario_base || 0,
        codigo: cargo.codigo || "",
        color: cargo.color || "#3B82F6",
      });
    } else {
      // Modo creación
      setFormData({
        nombre: "",
        descripcion: "",
        nivel_jerarquico: 5,
        categoria: "Operativo",
        requiere_licencia: false,
        salario_base: 0,
        codigo: "",
        color: "#3B82F6",
      });
    }
    setErrores({});
  }, [isOpen, cargo]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre del cargo es obligatorio";
    } else if (formData.nombre.length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres";
    } else if (formData.nombre.length > 100) {
      newErrors.nombre = "El nombre no puede exceder 100 caracteres";
    }

    // Validar descripción
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es obligatoria";
    } else if (formData.descripcion.length < 10) {
      newErrors.descripcion = "La descripción debe tener al menos 10 caracteres";
    } else if (formData.descripcion.length > 500) {
      newErrors.descripcion = "La descripción no puede exceder 500 caracteres";
    }

    // Validar nivel jerárquico
    if (!formData.nivel_jerarquico) {
      newErrors.nivel_jerarquico = "El nivel jerárquico es obligatorio";
    } else if (formData.nivel_jerarquico < 1 || formData.nivel_jerarquico > 10) {
      newErrors.nivel_jerarquico = "El nivel jerárquico debe estar entre 1 y 10";
    }

    // Validar categoría
    if (!formData.categoria) {
      newErrors.categoria = "La categoría es obligatoria";
    }

    // Validar salario base
    if (formData.salario_base < 0) {
      newErrors.salario_base = "El salario base debe ser mayor o igual a 0";
    }

    // Validar código
    if (!formData.codigo.trim()) {
      newErrors.codigo = "El código es obligatorio";
    } else if (formData.codigo.length < 3) {
      newErrors.codigo = "El código debe tener al menos 3 caracteres";
    } else if (formData.codigo.length > 20) {
      newErrors.codigo = "El código no puede exceder 20 caracteres";
    }

    // Validar color
    if (!formData.color) {
      newErrors.color = "El color es obligatorio";
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(formData.color)) {
      newErrors.color = "El color debe tener formato hexadecimal (#RRGGBB)";
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrores({});

    try {
      const dataToSubmit = {
        ...formData,
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        codigo: formData.codigo.trim().toUpperCase(),
      };

      if (cargo) {
        await updateCargo(cargo.id, dataToSubmit);
        toast.success("Cargo actualizado correctamente");
      } else {
        await createCargo(dataToSubmit);
        toast.success("Cargo creado correctamente");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error guardando cargo:', error);
      
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrores(error.response.data.errors);
      } else {
        setErrores({ general: error.response?.data?.message || 'Error al guardar el cargo' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {cargo ? "Editar Cargo" : "Nuevo Cargo"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <User className="inline w-4 h-4 mr-1" />
                Nombre del Cargo
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm ${
                  errores.nombre ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Ej: Sereno, Supervisor, Administrador"
              />
              {errores.nombre && (
                <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Briefcase className="inline w-4 h-4 mr-1" />
                Descripción
              </label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                rows={2}
                className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm ${
                  errores.descripcion ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Describe las funciones y responsabilidades del cargo"
              />
              {errores.descripcion && (
                <p className="text-red-500 text-xs mt-1">{errores.descripcion}</p>
              )}
            </div>

            {/* Fila: Nivel Jerárquico + Categoría */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nivel Jerárquico (1-10)
                </label>
                <input
                  type="number"
                  name="nivel_jerarquico"
                  value={formData.nivel_jerarquico}
                  onChange={handleChange}
                  min="1"
                  max="10"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm ${
                    errores.nivel_jerarquico ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errores.nivel_jerarquico && (
                  <p className="text-red-500 text-xs mt-1">{errores.nivel_jerarquico}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm ${
                    errores.categoria ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errores.categoria && (
                  <p className="text-red-500 text-xs mt-1">{errores.categoria}</p>
                )}
              </div>
            </div>

            {/* Fila: Salario Base + Requiere Licencia */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="inline w-4 h-4 mr-1" />
                  Salario Base
                </label>
                <input
                  type="number"
                  name="salario_base"
                  value={formData.salario_base}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm ${
                    errores.salario_base ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errores.salario_base && (
                  <p className="text-red-500 text-xs mt-1">{errores.salario_base}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Requiere Licencia
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="requiere_licencia"
                      checked={formData.requiere_licencia}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Sí, requiere licencia
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Fila: Código + Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Hash className="inline w-4 h-4 mr-1" />
                  Código
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm ${
                    errores.codigo ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Ej: SERN-001"
                />
                {errores.codigo && (
                  <p className="text-red-500 text-xs mt-1">{errores.codigo}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Palette className="inline w-4 h-4 mr-1" />
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className={`h-8 w-16 border rounded cursor-pointer text-sm ${
                      errores.color ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="#3B82F6"
                  />
                </div>
                {errores.color && (
                  <p className="text-red-500 text-xs mt-1">{errores.color}</p>
                )}
              </div>
            </div>

            {/* Colores predefinidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Colores Predefinidos
              </label>
              <div className="flex flex-wrap gap-2">
                {COLORES_PREDEFINIDOS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color }))}
                    className={`w-6 h-6 rounded border-2 ${
                      formData.color === color ? "border-gray-900" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {errores.general && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errores.general}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Guardando...
                  </div>
                ) : (
                  cargo ? "Actualizar Cargo" : "Crear Cargo"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CargoFormModal;
