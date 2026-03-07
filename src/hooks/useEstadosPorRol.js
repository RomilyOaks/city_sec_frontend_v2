/**
 * Hook: useEstadosPorRol
 * @description Obtiene los estados de novedad habilitados para el rol del usuario autenticado.
 * Consume GET /api/v1/rol-estados-novedad/rol/:rolId/estados
 * Cachea el resultado por rolId para evitar llamadas repetidas durante la sesión.
 */

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { getEstadosByRol } from "../services/rolEstadosNovedadService";

const cache = new Map();

/**
 * Extrae el id del primer rol del usuario autenticado.
 * El objeto user.roles es un array de { id, nombre, slug, ... }
 */
function getPrimaryRolId(user) {
  const roles = user?.roles || user?.Roles || [];
  return roles[0]?.id ?? null;
}

/**
 * @returns {{
 *   estadosRol: Array,       // estados habilitados para el rol del usuario
 *   loadingEstadosRol: boolean,
 *   rolId: number|null,
 *   refetch: Function        // fuerza recarga ignorando caché
 * }}
 */
export function useEstadosPorRol() {
  const user = useAuthStore((s) => s.user);
  const rolId = getPrimaryRolId(user);

  const [estadosRol, setEstadosRol] = useState([]);
  const [loadingEstadosRol, setLoadingEstadosRol] = useState(false);
  const abortRef = useRef(null);

  const load = async (forceRefresh = false) => {
    if (!rolId) {
      setEstadosRol([]);
      return;
    }

    if (!forceRefresh && cache.has(rolId)) {
      setEstadosRol(cache.get(rolId));
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoadingEstadosRol(true);
    try {
      const res = await getEstadosByRol(rolId);
      const data = Array.isArray(res?.data) ? res.data : [];
      cache.set(rolId, data);
      setEstadosRol(data);
    } catch {
      setEstadosRol([]);
    } finally {
      setLoadingEstadosRol(false);
    }
  };

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [rolId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    estadosRol,
    loadingEstadosRol,
    rolId,
    refetch: () => load(true),
  };
}
