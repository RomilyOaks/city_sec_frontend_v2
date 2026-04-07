/**
 * @file performance.js
 * @description Utilidades de optimización de rendimiento para CitySecure
 * @version 1.0.0
 * @date 2026-04-04
 */

/**
 * Función debounce para optimizar eventos frecuentes
 * @param {Function} func - Función a deboundear
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función deboundeada
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Función throttle para limitar ejecución de eventos
 * @param {Function} func - Función a throttlear
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función throttled
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Lazy loading para imágenes
 * @param {string} selector - Selector CSS de imágenes
 */
export function lazyLoadImages(selector = 'img[data-src]') {
  const images = document.querySelectorAll(selector);
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

/**
 * Optimización de scroll con requestAnimationFrame
 * @param {Function} callback - Función de scroll
 * @returns {Function} Función optimizada
 */
export function optimizedScroll(callback) {
  let ticking = false;
  
  return function() {
    if (!ticking) {
      requestAnimationFrame(() => {
        callback();
        ticking = false;
      });
      ticking = true;
    }
  };
}

/**
 * Medición de rendimiento de componentes
 * @param {string} name - Nombre del componente
 * @param {Function} fn - Función a medir
 * @returns {*} Resultado de la función
 */
export function measurePerformance(name, fn) {
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`🚀 [Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  }
  return fn();
}

/**
 * Memoización de resultados costosos
 * @param {Function} fn - Función a memoizar
 * @returns {Function} Función memoizada
 */
export function memoize(fn) {
  const cache = new Map();
  
  return function(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Detección de conexión lenta
 * @returns {boolean} True si la conexión es lenta
 */
export function isSlowConnection() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) return false;
  
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.effectiveType === '3g' ||
    connection.saveData === true
  );
}

/**
 * Optimización de animaciones según dispositivo
 * @returns {boolean} True si se deben reducir animaciones
 */
export function shouldReduceAnimations() {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    isSlowConnection()
  );
}

/**
 * Precarga de componentes críticos
 * @param {Array<string>} components - Array de nombres de componentes
 */
export function preloadComponents(components) {
  components.forEach(component => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/components/${component}.jsx`;
    document.head.appendChild(link);
  });
}

/**
 * Limpieza de event listeners para evitar memory leaks
 * @param {Element} element - Elemento DOM
 * @param {string} event - Tipo de evento
 * @param {Function} handler - Handler del evento
 */
export function removeEventListener(element, event, handler) {
  element.removeEventListener(event, handler);
}

/**
 * Optimización de re-renders con React.memo
 * @param {Function} Component - Componente React
 * @param {Function} areEqual - Función de comparación
 * @returns {Function} Componente memoizado
 */
export function createMemoizedComponent(Component, areEqual) {
  // Import dinámico para evitar error de React no definido
  if (typeof window !== 'undefined') {
    try {
      // eslint-disable-next-line no-undef
      const React = require('react');
      return React.memo(Component, areEqual);
    } catch {
      console.warn('React no disponible para memoización');
      return Component;
    }
  }
  return Component;
}
