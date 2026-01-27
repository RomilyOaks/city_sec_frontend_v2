/**
 * File: src/components/catalogos/AsignarPersonalModal.jsx
 * @version 1.0.0
 * @description Modal para asignar personal a radios TETRA
 *
 * @module src/components/catalogos/AsignarPersonalModal.jsx
 */

import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { X, UserPlus, Save } from "lucide-react";
import { radioTetraService } from "../../services/radiosTetraService.js";
import PersonalDropdown from "./PersonalDropdown.jsx";

/**
 * Modal para asignar personal a radios TETRA
 * @component
 * @param {Object} props - Props del componente
 * @returns {JSX.Element}
 */
export default function AsignarPersonalModal({
  isOpen,
  onClose,
  onSuccess,
  radio = null,
}) {
  // Estados
  const [personalSeleccionado, setPersonalSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manejar asignación
  const handleAsignar = async () => {
    if (!personalSeleccionado) {
      toast.error("Seleccione un personal para asignar");
      return;
    }

    setLoading(true);

    try {
      await radioTetraService.asignarRadio(radio.id, personalSeleccionado.id);
      toast.success("Personal asignado exitosamente");
      onSuccess();
    } catch (error) {
      console.error("Error asignando personal:", error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Error al asignar personal");
      }
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal
  const handleClose = () => {
    if (!loading) {
      setPersonalSeleccionado(null);
      onClose();
    }
  };

  // Renderizado
  if (!isOpen || !radio) return null;

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
              Asignar Personal
            </h2>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X size={24} />
            </button>
          </div>

          {/* Información del radio */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <UserPlus size={20} className="text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {radio.radio_tetra_code}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {radio.descripcion || "Sin descripción"}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            {/* Selección de personal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar Personal <span className="text-red-500">*</span>
              </label>
              <PersonalDropdown
                onSeleccionar={setPersonalSeleccionado}
                value={personalSeleccionado}
                placeholder="Buscar por apellidos (mín. 3 caracteres)..."
              />
            </div>

            {/* Información del personal seleccionado */}
            {personalSeleccionado && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <UserPlus size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-800 dark:text-green-200">
                      {personalSeleccionado.nombre_completo}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {personalSeleccionado.documento} • {personalSeleccionado.codigo_acceso}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignar}
                disabled={loading || !personalSeleccionado}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? "Asignando..." : "Asignar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
