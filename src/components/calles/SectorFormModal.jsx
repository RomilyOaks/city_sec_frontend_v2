/**
 * File: src/components/calles/SectorFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar sectores
 */

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createSector, updateSector } from "../../services/sectoresService";
import toast from "react-hot-toast";

export default function SectorFormModal({ isOpen, onClose, sector, onSuccess }) {
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sector) {
      setFormData({
        codigo: sector.codigo || "",
        nombre: sector.nombre || "",
        descripcion: sector.descripcion || "",
      });
    } else {
      setFormData({
        codigo: "",
        nombre: "",
        descripcion: "",
      });
    }
  }, [sector, isOpen]);

  // Autofocus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById("sector-codigo")?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      // ESC para cerrar
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      // ALT+G para guardar
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        document.getElementById("submit-sector-btn")?.click();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    setFormData({
      codigo: "",
      nombre: "",
      descripcion: "",
    });
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (sector) {
        await updateSector(sector.id, formData);
        toast.success("Sector actualizado correctamente");
      } else {
        await createSector(formData);
        toast.success("Sector creado correctamente");
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error al guardar sector:", error);
      toast.error(
        error.response?.data?.message || "Error al guardar el sector"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {sector ? "Editar Sector" : "Nuevo Sector"}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Cerrar (ESC)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Código */}
          <div>
            <label
              htmlFor="sector-codigo"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Código <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sector-codigo"
              name="codigo"
              value={formData.codigo}
              onChange={handleChange}
              required
              maxLength={10}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ej: S01"
            />
          </div>

          {/* Nombre */}
          <div>
            <label
              htmlFor="sector-nombre"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="sector-nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Ej: Sector Centro"
            />
          </div>

          {/* Descripción */}
          <div>
            <label
              htmlFor="sector-descripcion"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Descripción
            </label>
            <textarea
              id="sector-descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Descripción del sector..."
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="submit-sector-btn"
              className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              title="Guardar (ALT+G)"
            >
              {loading ? "Guardando..." : sector ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
