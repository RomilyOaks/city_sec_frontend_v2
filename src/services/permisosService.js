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
