// ============================================================================
// WORLD SYSTEMS: destructible chunk buildings, props, crushables, specials
// 1 world unit ~ 28 m. Mechs stand 2.1-3.2 units, buildings 2-7 units.
// ============================================================================
const MAPS = [
  { id: 'city', name: 'Harbor City', sub: 'Waterfront district at dusk', bell: 'Harbor City' },
  { id: 'storm', name: 'Harbor City · Storm', sub: 'Same streets, midnight typhoon', bell: 'Harbor City, under the storm' },
  { id: 'hangar', name: 'Shatterdome', sub: 'Mech hangar, Bay 4', bell: 'the Shatterdome' },
  { id: 'reactor', name: 'Helix Core', sub: 'Reactor chamber, live core', bell: 'the Helix Core' },
  { id: 'carnival', name: 'Wonderland', sub: 'Dead amusement park, midnight', bell: 'Wonderland' },
  { id: 'desert', name: 'Red Mesa', sub: 'Desert refinery, golden hour', bell: 'Red Mesa' },
];
const CW = 0.44, CH = 0.36;

function hash2(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  return lerp(lerp(hash2(xi, zi), hash2(xi + 1, zi), u), lerp(hash2(xi, zi + 1), hash2(xi + 1, zi + 1), u), v);
}
const fbm = (x, z) => vnoise(x, z) * 0.55 + vnoise(x * 2.1 + 3.1, z * 2.1) * 0.3 + vnoise(x * 4.3, z * 4.3 + 7.7) * 0.15;
function desertH(x, z) {
  const r = Math.hypot(x, z), far = smooth(clamp((r - 22) / 18, 0, 1));
  return (fbm(x * 0.035, z * 0.035) * 9 - 2.5) * far + (fbm(x * 0.12, z * 0.12) - 0.5) * 0.35 * (1 - far * 0.5);
}

