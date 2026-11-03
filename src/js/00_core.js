// ============================================================================
// IRONVOLT — core: renderer, post, utilities, procedural textures, audio
// ============================================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, l, dt) => lerp(a, b, 1 - Math.exp(-l * dt));
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeIn = t => t * t;
const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = t => t * t * (3 - 2 * t);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

const store = {
  get(k, d) { try { const v = localStorage.getItem('ironvolt.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ironvolt.' + k, JSON.stringify(v)); } catch (e) { } },
};
const IS_TOUCH = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
const settings = Object.assign({ quality: IS_TOUCH ? 'medium' : 'high', shake: true, music: 0.5, sfx: 0.9, cam: 'shoulder', voice: true }, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);

const QUALITY = {
  low: { pr: 1, msaa: 0, bloom: false, shadow: 0, crowd: 0.45 },
  medium: { pr: 1.35, msaa: 2, bloom: true, shadow: 1024, crowd: 0.75 },
  high: { pr: 2, msaa: 4, bloom: true, shadow: 2048, crowd: 1 },
};

// ---------------------------------------------------------------- renderer
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
} catch (e) {
  $('err').hidden = false;
  $('err').textContent = 'WebGL is not available in this browser, so the 3D arena cannot be drawn. Try a recent Chrome, Edge, Firefox or Safari with hardware acceleration turned on.';
  throw e;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
$('stage').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 500);
camera.position.set(0, 3, 8);

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.85 }, uAberr: { value: 0.0015 },
    uFlash: { value: 0 }, uDesat: { value: 0 }, uGrain: { value: 0.035 }, uTint: { value: new THREE.Color(1, 1, 1) },
    uRes: { value: new THREE.Vector2(1, 1) }, uRed: { value: 0 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime,uVig,uAberr,uFlash,uDesat,uGrain,uRed; uniform vec3 uTint; uniform vec2 uRes;
    varying vec2 vUv;
    void main(){
      vec2 c=vUv-0.5; float r=dot(c,c);
      vec2 off=c*uAberr*(1.0+r*6.0);
      vec3 col=vec3(texture2D(tDiffuse,vUv+off).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-off).b);
      float l=dot(col,vec3(0.299,0.587,0.114));
      col=mix(col,vec3(l),uDesat);
      col*=uTint;
      col=mix(col,vec3(1.0,0.96,0.88),uFlash);
      col*=1.0-uVig*r*1.15;
      col=mix(col,col*vec3(1.25,0.55,0.5),uRed*smoothstep(0.08,0.35,r));
      float n=fract(sin(dot(vUv*uRes+fract(uTime)*91.7,vec2(12.9898,78.233)))*43758.5453);
      col+=(n-0.5)*uGrain;
      gl_FragColor=vec4(col,1.0);
    }`,
};

let composer, bloomPass, gradePass;
function buildComposer() {
  const q = QUALITY[settings.quality];
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pr));
  renderer.setSize(innerWidth, innerHeight, false);
  if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: q.msaa });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = null;
  if (q.bloom) { bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.55, 0.88); composer.addPass(bloomPass); }
  composer.addPass(new OutputPass());
  gradePass = new ShaderPass(GradeShader);
  gradePass.uniforms.uRes.value.set(innerWidth, innerHeight);
  composer.addPass(gradePass);
  renderer.shadowMap.enabled = q.shadow > 0;
  scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.needsUpdate = true); });
  if (typeof Arena !== 'undefined' && Arena.current) Arena.applyShadowQuality();
  FX.resize && FX.resize();
}
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  gradePass.uniforms.uRes.value.set(innerWidth, innerHeight);
  FX.resize && FX.resize();
});

// ---------------------------------------------------------------- procedural textures
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function canvasTex(w, h, draw, { repeat = null, srgb = true, aniso = 8 } = {}) {
  const c = makeCanvas(w, h); const g = c.getContext('2d'); draw(g, w, h, c);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  t.userData.canvas = c;
  return t;
}
function noiseFill(g, w, h, amt, mono = true) {
  const id = g.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amt;
    d[i] += n; d[i + 1] += mono ? n : (Math.random() - 0.5) * amt; d[i + 2] += mono ? n : (Math.random() - 0.5) * amt;
  }
  g.putImageData(id, 0, 0);
}
function blotches(g, w, h, n, col, aMin, aMax, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = rand(rMin, rMax);
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${col},${rand(aMin, aMax)})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}
function scratches(g, w, h, n, col, aMax) {
  for (let i = 0; i < n; i++) {
    g.strokeStyle = `rgba(${col},${rand(0.04, aMax)})`; g.lineWidth = rand(0.6, 1.6);
    const x = Math.random() * w, y = Math.random() * h, a = Math.random() * Math.PI, l = rand(8, 60);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
}
function rivet(g, x, y, r = 5) {
  g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.arc(x + 1, y + 1.5, r, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - .5, y - .5, r * .75, 0, 7); g.fill();
}

const TEX = {};
function buildBaseTextures() {
  TEX.panel = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#e4e4e2'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 50, '0,0,0', .03, .09, 30, 120);
    blotches(g, w, h, 20, '255,255,255', .03, .08, 30, 90);
    noiseFill(g, w, h, 14);
    g.strokeStyle = 'rgba(15,15,15,.85)'; g.lineWidth = 5; g.strokeRect(18, 18, w - 36, h - 36);
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.strokeRect(23, 23, w - 46, h - 46);
    g.strokeStyle = 'rgba(15,15,15,.6)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(18, h * .64); g.lineTo(w * .42, h * .64); g.lineTo(w * .5, h - 18); g.stroke();
    for (const [x, y] of [[34, 34], [w - 34, 34], [34, h - 34], [w - 34, h - 34], [w / 2, 34], [w / 2, h - 34]]) rivet(g, x, y);
    scratches(g, w, h, 70, '255,255,255', .3);
    scratches(g, w, h, 40, '0,0,0', .25);
    // edge wear chips
    for (let i = 0; i < 40; i++) { const e = Math.random() < .5; const x = e ? (Math.random() < .5 ? rand(10, 30) : rand(w - 30, w - 10)) : rand(0, w); const y = e ? rand(0, h) : (Math.random() < .5 ? rand(10, 30) : rand(h - 30, h - 10)); g.fillStyle = `rgba(40,36,30,${rand(.2, .6)})`; g.beginPath(); g.ellipse(x, y, rand(2, 7), rand(1, 4), Math.random() * 3, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(20,20,20,.55)'; g.font = 'bold 22px monospace'; g.fillText('IV-' + randi(10, 99), w - 120, h - 52);
    g.fillStyle = 'rgba(20,20,20,.35)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(44 + i * 18, 60); g.lineTo(54 + i * 18, 70); g.lineTo(44 + i * 18, 80); g.lineTo(50 + i * 18, 80); g.lineTo(60 + i * 18, 70); g.lineTo(50 + i * 18, 60); g.fill(); }
  });
  TEX.grunge = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = 'rgb(165,165,165)'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 80, '255,255,255', .05, .2, 20, 100);
    blotches(g, w, h, 60, '40,40,40', .05, .2, 10, 70);
    noiseFill(g, w, h, 50);
    scratches(g, w, h, 120, '60,60,60', .5);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 6; g.strokeRect(18, 18, w - 36, h - 36);
  }, { srgb: false });
  TEX.soft = canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

// environment map rendered from a tiny emissive room -> PBR reflections that match each venue
function makeEnvMap(cfg) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(60, 30, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(cfg.wall), side: THREE.BackSide }));
  s.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: new THREE.Color(cfg.floor || cfg.wall).multiplyScalar(0.6) }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -14.9; s.add(floor);
  for (const p of cfg.panels) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), new THREE.MeshBasicMaterial({ color: new THREE.Color(p.color).multiplyScalar(p.i), side: THREE.DoubleSide }));
    m.position.set(...p.pos); m.lookAt(0, 0, 0); s.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.035);
  pm.dispose();
  s.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  return rt;
}

// ---------------------------------------------------------------- static geometry batching
const _bq = new THREE.Quaternion(), _be = new THREE.Euler(), _bm = new THREE.Matrix4(), _bs = new THREE.Vector3();
class Batch {
  constructor() { this.map = new Map(); }
  add(geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = 1) {
    if (rot instanceof THREE.Quaternion) _bq.copy(rot); else _bq.setFromEuler(_be.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ'));
    if (typeof scl === 'number') _bs.set(scl, scl, scl); else _bs.set(scl[0], scl[1], scl[2]);
    _bm.compose(new THREE.Vector3(pos[0], pos[1], pos[2]), _bq, _bs);
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(_bm);
    if (!this.map.has(mat)) this.map.set(mat, []);
    this.map.get(mat).push(g);
    return this;
  }
  build(parent, { cast = false, receive = true } = {}) {
    const out = [];
    for (const [mat, list] of this.map) {
      const merged = mergeGeometries(list, false);
      list.forEach(g => g.dispose());
      if (!merged) continue;
      const m = new THREE.Mesh(merged, mat); m.castShadow = cast; m.receiveShadow = receive; m.matrixAutoUpdate = false; m.updateMatrix();
      parent.add(m); out.push(m);
    }
    this.map.clear();
    return out;
  }
}

// geometry cache
const GC = new Map();
const G = {
  box(w, h, d, r = 0.03, seg = 2) { const k = `b${w},${h},${d},${r}`; if (!GC.has(k)) GC.set(k, new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3))); return GC.get(k); },
  cube(w, h, d) { const k = `c${w},${h},${d}`; if (!GC.has(k)) GC.set(k, new THREE.BoxGeometry(w, h, d)); return GC.get(k); },
  sph(r, ws = 24, hs = 16) { const k = `s${r},${ws}`; if (!GC.has(k)) GC.set(k, new THREE.SphereGeometry(r, ws, hs)); return GC.get(k); },
  cyl(rt, rb, h, s = 20, open = false) { const k = `y${rt},${rb},${h},${s},${open}`; if (!GC.has(k)) GC.set(k, new THREE.CylinderGeometry(rt, rb, h, s, 1, open)); return GC.get(k); },
  cap(r, l) { const k = `p${r},${l}`; if (!GC.has(k)) GC.set(k, new THREE.CapsuleGeometry(r, l, 6, 16)); return GC.get(k); },
  tor(R, r, rs = 10, ts = 28, arc = Math.PI * 2) { const k = `t${R},${r},${arc}`; if (!GC.has(k)) GC.set(k, new THREE.TorusGeometry(R, r, rs, ts, arc)); return GC.get(k); },
  cone(r, h, s = 16) { const k = `n${r},${h},${s}`; if (!GC.has(k)) GC.set(k, new THREE.ConeGeometry(r, h, s)); return GC.get(k); },
};

// ---------------------------------------------------------------- audio (fully synthesized)
const SFX = {
  ctx: null, ready: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ctx = this.ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 5; comp.attack.value = 0.003; comp.release.value = 0.2;
    this.master = ctx.createGain(); this.master.connect(comp); comp.connect(ctx.destination);
    this.sfx = ctx.createGain(); this.sfx.connect(this.master);
    this.mus = ctx.createGain(); this.mus.connect(this.master);
    this.crowdBus = ctx.createGain(); this.crowdBus.connect(this.master);
    // reverb
    const len = ctx.sampleRate * 2.4, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    this.verb = ctx.createConvolver(); this.verb.buffer = ir;
    this.verbSend = ctx.createGain(); this.verbSend.gain.value = 0.32;
    this.verbSend.connect(this.verb); this.verb.connect(this.master);
    this.sfx.connect(this.verbSend);
    // noise
    const nl = ctx.sampleRate * 2; this.noise = ctx.createBuffer(1, nl, ctx.sampleRate);
    const nd = this.noise.getChannelData(0); for (let i = 0; i < nl; i++) nd[i] = Math.random() * 2 - 1;
    // crowd bed
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.5;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    this.crowdGain = ctx.createGain(); this.crowdGain.gain.value = 0;
    src.connect(bp); bp.connect(lp); lp.connect(this.crowdGain); this.crowdGain.connect(this.crowdBus); src.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.23; const lg = ctx.createGain(); lg.gain.value = 180; lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    // servo hums (one per fighter)
    this.servos = [0, 1].map(i => {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 70 + i * 13;
      const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = 141 + i * 9;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 4;
      const g = ctx.createGain(); g.gain.value = 0;
      const g2 = ctx.createGain(); g2.gain.value = 0.3;
      o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(this.sfx); o.start(); o2.start();
      return { o, o2, f, g };
    });
    this.ready = true;
    this.setVolumes();
  },
  setVolumes() {
    if (!this.ctx) return;
    this.sfx.gain.value = settings.sfx;
    this.mus.gain.value = settings.music * 0.55;
    this.crowdBus.gain.value = settings.sfx * 0.9;
  },
  env(g, t, a, peak, dec) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); },
  osc(type, f0, f1, dur, vol, dest, delay = 0, attack = 0.002) {
    const c = this.ctx, t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    this.env(g, t, attack, vol, dur); o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + attack + dur + 0.05);
  },
  nz(dur, vol, type, f0, f1, Q = 1, dest, delay = 0, attack = 0.002) {
    const c = this.ctx, t = c.currentTime + delay, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.playbackRate.value = rand(0.8, 1.2);
    f.type = type; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur); f.Q.value = Q;
    this.env(g, t, attack, vol, dur); s.connect(f); f.connect(g); g.connect(dest || this.sfx);
    s.start(t, Math.random()); s.stop(t + attack + dur + 0.05);
  },
  impact(power, blocked, heavy = 1) {
    if (!this.ready) return;
    const p = clamp(power, 0.2, 1.6);
    if (blocked) {
      this.osc('triangle', 900 * rand(.9, 1.1), 400, 0.18, 0.28 * p);
      this.osc('square', 1430 * rand(.95, 1.05), 900, 0.12, 0.06 * p);
      this.nz(0.09, 0.5 * p, 'bandpass', 3200, 1500, 1.4);
      this.osc('sine', 140, 60, 0.12, 0.4 * p);
      return;
    }
    this.osc('sine', 150 * heavy, 38, 0.28, 0.95 * p);
    this.osc('sine', 75, 30, 0.4, 0.6 * p);
    this.nz(0.16, 0.9 * p, 'bandpass', 2400, 500, 0.9);
    this.nz(0.05, 0.7 * p, 'highpass', 5000, 0, 0.7);
    const base = rand(260, 420);
    [1, 2.31, 3.77, 5.12].forEach((r, i) => this.osc(i % 2 ? 'square' : 'triangle', base * r, base * r * 0.97, 0.45 - i * 0.07, 0.09 * p / (i + 1)));
  },
  whoosh(power) {
    if (!this.ready) return;
    this.nz(0.2, 0.22 * power, 'bandpass', 380, 1700, 2.2, null, 0, 0.05);
    this.osc('sawtooth', 220, 110, 0.18, 0.035 * power);
  },
  step(v = 1) { if (!this.ready) return; this.osc('sine', 85, 40, 0.12, 0.22 * v); this.nz(0.06, 0.12 * v, 'lowpass', 600, 200); },
  clank(v = 1) { if (!this.ready) return; const b = rand(500, 1300); this.osc('triangle', b, b * 0.92, 0.25, 0.12 * v); this.osc('square', b * 2.7, b * 2.5, 0.12, 0.03 * v); this.nz(0.05, 0.16 * v, 'highpass', 2500, 0); },
  bell(times = 1) {
    if (!this.ready) return;
    for (let k = 0; k < times; k++) [1, 2.76, 5.4, 8.93].forEach((r, i) => this.osc('sine', 820 * r, 0, 2.4 - i * 0.4, 0.22 / (i + 1), null, k * 0.42));
  },
  tick() { if (!this.ready) return; this.osc('square', 1800, 1200, 0.04, 0.08); },
  ui() { if (!this.ready) return; this.osc('triangle', 660, 520, 0.06, 0.08); },
  uiOk() { if (!this.ready) return; this.osc('triangle', 520, 0, 0.08, 0.1); this.osc('triangle', 780, 0, 0.12, 0.1, null, 0.06); },
  od() { if (!this.ready) return; this.osc('sawtooth', 110, 880, 0.6, 0.18); this.nz(0.7, 0.3, 'bandpass', 300, 4000, 3, null, 0, 0.1); },
  crash() { if (!this.ready) return; this.osc('sine', 90, 30, 0.6, 1); this.nz(0.5, 0.8, 'lowpass', 1800, 150, 0.7); for (let i = 0; i < 5; i++) this.clank(0.6); },
  crowd(level) { if (!this.ready) return; this.crowdGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.4); },
  cheer(v = 1) {
    if (!this.ready) return;
    this.nz(1.6, 0.35 * v, 'bandpass', 900, 1300, 0.6, this.crowdBus, 0, 0.18);
    this.nz(1.2, 0.2 * v, 'bandpass', 2400, 1800, 1.2, this.crowdBus, 0.05, 0.2);
  },
  servo(i, speed) {
    if (!this.ready) return; const s = this.servos[i]; const t = this.ctx.currentTime;
    s.g.gain.setTargetAtTime(clamp(speed, 0, 1) * 0.05, t, 0.08);
    s.f.frequency.setTargetAtTime(300 + speed * 900, t, 0.08);
    s.o.frequency.setTargetAtTime(60 + speed * 50 + i * 13, t, 0.1);
  },
};
let _voice = null;
function speak(text, rate = 0.95) {
  if (!settings.voice) return;
  try {
    const ss = window.speechSynthesis; if (!ss) return;
    const u = new SpeechSynthesisUtterance(text); u.rate = rate; u.pitch = 0.55; u.volume = Math.min(1, settings.sfx + 0.1);
    if (!_voice) { const vs = ss.getVoices(); _voice = vs.find(v => /en[-_]US/i.test(v.lang) && /male|david|alex|daniel|fred/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null; }
    if (_voice) u.voice = _voice;
    ss.cancel(); ss.speak(u);
  } catch (e) { }
}

// Procedural fight music: industrial drum machine + saw bass, scheduled ahead on the audio clock.
const Music = {
  on: false, step: 0, next: 0, timer: null, mode: 'menu', bpm: 124,
  start() { if (!SFX.ready || this.on) return; this.on = true; this.next = SFX.ctx.currentTime + 0.1; this.timer = setInterval(() => this.tick(), 25); },
  stop() { this.on = false; clearInterval(this.timer); },
  tick() {
    const c = SFX.ctx; const spb = 60 / this.bpm / 4;
    while (this.next < c.currentTime + 0.15) { this.play(this.step, this.next); this.next += spb; this.step = (this.step + 1) % 64; }
  },
  hit(type, t, f0, f1, dur, vol, filt) {
    const c = SFX.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (filt) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(filt, t); f.frequency.exponentialRampToValueAtTime(120, t + dur); f.Q.value = 6; o.connect(f); f.connect(g); } else o.connect(g);
    g.connect(SFX.mus); o.start(t); o.stop(t + dur + 0.02);
  },
  nz(t, dur, vol, hp) {
    const c = SFX.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = SFX.noise; f.type = 'highpass'; f.frequency.value = hp; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(SFX.mus); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  },
  play(s, t) {
    const i = s & 15, bar = (s >> 4) & 3, fight = this.mode === 'fight';
    const roots = [41.2, 41.2, 49.0, 36.7];
    const r = roots[bar];
    if (fight) {
      if (i === 0 || i === 6 || i === 8 || (i === 11 && bar % 2) || i === 14 && bar === 3) this.hit('sine', t, 140, 38, 0.3, 0.9);
      if (i === 4 || i === 12) { this.nz(t, 0.18, 0.45, 1200); this.hit('triangle', t, 220, 120, 0.12, 0.3); }
    } else if (i === 0 || i === 8) this.hit('sine', t, 110, 38, 0.4, 0.5);
    if (i % 2 === 0) this.nz(t, i === 14 ? 0.12 : 0.03, fight ? 0.12 : 0.06, 7000);
    const bassPat = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0];
    if (bassPat[i]) this.hit('sawtooth', t, r * (i === 14 ? 2 : 1), 0, 0.22, fight ? 0.32 : 0.2, fight ? 900 : 420);
    if (fight && i === 0 && bar === 0) { [1, 1.5, 2].forEach(k => this.hit('square', t, r * 4 * k, 0, 0.5, 0.05, 1600)); }
  },
};
