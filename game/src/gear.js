(function (root) {
  "use strict";

  const slots = ["Weapon", "Ring", "Armor", "Boots", "Scarf", "Amulet"];
  const qualities = ["Common", "Fine", "Rare"];
  const items = [
    { id: "sparkBlade", name: "Spark Blade", slot: "Weapon", icon: "blade", effect: "attack", amount: 1 },
    { id: "comboDrive", name: "Combo Drive", slot: "Ring", icon: "ring", effect: "combo", amount: 1 },
    { id: "guardRelay", name: "Guard Relay", slot: "Armor", icon: "shield", effect: "guard", amount: 2 },
    { id: "streetSkates", name: "Street Skates", slot: "Boots", icon: "skate", effect: "reserve", amount: 1 },
    { id: "rallyScarf", name: "Rally Scarf", slot: "Scarf", icon: "scarf", effect: "health", amount: 4 },
    { id: "gateCharm", name: "Gate Charm", slot: "Amulet", icon: "charm", effect: "shield", amount: 2 },
    { id: "rainCoat", name: "Rain Coat", slot: "Armor", icon: "coat", effect: "health", amount: 5 },
  ];
  const byId = new Map(items.map(item => [item.id, item]));
  function piece(key) {
    if (typeof key !== "string") return null;
    const [id, rank, extra] = key.split(".");
    const item = byId.get(id);
    if (!item || extra !== undefined || !["1", "2", "3"].includes(rank)) return null;
    return { ...item, key, rank: Number(rank), quality: qualities[rank - 1] };
  }

  function description(item) {
    const value = item.amount * item.rank;
    switch (item.effect) {
      case "attack": return "+" + value + " attack per ordinary coin.";
      case "guard": return "+" + value + " shield per Guard token.";
      case "health": return "+" + value + " maximum HP.";
      case "reserve": return "+" + value + " starting coins.";
      case "shield": return "Begin each run with " + value + " shield.";
      case "combo": return (1.5 + (item.rank - 1) * .25) + "× combo from 4 ordinary coins.";
    }
  }

  function decode(value) {
    // Original single-module links and replays used the bare item ID.
    if (value === "comboDrive" || value === "guardRelay") value += ".1";
    const worn = {};
    for (const key of (typeof value === "string" ? value : "").split(",")) {
      const item = piece(key);
      if (item) worn[item.slot] = key;
    }
    return worn;
  }

  function encode(worn) { return slots.map(slot => worn[slot]).filter(Boolean).join(","); }

  function bonuses(worn) {
    const result = { attack: 0, guard: 0, health: 0, reserve: 0, shield: 0, combo: 0 };
    for (const key of Object.values(worn)) {
      const item = piece(key);
      if (item) result[item.effect] += item.amount * item.rank;
    }
    return result;
  }

  // Display rating for the prototype. Each equipped quality tier adds eight points.
  function power(worn) {
    return slots.reduce((total, slot) => total + 8 * (piece(worn[slot])?.rank || 0), 240);
  }

  function starter(legacy) {
    const worn = decode(legacy);
    const bag = {};
    for (const item of items) bag[item.id + ".1"] = item.id === "sparkBlade" ? 4 : 2;
    for (const key of Object.values(worn)) bag[key]--;
    return { bag, worn };
  }

  function change(state, action, key) {
    const item = piece(key);
    if (!item) return false;
    const { bag, worn } = state;
    const count = bag[key] || 0;
    const previous = worn[item.slot];
    if (action === "merge") {
      if (count < 2 || item.rank >= qualities.length) return false;
      const next = item.id + "." + (item.rank + 1);
      bag[key] -= 2;
      bag[next] = (bag[next] || 0) + 1;
    } else if (action === "equip") {
      if (count < 1 || previous === key) return false;
      if (previous) bag[previous] = (bag[previous] || 0) + 1;
      bag[key]--;
      worn[item.slot] = key;
    } else if (action === "remove") {
      if (previous !== key) return false;
      delete worn[item.slot];
      bag[key] = count + 1;
    } else return false;
    return true;
  }

  root.JadeGear = Object.freeze({ slots, qualities, items, piece, description, decode, encode, bonuses, power, starter, change });
  if (typeof module !== "undefined" && module.exports) module.exports = root.JadeGear;
})(globalThis);