// ---------------------------------------------------------------- facade textures (4x4 cells, one cell per chunk face)
function facadeTex(style, seed) {
  const rnd = mulberry32(seed), W = 512, cell = 128;
  const c = makeCanvas(W, W), g = c.getContext('2d', { willReadFrequently: true }), e = makeCanvas(W, W), ge = e.getContext('2d');
  ge.fillStyle = '#000'; ge.fillRect(0, 0, W, W);
  const pal = {
    glass: { wall: '#2b3540', win: '#1a2a3a', frame: '#5a6672', lit: ['#ffd9a0', '#bfe3ff', '#fff2d0'], litP: 0.22, n: 2 },
    office: { wall: '#9a9790', win: '#232a30', frame: '#76736c', lit: ['#ffe2b0', '#fff6e0'], litP: 0.18, n: 2 },
    brick: { wall: '#7a3e2c', win: '#1e2226', frame: '#c9bca8', lit: ['#ffc98a', '#ffe0b0'], litP: 0.2, n: 2 },
    shop: { wall: '#3a3d40', win: '#202830', frame: '#26292c', lit: ['#fff0d0', '#ffd0a0', '#d0f0ff'], litP: 0.75, n: 1 },
    adobe: { wall: '#c49a6c', win: '#2a1e16', frame: '#a57d55', lit: ['#ffb060'], litP: 0.05, n: 1 },
    arcade: { wall: '#2a1838', win: '#140c1c', frame: '#4a2a5a', lit: ['#ff3a9a', '#3ae0ff', '#ffe04a', '#8aff5a'], litP: 0.7, n: 2 },
    metal: { wall: '#6f7570', win: '#30343a', frame: '#545a56', lit: [], litP: 0, n: 0 },
    hangar: { wall: '#4d5559', win: '#22282c', frame: '#3a4044', lit: ['#dff2ff'], litP: 0.5, n: 0 },
    tower: { wall: '#3a4652', win: '#162028', frame: '#2a333c', lit: ['#7fe8ff'], litP: 0.6, n: 0 },
    rock: { wall: '#9a5a3a', win: '#6e3b24', frame: '#b06d48', lit: [], litP: 0, n: 0 },
  }[style];
  g.fillStyle = pal.wall; g.fillRect(0, 0, W, W);
  blotches(g, W, W, 50, '0,0,0', .05, .16, 20, 110);
  for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
    const x0 = cx * cell, y0 = cy * cell;
    if (style === 'rock') { for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${randi(90, 140)},${randi(45, 70)},${randi(25, 40)},.5)`; g.fillRect(x0, y0 + rnd() * cell, cell, rand(4, 18)); } continue; }
    if (style === 'metal' || style === 'hangar' || style === 'tower') {
      for (let k = 0; k < cell; k += 8) { g.fillStyle = k % 16 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.16)'; g.fillRect(x0 + k, y0, 4, cell); }
      g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 3; g.strokeRect(x0 + 2, y0 + 2, cell - 4, cell - 4);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0, y0 + cell - 10, cell, 10);
      for (let k = 8; k < cell; k += 20) rivet(g, x0 + k, y0 + cell - 5, 2.5);
      if (pal.litP && rnd() < pal.litP * 0.5) { const col = pal.lit[0]; g.fillStyle = '#556'; g.fillRect(x0 + 10, y0 + 50, cell - 20, 8); ge.fillStyle = col; ge.fillRect(x0 + 10, y0 + 50, cell - 20, 8); }
      continue;
    }
    g.fillStyle = pal.frame; g.fillRect(x0, y0 + cell - 14, cell, 14);
    if (style === 'shop') {
      const lit = rnd() < pal.litP, col = pal.lit[(rnd() * pal.lit.length) | 0];
      g.fillStyle = '#15191c'; g.fillRect(x0 + 6, y0 + 40, cell - 12, cell - 58);
      g.fillStyle = 'rgba(160,180,200,.25)'; g.fillRect(x0 + 10, y0 + 44, cell - 20, 6);
      const aw = ['#b8322a', '#2a6ab8', '#2a8a4a', '#d8a42a', '#5a2a8a'][(rnd() * 5) | 0];
      g.fillStyle = aw; g.fillRect(x0 + 2, y0 + 18, cell - 4, 18);
      for (let k = 0; k < cell; k += 16) { g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x0 + k, y0 + 18, 8, 18); }
      if (lit) { ge.fillStyle = col; ge.fillRect(x0 + 6, y0 + 40, cell - 12, cell - 58); ge.fillStyle = aw; ge.globalAlpha = .4; ge.fillRect(x0 + 2, y0 + 18, cell - 4, 18); ge.globalAlpha = 1; }
      continue;
    }
    for (let k = 0; k < pal.n; k++) {
      const ww = style === 'glass' ? cell / 2 - 6 : style === 'adobe' ? 34 : 40, wh = style === 'glass' ? cell - 24 : style === 'adobe' ? 40 : 62;
      const wx = x0 + (pal.n === 1 ? (cell - ww) / 2 : 4 + k * (cell / 2) + (cell / 2 - 8 - ww) / 2), wy = y0 + (cell - 14 - wh) / 2 + 2;
      const lit = rnd() < pal.litP;
      const col = lit ? '#6a5a44' : pal.win; const litCol = pal.lit[(rnd() * Math.max(1, pal.lit.length)) | 0];
      g.fillStyle = pal.frame; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gr.addColorStop(0, col); gr.addColorStop(1, lit ? col : '#0c1218');
      g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      if (!lit && style === 'glass') { g.fillStyle = 'rgba(160,190,220,.18)'; g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww * 0.4, wy); g.lineTo(wx + ww * 0.6, wy); g.lineTo(wx + ww * 0.2, wy + wh); g.fill(); }
      if (lit) { ge.fillStyle = litCol; ge.fillRect(wx, wy, ww, wh); if (rnd() < 0.4) { ge.fillStyle = 'rgba(0,0,0,.5)'; ge.fillRect(wx + rnd() * ww * 0.6, wy, ww * 0.3, wh); } }
      g.fillStyle = pal.frame; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
      if (style === 'brick' || style === 'office') { g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(wx - 3, wy + wh + 3, ww + 6, 4); }
    }
    if (style === 'brick') { g.strokeStyle = 'rgba(30,15,10,.35)'; g.lineWidth = 1; for (let y = y0; y < y0 + cell - 14; y += 6) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cell, y); g.stroke(); } }
    if (style === 'arcade' && rnd() < 0.5) { const col = pal.lit[(rnd() * 4) | 0]; ge.fillStyle = col; ge.fillRect(x0, y0 + 4, cell, 5); g.fillStyle = col; g.fillRect(x0, y0 + 4, cell, 5); }
  }
  for (let i = 0; i < 90; i++) { const x = rnd() * W, y = rnd() * W, l = 20 + rnd() * 60; const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, 'rgba(0,0,0,.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x, y, 2 + rnd() * 3, l); }
  scratches(g, W, W, 60, '0,0,0', .2);
  noiseFill(g, W, W, 18);
  const map = linTex(c); map.colorSpace = THREE.SRGBColorSpace; map.repeat.set(0.25, 0.25); map.userData.canvas = c;
  const emi = linTex(e); emi.colorSpace = THREE.SRGBColorSpace; emi.repeat.set(0.25, 0.25);
  return { map, emi };
}
function buildingMaterial(style, glowI) {
  const t = facadeTex(style, style.length * 97 + 13);
  const glass = style === 'glass', met = ['metal', 'hangar', 'tower'].includes(style);
  const m = new THREE.MeshStandardMaterial({
    map: t.map, emissiveMap: t.emi, emissive: 0xffe0c0, emissiveIntensity: glowI,
    roughness: glass ? 0.2 : met ? 0.5 : 0.85, metalness: glass ? 0.55 : met ? 0.6 : 0.05,
  });
  m.normalMap = autoNormal(t.map, 1.6); if (m.normalMap) m.normalMap.repeat.set(0.25, 0.25);
  m.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 iOff;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>
        #ifdef USE_MAP
          vMapUv += iOff;
        #endif
        #ifdef USE_EMISSIVEMAP
          vEmissiveMapUv += iOff;
        #endif
        #ifdef USE_NORMALMAP
          vNormalMapUv += iOff;
        #endif`);
  };
  m.customProgramCacheKey = () => 'facade1';
  return m;
}
function facadeBox(w, h, d, cw = CW, ch = CH) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const spans = [[d, h], [d, h], [0, 0], [0, 0], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f === 2 || f === 3) { uv.setXY(i, 0.02, 0.02); continue; }
    uv.setXY(i, uv.getX(i) * spans[f][0] / cw, uv.getY(i) * spans[f][1] / ch);
  }
  g.setAttribute('iOff', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  return g;
}
const _neon = new Map();
function neonTex(text, color, vertical) {
  const k = text + color + vertical; if (_neon.has(k)) return _neon.get(k);
  const w = vertical ? 128 : 512, h = vertical ? 512 : 128;
  const t = canvasTex(w, h, (g) => {
    g.fillStyle = '#05060a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = color; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = color; g.shadowBlur = 18;
    if (vertical) { g.font = '900 86px "Big Shoulders Display", Impact, sans-serif'; [...text].slice(0, 5).forEach((ch, i, arr) => g.fillText(ch, w / 2, h * (i + 0.5) / arr.length + 4)); }
    else { g.font = '900 84px "Big Shoulders Display", Impact, sans-serif'; g.fillText(text, w / 2, h / 2 + 6); }
  }, { repeat: [1, 1] });
  t.userData.shared = true; _neon.set(k, t); return t;
}

