(function () {
  "use strict";

  const query = new URLSearchParams(window.location.search);
  const equipmentId = query.has("gear")
    ? JadeGear.encode(JadeGear.decode(query.get("gear"))) : JadeGear.encode(JadeLoadout.read().worn);
  const requestedSeed = query.get("seed");
  const parsedSeed = Number(requestedSeed);
  const seed = /^\d+$/.test(requestedSeed || "") && Number.isSafeInteger(parsedSeed)
    ? parsedSeed
    : JadeSession.defaultSeed;
  const requestedFixture = query.get("fixture");
  const fixture = ["sparse", "dense"].includes(requestedFixture) ? requestedFixture : "opening";
  const stepMs = JadeSession.stepSeconds * 1000;
  const loading = document.querySelector(".run-loading");
  const loadingPercent = loading.querySelector(".loading-percent");
  const pauseButton = document.querySelector(".jade-pause");
  const pausePanel = document.getElementById("pause-panel");
  let entryStart = null;
  let game;
  let feedback = [];
  let gesture = null;
  let previousTime = null;
  let accumulated = 0;

  const view = new JadeView(document.getElementById("game"), {
    onDefeat: guideFirstDefeat,
    onChooseUpgrade(id) {
      if (game.chooseUpgrade(id)) {
        draw();
        view.travelToNextFight();
      }
    },
    onReroll() {
      if (game.reroll()) draw();
    },
    onNextStage() {
      if (game.nextStage()) draw();
    },
    onReplay: restart,
  });
  const button = view.pushButton;

  function guideFirstDefeat() {
    const key = "jade-circuit.first-defeat-merge";
    // Prefer a browser-wide record. Session storage also works in restricted embeds.
    let recorded = false;
    for (const store of ["localStorage", "sessionStorage"]) {
      try {
        if (window[store].getItem(key)) return false;
        window[store].setItem(key, "seen");
        recorded = true;
        break;
      } catch { /* Try the next available store. */ }
    }
    if (!recorded) {
      if (window.name.includes(key)) return false;
      window.name += " " + key;
    }
    const url = new URL("home.html", location.href);
    for (const param of ["seed", "fixture"]) {
      if (query.has(param)) url.searchParams.set(param, query.get(param));
    }
    url.searchParams.set("guide", "first-merge");
    url.hash = "equipment";
    location.replace(url);
    return true;
  }

  function draw() {
    view.render(game.read());
    for (const event of feedback) view.feedback(event);
    feedback = [];
  }

  function createRun() {
    let levels = JadeTalents.starter().levels;
    try {
      const passed = location.protocol === "file:" && query.get("talentLevels");
      const candidate = passed ? JSON.parse(passed) : JadeTalents.load(localStorage).levels;
      if (JadeTalents.validLevels(candidate)) levels = candidate;
    } catch {
      // Use the four starter talents when the save cannot be read.
    }
    const combatConfig = JadeTalents.combatConfig(levels, JadeCombat.tuning);
    const draftSeed = requestedSeed === null ? crypto.getRandomValues(new Uint32Array(1))[0] : seed;
    return JadeSession.create({ seed, draftSeed, fixture, equipmentId, combatConfig, onFeedback: event => feedback.push(event) });
  }

  function startEntry() {
    entryStart = null;
    loadingPercent.textContent = "0%";
    view.root.inert = true;
    loading.hidden = false;
    pauseButton.disabled = true;
  }

  function advanceEntry(time) {
    entryStart ??= time;
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1350;
    const fraction = duration ? Math.min(1, (time - entryStart) / duration) : 1;
    const loaded = document.readyState === "complete";
    const percent = Math.min(loaded ? 100 : 94, Math.floor(100 * fraction));
    if (loadingPercent.textContent !== percent + "%") {
      loadingPercent.textContent = percent + "%";
      if (duration) return;
    }
    if (percent < 100) return;
    loading.hidden = true;
    pauseButton.disabled = false;
    view.root.inert = false;
    button.focus({ preventScroll: true });
  }

  function restart() {
    gesture = null;
    previousTime = null;
    accumulated = 0;
    feedback = [];
    JadeAudio.finish(false);
    game = createRun();
    draw();
    startEntry();
  }

  function beginGesture(type, id) {
    if (!loading.hidden || pausePanel.open || gesture || document.hidden || !game.press()) return false;
    gesture = { type, id };
    return true;
  }

  function endGesture(type, id) {
    if (gesture?.type !== type || gesture.id !== id) return;
    gesture = null;
    if (game.release()) draw();
  }

  button.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || !event.isPrimary) return;
    if (!beginGesture("pointer", event.pointerId)) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    draw();
  });
  for (const name of ["pointerup", "pointercancel"]) {
    window.addEventListener(name, (event) => endGesture("pointer", event.pointerId), true);
  }
  button.addEventListener("lostpointercapture", (event) => endGesture("pointer", event.pointerId));

  const activationKeys = new Set([" ", "Enter"]);
  button.addEventListener("keydown", (event) => {
    if (!activationKeys.has(event.key)) return;
    event.preventDefault();
    if (!event.repeat && beginGesture("keyboard", event.code)) draw();
  });
  window.addEventListener("keyup", (event) => {
    if (!activationKeys.has(event.key) || gesture?.type !== "keyboard") return;
    event.preventDefault();
    endGesture("keyboard", event.code);
  }, true);
  button.addEventListener("blur", () => {
    if (gesture?.type === "keyboard" && !document.hidden) endGesture("keyboard", gesture.id);
  });
  button.addEventListener("click", (event) => {
    // Screen readers and other assistive input can activate a button without a down event.
    if (event.detail === 0 && beginGesture("click", 0)) {
      endGesture("click", 0);
      draw();
    }
  });

  pauseButton.addEventListener("click", () => {
    if (!loading.hidden || pausePanel.open) return;
    if (gesture) endGesture(gesture.type, gesture.id);
    previousTime = null;
    pausePanel.showModal();
    JadeAudio.pause(true);
  });
  pausePanel.addEventListener("close", () => JadeAudio.pause(false));
  pausePanel.querySelector(".pause-resume").onclick = () => pausePanel.close();
  // Reload the same launch URL to discard all pending effects and stage transitions.
  pausePanel.querySelector(".pause-restart").onclick = () => location.reload();

  document.addEventListener("visibilitychange", () => {
    previousTime = null;
    accumulated = 0;
  });

  function frame(time) {
    if (!document.hidden && !loading.hidden) {
      advanceEntry(time);
    } else if (!document.hidden && !pausePanel.open) {
      const elapsed = previousTime === null ? 0 : Math.min(time - previousTime, 100);
      previousTime = time;
      accumulated += elapsed;
      while (accumulated >= stepMs) {
        game.step();
        accumulated -= stepMs;
      }
      draw();
    }
    window.requestAnimationFrame(frame);
  }

  game = createRun();
  window.jadeSession = Object.freeze({ inspect: () => game.inspect(), getReplay: () => game.getReplay() });
  draw();
  startEntry();
  window.requestAnimationFrame(frame);
})();
