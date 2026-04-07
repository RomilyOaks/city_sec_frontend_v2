/**
 * @file accessibility.js
 * @description Utilidades de accesibilidad WCAG para CitySecure
 * @version 1.0.0
 * @date 2026-04-04
 */

/**
 * Clase principal de accesibilidad
 */
export class AccessibilityManager {
  constructor() {
    this.announcements = [];
    this.focusTrap = null;
    this.keyboardNavigation = true;
    this.currentFocus = null;
  }

  /**
   * Anunciar cambios a lectores de pantalla
   * @param {string} message - Mensaje a anunciar
   * @param {string} priority - Prioridad ('polite' o 'assertive')
   */
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remover después de que sea leído
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Configurar trap de focus dentro de un modal
   * @param {Element} container - Contenedor del modal
   */
  setupFocusTrap(container) {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.focusTrap = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', this.focusTrap);
    firstElement.focus();
  }

  /**
   * Remover trap de focus
   * @param {Element} container - Contenedor del modal
   */
  removeFocusTrap(container) {
    if (this.focusTrap && container) {
      container.removeEventListener('keydown', this.focusTrap);
      this.focusTrap = null;
    }
  }

  /**
   * Verificar contraste de colores WCAG
   * @param {string} foreground - Color foreground
   * @param {string} background - Color background
   * @returns {Object} Resultado del análisis
   */
  checkContrast(foreground, background) {
    const rgb1 = this.hexToRgb(foreground);
    const rgb2 = this.hexToRgb(background);

    const luminance1 = this.getLuminance(rgb1);
    const luminance2 = this.getLuminance(rgb2);

    const contrast = (Math.max(luminance1, luminance2) + 0.05) / (Math.min(luminance1, luminance2) + 0.05);

    return {
      ratio: contrast,
      aaLarge: contrast >= 3.0,
      aaNormal: contrast >= 4.5,
      aaaLarge: contrast >= 4.5,
      aaaNormal: contrast >= 7.0
    };
  }

  /**
   * Convertir hex a RGB
   * @param {string} hex - Color en formato hex
   * @returns {Object} Valores RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Calcular luminancia relativa
   * @param {Object} rgb - Valores RGB
   * @returns {number} Luminancia
   */
  getLuminance(rgb) {
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Verificar tamaño de fuente WCAG
   * @param {Element} element - Elemento a verificar
   * @returns {Object} Resultado del análisis
   */
  checkFontSize(element) {
    const styles = window.getComputedStyle(element);
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;

    const isBold = fontWeight === 'bold' || parseInt(fontWeight) >= 700;
    const isLarge = fontSize >= 18 || (fontSize >= 14 && isBold);

    return {
      size: fontSize,
      weight: fontWeight,
      isBold,
      isLarge,
      meetsWCAG: isLarge
    };
  }

  /**
   * Verificar que todos los elementos interactivos tengan accesibilidad
   * @param {Element} container - Contenedor a verificar
   * @returns {Array} Array de problemas encontrados
   */
  auditInteractiveElements(container = document) {
    const issues = [];
    
    // Verificar botones sin aria-label
    const buttons = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
      if (!button.textContent.trim()) {
        issues.push({
          element: button,
          type: 'missing_label',
          message: 'Botón sin texto ni aria-label'
        });
      }
    });

    // Verificar enlaces sin texto descriptivo
    const links = container.querySelectorAll('a[href]');
    links.forEach(link => {
      const text = link.textContent.trim();
      if (!text || text === 'leer más' || text === 'click aquí') {
        issues.push({
          element: link,
          type: 'poor_link_text',
          message: 'Enlace con texto poco descriptivo'
        });
      }
    });

    // Verificar imágenes sin alt
    const images = container.querySelectorAll('img:not([alt])');
    images.forEach(img => {
      issues.push({
        element: img,
        type: 'missing_alt',
        message: 'Imagen sin atributo alt'
      });
    });

