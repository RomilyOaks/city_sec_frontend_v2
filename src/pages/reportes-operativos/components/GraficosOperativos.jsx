/**
 * 📈 Componente Gráficos Operativos - Reportes Operativos v2.0
 * 
 * Componente placeholder para gráficos interactivos
 * Se implementará con librería de gráficos (Chart.js/Recharts)
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useMemo, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp,
  Download,
  Settings,
  Filter,
  Maximize2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  LineChart as ReLineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import html2canvas from 'html2canvas';

// Colores profesionales consistentes con la identidad visual
const COLORS = {
  primary: {
    50: '#f0f9e8',
    500: '#6bb52e',
    600: '#5ca425',
    700: '#4e8c1f',
    800: '#417419',
    900: '#365c14'
  },
  chart: {
    green: '#10b981',
    amber: '#f59e0b',
    orange: '#f97316',
    red: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    slate: '#64748b'
  }
};

// Custom Tooltip profesional
const CustomTooltip = ({ active, payload, label, type = 'default' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
        {label && (
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-2">
            {label}
          </p>
        )}
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-600 dark:text-slate-400">
              {entry.name}:
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-50">
              {type === 'percentage' ? `${entry.value}%` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Label para Pie Chart
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null; // No mostrar labels muy pequeños

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-semibold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const GraficosOperativos = ({ data, filters = {} }) => {
  // Memoizar datos procesados para optimización
  const processedData = useMemo(() => {
    if (!data) return {};
    
    console.log('🔍 Datos procesados:', {
      analisisTurnos: data?.analisis_turnos || [],
      totalNovedades: data?.total_novedades || 0,
      analisisPrioridad: data?.analisis_prioridad || [],
      tendencias: data?.tendencias || [],
      acumulados: data?.tendencias?.map((item, index) => ({
        ...item,
        fecha: new Date(item.fecha).toLocaleDateString('es-PE', { 
          day: '2-digit', 
          month: 'short' 
        }),
        acumulado: data.tendencias.slice(0, index + 1).reduce((sum, t) => sum + t.cantidad, 0)
      })) || []
    });
    
    return {
      analisisTurnos: data.analisis_turnos?.map(item => ({
        ...item,
        porcentaje: item.porcentaje || 0
      })) || [],
      analisisPrioridad: data.analisis_prioridad?.map(item => ({
        ...item,
        color: item.prioridad === 'BAJA' ? COLORS.chart.green :
               item.prioridad === 'MEDIA' ? COLORS.chart.amber :
               item.prioridad === 'ALTA' ? COLORS.chart.red : COLORS.chart.slate
      })) || [],
      tendencias: data?.tendencias?.map((item, index) => ({
        ...item,
        fecha: new Date(item.fecha).toLocaleDateString('es-PE', { 
          day: '2-digit', 
          month: 'short' 
        }),
        acumulado: data.tendencias.slice(0, index + 1).reduce((sum, t) => sum + t.cantidad, 0)
      })) || [],
      acumulados: data?.tendencias?.map((item, index) => ({
        ...item,
        fecha: new Date(item.fecha).toLocaleDateString('es-PE', { 
          day: '2-digit', 
          month: 'short' 
        }),
        acumulado: data.tendencias.slice(0, index + 1).reduce((sum, t) => sum + t.cantidad, 0)
      })) || []
    };
  }, [data]);

  // Memoizar colores para gráficos - Colores completamente diferentes
  const chartColors = useMemo(() => [
    COLORS.chart.blue,      // Azul para MAÑANA
    COLORS.chart.amber,     // Ámbar para TARDE  
    COLORS.chart.purple,    // Púrpura para NOCHE
    COLORS.chart.green,     // Verde como adicional
    COLORS.chart.orange,    // Naranja como adicional
    COLORS.chart.red        // Rojo como adicional
  ], []);

  // Refs para capturar gráficos
  const barChartRef = useRef(null);
  const barDetailsRef = useRef(null);
  const pieChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const areaChartRef = useRef(null);

  // 🎯 Exportar gráfico como imagen
  // 🎯 Exportar gráfico como imagen
  const exportChartAsImage = useCallback(async (chartRef, chartName, title, subtitle, detailsRef = null) => {
    if (!chartRef.current) {
      console.error(`Referencia del gráfico ${chartName} no encontrada`);
      return;
    }

    try {
      const toastId = toast.loading(`Capturando gráfico ${chartName}...`);

      const SCALE    = 2;
      const HEADER_H = 70;  // px lógicos reservados para título + subtítulo
      const GAP      =  8;  // px lógicos entre gráfico y detalles
      const PAD      = 16;  // padding exterior horizontal del canvas final

      // ── 1. Capturar gráfico principal ──────────────────────────────────────
      // Buscar el wrapper real de Recharts (tiene el ancho exacto del SVG,
      // sin el espacio vacío que deja el div contenedor del grid).
      const rechartsWrapper = chartRef.current.querySelector('.recharts-wrapper') || chartRef.current;
      const chartCanvas = await html2canvas(rechartsWrapper, {
        backgroundColor: '#ffffff',
        scale: SCALE,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // ── 2. Capturar panel de detalles con ancho natural (no el del grid) ───
      let detailsCanvas = null;
      if (detailsRef && detailsRef.current) {
        const el = detailsRef.current;
        // Guardar estilos originales
        const prevWidth    = el.style.width;
        const prevMinWidth = el.style.minWidth;
        const prevMaxWidth = el.style.maxWidth;

        // Forzar ancho compacto: deja que el contenido dicte el ancho
        el.style.width    = 'fit-content';
        el.style.minWidth = '220px';
        el.style.maxWidth = '280px';

        detailsCanvas = await html2canvas(el, {
          backgroundColor: '#ffffff',
          scale: SCALE,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        // Restaurar estilos
        el.style.width    = prevWidth;
        el.style.minWidth = prevMinWidth;
        el.style.maxWidth = prevMaxWidth;
      }

      // ── 3. Componer canvas final side-by-side ──────────────────────────────
      const finalCanvas = document.createElement('canvas');

      const totalW = PAD * SCALE
        + chartCanvas.width
        + (detailsCanvas ? GAP * SCALE + detailsCanvas.width : 0)
        + PAD * SCALE;

      const contentH = detailsCanvas
        ? Math.max(chartCanvas.height, detailsCanvas.height)
        : chartCanvas.height;

      finalCanvas.width  = totalW;
      finalCanvas.height = contentH + HEADER_H * SCALE;

      const ctx = finalCanvas.getContext('2d');

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Título
      ctx.fillStyle = '#1e293b';
      ctx.font = `bold ${20 * SCALE}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, finalCanvas.width / 2, 26 * SCALE);

      // Subtítulo
      ctx.fillStyle = '#64748b';
      ctx.font = `${12 * SCALE}px Arial, sans-serif`;
      ctx.fillText(subtitle, finalCanvas.width / 2, 48 * SCALE);

      // Gráfico (con padding izquierdo)
      ctx.drawImage(chartCanvas, PAD * SCALE, HEADER_H * SCALE);

      // Panel de detalles centrado verticalmente a la derecha del gráfico
      if (detailsCanvas) {
        const detailsX = PAD * SCALE + chartCanvas.width + GAP * SCALE;
        const detailsY = HEADER_H * SCALE + Math.round((contentH - detailsCanvas.height) / 2);
        ctx.drawImage(detailsCanvas, detailsX, detailsY);
      }

      // ── 4. Descargar ───────────────────────────────────────────────────────
      finalCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `grafico-${chartName}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(`Gráfico ${chartName} exportado exitosamente`, { id: toastId });
        } else {
          toast.error('Error al generar la imagen del gráfico', { id: toastId });
        }
      }, 'image/png');

    } catch (error) {
      console.error(`Error exportando gráfico ${chartName}:`, error);
      toast.error(`Error al exportar gráfico ${chartName}`);
    }
  }, []);



  // Handlers para exportación
  const handleExportChart = useCallback((chartType) => {
    const chartRefs = {
      'turnos': barChartRef,
      'prioridad': pieChartRef,
      'tendencias': lineChartRef,
      'area': areaChartRef
    };

    const chartNames = {
      'turnos': () => {
        const fechaInicio = filters.fecha_inicio || new Date().toISOString().split('T')[0];
        const fechaFin = filters.fecha_fin || new Date().toISOString().split('T')[0];
        const fechaInicioFormateada = new Date(fechaInicio).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        const fechaFinFormateada = new Date(fechaFin).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
        return `analisis-por-turnos-del-${fechaInicioFormateada}-al-${fechaFinFormateada}`;
      },
      'prioridad': 'analisis-por-prioridad',
      'tendencias': 'tendencias-temporales',
      'area': 'tendencias-acumuladas'
    };

    const chartTitles = {
      'turnos': 'Análisis por Turnos',
      'prioridad': 'Análisis por Prioridad',
      'tendencias': 'Tendencias Temporales',
      'area': 'Tendencias Acumuladas'
    };

    const chartSubtitles = {
      'turnos': () => {
        const fechaInicio = filters.fecha_inicio || new Date().toISOString().split('T')[0];
        const fechaFin = filters.fecha_fin || new Date().toISOString().split('T')[0];
        const fechaInicioFormateada = new Date(fechaInicio).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const fechaFinFormateada = new Date(fechaFin).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `Distribución de novedades por turno operativo del ${fechaInicioFormateada} al ${fechaFinFormateada}`;
      },
      'prioridad': () => 'Distribución de novedades por nivel de prioridad',
      'tendencias': () => 'Evolución de novedades en el tiempo',
      'area': () => 'Acumulado de novedades en el tiempo'
    };

    const ref = chartRefs[chartType];
    const name = typeof chartNames[chartType] === 'function' ? chartNames[chartType]() : chartNames[chartType];
    const title = chartTitles[chartType];
    const subtitle = chartSubtitles[chartType];

    if (ref && name && title && typeof subtitle === 'function') {
      const detailsRef = chartType === 'turnos' ? barDetailsRef : null;
      exportChartAsImage(ref, name, title, subtitle(), detailsRef);
    } else {
      console.error(`Tipo de gráfico no soportado: ${chartType}`);
      toast.error('Tipo de gráfico no soportado para exportación');
    }
  }, [exportChartAsImage, filters]);

  // Handler para filtros
  const handleFilter = useCallback((chartType, filters) => {
    console.log(`Aplicando filtros a ${chartType}:`, filters);
    // Implementar lógica de filtros aquí
  }, []);

  return (
    <div className="space-y-6">
      {/* Análisis por Turnos - BarChart Profesional */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-600" />
              Análisis por Turnos
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Distribución de novedades por turno operativo
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExportChart('turnos')}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Exportar gráfico"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Barras */}
          <div className="lg:col-span-2" ref={barChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processedData.analisisTurnos}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="turno" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="cantidad" 
                  radius={[8, 8, 0, 0]}
                  animationDuration={1000}
                >
                  {processedData.analisisTurnos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Estadísticas Detalladas */}
          <div className="space-y-3" ref={barDetailsRef}>
            <h4 className="text-md font-medium text-slate-900 dark:text-slate-50">
              Detalle por Turno
            </h4>
            {processedData.analisisTurnos.map((turno, index) => (
              <div 
                key={turno.turno} 
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: chartColors[index % chartColors.length] }}
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {turno.turno}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {turno.cantidad}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {turno.porcentaje}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Análisis por Prioridad - PieChart Profesional */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary-600" />
              Análisis por Prioridad
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Distribución de novedades por nivel de prioridad
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilter('prioridades', filters)}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Aplicar filtros"
            >
              <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => handleExportChart('prioridades')}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Exportar gráfico"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico Circular */}
          <div className="lg:col-span-2" ref={pieChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={processedData.analisisPrioridad}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="cantidad"
                  animationDuration={1000}
                >
                  {processedData.analisisPrioridad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => (
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {entry.payload.prioridad} ({entry.payload.cantidad})
                    </span>
                  )}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Estadísticas Detalladas */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-slate-900 dark:text-slate-50">
              Detalle por Prioridad
            </h4>
            {processedData.analisisPrioridad.map((prioridad) => {
              const total = processedData.analisisPrioridad.reduce((sum, p) => sum + p.cantidad, 0);
              const percentage = total > 0 ? ((prioridad.cantidad / total) * 100).toFixed(1) : '0';
              
              return (
                <div 
                  key={prioridad.prioridad} 
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: prioridad.color }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {prioridad.prioridad}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">
                      {prioridad.cantidad}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tendencias Temporales - LineChart Profesional */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-primary-600" />
              Tendencias Temporales
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Evolución de novedades en el tiempo
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFilter('tendencias', filters)}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Aplicar filtros"
            >
              <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
            <button
              onClick={() => handleExportChart('tendencias')}
              className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              title="Exportar gráfico"
            >
              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Líneas */}
          <div className="lg:col-span-1" ref={lineChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <ReLineChart data={processedData.tendencias}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="cantidad" 
                  stroke={COLORS.primary[600]}
                  strokeWidth={3}
                  dot={{ fill: COLORS.primary[600], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={1000}
                />
                <ReferenceLine 
                  y={processedData.tendencias.reduce((sum, t) => sum + t.cantidad, 0) / processedData.tendencias.length} 
                  stroke={COLORS.chart.slate} 
                  strokeDasharray="5 5" 
                  label={{ value: "Promedio", position: "top" }}
                />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Gráfico de Área Acumulada */}
          <div className="lg:col-span-1" ref={areaChartRef}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={processedData.acumulados}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="fecha" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="acumulado" 
                  stroke={COLORS.primary[700]}
                  fill={COLORS.primary[500]}
                  fillOpacity={0.3}
                  strokeWidth={2}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Estadísticas de Tendencias */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Período</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {processedData.tendencias.reduce((sum, t) => sum + t.cantidad, 0)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">novedades</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Promedio Diario</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {processedData.tendencias.length > 0 ? 
                (processedData.tendencias.reduce((sum, t) => sum + t.cantidad, 0) / processedData.tendencias.length).toFixed(1) : 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">por día</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pico Máximo</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {processedData.tendencias.length > 0 ? 
                Math.max(...processedData.tendencias.map(t => t.cantidad)) : 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">novedades</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Tendencia</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {processedData.tendencias.length > 1 ? (
                processedData.tendencias[processedData.tendencias.length - 1].cantidad > processedData.tendencias[0].cantidad ? 
                <span className="text-green-600">↑</span> : 
                <span className="text-red-600">↓</span>
              ) : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">variación</p>
          </div>
        </div>
      </div>

      {/* Panel de Configuración y Exportación */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Configuración y Exportación
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Opciones de Gráficos */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Tipos de Gráficos</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Barras para comparaciones</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Líneas para tendencias</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Pastel para proporciones</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Áreas para acumulados</span>
              </label>
            </div>
          </div>
          
          {/* Interactividad */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Interactividad</h4>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Tooltips informativos</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Filtros dinámicos</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Drill-down en datos</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer">
                <input type="checkbox" defaultChecked className="text-primary-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Animaciones suaves</span>
              </label>
            </div>
          </div>
          
          {/* Exportación */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Exportación</h4>
            <div className="space-y-3">
              <button
                onClick={() => handleExportChart('all')}
                className="w-full p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Exportar Todos los Gráficos</span>
              </button>
              <button
                onClick={() => handleExportChart('pdf')}
                className="w-full p-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center gap-2 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="text-sm font-medium">Generar Reporte PDF</span>
              </button>
              <div className="text-xs text-slate-500 dark:text-slate-500 text-center">
                Formatos: PNG, SVG, PDF, Excel
              </div>
            </div>
          </div>
        </div>
        
        {/* Información de Librerías */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-sm font-medium text-slate-900 dark:text-slate-50 mb-1">Tecnología de Gráficos</h5>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Desarrollado con Recharts - Librería profesional de gráficos para React
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Activo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraficosOperativos;