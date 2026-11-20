(function jadeScene() {
  'use strict';

  const WIDTH = 440;
  const HEIGHT = 956;
  const ASSETS = 'assets/';
  function shape(ctx, points, fill, stroke, width = 1) {
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let index = 2; index < points.length; index += 2) ctx.lineTo(points[index], points[index + 1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke, width = 1) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = width; ctx.strokeStyle = stroke; ctx.stroke(); }
  }

  function gradient(ctx, y0, y1, colors) {
    const result = ctx.createLinearGradient(0, y0, 0, y1);
    colors.forEach((color, index) => result.addColorStop(index / (colors.length - 1), color));
    return result;
  }

  function bitmap(size, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    paint(canvas.getContext('2d'));
    return canvas;
  }

  function guardEmblem(ctx) {
    shape(ctx, [32,28, 48,22, 64,28, 64,45, 59,56, 48,66, 37,59, 31,47], '#c7efff', '#125881', 3);
    shape(ctx, [36,31, 48,27, 60,31, 59,46, 55,54, 48,61, 40,55, 35,45], '#63cef7', '#f0fbff', 1.8);
    shape(ctx, [48,28, 59,32, 58,45, 55,53, 48,60], '#439dd1');
  }

  function showerEmblem(ctx) {
    const rings = [[39,33], [58,45], [41,57]];
    rings.forEach(([x, y]) => {
      ellipse(ctx, x, y + 4, 11, 6.8, '#83412a', '#351828', 2);
      ellipse(ctx, x, y, 11, 6.8, '#ffc34f', '#fff0a2', 1.6);
      ctx.fillStyle = '#bd7427';
      ctx.fillRect(x - 3, y - 2, 6, 4);
    });
    shape(ctx, [58,54, 62,56, 60,62, 64,62, 56,69, 54,60, 57,61], '#ffe8ac', '#642845', 1.2);
  }

  function creditEmblem(ctx) {
    ctx.fillStyle = '#8e622b';
    ctx.fillRect(34, 34, 28, 28);
    ctx.fillStyle = '#d1a359';
    ctx.fillRect(37, 36, 22, 22);
    ctx.strokeStyle = '#ffdf94';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(36, 34, 24, 24);
    for (const x of [40, 48, 56]) { ctx.fillRect(x, 29, 2, 4); ctx.fillRect(x, 61, 2, 4); }
    for (const y of [39, 46, 53]) { ctx.fillRect(29, y, 4, 2); ctx.fillRect(63, y, 4, 2); }
  }

  function coinFace(kind) {
    return bitmap(96, (ctx) => {
      const palette = {
        ordinary: ['#f5d17e', '#cb9d52', '#94612e', '#ffdc8f', '#b58240'],
        tower: ['#ffe4a0', '#d38346', '#884324', '#ffc377', '#a45c30'],
        guard: ['#62edff', '#168cce', '#084874', '#8ee7ff', '#08436e'],
        spark: ['#fff495', '#e66e13', '#78250d', '#ffe66b', '#a33810'],
        static: ['#efcaff', '#793aa9', '#351642', '#efc9ff', '#522267'],
        heal: ['#a0ffac', '#36a964', '#125236', '#abf7bf', '#17603e'],
        coinShower: ['#ff8caf', '#c34474', '#7d224d', '#ffa8cb', '#782140'],
      }[kind];
      const rim = gradient(ctx, 2, 93, [palette[0], palette[1], palette[2], palette[0]]);
      ellipse(ctx, 48, 48, 46, 46, rim, palette[2], 2);
      ellipse(ctx, 48, 48, 40, 40, palette[3], palette[2], 1.7);
      ellipse(ctx, 48, 48, 37, 37, gradient(ctx, 12, 84, [palette[1], palette[4], palette[1]]), palette[0], 1.3);
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = 1;
      for (let tick = 0; tick < 32; tick += 1) {
        const theta = tick * Math.PI / 16;
        ctx.beginPath();
        ctx.moveTo(48 + Math.cos(theta) * 42, 48 + Math.sin(theta) * 42);
        ctx.lineTo(48 + Math.cos(theta) * 45, 48 + Math.sin(theta) * 45);
        ctx.stroke();
      }
      if (kind === 'spark') {
        ctx.fillStyle = '#fff8b0';
        ctx.beginPath();
        for (const [x, y] of [[54,17],[28,52],[44,52],[38,79],[69,39],[51,39]]) ctx.lineTo(x,y);
        ctx.closePath();
        ctx.fill();
      } else if (kind === 'static') return;
      else if (kind === 'guard') guardEmblem(ctx);
      else if (kind === 'coinShower') showerEmblem(ctx);
      else if (kind === 'heal') {
        shape(ctx, [48,68, 27,47, 25,38, 29,31, 38,28, 44,30, 48,35, 53,30, 59,28, 67,31, 71,38, 69,47], '#efffdc', '#145335', 3);
      } else creditEmblem(ctx);
    });
  }

  function iconArt(kind) {
    return bitmap(72, (ctx) => {
      ctx.scale(1.5, 1.5);
      if (kind === 'heart') {
        const heart = new Path2D('M24 43C18 37 3 28 3 16C3 4 17 2 24 10C31 2 45 4 45 16C45 28 31 37 24 43Z');
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#082827';
        ctx.lineWidth = 7;
        ctx.stroke(heart);
        ctx.strokeStyle = '#e5fbdb';
        ctx.lineWidth = 4.5;
        ctx.stroke(heart);
        ctx.fillStyle = gradient(ctx, 7, 43, ['#ff9390', '#d83038', '#801827']);
        ctx.fill(heart);
        ellipse(ctx, 15, 14, 4.8, 2.5, '#ffb3a1');
      } else if (kind === 'sword') {
        shape(ctx, [8,30, 35,4, 46,2, 43,14, 20,39], '#cedfed', '#122c35', 2.6);
        shape(ctx, [13,33, 37,8, 44,5, 40,13, 20,36], '#839eae');
        shape(ctx, [5,38, 11,32, 6,27, 9,23, 26,39, 22,43, 17,38, 9,46, 4,45, 2,42], '#efae3b', '#32261e', 2.8);
        shape(ctx, [9,24, 26,39, 24,41, 7,27], '#ffe399');
      } else if (kind === 'hourglass') {
        ctx.lineJoin = 'round';
        const glass = new Path2D('M10 6H38V11C37 17 32 20 27 24C32 28 37 31 38 37V42H10V37C11 31 16 28 21 24C16 20 11 17 10 11Z');
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1b3f44';
        ctx.fillStyle = '#c2eaf5';
        ctx.fill(glass);
        ctx.stroke(glass);
        shape(ctx, [13,12, 35,12, 31,17, 25,22, 23,22, 16,17], '#eeb659');
        shape(ctx, [13,38, 19,33, 24,29, 29,33, 35,38], '#eeb659');
        shape(ctx, [7,3, 41,3, 41,8, 7,8], '#ffd987', '#3d3023', 2.2);
        shape(ctx, [7,40, 41,40, 41,45, 7,45], '#ffd987', '#3d3023', 2.2);
      } else if (kind === 'shield') {
        ctx.scale(.5, .5);
        guardEmblem(ctx);
      }
    });
  }

  function coinShieldIcon(strength) {
    return bitmap(96, ctx => {
      ctx.lineJoin = 'round';
      shape(ctx, [48,4, 89,15, 85,52, 75,70, 48,91, 21,70, 11,52, 7,15],
        gradient(ctx, 4, 91, ['#a9f2f4', '#55aac7', '#245169']), '#102a36', 5);
      shape(ctx, [48,12, 81,21, 77,50, 68,65, 48,81, 28,65, 19,50, 15,21],
        '#184051', '#c8f4ea', 2);
      ctx.drawImage(coinFace('ordinary'), 13, 29, 33, 33);
      ctx.fillStyle = '#fff3cf';
      ctx.font = 'bold 29px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('×' + strength, 45, 47, 36);
    }).toDataURL();
  }

  const FRONT = 1;
  const FRONT_Y = 650;
  const FRONT_WIDTH = 374;
  const DEPTH_PERSPECTIVE = .63;
  const CAMERA_PITCH = .35;
  const FORWARD_SINE = Math.sin(CAMERA_PITCH);
  const UP_COSINE = Math.cos(CAMERA_PITCH);
  const HEIGHT_PERSPECTIVE = DEPTH_PERSPECTIVE * Math.tan(CAMERA_PITCH);
  const FRONT_VIEW_HEIGHT = (.72 - FORWARD_SINE) / DEPTH_PERSPECTIVE;
  const CAMERA_CENTER_Y = FRONT_Y - FRONT_WIDTH * FRONT_VIEW_HEIGHT;
  const PAID_DROP_DEPTH = .195;
  const PAID_SPAWN_HEIGHT = .225;
  const FEEDER_BOTTOM = 344;
  const PUSHER_HEIGHT = .085;
  const PUSHER_DEPTH = .30;
  const REAR_WALL_DEPTH = -.22;
  // Source material crops from the selected Round 3 Jade Circuit artwork.
  // Coordinates are x, y, width and height in the cleaned material atlas.
  const CABINET_ART = {
    deck: [0,0,432,96], shelfFace: [0,98,432,48], credit: [408,340,96,96],
  };

  function project(x, y, z = 0) {
    const depth = 1 + DEPTH_PERSPECTIVE * (FRONT - y) - HEIGHT_PERSPECTIVE * z;
    const scale = FRONT_WIDTH / depth;
    const height = FRONT_VIEW_HEIGHT + (y - FRONT) * FORWARD_SINE - z * UP_COSINE;
    return { x: WIDTH / 2 + (x - .5) * scale, y: CAMERA_CENTER_Y + height * scale };
  }

  // The fixed rear wall ends immediately below the existing glass feeder.
  const FEEDER_VIEW_HEIGHT = (FEEDER_BOTTOM - CAMERA_CENTER_Y) / FRONT_WIDTH;
  const REAR_WALL_DISTANCE = 1 + DEPTH_PERSPECTIVE * (FRONT - REAR_WALL_DEPTH);
  const REAR_WALL_HEIGHT = (FRONT_VIEW_HEIGHT + (REAR_WALL_DEPTH-FRONT) * FORWARD_SINE - FEEDER_VIEW_HEIGHT * REAR_WALL_DISTANCE)
    / (UP_COSINE - FEEDER_VIEW_HEIGHT * HEIGHT_PERSPECTIVE);
  const FRONT_WALL_HEIGHT = .18;
  const FLIGHT_LIFT = project(.5, PAID_DROP_DEPTH, PAID_SPAWN_HEIGHT).y - 311;
  const COLLECTION_DEPTH = -.065;
  const DROP_TO_RIM = (734 - project(.5, FRONT, COLLECTION_DEPTH).y) / (COLLECTION_DEPTH ** 2);

  function flightOffset(z) {
    // Fit the feeder and chute to the cabinet art by moving the whole disc.
    // At bed height there is no offset, so contact patches share one camera.
    if (z < 0) return -DROP_TO_RIM * z * z;
    const air = Math.max(0, Math.min(1, (z - .095) / (PAID_SPAWN_HEIGHT - .095)));
    return FLIGHT_LIFT * air * air * (3 - 2 * air);
  }

  function worldShape(ctx, points, fill, stroke, lineWidth) {
    shape(ctx, points.flatMap(([x, y, z]) => {
      const point = project(x, y, z);
      return [point.x, point.y];
    }), fill, stroke, lineWidth);
  }

  function along(a, b, t) { return a + (b - a) * t; }

  // Fixed shell art is already warped into this camera. Move only the rigid
  // shelf's top and front textures through the world as its collider advances.
  function drawMaterial(ctx, atlas, name, points) {
    if (!atlas) return;
    const [sx, sy, sw, sh] = CABINET_ART[name];
    const [tl, tr, br, bl] = points;
    const rowAt = (t) => [
      project(...tl.map((value, axis) => along(value, bl[axis], t))),
      project(...tr.map((value, axis) => along(value, br[axis], t))),
    ];
    const rows = sh > 70 ? 28 : 16;
    ctx.save();
    worldShape(ctx, points, null);
    ctx.clip();
    let [left, right] = rowAt(0);
    for (let row = 0; row < rows; row += 1) {
      const [nextLeft, nextRight] = rowAt((row + 1) / rows);
      const source = [sx, sy + row * sh / rows, sw, sh / rows];
      const top = Math.min(left.y, nextLeft.y);
      const height = Math.abs(nextLeft.y - left.y);
      ctx.drawImage(atlas, ...source, (left.x + nextLeft.x) / 2, top, (right.x + nextRight.x - left.x - nextLeft.x) / 2, height + .45);
      left = nextLeft;
      right = nextRight;
    }
    ctx.restore();
  }

  function traceTray(ctx) {
    const rear = project(0, 0);
    const lip = project(0, FRONT);
    ctx.beginPath();
    ctx.moveTo(rear.x, rear.y);
    ctx.lineTo(WIDTH - rear.x, rear.y);
    ctx.lineTo(WIDTH - lip.x, lip.y);
    ctx.lineTo(lip.x, lip.y);
    ctx.closePath();
  }

  function drawShelf(ctx, shelf, atlas) {
    // At rest part of the rigid upper deck is behind the bulkhead slot.
    const back = Math.max(REAR_WALL_DEPTH, shelf - PUSHER_DEPTH);
    const top = project(.5, shelf, PUSHER_HEIGHT).y;
    const floor = project(.5, shelf).y;
    const deck = [[0,back,PUSHER_HEIGHT], [1,back,PUSHER_HEIGHT], [1,shelf,PUSHER_HEIGHT], [0,shelf,PUSHER_HEIGHT]];
    const face = [[0,shelf,PUSHER_HEIGHT], [1,shelf,PUSHER_HEIGHT], [1,shelf,0], [0,shelf,0]];
    worldShape(ctx, deck, gradient(ctx, project(.5, back, PUSHER_HEIGHT).y, top, ['#307466', '#275950', '#4b8b76']), '#123631', 1.2);
    drawMaterial(ctx, atlas, 'deck', deck);
    worldShape(ctx, face, gradient(ctx, top, floor, ['#45726a', '#19373a', '#081c21']), '#0a292c', 1.1);
    drawMaterial(ctx, atlas, 'shelfFace', face);
    worldShape(ctx, [[0,shelf,0], [1,shelf,0], [1,shelf+.027,0], [0,shelf+.027,0]], gradient(ctx, floor, project(.5, shelf+.027).y, ['#061d22be', '#092c2900']));
  }

  const COIN_METAL = {
    tower: ['#61351e', '#efaf6b', '#88431e'],
    ordinary: ['#5b3c22', '#d0a363', '#7d512b'],
    guard: ['#082a48', '#2da1d0', '#0b426e'],
    heal: ['#0b3722', '#47aa6c', '#19633d'],
    coinShower: ['#461528', '#c45b84', '#6f2547'],
  };

  const RIM_SAMPLES = 32;
  const RIM_CIRCLE = Array.from({ length: RIM_SAMPLES }, (_, index) => {
    const angle = index / RIM_SAMPLES * 2 * Math.PI;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  function projectedRim(x, y, z, radius, cos, sin) {
    return RIM_CIRCLE.map((point) => {
      const depth = radius * point.y;
      return project(x + radius * point.x, y + depth * cos, z - depth * sin);
    });
  }

  function traceRim(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }

  function drawSidewall(ctx, top, bottom, metal) {
    ctx.beginPath();
    for (let i = 0; i < RIM_SAMPLES; i += 1) {
      const next = (i + 1) % RIM_SAMPLES;
      const edgeX = top[next].x - top[i].x;
      const edgeY = top[next].y - top[i].y;
      const extrusionX = bottom[i].x - top[i].x;
      const extrusionY = bottom[i].y - top[i].y;
      // A projected edge facing the viewer exposes the metal side underneath.
      if (edgeX * extrusionY - edgeY * extrusionX >= 0) continue;
      ctx.moveTo(top[i].x, top[i].y);
      ctx.lineTo(top[next].x, top[next].y);
      ctx.lineTo(bottom[next].x, bottom[next].y);
      ctx.lineTo(bottom[i].x, bottom[i].y);
      ctx.closePath();
    }
    let front = 0;
    for (let i = 1; i < RIM_SAMPLES; i += 1) {
      if (bottom[i].y > bottom[front].y) front = i;
    }
    ctx.fillStyle = gradient(ctx, top[front].y - 7, bottom[front].y, metal);
    ctx.fill();
  }

  function drawCoinShadow(ctx, coin) {
    if (coin.edgeState === 'falling') return;
    const { x, y, z = 0, lean = 0, kind } = coin;
    const special = kind !== 'ordinary';
    const radius = coin.radius ?? (special ? .055 : .048);
    const thickness = coin.thickness ?? (special ? .039 : .021);
    const elevation = Math.max(0, z - thickness / 2);
    if (elevation < .003 && Math.abs(lean) < .04) return;
    const alpha = .29 / (1 + elevation * 11);
    traceRim(ctx, projectedRim(x, y, 0, radius, Math.cos(lean), 0));
    ctx.fillStyle = `rgba(4,23,20,${alpha})`;
    ctx.fill();
  }

  function drawCoin(ctx, coin, texture) {
    const { kind, x, y, z = 0, lean = 0, rotation = 0 } = coin;
    const special = kind !== 'ordinary';
    const radius = coin.radius ?? (special ? .055 : .048);
    const half = (coin.thickness ?? (special ? .039 : .021)) / 2;
    const cos = Math.cos(lean);
    const sin = Math.sin(lean);
    const faceY = y + half * sin;
    const faceZ = z + half * cos;
    const top = projectedRim(x, faceY, faceZ, radius, cos, sin);
    const bottom = projectedRim(x, y - half * sin, z - half * cos, radius, cos, sin);
    const metal = COIN_METAL[coin.tower && kind === 'ordinary' ? 'tower' : kind] || COIN_METAL.ordinary;
    ctx.save();
    ctx.translate(0, coin.tower && z > 0 ? 0 : -flightOffset(z));
    drawSidewall(ctx, top, bottom, metal);

    // Paint the collider's exact face first. Map the inset stamp and its thin
    // bevel along the projected axes, clear of any curvature at the outer rim.
    const center = project(x, faceY, faceZ);
    const right = top[0];
    const front = top[RIM_SAMPLES / 4];
    const left = top[RIM_SAMPLES / 2];
    const rear = top[RIM_SAMPLES * 3 / 4];
    traceRim(ctx, top);
    ctx.fillStyle = metal[1];
    ctx.fill();
    ctx.transform((right.x-left.x)/2, (right.y-left.y)/2, (front.x-rear.x)/2, (front.y-rear.y)/2, center.x, center.y);
    ctx.rotate(special ? rotation * .035 : rotation);
    ctx.drawImage(texture, -.98, -.98, 1.96, 1.96);
    if (coin.heavy) {
      ctx.beginPath();
      ctx.arc(0, 0, .79, 0, Math.PI * 2);
      ctx.strokeStyle = '#fff0a8';
      ctx.lineWidth = .13;
      ctx.stroke();
    }
    if (kind === 'static') {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 1.65px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(coin.turns), 0, .04);
    }
    ctx.restore();
    if (kind === 'static' || kind === 'spark') {
      return { x: center.x, y: center.y - flightOffset(z) };
    }
  }

  function coinDepth(coin) {
    return coin.y + coin.z * (coin.tower ? 2.1 : .42);
  }

  function coinTexture(coin, textures) {
    return textures[coin.tower && coin.kind === 'ordinary' ? 'tower' : coin.kind] || textures.ordinary;
  }

  function towerIcon(texture) {
    const wall = Array.from({ length: 30 }, (_, i) => ({
      ...JadeBoard.towerCourse(i), kind: 'ordinary', tower: true,
    })).sort((a, b) => coinDepth(a) - coinDepth(b));
    return bitmap(160, ctx => {
      const center = project(.5, .62, .055);
      ctx.translate(80, 80);
      ctx.scale(1.17, 1.17);
      ctx.translate(-center.x, -center.y);
      for (const coin of wall) drawCoin(ctx, coin, texture);
    }).toDataURL();
  }

  function drawGlassReflections(ctx, coins, textures) {
    for (const side of [0, 1]) {
      ctx.save();
      worldShape(ctx, [[side,REAR_WALL_DEPTH,REAR_WALL_HEIGHT], [side,1,FRONT_WALL_HEIGHT], [side,1,0], [side,REAR_WALL_DEPTH,0]], null);
      ctx.clip();
      for (const coin of coins) {
        const distance = Math.abs(side - coin.x);
        if (distance > .16 || coin.y > FRONT || coin.z > .065 || coin.edgeState === 'falling') continue;
        ctx.globalAlpha = .18 * (1 - distance / .2);
        const reflected = { ...coin, x: side + (side - coin.x) };
        drawCoin(ctx, reflected, coinTexture(coin, textures));
      }
      ctx.restore();
    }
  }

  function drawFeeder(ctx, target, creditTexture, phase, hasCredit) {
    const { x, y } = project(target, PAID_DROP_DEPTH, .0105);
    const span = 1 - .40 * Math.abs(target - .5);
    const amberReady = phase === 'planning' || phase === 'inserting';
    ctx.save();
    if (!amberReady) ctx.globalAlpha = .24;
    if (hasCredit) {
      drawCoin(ctx, { kind: 'ordinary', x: target, y: PAID_DROP_DEPTH, z: PAID_SPAWN_HEIGHT }, creditTexture);
    }
    ctx.lineCap = 'square';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4.6;
    ctx.strokeStyle = '#ffdc8c';
    ctx.shadowColor = '#ffb64e';
    ctx.shadowBlur = 11;
    for (const direction of [-1, 1]) {
      const side = direction * span;
      ctx.beginPath();
      ctx.moveTo(x + side * 17, y - 17);
      ctx.lineTo(x + side * 34, y - 17);
      ctx.lineTo(x + side * 38, y - 9);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + side * 23, y + 16);
      ctx.lineTo(x + side * 43, y + 16);
      ctx.lineTo(x + side * 40, y + 5);
      ctx.stroke();
    }
    ctx.restore();
  }

  const TALLY_FLIGHT_TICKS = 17;
  const TALLY_MERGE_TICKS = 13;
  const TALLY_RESULT_TICKS = 132;
  const TALLY_BASE_X = .394;
  const TALLY_VALUE_Y = .438;
  const IMPACT_TYPES = new Set(['ordinaryDamage', 'railgun', 'orbitBlade', 'enemyAttack', 'hazardDamage', 'counterSaber']);

  class CoinDamageTally {
    constructor(cabinet, impact) {
      this.panel = cabinet.querySelector('.jade-tally');
      this.layer = cabinet.querySelector('.jade-tally-flights');
      this.base = this.panel.querySelector('.jade-tally-base strong');
      this.combo = this.panel.querySelector('.jade-tally-combo strong');
      this.total = this.panel.querySelector('.jade-tally-total');
      this.equation = this.panel.querySelector('.jade-tally-equation');
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.impact = impact;
      this.reset();
    }

    reset() {
      this.lastRecapId = null;
      this.sequence = null;
      this.clear();
    }

    clear(pushId = null) {
      this.pushId = pushId;
      this.flights = [];
      this.layer.replaceChildren();
      this.panel.dataset.state = pushId === null ? 'idle' : 'counting';
      this.panel.dataset.tier = '';
      this.base.textContent = '0';
      this.combo.textContent = '—';
      this.total.textContent = '';
      this.equation.textContent = '';
      this.panel.style.removeProperty('--dock-x');
      this.panel.style.removeProperty('--dock-y');
      this.panel.style.removeProperty('--impact');
      this.lastLanding = -Infinity;
      this.resultUntil = null;
    }

    tally(count, attack, multiplier) {
      const base = String(Math.round(count * attack * 100) / 100);
      const combo = count ? `×${multiplier}` : '—';
      if (this.base.textContent !== base) this.base.textContent = base;
      if (this.combo.textContent !== combo) {
        this.combo.textContent = combo;
        this.panel.dataset.tier = count ? String(multiplier) : '';
      }
    }

    collect(event, attack, tick) {
      if (event.pushId !== this.pushId || this.panel.dataset.state === 'result') return;
      if (this.reduced.matches) {
        this.tally(event.ordinaryFalls, attack, event.multiplier);
        return;
      }
      const node = document.createElement('span');
      node.className = 'jade-tally-credit';
      node.textContent = `+${attack}`;
      node.hidden = true;
      const position = project(event.x ?? .5, FRONT, COLLECTION_DEPTH);
      const x = position.x / WIDTH;
      const y = (position.y - flightOffset(COLLECTION_DEPTH)) / HEIGHT;
      const previous = this.flights.at(-1);
      const start = previous && previous.start >= event.tick
        ? Math.min(event.tick + 5, previous.start + 1)
        : event.tick;
      const end = start + TALLY_FLIGHT_TICKS;
      this.layer.append(node);
      this.flights.push({ node, event, attack, x, y, start, end });
      if (this.sequence?.recap.pushId === event.pushId) {
        this.sequence.mergeAt = Math.max(this.sequence.mergeAt, end);
      }
      this.moveFlights(tick);
    }

    moveFlights(tick) {
      this.flights = this.flights.filter((flight) => {
        const { node, event, attack, x, y, start, end } = flight;
        if (tick >= end || this.reduced.matches) {
          node.remove();
          this.tally(event.ordinaryFalls, attack, event.multiplier);
          this.lastLanding = tick;
          return false;
        }
        if (tick < start) return true;
        const fraction = (tick - start) / TALLY_FLIGHT_TICKS;
        const eased = fraction * fraction * (3 - 2 * fraction);
        const bow = Math.sin(Math.PI * fraction);
        const bend = x < TALLY_BASE_X ? -.06 : .065;
        const dx = (TALLY_BASE_X - x) * 6 * fraction * (1 - fraction) + bend * Math.PI * Math.cos(Math.PI * fraction);
        const dy = (TALLY_VALUE_Y - y) * (.8 + .2 * fraction) - .04 * Math.PI * Math.cos(Math.PI * fraction);
        node.hidden = false;
        node.style.left = `${(along(x, TALLY_BASE_X, eased) + bow * bend) * 100}%`;
        node.style.top = `${(along(y, TALLY_VALUE_Y, .8 * fraction + .2 * fraction ** 2) - bow * .04) * 100}%`;
        node.style.scale = 1 - fraction * .38;
        node.style.opacity = 1 - fraction ** 4 * .34;
        node.style.setProperty('--trail-turn', `${Math.atan2(dy * HEIGHT, dx * WIDTH)}rad`);
        return true;
      });
      this.panel.style.setProperty('--impact', this.reduced.matches ? 0 : Math.max(0, 1 - (tick - this.lastLanding) / 5));
    }

    startResolution(snapshot, previous) {
      const { combat } = snapshot;
      const recap = combat.lastRecap;
      const impacts = [];
      let offset = 0;
      for (const event of recap.events) {
        if (!IMPACT_TYPES.has(event.type)) continue;
        // The stagger label accompanies its Railgun hit. The other attacks
        // play one beat apart in the same order as combat resolved them.
        if (event.type === 'railgun') {
          impacts.push({ event, offset: impacts.at(-1)?.offset ?? 0 });
        } else {
          impacts.push({ event, offset });
          offset += 10;
        }
      }
      const previousCombat = previous?.combat ?? combat;
      const absorbed = recap.events.reduce((sum, event) => sum + (event.absorbed || 0), 0);
      this.lastRecapId = recap.pushId;
      this.sequence = {
        recap, impacts, next: 0, attack: combat.hero.attack,
        mergeAt: Math.max(recap.tick, ...this.flights.map((flight) => flight.end)),
        hero: { ...previousCombat.hero, hp: recap.hpBeforeAttack, shield: combat.hero.shield + absorbed },
        enemy: { ...previousCombat.enemy },
      };
    }

    showTotal(sequence, tick) {
      const { recap, attack } = sequence;
      if (this.panel.dataset.state === 'result') return;
      this.panel.dataset.state = 'result';
      this.total.textContent = recap.damage;
      const base = Math.round(recap.ordinaryFalls * attack * 100) / 100;
      this.equation.textContent = recap.blocked ? 'SHIELDED' : recap.ordinaryFalls ? `${base} × ${recap.multiplier}${recap.critical ? ' × 2 CRIT' : ''} =` : 'NO COIN DAMAGE';
      this.resultUntil = tick + TALLY_RESULT_TICKS;
    }

    playImpact(sequence, event) {
      if (event.type === 'enemyAttack' || event.type === 'hazardDamage') {
        sequence.hero.shield -= event.absorbed;
        sequence.hero.hp = Math.max(0, sequence.hero.hp - event.hpLoss);
      } else if (event.type !== 'railgun') {
        sequence.enemy.hp = Math.max(0, sequence.enemy.hp - event.amount);
        if (event.rescued) sequence.hero.hp = 1;
      }
      this.impact(event);
    }

    advance(snapshot, previous) {
      const { combat, tick } = snapshot;
      if (previous && combat.fight !== previous.combat.fight) this.clear();
      this.moveFlights(tick);
      const recap = combat.lastRecap;
      if (recap && recap.fight === combat.fight && recap.pushId !== this.lastRecapId) this.startResolution(snapshot, previous);

      const activeId = combat.activePush?.id;
      const sequence = this.sequence;
      if (sequence) {
        const fastNextPush = activeId && activeId !== sequence.recap.pushId;
        const instant = this.reduced.matches;
        const mergeTicks = sequence.recap.ordinaryFalls ? TALLY_MERGE_TICKS : 0;
        if (fastNextPush && tick < sequence.mergeAt + mergeTicks) sequence.earlyImpactAt ??= tick;
        const impactAt = sequence.earlyImpactAt ?? sequence.mergeAt + mergeTicks;
        if (instant || tick >= impactAt) {
          if (this.pushId === sequence.recap.pushId) this.showTotal(sequence, tick);
          while (sequence.next < sequence.impacts.length) {
            const { event, offset } = sequence.impacts[sequence.next];
            if (!instant && tick < impactAt + offset) break;
            this.playImpact(sequence, event);
            sequence.next += 1;
          }
          if (sequence.next === sequence.impacts.length) this.sequence = null;
        } else if (tick >= sequence.mergeAt) {
          this.tally(sequence.recap.ordinaryFalls, sequence.attack, sequence.recap.multiplier);
          const fraction = (tick - sequence.mergeAt) / mergeTicks;
          this.panel.dataset.state = 'merging';
          this.panel.style.setProperty('--dock-x', `${-20.9 * fraction ** 1.25}cqw`);
          this.panel.style.setProperty('--dock-y', `${-2.5 * Math.sin(Math.PI * fraction)}cqw`);
        }
      }

      if (activeId && activeId !== this.pushId) this.clear(activeId);
      if (snapshot.phase === 'planning' && this.resultUntil !== null && tick >= this.resultUntil) this.clear();
    }
  }

  class JadeView {
    constructor(root, callbacks = {}) {
      this.root = root;
      this.callbacks = callbacks;
      this.textures = { ordinary: coinFace('ordinary'), guard: coinFace('guard'), coinShower: coinFace('coinShower'), heal: coinFace('heal') };
      this.textures.spark = coinFace('spark');
      this.textures.static = coinFace('static');
      this.textures.tower = coinFace('tower');
      this.state = null;
      this.runPhase = null;
      root.innerHTML = `
        <div class="jade-cabinet" role="group" aria-label="Jade Circuit">
          <div class="jade-art jade-arena" aria-hidden="true"></div>
          <div class="jade-art jade-crown" aria-hidden="true"></div>
          <div class="jade-stage" role="heading" aria-level="1" aria-label="Stage"></div>
          <picture class="jade-fighter jade-courier">
            <source media="(prefers-reduced-motion: reduce)" srcset="${ASSETS}courier-still.webp">
            <img src="${ASSETS}courier-idle.webp" width="288" height="288" alt="Roller courier" draggable="false">
          </picture>
          <picture>
            <source class="jade-enemy-idle" media="(prefers-reduced-motion: no-preference)">
            <img class="jade-fighter jade-qilin" alt="" draggable="false">
          </picture>
          <img class="jade-fighter jade-arriving-qilin" alt="" draggable="false">
          <img class="jade-fighter jade-horn-light" hidden alt="">
          <span class="jade-enemy-caption" data-field="enemyName"></span>
          <img class="jade-enemy-ward" hidden alt="">
          <div class="jade-readiness" aria-hidden="true"></div>
          <div class="jade-intent" role="img"><img data-icon="sword" alt=""><span data-field="enemyDamage"></span><i></i><img data-icon="hourglass" alt=""><span data-field="countdown"></span></div>
          <div class="jade-vitals">
            <div class="jade-health jade-hero-health" role="img"><div class="jade-health-track"><div class="jade-health-fill"></div><span data-field="heroHP"></span></div><img data-icon="heart" alt=""></div>
            <div class="jade-health jade-enemy-health" role="img"><div class="jade-health-track"><div class="jade-health-fill"></div><span data-field="enemyHP"></span></div><img data-icon="heart" alt=""></div>
            <div class="jade-shield" role="img" hidden><img data-icon="shield" alt=""><span data-field="shield"></span></div>
          </div>
          <div class="jade-art jade-feeder" aria-hidden="true"></div>
          <div class="jade-art jade-walls" aria-hidden="true"></div>
          <div class="jade-art jade-trough" aria-hidden="true"></div>
          <canvas class="jade-playfield" aria-hidden="true"></canvas>
          <div class="jade-hazard-layer" aria-label="Tray hazards" role="group"></div>
          <div class="jade-hazard-tip" id="jade-hazard-tip" role="tooltip" hidden></div>
          <div class="jade-art jade-controls" aria-hidden="true"></div>
          <div class="jade-tally" aria-hidden="true">
            <span class="jade-tally-idle">COIN DAMAGE</span>
            <div class="jade-tally-operands">
              <div class="jade-tally-base"><span>BASE</span><strong>0</strong></div>
              <div class="jade-tally-combo"><span>COMBO</span><strong>—</strong></div>
            </div>
            <div class="jade-tally-result">
              <span class="jade-tally-equation"></span><strong class="jade-tally-total"></strong>
            </div>
          </div>
          <div class="jade-tally-flights" aria-hidden="true"></div>
          <div class="jade-duel-effects" aria-hidden="true"></div>
          <button class="jade-push" type="button" aria-describedby="jade-push-tip" aria-disabled="true">
            <span class="jade-push-main"><strong>PUSH</strong><img data-icon="coin" alt=""><span data-field="reserve"></span></span>
            <span class="jade-push-income"><img data-icon="hourglass" alt=""><span data-field="regen"></span></span>
          </button>
          <p id="jade-push-tip" class="jade-sr">Tap to drop a coin at the moving marker. Hold to drop more, then release to push.</p>
          <p class="jade-live jade-sr" role="status" aria-live="polite" aria-atomic="true"></p>
          <section class="jade-dialog" aria-labelledby="jade-dialog-title" role="dialog" hidden></section>
        </div>`;

      this.cabinet = root.querySelector('.jade-cabinet');
      this.canvas = root.querySelector('.jade-playfield');
      this.context = this.canvas.getContext('2d');
      this.pushButton = root.querySelector('.jade-push');
      this.hero = root.querySelector('.jade-courier');
      this.courierSprite = this.hero.querySelector('img');
      this.enemy = root.querySelector('.jade-qilin');
      this.enemyIdle = root.querySelector('.jade-enemy-idle');
      this.intent = root.querySelector('.jade-intent');
      this.intentIcon = this.intent.querySelector('img');
      this.enemyWard = root.querySelector('.jade-enemy-ward');
      this.shieldIcons = new Map();
      this.hazardLayer = root.querySelector('.jade-hazard-layer');
      this.hazardTip = root.querySelector('.jade-hazard-tip');
      this.hazardButtons = new Map();
      this.selectedHazard = null;
      this.hazardLayer.addEventListener('click', event => {
        const marker = event.target.closest('button');
        if (!marker) return;
        this.selectHazard(marker === this.selectedHazard ? null : marker);
      });
      this.cabinet.addEventListener('pointerdown', event => {
        if (!this.hazardLayer.contains(event.target)) this.selectHazard(null);
      });
      this.cabinet.addEventListener('focusout', event => {
        if (event.target === this.selectedHazard) this.selectHazard(null);
      });
      this.cabinet.addEventListener('keydown', event => {
        if (event.key === 'Escape') this.selectHazard(null);
      });
      this.stage = root.querySelector('.jade-stage');
      this.heroHealth = root.querySelector('.jade-hero-health');
      this.enemyHealth = root.querySelector('.jade-enemy-health');
      this.shield = root.querySelector('.jade-shield');
      this.ready = root.querySelector('.jade-readiness');
      this.effects = root.querySelector('.jade-duel-effects');
      this.dialog = root.querySelector('.jade-dialog');
      this.live = root.querySelector('.jade-live');
      this.tally = new CoinDamageTally(this.cabinet, (event) => this.combatImpact(event));
      this.fields = Object.fromEntries([...root.querySelectorAll('[data-field]')].map((node) => [node.dataset.field, node]));
      const icons = { coin: this.textures.ordinary.toDataURL(), heart: iconArt('heart').toDataURL(), sword: iconArt('sword').toDataURL(), hourglass: iconArt('hourglass').toDataURL(), shield: iconArt('shield').toDataURL() };
      this.towerIcon = towerIcon(this.textures.tower);
      root.querySelectorAll('[data-icon]').forEach((node) => { node.src = icons[node.dataset.icon]; });
      const staticIcon = bitmap(96, ctx => {
        ctx.drawImage(this.textures.static, 0, 0);
        ctx.fillStyle = '#fff3ff';
        ctx.font = 'bold 62px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', 48, 69);
      });
      this.moveIcons = { sword: icons.sword, spark: this.textures.spark.toDataURL(), static: staticIcon.toDataURL() };
      const atlas = new Image();
      atlas.addEventListener('load', () => {
        this.materials = atlas;
        this.textures.ordinary = bitmap(96, (ctx) => ctx.drawImage(atlas, ...CABINET_ART.credit, 0, 0, 96, 96));
        this.drawBoard();
      }, { once: true });
      atlas.src = `${ASSETS}cabinet-materials.png`;
      new ResizeObserver(() => this.resize()).observe(this.cabinet);
      this.resize();
    }

    resize() {
      const size = this.cabinet.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.max(1, Math.round(size.width * ratio));
      this.canvas.height = Math.max(1, Math.round(size.height * ratio));
      this.drawBoard();
    }

    field(name, value) {
      const node = this.fields[name];
      const text = String(value);
      if (node.textContent !== text) node.textContent = text;
    }

    render(snapshot) {
      const previous = this.state;
      this.state = snapshot;
      const { combat, phase } = snapshot;
      const { stage, reserve, maxReserve, regen, effects, upgrade } = combat;
      if (previous && combat.fight !== previous.combat.fight) this.clearEffects();
      this.tally.advance(snapshot, previous);
      const { hero, enemy } = this.tally.sequence ?? combat;
      const modalPhase = ['upgrade', 'stageClear', 'victory', 'defeat'].includes(phase);
      const displayPhase = modalPhase && this.tally.sequence ? 'resolving' : phase;
      const opened = this.runPhase !== displayPhase || (displayPhase === 'upgrade' && combat.rerolled !== previous?.combat.rerolled);
      this.runPhase = displayPhase;
      this.drawBoard();

      this.cabinet.dataset.phase = phase;
      if (this.stage.textContent !== String(stage)) this.stage.textContent = stage;
      this.stage.setAttribute('aria-label', `Stage ${stage}`);
      const current = combat.enemy;
      if (this.enemy.dataset.id !== current.id) {
        this.enemy.dataset.id = current.id;
        this.enemyIdle.srcset = ASSETS + current.id + '-idle.webp';
        this.enemy.src = ASSETS + current.id + '.png';
        this.enemy.alt = current.name;
        this.enemy.classList.toggle('jade-small-monster', !current.bossShield);
        this.cabinet.classList.toggle('jade-stage-two', combat.fight > 1);
      }
      const horn = this.cabinet.querySelector('.jade-horn-light');
      horn.hidden = current.move !== 'Jade Horn Charge' || !current.hp;
      // The still pose keeps the charge overlay aligned and defeated enemies at rest.
      const idleMedia = enemy.hp > 0 && horn.hidden ? '(prefers-reduced-motion: no-preference)' : 'not all';
      if (this.enemyIdle.media !== idleMedia) this.enemyIdle.media = idleMedia;
      if (!horn.hidden) {
        if (horn.src !== this.enemy.src) horn.src = this.enemy.src;
        horn.style.setProperty('--unlit', Math.min(85, (current.countdown - 1) * 33) + '%');
      }
      const shieldText = current.coinShield ? ' · ' + (current.coinShield + 1) + '+ to pierce' : '';
      this.field('enemyName', current.name + shieldText);
      this.enemy.classList.toggle('jade-fighter-out', enemy.hp <= 0);
      this.hero.classList.toggle('jade-fighter-out', hero.hp <= 0);
      this.health(this.heroHealth, 'heroHP', hero, 'Courier');
      this.health(this.enemyHealth, 'enemyHP', enemy, current.name);
      this.enemyWard.hidden = !current.coinShield || current.hp <= 0;
      if (!this.enemyWard.hidden) {
        const src = this.shieldIcon(current.coinShield);
        if (this.enemyWard.src !== src) this.enemyWard.src = src;
        this.enemyWard.alt = 'Coin shield ×' + current.coinShield + shieldText;
      }
      const specialIcon = current.move === 'Coin shield' ? this.shieldIcon(current.bossShield)
        : current.move === 'Spark coin' ? this.moveIcons.spark
        : current.move === 'Static coin' ? this.moveIcons.static : null;
      const moveIcon = specialIcon || this.moveIcons.sword;
      if (this.intentIcon.src !== moveIcon) this.intentIcon.src = moveIcon;
      this.intentIcon.classList.toggle('jade-skill-icon', !!specialIcon);
      this.fields.enemyDamage.hidden = !!specialIcon;
      this.field('enemyDamage', current.damage);
      this.field('countdown', current.countdown);
      this.intent.classList.toggle('jade-intent-soon', current.countdown === 1 && current.hp > 0);
      const moveDescription = current.damage ? current.move + ', ' + current.damage + ' damage' : current.move;
      this.intent.setAttribute('aria-label', `${current.name}, ${moveDescription} in ${current.countdown} ${current.countdown === 1 ? 'push' : 'pushes'}${shieldText}`);
      this.shield.hidden = hero.shield <= 0;
      this.field('shield', hero.shield);
      this.shield.setAttribute('aria-label', `${hero.shield} shield points`);
      this.field('reserve', `${reserve}/${maxReserve}`);
      this.field('regen', `+${regen}`);
      this.pushButton.style.setProperty('--push-main-size', `${Math.max(3.5, 6.15 - Math.max(0, String(reserve).length - 3) * .36)}cqw`);
      this.pushButton.setAttribute('aria-label', `Push. ${reserve} of ${maxReserve} coins. Regenerate up to ${regen} coins per turn.`);
      const pushUnavailable = !['planning', 'inserting'].includes(phase) || (phase === 'planning' && reserve <= 0);
      this.pushButton.setAttribute('aria-disabled', String(pushUnavailable));
      this.pushButton.tabIndex = modalPhase ? -1 : 0;
      this.ready.dataset.attack = this.readyAttack(upgrade, effects);

      if (current.countdown === 1 && current.hp > 0 && phase === 'planning' &&
          (previous?.combat.enemy.countdown !== 1 || previous?.combat.fight !== combat.fight)) JadeAudio.sound('warning');
      if (!opened) return;
      if (displayPhase === 'victory' || displayPhase === 'defeat') JadeAudio.finish(true);
      if (modalPhase && displayPhase === phase) JadeAudio.sound(phase === 'defeat' ? 'defeat' : 'clear');
      if (displayPhase === 'upgrade') this.showDraft(combat);
      else if (displayPhase === 'stageClear') this.showNextStage(combat);
      else if (displayPhase === 'victory' || displayPhase === 'defeat') this.showResult(displayPhase);
      else this.dialog.hidden = true;
    }

    health(node, field, value, name) {
      node.style.setProperty('--health', `${Math.max(0, value.hp / value.maxHp * 100)}%`);
      node.setAttribute('aria-label', `${name}: ${value.hp} of ${value.maxHp} health`);
      this.field(field, `${value.hp}/${value.maxHp}`);
    }

    readyAttack(upgrade, effects = {}) {
      const id = typeof upgrade === 'string' ? upgrade : upgrade?.id;
      if (id === 'railgun') return effects.railgunUsed ? 'railgun-spent' : 'railgun';
      if (effects.storedBlade) return 'orbit';
      if (effects.counterArmed) return 'counter';
      return '';
    }

    drawBoard() {
      const ctx = this.context;
      ctx.setTransform(this.canvas.width / WIDTH, 0, 0, this.canvas.height / HEIGHT, 0, 0);
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const { coins = [], targetX = .5, shelf = .1, phase = 'planning', combat } = this.state || {};
      ctx.save();
      traceTray(ctx);
      ctx.clip();
      coins.forEach((coin) => drawCoinShadow(ctx, coin));
      ctx.restore();
      drawShelf(ctx, shelf, this.materials);
      drawGlassReflections(ctx, coins, this.textures);
      const creditLeavingFeeder = coins.some((coin) => coin.kind === 'ordinary' && coin.y < .28
        && coin.z > .12 && project(coin.x, coin.y, coin.z).y - flightOffset(coin.z) < FEEDER_BOTTOM + 4);
      drawFeeder(ctx, targetX, this.textures.ordinary, phase, combat?.reserve > 0 && !creditLeavingFeeder);
      const ordered = [...coins].sort((first, second) => coinDepth(first) - coinDepth(second));
      ctx.save();
      ctx.beginPath();
      // The gold catch rim stands in front of the fall path. Its upper contour
      // hides a descending coin while the board carries it to collection.
      ctx.moveTo(12, 282);
      ctx.lineTo(428, 282);
      ctx.lineTo(428, 741);
      ctx.lineTo(407, 726);
      ctx.lineTo(390, 723);
      ctx.lineTo(50, 723);
      ctx.lineTo(33, 726);
      ctx.lineTo(12, 741);
      ctx.closePath();
      ctx.clip();
      const visibleHazards = new Set();
      for (const coin of ordered) {
        const center = drawCoin(ctx, coin, coinTexture(coin, this.textures));
        if (!center || coin.edgeState === 'falling' || !['planning', 'inserting', 'resolving'].includes(phase)) continue;
        visibleHazards.add(coin.coinId);
        this.updateHazard(coin, center);
      }
      for (const [id, marker] of this.hazardButtons) {
        if (visibleHazards.has(id)) continue;
        if (marker === this.selectedHazard) this.selectHazard(null);
        marker.remove();
        this.hazardButtons.delete(id);
      }
      ctx.restore();
    }

    shieldIcon(strength) {
      if (!this.shieldIcons.has(strength)) {
        this.shieldIcons.set(strength, coinShieldIcon(strength));
      }
      return this.shieldIcons.get(strength);
    }

    updateHazard(coin, center) {
      let marker = this.hazardButtons.get(coin.coinId);
      if (!marker) {
        marker = document.createElement('button');
        marker.type = 'button';
        marker.className = 'jade-hazard-marker';
        marker.setAttribute('aria-expanded', 'false');
        marker.setAttribute('aria-controls', 'jade-hazard-tip');
        this.hazardButtons.set(coin.coinId, marker);
        this.hazardLayer.append(marker);
      }
      marker.style.left = (center.x / WIDTH * 100) + '%';
      marker.style.top = (center.y / HEIGHT * 100) + '%';
      if (marker.dataset.kind !== coin.kind || marker.dataset.turns !== String(coin.turns ?? '')) {
        marker.dataset.kind = coin.kind;
        marker.dataset.turns = coin.turns ?? '';
        const rules = JadeCombat.tuning;
        const spark = coin.kind === 'spark';
        const name = spark ? 'Spark coin' : 'Static coin';
        const remaining = coin.turns === 1 ? '1 push left' : coin.turns + ' pushes left';
        marker.setAttribute('aria-label', spark ? name : name + ', ' + remaining);
        marker.dataset.description = spark
          ? name + ' · Deals ' + rules.sparkDamage + ' damage to the courier if it falls into the trough.'
          : name + ' · ' + remaining + '. Push it into the trough to defuse it. At zero it explodes for ' + rules.staticDamage + ' damage.';
      }
      if (marker === this.selectedHazard) this.positionHazardTip(marker);
    }

    selectHazard(marker) {
      if (this.selectedHazard === marker) return;
      if (this.selectedHazard) {
        this.selectedHazard.setAttribute('aria-expanded', 'false');
        this.selectedHazard.removeAttribute('aria-describedby');
      }
      this.selectedHazard = marker;
      this.hazardTip.hidden = !marker;
      if (marker) {
        marker.setAttribute('aria-expanded', 'true');
        marker.setAttribute('aria-describedby', 'jade-hazard-tip');
        this.positionHazardTip(marker);
      }
    }

    positionHazardTip(marker) {
      if (this.hazardTip.textContent !== marker.dataset.description) this.hazardTip.textContent = marker.dataset.description;
      this.hazardTip.dataset.kind = marker.dataset.kind;
      this.hazardTip.style.left = 'clamp(32%, ' + marker.style.left + ', 68%)';
      this.hazardTip.style.top = marker.style.top;
    }

    showDraft(combat, selected = 0) {
      const offers = combat.offers;
      this.dialog.className = 'jade-dialog jade-spotlight';
      this.dialog.innerHTML = `<div class="spotlight-picker">
        <h2 id="jade-dialog-title">Select skill</h2>
        <div class="spotlight-hand"></div>
        <div class="spotlight-pager">
          <button type="button" aria-label="Previous skill">‹</button>
          <span></span>
          <button type="button" aria-label="Next skill">›</button>
        </div>
        <button class="jade-replay spotlight-take" type="button">Take skill</button>
        <button class="jade-reroll" type="button"></button>
        <span class="jade-sr" role="status" aria-live="polite" aria-atomic="true"></span>
      </div>`;
      const picker = this.dialog.firstElementChild;
      const hand = picker.querySelector('.spotlight-hand');
      const count = picker.querySelector('.spotlight-pager span');
      const take = picker.querySelector('.spotlight-take');
      const status = picker.querySelector('[role="status"]');
      const faces = offers.map((offer, index) => {
        const face = document.createElement('button');
        face.type = 'button';
        face.className = 'spotlight-card';
        // The original draft IDs are also recorded in replays.
        const rarity = offer.rarity === 'Uncommon' ? 'Rare' : offer.rarity;
        face.dataset.rarity = rarity;
        face.innerHTML = '<span class="spotlight-art"><img alt="" draggable="false"></span><span class="spotlight-tier"></span><strong></strong><span class="spotlight-description"></span>';
        face.querySelector('img').src = offer.effect === 'tower' ? this.towerIcon : ASSETS + 'upgrades/' + offer.effect + '.webp';
        face.querySelector('.spotlight-tier').textContent = rarity;
        face.querySelector('strong').textContent = offer.name;
        face.querySelector('.spotlight-description').textContent = offer.description;
        face.tabIndex = -1;
        face.onclick = () => select(index);
        hand.append(face);
        return face;
      });
      function select(index) {
        selected = (index + offers.length) % offers.length;
        const card = offers[selected];
        faces.forEach((face, i) => {
          face.dataset.position = i === selected ? 'center' : i === (selected + 1) % offers.length ? 'right' : 'left';
          face.setAttribute('aria-pressed', String(i === selected));
        });
        count.textContent = (selected + 1) + ' / ' + offers.length;
        take.setAttribute('aria-label', 'Take skill: ' + card.name);
        status.textContent = [count.textContent, faces[selected].dataset.rarity, card.name, card.description].join('. ');
      }
      const [previous, next] = picker.querySelectorAll('.spotlight-pager button');
      previous.onclick = () => select(selected - 1);
      next.onclick = () => select(selected + 1);
      picker.onkeydown = event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        select(selected + (event.key === 'ArrowLeft' ? -1 : 1));
      };
      let startX;
      hand.ontouchstart = event => { startX = event.touches.length === 1 ? event.touches[0].clientX : null; };
      hand.ontouchcancel = () => { startX = null; };
      hand.addEventListener('touchend', event => {
        if (startX == null) return;
        const delta = event.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(delta) < 32) return;
        event.preventDefault();
        select(selected + (delta < 0 ? 1 : -1));
      }, { passive: false });
      take.onclick = () => this.callbacks.onChooseUpgrade(offers[selected].id);
      const reroll = picker.querySelector('.jade-reroll');
      reroll.textContent = combat.rerolled ? 'Reroll used' : '▶   Watch ad to reroll';
      reroll.disabled = combat.rerolled;
      reroll.onclick = () => this.showMockAd(combat, selected);
      select(selected);
      this.dialog.hidden = false;
      take.focus({ preventScroll: true });
    }

    showMockAd(combat, selected) {
      this.dialog.className = 'jade-dialog jade-draft jade-ad-preview';
      this.dialog.innerHTML = `<header><small>REWARDED AD PREVIEW</small><h2 id="jade-dialog-title">Reroll upgrades</h2>
        <p>Finish the demo ad to draw three new choices.</p></header>
        <button class="jade-replay" type="button">Finish demo ad</button>
        <button class="jade-reroll" type="button">Keep current choices</button>`;
      const [finish, cancel] = this.dialog.querySelectorAll('button');
      finish.onclick = () => this.callbacks.onReroll();
      cancel.onclick = () => this.showDraft(combat, selected);
      finish.focus({ preventScroll: true });
    }

    showNextStage(combat) {
      this.dialog.className = 'jade-dialog jade-result';
      this.dialog.innerHTML = '<h2 id="jade-dialog-title"></h2><p class="jade-dialog-note"></p><button type="button" class="jade-replay"></button>';
      this.dialog.querySelector('h2').textContent = combat.stage + ' clear';
      this.dialog.querySelector('p').textContent = combat.nextEnemy.hint;
      const button = this.dialog.querySelector('button');
      button.textContent = combat.nextEnemy.stage + ' · ' + combat.nextEnemy.name + ' ›';
      button.onclick = () => this.travelToNextFight();
      this.dialog.hidden = false;
      button.focus({ preventScroll: true });
    }

    async travelToNextFight() {
      if (this.dialog.hidden || this.state.phase !== 'stageClear') return;
      JadeAudio.sound('click');
      const next = this.state.combat.nextEnemy;
      const arriving = this.cabinet.querySelector('.jade-arriving-qilin');
      arriving.src = ASSETS + next.id + '.png';
      arriving.classList.toggle('jade-small-monster', !next.bossShield);
      this.dialog.hidden = true;
      this.clearEffects();
      this.live.textContent = 'Skating to ' + next.stage + '.';
      this.courierSprite.src = ASSETS + 'courier-running.webp';
      this.cabinet.classList.add('jade-travelling');
      // Keeping the session at stage clear freezes the tray and
      // blocks pushes until the incoming fighter reaches its position.
      const arrival = this.cabinet.querySelector('.jade-arriving-qilin').getAnimations();
      await Promise.allSettled(arrival.map(animation => animation.finished));
      this.cabinet.classList.remove('jade-travelling');
      this.courierSprite.src = ASSETS + 'courier-idle.webp';
      this.callbacks.onNextStage?.();
      this.live.textContent = next.stage + '. ' + next.name + ' is ready.';
      this.pushButton.focus({ preventScroll: true });
    }

    showResult(phase) {
      const won = phase === 'victory';
      this.dialog.className = 'jade-dialog jade-result';
      this.dialog.innerHTML = `<h2 id="jade-dialog-title">${won ? 'Circuit cleared' : 'Courier down'}</h2><button class="jade-replay" type="button">Replay</button>`;
      const replay = this.dialog.querySelector('button');
      replay.addEventListener('click', () => {
        this.resetFeedback();
        this.callbacks.onReplay?.();
        if (this.dialog.hidden) this.pushButton.focus({ preventScroll: true });
      });
      this.dialog.hidden = false;
      replay.focus({ preventScroll: true });
    }

    resetFeedback() {
      this.tally.reset();
      this.clearEffects();
      this.live.textContent = '';
      this.roundReport = [];
      this.feedbackPushId = null;
    }

    clearEffects() {
      this.effects.replaceChildren();
      this.hero.classList.remove('jade-fighter-lunge', 'jade-fighter-recoil');
      this.enemy.classList.remove('jade-fighter-hit', 'jade-fighter-charge');
    }

    effect(className, text, x) {
      const node = document.createElement('span');
      node.className = `jade-effect ${className}`;
      if (text) node.textContent = text;
      if (x !== undefined) node.style.left = `${project(x, 1).x / WIDTH * 100}%`;
      this.effects.append(node);
      node.addEventListener('animationend', () => node.remove(), { once: true });
      setTimeout(() => node.remove(), 1250);
    }

    animateFighter(figure, className) {
      figure.classList.remove(className);
      void figure.offsetWidth;
      figure.classList.add(className);
      figure.addEventListener('animationend', () => figure.classList.remove(className), { once: true });
    }

    combatImpact(event) {
      switch (event.type) {
        case 'ordinaryDamage': {
          JadeAudio.sound('damage', event.ordinaryFalls >= 5 ? 1.3 : 1);
          this.animateFighter(this.hero, 'jade-fighter-lunge');
          this.animateFighter(this.enemy, 'jade-fighter-hit');
          const id = this.state.combat.upgrade;
          this.effect(id === 'railgun' ? 'jade-rail-beam' : id === 'orbitBlades' ? 'jade-blade-flight' : 'jade-strike-wave');
          this.effect('jade-enemy-number', `${event.critical ? 'Crit ' : ''}−${event.amount}`);
          break;
        }
        case 'railgun':
          if (event.stagger) {
            JadeAudio.sound('railgun');
            this.effect('jade-enemy-number jade-stagger-text', 'Staggered');
          }
          break;
        case 'orbitBlade':
          JadeAudio.sound('orbit');
          this.effect('jade-blade-flight jade-follow-up');
          this.effect('jade-enemy-number jade-orbit-text', `Orbit −${event.amount}`);
          break;
        case 'hazardDamage':
          JadeAudio.sound('hit');
          this.animateFighter(this.hero, 'jade-fighter-recoil');
          this.effect('jade-hero-number', event.source + ' −' + event.hpLoss);
          break;
        case 'enemyAttack':
          JadeAudio.sound('hit');
          this.animateFighter(this.enemy, 'jade-fighter-charge');
          this.animateFighter(this.hero, 'jade-fighter-recoil');
          this.effect('jade-enemy-wave');
          this.effect('jade-hero-number', event.hpLoss > 0 ? `−${event.hpLoss}` : 'Blocked');
          break;
        case 'counterSaber':
          JadeAudio.sound('counter');
          this.effect('jade-counter-flash');
          this.effect('jade-enemy-number jade-counter-text', `Counter −${event.amount}`);
          break;
        default:
          break;
      }
    }

    feedback(event) {
      const pushId = event.pushId ?? event.recap?.pushId;
      if (pushId !== undefined && pushId !== this.feedbackPushId) {
        this.feedbackPushId = pushId;
        this.roundReport = [];
      }
      const report = this.roundReport || (this.roundReport = []);
      switch (event.type) {
        case 'paidInsertion':
          JadeAudio.sound('insert');
          break;
        case 'hailMaryImpact': {
          JadeAudio.sound('hit', 1.4, .68);
          if (!this.tally.reduced.matches) this.animateFighter(this.cabinet, 'jade-cabinet-quake');
          const contact = project(event.x, event.y, event.z);
          const ring = document.createElement('span');
          ring.className = 'jade-impact-ring';
          ring.style.left = (contact.x / WIDTH * 100) + '%';
          ring.style.top = ((contact.y - flightOffset(event.z)) / HEIGHT * 100) + '%';
          this.effects.append(ring);
          ring.addEventListener('animationend', () => ring.remove(), { once: true });
          this.effect('jade-token-result', 'Hail Mary', event.x);
          report.push('Hail Mary shook the cabinet');
          break;
        }
        case 'stroke': JadeAudio.sound('stroke'); break;
        case 'coinConverted': JadeAudio.sound('hazard'); break;
        case 'clawSlam':
          JadeAudio.sound('hit');
          this.animateFighter(this.canvas, 'jade-board-shake');
          this.effect('jade-token-result', 'Claw Slam');
          report.push('Claw Slam shook coins off the tray');
          break;
        case 'staticDefused':
          JadeAudio.sound('hazard', 0.55);
          this.effect('jade-token-result', 'Defused', event.x);
          report.push('Static coin defused');
          break;
        case 'shieldBlocked':
        case 'shieldPierced':
        case 'shieldRaised': {
          if (event.type === 'shieldBlocked') JadeAudio.sound('damage', 0.5, 0.75);
          else JadeAudio.sound(event.type === 'shieldPierced' ? 'pierce' : 'guard');
          const label = { shieldBlocked: 'Blocked', shieldPierced: 'Pierced', shieldRaised: 'Shield up' }[event.type];
          this.effect('jade-enemy-number jade-stagger-text', label);
          report.push(label);
          break;
        }
        case 'hazardDamage':
          report.push(event.source + ' dealt ' + event.hpLoss + ' damage');
          break;
        case 'ordinaryFall':
          JadeAudio.sound('payout');
          this.tally.collect(event, this.state.combat.hero.attack, this.state.tick);
          break;
        case 'coinShower':
          JadeAudio.sound('shower');
          this.effect('jade-token-result jade-token-shower', `Coin Shower +${event.count}`, event.x ?? .5);
          report.push(`Coin Shower added ${event.count} coins`);
          break;
        case 'heal': {
          JadeAudio.heal(event.amount);
          const message = event.amount ? `+${event.amount} HP` : 'HP full';
          this.effect('jade-token-result jade-token-heal', message, event.x ?? .5);
          report.push(message);
          break;
        }
        case 'guard':
          JadeAudio.sound('guard');
          this.effect('jade-token-result jade-token-guard', `+${event.amount} shield`, event.x ?? .5);
          report.push(`Gained ${event.amount} shield`);
          break;
        case 'ordinaryDamage':
          report.push(`${event.ordinaryFalls} coins dealt ${event.amount} damage${event.critical ? ' on a critical hit' : ''}`);
          break;
        case 'railgun':
          if (event.stagger) report.push('Railgun delayed the enemy');
          break;
        case 'orbitBlade':
          report.push(`Orbit Blade dealt ${event.amount} damage`);
          break;
        case 'enemyAttack':
          report.push(`Enemy dealt ${event.hpLoss} damage${event.absorbed ? ` and used ${event.absorbed} shield` : ''}`);
          break;
        case 'counterSaber':
          report.push(`Counter Saber dealt ${event.amount} damage`);
          if (event.rescued) report.push('The courier survived at one health');
          break;
        case 'regen':
          report.push(`Gained ${event.amount} coins, ${event.reserve} left`);
          break;
        case 'pushSettled':
          if (!event.recap.ordinaryFalls) report.unshift('No ordinary coins collected');
          if (event.recap.phase === 'victory') report.push('Circuit cleared');
          if (event.recap.phase === 'defeat') report.push('Courier defeated');
          if (event.recap.phase === 'stageClear') report.push(this.state.combat.stage + ' cleared');
          this.live.textContent = report.join('. ');
          break;
        default:
          break;
      }
    }
  }

  window.JadeView = JadeView;
})();
