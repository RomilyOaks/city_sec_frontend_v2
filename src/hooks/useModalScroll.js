/**
 * File: src/hooks/useModalScroll.js
 * @version 1.0.0
 * @description Hook personalizado para controlar el scroll del body cuando se abre un modal
 * @module src/hooks/useModalScroll.js
 */

import { useEffect } from 'react';

/**
 * useModalScroll
 * Hook para desactivar el scroll del body cuando un modal está abierto
 * @param {boolean} isOpen - Si el modal está abierto
 */
export const useModalScroll = (isOpen) => {
  useEffect(() => {
    // Guardar el scroll original
    const originalScrollY = window.scrollY;
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = originalStyle.overflow;
    const originalPosition = originalStyle.position;

    if (isOpen) {
      // Desactivar scroll del body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${originalScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.paddingRight = '0px'; // Prevenir jump
    } else {
      // Restaurar scroll del body
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      
      // Restaurar posición del scroll
      window.scrollTo(0, originalScrollY);
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
      window.scrollTo(0, originalScrollY);
    };
  }, [isOpen]);
};
