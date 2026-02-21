/**
 * File: c:\Project\city_sec_frontend_v2\src\services\api.js
 * @version 2.0.0
 * @description Central axios instance configured for CitySecure API calls. Handles
 *  Authorization header injection from `useAuthStore` and global error handling
 *  (e.g., automatic logout on 401 responses). Keep pure transport logic here.
 */

import axios from "axios";

import { API_URL } from "../config/constants";
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
 * - Injects auth token into all outgoing requests
 * @param {import('axios').InternalAxiosRequestConfig} config
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor
 * - Triggers global logout on 401 responses
 * @param {import('axios').AxiosResponse} response
 * @param {any} error
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    
    if (status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
