/**
 * File: src/pages/operativos/ReportesOperativosPage.jsx
 * @version 1.1.0
 * @description Página para generar reportes de operativos de patrullaje en Excel
 *
 * CHANGELOG v1.1.0:
 * - Dropdown Tipo Vehículo condicional (solo cuando tipo_recurso = VEHICULO)
 * - Pestañas Excel separadas: "Detalle Vehículos" y "Patrullaje a Pie"
 * - Columnas adicionales en Detalle Vehículos
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
  Truck,
} from "lucide-react";

// Servicios
import { listSectores } from "../../services/sectoresService.js";
import { listTiposVehiculo } from "../../services/catalogosService.js";
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
 * Formatea fecha para mostrar (UI) - mantiene formato original de la BD sin conversión de timezone
 */
const formatDate = (dateString) => {
  if (!dateString) return "-";
  // Extraer componentes directamente del string ISO para evitar conversión de timezone
  // Formato esperado: YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ
  const dateMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${day}/${month}/${year}`;
  }
  // Fallback si no coincide el formato
  return dateString;
};

/**
 * Formatea fecha/hora para mostrar (UI) - mantiene formato original de la BD sin conversión de timezone
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  // Extraer componentes directamente del string ISO para evitar conversión de timezone
  // Formato esperado: YYYY-MM-DDTHH:mm:ss.sssZ
  const dateTimeMatch = dateString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (dateTimeMatch) {
    const [, year, month, day, hours, minutes] = dateTimeMatch;
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  // Fallback si no coincide el formato
  return dateString;
};



/**
 * Formatea fecha para Excel (mantiene formato ISO)
 */
const formatDateForExcel = (dateString) => {
  if (!dateString) return "";
  return dateString; // Mantener formato original de la BD
};

/**
 * Formatea fecha/hora para Excel (mantiene formato ISO)
 */
const formatDateTimeForExcel = (dateString) => {
  if (!dateString) return "";
  return dateString; // Mantener formato original de la BD
};

/**
 * Formatea número para Excel (asegura que se trate como número, no fecha)
 */
const formatNumberForExcel = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  // Forzar que Excel lo trate como texto con apóstrofe para evitar conversión a fecha
  return `'${num}`;
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
    tipo_vehiculo_id: "todos",
  });

  // Estados de datos
  const [sectores, setSectores] = useState([]);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [loadingSectores, setLoadingSectores] = useState(true);
  const [loadingTiposVehiculo, setLoadingTiposVehiculo] = useState(false);
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

  // Cargar tipos de vehículo cuando se selecciona "Solo Vehículos"
  useEffect(() => {
    if (filters.tipo_recurso === "VEHICULO" && tiposVehiculo.length === 0) {
      const fetchTiposVehiculo = async () => {
        setLoadingTiposVehiculo(true);
        try {
          const tipos = await listTiposVehiculo();
          setTiposVehiculo(tipos || []);
        } catch (err) {
          console.error("Error cargando tipos de vehículo:", err);
        } finally {
          setLoadingTiposVehiculo(false);
        }
      };
      fetchTiposVehiculo();
    }
  }, [filters.tipo_recurso, tiposVehiculo.length]);

  // Resetear tipo_vehiculo_id cuando cambia tipo_recurso
  useEffect(() => {
    if (filters.tipo_recurso !== "VEHICULO") {
      setFilters((prev) => ({ ...prev, tipo_vehiculo_id: "todos" }));
    }
  }, [filters.tipo_recurso]);

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

      // Separar recursos por tipo
      const vehiculos = [];
      const personal = [];

      for (const turno of reporteData.data) {
        for (const recurso of turno.recursos) {
          if (recurso.tipo === "VEHICULO") {
            vehiculos.push({ turno, recurso });
          } else {
            personal.push({ turno, recurso });
          }
        }
      }

      // ========================================
      // HOJA 1: RESUMEN
      // ========================================
      const resumenData = [
        ["REPORTE DE OPERATIVOS DE PATRULLAJE"],
        [""],
        ["Generado:", formatDateTime(reporteData.generado_en)],
        [""],
        ["FILTROS APLICADOS"],
        ["Fecha Inicio:", formatDateForExcel(reporteData.filtros.fecha_inicio)],
        ["Fecha Fin:", formatDateForExcel(reporteData.filtros.fecha_fin)],
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
        ["Total Vehículos:", vehiculos.length],
        ["Total Personal a Pie:", personal.length],
        ["Total Cuadrantes Patrullados:", reporteData.total_cuadrantes],
        ["Total Novedades Atendidas:", reporteData.total_novedades],
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      wsResumen["!cols"] = [{ wch: 30 }, { wch: 40 }];
      XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

      // ========================================
      // HOJA 2: DETALLE VEHÍCULOS
      // ========================================
      if (vehiculos.length > 0) {
        const vehiculosHeaders = [
          "Fecha",
          "Turno",
          "Sector",
          "Operador",
          "Supervisor",
          "Tipo Recurso",
          "Código Vehículo",
          "Placa",
          "Tipo Vehículo",
          "Unidad/Oficina",
          "SOAT",
          "Venc. SOAT",
          "Conductor",
          "Copiloto",
          "Tipo Copiloto",
          "Radio TETRA",
          "Estado Operativo",
          "Km Inicio",
          "Hora Inicio",
          "Km Recarga",
          "Hora Recarga",
          "Combustible (Lt)",
          "Importe Recarga",
          "Nivel Combustible",
          "Km Fin",
          "Km Recorridos",
          "Observaciones",
          "Total Cuadrantes",
          "Total Novedades",
        ];

        const vehiculosRows = [vehiculosHeaders];

        for (const { turno, recurso } of vehiculos) {
          vehiculosRows.push([
            formatDateForExcel(turno.fecha),
            turno.turno,
            turno.sector,
            turno.operador,
            turno.supervisor,
            "Vehículo",
            recurso.codigo_vehiculo || "-",
            recurso.placa || "-",
            recurso.tipo_vehiculo || "-",
            recurso.unidad_oficina || "-",
            recurso.soat || "-",
            recurso.fec_soat ? formatDateForExcel(recurso.fec_soat) : "",
            recurso.conductor || "-",
            recurso.copiloto || "-",
            recurso.tipo_copiloto || "-",
            recurso.radio_tetra_code || "-",
            recurso.estado_operativo || "-",
            formatNumberForExcel(recurso.kilometraje_inicio),
            recurso.hora_inicio ? formatDateTimeForExcel(recurso.hora_inicio) : "",
            formatNumberForExcel(recurso.kilometraje_recarga),
            recurso.hora_recarga ? formatDateTimeForExcel(recurso.hora_recarga) : "",
            recurso.combustible_litros || "-",
            recurso.importe_recarga || "-",
            recurso.nivel_combustible_recarga || "-",
            formatNumberForExcel(recurso.kilometraje_fin),
            formatNumberForExcel(recurso.kilometros_recorridos),
            recurso.observaciones || "-",
            recurso.total_cuadrantes,
            recurso.total_novedades,
          ]);
        }

        const wsVehiculos = XLSX.utils.aoa_to_sheet(vehiculosRows);
        wsVehiculos["!cols"] = [
          { wch: 12 }, // Fecha
          { wch: 10 }, // Turno
          { wch: 18 }, // Sector
          { wch: 22 }, // Operador
          { wch: 22 }, // Supervisor
          { wch: 12 }, // Tipo Recurso
          { wch: 15 }, // Código Vehículo
          { wch: 10 }, // Placa
          { wch: 14 }, // Tipo Vehículo
          { wch: 20 }, // Unidad/Oficina
          { wch: 15 }, // SOAT
          { wch: 12 }, // Venc. SOAT
          { wch: 22 }, // Conductor
          { wch: 22 }, // Copiloto
          { wch: 15 }, // Tipo Copiloto
          { wch: 12 }, // Radio TETRA
          { wch: 15 }, // Estado Operativo
          { wch: 10 }, // Km Inicio
          { wch: 10 }, // Hora Inicio
          { wch: 10 }, // Km Recarga
          { wch: 10 }, // Hora Recarga
          { wch: 14 }, // Combustible
          { wch: 12 }, // Importe Recarga
          { wch: 15 }, // Nivel Combustible
          { wch: 10 }, // Km Fin
          { wch: 12 }, // Km Recorridos
          { wch: 30 }, // Observaciones
          { wch: 14 }, // Total Cuadrantes
          { wch: 14 }, // Total Novedades
        ];

        // Aplicar formato de fecha a columnas específicas
        const rangeVehiculos = XLSX.utils.decode_range(wsVehiculos['!ref']);
        for (let C = 0; C <= rangeVehiculos.e.c; C++) {
          if ([0, 11, 17, 19].includes(C)) { // Columnas: Fecha, Venc. SOAT, Hora Inicio, Hora Recarga
            for (let R = 1; R <= rangeVehiculos.e.r; R++) {
              const cellRef = XLSX.utils.encode_cell({c: C, r: R});
              if (wsVehiculos[cellRef] && wsVehiculos[cellRef].v) {
                wsVehiculos[cellRef].z = C === 0 || C === 11 ? 'yyyy-mm-dd;@' : 'yyyy-mm-dd hh:mm:ss;@';
              }
            }
          }
        }

        XLSX.utils.book_append_sheet(wb, wsVehiculos, "Detalle Vehículos");
      }

      // ========================================
      // HOJA 3: PATRULLAJE A PIE
      // ========================================
      if (personal.length > 0) {
        const personalHeaders = [
          "Fecha",
          "Turno",
          "Sector",
          "Operador",
          "Supervisor",
          "Tipo Recurso",
          "Nombre Personal",
          "Tipo Patrullaje",
          "Cargo",
          "Total Cuadrantes",
          "Total Novedades",
        ];

        const personalRows = [personalHeaders];

        for (const { turno, recurso } of personal) {
          personalRows.push([
            formatDateForExcel(turno.fecha),
            turno.turno,
            turno.sector,
            turno.operador,
            turno.supervisor,
            "Personal a Pie",
            recurso.personal_nombre || "-",
            recurso.tipo_patrullaje || "-",
            recurso.cargo || "-",
            recurso.total_cuadrantes,
            recurso.total_novedades,
          ]);
        }

        const wsPersonal = XLSX.utils.aoa_to_sheet(personalRows);
        wsPersonal["!cols"] = [
          { wch: 12 }, // Fecha
          { wch: 10 }, // Turno
          { wch: 18 }, // Sector
          { wch: 22 }, // Operador
          { wch: 22 }, // Supervisor
          { wch: 14 }, // Tipo Recurso
          { wch: 28 }, // Nombre Personal
          { wch: 15 }, // Tipo Patrullaje
          { wch: 18 }, // Cargo
          { wch: 14 }, // Total Cuadrantes
          { wch: 14 }, // Total Novedades
        ];

        XLSX.utils.book_append_sheet(wb, wsPersonal, "Patrullaje a Pie");
      }

      // ========================================
      // HOJA 4: CUADRANTES PATRULLADOS
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

      const cuadrantesRows = [cuadrantesHeaders];

      for (const turno of reporteData.data) {
        for (const recurso of turno.recursos) {
          for (const cuadrante of recurso.cuadrantes) {
            cuadrantesRows.push([
              formatDateForExcel(turno.fecha),
              turno.turno,
              turno.sector,
              recurso.tipo === "VEHICULO" ? "Vehículo" : "Personal a Pie",
              recurso.tipo === "VEHICULO" ? recurso.placa : recurso.personal_nombre,
              cuadrante.cuadrante_code,
              cuadrante.cuadrante_nombre,
              cuadrante.hora_ingreso ? formatDateTimeForExcel(cuadrante.hora_ingreso) : "",
              cuadrante.hora_salida ? formatDateTimeForExcel(cuadrante.hora_salida) : "",
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
          { wch: 18 }, // Sector
          { wch: 14 }, // Tipo Recurso
          { wch: 18 }, // Identificador
          { wch: 15 }, // Código Cuadrante
          { wch: 28 }, // Nombre Cuadrante
          { wch: 18 }, // Hora Ingreso
          { wch: 18 }, // Hora Salida
          { wch: 12 }, // Tiempo
          { wch: 16 }, // Novedades
        ];

        // Aplicar formato de fecha a columnas específicas
        const rangeCuadrantes = XLSX.utils.decode_range(wsCuadrantes['!ref']);
        for (let C = 0; C <= rangeCuadrantes.e.c; C++) {
          if ([0, 7, 8].includes(C)) { // Columnas: Fecha, Hora Ingreso, Hora Salida
            for (let R = 1; R <= rangeCuadrantes.e.r; R++) {
              const cellRef = XLSX.utils.encode_cell({c: C, r: R});
              if (wsCuadrantes[cellRef] && wsCuadrantes[cellRef].v) {
                wsCuadrantes[cellRef].z = C === 0 ? 'yyyy-mm-dd;@' : 'yyyy-mm-dd hh:mm:ss;@';
              }
            }
          }
        }

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
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
            <Filter size={20} className="text-orange-600" />
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

            {/* Tipo de Vehículo (condicional) */}
            {filters.tipo_recurso === "VEHICULO" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Truck size={14} className="inline mr-1" />
                  Tipo de Vehículo
                </label>
                <select
                  value={filters.tipo_vehiculo_id}
                  onChange={(e) => setFilters({ ...filters, tipo_vehiculo_id: e.target.value })}
                  disabled={loadingTiposVehiculo}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
                >
                  <option value="todos">Todos los tipos</option>
                  {tiposVehiculo.map((tv) => (
                    <option key={tv.id} value={tv.id}>
                      {tv.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Botón Generar */}
            <div className="flex items-end">
              <button
                onClick={handleGenerarReporte}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
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
