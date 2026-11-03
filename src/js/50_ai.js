// ============================================================================
// AI opponent
// ============================================================================
const DIFF = {
  rookie: { name: 'Rookie', react: 0.42, block: 0.22, dodge: 0.05, aggr: 0.5, combo: 0.4, punish: 0.2, cd: [0.8, 1.6], od: 0.3, body: 0.7, rise: [0.8, 0.45] },
  contender: { name: 'Contender', react: 0.27, block: 0.45, dodge: 0.14, aggr: 0.72, combo: 0.65, punish: 0.5, cd: [0.45, 1.05], od: 0.7, body: 1, rise: [0.92, 0.62] },
  champion: { name: 'Champion', react: 0.16, block: 0.6, dodge: 0.24, aggr: 0.88, combo: 0.85, punish: 0.85, cd: [0.25, 0.65], od: 1, body: 1.1, rise: [0.98, 0.78] },
};

class AI {
  constructor(f, o, diff, mode = 'fight') {
    this.f = f; this.o = o; this.D = DIFF[diff]; this.P = f.def.persona; this.mode = mode;
    this.t = 0; this.next = rand(0.8, 1.6); this.queue = []; this.blockUntil = 0; this.seen = -1; this.pending = null;
    this.strafe = pick([-1, 1]); this.strafeT = rand(1, 3); this.retreatT = 0;
  }
  think(dt) {
    const f = this.f, o = this.o, D = this.D, P = this.P; this.t += dt;
    const it = { mx: 0, mz: 0, block: false, punch: null, dodge: 0, od: false };
    if (f.isDown || o.isDown) return it;
    const dist = Math.hypot(f.pos.x - o.pos.x, f.pos.z - o.pos.z);
    if (this.mode === 'idle' || this.mode === 'block') {
      it.mz = clamp((dist - 1.35) * 1.5, -1, 1) * 0.5; it.block = this.mode === 'block'; this.strafeT -= dt;
      if (this.strafeT <= 0) { this.strafe = pick([-1, 0, 1]); this.strafeT = rand(1.5, 3); } it.mx = this.strafe * 0.3;
      return it;
    }
    // read the opponent's punch, react after a human-ish delay
    if (o.state === 'punch' && o.punchId !== this.seen && o.moveT < o.impactT) { this.seen = o.punchId; this.pending = { at: this.t + D.react * rand(0.75, 1.3), id: o.punchId }; }
    if (this.pending && this.t >= this.pending.at) {
      const pd = this.pending; this.pending = null;
      if (o.state === 'punch' && o.punchId === pd.id && o.moveT < o.impactT && dist < o.reach + 0.4) {
        const r = Math.random(), tired = f.stam < f.stamMax * 0.25;
        const bp = D.block * (tired ? 1.3 : 1) * (o.move.power > 0.8 ? 1.15 : 0.85);
        if (r < D.dodge && f.stam > 10) it.dodge = pick([-1, 1]);
        else if (r < D.dodge + bp) this.blockUntil = this.t + 0.3 + rand(0, 0.25);
        else if (P.counter && Math.random() < D.punish * 0.6 && f.state === 'idle') it.punch = 'jab';
      }
    }
    if (this.t < this.blockUntil) it.block = true;
    // punish whiffed power shots
    if (o.state === 'punch' && o.moveT > o.impactT && o.move.power > 0.8 && !this.queue.length && dist < f.reach + 0.1 && Math.random() < D.punish * dt * 10) { this.queue = Math.random() < 0.5 ? ['cross', 'hook'] : ['hook', 'upper']; this.blockUntil = 0; }
    if (o.state === 'stagger' && !this.queue.length && dist < f.reach + 0.2) { this.queue = ['cross', 'hook', 'upper']; this.blockUntil = 0; }
    if (o.state === 'dazed' && !this.queue.length && dist < f.reach + 0.2) { this.queue = pick([['hook', 'upper', 'cross'], ['cross', 'hook', 'upper'], ['body:hook', 'upper', 'hook']]); this.blockUntil = 0; }
    // spacing and footwork
    const tired = f.stam < f.stamMax * 0.3;
    let want = f.reach * P.range * 0.84;
    if ((tired || f.hp < f.maxHp * 0.25) && this.t > this.retreatT + 2 && Math.random() < dt * 0.8) this.retreatT = this.t + rand(0.8, 1.8);
    if (this.t < this.retreatT) want += 1.1;
    if (this.queue.length) want = f.reach * 0.72;
    it.mz = clamp((dist - want) * 2.4, -1, 1);
    this.strafeT -= dt; if (this.strafeT <= 0) { this.strafe = Math.random() < 0.25 ? 0 : pick([-1, 1]); this.strafeT = rand(0.8, 2.5); }
    const r = Math.hypot(f.pos.x, f.pos.z);
    if (r > RING_H - 1.1) { const lx = Math.cos(f.yaw), lz = -Math.sin(f.yaw); this.strafe = (lx * -f.pos.x + lz * -f.pos.z) > 0 ? 1 : -1; }
    it.mx = this.strafe * (this.queue.length ? 0.2 : 0.55);
    // offence
    if (!it.block) {
      if (this.queue.length && (f.state === 'idle' || (f.state === 'punch' && f.moveT > f.impactT))) it.punch = this.queue.shift();
      else if (!this.queue.length && this.t > this.next && f.state === 'idle' && dist < f.reach + 0.3) {
        if (Math.random() < D.aggr * P.aggr * (tired ? 0.5 : 1)) {
          let c = Math.random() < D.combo ? pick(P.combos).slice() : [pick(['jab', 'jab', 'cross', 'hook'])];
          if (Math.random() < P.body * D.body * 0.5) c = c.map(x => !x.startsWith('body:') && Math.random() < 0.4 ? 'body:' + x : x);
          this.queue = c;
        }
        this.next = this.t + rand(D.cd[0], D.cd[1]) * (tired ? 1.6 : 1);
      }
    }
    if (f.od >= 100 && f.odT <= 0 && dist < f.reach + 0.5 && Math.random() < D.od * dt * 0.6) it.od = true;
    return it;
  }
}
