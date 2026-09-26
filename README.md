# Web de SOTRAKS — Oxfam Trailwalker

Una web sencilla para explicar el reto, la causa, y coordinar los eventos de recaudación del equipo. No hace falta saber programar para actualizar el contenido — solo editar unos archivos de texto.

## Editar el contenido

- **`data/config.json`** — nombre del equipo, fecha/lugar de la carrera, objetivo y cantidad recaudada, email y teléfono de contacto, datos de pago (`payment`), redes sociales, y la lista del equipo (`teamMembers`: nombre, frase en `bio` y `photo`). Si `bio` o `photo` están vacíos, no se muestra la frase y en su lugar sale la inicial del nombre. Los "15" que salen en los textos se calculan solos a partir de esta lista.
- **`data/events.json`** — la lista de eventos de recaudación que aparece en la página de Eventos. Copia una entrada existente y cambia los datos. Las fechas van en formato `AAAA-MM-DD`. El campo `price` es el precio de la entrada en euros (por persona); si lo dejas en `0` o lo quitas, el total sale como "por confirmar".

Guarda el archivo y recarga la página — ya está.

Las fotos van en la carpeta `images/`; se referencian desde `config.json` así: `"photo": "images/tunombre.jpg"`.

## Inscripción y pagos

Todos los botones de la web ("Apúntate", "Reserva tu plaza"…) llevan a `inscripcion.html`. La persona elige un evento, rellena un formulario corto y llega a una **última página informativa**: resumen, su concepto de pago, los datos para pagar y un aviso de que la plaza se confirma al recibir el pago y de que guarden su concepto (por ejemplo con una captura).

- **Dónde caen las inscripciones**: en el Google Forms conectado en `data/config.json`, dentro de `signupForm` (`url` acabada en `/formResponse` y, en `fields`, el código `entry.NNNNN` de cada pregunta). Cada inscripción llega sola a la hoja de respuestas del Forms (que se descarga como Excel) sin que la persona salga de la web. Todas las preguntas del Forms deben ser de "Respuesta corta" (o "Párrafo") y **ninguna obligatoria**. No borres y recrees preguntas: los códigos cambian; edítalas.
- **Concepto de pago único**: al enviar el formulario se genera `SK` + 6 cifras aleatorias (por ejemplo `SK482913`) y se guarda en la pregunta "Concepto de pago" del Forms, para saber a qué persona corresponde cada Bizum o Revolut. Hay un millón de combinaciones, así que la probabilidad de que dos personas coincidan es muy baja (alrededor del 0,5% con 100 inscripciones y del 2% con 200). Si pasara, se distinguen por el nombre del pagador y el importe. La misma persona (mismo email y evento en su dispositivo) conserva su concepto si vuelve a entrar.
- **Datos de pago** — en `data/config.json`, dentro de `payment`. Solo aparecen los que rellenéis:
  - `bizum`: teléfono de Bizum
  - `revolut`: enlace tipo `https://revolut.me/tunombre`
  - `iban` y `holder`: IBAN y nombre del titular para transferencia
  Si no rellenáis ninguno, la web dice que les enviaréis los datos por correo.
- **Precio**: campo `price` de cada evento (`events.json`). Si falta, el total sale como "por confirmar" y la web avisa de que se les confirmará el importe por correo.
- Los eventos ya pasados no aparecen en el formulario.

### Correo automático con los datos de pago

**Pendiente, todavía no está activado y la web no lo promete.** Hay un script de Google que manda a cada inscrito un correo con su concepto y los datos de pago, desde la cuenta que lo instala. Cuando queráis activarlo, seguid estos pasos y añadid a la última página un aviso de que recibirán el correo.

1. En el Forms, pregunta con título exacto **"Email"** y otra con título exacto **"Concepto de pago"** (Respuesta corta, no obligatorias).
2. En el Forms: los tres puntos (⋮) → **Editor de secuencias de comandos**.
3. Borra lo que haya y pega el contenido de `apps-script/enviar-datos-de-pago.gs`. Guarda.
4. Menú de la izquierda, icono del reloj (**Activadores**) → **Añadir activador**: función `onFormSubmit`, origen **"Del formulario"**, tipo **"Al enviar el formulario"** → Guardar.
5. Google pedirá permisos (enviar correos y leer la web). Saldrá "Google no ha verificado esta aplicación": **Configuración avanzada → Ir a … (no seguro) → Permitir**. Es normal en scripts propios.
6. Prueba: haz una inscripción con tu email y comprueba que llega el correo.

El correo lee los datos de pago de la web publicada, así que si cambias `payment` en `config.json` el correo se actualiza solo. Sale en castellano. Con cuentas de Google normales el límite es de unos 100 correos al día.

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
- [ ] `data/config.json`: `payment` (Bizum / Revolut / IBAN)
- [ ] `data/events.json`: precio (`price`) real de cada evento
- [ ] Pregunta "Concepto de pago" en el Forms (Respuesta corta, no obligatoria) y pasarme su código para conectarla
- [ ] Más adelante: instalar el script de correo (ver arriba)
