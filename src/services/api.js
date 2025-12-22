import axios from 'axios'

import { API_URL, DEBUG } from '../config/constants'
import { useAuthStore } from '../store/useAuthStore'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.debug('[api] request', {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
    })
  }

  const token = useAuthStore.getState().token
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug('[api] error', {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      })
    }

    const status = error?.response?.status
    if (status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  },
)

export default api
