// ============================================================================
// INPUT: keyboard, mouse, gamepad, touch
// ============================================================================
const Input = {
  keys: new Set(), edge: new Set(), pad: null, padPrev: [], padEdge: new Set(), stick: { x: 0, y: 0 }, tHeld: new Set(), tEdge: new Set(), bodyToggle: false, rsPrev: 0, slipAlt: 1,
  init() {
    const gameKeys = new Set(['Space', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyQ', 'KeyE', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
    addEventListener('keydown', e => {
      unlockAudio();
      if (!e.repeat) this.edge.add(e.code);
      this.keys.add(e.code);
      if (Game.mode === 'fight' && gameKeys.has(e.code)) e.preventDefault();
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) Game.togglePause();
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); if (Game.mode === 'fight' && !Game.paused) Game.togglePause(true); });
    const cv = renderer.domElement;
    cv.addEventListener('mousedown', e => { unlockAudio(); if (Game.mode === 'fight') { this.edge.add('Mouse' + e.button); e.preventDefault(); } });
    cv.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('pointerdown', unlockAudio, { once: false });
    // touch stick
    const st = $('stick'), knob = st.querySelector('i'); let sid = null, cx = 0, cy = 0;
    st.addEventListener('pointerdown', e => { sid = e.pointerId; st.setPointerCapture(sid); const r = st.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
    const move = e => { if (e.pointerId !== sid) return; let dx = (e.clientX - cx) / 55, dy = (e.clientY - cy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } this.stick.x = dx; this.stick.y = dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; };
    st.addEventListener('pointermove', move);
    const end = e => { if (e.pointerId !== sid) return; sid = null; this.stick.x = this.stick.y = 0; knob.style.transform = ''; };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    $('tbtns').querySelectorAll('button').forEach(b => {
      const t = b.dataset.t;
      b.addEventListener('pointerdown', e => { e.preventDefault(); unlockAudio(); if (t === 'pause') { Game.togglePause(); return; } if (t === 'body') { this.bodyToggle = !this.bodyToggle; b.classList.toggle('on', this.bodyToggle); return; } this.tHeld.add(t); this.tEdge.add(t); });
      const up = () => this.tHeld.delete(t); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });
  },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; let p = null;
    for (const g of pads) if (g && g.connected) { p = g; break; }
    this.pad = p; this.padEdge.clear(); if (!p) return;
    p.buttons.forEach((b, i) => { const v = b.pressed || b.value > 0.5; if (v && !this.padPrev[i]) { this.padEdge.add(i); unlockAudio(); } this.padPrev[i] = v; });
    if (this.padEdge.has(9)) Game.togglePause();
  },
  b(i) { return !!(this.pad && this.pad.buttons[i] && (this.pad.buttons[i].pressed || this.pad.buttons[i].value > 0.4)); },
  ax(i) { const v = this.pad ? (this.pad.axes[i] || 0) : 0; return Math.abs(v) < 0.18 ? 0 : v; },
  anyPunch() { return ['KeyJ', 'KeyK', 'KeyL', 'KeyI', 'Mouse0', 'Mouse2', 'Space'].some(k => this.edge.has(k)) || [0, 1, 2, 3].some(i => this.padEdge.has(i)) || ['jab', 'cross', 'hook', 'upper'].some(t => this.tEdge.has(t)); },
  playerIntent() {
    const K = c => this.keys.has(c), E = c => this.edge.has(c), T = t => this.tEdge.has(t);
    let mx = (K('KeyA') || K('ArrowLeft') ? 1 : 0) - (K('KeyD') || K('ArrowRight') ? 1 : 0) - this.ax(0) - this.stick.x;
    let mz = (K('KeyW') || K('ArrowUp') ? 1 : 0) - (K('KeyS') || K('ArrowDown') ? 1 : 0) - this.ax(1) - this.stick.y;
    const body = K('ShiftLeft') || K('ShiftRight') || (this.pad && this.pad.buttons[6] && this.pad.buttons[6].value > 0.4) || this.bodyToggle;
    let punch = null;
    if (E('KeyJ') || E('Mouse0') || this.padEdge.has(2) || T('jab')) punch = 'jab';
    else if (E('KeyK') || E('Mouse2') || this.padEdge.has(3) || T('cross')) punch = 'cross';
    else if (E('KeyL') || this.padEdge.has(1) || T('hook')) punch = 'hook';
    else if (E('KeyI') || this.padEdge.has(0) || T('upper')) punch = 'upper';
    if (punch && body) punch = 'body:' + punch;
    const block = K('Space') || this.b(5) || this.b(7) || this.tHeld.has('block');
    let dodge = 0;
    if (E('KeyQ')) dodge = 1; else if (E('KeyE')) dodge = -1;
    if (this.padEdge.has(4)) dodge = this.ax(0) > 0.3 ? -1 : this.ax(0) < -0.3 ? 1 : (this.slipAlt = -this.slipAlt);
    const rs = this.ax(2); if (Math.abs(rs) > 0.7 && Math.abs(this.rsPrev) <= 0.7) dodge = rs > 0 ? -1 : 1; this.rsPrev = rs;
    if (T('dodge')) dodge = mx > 0.3 ? 1 : mx < -0.3 ? -1 : (this.slipAlt = -this.slipAlt);
    const od = E('KeyF') || this.padEdge.has(11) || this.padEdge.has(12) || T('od');
    if (E('KeyC') || this.padEdge.has(8)) { settings.cam = settings.cam === 'shoulder' ? 'broadcast' : 'shoulder'; saveSettings(); Game.toast(settings.cam === 'shoulder' ? 'SHOULDER CAM' : 'BROADCAST CAM'); }
    return { mx: clamp(mx, -1, 1), mz: clamp(mz, -1, 1), block, punch, dodge, od };
  },
  endFrame() { this.edge.clear(); this.tEdge.clear(); },
};
function unlockAudio() { if (!SFX.ready) { SFX.init(); Music.start(); } else if (SFX.ctx.state === 'suspended') SFX.ctx.resume(); }

// ============================================================================
// CAMERA
// ============================================================================
const _c1 = V3(), _c2 = V3(), _c3 = V3(), _c4 = V3();
const Cam = {
  mode: 'menu', pos: V3(0, 4, 9), look: V3(0, 2, 0), trauma: 0, fovKick: 0, t: 0, k: 3, menuDist: 5.4,
  shake(a) { if (settings.shake) this.trauma = Math.min(1, this.trauma + a); },
  set(mode, k = 3) { this.mode = mode; this.k = k; this.mt = 0; },
  update(rdt) {
    this.t += rdt; this.mt = (this.mt || 0) + rdt;
    const tp = _c1, tl = _c2, up = RING_Y;
    const [a, b] = Game.f || [];
    if (this.mode === 'menu' || this.mode === 'setup') {
      const f = Game.showcase; const c = f ? f.pos : _c3.set(0, 0, 0);
      const ang = this.t * 0.11 + 0.6; const dist = this.mode === 'setup' ? 9.5 : this.menuDist;
      tp.set(c.x + Math.sin(ang) * dist, up + (this.mode === 'setup' ? 3.4 : 1.9), c.z + Math.cos(ang) * dist);
      tl.set(c.x, up + 1.45, c.z);
      if (innerWidth > 640) { const dir = _c4.subVectors(tl, tp).normalize(); const right = _c3.set(-dir.z, 0, dir.x); tl.addScaledVector(right, -(this.mode === 'setup' ? 2.6 : 1.35)); }
      else tl.y -= 0.75;
    } else if (this.mode === 'intro') {
      const m = _c3.addVectors(a.pos, b.pos).multiplyScalar(0.5); const k = clamp(this.mt / 4.2, 0, 1);
      const ang = -2.2 + k * 2.0; const r = lerp(6.2, 4.8, easeOut(k));
      tp.set(m.x + Math.sin(ang) * r, up + lerp(2.5, 2.3, k), m.z + Math.cos(ang) * r);
      tl.set(m.x, up + lerp(1.9, 1.4, k), m.z);
    } else if (this.mode === 'fight' || this.mode === 'down') {
      const p1 = a.rag && this.mode === 'down' ? a.ragPos() : a.pos, p2 = b.rag && this.mode === 'down' ? b.ragPos() : b.pos;
      const dir = _c3.subVectors(p1, p2); dir.y = 0; const sep = dir.length() || 1; dir.divideScalar(sep);
      const perp = _c4.set(dir.z, 0, -dir.x);
      if (this.mode === 'down') {
        const v = Game.victim, vp = v.ragPos(); const ang = this.mt * 0.25 + Math.atan2(dir.x, dir.z) + 0.9;
        tp.set(vp.x + Math.sin(ang) * 4.2, up + 1.5, vp.z + Math.cos(ang) * 4.2); tl.set(vp.x, up + 0.6, vp.z);
      } else if (settings.cam === 'broadcast') {
        const m = _c2.addVectors(p1, p2).multiplyScalar(0.5);
        let s = Math.sign((this.pos.x - m.x) * perp.x + (this.pos.z - m.z) * perp.z) || 1;
        tp.set(m.x + perp.x * s * (5.0 + sep * 0.7), up + 2.3, m.z + perp.z * s * (5.0 + sep * 0.7));
        tl.set(m.x, up + 1.45, m.z);
      } else {
        const back = 3.9 + sep * 0.45;
        tp.set(p1.x + dir.x * back + perp.x * 1.7, up + 2.75, p1.z + dir.z * back + perp.z * 1.7);
        tl.set(lerp(p1.x, p2.x, 0.66), up + 1.35, lerp(p1.z, p2.z, 0.66));
      }
    } else if (this.mode === 'ko') {
      const v = Game.victim, w = Game.winner; const vp = v.ragPos();
      const m = _c3.lerpVectors(vp, w.pos, 0.4); const ang = this.mt * 0.18 + 2;
      tp.set(m.x + Math.sin(ang) * 5.5, up + 1.3 + this.mt * 0.06, m.z + Math.cos(ang) * 5.5); tl.set(m.x, up + 1.0, m.z);
    } else if (this.mode === 'fixed') {
      tp.copy(this.fixedPos); tl.copy(this.fixedLook);
    } else if (this.mode === 'corner') {
      const m = _c3.addVectors(a.pos, b.pos).multiplyScalar(0.5);
      tp.set(m.x + 7, up + 3.6, m.z - 7.5); tl.set(m.x, up + 1.2, m.z);
    }
    // keep the camera inside the venue and out of the stands
    const r = Math.hypot(tp.x, tp.z), maxR = 8.6; if (r > maxR) { tp.x *= maxR / r; tp.z *= maxR / r; }
    const f = 1 - Math.exp(-this.k * rdt);
    this.pos.lerp(tp, f); this.look.lerp(tl, f);
    this.trauma = Math.max(0, this.trauma - rdt * 1.5); this.fovKick = damp(this.fovKick, 0, 5, rdt);
    const s = this.trauma * this.trauma, T = this.t * 40;
    camera.position.set(this.pos.x + Math.sin(T * 1.1) * s * 0.22, this.pos.y + Math.sin(T * 1.7 + 2) * s * 0.18, this.pos.z + Math.sin(T * 1.3 + 4) * s * 0.22);
    camera.lookAt(this.look);
    camera.rotateZ(Math.sin(T * 0.9) * s * 0.035);
    const baseFov = innerWidth < innerHeight ? 62 : 48;
    camera.fov = baseFov + this.fovKick; camera.updateProjectionMatrix();
  },
};

// ============================================================================
// HUD
// ============================================================================
const HUD = {
  init() {
    this.el = {}; ['hud', 'hp1', 'hp2', 'chip1', 'chip2', 'st1', 'st2', 'n1', 'n2', 'kd1', 'kd2', 'time', 'rnd', 'combo', 'announce', 'getup', 'getupbar', 'od1', 'od2', 'odw1', 'odw2', 'dg1', 'dg2', 'hint', 'train', 'vign'].forEach(k => this.el[k] = $(k));
    this.last = {};
    this.el.hint.innerHTML = IS_TOUCH ? '' : '<kbd>J</kbd>jab <kbd>K</kbd>cross <kbd>L</kbd>hook <kbd>I</kbd>upper · <kbd>Shift</kbd>body · <kbd>Space</kbd>block · <kbd>Q</kbd><kbd>E</kbd>slip · <kbd>F</kbd>overdrive · <kbd>C</kbd>camera';
    $('pauseBtn').addEventListener('click', () => Game.togglePause());
  },
  setNames(a, b) { this.el.n1.textContent = a; this.el.n2.textContent = b; },
  bar(el, v, key) { const k = Math.round(v * 400); if (this.last[key] === k) return; this.last[key] = k; el.style.transform = `scaleX(${clamp(v, 0, 1)})`; },
  update() {
    const [a, b] = Game.f; const e = this.el;
    this.bar(e.hp1, a.hp / a.maxHp, 'hp1'); this.bar(e.hp2, b.hp / b.maxHp, 'hp2');
    this.bar(e.chip1, a.hpChip / a.maxHp, 'c1'); this.bar(e.chip2, b.hpChip / b.maxHp, 'c2');
    this.bar(e.st1, a.stam / a.stamMax, 's1'); this.bar(e.st2, b.stam / b.stamMax, 's2');
    e.hp1.classList.toggle('low', a.hp < a.maxHp * 0.25); e.hp2.classList.toggle('low', b.hp < b.maxHp * 0.25);
    e.st1.classList.toggle('tired', a.stam < a.stamMax * 0.2); e.st2.classList.toggle('tired', b.stam < b.stamMax * 0.2);
    [[a, e.od1, e.odw1, 'o1'], [b, e.od2, e.odw2, 'o2']].forEach(([f, bar, w, key]) => {
      const v = f.odT > 0 ? f.odT / 6.5 : f.od / 100; const k = Math.round(v * 100);
      if (this.last[key] !== k) { this.last[key] = k; bar.querySelectorAll('b').forEach((x, i) => x.style.transform = `scaleX(${clamp(v * 4 - i, 0, 1)})`); }
      w.classList.toggle('ready', f.od >= 100 && f.odT <= 0); w.classList.toggle('active', f.odT > 0);
    });
    const tt = Game.training ? '∞' : String(Math.max(0, Math.ceil(Game.clock)));
    if (this.last.t !== tt) { this.last.t = tt; e.time.textContent = tt; }
    const rr = Game.training ? 'TRAINING' : `RD ${Game.round}/${Game.rounds}`; if (this.last.r !== rr) { this.last.r = rr; e.rnd.textContent = rr; }
    [[a, e.kd1, 'k1'], [b, e.kd2, 'k2']].forEach(([f, el, key]) => { if (this.last[key] !== f.kd) { this.last[key] = f.kd; el.querySelectorAll('i').forEach((x, i) => x.classList.toggle('on', i < f.kd)); } });
    if (Game.frameN % 6 === 0) { this.diag(e.dg1, a); this.diag(e.dg2, b); }
    const c = a.combo >= 2 && a.comboT > 0 ? a.combo : 0;
    if (this.last.cb !== c) { this.last.cb = c; e.combo.classList.toggle('on', c > 0); if (c) e.combo.innerHTML = `${c}<small>HIT COMBO</small>`; }
    const danger = a.hp < a.maxHp * 0.25 && !a.isDown ? 0.45 + Math.sin(Game.time * 6) * 0.15 : 0;
    gradePass.uniforms.uRed.value = damp(gradePass.uniforms.uRed.value, danger, 4, 1 / 60);
  },
  diag(el, f) {
    const p = f.parts, cls = v => v > 50 ? '' : v > 25 ? 'w' : 'c';
    el.innerHTML = `HEAD<em class="${cls(p.head)}">${Math.round(p.head)}</em> CORE<em class="${cls(p.core)}">${Math.round(p.core)}</em> L-ARM<em class="${cls(p.armL)}">${Math.round(p.armL)}</em> R-ARM<em class="${cls(p.armR)}">${Math.round(p.armR)}</em>`;
  },
  announce(html, hold = false) {
    const el = this.el.announce; el.innerHTML = html; el.classList.remove('show', 'hold'); void el.offsetWidth; el.classList.add(hold ? 'hold' : 'show');
  },
  clearAnnounce() { const el = this.el.announce; el.classList.remove('show', 'hold'); el.innerHTML = ''; },
};

// ============================================================================
// GAME FLOW
// ============================================================================
const LADDER_ORDER = ['spectra', 'torque', 'belljar', 'onyx', 'warden', 'mire', 'bulwark'];
const LADDER_DIFF = ['rookie', 'rookie', 'contender', 'contender', 'champion'];
const LADDER_ARENA = ['tanker', 'carnival', 'foundry', 'tanker', 'reactor'];

const Game = {
  mode: 'menu', f: null, showcase: null, time: 0, frameN: 0, paused: false, excite: 0.1, hitstopT: 0, slowT: 0, timeScale: 1, round: 1, rounds: 3, clock: 90, training: false,
  setShowcase(id) {
    if (this.showcase && this.showcase.def.id === id) return;
    if (this.showcase) this.showcase.dispose();
    this.showcase = new Fighter(ROBOT(id), 0); this.showcase.place(0, 0, 0.4);
    setEnvIntensity(this.showcase.rig, 1);
  },
  clearFight() {
    if (this.f) this.f.forEach(f => f.dispose());
    this.f = null; FX.clear(); Popups.clear(); HUD.clearAnnounce();
  },
  startFight(cfg) {
    this.cfg = cfg; this.clearFight();
    if (this.showcase) { this.showcase.dispose(); this.showcase = null; }
    // fresh venue each fight: clean canvas, no debris from the last bout
    Arena.dispose(); Arena.load(cfg.arena);
    const a = new Fighter(ROBOT(cfg.p1), 0), b = new Fighter(ROBOT(cfg.p2), 1);
    this.f = [a, b];
    this.training = !!cfg.training;
    this.ai = new AI(b, a, cfg.diff || 'contender', this.training ? 'idle' : 'fight');
    this.rounds = cfg.rounds || 3; this.round = 1; this.roundLen = 90;
    this.mode = 'fight'; this.paused = false; this.hitstopT = 0; this.slowT = 0; this.excite = 0.2; this.time = 0;
    HUD.setNames(a.def.name.toUpperCase(), b.def.name.toUpperCase());
    UI.hideAll(); $('hud').hidden = false; $('touch').hidden = !IS_TOUCH; $('train').hidden = !this.training;
    $('getup').hidden = true; $('hint').hidden = false; $('hint').classList.remove('off'); clearTimeout(this._hintT); this._hintT = setTimeout(() => $('hint').classList.add('off'), 15000);
    this.resetPositions();
    Music.mode = 'fight';
    if (this.training) { this.phase = 'fight'; Cam.set('fight', 3); this.clock = 0; HUD.announce('SPAR<small>1 idle · 2 block · 3 fight back</small>'); this.trainInfo(); }
    else {
      this.phase = 'intro'; this.phaseT = 0; Cam.set('intro', 2.5); Cam.pos.set(0, RING_Y + 1, 9);
      HUD.announce(`${a.def.name}<small>VS</small>${b.def.name}`, true);
      const ar = ARENAS.find(x => x.id === cfg.arena);
      speak(`Live from ${ar.bell}. ${a.def.name}, versus, ${b.def.name}!`, 1.0);
      SFX.cheer(1.2);
    }
  },
  resetPositions() {
    const [a, b] = this.f;
    a.place(0, -1.7, 0); b.place(0, 1.7, Math.PI);
    for (const f of this.f) { f.setState('idle'); f.blocking = false; }
  },
  frame(rdt) {
    this.time += rdt; this.frameN++;
    let dt = rdt;
    if (this.mode === 'fight') dt = this.paused ? 0 : this.updateFight(rdt);
    else if (this.mode === 'results' && this.f) { const [a, b] = this.f; a.update(rdt, b, {}); b.update(rdt, a, {}); a.animate(rdt, b); b.animate(rdt, a); }
    else this.updateMenu(rdt);
    FX.update(dt); Debris.update(dt);
    Arena.update(dt, this.time, this.excite, this.f || (this.showcase ? [this.showcase] : []));
    Cam.update(this.paused ? 0 : rdt);
    if (this.mode === 'fight') HUD.update();
    const g = gradePass.uniforms; g.uTime.value = this.time;
    g.uFlash.value = damp(g.uFlash.value, 0, 10, rdt);
    g.uAberr.value = damp(g.uAberr.value, 0.0015, 6, rdt);
    g.uDesat.value = damp(g.uDesat.value, this.slowT > 0 ? 0.35 : 0, 4, rdt);
    if (this.mode === 'fight' && this.f) { SFX.servo(0, this.f[0].speedNow); SFX.servo(1, this.f[1].speedNow); } else if (SFX.ready) { SFX.servo(0, 0); SFX.servo(1, 0); }
    SFX.crowd(this.mode === 'fight' ? 0.1 + this.excite * 0.35 : 0.05);
    if (!window.__ironvoltNoRender) composer.render(rdt);
  },
  updateMenu(rdt) {
    const f = this.showcase; if (!f) return;
    f.update(rdt, null, { mx: 0, mz: 0 }); f.yaw = 0.4 + Math.sin(this.time * 0.3) * 0.25;
    f.animate(rdt, null);
    this.excite = damp(this.excite, 0.15, 1, rdt);
  },
  updateFight(rdt) {
    if (this.hitstopT > 0) this.hitstopT -= rdt;
    if (this.slowT > 0) this.slowT -= rdt;
    this.timeScale = damp(this.timeScale, this.slowT > 0 ? 0.28 : 1, 8, rdt);
    const dt = rdt * (this.hitstopT > 0 ? 0.05 : this.timeScale);
    this.phaseT = (this.phaseT || 0) + rdt;
    const [a, b] = this.f;
    let ia = { mx: 0, mz: 0 }, ib = { mx: 0, mz: 0 };
    switch (this.phase) {
      case 'intro':
        if (this.phaseT > 4.4 || (this.phaseT > 0.8 && Input.anyPunch())) this.beginRound(); break;
      case 'roundStart':
        if (this.phaseT > 1.9 && !this.bellRung) { this.bellRung = true; SFX.bell(1); HUD.announce('FIGHT!'); speak('Fight!', 1.1); this.phase = 'fight'; this.phaseT = 0; Cam.set('fight', 3.5); }
        break;
      case 'fight':
        ia = Input.playerIntent(); ib = this.ai.think(dt);
        if (!this.training) { this.clock -= dt; if (this.clock <= 0) { this.clock = 0; this.endRound(); } }
        else this.trainingTick();
        break;
      case 'knockdown': this.knockdownTick(rdt, dt); ia = this.autoIntent(a); ib = this.autoIntent(b); break;
      case 'roundEnd': ia = this.autoIntent(a, true); ib = this.autoIntent(b, true); if (this.phaseT > 2.4) { if (this.round >= this.rounds) this.decision(); else this.betweenRounds(); } break;
      case 'between': if (this.phaseT > 3.2 || (this.phaseT > 1 && Input.anyPunch())) this.beginRound(); break;
      case 'ko': if (this.phaseT > 5.5 || (this.phaseT > 2.5 && Input.anyPunch())) this.showResults(); break;
      case 'decision': if (this.phaseT > 4.5 || (this.phaseT > 2 && Input.anyPunch())) this.showResults(); break;
    }
    a.update(dt, b, ia); b.update(dt, a, ib);
    this.constrain();
    a.animate(dt, b); b.animate(dt, a);
    this.excite = damp(this.excite, 0.18, 0.5, rdt);
    return dt;
  },
  constrain() {
    const [a, b] = this.f;
    const sa = !a.rag, sb = !b.rag;
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1e-3;
    if (sa && sb) {
      const min = a.radius + b.radius;
      if (d < min) { const push = (min - d) / 2, nx = dx / d, nz = dz / d; a.pos.x -= nx * push; a.pos.z -= nz * push; b.pos.x += nx * push; b.pos.z += nz * push; }
    } else if (sa !== sb) {
      const s = sa ? a : b, r = sa ? b : a, rp = r.ragPos();
      const ex = s.pos.x - rp.x, ez = s.pos.z - rp.z, e = Math.hypot(ex, ez) || 1e-3;
      if (e < 1.0) { s.pos.x = rp.x + ex / e * 1.0; s.pos.z = rp.z + ez / e * 1.0; }
    }
    for (const f of this.f) {
      if (f.rag) continue;
      const lim = RING_H - 0.42;
      for (const ax of ['x', 'z']) {
        if (Math.abs(f.pos[ax]) > lim) {
          const sg = Math.sign(f.pos[ax]); f.pos[ax] = sg * lim;
          if (f.knock[ax] * sg > 0.5) { f.knock[ax] *= -0.55; f.impulse('rx', -1.5); SFX.step(0.6); }
          else if (f.knock[ax] * sg > 0) f.knock[ax] = 0;
        }
      }
    }
  },
  autoIntent(f, toCorner) {
    if (f.isDown) return { mx: 0, mz: 0 };
    let tx = f.pos.x, tz = f.pos.z;
    if (this.phase === 'knockdown' && f !== this.victim) {
      const vp = this.victim.ragPos(), H = RING_H - 0.9;
      const c1 = [H, -H], c2 = [-H, H];
      const d1 = Math.hypot(c1[0] - vp.x, c1[1] - vp.z), d2 = Math.hypot(c2[0] - vp.x, c2[1] - vp.z);
      [tx, tz] = d1 > d2 ? c1 : c2;
    } else if (toCorner) { const H = RING_H - 0.9; [tx, tz] = f.idx === 0 ? [-H, -H] : [H, H]; }
    const rx = tx - f.pos.x, rz = tz - f.pos.z, l = Math.hypot(rx, rz);
    if (l < 0.3) return { mx: 0, mz: 0 };
    const s = Math.min(1, l) * 0.7, fx = Math.sin(f.yaw), fz = Math.cos(f.yaw), lx = Math.cos(f.yaw), lz = -Math.sin(f.yaw);
    return { mx: (rx * lx + rz * lz) / l * s, mz: (rx * fx + rz * fz) / l * s };
  },
  beginRound() {
    this.phase = 'roundStart'; this.phaseT = 0; this.bellRung = false; this.clock = this.roundLen;
    Cam.set('fight', 2.2);
    HUD.announce(this.round === this.rounds && this.rounds > 1 ? `FINAL ROUND` : `ROUND ${this.round}`);
    speak(this.round === this.rounds && this.rounds > 1 ? 'Final round!' : `Round ${['one', 'two', 'three', 'four', 'five'][this.round - 1]}`);
  },
  endRound() {
    this.phase = 'roundEnd'; this.phaseT = 0; SFX.bell(3); HUD.announce('END OF ROUND');
    for (const f of this.f) { if (f.state === 'punch' || f.state === 'dodge') f.setState('idle'); f.blocking = false; }
  },
  betweenRounds() {
    this.phase = 'between'; this.phaseT = 0; this.round++;
    Cam.set('corner', 2);
    const [a, b] = this.f;
    this.resetPositions();
    for (const f of this.f) { f.stam = f.stamMax; f.hp = Math.min(f.maxHp, f.hp + f.maxHp * 0.12); f.hpChip = f.hp; f.stun = 0; f.bodyDmg *= 0.6; }
    const lead = a.stats.dmg > b.stats.dmg ? a.def.name : b.def.name;
    HUD.announce(`ROUND ${this.round - 1} DONE<small>${lead.toUpperCase()} AHEAD ON DAMAGE · PRESS A PUNCH TO CONTINUE</small>`, true);
  },
  knockdown(v, a, dir, p) {
    if (this.training) { v.hp = v.maxHp; v.hpChip = v.maxHp; Popups.show('RESET', v.headW.clone().add(V3(0, 0.6, 0)), 'g'); return; }
    if (this.phase !== 'fight') { v.hp = Math.max(1, v.hp); return; }
    v.hp = 0; v.kd++; v.setState('down'); v.startRagdoll(dir, 3.4 + p * 2.4);
    a.stats.kd++; a.stats.roundKd[this.round - 1] = (a.stats.roundKd[this.round - 1] || 0) + 1;
    if (a.state === 'punch') a.queued = null;
    this.phase = 'knockdown'; this.phaseT = 0; this.count = 0; this.countT = -1.4; this.victim = v; this.attacker = a; this.getup = 0; this.rising = false;
    this.slowT = 1.4; Cam.set('down', 2); Cam.shake(0.8); Cam.fovKick = -6;
    gradePass.uniforms.uFlash.value = 0.45; gradePass.uniforms.uAberr.value = 0.012;
    SFX.crash(); SFX.cheer(1.6); this.excite = 1; rumble(1, 400);
    HUD.announce(v.kd >= 3 ? 'T.K.O.' : 'KNOCKDOWN');
    speak(v.kd >= 3 ? `That's three! It's over!` : `Down goes ${v.def.name}!`, 1.05);
    this.tko = v.kd >= 3;
    if (!this.tko) {
      if (v.idx === 1) { const pr = DIFF[this.cfg.diff].rise[Math.min(1, v.kd - 1)]; this.riseAt = Math.random() < pr ? randi(3, 8) : 99; }
      else { $('getup').hidden = false; this.getupNeed = 100; }
    }
  },
  knockdownTick(rdt, dt) {
    const v = this.victim;
    if (this.tko) { if (this.phaseT > 2.8) this.finishKO('TKO'); return; }
    if (this.rising) {
      if (v.state === 'idle') { this.rising = false; this.phase = 'fight'; this.phaseT = 0; Cam.set('fight', 2.5); HUD.announce('FIGHT!'); SFX.bell(1); $('getup').hidden = true; }
      return;
    }
    if (v.idx === 0) {
      this.getup = Math.max(0, this.getup - rdt * (10 + v.kd * 6));
      if (Input.anyPunch()) this.getup += 10;
      $('getupbar').style.transform = `scaleX(${clamp(this.getup / this.getupNeed, 0, 1)})`;
    }
    this.countT += rdt;
    if (this.countT >= 1) {
      this.countT -= 1; this.count++;
      if (this.count >= 10) { this.finishKO('KO'); return; }
      HUD.announce(String(this.count)); speak(String(this.count), 1.1); SFX.tick();
      const playerUp = v.idx === 0 && this.getup >= this.getupNeed && this.count >= 2;
      if ((v.idx === 1 && this.count >= this.riseAt) || playerUp) {
        this.rising = true; v.startRise(this.attacker.pos);
        v.hp = v.maxHp * [0.5, 0.33, 0.2][v.kd - 1]; v.hpChip = v.hp; v.stam = v.stamMax * 0.6;
        HUD.announce(`${this.count}<small>${v.def.name.toUpperCase()} BEATS THE COUNT</small>`); SFX.cheer(1); $('getup').hidden = true;
      }
    }
  },
  finishKO(method) {
    const v = this.victim, w = this.attacker;
    this.phase = 'ko'; this.phaseT = 0; v.setState('ko'); w.setState('victory'); w.blocking = false;
    this.winner = w; this.method = method; Cam.set('ko', 1.5); $('getup').hidden = true;
    HUD.announce(method === 'TKO' ? 'T.K.O.' : 'K.O.'); SFX.bell(4); SFX.cheer(2); this.excite = 1;
    speak(`${w.def.name} wins by ${method === 'TKO' ? 'technical knockout' : 'knockout'}!`);
  },
  decision() {
    const [a, b] = this.f;
    const cards = [0, 1, 2].map(() => {
      let sa = 0, sb = 0;
      for (let r = 0; r < this.rounds; r++) {
        const da = (a.stats.roundDmg[r] || 0) * rand(0.88, 1.12), db = (b.stats.roundDmg[r] || 0) * rand(0.88, 1.12);
        let ra = 10, rb = 10; if (da >= db) rb--; else ra--;
        ra -= (b.stats.roundKd[r] || 0); rb -= (a.stats.roundKd[r] || 0);
        sa += ra; sb += rb;
      }
      return [sa, sb];
    });
    const wa = cards.filter(c => c[0] > c[1]).length, wb = cards.filter(c => c[1] > c[0]).length;
    this.cards = cards;
    this.winner = wa > wb ? a : wb > wa ? b : null; this.method = 'Decision';
    this.phase = 'decision'; this.phaseT = 0; Cam.set('corner', 1.5);
    if (this.winner) { this.winner.setState('victory'); this.victim = this.winner === a ? b : a; }
    HUD.announce(this.winner ? `${this.winner.def.name}<small>WINS ON THE JUDGES' CARDS · ${cards.map(c => c.join('–')).join(' · ')}</small>` : `DRAW<small>${cards.map(c => c.join('–')).join(' · ')}</small>`, true);
    speak(this.winner ? `The judges score it for ${this.winner.def.name}!` : 'This one is a draw!');
    SFX.cheer(1.5);
  },
  showResults() {
    if (this.mode !== 'fight') return;
    const [a, b] = this.f, win = this.winner === a, draw = !this.winner;
    this.mode = 'results'; $('hud').hidden = true; $('touch').hidden = true;
    $('res-title').textContent = draw ? 'Draw' : win ? 'Victory' : 'Defeat';
    $('res-title').className = 'res-title ' + (draw ? '' : win ? 'win' : 'lose');
    $('res-method').textContent = `${this.method === 'KO' ? 'Knockout' : this.method === 'TKO' ? 'Technical knockout' : 'Judges’ decision'} · ${ARENAS.find(x => x.id === this.cfg.arena).name}`;
    $('res-line').textContent = draw ? 'Nobody walks out of this one happy.' : win ? `${a.def.name} stands over ${b.def.name}. The crowd wants more.` : `${b.def.name} takes it. ${a.def.name} goes back to the scrapyard for repairs.`;
    const row = (l, x, y) => `<tr><th>${l}</th><td>${x}</td><td>${y}</td></tr>`;
    const acc = f => f.stats.thrown ? Math.round(f.stats.landed / f.stats.thrown * 100) + '%' : '—';
    $('res-table').innerHTML = `<thead><tr><th></th><th>${a.def.name}</th><th>${b.def.name}</th></tr></thead><tbody>` +
      row('Punches landed', `${a.stats.landed}/${a.stats.thrown}`, `${b.stats.landed}/${b.stats.thrown}`) + row('Accuracy', acc(a), acc(b)) +
      row('Power punches', a.stats.power, b.stats.power) + row('Damage dealt', Math.round(a.stats.dmg), Math.round(b.stats.dmg)) +
      row('Knockdowns scored', a.stats.kd, b.stats.kd) + row('Best combo', a.stats.maxCombo, b.stats.maxCombo) + row('Punches blocked', a.stats.blocked, b.stats.blocked) +
      row('Armor left', Math.round((a.parts.head + a.parts.core + a.parts.armL + a.parts.armR) / 4) + '%', Math.round((b.parts.head + b.parts.core + b.parts.armL + b.parts.armR) / 4) + '%') + '</tbody>';
    $('res-cards').textContent = this.method === 'Decision' ? 'Scorecards: ' + this.cards.map(c => c.join('–')).join(' · ') : '';
    const circ = this.cfg.circuit;
    $('res-next').hidden = !(circ && win && this.cfg.rung < 4);
    if (circ && win) { const s = store.get('circuit', null) || { robot: a.def.id, beaten: 0 }; s.beaten = Math.max(s.beaten, this.cfg.rung + 1); store.set('circuit', s); if (this.cfg.rung >= 4) $('res-line').textContent = `${a.def.name} is the undisputed Ironvolt champion. Every venue, every frame, beaten.`; }
    $('res-again').textContent = circ && !win ? 'Retry' : 'Rematch';
    UI.show('s-results', false);
    Music.mode = 'menu';
  },
  togglePause(force) {
    if (this.mode !== 'fight') return;
    this.paused = force === true ? true : !this.paused;
    if (this.paused) { UI.show('s-pause', false); $('pause-title').textContent = this.training ? 'Training' : 'Timeout'; Music.mode = 'menu'; }
    else { UI.hideAll(); Music.mode = 'fight'; }
  },
  quitToMenu() {
    this.paused = false; this.clearFight(); this.mode = 'menu'; $('hud').hidden = true; $('touch').hidden = true;
    Music.mode = 'menu'; Cam.set('menu', 2);
    this.setShowcase(UI.sel.p1 || 'bulwark');
    UI.show('s-title', false); UI.stack = [];
  },
  // ---- event hooks used by resolveHit
  hitstop(t) { this.hitstopT = Math.max(this.hitstopT, t); },
  footShake(p, w) { if (this.mode !== 'fight') return; const d = camera.position.distanceTo(p); Cam.shake(Math.max(0, 0.05 * w - d * 0.006)); },
  shake(a) { Cam.shake(a); },
  onHit(a, d, dmg, mv, body) {
    this.excite = Math.min(1, this.excite + dmg / 350);
    rumble(d.idx === 0 ? 0.4 + dmg / 150 : 0.15 + dmg / 300, 60 + dmg);
    if (mv.power > 0.9) { Cam.fovKick = -2.5; gradePass.uniforms.uAberr.value = 0.006; }
    if (d.idx === 0) gradePass.uniforms.uFlash.value = Math.max(gradePass.uniforms.uFlash.value, 0.06 + dmg / 900);
    if (this.training) this.trainInfo(dmg, mv, body);
  },
  onParry() { this.excite = Math.min(1, this.excite + 0.25); },
  onSlip() { this.excite = Math.min(1, this.excite + 0.08); },
  onCrowd(v) { SFX.cheer(v); this.excite = Math.min(1, this.excite + v * 0.3); },
  onOverdrive(f) { Cam.fovKick = 6; gradePass.uniforms.uFlash.value = 0.25; this.excite = Math.min(1, this.excite + 0.4); if (f.idx === 0) HUD.announce('OVERDRIVE'); },
  toast(t) { Popups.show(t, V3().copy(Cam.look).add(V3(0, 1.4, 0)), 'g'); },
  trainingTick() {
    const k = ['Digit1', 'Digit2', 'Digit3'].find(c => Input.edge.has(c));
    if (k) { this.ai = new AI(this.f[1], this.f[0], 'contender', k === 'Digit1' ? 'idle' : k === 'Digit2' ? 'block' : 'fight'); this.toast(k === 'Digit1' ? 'DUMMY: IDLE' : k === 'Digit2' ? 'DUMMY: BLOCKING' : 'DUMMY: FIGHTS BACK'); this.trainInfo(); }
    for (const f of this.f) if (f.hp < f.maxHp * 0.3 && f.sinceHit > 2) { f.hp = f.maxHp; f.hpChip = f.hp; }
  },
  trainInfo(dmg, mv, body) {
    if (dmg) this.lastHit = `${body ? 'BODY ' : ''}${mv.name.toUpperCase()} <b>${Math.round(dmg)}</b>`;
    const a = this.f[0];
    $('train').innerHTML = `DUMMY <b>${this.ai.mode.toUpperCase()}</b> · 1 2 3 TO SWITCH<br>LAST HIT ${this.lastHit || '—'}<br>BEST COMBO <b>${a.stats.maxCombo}</b> · REACH ${a.reach.toFixed(2)} M`;
  },
};

// ============================================================================
// MENUS
// ============================================================================
const UI = {
  stack: [], sel: { p1: 'bulwark', p2: 'onyx', arena: settings.lastArena || 'tanker', diff: 'contender', rounds: 3 }, flow: null, step: 1,
  init() {
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { SFX.ui(); this.go(b.dataset.go); }));
    document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { SFX.ui(); this.back(); }));
    // robot cards
    const cards = $('cards');
    ROBOTS.forEach(r => {
      const c = document.createElement('button'); c.className = 'card'; c.dataset.id = r.id;
      const sw = [r.colors.primary, r.colors.secondary, r.colors.accent].map(x => `<i style="background:#${x.toString(16).padStart(6, '0')}"></i>`).join('');
      c.innerHTML = `<div class="sw">${sw}</div><b>${r.name}</b><span>${r.cls.split('·')[0].trim()}</span>`;
      c.addEventListener('click', () => { SFX.ui(); this.pickRobot(r.id); });
      c.addEventListener('dblclick', () => this.confirmRobot());
      cards.appendChild(c);
    });
    $('sel-ok').addEventListener('click', () => { SFX.uiOk(); this.confirmRobot(); });
    // arenas
    const ar = $('arenas');
    ARENAS.forEach(a => { const c = document.createElement('button'); c.className = 'arena'; c.dataset.id = a.id; c.innerHTML = `<b>${a.name}</b><span>${a.sub}</span>`; c.addEventListener('click', () => { SFX.ui(); this.sel.arena = a.id; this.refreshSetup(); this.previewArena(); }); ar.appendChild(c); });
    this.seg('seg-diff', [['rookie', 'Rookie'], ['contender', 'Contender'], ['champion', 'Champion']], () => this.sel.diff, v => this.sel.diff = v);
    this.seg('seg-rounds', [[1, '1'], [3, '3'], [5, '5']], () => this.sel.rounds, v => this.sel.rounds = v);
    $('setup-go').addEventListener('click', () => { SFX.uiOk(); this.launch(); });
    // settings
    this.seg('seg-q', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], () => settings.quality, v => { settings.quality = v; saveSettings(); buildComposer(); });
    this.seg('seg-cam', [['shoulder', 'Shoulder'], ['broadcast', 'Broadcast']], () => settings.cam, v => { settings.cam = v; saveSettings(); });
    this.seg('seg-shake', [[true, 'On'], [false, 'Off']], () => settings.shake, v => { settings.shake = v; saveSettings(); });
    this.seg('seg-music', [[0, 'Off'], [0.25, 'Low'], [0.5, 'Mid'], [0.9, 'High']], () => settings.music, v => { settings.music = v; saveSettings(); SFX.setVolumes(); });
    this.seg('seg-sfx', [[0.3, 'Low'], [0.6, 'Mid'], [0.9, 'High']], () => settings.sfx, v => { settings.sfx = v; saveSettings(); SFX.setVolumes(); });
    this.seg('seg-voice', [[true, 'On'], [false, 'Off']], () => settings.voice, v => { settings.voice = v; saveSettings(); });
    // pause / results
    $('p-resume').addEventListener('click', () => Game.togglePause());
    $('p-restart').addEventListener('click', () => { Game.paused = false; Game.startFight(Game.cfg); });
    $('p-controls').addEventListener('click', () => this.show('s-controls'));
    $('p-quit').addEventListener('click', () => Game.quitToMenu());
    $('res-menu').addEventListener('click', () => Game.quitToMenu());
    $('res-again').addEventListener('click', () => Game.startFight(Game.cfg));
    $('res-next').addEventListener('click', () => { const s = store.get('circuit', null); this.launchRung(s.beaten); });
    $('lad-go').addEventListener('click', () => { const s = store.get('circuit', null); if (s) this.launchRung(Math.min(4, s.beaten)); });
    $('lad-reset').addEventListener('click', () => { store.set('circuit', null); this.flow = 'circuit'; this.step = 1; this.openSelect(); });
    $('foot').textContent = IS_TOUCH ? 'TOUCH CONTROLS ON · GAMEPAD SUPPORTED' : 'KEYBOARD · MOUSE · GAMEPAD';
    this.show('s-title', false);
  },
  seg(id, opts, get, set) {
    const el = $(id); el.innerHTML = '';
    opts.forEach(([v, l]) => { const b = document.createElement('button'); b.textContent = l; b.addEventListener('click', () => { SFX.ui(); set(v); [...el.children].forEach((c, i) => c.classList.toggle('on', opts[i][0] === get())); }); el.appendChild(b); });
    [...el.children].forEach((c, i) => c.classList.toggle('on', opts[i][0] === get()));
  },
  hideAll() { document.querySelectorAll('.screen').forEach(s => s.hidden = true); $('menu').hidden = true; },
  show(id, push = true) {
    const cur = [...document.querySelectorAll('.screen')].find(s => !s.hidden);
    if (push && cur && cur.id !== id) this.stack.push(cur.id);
    this.hideAll(); $('menu').hidden = false; $(id).hidden = false;
    if (Game.mode === 'menu') Cam.set(id === 's-setup' ? 'setup' : 'menu', 2);
    const first = $(id).querySelector('.mbtn, .card.sel, .btn.go'); if (first && !IS_TOUCH) first.focus({ preventScroll: true });
  },
  back() {
    const prev = this.stack.pop();
    if (Game.mode === 'fight' && Game.paused && prev === 's-pause') { this.show('s-pause', false); return; }
    if (this.flow && $('s-select').hidden === false && this.step === 2) { this.step = 1; this.openSelect(); return; }
    this.show(prev || 's-title', false);
  },
  go(where) {
    if (where === 'controls' || where === 'settings') { this.show('s-' + where); return; }
    this.flow = where; this.step = 1;
    if (where === 'circuit') { const s = store.get('circuit', null); if (s && s.robot) { this.sel.p1 = s.robot; this.openLadder(); return; } }
    this.openSelect();
  },
  openSelect() {
    const step = this.step, f = this.flow;
    const two = f !== 'circuit';
    $('sel-step').textContent = two ? `Step ${step} of 2 · ${step === 1 ? 'Your fighter' : (f === 'training' ? 'Sparring partner' : 'Opponent')}` : 'Choose the robot you take up the ladder';
    if (step === 2 && this.sel.p2 === this.sel.p1) this.sel.p2 = ROBOTS.find(r => r.id !== this.sel.p1).id;
    this.pickRobot(step === 1 ? this.sel.p1 : this.sel.p2);
    this.show('s-select', !(step === 2));
  },
  pickRobot(id) {
    if (this.step === 1) this.sel.p1 = id; else this.sel.p2 = id;
    document.querySelectorAll('#cards .card').forEach(c => c.classList.toggle('sel', c.dataset.id === id));
    const r = ROBOT(id); const st = r.stats;
    const statRow = (l, v) => `<span>${l}</span><div class="b"><i style="width:${v * 10}%"></i></div><em>${v}</em>`;
    $('detail').innerHTML = `<div class="cls">${r.cls}</div><h3>${r.name}</h3><p>${r.bio}</p><div class="stats">${statRow('POWER', st.power)}${statRow('SPEED', st.speed)}${statRow('ARMOR', st.armor)}${statRow('REACH', st.reach)}${statRow('STAMINA', st.stamina)}</div>`;
    Game.setShowcase(id);
  },
  confirmRobot() {
    if (this.flow === 'circuit') { store.set('circuit', { robot: this.sel.p1, beaten: 0 }); this.openLadder(); return; }
    if (this.step === 1) { this.step = 2; this.openSelect(); return; }
    this.openSetup();
  },
  openSetup() {
    const tr = this.flow === 'training';
    $('setup-vs').textContent = `${ROBOT(this.sel.p1).name} vs ${ROBOT(this.sel.p2).name}`;
    $('seg-diff').parentElement.hidden = tr; $('seg-rounds').parentElement.hidden = tr;
    $('setup-go').textContent = tr ? 'Start sparring' : 'Ring the bell';
    this.refreshSetup(); this.previewArena();
    this.show('s-setup');
  },
  refreshSetup() { document.querySelectorAll('#arenas .arena').forEach(c => c.classList.toggle('sel', c.dataset.id === this.sel.arena)); },
  previewArena() {
    if (Arena.id !== this.sel.arena) { Arena.load(this.sel.arena); settings.lastArena = this.sel.arena; saveSettings(); }
  },
  launch() {
    const tr = this.flow === 'training';
    Game.startFight({ p1: this.sel.p1, p2: this.sel.p2, arena: this.sel.arena, diff: this.sel.diff, rounds: this.sel.rounds, training: tr });
  },
  ladderOpps() { const p = store.get('circuit', null).robot; return LADDER_ORDER.filter(id => id !== p).slice(0, 5); },
  openLadder() {
    const s = store.get('circuit', null); const opps = this.ladderOpps();
    $('lad-eyebrow').textContent = `Circuit · ${ROBOT(s.robot).name}`;
    $('lad-title').textContent = s.beaten >= 5 ? 'Champion' : 'The Ladder';
    $('ladder').innerHTML = opps.map((id, i) => {
      const r = ROBOT(id), cls = i < s.beaten ? 'done' : i === s.beaten ? 'next' : '';
      return `<div class="rung ${cls}"><span class="n">${i + 1}</span><div><b>${r.name}</b><small>${ARENAS.find(a => a.id === LADDER_ARENA[i]).name} · ${DIFF[LADDER_DIFF[i]].name}${i === 4 ? ' · Title fight, 5 rounds' : ''}</small></div><span class="st">${i < s.beaten ? 'BEATEN' : i === s.beaten ? 'NEXT' : 'LOCKED'}</span></div>`;
    }).join('');
    $('lad-go').textContent = s.beaten >= 5 ? 'Defend the title' : 'Fight';
    this.sel.p1 = s.robot; Game.setShowcase(s.robot);
    this.show('s-ladder');
  },
  launchRung(i) {
    const s = store.get('circuit', null); i = Math.min(4, i);
    const opp = this.ladderOpps()[i];
    Game.startFight({ p1: s.robot, p2: opp, arena: LADDER_ARENA[i], diff: LADDER_DIFF[i], rounds: i === 4 ? 5 : 3, circuit: true, rung: i });
  },
};

// ============================================================================
// BOOT
// ============================================================================
let _last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const rdt = Math.min(0.05, Math.max(0, (now - _last) / 1000)); _last = now;
  Input.pollPad();
  Game.frame(rdt);
  Input.endFrame();
}
async function boot() {
  try {
    if (document.fonts && document.fonts.load) {
      await Promise.race([Promise.all(['900 40px "Big Shoulders Display"', '600 20px "Chakra Petch"', '400 20px "Share Tech Mono"'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]);
    }
  } catch (e) { }
  buildBaseTextures();
  FX.init();
  buildComposer();
  Arena.load(UI.sel.arena);
  Game.setShowcase(UI.sel.p1);
  HUD.init(); Input.init(); UI.init();
  $('loading').remove();
  window.__ironvolt = { Game, Arena, Cam, settings, FX, Fighter, ROBOT, V3 };
  requestAnimationFrame(loop);
}
boot();
