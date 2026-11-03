// ============================================================================
// ABILITIES: two signature moves per mech + arm blades for everyone
// ============================================================================
const _a1 = V3(), _a2 = V3(), _a3 = V3();

function startAb(f, ab, o) {
  if (f.state !== 'idle' || f.held && !ab.allowHeld) return false;
  f.ab = ab; ab.t = 0; f.setState('ability'); if (ab.begin) ab.begin(f, o || Game.opponentOf(f));
  return true;
}
function endAb(f) { if (f.ab && f.ab.end) f.ab.end(f); f.ab = null; if (f.state === 'ability') f.setState('idle'); }
function abMove(f, dt) {
  f.knock.multiplyScalar(Math.exp(-(f.airborne ? 0.6 : 3) * dt));
  f.pos.x += (f.vel.x + f.knock.x) * dt; f.pos.z += (f.vel.z + f.knock.z) * dt;
  f.vel.multiplyScalar(Math.exp(-6 * dt));
}
// damage dealt by an ability (handles shields, blocking, launching, knockdowns)
function abilityDamage(f, o, dmg, dir, o2 = {}) {
  if (!o || o.isDown) return false;
  if (o.iframes && o2.dodgeable !== false) { Popups.show('SLIP', o.headW.clone().add(V3(0, 0.4, 0)), 'b'); return false; }
  dmg *= f.powerMul * rand(0.95, 1.05);
  const tags = o2.tags ? o2.tags.slice() : [];
  if (o.blocking && o2.blockable !== false) {
    dmg *= 0.3; tags.push(['GUARD CRUSH', 'r']); o.setState('dazed', 0.9); o.blocking = false;
  }
  if (o.fortT > 0) dmg *= 0.35;
  o.hp -= dmg; o.chipDelay = 0.6; o.sinceHit = 0; f.stats.dmg += dmg; f.stats.landed++; f.stats.roundDmg[0] += dmg;
  o.damagePart(o2.zone || 'core', dmg, dir);
  const at = o2.at || o.chestW;
  FX.spark(at, V3(dir.x, 0.6, dir.z), 40, 9 * Math.sqrt(f.S), o2.color || [4, 2.4, 1]); FX.burst(at, o2.color || [3.2, 2, 0.9], 2 * f.S); FX.flash(at, 0xffa860, 60, 10);
  SFX.impact(1.5, false, 1.2); Game.shake(0.45); Game.hitstop(0.1);
  const strength = Math.pow(f.weight, 0.35) / Math.pow(o.weight, 0.6);
  if (o2.launch && o.state !== 'grabbed') { o.launch(dir, o2.launch * strength * f.S, o2.up || 2.5); tags.push(['LAUNCHED', 'r']); }
  else if (o2.knock) { o.knock.addScaledVector(dir, o2.knock * strength * o.S); if (o.state !== 'dazed') o.setState('hitstun', 0.35); }
  tags.forEach(([t, c], i) => Popups.show(t, o.headW.clone().add(V3(0, 0.5 * o.S, 0)), c, -i * 34));
  if (Game.training) Popups.show(String(Math.round(dmg)), at, 'dmg', 20);
  Game.onHit(f, o, dmg, { power: 1.5, name: o2.name || 'Ability' }, false);
  if (o.hp <= 0) Game.knockdown(o, f, dir, 1.6);
  return true;
}
// ground shockwave: hurts the opponent, smashes foundations, crushes cars
function shockwave(f, c, radius, dmg, power) {
  const o = Game.opponentOf(f);
  const g = V3(c.x, Arena.groundAt(c.x, c.z), c.z);
  FX.ring(g, radius, [3.5, 2.6, 1.6], 0.7); FX.ring(g, radius * 0.6, [2.4, 2, 1.6], 0.45); FX.dust(g, 2.2 * f.S, Arena.dustColor);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; FX.dust(_a1.set(g.x + Math.cos(a) * radius * 0.6, g.y, g.z + Math.sin(a) * radius * 0.6), 0.8, Arena.dustColor); }
  SFX.boom(1.2); SFX.crumble(1.2); Game.shake(0.9); Game.flash(0.25);
  Arena.crushCars(g, radius);
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; Arena.impact(_a2.set(g.x + Math.cos(a) * radius * 0.7, 0.25, g.z + Math.sin(a) * radius * 0.7), 0.7, 3.5, V3(Math.cos(a), 0.4, Math.sin(a))); }
  if (o && !o.isDown && !o.airborne) {
    const dx = o.pos.x - g.x, dz = o.pos.z - g.z, d = Math.hypot(dx, dz);
    if (d < radius) abilityDamage(f, o, dmg * (1 - d / radius * 0.4), V3(dx / (d || 1), 0, dz / (d || 1)), { launch: power, up: 3, blockable: false, dodgeable: false, tags: [['SHOCKWAVE', 'y']] });
  }
}

