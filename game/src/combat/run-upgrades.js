(function (root) {
  "use strict";

  const standard = [
    ["health", "Max health", 10, n => `Gain ${n}% of your starting max HP.`],
    ["crit", "Critical chance", 3, n => `+${n} percentage points to land a double-damage push.`],
    ["attack", "Base attack", 10, n => `Gain ${n}% of your starting ATK.`],
    ["ordinary", "Coin drop", 5, n => `Drop ${n} coins on top of the pile.`],
    ["coinShower", "Coin Shower", 1, n => `Add ${n} Coin Shower token${n === 1 ? "" : "s"} to the tray.`],
    ["heal", "Heal coins", 1, n => `Add ${n} Heal coin${n === 1 ? "" : "s"} to the tray.`],
    ["guard", "Defence coins", 1, n => `Add ${n} Guard coin${n === 1 ? "" : "s"} to the tray.`],
  ];
  const epics = [
    ["hailMary", "Hail Mary", "Your last reserve coin becomes a heavy brass slug that shoves the pile where it lands."],
    ["lifeSteal", "Life Steal", "Every 5 coins you push over the lip feeds a Heal coin onto the tray."],
    ["heartOfSteel", "Heart of Steel", "At full HP, collecting a Heal coin grants its healing value as shield."],
    ["tower", "Coin Tower", "Raise a hollow wall of 30 coins from inside the machine."],
  ];
  const cards = [
    ...["Common", "Uncommon"].flatMap((rarity, rank) =>
      standard.map(([effect, name, base, describe]) => {
        const amount = base * (rank + 1);
        return { id: rarity + "-" + effect, rarity, effect, name, amount, description: describe(amount) };
      })),
    ...epics.map(([effect, name, description]) => ({ id: effect, effect, name, description, rarity: "Epic" })),
  ].map(Object.freeze);

  function draw(random, owned, previous = []) {
    // Evenly spaced rolls give each card 50/40/10 odds and keep a hand varied.
    // A random offset rotates the rarity order in the three display slots.
    const offset = random();
    const hand = [];
    for (let i = 0; i < 3; i++) {
      const roll = (offset + i / 3) % 1;
      const rarity = roll < .5 ? "Common" : roll < .9 ? "Uncommon" : "Epic";
      const eligible = cards.filter(card => card.rarity === rarity && !owned.has(card.effect)
        && !hand.some(other => other.effect === card.effect));
      const fresh = eligible.filter(card => !previous.some(other => other.id === card.id));
      const pool = fresh.length ? fresh : eligible;
      hand.push(pool[Math.floor(random() * pool.length)]);
    }
    return hand;
  }

  root.JadeRunUpgrades = Object.freeze({ cards, draw });
  if (typeof module !== "undefined" && module.exports) module.exports = root.JadeRunUpgrades;
})(globalThis);
