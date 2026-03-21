# MCP Server (MySQL Local) - Frontend Project

Este directorio contiene un servidor ligero que implementa el "Model Context
Protocol" conectado a la base de datos MySQL local para el proyecto frontend.

## Preparación

1. En una terminal, cambia al directorio:

   ```bash
   cd mcp-server
   ```

2. Instala dependencias:

   ```bash
   npm install
   ```

3. Crea un fichero de configuración de entorno:

   ```bash
   cp .env.sample .env
   # o manualmente crea .env y copia los valores
   ```

   Ajusta `DB_*` para apuntar a tu MySQL local (por defecto `root@127.0.0.1:3306`).
   - **DB_PASSWORD** debe contener la contraseña que uses en tu DB local
     (por ejemplo `Effata` si estás usando el mismo `.env` del backend).
     Si dispones de una cadena URL, define `DATABASE_URL`.

4. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   Se imprimirá `MCP server listening on port 3001` cuando arranque.

## Endpoints disponibles

- `GET /health` – valida que la base de datos responde (`SELECT 1`).
- `POST /mcp/query` – ejecuta la sentencia SQL recibida en el cuerpo JSON:
  ```json
  { "query": "SELECT NOW()" }
  ```
  -> responde con filas devueltas o error de sintaxis/permiso.

> **Importante**: `/mcp/query` es solo un ejemplo de cómo invocar lógica
> hacia la base de datos; reescribe este endpoint con la lógica real del
> protocolo que uses.

## Uso para debugging del frontend

Este MCP server te permite consultar directamente la base de datos MySQL local
para verificar que las fechas se están guardando correctamente:

```javascript
// Ejemplo de consulta para verificar fechas en historial
const query = `
  SELECT 
    id, 
    novedad_id, 
    estado_anterior_id, 
    estado_nuevo_id, 
    fecha_cambio, 
    created_at, 
    updated_at,
    observaciones
  FROM citizen_security_v2.historial_estado_novedades 
  WHERE novedad_id IN (8, 9) 
  ORDER BY novedad_id, fecha_cambio DESC
`;
```

## Despliegue

Este MCP está diseñado para trabajar en **localhost** en conjunto con tu
instancia de MySQL local. No afecta ninguna otra parte del proyecto frontend.