    // Verificar inputs sin label
    const inputs = container.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label) {
        issues.push({
          element: input,
          type: 'missing_label',
          message: 'Input sin label asociado'
        });
      }
    });

    return issues;
  }

  /**
   * Verificar estructura de encabezados
   * @param {Element} container - Contenedor a verificar
   * @returns {Array} Array de problemas encontrados
   */
  auditHeadingStructure(container = document) {
    const issues = [];
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.substring(1));
      
      // Verificar saltos de nivel
      if (index > 0 && currentLevel > previousLevel + 1) {
        issues.push({
          element: heading,
          type: 'heading_skip',
          message: `Salto de encabezado de H${previousLevel} a H${currentLevel}`
        });
      }

      // Verificar encabezados vacíos
      if (!heading.textContent.trim()) {
        issues.push({
          element: heading,
          type: 'empty_heading',
          message: 'Encabezado sin contenido'
        });
      }

      previousLevel = currentLevel;
    });

    // Verificar que haya exactamente un H1
    const h1s = container.querySelectorAll('h1');
    if (h1s.length === 0) {
      issues.push({
        element: container,
        type: 'missing_h1',
        message: 'No se encontró encabezado H1'
      });
    } else if (h1s.length > 1) {
      issues.push({
        element: h1s[1],
        type: 'multiple_h1',
        message: 'Múltiples encabezados H1 encontrados'
      });
    }

    return issues;
  }

  /**
   * Generar reporte de accesibilidad completo
   * @param {Element} container - Contenedor a auditar
   * @returns {Object} Reporte completo
   */
  generateAccessibilityReport(container = document) {
    const interactiveIssues = this.auditInteractiveElements(container);
    const headingIssues = this.auditHeadingStructure(container);
    
    const totalIssues = interactiveIssues.length + headingIssues.length;
    const score = Math.max(0, 100 - (totalIssues * 5)); // 5 puntos por problema

    return {
      score,
      totalIssues,
      issues: {
        interactive: interactiveIssues,
        headings: headingIssues
      },
      recommendations: this.generateRecommendations(interactiveIssues, headingIssues),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generar recomendaciones basadas en problemas encontrados
   * @param {Array} interactiveIssues - Problemas interactivos
   * @param {Array} headingIssues - Problemas de encabezados
   * @returns {Array} Array de recomendaciones
   */
  generateRecommendations(interactiveIssues, headingIssues) {
    const recommendations = [];

    if (interactiveIssues.length > 0) {
      recommendations.push({
        type: 'interactive',
        priority: 'high',
        message: 'Agregar etiquetas descriptivas a todos los elementos interactivos',
        action: 'Usar aria-label, aria-labelledby o texto visible'
      });
    }

    if (headingIssues.length > 0) {
      recommendations.push({
        type: 'structure',
        priority: 'medium',
        message: 'Mejorar la estructura de encabezados',
        action: 'Usar niveles de encabezado consecutivos y asegurar un solo H1'
      });
    }

    return recommendations;
  }

  /**
   * Habilitar modo alto contraste
   */
  enableHighContrast() {
    document.body.classList.add('high-contrast');
    this.announce('Modo alto contraste activado');
  }

  /**
   * Deshabilitar modo alto contraste
   */
  disableHighContrast() {
    document.body.classList.remove('high-contrast');
    this.announce('Modo alto contraste desactivado');
  }

  /**
   * Habilitar modo reducido movimiento
   */
  enableReducedMotion() {
    document.body.classList.add('reduced-motion');
    this.announce('Modo reducido movimiento activado');
  }

  /**
   * Deshabilitar modo reducido movimiento
   */
  disableReducedMotion() {
    document.body.classList.remove('reduced-motion');
    this.announce('Modo reducido movimiento desactivado');
  }

  /**
   * Habilitar modo fuente grande
   */
  enableLargeText() {
    document.body.classList.add('large-text');
    this.announce('Modo fuente grande activado');
  }

  /**
   * Deshabilitar modo fuente grande
   */
  disableLargeText() {
    document.body.classList.remove('large-text');
    this.announce('Modo fuente grande desactivado');
  }
}

// Instancia global
export const accessibility = new AccessibilityManager();

// Auto-inicialización
if (typeof window !== 'undefined') {
  // Detectar preferencias del usuario
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

  if (prefersReducedMotion) {
    accessibility.enableReducedMotion();
  }

  if (prefersHighContrast) {
    accessibility.enableHighContrast();
  }

  // Escuchar cambios en preferencias
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) {
      accessibility.enableReducedMotion();
    } else {
      accessibility.disableReducedMotion();
    }
  });

  window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
    if (e.matches) {
      accessibility.enableHighContrast();
    } else {
      accessibility.disableHighContrast();
    }
  });
}
