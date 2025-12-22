import api from './api'

/**
 * Obtener lista de cargos
 */
export async function listCargos() {
  const res = await api.get('/cargos?activos=true')
  console.log('Cargos response:', res?.data)
  const cargos = res?.data?.data?.cargos || res?.data?.cargos || res?.data?.data || res?.data || []
  console.log('Cargos parsed:', cargos)
  return cargos
}

/**
 * Obtener departamentos
 */
export async function listDepartamentos() {
  const res = await api.get('/catalogos/departamentos')
  return res?.data?.data || res?.data || []
}

/**
 * Buscar ubigeos
 */
export async function buscarUbigeo({ search, departamento, provincia } = {}) {
  const params = new URLSearchParams()
  if (search) params.append('search', search)
  if (departamento) params.append('departamento', departamento)
  if (provincia) params.append('provincia', provincia)
  
  const res = await api.get(`/catalogos/ubigeo?${params.toString()}`)
  return res?.data?.data || res?.data || []
}

/**
 * Obtener tipos de novedad
 */
export async function listTiposNovedad() {
  const res = await api.get('/catalogos/tipos-novedad')
  return res?.data?.data || res?.data || []
}

/**
 * Obtener estados de novedad
 */
export async function listEstadosNovedad() {
  const res = await api.get('/catalogos/estados-novedad')
  return res?.data?.data || res?.data || []
}

/**
 * Obtener tipos de vehículo
 */
export async function listTiposVehiculo() {
  try {
    const res = await api.get('/catalogos/tipos-vehiculo')
    console.log('TiposVehiculo raw response:', res)
    console.log('TiposVehiculo response.data:', res?.data)
    // Backend devuelve { success: true, data: [...] }
    const tipos = res?.data?.data || res?.data || []
    console.log('TiposVehiculo parsed:', tipos)
    return Array.isArray(tipos) ? tipos : []
  } catch (err) {
    console.error('Error cargando tipos de vehículo:', err?.response?.data || err)
    return []
  }
}

/**
 * Obtener unidades/oficinas
 */
export async function listUnidades() {
  try {
    const res = await api.get('/catalogos/unidades')
    console.log('Unidades response:', res?.data)
    const unidades = res?.data?.data?.unidades || res?.data?.unidades || res?.data?.data || res?.data || []
    console.log('Unidades parsed:', unidades)
    return Array.isArray(unidades) ? unidades : []
  } catch (err) {
    console.error('Error cargando unidades:', err)
    return []
  }
}
