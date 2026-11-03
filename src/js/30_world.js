// ============================================================================
// WORLD: open battle maps (city / desert), destructible chunk buildings, props
// 1 world unit ~ 28 m. Mechs stand 2.1-3.2 units, buildings 2-7 units.
// ============================================================================
const MAPS = [
  { id: 'city', name: 'Harbor City', sub: 'Waterfront district at dusk', bell: 'Harbor City' },
  { id: 'desert', name: 'Red Mesa', sub: 'Desert outpost, golden hour', bell: 'Red Mesa' },
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
  const c = makeCanvas(W, W), g = c.getContext('2d'), e = makeCanvas(W, W), ge = e.getContext('2d');
  ge.fillStyle = '#000'; ge.fillRect(0, 0, W, W);
  const pal = {
    glass: { wall: '#2b3540', win: '#1a2a3a', frame: '#5a6672', lit: ['#ffd9a0', '#bfe3ff', '#fff2d0'], litP: 0.22 },
    office: { wall: '#9a9790', win: '#232a30', frame: '#76736c', lit: ['#ffe2b0', '#fff6e0'], litP: 0.18 },
    brick: { wall: '#7a3e2c', win: '#1e2226', frame: '#c9bca8', lit: ['#ffc98a', '#ffe0b0'], litP: 0.2 },
    adobe: { wall: '#c49a6c', win: '#2a1e16', frame: '#a57d55', lit: ['#ffb060'], litP: 0.05 },
    metal: { wall: '#6f7570', win: '#30343a', frame: '#545a56', lit: ['#ffe0a0'], litP: 0.0 },
    rock: { wall: '#9a5a3a', win: '#6e3b24', frame: '#b06d48', lit: [], litP: 0 },
  }[style];
  g.fillStyle = pal.wall; g.fillRect(0, 0, W, W);
  blotches(g, W, W, 50, '0,0,0', .05, .16, 20, 110);
  for (let cy = 0; cy < 4; cy++) for (let cx = 0; cx < 4; cx++) {
    const x0 = cx * cell, y0 = cy * cell;
    if (style === 'rock') {
      for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(${randi(90, 140)},${randi(45, 70)},${randi(25, 40)},.5)`; g.fillRect(x0, y0 + rnd() * cell, cell, rand(4, 18)); }
      continue;
    }
    if (style === 'metal') {
      for (let k = 0; k < cell; k += 8) { g.fillStyle = k % 16 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.14)'; g.fillRect(x0 + k, y0, 4, cell); }
      g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 3; g.strokeRect(x0 + 2, y0 + 2, cell - 4, cell - 4);
      continue;
    }
    // floor slab line
    g.fillStyle = pal.frame; g.fillRect(x0, y0 + cell - 14, cell, 14);
    const nWin = style === 'glass' ? 2 : style === 'adobe' ? 1 : 2;
    for (let k = 0; k < nWin; k++) {
      const ww = style === 'glass' ? cell / 2 - 6 : style === 'adobe' ? 34 : 40, wh = style === 'glass' ? cell - 24 : style === 'adobe' ? 40 : 62;
      const wx = x0 + (nWin === 1 ? (cell - ww) / 2 : 4 + k * (cell / 2) + (cell / 2 - 8 - ww) / 2), wy = y0 + (cell - 14 - wh) / 2 + 2;
      const lit = rnd() < pal.litP;
      const col = lit ? '#6a5a44' : pal.win; const litCol = pal.lit[(rnd() * Math.max(1, pal.lit.length)) | 0];
      g.fillStyle = pal.frame; g.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
      const gr = g.createLinearGradient(wx, wy, wx + ww, wy + wh); gr.addColorStop(0, col); gr.addColorStop(1, lit ? col : '#0c1218');
      g.fillStyle = gr; g.fillRect(wx, wy, ww, wh);
      if (!lit && style === 'glass') { g.fillStyle = 'rgba(160,190,220,.18)'; g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww * 0.4, wy); g.lineTo(wx + ww * 0.6, wy); g.lineTo(wx + ww * 0.2, wy + wh); g.fill(); }
      if (lit) { ge.fillStyle = litCol; ge.fillRect(wx, wy, ww, wh); if (rnd() < 0.4) { ge.fillStyle = 'rgba(0,0,0,.5)'; ge.fillRect(wx + rnd() * ww * 0.6, wy, ww * 0.3, wh); } }
      g.fillStyle = pal.frame; g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
    }
    if (style === 'brick') { g.strokeStyle = 'rgba(30,15,10,.35)'; g.lineWidth = 1; for (let y = y0; y < y0 + cell - 14; y += 6) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + cell, y); g.stroke(); } }
  }
  scratches(g, W, W, 60, '0,0,0', .2);
  noiseFill(g, W, W, 18);
  const map = linTex(c); map.colorSpace = THREE.SRGBColorSpace; map.repeat.set(0.25, 0.25); map.userData.canvas = c;
  const emi = linTex(e); emi.colorSpace = THREE.SRGBColorSpace; emi.repeat.set(0.25, 0.25);
  return { map, emi };
}
function buildingMaterial(style, night) {
  const t = facadeTex(style, style.length * 97 + 13);
  const glass = style === 'glass';
  const m = new THREE.MeshStandardMaterial({
    map: t.map, emissiveMap: t.emi, emissive: 0xffd9b0, emissiveIntensity: night ? 0.55 : 0.0,
    roughness: glass ? 0.22 : style === 'metal' ? 0.5 : 0.85, metalness: glass ? 0.55 : style === 'metal' ? 0.6 : 0.05,
  });
  m.normalMap = autoNormal(t.map, 1.6); if (m.normalMap) m.normalMap.repeat.set(0.25, 0.25);
  // per-instance UV cell offset so every chunk shows a different patch of facade
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
// box whose UVs tile one facade cell per chunk size (for static skyline / ripped pieces)
function facadeBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const spans = [[d, h], [d, h], [0, 0], [0, 0], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    if (f === 2 || f === 3) { uv.setXY(i, 0.02, 0.02); continue; }
    uv.setXY(i, uv.getX(i) * spans[f][0] / CW, uv.getY(i) * spans[f][1] / CH);
  }
  return g;
}

// ---------------------------------------------------------------- destructible buildings
class Building {
  constructor(set, style, x, z, nx, nz, nh, tint) {
    Object.assign(this, { set, style, x, z, nx, nz, nh, tint });
    this.x0 = x - nx * CW / 2; this.z0 = z - nz * CW / 2; this.x1 = this.x0 + nx * CW; this.z1 = this.z0 + nz * CW;
    this.n = nx * nz * nh; this.alive = new Uint8Array(this.n).fill(1); this.inst = new Int32Array(this.n);
    this.cols = new Float32Array(nx * nz); this.dirty = true; this.aliveCount = this.n; this.lastHit = 0;
  }
  idx(ix, iy, iz) { return (iy * this.nz + iz) * this.nx + ix; }
  center(i, v) { const ix = i % this.nx, iz = Math.floor(i / this.nx) % this.nz, iy = Math.floor(i / (this.nx * this.nz)); return v.set(this.x0 + (ix + 0.5) * CW, (iy + 0.5) * CH + (this.yOff || 0), this.z0 + (iz + 0.5) * CW); }
  refresh() {
    if (!this.dirty) return; this.dirty = false; this.top = 0;
    for (let iz = 0; iz < this.nz; iz++) for (let ix = 0; ix < this.nx; ix++) {
      let h = 0; while (h < this.nh && this.alive[this.idx(ix, h, iz)]) h++;
      this.cols[iz * this.nx + ix] = h * CH; this.top = Math.max(this.top, h * CH);
    }
  }
}
const _wv = V3(), _wv2 = V3(), _wq = new THREE.Quaternion(), _wm = new THREE.Matrix4(), _ws = V3(), _we = new THREE.Euler();

const Arena = {
  id: null, group: null, t: 0, bound: { x0: -26, x1: 26, z0: -26, z1: 19.5 }, buildings: [], dyn: [], pending: [], props: [], cars: null,
  load(id) {
    if (this.id === id) return;
    this.dispose();
    const g = new THREE.Group(); g.name = 'map-' + id; scene.add(g);
    this.group = g; this.id = id; this.current = { id }; this.buildings = []; this.dyn = []; this.pending = []; this.props = []; this.sets = {}; this.cars = null; this.heli = [];
    FX.clearEmitters();
    MAPGEN[id](g, this);
    scene.environment = this.envRT.texture;
    this.applyShadowQuality();
  },
  dispose() {
    if (!this.group) return;
    const geos = new Set(), mats = new Set(), texs = new Set(), cached = new Set(GC.values()), base = baseTextureSet();
    this.group.traverse(o => {
      if (o.geometry && !cached.has(o.geometry)) geos.add(o.geometry);
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { mats.add(m); for (const k of ['map', 'roughnessMap', 'emissiveMap', 'normalMap', 'metalnessMap', 'alphaMap']) if (m[k] && !base.has(m[k])) texs.add(m[k]); });
    });
    geos.forEach(x => x.dispose()); mats.forEach(x => x.dispose()); texs.forEach(x => x.dispose());
    if (this.envRT) this.envRT.dispose();
    scene.remove(this.group); this.group = null; this.id = null; this.current = null;
  },
  applyShadowQuality() {
    const q = QUALITY[settings.quality], sun = this.sun; if (!sun) return;
    sun.castShadow = q.shadow > 0;
    if (q.shadow > 0) { sun.shadow.mapSize.set(q.shadow, q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  },
  groundAt(x, z) {
    if (this.id === 'desert') return desertH(x, z);
    if (this.id === 'city' && z > 20.4) { if (Math.abs(x) < 7) return -Math.min(2.6, (z - 20.4) * 0.36); return -2.6; }
    return 0;
  },
  // ------------------------------------------------ building system
  makeSet(style, night) { const s = { style, mat: buildingMaterial(style, night), list: [] }; this.sets[style] = s; return s; },
  addBuilding(style, x, z, nx, nz, nh, tint) { const b = new Building(this.sets[style], style, x, z, nx, nz, nh, tint); this.sets[style].list.push(b); this.buildings.push(b); return b; },
  finalizeBuildings(g) {
    const geo = new THREE.BoxGeometry(1, 1, 1); const uv = geo.attributes.uv;
    for (let i = 8; i < 16; i++) uv.setXY(i, 0.02, 0.02); // roofs / floors use the frame colour
    for (const key in this.sets) {
      const set = this.sets[key]; let total = 0; set.list.forEach(b => total += b.n);
      if (!total) continue;
      const g2 = geo.clone(); const off = new Float32Array(total * 2);
      const mesh = new THREE.InstancedMesh(g2, set.mat, total); mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
      const col = new THREE.Color(); let k = 0;
      set.owner = []; set.mesh = mesh;
      for (const b of set.list) for (let i = 0; i < b.n; i++) {
        b.center(i, _wv); _wm.compose(_wv, _wq.identity(), _ws.set(CW * 0.995, CH * 0.995, CW * 0.995)); mesh.setMatrixAt(k, _wm);
        col.set(b.tint).multiplyScalar(0.85 + hash2(i, k) * 0.25); mesh.setColorAt(k, col);
        off[k * 2] = Math.floor(hash2(k, 3) * 4) * 0.25; off[k * 2 + 1] = Math.floor(hash2(7, k) * 4) * 0.25;
        b.inst[i] = k; set.owner[k] = b; k++;
      }
      g2.setAttribute('iOff', new THREE.InstancedBufferAttribute(off, 2));
      g.add(mesh);
    }
    this.buildings.forEach(b => b.refresh());
  },
  detach(b, i, vel, delay = 0) {
    if (!b.alive[i]) return; b.alive[i] = 0; b.aliveCount--; b.dirty = true;
    const p = b.center(i, V3());
    const d = { set: b.set, id: b.inst[i], p, v: vel.clone(), q: new THREE.Quaternion(), w: V3(rand(-3, 3), rand(-3, 3), rand(-3, 3)), t: 0, sleep: false, delay, landed: false, s: rand(0.7, 1.0) };
    if (delay > 0) this.pending.push(d); else this.dyn.push(d);
  },
  // smash everything inside a radius; returns how many chunks broke
  impact(p, radius, power, dir, opts = {}) {
    let n = 0;
    for (const b of this.buildings) {
      if (p.x < b.x0 - radius || p.x > b.x1 + radius || p.z < b.z0 - radius || p.z > b.z1 + radius || p.y > b.nh * CH + radius) continue;
      for (let i = 0; i < b.n; i++) {
        if (!b.alive[i]) continue;
        b.center(i, _wv); const dd = _wv.distanceTo(p);
        if (dd < radius * rand(0.75, 1.15)) {
          const out = _wv2.subVectors(_wv, p).normalize();
          const v = V3().copy(dir || out).multiplyScalar(power * rand(0.5, 1.2)).addScaledVector(out, power * 0.5).add(V3(rand(-1, 1), rand(0.5, 2.5) * (power * 0.15), rand(-1, 1)));
          this.detach(b, i, v); n++;
        }
      }
      if (n) this.stabilize(b, dir);
    }
    if (n) {
      FX.dust(p, Math.min(1, n / 20) * 1.5 + 0.6, this.dustColor);
      FX.spark(p, dir || V3(0, 1, 0), Math.min(50, 8 + n * 2), 5, [3, 2.4, 1.6]);
      SFX.crumble(Math.min(1.5, 0.4 + n / 25));
      Game.onDestruction && Game.onDestruction(p, n);
    }
    return n;
  },
  // upper floors fall when what holds them is gone
  stabilize(b, dir) {
    const per = b.nx * b.nz;
    for (let iy = 0; iy < b.nh - 1; iy++) {
      let cnt = 0; for (let j = 0; j < per; j++) if (b.alive[iy * per + j]) cnt++;
      let above = 0; for (let j = (iy + 1) * per; j < b.n; j++) if (b.alive[j]) above++;
      if (above && cnt < per * 0.42) {
        const tilt = (dir ? V3(dir.x, 0, dir.z) : V3(rand(-1, 1), 0, rand(-1, 1))).normalize();
        for (let j = (iy + 1) * per; j < b.n; j++) if (b.alive[j]) {
          const lvl = Math.floor(j / per) - iy;
          this.detach(b, j, V3(tilt.x * rand(0.3, 1.2) * (0.4 + lvl * 0.08), rand(-1.2, 0.2), tilt.z * rand(0.3, 1.2) * (0.4 + lvl * 0.08)), 0.02 + lvl * 0.035 + rand(0, 0.06));
        }
        b.center(per * (iy + 1), _wv); FX.dust(_wv.set((b.x0 + b.x1) / 2, (iy + 1) * CH, (b.z0 + b.z1) / 2), 2.4, this.dustColor);
        SFX.crumble(2); Game.onCollapse && Game.onCollapse(b);
        return;
      }
    }
    // unsupported chunks with no neighbours at their level drop
    for (let iy = 1; iy < b.nh; iy++) for (let iz = 0; iz < b.nz; iz++) for (let ix = 0; ix < b.nx; ix++) {
      const i = b.idx(ix, iy, iz); if (!b.alive[i] || b.alive[b.idx(ix, iy - 1, iz)]) continue;
      const nb = (ix > 0 && b.alive[b.idx(ix - 1, iy, iz)]) || (ix < b.nx - 1 && b.alive[b.idx(ix + 1, iy, iz)]) || (iz > 0 && b.alive[b.idx(ix, iy, iz - 1)]) || (iz < b.nz - 1 && b.alive[b.idx(ix, iy, iz + 1)]);
      if (!nb) this.detach(b, i, V3(rand(-.3, .3), -0.5, rand(-.3, .3)), rand(0, 0.1));
    }
  },
  // push a vertical capsule (x,z,radius, bottom, top) out of standing building columns. Returns the building hit.
  collide(p, r, y0, y1) {
    let hit = null;
    for (const b of this.buildings) {
      if (p.x < b.x0 - r || p.x > b.x1 + r || p.z < b.z0 - r || p.z > b.z1 + r) continue;
      b.refresh(); if (b.top <= y0 + 0.05) continue;
      for (let iz = 0; iz < b.nz; iz++) for (let ix = 0; ix < b.nx; ix++) {
        const h = b.cols[iz * b.nx + ix]; if (h <= y0 + 0.05 || h < 0.3) continue;
        const cx0 = b.x0 + ix * CW, cz0 = b.z0 + iz * CW;
        const qx = clamp(p.x, cx0, cx0 + CW), qz = clamp(p.z, cz0, cz0 + CW);
        const dx = p.x - qx, dz = p.z - qz, d = Math.hypot(dx, dz);
        if (d < r) {
          if (d > 1e-4) { p.x = qx + dx / d * r; p.z = qz + dz / d * r; }
          else { const cx = cx0 + CW / 2, cz = cz0 + CW / 2; const ax = p.x - cx, az = p.z - cz; if (Math.abs(ax) > Math.abs(az)) p.x = cx + Math.sign(ax || 1) * (CW / 2 + r); else p.z = cz + Math.sign(az || 1) * (CW / 2 + r); }
          hit = b;
        }
      }
    }
    return hit;
  },
  // first standing building in front of p within dist (for punches that miss, ripping chunks, AI)
  buildingNear(p, dir, dist, y = 1) {
    let best = null, bd = dist;
    for (const b of this.buildings) {
      b.refresh(); if (b.top < y * 0.5) continue;
      const qx = clamp(p.x + dir.x * 0.3, b.x0, b.x1), qz = clamp(p.z + dir.z * 0.3, b.z0, b.z1);
      const dx = qx - p.x, dz = qz - p.z, d = Math.hypot(dx, dz);
      if (d < bd && (dx * dir.x + dz * dir.z) > -0.05) { bd = d; best = { b, point: V3(qx, Math.min(y, b.top - 0.1), qz), d }; }
    }
    return best;
  },
  nearestBuildingDir(p) { let best = null, bd = 1e9; for (const b of this.buildings) { b.refresh(); if (b.top < 1.2) continue; const qx = clamp(p.x, b.x0, b.x1), qz = clamp(p.z, b.z0, b.z1); const d = Math.hypot(qx - p.x, qz - p.z); if (d < bd) { bd = d; best = V3(qx - p.x, 0, qz - p.z); } } return best && bd < 9 ? best.normalize() : null; },
  // rip a chunk cluster out of a building and return it as a throwable prop
  ripChunk(p, dir, y) {
    const nb = this.buildingNear(p, dir, 1.6, y); if (!nb) return null;
    const b = nb.b, pt = nb.point; let got = 0;
    for (let i = 0; i < b.n && got < 8; i++) { if (!b.alive[i]) continue; b.center(i, _wv); if (_wv.distanceTo(pt) < 0.62) { b.alive[i] = 0; b.aliveCount--; b.dirty = true; this.hideInst(b.set, b.inst[i]); got++; } }
    if (!got) return null;
    this.stabilize(b, dir);
    const geo = facadeBox(CW * 2, CH * 2, CW * 2); geo.setAttribute('iOff', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    const mesh = new THREE.Mesh(geo, b.set.mat); mesh.position.copy(pt); mesh.castShadow = true;
    FX.dust(pt, 1.2, this.dustColor); SFX.crumble(0.9);
    return this.addProp(mesh, { mass: 1.4, size: 0.5, kind: 'chunk' });
  },
  hideInst(set, id) { _wm.makeScale(0, 0, 0); set.mesh.setMatrixAt(id, _wm); set.mesh.instanceMatrix.needsUpdate = true; },
  nearestRubble(p, r) { let best = null, bd = r; for (const d of this.dyn) { if (!d.sleep || d.taken) continue; const dd = Math.hypot(d.p.x - p.x, d.p.z - p.z); if (dd < bd) { bd = dd; best = d; } } return best; },
  rubbleToProp(d) {
    d.taken = true; this.hideInst(d.set, d.id);
    const geo = facadeBox(CW, CH, CW); geo.setAttribute('iOff', new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 2), 2));
    const mesh = new THREE.Mesh(geo, d.set.mat); mesh.position.copy(d.p); mesh.quaternion.copy(d.q); mesh.scale.setScalar(1.4); mesh.castShadow = true;
    return this.addProp(mesh, { mass: 0.8, size: 0.36, kind: 'chunk' });
  },
  updateDyn(dt) {
    for (let i = this.pending.length - 1; i >= 0; i--) { const d = this.pending[i]; d.delay -= dt; if (d.delay <= 0) { this.pending.splice(i, 1); this.dyn.push(d); } }
    const touched = new Set();
    let active = 0;
    for (const d of this.dyn) {
      if (d.sleep) continue; active++;
      d.t += dt; d.v.y -= GRAV * dt;
      d.p.addScaledVector(d.v, dt);
      _wq.setFromEuler(_we.set(d.w.x * dt, d.w.y * dt, d.w.z * dt)); d.q.multiply(_wq);
      const fl = this.groundAt(d.p.x, d.p.z) + CH * 0.4 * d.s;
      if (d.p.y < fl) {
        d.p.y = fl;
        if (!d.landed && d.v.y < -2) { d.landed = true; if (Math.random() < 0.25) FX.dust(d.p, 0.5, this.dustColor); this.crushCars(d.p, 0.3); }
        d.v.y *= -0.22; d.v.x *= 0.55; d.v.z *= 0.55; d.w.multiplyScalar(0.55);
        if (d.v.lengthSq() < 0.04 && d.t > 0.5) d.sleep = true;
      }
      _wm.compose(d.p, d.q, _ws.set(CW * d.s, CH * d.s, CW * d.s)); d.set.mesh.setMatrixAt(d.id, _wm); touched.add(d.set.mesh);
      if (d.t > 9) d.sleep = true;
    }
    touched.forEach(m => m.instanceMatrix.needsUpdate = true);
    if (active > 900) { let k = 0; for (const d of this.dyn) { if (!d.sleep && k++ < active - 900) d.sleep = true; } }
  },
  // ------------------------------------------------ props
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
      const m = new THREE.Mesh(G.box(q.size * rand(0.3, 0.5), q.size * rand(0.2, 0.4), q.size * rand(0.3, 0.5), 0.01), mat);
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
  // ------------------------------------------------ cars (instanced, crushable)
  makeCars(spots) {
    const body = new THREE.BoxGeometry(0.075, 0.045, 0.17).toNonIndexed(); body.translate(0, 0.03, 0);
    const cab = new THREE.BoxGeometry(0.065, 0.035, 0.09).toNonIndexed(); cab.translate(0, 0.065, -0.01);
    const geo = mergeGeometries([body, cab]);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.6 }), spots.length);
    const cols = [0xb8221c, 0x1d4e9e, 0xe8e8e8, 0x1a1a1a, 0xd8b02a, 0x6a6e72, 0x2a7a4a];
    const c = new THREE.Color();
    this.cars = { mesh, list: spots.map((s, i) => { _wm.compose(_wv.set(s[0], this.groundAt(s[0], s[1]), s[1]), _wq.setFromAxisAngle(V3(0, 1, 0), s[2]), _ws.set(1, 1, 1)); mesh.setMatrixAt(i, _wm); c.set(pick(cols)); mesh.setColorAt(i, c); return { x: s[0], z: s[1], r: s[2], crushed: false }; }) };
    mesh.castShadow = false; mesh.receiveShadow = true; this.group.add(mesh);
  },
  crushCars(p, r) {
    if (!this.cars) return; let n = 0; const c = new THREE.Color(0x222222);
    for (let i = 0; i < this.cars.list.length; i++) {
      const k = this.cars.list[i]; if (k.crushed || Math.abs(k.x - p.x) > r || Math.abs(k.z - p.z) > r) continue;
      k.crushed = true; n++;
      _wm.compose(_wv.set(k.x, this.groundAt(k.x, k.z), k.z), _wq.setFromAxisAngle(V3(0, 1, 0), k.r + rand(-.4, .4)), _ws.set(1.25, 0.28, 1.1)); this.cars.mesh.setMatrixAt(i, _wm);
      this.cars.mesh.setColorAt(i, c);
      FX.spark(_wv.set(k.x, 0.05, k.z), V3(0, 1, 0), 6, 2, [3, 2.5, 1.5], 1, 0.3);
    }
    if (n) { this.cars.mesh.instanceMatrix.needsUpdate = true; this.cars.mesh.instanceColor.needsUpdate = true; }
  },
  // ------------------------------------------------ per frame
  update(dt, t, excite, fighters) {
    if (!this.current) return;
    this.t += dt;
    this.updateDyn(dt);
    this.updateProps(dt, fighters);
    if (this.water) { const n = this.water.material.normalMap; n.offset.x += dt * 0.012; n.offset.y += dt * 0.007; }
    if (this.dust) { this.dust.uniforms.uTime.value = this.t; this.dust.uniforms.uScale.value = FX.glow.mat.uniforms.uScale.value; }
    for (const h of this.heli) h.update(dt, this.t);
    // sun shadow box follows the action
    if (this.sun && fighters.length) {
      const m = _wv.set(0, 0, 0); fighters.forEach(f => m.add(f.rag ? f.rag.pos('pelvis') : f.pos)); m.divideScalar(fighters.length); m.y = 0;
      this.sun.target.position.copy(m); this.sun.position.copy(m).addScaledVector(this.sunDir, 60);
    }
  },
  splat() { },
};

// ---------------------------------------------------------------- helicopters (ambient + air-drop intro)
class Heli {
  constructor(parent, pathR, h, speed, phase) {
    this.g = new THREE.Group(); parent.add(this.g);
    const dark = stdMat(0x2a2f33, { metalness: 0.6, roughness: 0.45 });
    const add = (geo, mat, p, r = [0, 0, 0]) => { const m = new THREE.Mesh(geo, mat); m.position.set(...p); m.rotation.set(...r); m.castShadow = true; this.g.add(m); return m; };
    add(new THREE.CapsuleGeometry(0.07, 0.16, 4, 10), dark, [0, 0, 0], [Math.PI / 2, 0, 0]);
    add(new THREE.BoxGeometry(0.02, 0.02, 0.28), dark, [0, 0.02, -0.22]);
    add(new THREE.BoxGeometry(0.01, 0.07, 0.05), dark, [0, 0.05, -0.36]);
    this.rotor = add(new THREE.BoxGeometry(0.5, 0.004, 0.025), dark, [0, 0.09, 0]);
    add(new THREE.SphereGeometry(0.012, 6, 4), basicGlow(0xff3020, 6), [0, -0.06, 0.05]);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 16, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d0).multiplyScalar(0.12), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.set(0, -2.05, 0.1); beam.userData.noAO = true; this.g.add(beam); this.beam = beam;
    Object.assign(this, { pathR, h, speed, phase, manual: false });
  }
  update(dt, t) {
    this.rotor.rotation.y += dt * 40;
    if (this.manual) return;
    const a = t * this.speed + this.phase;
    this.g.position.set(Math.cos(a) * this.pathR, this.h + Math.sin(t * 0.7 + this.phase) * 0.5, Math.sin(a) * this.pathR);
    this.g.rotation.set(0.12, -a - Math.PI / 2 * Math.sign(this.speed), 0.15);
  }
}

// ---------------------------------------------------------------- sky + lighting shared by both maps
function setupSky(g, A, o) {
  const sky = new Sky(); sky.scale.setScalar(380); sky.frustumCulled = false; sky.userData.noAO = true;
  const u = sky.material.uniforms; u.turbidity.value = o.turbidity; u.rayleigh.value = o.rayleigh; u.mieCoefficient.value = o.mie; u.mieDirectionalG.value = 0.86;
  const sunDir = V3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - o.elev), THREE.MathUtils.degToRad(o.azim));
  u.sunPosition.value.copy(sunDir); g.add(sky);
  // environment reflections from the same sky
  const es = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(100); Object.keys(u).forEach(k => sky2.material.uniforms[k].value = u[k].value); es.add(sky2);
  if (o.envGround) { const gm = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: o.envGround })); gm.rotation.x = -Math.PI / 2; gm.position.y = -2; es.add(gm); }
  const pm = new THREE.PMREMGenerator(renderer); A.envRT = pm.fromScene(es, 0.02); pm.dispose(); sky2.geometry.dispose(); sky2.material.dispose();
  const sun = new THREE.DirectionalLight(o.sunColor, o.sunI);
  sun.shadow.camera.left = -17; sun.shadow.camera.right = 17; sun.shadow.camera.top = 17; sun.shadow.camera.bottom = -17; sun.shadow.camera.near = 5; sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
  g.add(sun, sun.target); A.sun = sun; A.sunDir = sunDir.clone();
  g.add(new THREE.HemisphereLight(o.skyC, o.groundC, o.hemiI));
  scene.fog = new THREE.FogExp2(o.fog, o.fogD); scene.background = new THREE.Color(o.fog);
}

const MAPGEN = {};

// ------------------------------------------------------------ HARBOR CITY
MAPGEN.city = (g, A) => {
  setupSky(g, A, { elev: 3.5, azim: 205, turbidity: 9, rayleigh: 2.6, mie: 0.006, sunColor: 0xffa070, sunI: 2.6, skyC: 0x8a97c8, groundC: 0x40302c, hemiI: 0.75, fog: 0x6b5d68, fogD: 0.0105, envGround: 0x2a2624 });
  A.dustColor = [0.45, 0.42, 0.4]; A.bound = { x0: -27, x1: 27, z0: -27, z1: 19.6 };
  const BS = 7.5, RW = 2.2;
  // ground: road grid, sidewalks, plaza
  const S = 2048, span = 120, px = S / span;
  const gt = canvasTex(S, S, (c) => {
    c.fillStyle = '#5d5a55'; c.fillRect(0, 0, S, S);
    const toPx = v => (v + span / 2) * px;
    for (let k = -8; k <= 8; k++) {
      const v = toPx(k * BS);
      c.fillStyle = '#2b2c2e'; c.fillRect(v - RW / 2 * px, 0, RW * px, S); c.fillRect(0, v - RW / 2 * px, S, RW * px);
    }
    for (let k = -8; k <= 8; k++) {
      const v = toPx(k * BS); c.strokeStyle = '#c9a63a'; c.lineWidth = 2; c.setLineDash([10, 10]);
      c.beginPath(); c.moveTo(v, 0); c.lineTo(v, S); c.stroke(); c.beginPath(); c.moveTo(0, v); c.lineTo(S, v); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(230,230,220,.55)'; c.lineWidth = 3;
      for (let j = -8; j <= 8; j++) { const w = toPx(j * BS); for (let s = -4; s <= 4; s += 1.6) { c.beginPath(); c.moveTo(w + s * 3 - 6, v - RW * px * 0.55); c.lineTo(w + s * 3 - 6, v - RW * px * 0.35); c.stroke(); } }
    }
    const pl = toPx(-BS + RW / 2), pw = (2 * BS - RW) * px; c.fillStyle = '#7d766c'; c.fillRect(pl, pl, pw, pw);
    c.strokeStyle = 'rgba(40,36,30,.35)'; c.lineWidth = 1; for (let i = 0; i < pw; i += 10) { c.beginPath(); c.moveTo(pl + i, pl); c.lineTo(pl + i, pl + pw); c.stroke(); c.beginPath(); c.moveTo(pl, pl + i); c.lineTo(pl + pw, pl + i); c.stroke(); }
    c.fillStyle = '#8a8378'; c.fillRect(0, toPx(19.8), S, toPx(20.5) - toPx(19.8));
    blotches(c, S, S, 300, '0,0,0', .05, .18, 10, 60); noiseFill(c, S, S, 14);
  }, { repeat: [1, 1] });
  gt.wrapS = gt.wrapT = THREE.ClampToEdgeWrapping;
  const detail = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#888'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 90); blotches(c, w, h, 40, '0,0,0', .1, .3, 4, 20); }, { repeat: [60, 60] });
  const groundMat = new THREE.MeshStandardMaterial({ map: gt, roughness: 0.9, metalness: 0.02, normalMap: autoNormal(detail, 2.5) });
  groundMat.normalMap.repeat.set(60, 60);
  const gg = new THREE.PlaneGeometry(span, 80.4, 1, 1); gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -19.8);
  { const p = gg.attributes.position, uv = gg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 60) / 120, 1 - (p.getZ(i) + 60) / 120); }
  const ground = new THREE.Mesh(gg, groundMat); ground.receiveShadow = true; g.add(ground);
  // water with animated ripples, quay wall and boat ramp
  const wn = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { const x = Math.random() * w, y = Math.random() * h, r = rand(3, 14); const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); } }, { srgb: false });
  const waterMat = new THREE.MeshStandardMaterial({ color: 0x0f2a33, roughness: 0.06, metalness: 0.0, normalMap: autoNormal(wn, 3), envMapIntensity: 1.4 });
  waterMat.normalMap.repeat.set(30, 15);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.32, 120.4); g.add(water); A.water = water;
  const B = new Batch();
  const concrete = stdMat(0x8a857c, { roughness: 0.85 });
  B.add(G.cube(53, 2.8, 0.5), concrete, [-33.5, -1.4, 20.6]);
  B.add(G.cube(53, 2.8, 0.5), concrete, [33.5, -1.4, 20.6]);
  for (const s of [-1, 1]) B.add(G.cube(0.5, 2.8, 7.6), concrete, [s * 7.25, -1.4, 24.2]);
  const ramp = new THREE.PlaneGeometry(14, 7.6, 1, 1); ramp.rotateX(-Math.PI / 2); const rp = ramp.attributes.position;
  for (let i = 0; i < rp.count; i++) rp.setY(i, rp.getZ(i) > 0 ? -2.65 : 0); ramp.translate(0, 0, 24.2); ramp.computeVertexNormals();
  const rampM = new THREE.Mesh(ramp, concrete); rampM.receiveShadow = true; g.add(rampM);
  for (let x = -26; x <= 26; x += 2.2) if (Math.abs(x) > 7.5) B.add(G.cyl(0.05, 0.06, 0.12, 8), stdMat(0x22262a, { metalness: 0.7 }), [x, 0.06, 20.1]);
  // gantry cranes and a moored cargo ship (background)
  const red = stdMat(0xb8392a, { metalness: 0.5, roughness: 0.5 });
  for (const cx of [-20, -13, 14]) {
    for (const [dx, dz] of [[-0.8, 19.2], [0.8, 19.2], [-0.8, 21.6], [0.8, 21.6]]) B.add(G.cube(0.15, 5.2, 0.15), red, [cx + dx, 2.6, dz]);
    B.add(G.cube(1.9, 0.3, 9), red, [cx, 5.3, 23]); B.add(G.cube(0.5, 0.5, 0.6), stdMat(0x333333), [cx, 4.9, 25]);
  }
  const hull = stdMat(0x24333f, { roughness: 0.6, metalness: 0.4 });
  B.add(G.cube(13, 1.8, 2.6), hull, [-16, -0.2, 27]); B.add(G.cube(2.4, 1.6, 2.2), stdMat(0xd8d4c8), [-21.5, 1.4, 27]);
  const cMats = [0xa13a24, 0x245e7a, 0xc2862a, 0x3a6e3a, 0x8a8a84].map(c => stdMat(c, { map: (() => { const t = canvasTex(128, 128, (cc, w, h) => { for (let x = 0; x < w; x++) { const v = 180 + Math.sin(x / w * Math.PI * 16) * 60; cc.fillStyle = `rgb(${v},${v},${v})`; cc.fillRect(x, 0, 1, h); } noiseFill(cc, w, h, 30); }); return t; })(), roughness: 0.6, metalness: 0.4 }));
  for (let i = 0; i < 18; i++) B.add(G.cube(0.95, 0.42, 0.44), pick(cMats), [-21 + (i % 6) * 1.0, 0.65 + Math.floor(i / 6) * 0.42, 27]);
  // street lamps
  const pole = stdMat(0x2a2d30, { metalness: 0.7, roughness: 0.4 }), lampG = basicGlow(0xffc77a, 8);
  for (let k = -3; k <= 3; k++) for (let j = -3; j <= 2; j++) for (const s of [-1, 1]) {
    const x = k * BS + s * (RW / 2 + 0.12), z = j * BS + 2.5; if (z > 19) continue;
    B.add(G.cyl(0.012, 0.016, 0.42, 5), pole, [x, 0.21, z]); B.add(G.box(0.07, 0.015, 0.03, 0.005), lampG, [x - s * 0.03, 0.42, z]);
  }
  // distant skyline (static)
  const night = true;
  for (const st of ['glass', 'office', 'brick']) A.makeSet(st, night);
  const rng = mulberry32(42);
  for (let i = 0; i < 70; i++) {
    const a = rng() * Math.PI * 2, r = 38 + rng() * 60, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 30 && Math.abs(x) < 70) continue;
    const w = 2 + rng() * 4, d = 2 + rng() * 4, h = 6 + rng() * (r > 60 ? 22 : 12), st = pick(['glass', 'office', 'brick', 'glass']);
    B.add(facadeBox(w, h, d), A.sets[st].mat, [x, h / 2, z]);
    if (rng() < 0.4) B.add(G.cube(w * 0.5, 1.2, d * 0.5), A.sets[st].mat, [x, h + 0.6, z]);
  }
  B.build(g, { receive: true, cast: true });
  // destructible city blocks
  const tints = { glass: [0x9fb6c9, 0x7a8fa8, 0xb8c7d4], office: [0xd8d2c4, 0xb9b3a6, 0xe6e0d0], brick: [0xb0806a, 0xc49a7f, 0x9a6a58] };
  for (let bx = -4; bx < 4; bx++) for (let bz = -4; bz < 3; bz++) {
    const cx = (bx + 0.5) * BS, cz = (bz + 0.5) * BS;
    if (Math.abs(cx) < 5 && Math.abs(cz) < 5) continue;   // central plaza
    const inner = BS - RW - 0.4, lots = rng() < 0.35 ? 1 : rng() < 0.6 ? 2 : 4;
    const back = cz < -9, wf = cz > 14;
    for (let l = 0; l < lots; l++) {
      const lw = lots === 4 ? inner / 2 : lots === 2 ? inner / 2 : inner, ld = lots === 4 ? inner / 2 : inner;
      const ox = lots === 1 ? 0 : (l % 2 ? 1 : -1) * inner / 4, oz = lots === 4 ? (l < 2 ? -1 : 1) * inner / 4 : 0;
      const nx = Math.max(2, Math.floor((lw - 0.3) / CW) - (rng() < 0.4 ? 1 : 0)), nz = Math.max(2, Math.floor((ld - 0.3) / CW) - (rng() < 0.4 ? 1 : 0));
      const nh = wf ? 3 + Math.floor(rng() * 4) : Math.floor((back ? 12 : 7) + rng() * (back ? 9 : 8));
      const st = wf ? 'brick' : pick(['glass', 'office', 'brick', 'glass', 'office']);
      A.addBuilding(st, cx + ox, cz + oz, Math.min(nx, 7), Math.min(nz, 7), nh, pick(tints[st]));
    }
  }
  A.finalizeBuildings(g);
  // cars on the roads
  const cars = [];
  for (let k = -4; k <= 4; k++) for (let t = -28; t < 20; t += rand(0.4, 1.4)) {
    if (Math.abs(k * BS) < 8 && Math.abs(t) < 8) continue;
    const lane = rand() < 0.5 ? -0.45 : 0.45;
    if (rand() < 0.5) cars.push([k * BS + lane, t, rand() < 0.5 ? 0 : Math.PI]); else if (t < 19) cars.push([t, k * BS + lane, Math.PI / 2]);
  }
  A.makeCars(cars.filter(c => c[1] < 19.5));
  // throwable props: containers on the quay, buses, a statue
  const busMat = stdMat(0xd8a42a, { roughness: 0.4, metalness: 0.3 });
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(G.box(0.95, 0.42, 0.44, 0.02), pick(cMats)); m.position.set(-24 + i * 2.4 + rand(-.3, .3), 0.21, 18.4 + rand(-.3, .3)); m.rotation.y = rand(-.3, .3); m.castShadow = true; A.addProp(m, { mass: 1, size: 0.48, kind: 'container' }); }
  for (const [x, z, r] of [[-7.5, -3, 0], [7.5, 5, 0], [3, 7.5, 1.57], [-4, -7.5, 1.57], [15, -10, 0], [-15, 12, 0]]) { const m = new THREE.Mesh(G.box(0.12, 0.13, 0.48, 0.02), busMat); m.position.set(x, 0.07, z); m.rotation.y = r; m.castShadow = true; A.addProp(m, { mass: 0.6, size: 0.3, kind: 'bus' }); }
  const statue = new THREE.Group(); statue.add(new THREE.Mesh(G.cyl(0.35, 0.45, 0.4, 16), concrete)); const fig = new THREE.Mesh(G.box(0.25, 0.7, 0.2, 0.05), stdMat(0x5f7a6a, { metalness: 0.7, roughness: 0.4 })); fig.position.y = 0.55; statue.add(fig);
  statue.position.set(0, 0.2, 0); statue.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.add(statue); A.addProp(statue, { mass: 1.6, size: 0.55, kind: 'statue' });
  // helicopters circling with searchlights
  A.heli.push(new Heli(g, 14, 9, 0.12, 0), new Heli(g, 19, 11, -0.09, 2));
  A.dust = dustField(g, 400, [-25, 25, 0.5, 9, -25, 18], [0.6, 0.6, 0.7], 0.035);
};

// ------------------------------------------------------------ RED MESA desert
MAPGEN.desert = (g, A) => {
  setupSky(g, A, { elev: 13, azim: 235, turbidity: 5, rayleigh: 1.3, mie: 0.005, sunColor: 0xffd2a0, sunI: 3.4, skyC: 0x9ab4d8, groundC: 0x8a5a38, hemiI: 0.7, fog: 0xc6a37e, fogD: 0.0095, envGround: 0x9a6a42 });
  A.dustColor = [0.75, 0.58, 0.42]; A.bound = { x0: -26, x1: 26, z0: -26, z1: 26 };
  const sand = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#c8955f'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { c.fillStyle = `rgba(${y % 9 ? 255 : 90},${y % 9 ? 220 : 60},${y % 9 ? 170 : 30},.06)`; c.fillRect(0, y + Math.sin(y * 0.3) * 2, w, 2); }
    blotches(c, w, h, 80, '120,70,40', .05, .2, 10, 90); blotches(c, w, h, 40, '255,230,190', .05, .15, 10, 60); noiseFill(c, w, h, 22);
  }, { repeat: [50, 50] });
  const geo = new THREE.PlaneGeometry(320, 320, 220, 220); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, desertH(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const gm = new THREE.MeshStandardMaterial({ map: sand, roughness: 0.95, metalness: 0, normalMap: autoNormal(sand, 2.5) });
  const ground = new THREE.Mesh(geo, gm); ground.receiveShadow = true; g.add(ground);
  // mesas
  const B = new Batch(); const rng = mulberry32(9);
  const rockTex = canvasTex(256, 256, (c, w, h) => { for (let y = 0; y < h; y++) { const v = Math.sin(y * 0.18) * 20 + Math.sin(y * 0.07) * 30; c.fillStyle = `rgb(${150 + v},${80 + v * 0.6},${50 + v * 0.3})`; c.fillRect(0, y, w, 1); } noiseFill(c, w, h, 40); blotches(c, w, h, 30, '40,20,10', .1, .3, 5, 40); });
  const rockMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.92, normalMap: autoNormal(rockTex, 3) });
  for (let i = 0; i < 16; i++) {
    const a = rng() * Math.PI * 2, r = 55 + rng() * 70, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const rad = 4 + rng() * 10, h = 6 + rng() * 14;
    const mg = new THREE.CylinderGeometry(rad * 0.8, rad, h, 18, 6); const mp = mg.attributes.position;
    for (let k = 0; k < mp.count; k++) { const px = mp.getX(k), py = mp.getY(k), pz = mp.getZ(k); const n = 1 + (fbm(px * 0.3 + i, py * 0.4 + pz * 0.3) - 0.5) * 0.5; mp.setX(k, px * n); mp.setZ(k, pz * n); }
    mg.computeVertexNormals();
    B.add(mg, rockMat, [x, desertH(x, z) + h / 2 - 1, z]);
  }
  B.build(g, { receive: true, cast: true });
  // outpost: adobe houses, concrete blocks, tall rock spires (all destructible)
  A.makeSet('adobe', false); A.makeSet('metal', false); A.makeSet('rock', false);
  const place = (st, x, z, nx, nz, nh, tint) => { if (Math.hypot(x, z) < 6.5) return; const b = A.addBuilding(st, x, z, nx, nz, nh, tint); b.yOff = Math.min(desertH(b.x0, b.z0), desertH(b.x1, b.z0), desertH(b.x0, b.z1), desertH(b.x1, b.z1)) - 0.04; };
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * Math.PI * 2 + rng() * 0.2, r = 9 + rng() * 13, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const t = rng();
    if (t < 0.45) place('adobe', x, z, 3 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 4), pick([0xe0c4a0, 0xd4ae86, 0xc89a72]));
    else if (t < 0.7) place('metal', x, z, 3 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 3), 6 + Math.floor(rng() * 6), pick([0xc0c4c0, 0xa8aca6]));
    else place('rock', x, z, 2 + Math.floor(rng() * 2), 2 + Math.floor(rng() * 2), 10 + Math.floor(rng() * 9), pick([0xd08a60, 0xc07850]));
  }
  A.finalizeBuildings(g);
  // boulders, fuel tanks, trucks
  const boulderMat = new THREE.MeshStandardMaterial({ map: rockTex, roughness: 0.9, normalMap: rockMat.normalMap });
  for (let i = 0; i < 22; i++) {
    const a = rng() * Math.PI * 2, r = 4 + rng() * 20, x = Math.cos(a) * r, z = Math.sin(a) * r, s = 0.35 + rng() * 0.35;
    const bg = new THREE.IcosahedronGeometry(s, 2); const bp = bg.attributes.position;
    for (let k = 0; k < bp.count; k++) { const v = V3(bp.getX(k), bp.getY(k), bp.getZ(k)); v.multiplyScalar(0.8 + fbm(v.x * 4 + i, v.y * 4 + v.z * 3) * 0.45); bp.setXYZ(k, v.x, v.y * 0.8, v.z); }
    bg.computeVertexNormals();
    const m = new THREE.Mesh(bg, boulderMat); m.position.set(x, desertH(x, z) + s * 0.6, z); m.rotation.y = rng() * 6; m.castShadow = true; m.receiveShadow = true;
    A.addProp(m, { mass: s * 2.5, size: s, kind: 'rock' });
  }
  const tankMat = stdMat(0xd8d6cf, { metalness: 0.6, roughness: 0.35 });
  for (let i = 0; i < 6; i++) {
    const a = rng() * 6.28, r = 7 + rng() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const m = new THREE.Mesh(G.cyl(0.22, 0.22, 0.6, 18), tankMat); m.rotation.z = Math.PI / 2; m.position.set(x, desertH(x, z) + 0.23, z); m.castShadow = true;
    const stripe = new THREE.Mesh(G.cyl(0.225, 0.225, 0.08, 18), basicGlow(0xd8341a, 1)); m.add(stripe);
    A.addProp(m, { mass: 0.9, size: 0.35, kind: 'tank', explosive: true });
  }
  A.dust = dustField(g, 700, [-30, 30, 0.2, 6, -30, 30], [1.0, 0.85, 0.65], 0.05);
  A.heli.push(new Heli(g, 22, 10, 0.08, 1));
};

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
function baseTextureSet() {
  const s = new Set([TEX.panel, TEX.grunge, TEX.soft]);
  for (const k of ['pA', 'pB', 'pC', 'pQ']) if (TEX[k]) { s.add(TEX[k].map); s.add(TEX[k].normal); s.add(TEX[k].metal); }
  return s;
}
