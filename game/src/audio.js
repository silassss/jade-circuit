(() => {
  "use strict";

  const base = new URL("../assets/audio/", document.currentScript.src);
  const track = document.currentScript.dataset.music;
  const music = new Audio(new URL(track + ".mp3", base));
  music.loop = true;
  music.volume = 0.19;
  const toggle = document.querySelector("[data-sound-toggle]");
  const preference = "jade-circuit.sound-muted";
  let muted = false;
  try { muted = localStorage.getItem(preference) === "yes"; } catch { /* Storage can be unavailable offline. */ }
  let paused = false;
  let finished = false;
  let hiddenPage = false;

  // Each cue has a gain relative to the music. Reuse overlapping voices for the cabinet sounds.
  const clips = {
    insert: ["chip-lay-1", 0.32], stroke: ["doorClose_000", 0.28],
    payout: ["coin_drop_0", 0.32], damage: ["impactMetal_000", 0.40],
    shower: ["chips-collide-1", 0.54], guard: ["forceField_000", 0.42],
    heal: ["pluck_001", 0.48], warning: ["tick_001", 0.45],
    hit: ["impactMetal_001", 0.48], pierce: ["glass_001", 0.48],
    hazard: ["glitch_001", 0.37], railgun: ["laserLarge_000", 0.48],
    orbit: ["laserSmall_001", 0.41], counter: ["drawKnife1", 0.46],
    click: ["click_001", 0.30], confirm: ["confirmation_001", 0.42],
    clear: ["jingles_NES01", 0.48], defeat: ["minimize_001", 0.48],
  };
  const voices = new Map();
  const lobby = track === "pynchon";
  for (const [id, [file]] of Object.entries(clips)) {
    if (lobby && id !== "click" && id !== "confirm") continue;
    const sample = new Audio(new URL(file + ".mp3", base));
    sample.preload = "auto";
    voices.set(id, [sample]);
  }
  let lastPayout = -Infinity;
  let healEcho;

  function silent() { return muted || paused || hiddenPage || document.hidden; }
  function updateToggle() {
    const on = !muted;
    toggle.textContent = on ? "Sound on" : "Sound off";
    toggle.setAttribute("aria-pressed", String(on));
  }
  function syncMusic() {
    if (silent() || finished) {
      music.pause();
    } else if (music.paused) {
      // A browser may defer autoplay. The next interaction retries playback
      // while the toggle continues to reflect the player's preference.
      music.play().catch(() => {});
    }
  }
  function stopEffects() {
    clearTimeout(healEcho);
    lastPayout = -Infinity;
    for (const pool of voices.values()) for (const voice of pool) voice.pause();
  }
  function sound(id, gain = 1, rate = 1) {
    if (silent()) return;
    const pool = voices.get(id);
    if (!pool) return;
    if (id === "payout") {
      const now = performance.now();
      if (now - lastPayout < 95) return;
      lastPayout = now;
    }
    let voice = pool.find(audio => audio.paused || audio.ended);
    if (!voice && pool.length < 2) {
      voice = pool[0].cloneNode();
      pool.push(voice);
    }
    if (!voice) return;
    voice.currentTime = 0;
    voice.volume = Math.min(1, clips[id][1] * gain);
    voice.preservesPitch = false;
    voice.playbackRate = rate;
    voice.play().catch(() => {});
  }
  function heal(amount) {
    sound("heal", amount ? 1 : 0.45);
    clearTimeout(healEcho);
    if (amount) healEcho = setTimeout(() => sound("heal", 0.75, 1.25), 120);
  }

  toggle.addEventListener("click", () => {
    muted = !muted;
    try { localStorage.setItem(preference, muted ? "yes" : "no"); } catch {}
    if (muted) stopEffects();
    updateToggle();
    syncMusic();
  });
  // A direct visit may require a trusted gesture before the browser permits music.
  function unlock(event) {
    if (!toggle.contains(event.target)) syncMusic();
  }
  for (const event of ["pointerdown", "pointerup", "keydown", "click"]) {
    document.addEventListener(event, unlock, true);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopEffects();
    syncMusic();
  });
  window.addEventListener("pagehide", () => { hiddenPage = true; stopEffects(); syncMusic(); });
  window.addEventListener("pageshow", () => { hiddenPage = false; syncMusic(); });

  window.JadeAudio = {
    sound, heal,
    pause(value) { paused = value; if (paused) stopEffects(); syncMusic(); },
    finish(value) { finished = value; if (!value) stopEffects(); syncMusic(); },
  };
  updateToggle();
  syncMusic();
})();
