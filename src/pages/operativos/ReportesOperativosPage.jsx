/**
 * File: src/pages/operativos/ReportesOperativosPage.jsx
 * @version 1.0.0
 * @description Página para generar reportes de operativos de patrullaje en Excel
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Car,
  Users,
  MapPin,
  Bell,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";

// Servicios
import { listSectores } from "../../services/sectoresService.js";
import { buildReporteData } from "../../services/reportesOperativosService.js";

// RBAC
import { canPerformAction } from "../../rbac/rbac.js";
import { useAuthStore } from "../../store/useAuthStore.js";

/**
 * Opciones de turno
 */
const TURNO_OPTIONS = [
  { value: "todos", label: "Todos los turnos" },
  { value: "MAÑANA", label: "Mañana" },
  { value: "TARDE", label: "Tarde" },
  { value: "NOCHE", label: "Noche" },
];

/**
 * Opciones de tipo de recurso
 */
const TIPO_RECURSO_OPTIONS = [
  { value: "todos", label: "Todos (Vehículos + Personal)" },
  { value: "VEHICULO", label: "Solo Vehículos" },
  { value: "PERSONAL", label: "Solo Patrullaje a Pie" },
];

/**
 * Formatea fecha para mostrar
 */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formatea fecha/hora para mostrar
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Obtiene fecha de hoy en formato YYYY-MM-DD
 */
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

/**
 * Obtiene fecha de hace 7 días en formato YYYY-MM-DD
 */
const getWeekAgoDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString().split("T")[0];
};

/**
 * ReportesOperativosPage - Página principal de reportes
 */
