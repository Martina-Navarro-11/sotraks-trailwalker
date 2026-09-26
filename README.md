# Web de SOTRAKS — Oxfam Trailwalker

Una web sencilla para explicar el reto, la causa, y coordinar los eventos de recaudación del equipo. No hace falta saber programar para actualizar el contenido — solo editar unos archivos de texto.

## Editar el contenido

- **`data/config.json`** — nombre del equipo, fecha/lugar de la carrera, objetivo y cantidad recaudada, email y teléfono de contacto, datos de pago (`payment`), redes sociales, y la lista del equipo (`teamMembers`: nombre, frase en `bio` y `photo`). Si `bio` o `photo` están vacíos, no se muestra la frase y en su lugar sale la inicial del nombre. Los "15" que salen en los textos se calculan solos a partir de esta lista.
- **`data/events.json`** — la lista de eventos de recaudación que aparece en la página de Eventos. Copia una entrada existente y cambia los datos. Las fechas van en formato `AAAA-MM-DD`. El campo `price` es el precio de la entrada en euros (por persona); si lo dejas en `0` o lo quitas, el total sale como "por confirmar".

Guarda el archivo y recarga la página — ya está.

Las fotos van en la carpeta `images/`; se referencian desde `config.json` así: `"photo": "images/tunombre.jpg"`.

## Inscripción y pagos

Todos los botones de la web ("Apúntate", "Reserva tu plaza"…) llevan a `inscripcion.html`: la persona elige un evento, rellena un formulario corto y, en el último paso, ve los datos para pagar y un botón para avisaros.

- **Qué pasa con los datos de la inscripción**:
  - *Con `signupForm` vacío (como está ahora)*: no se guardan en ningún sitio. Al terminar, el botón abre un WhatsApp (o un email) ya escrito con la inscripción para vosotros.
  - *Con un Google Forms conectado*: cada inscripción llega sola a la hoja de respuestas del formulario (que se descarga como Excel), sin que la persona salga de la web. El texto de privacidad del formulario cambia solo a "se guardan en una hoja privada del equipo". El botón de WhatsApp/email sigue ahí como plan B.
- **Datos de pago** — en `data/config.json`, dentro de `payment`. Solo aparecen los que rellenéis:
  - `bizum`: teléfono de Bizum
  - `revolut`: enlace tipo `https://revolut.me/tunombre`
  - `iban` y `holder`: IBAN y nombre del titular para transferencia
  Si no rellenáis ninguno, la web dice que les enviaréis los datos por mensaje.
- **Conectar el Google Forms** — en `data/config.json`, dentro de `signupForm`: `url` es la dirección del formulario acabada en `/formResponse` y `fields` son los códigos `entry.NNNNN` de cada pregunta (evento, nombre, email, teléfono, personas, total, comentario). Se sacan del "enlace prellenado" del formulario. Todas las preguntas del formulario deben ser de "Respuesta corta".
- **Dónde os llegan los avisos** — `contactPhone` (WhatsApp, con prefijo, por ejemplo `34600111222`). Si está vacío, el aviso se envía por email a `contactEmail`.
- Los eventos ya pasados no aparecen en el formulario.

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

- [ ] `data/config.json`: fecha y lugar reales de la carrera, objetivo de recaudación, email de contacto, frases (`bio`) y fotos de cada miembro
- [ ] `data/events.json`: vuestros eventos reales de recaudación
- [ ] Fotos del equipo en `images/`
- [ ] `data/config.json`: `payment` (Bizum / Revolut / IBAN) y `contactPhone` para recibir las inscripciones por WhatsApp
- [ ] `data/events.json`: precio (`price`) real de cada evento
- [ ] `data/config.json`: `signupForm` (Google Forms) para recibir las inscripciones en una hoja
