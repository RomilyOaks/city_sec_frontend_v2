import { useState, useEffect } from "react";
import { X, Receipt, BarChart3, FileText, Settings } from "lucide-react";
import useBodyScrollLock from "../../hooks/useBodyScrollLock.js";
import SuscripcionTab from "./tabs/SuscripcionTab.jsx";
import MetricasTab from "./tabs/MetricasTab.jsx";
import FacturasTab from "./tabs/FacturasTab.jsx";
import ConfigBillingTab from "./tabs/ConfigBillingTab.jsx";

const TABS = [
  { key: "suscripcion", label: "Suscripción", icon: Receipt },
  { key: "metricas", label: "Métricas", icon: BarChart3 },
  { key: "facturas", label: "Facturas", icon: FileText },
  { key: "configuracion", label: "Configuración", icon: Settings },
];

export default function BillingDrawer({ onClose }) {
  const [activeTab, setActiveTab] = useState("suscripcion");
  const [visible, setVisible] = useState(false);

  useBodyScrollLock(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative h-full w-full sm:max-w-[480px] bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Facturación y Suscripción
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                  isActive
                    ? "border-primary-700 text-primary-700 dark:border-primary-400 dark:text-primary-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === "suscripcion" && (
            <SuscripcionTab onIrAConfiguracion={() => setActiveTab("configuracion")} />
          )}
          {activeTab === "metricas" && <MetricasTab />}
          {activeTab === "facturas" && <FacturasTab />}
          {activeTab === "configuracion" && <ConfigBillingTab />}
        </div>
      </div>
    </div>
  );
}
