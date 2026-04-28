/**
 * 📊 Dashboard Principal - Reportes Operativos v2.0
 * 
 * Dashboard centralizado con KPIs principales y análisis completo
 * Basado en nueva API backend con 15 endpoints especializados
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Car, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Activity,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import reportesOperativosNewService from '../../services/reportesOperativosNewService';
import { useAuthStore } from '../../store/useAuthStore';

// Componentes
import KPIsDashboard from './components/KPIsDashboard';
import FiltrosReportes from './components/FiltrosReportes';
import GraficosOperativos from './components/GraficosOperativos';

const ReportesOperativosDashboardPage = () => {
  const navigate = useNavigate();
  const { canRead } = useAuthStore();
  
  // 🐛 DEBUGGING: Verificar canRead con el routeKey correcto
  const hasReadAccess = canRead("operativos_turnos");
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    turno: '',
    sector_id: '',
    prioridad: ''
  });
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

  /**
   * 🔄 Cargar datos del dashboard
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir parámetros para API
      const params = reportesOperativosNewService.buildParams(filters);
      
      // Obtener datos del dashboard
      const response = await reportesOperativosNewService.getDashboardOperativos(params);
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error(response.message || 'Error al cargar dashboard');
      }
    } catch (err) {
      console.error('❌ Error cargando dashboard:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  /**
   * 🔄 Refrescar datos manualmente
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * 📤 Exportar reporte completo
   */
  const handleExport = useCallback(async (formato = 'excel') => {
    try {
      toast.loading(`Preparando exportación ${formato.toUpperCase()}...`);
      
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        limit: 10000, // Exportar sin límite de paginación
        formato
      });
      
      const response = await reportesOperativosNewService.getReportesCombinados(params);
      
      if (response.success) {
        // TODO: Implementar descarga real del archivo
        console.log('📤 Datos para exportación:', response.data);
        toast.success(`Reporte ${formato.toUpperCase()} preparado para descarga`);
      }
    } catch (err) {
      console.error('❌ Error exportando:', err);
      toast.error('Error al exportar reporte');
    }
  }, [filters]);

  /**
   * 🔍 Aplicar filtros
   */
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setActiveQuickFilter(''); // Limpiar filtro rápido activo
  }, []);

  /**
   * 🔄 Resetear filtros
   */
  const handleResetFilters = useCallback(() => {
    const defaultFilters = {
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin: new Date().toISOString().split('T')[0],
      turno: '',
      sector_id: '',
      prioridad: ''
    };
    setFilters(defaultFilters);
    setActiveQuickFilter(''); // Limpiar filtro rápido activo
  }, []);

  /**
   * ⚡ Filtros rápidos
   */
  const handleQuickFilter = useCallback((days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const newFilters = {
      ...filters,
      fecha_inicio: startDate.toISOString().split('T')[0],
      fecha_fin: endDate.toISOString().split('T')[0]
    };
    
    setFilters(newFilters);
    setActiveQuickFilter(days);
  }, [filters]);

  /**
   * 🎯 Navegación a páginas específicas
   */
  const navigateToSection = useCallback((section) => {
    navigate(`/reportes-operativos/${section}`, { state: { filters } });
  }, [navigate, filters]);

  // Cargar datos al montar y cuando cambian los filtros
  useEffect(() => {
    if (hasReadAccess) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, hasReadAccess]);

  // Sin permisos
  if (!hasReadAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes permisos para ver los reportes operativos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/operativos')}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ← Volver
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  📊 Dashboard Reportes Operativos
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Análisis completo de operativos y novedades
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border ${
                  showFilters 
                    ? 'bg-primary-100 border-primary-300 text-primary-700 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-300'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Filter className="w-4 h-4" />
              </button>
              
              {/* Botones de filtro rápido */}
              <div className="flex gap-1">
                <button
                  onClick={() => handleQuickFilter(7)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeQuickFilter === 7 
                      ? 'bg-primary-600 text-white border-primary-700 shadow-lg transform scale-105'
                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Últimos 7 días
                </button>
                <button
                  onClick={() => handleQuickFilter(30)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeQuickFilter === 30 
                      ? 'bg-primary-600 text-white border-primary-700 shadow-lg transform scale-105'
                      : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  Últimos 30 días
                </button>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleExport('excel')}
                  className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <FiltrosReportes
              filters={filters}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              loading={loading}
            />
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-red-800 dark:text-red-300 font-medium">Error</h3>
                <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="ml-auto px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Activity className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">Cargando dashboard...</p>
            </div>
          </div>
        ) : dashboardData ? (
          <div className="space-y-6">
            {/* KPIs Principales */}
            <KPIsDashboard 
              data={dashboardData.kpis_principales} 
              loading={loading}
            />

            {/* Navegación Rápida */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => navigateToSection('vehiculares')}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      Operativos Vehiculares
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dashboardData.kpis_principales?.distribucion_tipo?.vehiculares?.cantidad || 0} operativos
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigateToSection('pie')}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      Operativos a Pie
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dashboardData.kpis_principales?.distribucion_tipo?.pie?.cantidad || 0} operativos
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => navigateToSection('no-atendidas')}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                      Novedades No Atendidas
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dashboardData.kpis_principales?.distribucion_tipo?.no_atendidas?.cantidad || 0} novedades
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Gráficos y Análisis */}
            <GraficosOperativos 
              data={dashboardData}
              loading={loading}
              onExport={handleExport}
            />

            {/* Métricas de Rendimiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  📈 Métricas de Rendimiento
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-slate-700 dark:text-slate-300">Tiempo Promedio Respuesta</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {dashboardData.metricas_rendimiento?.tiempo_promedio_respuesta || 0} min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300">Eficiencia Operativa</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                      {dashboardData.metricas_rendimiento?.eficiencia_operativa || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  📊 Estado General
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-slate-700 dark:text-slate-300">Tasa Atención General</span>
                    </div>
                    <span className="font-semibold text-green-600">
                      {dashboardData.kpis_principales?.tasa_atencion_general || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-slate-700 dark:text-slate-300">Novedades Pendientes</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {dashboardData.kpis_principales?.novedades_no_atendidas || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-600 dark:text-slate-400">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles para el período seleccionado.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesOperativosDashboardPage;
