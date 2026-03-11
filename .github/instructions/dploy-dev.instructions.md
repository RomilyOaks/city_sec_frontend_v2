---
description: Luego de terminar un cambio aplicar 
paths:
. - "src/**/*.{js,jsx,ts,tsx}"
---

1. Aplicar ESlint para corregir errores de formato y estilo.
2. Aplicar Prettier para corregir errores de formato.
3. Verificar que no se hayan eliminado líneas de código importantes.
4. Aplicar Build para verificar que el proyecto compile correctamente.
5. Preguntar siempre si se va a subir a GitHub los cambios.
6. Si se va a subir a GitHub, poner un comentario detallado de los cambios realizados.
7. Verificar la variable de entorno de timezone (`APP_TIMEZONE` / `VITE_APP_TIMEZONE`) antes del deploy y confirmar que los helpers de fecha usan esa configuración.
