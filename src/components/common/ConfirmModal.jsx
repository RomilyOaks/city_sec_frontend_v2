/**
 * File: src/components/common/ConfirmModal.jsx
 * @version 1.0.0
 * @description Modal de confirmación reutilizable para toda la aplicación
 * 
 * Características:
 * - Diseño profesional consistente
 * - Soporte para tema oscuro
 * - Accesibilidad con tecla ESC
 * - Estados de carga y deshabilitación
 * - Iconos personalizables
 */

import { useEffect, useMemo, memo } from "react";
import { X, Trash2, AlertTriangle, Info, CheckCircle } from "lucide-react";

const ConfirmModal = memo(({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
  title = "Confirmar acción",
  message = "¿Estás seguro de realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger", // danger, warning, info, success
  icon = null,
  loading = false,
  disabled = false,
  size = "sm", // sm, md, lg
}) => {
  // 🔥 Manejar tecla ESC para cerrar modal
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, loading, onClose]);

  // 🎨 Configurar iconos según tipo
  const IconComponent = useMemo(() => {
    switch (type) {
      case "danger":
        return icon || Trash2;
      case "warning":
        return icon || AlertTriangle;
      case "info":
        return icon || Info;
      case "success":
        return icon || CheckCircle;
      default:
        return icon || Trash2;
    }
  }, [icon, type]);
  const iconSize = size === "lg" ? 24 : size === "md" ? 20 : 18;

  // 🎨 Configurar colores según tipo
  const iconColors = useMemo(() => {
    switch (type) {
      case "danger":
        return "bg-red-100 dark:bg-red-900/30 text-red-500";
      case "warning":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-500";
      case "info":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-500";
      case "success":
        return "bg-green-100 dark:bg-green-900/30 text-green-500";
      default:
        return "bg-red-100 dark:bg-red-900/30 text-red-500";
    }
  }, [type]);

  const confirmButtonColors = useMemo(() => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white";
      case "warning":
        return "bg-amber-600 hover:bg-amber-700 text-white";
      case "info":
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case "success":
        return "bg-green-600 hover:bg-green-700 text-white";
      default:
        return "bg-red-600 hover:bg-red-700 text-white";
    }
  }, [type]);

  // 📏 Configurar tamaño del modal
  const maxWidth = useMemo(() => {
    switch (size) {
      case "lg":
        return "max-w-lg";
      case "md":
        return "max-w-md";
      case "sm":
      default:
        return "max-w-sm";
    }
  }, [size]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className={`w-full ${maxWidth} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 transform transition-all`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Header con icono y título */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full ${iconColors} flex items-center justify-center flex-shrink-0`}>
            <IconComponent size={iconSize} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 
              id="modal-title"
              className="font-semibold text-slate-900 dark:text-slate-50 truncate"
            >
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Esta acción no se puede deshacer
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mensaje principal */}
        <p 
          id="modal-description"
          className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed"
        >
          {message}
        </p>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || disabled}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonColors}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ConfirmModal;
