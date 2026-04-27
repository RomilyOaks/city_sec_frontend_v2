/**
 * 📊 Componente KPIs Dashboard - Reportes Operativos v2.0
 * 
 * Muestra los KPIs principales del dashboard con diseño moderno
 * y responsive
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Car, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Shield
} from 'lucide-react';

const KPIsDashboard = ({ data, loading }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      id: 'total-novedades',
      title: 'Total Novedades',
      value: data.total_novedades || 0,
      icon: Activity,
      color: 'blue',
      description: 'Total de incidentes reportados',
      trend: null
    },
    {
      id: 'tasa-atencion',
      title: 'Tasa Atención',
      value: `${data.tasa_atencion_general || 0}%`,
      icon: Target,
      color: 'green',
      description: 'Porcentaje de novedades atendidas',
      trend: 'up'
    },
    {
      id: 'novedades-atendidas',
      title: 'Atendidas',
      value: data.novedades_atendidas || 0,
      icon: CheckCircle,
      color: 'emerald',
      description: 'Novedades con operativo asignado',
      trend: 'up'
    },
    {
      id: 'novedades-no-atendidas',
      title: 'No Atendidas',
      value: data.novedades_no_atendidas || 0,
      icon: XCircle,
      color: 'red',
      description: 'Novedades pendientes de atención',
      trend: 'down'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-900 dark:text-blue-100',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-900 dark:text-green-100',
        border: 'border-green-200 dark:border-green-800'
      },
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        icon: 'text-emerald-600 dark:text-emerald-400',
        text: 'text-emerald-900 dark:text-emerald-100',
        border: 'border-emerald-200 dark:border-emerald-800'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-900 dark:text-red-100',
        border: 'border-red-200 dark:border-red-800'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        icon: 'text-amber-600 dark:text-amber-400',
        text: 'text-amber-900 dark:text-amber-100',
        border: 'border-amber-200 dark:border-amber-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-900 dark:text-purple-100',
        border: 'border-purple-200 dark:border-purple-800'
      }
    };
    return colors[color] || colors.blue;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'down') {
      return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const colorClasses = getColorClasses(kpi.color);
          const Icon = kpi.icon;
          
          return (
            <div
              key={kpi.id}
              className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 ${loading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`inline-flex p-2 rounded-lg ${colorClasses.bg} mb-3`}>
                    <Icon className={`w-5 h-5 ${colorClasses.icon}`} />
                  </div>
                  
                  <h3 className={`text-sm font-medium ${colorClasses.text} mb-1`}>
                    {kpi.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-2xl font-bold ${colorClasses.text}`}>
                      {kpi.value}
                    </p>
                    {kpi.trend && (
                      <div className="flex items-center">
                        {getTrendIcon(kpi.trend)}
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {kpi.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Distribución por Tipo */}
      {data.distribucion_tipo && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
            📊 Distribución por Tipo Operativo
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(data.distribucion_tipo).map(([tipo, info]) => {
              let icon, color;
              
              switch (tipo) {
                case 'vehiculares':
                  icon = Car;
                  color = 'blue';
                  break;
                case 'pie':
                  icon = Users;
                  color = 'green';
                  break;
                case 'no_atendidas':
                  icon = AlertTriangle;
                  color = 'red';
                  break;
                default:
                  icon = Activity;
                  color = 'purple';
              }
              
              const colorClasses = getColorClasses(color);
              const Icon = icon;
              
              return (
                <div key={tipo} className="text-center">
                  <div className={`inline-flex p-3 rounded-full ${colorClasses.bg} mb-3`}>
                    <Icon className={`w-6 h-6 ${colorClasses.icon}`} />
                  </div>
                  
                  <h4 className={`font-semibold ${colorClasses.text} mb-1`}>
                    {tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ')}
                  </h4>
                  
                  <p className={`text-2xl font-bold ${colorClasses.text} mb-1`}>
                    {info.cantidad || 0}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-full max-w-[100px] bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${info.porcentaje || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 min-w-[45px] text-right">
                      {info.porcentaje || 0}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Métricas Adicionales */}
      {data.metricas_rendimiento && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Tiempo Promedio Respuesta
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Tiempo de llegada al incidente
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                {data.metricas_rendimiento.tiempo_promedio_respuesta || 0}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                minutos
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  Eficiencia Operativa
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Rendimiento general del sistema
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {data.metricas_rendimiento.eficiencia_operativa || 0}%
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                eficiencia
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIsDashboard;
