// ============================================================================
// INPUT: keyboard, mouse, gamepad, touch
// ============================================================================
const Input = {
  keys: new Set(), edge: new Set(), pad: null, padPrev: [], padEdge: new Set(), stick: { x: 0, y: 0 }, tHeld: new Set(), tEdge: new Set(), runToggle: false, rsPrev: 0, slipAlt: 1, mouseAlt: 0,
  init() {
    const gameKeys = new Set(['Space', 'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyG', 'KeyR', 'KeyQ', 'KeyE', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Digit1', 'Digit2', 'Digit3']);
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
    cv.addEventListener('mousedown', e => { unlockAudio(); if (Game.mode === 'fight') { this.edge.add('Mouse' + e.button); this.keys.add('Mouse' + e.button); e.preventDefault(); } });
    addEventListener('mouseup', e => this.keys.delete('Mouse' + e.button));
    cv.addEventListener('contextmenu', e => e.preventDefault());
    addEventListener('pointerdown', unlockAudio);
    const st = $('stick'), knob = st.querySelector('i'); let sid = null, cx = 0, cy = 0;
    const move = e => { if (e.pointerId !== sid) return; let dx = (e.clientX - cx) / 55, dy = (e.clientY - cy) / 55; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } this.stick.x = dx; this.stick.y = dy; knob.style.transform = `translate(${dx * 40}px,${dy * 40}px)`; };
    st.addEventListener('pointerdown', e => { sid = e.pointerId; st.setPointerCapture(sid); const r = st.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; move(e); });
    st.addEventListener('pointermove', move);
    const end = e => { if (e.pointerId !== sid) return; sid = null; this.stick.x = this.stick.y = 0; knob.style.transform = ''; };
    st.addEventListener('pointerup', end); st.addEventListener('pointercancel', end);
    $('tbtns').querySelectorAll('button').forEach(b => {
      const t = b.dataset.t;
      b.addEventListener('pointerdown', e => { e.preventDefault(); unlockAudio(); if (t === 'pause') { Game.togglePause(); return; } if (t === 'run') { this.runToggle = !this.runToggle; b.classList.toggle('on', this.runToggle); return; } this.tHeld.add(t); this.tEdge.add(t); });
      const up = () => this.tHeld.delete(t); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    });
  },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : []; let p = null;
    for (const g of pads) if (g && g.connected) { p = g; break; }
    this.pad = p; this.padEdge.clear(); if (!p) return;
    p.buttons.forEach((b, i) => { const v = b.pressed || b.value > 0.5; if (v && !this.padPrev[i]) { this.padEdge.add(i); unlockAudio(); } this.padPrev[i] = v; });
    if (this.padEdge.has(9)) Game.togglePause();
    if (this.padEdge.has(10)) this.runToggle = !this.runToggle;
  },
  b(i) { return !!(this.pad && this.pad.buttons[i] && (this.pad.buttons[i].pressed || this.pad.buttons[i].value > 0.4)); },
  ax(i) { const v = this.pad ? (this.pad.axes[i] || 0) : 0; return Math.abs(v) < 0.18 ? 0 : v; },
  anyPunch() { return ['KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'Mouse0', 'Space'].some(k => this.edge.has(k)) || [0, 1, 2, 3].some(i => this.padEdge.has(i)) || ['jab', 'cross', 'hook', 'upper', 'jump'].some(t => this.tEdge.has(t)); },
  mash() { return this.edge.has('Space') || this.padEdge.has(0) || this.tEdge.has('jump') ? 1 : 0; },
  mashPunch() { let n = 0; for (const k of ['KeyJ', 'KeyK', 'KeyL', 'KeyI', 'Mouse0']) if (this.edge.has(k)) n++; for (const i of [2, 3, 7]) if (this.padEdge.has(i)) n++; for (const t of ['jab', 'cross', 'hook', 'upper']) if (this.tEdge.has(t)) n++; return n; },
  playerIntent() {
    const K = c => this.keys.has(c), E = c => this.edge.has(c), T = t => this.tEdge.has(t), PE = i => this.padEdge.has(i);
    let mx = (K('KeyA') || K('ArrowLeft') ? 1 : 0) - (K('KeyD') || K('ArrowRight') ? 1 : 0) - this.ax(0) - this.stick.x;
    let mz = (K('KeyW') || K('ArrowUp') ? 1 : 0) - (K('KeyS') || K('ArrowDown') ? 1 : 0) - this.ax(1) - this.stick.y;
    let punch = null;
    if (E('KeyJ') || PE(2) || T('jab')) punch = 'jab';
    else if (E('KeyK') || PE(3) || T('cross')) punch = 'cross';
    else if (E('KeyL') || PE(7) || T('hook')) punch = 'hook';
    else if (E('KeyI') || PE(6) || T('upper')) punch = 'upper';
    else if (E('Mouse0')) { this.mouseAlt = 1 - this.mouseAlt; punch = this.mouseAlt ? 'jab' : 'cross'; }
    const kick = E('KeyU') || PE(1) || T('kick');
    const block = K('KeyF') || K('Mouse2') || this.b(5) || this.tHeld.has('block');
    const jump = E('Space') || PE(0) || T('jump');
    const grab = E('KeyG') || PE(4) || T('grab');
    const pick = E('KeyR') || PE(11) || PE(13) || T('pick');
    const sprint = K('ShiftLeft') || K('ShiftRight') || this.runToggle;
    let dodge = 0;
    if (E('KeyQ')) dodge = 1; else if (E('KeyE')) dodge = -1;
    const rs = this.ax(2); if (Math.abs(rs) > 0.7 && Math.abs(this.rsPrev) <= 0.7) dodge = rs > 0 ? -1 : 1; this.rsPrev = rs;
    if (T('dodge')) dodge = mx > 0.3 ? 1 : mx < -0.3 ? -1 : (this.slipAlt = -this.slipAlt);
    let ab = null;
    if (E('Digit1') || PE(14) || T('ab0')) ab = 0; else if (E('Digit2') || PE(15) || T('ab1')) ab = 1; else if (E('Digit3') || PE(12) || T('ab2')) ab = 2;
    if (E('KeyC') || PE(8)) { settings.cam = settings.cam === 'shoulder' ? 'wide' : 'shoulder'; saveSettings(); Game.toast(settings.cam === 'shoulder' ? 'SHOULDER CAM' : 'WIDE CAM'); }
    return { mx: clamp(mx, -1, 1), mz: clamp(mz, -1, 1), block, punch, kick, jump, grab, pick, sprint, dodge, ab };
  },
  endFrame() { this.edge.clear(); this.tEdge.clear(); },
};
function unlockAudio() { if (!SFX.ready) { SFX.init(); Music.start(); } else if (SFX.ctx.state === 'suspended') SFX.ctx.resume(); }

// ============================================================================
// CAMERA
// ============================================================================
const _c1 = V3(), _c2 = V3(), _c3 = V3(), _c4 = V3();
function buildingTopAt(p) {
  for (const b of Arena.buildings) {
    if (p.x < b.x0 - 0.2 || p.x > b.x1 + 0.2 || p.z < b.z0 - 0.2 || p.z > b.z1 + 0.2) continue;
    b.refresh(); const ix = clamp(Math.floor((p.x - b.x0) / CW), 0, b.nx - 1), iz = clamp(Math.floor((p.z - b.z0) / CW), 0, b.nz - 1);
    const h = b.cols[iz * b.nx + ix]; if (h > 0.3) return h + (b.yOff || 0);
  }
  return -1e9;
}
function pointInBuilding(p) {
  for (const b of Arena.buildings) {
    if (p.x < b.x0 - 0.15 || p.x > b.x1 + 0.15 || p.z < b.z0 - 0.15 || p.z > b.z1 + 0.15) continue;
    b.refresh(); const ix = clamp(Math.floor((p.x - b.x0) / CW), 0, b.nx - 1), iz = clamp(Math.floor((p.z - b.z0) / CW), 0, b.nz - 1);
    if (b.cols[iz * b.nx + ix] + (b.yOff || 0) + 0.15 > p.y) return true;
  }
  return false;
}
const Cam = {
  mode: 'menu', pos: V3(0, 4, 9), look: V3(0, 2, 0), trauma: 0, fovKick: 0, t: 0, k: 3, cinePos: V3(), cineLook: V3(),
  shake(a) { if (settings.shake) this.trauma = Math.min(1, this.trauma + a); },
  set(mode, k = 3) { this.mode = mode; this.k = k; this.mt = 0; },
  update(rdt) {
    this.t += rdt; this.mt = (this.mt || 0) + rdt;
    const tp = _c1, tl = _c2;
    const [a, b] = Game.f || [];
    if (this.mode === 'menu' || this.mode === 'setup') {
      const f = Game.showcase; const c = f ? f.pos : _c3.set(0, 0, 0); const S = f ? f.S : 1;
      const ang = this.t * 0.1 + 0.6; const dist = (this.mode === 'setup' ? 12 : 5.6) * S;
      tp.set(c.x + Math.sin(ang) * dist, (this.mode === 'setup' ? 5 : 1.6) * S + Arena.groundAt(c.x, c.z), c.z + Math.cos(ang) * dist);
      tl.set(c.x, 1.5 * S + Arena.groundAt(c.x, c.z), c.z);
      if (innerWidth > 640) { const dir = _c4.subVectors(tl, tp).normalize(); const right = _c3.set(-dir.z, 0, dir.x); tl.addScaledVector(right, -(this.mode === 'setup' ? 3.5 : 1.4) * S); }
      else tl.y -= 0.8 * S;
    } else if (this.mode === 'cine' || this.mode === 'fixed') {
      tp.copy(this.mode === 'cine' ? this.cinePos : this.fixedPos); tl.copy(this.mode === 'cine' ? this.cineLook : this.fixedLook);
    } else if (this.mode === 'fight' || this.mode === 'down') {
      const S = (a.S + b.S) / 2;
      const p1 = a.ragPos(), p2 = b.ragPos();
      const dir = _c3.subVectors(p1, p2); dir.y = 0; const sep = dir.length() || 1; dir.divideScalar(sep);
      const perp = _c4.set(dir.z, 0, -dir.x);
      if (this.mode === 'down') {
        const vp = Game.victim.ragPos(); const ang = this.mt * 0.25 + Math.atan2(dir.x, dir.z) + 0.9;
        tp.set(vp.x + Math.sin(ang) * 5 * S, Arena.groundAt(vp.x, vp.z) + 1.8 * S, vp.z + Math.cos(ang) * 5 * S); tl.set(vp.x, Arena.groundAt(vp.x, vp.z) + 0.6 * S, vp.z);
      } else if (settings.cam === 'wide') {
        const m = _c2.addVectors(p1, p2).multiplyScalar(0.5);
        let s = Math.sign((this.pos.x - m.x) * perp.x + (this.pos.z - m.z) * perp.z) || 1;
        const dd = (6.2 + sep * 0.75) * S;
        tp.set(m.x + perp.x * s * dd + dir.x * 1.5, Arena.groundAt(m.x, m.z) + 3.2 * S, m.z + perp.z * s * dd + dir.z * 1.5);
        tl.set(m.x, Arena.groundAt(m.x, m.z) + 1.5 * S, m.z);
      } else {
        const back = (3.8 + sep * 0.42) * S;
        tp.set(p1.x + dir.x * back + perp.x * 1.8 * S, Arena.groundAt(p1.x, p1.z) + 2.7 * S + (a.pos.y || 0) * 0.5, p1.z + dir.z * back + perp.z * 1.8 * S);
        tl.set(lerp(p1.x, p2.x, 0.62), Arena.groundAt(p2.x, p2.z) + 1.45 * S, lerp(p1.z, p2.z, 0.62));
      }
    } else if (this.mode === 'ko') {
      const v = Game.victim, w = Game.winner; const vp = v.ragPos(); const S = w.S;
      const m = _c3.lerpVectors(vp, w.pos, 0.4); const ang = this.mt * 0.16 + 2;
      tp.set(m.x + Math.sin(ang) * 6.5 * S, Arena.groundAt(m.x, m.z) + 1.5 * S + this.mt * 0.08, m.z + Math.cos(ang) * 6.5 * S); tl.set(m.x, Arena.groundAt(m.x, m.z) + 1.1 * S, m.z);
    } else if (this.mode === 'clash') {
      const c = Game.clash ? Game.clash.point : this.look; const dir = _c3.subVectors(a.pos, b.pos).normalize();
      tp.set(c.x - dir.z * 3.2 + dir.x * 0.8, c.y + 0.4, c.z + dir.x * 3.2 + dir.z * 0.8); tl.copy(c);
    }
    // rise over buildings that would block the view (and never sit under water)
    if (this.mode !== 'menu' && this.mode !== 'setup' && this.mode !== 'cine') {
      let need = -1e9;
      for (let k = 0; k <= 0.85; k += 0.17) {
        const px = lerp(tp.x, tl.x, k), pz = lerp(tp.z, tl.z, k), top = buildingTopAt(_c3.set(px, 0, pz));
        if (top > -1e8) need = Math.max(need, (top + 0.35 - tl.y * k) / (1 - k));
      }
      need = Math.min(need, tl.y + 9);
      this.lift = damp(this.lift || 0, Math.max(0, need - tp.y), need > tp.y ? 5 : 1.5, rdt);
      tp.y += this.lift;
      tp.y = Math.max(tp.y, Arena.groundAt(tp.x, tp.z) + 0.4, Arena.id === 'city' && tp.z > 20.4 ? 0.1 : -9);
    } else this.lift = 0;
    const f = 1 - Math.exp(-this.k * rdt);
    this.pos.lerp(tp, f); this.look.lerp(tl, f);
    this.trauma = Math.max(0, this.trauma - rdt * 1.5); this.fovKick = damp(this.fovKick, 0, 5, rdt);
    const s = this.trauma * this.trauma, T = this.t * 40;
    camera.position.set(this.pos.x + Math.sin(T * 1.1) * s * 0.3, this.pos.y + Math.sin(T * 1.7 + 2) * s * 0.25, this.pos.z + Math.sin(T * 1.3 + 4) * s * 0.3);
    camera.lookAt(this.look);
    camera.rotateZ(Math.sin(T * 0.9) * s * 0.035);
    const baseFov = innerWidth < innerHeight ? 64 : 52;
    camera.fov = baseFov + this.fovKick + (Game.f && Game.f[0].sprinting ? 6 : 0); camera.updateProjectionMatrix();
  },
};

// ============================================================================
// HUD
// ============================================================================
const HUD = {
  init() {
    this.el = {}; ['hud', 'hp1', 'hp2', 'chip1', 'chip2', 'st1', 'st2', 'n1', 'n2', 'kd1', 'kd2', 'time', 'rnd', 'combo', 'announce', 'getup', 'getupbar', 'ab1', 'ab2', 'dg1', 'dg2', 'hint', 'train', 'prompt', 'promptbar', 'prompttxt'].forEach(k => this.el[k] = $(k));
    this.last = {};
    this.el.hint.innerHTML = IS_TOUCH ? '' : '<kbd>WASD</kbd>move <kbd>Shift</kbd>sprint <kbd>Space</kbd>jump · <kbd>J</kbd><kbd>K</kbd><kbd>L</kbd><kbd>I</kbd>punch <kbd>U</kbd>kick · <kbd>F</kbd>block · <kbd>G</kbd>grab/throw · <kbd>R</kbd>lift · <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd>abilities';
    $('pauseBtn').addEventListener('click', () => Game.togglePause());
  },
  setNames(a, b) { this.el.n1.textContent = a.def.name.toUpperCase(); this.el.n2.textContent = b.def.name.toUpperCase(); this.buildAbilities(this.el.ab1, a, true); this.buildAbilities(this.el.ab2, b, false); },
  buildAbilities(el, f, keys) {
    el.innerHTML = f.abil.map((a, i) => `<div class="ab"><i></i><b>${keys ? (i + 1) : ''}</b><span>${ABILITIES[a.id].name}</span></div>`).join('');
    f._abEls = [...el.querySelectorAll('.ab')];
    if (IS_TOUCH && keys) { const tb = $('tbtns'); f.abil.forEach((a, i) => { const b = tb.querySelector(`[data-t="ab${i}"]`); if (b) b.textContent = ABILITIES[a.id].name.split(' ')[0]; }); }
  },
  bar(el, v, key) { const k = Math.round(v * 400); if (this.last[key] === k) return; this.last[key] = k; el.style.transform = `scaleX(${clamp(v, 0, 1)})`; },
  update() {
    const [a, b] = Game.f; const e = this.el;
    this.bar(e.hp1, a.hp / a.maxHp, 'hp1'); this.bar(e.hp2, b.hp / b.maxHp, 'hp2');
    this.bar(e.chip1, a.hpChip / a.maxHp, 'c1'); this.bar(e.chip2, b.hpChip / b.maxHp, 'c2');
    this.bar(e.st1, a.stam / a.stamMax, 's1'); this.bar(e.st2, b.stam / b.stamMax, 's2');
    e.hp1.classList.toggle('low', a.hp < a.maxHp * 0.25); e.hp2.classList.toggle('low', b.hp < b.maxHp * 0.25);
    e.st1.classList.toggle('tired', a.stam < a.stamMax * 0.2); e.st2.classList.toggle('tired', b.stam < b.stamMax * 0.2);
    for (const f of [a, b]) f.abil.forEach((ab, i) => {
      const el = f._abEls && f._abEls[i]; if (!el) return;
      const A = ABILITIES[ab.id], k = ab.cd > 0 ? ab.cd / A.cd : 0, key = f.idx + 'a' + i, v = Math.round(k * 50) + (f.bladeT > 0 && ab.id === 'blade' ? 100 : 0);
      if (this.last[key] === v) return; this.last[key] = v;
      el.querySelector('i').style.transform = `scaleY(${k})`; el.classList.toggle('ready', k === 0); el.classList.toggle('live', ab.id === 'blade' && f.bladeT > 0);
    });
    const tt = Game.training ? '∞' : `${Math.floor(Math.max(0, Game.clock) / 60)}:${String(Math.floor(Math.max(0, Game.clock) % 60)).padStart(2, '0')}`;
    if (this.last.t !== tt) { this.last.t = tt; e.time.textContent = tt; }
    const rr = Game.training ? 'TRAINING' : (MAPS.find(m => m.id === Arena.id) || {}).name || ''; if (this.last.r !== rr) { this.last.r = rr; e.rnd.textContent = rr.toUpperCase(); }
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
  prompt(text, v) { if (text == null) { this.el.prompt.hidden = true; return; } this.el.prompt.hidden = false; this.el.prompttxt.textContent = text; this.el.promptbar.style.transform = `scaleX(${clamp(v, 0, 1)})`; },
  announce(html, hold = false) { const el = this.el.announce; el.innerHTML = html; el.classList.remove('show', 'hold'); void el.offsetWidth; el.classList.add(hold ? 'hold' : 'show'); },
  clearAnnounce() { const el = this.el.announce; el.classList.remove('show', 'hold'); el.innerHTML = ''; },
};

// ============================================================================
// INTRO CINEMATICS (random each fight)
// ============================================================================
const Intro = {
  start(kind) {
    const [a, b] = Game.f; this.kind = kind; this.t = 0; this.done = false; this.objs = [];
    for (const f of Game.f) { f.setState('cine'); f.cineAir = false; f.cinePose = null; }
    Cam.set('cine', 4);
    const A = Game.spawn[0], B = Game.spawn[1];
    if (kind === 'drop') {
      this.T = 7.2; b.place(B.x, B.z, Math.atan2(A.x - B.x, A.z - B.z)); b.cinePose = tauntPose;
      a.place(A.x, A.z, Math.atan2(B.x - A.x, B.z - A.z)); a.cineAir = true; a.pos.y = 18; a.cinePose = hangPose;
      this.helis = [];
      for (let i = 0; i < 4; i++) { const h = new Heli(Arena.group, 0, 0, 0, 0); h.manual = true; h.beam.visible = false; this.helis.push(h); }
      this.cables = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(new Array(8).fill(0).map(() => V3())), new THREE.LineBasicMaterial({ color: 0x111111 }));
      scene.add(this.cables); this.objs.push(this.cables);
      speak('Drop zone confirmed. Releasing ' + a.def.name + '!');
    } else if (kind === 'flyin') {
      this.T = 6.6; a.place(A.x, A.z - 7 * a.S, 0); a.cinePose = null;
      const B0 = V3(B.x + 16, 12, B.z + 22); b.place(B0.x, B0.z, Math.atan2(A.x - B0.x, A.z - B0.z)); b.pos.y = 12; b.cineAir = true; b.cinePose = flyPose;
      this.from = B0;
      speak(a.def.name + ' on patrol. Incoming contact!');
    } else {
      this.T = 7.6;
      if (Arena.id === 'city') {
        A.z = 15.5; B.z = 11; A.x = -1.2; B.x = 1.2; Game.spawn = [A, B];
        a.place(-2.4, 31, Math.PI); b.place(2.4, 30, Math.PI);
        a.pos.y = -1.6; b.pos.y = -1.6;
        speak('Two signatures surfacing in the harbor!');
      } else {
        a.place(A.x, A.z, Math.atan2(B.x - A.x, B.z - A.z)); b.place(B.x, B.z, Math.atan2(A.x - B.x, A.z - B.z));
        a.pos.y = -3.2 * a.S; b.pos.y = -3.2 * b.S; a.cineAir = b.cineAir = true;
        speak('Seismic contact. They are coming up out of the sand!');
      }
    }
    HUD.announce(`<small>${MAPS.find(m => m.id === Arena.id).name.toUpperCase()}</small>`, false);
  },
  update(rdt) {
    const [a, b] = Game.f, t = (this.t += rdt), A = Game.spawn[0], B = Game.spawn[1];
    const cp = Cam.cinePos, cl = Cam.cineLook;
    if (this.kind === 'drop') {
      const relT = 3.4;
      if (t < relT) {
        const hy = lerp(26, 10.5, easeOut(t / relT)) * Math.max(1, a.S * 0.9);
        a.pos.y = hy - 3.3 * a.S; a.yaw = Math.atan2(B.x - A.x, B.z - A.z) + Math.sin(t * 0.8) * 0.1;
        a.rig.root.updateMatrixWorld(true);
        const anchors = [a.rig.shL, a.rig.shR, a.rig.shL, a.rig.shR];
        const pa = this.cables.geometry.attributes.position;
        this.helis.forEach((h, i) => {
          const ang = a.yaw + [0.7, -0.7, 2.4, -2.4][i];
          h.g.position.set(a.pos.x + Math.sin(ang) * 1.6, hy + Math.sin(t * 2 + i) * 0.08, a.pos.z + Math.cos(ang) * 1.6); h.g.rotation.set(0.05, ang + Math.PI, 0.05);
          const ap = anchors[i].getWorldPosition(_c3);
          pa.setXYZ(i * 2, h.g.position.x, h.g.position.y - 0.05, h.g.position.z); pa.setXYZ(i * 2 + 1, ap.x, ap.y, ap.z);
        });
        pa.needsUpdate = true;
        cp.set(B.x + 2.5, 0.9, B.z + 2); cl.set(a.pos.x, a.pos.y + 1.2 * a.S, a.pos.z);
      } else {
        if (!this.released) { this.released = true; this.cables.visible = false; a.vy = -1; SFX.clank(1.4); SFX.hiss(1); a.cinePose = fallPose; }
        this.helis.forEach((h, i) => { h.g.position.y += rdt * 3; h.g.position.x += Math.sin(i * 1.7) * rdt * 2; });
        if (!this.landed) {
          a.vy -= GRAV * 1.3 * rdt; a.pos.y += a.vy * rdt;
          cp.set(A.x + 4.5 * a.S, 0.6, A.z - 3); cl.set(a.pos.x, Math.max(1, a.pos.y + 1), a.pos.z);
          if (a.pos.y <= 0) { a.pos.y = 0; this.landed = t; a.cineAir = false; a.plantFeet(); a.cinePose = landPose; a.landT = 0; impactLanding(a, 1.6); }
        } else {
          a.landT += rdt; if (a.landT > 1.1) a.cinePose = null;
          faceOff(cp, cl, a, b, t - this.landed);
        }
      }
    } else if (this.kind === 'flyin') {
      const walkEnd = 3.0, flyStart = 2.0, flyT = 2.2;
      if (t < walkEnd) { a.pos.z = lerp(A.z - 7 * a.S, A.z, t / walkEnd); a.pos.x = A.x; a.vel.set(0, 0, 7 * a.S / walkEnd); a.speedNow = 1; }
      else { a.vel.set(0, 0, 0); a.speedNow = 0; a.pos.x = A.x; a.pos.z = A.z; }
      if (t < flyStart + flyT) {
        const k = clamp((t - flyStart) / flyT, 0, 1);
        if (t > flyStart) {
          b.pos.lerpVectors(this.from, V3(B.x, 0, B.z), k); b.pos.y = lerp(12, 0, k) + Math.sin(k * Math.PI) * 4;
          for (let i = 0; i < 3; i++) FX.thruster(b.rig.chest.localToWorld(_c3.set(rand(-.4, .4), 0, -0.6)), _c4.set(0, -0.5, 0).add(b.forward(V3()).negate()), b.S * 1.5);
          if (Math.random() < 0.2) SFX.hiss(0.4);
        }
        cp.set(a.pos.x - 2.5 * a.S, 1.6 * a.S, a.pos.z - 3.5 * a.S); cl.set(a.pos.x, 1.4 * a.S, a.pos.z + 3);
        if (t > flyStart + 0.5) cl.lerp(b.rig.root.position, 0.6);
      } else {
        if (!this.landed) { this.landed = t; b.pos.set(B.x, 0, B.z); b.cineAir = false; b.plantFeet(); b.cinePose = landPose; b.landT = 0; impactLanding(b, 1.8); }
        b.landT += rdt; if (b.landT > 1.1) b.cinePose = null;
        faceOff(cp, cl, a, b, t - this.landed);
      }
      b.yaw = Math.atan2(a.pos.x - b.pos.x, a.pos.z - b.pos.z); a.yaw = 0;
    } else {
      if (Arena.id === 'city') {
        for (const [f, delay, P] of [[b, 0, B], [a, 0.6, A]]) {
          const k = clamp((t - delay) / 5.2, 0, 1);
          const sx = f === a ? -2.4 : 2.4, sz = f === a ? 31 : 30;
          f.pos.x = lerp(sx, P.x, k); f.pos.z = lerp(sz, P.z, k); f.pos.y = lerp(-1.6, 0, clamp(k * 1.6, 0, 1));
          f.vel.set(0, 0, k < 1 ? -(sz - P.z) / 5.2 : 0); f.speedNow = k < 1 ? 1 : 0;
          f.yaw = k < 0.92 ? Math.PI : f.yaw;
          const wl = -0.32, chestY = f.chestW.y;
          if (k > 0 && k < 1 && chestY > wl - 1 && Math.random() < 0.5) { FX.splash(_c3.set(f.pos.x + rand(-.5, .5), wl, f.pos.z + rand(-.5, .5)), 0.4 * f.S); }
          if (k > 0.2 && k < 1) for (let i = 0; i < 2; i++) { const s = (Math.random() < 0.5 ? f.rig.shL : f.rig.shR).getWorldPosition(_c4); if (s.y > wl) FX.smoke.emit(s.x + rand(-.2, .2), s.y, s.z + rand(-.2, .2), rand(-.3, .3), -0.5, rand(-.3, .3), 0.9, 0.06, 0.02, 0.7, 0.8, 0.85, 0.7, 6, 0.2); }
        }
        if (t > 5.9) { a.yaw = damp(a.yaw, Math.atan2(b.pos.x - a.pos.x, b.pos.z - a.pos.z), 4, rdt); b.yaw = damp(b.yaw, Math.atan2(a.pos.x - b.pos.x, a.pos.z - b.pos.z) + (b.yaw - Math.PI > 0 ? 0 : 0), 4, rdt); }
        if (t < 4) { cp.set(0, 0.25, 20.8); cl.set(0, 0.6, 28); } else faceOff(cp, cl, a, b, t - 4);
      } else {
        for (const [f, delay] of [[b, 0], [a, 0.9]]) {
          const k = clamp((t - delay) / 3.2, 0, 1); f.pos.y = lerp(-3.2 * f.S, 0, easeOut(k));
          if (k > 0 && k < 1) { if (Math.random() < 0.6) FX.dust(_c3.set(f.pos.x + rand(-.6, .6), f.ground(), f.pos.z + rand(-.6, .6)), 0.8 * f.S, Arena.dustColor); const s = f.rig.shL.getWorldPosition(_c4); FX.smoke.emit(s.x, s.y, s.z, rand(-.3, .3), -0.4, rand(-.3, .3), 1.0, 0.08, 0.04, 0.75, 0.58, 0.42, 0.9, 5, 0.2); Game.shake(0.02); }
          if (k >= 1 && f.cineAir) { f.cineAir = false; f.plantFeet(); SFX.land(1); }
          if (k > 0 && !f.rumbled) { f.rumbled = true; SFX.crumble(1.5); }
        }
        if (t < 3) { cp.set(B.x - 3, 0.8, B.z - 5.5); cl.set(B.x, 0.6 + b.pos.y + 2, B.z); } else faceOff(cp, cl, a, b, t - 3);
      }
    }
    if (t > this.T - 1.4 && !this.carded) { this.carded = true; HUD.announce(`${a.def.name}<small>VS</small>${b.def.name}`, false); }
    if (t > this.T) this.finish();
  },
  finish() {
    if (this.done) return; this.done = true;
    const [a, b] = Game.f, A = Game.spawn[0], B = Game.spawn[1];
    (this.helis || []).forEach(h => h.g.removeFromParent()); this.helis = null;
    this.objs.forEach(o => o.removeFromParent());
    for (const [f, P, o] of [[a, A, B], [b, B, A]]) { f.cineAir = false; f.cinePose = null; f.place(P.x, P.z, Math.atan2(o.x - P.x, o.z - P.z)); f.setState('idle'); }
    Game.beginFight();
  },
};
function faceOff(cp, cl, a, b, t) {
  const m = _c3.addVectors(a.pos, b.pos).multiplyScalar(0.5); const S = (a.S + b.S) / 2;
  const dir = _c4.subVectors(b.pos, a.pos).normalize(); const ang = Math.atan2(dir.x, dir.z) + Math.PI / 2 + t * 0.12;
  cp.set(m.x + Math.sin(ang) * 6.5 * S, Arena.groundAt(m.x, m.z) + 1.1 * S, m.z + Math.cos(ang) * 6.5 * S); cl.set(m.x, Arena.groundAt(m.x, m.z) + 1.7 * S, m.z);
}
function impactLanding(f, k) {
  const p = f.pos.clone(); p.y = f.ground();
  FX.ring(p, 3.2 * f.S, [3, 2.4, 1.6], 0.8); FX.dust(p, 2 * k * f.S, Arena.dustColor); SFX.boom(1); SFX.land(1.4); Cam.shake(0.9); Game.flash(0.2);
  Arena.crushCars(p, 1.8 * f.S);
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; FX.spark(V3(p.x + Math.cos(a) * 0.8, p.y + 0.1, p.z + Math.sin(a) * 0.8), V3(Math.cos(a), 0.6, Math.sin(a)), 8, 5); }
}
function hangPose(hands, P, shH, legs) { for (const s of [1, -1]) { hands[s].p.set(s * 0.45, shH + 0.75, 0.05); hands[s].pole.set(s, 0, -0.5); } P.lean -= 0.05; P.crouch -= 0.06; }
function fallPose(hands, P, shH) { for (const s of [1, -1]) { hands[s].p.set(s * 0.9, shH + 0.35, 0.1); hands[s].pole.set(s, 0.4, -0.4); } P.lean += 0.1; }
function landPose(hands, P, shH) { const k = Math.max(0, 1 - (this.landT || 0) / 1.1); for (const s of [1, -1]) hands[s].p.set(s * 0.45, lerp(shH, 0.15, k * 0.9), 0.75); hands[1].p.y = lerp(shH, 0.05, k); P.crouch += 0.42 * k; P.lean += 0.5 * k; }
function tauntPose(hands, P, shH) { const t = this.time; hands[1].p.set(0.3, shH + 0.1 + Math.sin(t * 6) * 0.06, 0.65); hands[-1].p.set(-0.55, shH + 0.75, 0.25); P.lean -= 0.08; }
function flyPose(hands, P, shH) { for (const s of [1, -1]) { hands[s].p.set(s * 0.6, shH - 0.35, -0.35); hands[s].pole.set(s, 0.3, -0.6); } P.lean += 0.35; }

// ============================================================================
// GAME FLOW
// ============================================================================
const LADDER_ORDER = ['spectra', 'torque', 'belljar', 'onyx', 'warden', 'mire', 'bulwark'];
const LADDER_DIFF = ['rookie', 'rookie', 'contender', 'contender', 'champion'];
const LADDER_ARENA = ['city', 'desert', 'city', 'desert', 'city'];

const Game = {
  mode: 'menu', f: null, showcase: null, time: 0, frameN: 0, paused: false, excite: 0.1, hitstopT: 0, slowT: 0, timeScale: 1, round: 1, rounds: 1, clock: 240, training: false, missiles: [], ghosts: [], grab: null, clash: null,
  opponentOf(f) { return this.f ? (this.f[0] === f ? this.f[1] : this.f[0]) : null; },
  setShowcase(id) {
    if (this.showcase && this.showcase.def.id === id) return;
    if (this.showcase) this.showcase.dispose();
    this.showcase = new Fighter(ROBOT(id), 0);
    const p = Arena.id === 'city' ? V3(0, 0, -2.5) : V3(0, 0, 0);
    this.showcase.place(p.x, p.z, 0.4);
  },
  clearFight() {
    if (this.f) this.f.forEach(f => f.dispose());
    this.f = null; FX.clear(); Popups.clear(); HUD.clearAnnounce(); HUD.prompt(null);
    this.missiles.forEach(m => m.mesh && m.mesh.removeFromParent()); this.missiles = [];
    this.ghosts.forEach(g => { g.R.root.removeFromParent(); g.R.dispose(); }); this.ghosts = [];
    this.grab = null; this.clash = null;
    if (Intro.helis) { Intro.helis.forEach(h => h.g.removeFromParent()); Intro.helis = null; }
  },
  startFight(cfg) {
    this.cfg = cfg; this.clearFight();
    if (this.showcase) { this.showcase.dispose(); this.showcase = null; }
    const mapId = cfg.arena === 'random' ? pick(['city', 'desert']) : cfg.arena;
    Arena.dispose(); Arena.load(mapId);
    const a = new Fighter(ROBOT(cfg.p1), 0), b = new Fighter(ROBOT(cfg.p2), 1);
    this.f = [a, b];
    this.training = !!cfg.training;
    this.ai = new AI(b, a, cfg.diff || 'contender', this.training ? 'idle' : 'fight');
    this.round = 1; this.rounds = 1; this.clock = 240;
    this.mode = 'fight'; this.paused = false; this.hitstopT = 0; this.slowT = 0; this.excite = 0.2; this.time = 0;
    HUD.setNames(a, b);
    UI.hideAll(); $('hud').hidden = false; $('touch').hidden = !IS_TOUCH; $('train').hidden = !this.training;
    $('getup').hidden = true; $('hint').hidden = false; $('hint').classList.remove('off'); clearTimeout(this._hintT); this._hintT = setTimeout(() => $('hint').classList.add('off'), 18000);
    this.spawn = [V3(0, 0, -3.2 * (a.S + b.S) / 2), V3(0, 0, 3.2 * (a.S + b.S) / 2)];
    Music.mode = 'fight';
    if (this.training) { for (const [f, P, o] of [[a, this.spawn[0], this.spawn[1]], [b, this.spawn[1], this.spawn[0]]]) f.place(P.x, P.z, Math.atan2(o.x - P.x, o.z - P.z)); this.phase = 'fight'; Cam.set('fight', 3); HUD.announce('SPAR<small>7 idle · 8 block · 9 fight back</small>'); this.trainInfo(); }
    else { this.phase = 'intro'; this.phaseT = 0; Intro.start(pick(['drop', 'flyin', 'emerge'])); SFX.cheer(1); }
  },
  beginFight() {
    this.phase = 'fight'; this.phaseT = 0; Cam.set('fight', 2.5); Cam.pos.copy(camera.position);
    SFX.bell(1); HUD.announce('FIGHT!'); speak('Fight!', 1.1);
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
    g.uFlash.value = damp(g.uFlash.value, 0, 8, rdt);
    g.uAberr.value = damp(g.uAberr.value, 0.0015, 6, rdt);
    g.uDesat.value = damp(g.uDesat.value, this.slowT > 0 ? 0.3 : 0, 4, rdt);
    if (this.mode === 'fight' && this.f) { SFX.servo(0, this.f[0].speedNow); SFX.servo(1, this.f[1].speedNow); } else if (SFX.ready) { SFX.servo(0, 0); SFX.servo(1, 0); }
    SFX.crowd(this.mode === 'fight' ? 0.04 + this.excite * 0.12 : 0.02);
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
    this.timeScale = damp(this.timeScale, this.slowT > 0 ? 0.3 : 1, 8, rdt);
    const dt = rdt * (this.hitstopT > 0 ? 0.05 : this.timeScale);
    this.phaseT = (this.phaseT || 0) + rdt;
    const [a, b] = this.f;
    let ia = { mx: 0, mz: 0 }, ib = { mx: 0, mz: 0 };
    switch (this.phase) {
      case 'intro': Intro.update(rdt); if (this.phaseT > 1 && Input.anyPunch() && this.phase === 'intro') Intro.finish(); break;
      case 'fight':
        ia = Input.playerIntent(); ib = this.ai.think(dt);
        if (!this.training) { this.clock -= dt; if (this.clock <= 0) { this.clock = 0; this.decision(); } }
        else this.trainingTick();
        break;
      case 'knockdown': this.knockdownTick(rdt, dt); break;
      case 'ko': if (this.phaseT > 5.5 || (this.phaseT > 2.5 && Input.anyPunch())) this.showResults(); break;
      case 'decision': if (this.phaseT > 4.5 || (this.phaseT > 2 && Input.anyPunch())) this.showResults(); break;
    }
    a.update(dt, b, ia); b.update(dt, a, ib);
    this.updateGrab(dt); this.updateClash(rdt, dt);
    this.constrain(dt);
    a.animate(dt, b); b.animate(dt, a);
    updateMissiles(dt); this.updateGhosts(dt);
    this.excite = damp(this.excite, 0.18, 0.5, rdt);
    return dt;
  },
  constrain(dt) {
    const [a, b] = this.f;
    const sa = !a.rag && a.state !== 'cine', sb = !b.rag && b.state !== 'cine';
    const dx = b.pos.x - a.pos.x, dz = b.pos.z - a.pos.z, d = Math.hypot(dx, dz) || 1e-3;
    if (sa && sb && !this.grab && !this.clash && Math.abs(a.pos.y - b.pos.y) < 1.5) {
      const min = a.radius + b.radius;
      if (d < min) { const push = (min - d), nx = dx / d, nz = dz / d, wa = b.weight / (a.weight + b.weight); a.pos.x -= nx * push * wa; a.pos.z -= nz * push * wa; b.pos.x += nx * push * (1 - wa); b.pos.z += nz * push * (1 - wa); }
    }
    const B = Arena.bound;
    for (const f of this.f) {
      if (f.rag || f.state === 'cine' || f.state === 'grabbed') continue;
      const sp = Math.hypot(f.knock.x, f.knock.z);
      const before = _c3.copy(f.pos);
      const hit = Arena.collide(f.pos, f.radius, f.pos.y + 0.1, f.pos.y + 2 * f.S);
      if (hit && sp > 2.4 * f.S) this.wallSlam(f, before, sp);
      for (const ax of ['x', 'z']) {
        const lo = ax === 'x' ? B.x0 : B.z0, hi = ax === 'x' ? B.x1 : B.z1;
        if (f.pos[ax] < lo || f.pos[ax] > hi) { f.pos[ax] = clamp(f.pos[ax], lo, hi); f.knock[ax] *= -0.3; }
      }
    }
  },
  wallSlam(f, p, sp) {
    const dir = V3(f.knock.x, 0, f.knock.z).normalize();
    const c = p.clone().addScaledVector(dir, f.radius); c.y = f.ground() + f.def.dims.hipH * f.S * 1.2;
    Arena.impact(c, (0.55 + sp * 0.08) * f.S, sp * 0.9, dir);
    const dmg = sp * 9; f.hp -= dmg; f.chipDelay = 0.6; f.knock.multiplyScalar(0.2);
    f.setState('hitstun', 0.45); Popups.show('SLAMMED', f.headW.clone().add(V3(0, 0.6, 0)), 'r');
    this.shake(0.5); this.hitstop(0.08); SFX.impact(1.4, false, 0.7);
    const o = this.opponentOf(f); o.stats.wrecked++; o.stats.dmg += dmg;
    if (f.hp <= 0) this.knockdown(f, o, dir, 1.2);
  },
  bodySlam(f, p, v, sp) {
    const dir = v.clone().setY(0).normalize();
    const n = Arena.impact(p, (0.45 + sp * 0.06) * f.S, sp * 0.6, dir);
    if (!n) return;
    const dmg = Math.min(90, sp * 6); f.hp -= dmg; f.chipDelay = 0.6; this.shake(0.55); SFX.impact(1.5, false, 0.6);
    const o = this.opponentOf(f); o.stats.wrecked++; o.stats.dmg += dmg;
    if (!f._slamPop || this.time - f._slamPop > 1) { f._slamPop = this.time; Popups.show('THROUGH THE WALL', p.clone().add(V3(0, 0.8, 0)), 'r'); this.onCrowd(1); }
    if (f.hp <= 0 && f.state === 'launched') this.knockdown(f, o, dir, 1.2);
  },
  // ---------------------------------------------- grabs
  startGrab(a, d) {
    if (d.state === 'ability' && d.ab && d.ab.cancel) d.ab.cancel(d);
    if (d.held) { d.held.state = 'rest'; d.held = null; }
    a.setState('grabbing'); a.grabbing = d; a.grabT = 0; a.knees = 0; a.kneeT = 0; a.kneeHit = 0;
    d.setState('grabbed'); d.grabbedBy = a; d.blocking = false;
    this.grab = { a, d, meter: 0 };
    SFX.clank(1.4); SFX.impact(0.8, true); Popups.show('GRABBED', d.headW.clone().add(V3(0, 0.6, 0)), 'y'); this.shake(0.25);
  },
  updateGrab(dt) {
    const g = this.grab; if (!g) return;
    const { a, d } = g;
    if (a.state !== 'grabbing' || d.state !== 'grabbed') { this.endGrab(a, d, false, true); return; }
    const fwd = a.forward(_c3);
    d.pos.set(a.pos.x + fwd.x * (a.radius + d.radius) * 0.78, (a.weight > d.weight * 0.8 ? 0.3 * a.S : 0.06), a.pos.z + fwd.z * (a.radius + d.radius) * 0.78);
    d.yaw = a.yaw + Math.PI; d.vel.set(0, 0, 0); d.knock.set(0, 0, 0);
    const ratio = Math.pow(d.weight / a.weight, 0.3);
    if (d.idx === 0) g.meter += Input.mash() * 11 * ratio; else g.meter += this.ai.mashRate * dt * 9 * ratio * rand(0.6, 1.4);
    g.meter = Math.max(0, g.meter - dt * 14);
    if (d.idx === 0) HUD.prompt('MASH SPACE TO BREAK FREE', g.meter / 100);
    else if (a.idx === 0) HUD.prompt('J KNEE · G THROW (aim with WASD)', 1 - a.grabT / 2.8);
    if (g.meter >= 100) this.endGrab(a, d, true);
  },
  endGrab(a, d, escaped, silent) {
    if (!this.grab) return; this.grab = null; HUD.prompt(null);
    a.grabbing = null; d.grabbedBy = null; d.pos.y = Math.max(0, d.pos.y);
    if (a.state === 'grabbing') a.setState(escaped ? 'stagger' : 'idle', 0.55);
    if (d.state === 'grabbed') { d.setState('idle'); d.plantFeet(); }
    if (escaped) { const dir = V3(d.pos.x - a.pos.x, 0, d.pos.z - a.pos.z).normalize(); d.knock.addScaledVector(dir, 3 * d.S); a.knock.addScaledVector(dir, -2 * a.S); Popups.show('BROKE FREE', d.headW.clone().add(V3(0, 0.6, 0)), 'g'); SFX.impact(1, true); this.shake(0.3); }
  },
  throwGrabbed(a, it) {
    const g = this.grab; if (!g) return; const d = g.d;
    const fwd = a.forward(V3()), left = V3(Math.cos(a.yaw), 0, -Math.sin(a.yaw));
    let dir;
    if (a.idx === 0) { dir = V3().addScaledVector(fwd, (it.mz || 0)).addScaledVector(left, (it.mx || 0)); if (dir.lengthSq() < 0.05) dir.copy(fwd); dir.normalize(); }
    else dir = Arena.nearestBuildingDir(a.pos) || fwd;
    a.yaw = Math.atan2(dir.x, dir.z);
    this.endGrab(a, d, false);
    const strength = Math.pow(a.weight, 0.4) / Math.pow(d.weight, 0.5);
    d.hp -= 40 * a.powerMul; a.stats.dmg += 40 * a.powerMul; a.stats.throws++;
    d.launch(dir, (8 + a.def.stats.power * 0.6) * strength * a.S, 3.4);
    a.setState('stagger', 0.35);
    Popups.show('THROWN', d.headW.clone().add(V3(0, 0.6, 0)), 'r'); SFX.whoosh(2); SFX.hiss(1); this.shake(0.4); this.slowT = 0.5; this.onCrowd(1);
    if (d.hp <= 0) this.knockdown(d, a, dir, 1.5);
  },
  // ---------------------------------------------- clash
  startClash(a, d, point) {
    for (const f of [a, d]) { f.clashHand = f.move.hand || 1; f.setState('clash'); f.blocking = false; }
    this.clash = { a, d, t: 0, sa: 0, sd: 0, point: point.clone() };
    this.slowT = 1.9; this.hitstop(0.12); Cam.set('clash', 4); Cam.fovKick = -8;
    FX.burst(point, [4, 3.4, 2], 3); FX.spark(point, V3(0, 1, 0), 80, 10, [4, 3, 1.8]); FX.flash(point, 0xffe0b0, 120, 12); FX.ring(point.clone().setY(Arena.groundAt(point.x, point.z)), 3, [3, 2.6, 2], 0.6);
    SFX.impact(1.6, true); SFX.impact(1.4, false); SFX.boom(0.6); this.flash(0.35);
    HUD.announce('CLASH!');
  },
  updateClash(rdt, dt) {
    const c = this.clash; if (!c) return; const { a, d } = c;
    c.t += rdt;
    for (const [f, o] of [[a, d], [d, a]]) {
      const n = f.idx === 0 ? Input.mashPunch() : (Math.random() < rdt * this.ai.mashRate * 1.1 ? 1 : 0);
      if (f === a) c.sa += n; else c.sd += n;
      f.knock.set(0, 0, 0);
    }
    const p = this.f[0], q = this.f[1];
    const sp = p === a ? c.sa : c.sd, sq = p === a ? c.sd : c.sa;
    HUD.prompt('CLASH! MASH PUNCH', clamp(0.5 + (sp - sq) / 16, 0, 1));
    const dir = V3(d.pos.x - a.pos.x, 0, d.pos.z - a.pos.z).normalize();
    c.point.copy(a.pos).addScaledVector(dir, a.radius + (Math.hypot(d.pos.x - a.pos.x, d.pos.z - a.pos.z) - a.radius - d.radius) / 2 + 0.3).setY(Math.min(a.chestW.y, d.chestW.y) + 0.15);
    if (Math.random() < 0.6) FX.spark(c.point, V3(rand(-1, 1), 1, rand(-1, 1)), 6, 6, [4, 3, 1.6], 1, 0.3);
    if (Math.random() < 0.15) { this.shake(0.12); SFX.clank(0.7); }
    if (c.t > 1.7) {
      HUD.prompt(null); this.clash = null; Cam.set('fight', 3);
      const aWins = c.sa === c.sd ? Math.random() < 0.5 : c.sa > c.sd;
      const w = aWins ? a : d, l = aWins ? d : a;
      w.setState('idle'); l.setState('idle');
      FX.explode(c.point.clone(), 0.9);
      l.hp -= 60 * w.powerMul; w.stats.dmg += 60 * w.powerMul;
      l.launch(V3(l.pos.x - w.pos.x, 0, l.pos.z - w.pos.z).normalize(), 6.5 * w.S, 2.4);
      Popups.show(w.idx === 0 ? 'CLASH WON' : 'CLASH LOST', c.point.clone().add(V3(0, 1, 0)), w.idx === 0 ? 'y' : 'r');
      SFX.boom(1); this.shake(0.7); this.onCrowd(1.2);
      if (l.hp <= 0) this.knockdown(l, w, V3(l.pos.x - w.pos.x, 0, l.pos.z - w.pos.z).normalize(), 1.5);
    }
  },
  // ---------------------------------------------- misc combat hooks
  explosion(p, r, dmg, src) {
    FX.explode(p, r / 2); SFX.boom(1.2); this.shake(0.6); this.flash(0.2);
    Arena.impact(p, r * 0.6, 6, null);
    for (const f of this.f || []) { if (f.isDown) continue; const c = f.chestW, d = c.distanceTo(p); if (d < r) { const dir = V3(c.x - p.x, 0, c.z - p.z).normalize(); f.hp -= dmg * (1 - d / r); f.launch(dir, 6 * (1 - d / r) + 2, 2.5); if (f.hp <= 0) this.knockdown(f, this.opponentOf(f), dir, 1.4); } }
  },
  propHit(q, f) {
    const a = q.thrower || this.opponentOf(f), sp = q.vel.length();
    abilityDamage(a, f, 45 + q.mass * 60 * clamp(sp / 12, 0.6, 1.4), q.vel.clone().setY(0).normalize(), { launch: q.mass > 0.9 ? 5 + q.mass * 2 : 0, knock: 3, up: 2.6, blockable: true, at: q.mesh.position.clone(), tags: [[q.kind === 'chunk' ? 'BUILDING CHUNK' : q.kind.toUpperCase(), 'y']] });
    if (q.explosive) this.explosion(q.mesh.position.clone(), 2.2, 120, a);
  },
  afterimage(f) {
    const R = buildRobot(f.def, { ghost: true }); R.root.scale.setScalar(f.S); scene.add(R.root);
    copyPose(f.rig, R); R.root.position.copy(f.rig.root.position); R.root.quaternion.copy(f.rig.root.quaternion);
    R.ghostMat.color.set(0xff70d0).multiplyScalar(0.8);
    this.ghosts.push({ R, t: 0 });
  },
  updateGhosts(dt) { for (let i = this.ghosts.length - 1; i >= 0; i--) { const g = this.ghosts[i]; g.t += dt; g.R.ghostMat.opacity = 0.45 * (1 - g.t / 0.7); if (g.t > 0.7) { g.R.root.removeFromParent(); g.R.dispose(); this.ghosts.splice(i, 1); } } },
  onAbility(f, A) { if (A.name && f.idx === 0) HUD.announce(`<small>${A.name.toUpperCase()}</small>`); Cam.fovKick = 3; this.excite = Math.min(1, this.excite + 0.3); },
  onDestruction(p, n) { this.excite = Math.min(1, this.excite + n / 80); const d = camera.position.distanceTo(p); this.shake(Math.min(0.5, n / 60) * clamp(1.4 - d / 14, 0.2, 1)); },
  onCollapse(b) { SFX.boom(1.4); const c = V3((b.x0 + b.x1) / 2, b.nh * CH * 0.6, (b.z0 + b.z1) / 2); if (camera.position.distanceTo(c) < 25) Popups.show('BUILDING DOWN', c, 'y'); this.shake(0.5); this.onCrowd(1); },
  flash(v) { gradePass.uniforms.uFlash.value = Math.max(gradePass.uniforms.uFlash.value, v); },
  // ---------------------------------------------- knockdowns
  knockdown(v, a, dir, p) {
    if (this.training) { v.hp = v.maxHp; v.hpChip = v.maxHp; Popups.show('RESET', v.headW.clone().add(V3(0, 0.6, 0)), 'g'); return; }
    if (this.phase !== 'fight') { v.hp = Math.max(1, v.hp); return; }
    if (this.grab) this.endGrab(this.grab.a, this.grab.d, false, true);
    if (this.clash) { this.clash = null; HUD.prompt(null); }
    if (v.state === 'ability' && v.ab && v.ab.cancel) v.ab.cancel(v);
    if (v.held) { v.held.state = 'rest'; v.held = null; }
    v.hp = 0; v.kd++;
    if (!v.rag || v.rag.frozen) v.startRagdoll(dir, 3.2 * v.S + p * 2);
    v.setState('down');
    a.stats.kd++; a.stats.roundKd[0]++;
    if (a.state === 'punch') a.queued = null;
    this.phase = 'knockdown'; this.phaseT = 0; this.count = 0; this.countT = -1.4; this.victim = v; this.attacker = a; this.getup = 0; this.rising = false;
    this.slowT = 1.4; Cam.set('down', 2); Cam.shake(0.8); Cam.fovKick = -6;
    gradePass.uniforms.uFlash.value = 0.45; gradePass.uniforms.uAberr.value = 0.012;
    SFX.crash(); SFX.boom(0.8); this.excite = 1; rumble(1, 400);
    HUD.announce(v.kd >= 3 ? 'SYSTEM FAILURE' : 'MECH DOWN');
    speak(v.kd >= 3 ? `${v.def.name} is finished!` : `${v.def.name} is down!`, 1.05);
    this.tko = v.kd >= 3;
    if (!this.tko) {
      if (v.idx === 1) { const pr = DIFF[this.cfg.diff].rise[Math.min(1, v.kd - 1)]; this.riseAt = Math.random() < pr ? randi(3, 7) : 99; }
      else { $('getup').hidden = false; this.getupNeed = 100; }
    }
  },
  knockdownTick(rdt) {
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
      HUD.announce(`<small>REBOOT</small>${this.count}`); speak(String(this.count), 1.1); SFX.tick();
      const playerUp = v.idx === 0 && this.getup >= this.getupNeed && this.count >= 2;
      if ((v.idx === 1 && this.count >= this.riseAt) || playerUp) {
        this.rising = true; v.startRise(this.attacker.pos);
        v.hp = v.maxHp * [0.5, 0.33, 0.2][v.kd - 1]; v.hpChip = v.hp; v.stam = v.stamMax * 0.6;
        HUD.announce(`<small>${v.def.name.toUpperCase()} REBOOTED</small>`); SFX.cheer(1); $('getup').hidden = true;
      }
    }
  },
  finishKO(method) {
    const v = this.victim, w = this.attacker;
    this.phase = 'ko'; this.phaseT = 0; v.setState('ko'); if (!w.isDown) w.setState('victory'); w.blocking = false;
    this.winner = w; this.method = method; Cam.set('ko', 1.5); $('getup').hidden = true;
    HUD.announce(method === 'TKO' ? 'DESTROYED' : 'K.O.'); SFX.bell(4); SFX.cheer(2); this.excite = 1;
    speak(`${w.def.name} wins!`);
  },
  decision() {
    const [a, b] = this.f;
    const sa = a.stats.dmg + a.stats.kd * 300, sb = b.stats.dmg + b.stats.kd * 300;
    this.cards = [[Math.round(sa), Math.round(sb)]];
    this.winner = sa > sb ? a : sb > sa ? b : null; this.method = 'Decision';
    this.phase = 'decision'; this.phaseT = 0;
    if (this.winner) { if (!this.winner.isDown) this.winner.setState('victory'); this.victim = this.winner === a ? b : a; }
    HUD.announce(this.winner ? `${this.winner.def.name}<small>WINS ON DAMAGE · ${Math.round(sa)} TO ${Math.round(sb)}</small>` : `DRAW`, true);
    SFX.bell(3);
  },
  showResults() {
    if (this.mode !== 'fight') return;
    const [a, b] = this.f, win = this.winner === a, draw = !this.winner;
    this.mode = 'results'; $('hud').hidden = true; $('touch').hidden = true; HUD.prompt(null);
    $('res-title').textContent = draw ? 'Draw' : win ? 'Victory' : 'Defeat';
    $('res-title').className = 'res-title ' + (draw ? '' : win ? 'win' : 'lose');
    $('res-method').textContent = `${this.method === 'KO' ? 'Knockout' : this.method === 'TKO' ? 'Destroyed' : 'Time, damage decision'} · ${MAPS.find(x => x.id === Arena.id).name}`;
    $('res-line').textContent = draw ? 'The city is wrecked and nobody won.' : win ? `${a.def.name} stands over the wreck of ${b.def.name}.` : `${b.def.name} takes it. ${a.def.name} gets hauled back to the dry dock.`;
    const row = (l, x, y) => `<tr><th>${l}</th><td>${x}</td><td>${y}</td></tr>`;
    const acc = f => f.stats.thrown ? Math.round(f.stats.landed / f.stats.thrown * 100) + '%' : '—';
    $('res-table').innerHTML = `<thead><tr><th></th><th>${a.def.name}</th><th>${b.def.name}</th></tr></thead><tbody>` +
      row('Hits landed', `${a.stats.landed}/${a.stats.thrown}`, `${b.stats.landed}/${b.stats.thrown}`) + row('Accuracy', acc(a), acc(b)) +
      row('Damage dealt', Math.round(a.stats.dmg), Math.round(b.stats.dmg)) + row('Knockdowns', a.stats.kd, b.stats.kd) +
      row('Throws', a.stats.throws, b.stats.throws) + row('Things wrecked', a.stats.wrecked, b.stats.wrecked) + row('Best combo', a.stats.maxCombo, b.stats.maxCombo) +
      row('Armor left', Math.round((a.parts.head + a.parts.core + a.parts.armL + a.parts.armR) / 4) + '%', Math.round((b.parts.head + b.parts.core + b.parts.armL + b.parts.armR) / 4) + '%') + '</tbody>';
    $('res-cards').textContent = '';
    const circ = this.cfg.circuit;
    $('res-next').hidden = !(circ && win && this.cfg.rung < 4);
    if (circ && win) { const s = store.get('circuit', null) || { robot: a.def.id, beaten: 0 }; s.beaten = Math.max(s.beaten, this.cfg.rung + 1); store.set('circuit', s); if (this.cfg.rung >= 4) $('res-line').textContent = `${a.def.name} is the last mech standing. Every city, every desert, beaten.`; }
    $('res-again').textContent = circ && !win ? 'Retry' : 'Rematch';
    UI.show('s-results', false);
    Music.mode = 'menu';
  },
  togglePause(force) {
    if (this.mode !== 'fight') return;
    this.paused = force === true ? true : !this.paused;
    if (this.paused) { UI.show('s-pause', false); $('pause-title').textContent = this.training ? 'Training' : 'Paused'; Music.mode = 'menu'; }
    else { UI.hideAll(); Music.mode = 'fight'; }
  },
  quitToMenu() {
    this.paused = false; this.clearFight(); this.mode = 'menu'; $('hud').hidden = true; $('touch').hidden = true;
    Music.mode = 'menu'; Cam.set('menu', 2);
    this.setShowcase(UI.sel.p1 || 'bulwark');
    UI.show('s-title', false); UI.stack = [];
  },
  hitstop(t) { this.hitstopT = Math.max(this.hitstopT, t); },
  footShake(p, w) { if (this.mode !== 'fight') return; const d = camera.position.distanceTo(p); Cam.shake(Math.max(0, 0.05 * w - d * 0.006)); },
  shake(a) { Cam.shake(a); },
  onHit(a, d, dmg, mv, body) {
    this.excite = Math.min(1, this.excite + dmg / 350);
    rumble(d.idx === 0 ? 0.4 + dmg / 150 : 0.15 + dmg / 300, 60 + dmg);
    if (mv.power > 0.9) { Cam.fovKick = -2.5; gradePass.uniforms.uAberr.value = 0.006; }
    if (d.idx === 0) this.flash(0.06 + dmg / 900);
    if (this.training) this.trainInfo(dmg, mv, body);
  },
  onParry() { this.excite = Math.min(1, this.excite + 0.25); },
  onSlip() { this.excite = Math.min(1, this.excite + 0.08); },
  onCrowd(v) { this.excite = Math.min(1, this.excite + v * 0.3); },
  toast(t) { Popups.show(t, V3().copy(Cam.look).add(V3(0, 1.4, 0)), 'g'); },
  trainingTick() {
    const k = ['Digit7', 'Digit8', 'Digit9', 'Numpad7', 'Numpad8', 'Numpad9'].find(c => Input.edge.has(c));
    if (k) { const n = k.slice(-1); this.ai = new AI(this.f[1], this.f[0], 'contender', n === '7' ? 'idle' : n === '8' ? 'block' : 'fight'); this.toast(n === '7' ? 'DUMMY: IDLE' : n === '8' ? 'DUMMY: BLOCKING' : 'DUMMY: FIGHTS BACK'); this.trainInfo(); }
    for (const f of this.f) if (f.hp < f.maxHp * 0.3 && f.sinceHit > 2 && !f.isDown) { f.hp = f.maxHp; f.hpChip = f.hp; }
  },
  trainInfo(dmg, mv, body) {
    if (dmg) this.lastHit = `${body ? 'BODY ' : ''}${(mv.name || '').toUpperCase()} <b>${Math.round(dmg)}</b>`;
    const a = this.f[0];
    $('train').innerHTML = `DUMMY <b>${this.ai.mode.toUpperCase()}</b> · 7 8 9 TO SWITCH<br>LAST HIT ${this.lastHit || '—'}<br>BEST COMBO <b>${a.stats.maxCombo}</b> · HEIGHT ${(a.def.dims.hipH * 2.1 * a.S * 28).toFixed(0)} M · WEIGHT ${(a.weight * 2400).toFixed(0)} T`;
  },
};