// ---------------------------------------------------------------- destructible buildings
class Building {
  constructor(o) {
    Object.assign(this, { cw: CW, ch: CH, yOff: 0, shop: null, tint: 0xffffff }, o);
    const { x, z, nx, nz, nh, cw } = this;
    this.x0 = x - nx * cw / 2; this.z0 = z - nz * cw / 2; this.x1 = this.x0 + nx * cw; this.z1 = this.z0 + nz * cw;
    this.n = nx * nz * nh; this.alive = new Uint8Array(this.n).fill(1); this.inst = new Int32Array(this.n); this.csets = new Array(this.n);
    this.cols = new Float32Array(nx * nz); this.dirty = true; this.aliveCount = this.n; this.children = []; this.decor = []; this.roof = []; this.top = nh * this.ch;
  }
  idx(ix, iy, iz) { return (iy * this.nz + iz) * this.nx + ix; }
  level(i) { return Math.floor(i / (this.nx * this.nz)); }
  center(i, v) { const ix = i % this.nx, iz = Math.floor(i / this.nx) % this.nz, iy = Math.floor(i / (this.nx * this.nz)); return v.set(this.x0 + (ix + 0.5) * this.cw, (iy + 0.5) * this.ch + this.yOff, this.z0 + (iz + 0.5) * this.cw); }
  levelCount(iy) { const per = this.nx * this.nz; let c = 0; for (let j = iy * per; j < (iy + 1) * per; j++) if (this.alive[j]) c++; return c; }
  refresh() {
    if (!this.dirty) return; this.dirty = false; this.top = 0;
    for (let iz = 0; iz < this.nz; iz++) for (let ix = 0; ix < this.nx; ix++) {
      let h = 0; while (h < this.nh && this.alive[this.idx(ix, h, iz)]) h++;
      this.cols[iz * this.nx + ix] = h * this.ch; this.top = Math.max(this.top, h * this.ch);
    }
  }
}
const _wv = V3(), _wv2 = V3(), _wq = new THREE.Quaternion(), _wm = new THREE.Matrix4(), _ws = V3(), _we = new THREE.Euler();

