/**
 * File: c:\\Project\\city_sec_frontend_v2\\src\\components\\common\\ThemeApplier.jsx
 * @version 2.0.0
 * @description Componente que aplica el tema global (añade/remueve clase dark en root).
 * Documentación educativa: añade JSDoc legible y ejemplo de uso.
 *
 * @module src/components/common/ThemeApplier.jsx
 */

import { useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore";

/**
 * ThemeApplier - Aplica tema en el elemento root
 *
 * @component
 * @category Components | Common
 * @returns {JSX.Element}
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
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  return null;
}
