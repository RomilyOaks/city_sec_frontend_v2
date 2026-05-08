---
name: citysecure-charts
description: >
  Especialista en creación, modificación, depuración y exportación de gráficos para
  CitySecure (sistema de seguridad ciudadana de Chorrillos, Lima). Usar SIEMPRE que
  el usuario mencione: gráficos, charts, Recharts, GraficosOperativos, análisis por
  turnos, análisis por prioridad, exportar imagen, html2canvas, dashboard de reportes,
  o cualquier visualización de datos operativos (novedades, operativos, vehículos,
  personal, turnos, sectores). También usar cuando se pidan nuevos gráficos, se
  reporten bugs visuales en la exportación, o se quiera mejorar la estética de una
  vista estadística existente.
---

# CitySecure — Especialista en Gráficos Operativos

## Stack del proyecto

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite |
| Gráficos | **Recharts** (BarChart, PieChart, LineChart, AreaChart) |
| Estilos | Tailwind CSS + dark mode (`dark:` prefix) |
| Estado | Zustand |
| Exportación | **html2canvas** → Canvas 2D API |
| Backend data | Node.js/Express/Sequelize/MySQL en Railway |
| Contexto | Distrito de Chorrillos, Lima, Perú |

---

## Arquitectura de GraficosOperativos.jsx

```
GraficosOperativos
├── Refs (useRef)
│   ├── barChartRef      → div lg:col-span-2 del BarChart de turnos
│   ├── barDetailsRef    → div space-y-3 del panel "Detalle por Turno"
│   ├── pieChartRef      → div lg:col-span-2 del PieChart de prioridad
│   ├── lineChartRef     → LineChart de tendencia diaria
│   └── areaChartRef     → AreaChart de acumulado
├── exportChartAsImage() → captura y combina canvas
├── handleExportChart()  → router por chartType
└── processedData        → datos derivados del hook de filtros
```

### Gráficos existentes

| chartType | Componente | Datos fuente |
|---|---|---|
| `turnos` | BarChart | `processedData.analisisTurnos` |
| `prioridad` | PieChart | `processedData.analisisPrioridad` |
| `tendencia` | LineChart | `processedData.tendenciaDiaria` |
| `acumulado` | AreaChart | `processedData.novedadesAcumuladas` |

### Paleta de colores (`chartColors`)
```js
[
  COLORS.chart.blue,    // MAÑANA
  COLORS.chart.amber,   // TARDE
  COLORS.chart.purple,  // NOCHE
  COLORS.chart.green,
  COLORS.chart.orange,
  COLORS.chart.red,
]
```

---

## Patrón de exportación (exportChartAsImage)

La función recibe `(chartRef, chartName, title, subtitle, detailsRef?)` y sigue este flujo:

```
1. html2canvas(rechartsWrapper)     ← querySelector('.recharts-wrapper') || chartRef.current
2. html2canvas(detailsRef) *        ← con width:fit-content / min 220px / max 280px
3. Canvas 2D: título + subtítulo    ← dibujados a mano (no clonar DOM)
4. Canvas 2D: chart + details       ← side-by-side con GAP=8px, PAD=16px
5. finalCanvas.toBlob → descarga
```
*Solo para `chartType === 'turnos'`. Los demás gráficos no tienen panel lateral.

### Constantes de layout (ajustar si cambia el diseño)
```js
const SCALE    = 2;    // resolución 2x
const HEADER_H = 70;   // px lógicos reservados para título + subtítulo
const GAP      = 8;    // px entre gráfico y panel de detalles
const PAD      = 16;   // padding exterior horizontal
```

### Regla crítica: NO clonar nodos Recharts
`cloneNode(true)` **no funciona** con los SVGs dinámicos de Recharts — el SVG clonado queda sin dimensiones. Siempre capturar el nodo **vivo** del DOM con `html2canvas`.

