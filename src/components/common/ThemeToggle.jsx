import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/useThemeStore'

/**
 * * COMPONENTE: ThemeToggle
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para cambio de tema claro/oscuro
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <ThemeToggle />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

export default function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-600/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  )
}