// ============================================================================
// MENUS
// ============================================================================
const UI = {
  stack: [], sel: { p1: 'bulwark', p2: 'onyx', arena: ['city', 'desert', 'random'].includes(settings.lastArena) ? settings.lastArena : 'city', diff: 'contender' }, flow: null, step: 1,
  init() {
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { SFX.ui(); this.go(b.dataset.go); }));
    document.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => { SFX.ui(); this.back(); }));
    const cards = $('cards');
    ROBOTS.forEach(r => {
      const c = document.createElement('button'); c.className = 'card'; c.dataset.id = r.id;
      const sw = [r.colors.primary, r.colors.secondary, r.colors.accent].map(x => `<i style="background:#${x.toString(16).padStart(6, '0')}"></i>`).join('');
      c.innerHTML = `<div class="sw">${sw}</div><b>${r.name}</b><span>${Math.round(r.dims.hipH * 2.1 * r.scale * 28)} m</span>`;
      c.addEventListener('click', () => { SFX.ui(); this.pickRobot(r.id); });
      c.addEventListener('dblclick', () => this.confirmRobot());
      cards.appendChild(c);
    });
    $('sel-ok').addEventListener('click', () => { SFX.uiOk(); this.confirmRobot(); });
    const ar = $('arenas');
    [...MAPS, { id: 'random', name: 'Random', sub: 'Let the drop ship decide' }].forEach(a => { const c = document.createElement('button'); c.className = 'arena'; c.dataset.id = a.id; c.innerHTML = `<b>${a.name}</b><span>${a.sub}</span>`; c.addEventListener('click', () => { SFX.ui(); this.sel.arena = a.id; this.refreshSetup(); this.previewArena(); }); ar.appendChild(c); });
    this.seg('seg-diff', [['rookie', 'Rookie'], ['contender', 'Contender'], ['champion', 'Champion']], () => this.sel.diff, v => this.sel.diff = v);
    $('setup-go').addEventListener('click', () => { SFX.uiOk(); this.launch(); });
    this.seg('seg-q', [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']], () => settings.quality, v => { settings.quality = v; saveSettings(); buildComposer(); });
    this.seg('seg-cam', [['shoulder', 'Shoulder'], ['wide', 'Wide']], () => settings.cam, v => { settings.cam = v; saveSettings(); });
    this.seg('seg-shake', [[true, 'On'], [false, 'Off']], () => settings.shake, v => { settings.shake = v; saveSettings(); });
    this.seg('seg-music', [[0, 'Off'], [0.25, 'Low'], [0.5, 'Mid'], [0.9, 'High']], () => settings.music, v => { settings.music = v; saveSettings(); SFX.setVolumes(); });
    this.seg('seg-sfx', [[0.3, 'Low'], [0.6, 'Mid'], [0.9, 'High']], () => settings.sfx, v => { settings.sfx = v; saveSettings(); SFX.setVolumes(); });
    this.seg('seg-voice', [[true, 'On'], [false, 'Off']], () => settings.voice, v => { settings.voice = v; saveSettings(); });
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
    if (where === 'circuit') { const s = store.get('circuit', null); if (s && s.robot && ROBOT(s.robot)) { this.sel.p1 = s.robot; this.openLadder(); return; } }
    this.openSelect();
  },
  openSelect() {
    const step = this.step, f = this.flow, two = f !== 'circuit';
    $('sel-step').textContent = two ? `Step ${step} of 2 · ${step === 1 ? 'Your mech' : (f === 'training' ? 'Sparring partner' : 'Opponent')}` : 'Choose the mech you take up the ladder';
    if (step === 2 && this.sel.p2 === this.sel.p1) this.sel.p2 = ROBOTS.find(r => r.id !== this.sel.p1).id;
    this.pickRobot(step === 1 ? this.sel.p1 : this.sel.p2);
    this.show('s-select', !(step === 2));
  },
  pickRobot(id) {
    if (this.step === 1) this.sel.p1 = id; else this.sel.p2 = id;
    document.querySelectorAll('#cards .card').forEach(c => c.classList.toggle('sel', c.dataset.id === id));
    const r = ROBOT(id); const st = r.stats;
    const statRow = (l, v) => `<span>${l}</span><div class="b"><i style="width:${v * 10}%"></i></div><em>${v}</em>`;
    const h = Math.round(r.dims.hipH * 2.1 * r.scale * 28), w = Math.round(r.scale ** 3 * (0.7 + st.armor * 0.05) * 2400);
    $('detail').innerHTML = `<div class="cls">${r.cls} · ${h} m · ${w.toLocaleString()} t</div><h3>${r.name}</h3><p>${r.bio}</p><div class="abil">${r.abilities.map(a => `<span>${ABILITIES[a].name}</span>`).join('')}<span>Arm Blades</span></div><div class="stats">${statRow('POWER', st.power)}${statRow('SPEED', st.speed)}${statRow('ARMOR', st.armor)}${statRow('REACH', st.reach)}${statRow('STAMINA', st.stamina)}</div>`;
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
    $('seg-diff').parentElement.hidden = tr;
    $('setup-go').textContent = tr ? 'Start sparring' : 'Deploy';
    this.refreshSetup(); this.previewArena();
    this.show('s-setup');
  },
  refreshSetup() { document.querySelectorAll('#arenas .arena').forEach(c => c.classList.toggle('sel', c.dataset.id === this.sel.arena)); },
  previewArena() {
    const id = this.sel.arena === 'random' ? (Arena.id || 'city') : this.sel.arena;
    if (Arena.id !== id) { Arena.load(id); const s = Game.showcase && Game.showcase.def.id; if (Game.showcase) { Game.showcase.dispose(); Game.showcase = null; } if (s) Game.setShowcase(s); }
    settings.lastArena = this.sel.arena; saveSettings();
  },
  launch() { Game.startFight({ p1: this.sel.p1, p2: this.sel.p2, arena: this.sel.arena, diff: this.sel.diff, training: this.flow === 'training' }); },
  ladderOpps() { const p = store.get('circuit', null).robot; return LADDER_ORDER.filter(id => id !== p).slice(0, 5); },
  openLadder() {
    const s = store.get('circuit', null); const opps = this.ladderOpps();
    $('lad-eyebrow').textContent = `Circuit · ${ROBOT(s.robot).name}`;
    $('lad-title').textContent = s.beaten >= 5 ? 'Champion' : 'The Ladder';
    $('ladder').innerHTML = opps.map((id, i) => {
      const r = ROBOT(id), cls = i < s.beaten ? 'done' : i === s.beaten ? 'next' : '';
      return `<div class="rung ${cls}"><span class="n">${i + 1}</span><div><b>${r.name}</b><small>${MAPS.find(a => a.id === LADDER_ARENA[i]).name} · ${DIFF[LADDER_DIFF[i]].name}${i === 4 ? ' · Title fight' : ''}</small></div><span class="st">${i < s.beaten ? 'BEATEN' : i === s.beaten ? 'NEXT' : 'LOCKED'}</span></div>`;
    }).join('');
    $('lad-go').textContent = s.beaten >= 5 ? 'Defend the title' : 'Deploy';
    this.sel.p1 = s.robot; Game.setShowcase(s.robot);
    this.show('s-ladder');
  },
  launchRung(i) {
    const s = store.get('circuit', null); i = Math.min(4, i);
    Game.startFight({ p1: s.robot, p2: this.ladderOpps()[i], arena: LADDER_ARENA[i], diff: LADDER_DIFF[i], circuit: true, rung: i });
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
    if (document.fonts && document.fonts.load) await Promise.race([Promise.all(['900 40px "Big Shoulders Display"', '600 20px "Chakra Petch"', '400 20px "Share Tech Mono"'].map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]);
  } catch (e) { }
  buildBaseTextures();
  FX.init();
  buildComposer();
  Arena.load(UI.sel.arena === 'random' ? 'city' : UI.sel.arena);
  Game.setShowcase(UI.sel.p1);
  HUD.init(); Input.init(); UI.init();
  $('loading').remove();
  window.__ironvolt = { Game, Arena, Cam, settings, FX, Fighter, ROBOT, V3, Intro };
  requestAnimationFrame(loop);
}
boot();