export default function ReportesOperativosPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canRead = canPerformAction(user, "operativos.turnos.read");

  // Estados de filtros
  const [filters, setFilters] = useState({
    fecha_inicio: getWeekAgoDate(),
    fecha_fin: getTodayDate(),
    turno: "todos",
    sector_id: "todos",
    tipo_recurso: "todos",
  });

  // Estados de datos
  const [sectores, setSectores] = useState([]);
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [reporteData, setReporteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar sectores al montar
  useEffect(() => {
    const fetchSectores = async () => {
      setLoadingSectores(true);
      try {
        const response = await listSectores({ limit: 100 });
        const items = response?.items || response || [];
        setSectores(items);
      } catch (err) {
        console.error("Error cargando sectores:", err);
        toast.error("Error al cargar sectores");
      } finally {
        setLoadingSectores(false);
      }
    };
    fetchSectores();
  }, []);

  // Generar reporte
  const handleGenerarReporte = useCallback(async () => {
    // Validar fechas
    if (!filters.fecha_inicio || !filters.fecha_fin) {
      toast.error("Debe seleccionar un rango de fechas");
      return;
    }

    if (new Date(filters.fecha_inicio) > new Date(filters.fecha_fin)) {
      toast.error("La fecha de inicio no puede ser mayor a la fecha fin");
      return;
    }

    setLoading(true);
    setError(null);
    setReporteData(null);

    try {
      const data = await buildReporteData(filters);
      setReporteData(data);

      if (data.total_turnos === 0) {
        toast("No se encontraron datos con los filtros seleccionados", { icon: "ℹ️" });
      } else {
        toast.success(`Reporte generado: ${data.total_turnos} turnos encontrados`);
      }
    } catch (err) {
      console.error("Error generando reporte:", err);
      const msg = err.response?.data?.message || "Error al generar el reporte";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Exportar a Excel
  const handleExportarExcel = useCallback(() => {
    if (!reporteData || reporteData.total_turnos === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      // Crear workbook
      const wb = XLSX.utils.book_new();

      // ========================================
      // HOJA 1: RESUMEN
      // ========================================
      const resumenData = [
        ["REPORTE DE OPERATIVOS DE PATRULLAJE"],
        [""],
        ["Generado:", formatDateTime(reporteData.generado_en)],
        [""],
        ["FILTROS APLICADOS"],
        ["Fecha Inicio:", formatDate(reporteData.filtros.fecha_inicio)],
        ["Fecha Fin:", formatDate(reporteData.filtros.fecha_fin)],
        ["Turno:", reporteData.filtros.turno === "todos" ? "Todos" : reporteData.filtros.turno],
        [
          "Sector:",
          reporteData.filtros.sector_id === "todos"
            ? "Todos"
            : sectores.find((s) => s.id === Number(reporteData.filtros.sector_id))?.nombre || reporteData.filtros.sector_id,
        ],
        [
          "Tipo Recurso:",
          reporteData.filtros.tipo_recurso === "todos"
            ? "Todos"
            : reporteData.filtros.tipo_recurso === "VEHICULO"
            ? "Vehículos"
            : "Patrullaje a Pie",
        ],
        [""],
        ["TOTALES"],
        ["Total Turnos:", reporteData.total_turnos],
        ["Total Recursos:", reporteData.total_recursos],
        ["Total Cuadrantes Patrullados:", reporteData.total_cuadrantes],
        ["Total Novedades Atendidas:", reporteData.total_novedades],
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

      // Ajustar anchos de columnas
      wsResumen["!cols"] = [{ wch: 30 }, { wch: 40 }];

      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

      // ========================================
      // HOJA 2: DETALLE POR TURNO
      // ========================================
      const detalleHeaders = [
        "Fecha",
        "Turno",
        "Sector",
        "Operador",
        "Supervisor",
        "Tipo Recurso",
        "Identificador",
        "Tipo/Cargo",
        "Conductor/Personal",
        "Copiloto",
        "Km Inicio",
        "Km Fin",
        "Km Recorridos",
        "Total Cuadrantes",
        "Total Novedades",
      ];

      const detalleRows = [];
      detalleRows.push(detalleHeaders);

      for (const turno of reporteData.data) {
        for (const recurso of turno.recursos) {
          detalleRows.push([
            formatDate(turno.fecha),
            turno.turno,
            turno.sector,
            turno.operador,
            turno.supervisor,
            recurso.tipo === "VEHICULO" ? "Vehículo" : "Personal a Pie",
            recurso.tipo === "VEHICULO" ? recurso.placa : recurso.personal_nombre,
            recurso.tipo === "VEHICULO" ? recurso.tipo_vehiculo : recurso.tipo_patrullaje,
            recurso.tipo === "VEHICULO" ? recurso.conductor : recurso.personal_nombre,
            recurso.tipo === "VEHICULO" ? recurso.copiloto : "-",
            recurso.kilometraje_inicio || "-",
            recurso.kilometraje_fin || "-",
            recurso.kilometros_recorridos || "-",
            recurso.total_cuadrantes,
            recurso.total_novedades,
          ]);
        }
      }

      const wsDetalle = XLSX.utils.aoa_to_sheet(detalleRows);
      wsDetalle["!cols"] = [
        { wch: 12 }, // Fecha
        { wch: 10 }, // Turno
        { wch: 20 }, // Sector
        { wch: 25 }, // Operador
        { wch: 25 }, // Supervisor
        { wch: 15 }, // Tipo Recurso
        { wch: 15 }, // Identificador
        { wch: 15 }, // Tipo/Cargo
        { wch: 25 }, // Conductor/Personal
        { wch: 25 }, // Copiloto
        { wch: 10 }, // Km Inicio
        { wch: 10 }, // Km Fin
        { wch: 12 }, // Km Recorridos
        { wch: 15 }, // Total Cuadrantes
        { wch: 15 }, // Total Novedades
      ];

      XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle por Recurso");

      // ========================================
      // HOJA 3: CUADRANTES PATRULLADOS
      // ========================================
      const cuadrantesHeaders = [
        "Fecha",
        "Turno",
        "Sector",
        "Tipo Recurso",
        "Identificador",
        "Código Cuadrante",
        "Nombre Cuadrante",
        "Hora Ingreso",
        "Hora Salida",
        "Tiempo (min)",
        "Novedades Atendidas",
      ];

      const cuadrantesRows = [];
      cuadrantesRows.push(cuadrantesHeaders);

      for (const turno of reporteData.data) {
        for (const recurso of turno.recursos) {
          for (const cuadrante of recurso.cuadrantes) {
            cuadrantesRows.push([
              formatDate(turno.fecha),
              turno.turno,
              turno.sector,
              recurso.tipo === "VEHICULO" ? "Vehículo" : "Personal a Pie",
              recurso.tipo === "VEHICULO" ? recurso.placa : recurso.personal_nombre,
              cuadrante.cuadrante_code,
              cuadrante.cuadrante_nombre,
              cuadrante.hora_ingreso ? formatDateTime(cuadrante.hora_ingreso) : "-",
              cuadrante.hora_salida ? formatDateTime(cuadrante.hora_salida) : "-",
              cuadrante.tiempo_minutos || "-",
              cuadrante.novedades_count,
            ]);
          }
        }
      }

      const wsCuadrantes = XLSX.utils.aoa_to_sheet(cuadrantesRows);
      wsCuadrantes["!cols"] = [
        { wch: 12 }, // Fecha
        { wch: 10 }, // Turno
        { wch: 20 }, // Sector
        { wch: 15 }, // Tipo Recurso
        { wch: 15 }, // Identificador
        { wch: 15 }, // Código Cuadrante
        { wch: 30 }, // Nombre Cuadrante
        { wch: 18 }, // Hora Ingreso
        { wch: 18 }, // Hora Salida
        { wch: 12 }, // Tiempo
        { wch: 18 }, // Novedades
      ];

      XLSX.utils.book_append_sheet(wb, wsCuadrantes, "Cuadrantes Patrullados");

      // ========================================
      // Generar y descargar archivo
      // ========================================
      const fechaArchivo = new Date().toISOString().split("T")[0];
      const fileName = `Reporte_Operativos_Patrullaje_${fechaArchivo}.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success(`Archivo "${fileName}" descargado correctamente`);
    } catch (err) {
      console.error("Error exportando a Excel:", err);
      toast.error("Error al exportar el archivo Excel");
    }
  }, [reporteData, sectores]);

  // Manejar ESC para volver
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        navigate("/operativos/turnos");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Sin permisos
  if (!canRead) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">
              Sin permisos
            </h2>
            <p className="text-red-600 dark:text-red-300 mt-2">
              No tienes permisos para acceder a los reportes de operativos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ================================================================ */}
        {/* HEADER */}
        {/* ================================================================ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/operativos/turnos")}
              className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Volver a Turnos (ESC)"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Reportes de Operativos
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Generar reporte de patrullaje por turnos en Excel
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* FILTROS */}
        {/* ================================================================ */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-primary-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Filtros del Reporte
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Clock size={14} className="inline mr-1" />
                Turno
              </label>
              <select
                value={filters.turno}
                onChange={(e) => setFilters({ ...filters, turno: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {TURNO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Sector
              </label>
              <select
                value={filters.sector_id}
                onChange={(e) => setFilters({ ...filters, sector_id: e.target.value })}
                disabled={loadingSectores}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="todos">Todos los sectores</option>
                {sectores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre || s.sector || `Sector ${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Recurso */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Car size={14} className="inline mr-1" />
                Tipo de Recurso
              </label>
              <select
                value={filters.tipo_recurso}
                onChange={(e) => setFilters({ ...filters, tipo_recurso: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {TIPO_RECURSO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Generar */}
            <div className="flex items-end">
              <button
                onClick={handleGenerarReporte}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />
                    Generar Reporte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* ERROR */}
        {/* ================================================================ */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={20} />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* RESULTADOS */}
        {/* ================================================================ */}
        {reporteData && (
          <>
            {/* Resumen */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Resumen del Reporte
                </h2>
                <button
                  onClick={handleExportarExcel}
                  disabled={reporteData.total_turnos === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Download size={18} />
                  Exportar a Excel
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                  <Clock size={24} className="mx-auto text-blue-600 dark:text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {reporteData.total_turnos}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Turnos</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center">
                  <Users size={24} className="mx-auto text-purple-600 dark:text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {reporteData.total_recursos}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Recursos</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                  <MapPin size={24} className="mx-auto text-green-600 dark:text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {reporteData.total_cuadrantes}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Cuadrantes</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                  <Bell size={24} className="mx-auto text-amber-600 dark:text-amber-400 mb-2" />
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {reporteData.total_novedades}
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">Novedades</p>
                </div>
              </div>
            </div>

            {/* Vista previa de datos */}
            {reporteData.total_turnos > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                    Vista Previa de Datos
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Mostrando primeros registros. Descargue el Excel para ver el detalle completo.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                          Turno
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                          Sector
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                          Identificador
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                          Cuadrantes
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                          Novedades
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reporteData.data.slice(0, 5).map((turno) =>
                        turno.recursos.slice(0, 3).map((recurso, idx) => (
                          <tr
                            key={`${turno.turno_id}-${recurso.id}-${idx}`}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              {formatDate(turno.fecha)}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              {turno.turno}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                              {turno.sector}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  recurso.tipo === "VEHICULO"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                }`}
                              >
                                {recurso.tipo === "VEHICULO" ? (
                                  <Car size={12} />
                                ) : (
                                  <Users size={12} />
                                )}
                                {recurso.tipo === "VEHICULO" ? "Vehículo" : "A Pie"}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-50">
                              {recurso.tipo === "VEHICULO"
                                ? recurso.placa
                                : recurso.personal_nombre}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                                <MapPin size={12} />
                                {recurso.total_cuadrantes}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                                <Bell size={12} />
                                {recurso.total_novedades}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {reporteData.total_recursos > 15 && (
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Vista previa limitada. El Excel incluirá todos los {reporteData.total_recursos} recursos.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Sin datos */}
            {reporteData.total_turnos === 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <FileSpreadsheet size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Sin datos para mostrar
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  No se encontraron operativos con los filtros seleccionados.
                  <br />
                  Intente modificar el rango de fechas u otros filtros.
                </p>
              </div>
            )}
          </>
        )}

        {/* Estado inicial */}
        {!reporteData && !loading && !error && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
            <FileSpreadsheet size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Generar Reporte de Patrullaje
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Seleccione los filtros deseados y presione "Generar Reporte"
              <br />
              para consultar los datos y exportar a Excel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
