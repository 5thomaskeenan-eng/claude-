// ============================================================================
// FIGHTER: state machine, procedural IK animation, footwork, springs, ragdoll
// ============================================================================
const MOVES = {
  jab: { name: 'Jab', hand: 1, w: 0.075, s: 0.095, r: 0.17, dmg: 34, stam: 5, stun: 7, knock: 0.8, kind: 'straight', twist: 0.24, lean: 0.12, reach: 0.04, power: 0.55 },
  cross: { name: 'Cross', hand: -1, w: 0.12, s: 0.11, r: 0.25, dmg: 62, stam: 10, stun: 14, knock: 1.5, kind: 'straight', twist: 0.6, lean: 0.2, reach: 0.16, power: 0.85 },
  hook: { name: 'Hook', hand: 1, w: 0.16, s: 0.14, r: 0.28, dmg: 82, stam: 14, stun: 22, knock: 1.7, kind: 'hook', twist: 0.7, lean: 0.08, reach: -0.06, power: 1.0 },
  upper: { name: 'Uppercut', hand: -1, w: 0.19, s: 0.13, r: 0.32, dmg: 96, stam: 16, stun: 28, knock: 1.3, kind: 'upper', twist: 0.38, lean: 0.06, reach: -0.12, power: 1.1 },
};
const DODGE_T = 0.38, RISE_T = 1.15;
const NODE_NAMES = ['pelvis', 'chest', 'head', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR'];
const NODE_R = { pelvis: 0.3, chest: 0.4, head: 0.24, shL: 0.22, shR: 0.22, elL: 0.14, elR: 0.14, haL: 0.17, haR: 0.17, hipL: 0.17, hipR: 0.17, knL: 0.15, knR: 0.15, ftL: 0.12, ftR: 0.12 };

const _t1 = V3(), _t2 = V3(), _t3 = V3(), _t4 = V3(), _fw = V3(), _lf = V3(), _up = V3(0, 1, 0), _pl = V3(), _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m4 = new THREE.Matrix4();

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

// ---------------------------------------------------------------- Verlet ragdoll
class Ragdoll {
  constructor(R) {
    this.R = R; this.acc = 0;
    const cur = makeNodeSet(); readNodes(R, cur);
    this.p = {}; for (const n of NODE_NAMES) this.p[n] = { x: cur[n].clone(), o: cur[n].clone(), r: NODE_R[n] };
    this.c = [];
    const add = (a, b, kind = 'eq', k = 1, f = 1) => this.c.push({ a: this.p[a], b: this.p[b], rest: cur[a].distanceTo(cur[b]) * f, kind, k });
    [['pelvis', 'chest'], ['chest', 'head'], ['chest', 'shL'], ['chest', 'shR'], ['shL', 'shR'], ['shL', 'elL'], ['elL', 'haL'], ['shR', 'elR'], ['elR', 'haR'], ['pelvis', 'hipL'], ['pelvis', 'hipR'], ['hipL', 'hipR'], ['hipL', 'knL'], ['knL', 'ftL'], ['hipR', 'knR'], ['knR', 'ftR'],
    ['shL', 'pelvis'], ['shR', 'pelvis'], ['shL', 'hipL'], ['shR', 'hipR'], ['shL', 'hipR'], ['shR', 'hipL'], ['head', 'shL'], ['head', 'shR'], ['chest', 'hipL'], ['chest', 'hipR']].forEach(([a, b]) => add(a, b));
    add('head', 'pelvis', 'eq', 0.4);
    add('haL', 'shL', 'min', 1, 0.55); add('haR', 'shR', 'min', 1, 0.55);
    add('ftL', 'hipL', 'min', 1, 0.62); add('ftR', 'hipR', 'min', 1, 0.62);
    add('ftL', 'chest', 'min', 1, 0.7); add('ftR', 'chest', 'min', 1, 0.7);
    add('knL', 'knR', 'min', 1, 0.5);
    this.frozen = false;
  }
  impulse(dir, power) {
    const h = 1 / 120;
    for (const n of NODE_NAMES) {
      const up = ['head', 'chest', 'shL', 'shR'].includes(n) ? 1 : n.startsWith('ft') ? 0.15 : 0.6;
      const v = _t1.copy(dir).multiplyScalar(power * 0.8 * up * rand(0.85, 1.15)); v.y += (n === 'head' || n === 'chest') ? 1.1 + power * 0.15 : 0.4;
      v.x += rand(-0.4, 0.4); v.z += rand(-0.4, 0.4);
      this.p[n].o.addScaledVector(v, -h);
    }
  }
  step(dt) {
    if (this.frozen) return;
    const h = 1 / 120; this.acc = Math.min(this.acc + dt, 0.05);
    const lim = RING_H + 0.05;
    while (this.acc >= h) {
      this.acc -= h;
      for (const n of NODE_NAMES) {
        const P = this.p[n];
        const vx = (P.x.x - P.o.x) * 0.996, vy = (P.x.y - P.o.y) * 0.996, vz = (P.x.z - P.o.z) * 0.996;
        P.o.copy(P.x); P.x.x += vx; P.x.y += vy - GRAV * h * h; P.x.z += vz;
      }
      for (let it = 0; it < 8; it++) {
        for (const c of this.c) {
          const dx = c.b.x.x - c.a.x.x, dy = c.b.x.y - c.a.x.y, dz = c.b.x.z - c.a.x.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-4;
          if (c.kind === 'min' && d >= c.rest) continue;
          const diff = (d - c.rest) / d * 0.5 * c.k;
          c.a.x.x += dx * diff; c.a.x.y += dy * diff; c.a.x.z += dz * diff;
          c.b.x.x -= dx * diff; c.b.x.y -= dy * diff; c.b.x.z -= dz * diff;
        }
        for (const n of NODE_NAMES) {
          const P = this.p[n], fl = RING_Y + P.r;
          if (P.x.y < fl) { P.x.y = fl; P.o.x += (P.x.x - P.o.x) * 0.25; P.o.z += (P.x.z - P.o.z) * 0.25; if (P.o.y < P.x.y - 0.03) this.bump = Math.max(this.bump || 0, P.x.y - P.o.y); }
          const l = lim - P.r * 0.5;
          if (P.x.x > l) { P.x.x = l; P.o.x = l + (P.x.x - P.o.x) * 0.0; } if (P.x.x < -l) P.x.x = -l;
          if (P.x.z > l) P.x.z = l; if (P.x.z < -l) P.x.z = -l;
        }
      }
    }
  }
  speed() { let s = 0; for (const n of NODE_NAMES) s += this.p[n].x.distanceTo(this.p[n].o); return s * 120 / NODE_NAMES.length; }
  pos(n) { return this.p[n].x; }
  apply(src) {
    const R = this.R, P = src || Object.fromEntries(NODE_NAMES.map(n => [n, this.p[n].x])), d = R.dims;
    R.root.position.set(0, 0, 0); R.root.quaternion.identity(); R.root.scale.setScalar(1); R.root.updateMatrixWorld();
    const X = _t1.subVectors(P.hipL, P.hipR).normalize(), Y = _t2.subVectors(P.chest, P.pelvis).normalize(), Z = _t3.crossVectors(X, Y).normalize(); X.crossVectors(Y, Z);
    _m4.makeBasis(X, Y, Z); const qb = _q1.setFromRotationMatrix(_m4);
    R.body.position.copy(P.pelvis); R.body.quaternion.copy(qb); R.spine.quaternion.identity();
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
    for (const [ft, p] of [[R.footL, P.ftL], [R.footR, P.ftR]]) { ft.position.set(p.x, Math.max(RING_Y, p.y - d.ankle), p.z); ft.rotation.set(0, yaw, 0); }
    if (R.wheeled) R.footR.position.copy(R.footL.position).addScaledVector(X, -2 * d.stanceW);
    updatePistons(R);
  }
}
function solveLook(a, b, mid, end, up) { a.up.copy(up); a.lookAt(mid); a.updateMatrixWorld(true); b.up.copy(up); b.lookAt(end); b.updateMatrixWorld(true); }

// ---------------------------------------------------------------- Fighter
class Fighter {
  constructor(def, idx) {
    this.def = def; this.idx = idx;
    this.rig = buildRobot(def); scene.add(this.rig.root);
    const s = def.stats, d = def.dims;
    this.maxHp = 760 + s.armor * 45;
    this.powerMul = 0.72 + s.power * 0.055;
    this.speedMul = (0.8 + s.speed * 0.045) * 0.9;
    this.moveSpeed = (1.25 + s.speed * 0.13) * (d.wheeled ? 1.15 : 1);
    this.stamMax = 70 + s.stamina * 7;
    const L = d.upper + d.fore;
    this.reach = Math.sqrt(Math.max(0.1, L * L - Math.pow(d.shX * 0.55, 2))) + 0.38;
    this.radius = 0.56;
    this.sp = {}; for (const k of ['rx', 'ry', 'rz', 'hx', 'hy', 'hz', 'cr']) this.sp[k] = { x: 0, v: 0 };
    this.feet = { L: { p: V3(), from: V3(), to: V3(), t: 1, lift: 0 }, R: { p: V3(), from: V3(), to: V3(), t: 1, lift: 0 } };
    this.headW = V3(); this.chestW = V3(); this.nodes = makeNodeSet();
    this.stats = { thrown: 0, landed: 0, power: 0, dmg: 0, kd: 0, maxCombo: 0, blocked: 0, roundDmg: [0, 0, 0, 0, 0], roundKd: [0, 0, 0, 0, 0] };
    this.pos = V3(); this.vel = V3(); this.knock = V3(); this.yaw = 0;
    this.hp = this.maxHp; this.hpChip = this.hp; this.chipDelay = 0; this.stam = this.stamMax; this.stun = 0; this.od = 0; this.odT = 0;
    this.parts = { head: 100, core: 100, armL: 100, armR: 100 }; this.partTh = { head: [75, 50, 25], core: [75, 50, 25], armL: [75, 50, 25], armR: [75, 50, 25] };
    this.kd = 0; this.combo = 0; this.comboT = 0; this.bodyDmg = 0; this.punchId = 0; this.sinceHit = 9; this.restT = 1; this.blockT = 9;
    this.time = rand(0, 10); this.state = 'idle'; this.st = 0; this.stateDur = 0; this.blocking = false; this.queued = null;
    this.rag = null; this.dodgeDir = 0; this.speedNow = 0;
    setEnvIntensity(this.rig, 1);
    this.trails = { 1: new Trail(def.colors.accent), [-1]: new Trail(def.colors.accent) };
  }
  dispose() { FX.emitters = FX.emitters.filter(e => e.owner !== this); this.rig.root.removeFromParent(); this.trails[1].dispose(); this.trails[-1].dispose(); }
  place(x, z, yaw) {
    this.pos.set(x, 0, z); this.yaw = yaw; this.vel.set(0, 0, 0); this.knock.set(0, 0, 0);
    _fw.set(Math.sin(yaw), 0, Math.cos(yaw)); _lf.set(Math.cos(yaw), 0, -Math.sin(yaw));
    const st = this.def.dims.stanceW;
    this.feet.L.p.copy(this.pos).addScaledVector(_lf, st).addScaledVector(_fw, 0.17); this.feet.L.t = 1;
    this.feet.R.p.copy(this.pos).addScaledVector(_lf, -st).addScaledVector(_fw, -0.17); this.feet.R.t = 1;
  }
  setState(s, dur = 0) { this.state = s; this.st = 0; this.stateDur = dur; if (s !== 'punch') this.queued = null; }
  get canBlock() { return this.state === 'idle' || this.state === 'blockstun'; }
  get isDown() { return this.state === 'down' || this.state === 'ko' || this.state === 'rising'; }
  get inWindup() { return this.state === 'punch' && this.moveT < this.impactT; }
  ragPos() { return this.rag ? this.rag.pos('pelvis') : this.pos; }
  forward(v) { return v.set(Math.sin(this.yaw), 0, Math.cos(this.yaw)); }

  startPunch(p) {
    const body = p.startsWith('body:'), kind = body ? p.slice(5) : p, mv = MOVES[kind];
    const tired = this.stam < this.stamMax * 0.15;
    if (this.odT <= 0) this.stam = Math.max(0, this.stam - mv.stam);
    this.punchRate = this.speedMul * (this.odT > 0 ? 1.22 : 1) * (tired ? 0.78 : 1);
    this.move = mv; this.moveKind = kind; this.body = body; this.moveT = 0; this.hitDone = false;
    this.impactT = mv.w + mv.s; this.totalT = mv.w + mv.s + mv.r; this.punchId++;
    this.setState('punch'); this.stats.thrown++; this.restT = 0;
    SFX.whoosh(mv.power);
    if (mv.power > 0.8) { SFX.hiss(0.5); const b = this.rig.chest.localToWorld(_t1.set(this.move.hand * 0.3, 0.35, -0.5)); for (let i = 0; i < 3; i++) FX.smoke.emit(b.x, b.y, b.z, rand(-.3, .3), rand(0.6, 1.4), rand(-.3, .3), 1.1, 0.25, 1.1, 0.75, 0.77, 0.8, 0.22, -0.2, 1.5); }
  }
  startDodge(dir) { this.stam -= 6; this.dodgeDir = dir; this.setState('dodge', DODGE_T); this.knock.addScaledVector(_lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)), dir * 1.4); SFX.whoosh(0.4); }
  get iframes() { return this.state === 'dodge' && this.st > 0.03 && this.st < 0.3; }
  activateOD() {
    this.od = 0; this.odT = 6.5; SFX.od(); setGlow(this.rig, 2.6); this.rig.aura.intensity = 8;
    FX.burst(this.chestW, [3, 2.4, 0.8], 2.4); Popups.show('OVERDRIVE', this.headW.clone().add(V3(0, 0.6, 0)), 'y');
    Game.onOverdrive(this);
  }
  endOD() { this.odT = 0; setGlow(this.rig, 1); this.rig.aura.intensity = 0; }

  damagePart(zone, amt, dir) {
    const before = this.parts[zone]; const after = Math.max(0, before - amt * 0.11); this.parts[zone] = after;
    const th = this.partTh[zone];
    while (th.length && after <= th[0]) {
      const lvl = th.shift();
      const list = this.rig.armor[zone];
      if (list.length) {
        const mesh = list.splice(Math.floor(Math.random() * list.length), 1)[0];
        const v = V3(dir.x * rand(2, 4.5), rand(2.5, 5), dir.z * rand(2, 4.5)).add(V3(rand(-1.5, 1.5), 0, rand(-1.5, 1.5)));
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

  startRagdoll(dir, power) {
    this.rag = new Ragdoll(this.rig); this.rag.impulse(dir, power);
    this.blocking = false; this.vel.set(0, 0, 0); this.knock.set(0, 0, 0);
  }
  startRise(oppPos) {
    const p = this.rag.pos('pelvis');
    this.pos.set(clamp(p.x, -RING_H + 0.8, RING_H - 0.8), 0, clamp(p.z, -RING_H + 0.8, RING_H - 0.8));
    this.yaw = Math.atan2(oppPos.x - this.pos.x, oppPos.z - this.pos.z);
    this.rag.frozen = true; this.ragSnap = makeNodeSet(); for (const n of NODE_NAMES) this.ragSnap[n].copy(this.rag.p[n].x);
    this.place(this.pos.x, this.pos.z, this.yaw);
    this.setState('rising', RISE_T); this.stun = 0;
  }

  // ------------------------------------------------ logic
  update(dt, opp, it) {
    this.time += dt; this.st += dt;
    if (this.odT > 0) { this.odT -= dt; this.rig.aura.intensity = 6 + Math.sin(this.time * 20) * 2; if (this.odT <= 0) this.endOD(); }
    this.chipDelay -= dt;
    if (this.hpChip > this.hp) { if (this.chipDelay <= 0) this.hpChip = Math.max(this.hp, this.hpChip - dt * this.maxHp * 0.35); } else this.hpChip = this.hp;
    this.sinceHit += dt; if (this.sinceHit > 1.3) this.stun = Math.max(0, this.stun - 14 * dt);
    this.comboT -= dt; if (this.comboT <= 0) this.combo = 0;
    this.blockT += dt;
    if (this.flicker) setGlow(this.rig, Math.random() < 0.1 ? 0.1 : (this.odT > 0 ? 2.6 : 1));
    if (this.state === 'down' || this.state === 'ko') return;
    if (this.state === 'rising') { if (this.st >= RISE_T) { this.rag = null; this.setState('idle'); } return; }

    // short input buffer so presses during recovery or hitstun are not lost
    if (it.punch) { this.buf = it.punch; this.bufT = 0.24; } else this.bufT = (this.bufT || 0) - dt;
    if (it.dodge) { this.bufD = it.dodge; this.bufDT = 0.2; } else this.bufDT = (this.bufDT || 0) - dt;
    let moveScale = 1;
    switch (this.state) {
      case 'punch':
        this.moveT += dt * this.punchRate;
        if (!this.hitDone && this.moveT >= this.impactT) { this.hitDone = true; resolveHit(this, opp); }
        if (it.punch && this.moveT > this.impactT * 0.8) this.queued = it.punch;
        if (this.state === 'punch' && this.moveT >= this.totalT) { const q = this.queued; this.setState('idle'); this.queued = q; }
        moveScale = 0.3; break;
      case 'hitstun': case 'stagger': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.1; break;
      case 'blockstun': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.35; break;
      case 'dazed': if (this.st >= this.stateDur) { this.setState('idle'); this.stun = 0; } moveScale = 0.25; break;
      case 'dodge': if (this.st >= this.stateDur) this.setState('idle'); moveScale = 0.3; break;
    }
    if (this.state === 'idle') {
      const p = this.queued || it.punch || (this.bufT > 0 ? this.buf : null); this.queued = null;
      const dg = it.dodge || (this.bufDT > 0 ? this.bufD : 0);
      if (it.od && this.od >= 100 && this.odT <= 0) this.activateOD();
      if (dg && this.stam >= 6) { this.startDodge(dg); this.bufDT = 0; }
      else if (p && !it.block) { this.startPunch(p); this.bufT = 0; }
    }
    const wantBlock = !!it.block && this.canBlock;
    if (wantBlock && !this.blocking) this.blockT = 0;
    this.blocking = wantBlock;

    // movement relative to facing
    const fwd = this.forward(_fw), left = _lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    let mx = it.mx || 0, mz = it.mz || 0; const mag = Math.hypot(mx, mz); if (mag > 1) { mx /= mag; mz /= mag; }
    let spd = this.moveSpeed * moveScale * (this.blocking ? 0.55 : 1) * (this.stam < this.stamMax * 0.15 ? 0.75 : 1) * (this.odT > 0 ? 1.15 : 1);
    if (mz < 0) spd *= 0.85;
    const dx = (fwd.x * mz + left.x * mx) * spd, dz = (fwd.z * mz + left.z * mx) * spd;
    this.vel.x = damp(this.vel.x, dx, 9, dt); this.vel.z = damp(this.vel.z, dz, 9, dt);
    const kd = Math.exp(-4.2 * dt); this.knock.multiplyScalar(kd);
    this.pos.x += (this.vel.x + this.knock.x) * dt; this.pos.z += (this.vel.z + this.knock.z) * dt;
    this.speedNow = Math.hypot(this.vel.x, this.vel.z) / this.moveSpeed;
    // face the opponent
    if (opp) {
      const op = opp.ragPos();
      const ty = Math.atan2(op.x - this.pos.x, op.z - this.pos.z);
      const rate = this.state === 'punch' ? 5 : this.state === 'dazed' ? 2 : 10;
      this.yaw += angDiff(this.yaw, ty) * (1 - Math.exp(-rate * dt));
    }
    // stamina
    this.restT = this.state === 'punch' ? 0 : this.restT + dt;
    const regen = (this.restT > 0.45 ? 17 : 4) * (this.blocking ? 0.55 : 1) * (1 - Math.min(0.5, this.bodyDmg / 1800)) * (this.odT > 0 ? 2 : 1);
    this.stam = Math.min(this.stamMax, this.stam + regen * dt);
  }

  // ------------------------------------------------ animation
  stepSprings(dt) {
    for (const k in this.sp) {
      const s = this.sp[k], K = k[0] === 'h' ? 230 : 160, C = k[0] === 'h' ? 13 : 11;
      s.v += (-K * s.x - C * s.v) * dt; s.x += s.v * dt;
      s.x = clamp(s.x, -0.9, 0.9);
    }
  }
  animate(dt, opp) {
    const R = this.rig;
    if (this.rag && this.state !== 'rising') {
      const before = this.rag.bump || 0; this.rag.bump = 0; this.rag.step(dt);
      if ((this.rag.bump || 0) > 0.02) { SFX.impact(Math.min(1.2, this.rag.bump * 25), false, 0.6); FX.puff(this.rag.pos('chest'), 4, 0.25, 0.8, 0.4, 0.8, 1.2); Game.shake(0.25); }
      this.rag.apply();
      readNodes(R, this.nodes); this.headW.copy(this.nodes.head); this.chestW.copy(this.nodes.chest);
      this.trails[1].mesh.visible = this.trails[-1].mesh.visible = false;
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
    for (const s of [1, -1]) {
      const on = this.state === 'punch' && this.move.hand === s && this.moveT > this.move.w * 0.6 && this.moveT < this.impactT + 0.04 && (this.move.power > 0.8 || this.odT > 0);
      this.trails[s].push((s > 0 ? R.fistL : R.fistR).getWorldPosition(_t1), on, dt);
    }
  }

  poseStanding(dt, opp) {
    const R = this.rig, d = R.dims, t = this.time;
    this.stepSprings(dt);
    R.root.position.set(this.pos.x, RING_Y, this.pos.z); R.root.rotation.set(0, this.yaw, 0);
    const shH = d.hipH + d.spineY + d.chestY + d.shY;
    let crouch = 0, lean = 0, twist = 0, roll = 0, swayX = 0;
    const idle = this.state === 'idle' || this.state === 'blockstun';
    const bob = d.wheeled ? Math.sin(t * 3) * 0.012 : Math.sin(t * 4.2) * (idle ? 0.03 : 0.012) + Math.abs(Math.sin(t * 5.5)) * 0.035 * clamp(this.speedNow, 0, 1);
    if (d.wheeled) { const fv = this.vel.x * Math.sin(this.yaw) + this.vel.z * Math.cos(this.yaw); this._acc = damp(this._acc || 0, (fv - (this._fv || 0)) / Math.max(dt, 1e-3), 6, dt); this._fv = fv; lean += clamp(this._acc * 0.04, -0.2, 0.2) + fv * 0.03; }
    // hand targets in root space
    const hands = this._hands || (this._hands = { 1: { p: V3(), pole: V3() }, [-1]: { p: V3(), pole: V3() } });
    for (const s of [1, -1]) {
      const h = hands[s];
      h.p.set(s * 0.26, shH + 0.03 + Math.sin(t * 3.1 + s) * 0.015, 0.52);
      h.pole.set(s * 0.8, -1, -0.25);
      if (this.blocking) { h.p.set(s * 0.15, shH + 0.17, 0.4); h.pole.set(s * 0.25, -1, 0.6); crouch += 0.03; lean += 0.05; }
    }
    if (this.state === 'dazed') {
      crouch += 0.1; roll += Math.sin(t * 2.7) * 0.14; twist += Math.sin(t * 1.9) * 0.18; lean -= 0.06;
      for (const s of [1, -1]) hands[s].p.set(s * 0.38, shH - 0.4 + Math.sin(t * 3 + s) * 0.05, 0.38);
    }
    if (this.state === 'victory') {
      for (const s of [1, -1]) { hands[s].p.set(s * (d.shX + 0.15), shH + 0.85 + Math.sin(t * 6 + s) * 0.08, 0.12); hands[s].pole.set(s, -0.2, -0.5); }
      lean -= 0.12;
    }
    if (this.state === 'hitstun' || this.state === 'stagger') { for (const s of [1, -1]) hands[s].p.add(_t1.set(s * 0.08, -0.12, -0.06)); }
    if (this.state === 'dodge') {
      const k = Math.sin(clamp(this.st / DODGE_T, 0, 1) * Math.PI);
      swayX = this.dodgeDir * 0.3 * k; roll += -this.dodgeDir * 0.32 * k; crouch += 0.12 * k;
    }
    if (this.state === 'punch' && opp) {
      const mv = this.move, s = mv.hand, h = hands[s], o = hands[-s];
      o.p.set(-s * 0.2, shH + 0.1, 0.46);
      const tw = mv.twist, T = this.moveT;
      // target on the opponent (root space)
      R.root.updateMatrixWorld();
      const tgtW = _t2.copy(this.body ? opp.chestW : opp.headW); if (this.body) tgtW.y -= 0.22;
      const tgt = R.root.worldToLocal(_t3.copy(tgtW));
      tgt.z -= 0.24; tgt.x *= 0.7;
      const guard = _t4.set(s * 0.26, shH + 0.03, 0.52);
      let wind;
      if (mv.kind === 'hook') wind = _t1.set(s * 0.56, shH - 0.04, 0.4);
      else if (mv.kind === 'upper') wind = _t1.set(s * 0.3, shH - 0.5, 0.42);
      else wind = _t1.set(s * 0.24, shH - 0.02, 0.38);
      let w = 0;
      if (T < mv.w) {
        const k = easeOut(T / mv.w); h.p.lerpVectors(guard, wind, k); w = k;
        twist = s * tw * 0.35 * k; if (mv.kind === 'upper') crouch += 0.14 * k;
      } else if (T < this.impactT) {
        const k = (T - mv.w) / mv.s, e = 1 - (1 - k) * (1 - k);
        if (mv.kind === 'straight') h.p.lerpVectors(wind, tgt, e);
        else {
          const c = mv.kind === 'hook' ? _pl.set(s * (d.shX + 0.5), shH + 0.06, Math.max(0.45, tgt.z * 0.65)) : _pl.set(s * 0.18, shH - 0.6, tgt.z * 0.7);
          const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, cc = e * e;
          h.p.set(wind.x * a + c.x * b + tgt.x * cc, wind.y * a + c.y * b + tgt.y * cc, wind.z * a + c.z * b + tgt.z * cc);
        }
        w = 1; twist = lerp(s * tw * 0.35, -s * tw, e); lean += mv.lean * e;
        if (mv.kind === 'upper') crouch += lerp(0.14, -0.05, e);
      } else {
        const k = easeInOut(clamp((T - this.impactT) / (this.totalT - this.impactT), 0, 1));
        h.p.lerpVectors(tgt, guard, k); w = 1 - k;
        twist = -s * tw * (1 - k); lean += mv.lean * (1 - k); if (mv.kind === 'upper') crouch += -0.05 * (1 - k);
      }
      const pole = mv.kind === 'hook' ? _pl.set(s * 1, 0.6, -0.3) : mv.kind === 'upper' ? _pl.set(s * 0.35, -1, 0.35) : _pl.set(s * 0.6, -1, -0.05);
      h.pole.lerp(pole, w);
    }
    lean += d.hunch;
    const S = this.sp;
    R.body.position.set(swayX, d.hipH + bob - crouch - S.cr.x, 0);
    R.body.quaternion.identity();
    R.spine.rotation.set(lean + S.rx.x, twist + S.ry.x, roll + S.rz.x);
    R.chest.quaternion.identity();
    R.neck.rotation.set(-lean * 0.7 + S.hx.x, -twist * 0.5 + S.hy.x, S.hz.x);
    R.root.updateMatrixWorld(true);
    // arms
    for (const s of [1, -1]) {
      const h = hands[s];
      h.p.x += swayX * 0.6;
      const tw = R.root.localToWorld(_t1.copy(h.p));
      const pw = _t2.copy(h.pole).applyQuaternion(R.root.quaternion);
      solveIK(s > 0 ? R.shL : R.shR, s > 0 ? R.elL : R.elR, d.upper, d.fore, tw, pw, _up);
    }
    // feet: planted steps
    const fwd = this.forward(_fw), left = _lf.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    for (const [k, s] of [['L', 1], ['R', -1]]) {
      const f = this.feet[k], o = this.feet[k === 'L' ? 'R' : 'L'];
      const ideal = _t3.copy(this.pos).addScaledVector(left, s * d.stanceW + swayX * 0.4).addScaledVector(fwd, s * (d.footFwd ?? 0.17));
      if (d.wheeled) { f.p.copy(ideal); f.lift = 0; f.t = 1; }
      else if (f.t < 1) {
        f.t = Math.min(1, f.t + dt / 0.27); f.p.lerpVectors(f.from, f.to, smooth(f.t)); f.lift = Math.sin(f.t * Math.PI) * 0.17;
        if (f.t >= 1) { f.lift = 0; this.footfall(f.p); }
      } else if (o.t >= 1 && f.p.distanceTo(ideal) > 0.26) {
        f.from.copy(f.p); f.to.copy(ideal).addScaledVector(this.vel, 0.16).addScaledVector(this.knock, 0.1); f.t = 0;
      }
      const foot = s > 0 ? R.footL : R.footR;
      const fl = R.root.worldToLocal(_t4.set(f.p.x, RING_Y + f.lift, f.p.z));
      foot.position.copy(fl); foot.rotation.set(0, d.wheeled ? 0 : s * 0.18, 0);
      const ank = _t1.set(f.p.x, RING_Y + f.lift + d.ankle, f.p.z);
      const pole = _t2.copy(fwd).addScaledVector(left, s * 0.15);
      solveIK(s > 0 ? R.hipL : R.hipR, s > 0 ? R.knL : R.knR, d.thigh, d.shin, ank, pole, fwd);
    }
    if (R.wheel) { const fv = this.vel.x * Math.sin(this.yaw) + this.vel.z * Math.cos(this.yaw) + this.knock.x * Math.sin(this.yaw) + this.knock.z * Math.cos(this.yaw); R.wheel.rotation.x += fv * dt / 0.58; }
    updatePistons(R);
  }
  footfall(p) {
    const w = 0.5 + this.def.stats.armor * 0.06;
    SFX.step(w);
    FX.puff(_t4.set(p.x, RING_Y + 0.05, p.z), 2, 0.32, 0.35, 0.15, 0.6, 0.9);
    Game.footShake && Game.footShake(p, w);
  }
}

// ---------------------------------------------------------------- hit resolution
function resolveHit(a, d) {
  const mv = a.move, body = a.body;
  const dx = d.pos.x - a.pos.x, dz = d.pos.z - a.pos.z, dist = Math.hypot(dx, dz) || 1e-3;
  const dir = V3(dx / dist, 0, dz / dist);
  const facing = (Math.sin(a.yaw) * dx + Math.cos(a.yaw) * dz) / dist;
  const fist = (mv.hand > 0 ? a.rig.fistL : a.rig.fistR).getWorldPosition(V3()).addScaledVector(dir, 0.12);
  const range = a.reach + mv.reach + (a.odT > 0 ? 0.1 : 0);
  if (d.isDown || dist > range || facing < 0.5) {
    if (mv.power > 0.8) { a.totalT += mv.r * 0.45; }
    return;
  }
  if (d.iframes) {
    Popups.show('SLIP', d.headW.clone().add(V3(0, 0.4, 0)), 'b'); d.od = Math.min(100, d.od + 7);
    if (mv.power > 0.8) a.totalT += mv.r * 0.5;
    Game.onSlip(d, a);
    return;
  }
  const tired = a.stam < a.stamMax * 0.15;
  let dmg = mv.dmg * a.powerMul * (a.odT > 0 ? 1.35 : 1) * (tired ? 0.7 : 1);
  const side = mv.hand > 0 ? 'armR' : 'armL';
  // blocked
  if (d.blocking && d.canBlock) {
    if (d.blockT < 0.13) {
      a.setState('stagger', 0.62); a.impulse('rx', -3); a.impulse('hx', -3); a.knock.addScaledVector(dir, -2.2);
      FX.spark(fist, V3(-dir.x, 0.5, -dir.z), 40, 9, [2.5, 3.2, 4.5]); FX.burst(fist, [2.2, 3, 4], 1.4); FX.flash(fist, 0x9fd8ff, 40);
      SFX.impact(0.9, true); Popups.show('PARRY', d.headW.clone().add(V3(0, 0.45, 0)), 'b');
      d.od = Math.min(100, d.od + 14); Game.hitstop(0.08); Game.shake(0.3); Game.onParry(d, a);
      return;
    }
    const armF = d.parts[side] < 25 ? 2 : 1;
    const chip = dmg * (body ? 0.2 : 0.13) * armF;
    d.hp = Math.max(1, d.hp - chip); d.chipDelay = 0.5;
    d.stam -= mv.stam * (body ? 1.4 : 0.9) + 2;
    d.damagePart(side, dmg * 0.3, dir);
    d.setState('blockstun', 0.1 + mv.power * 0.08); d.blocking = true;
    d.knock.addScaledVector(dir, mv.knock * 0.7); d.impulse('rx', -mv.power * 1.2); d.impulse('cr', mv.power * 0.3);
    FX.spark(fist, V3(-dir.x, 0.6, -dir.z), Math.floor(8 + mv.power * 14), 6, [3.5, 2.6, 1.6]); FX.flash(fist, 0xffc080, 14);
    SFX.impact(mv.power, true); Game.shake(0.08 + mv.power * 0.08); Game.hitstop(0.03);
    d.stats.blocked++;
    if (d.stam <= 0) { d.stam = 0; d.setState('dazed', 1.1); d.blocking = false; Popups.show('GUARD BREAK', d.headW.clone().add(V3(0, 0.5, 0)), 'r'); SFX.clank(1); Game.onCrowd(0.6); }
    return;
  }
  // clean hit
  const tags = [];
  let mul = 1;
  if (d.state === 'punch' && d.moveT < d.impactT) { mul *= 1.35; tags.push(['COUNTER', 'y']); }
  if (d.state === 'dazed') mul *= 1.12;
  if (body && d.state === 'punch') mul *= 1.1;
  dmg *= mul * rand(0.93, 1.07);
  d.hp -= dmg; d.chipDelay = 0.55; d.sinceHit = 0;
  if (!body) d.stun += mv.stun * mul * (a.odT > 0 ? 1.3 : 1);
  else { d.stam = Math.max(0, d.stam - dmg * 0.28); d.bodyDmg += dmg; d.stun += mv.stun * 0.25; }
  d.damagePart(body ? 'core' : 'head', dmg, dir);
  a.combo = a.comboT > 0 ? a.combo + 1 : 1; a.comboT = 1.0; a.stats.maxCombo = Math.max(a.stats.maxCombo, a.combo);
  a.stats.landed++; a.stats.dmg += dmg; if (mv.power >= 0.85) a.stats.power++;
  a.stats.roundDmg[Game.round - 1] = (a.stats.roundDmg[Game.round - 1] || 0) + dmg;
  a.od = Math.min(100, a.od + dmg * 0.075); d.od = Math.min(100, d.od + dmg * 0.04);
  // reactions
  const p = mv.power * mul, s = mv.hand;
  if (body) { d.impulse('rx', 4.2 * p); d.impulse('cr', 0.9 * p); d.impulse('hx', 2 * p); d.impulse('ry', -s * 1.2 * p); }
  else if (mv.kind === 'hook') { d.impulse('hy', s * 7 * p); d.impulse('hz', -s * 4 * p); d.impulse('ry', s * 3 * p); d.impulse('rz', -s * 1.6 * p); d.impulse('hx', -1.5 * p); }
  else if (mv.kind === 'upper') { d.impulse('hx', -9 * p); d.impulse('rx', -3.5 * p); d.impulse('cr', -0.5 * p); }
  else { d.impulse('hx', -5.5 * p); d.impulse('rx', -2.2 * p); d.impulse('hy', -s * 1.2 * p); }
  d.knock.addScaledVector(dir, mv.knock * 1.15 * mul);
  a.knock.addScaledVector(dir, 0.35);
  if (d.state !== 'dazed') { if (d.state === 'punch') d.queued = null; d.setState('hitstun', 0.13 + mv.power * 0.16 * mul); d.blocking = false; }
  // fx
  const heat = a.odT > 0 ? [4.5, 3.2, 1.2] : [4, 2.4, 1.0];
  FX.spark(fist, V3(dir.x * 0.6, 0.6, dir.z * 0.6), Math.floor(16 + dmg * 0.45), 7 + p * 4, heat, 0.95);
  FX.burst(fist, [3.2, 2.0, 0.9], 0.8 + p * 0.8); FX.flash(fist, 0xffa860, 25 + p * 35, 8);
  if (d.parts[body ? 'core' : 'head'] < 55) FX.oil(fist, dir, Math.floor(6 + p * 8));
  if (p > 0.9 && Math.random() < 0.7) Arena.splat(d.pos.x + dir.x * 0.6 + rand(-.3, .3), d.pos.z + dir.z * 0.6 + rand(-.3, .3), 0.6 + p * 0.5);
  FX.puff(fist, 2, 0.25, 0.4, 0.4, 0.5, 0.8);
  SFX.impact(0.55 + p * 0.55, false, body ? 0.8 : 1);
  Game.shake(0.12 + p * 0.22); Game.hitstop(p > 0.9 ? 0.085 : 0.04);
  if (p > 0.95 || tags.length) Game.onCrowd(0.4 + p * 0.3);
  const headPop = d.headW.clone().add(V3(0, 0.45, 0));
  tags.forEach(([t, c], i) => Popups.show(t, headPop, c, -i * 34));
  if (Game.training) Popups.show(String(Math.round(dmg)), fist, 'dmg', 20);
  Game.onHit(a, d, dmg, mv, body);
  if (d.stun >= 100 && d.hp > 0) { d.stun = 0; d.setState('dazed', 1.7); d.blocking = false; Popups.show('DAZED', headPop.clone().add(V3(0, 0.25, 0)), 'r'); Game.onCrowd(0.8); }
  if (d.hp <= 0) Game.knockdown(d, a, dir, p);
}