const Arena = {
  id: null, group: null, t: 0, bound: { x0: -26, x1: 26, z0: -26, z1: 19.5 }, buildings: [], dyn: [], pending: [], props: [], smalls: [], specials: [], obstacles: [], anims: [], shafts: [], heli: [],
  load(id) {
    if (this.id === id) return;
    this.dispose();
    const g = new THREE.Group(); g.name = 'map-' + id; scene.add(g);
    Object.assign(this, { group: g, id, current: { id }, buildings: [], dyn: [], pending: [], props: [], sets: {}, smalls: [], heli: [], specials: [], obstacles: [], anims: [],
      circle: 0, ceiling: 0, camMode: 'lift', night: false, storm: false, intros: ['drop', 'flyin', 'emerge'], grade: {}, groundFn: null, sun: null, water: null, dust: null, shafts: [], lightningT: 4 });
    FX.clearEmitters();
    MAPGEN[id](g, this);
    scene.environment = this.envRT.texture;
    this.applyShadowQuality();
    applyGrade(this.grade);
    FX.setRain(!!this.storm);
  },
  dispose() {
    if (!this.group) return;
    const geos = new Set(), mats = new Set(), texs = new Set(), cached = new Set([...GC.values(), ...PGC.values()]), base = baseTextureSet();
    this.group.traverse(o => {
      if (o.geometry && !cached.has(o.geometry)) geos.add(o.geometry);
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { mats.add(m); for (const k of ['map', 'roughnessMap', 'emissiveMap', 'normalMap', 'metalnessMap', 'alphaMap']) if (m[k] && !base.has(m[k]) && !m[k].userData.shared) texs.add(m[k]); });
    });
    geos.forEach(x => x.dispose()); mats.forEach(x => x.dispose()); texs.forEach(x => x.dispose());
    if (this.envRT) this.envRT.dispose();
    scene.remove(this.group); this.group = null; this.id = null; this.current = null; FX.setRain(false);
  },
  applyShadowQuality() {
    const q = QUALITY[settings.quality], sun = this.sun; if (!sun) return;
    sun.castShadow = q.shadow > 0;
    if (q.shadow > 0) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  },
  groundAt(x, z) { return this.groundFn ? this.groundFn(x, z) : 0; },
  makeSet(style, glowI = 0) { const s = { style, mat: buildingMaterial(style, glowI) }; this.sets[style] = s; return s; },
  addBuilding(style, x, z, nx, nz, nh, tint, o = {}) {
    const b = new Building(Object.assign({ style, x, z, nx, nz, nh, tint }, o));
    if (o.parent) o.parent.children.push(b);
    this.buildings.push(b); return b;
  },
  finalizeBuildings(g) {
    const geo = new THREE.BoxGeometry(1, 1, 1); const uv = geo.attributes.uv;
    for (let i = 8; i < 16; i++) uv.setXY(i, 0.02, 0.02);
    const per = new Map();
    for (const b of this.buildings) for (let i = 0; i < b.n; i++) {
      const set = this.sets[(b.shop && b.level(i) === 0) ? b.shop : b.style];
      b.csets[i] = set; if (!per.has(set)) per.set(set, []); per.get(set).push([b, i]);
    }
    for (const [set, list] of per) {
      const g2 = geo.clone(); const off = new Float32Array(list.length * 2);
      const mesh = new THREE.InstancedMesh(g2, set.mat, list.length); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      const col = new THREE.Color();
      list.forEach(([b, i], k) => {
        b.center(i, _wv); _wm.compose(_wv, _wq.identity(), _ws.set(b.cw * 0.995, b.ch * 0.995, b.cw * 0.995)); mesh.setMatrixAt(k, _wm);
        col.set(b.tint).multiplyScalar(0.85 + hash2(i, k) * 0.25); mesh.setColorAt(k, col);
        off[k * 2] = Math.floor(hash2(k, 3) * 4) * 0.25; off[k * 2 + 1] = Math.floor(hash2(7, k) * 4) * 0.25;
        b.inst[i] = k;
      });
      g2.setAttribute('iOff', new THREE.InstancedBufferAttribute(off, 2));
      set.mesh = mesh; g.add(mesh);
    }
    geo.dispose();
    this.buildings.forEach(b => b.refresh());
  },
  releaseDecor(dc, v) { if (dc.gone) return; dc.gone = true; Debris.add(dc.mesh, v || V3(rand(-1, 1), rand(0, 1.5), rand(-1, 1)), V3(rand(-3, 3), rand(-3, 3), rand(-3, 3))); },
  detach(b, i, vel, delay = 0) {
    if (!b.alive[i]) return; b.alive[i] = 0; b.aliveCount--; b.dirty = true;
    const p = b.center(i, V3());
    const d = { set: b.csets[i], id: b.inst[i], p, v: vel.clone(), q: new THREE.Quaternion(), w: V3(rand(-3, 3), rand(-3, 3), rand(-3, 3)), t: 0, sleep: false, delay, landed: false, s: rand(0.7, 1.0), sx: b.cw, sy: b.ch };
    if (delay > 0) this.pending.push(d); else this.dyn.push(d);
    for (const dc of b.decor) if (dc.chunk === i) this.releaseDecor(dc, vel.clone().multiplyScalar(0.6));
  },
  collapseAll(b, dir, d0 = 0) {
    const tilt = (dir ? V3(dir.x, 0, dir.z) : V3(rand(-1, 1), 0, rand(-1, 1))).normalize(), per = b.nx * b.nz;
    for (let j = 0; j < b.n; j++) if (b.alive[j]) { const lvl = Math.floor(j / per); this.detach(b, j, V3(tilt.x * rand(0.3, 1.2) * (0.4 + lvl * 0.08), rand(-1.2, 0.2), tilt.z * rand(0.3, 1.2) * (0.4 + lvl * 0.08)), d0 + 0.02 + lvl * 0.035 + rand(0, 0.06)); }
    b.roof.forEach(dc => this.releaseDecor(dc, V3(tilt.x, -0.5, tilt.z))); b.decor.forEach(dc => this.releaseDecor(dc));
    b.children.forEach(c => this.collapseAll(c, dir, d0 + 0.3));
  },
  impact(p, radius, power, dir) {
    let n = 0;
    for (const b of this.buildings) {
      if (p.x < b.x0 - radius || p.x > b.x1 + radius || p.z < b.z0 - radius || p.z > b.z1 + radius || p.y > b.yOff + b.nh * b.ch + radius || p.y < b.yOff - radius) continue;
      let nb = 0;
      for (let i = 0; i < b.n; i++) {
        if (!b.alive[i]) continue;
        b.center(i, _wv); const dd = _wv.distanceTo(p);
        if (dd < radius * rand(0.75, 1.15)) {
          const out = _wv2.subVectors(_wv, p).normalize();
          const v = V3().copy(dir || out).multiplyScalar(power * rand(0.5, 1.2)).addScaledVector(out, power * 0.5).add(V3(rand(-1, 1), rand(0.5, 2.5) * (power * 0.15), rand(-1, 1)));
          this.detach(b, i, v); n++; nb++;
        }
      }
      if (nb) this.stabilize(b, dir);
    }
    for (const s of this.specials) if (s.hit) s.hit(p, radius, power, dir);
    if (n) {
      FX.dust(p, Math.min(1, n / 20) * 1.5 + 0.6, this.dustColor);
      FX.spark(p, dir || V3(0, 1, 0), Math.min(50, 8 + n * 2), 5, [3, 2.4, 1.6]);
      SFX.crumble(Math.min(1.5, 0.4 + n / 25));
      Game.onDestruction && Game.onDestruction(p, n);
    }
    return n;
  },
  stabilize(b, dir) {
    const per = b.nx * b.nz;
    for (let iy = 0; iy < b.nh - 1; iy++) {
      const cnt = b.levelCount(iy);
      let above = 0; for (let j = (iy + 1) * per; j < b.n; j++) if (b.alive[j]) { above++; break; }
      if (above && cnt < per * 0.42) {
        const tilt = (dir ? V3(dir.x, 0, dir.z) : V3(rand(-1, 1), 0, rand(-1, 1))).normalize();
        for (let j = (iy + 1) * per; j < b.n; j++) if (b.alive[j]) {
          const lvl = Math.floor(j / per) - iy;
          this.detach(b, j, V3(tilt.x * rand(0.3, 1.2) * (0.4 + lvl * 0.08), rand(-1.2, 0.2), tilt.z * rand(0.3, 1.2) * (0.4 + lvl * 0.08)), 0.02 + lvl * 0.035 + rand(0, 0.06));
        }
        b.roof.forEach(dc => this.releaseDecor(dc, V3(tilt.x, -0.5, tilt.z)));
        b.children.forEach(c => this.collapseAll(c, dir, 0.25));
        FX.dust(_wv.set((b.x0 + b.x1) / 2, (iy + 1) * b.ch + b.yOff, (b.z0 + b.z1) / 2), 2.4, this.dustColor);
        SFX.crumble(2); Game.onCollapse && Game.onCollapse(b);
        return;
      }
    }
    for (let iy = 1; iy < b.nh; iy++) for (let iz = 0; iz < b.nz; iz++) for (let ix = 0; ix < b.nx; ix++) {
      const i = b.idx(ix, iy, iz); if (!b.alive[i] || b.alive[b.idx(ix, iy - 1, iz)]) continue;
      const nb = (ix > 0 && b.alive[b.idx(ix - 1, iy, iz)]) || (ix < b.nx - 1 && b.alive[b.idx(ix + 1, iy, iz)]) || (iz > 0 && b.alive[b.idx(ix, iy, iz - 1)]) || (iz < b.nz - 1 && b.alive[b.idx(ix, iy, iz + 1)]);
      if (!nb) this.detach(b, i, V3(rand(-.3, .3), -0.5, rand(-.3, .3)), rand(0, 0.1));
    }
    const topCount = b.levelCount(b.nh - 1);
    if (topCount < per * 0.6) b.roof.forEach(dc => this.releaseDecor(dc));
    if (topCount < per * 0.45) b.children.forEach(c => { if (c.aliveCount) this.collapseAll(c, dir, 0.1); });
  },
  collide(p, r, y0, y1) {
    let hit = null;
    for (const b of this.buildings) {
      if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
      b.refresh(); if (b.yOff + b.top <= y0 + 0.05 || b.yOff >= y1) continue;
      for (let iz = 0; iz < b.nz; iz++) for (let ix = 0; ix < b.nx; ix++) {
        const h = b.cols[iz * b.nx + ix]; if (h < 0.3 || b.yOff + h <= y0 + 0.05) continue;
        const cx0 = b.x0 + ix * b.cw, cz0 = b.z0 + iz * b.cw;
        const qx = clamp(p.x, cx0, cx0 + b.cw), qz = clamp(p.z, cz0, cz0 + b.cw);
        const dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
        if (d < r) {
          if (d > 1e-4) { p.x = qx + dx / d * r; p.z = qz + dz / d * r; }
          else { const cx = cx0 + b.cw / 2, cz = cz0 + b.cw / 2; const ax = p.x - cx, az = p.z - cz; if (Math.abs(ax) > Math.abs(az)) p.x = cx + Math.sign(ax || 1) * (b.cw / 2 + r); else p.z = cz + Math.sign(az || 1) * (b.cw / 2 + r); }
          hit = b;
        }
      }
    }
    for (const o of this.obstacles) {
      if (o.dead || y0 > o.h) continue;
      const dx = p.x - o.x, dz = p.z - o.z, d = Math.hypot(dx, dz), min = o.r + r;
      if (d < min) { const k = min / (d || 1e-3); p.x = o.x + dx * k; p.z = o.z + dz * k; hit = o; }
    }
    return hit;
  },
  buildingNear(p, dir, dist, y = 1) {
    let best = null, bd = dist;
    for (const b of this.buildings) {
      b.refresh(); if (b.yOff + b.top < y * 0.5 || b.yOff > y + 0.5) continue;
      const qx = clamp(p.x + dir.x * 0.3, b.x0, b.x1), qz = clamp(p.z + dir.z * 0.3, b.z0, b.z1);
      const dx = qx - p.x, dz = qz - p.z, d = Math.hypot(dx, dz);
      if (d < bd && (dx * dir.x + dz * dir.z) > -0.05) { bd = d; best = { b, point: V3(qx, clamp(y, b.yOff + 0.2, b.yOff + b.top - 0.1), qz), d }; }
    }
    return best;
  },
  nearestBuildingDir(p) { let best = null, bd = 1e9; for (const b of this.buildings) { b.refresh(); if (b.top < 1.2 || b.yOff > 0.5) continue; const qx = clamp(p.x, b.x0, b.x1), qz = clamp(p.z, b.z0, b.z1); const d = Math.hypot(qx - p.x, qz - p.z); if (d < bd) { bd = d; best = V3(qx - p.x, 0, qz - p.z); } } return best && bd < 9 ? best.normalize() : null; },
  ripChunk(p, dir, y) {
    const nb = this.buildingNear(p, dir, 1.6, y); if (!nb) return null;
    const b = nb.b, pt = nb.point; let got = 0;
    for (let i = 0; i < b.n && got < 8; i++) { if (!b.alive[i]) continue; b.center(i, _wv); if (_wv.distanceTo(pt) < 0.62) { b.alive[i] = 0; b.aliveCount--; b.dirty = true; this.hideInst(b.csets[i], b.inst[i]); got++; } }
    if (!got) return null;
    this.stabilize(b, dir);
    const mesh = new THREE.Mesh(facadeBox(CW * 2, CH * 2, CW * 2), this.sets[b.style].mat); mesh.position.copy(pt); mesh.castShadow = true;
    FX.dust(pt, 1.2, this.dustColor); SFX.crumble(0.9);
    return this.addProp(mesh, { mass: 1.4, size: 0.5, kind: 'chunk' });
  },
  hideInst(set, id) { _wm.makeScale(0, 0, 0); set.mesh.setMatrixAt(id, _wm); set.mesh.instanceMatrix.needsUpdate = true; },
  nearestRubble(p, r) { let best = null, bd = r; for (const d of this.dyn) { if (!d.sleep || d.taken) continue; const dd = Math.hypot(d.p.x - p.x, d.p.z - p.z); if (dd < bd) { bd = dd; best = d; } } return best; },
  rubbleToProp(d) {
    d.taken = true; this.hideInst(d.set, d.id);
    const mesh = new THREE.Mesh(facadeBox(d.sx, d.sy, d.sx), d.set.mat); mesh.position.copy(d.p); mesh.quaternion.copy(d.q); mesh.scale.setScalar(1.3); mesh.castShadow = true;
    return this.addProp(mesh, { mass: 0.8, size: 0.36, kind: 'chunk' });
  },
  updateDyn(dt) {
    for (let i = this.pending.length - 1; i >= 0; i--) { const d = this.pending[i]; d.delay -= dt; if (d.delay <= 0) { this.pending.splice(i, 1); this.dyn.push(d); } }
    const touched = new Set(); let active = 0;
    for (const d of this.dyn) {
      if (d.sleep) continue; active++;
      d.t += dt; d.v.y -= GRAV * dt;
      d.p.addScaledVector(d.v, dt);
      _wq.setFromEuler(_we.set(d.w.x * dt, d.w.y * dt, d.w.z * dt)); d.q.multiply(_wq);
      const fl = this.groundAt(d.p.x, d.p.z) + d.sy * 0.4 * d.s;
      if (d.p.y < fl) {
        d.p.y = fl;
        if (!d.landed && d.v.y < -2) { d.landed = true; if (Math.random() < 0.25) FX.dust(d.p, 0.5, this.dustColor); this.crushCars(d.p, 0.3); }
        d.v.y *= -0.22; d.v.x *= 0.55; d.v.z *= 0.55; d.w.multiplyScalar(0.55);
        if (d.v.lengthSq() < 0.04 && d.t > 0.5) d.sleep = true;
      }
      _wm.compose(d.p, d.q, _ws.set(d.sx * d.s, d.sy * d.s, d.sx * d.s)); d.set.mesh.setMatrixAt(d.id, _wm); touched.add(d.set.mesh);
      if (d.t > 9) d.sleep = true;
    }
    touched.forEach(m => m.instanceMatrix.needsUpdate = true);
    if (active > 900) { let k = 0; for (const d of this.dyn) { if (!d.sleep && k++ < active - 900) d.sleep = true; } }
  },
  addProp(mesh, o) {
    if (!mesh.parent) this.group.add(mesh);
    const p = { mesh, mass: o.mass || 1, size: o.size || 0.4, kind: o.kind || 'rock', state: 'rest', vel: V3(), ang: V3(), owner: null, ignore: null, t: 0, explosive: !!o.explosive };
    this.props.push(p); return p;
  },
  nearestProp(p, r) { let best = null, bd = r; for (const q of this.props) { if (q.state !== 'rest') continue; const d = Math.hypot(q.mesh.position.x - p.x, q.mesh.position.z - p.z); if (d < bd) { bd = d; best = q; } } return best; },
  breakProp(q, dir) {
    const p = q.mesh.position;
    FX.dust(p, 0.6 + q.size, this.dustColor); FX.spark(p, dir || V3(0, 1, 0), 30, 6, [3, 2.2, 1.4]);
    let mat = q.mesh.material; if (!mat) q.mesh.traverse(o => { if (!mat && o.material) mat = o.material; });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(G.box(+(q.size * rand(0.3, 0.5)).toFixed(2), +(q.size * rand(0.2, 0.4)).toFixed(2), +(q.size * rand(0.3, 0.5)).toFixed(2), 0.01), mat);
      m.position.copy(p).add(V3(rand(-.2, .2), rand(0, .3), rand(-.2, .2))); this.group.add(m);
      Debris.add(m, V3(rand(-3, 3), rand(1, 4), rand(-3, 3)).addScaledVector(dir || V3(), 2), V3(rand(-8, 8), rand(-8, 8), rand(-8, 8)));
    }
    if (q.explosive) Game.explosion(p.clone(), 2.2, 160, null);
    SFX.crumble(0.7);
    q.mesh.removeFromParent(); this.props.splice(this.props.indexOf(q), 1);
  },
  updateProps(dt, fighters) {
    for (const q of this.props.slice()) {
      if (q.state !== 'fly') continue;
      q.t += dt; q.vel.y -= GRAV * dt; q.mesh.position.addScaledVector(q.vel, dt);
      q.mesh.rotateX(q.ang.x * dt); q.mesh.rotateZ(q.ang.z * dt);
      const p = q.mesh.position;
      if (Math.random() < 0.5) FX.smoke.emit(p.x, p.y, p.z, 0, 0.2, 0, 0.5, q.size * 0.5, q.size * 1.2, 0.35, 0.32, 0.3, 0.25, 0, 1);
      for (const f of fighters) {
        if (f === q.ignore && q.t < 0.6) continue;
        const c = f.rag ? f.rag.pos('chest') : f.chestW;
        if (c.distanceTo(p) < q.size + f.radius * 1.1) { Game.propHit(q, f); this.breakProp(q, q.vel.clone().normalize()); break; }
      }
      if (!this.props.includes(q)) continue;
      const hitB = this.collide(_wv.copy(p), q.size * 0.5, p.y - q.size * 0.5, p.y + q.size * 0.5);
      if (hitB) { this.impact(p.clone(), 0.55 + q.size * 0.6, q.vel.length() * 0.6, q.vel.clone().normalize()); this.breakProp(q, q.vel.clone().normalize()); continue; }
      const fl = this.groundAt(p.x, p.z) + q.size * 0.4;
      if (p.y < fl) { if (q.vel.length() > 5 || q.kind !== 'rock') { this.crushCars(p, 0.5); this.breakProp(q, V3(0, 1, 0)); } else { p.y = fl; q.vel.multiplyScalar(0.3); q.vel.y = Math.abs(q.vel.y) * 0.2; if (q.vel.length() < 0.5) q.state = 'rest'; } }
      if (q.t > 6) this.breakProp(q);
    }
  },
  addSmalls(geo, mat, spots, colors, crush = [1.25, 0.28, 1.1], crushCol = 0x222222) {
    const mesh = new THREE.InstancedMesh(geo, mat, spots.length); const c = new THREE.Color();
    const list = spots.map((s, i) => { const y = s[3] != null ? s[3] : this.groundAt(s[0], s[1]); _wm.compose(_wv.set(s[0], y, s[1]), _wq.setFromAxisAngle(V3(0, 1, 0), s[2]), _ws.setScalar(s[4] || 1)); mesh.setMatrixAt(i, _wm); c.set(pick(colors)); mesh.setColorAt(i, c); return { x: s[0], z: s[1], r: s[2], y, sc: s[4] || 1, crushed: false }; });
    mesh.castShadow = true; mesh.receiveShadow = true; this.group.add(mesh);
    this.smalls.push({ mesh, list, crush, crushCol: new THREE.Color(crushCol) });
  },
  makeCars(spots) {
    const body = new THREE.BoxGeometry(0.075, 0.045, 0.17).toNonIndexed(); body.translate(0, 0.03, 0);
    const cab = new THREE.BoxGeometry(0.065, 0.035, 0.09).toNonIndexed(); cab.translate(0, 0.065, -0.01);
    this.addSmalls(mergeGeometries([body, cab]), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 }), spots, [0xb8221c, 0x1d4e9e, 0xe8e8e8, 0x1a1a1a, 0xd8b02a, 0x6a6e72, 0x2a7a4a]);
  },
  crushCars(p, r) {
    for (const sm of this.smalls) {
      let n = 0;
      for (let i = 0; i < sm.list.length; i++) {
        const k = sm.list[i]; if (k.crushed || Math.abs(k.x - p.x) > r || Math.abs(k.z - p.z) > r) continue;
        k.crushed = true; n++;
        _wm.compose(_wv.set(k.x, k.y, k.z), _wq.setFromAxisAngle(V3(0, 1, 0), k.r + rand(-.4, .4)), _ws.set(sm.crush[0] * k.sc, sm.crush[1] * k.sc, sm.crush[2] * k.sc)); sm.mesh.setMatrixAt(i, _wm);
        sm.mesh.setColorAt(i, sm.crushCol);
        if (n < 4) FX.spark(_wv.set(k.x, k.y + 0.05, k.z), V3(0, 1, 0), 6, 2, [3, 2.5, 1.5], 1, 0.3);
      }
      if (n) { sm.mesh.instanceMatrix.needsUpdate = true; sm.mesh.instanceColor.needsUpdate = true; }
    }
  },
  update(dt, t, excite, fighters) {
    if (!this.current) return;
    this.t += dt;
    this.updateDyn(dt);
    this.updateProps(dt, fighters);
    if (this.water) { const n = this.water.material.normalMap; n.offset.x += dt * 0.012; n.offset.y += dt * 0.007; }
    if (this.dust) { this.dust.uniforms.uTime.value = this.t; this.dust.uniforms.uScale.value = FX.glow.mat.uniforms.uScale.value; }
    this.shafts.forEach(m => m.uniforms.uTime.value = this.t);
    for (const h of this.heli) h.update(dt, this.t, fighters);
    for (const s of this.specials) s.update && s.update(dt, fighters);
    for (const a of this.anims) a(dt, this.t, fighters);
    if (this.sun && fighters.length) {
      const m = _wv.set(0, 0, 0); fighters.forEach(f => m.add(f.rag ? f.rag.pos('pelvis') : f.pos)); m.divideScalar(fighters.length); m.y = 0;
      this.sun.target.position.copy(m); this.sun.position.copy(m).addScaledVector(this.sunDir, 60);
    }
    if (this.storm) this.updateStorm(dt);
  },
  updateStorm(dt) {
    this.lightningT -= dt; const L = this.lightning;
    if (L.flash > 0) { L.flash -= dt; const k = Math.max(0, L.flash) / 0.35 * (Math.random() < 0.3 ? 0.3 : 1); this.hemi.intensity = L.base + k * 6; this.skyMat.uniforms.uFlash.value = k; L.bolt.visible = L.flash > 0.12; }
    else { this.hemi.intensity = L.base; this.skyMat.uniforms.uFlash.value = 0; L.bolt.visible = false; }
    if (this.lightningT <= 0) {
      this.lightningT = rand(5, 13); L.flash = 0.35;
      const a = rand(0, Math.PI * 2), r = rand(40, 90), x = Math.cos(a) * r, z = Math.sin(a) * r;
      const pts = []; let px = x, py = 70, pz = z; pts.push(V3(px, py, pz));
      while (py > 2) { px += rand(-4, 4); pz += rand(-4, 4); py -= rand(4, 9); pts.push(V3(px, Math.max(0, py), pz)); }
      L.bolt.geometry.dispose(); L.bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      if (gradePass) gradePass.uniforms.uFlash.value = Math.max(gradePass.uniforms.uFlash.value, 0.12);
      setTimeout(() => SFX.thunder(clamp(1.4 - r / 120, 0.4, 1.2)), r * 18);
    }
  },
  splat() { },
};

