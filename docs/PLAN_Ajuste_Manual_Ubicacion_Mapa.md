# Plan: Ajuste manual de ubicacion en mapa (Click-to-Relocate)

## Objetivo
Permitir al usuario hacer clic en el mapa para reposicionar el pin cuando la geocodificacion no fue precisa. Al confirmar, actualizar coordenadas en la novedad y en la direccion asociada.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/UbicacionMiniMapa.jsx` | Agregar modo editable con click/drag + controles |
| `src/components/novedades/DespacharModal.jsx` | Integrar modo editable + API calls para guardar |
| `src/components/NovedadDetalleModal.jsx` | Integrar modo editable + API calls para guardar |

### Servicios existentes a reutilizar (sin modificar)
- `updateNovedad(id, data)` - `PUT /novedades/:id` - en `src/services/novedadesService.js`
- `geocodificarDireccion(id, { latitud, longitud, fuente })` - `PATCH /direcciones/:id/geocodificar` - en `src/services/direccionesService.js`

---

## Paso 1: UbicacionMiniMapa.jsx - Modo editable

### Nuevos props (opcionales, backward-compatible)
```
editable: bool (default false)       - Habilita modo edicion
onCoordinatesChange: func            - Callback (lat, lng) al confirmar nueva ubicacion
```

### Nuevo componente interno: MapClickHandler
- Usa `useMapEvents` de react-leaflet para capturar clicks en el mapa
- Solo activo cuando `isEditing === true`
- Al hacer clic: actualiza `tempCoords` local (no guarda aun)

### Nuevo estado local
- `isEditing` (bool) - toggle modo edicion
- `tempCoords` ([lat, lng] | null) - coordenadas temporales mientras edita

### Marker draggable
- Cuando `isEditing`, el Marker es `draggable={true}` con `eventHandlers.dragend` para actualizar `tempCoords`

### Controles UI (debajo del mapa, solo si `editable`)
- **Estado normal**: Boton "Ajustar Ubicacion" (icono Edit2, azul)
- **Estado editando**:
  - Texto instructivo: "Haz clic en el mapa o arrastra el marcador"
  - Boton "Cancelar" (gris) - resetea `tempCoords`, sale de edicion
  - Boton "Confirmar" (verde) - llama `onCoordinatesChange(lat, lng)`, sale de edicion
- **Cursor**: `crosshair` cuando esta en modo edicion

### Borde visual del mapa
- Normal: `border-slate-200`
- Editando: `border-blue-500 border-2` (feedback visual claro)

---

## Paso 2: DespacharModal.jsx - Integracion

### Nuevo estado
```jsx
const [editedCoordinates, setEditedCoordinates] = useState(null);
const [savingCoordinates, setSavingCoordinates] = useState(false);
```

### Nuevos imports
```jsx
import { updateNovedad } from "../../services/novedadesService.js";
import { geocodificarDireccion } from "../../services/direccionesService.js";
```

### Handler handleCoordinatesChange(newLat, newLng)
1. Validar coordenadas (isNaN, rango)
2. `setSavingCoordinates(true)`
3. `await updateNovedad(novedad.id, { latitud: newLat, longitud: newLng })`
4. Si `novedad.direccion_id` existe: `await geocodificarDireccion(novedad.direccion_id, { latitud: newLat, longitud: newLng, fuente: "Ajuste manual en mapa" })`
5. `setEditedCoordinates({ latitud: newLat, longitud: newLng })`
6. `toast.success("Ubicacion actualizada")`
7. En catch: `toast.error(...)`, rollback `setEditedCoordinates(null)`
8. Finally: `setSavingCoordinates(false)`

### Cambio en UbicacionMiniMapa del Tab "Ubicacion"
```jsx
<UbicacionMiniMapa
  latitud={editedCoordinates?.latitud || novedad?.latitud}
  longitud={editedCoordinates?.longitud || novedad?.longitud}
  height="350px"
  zoom={16}
  showCoordinates={false}
  editable={true}
  onCoordinatesChange={handleCoordinatesChange}
/>
```

### Actualizar display de coordenadas
- Mostrar `editedCoordinates` si existe, si no `novedad.latitud/longitud`
- Badge "(Actualizado)" en verde cuando se editaron

---

## Paso 3: NovedadDetalleModal.jsx - Misma integracion

Mismo patron que DespacharModal:
- Estado `editedCoordinates` + `savingCoordinates`
- Handler `handleCoordinatesChange` (identica logica)
- Props `editable` + `onCoordinatesChange` en UbicacionMiniMapa
- Display actualizado de coordenadas

---

## UX Flow

```
1. Usuario ve el mapa con el pin actual
2. Pulsa "Ajustar Ubicacion" -> borde azul, cursor crosshair
3. Hace clic en el punto correcto (o arrastra el pin)
4. Pin se mueve visualmente al nuevo punto
5. Pulsa "Confirmar" -> loading -> API calls -> toast success
   (o "Cancelar" -> pin vuelve a posicion original)
```

---

## Verificacion

1. Abrir modal Despachar -> Tab Ubicacion -> verificar boton "Ajustar Ubicacion"
2. Click en boton -> borde azul, cursor crosshair, texto instructivo
3. Click en otro punto del mapa -> pin se mueve
4. Arrastrar pin -> pin se reposiciona
5. "Cancelar" -> pin vuelve a posicion original
6. "Confirmar" -> API calls, toast success, coordenadas actualizadas
7. Verificar en BD que novedad y direccion tienen las nuevas coordenadas
8. Mismo flujo en modal EYE (NovedadDetalleModal)
9. Componentes existentes que usan UbicacionMiniMapa sin `editable` no cambian
10. `npm run build` exitoso
