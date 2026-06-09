import { useState } from "react";
import { FileText, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import { useFacturas, useRegistrarPago } from "../../../hooks/useBilling.js";
import ConfirmarPagoModal from "../ConfirmarPagoModal.jsx";
import { extractValidationErrors } from "../../../utils/errorUtils.js";

const ESTADO_BADGE = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  pagada:    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  vencida:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  anulada:   "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const ESTADO_LABEL = {
  pendiente: "Pendiente", pagada: "Pagada", vencida: "Vencida", anulada: "Anulada",
};

const formatFecha = (f) => f
  ? new Date(f).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
  : "—";

const formatMonto = (m, moneda = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(m ?? 0);

export default function FacturasTab() {
  const [filtros, setFiltros] = useState({ estado: "todos", periodo: "" });
  const [pagoModal, setPagoModal] = useState(null);

  const params = {};
  if (filtros.estado !== "todos") params.estado = filtros.estado;
  if (filtros.periodo) params.periodo = filtros.periodo;

  const { data, isLoading, isError } = useFacturas(params);
  const registrarPagoMutation = useRegistrarPago();

  const facturas = data ?? [];

  const handleConfirmarPago = async (fechaPago) => {
    const toastId = toast.loading("Registrando pago...");
    try {
      await registrarPagoMutation.mutateAsync({
        id: pagoModal.id,
        data: { fecha_pago: fechaPago },
      });
      toast.dismiss(toastId);
      toast.success("Pago registrado correctamente");
      setPagoModal(null);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(extractValidationErrors(err) || "Error al registrar el pago");
    }
  };

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Estado
          </label>
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="todos">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="pagada">Pagada</option>
            <option value="vencida">Vencida</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Período
          </label>
          <input
            type="month"
            value={filtros.periodo}
            onChange={(e) => setFiltros((f) => ({ ...f, periodo: e.target.value }))}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 [&::-webkit-calendar-picker-indicator]:dark:invert"
          />
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <EstadoVacio mensaje="Cargando facturas..." />
      ) : isError ? (
        <EstadoVacio mensaje="No se pudieron cargar las facturas." error />
      ) : facturas.length === 0 ? (
        <EstadoVacio mensaje="No hay facturas para los filtros seleccionados." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">N° Factura</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Período</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Monto total</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Estado</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Emisión</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Vencimiento</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {facturas.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{f.numero_factura}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{f.periodo}</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">
                    {formatMonto(f.monto_total, f.moneda)}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_BADGE[f.estado] ?? ESTADO_BADGE.anulada}`}>
                      {ESTADO_LABEL[f.estado] ?? f.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatFecha(f.fecha_emision)}</td>
                  <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{formatFecha(f.fecha_vencimiento)}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => window.open(f.pdf_url, "_blank", "noopener,noreferrer")}
                        disabled={!f.pdf_url}
                        title={f.pdf_url ? "Ver PDF" : "PDF en proceso de generación"}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <FileText size={16} />
                      </button>
                      {(f.estado === "pendiente" || f.estado === "vencida") && (
                        <button
                          onClick={() => setPagoModal(f)}
                          title="Registrar pago"
                          className="p-1.5 rounded-md text-primary-700 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-gray-700 transition"
                        >
                          <CreditCard size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagoModal && (
        <ConfirmarPagoModal
          factura={pagoModal}
          onClose={() => setPagoModal(null)}
          onConfirm={handleConfirmarPago}
          loading={registrarPagoMutation.isPending}
        />
      )}
    </div>
  );
}

function EstadoVacio({ mensaje, error }) {
  return (
    <div className={`flex items-center justify-center py-16 text-sm ${error ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
      {mensaje}
    </div>
  );
}