// ---------------------------------------------------------------- helicopters (ambient, searchlights, air-drop intro)
class Heli {
  constructor(parent, pathR, h, speed, phase, searchlight = false) {
    this.g = new THREE.Group(); parent.add(this.g);
    const dark = stdMat(0x2a2f33, { metalness: 0.6, roughness: 0.45 });
    const add = (geo, mat, p, r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = true; this.g.add(m); return m; };
    add(new THREE.CapsuleGeometry(0.07, 0.16, 4, 10), dark, [0, 0, 0], [Math.PI / 2, 0, 0]);
    add(new THREE.BoxGeometry(0.02, 0.02, 0.28), dark, [0, 0.02, -0.22]);
    add(new THREE.BoxGeometry(0.01, 0.07, 0.05), dark, [0, 0.05, -0.36]);
    add(new THREE.BoxGeometry(0.16, 0.01, 0.02), dark, [0, -0.08, 0]);
    this.rotor = add(new THREE.BoxGeometry(0.5, 0.004, 0.025), dark, [0, 0.09, 0]);
    add(new THREE.SphereGeometry(0.012, 6, 4), basicGlow(0xff3020, 6), [0, -0.06, 0.05]);
    add(new THREE.SphereGeometry(0.01, 6, 4), basicGlow(0x30ff60, 6), [0.08, 0, 0]);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.55, 5, 16, 1, true).translate(0, -2.5, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(0.1), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    beam.userData.noAO = true; this.g.add(beam); this.beam = beam;
    if (searchlight) { this.spot = new THREE.SpotLight(0xfff2d8, 900, 40, 0.16, 0.5, 1.2); this.spot.position.set(0, -0.08, 0); this.g.add(this.spot, this.spot.target); }
    Object.assign(this, { pathR, h, speed, phase, manual: false });
  }
  update(dt, t, fighters) {
    this.rotor.rotation.y += dt * 40;
    if (this.manual) return;
    const a = t * this.speed + this.phase;
    this.g.position.set(Math.cos(a) * this.pathR, this.h + Math.sin(t * 0.7 + this.phase) * 0.5, Math.sin(a) * this.pathR);
    this.g.rotation.set(0.12, -a - Math.PI / 2 * Math.sign(this.speed), 0.15);
    if (fighters && fighters.length) {
      const f = fighters[(Math.floor(t / 7 + this.phase) % fighters.length + fighters.length) % fighters.length];
      const tgt = f.rag ? f.rag.pos('chest') : f.chestW;
      this.g.updateMatrixWorld();
      const local = this.g.worldToLocal(_wv.copy(tgt));
      this.beam.quaternion.setFromUnitVectors(V3(0, -1, 0), local.clone().normalize()); this.beam.scale.y = Math.min(2.2, local.length() / 5 + 0.2);
      if (this.spot) this.spot.target.position.copy(local);
    }
  }
}

