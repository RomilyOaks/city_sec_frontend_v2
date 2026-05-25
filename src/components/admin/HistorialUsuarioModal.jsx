import { useState, useEffect } from "react";
import { X, History, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../services/api.js";
import { toast } from "react-hot-toast";

const ACCION_LABELS = {
  creacion: { label: "Creación", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  actualizacion: { label: "Actualización", cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  cambio_password: { label: "Cambio de contraseña", cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" },
  cambio_estado: { label: "Cambio de estado", cls: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  asignacion_rol: { label: "Asignación de rol", cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
  revocacion_rol: { label: "Revocación de rol", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  asignacion_permiso: { label: "Asignación de permiso", cls: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" },
  revocacion_permiso: { label: "Revocación de permiso", cls: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" },
  eliminacion: { label: "Eliminación", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
  restauracion: { label: "Restauración", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function HistorialUsuarioModal({ usuarioId, username, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const cargar = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/usuarios/${usuarioId}/historial`, {
        params: { page, limit: 15 },
      });
      const d = res.data?.data;
      setHistorial(d?.historial || []);
      setPagination({
        page: d?.pagination?.page || 1,
        totalPages: d?.pagination?.totalPages || 1,
        total: d?.pagination?.total || 0,
      });
    } catch {
      toast.error("Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar(1);
  }, [usuarioId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <History size={18} className="text-primary-700 dark:text-primary-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Historial de <span className="text-primary-700 dark:text-primary-400">{username}</span>
            </h2>
            {pagination.total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({pagination.total} registro{pagination.total !== 1 ? "s" : ""})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              Cargando historial...
            </div>
          ) : historial.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              Sin registros de historial
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((h) => {
                const accion = ACCION_LABELS[h.accion] || {
                  label: h.accion,
                  cls: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
                };
                return (
                  <div
                    key={h.id}
                    className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accion.cls}`}>
                        {accion.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFecha(h.fecha_hora)}
                      </span>
                    </div>

                    {h.descripcion && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {h.descripcion}
                      </p>
                    )}

                    {h.campo_modificado && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Campo:{" "}
                        <span className="font-mono text-gray-700 dark:text-gray-200">
                          {h.campo_modificado}
                        </span>
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Realizado por:{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {h.realizadoPor?.username || `#${h.realizado_por}`}
                        </span>
                      </span>
                      {h.ip_address && (
                        <span className="font-mono">{h.ip_address}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => cargar(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                onClick={() => cargar(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-1.5 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
