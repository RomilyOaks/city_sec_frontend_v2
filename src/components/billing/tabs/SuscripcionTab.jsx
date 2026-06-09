import { AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { useSuscripcion } from "../../../hooks/useBilling.js";

const ESTADO_BADGE = {
  activa:     "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  trial:      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  gracia:     "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  suspendida: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  cancelada:  "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const ESTADO_LABEL = {
  activa: "Activa", trial: "Trial", gracia: "Período de gracia",
  suspendida: "Suspendida", cancelada: "Cancelada",
};

const formatFecha = (f) => f
  ? new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" })
  : null;

const formatMonto = (m, moneda = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(m ?? 0);

export default function SuscripcionTab({ onIrAConfiguracion }) {
  const { data, isLoading, isError } = useSuscripcion();
  const s = data?.data;

  if (isLoading) return <Loading />;
  if (isError || !s) return <Error />;

  const fechaFin = formatFecha(s.fecha_fin);

  return (
    <div className="space-y-5">

      {/* Banner gracia */}
      {s.estado === "gracia" && (
        <div className="flex items-start gap-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-4 py-3">
          <AlertTriangle size={18} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            Su suscripción está en período de gracia.
            {s.dias_gracia_restantes != null && (
              <> Quedan <strong>{s.dias_gracia_restantes} día{s.dias_gracia_restantes !== 1 ? "s" : ""}</strong> antes del bloqueo del servicio.</>
            )}
          </p>
        </div>
      )}

      {/* Banner suspendida */}
      {s.estado === "suspendida" && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
          <XCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">
            El servicio está <strong>suspendido</strong>. Regularice el pago para reactivar el acceso.
          </p>
        </div>
      )}

      {/* Card plan */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              Plan activo
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {s.plan?.nombre ?? "—"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {formatMonto(s.plan?.precio_base_mensual, s.plan?.moneda)} / mes
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_BADGE[s.estado] ?? ESTADO_BADGE.cancelada}`}>
            {ESTADO_LABEL[s.estado] ?? s.estado}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Inicio</p>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">
              {formatFecha(s.fecha_inicio) ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Vencimiento</p>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">
              {fechaFin ?? (
                <span className="flex items-center gap-1 text-green-700 dark:text-green-400">
                  <RefreshCw size={13} /> Renovación automática
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Botón cambiar plan */}
      <div className="flex justify-end">
        <button
          onClick={onIrAConfiguracion}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-md transition"
        >
          Cambiar plan
        </button>
      </div>

    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
      Cargando suscripción...
    </div>
  );
}

function Error() {
  return (
    <div className="flex items-center justify-center py-16 text-red-500 dark:text-red-400 text-sm">
      No se pudo cargar la suscripción.
    </div>
  );
}
