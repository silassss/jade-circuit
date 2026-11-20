(function (global) {
  'use strict';

  const REAR = 0.10;
  const STROKE = 0.225;
  const LIP = 1;
  const COLLECTION_Z = -0.065;
  const GRAVITY = 4.6;
  const SUBSTEPS = 2;
  const CONTACT_PASSES = 5;
  const QUIET_TIME = 0.18;
  const COIN_TYPES = Object.freeze({
    ordinary: { radius: 0.048, thickness: 0.021, inverseMass: 1 },
    coinShower: { radius: 0.055, thickness: 0.039, inverseMass: 0.64 },
    heal: { radius: 0.055, thickness: 0.039, inverseMass: 0.64 },
    guard: { radius: 0.055, thickness: 0.039, inverseMass: 0.64 }
  });

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function smooth(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function seededRandom(seed) {
    let state = 2166136261;
    for (const character of String(seed)) {
      state = Math.imul(state ^ character.codePointAt(0), 16777619);
    }
    return function () {
      state = (state + 0x6d2b79f5) | 0;
      let n = Math.imul(state ^ (state >>> 15), state | 1);
      n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(seed, { fixture = 'opening' } = {}) {
    const random = seededRandom(seed);
    const coins = [];
    const collisionOrder = [];
    let nextIdentity = 0;
    let quiet = QUIET_TIME;
    let strokeTime = null;
    let shelf = REAR;
    let loading = true;

    function addCoin(kind, x, y, z, vy = 0) {
      const type = Object.hasOwn(COIN_TYPES, kind) && COIN_TYPES[kind];
      if (!type) throw new RangeError(`Unknown coin kind: ${kind}`);
      const { radius, thickness, inverseMass } = type;
      const coin = {
        coinId: `c${++nextIdentity}`, kind,
        x: clamp(x, radius, 1 - radius), y, z: z ?? thickness / 2,
        radius, thickness, rotation: random() * 2 * Math.PI, lean: 0,
        vx: 0, vy, vz: 0, inverseMass, lipX: null, edgeState: null,
        pivotOffset: 0, pitchSpeed: 0, faceSupported: false,
        previousX: x, previousY: y, previousZ: z ?? thickness / 2
      };
      coins.push(coin);
      return coin;
    }

    function seedPile() {
      if (fixture === 'empty') return;
      if (fixture === 'sparse') {
        addCoin('ordinary', 0.23, 0.37);
        addCoin('ordinary', 0.29, 0.45);
        addCoin('ordinary', 0.70, 0.38);
        addCoin('guard', 0.60, 0.56);
        addCoin('coinShower', 0.42, 0.57);
        addCoin('heal', 0.78, 0.62);
        return;
      }
      if (fixture !== 'opening' && fixture !== 'dense') {
        throw new RangeError(`Unknown board fixture: ${fixture}`);
      }

      // Start from staggered rows and relax the coins into irregular pockets.
      // Low stacks keep the bed layered while leaving room for each to slide.
      const opening = fixture === 'opening';
      const jitterX = opening ? 0.044 : 0.016;
      const jitterY = opening ? 0.077 : 0.020;
      const stackChance = opening ? 0.25 : 0.90;
      const rearClearance = opening ? 0.027 : 0;
      const frontOffsets = { ordinary: 0, guard: -0.033, coinShower: 0.014 };
      for (let row = 0; row < 8; row++) {
        const stagger = row % 2;
        for (let column = 0; column < 10 - stagger; column++) {
          let kind = 'ordinary';
          if (row === 7 && column === 2) kind = 'guard';
          if (row === 7 && column === 6) kind = 'coinShower';
          if (row === 6 && column === 3) kind = 'heal';
          // This Guard has farther to travel before it reaches the lip.
          if (opening && row === 5 && column === 8) kind = 'guard';
          const x = (column + 0.5 + stagger / 2) / 10 + (random() - 0.5) * jitterX;
          const frontOffset = opening && row === 7 ? frontOffsets[kind] : 0;
          const y = 0.353 + row * 0.089 + (7 - row) / 7 * rearClearance
            + (random() - 0.5) * jitterY + frontOffset;
          const base = addCoin(kind, x, y);
          if (row > 0 && row < 7 && random() < stackChance) {
            addCoin('ordinary', x + (random() - 0.5) * 0.046,
              y + (random() - 0.5) * 0.046, base.thickness / 2 + 0.011);
            if (fixture === 'dense') {
              addCoin('ordinary', x + (random() - 0.5) * 0.037,
                y + (random() - 0.5) * 0.035, base.thickness / 2 + 0.032);
            }
          }
        }
      }
      if (opening) {
        addCoin('ordinary', 0.41 + (random() - 0.5) * 0.026, 0.254 + (random() - 0.5) * 0.026);
      }
    }

    function resolveContact(a, b) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const radius = a.radius + b.radius;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared >= radius * radius) return;

      const dz = b.z - a.z;
      const height = (a.thickness + b.thickness) / 2;
      const rise = Math.abs(dz);
      if (rise >= height) return;

      const distance = Math.sqrt(distanceSquared);
      const gap = radius - distance;
      const mass = a.inverseMass + b.inverseMass;
      const priorRise = Math.abs(b.previousZ - a.previousZ);
      if (priorRise > height * 0.48 && gap > 0.008 && height - rise < gap * 1.5) {
        // A loaded face supports the stack and resists sliding. Grip scales
        // with the vertical load and fades when only the two rims overlap.
        const normal = height - rise;
        const upperIsB = (dz || b.previousZ - a.previousZ) > 0;
        const correction = (upperIsB ? 1 : -1) * normal / mass;
        a.z -= correction * a.inverseMass;
        b.z += correction * b.inverseMass;
        // An overhanging upper coin can remain borne by a lower face as long
        // as that face extends under its center of mass.
        const upper = upperIsB ? b : a;
        const lower = upperIsB ? a : b;
        if (distance < lower.radius) upper.faceSupported = true;
        const slipX = (b.x - b.previousX) - (a.x - a.previousX);
        const slipY = (b.y - b.previousY) - (a.y - a.previousY);
        const slip = Math.hypot(slipX, slipY);
        if (slip > 0) {
          const contact = clamp((gap - 0.008) / (radius * 0.37), 0, 1);
          const grip = Math.min(slip, normal * contact * 1.30) / (slip * mass);
          a.x += slipX * grip * a.inverseMass;
          a.y += slipY * grip * a.inverseMass;
          b.x -= slipX * grip * b.inverseMass;
          b.y -= slipY * grip * b.inverseMass;
        }
        return;
      }

      const nx = distance > 0 ? dx / distance : 1;
      const ny = distance > 0 ? dy / distance : 0;
      const correction = gap * 0.92 / mass;
      a.x -= correction * nx * a.inverseMass;
      a.y -= correction * ny * a.inverseMass;
      b.x += correction * nx * b.inverseMass;
      b.y += correction * ny * b.inverseMass;
    }

    function constrain(coin) {
      coin.x = clamp(coin.x, coin.radius, 1 - coin.radius);
      const half = coin.thickness / 2;
      if (coin.y <= LIP) coin.z = Math.max(half, coin.z);
      // The translating shelf transmits its stroke only through coins it
      // touches. An airborne drop can land in front of its moving face.
      const wall = coin.z - half < 0.085 ? shelf : REAR;
      coin.y = Math.max(wall + coin.radius, coin.y);
      if (loading) coin.y = Math.min(0.982, coin.y);
    }

    function leaveSupport(coin) {
      coin.lipX = coin.x;
      const half = coin.thickness / 2;
      const overshoot = coin.y - LIP;
      if (coin.z <= half + 0.012 && overshoot < coin.radius * 0.82) {
        coin.edgeState = 'tipping';
        coin.pivotOffset = Math.max(0.002, overshoot);
        coin.pitchSpeed = clamp(coin.vy / coin.radius * 0.19, 0, 2.2);
        coin.vz = 0;
      } else {
        coin.edgeState = 'falling';
        coin.pitchSpeed = clamp(coin.vy / coin.radius * 0.4, 0.15, 4);
      }
    }

    function advanceEdge(coin, dt) {
      coin.x = clamp(coin.x + coin.vx * dt, coin.radius, 1 - coin.radius);
      if (coin.edgeState === 'tipping') {
        // Once the center of mass passes the edge, gravity rotates the disc
        // about its bed contact. The disc can still slide on that pivot.
        const half = coin.thickness / 2;
        coin.vx *= Math.exp(-10 * dt);
        coin.vy *= Math.exp(-12 * dt);
        coin.pivotOffset += Math.max(0, coin.vy) * dt;
        const lever = coin.pivotOffset;
        const inertia = coin.radius * coin.radius / 4 + lever * lever;
        const torque = GRAVITY * (lever * Math.cos(coin.lean) + half * Math.sin(coin.lean));
        coin.pitchSpeed = (coin.pitchSpeed + torque / inertia * dt) * Math.exp(-4 * dt);
        coin.lean += coin.pitchSpeed * dt;
        const sin = Math.sin(coin.lean);
        const cos = Math.cos(coin.lean);
        coin.y = LIP + lever * cos + half * sin;
        coin.z = half * cos - lever * sin;
        if (coin.lean >= 0.69 || lever >= coin.radius * 0.82) {
          coin.edgeState = 'falling';
          coin.vy = Math.max(0, coin.vy * cos + coin.pitchSpeed * (half * cos - lever * sin));
          coin.vz = -coin.vy * sin - coin.pitchSpeed * (half * sin + lever * cos);
        }
      } else {
        coin.y += coin.vy * dt;
        coin.vz -= GRAVITY * dt;
        coin.z += coin.vz * dt;
        coin.lean = Math.min(Math.PI / 2, coin.lean + coin.pitchSpeed * dt);
      }
    }

    function advanceBodies(dt, falls) {
      collisionOrder.length = 0;
      for (const coin of coins) {
        if (coin.edgeState !== null) {
          advanceEdge(coin, dt);
          continue;
        }
        coin.previousX = coin.x;
        coin.previousY = coin.y;
        coin.previousZ = coin.z;
        coin.faceSupported = false;
        const drag = coin.z < 0.061 ? Math.exp(-22 * dt) : Math.exp(-2.7 * dt);
        coin.vx *= drag;
        coin.vy *= drag;
        coin.vz -= GRAVITY * dt;
        coin.x += coin.vx * dt;
        coin.y += coin.vy * dt;
        coin.z += coin.vz * dt;
        constrain(coin);
        collisionOrder.push(coin);
      }

      for (let pass = 0; pass < CONTACT_PASSES; pass++) {
        collisionOrder.sort((a, b) => a.y - b.y);
        for (let i = 0; i < collisionOrder.length; i++) {
          const a = collisionOrder[i];
          for (let j = i + 1; j < collisionOrder.length; j++) {
            const b = collisionOrder[j];
            // Sorting by depth keeps the broad phase small on a dense tray.
            if (b.y - a.y > 0.127) break;
            resolveContact(a, b);
          }
        }
        for (const coin of collisionOrder) constrain(coin);
      }

      let moving = false;
      let standing = 0;
      for (const coin of coins) {
        const half = coin.thickness / 2;
        if (coin.edgeState !== null) {
          if (coin.z <= COLLECTION_Z) {
            falls.push({ coinId: coin.coinId, kind: coin.kind, x: coin.lipX });
            continue;
          }
          moving = true;
          coins[standing++] = coin;
          continue;
        }

        // Carry some contact motion into the next step, with low restitution.
        // The remaining correction resolves interpenetration without a kick.
        coin.vx = clamp(coin.vx * 0.60 + (coin.x - coin.previousX) * 0.40 / dt, -1.4, 1.4);
        coin.vy = clamp(coin.vy * 0.60 + (coin.y - coin.previousY) * 0.40 / dt, -1.4, 1.4);
        const vz = (coin.z - coin.previousZ) / dt;
        coin.vz = vz > 0 ? vz * 0.24 : vz;
        const overhang = clamp((coin.y + coin.radius - LIP) / coin.radius, 0, 1);
        const tilt = overhang * overhang * 0.10;
        coin.lean += (tilt - coin.lean) * Math.min(1, dt * 12);
        if (coin.y > LIP && !coin.faceSupported) leaveSupport(coin);
        moving ||= coin.edgeState !== null || Math.abs(coin.vx) > 0.024 || Math.abs(coin.vy) > 0.024
          || Math.abs(coin.vz) > 0.035 || coin.z < half - 0.001;
        coins[standing++] = coin;
      }
      coins.length = standing;
      return moving;
    }

    function step(dt) {
      const falls = [];
      if (quiet >= QUIET_TIME || !Number.isFinite(dt) || dt <= 0) return falls;

      const slice = dt / SUBSTEPS;
      for (let i = 0; i < SUBSTEPS; i++) {
        if (strokeTime !== null) {
          strokeTime += slice;
          const extension = smooth((strokeTime - 0.20) / 0.63);
          const retraction = smooth((strokeTime - 0.94) / 0.34);
          shelf = REAR + STROKE * (extension - retraction);
          if (strokeTime >= 1.28) strokeTime = null;
        }
        const moving = advanceBodies(slice, falls);
        quiet = moving || strokeTime !== null || falls.length ? 0 : quiet + slice;
      }
      return falls;
    }

    function insert(x, kind = 'ordinary') {
      if (!Number.isFinite(x)) throw new TypeError('Coin x must be a number');
      const coin = addCoin(kind, x, 0.195, 0.225);
      quiet = 0;
      return coin;
    }

    function shove() {
      if (strokeTime !== null) return false;
      strokeTime = 0;
      quiet = 0;
      return true;
    }

    function frontCoins() {
      return coins.filter(coin => coin.edgeState === null).sort((a, b) => b.y - a.y);
    }

    function convertCoin(kind, turns) {
      // The front two rows give the player a reachable target without moving the pile.
      const choices = frontCoins().filter(coin => coin.kind === 'ordinary').slice(0, 10);
      if (!choices.length) return null;
      const coin = choices[Math.floor(random() * choices.length)];
      coin.kind = kind;
      if (kind === 'static') coin.turns = turns;
      return coin.coinId;
    }

    function tickStatic() {
      const expired = [];
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (coin.kind !== 'static' || --coin.turns > 0) continue;
        expired.push(coin.coinId);
        coins.splice(i, 1);
        quiet = 0;
      }
      return expired;
    }

    function clearHazards() {
      for (const coin of coins) {
        if (coin.kind === 'spark' || coin.kind === 'static') {
          coin.kind = 'ordinary';
          delete coin.turns;
        }
      }
    }

    function slam(count) {
      const targets = frontCoins().slice(0, count);
      for (const coin of targets) {
        // The cabinet jolt tosses the leading pieces into the trough.
        coin.lipX = coin.x;
        coin.edgeState = 'falling';
        coin.vy = Math.max(0.55, (LIP - coin.y) * 4);
        coin.vz = 0.6;
        coin.pitchSpeed = 3;
      }
      quiet = 0;
    }

    function feed(kind) {
      const candidates = [0.18, 0.34, 0.50, 0.66, 0.82];
      const start = Math.floor(random() * candidates.length);
      let x = candidates[start];
      let bestClearance = -1;
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[(i + start) % candidates.length];
        let clearance = Infinity;
        for (const coin of coins) {
          clearance = Math.min(clearance, Math.hypot(candidate - coin.x, 0.17 - coin.y));
        }
        if (clearance > bestClearance) {
          bestClearance = clearance;
          x = candidate;
        }
      }
      const coin = addCoin(kind, x, 0.17, 0.15);
      quiet = 0;
      return coin;
    }

    seedPile();
    // Settle the opening load behind a temporary gate so preloading the tray
    // cannot spend a coin. Remove the gate before accepting any player input.
    for (let i = 0; i < 50; i++) advanceBodies(1 / 120, []);
    for (const coin of coins) coin.vx = coin.vy = coin.vz = 0;
    loading = false;

    return {
      coins, insert, shove, step, feed, convertCoin, tickStatic, clearHazards, slam,
      get settled() { return quiet >= QUIET_TIME; },
      get shelf() { return shelf; }
    };
  }

  function insertShower(board, dropX, count) {
    const radius = COIN_TYPES.ordinary.radius;
    const left = clamp(dropX - radius, radius, 1 - 3 * radius);
    return Array.from({ length: count }, (_, index) => {
      const x = left + (2 * radius * index) / Math.max(1, count - 1);
      return board.insert(x);
    });
  }

  global.JadeBoard = Object.freeze({ create, insertShower });
})(globalThis);