// ------------------------------------------------ ability blueprints
const superPunch = (o) => ({
  name: o.name, t: 0, trail: false, hit: false,
  begin(f) { SFX.od(); this.hand = -1; },
  update(dt, f, opp) {
    this.t += dt; const fist = f.rig.fistR.getWorldPosition(_a1);
    if (this.t < o.charge) {
      f.face(opp, dt); f.rig.aura.intensity = 10 * this.t / o.charge; f.rig.aura.color.setRGB(o.color[0] / 4, o.color[1] / 4, o.color[2] / 4);
      if (Math.random() < 0.8) { const a = Math.random() * 6.28; FX.glow.emit(fist.x + Math.cos(a) * 0.6, fist.y + rand(-.4, .4), fist.z + Math.sin(a) * 0.6, -Math.cos(a) * 2, 0, -Math.sin(a) * 2, 0.3, 0.2 * f.S, 0.05, ...o.color, 1, 0, 0); }
    } else if (this.t < o.charge + 0.32) {
      this.trail = true;
      if (!this.lunged) { this.lunged = true; f.knock.copy(f.forward(_a2)).multiplyScalar(9 * f.S); SFX.whoosh(2); }
      FX.thruster(f.rig.chest.localToWorld(_a2.set(0, 0.1, -0.6)), f.forward(_a3).negate(), f.S * 1.4);
      if (!this.hit && opp) {
        const d = Math.hypot(opp.pos.x - f.pos.x, opp.pos.z - f.pos.z);
        if (d < f.reach + 0.35 * f.S && !opp.isDown) { this.hit = true; abilityDamage(f, opp, o.dmg, f.forward(V3()), { launch: o.knock, up: 3.2, at: fist.clone(), color: o.color, tags: [[o.name.toUpperCase(), 'y']], zone: 'head' }); FX.explode(fist.clone(), 0.8 * f.S); f.knock.multiplyScalar(0.2); }
        else { const nb = Arena.buildingNear(f.pos, f.forward(_a2), f.reach + 0.2, fist.y); if (nb) { Arena.impact(fist.clone(), 1.1 * f.S, 7, f.forward(V3())); f.knock.multiplyScalar(0.3); FX.explode(fist.clone(), 0.6); this.hit = true; } }
      }
    } else if (this.t > o.charge + 0.8) { endAb(f); }
    abMove(f, dt);
  },
  end(f) { f.rig.aura.intensity = 0; },
  cancel(f) { endAb(f); },
  pose(f, hands, P, shH) {
    const c = this.t < o.charge, k = c ? easeOut(Math.min(1, this.t / o.charge)) : 1;
    if (c) { hands[-1].p.set(-0.3, shH - 0.1, -0.35 * k + 0.4 * (1 - k)); hands[1].p.set(0.25, shH + 0.1, 0.5); P.crouch += 0.15 * k; P.twist = 0.6 * k * -(-1); }
    else { const e = Math.min(1, (this.t - o.charge) / 0.12); hands[-1].p.set(-0.05, shH + 0.05, lerp(-0.35, 1.35, e)); hands[-1].pole.set(-0.6, -1, 0); P.lean += 0.35; P.twist = -0.6 * e; hands[1].p.set(0.3, shH, 0.2); }
  },
});
const slam = (o) => ({
  name: o.name, t: 0, landed: false,
  begin(f) { f.vy = o.jump * Math.sqrt(f.S); f.pos.y = 0.05; SFX.hiss(1); FX.dust(_a1.copy(f.pos).setY(f.ground()), 0.8 * f.S, Arena.dustColor); for (let i = 0; i < 10; i++) FX.thruster(f.rig.footL.getWorldPosition(_a1), _a2.set(0, -1, 0), f.S); f.onLand = () => { this.landed = true; this.lt = 0; shockwave(f, f.pos, o.radius * f.S, o.dmg, o.launch); }; },
  update(dt, f, opp) { this.t += dt; f.face(opp, dt); if (this.landed) { this.lt += dt; if (this.lt > 0.55) endAb(f); } if (this.t > 4) endAb(f); abMove(f, dt); },
  cancel(f) { f.onLand = null; endAb(f); },
  pose(f, hands, P, shH) {
    if (!this.landed) { const up = f.vy > 0; for (const s of [1, -1]) { hands[s].p.set(s * 0.15, shH + (up ? 0.9 : 0.5), up ? 0.1 : 0.5); hands[s].pole.set(s, 0.2, -0.5); } P.lean += up ? -0.15 : 0.3; }
    else { const k = Math.max(0, 1 - this.lt / 0.55); for (const s of [1, -1]) { hands[s].p.set(s * 0.3, lerp(shH, f.def.dims.hipH * 0.2, k), 0.65); hands[s].pole.set(s, -0.2, -0.6); } P.crouch += 0.3 * k; P.lean += 0.45 * k; }
  },
});
const rip = () => ({
  name: 'Boulder Rip', t: 0,
  begin(f) { SFX.hiss(1); },
  update(dt, f, opp) {
    this.t += dt; f.face(opp, dt);
    if (this.t > 0.35 && !this.done) {
      this.done = true;
      const p = f.rig.fistR.getWorldPosition(V3()); p.y = f.ground();
      const s = 0.55;
      const bg = new THREE.IcosahedronGeometry(s, 2); const bp = bg.attributes.position;
      for (let k = 0; k < bp.count; k++) { const v = V3(bp.getX(k), bp.getY(k), bp.getZ(k)); v.multiplyScalar(0.8 + fbm(v.x * 4 + 3, v.y * 4 + v.z * 3) * 0.45); bp.setXYZ(k, v.x, v.y * 0.85, v.z); }
      bg.computeVertexNormals();
      const m = new THREE.Mesh(bg, new THREE.MeshStandardMaterial({ color: Arena.id === 'desert' ? 0xb07050 : 0x6a655e, roughness: 0.92, map: TEX.grunge }));
      m.position.copy(p); m.castShadow = true;
      const q = Arena.addProp(m, { mass: 1.6, size: s, kind: 'rock' });
      q.state = 'held'; q.owner = f; f.held = q;
      FX.dust(p, 1.4 * f.S, Arena.dustColor); FX.spark(p, V3(0, 1, 0), 30, 5, [2.5, 2, 1.5]); SFX.crumble(1.2); Game.shake(0.35);
      Arena.impact(_a1.copy(p).setY(0.2), 0.5, 2, V3(0, 1, 0));
    }
    if (this.t > 0.7) endAb(f);
    abMove(f, dt);
  },
  cancel(f) { endAb(f); },
  pose(f, hands, P, shH) { const k = Math.sin(Math.min(1, this.t / 0.7) * Math.PI); P.crouch += 0.35 * k; P.lean += 0.55 * k; hands[-1].p.set(-0.25, lerp(shH, 0.1, k), 0.8); },
});
const rush = (o) => ({
  name: o.name, t: 0, hits: 0, trail: true,
  begin(f) { SFX.od(); SFX.whoosh(1.6); },
  update(dt, f, opp) {
    this.t += dt;
    if (this.t < o.dur) {
      f.face(opp, dt * 0.6);
      f.knock.copy(f.forward(_a1)).multiplyScalar(f.moveSpeed * o.speed);
      if (o.flame || o.head) for (let i = 0; i < 2; i++) FX.thruster(f.rig.chest.localToWorld(_a2.set(rand(-.3, .3), 0.1, -0.6)), f.forward(_a3).negate(), f.S * 1.2);
      if (Math.random() < 0.3) FX.dust(_a2.copy(f.pos).setY(f.ground()), 0.4 * f.S, Arena.dustColor);
      const slot = Math.floor(this.t / (o.dur / o.hits));
      if (opp && slot >= this.hits && this.hits < o.hits) {
        const d = Math.hypot(opp.pos.x - f.pos.x, opp.pos.z - f.pos.z);
        if (d < f.reach + 0.25 * f.S && !opp.isDown) {
          this.hits++; const last = this.hits >= o.hits;
          abilityDamage(f, opp, o.dmg, f.forward(V3()), { launch: last ? o.knock : 0, knock: last ? 0 : 1.5, up: 2.6, at: (this.hits % 2 ? f.rig.fistL : f.rig.fistR).getWorldPosition(V3()), color: o.claws ? [2.5, 3.5, 1] : [4, 2.4, 1], tags: last ? [[o.name.toUpperCase(), 'y']] : [] });
          if (last) { f.knock.multiplyScalar(0.2); this.t = Math.max(this.t, o.dur); }
        }
      }
      const nb = Arena.buildingNear(f.pos, f.forward(_a1), f.radius + 0.3 * f.S, f.def.dims.hipH * f.S);
      if (nb && Math.random() < 0.5) Arena.impact(nb.point, (o.head ? 1.0 : 0.6) * f.S, 5, f.forward(V3()));
    } else if (this.t > o.dur + 0.35) endAb(f);
    abMove(f, dt);
  },
  cancel(f) { endAb(f); },
  pose(f, hands, P, shH, legs) {
    const t = this.t;
    if (o.head) { P.lean += 0.55; P.crouch += 0.15; for (const s of [1, -1]) hands[s].p.set(s * 0.45, shH - 0.2, -0.1); return; }
    const s = Math.floor(t * (o.claws ? 14 : 8)) % 2 ? 1 : -1, ph = (t * (o.claws ? 14 : 8)) % 1;
    P.lean += 0.25; P.twist = -s * 0.4;
    hands[s].p.set(s * (o.claws ? lerp(0.6, -0.2, ph) : 0.1), shH + (o.claws ? lerp(0.3, -0.2, ph) : 0), lerp(0.4, 1.25, Math.sin(ph * Math.PI)));
    hands[-s].p.set(-s * 0.25, shH, 0.45);
  },
});
const harpoon = () => ({
  name: 'Harpoon Claw', t: 0, phase: 'fire',
  begin(f, o) {
    this.claw = new THREE.Mesh(G.cone(0.12 * f.S, 0.35 * f.S, 8), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: 0.3 }));
    this.claw.rotation.x = Math.PI / 2; scene.add(this.claw);
    const lg = new THREE.BufferGeometry().setFromPoints([V3(), V3()]);
    this.line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x222222 })); scene.add(this.line);
    this.cp = f.rig.fistR.getWorldPosition(V3()); this.dir = V3().subVectors(o.chestW, this.cp).normalize(); SFX.whoosh(1.5); SFX.clank(1);
  },
  update(dt, f, o) {
    this.t += dt; f.face(o, dt);
    const hand = f.rig.fistR.getWorldPosition(_a1);
    if (this.phase === 'fire') {
      this.cp.addScaledVector(this.dir, 24 * dt);
      if (o && !o.isDown && this.cp.distanceTo(o.chestW) < 0.6 * o.S && !o.iframes) { this.phase = 'pull'; this.pt = 0; SFX.impact(1, true); FX.spark(this.cp, V3(0, 1, 0), 20, 5); Popups.show('HOOKED', o.headW.clone().add(V3(0, 0.5, 0)), 'y'); if (o.state === 'punch' || o.state === 'ability') { if (o.ab && o.ab.cancel) o.ab.cancel(o); o.setState('hitstun', 0.6); } }
      else if (this.t > 0.6) this.phase = 'back';
    } else if (this.phase === 'pull') {
      this.pt += dt; this.cp.copy(o.chestW);
      const d = Math.hypot(o.pos.x - f.pos.x, o.pos.z - f.pos.z);
      o.knock.set(f.pos.x - o.pos.x, 0, f.pos.z - o.pos.z).normalize().multiplyScalar(9 * f.S);
      if (o.state !== 'hitstun') o.setState('hitstun', 0.3);
      if (d < f.reach * 0.9 || this.pt > 0.7) { o.knock.set(0, 0, 0); this.cleanup(); f.ab = null; f.setState('idle'); if (!o.isDown && !o.airborne) Game.startGrab(f, o); else endAb(f); return; }
    } else { this.cp.lerp(hand, 1 - Math.exp(-12 * dt)); if (this.cp.distanceTo(hand) < 0.3 || this.t > 1.4) { endAb(f); return; } }
    this.claw.position.copy(this.cp); this.claw.lookAt(hand); this.claw.rotateX(-Math.PI / 2);
    const pa = this.line.geometry.attributes.position; pa.setXYZ(0, hand.x, hand.y, hand.z); pa.setXYZ(1, this.cp.x, this.cp.y, this.cp.z); pa.needsUpdate = true;
    abMove(f, dt);
  },
  cleanup() { if (this.claw) { this.claw.removeFromParent(); this.line.removeFromParent(); this.claw = null; } },
  end() { this.cleanup(); }, cancel(f) { endAb(f); },
  pose(f, hands, P, shH) { hands[-1].p.set(-0.1, shH + 0.05, 1.1); hands[-1].pole.set(-0.6, -1, 0); P.twist = 0.4; },
});
const pounce = () => ({
  name: 'Pounce', t: 0, noPhys: true,
  begin(f, o) { this.from = f.pos.clone(); const d = V3().subVectors(o.pos, f.pos); d.y = 0; const len = Math.min(d.length(), 11); d.setLength(Math.max(0, len - f.radius - o.radius)); this.to = f.pos.clone().add(d); this.T = 0.55 + len * 0.05; this.h = 2.2 * f.S; SFX.hiss(1.2); SFX.whoosh(1.5); FX.dust(_a1.copy(f.pos).setY(f.ground()), 1.2 * f.S, Arena.dustColor); },
  update(dt, f, o) {
    this.t += dt;
    if (this.t < this.T) { const k = this.t / this.T; f.pos.lerpVectors(this.from, this.to, k); f.pos.y = 4 * this.h * k * (1 - k); f.face(o, dt); }
    else if (!this.landed) { this.landed = true; f.pos.copy(this.to); f.pos.y = 0; f.land(-8); shockwave(f, f.pos, 3.0 * f.S, 125, 7); }
    else if (this.t > this.T + 0.5) endAb(f);
  },
  cancel(f) { f.pos.y = 0; endAb(f); },
  pose(f, hands, P, shH) {
    if (!this.landed) { const k = this.t / this.T; for (const s of [1, -1]) { hands[s].p.set(s * 0.55, shH + (k < 0.5 ? 0.7 : 0.1), 0.6); hands[s].pole.set(s, 0.3, -0.5); } P.lean += k < 0.5 ? -0.2 : 0.45; }
    else { for (const s of [1, -1]) hands[s].p.set(s * 0.35, 0.3, 0.8); P.crouch += 0.3; P.lean += 0.5; }
  },
});

