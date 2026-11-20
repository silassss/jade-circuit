(function (root) {
  "use strict";

  const key = "jade-circuit.progress.v1";
  const cost = Object.freeze({ gold: 200, crystals: 1 });
  const pool = Object.freeze([
    { id: "wall", name: "Iron Wall", stat: "shield", label: "Stage-start shield", bonus: 2 },
    { id: "strength", name: "Strength", stat: "attack", label: "Attack", bonus: 1 },
    { id: "sturdy", name: "Sturdy", stat: "hp", label: "Max HP", bonus: 6 },
    { id: "regen", name: "Coin Regen", stat: "regen", label: "Coins after each push", bonus: 1 },
  ]);

  function starter() {
    return { gold: 1250, crystals: 8, levels: Object.fromEntries(pool.map(t => [t.id, 1])), latest: null };
  }

  function validLevels(levels) {
    return levels && pool.every(t => Number.isSafeInteger(levels[t.id]) && levels[t.id] >= 1);
  }

  function load(storage) {
    const raw = storage.getItem(key);
    if (raw === null) return starter();
    const saved = JSON.parse(raw);
    if (![saved.gold, saved.crystals].every(n => Number.isSafeInteger(n) && n >= 0)) {
      throw new Error("Invalid talent wallet");
    }
    if (Array.isArray(saved.owned)) {
      // Credit each previously purchased prototype card toward its successor.
      const aliases = new Map([["purse", "regen"], ["heart", "sturdy"], ["strike", "strength"]]);
      const { levels } = starter();
      for (const id of new Set(saved.owned)) {
        if (!aliases.has(id)) throw new Error("Unknown legacy talent");
        levels[aliases.get(id)] += 1;
      }
      return { gold: saved.gold, crystals: saved.crystals, levels, latest: null };
    }
    if (!validLevels(saved.levels)) throw new Error("Invalid talent levels");
    return saved;
  }

  function unavailable(progress) {
    const missing = [];
    if (progress.gold < cost.gold) missing.push((cost.gold - progress.gold) + " gold");
    if (progress.crystals < cost.crystals) missing.push("1 crystal");
    return missing.length ? "Need " + missing.join(" and ") + " to draw." : "";
  }

  function draw(storage, random = Math.random) {
    const progress = load(storage);
    if (unavailable(progress)) return progress;
    const { id } = pool[Math.floor(random() * pool.length)];
    const next = { gold: progress.gold - cost.gold, crystals: progress.crystals - cost.crystals,
      levels: { ...progress.levels, [id]: progress.levels[id] + 1 }, latest: id };
    storage.setItem(key, JSON.stringify(next));
    return next;
  }

  function stats(levels, tuning) {
    const result = { reserve: tuning.reserve, hp: tuning.hero.maxHp, attack: tuning.hero.attack, regen: tuning.regen, shield: 0 };
    for (const talent of pool) {
      // The starter income already includes Coin Regen level 1.
      const bonusLevels = levels[talent.id] - (talent.id === "regen" ? 1 : 0);
      result[talent.stat] += talent.bonus * bonusLevels;
    }
    return result;
  }

  function combatConfig(levels, tuning) {
    const values = stats(levels, tuning);
    return { stageShield: values.shield, regen: values.regen, hero: { ...tuning.hero, maxHp: values.hp, attack: values.attack } };
  }

  root.JadeTalents = Object.freeze({ key, cost, pool, starter, load, unavailable, draw, stats, combatConfig, validLevels });
  if (typeof module !== "undefined" && module.exports) module.exports = root.JadeTalents;
})(globalThis);
