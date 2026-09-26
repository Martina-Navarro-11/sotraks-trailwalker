(function () {
  const form = document.querySelector("[data-signup-form]");
  if (!form) return;

  const stepForm = document.querySelector("[data-step-form]");
  const stepPay = document.querySelector("[data-step-pay]");
  const payPanel = document.querySelector("[data-pay-panel]");
  const noEvents = document.querySelector("[data-no-events]");
  const select = document.getElementById("event");
  const wantedKey = new URLSearchParams(location.search).get("evento");

  let events = [];
  let state = null;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lang = () => window.__currentLang || "es";
  const config = () => window.__siteConfig || {};
  const tr = (path, vars) => interpolate(t(window.__translations, path), vars || {});

  function shortDate(e) {
    const d = new Date(e.date + "T00:00:00");
    const month = d.toLocaleDateString(localeFor(lang()), { month: "short" }).replace(".", "");
    return `${d.getDate()} ${month}`;
  }

  function fullDate(e) {
    return formatDate(e.date, lang(), { day: "numeric", month: "long", year: "numeric" });
  }

  function eventLabel(e) {
    const price = e.price > 0 ? formatMoney(e.price, config()) : "";
    return [e.title, shortDate(e), price].filter(Boolean).join(" · ");
  }

  function fillOptions() {
    const current = select.value || wantedKey || "";
    select.querySelectorAll("option:not([value=''])").forEach((o) => o.remove());
    events.forEach((e) => {
      const o = document.createElement("option");
      o.value = eventKey(e);
      o.textContent = eventLabel(e);
      select.appendChild(o);
    });
    select.value = current;
  }

  function methodCard(title, value, extra) {
    return `
      <div class="pay-method">
        <h3>${title}</h3>
        <div class="pay-value">
          <span>${esc(value)}</span>
          <button class="copy-btn" type="button" data-copy="${esc(value)}">${tr("signup.copy")}</button>
        </div>
        ${extra ? `<div class="form-note">${extra}</div>` : ""}
      </div>`;
  }

  function paymentMethods() {
    const p = config().payment || {};
    const cards = [];
    if (p.bizum) cards.push(methodCard(tr("signup.bizum"), p.bizum));
    if (p.revolut) {
      cards.push(`
        <div class="pay-method">
          <h3>Revolut</h3>
          <a class="btn btn-outline btn-small" href="${esc(p.revolut)}" target="_blank" rel="noopener">${tr("signup.revolutBtn")}</a>
        </div>`);
    }
    if (p.iban) {
      cards.push(methodCard(tr("signup.transfer"), p.iban, p.holder ? `${tr("signup.holder")}: ${esc(p.holder)}` : ""));
    }
    return cards.length
      ? `<div class="pay-methods">${cards.join("")}</div>`
      : `<p class="form-note">${tr("signup.noPayment")}</p>`;
  }

  // Personal payment reference: "SK" + 6 random digits, drawn from the browser's cryptographic random generator.
  // The last multiple of 1,000,000 below 2^32 is used as a limit so every digit combination is equally likely.
  function randomDigits() {
    const limit = 4294000000;
    const buf = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) {
      do { window.crypto.getRandomValues(buf); } while (buf[0] >= limit);
    } else {
      buf[0] = Math.floor(Math.random() * limit);
    }
    return String(buf[0] % 1000000).padStart(6, "0");
  }

  // Same person + same event on this device keeps the same reference, so a page refresh never issues a second one.
  function referenceFor(st) {
    const key = `sotraks-ref:${st.email.toLowerCase()}|${eventKey(st.ev)}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return saved;
    } catch (err) { /* storage may be blocked; a fresh reference is still fine */ }
    const ref = "SK" + randomDigits();
    try { localStorage.setItem(key, ref); } catch (err) { /* ignore */ }
    return ref;
  }

  function renderPay(scroll) {
    const c = config();
    const ev = state.ev;
    const total = ev.price > 0 ? ev.price * state.people : null;

    payPanel.innerHTML = `
      <div class="kicker">${tr("signup.kicker")}</div>
      <h2>${tr("signup.payHeading")}</h2>
      <p class="pay-lead">${tr("signup.payLead")}</p>

      <dl class="summary">
        <div><dt>${tr("signup.summaryEvent")}</dt><dd>${esc(ev.title)} · ${esc(shortDate(ev))}</dd></div>
        <div><dt>${tr("signup.summaryPeople")}</dt><dd>${state.people}</dd></div>
        <div><dt>${tr("signup.summaryTotal")}</dt><dd>${total !== null ? formatMoney(total, c) : tr("signup.toConfirm")}</dd></div>
      </dl>

      <div class="ref-card">
        <div class="ref-label">${tr("signup.refLabel")}</div>
        <div class="ref-row">
          <span class="ref-code">${esc(state.reference)}</span>
          <button class="copy-btn" type="button" data-copy="${esc(state.reference)}">${tr("signup.copy")}</button>
        </div>
        <p class="ref-help">${tr("signup.refHelp")}</p>
      </div>

      ${total === null ? `<p class="info-box">${tr("signup.totalPending")}</p>` : ""}

      <h3 class="pay-title">${tr("signup.payMethodsTitle")}</h3>
      ${paymentMethods()}

      <div class="info-box">
        <strong>${tr("signup.confirmNote")}</strong>
        <span>${tr("signup.saveNote")}</span>
      </div>

      <div class="pay-actions">
        <a class="btn btn-solid" href="index.html">${tr("signup.backHome")}</a>
      </div>`;

    stepForm.hidden = true;
    stepPay.hidden = false;
    if (scroll) stepPay.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function legacyCopy(text) {
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
      } catch (err) {
        reject(err);
      } finally {
        ta.remove();
      }
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(() => legacyCopy(text));
    }
    return legacyCopy(text);
  }

  let lastSent = "";

  async function sendToForm(st) {
    const cfg = config().signupForm || {};
    const f = cfg.fields || {};
    if (!cfg.url) return;
    // Whatever language the visitor uses, the sheet always gets Spanish labels so the data stays consistent.
    const es = await loadTranslations("es");
    const total = st.ev.price > 0 ? formatMoney(st.ev.price * st.people, config()) : t(es, "signup.toConfirm");
    const values = {
      event: `${st.ev.title} (${st.ev.date})`,
      name: st.name,
      email: st.email,
      phone: st.phone,
      people: st.people,
      total,
      allergies: st.allergies,
      heard: st.heard ? t(es, `signup.heard${st.heard}`) : "",
      comment: st.comment,
      reference: st.reference,
    };
    const body = new URLSearchParams();
    Object.keys(values).forEach((k) => {
      if (f[k]) body.append(f[k], values[k]);
    });
    const signature = body.toString();
    if (signature === lastSent) return; // don't duplicate rows if the user just goes back and forth
    lastSent = signature;
    // Google doesn't allow reading the response from another site, so this is fire-and-forget.
    fetch(cfg.url, { method: "POST", mode: "no-cors", body, keepalive: true }).catch(() => {});
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ev = events.find((x) => eventKey(x) === select.value);
    if (!ev) return;
    state = {
      ev,
      name: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      people: Math.max(1, parseInt(document.getElementById("people").value, 10) || 1),
      allergies: document.getElementById("allergies").value.trim(),
      heard: document.getElementById("heard").value,
      comment: document.getElementById("comment").value.trim(),
    };
    state.reference = referenceFor(state);
    sendToForm(state);
    renderPay(true);
  });

  payPanel.addEventListener("click", (e) => {
    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      copyText(copyBtn.getAttribute("data-copy")).then(() => {
        copyBtn.textContent = tr("signup.copied");
        setTimeout(() => { copyBtn.textContent = tr("signup.copy"); }, 1600);
      }).catch(() => {});
      return;
    }
  });

  document.addEventListener("config-ready", async () => {
    if ((config().signupForm || {}).url) {
      const note = document.querySelector('[data-i18n="signup.privacy"]');
      if (note) {
        note.setAttribute("data-i18n", "signup.privacyStored");
        applyI18n(window.__translations, config(), lang());
      }
    }
    try {
      const res = await fetch("data/events.json", { cache: "no-cache" });
      const all = await res.json();
      const today = localToday();
      events = all.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      console.error("Could not load events", err);
    }
    if (events.length === 0) {
      form.hidden = true;
      stepForm.hidden = true;
      noEvents.hidden = false;
      return;
    }
    fillOptions();
  });

  document.addEventListener("lang-changed", () => {
    if (events.length) fillOptions();
    if (state && !stepPay.hidden) renderPay(false);
  });
})();
