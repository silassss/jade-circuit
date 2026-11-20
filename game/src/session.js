(function (root) {
  "use strict";

  // Approved timing from starter-review.xlsx, Tuning!B20:B21.
  const stepSeconds = 1 / 60;
  const heldIntervalTicks = 15;
  const traverseTicks = 90;
  const defaultSeed = 107;
  const travelMargin = 0.048; // Ordinary coin radius in tray coordinates.

  function create({
    seed = defaultSeed,
    fixture = "opening",
    equipmentId = null,
    combatConfig,
    legacyUpgradeReplay = false,
    legacyIncome,
    legacyBalance = false,
    runDraft = !legacyUpgradeReplay && !legacyBalance,
    draftSeed = seed,
    legacyEpicPhysics = false,
    boardFactory = root.JadeBoard?.create,
    combatFactory = root.JadeCombat?.create,
    onFeedback = () => {},
  } = {}) {
    const board = boardFactory(seed, { fixture, legacyEpicPhysics, onImpact(contact) {
      const event = { type: "hailMaryImpact", pushId, tick, ...contact };
      events.push(event);
      onFeedback(event);
    } });
    const actions = [];
    const events = [];
    const setupFalls = [];
    let lastDropX;
    const combat = combatFactory({
      config: combatConfig,
      legacyUpgradeReplay,
      legacyIncome,
      legacyBalance,
      runDraft,
      random: root.JadeBoard.seededRandom("upgrades-" + draftSeed),
      onReward: (kind, count) => board.dropReward(kind, count),
      onLifeSteal: () => feedSpecial("heal"),
      equipmentId,
      onShower({ pushId, coinId, count }) {
        for (const coin of root.JadeBoard.insertShower(board, lastDropX, count)) {
          events.push({ type: "showerInsertion", pushId, tick, coinId: coin.coinId, sourceCoinId: coinId, x: coin.x });
        }
      },
    });

    let phase = "planning";
    let tick = 0;
    let aimTick = traverseTicks / 2;
    let pushId = 0;
    let nextDropTick = 0;
    let deferredSupply = null;

    function targetX() {
      const sweep = aimTick % (2 * traverseTicks);
      const fraction = (sweep <= traverseTicks ? sweep : 2 * traverseTicks - sweep) / traverseTicks;
      return travelMargin * (1 - fraction) + (1 - travelMargin) * fraction;
    }

    function read() {
      return { phase, seed, fixture, tick, targetX: targetX(), coins: board.coins, shelf: board.shelf, combat: combat.getState() };
    }

    function inspect() {
      return structuredClone(read());
    }

    function getReplay() {
      const record = { seed, fixture, tick, actions, events, phase, combat: combat.getState() };
      if (!legacyBalance) record.balanceVersion = runDraft ? (legacyEpicPhysics ? 3 : 4) : 2;
      if (runDraft) record.draftSeed = draftSeed;
      if (combatConfig) record.combatConfig = combatConfig;
      if (equipmentId) record.equipmentId = equipmentId;
      return structuredClone(record);
    }

    function finishInsertion() {
      if (phase !== "inserting") return false;
      phase = "resolving";
      board.shove();
      const stroke = { type: "stroke", pushId, tick };
      events.push(stroke);
      onFeedback(stroke);
      return true;
    }

    function drop() {
      const x = targetX();
      const state = combat.getState();
      const heavy = state.reserve === 1 && state.passives?.includes("hailMary");
      const coin = board.insert(x, "ordinary", heavy);
      if (!combat.spend({ pushId, coinId: coin.coinId })) {
        throw new Error("A physical player insertion could not be charged.");
      }
      lastDropX = coin.x;
      const insertion = { type: "paidInsertion", pushId, tick, coinId: coin.coinId, x, ...(heavy ? { heavy } : {}) };
      events.push(insertion);
      onFeedback(insertion);
      nextDropTick = tick + heldIntervalTicks;
      if (combat.getState().reserve === 0) finishInsertion();
    }

    function reportFall(fall) {
      const eventIndex = events.length;
      const event = combat.fall({ ...fall, pushId, tick });
      if (!event) return;
      events.splice(eventIndex, 0, { type: "fall", ...fall, pushId, tick });
      onFeedback({ ...event, x: fall.x });
    }

    function feedSpecial(kind) {
      const coin = board.feed(kind);
      events.push({ type: "specialFed", pushId, tick, kind, coinId: coin.coinId, x: coin.x });
    }

    function press() {
      if (phase !== "planning" || !combat.beginPush(pushId + 1)) return false;
      pushId += 1;
      actions.push({ type: "press", tick });
      phase = "inserting";
      if (deferredSupply !== null) {
        feedSpecial(deferredSupply);
        deferredSupply = null;
      }
      drop();
      for (const fall of setupFalls) reportFall(fall);
      setupFalls.length = 0;
      return true;
    }

    function release() {
      if (!finishInsertion()) return false;
      actions.push({ type: "release", tick });
      return true;
    }

    function chooseUpgrade(id) {
      if (phase !== "upgrade" || !combat.chooseUpgrade(id)) return false;
      actions.push({ type: "chooseUpgrade", id, tick });
      phase = combat.getState().phase;
      onFeedback({ type: "upgradeSelected", id, tick });
      return true;
    }

    function reroll() {
      if (phase !== "upgrade" || !combat.reroll()) return false;
      actions.push({ type: "reroll", tick });
      return true;
    }

    function nextStage() {
      if (phase !== "stageClear" || !combat.nextStage()) return false;
      actions.push({ type: "nextStage", tick });
      phase = "planning";
      return true;
    }

    function step() {
      tick += 1;
      if (phase === "planning" || phase === "inserting") aimTick += 1;
      if (phase === "inserting" && tick === nextDropTick) drop();
      if (phase === "slam") {
        for (const fall of board.step(stepSeconds)) {
          events.push({ type: "slamFall", ...fall, pushId, tick });
        }
        if (board.settled) {
          phase = "planning";
          if (deferredSupply) {
            feedSpecial(deferredSupply);
            deferredSupply = null;
          }
        }
        return;
      }
      if (phase !== "planning" && phase !== "inserting" && phase !== "resolving") return;

      if (!board.settled) {
        for (const fall of board.step(stepSeconds)) {
          if (phase === "planning") {
            // A scheduled rear feed owns no turn. Any spill belongs to the next paid push.
            setupFalls.push(fall);
          } else {
            reportFall(fall);
          }
        }
      }
      // A shower can reactivate a board that had just become quiet.
      if (phase !== "resolving" || !board.settled) return;
      const expired = board.tickStatic();
      for (const coinId of expired) events.push({ type: "staticExplosion", coinId, pushId, tick });
      const recap = combat.settle({ pushId, tick, explosions: expired.length });
      phase = recap.phase;
      events.push({ type: "settled", ...recap });
      for (const event of recap.events) {
        if (event.type === "clawSlam") {
          board.slam(event.count);
          phase = "slam";
        }
        if (event.type === "convertCoin") {
          const coinId = board.convertCoin(event.kind, event.turns);
          if (coinId) {
            const converted = { type: "coinConverted", coinId, kind: event.kind, pushId, tick };
            events.push(converted);
            onFeedback(converted);
          }
        }
        onFeedback(event);
      }
      if (phase === "upgrade" || phase === "stageClear") board.clearHazards();
      if (recap.specialSupply && phase === "planning") feedSpecial(recap.specialSupply);
      else if (recap.specialSupply) deferredSupply = recap.specialSupply;
      onFeedback({ type: "pushSettled", recap });
    }

    return { press, release, chooseUpgrade, reroll, nextStage, step, read, inspect, getReplay };
  }

  function replay(record, options = {}) {
    // Old traces can end on the offer screen or continue with a recorded attack.
    const runDraft = record.balanceVersion >= 3;
    const legacyUpgradeReplay = !runDraft && (record.phase === "upgrade" || record.actions.some(action => action.type === "chooseUpgrade"));
    const game = create({ ...options, seed: record.seed, fixture: record.fixture, equipmentId: record.equipmentId,
      combatConfig: record.combatConfig, runDraft, draftSeed: record.draftSeed, legacyUpgradeReplay, legacyBalance: record.balanceVersion === undefined,
      legacyEpicPhysics: record.balanceVersion === 3,
      legacyIncome: record.combat?.maxReserve === undefined ? record.combat?.regen : undefined });
    for (const action of record.actions) {
      while (game.read().tick < action.tick) game.step();
      if (!game[action.type](action.id)) {
        throw new Error(`Replay diverged at tick ${action.tick} during ${action.type}.`);
      }
    }
    while (game.read().tick < record.tick) game.step();
    return game.getReplay();
  }

  root.JadeSession = Object.freeze({ create, replay, defaultSeed, stepSeconds });
  if (typeof module !== "undefined" && module.exports) module.exports = root.JadeSession;
})(globalThis);
