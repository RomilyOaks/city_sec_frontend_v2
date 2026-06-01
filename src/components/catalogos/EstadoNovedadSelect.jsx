import { useEstadosPorRol } from "../../hooks/useEstadosPorRol.js";

/**
 * Select reutilizable de estados de novedad filtrado por el rol del usuario autenticado.
 * Consume el hook useEstadosPorRol() — solo muestra los estados habilitados para el rol actual.
 *
 * @param {string}   value       - ID del estado seleccionado
 * @param {Function} onChange    - Callback (e) => void
 * @param {string}   placeholder - Texto de la opción vacía (default: "Todos los estados")
 * @param {string}   className   - Clases Tailwind adicionales
 * @param {boolean}  disabled    - Deshabilita el select
 */
export function EstadoNovedadSelect({
  value,
  onChange,
  placeholder = "Todos los estados",
  className = "",
  disabled = false,
}) {
  const { estadosRol, loadingEstadosRol } = useEstadosPorRol();

  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled || loadingEstadosRol}
      className={`text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 px-2 py-1.5 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <option value="">
        {loadingEstadosRol ? "Cargando..." : placeholder}
      </option>
      {estadosRol.map((e) => (
        <option key={e.id} value={e.id}>
          {e.nombre}
        </option>
      ))}
    </select>
  );
}
