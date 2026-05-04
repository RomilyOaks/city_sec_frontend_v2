/**
 * 📋 Servicio de Dropdowns - Endpoints para Selectores
 * 
 * Basado en documentación: C:\Project\city_sec_backend_claude\docs\Endpoints-Dropdowns-Frontend.md
 * 
 * @version 1.0.0
 * @author CitySec Frontend Team
 */

import api from './api.js';

class DropdownsService {
  constructor() {
    this.baseURL = '';  // API_URL ya incluye /api/v1
    this.defaultTimeout = 10000;
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
   * 🕐 Obtener Horarios de Turnos
   * 
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de turnos
   */
  async getHorariosTurnos(params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado: 1, ...params }
      };

      const response = await api.get(`${this.baseURL}/horarios-turnos`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo horarios de turnos:', error);
      throw error;
    }
  }

  /**
   * 📍 Obtener Sectores
   * 
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de sectores
   */
  async getSectores(params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado: 1, ...params }
      };

      const response = await api.get(`${this.baseURL}/sectores`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo sectores:', error);
      throw error;
    }
  }

  /**
   * 🗺️ Obtener Cuadrantes (todos)
   * 
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de cuadrantes
   */
  async getCuadrantes(params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado: 1, ...params }
      };

      const response = await api.get(`${this.baseURL}/cuadrantes`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cuadrantes:', error);
      throw error;
    }
  }

  /**
   * 🗺️ Obtener Cuadrantes por Sector
   * 
   * @param {number} sectorId - ID del sector
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de cuadrantes del sector
   */
  async getCuadrantesPorSector(sectorId, params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado: 1, ...params }
      };

      const response = await api.get(`${this.baseURL}/cuadrantes/sector/${sectorId}`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo cuadrantes del sector:', error);
      throw error;
    }
  }

  /**
   * 🚗 Obtener Vehículos
   * 
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de vehículos
   */
  async getVehiculos(params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado: 1, ...params }
      };

      const response = await api.get(`${this.baseURL}/vehiculos`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo vehículos:', error);
      throw error;
    }
  }

  /**
   * 👥 Obtener Personal
   * 
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de personal
   */
  async getPersonal(params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado_laboral: 'Activo', ...params }
      };

      const response = await api.get(`${this.baseURL}/personal`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo personal:', error);
      throw error;
    }
  }

  /**
   * 📊 Obtener Estados de Novedad
   * 
   * @param {Object} params - Parámetros opcionales
   * @returns {Promise<Object>} Lista de estados de novedad
   */
  async getEstadosNovedad(params = {}) {
    try {
      const config = {
        headers: this.getHeaders(),
        timeout: this.defaultTimeout,
        params: { estado: 1, ...params }
      };

      const response = await api.get(`${this.baseURL}/estados-novedad`, config);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estados de novedad:', error);
      throw error;
    }
  }

  /**
   * 🎨 Formatear opciones para dropdowns
   * 
   * @param {Array} data - Datos del endpoint
   * @param {string} type - Tipo de dropdown
   * @returns {Array} Opciones formateadas para select
   */
  formatOptions(data, type) {
    if (!Array.isArray(data)) return [];

    switch (type) {
      case 'turnos':
        return data.map(item => ({
          value: item.turno,
          label: `🌅 ${item.turno} (${item.hora_inicio} - ${item.hora_fin})`,
          item
        }));

      case 'sectores':
        return data.map(item => ({
          value: item.id,
          label: `📍 ${item.nombre}`,
          item
        }));

      case 'cuadrantes':
        return data.map(item => ({
          value: item.id,
          label: `🗺️ ${item.nombre} (${item.cuadrante_code})`,
          item
        }));

      case 'vehiculos':
        return data.map(item => ({
          value: item.id,
          label: `🚗 ${item.nombre} (${item.placa})`,
          item
        }));

      case 'personal':
        return data.map(item => ({
          value: item.id,
          label: `👤 ${item.nombres} ${item.apellido_paterno} - ${item.cargo?.nombre || 'Sin cargo'}`,
          item
        }));

      case 'estadosNovedad':
        return data.map(item => ({
          value: item.id,
          label: item.nombre,
          item
        }));

      default:
        return data.map(item => ({
          value: item.id || item.value,
          label: item.nombre || item.label || item.toString(),
          item
        }));
    }
  }

  /**
   * 🔄 Obtener todos los datos para dropdowns
   * 
   * @returns {Promise<Object>} Todos los datos de dropdowns
   */
  async getAllDropdownsData() {
    try {
      // Llamadas paralelas para mejor performance
      const [
        turnosRes,
        sectoresRes,
        vehiculosRes,
        personalRes,
        estadosRes
      ] = await Promise.all([
        this.getHorariosTurnos(),
        this.getSectores(),
        this.getVehiculos(),
        this.getPersonal(),
        this.getEstadosNovedad()
      ]);

      const formattedData = {
        turnos: this.formatOptions(turnosRes.data?.data || turnosRes.data || turnosRes, 'turnos'),
        sectores: this.formatOptions(sectoresRes.data?.sectores || sectoresRes.data?.data || sectoresRes.data || sectoresRes, 'sectores'),
        vehiculos: this.formatOptions(vehiculosRes.data?.data || vehiculosRes.data || vehiculosRes, 'vehiculos'),
        personal: this.formatOptions(personalRes.data?.data || personalRes.data || personalRes, 'personal'),
        estadosNovedad: this.formatOptions(estadosRes.data?.data || estadosRes.data || estadosRes, 'estadosNovedad'),
        cuadrantes: [] // Se cargan dinámicamente por sector
      };

      return formattedData;
    } catch (error) {
      console.error('Error loading all dropdowns data:', error);
      throw error;
    }
  }
}

// Exportar instancia única
const dropdownsService = new DropdownsService();
export default dropdownsService;
