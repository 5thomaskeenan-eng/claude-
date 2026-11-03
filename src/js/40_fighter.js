// ============================================================================
// FIGHTER: giant-mech state machine, IK animation, footwork, ragdoll, combat
// ============================================================================
const MOVES = {
  jab: { name: 'Jab', hand: 1, w: 0.08, s: 0.1, r: 0.18, dmg: 34, stam: 5, stun: 7, knock: 0.9, kind: 'straight', twist: 0.24, lean: 0.12, reach: 0.04, power: 0.55 },
  cross: { name: 'Cross', hand: -1, w: 0.13, s: 0.11, r: 0.25, dmg: 62, stam: 10, stun: 14, knock: 1.8, kind: 'straight', twist: 0.6, lean: 0.2, reach: 0.16, power: 0.85 },
  hook: { name: 'Hook', hand: 1, w: 0.17, s: 0.14, r: 0.28, dmg: 82, stam: 14, stun: 22, knock: 2.2, kind: 'hook', twist: 0.7, lean: 0.08, reach: -0.06, power: 1.0 },
  upper: { name: 'Uppercut', hand: -1, w: 0.2, s: 0.13, r: 0.32, dmg: 96, stam: 16, stun: 28, knock: 2.0, up: 2.2, kind: 'upper', twist: 0.38, lean: 0.06, reach: -0.12, power: 1.1 },
  kick: { name: 'Kick', hand: 0, leg: -1, w: 0.22, s: 0.15, r: 0.36, dmg: 84, stam: 15, stun: 12, knock: 4.6, kind: 'kick', twist: 0.3, lean: -0.14, reach: 0.42, power: 1.1 },
  dive: { name: 'Dive punch', hand: -1, w: 0.06, s: 0.2, r: 0.3, dmg: 100, stam: 10, stun: 24, knock: 3.6, kind: 'dive', twist: 0.3, lean: 0.35, reach: 0.35, power: 1.3 },
  smash: { name: 'Smash', hand: 0, w: 0.32, s: 0.16, r: 0.34, dmg: 105, stam: 12, stun: 30, knock: 5.2, kind: 'smash', twist: 0, lean: 0.3, reach: 0.45, power: 1.5 },
  grab: { name: 'Grab', hand: 0, w: 0.13, s: 0.14, r: 0.34, dmg: 0, stam: 10, kind: 'grab', twist: 0, lean: 0.2, reach: 0.0, power: 0 },
  toss: { name: 'Throw', hand: 0, w: 0.3, s: 0.12, r: 0.28, dmg: 0, stam: 8, kind: 'toss', twist: 0.4, lean: 0.25, reach: 0, power: 0 },
  knee: { name: 'Knee', hand: 0, leg: 1, w: 0.1, s: 0.12, r: 0.2, dmg: 46, stam: 4, stun: 12, knock: 0.3, kind: 'knee', twist: 0, lean: -0.1, reach: 2, power: 0.8 },
};
const STRIKES = new Set(['straight', 'hook', 'upper', 'kick', 'dive', 'smash', 'knee']);
const DODGE_T = 0.4, RISE_T = 1.3;
const NODE_NAMES = ['pelvis', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR'];
const NODE_R = { pelvis: 0.3, chest: 0.4, head: 0.24, shL: 0.22, shR: 0.22, elL: 0.14, elR: 0.14, haL: 0.17, haR: 0.17, hipL: 0.17, hipR: 0.17, knL: 0.15, knR: 0.15, ftL: 0.12, ftR: 0.12 };

const _t1 = V3(), _t2 = V3(), _t3 = V3(), _t4 = V3(), _t5 = V3(), _fw = V3(), _lf = V3(), _up = V3(0, 1, 0), _pl = V3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m4 = new THREE.Matrix4();

function readNodes(R, out) {
  const d = R.dims;
  R.root.updateMatrixWorld(true);
  R.body.getWorldPosition(out.pelvis); R.chest.getWorldPosition(out.chest); R.head.getWorldPosition(out.head);
  R.shL.getWorldPosition(out.shL); R.shR.getWorldPosition(out.shR); R.elL.getWorldPosition(out.elL); R.elR.getWorldPosition(out.elR);
  R.fistL.getWorldPosition(out.haL); R.fistR.getWorldPosition(out.haR);
  R.hipL.getWorldPosition(out.hipL); R.hipR.getWorldPosition(out.hipR); R.knL.getWorldPosition(out.knL); R.knR.getWorldPosition(out.knR);
  out.ftL.set(0, 0, d.shin).applyMatrix4(R.knL.matrixWorld); out.ftR.set(0, 0, d.shin).applyMatrix4(R.knR.matrixWorld);
}
const makeNodeSet = () => Object.fromEntries(NODE_NAMES.map(n => [n, V3()]));

// ---------------------------------------------------------------- Verlet ragdoll (collides with ground and buildings)
class Ragdoll {
  constructor(f) {
    const R = f.rig; this.f = f; this.R = R; this.S = f.S; this.acc = 0; this.hitT = 0;
    const cur = makeNodeSet(); readNodes(R, cur);
    this.p = {}; for (const n of NODE_NAMES) this.p[n] = { x: cur[n].clone(), o: cur[n].clone(), r: NODE_R[n] * this.S };
    this.c = [];
    const add = (a, b, kind = 'eq', k = 1, fr = 1) => this.c.push({ a: this.p[a], b: this.p[b], rest: cur[a].distanceTo(cur[b]) * fr, kind, k });
    [['pelvis', 'chest'], ['chest', 'head'], ['chest', 'shL'], ['chest', 'shR'], ['shL', 'shR'], ['shL', 'elL'], ['elL', 'haL'], ['shR', 'elR'], ['elR', 'haR'], ['pelvis', 'hipL'], ['pelvis', 'hipR'], ['hipL', 'hipR'], ['hipL', 'knL'], ['knL', 'ftL'], ['hipR', 'knR'], ['knR', 'ftR'],
    ['shL', 'pelvis'], ['shR', 'pelvis'], ['shL', 'hipL'], ['shR', 'hipR'], ['shL', 'hipR'], ['shR', 'hipL'], ['head', 'shL'], ['head', 'shR'], ['chest', 'hipL'], ['chest', 'hipR']].forEach(([a, b]) => add(a, b));
    add('head', 'pelvis', 'eq', 0.4);
    add('haL', 'shL', 'min', 1, 0.55); add('haR', 'shR', 'min', 1, 0.55);
    add('ftL', 'hipL', 'min', 1, 0.62); add('ftR', 'hipR', 'min', 1, 0.62);
    add('ftL', 'chest', 'min', 1, 0.7); add('ftR', 'chest', 'min', 1, 0.7);
    add('knL', 'knR', 'min', 1, 0.5);
    this.frozen = false;
  }
  impulse(dir, power, up = 1.5) {
    const h = 1 / 120;
    for (const n of NODE_NAMES) {
      const k = ['head', 'chest', 'shL', 'shR'].includes(n) ? 1 : n.startsWith('ft') ? 0.45 : 0.75;
      const v = _t1.copy(dir).multiplyScalar(power * k * rand(0.9, 1.1)); v.y += up * (n.startsWith('ft') ? 0.6 : 1) + rand(-0.2, 0.2);
      this.p[n].o.addScaledVector(v, -h);
    }
  }
  step(dt) {
    if (this.frozen) return;
    const h = 1 / 120; this.acc = Math.min(this.acc + dt, 0.05); this.hitT -= dt;
    const B = Arena.bound;
    while (this.acc >= h) {
      this.acc -= h;
      for (const n of NODE_NAMES) {
        const P = this.p[n];
        const vx = (P.x.x - P.o.x) * 0.997, vy = (P.x.y - P.o.y) * 0.997, vz = (P.x.z - P.o.z) * 0.997;
        P.o.copy(P.x); P.x.x += vx; P.x.y += vy - GRAV * h * h; P.x.z += vz;
      }
      for (let it = 0; it < 7; it++) {
        for (const c of this.c) {
          const dx = c.b.x.x - c.a.x.x, dy = c.b.x.y - c.a.x.y, dz = c.b.x.z - c.a.x.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
          if (c.kind === 'min' && d >= c.rest) continue;
          const diff = (d - c.rest) / d * 0.5 * c.k;
          c.a.x.x += dx * diff; c.a.x.y += dy * diff; c.a.x.z += dz * diff;
          c.b.x.x -= dx * diff; c.b.x.y -= dy * diff; c.b.x.z -= dz * diff;
        }
        for (const n of NODE_NAMES) {
          const P = this.p[n], fl = Arena.groundAt(P.x.x, P.x.z) + P.r;
          if (P.x.y < fl) { const vy = P.x.y - P.o.y; P.x.y = fl; P.o.x += (P.x.x - P.o.x) * 0.25; P.o.z += (P.x.z - P.o.z) * 0.25; if (vy < -0.025) this.bump = Math.max(this.bump || 0, -vy); }
          P.x.x = clamp(P.x.x, B.x0, B.x1); P.x.z = clamp(P.x.z, B.z0, B.z1);
        }
      }
      // buildings stop the body; fast bodies smash through them
      for (const n of ['chest', 'pelvis', 'head', 'shL', 'shR']) {
        const P = this.p[n]; const vx = (P.x.x - P.o.x) * 120, vz = (P.x.z - P.o.z) * 120, vy = (P.x.y - P.o.y) * 120, sp = Math.hypot(vx, vz, vy);
        const before = _t5.copy(P.x);
        const b = Arena.collide(P.x, P.r, P.x.y - P.r, P.x.y + P.r);
        if (b) {
          if (sp > 3.2 && this.hitT <= 0) { this.hitT = 0.12; Game.bodySlam(this.f, before.clone(), V3(vx, vy, vz), sp); }
          else { P.o.x = P.x.x - vx / 120 * 0.2; P.o.z = P.x.z - vz / 120 * 0.2; }
        }
      }
    }
  }
  speed() { let s = 0; for (const n of NODE_NAMES) s += this.p[n].x.distanceTo(this.p[n].o); return s * 120 / NODE_NAMES.length; }
  pos(n) { return this.p[n].x; }
  apply(src) {
    const R = this.R, P = src || Object.fromEntries(NODE_NAMES.map(n => [n, this.p[n].x])), d = R.dims, S = this.S;
    R.root.position.set(0, 0, 0); R.root.quaternion.identity(); R.root.scale.setScalar(S); R.root.updateMatrixWorld();
    const X = _t1.subVectors(P.hipL, P.hipR).normalize(), Y = _t2.subVectors(P.chest, P.pelvis).normalize(), Z = _t3.crossVectors(X, Y).normalize(); X.crossVectors(Y, Z);
    _m4.makeBasis(X, Y, Z); const qb = _q1.setFromRotationMatrix(_m4);
    R.body.position.copy(P.pelvis).divideScalar(S); R.body.quaternion.copy(qb); R.spine.quaternion.identity();
    const fwd = _t4.copy(Z);
    const sm = _pl.addVectors(P.shL, P.shR).multiplyScalar(0.5);
    const X2 = _t1.subVectors(P.shL, P.shR).normalize(), Y2 = _t2.subVectors(sm, P.pelvis).normalize(), Z2 = _t3.crossVectors(X2, Y2).normalize(); X2.crossVectors(Y2, Z2);
    _m4.makeBasis(X2, Y2, Z2); const qc = _q2.setFromRotationMatrix(_m4);
    R.chest.quaternion.copy(qb).invert().multiply(qc);
    const Y3 = _t2.subVectors(P.head, sm).normalize(), Z3 = _t3.crossVectors(X2, Y3).normalize(); const X3 = _t1.crossVectors(Y3, Z3);
    _m4.makeBasis(X3, Y3, Z3); const qh = new THREE.Quaternion().setFromRotationMatrix(_m4);
    R.neck.quaternion.copy(qc).invert().multiply(qh);
    R.root.updateMatrixWorld(true);
    solveLook(R.shL, R.elL, P.elL, P.haL, _up); solveLook(R.shR, R.elR, P.elR, P.haR, _up);
    solveLook(R.hipL, R.knL, P.knL, P.ftL, fwd); solveLook(R.hipR, R.knR, P.knR, P.ftR, fwd);
    const yaw = Math.atan2(fwd.x, fwd.z);
    for (const [ft, p] of [[R.footL, P.ftL], [R.footR, P.ftR]]) { ft.position.set(p.x / S, Math.max(Arena.groundAt(p.x, p.z), p.y - d.ankle * S) / S, p.z / S); ft.rotation.set(0, yaw, 0); }
    updatePistons(R);
  }
}
function solveLook(a, b, mid, end, up) { a.up.copy(up); a.lookAt(mid); a.updateMatrixWorld(true); b.up.copy(up); b.lookAt(end); b.updateMatrixWorld(true); }

// ---------------------------------------------------------------- Fighter
class Fighter {
  constructor(def, idx) {
    this.def = def; this.idx = idx; this.S = def.scale || 1;
    this.rig = buildRobot(def); this.rig.root.scale.setScalar(this.S); scene.add(this.rig.root);
    const s = def.stats, d = def.dims, S = this.S;
    this.weight = S * S * S * (0.7 + s.armor * 0.05);
    this.maxHp = Math.round((820 + s.armor * 50) * (0.85 + S * 0.15));
    this.powerMul = (0.72 + s.power * 0.055) * (0.8 + S * 0.2);
    this.speedMul = (0.8 + s.speed * 0.045) * 0.9;
    this.moveSpeed = (1.3 + s.speed * 0.14) * S * (d.wheeled ? 1.15 : 1) / Math.pow(this.weight, 0.12);
    this.jumpV = 4.6 * Math.sqrt(S) / Math.pow(this.weight, 0.08);
    this.stamMax = 70 + s.stamina * 7;
    const L = d.upper + d.fore;
    this.reach = (Math.sqrt(Math.max(0.1, L * L - Math.pow(d.shX * 0.55, 2))) + 0.38) * S;
    this.radius = 0.56 * S;
    this.sp = {}; for (const k of ['rx', 'ry', 'rz', 'hx', 'hy', 'hz', 'cr']) this.sp[k] = { x: 0, v: 0 };
    this.feet = { L: { p: V3(), from: V3(), to: V3(), t: 1, lift: 0 }, R: { p: V3(), from: V3(), to: V3(), t: 1, lift: 0 } };
    this.headW = V3(); this.chestW = V3(); this.nodes = makeNodeSet();
    this.stats = { thrown: 0, landed: 0, power: 0, dmg: 0, kd: 0, maxCombo: 0, blocked: 0, throws: 0, wrecked: 0, roundDmg: [0], roundKd: [0] };
    this.pos = V3(); this.vel = V3(); this.knock = V3(); this.yaw = 0; this.vy = 0;
    this.hp = this.maxHp; this.hpChip = this.hp; this.chipDelay = 0; this.stam = this.stamMax; this.stun = 0;
    this.parts = { head: 100, core: 100, armL: 100, armR: 100 }; this.partTh = { head: [75, 50, 25], core: [75, 50, 25], armL: [75, 50, 25], armR: [75, 50, 25] };
    this.kd = 0; this.combo = 0; this.comboT = 0; this.bodyDmg = 0; this.punchId = 0; this.sinceHit = 9; this.restT = 1; this.blockT = 9;
    this.time = rand(0, 10); this.state = 'idle'; this.st = 0; this.stateDur = 0; this.blocking = false; this.queued = null;
    this.rag = null; this.dodgeDir = 0; this.speedNow = 0; this.held = null; this.grabbing = null; this.grabbedBy = null;
    this.abil = (def.abilities || []).concat(['blade']).map(id => ({ id, cd: 0 }));
    this.bladeT = 0; this.fortT = 0; this.counterT = 0; this.clones = []; this.cloneT = 0; this.od = 0; this.odT = 0;
    this.trails = { 1: new Trail(def.colors.accent), [-1]: new Trail(def.colors.accent) };
    setEnvIntensity(this.rig, 1); this.rig.beam.visible = !!Arena.night;
  }
  dispose() {
    FX.emitters = FX.emitters.filter(e => e.owner !== this); this.rig.root.removeFromParent(); this.rig.dispose(); this.trails[1].dispose(); this.trails[-1].dispose();
    this.clones.forEach(c => { c.R.root.removeFromParent(); c.R.dispose(); }); this.clones = [];
    if (this.shield) this.shield.removeFromParent();
  }
  place(x, z, yaw) { this.pos.set(x, 0, z); this.yaw = yaw; this.vel.set(0, 0, 0); this.knock.set(0, 0, 0); this.vy = 0; this.plantFeet(); }
  plantFeet() {
    const d = this.def.dims, S = this.S;
    _fw.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); _lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.feet.L.p.copy(this.pos).addScaledVector(_lf, d.stanceW * S).addScaledVector(_fw, (d.footFwd ?? 0.17) * S); this.feet.L.t = 1; this.feet.L.p.y = 0;
    this.feet.R.p.copy(this.pos).addScaledVector(_lf, -d.stanceW * S).addScaledVector(_fw, -(d.footFwd ?? 0.17) * S); this.feet.R.t = 1; this.feet.R.p.y = 0;
  }
  setState(s, dur = 0) { this.state = s; this.st = 0; this.stateDur = dur; if (s !== 'punch') this.queued = null; }
  get canBlock() { return this.state === 'idle' || this.state === 'blockstun'; }
  get isDown() { return this.state === 'down' || this.state === 'ko' || this.state === 'rising' || this.state === 'launched'; }
  get airborne() { return this.pos.y > 0.04 * this.S; }
  get inWindup() { return this.state === 'punch' && this.moveT < this.impactT; }
  get iframes() { return this.state === 'dodge' && this.st > 0.03 && this.st < 0.3; }
  ragPos() { return this.rag ? this.rag.pos('pelvis') : this.pos; }
  forward(v) { return v.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }
  ground() { return Arena.groundAt(this.pos.x, this.pos.z); }

  startMove(kind) {
    const body = kind.startsWith('body:'); if (body) kind = kind.slice(5);
    const mv = MOVES[kind];
    const tired = this.stam < this.stamMax * 0.15;
    this.stam = Math.max(0, this.stam - mv.stam);
    this.punchRate = this.speedMul * (tired ? 0.78 : 1) * (this.bladeT > 0 && mv.power ? 1.08 : 1);
    this.move = mv; this.moveKind = kind; this.body = body; this.moveT = 0; this.hitDone = false;
    this.impactT = mv.w + mv.s; this.totalT = mv.w + mv.s + mv.r; this.punchId++; this.punchStart = Game.time;
    this.chargeBonus = this.sprinting ? 1.25 : 1;
    this.setState('punch'); if (mv.power) this.stats.thrown++; this.restT = 0;
    SFX.whoosh(Math.max(0.4, mv.power));
    if (mv.power > 0.8) { SFX.hiss(0.5); const b = this.rig.chest.localToWorld(_t1.set((mv.hand || 1) * 0.3, 0.35, -0.5)); for (let i = 0; i < 3; i++) FX.smoke.emit(b.x, b.y, b.z, rand(-.3, .3), rand(0.6, 1.4), rand(-.3, .3), 1.1, 0.25 * this.S, 1.1 * this.S, 0.75, 0.77, 0.8, 0.22, -0.2, 1.5); }
  }
  startDodge(dir) { this.stam -= 7; this.dodgeDir = dir; this.setState('dodge', DODGE_T); this.knock.addScaledVector(_lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)), dir * 3.2 * this.S); SFX.whoosh(0.5); }
  jump() {
    this.vy = this.jumpV; this.pos.y = 0.05 * this.S; this.stam -= 8; SFX.hiss(0.8);
    const p = this.pos.clone(); p.y = this.ground(); FX.dust(p, 0.7 * this.S, Arena.dustColor);
    for (let i = 0; i < 8; i++) FX.thruster(this.rig.footL.getWorldPosition(_t1), _t2.set(0, -1, 0), this.S);
  }
  land(impactV) {
    const k = clamp(-impactV / 6, 0.2, 1.6) * this.S * Math.sqrt(this.weight);
    const p = _t1.copy(this.pos); p.y = this.ground();
    FX.dust(p, 0.8 * k, Arena.dustColor); FX.ring(p, 1.4 * k, [1.4, 1.2, 1.0], 0.5); SFX.land(Math.min(1.4, k)); Game.shake(Math.min(0.6, 0.12 * k));
    Arena.crushCars(p, 0.6 * this.S);
    if (this.state === 'idle' && k > 0.8) this.setState('land', 0.18);
  }
  tryPickup() {
    const fwd = this.forward(_fw);
    let prop = Arena.nearestProp(_t1.copy(this.pos).addScaledVector(fwd, this.radius), this.reach * 1.1);
    if (!prop) { const r = Arena.nearestRubble(_t1.copy(this.pos).addScaledVector(fwd, this.radius), this.reach); if (r) prop = Arena.rubbleToProp(r); }
    if (!prop) prop = Arena.ripChunk(this.pos, fwd, this.def.dims.hipH * this.S * 1.1);
    if (!prop) { if (this.idx === 0) Popups.show('NOTHING TO LIFT', this.headW.clone().add(V3(0, 0.6, 0)), 'b'); return false; }
    prop.state = 'held'; prop.owner = this; this.held = prop; this.setState('pickup', 0.45); SFX.clank(1); SFX.hiss(0.6);
    return true;
  }
  releaseProp(opp) {
    const q = this.held; if (!q) return; this.held = null;
    const p = q.mesh.position, tgt = opp && !opp.isDown ? opp.chestW.clone() : V3().copy(this.pos).addScaledVector(this.forward(_fw), 9).setY(1);
    const dist = p.distanceTo(tgt), T = clamp(dist / (13 + this.def.stats.power), 0.3, 1.1);
    q.vel.subVectors(tgt, p).divideScalar(T); q.vel.y += 0.5 * GRAV * T;
    q.ang.set(rand(-5, 5), 0, rand(-5, 5)); q.state = 'fly'; q.ignore = this; q.t = 0; q.owner = null; q.thrower = this;
    SFX.whoosh(1.4);
  }
  tryAbility(i) {
    const a = this.abil[i]; if (!a || a.cd > 0) return false;
    if (a.id === 'blade' && this.bladeT > 0) return false;
    const A = ABILITIES[a.id];
    const ok = A.start(this, Game.opponentOf(this));
    if (ok !== false) { a.cd = A.cd; Game.onAbility(this, A); }
    return ok !== false;
  }
  launch(dir, power, up = 2.5) {
    if (this.fortT > 0) { power *= 0.45; up *= 0.5; }
    if (this.held) { this.held.state = 'rest'; this.held = null; }
    if (this.grabbing) Game.endGrab(this, this.grabbing, false);
    if (this.state === 'ability' && this.ab && this.ab.cancel) this.ab.cancel(this);
    this.rag = new Ragdoll(this); this.rag.impulse(dir, power, up);
    this.blocking = false; this.vel.set(0, 0, 0); this.knock.set(0, 0, 0); this.vy = 0; this.pos.y = 0;
    this.setState('launched'); this.launchT = 0;
  }
  startRagdoll(dir, power) { if (this.rag && !this.rag.frozen) return; this.rag = new Ragdoll(this); this.rag.impulse(dir, power, 1.6); this.blocking = false; this.vel.set(0, 0, 0); this.knock.set(0, 0, 0); this.vy = 0; this.pos.y = 0; }
  startRise(oppPos) {
    const p = this.rag.pos('pelvis'), B = Arena.bound;
    this.pos.set(clamp(p.x, B.x0 + 1, B.x1 - 1), 0, clamp(p.z, B.z0 + 1, B.z1 - 1));
    for (let i = 0; i < 4; i++) Arena.collide(this.pos, this.radius, 0, 2);
    this.yaw = Math.atan2(oppPos.x - this.pos.x, oppPos.z - this.pos.z);
    this.rag.frozen = true; this.ragSnap = makeNodeSet(); for (const n of NODE_NAMES) this.ragSnap[n].copy(this.rag.p[n].x);
    this.place(this.pos.x, this.pos.z, this.yaw);
    this.setState('rising', RISE_T); this.stun = 0;
  }
  damagePart(zone, amt, dir) {
    const before = this.parts[zone]; const after = Math.max(0, before - amt * 0.1); this.parts[zone] = after;
    const th = this.partTh[zone];
    while (th.length && after <= th[0]) {
      const lvl = th.shift();
      const list = this.rig.armor[zone];
      if (list.length) {
        const mesh = list.splice(Math.floor(Math.random() * list.length), 1)[0];
        const v = V3(dir.x * rand(2, 4.5), rand(2.5, 5), dir.z * rand(2, 4.5)).add(V3(rand(-1.5, 1.5), 0, rand(-1.5, 1.5))).multiplyScalar(this.S);
        Debris.add(mesh, v, V3(rand(-12, 12), rand(-12, 12), rand(-12, 12)));
        SFX.clank(1); SFX.clank(0.7);
      }
      const anchor = zone === 'head' ? this.rig.neck : zone === 'core' ? this.rig.chest : zone === 'armL' ? this.rig.elL : this.rig.elR;
      if (lvl === 50) FX.emitters.push({ obj: anchor, kind: 'smoke', rate: 5, acc: 0, owner: this });
      if (lvl === 25) FX.emitters.push({ obj: anchor, kind: 'sparks', rate: 6, acc: 0, owner: this });
      if (lvl === 25 && zone === 'head') this.flicker = true;
    }
  }
  impulse(k, v) { this.sp[k].v += v; }

  // ------------------------------------------------ logic
  update(dt, opp, it) {
    this.time += dt; this.st += dt;
    for (const a of this.abil) a.cd = Math.max(0, a.cd - dt);
    this.chipDelay -= dt; this.counterT -= dt;
    if (this.hpChip > this.hp) { if (this.chipDelay <= 0) this.hpChip = Math.max(this.hp, this.hpChip - dt * this.maxHp * 0.35); } else this.hpChip = this.hp;
    this.sinceHit += dt; if (this.sinceHit > 1.3) this.stun = Math.max(0, this.stun - 14 * dt);
    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    this.blockT += dt;
    if (this.bladeT > 0) { this.bladeT -= dt; for (const s of [1, -1]) { const b = this.rig.blades[s]; b.visible = true; b.scale.z = Math.min(1, b.scale.z + dt * 6); } if (this.bladeT <= 0) SFX.clank(0.6); }
    else for (const s of [1, -1]) { const b = this.rig.blades[s]; b.scale.z = Math.max(0.01, b.scale.z - dt * 6); if (b.scale.z <= 0.02) b.visible = false; }
    if (this.fortT > 0) { this.fortT -= dt; if (this.fortT <= 0 && this.shield) { this.shield.removeFromParent(); this.shield = null; } }
    if (this.cloneT > 0) { this.cloneT -= dt; if (this.cloneT <= 0) this.clones.forEach(c => c.dying = true); }
    if (this.flicker) setGlow(this.rig, Math.random() < 0.1 ? 0.1 : 1);
    const S = this.S;
    switch (this.state) {
      case 'down': case 'ko': case 'cine': case 'grabbed': case 'clash': return;
      case 'launched':
        this.launchT += dt;
        if (this.rag && this.hp > 0 && ((this.rag.speed() < 0.8 * S && this.launchT > 1.1) || this.launchT > 4)) this.startRise(opp ? opp.pos : V3());
        return;
      case 'rising': if (this.st >= RISE_T) { this.rag = null; this.setState('idle'); } return;
      case 'grabbing': this.updateGrabbing(dt, opp, it); return;
      case 'ability': if (!this.ab) { this.setState('idle'); break; } this.ab.update(dt, this, opp, it); if (!this.ab || !this.ab.noPhys) this.physicsY(dt); return;
    }
    if (it.punch) { this.buf = it.punch; this.bufT = 0.24; } else this.bufT = (this.bufT || 0) - dt;
    let moveScale = 1;
    switch (this.state) {
      case 'punch':
        this.moveT += dt * this.punchRate;
        if ((this.move.kind === 'kick' || this.move.kind === 'smash') && this.moveT < this.impactT) this.knock.addScaledVector(this.forward(_t1), dt * 2.2 * S);
        if (!this.hitDone && this.moveT >= this.impactT) { this.hitDone = true; this.resolveMove(opp); }
        if (it.punch && this.moveT > this.impactT * 0.8 && STRIKES.has(this.move.kind)) this.queued = it.punch;
        if (this.state === 'punch' && this.moveT >= this.totalT) { const q = this.queued; this.setState('idle'); this.queued = q; }
        moveScale = 0.3; break;
      case 'hitstun': case 'stagger': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.1; break;
      case 'blockstun': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.35; break;
      case 'dazed': if (this.st >= this.stateDur) { this.setState('idle'); this.stun = 0; } moveScale = 0.25; break;
      case 'dodge': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.3; break;
      case 'land': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.2; break;
      case 'pickup': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.2; break;
    }
    if (this.state === 'idle') {
      const p = this.queued || it.punch || (this.bufT > 0 ? this.buf : null); this.queued = null;
      if (it.ab != null && this.tryAbility(it.ab)) { }
      else if (it.jump && !this.airborne && this.stam > 8 && !this.held) this.jump();
      else if (it.dodge && this.stam >= 7 && !this.airborne) this.startDodge(it.dodge);
      else if (it.pick) { if (this.held) this.startMove('toss'); else this.tryPickup(); }
      else if (it.grab) { if (this.held) this.startMove('toss'); else if (!this.airborne) this.startMove('grab'); }
      else if (it.kick && !this.held && !this.airborne) this.startMove('kick');
      else if (p && !it.block) { this.bufT = 0; if (this.held) this.startMove('smash'); else if (this.airborne) this.startMove('dive'); else this.startMove(p); }
    }
    const wantBlock = !!it.block && this.canBlock && !this.held && !this.airborne;
    if (wantBlock && !this.blocking) this.blockT = 0;
    this.blocking = wantBlock;
    const fwd = this.forward(_fw), left = _lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    let mx = it.mx || 0, mz = it.mz || 0; const mag = Math.hypot(mx, mz); if (mag > 1) { mx /= mag; mz /= mag; }
    this.sprinting = !!it.sprint && mz > 0.3 && this.stam > 3 && !this.blocking && this.state === 'idle' && !this.airborne;
    if (this.sprinting) { this.stam -= 10 * dt; this.restT = 0; }
    let spd = this.moveSpeed * moveScale * (this.blocking ? 0.55 : 1) * (this.stam < this.stamMax * 0.15 ? 0.75 : 1) * (this.held ? 0.7 : 1) * (this.sprinting ? 2.1 : 1);
    if (mz < 0) spd *= 0.85;
    const dx = (fwd.x * mz + left.x * mx) * spd, dz = (fwd.z * mz + left.z * mx) * spd;
    const acc = this.airborne ? 1.5 : 7;
    this.vel.x = damp(this.vel.x, dx, acc, dt); this.vel.z = damp(this.vel.z, dz, acc, dt);
    const kd = Math.exp(-(this.airborne ? 1 : 3.2) * dt); this.knock.multiplyScalar(kd);
    this.pos.x += (this.vel.x + this.knock.x) * dt; this.pos.z += (this.vel.z + this.knock.z) * dt;
    this.speedNow = Math.hypot(this.vel.x, this.vel.z) / this.moveSpeed;
    if (this.sprinting && Math.random() < dt * 8) { const p = _t1.copy(this.pos); p.y = this.ground(); FX.dust(p, 0.35 * S, Arena.dustColor); }
    this.physicsY(dt);
    this.face(opp, dt);
    this.restT = this.state === 'punch' ? 0 : this.restT + dt;
    const regen = (this.restT > 0.45 ? 17 : 4) * (this.blocking ? 0.55 : 1) * (1 - Math.min(0.5, this.bodyDmg / 1800));
    if (!this.sprinting) this.stam = Math.min(this.stamMax, this.stam + regen * dt);
  }
  face(opp, dt) {
    if (!opp) return;
    const op = opp.ragPos();
    const ty = Math.atan2(op.x - this.pos.x, op.z - this.pos.z);
    const rate = this.state === 'punch' ? 5 : this.state === 'dazed' ? 2 : 9;
    this.yaw += angDiff(this.yaw, ty) * (1 - Math.exp(-rate * dt));
  }
  physicsY(dt) {
    if (this.pos.y > 0 || this.vy > 0) {
      this.vy -= GRAV * dt * (this.vy < 0 ? 1.25 : 1); this.pos.y += this.vy * dt;
      if (this.pos.y <= 0) { const v = this.vy; this.pos.y = 0; this.vy = 0; this.land(v); if (this.onLand) { const f = this.onLand; this.onLand = null; f(v); } }
    }
  }
  updateGrabbing(dt, opp, it) {
    this.grabT += dt; this.kneeT = Math.max(0, (this.kneeT || 0) - dt);
    const d = this.grabbing; if (!d) { this.setState('idle'); return; }
    if (it.punch && this.kneeT <= 0 && this.knees < 3) { this.kneeT = 0.42; this.knees++; this.kneeHit = 0.2; }
    if (this.kneeHit > 0) { this.kneeHit -= dt; if (this.kneeHit <= 0) { this.move = MOVES.knee; this.moveKind = 'knee'; this.body = true; resolveHit(this, d); } }
    if (it.grab || it.pick || this.grabT > 2.8) Game.throwGrabbed(this, it);
  }
  resolveMove(opp) {
    const k = this.move.kind;
    if (k === 'grab') return resolveGrab(this, opp);
    if (k === 'toss') return this.releaseProp(opp);
    resolveHit(this, opp);
    if (k === 'smash' && this.held) { const q = this.held; this.held = null; Arena.breakProp(q, this.forward(V3())); }
  }

  // ------------------------------------------------ animation
  stepSprings(dt) {
    for (const k in this.sp) {
      const s = this.sp[k], K = k[0] === 'h' ? 230 : 160, C = k[0] === 'h' ? 13 : 11;
      s.v += (-K * s.x - C * s.v) * dt; s.x += s.v * dt; s.x = clamp(s.x, -0.9, 0.9);
    }
  }
  animate(dt, opp) {
    const R = this.rig;
    if (this.rag && this.state !== 'rising') {
      this.rag.bump = 0; this.rag.step(dt);
      if ((this.rag.bump || 0) > 0.025) { const p = this.rag.pos('chest'); SFX.land(Math.min(1.4, this.rag.bump * 22)); FX.dust(_t1.set(p.x, Arena.groundAt(p.x, p.z), p.z), 0.9 * this.S, Arena.dustColor); Game.shake(0.3); Arena.crushCars(p, 0.8 * this.S); }
      this.rag.apply();
      readNodes(R, this.nodes); this.headW.copy(this.nodes.head); this.chestW.copy(this.nodes.chest);
      this.trails[1].mesh.visible = this.trails[-1].mesh.visible = false;
      this.updateClones(dt);
      return;
    }
    this.poseStanding(dt, opp);
    if (this.state === 'rising') {
      readNodes(R, this.nodes);
      const k = easeInOut(clamp(this.st / RISE_T, 0, 1));
      const blend = this._blend || (this._blend = makeNodeSet());
      for (const n of NODE_NAMES) blend[n].lerpVectors(this.ragSnap[n], this.nodes[n], k);
      this.rag.apply(blend);
    }
    R.head.getWorldPosition(this.headW); R.chest.getWorldPosition(this.chestW);
    if (this.held) {
      const q = this.held, d = R.dims, shH = d.hipH + d.spineY + d.chestY + d.shY;
      const hp = _t1.set(0, shH + 0.5, 0.35);
      if (this.state === 'punch' && (this.move.kind === 'toss' || this.move.kind === 'smash')) {
        const T = this.moveT, mv = this.move;
        if (T < mv.w) hp.lerp(_t2.set(0, shH + 0.75, -0.35), easeOut(T / mv.w));
        else hp.lerpVectors(_t2.set(0, shH + 0.75, -0.35), mv.kind === 'smash' ? _t3.set(0, shH - 0.2, 1.3) : _t3.set(0, shH + 0.4, 1.0), easeOut(clamp((T - mv.w) / mv.s, 0, 1)));
      } else if (this.state === 'pickup') hp.lerpVectors(_t2.set(0, d.hipH * 0.5, 0.8), _t3.set(0, shH + 0.5, 0.35), easeInOut(clamp(this.st / 0.45, 0, 1)));
      R.root.localToWorld(q.mesh.position.copy(hp));
      q.mesh.rotation.set(0, this.yaw, 0);
    }
    for (const s of [1, -1]) {
      const on = (this.state === 'punch' && (this.move.hand === s || this.bladeT > 0) && this.moveT > this.move.w * 0.6 && this.moveT < this.impactT + 0.04 && (this.move.power > 0.8 || this.bladeT > 0)) || (this.state === 'ability' && this.ab && this.ab.trail);
      this.trails[s].push((s > 0 ? R.fistL : R.fistR).getWorldPosition(_t1), !!on, dt);
    }
    this.updateClones(dt);
  }
  updateClones(dt) {
    for (let i = this.clones.length - 1; i >= 0; i--) {
      const c = this.clones[i];
      c.a = c.dying ? c.a - dt * 2 : Math.min(1, c.a + dt * 3);
      if (c.a <= 0) { c.R.root.removeFromParent(); c.R.dispose(); this.clones.splice(i, 1); continue; }
      c.R.ghostMat.opacity = 0.34 * c.a;
      copyPose(this.rig, c.R);
      const left = _t1.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)), fwd = _t2.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      const src = this.rag ? this.rag.pos('pelvis') : this.pos;
      c.pos.lerp(_t3.copy(src).addScaledVector(left, c.side * 1.5 * this.S).addScaledVector(fwd, -0.3 * this.S), 1 - Math.exp(-6 * dt));
      c.R.root.position.copy(this.rig.root.position).add(_t4.subVectors(c.pos, src).setY(0));
    }
  }

  poseStanding(dt, opp) {
    const R = this.rig, d = R.dims, t = this.time, S = this.S;
    this.stepSprings(dt);
    const gy = this.ground();
    R.root.position.set(this.pos.x, gy + this.pos.y, this.pos.z); R.root.rotation.set(0, this.yaw, 0); R.root.scale.setScalar(S);
    const shH = d.hipH + d.spineY + d.chestY + d.shY;
    const P = { crouch: 0, lean: 0, twist: 0, roll: 0, swayX: 0 };
    const idle = this.state === 'idle' || this.state === 'blockstun';
    const bob = d.wheeled ? Math.sin(t * 3) * 0.012 : Math.sin(t * 4.2) * (idle ? 0.03 : 0.012) + Math.abs(Math.sin(t * 5.5 * (this.sprinting ? 1.5 : 1))) * 0.035 * clamp(this.speedNow, 0, 1.5);
    const fwdV = this.vel.x * Math.sin(this.yaw) + this.vel.z * Math.cos(this.yaw);
    if (this.sprinting) P.lean += 0.22;
    if (d.wheeled) { this._acc = damp(this._acc || 0, (fwdV - (this._fv || 0)) / Math.max(dt, 1e-3), 6, dt); this._fv = fwdV; P.lean += clamp(this._acc * 0.04, -0.2, 0.2) + fwdV * 0.03; }
    const hands = this._hands || (this._hands = { 1: { p: V3(), pole: V3() }, [-1]: { p: V3(), pole: V3() } });
    for (const s of [1, -1]) {
      const h = hands[s];
      h.p.set(s * 0.26, shH + 0.03 + Math.sin(t * 3.1 + s) * 0.015, 0.52);
      h.pole.set(s * 0.8, -1, -0.25);
      if (this.sprinting) h.p.set(s * 0.32, shH - 0.25 + Math.sin(t * 8 + s * 1.6) * 0.18, 0.25 + Math.sin(t * 8 + s * 1.6) * 0.3);
      if (this.blocking) { h.p.set(s * 0.15, shH + 0.17, 0.4); h.pole.set(s * 0.25, -1, 0.6); P.crouch += 0.03; P.lean += 0.05; }
    }
    const legOverride = {};
    switch (this.state) {
      case 'dazed':
        P.crouch += 0.1; P.roll += Math.sin(t * 2.7) * 0.14; P.twist += Math.sin(t * 1.9) * 0.18; P.lean -= 0.06;
        for (const s of [1, -1]) hands[s].p.set(s * 0.38, shH - 0.4 + Math.sin(t * 3 + s) * 0.05, 0.38);
        break;
      case 'victory':
        for (const s of [1, -1]) { hands[s].p.set(s * (d.shX + 0.15), shH + 0.85 + Math.sin(t * 6 + s) * 0.08, 0.12); hands[s].pole.set(s, -0.2, -0.5); }
        P.lean -= 0.12; break;
      case 'hitstun': case 'stagger': for (const s of [1, -1]) hands[s].p.add(_t1.set(s * 0.08, -0.12, -0.06)); break;
      case 'dodge': { const k = Math.sin(clamp(this.st / DODGE_T, 0, 1) * Math.PI); P.swayX = this.dodgeDir * 0.3 * k; P.roll += -this.dodgeDir * 0.32 * k; P.crouch += 0.12 * k; break; }
      case 'land': P.crouch += 0.22 * Math.sin(clamp(this.st / 0.18, 0, 1) * Math.PI); break;
      case 'pickup': { const k = Math.sin(clamp(this.st / 0.45, 0, 1) * Math.PI); P.crouch += 0.25 * k; P.lean += 0.3 * k; break; }
      case 'grabbing': if (this.grabbing) {
        const v = this.grabbing; R.root.updateMatrixWorld();
        for (const s of [1, -1]) { const tg = R.root.worldToLocal(_t1.copy(v.chestW).add(_t2.set(0, 0.25 * v.S, 0))); hands[s].p.set(tg.x + s * 0.3, tg.y, Math.min(tg.z - 0.25, 1.1)); hands[s].pole.set(s, -0.4, -0.5); }
        P.lean += 0.08;
        if (this.kneeT > 0) { const k = Math.sin((0.42 - this.kneeT) / 0.42 * Math.PI); legOverride[1] = { p: V3(0.15, d.ankle + d.hipH * 0.55 * k, 0.15 + 0.5 * k), k }; }
      } break;
      case 'grabbed': P.lean -= 0.15 + Math.sin(t * 9) * 0.05; for (const s of [1, -1]) hands[s].p.set(s * 0.35, shH + 0.1 + Math.sin(t * 7 + s) * 0.15, 0.6); P.roll += Math.sin(t * 6) * 0.08; break;
      case 'clash': { const s = this.clashHand || 1; hands[s].p.set(s * 0.12, shH + 0.05, 0.95 + Math.sin(t * 30) * 0.02); hands[s].pole.set(s * 0.6, -1, 0); P.lean += 0.22; P.twist = -s * 0.45; break; }
      case 'cine': if (this.cinePose) this.cinePose(hands, P, shH, legOverride); break;
      case 'ability': if (this.ab && this.ab.pose) this.ab.pose(this, hands, P, shH, legOverride, opp); break;
    }
    if (this.held && this.state !== 'pickup') for (const s of [1, -1]) { hands[s].p.set(s * 0.5, shH + 0.5, 0.35); hands[s].pole.set(s, -0.3, -0.6); }
    if (this.airborne && this.state !== 'ability' && this.state !== 'cine') { P.crouch -= 0.05; if (this.vy > 0) for (const s of [1, -1]) hands[s].p.y += 0.25; }
    if (this.state === 'punch' && opp) this.posePunch(hands, P, shH, legOverride, opp);
    P.lean += d.hunch;
    const Sp = this.sp;
    R.body.position.set(P.swayX, d.hipH + bob - P.crouch - Sp.cr.x, 0);
    R.body.quaternion.identity();
    R.spine.rotation.set(P.lean + Sp.rx.x, P.twist + Sp.ry.x, P.roll + Sp.rz.x);
    R.chest.quaternion.identity();
    R.neck.rotation.set(-P.lean * 0.7 + Sp.hx.x, -P.twist * 0.5 + Sp.hy.x, Sp.hz.x);
    R.root.updateMatrixWorld(true);
    for (const s of [1, -1]) {
      const h = hands[s]; h.p.x += P.swayX * 0.6;
      const tw = R.root.localToWorld(_t1.copy(h.p));
      const pw = _t2.copy(h.pole).applyQuaternion(R.root.quaternion);
      solveIK(s > 0 ? R.shL : R.shR, s > 0 ? R.elL : R.elR, d.upper * S, d.fore * S, tw, pw, _up);
    }
    const fwd = this.forward(_fw), left = _lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    for (const [k, s] of [['L', 1], ['R', -1]]) {
      const f = this.feet[k], o = this.feet[k === 'L' ? 'R' : 'L'];
      const ideal = _t3.copy(this.pos).addScaledVector(left, (s * d.stanceW + P.swayX * 0.4) * S).addScaledVector(fwd, s * (d.footFwd ?? 0.17) * S); ideal.y = 0;
      const foot = s > 0 ? R.footL : R.footR;
      const lo = legOverride[s];
      if (lo) {
        const fwW = R.root.localToWorld(_t4.copy(lo.p));
        foot.position.copy(lo.p); foot.position.y -= d.ankle; foot.rotation.set(-0.9 * lo.k, 0, 0);
        solveIK(s > 0 ? R.hipL : R.hipR, s > 0 ? R.knL : R.knR, d.thigh * S, d.shin * S, fwW, _t2.copy(fwd).add(_t5.set(0, 0.6, 0)), fwd);
        f.p.copy(ideal); f.t = 1; continue;
      }
      let fy;
      if (this.airborne || (this.state === 'cine' && this.cineAir)) { f.p.copy(ideal); f.t = 1; f.lift = 0; fy = gy + this.pos.y + 0.08 * S; }
      else if (d.wheeled) { f.p.copy(ideal); f.lift = 0; f.t = 1; fy = Arena.groundAt(f.p.x, f.p.z); }
      else {
        if (f.t < 1) {
          f.t = Math.min(1, f.t + dt / (this.sprinting ? 0.2 : 0.27)); f.p.lerpVectors(f.from, f.to, smooth(f.t)); f.lift = Math.sin(f.t * Math.PI) * 0.17 * S;
          if (f.t >= 1) { f.lift = 0; this.footfall(f.p); }
        } else if (o.t >= 1 && f.p.distanceTo(ideal) > 0.26 * S) {
          f.from.copy(f.p); f.to.copy(ideal).addScaledVector(this.vel, this.sprinting ? 0.22 : 0.16).addScaledVector(this.knock, 0.1); f.t = 0;
        }
        fy = Arena.groundAt(f.p.x, f.p.z) + f.lift;
      }
      foot.position.copy(R.root.worldToLocal(_t4.set(f.p.x, fy, f.p.z))); foot.rotation.set(0, d.wheeled ? 0 : s * 0.18, 0);
      const ank = _t1.set(f.p.x, fy + d.ankle * S, f.p.z);
      const pole = _t2.copy(fwd).addScaledVector(left, s * 0.15);
      solveIK(s > 0 ? R.hipL : R.hipR, s > 0 ? R.knL : R.knR, d.thigh * S, d.shin * S, ank, pole, fwd);
    }
    if (R.wheel) R.wheel.rotation.x += (fwdV + this.knock.x * Math.sin(this.yaw) + this.knock.z * Math.cos(this.yaw)) * dt / (0.58 * S);
    updatePistons(R);
  }
  posePunch(hands, P, shH, legOverride, opp) {
    const R = this.rig, d = R.dims, mv = this.move, T = this.moveT;
    R.root.updateMatrixWorld();
    if (mv.kind === 'kick') {
      const s = mv.leg; const tgt = R.root.worldToLocal(_t3.copy(opp.chestW)); tgt.y -= 0.25; tgt.x = s * 0.1; tgt.z = clamp(tgt.z - 0.3, 0.4, (d.thigh + d.shin) * 0.95); tgt.y = clamp(tgt.y, d.hipH * 0.6, d.hipH * 1.25);
      let p, k;
      if (T < mv.w) { k = easeOut(T / mv.w); p = V3(s * 0.18, lerp(d.ankle, d.hipH * 0.7, k), lerp(0, 0.35, k)); }
      else if (T < this.impactT) { k = (T - mv.w) / mv.s; p = V3(s * 0.18, d.hipH * 0.7, 0.35).lerp(tgt, easeOut(k)); }
      else { k = easeInOut(clamp((T - this.impactT) / (this.totalT - this.impactT), 0, 1)); p = tgt.clone().lerp(_t5.set(s * 0.2, d.ankle, -0.1), k); }
      legOverride[s] = { p, k: T < this.impactT ? 1 : 1 - k };
      P.lean += mv.lean; P.twist = -s * 0.25;
      for (const h of [1, -1]) hands[h].p.set(h * 0.4, shH - 0.05, 0.3);
      return;
    }
    if (mv.kind === 'grab') {
      const k = T < mv.w ? easeOut(T / mv.w) : T < this.impactT ? 1 : 1 - easeInOut(clamp((T - this.impactT) / mv.r, 0, 1));
      for (const s of [1, -1]) { hands[s].p.set(s * 0.32, shH, 0.5 + k * 0.55); hands[s].pole.set(s, -0.3, -0.5); }
      P.lean += mv.lean * k; return;
    }
    if (mv.kind === 'toss' || mv.kind === 'smash') { const k = T < mv.w ? T / mv.w : 1; P.lean += (T < mv.w ? -0.25 * k : mv.lean); P.crouch += 0.08 * k; return; }
    const s = mv.hand, h = hands[s], o = hands[-s];
    o.p.set(-s * 0.2, shH + 0.1, 0.46);
    const tw = mv.twist;
    const tgtW = _t2.copy(this.body ? opp.chestW : opp.headW); if (this.body) tgtW.y -= 0.22 * opp.S;
    const tgt = R.root.worldToLocal(_t3.copy(tgtW));
    tgt.z -= 0.24; tgt.x *= 0.7;
    const guard = _t4.set(s * 0.26, shH + 0.03, 0.52);
    let wind;
    if (mv.kind === 'hook') wind = _t1.set(s * 0.56, shH - 0.04, 0.4);
    else if (mv.kind === 'upper') wind = _t1.set(s * 0.3, shH - 0.5, 0.42);
    else if (mv.kind === 'dive') wind = _t1.set(s * 0.2, shH + 0.6, 0.1);
    else wind = _t1.set(s * 0.24, shH - 0.02, 0.38);
    let w = 0;
    if (T < mv.w) {
      const k = easeOut(T / mv.w); h.p.lerpVectors(guard, wind, k); w = k;
      P.twist = s * tw * 0.35 * k; if (mv.kind === 'upper') P.crouch += 0.14 * k;
    } else if (T < this.impactT) {
      const k = (T - mv.w) / mv.s, e = 1 - (1 - k) * (1 - k);
      if (mv.kind === 'straight' || mv.kind === 'dive') h.p.lerpVectors(wind, tgt, e);
      else {
        const c = mv.kind === 'hook' ? _pl.set(s * (d.shX + 0.5), shH + 0.06, Math.max(0.45, tgt.z * 0.65)) : _pl.set(s * 0.18, shH - 0.6, tgt.z * 0.7);
        const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, cc = e * e;
        h.p.set(wind.x * a + c.x * b + tgt.x * cc, wind.y * a + c.y * b + tgt.y * cc, wind.z * a + c.z * b + tgt.z * cc);
      }
      w = 1; P.twist = lerp(s * tw * 0.35, -s * tw, e); P.lean += mv.lean * e;
      if (mv.kind === 'upper') P.crouch += lerp(0.14, -0.05, e);
    } else {
      const k = easeInOut(clamp((T - this.impactT) / (this.totalT - this.impactT), 0, 1));
      h.p.lerpVectors(tgt, guard, k); w = 1 - k;
      P.twist = -s * tw * (1 - k); P.lean += mv.lean * (1 - k);
    }
    const pole = mv.kind === 'hook' ? _pl.set(s * 1, 0.6, -0.3) : mv.kind === 'upper' ? _pl.set(s * 0.35, -1, 0.35) : _pl.set(s * 0.6, -1, -0.05);
    h.pole.lerp(pole, w);
  }
  footfall(p) {
    const w = (0.5 + this.def.stats.armor * 0.06) * Math.sqrt(this.weight);
    SFX.step(w);
    FX.puff(_t4.set(p.x, Arena.groundAt(p.x, p.z) + 0.05, p.z), 2, 0.32, 0.35 * this.S, 0.15, 0.6, 0.9);
    Arena.crushCars(p, 0.22 * this.S);
    Game.footShake && Game.footShake(p, w);
  }
}

