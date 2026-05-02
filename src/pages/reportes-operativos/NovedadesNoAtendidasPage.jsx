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
    tipo_novedad_id: '',
    search: '',
    sort: 'fecha_hora_ocurrencia',
    order: 'DESC'
  });
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');
  const [selectedNovedad, setSelectedNovedad] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
      
      // Obtener datos y resumen en paralelo
      const [novedadesResponse, resumenResponse] = await Promise.all([
        reportesOperativosNewService.getNovedadesNoAtendidas(params),
        reportesOperativosNewService.getResumenNovedadesNoAtendidas(params)
      ]);
      
      if (novedadesResponse.success) {
        setNovedadesNoAtendidas(novedadesResponse.data || []);
        setPagination(novedadesResponse.pagination || pagination);
              }
      
      if (resumenResponse.success) {
        setResumen(resumenResponse.data);
              }
    } catch (err) {
      console.error('❌ Error cargando novedades no atendidas:', err);
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
    setActiveQuickFilter(''); // Limpiar filtro rápido activo
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
      tipo_novedad_id: '',
      search: '',
      sort: 'fecha_hora_ocurrencia',
      order: 'DESC'
    };
    setFilters(defaultFilters);
    setActiveQuickFilter(''); // Limpiar filtro rápido activo
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

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
   * 👁️ Ver detalles de novedad
   */
  const handleViewDetails = useCallback((novedad) => {
    setSelectedNovedad(novedad);
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
        <span className="font-mono text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded">
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
      key: 'tipo_novedad_nombre',
      label: 'Tipo Novedad',
      sortable: false,
      width: '140px',
      render: (row) => {
        const colorClass = reportesOperativosNewService.getPriorityColor(row.prioridad_actual);
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${colorClass.bg} ${colorClass.text}`}>
            {row.tipo_novedad_nombre}
          </span>
        );
      }
    },
    {
      key: 'subtipo_novedad_nombre',
      label: 'Subtipo',
      sortable: false,
      width: '120px',
      render: (row) => (
        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
          {row.subtipo_novedad_nombre}
        </span>
      )
    },
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
      key: 'tipo_atencion_faltante',
      label: 'Atención Requerida',
      sortable: false,
      width: '160px',
      render: (row) => (
        <div className="space-y-1">
          {Array.isArray(row.tipo_atencion_faltante) ? 
            row.tipo_atencion_faltante.map((tipo, index) => (
              <span key={index} className="inline-flex px-2 py-1 text-xs rounded bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 mr-1">
                {tipo === 'PATRULLAJE_VEHICULAR' && <Car className="w-3 h-3 mr-1" />}
                {tipo === 'PATRULLAJE_A_PIE' && <Users className="w-3 h-3 mr-1" />}
                {tipo.replace('_', ' ')}
              </span>
            ))
            : (
              <span className="text-xs text-slate-600 dark:text-slate-400">No especificado</span>
            )
          }
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
    if (canReadNoAtendidas) {
      fetchNovedadesNoAtendidas();
    }
  }, [fetchNovedadesNoAtendidas, pagination.page, canReadNoAtendidas]);

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
                {canExportNoAtendidas && (
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

      {/* Resumen Estadístico */}
      {resumen && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {resumen.total_novedades_no_atendidas || 0}
                </div>
                <div className="text-xs text-red-700 dark:text-red-300">Total No Atendidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {resumen.no_atendidas_pie || 0}
                </div>
                <div className="text-xs text-orange-700 dark:text-orange-300">No Atendidas Pie</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {resumen.no_atendidas_vehiculos || 0}
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-300">No Atendidas Vehículos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {resumen.total_unicas || 0}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300">Total Únicas</div>
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
          data={novedadesNoAtendidas}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          currentSort={filters.sort}
          currentOrder={filters.order}
        />
      </div>

      {/* Modal de Detalles */}
      {showDetailModal && selectedNovedad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Detalles de Novedad No Atendida
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Información General */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Información General
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Código:</strong> {selectedNovedad.novedad_code}</div>
                  <div><strong>Fecha Ocurrencia:</strong> {reportesOperativosNewService.formatDate(selectedNovedad.fecha_hora_ocurrencia, true)}</div>
                  <div><strong>Fecha Reporte:</strong> {reportesOperativosNewService.formatDate(selectedNovedad.fecha_hora_reporte, true)}</div>
                  <div><strong>Tipo:</strong> {selectedNovedad.tipo_novedad_nombre}</div>
                  <div><strong>Subtipo:</strong> {selectedNovedad.subtipo_novedad_nombre}</div>
                  <div><strong>Prioridad:</strong> 
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      selectedNovedad.prioridad_actual === 'CRÍTICA' ? 'bg-red-100 text-red-800' :
                      selectedNovedad.prioridad_actual === 'ALTA' ? 'bg-orange-100 text-orange-800' :
                      selectedNovedad.prioridad_actual === 'MEDIA' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {selectedNovedad.prioridad_actual}
                    </span>
                  </div>
                  <div><strong>Descripción:</strong> {selectedNovedad.descripcion}</div>
                  <div><strong>Observaciones:</strong> {selectedNovedad.observaciones || '-'}</div>
                </div>
              </div>
              
              {/* Información de Ubicación */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Información de Ubicación
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Ubicación:</strong> {selectedNovedad.localizacion}</div>
                  <div><strong>Referencia:</strong> {selectedNovedad.referencia_ubicacion || '-'}</div>
                  <div><strong>Dirección ID:</strong> {selectedNovedad.direccion_id || '-'}</div>
                  <div><strong>Latitud:</strong> {selectedNovedad.latitud || '-'}</div>
                  <div><strong>Longitud:</strong> {selectedNovedad.longitud || '-'}</div>
                  <div><strong>Ajustado en Mapa:</strong> {selectedNovedad.ajustado_en_mapa ? 'Sí' : 'No'}</div>
                  <div><strong>Ubigeo:</strong> {selectedNovedad.ubigeo_code || '-'}</div>
                </div>
              </div>
              
              {/* Información del Reportante */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información del Reportante
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Nombre:</strong> {selectedNovedad.es_anonimo ? 'ANÓNIMO' : selectedNovedad.reportante_nombre}</div>
                  <div><strong>Teléfono:</strong> {selectedNovedad.reportante_telefono || '-'}</div>
                  <div><strong>Documento:</strong> {selectedNovedad.reportante_doc_identidad || '-'}</div>
                  <div><strong>Origen Llamada:</strong> {selectedNovedad.origen_llamada || '-'}</div>
                  <div><strong>Radio TETRA ID:</strong> {selectedNovedad.radio_tetra_id || '-'}</div>
                  <div><strong>Es Anónimo:</strong> {selectedNovedad.es_anonimo ? 'Sí' : 'No'}</div>
                </div>
              </div>
              
              {/* Información de Recursos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recursos Asignados
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Usuario Registro:</strong> {selectedNovedad.usuario_registro || '-'}</div>
                  <div><strong>Unidad Oficina:</strong> {selectedNovedad.unidad_oficina_id || '-'}</div>
                  <div><strong>Vehículo ID:</strong> {selectedNovedad.vehiculo_id || '-'}</div>
                  <div><strong>Personal Cargo:</strong> {selectedNovedad.personal_cargo_id || '-'}</div>
                  <div><strong>Personal Seguridad 2:</strong> {selectedNovedad.personal_seguridad2_id || '-'}</div>
                  <div><strong>Personal Seguridad 3:</strong> {selectedNovedad.personal_seguridad3_id || '-'}</div>
                  <div><strong>Personal Seguridad 4:</strong> {selectedNovedad.personal_seguridad4_id || '-'}</div>
                </div>
              </div>
              
              {/* Timeline del Incidente */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Clock3 className="w-4 h-4" />
                  Timeline del Incidente
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Fecha Despacho:</strong> {selectedNovedad.fecha_despacho ? reportesOperativosNewService.formatDate(selectedNovedad.fecha_despacho, true) : '-'}</div>
                  <div><strong>Usuario Despacho:</strong> {selectedNovedad.usuario_despacho || '-'}</div>
                  <div><strong>Fecha Llegada:</strong> {selectedNovedad.fecha_llegada ? reportesOperativosNewService.formatDate(selectedNovedad.fecha_llegada, true) : '-'}</div>
                  <div><strong>Fecha Cierre:</strong> {selectedNovedad.fecha_cierre ? reportesOperativosNewService.formatDate(selectedNovedad.fecha_cierre, true) : '-'}</div>
                  <div><strong>Usuario Cierre:</strong> {selectedNovedad.usuario_cierre || '-'}</div>
                  <div><strong>Turno:</strong> {selectedNovedad.turno || '-'}</div>
                </div>
              </div>
              
              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Información Adicional
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>KM Inicial:</strong> {selectedNovedad.km_inicial || '-'}</div>
                  <div><strong>KM Final:</strong> {selectedNovedad.km_final || '-'}</div>
                  <div><strong>Tiempo Respuesta:</strong> {selectedNovedad.tiempo_respuesta_min || '-'} minutos</div>
                  <div><strong>Tiempo Resp. Operativo:</strong> {selectedNovedad.tiempo_respuesta_min_operativo || '-'} minutos</div>
                  <div><strong>Requiere Seguimiento:</strong> {selectedNovedad.requiere_seguimiento ? 'Sí' : 'No'}</div>
                  <div><strong>Próxima Revisión:</strong> {selectedNovedad.fecha_proxima_revision ? reportesOperativosNewService.formatDate(selectedNovedad.fecha_proxima_revision) : '-'}</div>
                  <div><strong>Personas Afectadas:</strong> {selectedNovedad.num_personas_afectadas || '0'}</div>
                  <div><strong>Pérdidas Estimadas:</strong> {selectedNovedad.perdidas_materiales_estimadas || 'S/ 0.00'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NovedadesNoAtendidasPage;
