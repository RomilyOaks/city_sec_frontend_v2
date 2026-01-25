/**
 * File: src/utils/usuarioUtils.js
 * @version 1.0.0
 * @description Utilidades para formatear datos de usuario
 * @module src/utils/usuarioUtils.js
 */

/**
 * Formatea usuario completo con username y nombres
 * @param {Object} usuario - Objeto de usuario
 * @returns {string} - Formato: "username (Nombres Apellidos)"
 */
export const formatUsuarioCompleto = (usuario) => {
  if (!usuario) return 'No asignado';
  
  if (usuario.nombres && usuario.apellidos) {
    return `${usuario.username} (${usuario.nombres} ${usuario.apellidos})`;
  }
  
  return usuario.username || 'Usuario desconocido';
};

/**
 * Formatea usuario corto (solo username)
 * @param {Object} usuario - Objeto de usuario
 * @returns {string} - Username o 'N/A'
 */
export const formatUsuarioCorto = (usuario) => {
  if (!usuario) return 'N/A';
  return usuario.username || 'Desconocido';
};

/**
 * Obtiene iniciales del usuario
 * @param {Object} usuario - Objeto de usuario
 * @returns {string} - Iniciales en mayúsculas
 */
export const getIniciales = (usuario) => {
  if (!usuario || !usuario.nombres) return '??';
  
  const nombres = usuario.nombres.split(' ')[0];
  const apellidos = usuario.apellidos ? usuario.apellidos.split(' ')[0] : '';
  
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
};
