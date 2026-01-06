/**
 * File: src/components/catalogos/UnidadOficinaViewModal.jsx
 * @version 1.0.0
 * @description Modal de solo lectura para ver información completa de una Unidad u Oficina
 *
 * @module src/components/catalogos/UnidadOficinaViewModal
 */

import { useEffect, useState } from "react";
import { X, Building2, MapPin, Clock, Phone, Mail } from "lucide-react";
import { getUbigeoByCode } from "../../services/novedadesService";
import { getUnidadOficinaById } from "../../services/unidadesOficinaService";

/**
 * UnidadOficinaViewModal - Modal de solo consulta
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Object} props.unidad - Unidad inicial (puede no tener relaciones)
 */
export default function UnidadOficinaViewModal({ isOpen, onClose, unidad: unidadInicial }) {
  const [ubigeoInfo, setUbigeoInfo] = useState(null);
  const [unidad, setUnidad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar unidad completa con todas las relaciones desde el backend
  useEffect(() => {
    const loadUnidadCompleta = async () => {
      if (!unidadInicial?.id) {
        console.warn("⚠️ No hay unidadInicial o no tiene ID");
        setUnidad(unidadInicial);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log("🏢 [UnidadOficinaViewModal] Cargando unidad/oficina completa con relaciones, ID:", unidadInicial.id);

        const unidadCompleta = await getUnidadOficinaById(unidadInicial.id);

        console.log("✅ [UnidadOficinaViewModal] Unidad/oficina completa cargada:", unidadCompleta);
        console.log("  - Nombre:", unidadCompleta?.nombre);
        console.log("  - Tipo:", unidadCompleta?.tipo_unidad);
        console.log("  - Ubigeo:", unidadCompleta?.ubigeo);

        if (unidadCompleta && unidadCompleta.id) {
          setUnidad(unidadCompleta);
        } else {
          console.warn("⚠️ La respuesta no contiene datos válidos, usando unidadInicial");
          setUnidad(unidadInicial);
        }
      } catch (error) {
        console.error("❌ [UnidadOficinaViewModal] Error al cargar unidad/oficina completa:", error);
        console.error("  - Error mensaje:", error.message);
        console.error("  - Error response:", error.response?.data);
        // Si falla, usar la unidad inicial
        setError(error.message);
        setUnidad(unidadInicial);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && unidadInicial) {
      loadUnidadCompleta();
    } else if (isOpen && !unidadInicial) {
      setUnidad(null);
      setLoading(false);
    }
  }, [isOpen, unidadInicial]);

  // Cargar información de ubigeo si no viene en la relación
  useEffect(() => {
    const loadUbigeo = async () => {
      if (unidad?.ubigeo_code && !unidad?.ubigeo) {
        try {
          const ubigeo = await getUbigeoByCode(unidad.ubigeo_code);
          if (ubigeo) {
            setUbigeoInfo(ubigeo);
          }
        } catch (err) {
          console.error("Error al cargar ubigeo:", err);
        }
      }
    };

    if (isOpen && unidad) {
      loadUbigeo();
    }
  }, [isOpen, unidad]);

  // Manejo de tecla ESC para cerrar
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  // Mostrar loading mientras se cargan los datos
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando información...</p>
        </div>
      </div>
    );
  }

  // Si no hay unidad después de cargar, mostrar error
  if (!unidad) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 text-center max-w-md">
          <p className="text-red-600 dark:text-red-400 mb-4">No se pudo cargar la información</p>
          {error && <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>}
          <button
            onClick={handleClose}
            className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  // Obtener el ubigeo, ya sea de la relación o del state
  const ubigeo = unidad.ubigeo || ubigeoInfo;

  // Formatear tipo de unidad
  const formatTipoUnidad = (tipo) => {
    const tipos = {
      SERENAZGO: "Serenazgo",
      PNP: "PNP",
      BOMBEROS: "Bomberos",
      MUNICIPAL: "Municipal",
      SALUD: "Salud",
      OTRO: "Otro",
    };
    return tipos[tipo] || tipo;
  };

  // Formatear estado
  const formatEstado = (estado) => {
    return estado === 1 ? "Activo" : "Inactivo";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={24} className="text-primary-600 dark:text-primary-400" />
              Información de Unidad/Oficina
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Solo consulta • ESC para cerrar
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Código */}
          {unidad.codigo && (
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <label className="block text-xs font-medium text-primary-700 dark:text-primary-400 mb-1">
                Código
              </label>
              <p className="text-lg font-mono font-bold text-primary-900 dark:text-primary-300">
                {unidad.codigo}
              </p>
            </div>
          )}

          {/* Información Básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nombre
              </label>
              <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                {unidad.nombre || "-"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Unidad
              </label>
              <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                {formatTipoUnidad(unidad.tipo_unidad)}
              </p>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </label>
            <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  unidad.estado === 1
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {formatEstado(unidad.estado)}
              </span>
            </p>
          </div>

          {/* Información de Contacto */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Phone size={18} />
              Información de Contacto
            </h3>
            <div className="space-y-4">
              {unidad.telefono && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Teléfono
                  </label>
                  <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    {unidad.telefono}
                  </p>
                </div>
              )}
              {unidad.email && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email
                  </label>
                  <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    {unidad.email}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Información de Ubicación */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={18} />
              Información de Ubicación
            </h3>
            <div className="space-y-4">
              {unidad.direccion && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Dirección
                  </label>
                  <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    {unidad.direccion}
                  </p>
                </div>
              )}
              {unidad.ubigeo_code && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    UBIGEO
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="font-mono text-sm text-primary-700 dark:text-primary-400">
                      {unidad.ubigeo_code}
                    </p>
                    {ubigeo && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {ubigeo.distrito} - {ubigeo.provincia}, {ubigeo.departamento}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {(unidad.latitud || unidad.longitud) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Latitud
                    </label>
                    <p className="text-base font-mono text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      {unidad.latitud || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Longitud
                    </label>
                    <p className="text-base font-mono text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      {unidad.longitud || "-"}
                    </p>
                  </div>
                </div>
              )}
              {unidad.radio_cobertura_km && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Radio de Cobertura
                  </label>
                  <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    {unidad.radio_cobertura_km} km
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Horario de Operación */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock size={18} />
              Horario de Operación
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Disponibilidad
                </label>
                <p className="text-base text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {unidad.activo_24h === 1 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                      24 horas
                    </span>
                  ) : (
                    "Horario limitado"
                  )}
                </p>
              </div>
              {unidad.activo_24h === 0 && (unidad.horario_inicio || unidad.horario_fin) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hora de Inicio
                    </label>
                    <p className="text-base font-mono text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      {unidad.horario_inicio || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Hora de Fin
                    </label>
                    <p className="text-base font-mono text-slate-900 dark:text-white p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      {unidad.horario_fin || "-"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Información de Auditoría */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
              Información de Auditoría
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Creado Por
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {unidad.creadorUnidadOficina?.username || unidad.created_by || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fecha de Creación
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {unidad.created_at ? new Date(unidad.created_at).toLocaleString("es-PE") : "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Actualizado Por
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {unidad.actualizadorUnidadOficina?.username || unidad.updated_by || "-"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Última Actualización
                </label>
                <p className="text-base text-slate-900 dark:text-white">
                  {unidad.updated_at ? new Date(unidad.updated_at).toLocaleString("es-PE") : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
