# Manual de Deployment - CitySecure Frontend

## Tabla de Contenidos
- [Requisitos Previos](#requisitos-previos)
- [Configuración de Railway](#configuración-de-railway)
- [Archivos de Configuración](#archivos-de-configuración)
- [Proceso de Deployment](#proceso-de-deployment)
- [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

- Cuenta en [Railway.app](https://railway.app)
- Repositorio Git conectado a Railway
- Node.js 18+ en el entorno de desarrollo local

---

## Configuración de Railway

### 1. Crear Servicio en Railway

1. Accede a tu proyecto en Railway
2. Crea un nuevo servicio desde GitHub
3. Selecciona el repositorio `city_sec_frontend_v2`
4. Railway detectará automáticamente que es un proyecto Node.js

### 2. Configurar Variables de Entorno

Railway asigna automáticamente la variable `PORT`. **No necesitas configurar variables de entorno adicionales** para el deployment básico.

Si tu aplicación requiere variables de entorno específicas (como `VITE_API_URL`), agrégalas en:
- Settings → Variables → Add Variable

### 3. Configurar Networking

**IMPORTANTE:** Este es el paso crítico que resuelve el error 502.

1. Ve a **Settings → Networking → Public Networking**
2. Haz clic en **"Generate Service Domain"**
3. Cuando te pida el puerto, ingresa: `8080`
4. Haz clic en **"Generate Domain"**

**¿Por qué 8080?**
- Caddy (nuestro servidor web) escucha en el puerto que Railway asigna dinámicamente
- Este puerto suele ser 8080
- Railway necesita saber a qué puerto enrutar el tráfico HTTP

---

## Archivos de Configuración

### 1. `nixpacks.toml`

Este archivo le dice a Railway cómo construir y ejecutar la aplicación:

```toml
[phases.setup]
nixPkgs = ['nodejs', 'caddy']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'caddy run --config Caddyfile --adapter caddyfile 2>&1'
```

**Explicación:**
- `nixPkgs`: Instala Node.js y Caddy
- `install`: Instala dependencias con `npm ci` (más rápido y determinista que `npm install`)
- `build`: Ejecuta el build de Vite que genera el directorio `dist/`
- `start`: Inicia Caddy con nuestra configuración

### 2. `Caddyfile`

Configuración del servidor web Caddy (recomendado por Railway para aplicaciones Vite):

```caddyfile
# global options
{
    admin off
    persist_config off
    auto_https off
    log {
        format json
    }
    servers {
        trusted_proxies static private_ranges 100.0.0.0/8
    }
}

:{$PORT:3000} {
    log {
        format json
    }

    rewrite /health /*

    root * dist

    encode gzip

    file_server

    try_files {path} /index.html
}
```

**Explicación:**
- `admin off`: No necesitamos la API de admin de Caddy
- `persist_config off`: El almacenamiento no es persistente en Railway
- `auto_https off`: Railway maneja HTTPS por nosotros
- `trusted_proxies`: Confía en el proxy de Railway (rango 100.0.0.0/8)
- `:{$PORT:3000}`: Escucha en el puerto que Railway asigna
- `rewrite /health /*`: Endpoint de health check para Railway
- `root * dist`: Sirve archivos desde el directorio `dist/`
- `encode gzip`: Habilita compresión
- `try_files {path} /index.html`: Maneja client-side routing (SPA)

### 3. `package.json`

Scripts necesarios:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

**Nota:** No incluimos script `start` porque Railway usa el comando definido en `nixpacks.toml`.

---

## Proceso de Deployment

### Deployment Automático

Cada vez que hagas push a la rama `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

Railway automáticamente:
1. Detecta el push
2. Ejecuta `npm ci` (instala dependencias)
3. Ejecuta `npm run build` (genera `dist/`)
4. Inicia Caddy
5. Despliega la aplicación

### Verificar el Deployment

1. Ve a **Deployments** en Railway
2. Verifica que el estado sea **"Active"**
3. Revisa los **Deploy Logs** para confirmar:
   ```
   [inf] server running
   [inf] serving initial configuration
   ```
4. Verifica los **HTTP Logs** - deberían mostrar código 200 en lugar de 502

---

## Solución de Problemas

### Error 502 "Application failed to respond"

**Causa:** Railway no puede conectarse al puerto correcto.

**Solución:**
1. Ve a Settings → Networking
2. Elimina el dominio público existente
3. Genera un nuevo dominio
4. **Ingresa el puerto 8080** cuando te lo pida
5. Espera 1-2 minutos para que Railway actualice la configuración

### El servidor inicia pero devuelve 404 en todas las rutas

**Causa:** Caddy no encuentra el directorio `dist/`.

**Solución:**
1. Verifica que `npm run build` se ejecute correctamente en Build Logs
2. Confirma que el Caddyfile tenga `root * dist` (sin `/` al inicio)
3. Verifica que `vite.config.js` no tenga un `base` diferente

### Cambios no se reflejan en producción

**Causa:** Puede que Railway esté usando una build antigua en caché.

**Solución:**
1. Ve a tu deployment en Railway
2. Haz clic en los tres puntos (⋮)
3. Selecciona **"Redeploy"**
4. Esto forzará un rebuild completo

### Error "npm ci" failed

**Causa:** `package-lock.json` está desincronizado con `package.json`.

**Solución:**
```bash
# En tu máquina local
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: sync package-lock.json"
git push origin main
```

---

## Verificación Post-Deployment

Después de cada deployment, verifica:

1. ✅ La aplicación carga correctamente
2. ✅ El login funciona
3. ✅ Las rutas del SPA funcionan (refresca en `/dashboard`, `/personal`, etc.)
4. ✅ Los estilos se cargan correctamente
5. ✅ No hay errores en la consola del navegador

---

## Recursos Adicionales

- [Railway Documentation](https://docs.railway.com)
- [Deploy a React App | Railway Docs](https://docs.railway.com/guides/react)
- [Caddy Documentation](https://caddyserver.com/docs/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)

---

## Notas Importantes

### Por qué usamos Caddy en lugar de `serve`

- **Serve** es una herramienta de desarrollo, no optimizada para producción
- **Caddy** es un servidor web de producción real
- Caddy maneja mejor la compresión, caching, y logging
- Configuración más confiable en Railway

### Por qué no usamos Express

Intentamos usar Express inicialmente, pero:
- Requiere más configuración
- Caddy es la solución oficialmente recomendada por Railway para apps Vite
- Caddy tiene mejor integración con nixpacks

### Mantenimiento

- **package.json**: Actualiza dependencias regularmente con `npm update`
- **Caddy**: Railway mantiene la versión de Caddy automáticamente
- **Node.js**: Railway usa la versión LTS por defecto

---

**Última actualización:** 26 de diciembre de 2024
**Versión:** 1.0.0
