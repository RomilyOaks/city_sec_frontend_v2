/**
 * File: src/components/calles/SubsectorFormModal.jsx
 * @version 1.0.0
 * @description Modal para crear/editar subsectores
 */

import { useState, useEffect } from "react";
import { X, MapPin, FileText } from "lucide-react";
import { createSubsector, updateSubsector } from "../../services/subsectoresService";
import { listPersonalSelector } from "../../services/personalService";
import toast from "react-hot-toast";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

export default function SubsectorFormModal({
  isOpen,
  onClose,
  subsector,
  onSuccess,
  preselectedSectorId,
  sectorNombre
}) {
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState("basicos");
  const [formData, setFormData] = useState({
    subsector_code: "",
    nombre: "",
    referencia: "",
    supervisor_id: "",
    sector_id: "",
    color_mapa: "#10B981",
    poligono_json: "",
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [personalList, setPersonalList] = useState([]);

  // Cargar lista de personal al montar
  useEffect(() => {
    listPersonalSelector()
      .then((data) => {
        setPersonalList(Array.isArray(data) ? data : []);
      })
      .catch((error) => {
        console.error("Error cargando lista de personal:", error);
        setPersonalList([]);
      });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (subsector) {
      setFormData({
        subsector_code: subsector.subsector_code || "",
        nombre: subsector.nombre || "",
        referencia: subsector.referencia || "",
        supervisor_id: subsector.supervisor_id || "",
        sector_id: subsector.sector_id || preselectedSectorId || "",
        color_mapa: subsector.color_mapa || "#10B981",
        poligono_json: subsector.poligono_json || "",
      });
    } else {
      setFormData({
        subsector_code: "",
        nombre: "",
        referencia: "",
        supervisor_id: "",
        sector_id: preselectedSectorId || "",
        color_mapa: "#10B981",
        poligono_json: "",
      });
    }
    setActiveTab("basicos");
    setValidationError("");
  }, [subsector, isOpen, preselectedSectorId]);

  // Autofocus en el primer campo cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        document.getElementById("subsector-codigo")?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
      if (e.altKey && e.key === "g") {
        e.preventDefault();
        document.getElementById("submit-subsector-btn")?.click();
      }
      if (e.key === "PageDown") {
        e.preventDefault();
        setActiveTab("georeferenciados");
      }
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
      subsector_code: "",
      nombre: "",
      referencia: "",
      supervisor_id: "",
      sector_id: "",
      color_mapa: "#10B981",
      poligono_json: "",
    });
    setValidationError("");
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
    setValidationError("");

    try {
      // Validación de campos requeridos
      if (!formData.subsector_code || !formData.subsector_code.trim()) {
        const errorMsg = "El campo Código es requerido";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("subsector-codigo")?.focus(), 100);
        setLoading(false);
        return;
      }

      if (!formData.nombre || !formData.nombre.trim()) {
        const errorMsg = "El campo Nombre es requerido";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setActiveTab("basicos");
        setTimeout(() => document.getElementById("subsector-nombre")?.focus(), 100);
        setLoading(false);
        return;
      }

      if (!formData.sector_id) {
        const errorMsg = "El Sector es requerido";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      // Validación de color_mapa
      if (formData.color_mapa && !/^#[0-9A-Fa-f]{6}$/.test(formData.color_mapa)) {
        const errorMsg = "El color debe tener formato hexadecimal válido (ej: #10B981)";
        setValidationError(errorMsg);
        toast.error(errorMsg);
        setActiveTab("georeferenciados");
        setTimeout(() => document.getElementById("subsector-color")?.focus(), 100);
        setLoading(false);
        return;
      }

      const dataToSend = {
        subsector_code: formData.subsector_code.trim(),
        nombre: formData.nombre.trim(),
        referencia: formData.referencia?.trim() || null,
        supervisor_id: formData.supervisor_id ? Number(formData.supervisor_id) : null,
        sector_id: Number(formData.sector_id),
        color_mapa: formData.color_mapa || "#10B981",
        poligono_json: formData.poligono_json?.trim() || null,
      };

      if (subsector) {
        await updateSubsector(subsector.id, dataToSend);
        toast.success("Subsector actualizado correctamente");
      } else {
        await createSubsector(dataToSend);
        toast.success("Subsector creado correctamente");
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error al guardar subsector:", error);

      const backendData = error.response?.data;
      let errorMessage = "";

      if (backendData?.message) {
        errorMessage = backendData.message;
      } else if (backendData?.error) {
        errorMessage = backendData.error;
      } else if (backendData?.errors) {
        if (Array.isArray(backendData.errors)) {
          errorMessage = backendData.errors.map(e => e.message || e).join(", ");
        } else if (typeof backendData.errors === 'object') {
          const errorFields = Object.keys(backendData.errors);
          if (errorFields.length > 0) {
            errorMessage = `Error en ${errorFields[0]}: ${backendData.errors[errorFields[0]]}`;
          }
        }
      }

      if (!errorMessage) {
        const statusCode = error.response?.status;
        if (statusCode === 400) {
          errorMessage = "Error de validación. Por favor, revise los datos ingresados.";
        } else if (statusCode === 409) {
          errorMessage = "Conflicto: El subsector ya existe o hay datos duplicados.";
        } else {
          errorMessage = `Error ${statusCode || 'desconocido'}. No se pudo procesar la solicitud.`;
        }
      }

      setValidationError(errorMessage);
      toast.error(errorMessage);
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
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {subsector ? "Editar Subsector" : "Nuevo Subsector"}
            </h2>
            {sectorNombre && (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sector: {sectorNombre}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            title="Cerrar (ESC)"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mensaje de error de validación */}
        {validationError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                {validationError}
              </p>
            </div>
          </div>
        )}

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
                  htmlFor="subsector-codigo"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subsector-codigo"
                  name="subsector_code"
                  value={formData.subsector_code}
                  onChange={handleChange}
                  required
                  maxLength={20}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: SS01A"
                />
              </div>

              {/* Nombre */}
              <div>
                <label
                  htmlFor="subsector-nombre"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subsector-nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ej: Subsector Norte A"
                />
              </div>

              {/* Referencia */}
              <div>
                <label
                  htmlFor="subsector-referencia"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Referencia
                </label>
                <textarea
                  id="subsector-referencia"
                  name="referencia"
                  value={formData.referencia}
                  onChange={handleChange}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Descripción o referencia del subsector..."
                />
              </div>

              {/* Supervisor */}
              <div>
                <label
                  htmlFor="subsector-supervisor"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Supervisor
                </label>
                <select
                  id="subsector-supervisor"
                  name="supervisor_id"
                  value={formData.supervisor_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">— Sin supervisor asignado —</option>
                  {personalList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.apellido_paterno} {p.apellido_materno}, {p.nombres} - {p.doc_tipo} {p.doc_numero}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Persona responsable del subsector
                </p>
              </div>
            </div>
          )}

          {/* Tab: Datos Georeferenciados */}
          {activeTab === "georeferenciados" && (
            <div className="space-y-4">
              {/* Color de Mapa */}
              <div>
                <label
                  htmlFor="subsector-color"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Color en Mapa
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    id="subsector-color"
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
                    placeholder="#10B981"
                  />
                  <div
                    className="h-10 w-10 rounded-lg border-2 border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: formData.color_mapa }}
                    title="Vista previa del color"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Color que se mostrará en el mapa para este subsector
                </p>
              </div>

              {/* Polígono JSON */}
              <div>
                <label
                  htmlFor="subsector-poligono"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Polígono (JSON)
                </label>
                <textarea
                  id="subsector-poligono"
                  name="poligono_json"
                  value={formData.poligono_json}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
                  placeholder='{"type":"Polygon","coordinates":[...]}'
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Formato GeoJSON del polígono que delimita el subsector
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
              id="submit-subsector-btn"
              className="flex-1 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              title="Guardar (ALT+G)"
            >
              {loading ? "Guardando..." : subsector ? "Actualizar" : "Crear"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
