# GELM CITY 3D — HOLE ARENA

Juego 3D de absorción en una ciudad, inspirado en el género de agujeros que crecen al tragarse objetos. Esta versión es un prototipo jugable para GitHub Pages.

## Mecánica
- Empiezas como un agujero pequeño.
- Absorbes objetos cuyo tamaño sea menor que tu capacidad.
- Cada objeto otorga puntos y crecimiento.
- Subes de nivel y aumenta el radio del agujero.
- Los seis rivales son bots con IA local: buscan objetos que puedan absorber y huyen de agujeros más grandes.
- Un agujero suficientemente grande puede absorber a otro. Si un bot te absorbe, termina la partida.
- La ronda dura tres minutos.

## Controles
- WASD o flechas para moverte.
- En móvil aparecen controles táctiles.
- Botón Pausa para detener la ronda.
- Reiniciar vuelve a cargar la arena desde cero.

## Ejecutar en tu computadora
Los módulos de JavaScript requieren un servidor local. Desde esta carpeta ejecuta:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

## Publicar en GitHub Pages
1. Crea un repositorio `gelm-city-3d`.
2. Sube los archivos de esta carpeta a la raíz.
3. Ve a **Settings → Pages**.
4. En **Build and deployment**, selecciona **Deploy from a branch**.
5. Selecciona `main` y `/ (root)`, y guarda.
6. Abre la URL que publique GitHub Pages.

## Archivos
- `index.html`: estructura y HUD.
- `styles.css`: interfaz adaptable.
- `game.js`: ciudad, agujeros, absorción, crecimiento y bots.
- `manifest.webmanifest`: metadatos PWA.
- `sw.js`: caché básica.

## Limitaciones conocidas de esta versión
- Los rivales son bots locales, no personas conectadas por internet.
- Three.js se descarga desde jsDelivr; la primera carga necesita internet.
- La arena es un prototipo: colisiones, edificios y balance de crecimiento se pueden seguir perfeccionando.
- GitHub Pages aloja archivos estáticos; un multijugador real necesitaría un servidor/backend aparte.
