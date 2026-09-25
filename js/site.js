const SUPPORTED_LANGS = ["es", "ca"];
const DEFAULT_LANG = "es";
const LANG_STORAGE_KEY = "sotraks-lang";

const translationsCache = {};
let revealObserver = null;

function getLang() {
  const stored = localStorage.getItem(LANG_STORAGE_KEY);
  return SUPPORTED_LANGS.includes(stored) ? stored : DEFAULT_LANG;
}

function setLang(lang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

function localeFor(lang) {
  return lang === "ca" ? "ca-ES" : "es-ES";
}

async function loadTranslations(lang) {
  if (translationsCache[lang]) return translationsCache[lang];
  const res = await fetch(`data/i18n/${lang}.json`);
  const data = await res.json();
  translationsCache[lang] = data;
  return data;
}

async function loadConfig() {
  const res = await fetch("data/config.json");
  return res.json();
}

function t(translations, path) {
  const value = path.split(".").reduce((cur, key) => (cur ? cur[key] : undefined), translations);
  return typeof value === "string" ? value : path;
}

function interpolate(str, vars) {
  return str.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => (key in vars ? vars[key] : ""));
}

function formatDate(dateStr, lang, options) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(localeFor(lang), options);
}

const MONTH_NAMES = {
  es: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
  ca: ["gener", "febrer", "març", "abril", "maig", "juny", "juliol", "agost", "setembre", "octubre", "novembre", "desembre"],
};

function formatRaceDate(config, lang) {
  if (!config.raceDateEnd || config.raceDateEnd === config.raceDate) {
    return formatDate(config.raceDate, lang, { day: "numeric", month: "long", year: "numeric" });
  }
  const start = new Date(config.raceDate + "T00:00:00");
  const end = new Date(config.raceDateEnd + "T00:00:00");
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (!sameMonth) {
    const startFmt = formatDate(config.raceDate, lang, { day: "numeric", month: "long" });
    const endFmt = formatDate(config.raceDateEnd, lang, { day: "numeric", month: "long", year: "numeric" });
    return `${startFmt} - ${endFmt}`;
  }

  const month = MONTH_NAMES[lang][end.getMonth()];
  const year = end.getFullYear();
  if (lang === "ca") {
    const monthPhrase = /^[aeiouAEIOU]/.test(month) ? `d'${month}` : `de ${month}`;
    return `${start.getDate()} i ${end.getDate()} ${monthPhrase} de ${year}`;
  }
  return `${start.getDate()} y ${end.getDate()} de ${month} de ${year}`;
}

