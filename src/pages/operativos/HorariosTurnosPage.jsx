import { useState, useEffect } from "react";
import { Clock, Edit2, X, Save, RefreshCw } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import { canPerformAction } from "../../rbac/rbac.js";
import { toast } from "react-hot-toast";
import { extractValidationErrors } from "../../utils/errorUtils.js";
import {
  listHorariosTurnos,
  updateHorarioTurno,
} from "../../services/horariosTurnosService.js";

const TURNO_LABELS = {
  MAÑANA: { label: "Mañana", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  TARDE: { label: "Tarde", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300" },
  NOCHE: { label: "Noche", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300" },
};

function EditTurnoModal({ horario, onClose, onSaved }) {
  const [form, setForm] = useState({
    hora_inicio: horario.hora_inicio?.slice(0, 5) || "",
    hora_fin: horario.hora_fin?.slice(0, 5) || "",
    cruza_medianoche: !!horario.cruza_medianoche,
    nro_orden: horario.nro_orden ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hora_inicio || !form.hora_fin) {
      toast.error("Hora de inicio y fin son requeridas");
      return;
    }
    setSaving(true);
    try {
      await updateHorarioTurno(horario.turno, {
        hora_inicio: form.hora_inicio + ":00",
        hora_fin: form.hora_fin + ":00",
        cruza_medianoche: form.cruza_medianoche,
        nro_orden: form.nro_orden !== "" ? Number(form.nro_orden) : undefined,
      });
      toast.success(`Turno ${horario.turno} actualizado`);
      onSaved();
    } catch (err) {
      toast.error(extractValidationErrors(err) || "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";

  const turnoInfo = TURNO_LABELS[horario.turno] || { label: horario.turno, color: "" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Editar horario
            </h2>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${turnoInfo.color}`}>
              {turnoInfo.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="hora_inicio"
                value={form.hora_inicio}
                onChange={handleChange}
                className={`${inputCls} [&::-webkit-calendar-picker-indicator]:dark:invert`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hora fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="hora_fin"
                value={form.hora_fin}
                onChange={handleChange}
                className={`${inputCls} [&::-webkit-calendar-picker-indicator]:dark:invert`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nro. de orden
            </label>
            <input
              type="number"
              name="nro_orden"
              value={form.nro_orden}
              onChange={handleChange}
              min={1}
              className={inputCls}
              placeholder="1, 2, 3..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              name="cruza_medianoche"
              checked={form.cruza_medianoche}
              onChange={handleChange}
              className="rounded"
            />
            Cruza medianoche
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-primary-700 hover:bg-primary-800 text-white disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function HorariosTurnosPage() {
  const [horarios, setHorarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ isOpen: false, horario: null });

  const { user } = useAuthStore();
  const canUpdate = canPerformAction(user, "operativos.horarios.update");

  const cargar = async () => {
    setLoading(true);
    try {
      const data = await listHorariosTurnos();
      const lista = Array.isArray(data) ? data : data?.horarios || [];
      const orden = ["MAÑANA", "TARDE", "NOCHE"];
      lista.sort(
        (a, b) => orden.indexOf(a.turno) - orden.indexOf(b.turno)
      );
      setHorarios(lista);
    } catch {
      toast.error("Error al cargar horarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const formatHora = (hora) => {
    if (!hora) return "—";
    return hora.slice(0, 5);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Clock className="text-primary-700 dark:text-primary-400" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Horarios de Turnos
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configuración de horarios para los turnos de patrullaje
            </p>
          </div>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* Cards de turnos */}
      {loading ? (
        <div className="p-10 text-center text-gray-500 dark:text-gray-400">
          Cargando horarios...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {horarios.map((h) => {
            const info = TURNO_LABELS[h.turno] || { label: h.turno, color: "" };
            return (
              <div
                key={h.turno}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${info.color}`}>
                    {info.label}
                  </span>
                  {canUpdate && (
                    <button
                      onClick={() => setEditModal({ isOpen: true, horario: h })}
                      className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      title="Editar horario"
                    >
                      <Edit2 size={15} />
                    </button>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Inicio</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-base">
                      {formatHora(h.hora_inicio)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Fin</span>
                    <span className="font-semibold text-gray-900 dark:text-white text-base">
                      {formatHora(h.hora_fin)}
                    </span>
                  </div>
                  {h.nro_orden && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Orden</span>
                      <span className="text-gray-700 dark:text-gray-300">{h.nro_orden}</span>
                    </div>
                  )}
                  {h.cruza_medianoche && (
                    <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Cruza medianoche
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span
                    className={`text-xs font-medium ${
                      h.estado
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    }`}
                  >
                    {h.estado ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editModal.isOpen && (
        <EditTurnoModal
          horario={editModal.horario}
          onClose={() => setEditModal({ isOpen: false, horario: null })}
          onSaved={() => {
            setEditModal({ isOpen: false, horario: null });
            cargar();
          }}
        />
      )}
    </div>
  );
}
