let allEvents = [];

async function loadEvents() {
  const res = await fetch("data/events.json");
  return res.json();
}

function renderEvents(events) {
  const upcomingWrap = document.querySelector("[data-upcoming-events]");
  const pastWrap = document.querySelector("[data-past-events]");
  if (!upcomingWrap) return;

  const lang = window.__currentLang || "es";
  const translations = window.__translations || {};
  const localeMap = { es: "es-ES", ca: "ca-ES" };
  const locale = localeMap[lang] || "es-ES";

  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.filter((e) => e.date >= today);
  const past = sorted.filter((e) => e.date < today).reverse();

  const label = (path, fallback) =>
    path.split(".").reduce((cur, key) => (cur ? cur[key] : undefined), translations) || fallback;

  const card = (e, idx) => {
    const d = new Date(e.date + "T00:00:00");
    const day = d.getDate();
    const month = d.toLocaleDateString(locale, { month: "short" });
    const isPast = e.date < today;
    const statusLabel = isPast
      ? label("eventsPage.statusPast", "Pasado")
      : label("eventsPage.statusUpcoming", "Próximo");
    return `
      <div class="card event-card reveal" style="transition-delay:${Math.min(idx * 60, 400)}ms">
        <div class="event-date-badge">
          <span class="day">${day}</span>
          <span class="month">${month}</span>
        </div>
        <div class="event-body">
          <span class="event-status ${isPast ? "past" : "upcoming"}">${statusLabel}</span>
          <h3>${e.title}</h3>
          <div class="event-meta">${e.time ? e.time + " &middot; " : ""}${e.location || ""}</div>
          <p>${e.description || ""}</p>
        </div>
      </div>`;
  };

  upcomingWrap.innerHTML =
    upcoming.length > 0
      ? upcoming.map(card).join("")
      : `<div class="empty-state">${label("eventsPage.emptyUpcoming", "No hay eventos programados todavía.")}</div>`;

  if (pastWrap) {
    pastWrap.innerHTML =
      past.length > 0
        ? past.map(card).join("")
        : `<div class="empty-state">${label("eventsPage.emptyPast", "No hay eventos pasados todavía.")}</div>`;
  }

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
