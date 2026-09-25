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

  function confirmLink(total) {
    const c = config();
    const ev = state.ev;
    const lines = [
      tr("signup.waIntro", { event: ev.title, date: fullDate(ev) }),
      `${tr("signup.nameLabel")}: ${state.name}`,
      `${tr("signup.emailLabel")}: ${state.email}`,
      state.phone && `${tr("signup.phoneLabel")}: ${state.phone}`,
      `${tr("signup.peopleLabel")}: ${state.people}`,
      total !== null && `${tr("signup.summaryTotal")}: ${formatMoney(total, c)}`,
      state.comment && `${tr("signup.commentShort")}: ${state.comment}`,
    ].filter(Boolean);
    const message = lines.join("\n");
    const phone = (c.contactPhone || "").replace(/\D/g, "");
    if (phone) {
      return { href: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`, label: tr("signup.confirmWhatsapp"), external: true };
    }
    const subject = tr("signup.mailSubject", { event: ev.title });
    return {
      href: `mailto:${c.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`,
      label: tr("signup.confirmEmail"),
      external: false,
    };
  }

  function renderPay(scroll) {
    const c = config();
    const ev = state.ev;
    const total = ev.price > 0 ? ev.price * state.people : null;
    const concept = `${c.teamName} · ${ev.title} · ${state.name}`;
    const confirm = confirmLink(total);

    payPanel.innerHTML = `
      <div class="kicker">${tr("signup.kicker")}</div>
      <h2>${tr("signup.payHeading")}</h2>
      <p class="pay-lead">${tr("signup.payLead")}</p>

      <dl class="summary">
        <div><dt>${tr("signup.summaryEvent")}</dt><dd>${esc(ev.title)} · ${esc(shortDate(ev))}</dd></div>
        <div><dt>${tr("signup.summaryPeople")}</dt><dd>${state.people}</dd></div>
        <div><dt>${tr("signup.summaryTotal")}</dt><dd>${total !== null ? formatMoney(total, c) : tr("signup.toConfirm")}</dd></div>
      </dl>

      ${paymentMethods()}

      <div class="pay-method concept">
        <h3>${tr("signup.conceptLabel")}</h3>
        <div class="pay-value">
          <span>${esc(concept)}</span>
          <button class="copy-btn" type="button" data-copy="${esc(concept)}">${tr("signup.copy")}</button>
        </div>
      </div>

      <div class="pay-actions">
        <a class="btn btn-solid" href="${esc(confirm.href)}"${confirm.external ? ' target="_blank" rel="noopener"' : ""}>${confirm.label}</a>
        <button class="btn btn-outline" type="button" data-edit>${tr("signup.edit")}</button>
      </div>
      <p class="form-note">${tr("signup.afterNote")}</p>`;

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
      comment: document.getElementById("comment").value.trim(),
    };
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
    if (e.target.closest("[data-edit]")) {
      stepPay.hidden = true;
      stepForm.hidden = false;
      stepForm.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.addEventListener("config-ready", async () => {
    try {
      const res = await fetch("data/events.json");
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
