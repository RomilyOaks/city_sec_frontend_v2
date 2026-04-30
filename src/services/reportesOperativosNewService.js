/**
 * 📊 Servicio de Reportes Operativos - Nueva API Backend v2.0
 * 
 * Basado en documentación: C:\Project\city_sec_backend_claude\docs\API-Reportes-Operativos-Frontend.md
 * Backend URL: http://localhost:3000/api/v1/reportes-operativos
 * 
 * @version 2.0.0
 * @author CitySec Frontend Team
 */

import api from './api.js';

class ReportesOperativosNewService {
  constructor() {
    this.baseURL = '/reportes-operativos';
    this.defaultTimeout = 30000;
  }

  /**
   * 🔐 Obtener headers con autenticación JWT
   */
  getHeaders() {
    const token = localStorage.getItem('jwt_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * 🔄 Manejo de errores centralizado
   */
  handleApiError(error, endpoint) {
    console.error(`Error en ${endpoint}:`, error);
    
    if (error.response) {
      // Error del servidor
      const status = error.response.status;
      const message = error.response.data?.message || `HTTP ${status}`;
      
      switch (status) {
        case 401:
          // Token expirado - redirigir a login
          localStorage.removeItem('jwt_token');
          window.location.href = '/login';
          throw new Error('Sesión expirada. Por favor inicie sesión nuevamente.');
        case 403:
          throw new Error('No tienes permisos para acceder a esta información.');
        case 404:
          throw new Error('Recurso no encontrado.');
        case 422:
          throw new Error('Datos inválidos. Por favor verifique los parámetros.');
        case 500:
          throw new Error('Error interno del servidor. Intente nuevamente más tarde.');
        default:
          throw new Error(message);
      }
    } else if (error.request) {
      // Error de red
      throw new Error('Error de conexión. Verifique su conexión a internet.');
    } else {
      // Error de configuración
      throw new Error(`Error de configuración: ${error.message}`);
    }
  }

  /**
   * 🚀 Request genérico con manejo de errores
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      timeout: this.defaultTimeout,
      ...options
    };

    try {
      const response = await api(url, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error, endpoint);
    }
  }

  // ========================================
  // 🚗 FASE 1: OPERATIVOS VEHICULARES
  // ========================================

  /**
   * 📋 Obtener Operativos Vehiculares
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Datos de operativos vehiculares
   */
  async getOperativosVehiculares(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/vehiculares${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📊 Obtener Resumen Estadístico Vehicular
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Resumen con estadísticas
   */
  async getResumenVehicular(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/vehiculares/resumen${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📤 Exportar Operativos Vehiculares
   * 
   * @param {Object} params - Parámetros de filtrado y formato
   * @returns {Promise<Object>} Información de exportación
   */
  async exportarOperativosVehiculares(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/vehiculares/exportar${queryString ? `?${queryString}` : ''}`;
    
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        responseType: 'blob' // Importante para archivos binarios
      };

      const response = await api(url, config);
      
      // Verificar si es un archivo Excel o un error JSON
      const contentType = response.headers['content-type'];
      
      if (contentType?.includes('application/json')) {
        // Es una respuesta JSON (probablemente un error)
        const text = await response.data.text();
        return JSON.parse(text);
      } else if (contentType?.includes('application/vnd.openxmlformats')) {
        // Es un archivo Excel
        return {
          success: true,
          data: response.data,
          filename: `reportes-operativos-vehiculares-${new Date().toISOString().split('T')[0]}.xlsx`
        };
      } else {
        // Intentar procesar como blob
        return {
          success: true,
          data: response.data,
          filename: `reportes-operativos-vehiculares-${new Date().toISOString().split('T')[0]}.xlsx`
        };
      }
    } catch (error) {
      this.handleApiError(error, '/vehiculares/exportar');
    }
  }

  // ========================================
  // 🚶 FASE 2: OPERATIVOS A PIE
  // ========================================

  /**
   * 📋 Obtener Operativos a Pie
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Datos de operativos a pie
   */
  async getOperativosPie(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/pie${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📊 Obtener Resumen Operativos a Pie
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Resumen con estadísticas
   */
  async getResumenPie(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/pie/resumen${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📤 Exportar Operativos a Pie
   * 
   * @param {Object} params - Parámetros de filtrado y formato
   * @returns {Promise<Object>} Información de exportación
   */
  async exportarOperativosPie(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/pie/exportar${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // ========================================
  // ⚠️ FASE 3: NOVEDADES NO ATENDIDAS
  // ========================================

  /**
   * 📋 Obtener Novedades No Atendidas
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Datos de novedades no atendidas
   */
  async getNovedadesNoAtendidas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/no-atendidas${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📊 Obtener Resumen Novedades No Atendidas
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Resumen con estadísticas
   */
  async getResumenNovedadesNoAtendidas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/no-atendidas/resumen${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📤 Exportar Novedades No Atendidas
   * 
   * @param {Object} params - Parámetros de filtrado y formato
   * @returns {Promise<Object>} Información de exportación
   */
  async exportarNovedadesNoAtendidas(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/no-atendidas/exportar${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // ========================================
  // 🔄 FASE 4: REPORTES COMBINADOS Y DASHBOARD
  // ========================================

  /**
   * 🔄 Obtener Reportes Combinados
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} Datos consolidados de todas las fuentes
   */
  async getReportesCombinados(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/combinados${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  /**
   * 📤 Exportar Reportes Combinados
   * 
   * @param {Object} params - Parámetros de filtrado y formato
   * @returns {Promise<Object>} Información de exportación
   */
  async exportarReportesCombinados(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}/combinados/exportar${queryString ? `?${queryString}` : ''}`;
    
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        responseType: 'blob' // Importante para archivos binarios
      };

      const response = await api(url, config);
      
      // Verificar si es un archivo Excel o un error JSON
      const contentType = response.headers['content-type'];
      
      if (contentType?.includes('application/json')) {
        // Es una respuesta JSON (probablemente un error)
        const text = await response.data.text();
        return JSON.parse(text);
      } else if (contentType?.includes('application/vnd.openxmlformats')) {
        // Es un archivo Excel
        return {
          success: true,
          data: response.data,
          filename: `reportes-operativos-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`
        };
      } else {
        // Intentar procesar como blob
        return {
          success: true,
          data: response.data,
          filename: `reportes-operativos-dashboard-${new Date().toISOString().split('T')[0]}.xlsx`
        };
      }
    } catch (error) {
      this.handleApiError(error, '/combinados/exportar');
    }
  }

  /**
   * �🔄 Obtener Dashboard Operativos
   * 
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>} KPIs y métricas completas
   */
  async getDashboardOperativos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint);
  }

  // ========================================
  // 🔧 UTILIDADES Y HELPER FUNCTIONS
  // ========================================

  /**
   * 🏥 Health Check - Verificar conexión con backend
   * 
   * @returns {Promise<Object>} Estado del servicio
   */
  async getHealth() {
    console.log('🏥 Verificando salud del servicio...');
    return this.request('/health');
  }

  /**
   * 📋 Construir parámetros de filtrado estándar
   * 
   * @param {Object} filters - Filtros del formulario
   * @returns {Object} Parámetros formateados para API
   */
  buildParams(filters) {
    const params = {};
    
    // Fechas
    if (filters.fecha_inicio) params.fecha_inicio = filters.fecha_inicio;
    if (filters.fecha_fin) params.fecha_fin = filters.fecha_fin;
    
    // Turnos
    if (filters.turno && filters.turno !== 'todos') params.turno = filters.turno;
    
    // Sectores
    if (filters.sector_id && filters.sector_id !== 'todos') params.sector_id = parseInt(filters.sector_id);
    
    // Prioridades
    if (filters.prioridad && filters.prioridad !== 'todos') params.prioridad = filters.prioridad;
    
    // Paginación
    if (filters.page) params.page = parseInt(filters.page);
    if (filters.limit) params.limit = parseInt(filters.limit);
    
    // Búsqueda
    if (filters.search) params.search = filters.search;
    
    // Ordenamiento
    if (filters.sort) params.sort = filters.sort;
    if (filters.order) params.order = filters.order;
    
    // Filtros específicos para vehiculares
    if (filters.vehiculo_id) params.vehiculo_id = parseInt(filters.vehiculo_id);
    if (filters.conductor_id) params.conductor_id = parseInt(filters.conductor_id);
    
    // Filtros específicos para personal
    if (filters.personal_id) params.personal_id = parseInt(filters.personal_id);
    if (filters.cargo_id) params.cargo_id = parseInt(filters.cargo_id);
    
    return params;
  }

  /**
   * 📊 Formatear números para visualización
   * 
   * @param {number} value - Valor numérico
   * @param {string} type - Tipo de formateo (percentage, currency, number)
   * @returns {string} Valor formateado
   */
  formatNumber(value, type = 'number') {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'percentage':
        return `${parseFloat(value).toFixed(2)}%`;
      case 'currency':
        return `S/. ${parseFloat(value).toFixed(2)}`;
      case 'decimal':
        return parseFloat(value).toFixed(2);
      default:
        return value.toLocaleString('es-PE');
    }
  }

  /**
   * 📅 Formatear fechas para visualización
   * 
   * @param {string} dateString - Fecha en formato ISO
   * @param {boolean} includeTime - Incluir hora
   * @returns {string} Fecha formateada
   */
  formatDate(dateString, includeTime = false) {
    if (!dateString) return '-';
    
    const date = new Date(dateString);
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      ...(includeTime && {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    };
    
    return date.toLocaleString('es-PE', options);
  }

  /**
   * 🚨 Determinar color según prioridad
   * 
   * @param {string} priority - Prioridad (BAJA, MEDIA, ALTA, CRÍTICA)
   * @returns {Object} Clases CSS para color
   */
  getPriorityColor(priority) {
    const colors = {
      'BAJA': {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800'
      },
      'MEDIA': {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-800 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800'
      },
      'ALTA': {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-800 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800'
      },
      'CRÍTICA': {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800'
      }
    };
    
    return colors[priority] || colors['MEDIA'];
  }

  /**
   * 📈 Calcular porcentaje
   * 
   * @param {number} value - Valor
   * @param {number} total - Total
   * @returns {number} Porcentaje calculado
   */
  calculatePercentage(value, total) {
    if (!total || total === 0) return 0;
    return (value / total) * 100;
  }
}

// Exportar instancia única del servicio
export default new ReportesOperativosNewService();
