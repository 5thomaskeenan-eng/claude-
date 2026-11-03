// ============================================================================
// AI opponent: spacing, reactions, combos, grabs, abilities, props
// ============================================================================
const DIFF = {
  rookie: { name: 'Rookie', react: 0.42, block: 0.22, dodge: 0.05, aggr: 0.5, combo: 0.4, punish: 0.2, cd: [0.8, 1.6], ab: 0.25, mash: 5, body: 0.7, rise: [0.8, 0.45], grab: 0.08 },
  contender: { name: 'Contender', react: 0.27, block: 0.45, dodge: 0.14, aggr: 0.72, combo: 0.65, punish: 0.5, cd: [0.45, 1.05], ab: 0.55, mash: 8, body: 1, rise: [0.92, 0.62], grab: 0.14 },
  champion: { name: 'Champion', react: 0.16, block: 0.6, dodge: 0.24, aggr: 0.88, combo: 0.85, punish: 0.85, cd: [0.25, 0.65], ab: 0.9, mash: 11, body: 1.1, rise: [0.98, 0.78], grab: 0.2 },
};

class AI {
  constructor(f, o, diff, mode = 'fight') {
    this.f = f; this.o = o; this.D = DIFF[diff]; this.P = f.def.persona; this.mode = mode;
    this.t = 0; this.next = rand(0.8, 1.6); this.queue = []; this.blockUntil = 0; this.seen = -1; this.pending = null;
    this.strafe = pick([-1, 1]); this.strafeT = rand(1, 3); this.retreatT = 0; this.abT = rand(2, 5); this.oppBlock = 0; this.goal = null;
  }
  get mashRate() { return this.D.mash; }
  think(dt) {
    const f = this.f, o = this.o, D = this.D, P = this.P; this.t += dt;
    const it = { mx: 0, mz: 0, block: false, punch: null, dodge: 0, ab: null };
    if (f.isDown || o.isDown || f.state === 'grabbed' || f.state === 'clash') return it;
    const dist = Math.hypot(f.pos.x - o.pos.x, f.pos.z - o.pos.z);
    if (this.mode === 'idle' || this.mode === 'block') {
      it.mz = clamp((dist - f.reach * 0.9) * 1.5, -1, 1) * 0.5; it.block = this.mode === 'block'; this.strafeT -= dt;
      if (this.strafeT <= 0) { this.strafe = pick([-1, 0, 1]); this.strafeT = rand(1.5, 3); } it.mx = this.strafe * 0.3;
      return it;
    }
    if (f.state === 'grabbing') { if (f.knees < 2 && Math.random() < dt * 2.5) it.punch = 'jab'; else if (f.grabT > 0.9 && Math.random() < dt * 2) it.grab = true; return it; }
    this.oppBlock = damp(this.oppBlock, o.blocking ? 1 : 0, 0.8, dt);
    // read incoming attacks
    if (o.state === 'punch' && o.punchId !== this.seen && o.moveT < o.impactT && o.move.power) { this.seen = o.punchId; this.pending = { at: this.t + D.react * rand(0.75, 1.3), id: o.punchId }; }
    if (o.state === 'ability' && !this.abSeen) { this.abSeen = true; if (Math.random() < D.dodge * 2) it.dodge = pick([-1, 1]); else if (Math.random() < 0.3 + D.block * 0.5) it.jump = true; }
    if (o.state !== 'ability') this.abSeen = false;
    if (this.pending && this.t >= this.pending.at) {
      const pd = this.pending; this.pending = null;
      if (o.state === 'punch' && o.punchId === pd.id && o.moveT < o.impactT && dist < o.reach + 0.6) {
        const r = Math.random(), tired = f.stam < f.stamMax * 0.25;
        const bp = D.block * (tired ? 1.3 : 1) * (o.move.power > 0.8 ? 1.15 : 0.85);
        if (o.move.kind === 'grab') { if (r < D.dodge * 2) it.dodge = pick([-1, 1]); else if (r < 0.5) it.punch = 'jab'; }
        else if (r < D.dodge && f.stam > 10) it.dodge = pick([-1, 1]);
        else if (r < D.dodge + bp) this.blockUntil = this.t + 0.3 + rand(0, 0.25);
        else if (P.counter && Math.random() < D.punish * 0.6 && f.state === 'idle') it.punch = 'jab';
      }
    }
    if (this.t < this.blockUntil) it.block = true;
    // holding something: throw it or smash with it
    if (f.held) {
      if (f.state === 'idle') { if (dist < f.reach + 0.2) it.punch = 'jab'; else if (dist < 12 && Math.random() < dt * 3) it.grab = true; }
      it.mz = dist > 6 ? 0.6 : dist < 2 ? -0.3 : 0.2; return it;
    }
    // punish whiffs / dazed opponent
    if (o.state === 'punch' && o.moveT > o.impactT && o.move.power > 0.8 && !this.queue.length && dist < f.reach + 0.1 && Math.random() < D.punish * dt * 10) { this.queue = Math.random() < 0.5 ? ['cross', 'hook'] : ['hook', 'kick']; this.blockUntil = 0; }
    if ((o.state === 'stagger' || o.state === 'dazed') && !this.queue.length && dist < f.reach + 0.2) { this.queue = pick([['hook', 'upper', 'cross'], ['cross', 'hook', 'kick'], ['grab']]); this.blockUntil = 0; }
    // abilities
    this.abT -= dt;
    if (this.abT <= 0 && f.state === 'idle') {
      this.abT = rand(1.5, 4) / (0.5 + D.ab);
      const choice = this.pickAbility(dist);
      if (choice != null && Math.random() < D.ab) { it.ab = choice; return it; }
    }
    // pick something up when the fight drifts apart
    if (!this.queue.length && dist > 5.5 && Math.random() < dt * 0.6) {
      const q = Arena.nearestProp(f.pos, 3.2); if (q) this.goal = q;
    }
    if (this.goal) {
      if (this.goal.state !== 'rest' || dist < 2.5) this.goal = null;
      else {
        const g = this.goal.mesh.position, gx = g.x - f.pos.x, gz = g.z - f.pos.z, gd = Math.hypot(gx, gz);
        if (gd < f.reach * 0.9) { it.pick = true; this.goal = null; return it; }
        const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw), lx = Math.cos(f.yaw), lz = -Math.sin(f.yaw);
        it.mz = (gx * fx + gz * fz) / gd; it.mx = (gx * lx + gz * lz) / gd; return it;
      }
    }
    // spacing and footwork
    const tired = f.stam < f.stamMax * 0.3;
    let want = f.reach * P.range * 0.84;
    if ((tired || f.hp < f.maxHp * 0.25) && this.t > this.retreatT + 2 && Math.random() < dt * 0.8) this.retreatT = this.t + rand(0.8, 1.8);
    if (this.t < this.retreatT) want += 1.4 * f.S;
    if (this.queue.length) want = f.reach * 0.72;
    it.mz = clamp((dist - want) * 2.4, -1, 1);
    it.sprint = dist > 6 && !tired;
    this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = Math.random() < 0.25 ? 0 : pick([-1, 1]); this.strafeT = rand(0.8, 2.5); }
    const B = Arena.bound;
    if (f.pos.x < B.x0 + 2 || f.pos.x > B.x1 - 2 || f.pos.z < B.z0 + 2 || f.pos.z > B.z1 - 2) { const lx = Math.cos(f.yaw), lz = -Math.sin(f.yaw); this.strafe = (lx * -f.pos.x + lz * -f.pos.z) > 0 ? 1 : -1; }
    it.mx = this.strafe * (this.queue.length ? 0.2 : 0.55);
    // jump-in dive
    if (dist > 3 && dist < 5 && f.state === 'idle' && Math.random() < dt * 0.25 * D.aggr) { it.jump = true; this.queue = ['cross']; }
    // offence
    if (!it.block) {
      if (this.queue.length && (f.state === 'idle' || (f.state === 'punch' && f.moveT > f.impactT))) {
        const m = this.queue.shift();
        if (m === 'kick') it.kick = true; else if (m === 'grab') it.grab = true; else it.punch = m;
      } else if (!this.queue.length && this.t > this.next && f.state === 'idle' && dist < f.reach + 0.4) {
        if (Math.random() < D.grab * (1 + this.oppBlock * 3)) this.queue = ['grab'];
        else if (Math.random() < D.aggr * P.aggr * (tired ? 0.5 : 1)) {
          let c = Math.random() < D.combo ? pick(P.combos).slice() : [pick(['jab', 'jab', 'cross', 'hook', 'kick'])];
          if (Math.random() < 0.25) c.push('kick');
          this.queue = c;
        }
        this.next = this.t + rand(D.cd[0], D.cd[1]) * (tired ? 1.6 : 1);
      }
    }
    return it;
  }
  pickAbility(dist) {
    const f = this.f, o = this.o, opts = [];
    f.abil.forEach((a, i) => {
      if (a.cd > 0) return;
      switch (a.id) {
        case 'wrecking': case 'plasma': case 'ram': case 'nitro': case 'rend': if (dist < 4.5 && dist > f.reach * 0.6) opts.push(i); break;
        case 'quake': case 'pound': if (dist < 3.5 * f.S) opts.push(i); break;
        case 'pounce': case 'harpoon': if (dist > 3 && dist < 11) opts.push(i); break;
        case 'missiles': if (dist > 3) opts.push(i); break;
        case 'boulder': if (dist > 4 && !f.held) opts.push(i); break;
        case 'phase': if (dist < 6) opts.push(i); break;
        case 'dome': if (f.hp < f.maxHp * 0.6) opts.push(i); break;
        case 'clones': case 'blade': opts.push(i); break;
      }
    });
    return opts.length ? pick(opts) : null;
  }
}