const ABILITIES = {
  blade: { name: 'Arm Blades', cd: 22, start(f) { if (f.state !== 'idle' && f.state !== 'punch') return false; f.bladeT = 10; SFX.clank(1.2); SFX.hiss(1); for (const s of [1, -1]) FX.spark((s > 0 ? f.rig.fistL : f.rig.fistR).getWorldPosition(V3()), V3(0, 1, 0), 20, 4, [2.4, 3, 4.5]); Popups.show('BLADES OUT', f.headW.clone().add(V3(0, 0.6, 0)), 'b'); } },
  wrecking: { name: 'Wrecking Ball', cd: 14, start: (f, o) => startAb(f, superPunch({ name: 'Wrecking Ball', charge: 0.7, color: [4, 3.2, 1.4], dmg: 230, knock: 11 }), o) },
  plasma: { name: 'Plasma Fist', cd: 13, start: (f, o) => startAb(f, superPunch({ name: 'Plasma Fist', charge: 0.5, color: [4.5, 1.2, 2.4], dmg: 205, knock: 10 }), o) },
  quake: { name: 'Quake Slam', cd: 12, start: (f, o) => startAb(f, slam({ name: 'Quake Slam', jump: 3.4, radius: 4.0, dmg: 125, launch: 6 }), o) },
  pound: { name: 'Ground Pound', cd: 11, start: (f, o) => startAb(f, slam({ name: 'Ground Pound', jump: 2.4, radius: 4.6, dmg: 110, launch: 5.5 }), o) },
  boulder: { name: 'Boulder Rip', cd: 10, start: (f, o) => f.held ? false : startAb(f, rip(), o) },
  nitro: { name: 'Nitro Rush', cd: 9, start: (f, o) => startAb(f, rush({ name: 'Nitro Rush', dur: 0.8, speed: 3.4, hits: 3, dmg: 46, knock: 7, flame: true }), o) },
  ram: { name: 'Battering Ram', cd: 11, start: (f, o) => startAb(f, rush({ name: 'Battering Ram', dur: 0.95, speed: 2.8, hits: 1, dmg: 150, knock: 10, head: true }), o) },
  rend: { name: 'Rend', cd: 10, start: (f, o) => startAb(f, rush({ name: 'Rend', dur: 0.85, speed: 1.7, hits: 6, dmg: 30, knock: 6, claws: true }), o) },
  harpoon: { name: 'Harpoon Claw', cd: 10, start: (f, o) => (o && !o.isDown) ? startAb(f, harpoon(), o) : false },
  pounce: { name: 'Pounce', cd: 12, start: (f, o) => (o && !o.isDown) ? startAb(f, pounce(), o) : false },
  clones: {
    name: 'Shadow Clones', cd: 20, start(f) {
      if (f.isDown) return false;
      f.clones.forEach(c => { c.R.root.removeFromParent(); c.R.dispose(); }); f.clones = [];
      for (const side of [1, -1]) {
        const R = buildRobot(f.def, { ghost: true }); R.root.scale.setScalar(f.S); scene.add(R.root);
        f.clones.push({ R, side, pos: f.pos.clone(), a: 0, dying: false });
      }
      f.cloneT = 7; SFX.od(); FX.burst(f.chestW, [1.5, 2, 4.5], 3); Popups.show('SHADOW CLONES', f.headW.clone().add(V3(0, 0.6, 0)), 'b');
    },
  },
  phase: {
    name: 'Phase Step', cd: 8, start(f, o) {
      if (!o || o.isDown || f.state !== 'idle') return false;
      Game.afterimage(f);
      const ofw = o.forward(V3());
      const p = V3().copy(o.pos).addScaledVector(ofw, -(o.radius + f.radius + 0.25));
      const B = Arena.bound; p.x = clamp(p.x, B.x0 + 1, B.x1 - 1); p.z = clamp(p.z, B.z0 + 1, B.z1 - 1);
      for (let i = 0; i < 3; i++) Arena.collide(p, f.radius, 0, 2);
      FX.burst(f.chestW, [4, 1.4, 2.6], 2); f.place(p.x, p.z, Math.atan2(o.pos.x - p.x, o.pos.z - p.z));
      f.counterT = 1.4; SFX.whoosh(2); SFX.od(); Game.flash(0.15);
      setTimeout(() => FX.burst(f.chestW, [4, 1.4, 2.6], 2), 30);
    },
  },
  dome: {
    name: 'Blast Dome', cd: 18, start(f) {
      if (f.isDown) return false;
      f.fortT = 6;
      if (!f.shield) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(1.15, 32, 20), new THREE.ShaderMaterial({
          uniforms: { uC: { value: new THREE.Color(0x6ab8ff) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
          vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 wp=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
          fragmentShader: `uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.0-abs(dot(vN,vV)),2.5); gl_FragColor=vec4(uC*(f*1.8+0.05),1.0); }`,
        }));
        m.position.y = f.def.dims.hipH + 0.4; m.userData.noAO = true; f.rig.root.add(m); f.shield = m;
      }
      SFX.od(); Popups.show('BLAST DOME', f.headW.clone().add(V3(0, 0.6, 0)), 'b');
    },
  },
  missiles: {
    name: 'Missile Salvo', cd: 12, start(f, o) {
      if (!o || f.isDown) return false;
      for (let i = 0; i < 8; i++) Game.missiles.push({ f, o, delay: i * 0.09, t: 0, side: i % 2 ? 1 : -1, live: false });
      SFX.clank(1); Popups.show('MISSILES', f.headW.clone().add(V3(0, 0.6, 0)), 'y');
    },
  },
};
// projectile missiles (owned by Game so they outlive the ability)
function updateMissiles(dt) {
  for (let i = Game.missiles.length - 1; i >= 0; i--) {
    const m = Game.missiles[i];
    if (!m.live) {
      m.delay -= dt; if (m.delay > 0) continue;
      m.live = true; m.p = m.f.rig.chest.localToWorld(V3(m.side * 0.5, 0.55, -0.1)); m.v = V3(m.side * 2, 6, 0).applyAxisAngle(V3(0, 1, 0), m.f.yaw).multiplyScalar(m.f.S);
      m.mesh = new THREE.Mesh(G.cyl(0.04, 0.04, 0.26, 6), basicGlow(0xffd0a0, 3)); m.mesh.userData.noAO = true; scene.add(m.mesh); SFX.whoosh(0.6);
    }
    m.t += dt;
    const tgt = m.o.rag ? m.o.rag.pos('chest') : m.o.chestW;
    const want = _a1.subVectors(tgt, m.p).normalize().multiplyScalar(15);
    m.v.lerp(want, 1 - Math.exp(-(m.t < 0.3 ? 1 : 4.5) * dt));
    m.p.addScaledVector(m.v, dt); m.mesh.position.copy(m.p); m.mesh.lookAt(_a2.copy(m.p).add(m.v)); m.mesh.rotateX(Math.PI / 2);
    FX.smoke.emit(m.p.x, m.p.y, m.p.z, rand(-.1, .1), rand(0, .2), rand(-.1, .1), 1.2, 0.12, 0.6, 0.7, 0.7, 0.72, 0.5, -0.1, 1);
    FX.glow.emit(m.p.x, m.p.y, m.p.z, 0, 0, 0, 0.06, 0.18, 0.05, 4, 2.4, 1, 1);
    let boom = false;
    if (tgt.distanceTo(m.p) < 0.55 * m.o.S) { boom = true; if (!m.o.isDown) abilityDamage(m.f, m.o, 26, _a3.copy(m.v).setY(0).normalize().clone(), { knock: 1.2, blockable: true, tags: [] }); }
    else if (m.p.y < Arena.groundAt(m.p.x, m.p.z) + 0.05 || Arena.collide(_a3.copy(m.p), 0.1, m.p.y - 0.1, m.p.y + 0.1) || m.t > 3) { boom = true; Arena.impact(m.p.clone(), 0.55, 4, m.v.clone().normalize()); }
    if (boom) { FX.explode(m.p.clone(), 0.55); SFX.boom(0.5); Game.shake(0.15); m.mesh.removeFromParent(); Game.missiles.splice(i, 1); }
  }
}