### Regla crítica: nombre del archivo
El `chartName` ya incluye el rango de fechas del filtro:
```
"analisis-por-turnos-del-06-04-2026-al-06-05-2026"
```
El `link.download` debe ser simplemente:
```js
link.download = `grafico-${chartName}.png`;
// ❌ NO agregar new Date() al final — duplica las fechas
```

---

## Cómo agregar un nuevo gráfico

### 1. Agregar ref
```js
const nuevoChartRef = useRef(null);
```

### 2. Registrar en handleExportChart
```js
// chartRefs
'nuevo': nuevoChartRef,
// chartNames
'nuevo': () => `nombre-del-grafico-del-${...}-al-${...}`,
// chartTitles
'nuevo': 'Título Visible',
// chartSubtitles
'nuevo': () => `Descripción del período del ${...} al ${...}`,
```

### 3. Colocar ref en JSX
```jsx
<div className="lg:col-span-2" ref={nuevoChartRef}>
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={processedData.nuevosDatos}>
      ...
    </BarChart>
  </ResponsiveContainer>
</div>
```

### 4. Botón de exportación
```jsx
<button onClick={() => handleExportChart('nuevo')} title="Exportar gráfico">
  <ArrowDownTrayIcon className="h-5 w-5" />
</button>
```

---

## Cómo agregar un panel de detalles lateral (tipo "Detalle por Turno")

Solo el gráfico de turnos tiene panel lateral. Si se agrega otro con panel:

1. Crear `nuevoDetailsRef = useRef(null)` y asignarlo al div del panel.
2. En `handleExportChart`:
```js
const detailsRef = chartType === 'turnos' ? barDetailsRef
                 : chartType === 'nuevo'  ? nuevoDetailsRef
                 : null;
```
3. El panel se captura con ancho compacto (ver patrón de exportación arriba).

---

## Estructura JSX del card de gráfico

```jsx
{/* Card contenedor */}
<div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
  
  {/* Header */}
  <div className="flex items-center justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
        <IconComponent className="h-5 w-5 text-indigo-500" />
        Título del Gráfico
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Descripción corta</p>
    </div>
    <button onClick={() => handleExportChart('chartType')} title="Exportar">
      <ArrowDownTrayIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
    </button>
  </div>

  {/* Grid gráfico + detalles */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2" ref={chartRef}>
      <ResponsiveContainer width="100%" height={300}>
        {/* Recharts component */}
      </ResponsiveContainer>
    </div>
    <div className="space-y-3" ref={detailsRef}>
      {/* Panel de detalles opcional */}
    </div>
  </div>

</div>
```

---

## Patrones de datos (processedData)

Los datos vienen de un hook central de filtros. Estructura típica de cada turno:
```js
{ turno: 'MAÑANA', cantidad: 6, porcentaje: '28.57' }
```
Para prioridad:
```js
{ prioridad: 'ALTA', cantidad: 5, porcentaje: '23.81', color: '#ef4444' }
```

---

## Checklist al depurar exportación

- [ ] ¿El ref apunta al nodo correcto? (usar `.recharts-wrapper` para el gráfico, div `space-y-3` para detalles)
- [ ] ¿Se está usando `html2canvas` sobre el nodo vivo? (no `cloneNode`)
- [ ] ¿El panel de detalles tiene `width: fit-content` antes de capturar?
- [ ] ¿El `link.download` usa solo `chartName` sin agregar fecha adicional?
- [ ] ¿El `detailsRef` se pasa solo para `chartType === 'turnos'`?
- [ ] ¿El `GAP` y `PAD` son visualmente proporcionales al dashboard?

---

## Referencia de archivos relevantes del proyecto

| Archivo | Rol |
|---|---|
| `GraficosOperativos.jsx` | Componente principal de gráficos |
| `ReportesOperativosDashboardPage.jsx` | Página que monta GraficosOperativos |
| `useReportesOperativos.js` (estimado) | Hook de datos y filtros |

Ver `references/recharts-patterns.md` para ejemplos avanzados de CustomTooltip, CustomLegend y ResponsiveContainer.