/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\rbac\\rbac.js
 * @version 2.0.0
 * @description Reglas simples de RBAC utilizadas por la aplicación para controlar rutas y acciones.
 * Expone constantes y helpers para verificar roles y permisos de usuario.
 * @module src/rbac/rbac.js
 */

export const ROLE_SLUGS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  OPERADOR: "operador",
  SUPERVISOR: "supervisor",
  CONSULTA: "consulta",
  USUARIO_BASICO: "usuario_basico",
};

// Mapeo de rutas a roles permitidos (fallback si no hay permisos)
export const ROUTE_ACCESS = {
  dashboard: Object.values(ROLE_SLUGS),
  admin_usuarios: [ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.ADMIN],
  admin_roles: [ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.ADMIN],
  personal: [ROLE_SLUGS.SUPER_ADMIN, ROLE_SLUGS.ADMIN],
  vehiculos: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
    ROLE_SLUGS.CONSULTA,
  ],
  novedades: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
    ROLE_SLUGS.CONSULTA,
  ],
  calles: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
    ROLE_SLUGS.CONSULTA,
  ],
  calles_tipos_via: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
  ],
  calles_sectores_cuadrantes: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
  ],
  calles_calles_cuadrantes: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
  ],
  calles_direcciones: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
    ROLE_SLUGS.CONSULTA,
  ],
  operativos_turnos: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
    ROLE_SLUGS.CONSULTA,
  ],
  operativos_vehiculos: [
    ROLE_SLUGS.SUPER_ADMIN,
    ROLE_SLUGS.ADMIN,
    ROLE_SLUGS.SUPERVISOR,
    ROLE_SLUGS.OPERADOR,
    ROLE_SLUGS.CONSULTA,
  ],
};

// Mapeo de rutas a permisos requeridos (del backend)
export const ROUTE_PERMISSIONS = {
  admin_usuarios: ["usuarios.usuarios.read"],
  admin_roles: ["usuarios.roles.read"],
  personal: ["personal.personal.read"],
  vehiculos: ["vehiculos.vehiculos.read"],
  novedades: ["novedades.incidentes.read", "novedades.novedades.read", "catalogos.tipos_novedad.read", "catalogos.subtipos_novedad.read"],
  calles: ["calles.calles.read"],
  calles_tipos_via: ["calles.tipos.via.read"],
  calles_sectores_cuadrantes: ["calles.sectores.read", "calles.cuadrantes.read"],
  calles_calles_cuadrantes: ["calles.calles.cuadrantes.read"],
  calles_direcciones: ["calles.direcciones.read"],
  operativos_turnos: ["operativos.turnos.read"],
  reportes: [
    "reportes.novedades.read",
    "reportes.personal.read",
    "reportes.vehiculos.read",
  ],
  auditoria: ["auditoria.logs.read", "auditoria.registros.read"],
};

