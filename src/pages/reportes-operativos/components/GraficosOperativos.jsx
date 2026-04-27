/**
 * 📈 Componente Gráficos Operativos - Reportes Operativos v2.0
 * 
 * Componente placeholder para gráficos interactivos
 * Se implementará con librería de gráficos (Chart.js/Recharts)
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  TrendingUp,
  Download,
  Settings
} from 'lucide-react';

const GraficosOperativos = ({ data, onExport }) => {
  // Placeholder para gráficos - se implementará en Fase 2
  return (
    <div className="space-y-6">
      {/* Análisis por Turnos */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              📊 Análisis por Turnos
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Distribución de novedades por turno operativo
            </p>
          </div>
          
          <button
            onClick={() => onExport('turnos')}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Barras - Placeholder */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                Gráfico de Barras
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                Análisis de novedades por turno
              </p>
              <div className="flex justify-center gap-4 text-sm">
                {data?.analisis_turnos?.map((turno) => (
                  <div key={turno.turno} className="text-center">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <p className="text-slate-600 dark:text-slate-400">{turno.turno}</p>
                    <p className="font-semibold">{turno.cantidad}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Datos Tabla - Placeholder */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-slate-900 dark:text-slate-50">
              Detalle por Turno
            </h4>
            {data?.analisis_turnos?.map((turno) => (
              <div key={turno.turno} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-slate-700 dark:text-slate-300">{turno.turno}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{turno.cantidad}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {turno.porcentaje || '0'}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Análisis por Prioridad */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              🎯 Análisis por Prioridad
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Distribución de novedades por nivel de prioridad
            </p>
          </div>
          
          <button
            onClick={() => onExport('prioridades')}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pastel - Placeholder */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
            <div className="text-center">
              <PieChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
                Gráfico Circular
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-500 mb-4">
                Distribución por prioridad
              </p>
              <div className="flex justify-center gap-2">
                <div className="w-8 h-8 bg-green-500 rounded-full"></div>
                <div className="w-8 h-8 bg-amber-500 rounded-full"></div>
                <div className="w-8 h-8 bg-orange-500 rounded-full"></div>
                <div className="w-8 h-8 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Datos Tabla - Placeholder */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-slate-900 dark:text-slate-50">
              Detalle por Prioridad
            </h4>
            {data?.analisis_prioridad?.map((prioridad) => {
              let colorClass = 'bg-green-500';
              if (prioridad.prioridad === 'MEDIA') colorClass = 'bg-amber-500';
              if (prioridad.prioridad === 'ALTA') colorClass = 'bg-orange-500';
              if (prioridad.prioridad === 'CRÍTICA') colorClass = 'bg-red-500';
              
              return (
                <div key={prioridad.prioridad} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                    <span className="text-slate-700 dark:text-slate-300">{prioridad.prioridad}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-slate-50">{prioridad.cantidad}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {((prioridad.cantidad / (data?.analisis_prioridad?.reduce((sum, p) => sum + p.cantidad, 0) || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tendencias Temporales */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              📈 Tendencias Temporales
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Evolución de novedades en el tiempo
            </p>
          </div>
          
          <button
            onClick={() => onExport('tendencias')}
            className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
          <div className="text-center">
            <LineChart className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
              Gráfico de Líneas
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
              Tendencia de novedades por fecha
            </p>
            
            {/* Placeholder de línea de tiempo */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                {data?.tendencias?.slice(0, 5).map((trend) => (
                  <div key={trend.fecha} className="text-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mb-2"></div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{trend.fecha.split('-')[2]}</p>
                    <p className="text-sm font-semibold">{trend.cantidad}</p>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-slate-300 dark:bg-slate-600 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de Gráficos - Placeholder */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Configuración de Gráficos
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Tipos de Gráficos</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Barras para comparaciones</li>
              <li>• Líneas para tendencias</li>
              <li>• Pastel para proporciones</li>
              <li>• Áreas para acumulados</li>
            </ul>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Interactividad</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Filtros dinámicos</li>
              <li>• Tooltips informativos</li>
              <li>• Drill-down en datos</li>
              <li>• Exportación de gráficos</li>
            </ul>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-slate-50 mb-2">Librerías</h4>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <li>• Chart.js (recomendado)</li>
              <li>• Recharts (React)</li>
              <li>• D3.js (avanzado)</li>
              <li>• ApexCharts (moderno)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraficosOperativos;
