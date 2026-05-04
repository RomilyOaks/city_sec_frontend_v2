/**
 * 🚶 Operativos a Pie - Reportes Operativos v2.0
 * 
 * Listado completo de operativos a pie con 62 campos
 * Información completa de personal, equipamiento y patrullaje
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Download, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Shield,
  Radio,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  UserCheck,
  Map
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import reportesOperativosNewService from '../../services/reportesOperativosNewService';
import { useReportesPermissions } from '../../hooks/useReportesPermissions';

// Componentes
import FiltrosReportes from './components/FiltrosReportes';
import TablaOperativos from './components/TablaOperativos';
import NovedadDetalleModal from '../../components/NovedadDetalleModal';
import OrigenLlamadaCell from '../../components/novedades/OrigenLlamadaCell';

const OperativosPiePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = useReportesPermissions();
  
  // 🎯 Nuevos permisos específicos para operativos a pie
  const canReadOperativosPie = permissions.operativosPie.read;
  const canExportOperativosPie = permissions.operativosPie.export;
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [operativosPie, setOperativosPie] = useState([]);
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
    personal_id: '',
    cargo_id: '',
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
  
  // Ref para evitar bucles con pagination
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  // Cargar filtros desde navegación
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(location.state.filters);
    }
  }, [location.state]);

  /**
   * 🚶 Cargar operativos a pie
   */
  const fetchOperativosPie = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
            
      // Construir parámetros para API
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        page,
        limit: paginationRef.current.limit
      });
      
            
      // Obtener datos y resumen en paralelo
      const [operativosResponse, resumenResponse] = await Promise.all([
        reportesOperativosNewService.getOperativosPie(params),
        reportesOperativosNewService.getResumenPie(params)
      ]);
      
      if (operativosResponse.success) {
        setOperativosPie(operativosResponse.data || []);
        setPagination(prev => ({ ...prev, ...operativosResponse.pagination }));
              }
      
      if (resumenResponse.success) {
        // Convertir resumen a formato de estadísticas de prioridades
        const estadisticasAdaptadas = {
          'ALTA': { count: resumenResponse.data?.prioridad_alta || 0, color: 'rojo' },
          'MEDIA': { count: resumenResponse.data?.prioridad_media || 0, color: 'ambar' },
          'BAJA': { count: resumenResponse.data?.prioridad_baja || 0, color: 'verde' }
        };
        setEstadisticasPrioridades(estadisticasAdaptadas);
              }
    } catch (err) {
      console.error('❌ Error cargando operativos a pie:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * 🔄 Refrescar datos
   */
  const handleRefresh = useCallback(() => {
    fetchOperativosPie(pagination.page);
  }, [fetchOperativosPie, pagination.page]);

  /**
   * 📤 Exportar datos
   */
  const handleExport = useCallback(async (formato = 'excel') => {
    // Validar permisos de exportación
    if (!canExportOperativosPie) {
      toast.error('No tienes permisos para exportar operativos a pie');
      return;
    }

    try {
      toast.loading(`Preparando exportación ${formato.toUpperCase()}...`);
      
      const params = reportesOperativosNewService.buildParams({
        ...filters,
        limit: 1000, // Exportar sin límite (máximo permitido)
        formato
      });
      
      const response = await reportesOperativosNewService.exportarOperativosPie(params);
      
      if (response.success) {
        try {
          // Descargar archivo
          const blob = new Blob([response.data], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          });
          
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reportes-operativos-pie-${new Date().toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}.xlsx`;
          
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
  }, [canExportOperativosPie, filters]);

  /**
   * � Cambiar de página
   */
  const handlePageChange = useCallback((newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchOperativosPie(newPage);
  }, [fetchOperativosPie]);

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
   *  Manejar clic en fila para ver detalle
   */
  const handleRowClick = useCallback((operativo) => {
    if (operativo.novedad_id) {
      setSelectedNovedadId(operativo.novedad_id);
      setIsModalOpen(true);
    } else {
      toast.warning('Este operativo no tiene una novedad asociada');
    }
  }, []);

  /**
   * 🚫 Cerrar modal de detalle
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNovedadId(null);
  }, []);

  /**
   * 🎯 Aplicar filtros rápidos
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
    fetchOperativosPie(1);
  }, [filters, fetchOperativosPie]);

  /**
   * 🔍 Aplicar filtros
   */
  const handleApplyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setActiveQuickFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
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
      personal_id: '',
      cargo_id: '',
      cuadrante_id: '',
      estado_novedad_id: '',
      origen_llamada: '',
      generico: '', // Cambiado de 'search' a 'generico' según documentación backend
      sort: 'fecha_hora_ocurrencia',
      order: 'DESC'
    };
    setFilters(defaultFilters);
    setActiveQuickFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

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
            {row.tipo_novedad}
          </span>
        );
      }
    },
    {
      key: 'personal_asignado',
      label: 'Personal Asignado',
      sortable: true,
      width: '180px',
      render: (row) => (
        <div>
          <div className="font-medium text-sm flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-green-600" />
            {row.personal_asignado}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {row.cargo_personal_asignado}
          </div>
        </div>
      )
    },
    {
      key: 'doc_numero',
      label: 'Documento',
      sortable: true,
      width: '120px',
      render: (row) => (
        <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-2 py-1 rounded">
          {row.doc_tipo} {row.doc_numero}
        </span>
      )
    },
    {
      key: 'turno',
      label: 'Turno',
      sortable: true,
      width: '100px',
      render: (row) => (
        <span className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
          {row.turno}
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
          <span className="text-sm">{row.nombre_sector}</span>
        </div>
      )
    },
    {
      key: 'cuadrante_nombre',
      label: 'Cuadrante',
      sortable: true,
      width: '140px',
      render: (row) => (
        <div>
          <div className="font-medium text-sm">{row.nombre_cuadrante}</div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {row.cuadrante_code}
          </div>
        </div>
      )
    },
    {
      key: 'tiempo_minutos',
      label: 'Tiempo',
      sortable: true,
      width: '100px',
      render: (row) => (
        <div className="text-center">
          <div className="font-medium text-sm">
            {row.tiempo_minutos || '-'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">minutos</div>
        </div>
      )
    },
    {
      key: 'equipamiento_completo',
      label: 'Equipamiento',
      sortable: true,
      width: '120px',
      render: (row) => {
        const isComplete = row.chaleco_balistico && row.radio_tetra_code && 
                          row.porra_policial && row.esposas && 
                          row.linterna && row.kit_primeros_auxilios;
        
        return (
          <div className="flex items-center gap-1">
            <Shield className={`w-4 h-4 ${isComplete ? 'text-green-600' : 'text-amber-600'}`} />
            <span className={`text-xs px-2 py-1 rounded ${
              isComplete 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
            }`}>
              {isComplete ? 'Completo' : 'Incompleto'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'estado_patrullaje_pie',
      label: 'Estado',
      sortable: true,
      width: '120px',
      render: (row) => {
        const isActive = row.estado_patrullaje_pie === 'EN_SERVICIO' || 
                       row.estado_patrullaje_pie === 'COMPLETADO';
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            isActive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
          }`}>
            {row.estado_patrullaje_pie}
          </span>
        );
      }
    }
  ], []);

  // Cargar datos al montar y cuando cambian los filtros o paginación
  useEffect(() => {
    if (canReadOperativosPie) {
      fetchOperativosPie();
    }
  }, [pagination.page, canReadOperativosPie, fetchOperativosPie]);

  // Cargar datos cuando cambian los filtros
  useEffect(() => {
    if (canReadOperativosPie) {
      fetchOperativosPie(1); // Resetear a primera página cuando cambian filtros
    }
  }, [filters, canReadOperativosPie, fetchOperativosPie]);

  // Sin permisos
  if (!canReadOperativosPie) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            No tienes permisos para ver los operativos a pie.
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
                  🚶 Operativos a Pie
                </h1>
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
                <Filter className="w-4 h-4" title="Filtros de búsquedas" />
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
                            
              {canExportOperativosPie && operativosPie.length > 0 && !loading && (
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
            />
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
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
          data={operativosPie}
          columns={columns}
          loading={loading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSort={handleSort}
          currentSort={filters.sort}
          currentOrder={filters.order}
          onRowClick={handleRowClick}
        />

      {/* Modal de Detalles - TODO */}
      {isModalOpen && selectedNovedadId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Detalles del Operativo a Pie
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {/* TODO: Implementar contenido del modal */}
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                Contenido del modal en desarrollo...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Novedad */}
      <NovedadDetalleModal
        isOpen={isModalOpen}
        novedadId={selectedNovedadId}
        onClose={handleCloseModal}
        showDespacharButton={true}
      />
      </div>
    </div>
  );
};

export default OperativosPiePage;