/**
 * File: src/components/catalogos/CargoViewModal.jsx
 * @version 1.0.0
 * @description Modal para ver detalles de cargos (solo lectura)
 *
 * @module src/components/catalogos/CargoViewModal
 */

import { useEffect, useCallback } from "react";
import { X, User, Briefcase, DollarSign, Hash, Palette, Users, Clock, CheckCircle, XCircle } from "lucide-react";

function CargoViewModal({ isOpen, onClose, cargo }) {
  // Manejar tecla Escape para cerrar modal
  const handleEscapeKey = useCallback((event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;
  
  // Si no hay cargo, mostrar mensaje
  if (!cargo) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Error
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              No se encontró información del cargo.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: cargo.color || "#3B82F6" }}
              >
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {cargo.nombre}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {cargo.codigo}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Descripción
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {cargo.descripcion || "Sin descripción"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200">
                    {cargo.categoria}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nivel Jerárquico
                  </label>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(cargo.nivel_jerarquico / 20) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {cargo.nivel_jerarquico}/20
                    </span>
                  </div>
                </div>
              </div>

              {/* Información Adicional */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <DollarSign className="inline w-4 h-4 mr-1" />
                    Salario Base
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    S/ {cargo.salario_base != null ? parseFloat(cargo.salario_base).toFixed(2) : "0.00"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Hash className="inline w-4 h-4 mr-1" />
                    Código
                  </label>
                  <p className="font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                    {cargo.codigo}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Palette className="inline w-4 h-4 mr-1" />
                    Color Identificación
                  </label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-gray-300"
                      style={{ backgroundColor: cargo.color || "#3B82F6" }}
                    />
                    <span className="font-mono text-sm text-gray-900 dark:text-white">
                      {cargo.color || "#3B82F6"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado y Requisitos */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  {cargo.estado ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Estado
                    </p>
                    <p className={`text-sm ${cargo.estado ? "text-green-600" : "text-red-600"}`}>
                      {cargo.estado ? "Activo" : "Inactivo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {cargo.requiere_licencia ? (
                    <Users className="w-5 h-5 text-blue-500" />
                  ) : (
                    <Users className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Licencia
                    </p>
                    <p className={`text-sm ${cargo.requiere_licencia ? "text-blue-600" : "text-gray-500"}`}>
                      {cargo.requiere_licencia ? "Requiere licencia" : "No requiere licencia"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas si están disponibles */}
            {cargo.cantidad_personal !== undefined && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Personal Asignado
                    </p>
                    <p className="text-lg font-semibold text-primary-600">
                      {cargo.cantidad_personal} {cargo.cantidad_personal === 1 ? "persona" : "personas"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Creado
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(cargo.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">
                    <Clock className="inline w-4 h-4 mr-1" />
                    Actualizado
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(cargo.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CargoViewModal;