// Permisos para acciones específicas
export const ACTION_PERMISSIONS = {
  // Usuarios
  usuarios_create: ["usuarios.usuarios.create"],
  usuarios_update: ["usuarios.usuarios.update"],
  usuarios_delete: ["usuarios.usuarios.delete"],
  usuarios_update_estado: [
    "usuarios.usuarios.update_estado",
    "usuarios.usuarios.update",
  ],
  usuarios_reset_password: ["usuarios.reset_password.execute"],

  // Roles
  roles_create: ["usuarios.roles.create"],
  roles_update: ["usuarios.roles.update"],
  roles_delete: ["usuarios.roles.delete"],
  roles_assign_permisos: ["usuarios.roles_permisos.assign"],

  // Personal
  personal_create: ["personal.personal.create"],
  personal_update: ["personal.personal.update"],
  personal_delete: ["personal.personal.delete"],

  // Vehículos
  vehiculos_create: ["vehiculos.vehiculos.create"],
  vehiculos_update: ["vehiculos.vehiculos.update"],
  vehiculos_delete: ["vehiculos.vehiculos.delete"],

  // Novedades
  novedades_create: ["novedades.incidentes.create"],
  novedades_update: ["novedades.incidentes.update"],
  novedades_delete: ["novedades.incidentes.delete"],
  novedades_atender: ["novedades.incidentes.atender"],

  // Calles
  calles_create: ["calles.calles.create"],
  calles_update: ["calles.calles.update"],
  calles_delete: ["calles.calles.delete"],

  // Tipos de Vía
  tipos_via_create: ["calles.tipos.via.create"],
  tipos_via_update: ["calles.tipos.via.update"],
  tipos_via_delete: ["calles.tipos.via.delete"],

  // Sectores
  sectores_create: ["calles.sectores.create"],
  sectores_update: ["calles.sectores.update"],
  sectores_delete: ["calles.sectores.delete"],

  // Cuadrantes
  cuadrantes_create: ["calles.cuadrantes.create"],
  cuadrantes_update: ["calles.cuadrantes.update"],
  cuadrantes_delete: ["calles.cuadrantes.delete"],

  // Calles-Cuadrantes
  calles_cuadrantes_create: ["calles.calles.cuadrantes.create"],
  calles_cuadrantes_update: ["calles.calles.cuadrantes.update"],
  calles_cuadrantes_delete: ["calles.calles.cuadrantes.delete"],

  // Direcciones
  direcciones_create: ["calles.direcciones.create"],
  direcciones_update: ["calles.direcciones.update"],
  direcciones_delete: ["calles.direcciones.delete"],
  direcciones_geocodificar: ["calles.direcciones.geocodificar", "calles.direcciones.update"],

  // Operativos de Turno
  operativos_turnos_create: ["operativos.turnos.create"],
  operativos_turnos_update: ["operativos.turnos.update"],
  operativos_turnos_delete: ["operativos.turnos.delete"],

  // Operativos Vehículos
  operativos_vehiculos_create: ["operativos.vehiculos.create"],
  operativos_vehiculos_update: ["operativos.vehiculos.update"],
  operativos_vehiculos_delete: ["operativos.vehiculos.delete"],

  // Catálogos - Unidades/Oficinas
  "catalogos.unidades.create": ["catalogos.unidades.create"],
  "catalogos.unidades.update": ["catalogos.unidades.update"],
  "catalogos.unidades.delete": ["catalogos.unidades.delete"],

  // Catálogos - Radios TETRA
  "catalogos.radios_tetra.create": ["catalogos.radios_tetra.create"],
  "catalogos.radios_tetra.update": ["catalogos.radios_tetra.update"],
  "catalogos.radios_tetra.delete": ["catalogos.radios_tetra.delete"],
  "catalogos.radios_tetra.asignar": ["catalogos.radios_tetra.asignar"],

  // Catálogos - Tipos/Subtipos de Novedad
  "catalogos.tipos_novedad.create": ["catalogos.tipos_novedad.create"],
  "catalogos.tipos_novedad.update": ["catalogos.tipos_novedad.update"],
  "catalogos.tipos_novedad.delete": ["catalogos.tipos_novedad.delete"],
  "catalogos.subtipos_novedad.create": ["catalogos.subtipos_novedad.create"],
  "catalogos.subtipos_novedad.update": ["catalogos.subtipos_novedad.update"],
  "catalogos.subtipos_novedad.delete": ["catalogos.subtipos_novedad.delete"],
};

export function getUserRoleSlugs(user) {
  const roles = user?.roles || user?.Roles || [];
  return roles
    .map((r) => r?.slug || r?.Slug || r?.nombre || r?.name)
    .filter(Boolean);
}

export function getUserPermisos(user) {
  const permisos = user?.permisos || [];
  // Extraer los slug de los objetos de permisos
  return permisos.map(p => p?.slug || p).filter(Boolean);
}

export function isSuperAdmin(user) {
  const roles = getUserRoleSlugs(user);
  return roles.includes(ROLE_SLUGS.SUPER_ADMIN);
}

// Verificar acceso a ruta por permisos (preferido) o roles (fallback)
export function canAccessRoute(user, routeKey) {
  // super_admin y admin siempre tienen acceso
  if (isSuperAdmin(user)) return true;
  const userRoles = getUserRoleSlugs(user);
  if (userRoles.includes(ROLE_SLUGS.ADMIN)) return true;

  // Verificar permisos del backend si el usuario los tiene cargados
  const userPermisos = getUserPermisos(user);
  const requiredPermisos = ROUTE_PERMISSIONS[routeKey];

  if (
    requiredPermisos &&
    requiredPermisos.length > 0 &&
    userPermisos &&
    userPermisos.length > 0
  ) {
    // Usuario tiene permisos cargados, verificar contra ellos
    return requiredPermisos.some((p) => userPermisos.includes(p));
  }

  // Fallback a roles si no hay permisos cargados o no hay permisos definidos para la ruta
  const allowedRoles = ROUTE_ACCESS[routeKey] || [];
  if (allowedRoles.length === 0) return true;
  return userRoles.some((r) => allowedRoles.includes(r));
}

// Verificar si puede realizar una acción específica
export function canPerformAction(user, actionKey) {
  // super_admin siempre puede
  if (isSuperAdmin(user)) return true;

  const requiredPermisos = ACTION_PERMISSIONS[actionKey];
  if (!requiredPermisos || requiredPermisos.length === 0) return true;

  const userPermisos = getUserPermisos(user);
  return requiredPermisos.some((p) => userPermisos.includes(p));
}
