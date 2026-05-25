import { useState, useEffect } from "react";
import { X, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../services/api.js";

const ESTADO_CLS = {
  REPORTADO:     "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  EN_REPARACION: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  RESUELTO:      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  CANCELADO:     "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const PRIORIDAD_CLS = {
  ALTA:  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  MEDIA: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  BAJA:  "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

const ESTADO_LABELS = {
  REPORTADO:     "Reportado",
  EN_REPARACION: "En reparación",
  RESUELTO:      "Resuelto",
  CANCELADO:     "Cancelado",
};

const formatFecha = (fecha) => {
  if (!fecha) return "—";
  const d = new Date(fecha);
  return d.toLocaleString("es-PE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export default function DesperfectosVehiculoModal({ vehiculo, onClose }) {
  const [desperfectos, setDesperfectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filtroEstado, setFiltroEstado] = useState("");

  const cargar = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filtroEstado) params.estado = filtroEstado;
      const res = await api.get(`/vehiculos/${vehiculo.id}/desperfectos`, { params });
      const d = res.data?.data;
      setDesperfectos(d?.desperfectos || []);
      setPagination({
        page: d?.pagination?.page || 1,
        totalPages: d?.pagination?.totalPages || 1,
        total: d?.pagination?.total || 0,
      });
    } catch {
      toast.error("Error al cargar historial de desperfectos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar(1);
  }, [vehiculo.id, filtroEstado]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <AlertTriangle size={17} className="text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Desperfectos —{" "}
              <span className="text-primary-700 dark:text-primary-400">{vehiculo.placa}</span>
            </h2>
            {pagination.total > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({pagination.total} registro{pagination.total !== 1 ? "s" : ""})
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Filtro estado */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABELS).map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">Cargando...</div>
          ) : desperfectos.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-10">
              Sin registros de desperfectos
            </div>
          ) : (
            <div className="space-y-3">
              {desperfectos.map((d) => (
                <div
                  key={d.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {d.desperfecto?.nombre || `#${d.desperfecto_id}`}
                      </span>
                      {d.desperfecto?.categoria && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                          {d.desperfecto.categoria}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORIDAD_CLS[d.prioridad_reparacion] || ""}`}>
                        {d.prioridad_reparacion}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_CLS[d.estado] || ""}`}>
                        {ESTADO_LABELS[d.estado] || d.estado}
                      </span>
                    </div>
                  </div>

                  {d.descripcion && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{d.descripcion}</p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Reportado: {formatFecha(d.fecha_reporte)}</span>
                    {d.fecha_resolucion && (
                      <span>Resuelto: {formatFecha(d.fecha_resolucion)}</span>
                    )}
                    {d.mantenimiento && (
                      <span>
                        Mantenimiento:{" "}
                        <span className="font-mono text-gray-700 dark:text-gray-200">
                          #{d.mantenimiento.id}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
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

        <div className="flex justify-end px-6 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
