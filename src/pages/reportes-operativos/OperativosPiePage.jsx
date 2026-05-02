/**
 * 🚶 Operativos a Pie - Reportes Operativos v2.0
 * 
 * Listado completo de operativos a pie con 62 campos
 * Información completa de personal, equipamiento y patrullaje
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    personal_id: '',
    cargo_id: '',
    search: '',
    sort: 'fecha_hora_ocurrencia',
    order: 'DESC'
  });
  
  // Estados de UI
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOperativo, setSelectedOperativo] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

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
        limit: pagination.limit
      });
      
            
      // Obtener datos y resumen en paralelo
      const [operativosResponse, resumenResponse] = await Promise.all([
        reportesOperativosNewService.getOperativosPie(params),
        reportesOperativosNewService.getResumenPie(params)
      ]);
      
      if (operativosResponse.success) {
        setOperativosPie(operativosResponse.data || []);
        setPagination(operativosResponse.pagination || pagination);
              }
      
      if (resumenResponse.success) {
        setResumen(resumenResponse.data);
              }
    } catch (err) {
      console.error('❌ Error cargando operativos a pie:', err);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

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
   * 👁️ Ver detalles de operativo
   */
  const handleViewDetails = useCallback((operativo) => {
    setSelectedOperativo(operativo);
    setShowDetailModal(true);
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
  }, [fetchOperativosPie]);

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
      search: '',
      sort: 'fecha_hora_ocurrencia',
      order: 'DESC'
    };
    setFilters(defaultFilters);
    setActiveQuickFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [fetchOperativosPie]);

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
    if (canReadOperativosPie) {
      fetchOperativosPie();
    }
  }, [fetchOperativosPie, pagination.page, canReadOperativosPie]);

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
                <Filter className="w-4 h-4" />
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
              
              {canExportOperativosPie && (
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
                  {resumen.personal_activo || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Personal Activo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {resumen.equipamiento_completo || 0}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Equipamiento Completo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {resumen.eficiencia_patrullaje || 0}%
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Eficiencia Patrullaje</div>
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
        />
      </div>

      {/* Modal de Detalles */}
      {showDetailModal && selectedOperativo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Detalles del Operativo a Pie
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Información Personal
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Nombre:</strong> {selectedOperativo.personal_asignado}</div>
                  <div><strong>Documento:</strong> {selectedOperativo.doc_tipo} {selectedOperativo.doc_numero}</div>
                  <div><strong>Cargo:</strong> {selectedOperativo.cargo_personal_asignado}</div>
                  <div><strong>Nacionalidad:</strong> {selectedOperativo.nacionalidad}</div>
                  <div><strong>Régimen:</strong> {selectedOperativo.regimen}</div>
                  <div><strong>Estado:</strong> {selectedOperativo.estado_personal_asignado}</div>
                </div>
              </div>
              
              {/* Información del Turno */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Información del Turno
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Fecha:</strong> {selectedOperativo.fecha_turno}</div>
                  <div><strong>Turno:</strong> {selectedOperativo.turno}</div>
                  <div><strong>Horario:</strong> {selectedOperativo.turno_horario_inicio} - {selectedOperativo.turno_horario_fin}</div>
                  <div><strong>N° Orden:</strong> {selectedOperativo.nro_orden_turno}</div>
                  <div><strong>Observaciones:</strong> {selectedOperativo.observaciones_turno || '-'}</div>
                </div>
              </div>
              
              {/* Información del Sector */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Información del Sector
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Sector:</strong> {selectedOperativo.nombre_sector}</div>
                  <div><strong>Código Sector:</strong> {selectedOperativo.sector_code}</div>
                  <div><strong>Supervisor:</strong> {selectedOperativo.supervisor_sector}</div>
                  <div><strong>Cargo Supervisor:</strong> {selectedOperativo.cargo_supervisor}</div>
                </div>
              </div>
              
              {/* Información del Cuadrante */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Información del Cuadrante
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Cuadrante:</strong> {selectedOperativo.nombre_cuadrante}</div>
                  <div><strong>Código:</strong> {selectedOperativo.cuadrante_code}</div>
                  <div><strong>Zona:</strong> {selectedOperativo.zona_code}</div>
                  <div><strong>Hora Ingreso:</strong> {selectedOperativo.hora_ingreso}</div>
                  <div><strong>Hora Salida:</strong> {selectedOperativo.hora_salida}</div>
                  <div><strong>Tiempo:</strong> {selectedOperativo.tiempo_minutos} minutos</div>
                  <div><strong>Incidentes:</strong> {selectedOperativo.incidentes_reportados}</div>
                </div>
              </div>
              
              {/* Equipamiento */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Equipamiento
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Radio className={`w-4 h-4 ${selectedOperativo.radio_tetra_code ? 'text-green-600' : 'text-red-600'}`} />
                    <strong>Radio TETRA:</strong> {selectedOperativo.radio_tetra_code || 'No asignado'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-4 h-4 ${selectedOperativo.chaleco_balistico ? 'text-green-600' : 'text-red-600'}`} />
                    <strong>Chaleco Balístico:</strong> {selectedOperativo.chaleco_balistico ? 'Sí' : 'No'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${selectedOperativo.porra_policial ? 'text-green-600' : 'text-red-600'}`} />
                    <strong>Porra Policial:</strong> {selectedOperativo.porra_policial ? 'Sí' : 'No'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${selectedOperativo.esposas ? 'text-green-600' : 'text-red-600'}`} />
                    <strong>Esposas:</strong> {selectedOperativo.esposas ? 'Sí' : 'No'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${selectedOperativo.linterna ? 'text-green-600' : 'text-red-600'}`} />
                    <strong>Linterna:</strong> {selectedOperativo.linterna ? 'Sí' : 'No'}
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${selectedOperativo.kit_primeros_auxilios ? 'text-green-600' : 'text-red-600'}`} />
                    <strong>Kit Primeros Auxilios:</strong> {selectedOperativo.kit_primeros_auxilios ? 'Sí' : 'No'}
                  </div>
                </div>
              </div>
              
              {/* Información del Patrullaje */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Información del Patrullaje
                </h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Tipo Patrullaje:</strong> {selectedOperativo.tipo_patrullaje}</div>
                  <div><strong>Hora Inicio:</strong> {selectedOperativo.hora_inicio_operativo}</div>
                  <div><strong>Hora Fin:</strong> {selectedOperativo.hora_fin_operativo}</div>
                  <div><strong>Estado:</strong> {selectedOperativo.estado_patrullaje_pie}</div>
                  <div><strong>Observaciones:</strong> {selectedOperativo.observaciones_operativo_pie || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default OperativosPiePage;
