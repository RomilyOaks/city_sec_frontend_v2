/**
 * File: src/pages/operativos/personal/EyePersonalModal.jsx
 * @version 1.0.0
 * @description Modal READ ONLY para consultar datos completos de operativo personal
 * @module src/pages/operativos/personal/EyePersonalModal.jsx
 */

import React, { useState, useEffect, useCallback } from "react";
import { X, Eye, Calendar, Clock, MapPin, User, AlertTriangle, CheckCircle } from "lucide-react";
import operativosNovedadesService from "../../../services/operativosNovedadesService.js";
import { formatForDisplay, safeConvertToTimezone } from "../../../utils/dateHelper.js";

const EyePersonalModal = ({ 
  isOpen, 
  onClose, 
  cuadranteId, 
  operativoId 
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !operativoId) return;

    const fetchOperativoData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await operativosNovedadesService.getEyePersonalNovedad(
          cuadranteId, 
          operativoId
        );
        
        if (response.status === 'success') {
          setData(response.data);
        } else {
          setError(response.message || 'Error al cargar datos');
        }
      } catch (err) {
        console.error('👁️ EYE: Error cargando datos EYE:', err);
        setError('Error cargando datos EYE: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchOperativoData();
  }, [isOpen, operativoId, cuadranteId]);

  // Manejo de tecla ESC - Solución del modelo NovedadesPersonalModal (FUNCIONA)
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const formatUsuario = (usuario) => {
    if (!usuario) return 'N/A';
    return `${usuario.username} - ${usuario.nombres} ${usuario.apellidos}`;
  };

  const formatPersonal = (personal) => {
    if (!personal) return 'N/A';
    return `${personal.nombres} ${personal.apellido_paterno} ${personal.apellido_materno || ''}`.trim();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = safeConvertToTimezone(dateString);
      return formatForDisplay(date, 'datetime');
    } catch {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'S/ 0.00';
    return `S/ ${parseFloat(amount).toFixed(2)}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-xl">
        {/* Header - Homologado con DespacharModal */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Eye className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Consulta de Operativo Personal
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {data?.novedad?.novedad_code || "—"}
                  </p>
                  {data?.novedad?.novedadEstado?.nombre && (
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        data.novedad.novedadEstado.nombre === "Resuelto"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : data.novedad.novedadEstado.nombre === "En Proceso"
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                      }`}
                    >
                      {data.novedad.novedadEstado.nombre}
                    </span>
                  )}
                </div>
                {(data?.novedad?.novedadTipoNovedad?.nombre || data?.novedad?.novedadSubtipoNovedad?.nombre) && (
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5">
                    {data.novedad?.novedadTipoNovedad?.nombre}
                    {data.novedad?.novedadTipoNovedad?.nombre && data.novedad?.novedadSubtipoNovedad?.nombre ? " — " : ""}
                    {data.novedad?.novedadSubtipoNovedad?.nombre}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando datos...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Error:</span>
              </div>
              <p className="mt-1">{error}</p>
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron datos del operativo</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información del Turno */}
              <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Información del Turno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Turno:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data.cuadranteOperativo?.operativoPersonal?.turno?.turno || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fecha Turno:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data.cuadranteOperativo?.operativoPersonal?.turno?.fecha || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Información del Cuadrante */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Información del Cuadrante
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Código Cuadrante:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data.cuadranteOperativo?.datosCuadrante?.cuadrante_code || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Nombre Cuadrante:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data.cuadranteOperativo?.datosCuadrante?.nombre || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Información del Personal */}
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  Datos del Personal
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Personal Principal:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatPersonal(data.cuadranteOperativo?.operativoPersonal?.personal)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Sereno/Compañero:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatPersonal(data.cuadranteOperativo?.operativoPersonal?.sereno)}</p>
                  </div>
                </div>
              </div>

              {/* Información de la Novedad */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Información de la Novedad
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Código Novedad:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data.novedad?.novedad_code || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tipo y Subtipo:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {data.novedad?.novedadTipoNovedad?.nombre || 'N/A'} - {data.novedad?.novedadSubtipoNovedad?.nombre || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Descripción:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data.novedad?.descripcion || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Detalles del Operativo */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Detalles del Operativo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Hora Llegada:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(data?.novedad?.fecha_llegada)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Personas Afectadas:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{data?.novedad?.num_personas_afectadas || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pérdidas Materiales:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(data?.novedad?.perdidas_materiales_estimadas)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Resultado:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {data.resultado === 'RESUELTO' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {data.resultado || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Acciones Tomadas:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{data.acciones_tomadas || 'N/A'}</p>
                </div>
                <div className="mt-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Observaciones:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{data.observaciones || 'N/A'}</p>
                </div>
              </div>

              {/* Información de Auditoría */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Información de Registro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Creado por:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatUsuario(data.creadorOperativosPersonalNovedades)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Actualizado por:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatUsuario(data.actualizadorOperativosPersonalNovedades)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fecha Creación:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(data.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Última Actualización:</span>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(data.updated_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Homologado con DespacharModal */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EyePersonalModal;
