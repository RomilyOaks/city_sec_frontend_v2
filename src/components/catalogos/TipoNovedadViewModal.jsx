/**
 * File: src/components/catalogos/TipoNovedadViewModal.jsx
 * @version 1.0.0
 * @description Modal para ver detalles de un tipo de novedad
 */

import { useState, useEffect } from "react";
import { X, FileText, Calendar, User, Hash } from "lucide-react";
import { getTipoNovedadById } from "../../services/tiposNovedadService";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";
import toast from "react-hot-toast";

export default function TipoNovedadViewModal({ tipo, onClose }) {
  const [tipoData, setTipoData] = useState(tipo);
  const [loading, setLoading] = useState(false);

  // Bloquear scroll del body cuando el modal está abierto
  useBodyScrollLock(true);

  // Cargar datos completos del tipo
  useEffect(() => {
    const fetchTipoCompleto = async () => {
      if (!tipo?.id) return;

      setLoading(true);
      try {
        const data = await getTipoNovedadById(tipo.id);
        setTipoData(data);
      } catch (error) {
        console.error("Error cargando tipo de novedad:", error);
        toast.error("Error al cargar tipo de novedad");
      } finally {
        setLoading(false);
      }
    };

    fetchTipoCompleto();
  }, [tipo]);

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
              style={{ backgroundColor: tipoData?.color || "#6B7280" }}
            >
              {tipoData?.nombre?.charAt(0) || "T"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {tipoData?.nombre || "Tipo de Novedad"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Detalles del tipo de novedad
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
                  {tipoData?.nombre || "—"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Descripción</p>
                <p className="text-slate-900 dark:text-white">
                  {tipoData?.descripcion || "Sin descripción"}
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Color de Identificación</p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-slate-300 dark:border-slate-600"
                    style={{ backgroundColor: tipoData?.color || "#6B7280" }}
                  />
                  <span className="font-mono text-slate-900 dark:text-white">
                    {tipoData?.color || "#6B7280"}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Subtipos Asociados</p>
                <p className="font-medium text-slate-900 dark:text-white">
                  {tipoData?.subtipos_count || 0} subtipos
                </p>
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
                    {tipoData?.id || "—"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Fecha de Creación</p>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {tipoData?.created_at 
                      ? new Date(tipoData.created_at).toLocaleDateString('es-PE', {
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
                    {tipoData?.creadorTipoNovedad
                      ? `${tipoData.creadorTipoNovedad.username || ""} ${
                          tipoData.creadorTipoNovedad.nombres || tipoData.creadorTipoNovedad.apellidos
                            ? `(${[tipoData.creadorTipoNovedad.nombres, tipoData.creadorTipoNovedad.apellidos].filter(Boolean).join(" ")})`
                            : ""
                        }`.trim()
                      : tipoData?.created_by || "—"}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Última Actualización</p>
                  <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar size={14} className="text-slate-400" />
                    {tipoData?.updated_at
                      ? new Date(tipoData.updated_at).toLocaleDateString("es-PE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </div>

                {tipoData?.updated_by && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Actualizado por</p>
                    <p className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <User size={14} className="text-slate-400" />
                      {tipoData?.actualizadorTipoNovedad
                        ? `${tipoData.actualizadorTipoNovedad.username || ""} ${
                            tipoData.actualizadorTipoNovedad.nombres || tipoData.actualizadorTipoNovedad.apellidos
                              ? `(${[tipoData.actualizadorTipoNovedad.nombres, tipoData.actualizadorTipoNovedad.apellidos].filter(Boolean).join(" ")})`
                              : ""
                          }`.trim()
                        : tipoData?.updated_by || "—"}
                    </p>
                  </div>
                )}
              </div>

              {/* Estado */}
              {tipoData?.deleted_at && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Este tipo de novedad fue eliminado el{" "}
                    {new Date(tipoData.deleted_at).toLocaleDateString('es-PE', {
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
