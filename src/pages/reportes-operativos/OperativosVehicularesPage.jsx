/**
 * 🚗 Operativos Vehiculares - Reportes Operativos v2.0
 * 
 * Listado completo de operativos vehiculares con 62 campos
 * Filtros avanzados, paginación y exportación
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Car, 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import reportesOperativosNewService from '../../services/reportesOperativosNewService';
import { useReportesPermissions } from '../../hooks/useReportesPermissions';

// Componentes
import FiltrosReportes from './components/FiltrosReportes';
import TablaOperativos from './components/TablaOperativos';

const OperativosVehicularesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useReportesPermissions();
  
  // 🎯 Nuevos permisos específicos para operativos vehiculares
  const canReadVehiculares = permissions.vehiculares.read;
  const canExportVehiculares = permissions.vehiculares.export;
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [operativosVehiculares, setOperativosVehiculares] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState(null);
  
  // Estados de paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalPages: 0,
    total: 0
  });
  
  // Estados de filtros
  const [filters, setFilters] = useState({
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: new Date().toISOString().split('T')[0],
    turno: '',
    sector_id: '',
    prioridad: '',
    vehiculo_id: '',
    conductor_id: '',
    search: '',
    sort: 'fecha_hora_ocurrencia',
    order: 'DESC'
  });
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOperativo, setSelectedOperativo] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

  // Cargar filtros desde navegación
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(location.state.filters);
    }
  }, [location.state]);

  /**
   * 🚗 Cargar operativos vehiculares
   */
  const fetchOperativosVehiculares = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
            
      // Construir parámetros para API
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        page,
        limit: pagination.limit
      });
      
            
      // Obtener datos y resumen en paralelo
      const [operativosResponse, resumenResponse] = await Promise.all([
        reportesOperativosNewService.getOperativosVehiculares(params),
        reportesOperativosNewService.getResumenVehicular(params)
      ]);
      
      if (operativosResponse.success) {
        setOperativosVehiculares(operativosResponse.data || []);
        setPagination(operativosResponse.pagination || pagination);
      }
      
      if (resumenResponse.success) {
        setResumen(resumenResponse.data);
      }
    } catch (err) {
      console.error('❌ Error cargando operativos vehiculares:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, pagination.limit]);

  /**
   * 🔄 Refrescar datos
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOperativosVehiculares(pagination.page);
  }, [fetchOperativosVehiculares, pagination.page]);

  /**
   * 📤 Exportar datos
   */
  const handleExport = useCallback(async (formato = 'excel') => {
    // Validar permisos de exportación
    if (!canExportVehiculares) {
      toast.error('No tienes permisos para exportar operativos vehiculares');
      return;
    }

    try {
      toast.loading(`Preparando exportación ${formato.toUpperCase()}...`);
      
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        limit: 1000, // Exportar sin límite (máximo permitido)
        formato
      });
      
      const response = await reportesOperativosNewService.exportarOperativosVehiculares(params);
      
      if (response.success) {
        try {
          // Descargar archivo Excel
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reportes-operativos-vehiculares-${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}.xlsx`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success(`Reporte ${formato.toUpperCase()} descargado exitosamente`);
          toast.dismiss(); // Limpiar toasts
        } catch (downloadError) {
          console.error('❌ Error descargando archivo:', downloadError);
          toast.error('Error al descargar el archivo');
          toast.dismiss();
        }
      }
    } catch (err) {
      console.error('❌ Error exportando:', err);
      toast.error('Error al exportar reporte');
    }
  }, [canExportVehiculares, filters]);

  /**
   * 🔍 Aplicar filtros
   */
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setActiveQuickFilter('');
    setPagination(prev => ({ ...prev, page: 1 })); // Resetear a primera página
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
      prioridad: '',
      vehiculo_id: '',
      conductor_id: '',
      search: '',
      sort: 'fecha_hora_ocurrencia',
      order: 'DESC'
    };
    setFilters(defaultFilters);
    setActiveQuickFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
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
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  /**
   * 📄 Cambiar de página
   */
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchOperativosVehiculares(newPage);
  }, [fetchOperativosVehiculares]);

  /**
   * 🔄 Ordenar por columna
   */
  const handleSort = useCallback((column) => {
    const newOrder = filters.sort === column && filters.order === 'ASC' ? 'DESC' : 'ASC';
    const newFilters = { ...filters, sort: column, order: newOrder };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters]);

  /**
   * 👁️ Ver detalles de operativo
   */
  const handleViewDetails = useCallback((operativo) => {
    setSelectedOperativo(operativo);
    setShowDetailModal(true);
  }, []);

  /**
   * 📊 Columnas para la tabla
   */
  const columns = useMemo(() => [
    {
      key: 'novedad_code',
      label: 'Código',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {row.novedad_code}
        </span>
      )
    },
    {
      key: 'fecha_hora_ocurrencia',
      label: 'Fecha y Hora',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div>
          <div className="text-xs text-slate-900 dark:text-slate-50">
            {reportesOperativosNewService.formatDate(row.fecha_hora_ocurrencia)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {new Date(row.fecha_hora_ocurrencia).toLocaleTimeString('es-PE', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      )
    },
    {
      key: 'tipo_novedad',
      label: 'Tipo Novedad',
      sortable: false,
      width: '140px',
      render: (row) => {
        const colorClass = reportesOperativosNewService.getPriorityColor(row.prioridad_actual);
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${colorClass.bg} ${colorClass.text}`}>
            {row.tipo_novedad}
          </span>
        );
      }
    },
    {
      key: 'placa_vehiculo',
      label: 'Vehículo',
      sortable: true,
      width: '140px',
      render: (row) => (
        <div>
          <div className="font-medium text-sm">{row.placa_vehiculo}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {row.marca_vehiculo} {row.modelo_vehiculo}
          </div>
        </div>
      )
    },
    {
      key: 'conductor_nombre',
      label: 'Conductor',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div>
          <div className="font-medium text-sm">{row.conductor_nombre}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {row.doc_tipo} {row.doc_numero}
          </div>
        </div>
      )
    },
    {
      key: 'turno_nombre',
      label: 'Turno',
      sortable: true,
      width: '100px',
      render: (row) => (
        <span className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          {row.turno_nombre}
        </span>
      )
    },
    {
      key: 'sector_nombre',
      label: 'Sector',
      sortable: true,
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400" />
          <span className="text-sm">{row.sector_nombre}</span>
        </div>
      )
    },
    {
      key: 'tiempo_respuesta_min',
      label: 'Tiempo Resp.',
      sortable: true,
      width: '100px',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-sm">
            {row.tiempo_respuesta_min || '-'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">min</div>
        </div>
      )
    },
    {
      key: 'estado_operativo',
      label: 'Estado',
      sortable: true,
      width: '120px',
      render: (row) => {
        const isActive = row.estado_operativo === 'EN_SERVICIO' || row.estado_operativo === 'COMPLETADO';
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            isActive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
          }`}>
            {row.estado_operativo}
          </span>
        );
      }
    },
    {
      key: 'acciones',
      label: 'Acciones',
      sortable: false,
      width: '80px',
      render: (row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ], [handleViewDetails]);

  // Cargar datos al montar y cuando cambian los filtros o paginación
  useEffect(() => {
    if (canReadVehiculares) {
      fetchOperativosVehiculares();
    }
  }, [fetchOperativosVehiculares, pagination.page, canReadVehiculares]);

  // Sin permisos
  if (!canReadVehiculares) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes permisos para ver los operativos vehiculares.
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
                onClick={() => navigate('/reportes-operativos')}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                ← Volver
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  🚗 Operativos Vehiculares
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Listado completo de operativos con vehículos asignados
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
                <SlidersHorizontal className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              {canExportVehiculares && (
                <button
                  onClick={() => handleExport('excel')}
                  className="px-3 py-2 bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Excel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen Estadístico */}
      {resumen && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {resumen.total_novedades || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Total Novedades</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {resumen.vehiculos_activos || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Vehículos Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {resumen.conductores_disponibles || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Conductores Disponibles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {resumen.tiempo_promedio_respuesta || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Tiempo Prom. (min)</div>
              </div>
            </div>
          </div>
        </div>
      )}

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

        <TablaOperativos
          data={operativosVehiculares}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          currentSort={filters.sort}
          currentOrder={filters.order}
        />
      </div>

      {/* Modal de Detalles - TODO */}
      {showDetailModal && selectedOperativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Detalles del Operativo Vehicular
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TODO: Implementar vista detallada */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">Información General</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Código:</strong> {selectedOperativo.novedad_code}</div>
                  <div><strong>Fecha:</strong> {reportesOperativosNewService.formatDate(selectedOperativo.fecha_hora_ocurrencia, true)}</div>
                  <div><strong>Tipo:</strong> {selectedOperativo.tipo_novedad}</div>
                  <div><strong>Prioridad:</strong> {selectedOperativo.prioridad_actual}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">Información Vehicular</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Placa:</strong> {selectedOperativo.placa_vehiculo}</div>
                  <div><strong>Marca:</strong> {selectedOperativo.marca_vehiculo}</div>
                  <div><strong>Modelo:</strong> {selectedOperativo.modelo_vehiculo}</div>
                  <div><strong>Año:</strong> {selectedOperativo.anio_vehiculo}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperativosVehicularesPage;
