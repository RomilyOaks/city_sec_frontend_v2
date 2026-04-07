/**
 * @file browserCompatibility.js
 * @description Utilidades de compatibilidad cross-browser para CitySecure
 * @version 1.0.0
 * @date 2026-04-04
 */

/**
 * Detección de navegador y características
 */
export const browserDetection = {
  // Detectar navegador
  getBrowser() {
    const userAgent = navigator.userAgent;
    
    if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
    if (userAgent.indexOf('Safari') > -1) return 'Safari';
    if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
    if (userAgent.indexOf('Edge') > -1) return 'Edge';
    if (userAgent.indexOf('Opera') > -1) return 'Opera';
    
    return 'Unknown';
  },
  
  // Detectar versión
  getBrowserVersion() {
    const userAgent = navigator.userAgent;
    const browser = this.getBrowser();
    
    switch (browser) {
      case 'Chrome':
        return userAgent.match(/Chrome\/(\d+)/)?.[1];
      case 'Safari':
        return userAgent.match(/Version\/(\d+)/)?.[1];
      case 'Firefox':
        return userAgent.match(/Firefox\/(\d+)/)?.[1];
      case 'Edge':
        return userAgent.match(/Edge\/(\d+)/)?.[1];
      default:
        return 'Unknown';
    }
  },
  
  // Detectar dispositivo móvil
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
  
  // Detectar tablet
  isTablet() {
    return /(iPad|Android|webOS|BlackBerry|PlayBook)/i.test(navigator.userAgent) && !this.isMobile();
  },
  
  // Detectar soporte de características
  supportsCSSGrid() {
    return CSS.supports('display', 'grid');
  },
  
  supportsFlexbox() {
    return CSS.supports('display', 'flex');
  },
  
  supportsCustomProperties() {
    return CSS.supports('color', 'var(--test)');
  },
  
  supportsBackdropFilter() {
    return CSS.supports('backdrop-filter', 'blur(10px)');
  },
  
  supportsIntersectionObserver() {
    return 'IntersectionObserver' in window;
  },
  
  supportsResizeObserver() {
    return 'ResizeObserver' in window;
  },
  
  supportsWebP() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },
  
  supportsAVIF() {
    const canvas = document.createElement('canvas');
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }
};

/**
 * Polyfills para características faltantes
 */
export const polyfills = {
  // Polyfill para IntersectionObserver
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver no soportado, usando polyfill');
      // Cargar polyfill dinámicamente si es necesario
      return false;
    }
    return true;
  },
  
  // Polyfill para ResizeObserver
  setupResizeObserver() {
    if (!('ResizeObserver' in window)) {
      console.warn('ResizeObserver no soportado, usando polyfill');
      return false;
    }
    return true;
  },
  
  // Polyfill para CSS Custom Properties en navegadores antiguos
  setupCustomProperties() {
    if (!browserDetection.supportsCustomProperties()) {
      console.warn('CSS Custom Properties no soportadas');
      // Aplicar fallbacks con JavaScript
      return false;
    }
    return true;
  }
};

/**
 * Optimizaciones específicas por navegador
 */
export const browserOptimizations = {
  // Optimizaciones para Chrome
  chrome() {
    // Chrome soporta todas las características modernas
    return {
      useHardwareAcceleration: true,
      useWebWorkers: true,
      useServiceWorkers: true,
      optimizeImages: true
    };
  },
  
  // Optimizaciones para Safari
  safari() {
    const version = parseInt(browserDetection.getBrowserVersion());
    
    return {
      useHardwareAcceleration: version >= 12,
      useWebWorkers: version >= 10,
      useServiceWorkers: version >= 11,
      optimizeImages: true,
      // Safari necesita optimización específica para scroll
      smoothScroll: version >= 14,
      // Safari tiene problemas con backdrop-filter en versiones antiguas
      useBackdropFilter: version >= 12
    };
  },
  
  // Optimizaciones para Firefox
  firefox() {
    return {
      useHardwareAcceleration: true,
      useWebWorkers: true,
      useServiceWorkers: true,
      optimizeImages: true,
      // Firefox necesita optimización para animaciones CSS
      reduceAnimations: false
    };
  },
  
  // Optimizaciones para Edge
  edge() {
    const version = parseInt(browserDetection.getBrowserVersion());
    
    return {
      useHardwareAcceleration: version >= 79, // Edge basado en Chromium
      useWebWorkers: version >= 79,
      useServiceWorkers: version >= 79,
      optimizeImages: true
    };
  },
  
  // Optimizaciones para móviles
  mobile() {
    return {
      useHardwareAcceleration: false, // Puede causar problemas en móviles antiguos
      useWebWorkers: false, // Puede consumir mucha batería
      useServiceWorkers: true,
      optimizeImages: true,
      // Reducir animaciones para ahorrar batería
      reduceAnimations: true,
      // Optimizar touch events
      optimizeTouch: true
    };
  }
};

/**
 * Función principal de configuración cross-browser
 */
export function setupBrowserCompatibility() {
  const browser = browserDetection.getBrowser();
  const isMobile = browserDetection.isMobile();
  
  console.log(`🌐 [Browser] Detectado: ${browser} ${browserDetection.getBrowserVersion()}`);
  console.log(`📱 [Device] Móvil: ${isMobile}, Tablet: ${browserDetection.isTablet()}`);
  
  // Configurar polyfills
  polyfills.setupIntersectionObserver();
  polyfills.setupResizeObserver();
  polyfills.setupCustomProperties();
  
  // Aplicar optimizaciones específicas
  let optimizations;
  
  if (isMobile) {
    optimizations = browserOptimizations.mobile();
  } else {
    switch (browser) {
      case 'Chrome':
        optimizations = browserOptimizations.chrome();
        break;
      case 'Safari':
        optimizations = browserOptimizations.safari();
        break;
      case 'Firefox':
        optimizations = browserOptimizations.firefox();
        break;
      case 'Edge':
        optimizations = browserOptimizations.edge();
        break;
      default:
        optimizations = browserOptimizations.chrome(); // Fallback
    }
  }
  
  // Aplicar optimizaciones
  if (optimizations.reduceAnimations) {
    document.body.classList.add('reduce-animations');
  }
  
  if (!optimizations.useHardwareAcceleration) {
    document.body.style.transform = 'translateZ(0)'; // Forzar software rendering
  }
  
  if (optimizations.optimizeTouch) {
    document.body.classList.add('touch-optimized');
  }
  
  console.log('⚡ [Performance] Optimizaciones aplicadas:', optimizations);
  
  return optimizations;
}

/**
 * Testing de características en tiempo real
 */
export function testBrowserFeatures() {
  const features = {
    cssGrid: browserDetection.supportsCSSGrid(),
    flexbox: browserDetection.supportsFlexbox(),
    customProperties: browserDetection.supportsCustomProperties(),
    backdropFilter: browserDetection.supportsBackdropFilter(),
    intersectionObserver: browserDetection.supportsIntersectionObserver(),
    resizeObserver: browserDetection.supportsResizeObserver(),
    webp: browserDetection.supportsWebP(),
    avif: browserDetection.supportsAVIF()
  };
  
  console.table(features);
  return features;
}
