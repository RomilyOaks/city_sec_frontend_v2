import { useMetricasActual, useSuscripcion } from "../../../hooks/useBilling.js";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const formatMonto = (m, moneda = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(m ?? 0);

const formatPeriodo = (periodo) => {
  if (!periodo) return "—";
  const [year, month] = periodo.split("-");
  return `${MESES[parseInt(month, 10) - 1]} ${year}`;
};

const porcentaje = (valor, limite) => {
  if (limite == null || limite <= 0) return 0;
  return Math.round((valor / limite) * 100);
};

const colorBarra = (pct) => {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-orange-400";
  return "bg-green-500";
};

function BarraProgreso({ valor, limite }) {
  const pct = porcentaje(valor, limite);
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{(valor ?? 0).toLocaleString("es-PE")} / {limite?.toLocaleString("es-PE")}</span>
        <span className={pct >= 100 ? "text-red-600 font-semibold" : pct >= 80 ? "text-orange-500 font-semibold" : ""}>
          {pct}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${colorBarra(pct)}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function MetricasTab() {
  const { data: metricasData, isLoading: loadingMetricas, isError: errorMetricas } = useMetricasActual();
  const { data: suscripcionData, isLoading: loadingSuscripcion, isError: errorSuscripcion } = useSuscripcion();

  const m = metricasData?.data;
  const plan = suscripcionData?.data?.plan;

  if (loadingMetricas || loadingSuscripcion) return <Loading />;
  if (errorMetricas || errorSuscripcion || !m) return <Error />;

  const limiteUsuarios = plan?.max_usuarios ?? null;
  const limiteNovedades = plan?.max_novedades_mes ?? null;

  const excedenteEstimado = (m.costo_excedente_usuarios ?? 0) + (m.costo_excedente_novedades ?? 0);
  const subtotal = m.costo_total ?? ((m.costo_base ?? 0) + excedenteEstimado);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Período: <span className="text-gray-900 dark:text-white">{formatPeriodo(m.periodo)}</span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Usuarios activos */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Usuarios activos
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {m.usuarios_activos ?? 0}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
              / {limiteUsuarios == null ? "Ilimitado" : limiteUsuarios}
            </span>
          </p>
          {limiteUsuarios != null && (
            <BarraProgreso valor={m.usuarios_activos} limite={limiteUsuarios} />
          )}
        </div>

        {/* Novedades creadas */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Novedades creadas
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(m.novedades_creadas ?? 0).toLocaleString("es-PE")}
            <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">
              / {limiteNovedades == null ? "Ilimitado" : limiteNovedades.toLocaleString("es-PE")}
            </span>
          </p>
          {limiteNovedades != null && (
            <BarraProgreso valor={m.novedades_creadas} limite={limiteNovedades} />
          )}
        </div>

        {/* Costo base */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Costo base
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatMonto(m.costo_base, m.moneda)}
          </p>
        </div>

        {/* Excedente estimado */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Excedente estimado
          </p>
          <p className={`text-2xl font-bold ${excedenteEstimado > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}>
            {formatMonto(excedenteEstimado, m.moneda)}
          </p>
        </div>
      </div>

      {/* Total estimado */}
      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 px-5 py-4 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal</span>
          <span>{formatMonto(subtotal, m.moneda)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>IGV (18%)</span>
          <span>{formatMonto(igv, m.moneda)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2">
          <span>Total estimado del mes</span>
          <span>{formatMonto(total, m.moneda)}</span>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 pt-1">
          El monto final se calcula al cierre del período.
        </p>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-500 text-sm">
      Cargando métricas...
    </div>
  );
}

function Error() {
  return (
    <div className="flex items-center justify-center py-16 text-red-500 dark:text-red-400 text-sm">
      No se pudieron cargar las métricas.
    </div>
  );
}
