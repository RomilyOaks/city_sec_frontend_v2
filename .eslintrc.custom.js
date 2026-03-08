/**
 * Regla ESLint personalizada para prevenir uso directo de fechas
 * Archivo: .eslintrc.custom.js
 */

module.exports = {
  // Regla personalizada para detectar uso directo de Date
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.name="toISOString"]',
        message: 'Usa dateHelper en lugar de toISOString(). Ver: src/docs/dateHelper-usage-guide.md'
      },
      {
        selector: 'CallExpression[callee.property.name="toLocaleString"]',
        message: 'Usa formatForDisplay() del dateHelper. Ver: src/docs/dateHelper-usage-guide.md'
      },
      {
        selector: 'NewExpression[callee.name="Date"]',
        message: 'Usa getNowLocal() del dateHelper para fecha actual. Ver: src/docs/dateHelper-usage-guide.md'
      }
    ]
  }
};
