# Recharts — Patrones avanzados para CitySecure

## CustomTooltip

```jsx
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm" style={{ color: entry.color }}>
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
};
```

## CustomLabel en BarChart

```jsx
const CustomBarLabel = ({ x, y, width, value }) => (
  <text x={x + width / 2} y={y - 4} textAnchor="middle"
    className="fill-slate-600 dark:fill-slate-400" fontSize={12}>
    {value}
  </text>
);

// Uso:
<Bar dataKey="cantidad" fill={...}>
  <LabelList content={<CustomBarLabel />} />
</Bar>
```

## ResponsiveContainer — altura recomendada

| Tipo de gráfico | height |
|---|---|
| BarChart simple | 280–320 |
| PieChart | 260–300 |
| LineChart / AreaChart | 240–280 |

## Colores consistentes con dark mode

Recharts no lee variables CSS en SVG fill. Usar siempre valores hex directos
desde el objeto `COLORS` del proyecto, nunca clases Tailwind en `fill`.

```js
// ✅ Correcto
<Bar dataKey="cantidad" fill={COLORS.chart.blue} />

// ❌ Incorrecto — no funciona en SVG
<Bar dataKey="cantidad" className="fill-blue-500" />
```

## CartesianGrid recomendado

```jsx
<CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
// Dark mode: usar opacity en lugar de color condicional
```

## XAxis / YAxis estilo CitySecure

```jsx
<XAxis
  dataKey="turno"
  tick={{ fontSize: 11, fill: '#64748b' }}
  axisLine={false}
  tickLine={false}
/>
<YAxis
  tick={{ fontSize: 11, fill: '#64748b' }}
  axisLine={false}
  tickLine={false}
  allowDecimals={false}
/>
```

## PieChart con label personalizado

```jsx
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return percent > 0.05 ? (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null;
};

<Pie data={data} dataKey="cantidad" labelLine={false} label={renderCustomLabel}>
  {data.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
</Pie>
```

## Panel "Detalle por X" — estructura JSX estándar

```jsx
<div className="space-y-3" ref={detailsRef}>
  <h4 className="text-md font-medium text-slate-900 dark:text-slate-50">
    Detalle por Turno
  </h4>
  {items.map((item, i) => (
    <div key={item.nombre}
      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors[i] }} />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {item.nombre}
        </span>
      </div>
      <div className="text-right">
        <div className="text-sm font-bold text-slate-900 dark:text-slate-50">{item.cantidad}</div>
        <div className="text-xs text-slate-500">{item.porcentaje}%</div>
      </div>
    </div>
  ))}
</div>
```