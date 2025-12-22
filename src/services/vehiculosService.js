import api from './api'

/**
 * Listar vehículos con filtros y paginación
 */
export async function listVehiculos({ page = 1, limit = 20, estado_operativo, tipo_id, search } = {}) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('limit', limit)
  if (estado_operativo) params.append('estado_operativo', estado_operativo)
  if (tipo_id) params.append('tipo_id', tipo_id)
  if (search) params.append('search', search)

  const res = await api.get(`/vehiculos?${params.toString()}`)
  return res?.data?.data || res?.data || { vehiculos: [], pagination: null }
}

/**
 * Obtener vehículo por ID
 */
export async function getVehiculoById(id) {
  const res = await api.get(`/vehiculos/${id}`)
  return res?.data?.data || res?.data || null
}

/**
 * Crear nuevo vehículo
 */
export async function createVehiculo(data) {
  const res = await api.post('/vehiculos', data)
  return res?.data
}

/**
 * Actualizar vehículo
 */
export async function updateVehiculo(id, data) {
  const res = await api.put(`/vehiculos/${id}`, data)
  return res?.data
}

/**
 * Eliminar vehículo (soft delete)
 */
export async function deleteVehiculo(id) {
  const res = await api.delete(`/vehiculos/${id}`)
  return res?.data
}

/**
 * Restaurar vehículo eliminado
 */
export async function restoreVehiculo(id) {
  const res = await api.post(`/vehiculos/${id}/restore`)
  return res?.data
}

/**
 * Cambiar estado de vehículo
 */
export async function cambiarEstadoVehiculo(id, estado) {
  const res = await api.patch(`/vehiculos/${id}/estado`, { estado })
  return res?.data
}

/**
 * Obtener estadísticas de vehículos
 */
export async function getEstadisticasVehiculos() {
  const res = await api.get('/vehiculos/stats')
  return res?.data?.data || res?.data || {}
}

/**
 * Listar tipos de vehículos
 */
export async function listTiposVehiculo() {
  const res = await api.get('/vehiculos/tipos')
  return res?.data?.data || res?.data || []
}

/**
 * Listar vehículos disponibles
 */
export async function listVehiculosDisponibles() {
  const res = await api.get('/vehiculos/disponibles')
  return res?.data?.data || res?.data || []
}
