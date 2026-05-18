import { useEffect } from "react";
import { X, Shield, ShieldOff } from "lucide-react";

/**
 * Modal de consulta (solo lectura) para un permiso del sistema.
 * Muestra todos los campos incluyendo la descripción completa.
 */
export default function VerPermisoModal({ permiso, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!permiso) return null;

  const slug = `${permiso.modulo || "—"}.${permiso.recurso || "—"}.${permiso.accion || "—"}`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Detalle de Permiso
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Información completa del permiso
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Slug */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Slug
            </p>
            <div className="flex items-center gap-2">
              <code className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-mono rounded-lg text-slate-700 dark:text-slate-300 flex-1">
                {permiso.slug || slug}
              </code>
              {permiso.es_sistema && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 flex-shrink-0">
                  Sistema
                </span>
              )}
            </div>
          </div>

          {/* Módulo · Recurso · Acción en grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Módulo
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {permiso.modulo || "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Recurso
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {permiso.recurso || "—"}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                Acción
              </p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {permiso.accion || "—"}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              Descripción
            </p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 min-h-[60px]">
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {permiso.descripcion || <span className="text-slate-400 italic">Sin descripción</span>}
              </p>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Estado
            </p>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              permiso.estado
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}>
              {permiso.estado ? <Shield size={12} /> : <ShieldOff size={12} />}
              {permiso.estado ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
