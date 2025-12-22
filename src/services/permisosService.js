import api from './api'

/**
 * Obtener todos los permisos disponibles en el sistema
 */
export async function listPermisos({ page = 1, limit = 100, search = '' } = {}) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('limit', limit)
  if (search) params.append('search', search)

  const res = await api.get(`/permisos?${params.toString()}`)
  return res?.data?.data || res?.data || { permisos: [], pagination: null }
}

/**
 * Obtener permisos de un rol específico
 */
export async function getPermisosDeRol(rolId) {
  const res = await api.get(`/roles/${rolId}/permisos`)
  return res?.data?.data || res?.data || []
}

/**
 * Asignar permisos a un rol (reemplaza los existentes)
 */
export async function asignarPermisosARol(rolId, permisoIds) {
  const res = await api.post(`/roles/${rolId}/permisos`, { permisos: permisoIds })
  return res?.data
}

/**
 * Quitar un permiso específico de un rol
 */
export async function quitarPermisoDeRol(rolId, permisoId) {
  const res = await api.delete(`/roles/${rolId}/permisos/${permisoId}`)
  return res?.data
}

/**
 * Obtener permisos agrupados por módulo y recurso
 */
export async function getPermisosAgrupados() {
  const res = await api.get('/permisos?limit=500')
  const permisos = res?.data?.data?.permisos || res?.data?.permisos || []
  
  // Agrupar por módulo > recurso
  const agrupados = permisos.reduce((acc, permiso) => {
    const modulo = permiso.modulo || 'otros'
    const recurso = permiso.recurso || 'general'
    const key = `${modulo}.${recurso}`
    
    if (!acc[key]) {
      acc[key] = {
        modulo,
        recurso,
        permisos: []
      }
    }
    acc[key].permisos.push(permiso)
    return acc
  }, {})
  
  return agrupados
}
