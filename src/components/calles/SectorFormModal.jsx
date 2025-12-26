/**
 * File: src/components/calles/SectorFormModal.jsx
 * @version 2.0.0
 * @description Modal para crear/editar sectores con tabs y datos georeferenciados
 */

import { useState, useEffect } from "react";
import { X, MapPin, FileText } from "lucide-react";
import { createSector, updateSector } from "../../services/sectoresService";
import toast from "react-hot-toast";

export default function SectorFormModal({ isOpen, onClose, sector, onSuccess }) {
  const [activeTab, setActiveTab] = useState("basicos");
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    ubigeo: "",
    zona_code: "",
    poligono_json: "",
    color_mapa: "#4A6126",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (sector) {
      setFormData({
        codigo: sector.sector_code || sector.codigo || "",
        nombre: sector.nombre || "",
        descripcion: sector.descripcion || "",
        ubigeo: sector.ubigeo || "",
        zona_code: sector.zona_code || "",
        poligono_json: sector.poligono_json || "",
        color_mapa: sector.color_mapa || "#4A6126",
      });
    } else {
      setFormData({
        codigo: "",
        nombre: "",
        descripcion: "",
        ubigeo: "",
        zona_code: "",
        poligono_json: "",
        color_mapa: "#4A6126",
      });
    }
    setActiveTab("basicos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // PageDown para ir al tab derecho (georeferenciados)
      if (e.key === "PageDown") {
        e.preventDefault();
        setActiveTab("georeferenciados");
      }
      // PageUp para ir al tab izquierdo (basicos)
      if (e.key === "PageUp") {
        e.preventDefault();
        setActiveTab("basicos");
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
      ubigeo: "",
      zona_code: "",
      poligono_json: "",
      color_mapa: "#4A6126",
    });
    setActiveTab("basicos");
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
      const dataToSend = {
        sector_code: formData.codigo,
        nombre: formData.nombre,
        descripcion: formData.descripcion || null,
        ubigeo: formData.ubigeo || null,
        zona_code: formData.zona_code || null,
        poligono_json: formData.poligono_json || null,
        color_mapa: formData.color_mapa || "#4A6126",
      };

      if (sector) {
        await updateSector(sector.id, dataToSend);
        toast.success("Sector actualizado correctamente");
      } else {
        await createSector(dataToSend);
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
      <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
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

        {/* Tabs */}
        <div className="sticky top-[73px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 z-10">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab("basicos")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "basicos"
                  ? "border-primary-700 text-primary-700 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Re Pag"
            >
              <FileText size={18} />
              <span>Datos Básicos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("georeferenciados")}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === "georeferenciados"
                  ? "border-primary-700 text-primary-700 dark:text-primary-500"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
              title="Av Pag"
            >
              <MapPin size={18} />
              <span>Datos Georeferenciados</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab: Datos Básicos */}
          {activeTab === "basicos" && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* Tab: Datos Georeferenciados */}
          {activeTab === "georeferenciados" && (
            <div className="space-y-4">
              {/* Ubigeo */}
              <div>
                <label
                  htmlFor="sector-ubigeo"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Ubigeo
                </label>
                <input
                  type="text"
                  id="sector-ubigeo"
                  name="ubigeo"
                  value={formData.ubigeo}
                  onChange={handleChange}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: 150101"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Código de ubicación geográfica (6 dígitos)
                </p>
              </div>

              {/* Zona Code */}
              <div>
                <label
                  htmlFor="sector-zona"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código de Zona
                </label>
                <input
                  type="text"
                  id="sector-zona"
                  name="zona_code"
                  value={formData.zona_code}
                  onChange={handleChange}
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Z01"
                />
              </div>

              {/* Color de Mapa */}
              <div>
                <label
                  htmlFor="sector-color"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Color en Mapa
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    id="sector-color"
                    name="color_mapa"
                    value={formData.color_mapa}
                    onChange={handleChange}
                    className="h-10 w-20 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color_mapa}
                    onChange={(e) => setFormData(prev => ({ ...prev, color_mapa: e.target.value }))}
                    maxLength={7}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                    placeholder="#4A6126"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: formData.color_mapa }}
                    title="Vista previa del color"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Color que se mostrará en el mapa para este sector
                </p>
              </div>

              {/* Polígono JSON */}
              <div>
                <label
                  htmlFor="sector-poligono"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Polígono (JSON)
                </label>
                <textarea
                  id="sector-poligono"
                  name="poligono_json"
                  value={formData.poligono_json}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder='{"type":"Polygon","coordinates":[...]}'
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Formato GeoJSON del polígono que delimita el sector
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
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
