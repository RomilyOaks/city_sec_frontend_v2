/**
 * File: src/components/catalogos/SubtipoNovedadViewModal.jsx
 * @version 1.0.0
 * @description Modal para ver detalles de un subtipo de novedad
 */

import { useState, useEffect } from "react";
import { X, FileText, Calendar, User, Hash, Flag, Tag } from "lucide-react";
import { getSubtipoNovedadById } from "../../services/subtiposNovedadService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import toast from "react-hot-toast";

export default function SubtipoNovedadViewModal({ subtipo, onClose }) {
  const [subtipoData, setSubtipoData] = useState(subtipo);
  const [loading, setLoading] = useState(false);

  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(true);

  // Cargar datos completos del subtipo
  useEffect(() => {
    const fetchSubtipoCompleto = async () => {
      if (!subtipo?.id) return;

      setLoading(true);
      try {
        const data = await getSubtipoNovedadById(subtipo.id);
        setSubtipoData(data);
      } catch (error) {
        console.error("Error cargando subtipo de novedad:", error);
        toast.error("Error al cargar subtipo de novedad");
      } finally {
        setLoading(false);
      }
    };

    fetchSubtipoCompleto();
  }, [subtipo]);

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

  const getPrioridadBadge = (prioridad) => {
    switch (prioridad) {
      case "ALTA":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "MEDIA":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">Cargando datos...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: subtipoData?.color || "#6B7280" }}
            >
              {subtipoData?.nombre?.charAt(0) || "S"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {subtipoData?.nombre || "Subtipo de Novedad"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Detalles del subtipo de novedad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Información Principal */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nombre</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {subtipoData?.nombre || "—"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Descripción</p>
                <p className="text-slate-900 dark:text-white">
                  {subtipoData?.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tipo de Novedad</p>
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-slate-400" />
                  <span className="font-medium text-slate-900 dark:text-white">
                    {subtipoData?.subtipoNovedadTipoNovedad?.nombre ||
                      subtipoData?.tipo_novedad?.nombre ||
                      "—"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Prioridad</p>
                  <div className="flex items-center gap-2">
                    <Flag size={16} className="text-slate-400" />
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPrioridadBadge(
                        subtipoData?.prioridad
                      )}`}
                    >
                      {subtipoData?.prioridad || "BAJA"}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Código</p>
                  <div className="flex items-center gap-2">
                    <Hash size={16} className="text-slate-400" />
                    <span className="font-mono font-medium text-slate-900 dark:text-white">
                      {subtipoData?.subtipo_code || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información de Auditoría */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} />
                Información de Auditoría
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">ID</p>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Hash size={14} className="text-slate-400" />
                    {subtipoData?.id || "—"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fecha de Creación</p>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {subtipoData?.created_at 
                      ? new Date(subtipoData.created_at).toLocaleDateString('es-PE', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : "—"
                    }
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Creado por</p>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <User size={14} className="text-slate-400" />
                    {subtipoData?.creadorSubtipoNovedad
                      ? `${subtipoData.creadorSubtipoNovedad.username || ""} ${
                          subtipoData.creadorSubtipoNovedad.nombres || subtipoData.creadorSubtipoNovedad.apellidos
                            ? `(${[subtipoData.creadorSubtipoNovedad.nombres, subtipoData.creadorSubtipoNovedad.apellidos].filter(Boolean).join(" ")})`
                            : ""
                        }`.trim()
                      : subtipoData?.created_by || "—"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Última Actualización</p>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {subtipoData?.updated_at
                      ? new Date(subtipoData.updated_at).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>

                {subtipoData?.updated_by && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Actualizado por</p>
                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      {subtipoData?.actualizadorSubtipoNovedad
                        ? `${subtipoData.actualizadorSubtipoNovedad.username || ""} ${
                            subtipoData.actualizadorSubtipoNovedad.nombres || subtipoData.actualizadorSubtipoNovedad.apellidos
                              ? `(${[subtipoData.actualizadorSubtipoNovedad.nombres, subtipoData.actualizadorSubtipoNovedad.apellidos].filter(Boolean).join(" ")})`
                              : ""
                          }`.trim()
                        : subtipoData?.updated_by || "—"}
                    </p>
                  </div>
                )}
              </div>

              {/* Estado */}
              {subtipoData?.deleted_at && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Este subtipo de novedad fue eliminado el{" "}
                    {new Date(subtipoData.deleted_at).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
