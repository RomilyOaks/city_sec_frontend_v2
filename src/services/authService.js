import api from './api'
import { DEBUG } from '../config/constants'

export async function login({ username_or_email, password }) {
  const res = await api.post('/auth/login', { username_or_email, password })
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('[authService.login] raw response', res?.data)
  }

  const payload = res?.data?.data || res?.data || {}
  const token =
    payload?.token ||
    payload?.access_token ||
    payload?.accessToken ||
    payload?.jwt ||
    payload?.data?.token ||
    payload?.data?.access_token ||
    payload?.data?.accessToken ||
    payload?.data?.jwt

  const usuario =
    payload?.usuario ||
    payload?.user ||
    payload?.usuario_data ||
    payload?.data?.usuario ||
    payload?.data?.user ||
    payload?.data?.usuario_data

  return { token, usuario }
}

export async function getMe() {
  const res = await api.get('/auth/me')
  const payload = res?.data?.data || res?.data
  return payload
}

export async function register({ username, email, password, nombres, apellidos, telefono }) {
  const res = await api.post('/auth/register', {
    username,
    email,
    password,
    nombres,
    apellidos,
    telefono,
  })
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('[authService.register] raw response', res?.data)
  }
  return res?.data
}

export async function changePassword({ currentPassword, newPassword }) {
  const res = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return res?.data
}
