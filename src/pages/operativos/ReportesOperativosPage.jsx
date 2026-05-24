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

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// xlsx ya no se usa — migrado a ExcelJS (ver handleExportarExcel)
import html2canvas from "html2canvas";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
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
 * Formatea fecha/hora para mostrar (UI) - homologado con NovedadesPage.jsx para local time
 */
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  // Usar local time como NovedadesPage.jsx para evitar problemas UTC
  const date = new Date(dateString);
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
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
 * Obtiene fecha de hoy en formato YYYY-MM-DD (local time)
 * Homologado con NovedadesPage.jsx para evitar problemas de timezone
 */
const getTodayDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Obtiene fecha de ayer en formato YYYY-MM-DD (local time)
 * Cambiado de 7 días a 1 día (ayer) según requerimiento
 */
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const d = String(yesterday.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
    fecha_inicio: getYesterdayDate(), // Cambiado de getWeekAgoDate() a getYesterdayDate()
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

  // Refs para captura de gráficos — usados al exportar Excel
  const chartDistribucionRef = useRef(null);
  const chartNovedadesRef = useRef(null);
  const chartTiposRef = useRef(null);

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
  const handleExportarExcel = useCallback(async () => {
    if (!reporteData || reporteData.total_turnos === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    try {
      // Capturar gráficos off-screen como PNG para incrustar en Excel
      const captureChart = async (ref) => {
        if (!ref?.current) return null;
        try {
          const canvas = await html2canvas(ref.current, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            useCORS: true,
            logging: false,
          });
          return canvas.toDataURL("image/png").split(",")[1];
        } catch {
          return null;
        }
      };
      const [imgDistribucion, imgNovedades, imgTipos] = await Promise.all([
        captureChart(chartDistribucionRef),
        captureChart(chartNovedadesRef),
        captureChart(chartTiposRef),
      ]);

      // Crear workbook con ExcelJS nativo
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      workbook.creator = "CitySecure";
      workbook.created = new Date();

      // Constantes de estilo
      const C_HEADER_BG   = "FF1E3A8A"; // azul oscuro — encabezados de columna
      const C_SECTION_BG  = "FF334155"; // gris pizarra — títulos de sección
      const C_KPI_VALUE   = "FF1D4ED8"; // azul — valores KPI
      const C_WHITE       = "FFFFFFFF";

      // Aplica estilo a la fila de encabezado de columnas
      const styleHeader = (row, numCols) => {
        for (let c = 1; c <= numCols; c++) {
          const cell = row.getCell(c);
          cell.font = { bold: true, color: { argb: C_WHITE }, size: 10 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_HEADER_BG } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = { bottom: { style: "thin", color: { argb: "FFE2E8F0" } } };
        }
        row.height = 20;
      };

      // Aplica estilo a un título de sección (fila completa)
      const styleSection = (row, numCols = 2) => {
        for (let c = 1; c <= numCols; c++) {
          const cell = row.getCell(c);
          cell.font = { bold: true, color: { argb: C_WHITE }, size: 10 };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: C_SECTION_BG } };
        }
        row.height = 18;
      };

      // Separar recursos por tipo
      const vehiculos = [];
      const personal = [];
      for (const turno of reporteData.data) {
        for (const recurso of turno.recursos) {
          if (recurso.tipo === "VEHICULO") vehiculos.push({ turno, recurso });
          else personal.push({ turno, recurso });
        }
      }

      // ========================================
      // HOJA 1: RESUMEN
      // ========================================
      {
        const ws = workbook.addWorksheet("Resumen");
        ws.columns = [{ width: 38 }, { width: 48 }];

        // Título principal
        const rTitulo = ws.addRow(["REPORTE DE OPERATIVOS DE PATRULLAJE"]);
        rTitulo.getCell(1).font = { bold: true, size: 14, color: { argb: C_HEADER_BG } };
        ws.mergeCells("A1:B1");

        ws.addRow([""]);
        ws.addRow(["Generado:", formatDateTime(reporteData.generado_en)]);
        ws.addRow([""]);

        // Sección filtros
        const rFiltrosTitulo = ws.addRow(["FILTROS APLICADOS"]);
        styleSection(rFiltrosTitulo);
        ws.mergeCells(`A${rFiltrosTitulo.number}:B${rFiltrosTitulo.number}`);

        const sectorLabel = reporteData.filtros.sector_id === "todos"
          ? "Todos"
          : sectores.find((s) => s.id === Number(reporteData.filtros.sector_id))?.nombre || reporteData.filtros.sector_id;

        ws.addRow(["Fecha Inicio:", formatDateForExcel(reporteData.filtros.fecha_inicio)]);
        ws.addRow(["Fecha Fin:",    formatDateForExcel(reporteData.filtros.fecha_fin)]);
        ws.addRow(["Turno:",        reporteData.filtros.turno === "todos" ? "Todos" : reporteData.filtros.turno]);
        ws.addRow(["Sector:",       sectorLabel]);
        ws.addRow(["Tipo Recurso:", reporteData.filtros.tipo_recurso === "todos"
          ? "Todos"
          : reporteData.filtros.tipo_recurso === "VEHICULO" ? "Vehículos" : "Patrullaje a Pie"]);

        ws.addRow([""]);

        // Sección totales
        const rTotalesTitulo = ws.addRow(["TOTALES"]);
        styleSection(rTotalesTitulo);
        ws.mergeCells(`A${rTotalesTitulo.number}:B${rTotalesTitulo.number}`);

        const kpis = [
          ["Total Turnos:",                             reporteData.total_turnos],
          ["Total Recursos:",                           reporteData.total_recursos],
          ["Total Vehículos:",                          reporteData.total_vehiculos],
          ["Total Personal a Pie:",                     reporteData.total_personal],
          ["Total Cuadrantes Patrullados:",             reporteData.total_cuadrantes],
          ["Total Novedades Atendidas:",                reporteData.total_novedades],
          ["Total Novedades No Atendidas (PENDIENTE):", reporteData.novedades_pendientes?.length || 0],
        ];
        for (const [label, value] of kpis) {
          const r = ws.addRow([label, value]);
          r.getCell(1).font = { bold: true, color: { argb: "FF334155" } };
          r.getCell(2).font = { bold: true, size: 12, color: { argb: C_KPI_VALUE } };
        }

        // Sección gráficos
        ws.addRow([""]);
        const rGraficosTitulo = ws.addRow(["GRÁFICOS"]);
        styleSection(rGraficosTitulo);
        ws.mergeCells(`A${rGraficosTitulo.number}:B${rGraficosTitulo.number}`);

        let imgRow = rGraficosTitulo.number; // ExcelJS tl.row es 0-indexed
        const addChartImage = (imgData, w = 480, h = 260) => {
          if (!imgData) return;
          const id = workbook.addImage({ base64: imgData, extension: "png" });
          ws.addImage(id, { tl: { col: 0, row: imgRow }, ext: { width: w, height: h } });
          imgRow += Math.ceil(h / 14) + 1;
        };
        addChartImage(imgDistribucion);
        addChartImage(imgNovedades);
        addChartImage(imgTipos, 720, 300);
      }

      // ========================================
      // HOJA 2: SECTORES
      // ========================================
      if (reporteData.turnos && reporteData.turnos.length > 0) {
        const ws = workbook.addWorksheet("Sectores");
        ws.columns = [
          { width: 12 }, { width: 10 }, { width: 18 }, { width: 22 }, { width: 22 },
          { width: 20 }, { width: 20 }, { width: 12 }, { width: 30 },
        ];
        const headers = ["Fecha", "Turno", "Sector", "Operador", "Supervisor",
          "Fecha/Hora Inicio", "Fecha/Hora Fin", "Estado", "Observaciones"];
        styleHeader(ws.addRow(headers), headers.length);
        for (const turno of reporteData.turnos) {
          ws.addRow([
            formatDateForExcel(turno.fecha),    turno.turno || "-",
            turno.sector || "-",                turno.operador || "-",
            turno.supervisor || "-",            formatDateTime(turno.fecha_hora_inicio),
            formatDateTime(turno.fecha_hora_fin), turno.estado || "-",
            turno.observaciones || "-",
          ]);
        }
      }

      // ========================================
      // HOJA 3: DETALLE VEHÍCULOS
      // ========================================
      if (vehiculos.length > 0) {
        const ws = workbook.addWorksheet("Detalle Vehículos");
        ws.columns = [
          { width: 12 }, { width: 10 }, { width: 18 }, { width: 22 }, { width: 22 },
          { width: 12 }, { width: 15 }, { width: 10 }, { width: 14 }, { width: 20 },
          { width: 15 }, { width: 12 }, { width: 22 }, { width: 22 }, { width: 15 },
          { width: 12 }, { width: 15 }, { width: 10 }, { width: 10 }, { width: 10 },
          { width: 10 }, { width: 14 }, { width: 12 }, { width: 15 }, { width: 10 },
          { width: 12 }, { width: 30 }, { width: 14 }, { width: 14 },
        ];
        const headers = [
          "Fecha", "Turno", "Sector", "Operador", "Supervisor",
          "Tipo Recurso", "Código Vehículo", "Placa", "Tipo Vehículo", "Unidad/Oficina",
          "SOAT", "Venc. SOAT", "Conductor", "Copiloto", "Tipo Copiloto",
          "Radio TETRA", "Estado Operativo", "Km Inicio", "Hora Inicio", "Km Recarga",
          "Hora Recarga", "Combustible (Lt)", "Importe Recarga", "Nivel Combustible", "Km Fin",
          "Km Recorridos", "Observaciones", "Total Cuadrantes", "Total Novedades",
        ];
        styleHeader(ws.addRow(headers), headers.length);
        for (const { turno, recurso } of vehiculos) {
          ws.addRow([
            formatDateForExcel(turno.fecha),    turno.turno,
            turno.sector,                       turno.operador,
            turno.supervisor,                   "Vehículo",
            recurso.codigo_vehiculo || "-",     recurso.placa || "-",
            recurso.tipo_vehiculo || "-",       recurso.unidad_oficina || "-",
            recurso.soat || "-",                recurso.fec_soat ? formatDateForExcel(recurso.fec_soat) : "",
            recurso.conductor || "-",           recurso.copiloto || "-",
            recurso.tipo_copiloto || "-",       recurso.radio_tetra_code || "-",
            recurso.estado_operativo || "-",    recurso.kilometraje_inicio ?? "",
            recurso.hora_inicio ? formatDateTimeForExcel(recurso.hora_inicio) : "",
            recurso.kilometraje_recarga ?? "",
            recurso.hora_recarga ? formatDateTimeForExcel(recurso.hora_recarga) : "",
            recurso.combustible_litros || "-",  recurso.importe_recarga || "-",
            recurso.nivel_combustible_recarga || "-", recurso.kilometraje_fin ?? "",
            recurso.kilometros_recorridos ?? "", recurso.observaciones || "-",
            recurso.total_cuadrantes,           recurso.total_novedades,
          ]);
        }
      }

      // ========================================
      // HOJA 4: PATRULLAJE A PIE
      // ========================================
      if (personal.length > 0) {
        const ws = workbook.addWorksheet("Patrullaje a Pie");
        ws.columns = [
          { width: 12 }, { width: 10 }, { width: 18 }, { width: 22 }, { width: 22 },
          { width: 14 }, { width: 28 }, { width: 15 }, { width: 18 }, { width: 14 }, { width: 14 },
        ];
        const headers = ["Fecha", "Turno", "Sector", "Operador", "Supervisor",
          "Tipo Recurso", "Nombre Personal", "Tipo Patrullaje", "Cargo",
          "Total Cuadrantes", "Total Novedades"];
        styleHeader(ws.addRow(headers), headers.length);
        for (const { turno, recurso } of personal) {
          ws.addRow([
            formatDateForExcel(turno.fecha), turno.turno, turno.sector,
            turno.operador, turno.supervisor, "Personal a Pie",
            recurso.personal_nombre || "-", recurso.tipo_patrullaje || "-",
            recurso.cargo || "-", recurso.total_cuadrantes, recurso.total_novedades,
          ]);
        }
      }

      // ========================================
      // HOJA 5: CUADRANTES PATRULLADOS
      // ========================================
      {
        const ws = workbook.addWorksheet("Cuadrantes Patrullados");
        ws.columns = [
          { width: 12 }, { width: 10 }, { width: 18 }, { width: 14 }, { width: 18 },
          { width: 15 }, { width: 28 }, { width: 18 }, { width: 18 }, { width: 12 }, { width: 16 },
        ];
        const headers = ["Fecha", "Turno", "Sector", "Tipo Recurso", "Identificador",
          "Código Cuadrante", "Nombre Cuadrante", "Hora Ingreso", "Hora Salida",
          "Tiempo (min)", "Novedades Atendidas"];
        styleHeader(ws.addRow(headers), headers.length);
        for (const turno of reporteData.data) {
          for (const recurso of turno.recursos) {
            for (const cuadrante of recurso.cuadrantes) {
              ws.addRow([
                formatDateForExcel(turno.fecha),  turno.turno,  turno.sector,
                recurso.tipo === "VEHICULO" ? "Vehículo" : "Personal a Pie",
                recurso.tipo === "VEHICULO" ? recurso.placa : recurso.personal_nombre,
                cuadrante.cuadrante_code,         cuadrante.cuadrante_nombre,
                cuadrante.hora_ingreso ? formatDateTimeForExcel(cuadrante.hora_ingreso) : "",
                cuadrante.hora_salida  ? formatDateTimeForExcel(cuadrante.hora_salida)  : "",
                cuadrante.tiempo_minutos || "-",  cuadrante.novedades_count,
              ]);
            }
          }
        }
      }

      // ========================================
      // HOJA 6: NOVEDADES ATENDIDAS
      // ========================================
      {
        const ws = workbook.addWorksheet("Novedades Atendidas");
        ws.columns = [
          { width: 16 }, { width: 20 }, { width: 18 }, { width: 20 }, { width: 18 },
          { width: 20 }, { width: 22 }, { width: 22 }, { width: 45 }, { width: 35 },
          { width: 30 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
          { width: 40 }, { width: 25 }, { width: 18 }, { width: 10 }, { width: 20 },
          { width: 22 }, { width: 22 }, { width: 16 }, { width: 22 }, { width: 16 },
          { width: 28 }, { width: 22 }, { width: 22 },
        ];
        const headers = [
          "Código Novedad", "Fecha Ocurrencia", "Estado Novedad", "Fecha Despacho", "Origen Llamada",
          "Fecha Llegada", "Tipo Novedad", "Subtipo Novedad", "Descripción", "Localización",
          "Referencia", "Latitud", "Longitud", "Prioridad", "Resultado",
          "Observaciones Atención", "Reportante Nombre", "Reportante Teléfono",
          "Turno", "Sector", "Operador", "Supervisor", "Tipo Recurso", "Recurso (Placa/Personal)",
          "Cuadrante Código", "Cuadrante Nombre", "Hora Ingreso Cuadrante", "Hora Salida Cuadrante",
        ];
        styleHeader(ws.addRow(headers), headers.length);
        const novedadesOrdenadas = [...(Array.isArray(reporteData.novedades) ? reporteData.novedades : [])]
          .sort((a, b) => (a.codigo_novedad || "").localeCompare(b.codigo_novedad || ""));
        if (novedadesOrdenadas.length === 0) {
          ws.addRow(["Sin novedades para el período seleccionado"]);
        } else {
          for (const n of novedadesOrdenadas) {
            ws.addRow([
              n.codigo_novedad || "-",   formatDateForExcel(n.fecha_ocurrencia),
              n.estado_novedad || "-",   n.fecha_despacho ? formatDateTimeForExcel(n.fecha_despacho) : "-",
              n.origen_llamada || "-",   n.fecha_llegada  ? formatDateTimeForExcel(n.fecha_llegada)  : "-",
              n.tipo_novedad || "-",     n.subtipo_novedad || "-",
              n.descripcion || "-",      n.direccion || "-",
              n.referencia || "-",       n.latitud  ?? "-",
              n.longitud  ?? "-",        n.prioridad || "-",
              n.resultado || "-",        n.obs_atencion || "-",
              n.reportante_nombre || "-", n.reportante_telefono || "-",
              n.turno || "-",            n.sector || "-",
              n.operador || "-",         n.supervisor || "-",
              n.tipo_recurso || "-",     n.recurso_nombre || "-",
              n.cuadrante_codigo || "-", n.cuadrante_nombre || "-",
              n.hora_ingreso ? formatDateTimeForExcel(n.hora_ingreso) : "-",
              n.hora_salida  ? formatDateTimeForExcel(n.hora_salida)  : "-",
            ]);
          }
        }
      }

      // ========================================
      // HOJA 7: NO ATENDIDAS (PENDIENTE)
      // ========================================
      {
        const noAtendidas = Array.isArray(reporteData.novedades_pendientes) ? reporteData.novedades_pendientes : [];
        const ws = workbook.addWorksheet("No Atendidas");
        ws.columns = [
          { width: 16 }, { width: 20 }, { width: 18 }, { width: 20 }, { width: 18 },
          { width: 20 }, { width: 22 }, { width: 22 }, { width: 45 }, { width: 35 },
          { width: 30 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
          { width: 40 }, { width: 25 }, { width: 18 }, { width: 10 }, { width: 20 },
          { width: 22 }, { width: 22 }, { width: 16 }, { width: 22 }, { width: 16 },
          { width: 28 }, { width: 22 }, { width: 22 },
        ];
        const headers = [
          "Código Novedad", "Fecha Ocurrencia", "Estado Novedad", "Fecha Despacho", "Origen Llamada",
          "Fecha Llegada", "Tipo Novedad", "Subtipo Novedad", "Descripción", "Localización",
          "Referencia", "Latitud", "Longitud", "Prioridad", "Resultado",
          "Observaciones Atención", "Reportante Nombre", "Reportante Teléfono",
          "Turno", "Sector", "Operador", "Supervisor", "Tipo Recurso", "Recurso (Placa/Personal)",
          "Cuadrante Código", "Cuadrante Nombre", "Hora Ingreso Cuadrante", "Hora Salida Cuadrante",
        ];
        styleHeader(ws.addRow(headers), headers.length);
        if (noAtendidas.length === 0) {
          ws.addRow(["Sin novedades pendientes para el período seleccionado"]);
        } else {
          for (const n of noAtendidas) {
            ws.addRow([
              n.codigo_novedad || "-",   formatDateForExcel(n.fecha_ocurrencia),
              n.estado_novedad || "-",   n.fecha_despacho ? formatDateTimeForExcel(n.fecha_despacho) : "-",
              n.origen_llamada || "-",   n.fecha_llegada  ? formatDateTimeForExcel(n.fecha_llegada)  : "-",
              n.tipo_novedad || "-",     n.subtipo_novedad || "-",
              n.descripcion || "-",      n.direccion || "-",
              n.referencia || "-",       n.latitud  ?? "-",
              n.longitud  ?? "-",        n.prioridad || "-",
              n.resultado || "-",        n.obs_atencion || "-",
              n.reportante_nombre || "-", n.reportante_telefono || "-",
              n.turno || "-",            n.sector || "-",
              n.operador || "-",         n.supervisor || "-",
              n.tipo_recurso || "-",     n.recurso_nombre || "-",
              n.cuadrante_codigo || "-", n.cuadrante_nombre || "-",
              n.hora_ingreso ? formatDateTimeForExcel(n.hora_ingreso) : "-",
              n.hora_salida  ? formatDateTimeForExcel(n.hora_salida)  : "-",
            ]);
          }
        }
      }

      // ========================================
      // DESCARGAR
      // ========================================
      const fechaArchivo = new Date().toISOString().split("T")[0];
      const fileName = `Reporte_Operativos_Patrullaje_${fechaArchivo}.xlsx`;
      const finalBuffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([finalBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
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
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Filtros del Reporte
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Fecha Inicio */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Calendar size={14} className="inline mr-1 text-slate-600 dark:text-white" />
                Fecha Inicio
              </label>
              <input
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => setFilters({ ...filters, fecha_inicio: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Calendar size={14} className="inline mr-1 text-slate-600 dark:text-white" />
                Fecha Fin
              </label>
              <input
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => setFilters({ ...filters, fecha_fin: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
              />
            </div>

            {/* Turno */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Clock size={14} className="inline mr-1" />
                Turno
              </label>
              <select
                value={filters.turno}
                onChange={(e) => setFilters({ ...filters, turno: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <MapPin size={14} className="inline mr-1" />
                Sector
              </label>
              <select
                value={filters.sector_id}
                onChange={(e) => setFilters({ ...filters, sector_id: e.target.value })}
                disabled={loadingSectores}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                <Car size={14} className="inline mr-1" />
                Tipo de Recurso
              </label>
              <select
                value={filters.tipo_recurso}
                onChange={(e) => setFilters({ ...filters, tipo_recurso: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:dark:invert"
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Truck size={14} className="inline mr-1" />
                  Tipo de Vehículo
                </label>
                <select
                  value={filters.tipo_vehiculo_id}
                  onChange={(e) => setFilters({ ...filters, tipo_vehiculo_id: e.target.value })}
                  disabled={loadingTiposVehiculo}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 text-slate-900 dark:text-slate-50 [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-50"
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
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                  <Clock size={20} className="mx-auto text-blue-600 dark:text-blue-400 mb-1" />
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {reporteData.total_turnos}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Turnos</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
                  <Users size={20} className="mx-auto text-purple-600 dark:text-purple-400 mb-1" />
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {reporteData.total_recursos}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">Recursos</p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                  <MapPin size={20} className="mx-auto text-green-600 dark:text-green-400 mb-1" />
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {reporteData.total_cuadrantes}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">Cuadrantes</p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                  <Bell size={20} className="mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {reporteData.total_novedades}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">Novedades</p>
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

        {/* Gráficos off-screen para captura al exportar Excel */}
        {reporteData && (
          <div
            aria-hidden="true"
            style={{
              position: "fixed", left: "-9999px", top: 0,
              width: 500, pointerEvents: "none", zIndex: -1,
            }}
          >
            {/* Gráfico 1 — Distribución de Recursos */}
            <div
              ref={chartDistribucionRef}
              style={{ width: 500, height: 280, background: "#fff", padding: "12px 16px" }}
            >
              <p style={{ textAlign: "center", fontFamily: "sans-serif", fontWeight: "bold", fontSize: 14, color: "#1e293b", margin: "0 0 6px" }}>
                Distribución de Recursos
              </p>
              <PieChart width={468} height={240}>
                <Pie
                  data={[
                    { name: "Vehículos", value: reporteData.total_vehiculos || 0 },
                    { name: "Personal a Pie", value: reporteData.total_personal || 0 },
                  ]}
                  cx={234} cy={105} outerRadius={88} innerRadius={42}
                  dataKey="value" isAnimationActive={false}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Legend />
              </PieChart>
            </div>

            {/* Gráfico 2 — Estado de Novedades */}
            <div
              ref={chartNovedadesRef}
              style={{ width: 500, height: 280, background: "#fff", padding: "12px 16px" }}
            >
              <p style={{ textAlign: "center", fontFamily: "sans-serif", fontWeight: "bold", fontSize: 14, color: "#1e293b", margin: "0 0 6px" }}>
                Estado de Novedades
              </p>
              <BarChart
                width={468} height={240}
                data={[
                  { name: "Atendidas", value: reporteData.total_novedades || 0 },
                  { name: "No Atendidas", value: reporteData.novedades_pendientes?.length || 0 },
                ]}
                margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" isAnimationActive={false}>
                  <Cell fill="#22c55e" />
                  <Cell fill="#f97316" />
                </Bar>
              </BarChart>
            </div>

            {/* Gráfico 3 — Novedades por Tipo (solo si hay datos) */}
            {(() => {
              const tiposCount = {};
              for (const nov of reporteData.novedades || []) {
                const tipoBase = (nov.tipo_novedad || "Sin tipo").split("/")[0].trim();
                const subtipo = (nov.subtipo_novedad || "").trim();
                const label = subtipo ? `${tipoBase} / ${subtipo}` : tipoBase;
                tiposCount[label] = (tiposCount[label] || 0) + 1;
              }
              const tiposData = Object.entries(tiposCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([name, value]) => ({ name, value }));
              if (tiposData.length === 0) return null;
              return (
                <div
                  ref={chartTiposRef}
                  style={{ width: 800, height: 320, background: "#fff", padding: "12px 16px" }}
                >
                  <p style={{ textAlign: "center", fontFamily: "sans-serif", fontWeight: "bold", fontSize: 14, color: "#1e293b", margin: "0 0 6px" }}>
                    Novedades Atendidas por Tipo
                  </p>
                  <BarChart
                    width={768} height={280} data={tiposData} layout="vertical"
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={200} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" isAnimationActive={false} />
                  </BarChart>
                </div>
              );
            })()}
          </div>
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
