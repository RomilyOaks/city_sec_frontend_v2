# 📚 Script de Documentación Automática - CitySecure Frontend

Script automatizado para generar documentación JSDoc en todo el proyecto React de CitySecure.

## 🎯 ¿Qué hace este script?

1. **Escanea automáticamente** todos los archivos `.js` y `.jsx` del proyecto
2. **Detecta y documenta**:

   - ✅ Componentes React
   - ✅ Funciones de servicios API
   - ✅ Stores de Zustand
   - ✅ Archivos de configuración
   - ✅ Funciones exportadas

3. **Genera documentación JSDoc** completa con:

   - Descripción del componente/función
   - Parámetros y tipos
   - Valores de retorno
   - Ejemplos de uso
   - Tags de Better Comments (\*, !, TODO:, ?)

4. **Crea un reporte** con estadísticas de documentación generada

## 📋 Requisitos Previos

- Node.js instalado (versión 14 o superior)
- Proyecto debe tener estructura de módulos ES6 (import/export)

## 🚀 Instalación

### Paso 1: Copiar el script

Coloca el archivo `auto-document.js` en la **raíz de tu proyecto** (mismo nivel que `package.json`):

```
city_sec_frontend_v2/
├── auto-document.js     ← Aquí
├── package.json
├── src/
└── ...
```

### Paso 2: Hacer una copia de seguridad (RECOMENDADO)

Antes de ejecutar el script, haz un commit o copia de seguridad:

```bash
git add .
git commit -m "Backup antes de documentación automática"
```

O simplemente copia la carpeta `src/` a un lugar seguro.

## ▶️ Uso

### Ejecutar el script:

```bash
node auto-document.js
```

### Salida esperada:

```
🚀 Iniciando documentación automática de CitySecure Frontend...

📂 Escaneando: src/components/
✅ Documentado: src/components/common/ThemeToggle.jsx
✅ Documentado: src/components/MapaIncidentes.jsx

📂 Escaneando: src/pages/
✅ Documentado: src/pages/auth/LoginPage.jsx
✅ Documentado: src/pages/dashboard/DashboardPage.jsx

📂 Escaneando: src/services/
✅ Documentado: src/services/authService.js
✅ Documentado: src/services/personalService.js

📂 Escaneando: src/store/
✅ Documentado: src/store/useAuthStore.js

============================================================
📊 REPORTE DE DOCUMENTACIÓN - CITYSECURE FRONTEND
============================================================

📁 Archivos escaneados: 32
✏️  Archivos modificados: 18
🎨 Componentes documentados: 15
⚙️  Funciones documentadas: 24
📦 Stores documentados: 2

============================================================
✨ Documentación completada!
============================================================

📄 Reporte guardado en: documentation-report.txt
```

## 📝 Ejemplo de Documentación Generada

### Antes:

```javascript
export const PersonalPage = () => {
  return <div>Personal Dashboard</div>;
};
```

### Después:

```javascript
/**
 * * COMPONENTE: PersonalPage
 *
 * @component
 * @category Pages
 * @description Componente de CitySecure para gestión de personal de seguridad
 *
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Elemento React renderizado
 *
 * @example
 * <PersonalPage />
 *
 * TODO: Documentar props específicas
 * TODO: Agregar PropTypes o validación de tipos
 */
export const PersonalPage = () => {
  return <div>Personal Dashboard</div>;
};
```

## 🎨 Integración con Better Comments

El script genera tags compatibles con **Better Comments**:

- `* COMPONENTE:` - Verde (destacado)
- `! IMPORTANTE:` - Rojo (alertas)
- `TODO:` - Naranja (tareas pendientes)
- `? Pregunta` - Azul (dudas)

## 📊 Reporte Generado

El script crea un archivo `documentation-report.txt` con:

- Total de archivos escaneados
- Archivos modificados
- Componentes, funciones y stores documentados
- Lista de errores (si los hay)

## ⚙️ Configuración Personalizada

Puedes modificar el script para ajustar:

### Directorios a escanear:

```javascript
const DIRECTORIES_TO_SCAN = [
  "components",
  "pages",
  "services",
  "store",
  // Agrega más directorios aquí
];
```

### Extensiones de archivo:

```javascript
const FILE_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
```

## ⚠️ Importante

1. **No documenta archivos ya documentados**: El script detecta si ya existe JSDoc y no lo sobrescribe
2. **Solo agrega JSDoc**: No modifica tu código funcional
3. **Respeta formato**: Mantiene la indentación y estructura original
4. **Idempotente**: Puedes ejecutarlo múltiples veces sin problema

## 🔍 Solución de Problemas

### Error: "No se encuentra el directorio src/"

- Asegúrate de ejecutar el script desde la raíz del proyecto
- Verifica que la carpeta `src/` existe

### El script no documenta un archivo específico

- Verifica que el archivo tenga extensión `.js` o `.jsx`
- Confirma que el archivo usa sintaxis ES6 (import/export)
- Revisa si ya tiene documentación JSDoc

### Errores de sintaxis

- El script crea un reporte con los errores encontrados
- Revisa `documentation-report.txt` para detalles

## 🎓 Siguiente Paso

Después de ejecutar el script:

1. **Revisa los archivos documentados** con VSCode
2. **Personaliza los TODOs** generados según necesites
3. **Completa las descripciones** de parámetros específicos
4. **Agrega PropTypes** o TypeScript donde sea necesario

## 📚 Recursos Adicionales

- [JSDoc Documentation](https://jsdoc.app/)
- [Better Comments Extension](https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments)
- [React PropTypes](https://reactjs.org/docs/typechecking-with-proptypes.html)

---

**Creado para**: CitySecure Project  
**Autor**: Romily  
**Versión**: 1.0.0