// ---------------------------------------------------------------- shared helpers
const stdMat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.2 }, o));
const basicGlow = (color, i = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(i) });
function dustField(parent, n, box, color = [1, 0.9, 0.7], size = 0.05) {
  const pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(box[0], box[1]); pos[i * 3 + 1] = rand(box[2], box[3]); pos[i * 3 + 2] = rand(box[4], box[5]); ph[i] = Math.random() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uC: { value: new THREE.Vector3(...color) }, uS: { value: size } },
    vertexShader: `attribute float ph; uniform float uTime,uScale,uS; varying float vA;
      void main(){ vec3 p=position; p.x+=mod(uTime*0.8+ph*7.0,8.0)-4.0; p.y+=sin(uTime*0.2+ph*1.7)*0.5; p.z+=cos(uTime*0.25+ph)*0.4;
      vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=uS*uScale/max(0.5,-mv.z); gl_Position=projectionMatrix*mv; vA=0.4+0.4*sin(uTime*1.3+ph*3.0); }`,
    fragmentShader: `uniform vec3 uC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); gl_FragColor=vec4(uC*smoothstep(0.5,0.0,d)*vA*0.6,1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; parent.add(pts);
  return mat;
}
function lightShaft(parent, pos, w, d, h, tilt, color, alpha) {
  const geo = new THREE.CylinderGeometry(0.72, 1.0, 1, 4, 1, true); geo.rotateY(Math.PI / 4);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: alpha }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uC; uniform float uA,uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float f=abs(dot(vN,vV)); float a=uA*pow(vUv.y,0.7)*f*f*(0.75+0.25*sin(vUv.x*60.0+uTime*0.4)); gl_FragColor=vec4(uC*a,1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat); m.scale.set(w, h, d); m.position.set(pos[0], pos[1] + h / 2, pos[2]); m.rotation.x = tilt; m.renderOrder = 3; m.userData.noAO = true;
  parent.add(m); Arena.shafts.push(mat); return m;
}
function chainLinks(parent, chains, mat) {
  let n = 0; chains.forEach(c => n += Math.floor(c[3] / 0.15));
  const mesh = new THREE.InstancedMesh(new THREE.TorusGeometry(0.08, 0.022, 6, 12), mat, Math.max(1, n));
  const q = new THREE.Quaternion(), e = new THREE.Euler(); let li = 0;
  for (const [x, top, z, len] of chains) { const k = Math.floor(len / 0.15); for (let i = 0; i < k; i++) { q.setFromEuler(e.set(0, i % 2 ? Math.PI / 2 : 0, Math.PI / 2)); _wm.compose(_wv.set(x, top - i * 0.15, z), q, _ws.set(1, 1, 1)); mesh.setMatrixAt(li++, _wm); } }
  mesh.castShadow = true; parent.add(mesh); return mesh;
}
function baseTextureSet() {
  const s = new Set([TEX.panel, TEX.grunge, TEX.soft, TEX.hazard]);
  for (const k of ['pA', 'pB', 'pC', 'pQ']) if (TEX[k]) { s.add(TEX[k].map); s.add(TEX[k].normal); s.add(TEX[k].metal); }
  _neon.forEach(t => s.add(t));
  return s;
}
