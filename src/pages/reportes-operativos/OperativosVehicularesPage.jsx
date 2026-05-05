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
import NovedadDetalleModal from '../../components/NovedadDetalleModal';
import OrigenLlamadaCell from '../../components/novedades/OrigenLlamadaCell';

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
    vehiculo_id: '',
    conductor_id: '',
    cuadrante_id: '',
    estado_novedad_id: '',
    origen_llamada: '',
    generico: '', // Cambiado de 'search' a 'generico' según documentación backend
    sort: 'fecha_hora_ocurrencia',
    order: 'DESC'
  });
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
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
      
            
      // Obtener datos de operativos vehiculares
      const operativosResponse = await reportesOperativosNewService.getOperativosVehiculares(params);
      
      if (operativosResponse.success) {
        setOperativosVehiculares(operativosResponse.data || []);
        setPagination(prev => ({ ...prev, ...operativosResponse.pagination }));
        
        // Extraer estadísticas de prioridades si vienen en la respuesta (como Operativos a Pie)
        if (operativosResponse.estadisticas_prioridades) {
          setEstadisticasPrioridades(operativosResponse.estadisticas_prioridades);
        }
      }
    } catch (err) {
      console.error('❌ Error cargando operativos vehiculares:', err);
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
    setPagination(prev => ({ ...prev, page: 1 }));
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
        vehiculo_id: '',
        conductor_id: '',
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
        vehiculo_id: '',
        conductor_id: '',
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
   * 👆 Manejar clic en fila para ver detalle
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
   * Manejar filtros rápidos
   */
  const handleQuickFilter = useCallback((days) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);
    
    const newFilters = {
      ...filters,
      fecha_inicio: startDate.toISOString().split('T')[0],
      fecha_fin: today.toISOString().split('T')[0],
      page: 1
    };
    
    setFilters(newFilters);
    setActiveQuickFilter(days);
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters, activeQuickFilter]);

  /**
   * Cambiar de página
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
        
        // Concatenar tipo y subtipo, aplicando abreviado como Operativos a Pie
        const tipoNombre = row.tipo_novedad_nombre || '';
        const subtipoNombre = row.subtipo_novedad || '';
        
        let tipoSubtipo = 'SIN DATO';
        if (tipoNombre && subtipoNombre) {
          // Aplicar misma lógica que Operativos a Pie
          const primerSlashIndex = tipoNombre.indexOf("/");
          if (primerSlashIndex === -1) {
            // Si no hay slash en el tipo, concatenar completo
            tipoSubtipo = `${tipoNombre} / ${subtipoNombre}`;
          } else {
            // Si hay slash, abreviar el tipo hasta el primer slash y concatenar con subtipo
            const tipoAbreviado = tipoNombre.substring(0, primerSlashIndex).trim();
            tipoSubtipo = `${tipoAbreviado} / ${subtipoNombre}`;
          }
        } else if (tipoNombre) {
          tipoSubtipo = tipoNombre;
        }
        
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${colorClass.bg} ${colorClass.text}`}>
            {tipoSubtipo}
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
      render: (row) => {
        // Buscar nombre del conductor en diferentes campos posibles
        const conductorName = row.Nombres_conductor || row.conductor_nombre || row.nombre_conductor || row.conductor || 'No asignado';
        
        return (
          <div>
            <div className="font-medium text-sm">{conductorName}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              {row.doc_tipo} {row.doc_numero}
            </div>
          </div>
        );
      }
    },
    {
      key: 'turno_nombre',
      label: 'Turno',
      sortable: true,
      width: '100px',
      render: (row) => {
        const turnoValue = row.turno || row.turno_nombre || 'SIN DATO';
        
        return (
          <span className="inline-flex px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
            {turnoValue}
          </span>
        );
      }
    },
    {
      key: 'tiempo_respuesta_min',
      label: 'Tiempo Resp.',
      sortable: true,
      width: '100px',
      render: (row) => {
        const tiempo = row.tiempo_respuesta_min;
        const baseTiempo = row.Base_Tiempo_Minimo;
        
        let colorClass = 'text-slate-600'; // default color
        
        if (tiempo && baseTiempo) {
          if (tiempo > baseTiempo) {
            colorClass = 'text-red-600 font-bold'; // ROJO - mayor que base
          } else if (tiempo === baseTiempo) {
            colorClass = 'text-amber-600 font-semibold'; // ÁMBAR - igual a base
          } else {
            colorClass = 'text-green-600'; // VERDE - menor que base
          }
        }
        
        return (
          <div className="text-center">
            <div className={`font-medium text-sm ${colorClass}`}>
              {tiempo || '-'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">min</div>
          </div>
        );
      }
    },
    {
      key: 'estado_operativo',
      label: 'Estado',
      sortable: true,
      width: '120px',
      render: (row) => {
        const estadoValue = row.estado_novedad_actual || 'SIN DATO';
        
        const isActive = estadoValue === 'ABIERTA' || estadoValue === 'EN PROCESO' || estadoValue === 'ASIGNADA';
        
        return (
          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
            isActive 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
              : 'bg-slate-100 dark:bg-slate-900/30 text-slate-800 dark:text-slate-300'
          }`}>
            {estadoValue}
          </span>
        );
      }
    },
    {
      key: 'sector_nombre',
      label: 'Sector',
      sortable: true,
      width: '120px',
      render: (row) => {
        const sectorValue = row.nombre_sector || row.sector_nombre || 'SIN DATO';
        
        return (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="text-sm">{sectorValue}</span>
          </div>
        );
      }
    }
  ], []);

  // Cargar datos al montar y cuando cambian los filtros o paginación
  useEffect(() => {
    if (canReadVehiculares) {
      fetchOperativosVehiculares();
    }
  }, [fetchOperativosVehiculares, pagination.page, canReadVehiculares, filters, activeQuickFilter]);

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
                title="Filtros de búsquedas"
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
              {canExportVehiculares && operativosVehiculares.length > 0 && !loading && (
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
                
                // Colores homologados con Operativos a Pie y Novedades No Atendidas
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
                  }
                };
                
                const colors = colorClasses[data.color] || colorClasses.rojo;
                
                return (
                  <div key={prioridad} className={`p-4 rounded-lg border ${colors.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${colors.title}`}>{prioridad}</span>
                      <AlertTriangle className={`w-4 h-4 ${colors.count}`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${colors.count}`}>
                        {data.count}
                      </span>
                    </div>
                    <div className={`mt-2 text-sm text-gray-600 dark:text-gray-400`}>
                      {porcentaje}% del total
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
          data={operativosVehiculares}
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
        showDespacharButton={false}
      />
    </div>
  );
};

export default OperativosVehicularesPage;
