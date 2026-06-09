import { useState, useEffect } from "react";
import { CreditCard, X } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock.js";

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const formatMonto = (monto, moneda = "PEN") =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda }).format(monto ?? 0);

export default function ConfirmarPagoModal({ factura, onClose, onConfirm, loading }) {
  const [fechaPago, setFechaPago] = useState(todayLocal());

  useBodyScrollLock(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, loading]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-primary-700 dark:text-primary-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Registrar pago
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen */}
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">N° Factura</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {factura.numero_factura}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Período</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {factura.periodo}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-600 pt-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Monto total</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatMonto(factura.monto_total, factura.moneda)}
              </span>
            </div>
          </div>

          {/* Campo fecha_pago */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de pago
            </label>
            <input
              type="date"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              disabled={loading}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:dark:invert"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Por defecto: hoy. Ajustar si el pago fue en otra fecha.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-40 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(fechaPago)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-700 hover:bg-primary-800 rounded-md disabled:opacity-60 transition"
          >
            {loading ? "Registrando..." : "Confirmar pago"}
          </button>
        </div>

      </div>
    </div>
  );
}
