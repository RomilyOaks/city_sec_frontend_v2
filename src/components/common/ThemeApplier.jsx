import { useEffect } from 'react'
import { useThemeStore } from '../../store/useThemeStore'

/**
 * * COMPONENTE: ThemeApplier
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para aplicación del tema global
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <ThemeApplier />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

/**
 * * COMPONENTE: ThemeApplier
 * 
 * @component
 * @category General
 * @description Componente de CitySecure para aplicación del tema global
 * 
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 * 
 * @example
 * <ThemeApplier />
 * 
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */

export default function ThemeApplier() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return null
}