// ---------------------------------------------------------------- hit resolution
function resolveHit(a, d) {
  const mv = a.move, body = a.body;
  if (!d) return;
  const dx = d.pos.x - a.pos.x, dz = d.pos.z - a.pos.z, dist = Math.hypot(dx, dz) || 1e-3;
  const dir = V3(dx / dist, 0, dz / dist);
  const facing = (Math.sin(a.yaw) * dx + Math.cos(a.yaw) * dz) / dist;
  const limb = mv.kind === 'kick' ? (mv.leg > 0 ? a.rig.footL : a.rig.footR) : mv.kind === 'knee' ? a.rig.knL : mv.hand > 0 ? a.rig.fistL : mv.hand < 0 ? a.rig.fistR : a.rig.chest;
  const fist = limb.getWorldPosition(V3()).addScaledVector(dir, 0.12 * a.S);
  if (mv.kind === 'smash' && a.held) fist.copy(a.held.mesh.position);
  const range = a.reach + (mv.reach || 0) * a.S + (a.bladeT > 0 ? (a.rig.bladeReach || 0.3) * a.S : 0) + d.radius * 0.3;
  const vert = Math.abs(a.pos.y - d.pos.y);
  if (mv.kind !== 'knee' && (d.isDown || dist > range || facing < 0.45 || vert > 1.2 * a.S || d.state === 'grabbed')) {
    const nb = Arena.buildingNear(a.pos, a.forward(V3()), a.reach + 0.3 * a.S, fist.y);
    if (nb && mv.power) { Arena.impact(fist.clone(), (0.35 + mv.power * 0.18) * a.S * (a.bladeT > 0 ? 1.4 : 1), 3 * mv.power, a.forward(V3())); a.stats.wrecked++; Game.shake(0.15 * mv.power); FX.flash(fist, 0xffb070, 30); }
    else if (mv.power > 0.8) a.totalT += mv.r * 0.45;
    return;
  }
  if (d.state === 'punch' && d.moveKind === a.moveKind && STRIKES.has(mv.kind) && mv.kind !== 'knee' && Math.abs((d.punchStart || 0) - (a.punchStart || 0)) < 0.22 && !d.hitDone) { Game.startClash(a, d, fist); return; }
  if (d.iframes) {
    Popups.show('SLIP', d.headW.clone().add(V3(0, 0.4, 0)), 'b');
    if (mv.power > 0.8) a.totalT += mv.r * 0.5;
    Game.onSlip(d, a); return;
  }
  if (d.clones.length && d.cloneT > 0 && Math.random() < 0.45) {
    const c = d.clones.find(c => !c.dying);
    if (c) { c.dying = true; Popups.show('DECOY', c.pos.clone().add(V3(0, 2, 0)), 'b'); FX.burst(c.pos.clone().add(V3(0, 1.5, 0)), [1.5, 2, 4], 2); SFX.whoosh(1); return; }
  }
  const tired = a.stam < a.stamMax * 0.15;
  let dmg = (mv.dmg + (mv.kind === 'smash' && a.held ? a.held.mass * 55 : 0)) * a.powerMul * (tired ? 0.7 : 1) * (a.chargeBonus || 1) * (a.bladeT > 0 ? 1.45 : 1);
  const side = mv.hand > 0 ? 'armR' : 'armL';
  if (d.blocking && d.canBlock && mv.kind !== 'smash') {
    if (d.blockT < 0.13) {
      a.setState('stagger', 0.62); a.impulse('rx', -3); a.impulse('hx', -3); a.knock.addScaledVector(dir, -2.2 * a.S);
      FX.spark(fist, V3(-dir.x, 0.5, -dir.z), 40, 9, [2.5, 3.2, 4.5]); FX.burst(fist, [2.2, 3, 4], 1.4); FX.flash(fist, 0x9fd8ff, 40);
      SFX.impact(0.9, true); Popups.show('PARRY', d.headW.clone().add(V3(0, 0.45, 0)), 'b');
      Game.hitstop(0.08); Game.shake(0.3); Game.onParry(d, a); return;
    }
    const chip = dmg * (mv.kind === 'kick' ? 0.25 : 0.13) * (d.parts[side] < 25 ? 2 : 1);
    d.hp = Math.max(1, d.hp - chip); d.chipDelay = 0.5;
    d.stam -= (mv.stam || 5) * (mv.kind === 'kick' ? 1.6 : 0.9) + 2;
    d.damagePart(side, dmg * 0.3, dir);
    d.setState('blockstun', 0.1 + mv.power * 0.08); d.blocking = true;
    d.knock.addScaledVector(dir, (mv.knock || 1) * 0.6 * a.S / Math.pow(d.weight, 0.5)); d.impulse('rx', -mv.power * 1.2);
    FX.spark(fist, V3(-dir.x, 0.6, -dir.z), Math.floor(8 + mv.power * 14), 6, [3.5, 2.6, 1.6]); FX.flash(fist, 0xffc080, 14);
    SFX.impact(mv.power, true); Game.shake(0.08 + mv.power * 0.08); Game.hitstop(0.03);
    d.stats.blocked++;
    if (d.stam <= 0) { d.stam = 0; d.setState('dazed', 1.1); d.blocking = false; Popups.show('GUARD BREAK', d.headW.clone().add(V3(0, 0.5, 0)), 'r'); SFX.clank(1); Game.onCrowd(0.6); }
    return;
  }
  const tags = [];
  let mul = 1;
  if (d.state === 'punch' && d.moveT < d.impactT) { mul *= 1.35; tags.push(['COUNTER', 'y']); }
  if (a.counterT > 0) { mul *= 1.5; tags.push(['AMBUSH', 'b']); a.counterT = 0; }
  if (d.state === 'dazed') mul *= 1.12;
  if (a.chargeBonus > 1 && mv.power) tags.push(['RUNNING', 'y']);
  if (a.bladeT > 0 && mv.power) tags.push(['SLASH', 'b']);
  dmg *= mul * rand(0.93, 1.07);
  if (d.fortT > 0) dmg *= 0.35;
  let cloneHits = 0; for (const c of a.clones) if (!c.dying) { cloneHits++; FX.spark(d.chestW, V3().subVectors(d.chestW, c.pos).normalize(), 14, 6, [1.6, 2.2, 4.5]); }
  if (cloneHits) { dmg *= 1 + 0.3 * cloneHits; tags.push([`+${cloneHits} CLONE`, 'b']); }
  d.hp -= dmg; d.chipDelay = 0.55; d.sinceHit = 0;
  if (!body) d.stun += (mv.stun || 10) * mul; else { d.stam = Math.max(0, d.stam - dmg * 0.28); d.bodyDmg += dmg; d.stun += (mv.stun || 10) * 0.25; }
  d.damagePart(body || mv.kind === 'kick' ? 'core' : 'head', dmg, dir);
  a.combo = a.comboT > 0 ? a.combo + 1 : 1; a.comboT = 1.0; a.stats.maxCombo = Math.max(a.stats.maxCombo, a.combo);
  a.stats.landed++; a.stats.dmg += dmg; if (mv.power >= 0.85) a.stats.power++;
  a.stats.roundDmg[0] += dmg;
  const p = mv.power * mul, s = mv.hand || 1;
  if (body) { d.impulse('rx', 4.2 * p); d.impulse('cr', 0.9 * p); d.impulse('hx', 2 * p); }
  else if (mv.kind === 'hook') { d.impulse('hy', s * 7 * p); d.impulse('hz', -s * 4 * p); d.impulse('ry', s * 3 * p); d.impulse('rz', -s * 1.6 * p); }
  else if (mv.kind === 'upper') { d.impulse('hx', -9 * p); d.impulse('rx', -3.5 * p); }
  else if (mv.kind === 'kick' || mv.kind === 'knee') { d.impulse('rx', 4.5 * p); d.impulse('cr', 0.7 * p); }
  else { d.impulse('hx', -5.5 * p); d.impulse('rx', -2.2 * p); d.impulse('hy', -s * 1.2 * p); }
  const strength = Math.pow(a.weight, 0.35) / Math.pow(d.weight, 0.6);
  const kn = (mv.knock || 0) * mul * strength * (a.bladeT > 0 ? 1.1 : 1);
  if (d.state !== 'grabbed') {
    if ((kn > 4.2 || (mv.up && mul > 1.2)) && d.fortT <= 0) { d.launch(dir, kn * 1.25 * a.S, (mv.up || 1.6) + kn * 0.25); tags.push(['LAUNCHED', 'r']); }
    else {
      d.knock.addScaledVector(dir, kn * 1.15 * d.S);
      if (d.state !== 'dazed' && !(d.fortT > 0 && mv.power < 1)) { if (d.state === 'punch') d.queued = null; if (d.state === 'ability' && d.ab && d.ab.cancel) d.ab.cancel(d); d.setState('hitstun', 0.13 + mv.power * 0.16 * mul); d.blocking = false; }
    }
  }
  a.knock.addScaledVector(dir, 0.35 * a.S);
  const heat = a.bladeT > 0 ? [2.4, 3.2, 4.6] : [4, 2.4, 1.0];
  FX.spark(fist, V3(dir.x * 0.6, 0.6, dir.z * 0.6), Math.floor(16 + dmg * 0.45), (7 + p * 4) * Math.sqrt(a.S), heat, 0.95);
  FX.burst(fist, [3.2, 2.0, 0.9], (0.8 + p * 0.8) * a.S); FX.flash(fist, 0xffa860, 25 + p * 35, 8 * a.S);
  if (d.parts[body ? 'core' : 'head'] < 55) FX.oil(fist, dir, Math.floor(6 + p * 8));
  FX.puff(fist, 2, 0.25, 0.4 * a.S, 0.4, 0.5, 0.8);
  SFX.impact(0.55 + p * 0.55, false, body ? 0.8 : 1);
  Game.shake(0.12 + p * 0.22); Game.hitstop(p > 0.9 ? 0.085 : 0.04);
  if (p > 0.95 || tags.length) Game.onCrowd(0.4 + p * 0.3);
  const headPop = d.headW.clone().add(V3(0, 0.45 * d.S, 0));
  tags.forEach(([t, c], i) => Popups.show(t, headPop, c, -i * 34));
  if (Game.training) Popups.show(String(Math.round(dmg)), fist, 'dmg', 20);
  Game.onHit(a, d, dmg, mv, body);
  if (d.stun >= 100 && d.hp > 0 && d.state !== 'launched') { d.stun = 0; d.setState('dazed', 1.7); d.blocking = false; Popups.show('DAZED', headPop.clone().add(V3(0, 0.25, 0)), 'r'); Game.onCrowd(0.8); }
  if (d.hp <= 0) Game.knockdown(d, a, dir, p);
}

function resolveGrab(a, d) {
  if (!d) return;
  const dx = d.pos.x - a.pos.x, dz = d.pos.z - a.pos.z, dist = Math.hypot(dx, dz);
  const facing = (Math.sin(a.yaw) * dx + Math.cos(a.yaw) * dz) / (dist || 1);
  if (d.isDown || d.airborne || dist > a.reach * 0.95 + d.radius * 0.4 || facing < 0.5 || d.iframes || ['grabbed', 'grabbing', 'clash', 'ability'].includes(d.state)) { a.totalT += 0.25; return; }
  Game.startGrab(a, d);
}
