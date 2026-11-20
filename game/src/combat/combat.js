(function (root) {
  "use strict";

  const monsters = {
    jelly: { id: "puddle-jelly", name: "Puddle Jelly", move: "Normal attack", damage: 7, interval: 2,
      hint: "Attacks every two pushes." },
    crab: { id: "washer-crab", name: "Washer Crab", move: "Claw Slam", damage: 0, interval: 3,
      hint: "Claw Slam knocks the front coins into the trough. Collect them before it strikes to use them in your attack." },
    moth: { id: "spark-moth", name: "Spark Moth", move: "Spark coin", damage: 0, interval: 1,
      hint: "One coin sparks each push. A falling lightning coin hits the courier." },
    snail: { id: "bottlecap-snail", name: "Bottlecap Snail", move: "Bump", damage: 7, interval: 3, shell: 2,
      hint: "Drop three or more coins together to pierce the shell on that push." },
    dust: { id: "static-dustball", name: "Static Dustball", move: "Static coin", damage: 0, interval: 2,
      hint: "Push numbered coins into the trough before they reach zero and explode." },
    qilin: { id: "qilin", name: "Qilin", move: "Hoof Check", damage: 14, interval: 1, bossShield: 3, charge: 17,
      hint: "Drop four coins together to break the shield. Watch the horn for the incoming charge." },
    prime: { id: "qilin-prime", name: "Qilin Prime", move: "Hoof Check", damage: 17, interval: 1, bossShield: 5, charge: 21,
      hint: "Drop six coins together to break Prime’s shield. Guard can absorb the horn charge." },
  };
  const chapter = [
    [monsters.jelly, 200], [monsters.crab, 165], [monsters.moth, 110],
    [monsters.snail, 115], [monsters.qilin, 245], [monsters.dust, 135],
    [monsters.moth, 145], [monsters.crab, 175], [monsters.snail, 150, 10], [monsters.prime, 275],
  ].map(([monster, maxHp, damage = monster.damage], index) => Object.freeze({
    ...monster, maxHp, damage, stage: "1-" + (index + 1), countdown: monster.interval,
  }));

  const tuning = Object.freeze({
    stageShield: 0,
    hero: Object.freeze({ maxHp: 36, attack: 2 }),
    enemies: Object.freeze(chapter),
    sparkDamage: 8, staticDamage: 9, staticTurns: 3, slamCoins: 2,
    reserve: 3,
    maxReserve: 20,
    regen: 5,
    combo: Object.freeze([
      Object.freeze({ falls: 1, multiplier: 1 }),
      Object.freeze({ falls: 5, multiplier: 1.5 }),
      Object.freeze({ falls: 8, multiplier: 2 }),
    ]),
    guard: 6,
    shower: 5,
    heal: 6, // Prototype tuning, capped at missing HP.
    railgun: Object.freeze({ falls: 5, delay: 1, uses: 1 }),
    orbit: Object.freeze({ falls: 1, damage: 1, capacity: 1 }),
    counter: Object.freeze({ damage: 2, capacity: 1 }),
    supply: Object.freeze({ interval: 3, rotation: Object.freeze(["guard", "coinShower", "guard", "heal"]) }),
  });

  const offers = Object.freeze([
    Object.freeze({
      id: "railgun",
      name: "Railgun",
      description: "Collect 5 ordinary coins in one push to delay the next strike by 1 push. Staggers once per enemy.",
    }),
    Object.freeze({
      id: "orbitBlades",
      name: "Orbit Blades",
      description: "Collect an ordinary coin to store a blade. It deals 1 × ATK on your next push, even if nothing falls.",
    }),
    Object.freeze({
      id: "counterSaber",
      name: "Counter Saber",
      description: "Collect Guard to arm a counter. Deal 2 × ATK back when your shield absorbs the next strike.",
    }),
  ]);

  const gear = root.JadeGear || require("../gear.js");

  function create({ onShower = () => {}, config = {}, equipmentId = null, legacyUpgradeReplay = false, legacyIncome, legacyBalance = false } = {}) {
    const rules = { ...tuning, ...config };
    // Unversioned recordings used the previous chapter HP and combo thresholds.
    if (legacyBalance) {
      const hp = [155, 110, 76, 80, 165, 90, 96, 115, 100, 180];
      rules.enemies = config.enemies || chapter.map((enemy, i) => ({ ...enemy, maxHp: hp[i] }));
      rules.combo = config.combo || [{ falls: 1, multiplier: 1 }, { falls: 3, multiplier: 1.5 }, { falls: 5, multiplier: 2 }];
    }
    // Old replays recorded their income in the combat snapshot and had unlimited capacity.
    const maxReserve = legacyIncome === undefined ? tuning.maxReserve : Infinity;
    if (legacyIncome !== undefined) rules.regen = legacyIncome;
    const bonus = gear.bonuses(gear.decode(equipmentId));
    rules.guard += bonus.guard;
    rules.reserve += bonus.reserve;
    if (bonus.combo) {
      rules.combo = rules.combo.map(tier => tier.multiplier === 1.5
        ? { falls: tier.falls - 1, multiplier: 1.5 + (bonus.combo - 1) * .25 } : tier);
    }
    const maxHp = rules.hero.maxHp + bonus.health;
    const hero = { ...rules.hero, attack: rules.hero.attack + bonus.attack, maxHp, hp: maxHp, shield: rules.stageShield + bonus.shield };
    function startEnemy(template) {
      return { ...template, hp: template.maxHp, coinShield: template.shell || 0 };
    }
    let enemy = startEnemy(rules.enemies[0]);
    let fight = 1;
    let phase = "planning";
    let reserve = Math.min(rules.reserve, maxReserve);
    let completedPushes = 0;
    let upgrade = null;
    let lastRecap = null;
    let activePush = null;
    let lastPushId = 0;
    const effects = { railgunUsed: 0, storedBlade: 0, counterArmed: 0 };
    const spentIds = new Set();
    const collectedIds = new Set();

    function multiplierFor(falls) {
      for (let index = rules.combo.length - 1; index >= 0; index -= 1) {
        const tier = rules.combo[index];
        if (falls >= tier.falls) return tier.multiplier;
      }
      return 0;
    }

    function getState() {
      return {
        phase,
        fight,
        stage: enemy.stage,
        hero: { ...hero },
        enemy: { ...enemy },
        nextEnemy: rules.enemies[fight] || null,
        reserve,
        ...(legacyIncome === undefined ? { maxReserve } : {}),
        regen: rules.regen,
        completedPushes,
        upgrade,
        offers: phase === "upgrade" ? offers : [],
        effects: { ...effects },
        activePush: activePush && { ...activePush, multiplier: multiplierFor(activePush.ordinaryFalls) },
        lastRecap,
      };
    }

    function beginPush(pushId) {
      if (phase !== "planning" || !Number.isSafeInteger(pushId) || pushId <= lastPushId || reserve <= 0) {
        return false;
      }
      phase = "active";
      lastPushId = pushId;
      activePush = { id: pushId, spent: 0, ordinaryFalls: 0, guardFalls: 0, showerFalls: 0, sparkFalls: 0, totalFalls: 0 };
      return true;
    }

    function spend({ pushId, coinId }) {
      if (activePush?.id !== pushId || reserve <= 0 || !coinId || spentIds.has(coinId)) return false;
      spentIds.add(coinId);
      reserve -= 1;
      activePush.spent += 1;
      return true;
    }

    function fall({ pushId, coinId, kind, tick, x }) {
      if (activePush?.id !== pushId || !activePush.spent || !coinId || collectedIds.has(coinId)) return null;
      if (!["ordinary", "guard", "coinShower", "heal", "spark", "static"].includes(kind)) return null;
      activePush.totalFalls += 1;
      collectedIds.add(coinId);
      const event = { pushId, coinId, tick };
      if (kind === "spark") {
        activePush.sparkFalls += 1;
        return { ...event, type: "sparkFall" };
      }
      if (kind === "static") return { ...event, type: "staticDefused" };

      if (kind === "ordinary") {
        const ordinaryFalls = ++activePush.ordinaryFalls;
        return { ...event, type: "ordinaryFall", ordinaryFalls, multiplier: multiplierFor(ordinaryFalls) };
      }

      if (kind === "guard") {
        activePush.guardFalls += 1;
        hero.shield += rules.guard;
        if (upgrade === "counterSaber") {
          effects.counterArmed = Math.min(rules.counter.capacity, effects.counterArmed + 1);
        }
        return { ...event, type: "guard", shield: hero.shield, amount: rules.guard, counterArmed: effects.counterArmed };
      }

      if (kind === "heal") {
        const amount = Math.min(rules.heal, hero.maxHp - hero.hp);
        hero.hp += amount;
        return { ...event, type: "heal", hp: hero.hp, amount };
      }

      activePush.showerFalls += 1;
      onShower({ ...event, kind, x, count: rules.shower });
      return { ...event, type: "coinShower", count: rules.shower };
    }

    function settle({ pushId, tick, explosions = 0 }) {
      if (activePush?.id !== pushId || !activePush.spent) return null;
      const { spent, ordinaryFalls, guardFalls, showerFalls, sparkFalls, totalFalls } = activePush;
      activePush = null;
      completedPushes += 1;

      const events = [];
      const emit = (type, details) => events.push(Object.freeze({ type, pushId, tick, ...details }));
      const damageEnemy = (amount) => {
        enemy.hp = Math.max(0, enemy.hp - amount);
      };
      const multiplier = multiplierFor(ordinaryFalls);
      const hpBeforeAttack = hero.hp;
      const hitHero = (type, damage, details) => {
        const absorbed = Math.min(hero.shield, damage);
        const hpLoss = damage - absorbed;
        hero.shield -= absorbed;
        hero.hp = Math.max(0, hero.hp - hpLoss);
        emit(type, { damage, absorbed, hpLoss, ...details });
        return absorbed;
      };
      if (sparkFalls) hitHero("hazardDamage", sparkFalls * rules.sparkDamage, { source: "Spark" });
      if (explosions) hitHero("hazardDamage", explosions * rules.staticDamage, { source: "Static" });
      const blocked = enemy.coinShield > 0 && totalFalls <= enemy.coinShield;
      if (enemy.coinShield && !blocked) {
        emit("shieldPierced", { strength: enemy.coinShield });
        if (!enemy.shell) enemy.coinShield = 0;
      }
      if (blocked && ordinaryFalls) emit("shieldBlocked", { strength: enemy.coinShield });
      const damage = blocked ? 0 : ordinaryFalls * hero.attack * multiplier;
      if (damage > 0) {
        damageEnemy(damage);
        emit("ordinaryDamage", { amount: damage, ordinaryFalls, multiplier });
      }

      if (upgrade === "railgun" && ordinaryFalls >= rules.railgun.falls) {
        const stagger = enemy.hp > 0 && enemy.id !== "spark-moth" && effects.railgunUsed < rules.railgun.uses;
        if (stagger) {
          enemy.countdown += rules.railgun.delay;
          effects.railgunUsed += 1;
        }
        emit("railgun", { stagger, delay: stagger ? rules.railgun.delay : 0 });
      }

      if (upgrade === "orbitBlades") {
        if (effects.storedBlade > 0) {
          const amount = rules.orbit.damage * hero.attack;
          effects.storedBlade -= 1;
          damageEnemy(amount);
          emit("orbitBlade", { amount });
        }
        if (enemy.hp > 0 && ordinaryFalls >= rules.orbit.falls && effects.storedBlade < rules.orbit.capacity) {
          effects.storedBlade += 1;
          emit("orbitStored", { count: effects.storedBlade });
        }
      }

      if (enemy.hp > 0 && hero.hp > 0) {
        enemy.countdown -= 1;
        if (enemy.countdown === 0) {
          const move = enemy.move;
          let absorbed = 0;
          enemy.countdown = enemy.interval;
          if (move === "Coin shield") {
            enemy.coinShield = enemy.bossShield;
            emit("shieldRaised", { strength: enemy.coinShield });
          } else if (enemy.id === "washer-crab") {
            emit("clawSlam", { count: rules.slamCoins });
          } else if (enemy.id === "spark-moth" || enemy.id === "static-dustball") {
            emit("convertCoin", { kind: enemy.id === "spark-moth" ? "spark" : "static", turns: rules.staticTurns });
          } else {
            absorbed = hitHero("enemyAttack", enemy.damage, { move });
          }
          if (enemy.bossShield) {
            if (move === "Hoof Check") {
              enemy.move = "Coin shield";
              enemy.damage = 0;
            } else if (move === "Coin shield") {
              enemy.move = "Jade Horn Charge";
              enemy.damage = enemy.charge;
              enemy.countdown = 3;
            } else {
              enemy.move = "Hoof Check";
              enemy.damage = rules.enemies[fight - 1].damage;
            }
          }
          if (effects.counterArmed > 0 && absorbed > 0) {
            const amount = rules.counter.damage * hero.attack;
            effects.counterArmed -= 1;
            damageEnemy(amount);
            const rescued = hero.hp === 0 && enemy.hp === 0;
            if (rescued) hero.hp = 1;
            emit("counterSaber", { amount, rescued });
          }
        }
      }

      if (enemy.hp === 0 && hero.hp > 0) {
        phase = fight === rules.enemies.length ? "victory" : "stageClear";
        if (phase === "stageClear" && legacyUpgradeReplay && !upgrade) phase = "upgrade";
      } else {
        phase = hero.hp === 0 ? "defeat" : "planning";
      }

      let specialSupply = null;
      if (phase === "planning" || phase === "upgrade" || phase === "stageClear") {
        const income = Math.min(rules.regen, maxReserve - reserve);
        reserve += income;
        emit("regen", { amount: income, reserve });
        const { interval, rotation } = rules.supply;
        if (completedPushes % interval === 0) {
          const rotationIndex = completedPushes / interval - 1;
          specialSupply = rotation[rotationIndex % rotation.length];
          emit("specialSupply", { kind: specialSupply });
        }
      }

      lastRecap = Object.freeze({
        pushId, tick, fight, phase, spent, ordinaryFalls, guardFalls, showerFalls,
        multiplier, damage, blocked, specialSupply, hpBeforeAttack, events: Object.freeze(events),
      });
      return lastRecap;
    }

    function chooseUpgrade(id) {
      if (phase !== "upgrade" || !offers.some((offer) => offer.id === id)) return false;
      upgrade = id;
      phase = "stageClear";
      return nextStage();
    }

    function nextStage() {
      if (phase !== "stageClear") return false;
      enemy = startEnemy(rules.enemies[fight]);
      hero.shield += rules.stageShield;
      fight += 1;
      phase = "planning";
      effects.railgunUsed = 0;
      effects.storedBlade = 0;
      effects.counterArmed = 0;
      return true;
    }

    return { getState, beginPush, spend, fall, settle, chooseUpgrade, nextStage };
  }

  root.JadeCombat = Object.freeze({ create, tuning, offers, equipment: gear.items });
  if (typeof module !== "undefined" && module.exports) module.exports = root.JadeCombat;
})(globalThis);
