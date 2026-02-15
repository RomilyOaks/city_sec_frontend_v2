/**
 * File: c:\Project\city_sec_frontend_v2\src\services\authService.js
 * @version 2.0.0
 * @description Servicio de autenticación: login, register, cambio de contraseña y obtención del usuario autenticado.
 */

import api from "./api";

/**
 * Intenta autenticar con `username_or_email` y `password`.
 * Normaliza distintos formatos de respuesta y devuelve { token, usuario }.
 * @param {{username_or_email:string, password:string}} params
 * @returns {Promise<{token:string|null, usuario:Object|null}>}
 */
export async function login({ username_or_email, password }) {
  const res = await api.post("/auth/login", { username_or_email, password });

  const payload = res?.data?.data || res?.data || {};
  const token =
    payload?.token ||
    payload?.access_token ||
    payload?.accessToken ||
    payload?.jwt ||
    payload?.data?.token ||
    payload?.data?.access_token ||
    payload?.data?.accessToken ||
    payload?.data?.jwt;

  const usuario =
    payload?.usuario ||
    payload?.user ||
    payload?.usuario_data ||
    payload?.data?.usuario ||
    payload?.data?.user ||
    payload?.data?.usuario_data;

  return { token, usuario };
}
/**
 * Obtiene el usuario autenticado (endpoint /auth/me).
 * @returns {Promise<Object>} Payload con información del usuario.
 */
export async function getMe() {
  const res = await api.get("/auth/me");
  const payload = res?.data?.data || res?.data;
  return payload;
}

/**
 * Registra un nuevo usuario en el sistema.
 * Reenvía los campos esperados por el backend y devuelve la respuesta completa.
 * @param {{username:string,email:string,password:string,nombres?:string,apellidos?:string,telefono?:string}} params
 * @returns {Promise<any>} Respuesta del endpoint de registro
 */
export async function register({
  username,
  email,
  password,
  nombres,
  apellidos,
  telefono,
}) {
  const res = await api.post("/auth/register", {
    username,
    email,
    password,
    nombres,
    apellidos,
    telefono,
  });
  return res?.data;
}
/**
 * Cambia la contraseña del usuario autenticado.
 * @param {{currentPassword:string,newPassword:string}} params
 * @returns {Promise<any>} Respuesta del endpoint
 */ export async function changePassword({ currentPassword, newPassword }) {
  const res = await api.post("/auth/change-password", {
    currentPassword,
    newPassword,
  });
  return res?.data;
}
