import api from './api'

/**
 * Listar todos los roles
 */
export async function listRoles({ incluirPermisos = false } = {}) {
  const params = new URLSearchParams()
  if (incluirPermisos) params.append('incluir_permisos', 'true')

  const res = await api.get(`/roles?${params.toString()}`)
  const payload = res?.data?.data || res?.data || {}

  const roles =
    payload?.roles ||
    payload?.data?.roles ||
    payload?.items ||
    payload?.data?.items ||
    payload?.data ||
    []

  return Array.isArray(roles) ? roles : []
}

/**
 * Obtener un rol por ID
 */
export async function getRolById(id) {
  const res = await api.get(`/roles/${id}`)
  return res?.data?.data || res?.data || null
}

/**
 * Obtener un rol por slug
 */
export async function getRolBySlug(slug) {
  const res = await api.get(`/roles/slug/${slug}`)
  return res?.data?.data || res?.data || null
}

/**
 * Crear un nuevo rol
 */
export async function createRol(data) {
  const res = await api.post('/roles', data)
  return res?.data
}

/**
 * Actualizar un rol existente
 */
export async function updateRol(id, data) {
  const res = await api.put(`/roles/${id}`, data)
  return res?.data
}

/**
 * Eliminar un rol (soft delete)
 */
export async function deleteRol(id) {
  const res = await api.delete(`/roles/${id}`)
  return res?.data
}

/**
 * Obtener permisos asignados a un rol
 */
export async function getPermisosDeRol(rolId) {
  const res = await api.get(`/roles/${rolId}/permisos`)
  return res?.data?.data || res?.data || { permisos: [] }
}

/**
 * Asignar permisos a un rol (reemplaza los existentes)
 */
export async function asignarPermisosARol(rolId, permisoIds) {
  const res = await api.post(`/roles/${rolId}/permisos`, { permisos: permisoIds })
  return res?.data
}
