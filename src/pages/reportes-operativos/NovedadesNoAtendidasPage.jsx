/**
 * ⚠️ Novedades No Atendidas - Reportes Operativos v2.0
 * 
 * Análisis de novedades sin atención y recursos faltantes
 * Información completa de reportantes, ubicación y atención requerida
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertTriangle, 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  XCircle,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  AlertCircle,
  Users,
  Car,
  Map,
  Clock3,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import reportesOperativosNewService from '../../services/reportesOperativosNewService';
import { useReportesPermissions } from '../../hooks/useReportesPermissions';

// Componentes
import FiltrosReportes from './components/FiltrosReportes';
import TablaOperativos from './components/TablaOperativos';
import NovedadDetalleModal from '../../components/NovedadDetalleModal';
import OrigenLlamadaCell from '../../components/novedades/OrigenLlamadaCell';

const NovedadesNoAtendidasPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useReportesPermissions();
  
  // 🎯 Nuevos permisos específicos para novedades no atendidas
  const canReadNoAtendidas = permissions.noAtendidas.read;
  const canExportNoAtendidas = permissions.noAtendidas.export;
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [novedadesNoAtendidas, setNovedadesNoAtendidas] = useState([]);
    const [estadisticasPrioridades, setEstadisticasPrioridades] = useState(null);
  const [error, setError] = useState(null);
  
  // Estado para modal de detalle
  const [selectedNovedadId, setSelectedNovedadId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
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
    cuadrante_id: '',
    estado_novedad_id: '',
    origen_llamada: '',
    generico: '', // Cambiado de 'search' a 'generico' según documentación backend
    sort: 'fecha_hora_ocurrencia',
    order: 'DESC'
  });
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');
    const [refreshing, setRefreshing] = useState(false);

  // Cargar filtros desde navegación
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(location.state.filters);
    }
  }, [location.state]);

  /**
   * ⚠️ Cargar novedades no atendidas
   */
  const fetchNovedadesNoAtendidas = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
            
      // Construir parámetros para API
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        page,
        limit: pagination.limit
      });
      
      // Obtener datos de novedades
      const novedadesResponse = await reportesOperativosNewService.getNovedadesNoAtendidas(params);
      
      if (novedadesResponse.success) {
        setNovedadesNoAtendidas(novedadesResponse.data || []);
        setPagination(novedadesResponse.pagination || pagination);
        
        // Extraer estadísticas de prioridades si vienen en la respuesta
        if (novedadesResponse.estadisticas_prioridades) {
          setEstadisticasPrioridades(novedadesResponse.estadisticas_prioridades);
        }
              }
    } catch (err) {
      console.error('❌ Error cargando novedades no atendidas:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  /**
   * 🔄 Refrescar datos
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNovedadesNoAtendidas(pagination.page);
  }, [fetchNovedadesNoAtendidas, pagination.page]);

  /**
   * 📤 Exportar datos
   */
  const handleExport = useCallback(async (formato = 'excel') => {
    // Validar permisos de exportación
    if (!canExportNoAtendidas) {
      toast.error('No tienes permisos para exportar novedades no atendidas');
      return;
    }

    try {
      toast.loading(`Preparando exportación ${formato.toUpperCase()}...`);
      
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        limit: 1000, // Exportar sin límite (máximo permitido)
        formato
      });
      
      const response = await reportesOperativosNewService.exportarNovedadesNoAtendidas(params);
      
      if (response.success) {
        try {
          // Descargar archivo
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reportes-novedades-no-atendidas-${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}.xlsx`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast.success(`Reporte novedades no atendidas ${formato.toUpperCase()} descargado exitosamente`);
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
  }, [canExportNoAtendidas, filters]);

  /**
   * 👆 Manejar clic en fila para ver detalle
   */
  const handleRowClick = useCallback((novedad) => {
    setSelectedNovedadId(novedad.id);
    setIsModalOpen(true);
  }, []);

  /**
   * 🚫 Cerrar modal de detalle
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNovedadId(null);
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
   * 🔍 Aplicar filtros
   */
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    // NO resetear activeQuickFilter para mantener el filtro rápido activo
    setPagination(prev => ({ ...prev, page: 1 })); // Resetear a primera página
  }, [filters, activeQuickFilter]);

  /**
   * 🔄 Resetear filtros
   */
  const handleResetFilters = useCallback(() => {
    let resetFilters;
    
    // Si hay un filtro rápido activo, mantener las fechas actuales
    if (activeQuickFilter === 7 || activeQuickFilter === 30) {
      resetFilters = {
        ...filters, // Mantener fechas y otros valores actuales
        turno: '',
        sector_id: '',
        prioridad: '',
        cuadrante_id: '',
        estado_novedad_id: '',
        origen_llamada: '',
        generico: '',
        sort: 'fecha_hora_ocurrencia',
        order: 'DESC'
      };
      // NO resetear activeQuickFilter para mantener el filtro rápido activo
    } else {
      const today = new Date().toISOString().split('T')[0];
      resetFilters = {
        fecha_inicio: today,
        fecha_fin: today,
        turno: '',
        sector_id: '',
        prioridad: '',
        cuadrante_id: '',
        estado_novedad_id: '',
        origen_llamada: '',
        generico: '',
        sort: 'fecha_hora_ocurrencia',
        order: 'DESC'
      };
      setActiveQuickFilter(''); // Resetear filtro rápido si no estaba activo
    }
    
    setFilters(resetFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters, activeQuickFilter]);

  /**
   * 📄 Cambiar de página
   */
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchNovedadesNoAtendidas(newPage);
  }, [fetchNovedadesNoAtendidas]);

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
   * 📊 Columnas para la tabla
   */
  const columns = useMemo(() => [
    {
      key: 'prioridad_actual',
      label: 'Prioridad',
      sortable: true,
      width: '100px',
      render: (row) => {
        const colorClass = reportesOperativosNewService.getPriorityColor(row.prioridad_actual);
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${colorClass.bg} ${colorClass.text} ${colorClass.border}`}>
            {row.prioridad_actual}
          </span>
        );
      }
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
      key: 'origen_llamada',
      label: 'Origen',
      sortable: false,
      width: '80px',
      render: (row) => (
        <OrigenLlamadaCell
          origen={row.origen_llamada}
          showLabel={false}
          size="sm"
        />
      )
    },
    {
      key: 'tipo_subtipo_novedad',
      label: 'Tipo-Subtipo Novedad',
      sortable: false,
      width: '200px',
      render: (row) => {
        const colorClass = reportesOperativosNewService.getPriorityColor(row.prioridad_actual);
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${colorClass.bg} ${colorClass.text}`}>
            {row.tipo_subtipo_novedad}
          </span>
        );
      }
    },
    {
      key: 'localizacion',
      label: 'Ubicación',
      sortable: false,
      width: '180px',
      render: (row) => (
        <div>
          <div className="font-medium text-sm flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-600" />
            {row.localizacion}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {row.referencia_ubicacion}
          </div>
        </div>
      )
    },
    {
      key: 'reportante_nombre',
      label: 'Reportante',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div>
          <div className="font-medium text-sm flex items-center gap-1">
            <User className="w-3 h-3 text-blue-600" />
            {row.es_anonimo ? 'Anónimo' : row.reportante_nombre}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {row.reportante_telefono && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {row.reportante_telefono}
              </span>
            )}
          </div>
        </div>
      )
    },
        {
      key: 'tiempo_espera',
      label: 'Tiempo Espera',
      sortable: true,
      width: '120px',
      render: (row) => {
        if (!row.fecha_hora_ocurrencia) return <span>-</span>;
        
        const now = new Date();
        const occurrence = new Date(row.fecha_hora_ocurrencia);
        const diffMs = now - occurrence;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        return (
          <div className="text-center">
            <div className="font-medium text-sm text-red-600">
              {diffDays > 0 ? `${diffDays}d` : `${diffHours}h`}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">esperando</div>
          </div>
        );
      }
    },
    ], []);

  // Cargar datos al montar y cuando cambian los filtros o paginación
  useEffect(() => {
    if (canReadNoAtendidas) {
      fetchNovedadesNoAtendidas();
    }
  }, [fetchNovedadesNoAtendidas, pagination.page, canReadNoAtendidas, filters]);

  // Sin permisos
  if (!canReadNoAtendidas) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes permisos para ver las novedades no atendidas.
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
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Novedades No Atendidas
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Análisis de incidentes sin atención asignada
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border ${
                  showFilters 
                    ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                    : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Filtros de búsquedas"
              >
                <Filter className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                <SlidersHorizontal className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              
              {/* Filtros Rápidos */}
              <div className="flex gap-1 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleQuickFilter(7)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeQuickFilter === 7 
                      ? 'bg-primary-700 text-white shadow-md transform scale-105' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  Últimos 7 días
                </button>
                <button
                  onClick={() => handleQuickFilter(30)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    activeQuickFilter === 30 
                      ? 'bg-primary-700 text-white shadow-md transform scale-105' 
                      : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  Últimos 30 días
                </button>
              </div>
              
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                {canExportNoAtendidas && novedadesNoAtendidas.length > 0 && !loading && (
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
      </div>

      
      {/* Estadísticas por Prioridades */}
      {estadisticasPrioridades && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              📊 Estadísticas por Prioridades
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['ALTA', 'MEDIA', 'BAJA'].filter(prioridad => estadisticasPrioridades[prioridad]).map(prioridad => {
                const data = estadisticasPrioridades[prioridad];
                const total = Object.values(estadisticasPrioridades).reduce((sum, item) => sum + item.count, 0);
                const porcentaje = ((data.count / total) * 100).toFixed(1);
                
                const colorClasses = {
                  'rojo': {
                    border: 'border-red-600 bg-red-50',
                    title: 'text-red-700',
                    count: 'text-red-600',
                    percentage: 'text-red-600'
                  },
                  'ambar': {
                    border: 'border-amber-600 bg-amber-50',
                    title: 'text-amber-700',
                    count: 'text-amber-600',
                    percentage: 'text-amber-600'
                  },
                  'verde': {
                    border: 'border-green-600 bg-green-50',
                    title: 'text-green-700',
                    count: 'text-green-600',
                    percentage: 'text-green-600'
                  },
                  'gris': {
                    border: 'border-gray-600 bg-gray-50',
                    title: 'text-gray-700',
                    count: 'text-gray-600',
                    percentage: 'text-gray-600'
                  }
                };
                
                const colors = colorClasses[data.color] || colorClasses.gris;
                
                return (
                  <div 
                    key={prioridad}
                    className={`p-4 rounded-lg border-2 ${colors.border} hover:shadow-md transform transition-transform duration-200 hover:scale-105`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold text-lg ${colors.title}`}>
                        {prioridad}
                      </h3>
                      <span className={`text-2xl font-bold ${colors.count}`}>
                        {data.count}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {porcentaje}% del total
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            data.color === 'rojo' ? 'bg-red-600' :
                            data.color === 'ambar' ? 'bg-amber-600' :
                            data.color === 'verde' ? 'bg-green-600' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
              activeQuickFilter={activeQuickFilter}
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
          data={novedadesNoAtendidas}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          currentSort={filters.sort}
          currentOrder={filters.order}
          onRowClick={handleRowClick}
        />
      </div>

      {/* Modal de Detalle de Novedad */}
      <NovedadDetalleModal
        isOpen={isModalOpen}
        novedadId={selectedNovedadId}
        onClose={handleCloseModal}
        showDespacharButton={true}
      />
    </div>
  );
};

export default NovedadesNoAtendidasPage;
