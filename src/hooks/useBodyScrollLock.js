/**
 * File: src/hooks/useBodyScrollLock.js
 * @version 1.0.0
 * @description Hook para bloquear el scroll del body cuando un modal está abierto
 * @module src/hooks/useBodyScrollLock
 */

import { useEffect } from "react";

/**
 * useBodyScrollLock - Bloquea el scroll del body cuando isLocked es true
 *
 * @param {boolean} isLocked - Si debe bloquear el scroll
 */
export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (isLocked) {
      // Guardar el overflow actual
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow || "";
      };
    }
  }, [isLocked]);
}
