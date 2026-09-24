# Web de SOTRAKS — Oxfam Trailwalker

Una web sencilla para explicar el reto, la causa, y coordinar los eventos de recaudación del equipo. No hace falta saber programar para actualizar el contenido — solo editar unos archivos de texto.

## Editar el contenido

- **`data/config.json`** — nombre del equipo, fecha/lugar de la carrera, objetivo y cantidad recaudada, enlace de colaboración, email de contacto, redes sociales, y la lista de los 15 miembros del equipo (nombre, `role`: `"walker"` para los 6 caminantes oficiales o `"organizer"` para el resto, bio y foto).
- **`data/events.json`** — la lista de eventos de recaudación que aparece en la página de Eventos. Copia una entrada existente y cambia los datos. Las fechas van en formato `AAAA-MM-DD`.

Guarda el archivo y recarga la página — ya está.

Las fotos van en la carpeta `images/`; se referencian desde `config.json` así: `"photo": "images/tunombre.jpg"`.

## Idiomas (castellano / catalán)

El sitio tiene un selector ES/CA en la esquina superior derecha. El castellano es el idioma por defecto.

- Los textos fijos de la plantilla (títulos de sección, botones, etiquetas, avisos) están en `data/i18n/es.json` y `data/i18n/ca.json`. Si queréis cambiar la redacción de algo, editad la clave correspondiente en ambos archivos.
- **El contenido que escribís vosotros** (nombres y bios del equipo en `config.json`, los eventos en `events.json`) **no se traduce automáticamente** — se muestra tal cual lo escribáis, en el idioma que sea. Si queréis que también cambie según el idioma, tendríais que escribirlo dos veces a mano; de momento no está montado así porque añade bastante mantenimiento para poco beneficio con este volumen de contenido.

## Ver la web en tu ordenador antes de publicarla

Como las páginas cargan los archivos JSON con `fetch`, abrir `index.html` haciendo doble clic no funciona (los navegadores bloquean eso para archivos locales). Levanta un servidor local sencillo desde esta carpeta:

```bash
python3 -m http.server 8000
```

Y abre `http://localhost:8000` en el navegador.

## Publicar la web (opciones gratuitas)

**GitHub Pages** (recomendado si alguien del equipo usa GitHub):
1. Crea un repositorio nuevo en GitHub y sube esta carpeta.
2. En Settings → Pages del repositorio, elige la rama `main`, carpeta raíz.
3. La web quedará publicada en `https://<usuario>.github.io/<repo>/`.
4. Para actualizar luego, edita los JSON, haz commit y push — se actualiza sola.

**Netlify** (arrastrar y soltar, sin necesidad de git):
1. Ve a [app.netlify.com/drop](https://app.netlify.com/drop) y arrastra esta carpeta entera.
2. Te da una URL al momento. Para actualizar, vuelve a arrastrar la carpeta o conéctalo a un repositorio de GitHub.

## Pendiente de rellenar

- [ ] `data/config.json`: fecha y lugar reales de la carrera, objetivo de recaudación, email de contacto, nombres y bios reales de los 15 miembros
- [ ] `data/events.json`: vuestros eventos reales de recaudación
- [ ] Fotos del equipo en `images/`
- [ ] Enlace real de colaboración (Bizum, Revolut.me, o lo que decidáis) una vez cerréis ese tema