function groupThousands(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCurrency(amount, config) {
  return `${config.currency}${groupThousands(amount)}`;
}

function formatMoney(amount, config) {
  if (Number.isInteger(amount)) return formatCurrency(amount, config);
  return `${config.currency}${amount.toFixed(2).replace(".", ",")}`;
}

function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function eventKey(e) {
  const slug = e.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${e.date}-${slug}`;
}

function daysUntil(dateStr) {
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(Math.ceil((target - now) / 86400000), 0);
}

function buildVars(config, lang) {
  return {
    teamName: config.teamName,
    raceName: config.raceName,
    raceDistance: config.raceDistance,
    raceDate: formatRaceDate(config, lang),
    raceLocation: config.raceLocation,
    raised: formatCurrency(config.fundraisingRaised, config, lang),
    goal: formatCurrency(config.fundraisingGoal, config, lang),
  };
}

function applyI18n(translations, config, lang) {
  const vars = buildVars(config, lang);
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = interpolate(t(translations, key), vars);
  });
  document.documentElement.lang = lang;
}

function applyCommon(config) {
  document.querySelectorAll("[data-team-name]").forEach((el) => {
    el.textContent = config.teamName;
  });
  document.querySelectorAll("[data-contact-email]").forEach((el) => {
    el.textContent = config.contactEmail;
    el.href = "mailto:" + config.contactEmail;
  });

  const socials = document.querySelector("[data-socials]");
  if (socials) {
    const links = Object.entries(config.socialLinks || {}).filter(([, url]) => url);
    socials.innerHTML = links
      .map(([name, url]) => `<a href="${url}" target="_blank" rel="noopener">${name}</a>`)
      .join("");
  }
}

/* Animated counters */
function animateValue(el, target, { duration = 1100, format = (n) => Math.round(n).toString() } = {}) {
  const start = performance.now();
  const from = 0;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = format(from + (target - from) * eased);
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = format(target);
  }
  requestAnimationFrame(tick);
}

function renderHeroStats(config, lang) {
  const barEl = document.querySelector("[data-progress-bar]");
  if (barEl) {
    const pct = Math.min(100, Math.round((config.fundraisingRaised / config.fundraisingGoal) * 100));
    requestAnimationFrame(() => { barEl.style.width = pct + "%"; });
  }

  const goalEl = document.querySelector('[data-stat="goal"]');
  const raisedEl = document.querySelector('[data-stat="raised"]');
  const daysEl = document.querySelector('[data-stat="days"]');
  const teamEl = document.querySelector('[data-stat="team"]');

  if (goalEl) animateValue(goalEl, config.fundraisingGoal, { format: (n) => `${config.currency}${groupThousands(n)}` });
  if (raisedEl) animateValue(raisedEl, config.fundraisingRaised, { format: (n) => `${config.currency}${groupThousands(n)}` });
  if (daysEl) animateValue(daysEl, daysUntil(config.raceDate), { format: (n) => Math.round(n).toString() });
  if (teamEl) animateValue(teamEl, (config.teamMembers || []).length, { format: (n) => Math.round(n).toString() });
}

function renderTeam(config, translations) {
  const wrap = document.querySelector("[data-team-list]");
  if (!wrap) return;
  wrap.innerHTML = (config.teamMembers || [])
    .map((m, idx) => {
      const roleKey = m.role === "walker" ? "team.roleWalker" : "team.roleOrganizer";
      const roleClass = m.role === "walker" ? "role-walker" : "role-organizer";
      return `
      <div class="card team-card ${roleClass} reveal" style="transition-delay:${Math.min(idx * 50, 400)}ms">
        <span class="role-tag">${t(translations, roleKey)}</span>
        <div class="team-photo">${
          m.photo ? `<img src="${m.photo}" alt="${m.name}">` : m.name.charAt(0)
        }</div>
        <h3>${m.name}</h3>
        <p>${m.bio}</p>
      </div>`;
    })
    .join("");
  observeReveals();
}

/* Scroll reveal */
function observeReveals() {
  if (!revealObserver) {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));
      return;
    }
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
  }
  document.querySelectorAll(".reveal:not([data-observed])").forEach((el) => {
    el.dataset.observed = "1";
    revealObserver.observe(el);
  });
}

window.__observeReveals = observeReveals;
window.__formatRaceDate = formatRaceDate;
window.__interpolate = interpolate;
window.__buildVars = buildVars;

/* Nav interactions */
function setupNavToggle() {
  const btn = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!btn || !menu) return;
  btn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    btn.classList.toggle("open", isOpen);
    btn.setAttribute("aria-expanded", String(isOpen));
  });
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      btn.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    })
  );
}

function setupHeroVideo() {
  const video = document.querySelector(".hero-video");
  if (!video) return;
  video.muted = true;
  video.setAttribute("muted", "");
  const tryPlay = () => video.play().catch(() => {});
  tryPlay();
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tryPlay();
  });
  document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
}

function setupHeaderShadow() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function setupLangSwitch(render) {
  const buttons = document.querySelectorAll("[data-lang-btn]");
  const lang = getLang();
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-lang-btn") === lang);
    btn.addEventListener("click", async () => {
      const newLang = btn.getAttribute("data-lang-btn");
      setLang(newLang);
      buttons.forEach((b) => b.classList.toggle("active", b === btn));
      await render(newLang);
      document.dispatchEvent(new CustomEvent("lang-changed", { detail: { lang: newLang } }));
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const config = await loadConfig();
    window.__siteConfig = config;

    const render = async (lang) => {
      const translations = await loadTranslations(lang);
      applyI18n(translations, config, lang);
      renderHeroStats(config, lang);
      renderTeam(config, translations);
      window.__currentLang = lang;
      window.__translations = translations;
    };

    applyCommon(config);
    await render(getLang());
    setupLangSwitch(render);
    setupNavToggle();
    setupHeaderShadow();
    setupHeroVideo();
    observeReveals();

    document.dispatchEvent(new CustomEvent("config-ready", { detail: config }));
  } catch (err) {
    console.error("Could not load site config", err);
  }
});
