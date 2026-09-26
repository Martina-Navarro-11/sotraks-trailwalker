let allEvents = [];

async function loadEvents() {
  const res = await fetch("data/events.json", { cache: "no-cache" });
  return res.json();
}

function renderEvents(events) {
  const wrap = document.querySelector("[data-timeline]");
  if (!wrap) return;

  const lang = window.__currentLang || "es";
  const translations = window.__translations || {};
  const config = window.__siteConfig || {};
  const localeMap = { es: "es-ES", ca: "ca-ES" };
  const locale = localeMap[lang] || "es-ES";

  const today = localToday();
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  const label = (path, fallback) =>
    path.split(".").reduce((cur, key) => (cur ? cur[key] : undefined), translations) || fallback;

  const item = (e, idx) => {
    const d = new Date(e.date + "T00:00:00");
    const day = d.getDate();
    const month = d.toLocaleDateString(locale, { month: "short" }).replace(".", "");
    const isPast = e.date < today;
    const statusLabel = isPast
      ? label("eventsPage.statusPast", "Pasado")
      : label("eventsPage.statusUpcoming", "Próximo");
    return `
      <div class="trail-item ${isPast ? "is-past" : "is-upcoming"} reveal" style="transition-delay:${Math.min(idx * 70, 400)}ms">
        <div class="trail-node"></div>
        <div class="card event-card">
          <span class="event-status ${isPast ? "past" : "upcoming"}">${statusLabel}</span>
          <h3>${e.title}</h3>
          <div class="event-meta">${day} ${month} &middot; ${e.time ? e.time + " &middot; " : ""}${e.location || ""}${e.price > 0 ? " &middot; " + formatMoney(e.price, config) : ""}</div>
          <p>${e.description || ""}</p>
          ${
            isPast
              ? ""
              : `<div class="event-actions"><a class="btn btn-outline btn-small" href="inscripcion.html?evento=${encodeURIComponent(eventKey(e))}">${label("eventsPage.signUp", "Apúntate")}</a></div>`
          }
        </div>
      </div>`;
  };

  const finishItem = () => {
    if (!config.raceDate) return "";
    const raceDate = window.__formatRaceDate ? window.__formatRaceDate(config, lang) : config.raceDate;
    const vars = window.__buildVars ? window.__buildVars(config, lang) : {};
    const rawBody = label("eventsPage.raceDayBody", "Los {{raceDistance}}. Todo lo recaudado hasta aquí, para Oxfam.");
    const body = window.__interpolate ? window.__interpolate(rawBody, vars) : rawBody;
    return `
      <div class="trail-item is-finish reveal" style="transition-delay:${Math.min(sorted.length * 70, 400)}ms">
        <div class="trail-node"></div>
        <div class="card event-card finish-card">
          <span class="event-status">${label("eventsPage.raceDayTag", "Meta")}</span>
          <h3>${label("eventsPage.raceDayTitle", "Día de la carrera")}</h3>
          <div class="event-meta">${raceDate} &middot; ${config.raceLocation || ""}</div>
          <p>${body}</p>
        </div>
      </div>`;
  };

  wrap.innerHTML =
    `<div class="trail-line" aria-hidden="true"></div>` +
    (sorted.length > 0
      ? sorted.map(item).join("")
      : `<div class="empty-state">${label("eventsPage.emptyState", "Todavía no hay eventos programados.")}</div>`) +
    finishItem();

  if (window.__observeReveals) window.__observeReveals();
}

async function init() {
  allEvents = await loadEvents();
  renderEvents(allEvents);
}

document.addEventListener("config-ready", () => {
  init().catch((err) => console.error("Could not load events", err));
});

document.addEventListener("lang-changed", () => {
  if (allEvents.length) renderEvents(allEvents);
});
