(() => {
  "use strict";

  document.addEventListener("click", event => {
    const control = event.target.closest("a, button, summary");
    if (control && !control.matches(":disabled, [data-sound-toggle], #detail-action, #talent-draw")) JadeAudio.sound("click");
  }, true);

  const { tuning } = JadeCombat;
  const enemies = document.getElementById("enemies");

  function label(tag, value) {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  }

  for (const enemy of tuning.enemies) {
    const card = document.createElement("article");
    card.className = "enemy";
    const portrait = document.createElement("img");
    portrait.src = "assets/" + enemy.id + ".png";
    portrait.alt = "";
    const info = document.createElement("div");
    info.append(label("small", "STAGE " + enemy.stage), label("strong", enemy.name),
      label("span", enemy.maxHp + " HP · " + enemy.hint));
    card.append(portrait, info);
    enemies.append(card);
  }

  const byId = id => document.getElementById(id);
  const drawButton = byId("talent-draw");
  const { pool, cost } = JadeTalents;
  byId("draw-price").textContent = cost.gold + " gold + " + cost.crystals + " crystal";
  const page = byId("talents");
  page.prepend(document.querySelector("#adventure .wallet").cloneNode(true));

  let focusedTalent = null;
  const cards = new Map();
  for (const talent of pool) {
    const item = document.createElement("li");
    const card = document.createElement("button");
    card.type = "button";
    card.className = "ticket " + talent.id;
    const icon = document.createElement("img");
    icon.src = "assets/rally/talents/" + talent.id + ".webp";
    icon.alt = "";
    const title = label("strong", talent.name);
    const level = label("small", "");
    const details = document.createElement("span");
    details.append(title, level);
    card.append(icon, details);
    card.addEventListener("click", () => {
      focusedTalent = talent.id;
      refresh();
    });
    cards.set(talent.id, { card, level });
    item.append(card);
    byId("talent-list").append(item);
  }
  for (let i = 0; i < 4; i += 1) {
    const item = label("li", "?");
    item.className = "ticket locked";
    item.setAttribute("aria-label", "Locked talent");
    byId("talent-list").append(item);
  }

  function renderProgress(progress, error = "") {
    const worn = JadeLoadout.read().worn;
    const bonus = JadeGear.bonuses(worn);
    const power = JadeGear.power(worn);
    for (const amount of document.querySelectorAll("[data-power]")) {
      amount.textContent = power;
      amount.closest(".identity").setAttribute("aria-label", "Courier profile, power " + power);
    }
    const stats = JadeTalents.stats(progress.levels, tuning);
    stats.attack += bonus.attack;
    stats.hp += bonus.health;
    stats.reserve += bonus.reserve;
    for (const element of document.querySelectorAll("[data-stat]")) {
      const key = element.dataset.stat;
      element.textContent = (key === "regen" ? "+" : "") + stats[key];
    }
    for (const element of document.querySelectorAll("[data-balance]")) {
      element.textContent = progress[element.dataset.balance].toLocaleString("en-US");
    }
    const selected = pool.find(t => t.id === (focusedTalent || progress.latest)) || pool[0];
    for (const [id, { card, level }] of cards) {
      level.textContent = "Lv. " + progress.levels[id];
      card.setAttribute("aria-pressed", String(id === selected.id));
    }
    const newDraw = !focusedTalent && selected.id === progress.latest;
    const level = progress.levels[selected.id];
    const value = stats[selected.stat];
    byId("result-icon").src = "assets/rally/talents/" + selected.id + ".webp";
    byId("draw-title").textContent = selected.name + "   Lv. " + (newDraw ? (level - 1) + " → " : "") + level;
    byId("draw-effect").textContent = selected.label + "   " + (newDraw ? (value - selected.bonus) + " → " : "") + value;
    const message = error || JadeTalents.unavailable(progress);
    byId("draw-message").textContent = message || "Talent crystals: " + progress.crystals;
    drawButton.disabled = !!message;

    const launchUrl = new URL("index.html", location.href);
    launchUrl.search = location.search;
    launchUrl.searchParams.set("gear", JadeGear.encode(worn) || "none");
    if (location.protocol === "file:") launchUrl.searchParams.set("talentLevels", JSON.stringify(progress.levels));
    for (const link of document.querySelectorAll("a.start")) link.href = launchUrl.href;
  }

  function refresh(error = "") {
    try {
      renderProgress(JadeTalents.load(localStorage), error);
    } catch {
      renderProgress(JadeTalents.starter(), "Talent save unavailable. Check browser storage.");
    }
  }

  drawButton.addEventListener("click", async () => {
    focusedTalent = null;
    drawButton.disabled = true;
    const purchase = () => {
      if (JadeTalents.unavailable(JadeTalents.load(localStorage))) { refresh(); return; }
      renderProgress(JadeTalents.draw(localStorage));
      JadeAudio.sound("confirm");
      window.dispatchEvent(new Event("talents-changed"));
    };
    try {
      if (navigator.locks) await navigator.locks.request(JadeTalents.key, purchase);
      else purchase();
    } catch {
      refresh("Couldn’t save the draw. Reload to try again.");
    }
  });
  window.addEventListener("storage", event => {
    if (!event.key || event.key === JadeTalents.key || event.key === JadeLoadout.key) refresh();
  });
  window.addEventListener("gear-changed", () => refresh());
  window.addEventListener("pageshow", () => refresh());
  refresh();

  const adventure = document.getElementById("adventure");
  const wind = adventure.querySelector(".lobby-wind");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  function syncWind() {
    if (adventure.hidden || document.hidden || reduceMotion.matches) {
      wind.pause();
      return;
    }
    if (!wind.hasAttribute("src")) wind.src = wind.dataset.src;
    wind.play().catch(() => wind.classList.remove("is-playing"));
  }
  wind.addEventListener("playing", () => wind.classList.add("is-playing"));
  wind.addEventListener("error", () => wind.classList.remove("is-playing"));
  reduceMotion.addEventListener("change", syncWind);
  document.addEventListener("visibilitychange", syncWind);
  window.addEventListener("pageshow", syncWind);

  const panels = [...document.querySelectorAll("main > section")];
  const dock = document.querySelector(".dock");
  function showPage(moveFocus) {
    const panel = panels.find(item => "#" + item.id === location.hash) || panels[0];
    for (const item of panels) item.hidden = item !== panel;
    syncWind();
    dock.hidden = !["adventure", "equipment", "talents"].includes(panel.id);
    for (const link of dock.querySelectorAll("a")) {
      const active = link.hash === "#" + panel.id;
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
      const caption = link.querySelector("span");
      if (caption) caption.hidden = !active;
    }
    panel.scrollTop = 0;
    const heading = panel.querySelector("h1");
    document.title = "Jade Circuit · " + heading.textContent;
    if (moveFocus) heading.focus({ preventScroll: true });
  }
  window.addEventListener("hashchange", () => showPage(true));
  showPage(false);
})();
