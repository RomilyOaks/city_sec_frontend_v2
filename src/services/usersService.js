import api from './api'

export async function createUser({ username, email, password, nombres, apellidos, telefono, roles, personal_seguridad_id, estado }) {
  const res = await api.post('/usuarios', {
    username,
    email,
    password,
    nombres,
    apellidos,
    telefono,
    roles,
    personal_seguridad_id,
    estado,
  })
  return res?.data
}

export async function listUsers({ page = 1, limit = 10, search = '', rol = '', estado = '', deleted = '', includeDeleted = false, onlyDeleted = false } = {}) {
  const params = {}
  if (page) params.page = page
  if (limit) params.limit = limit
  if (search) params.search = search
  if (rol) params.rol = rol
  if (estado) params.estado = estado
  if (deleted === 'all' || includeDeleted) params.includeDeleted = 1
  if (deleted === 'deleted' || onlyDeleted) params.onlyDeleted = 1

  const res = await api.get('/usuarios', { params })
  const payload = res?.data?.data || res?.data || {}
  const usuarios = payload?.usuarios || payload?.data?.usuarios || []
  const pagination = payload?.pagination || payload?.data?.pagination || null
  return { usuarios: Array.isArray(usuarios) ? usuarios : [], pagination }
}

export async function changeUserEstado(userId, estado) {
  const res = await api.patch(`/usuarios/${userId}/estado`, { estado })
  return res?.data
}

export async function deleteUser(userId) {
  const res = await api.delete(`/usuarios/${userId}`)
  return res?.data
}

export async function restoreUser(userId) {
  const res = await api.patch(`/usuarios/${userId}/restore`)
  return res?.data
}

export async function updateUser(userId, payload) {
  const res = await api.put(`/usuarios/${userId}`, payload)
  return res?.data
}

export async function getUserById(userId) {
  const res = await api.get(`/usuarios/${userId}`)
  return res?.data?.data || res?.data || null
}
