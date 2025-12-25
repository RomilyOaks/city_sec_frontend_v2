/**
 * File: c:\Project\city_sec_frontend_v2\src\services\api.js
 * @version 2.0.0
 * @description Central axios instance configured for CitySecure API calls. Handles
 *  Authorization header injection from `useAuthStore` and global error handling
 *  (e.g., automatic logout on 401 responses). Keep pure transport logic here.
 */

import axios from "axios";

import { API_URL, DEBUG } from "../config/constants";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Axios instance used across the application.
 * - baseURL is taken from `API_URL` config
 * - default JSON content type applied
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
/**
 * Request interceptor
 * - Logs request details when DEBUG is enabled
 * - Injects Authorization header from the auth store when a token is present
 * @param {import('axios').AxiosRequestConfig} config
 * @returns {import('axios').AxiosRequestConfig}
 */ api.interceptors.request.use((config) => {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.debug("[api] request", {
      baseURL: config.baseURL,
      url: config.url,
      method: config.method,
    });
  }

  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor
 * - Logs errors when DEBUG is enabled
 * - Triggers global logout on 401 responses
 * @param {import('axios').AxiosResponse} response
 * @param {any} error
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.debug("[api] error", {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        url: error?.config?.url,
        baseURL: error?.config?.baseURL,
      });
    }

    const status = error?.response?.status;
    if (status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
