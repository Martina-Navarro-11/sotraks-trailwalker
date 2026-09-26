/**
 * SOTRAKS · Correo automático con los datos de pago
 *
 * Se pega en el editor de secuencias de comandos del Google Forms (ver README) y se ejecuta solo cada
 * vez que alguien se inscribe. Manda un correo DESDE LA CUENTA DE GOOGLE que lo instala, con el concepto
 * de pago de esa persona y los datos de pago que haya ahora mismo en data/config.json de la web.
 *
 * Requisitos en el Forms: una pregunta llamada exactamente "Email" y otra llamada exactamente
 * "Concepto de pago".
 */

const SITE_URL = "https://martina-navarro-11.github.io/sotraks-trailwalker";
const REFERENCE_TITLE = "Concepto de pago";
const EMAIL_TITLE = "Email";

function onFormSubmit(e) {
  const answers = readAnswers_(e.response);
  const email = answers[EMAIL_TITLE];
  const reference = answers[REFERENCE_TITLE];

  warnIfReferenceIsRepeated_(e.source, e.response, answers);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return; // no valid address, nothing to send

  const config = readConfig_();
  const payment = (config && config.payment) || {};
  const teamName = (config && config.teamName) || "SOTRAKS";

  const methods = [];
  if (payment.bizum) methods.push("<li><b>Bizum:</b> " + escape_(payment.bizum) + "</li>");
  if (payment.revolut) methods.push('<li><b>Revolut:</b> <a href="' + escape_(payment.revolut) + '">' + escape_(payment.revolut) + "</a></li>");
  if (payment.iban) {
    methods.push("<li><b>Transferencia:</b> " + escape_(payment.iban) + (payment.holder ? " (titular: " + escape_(payment.holder) + ")" : "") + "</li>");
  }
  const methodsHtml = methods.length
    ? "<ul>" + methods.join("") + "</ul>"
    : "<p>Todavía estamos preparando los datos de pago; te los mandaremos en otro correo.</p>";

  const summary = [
    ["Evento", answers["Evento"]],
    ["Personas", answers["Personas"]],
    ["Total", answers["Total"]],
  ]
    .filter(function (row) { return row[1]; })
    .map(function (row) { return "<li><b>" + row[0] + ":</b> " + escape_(row[1]) + "</li>"; })
    .join("");

  const name = answers["Nombre y apellidos"] ? escape_(answers["Nombre y apellidos"].split(" ")[0]) : "";
  const html =
    "<div style=\"font-family:Arial,sans-serif;font-size:15px;color:#0b1b33;max-width:560px\">" +
    "<p>¡Hola" + (name ? " " + name : "") + "!</p>" +
    "<p>Tu inscripción está registrada. <b>Tu plaza quedará confirmada en cuanto recibamos el pago.</b></p>" +
    (summary ? "<ul>" + summary + "</ul>" : "") +
    (reference
      ? "<p>Usa este concepto tal cual en tu pago, es único para ti:</p>" +
        "<p style=\"font-size:28px;font-weight:bold;letter-spacing:2px;background:#fff6dc;border:2px solid #0b1b33;border-radius:8px;display:inline-block;padding:8px 18px\">" +
        escape_(reference) + "</p>"
      : "") +
    "<p><b>Cómo pagar:</b></p>" + methodsHtml +
    "<p>Puedes pagar ahora o más tarde, con este mismo correo a mano. ¡Nos vemos allí!</p>" +
    "<p>— " + escape_(teamName) + "</p>" +
    "</div>";

  MailApp.sendEmail({
    to: email,
    subject: teamName + " · Datos de pago de tu inscripción" + (reference ? " (" + reference + ")" : ""),
    htmlBody: html,
    name: teamName,
  });
}

/** Turns a form response into { "Título de la pregunta": "respuesta" }. */
function readAnswers_(response) {
  const answers = {};
  response.getItemResponses().forEach(function (item) {
    answers[item.getItem().getTitle().trim()] = String(item.getResponse() || "").trim();
  });
  return answers;
}

/** Reads the payment details from the published website, so there is a single place to edit them. */
function readConfig_() {
  try {
    const res = UrlFetchApp.fetch(SITE_URL + "/data/config.json?nocache=" + Date.now(), { muteHttpExceptions: true });
    if (res.getResponseCode() === 200) return JSON.parse(res.getContentText());
  } catch (err) {
    console.error("No se pudo leer config.json: " + err);
  }
  return null;
}

/**
 * The reference is 6 random digits, so two different people can (very rarely) get the same one.
 * If that happens, the owner of the form gets an email so the two payments are not mixed up.
 */
function warnIfReferenceIsRepeated_(form, response, answers) {
  const reference = answers[REFERENCE_TITLE];
  if (!reference || !form) return;
  const clash = form.getResponses().some(function (other) {
    if (other.getId() === response.getId()) return false;
    const otherAnswers = readAnswers_(other);
    return otherAnswers[REFERENCE_TITLE] === reference && otherAnswers[EMAIL_TITLE] !== answers[EMAIL_TITLE];
  });
  if (clash) {
    MailApp.sendEmail(
      Session.getEffectiveUser().getEmail(),
      "SOTRAKS: concepto de pago repetido (" + reference + ")",
      "Dos personas distintas han recibido el concepto " + reference + ". Cuando llegue un pago con ese concepto, " +
        "distínguelas por el nombre del pagador y el importe. Última inscripción: " + (answers["Nombre y apellidos"] || "?") + " <" + answers[EMAIL_TITLE] + ">."
    );
  }
}

function escape_(text) {
  return String(text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
