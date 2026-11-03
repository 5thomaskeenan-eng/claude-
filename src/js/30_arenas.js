// ============================================================================
// ARENAS: ring, reactive ropes, crowd, four venues
// ============================================================================
const ARENAS = [
  { id: 'tanker', name: 'Kestrel Hold', sub: 'Cargo hold of a rusting tanker', bell: 'Kestrel Hold, bay two' },
  { id: 'foundry', name: 'Foundry Bay 9', sub: 'Mech hangar after hours', bell: 'Foundry Bay nine' },
  { id: 'carnival', name: 'Wonderland Rust', sub: 'Dead amusement park, midnight', bell: 'Wonderland Rust' },
  { id: 'reactor', name: 'Helix Core', sub: 'Reactor chamber, live core', bell: 'the Helix Core' },
];

const stdMat = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.2 }, o));
const emiMat = (color, i = 2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: i });
const basicGlow = (color, i = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(i) });

// ---------------------------------------------------------------- textures for venues
function texRust() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#4a3a2e'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 70, '120,60,25', .1, .35, 20, 110);
    blotches(g, w, h, 40, '25,20,18', .1, .35, 20, 90);
    for (let i = 0; i < 70; i++) { const x = Math.random() * w, y = Math.random() * h * .6, l = rand(40, 260); const gr = g.createLinearGradient(x, y, x, y + l); gr.addColorStop(0, `rgba(${randi(110, 160)},${randi(50, 70)},20,.35)`); gr.addColorStop(1, 'rgba(110,50,20,0)'); g.fillStyle = gr; g.fillRect(x, y, rand(2, 7), l); }
    noiseFill(g, w, h, 26, false);
    g.strokeStyle = 'rgba(10,8,6,.8)'; g.lineWidth = 4; for (let y = 0; y <= h; y += 256) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } for (let x = 0; x <= w; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 10; y < h; y += 256) for (let x = 12; x < w; x += 22) { rivet(g, x, y + 4, 3.5); rivet(g, x, y + 240, 3.5); }
  });
}
function texDeck() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#3c3a36'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = (y / 16 % 2) * 8; x < w; x += 16) { g.fillStyle = 'rgba(255,255,255,.08)'; g.save(); g.translate(x, y); g.rotate(.7); g.fillRect(-5, -1.5, 10, 3); g.restore(); }
    blotches(g, w, h, 60, '10,8,6', .15, .45, 10, 90);
    blotches(g, w, h, 30, '90,50,20', .08, .2, 20, 80);
    noiseFill(g, w, h, 20);
  });
}
function texCorrugated() {
  return canvasTex(256, 256, (g, w, h) => {
    for (let x = 0; x < w; x++) { const v = 180 + Math.sin(x / w * Math.PI * 24) * 60; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, h); }
    blotches(g, w, h, 40, '60,40,20', .1, .4, 10, 60);
    noiseFill(g, w, h, 30);
    g.fillStyle = 'rgba(20,20,20,.5)'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
  });
}
function texConcrete() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#6d706e'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 90, '30,32,30', .05, .2, 10, 100);
    blotches(g, w, h, 40, '200,200,195', .03, .1, 20, 80);
    noiseFill(g, w, h, 28);
    g.strokeStyle = 'rgba(20,20,20,.6)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.strokeStyle = 'rgba(15,15,15,.35)'; g.lineWidth = 1; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rand(-30, 30); y += rand(-30, 30); g.lineTo(x, y); } g.stroke(); }
  });
}
function texTiles() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#2a2826'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = randi(120, 165); g.fillStyle = `rgb(${v},${v - 4},${v - 10})`; g.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
    blotches(g, w, h, 70, '20,25,15', .1, .4, 10, 70);
    for (let i = 0; i < 26; i++) { g.strokeStyle = 'rgba(10,10,10,.7)'; g.lineWidth = rand(1, 2.5); g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-25, 25); y += rand(-25, 25); g.lineTo(x, y); } g.stroke(); }
    noiseFill(g, w, h, 24);
  });
}
function texHex(base = '#1d2a33', line = 'rgba(120,210,255,.35)') {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    noiseFill(g, w, h, 16);
    const r = 32, hh = r * Math.sqrt(3);
    g.strokeStyle = 'rgba(0,0,0,.65)'; g.lineWidth = 5;
    for (let row = -1; row < h / hh + 1; row++) for (let col = -1; col < w / (r * 1.5) + 1; col++) {
      const cx = col * r * 1.5, cy = row * hh + (col % 2 ? hh / 2 : 0);
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } g.closePath(); g.stroke();
    }
    g.strokeStyle = line; g.lineWidth = 1.2;
    for (let row = -1; row < h / hh + 1; row++) for (let col = -1; col < w / (r * 1.5) + 1; col++) {
      if (Math.random() > .5) continue; const cx = col * r * 1.5, cy = row * hh + (col % 2 ? hh / 2 : 0);
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); } g.closePath(); g.stroke();
    }
  });
}
function texBanner(lines, bg, fg, w = 1024, h = 256) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 30, '0,0,0', .1, .3, 20, 120);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `900 ${Math.floor(h * .46)}px "Big Shoulders Display", Impact, sans-serif`; g.fillText(lines[0], w / 2, h * .42);
    if (lines[1]) { g.font = `600 ${Math.floor(h * .14)}px "Chakra Petch", monospace`; g.fillText(lines[1], w / 2, h * .8); }
    noiseFill(g, w, h, 30);
  }, { repeat: [1, 1] });
}
function texHazard() {
  return canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = '#f2b400'; g.fillRect(0, 0, w, h); g.fillStyle = '#141414';
    for (let x = -64; x < w + 64; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 24, 0); g.lineTo(x + 24 + 64, h); g.lineTo(x + 64, h); g.fill(); }
    blotches(g, w, h, 20, '0,0,0', .1, .3, 5, 30); noiseFill(g, w, h, 30);
  });
}
function texRingFloor(o) {
  return canvasTex(1024, 1024, (g, w, h) => {
    g.fillStyle = o.canvas; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) { g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(0, y, w, 2); }
    blotches(g, w, h, 80, '0,0,0', .05, .16, 20, 140);
    g.fillStyle = o.border; g.fillRect(0, 0, w, 70); g.fillRect(0, h - 70, w, 70); g.fillRect(0, 0, 70, h); g.fillRect(w - 70, 0, 70, h);
    g.save(); g.translate(w / 2, h / 2);
    g.strokeStyle = o.logo; g.globalAlpha = .55; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, 250, 0, 7); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 228, 0, 7); g.stroke();
    g.fillStyle = o.logo; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '900 150px "Big Shoulders Display", Impact, sans-serif'; g.fillText('IRONVOLT', 0, -8);
    g.font = '600 30px "Chakra Petch", monospace'; g.fillText(o.title.toUpperCase(), 0, 100);
    g.font = '600 22px "Share Tech Mono", monospace'; g.fillText('UNSANCTIONED · NO REFUNDS', 0, -110);
    g.restore(); g.globalAlpha = 1;
    for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(0,0,0,${rand(.05, .2)})`; g.lineWidth = rand(2, 8); g.beginPath(); const x = rand(100, w - 100), y = rand(100, h - 100); g.arc(x, y, rand(20, 70), rand(0, 6), rand(0, 6)); g.stroke(); }
    noiseFill(g, w, h, 18);
  }, { repeat: [1, 1] });
}
function texApron(text, bg, fg) {
  return canvasTex(1024, 128, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = '900 72px "Big Shoulders Display", Impact, sans-serif'; g.textBaseline = 'middle';
    for (let x = 10; x < w; x += g.measureText(text + '   ').width) g.fillText(text + '   ', x, h / 2 + 4);
    blotches(g, w, h, 20, '0,0,0', .1, .4, 10, 60); noiseFill(g, w, h, 30);
  }, { repeat: [1, 1] });
}

// ---------------------------------------------------------------- ropes that bow when robots lean on them
class Ropes {
  constructor(parent, colors) {
    this.H = RING_H + 0.2; const H = this.H;
    this.heights = [0.62, 1.12, 1.62];
    this.corners = [V3(-H, 0, -H), V3(H, 0, -H), V3(H, 0, H), V3(-H, 0, H)];
    this.normals = [V3(0, 0, -1), V3(1, 0, 0), V3(0, 0, 1), V3(-1, 0, 0)];
    this.mats = colors.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.45, metalness: 0.1, emissive: c, emissiveIntensity: 0.12 }));
    const geo = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    this.sides = this.normals.map((n, i) => ({ n, a: this.corners[i], b: this.corners[(i + 1) % 4], s: 0.5, defl: 0, vel: 0, segs: this.heights.map((h, k) => [new THREE.Mesh(geo, this.mats[k]), new THREE.Mesh(geo, this.mats[k])]) }));
    for (const sd of this.sides) for (const pair of sd.segs) for (const m of pair) { m.castShadow = true; parent.add(m); }
    this.update(0, []);
  }
  place(m, A, B) { m.position.addVectors(A, B).multiplyScalar(0.5); const d = _rv.subVectors(B, A); const l = d.length(); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(_ry, d.divideScalar(l)); }
  update(dt, fighters) {
    const H = this.H;
    for (const sd of this.sides) {
      let target = 0;
      for (const f of fighters) {
        const p = f.ragPos ? f.ragPos() : f.pos;
        const out = p.x * sd.n.x + p.z * sd.n.z; const pen = out - (H - 0.78);
        if (pen > 0) { target = Math.max(target, pen * 1.25); const along = sd.n.x !== 0 ? p.z : p.x; const dir = (sd.b.x - sd.a.x) !== 0 ? Math.sign(sd.b.x - sd.a.x) : Math.sign(sd.b.z - sd.a.z); sd.s = clamp((along * dir + H) / (2 * H), 0.12, 0.88); }
      }
      if (dt > 0) { sd.vel += ((target - sd.defl) * 180 - sd.vel * 8) * dt; sd.defl = clamp(sd.defl + sd.vel * dt, -0.2, 0.75); }
      for (let k = 0; k < 3; k++) {
        const h = RING_Y + this.heights[k], w = [0.75, 1, 0.8][k];
        _ra.set(sd.a.x, h, sd.a.z); _rb.set(sd.b.x, h, sd.b.z);
        _rm.lerpVectors(_ra, _rb, sd.s).addScaledVector(sd.n, sd.defl * w);
        this.place(sd.segs[k][0], _ra, _rm); this.place(sd.segs[k][1], _rm, _rb);
      }
    }
  }
}
const _rv = V3(), _ry = V3(0, 1, 0), _ra = V3(), _rb = V3(), _rm = V3();

// ---------------------------------------------------------------- crowd (instanced, reacts to the fight)
class Crowd {
  constructor(parent, spots, palette) {
    const n = Math.floor(spots.length * QUALITY[settings.quality].crowd);
    spots = spots.sort(() => Math.random() - 0.5).slice(0, n);
    const body = new THREE.CapsuleGeometry(0.21, 0.62, 3, 8).toNonIndexed(); body.translate(0, 0.55, 0);
    const head = new THREE.SphereGeometry(0.14, 8, 6).toNonIndexed(); head.translate(0, 1.15, 0);
    const armL = new THREE.CapsuleGeometry(0.06, 0.5, 2, 6).toNonIndexed(); armL.rotateZ(0.25); armL.translate(0.28, 0.68, 0);
    const armR = armL.clone(); armR.scale(-1, 1, 1);
    for (const g of [body, head, armL, armR]) { for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k); }
    const geo = mergeGeometries([body, head, armL, armR]);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0 });
    this.mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, n)); this.mesh.count = n;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.data = spots.map(s => ({ x: s[0], y: s[1], z: s[2], yaw: Math.atan2(-s[0], -s[2]) + rand(-0.3, 0.3), ph: rand(0, 6.28), f: rand(5, 9), sc: rand(0.9, 1.12), hype: rand(0.5, 1.2) }));
    const c = new THREE.Color();
    this.data.forEach((d, i) => { c.set(pick(palette)).multiplyScalar(rand(0.5, 1.1)); this.mesh.setColorAt(i, c); });
    this.mesh.receiveShadow = false; this.mesh.castShadow = false; this.mesh.frustumCulled = false;
    parent.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._p = V3(); this._s = V3(); this._e = new THREE.Euler();
    this.update(0, 0);
  }
  update(t, excite) {
    const { _m, _q, _p, _s, _e } = this;
    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      const hop = Math.max(0, Math.sin(t * d.f + d.ph)) * (0.015 + excite * 0.28 * d.hype);
      _p.set(d.x, d.y + hop, d.z); _q.setFromEuler(_e.set(0, d.yaw + Math.sin(t * 0.7 + d.ph) * 0.15, Math.sin(t * d.f * 0.5 + d.ph) * 0.04 * excite)); _s.setScalar(d.sc);
      _m.compose(_p, _q, _s); this.mesh.setMatrixAt(i, _m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  randomHead(v) { const d = pick(this.data); return v.set(d.x, d.y + 1.2 * d.sc, d.z); }
}
// spots on rows around a square, with gaps where the camera may need to see through
function crowdRing(inner, rows, spacing, y0 = 0, yStep = 0, rowGap = 1.1, skip = () => false) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    const d = inner + r * rowGap, y = y0 + r * yStep;
    for (let s = -d; s <= d; s += spacing) {
      for (const [x, z] of [[s, -d], [s, d], [-d, s], [d, s]]) { const jx = x + rand(-0.2, 0.2), jz = z + rand(-0.2, 0.2); if (!skip(jx, jz)) out.push([jx, y, jz]); }
    }
  }
  return out;
}

// ---------------------------------------------------------------- dust in light shafts
function dustField(parent, n, box, color = [1, 0.9, 0.7], size = 0.05) {
  const pos = new Float32Array(n * 3), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(box[0], box[1]); pos[i * 3 + 1] = rand(box[2], box[3]); pos[i * 3 + 2] = rand(box[4], box[5]); ph[i] = Math.random() * 6.28; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uC: { value: new THREE.Vector3(...color) }, uS: { value: size } },
    vertexShader: `attribute float ph; uniform float uTime,uScale,uS; varying float vA;
      void main(){ vec3 p=position; p.x+=sin(uTime*0.3+ph)*0.4; p.y+=sin(uTime*0.2+ph*1.7)*0.5; p.z+=cos(uTime*0.25+ph)*0.4;
      vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=uS*uScale/max(0.5,-mv.z); gl_Position=projectionMatrix*mv; vA=0.5+0.5*sin(uTime*1.3+ph*3.0); }`,
    fragmentShader: `uniform vec3 uC; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); gl_FragColor=vec4(uC*smoothstep(0.5,0.0,d)*vA,1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; parent.add(pts);
  return mat;
}
function lightShaft(parent, w, d, h, tilt, color, alpha) {
  const geo = new THREE.CylinderGeometry(0.72, 1.0, 1, 4, 1, true); geo.rotateY(Math.PI / 4);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: alpha }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 wp=modelMatrix*vec4(position,1.0); vN=normalize(mat3(modelMatrix)*normal); vV=normalize(cameraPosition-wp.xyz); gl_Position=projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: `uniform vec3 uC; uniform float uA,uTime; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float f=abs(dot(vN,vV)); float a=uA*pow(vUv.y,0.7)*f*f*(0.75+0.25*sin(vUv.x*60.0+uTime*0.4)); gl_FragColor=vec4(uC*a,1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const m = new THREE.Mesh(geo, mat); m.scale.set(w, h, d); m.rotation.x = tilt; m.position.y = h / 2; m.renderOrder = 3;
  const g = new THREE.Group(); g.add(m); parent.add(g);
  return { group: g, mat };
}

// ---------------------------------------------------------------- the ring
function buildRing(g, o) {
  const B = new Batch(); const W = RING_H + 0.6;
  const dark = stdMat(0x111213, { roughness: 0.6, metalness: 0.5 });
  B.add(G.cube(W * 2 - 0.1, RING_Y - 0.05, W * 2 - 0.1), dark, [0, (RING_Y - 0.05) / 2, 0]);
  const floorTex = texRingFloor(o);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, W * 2), new THREE.MeshStandardMaterial({ map: floorTex, color: 0xa8a8a8, roughness: 0.82, metalness: 0.0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = RING_Y; floor.receiveShadow = true; g.add(floor);
  const apronMat = new THREE.MeshStandardMaterial({ map: texApron(o.apron, o.apronBg, o.apronFg), roughness: 0.9 });
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, RING_Y), apronMat);
    const ang = i * Math.PI / 2; a.position.set(Math.sin(ang) * W, RING_Y / 2, Math.cos(ang) * W); a.rotation.y = ang; a.receiveShadow = true; g.add(a);
  }
  // corner posts and pads
  const postMat = stdMat(o.post || 0x9aa1a6, { metalness: 0.9, roughness: 0.3 });
  const padCols = [0xffb12b, 0xeeeeee, 0xff3b28, 0xeeeeee];
  const H = RING_H + 0.2;
  [[-H, -H], [H, -H], [H, H], [-H, H]].forEach(([x, z], i) => {
    const post = new THREE.Mesh(G.cyl(0.08, 0.09, 2.2, 14), postMat); post.position.set(x, RING_Y + 0.9, z); post.castShadow = true; g.add(post);
    const pad = new THREE.Mesh(G.box(0.26, 1.3, 0.26, 0.08), stdMat(padCols[i], { roughness: 0.55, metalness: 0 })); pad.position.set(x - Math.sign(x) * 0.12, RING_Y + 1.1, z - Math.sign(z) * 0.12); pad.rotation.y = Math.PI / 4; pad.castShadow = true; g.add(pad);
  });
  // steps
  for (let k = 0; k < 3; k++) B.add(G.cube(1.4, 0.3, 0.45), dark, [-(W + 0.3 + k * 0.42) * 0.71 - 0.4, 0.15 + k * 0.3 - 0.0, -(W + 0.3 + k * 0.42) * 0.71 - 0.4].map((v, j) => j === 1 ? RING_Y - 0.15 - k * 0.3 : v), [0, Math.PI / 4, 0]);
  B.build(g, { receive: true });
  const ropes = new Ropes(g, o.ropes);
  return { floorTex, ropes };
}

function ringLights(g, o) {
  const key = new THREE.SpotLight(o.key || 0xfff1dc, (o.keyI || 1400) * 0.8, 34, 0.58, 0.55, 1.6);
  key.position.set(0.5, RING_Y + 13, 1.2); key.target.position.set(0, RING_Y, 0);
  key.castShadow = true; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.camera.near = 4; key.shadow.camera.far = 24;
  g.add(key, key.target);
  const rims = (o.rims || [0x7fb8ff, 0xffa060]).map((c, i) => {
    const s = new THREE.SpotLight(c, o.rimI || 500, 30, 0.5, 0.7, 1.5);
    const a = i * Math.PI + 0.8; s.position.set(Math.cos(a) * 9, RING_Y + 8, Math.sin(a) * 9); s.target.position.set(0, RING_Y + 1.5, 0); g.add(s, s.target); return s;
  });
  const hemi = new THREE.HemisphereLight(o.sky || 0x8090a0, o.ground || 0x201810, o.hemiI || 0.35); g.add(hemi);
  // overhead lighting truss
  const B = new Batch(); const truss = stdMat(0x1a1b1c, { metalness: 0.8, roughness: 0.4 }); const T = 4.4, y = RING_Y + 8.5;
  for (const s of [-1, 1]) { B.add(G.cube(T * 2, 0.3, 0.3), truss, [0, y, s * T]); B.add(G.cube(0.3, 0.3, T * 2), truss, [s * T, y, 0]); }
  for (const [x, z] of [[-T, -T], [T, -T], [T, T], [-T, T]]) B.add(G.cyl(0.03, 0.03, 30, 4), truss, [x, y + 15, z]);
  const lamp = stdMat(0x0d0d0d, { metalness: 0.6, roughness: 0.5 }); const lens = basicGlow(o.key || 0xfff1dc, 4);
  for (let i = -1; i <= 1; i++) for (const s of [-1, 1]) {
    B.add(G.cyl(0.22, 0.28, 0.5, 12), lamp, [i * 2.4, y - 0.4, s * T], [s * 0.6, 0, 0]);
    B.add(G.cyl(0.2, 0.2, 0.02, 12), lens, [i * 2.4, y - 0.66, s * T - s * 0.15], [s * 0.6, 0, 0]);
    B.add(G.cyl(0.22, 0.28, 0.5, 12), lamp, [s * T, y - 0.4, i * 2.4], [0, 0, -s * 0.6]);
    B.add(G.cyl(0.2, 0.2, 0.02, 12), lens, [s * T - s * 0.15, y - 0.66, i * 2.4], [0, 0, -s * 0.6]);
  }
  B.build(g, { receive: false });
  return { key, rims, hemi };
}

// ---------------------------------------------------------------- venues
const VENUES = {};

VENUES.tanker = (g, A) => {
  const fogC = 0x1d140e; scene.fog = new THREE.FogExp2(fogC, 0.02); scene.background = new THREE.Color(fogC);
  A.env = makeEnvMap({ wall: 0x2a1c12, floor: 0x1a120c, panels: [{ color: 0xd8e8ff, i: 9, pos: [0, 14, 0], w: 12, h: 9 }, { color: 0xff9a3c, i: 5, pos: [12, 4, 0], w: 3, h: 3 }, { color: 0xff9a3c, i: 5, pos: [-12, 4, 6], w: 3, h: 3 }, { color: 0xff8030, i: 3, pos: [0, 3, -14], w: 8, h: 2 }] });
  const ring = buildRing(g, { canvas: '#6e6656', border: '#2a2018', logo: '#1b1510', title: 'Kestrel Hold', apron: 'KESTREL HOLD · FIGHT NIGHT', apronBg: '#1d1611', apronFg: '#c9a46b', ropes: [0xb11b12, 0xd8d0c0, 0x1b3c8a], post: 0x8a8076 });
  const L = ringLights(g, { key: 0xffe6c4, keyI: 1500, rims: [0x9fc6ff, 0xff8c3a], rimI: 420, sky: 0x9fb3c8, ground: 0x3a2412, hemiI: 0.45 });
  const X = 17, Z = 20, Hh = 15;
  const rust = texRust(); rust.repeat.set(6, 3);
  const wallMat = stdMat(0xffffff, { map: rust, roughness: 0.85, metalness: 0.3 });
  const deck = texDeck(); deck.repeat.set(10, 12);
  const floorMat = stdMat(0x9a948c, { map: deck, roughness: 0.7, metalness: 0.5 });
  const iron = stdMat(0x3a3029, { map: rust, roughness: 0.75, metalness: 0.6 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(X * 2, Z * 2), floorMat); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  for (const [w, px, pz, ry] of [[X * 2, 0, -Z, 0], [X * 2, 0, Z, Math.PI], [Z * 2, -X, 0, Math.PI / 2], [Z * 2, X, 0, -Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, Hh), wallMat); m.position.set(px, Hh / 2, pz); m.rotation.y = ry; g.add(m); }
  const B = new Batch();
  // ceiling with an open hatch
  B.add(G.cube(X - 5, 0.4, Z * 2), iron, [-(X + 5) / 2, Hh, 0]); B.add(G.cube(X - 5, 0.4, Z * 2), iron, [(X + 5) / 2, Hh, 0]);
  B.add(G.cube(10, 0.4, Z - 4), iron, [0, Hh, -(Z + 4) / 2]); B.add(G.cube(10, 0.4, Z - 4), iron, [0, Hh, (Z + 4) / 2]);
  for (const s of [-1, 1]) { B.add(G.cube(10.6, 1.2, 0.5), iron, [0, Hh + 0.4, s * 4.2]); B.add(G.cube(0.5, 1.2, 8.6), iron, [s * 5.2, Hh + 0.4, 0]); }
  // ribs and girders
  for (let x = -X + 2; x <= X - 2; x += 3.2) { B.add(G.cube(0.5, Hh, 0.7), iron, [x, Hh / 2, -Z + 0.35]); B.add(G.cube(0.5, Hh, 0.7), iron, [x, Hh / 2, Z - 0.35]); }
  for (let z = -Z + 2; z <= Z - 2; z += 3.2) { B.add(G.cube(0.7, Hh, 0.5), iron, [-X + 0.35, Hh / 2, z]); B.add(G.cube(0.7, Hh, 0.5), iron, [X - 0.35, Hh / 2, z]); B.add(G.cube(X * 2, 0.9, 0.4), iron, [0, Hh - 0.6, z]); }
  // catwalks
  for (const s of [-1, 1]) {
    B.add(G.cube(2.6, 0.2, Z * 2 - 2), iron, [s * (X - 1.6), 6, 0]);
    for (let z = -Z + 1.5; z < Z - 1; z += 1.6) { B.add(G.cyl(0.04, 0.04, 1.1, 6), iron, [s * (X - 2.9), 6.55, z]); }
    for (const h of [6.6, 7.1]) B.add(G.cyl(0.035, 0.035, Z * 2 - 2, 6), iron, [s * (X - 2.9), h, 0], [Math.PI / 2, 0, 0]);
    for (let z = -Z + 3; z < Z; z += 6) B.add(G.cube(0.2, 6, 0.2), iron, [s * (X - 2.9), 3, z]);
  }
  // containers
  const corr = texCorrugated(); corr.repeat.set(2, 1);
  const cMats = [0x8a2d1c, 0x2f5f63, 0x5a6b84, 0xb5621e, 0x6b6e3a].map(c => stdMat(c, { map: corr, roughness: 0.7, metalness: 0.4 }));
  const cont = (x, z, ry, y = 0, m = pick(cMats)) => B.add(G.cube(6.1, 2.6, 2.44), m, [x, y + 1.3, z], [0, ry, 0]);
  cont(-12.5, -16, 0); cont(-12.5, -16, 0, 2.6); cont(-6, -17.5, 0.05); cont(12, -15.5, 0.1); cont(12.5, 16, 0); cont(12.5, 16, 0.02, 2.6); cont(-13, 15, Math.PI / 2 + 0.1); cont(-6.5, 17.2, 0);
  // barrels, tires, rope coils
  const barrelMats = [stdMat(0x7a1f17, { roughness: .6, metalness: .5 }), stdMat(0x24496b, { roughness: .6, metalness: .5 }), stdMat(0x3c4a2c, { roughness: .6, metalness: .5 })];
  const tireMat = stdMat(0x111111, { roughness: 0.95, metalness: 0 }); const ropeMat = stdMat(0x8a7350, { roughness: 0.95, metalness: 0 });
  for (const [x, z] of [[-9, -9.5], [-9.8, -8.6], [9.5, 9.6], [10.3, 8.9], [9.7, -10.2], [-10.4, 9.8], [-11, 10.6]]) { const m = pick(barrelMats); B.add(G.cyl(0.42, 0.42, 1.25, 16), m, [x, 0.63, z]); B.add(G.tor(0.42, 0.03, 4, 16), m, [x, 0.35, z], [Math.PI / 2, 0, 0]); B.add(G.tor(0.42, 0.03, 4, 16), m, [x, 0.95, z], [Math.PI / 2, 0, 0]); }
  for (const [x, z, n] of [[-10.5, -6, 4], [10.5, 5.5, 3], [7, -11, 5]]) for (let k = 0; k < n; k++) B.add(G.tor(0.5, 0.2, 10, 20), tireMat, [x + rand(-.05, .05), 0.2 + k * 0.38, z], [Math.PI / 2, 0, 0]);
  for (const [x, z] of [[-8, 11], [11, -6.5]]) for (let k = 0; k < 4; k++) B.add(G.tor(0.7 - k * 0.08, 0.1, 8, 24), ropeMat, [x, 0.1 + k * 0.17, z], [Math.PI / 2, 0, 0]);
  // crowd barriers
  const barMat = stdMat(0x8f979a, { metalness: 0.85, roughness: 0.35 });
  for (const s of [-1, 1]) for (let k = -8; k <= 8; k += 2.2) { B.add(G.cyl(0.03, 0.03, 2.2, 6), barMat, [k, 1.05, s * 8.4], [0, 0, Math.PI / 2]); B.add(G.cyl(0.03, 0.03, 2.2, 6), barMat, [s * 8.4, 1.05, k], [Math.PI / 2, 0, 0]); B.add(G.cyl(0.025, 0.025, 1.05, 6), barMat, [k, 0.52, s * 8.4]); B.add(G.cyl(0.025, 0.025, 1.05, 6), barMat, [s * 8.4, 0.52, k]); }
  // pendant lamps
  const shade = stdMat(0x2a2d24, { metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide }); const bulb = basicGlow(0xffb060, 6);
  for (const [x, z] of [[-7, -7], [7, -7], [7, 7], [-7, 7], [0, -12], [0, 12]]) {
    B.add(G.cyl(0.02, 0.02, Hh - 8.5, 4), iron, [x, 8.5 + (Hh - 8.5) / 2, z]);
    B.add(G.cone(0.7, 0.6, 18), shade, [x, 8.3, z]); B.add(G.sph(0.2, 10, 8), bulb, [x, 7.95, z]);
    const pl = new THREE.PointLight(0xff9a42, 90, 20, 1.8); pl.position.set(x, 7.7, z); g.add(pl);
  }
  // crane hook over the canvas edge
  B.add(G.cube(0.8, 0.8, Z * 2 - 1), iron, [-3, Hh - 1.6, 0]); B.add(G.cube(1.2, 0.9, 1.4), stdMat(0xb87a1a, { roughness: .6, metalness: .5 }), [-3, Hh - 2.4, -9]);
  B.build(g, { receive: true });
  // hanging chains (instanced links)
  const chains = [[-3, -9, 7], [5.5, -6.5, 4.5], [-6.2, 4.8, 3], [10, 2, 6], [-11, -2, 8], [3, 11, 5], [6, 6.8, 2.2], [-4, -14, 9]];
  let nLinks = 0; chains.forEach(c => nLinks += Math.floor(c[2] / 0.15));
  const chainMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(0.08, 0.022, 6, 12), stdMat(0x3b3631, { metalness: 0.85, roughness: 0.5 }), nLinks);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let li = 0;
  for (const [x, z, len] of chains) { const n = Math.floor(len / 0.15); for (let k = 0; k < n; k++) { q.setFromEuler(e.set(0, k % 2 ? Math.PI / 2 : 0, Math.PI / 2)); mtx.compose(V3(x, Hh - 0.6 - k * 0.15, z), q, V3(1, 1, 1)); chainMesh.setMatrixAt(li++, mtx); } }
  chainMesh.castShadow = false; g.add(chainMesh);
  const hookB = new Batch(); const hookMat = stdMat(0x5a524a, { metalness: 0.8, roughness: 0.45 });
  for (const [x, z, len] of chains) { const y = Hh - 0.6 - len - 0.1; hookB.add(G.box(0.3, 0.45, 0.2, 0.05), hookMat, [x, y, z]); hookB.add(G.tor(0.22, 0.06, 8, 16, Math.PI * 1.4), hookMat, [x + 0.05, y - 0.45, z], [0, 0, 2.3]); }
  hookB.build(g);
  // tarp
  const tg = new THREE.PlaneGeometry(9, 4, 30, 10); const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i); tp.setZ(i, Math.sin((x / 9 + .5) * Math.PI) * (2 - y) * 0.5 + Math.sin(x * 3 + y) * 0.05); }
  tg.computeVertexNormals();
  const tarp = new THREE.Mesh(tg, stdMat(0xb8ad98, { roughness: 0.95, side: THREE.DoubleSide })); tarp.position.set(9, 10.5, -10); tarp.rotation.set(-1.2, -0.5, 0); g.add(tarp);
  // banners
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), stdMat(0xffffff, { map: texBanner(['KESTREL HOLD', 'FIGHT NIGHT · NO WEAPONS · NO MERCY'], '#3a1a12', '#e8c48a'), roughness: 0.95 })); ban.position.set(0, 10, -Z + 0.8); g.add(ban);
  const ban2 = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.6), stdMat(0xffffff, { map: texBanner(['BAY 2', 'CARGO LIMIT 40T'], '#20302c', '#d9d2bf'), roughness: 0.95 })); ban2.position.set(-X + 0.8, 9.5, 6); ban2.rotation.y = Math.PI / 2; g.add(ban2);
  // sky through the hatch + god ray
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), basicGlow(0xd6e6ff, 3.2)); sky.rotation.x = Math.PI / 2; sky.position.set(0, Hh + 3, 0); g.add(sky);
  const shaft = lightShaft(g, 9.5, 7.5, Hh + 1.5, 0.12, 0xcfe0ff, 0.22); shaft.group.position.set(0.5, 0, 0.2);
  A.shafts = [shaft.mat];
  const sun = new THREE.DirectionalLight(0xc8dcff, 1.1); sun.position.set(2, 30, 6); g.add(sun, sun.target);
  A.dust = dustField(g, 500, [-5, 5, 1, Hh, -4, 4], [1, 0.95, 0.85], 0.045);
  // crowd
  const spots = crowdRing(9.2, 4, 0.75, 0, 0, 1.0, (x, z) => Math.abs(x) > X - 1 || Math.abs(z) > Z - 1 || (Math.abs(x) > 11 && Math.abs(z) > 13));
  for (const s of [-1, 1]) for (let z = -Z + 2; z < Z - 2; z += 0.75) spots.push([s * (X - 1.8 + rand(-.4, .4)), 6.1, z]);
  A.crowd = new Crowd(g, spots, ['#7a6a5a', '#4a5560', '#6b3a2a', '#8a8070', '#2f3a3a', '#5a4a3a']);
  A.lights = L; A.ropes = ring.ropes; A.floorTex = ring.floorTex;
};

VENUES.foundry = (g, A) => {
  const fogC = 0x111619; scene.fog = new THREE.FogExp2(fogC, 0.016); scene.background = new THREE.Color(fogC);
  A.env = makeEnvMap({ wall: 0x1a2226, floor: 0x161a1c, panels: [{ color: 0xe8f4ff, i: 6, pos: [0, 14, 0], w: 30, h: 4 }, { color: 0xe8f4ff, i: 6, pos: [0, 14, 10], w: 30, h: 4 }, { color: 0x3fe0d0, i: 3, pos: [-20, 4, 0], w: 4, h: 8 }, { color: 0xffb000, i: 2, pos: [20, 2, 0], w: 6, h: 2 }] });
  const ring = buildRing(g, { canvas: '#3c4448', border: '#141a1d', logo: '#c9d4d8', title: 'Foundry Bay 9', apron: 'FOUNDRY BAY 9 · HEAVY LIFT', apronBg: '#121618', apronFg: '#f2b400', ropes: [0xf2b400, 0x1a1a1a, 0xf2b400], post: 0x2a2f33 });
  const L = ringLights(g, { key: 0xf4f9ff, keyI: 1500, rims: [0x40e8d8, 0xffc060], rimI: 460, sky: 0xa8c0d0, ground: 0x202428, hemiI: 0.4 });
  const X = 22, Z = 28, Hh = 18;
  const conc = texConcrete(); conc.repeat.set(8, 10);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(X * 2, Z * 2), stdMat(0xffffff, { map: conc, roughness: 0.72, metalness: 0.05 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const panelT = texCorrugated(); panelT.repeat.set(10, 2);
  const wallMat = stdMat(0x5d676c, { map: panelT, roughness: 0.6, metalness: 0.6 });
  for (const [w, px, pz, ry] of [[X * 2, 0, -Z, 0], [X * 2, 0, Z, Math.PI], [Z * 2, -X, 0, Math.PI / 2], [Z * 2, X, 0, -Math.PI / 2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, Hh), wallMat); m.position.set(px, Hh / 2, pz); m.rotation.y = ry; g.add(m); }
  const B = new Batch();
  const steel = stdMat(0x2b3236, { metalness: 0.85, roughness: 0.4 }); const yel = stdMat(0xd99a00, { metalness: 0.5, roughness: 0.5 });
  const hz = texHazard(); hz.repeat.set(8, 1); const hazMat = stdMat(0xffffff, { map: hz, roughness: 0.6 });
  B.add(G.cube(X * 2, 0.5, Z * 2), steel, [0, Hh, 0]);
  for (let z = -Z + 2; z <= Z - 2; z += 4) { B.add(G.cube(X * 2, 1.2, 0.4), steel, [0, Hh - 0.8, z]); }
  for (let x = -X + 3; x <= X - 3; x += 4) { B.add(G.cube(0.6, Hh, 0.6), steel, [x, Hh / 2, -Z + 0.3]); B.add(G.cube(0.6, Hh, 0.6), steel, [x, Hh / 2, Z - 0.3]); }
  // hex ceiling lights
  const hexL = basicGlow(0xeaf6ff, 3.5);
  for (let x = -15; x <= 15; x += 6) for (let z = -20; z <= 20; z += 8) { B.add(G.cyl(1.3, 1.3, 0.12, 6), hexL, [x, Hh - 1.6, z]); B.add(G.cyl(1.45, 1.45, 0.2, 6), steel, [x, Hh - 1.48, z]); }
  // upper window band
  B.add(G.cube(X * 2 - 2, 1.6, 0.1), basicGlow(0x8fd6ff, 1.6), [0, Hh - 3, -Z + 0.7]);
  // crane gantry
  for (const s of [-1, 1]) B.add(G.cube(0.8, 1.0, Z * 2), yel, [s * (X - 2), 13, 0]);
  B.add(G.cube(X * 2 - 4, 1.2, 1.2), yel, [0, 13.4, -6]); B.add(G.cube(1.8, 1.4, 1.8), steel, [3, 12.4, -6]);
  B.add(G.cyl(0.04, 0.04, 5, 4), steel, [3, 9.4, -6]); B.add(G.tor(0.35, 0.09, 8, 16, Math.PI * 1.4), steel, [3, 6.6, -6], [0, 0, 2.3]);
  // hangar door
  B.add(G.cube(24, 14, 0.4), stdMat(0x4a5459, { map: panelT, metalness: .6, roughness: .5 }), [0, 7, Z - 0.5]);
  B.add(G.cube(24, 0.2, 0.1), basicGlow(0xbfe8ff, 4), [0, 0.1, Z - 0.75]);
  B.add(G.cube(24, 1, 0.1), hazMat, [0, 14.4, Z - 0.75]);
  // hazard floor lines + barriers
  for (const s of [-1, 1]) { B.add(G.cube(X * 2 - 4, 0.02, 0.3), yel, [0, 0.01, s * 10.5]); B.add(G.cube(0.3, 0.02, 21), yel, [s * 10.5, 0.01, 0]); }
  for (const s of [-1, 1]) for (let k = -7.5; k <= 7.5; k += 2.5) { B.add(G.box(2.3, 0.85, 0.5, 0.05), hazMat, [k, 0.43, s * 8.6]); B.add(G.box(0.5, 0.85, 2.3, 0.05), hazMat, [s * 8.6, 0.43, k]); }
  // crates & carts
  const crate = stdMat(0x5a4a33, { map: TEX.panel, roughness: 0.8 });
  for (const [x, z, n] of [[-15, 8, 3], [16, 6, 2], [15, -9, 2], [-12, 14, 2], [17, 16, 3]]) for (let k = 0; k < n; k++) B.add(G.box(1.4, 1.4, 1.4, 0.04), crate, [x + rand(-.2, .2), 0.7 + k * 1.4, z + rand(-.2, .2)], [0, rand(-.2, .2), 0]);
  B.add(G.cube(1.5, 1.4, 2.6), yel, [-14, 0.9, -4]); B.add(G.cube(0.2, 3.2, 0.2), steel, [-14.7, 1.8, -5.2]); B.add(G.cube(0.2, 3.2, 0.2), steel, [-13.3, 1.8, -5.2]);
  for (const [x, z] of [[-14.6, -3], [-13.4, -3], [-14.6, -5], [-13.4, -5]]) B.add(G.cyl(0.35, 0.35, 0.3, 14), stdMat(0x111111, { roughness: .9 }), [x, 0.35, z], [0, 0, Math.PI / 2]);
  // scaffolds around dormant mechs
  const mechSpots = [[-13, -18, 0.55], [13, -18, -0.55]];
  for (const [mx, mz] of mechSpots) {
    for (const [dx, dz] of [[-3.5, -3], [3.5, -3], [-3.5, 3], [3.5, 3]]) B.add(G.cube(0.25, 12, 0.25), yel, [mx + dx, 6, mz + dz]);
    for (const h of [4.5, 8.5]) { B.add(G.cube(7.2, 0.18, 1.6), steel, [mx, h, mz + 3.2]); B.add(G.cube(7.2, 0.05, 0.05), yel, [mx, h + 1.0, mz + 4]); for (let k = -3.5; k <= 3.5; k += 1.75) B.add(G.cyl(0.03, 0.03, 1, 5), yel, [mx + k, h + 0.5, mz + 4]); }
    B.add(G.cube(7.2, 0.25, 0.25), yel, [mx, 12, mz - 3]); B.add(G.cube(7.2, 0.25, 0.25), yel, [mx, 12, mz + 3]);
  }
  B.build(g, { receive: true });
  // dormant giant robots in their cradles
  A.mechs = [];
  mechSpots.forEach(([mx, mz, ry], i) => {
    const def = ROBOTS[i === 0 ? 0 : 4];
    const R = buildRobot(def, { dormant: true, scale: 2.5, colors: { primary: i ? 0x6a6f63 : 0x9a9c94, secondary: 0x50544d, dark: 0x1e2122, accent: 0x000000, eye: 0x331100, tertiary: 0x50544d, brown: 0x50544d } });
    R.root.position.set(mx, 0, mz); R.root.rotation.y = ry; g.add(R.root);
    R.root.updateMatrixWorld(true); poseStatic(R, 'dormant');
    R.root.traverse(o => { if (o.isMesh) { o.castShadow = false; } });
    A.mechs.push(R);
    const welder = new THREE.Object3D(); welder.position.set(mx + (i ? -1.2 : 1.2), 3.2 + i * 2.5, mz + 1.4); g.add(welder);
    FX.addEmitter(welder, 'weld', 7);
    const wl = new THREE.PointLight(0x9fd8ff, 0, 8, 2); wl.position.copy(welder.position); g.add(wl); A.weldLights = (A.weldLights || []).concat(wl);
  });
  const work = new THREE.SpotLight(0xffe0b0, 600, 30, 0.5, 0.6, 1.5); work.position.set(0, 10, -8); work.target.position.set(-13, 6, -18); g.add(work, work.target);
  const work2 = work.clone(); work2.target = new THREE.Object3D(); work2.target.position.set(13, 6, -18); g.add(work2, work2.target);
  const ban = new THREE.Mesh(new THREE.PlaneGeometry(12, 3), stdMat(0xffffff, { map: texBanner(['BAY 9', 'AUTHORISED FRAMES ONLY · LIFT ZONE'], '#1a1f22', '#f2b400'), roughness: 0.9 })); ban.position.set(-X + 0.7, 10, 6); ban.rotation.y = Math.PI / 2; g.add(ban);
  A.dust = dustField(g, 400, [-15, 15, 1, 16, -20, 20], [0.8, 0.9, 1], 0.04);
  const spots = crowdRing(9.6, 4, 0.75, 0, 0, 1.0, (x, z) => (z < -11 && Math.abs(x) > 8) || Math.abs(x) > X - 1 || Math.abs(z) > Z - 2);
  for (const [mx, mz] of mechSpots) for (const h of [4.6, 8.6]) for (let k = -3.2; k <= 3.2; k += 0.7) spots.push([mx + k, h, mz + 3.4 + rand(-.2, .2)]);
  A.crowd = new Crowd(g, spots, ['#c98a1a', '#3d4a52', '#5a6870', '#2a3238', '#c9c2b0', '#7a3a1a']);
  A.lights = L; A.ropes = ring.ropes; A.floorTex = ring.floorTex;
};

VENUES.carnival = (g, A) => {
  const fogC = 0x100d22; scene.fog = new THREE.FogExp2(fogC, 0.0105); scene.background = new THREE.Color(fogC);
  A.env = makeEnvMap({ wall: 0x15122c, floor: 0x0d0b10, panels: [{ color: 0xbfd0ff, i: 3, pos: [-10, 10, -18], w: 3, h: 3 }, { color: 0xffa040, i: 4, pos: [0, 6, -20], w: 14, h: 3 }, { color: 0xff3a8a, i: 2.5, pos: [18, 3, 0], w: 4, h: 4 }, { color: 0x50c8ff, i: 2, pos: [-18, 3, 6], w: 4, h: 4 }] });
  const ring = buildRing(g, { canvas: '#5b2a3a', border: '#1a0f18', logo: '#f3d9a2', title: 'Wonderland Rust', apron: 'WONDERLAND RUST · RIDE AT YOUR OWN RISK', apronBg: '#26122a', apronFg: '#ffcf6a', ropes: [0xff4a8a, 0xffe6a0, 0x40c8ff], post: 0xcfb07a });
  const L = ringLights(g, { key: 0xffe8d0, keyI: 1350, rims: [0xff4a9a, 0x5ac8ff], rimI: 520, sky: 0x4050a0, ground: 0x1a1018, hemiI: 0.4 });
  // sky dome
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: {}, vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`, fragmentShader: `varying vec3 vP; void main(){ float h=clamp(vP.y,0.0,1.0); vec3 a=vec3(0.22,0.1,0.28), b=vec3(0.02,0.03,0.09); vec3 c=mix(a,b,pow(h,0.45)); gl_FragColor=vec4(c,1.0); }` });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), skyMat); g.add(sky);
  const sp = new Float32Array(1200 * 3); for (let i = 0; i < 1200; i++) { const a = rand(0, 6.28), e = rand(0.12, 1.4), r = 170; sp[i * 3] = Math.cos(a) * Math.cos(e) * r; sp[i * 3 + 1] = Math.sin(e) * r; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xdfe6ff, size: 1.1, sizeAttenuation: false, fog: false })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8eeff).multiplyScalar(2.2), fog: false })); moon.position.set(-60, 70, -130); g.add(moon);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.soft, color: 0x8fa0ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })); halo.scale.set(60, 60, 1); halo.position.copy(moon.position); g.add(halo);
  const moonL = new THREE.DirectionalLight(0x9fb0ff, 0.9); moonL.position.set(-60, 70, -130); g.add(moonL, moonL.target);
  // ground
  const tiles = texTiles(); tiles.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), stdMat(0xffffff, { map: tiles, roughness: 0.85, metalness: 0.05 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const B = new Batch();
  const iron = stdMat(0x8a8d96, { metalness: 0.8, roughness: 0.45 }); const rustM = stdMat(0x6a4030, { map: TEX.grunge, metalness: 0.6, roughness: 0.7 });
  // ferris wheel
  const FW = new THREE.Group(); FW.position.set(4, 16.5, -40); g.add(FW);
  const fwB = new Batch(); const R = 13;
  for (const z of [-0.7, 0.7]) { fwB.add(G.tor(R, 0.14, 8, 96), iron, [0, 0, z]); fwB.add(G.tor(R * 0.55, 0.08, 6, 64), iron, [0, 0, z]); }
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; for (const z of [-0.7, 0.7]) fwB.add(G.cyl(0.06, 0.06, R, 5), iron, [Math.cos(a) * R / 2, Math.sin(a) * R / 2, z], [0, 0, a - Math.PI / 2]); }
  fwB.add(G.cyl(0.8, 0.8, 2.2, 16), rustM, [0, 0, 0], [Math.PI / 2, 0, 0]);
  fwB.build(FW, { receive: false });
  const bulbMat = basicGlow(0xffc070, 5);
  const bulbs = new THREE.InstancedMesh(G.sph(0.13, 6, 4), bulbMat, 96); const mm = new THREE.Matrix4();
  for (let k = 0; k < 96; k++) { const a = k / 48 * Math.PI * 2; mm.makeTranslation(Math.cos(a) * R, Math.sin(a) * R, k < 48 ? 0.75 : -0.75); bulbs.setMatrixAt(k, mm); }
  FW.add(bulbs);
  A.gondolas = [];
  const gondMats = [0xd8433a, 0x2f8fd0, 0xe2b13c, 0x3cae7a].map(c => stdMat(c, { roughness: .5, metalness: .4 }));
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; const gnd = new THREE.Group(); gnd.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); const gm = gondMats[k % 4]; const cab = new THREE.Mesh(G.box(1.6, 1.4, 1.4, 0.15), gm); cab.position.y = -1.3; const roof = new THREE.Mesh(G.cone(1.1, 0.5, 4), gm); roof.position.y = -0.4; roof.rotation.y = Math.PI / 4; gnd.add(cab, roof); FW.add(gnd); A.gondolas.push(gnd); }
  A.ferris = FW;
  for (const s of [-1, 1]) for (const z of [-2.5, 2.5]) B.add(G.cyl(0.25, 0.35, 18.5, 8), iron, [4 + s * 4.6, 8.0, -40 + z], [z > 0 ? 0.12 : -0.12, 0, s * 0.25]);
  // roller coaster with a loop
  const cp = [[22, 2, 30], [32, 6, 18], [36, 14, 2], [30, 18, -14], [16, 9, -24], [6, 4, -28], [-6, 5, -30], [-18, 10, -26], [-30, 16, -14], [-34, 8, 4], [-28, 3, 18], [-14, 3, 30], [2, 4, 34]].map(p => V3(...p));
  const curve = new THREE.CatmullRomCurve3(cp, true, 'catmullrom', 0.4);
  const frames = curve.computeFrenetFrames(320, true);
  const railPts = [[], []];
  for (let i = 0; i <= 320; i++) { const p = curve.getPointAt(i / 320); const n = frames.binormals[i % 320]; railPts[0].push(p.clone().addScaledVector(n, 0.55)); railPts[1].push(p.clone().addScaledVector(n, -0.55)); }
  const railMat = stdMat(0xc23a2a, { metalness: 0.6, roughness: 0.45 });
  for (const rp of railPts) { const tc = new THREE.CatmullRomCurve3(rp, true); B.add(new THREE.TubeGeometry(tc, 320, 0.09, 6, true), railMat); }
  for (let i = 0; i < 160; i++) { const t = i / 160, p = curve.getPointAt(t); const tan = curve.getTangentAt(t); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), tan); B.add(G.cube(1.4, 0.08, 0.18), rustM, [p.x, p.y, p.z], q); if (i % 4 === 0 && p.y > 1.5) B.add(G.cyl(0.12, 0.12, p.y, 6), iron, [p.x, p.y / 2, p.z]); }
  // carousel
  const CR = new THREE.Group(); CR.position.set(-22, 0, -12); g.add(CR);
  const crB = new Batch();
  const stripe = canvasTex(512, 64, (gg, w, h) => { for (let x = 0; x < w; x += 32) { gg.fillStyle = (x / 32) % 2 ? '#e8d7b0' : '#b8322a'; gg.fillRect(x, 0, 32, h); } noiseFill(gg, w, h, 30); }); stripe.repeat.set(1, 1);
  crB.add(G.cyl(5.2, 5.4, 0.6, 32), stdMat(0x5a3a2a, { roughness: .7 }), [0, 0.3, 0]);
  crB.add(G.cone(5.8, 2.6, 32), stdMat(0xffffff, { map: stripe, roughness: .6 }), [0, 6.6, 0]);
  crB.add(G.cyl(0.6, 0.6, 5.4, 12), stdMat(0xd8b070, { metalness: .7, roughness: .3 }), [0, 3.0, 0]);
  const gold = stdMat(0xd8b070, { metalness: .9, roughness: .25 }); const horse = stdMat(0xe8e0d0, { roughness: .5 });
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = Math.cos(a) * 4, z = Math.sin(a) * 4, y = 2.0 + (k % 2) * 0.5; crB.add(G.cyl(0.05, 0.05, 4.8, 6), gold, [x, 3.0, z]); crB.add(G.box(1.2, 0.5, 0.36, 0.12), horse, [x, y, z], [0, -a, 0]); crB.add(G.box(0.3, 0.7, 0.28, 0.08), horse, [x + Math.cos(a + 1.57) * 0.55, y + 0.35, z + Math.sin(a + 1.57) * 0.55], [0, -a, 0.3]); }
  crB.build(CR, { receive: true });
  const crBulbs = new THREE.InstancedMesh(G.sph(0.12, 6, 4), basicGlow(0xffe0a0, 5), 40);
  for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; mm.makeTranslation(Math.cos(a) * 5.7, 5.3, Math.sin(a) * 5.7); crBulbs.setMatrixAt(k, mm); }
  CR.add(crBulbs); A.carousel = CR;
  const cl = new THREE.PointLight(0xffb060, 120, 18, 1.6); cl.position.set(-22, 4.5, -12); g.add(cl);
  // arcade cabinets
  for (let k = 0; k < 4; k++) {
    const x = 14 + k * 1.3, z = 12.5;
    const scr = canvasTex(128, 128, (gg, w, h) => { gg.fillStyle = '#000'; gg.fillRect(0, 0, w, h); const hue = randi(0, 360); for (let i = 0; i < 40; i++) { gg.fillStyle = `hsl(${hue + rand(-40, 40)},90%,60%)`; gg.fillRect(randi(0, 15) * 8, randi(0, 15) * 8, 8, 8); } gg.fillStyle = '#fff'; gg.font = 'bold 16px monospace'; gg.fillText(k === 2 ? 'TILT' : 'INSERT', 16, 112); });
    const cab = stdMat([0x2a3a8a, 0x8a2a5a, 0x1a1a1a, 0x2a7a5a][k], { roughness: .5 });
    B.add(G.box(1.1, 2.1, 0.9, 0.05), cab, [x, 1.05, z], [0, Math.PI + (k === 2 ? 0.25 : 0), k === 2 ? 0.1 : 0]);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), new THREE.MeshBasicMaterial({ map: scr, color: new THREE.Color(k === 2 ? 0.3 : 1.6, k === 2 ? 0.3 : 1.6, k === 2 ? 0.3 : 1.6) })); s.position.set(x, 1.45, z - 0.46); s.rotation.y = Math.PI; g.add(s);
  }
  const al = new THREE.PointLight(0xff4aa0, 40, 10, 1.8); al.position.set(16, 2.2, 11.5); g.add(al);
  // giant broken robot head half buried
  B.add(G.sph(3.2, 24, 16), rustM, [22, 0.6, -6], [0.4, 0.8, 0.3]);
  B.add(G.box(3.8, 1.2, 2.6, 0.3), rustM, [21.2, 0.8, -3.6], [0.3, 0.8, 0.4]);
  B.add(G.sph(0.65, 16, 10), basicGlow(0xffd040, 4), [20.5, 2.0, -3.5]);
  const hl = new THREE.PointLight(0xffc040, 30, 8, 2); hl.position.set(20, 2.5, -2.4); g.add(hl);
  // lamp posts and string lights
  const posts = [[-11, -11], [11, -11], [11, 11], [-11, 11]];
  for (const [x, z] of posts) { B.add(G.cyl(0.12, 0.16, 7.5, 8), iron, [x, 3.75, z]); B.add(G.sph(0.3, 10, 8), basicGlow(0xffe0b0, 4), [x, 7.6, z]); }
  const bulbCols = [0xff5a5a, 0xffd060, 0x60d0ff, 0x80ff90, 0xff70d0];
  const strings = []; for (let i = 0; i < 4; i++) { strings.push([posts[i], posts[(i + 1) % 4]]); }
  strings.push([posts[0], posts[2]], [posts[1], posts[3]]);
  const nb = strings.length * 26; const sb = new THREE.InstancedMesh(G.sph(0.09, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), nb); let bi = 0; const cc = new THREE.Color();
  for (const [[ax, az], [bx, bz]] of strings) for (let k = 0; k < 26; k++) { const t = (k + 0.5) / 26; const sag = Math.sin(t * Math.PI) * 2.4; mm.makeTranslation(lerp(ax, bx, t), 7.5 - sag, lerp(az, bz, t)); sb.setMatrixAt(bi, mm); cc.set(bulbCols[bi % 5]).multiplyScalar(3.5); sb.setColorAt(bi, cc); bi++; }
  g.add(sb);
  // bleachers
  const bl = stdMat(0x4a4f5a, { metalness: 0.7, roughness: 0.5 });
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) B.add(G.cube(1.0, 0.12, 18), bl, [s * (11 + k * 1.0), 0.5 + k * 0.6, 0]);
  for (const s of [-1, 1]) for (let z = -9; z <= 9; z += 3) B.add(G.cube(0.12, 3.4, 0.12), bl, [s * 15, 1.7, z]);
  B.build(g, { receive: true });
  const spots = [];
  for (const s of [-1, 1]) for (let k = 0; k < 5; k++) for (let z = -8.6; z <= 8.6; z += 0.72) spots.push([s * (11 + k * 1.0), 0.56 + k * 0.6, z + rand(-.1, .1)]);
  spots.push(...crowdRing(10, 3, 0.85, 0, 0, 1.0, (x, z) => Math.abs(x) > 10.5 || (z > 0 && Math.abs(x) < 6)));
  A.crowd = new Crowd(g, spots, ['#5a4a7a', '#7a3a5a', '#2a4a6a', '#9a8a6a', '#3a3a4a', '#6a2a2a']);
  A.lights = L; A.ropes = ring.ropes; A.floorTex = ring.floorTex;
};

VENUES.reactor = (g, A) => {
  const fogC = 0x050c14; scene.fog = new THREE.FogExp2(fogC, 0.014); scene.background = new THREE.Color(fogC);
  A.env = makeEnvMap({ wall: 0x0b1620, floor: 0x060a0e, panels: [{ color: 0x6fe8ff, i: 9, pos: [0, 14, 0], w: 6, h: 6 }, { color: 0x3a7aff, i: 3, pos: [18, 4, 0], w: 4, h: 10 }, { color: 0x3a7aff, i: 3, pos: [-18, 4, 0], w: 4, h: 10 }, { color: 0xffffff, i: 2, pos: [0, 4, 20], w: 10, h: 2 }] });
  const ring = buildRing(g, { canvas: '#1c2a36', border: '#0a1016', logo: '#7fe6ff', title: 'Helix Core', apron: 'HELIX CORE · CONTAINMENT LEVEL 4', apronBg: '#081018', apronFg: '#59d8ff', ropes: [0x59d8ff, 0xe6f6ff, 0x59d8ff], post: 0x3a4a56 });
  const L = ringLights(g, { key: 0xe6f6ff, keyI: 1400, rims: [0x40c0ff, 0x9a6aff], rimI: 520, sky: 0x4a8ab0, ground: 0x0a1218, hemiI: 0.35 });
  const Rw = 24, Hh = 34;
  const wallT = texCorrugated(); wallT.repeat.set(24, 3);
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rw, Rw, Hh, 48, 1, true), stdMat(0x3a4a58, { map: wallT, metalness: 0.7, roughness: 0.45, side: THREE.BackSide })); wall.position.y = Hh / 2; g.add(wall);
  const hex = texHex(); hex.repeat.set(10, 10);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(Rw, 48), stdMat(0xffffff, { map: hex, metalness: 0.6, roughness: 0.4 })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const B = new Batch();
  const steel = stdMat(0x26323c, { metalness: 0.85, roughness: 0.35 });
  const cyan = basicGlow(0x59d8ff, 3); const cyanDim = basicGlow(0x59d8ff, 1.2);
  // tiered stands
  const steel2 = stdMat(0x26323c, { metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide });
  for (let k = 0; k < 5; k++) {
    const r0 = 10 + k * 1.2, h = 0.6 + k * 0.6;
    B.add(new THREE.CylinderGeometry(r0, r0, h, 64, 1, true), steel2, [0, h / 2, 0]);
    B.add(new THREE.RingGeometry(r0, r0 + 1.2, 64, 1), steel2, [0, h, 0], [-Math.PI / 2, 0, 0]);
    B.add(G.tor(r0, 0.025, 4, 96), cyanDim, [0, h + 0.02, 0], [Math.PI / 2, 0, 0]);
  }
  // pillars with glowing conduits
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = Math.cos(a) * (Rw - 1.2), z = Math.sin(a) * (Rw - 1.2); B.add(G.cube(1.4, Hh, 1.4), steel, [x, Hh / 2, z], [0, -a, 0]); B.add(G.cube(0.12, Hh - 4, 0.12), cyan, [Math.cos(a) * (Rw - 2), Hh / 2, Math.sin(a) * (Rw - 2)], [0, -a, 0]); }
  // catwalk ring
  B.add(G.tor(19, 1.2, 4, 96), steel, [0, 9, 0], [Math.PI / 2, 0, 0]);
  B.add(G.tor(17.8, 0.04, 4, 96), cyan, [0, 10, 0], [Math.PI / 2, 0, 0]);
  // core column
  B.add(G.cyl(2.2, 2.2, Hh - 22, 24), steel, [0, 22 + (Hh - 22) / 2, 0]);
  for (let k = 0; k < 6; k++) B.add(G.cyl(2.25, 2.25, 0.3, 24), cyan, [0, 23 + k * 1.8, 0]);
  B.add(G.sph(1.6, 24, 16), basicGlow(0x9ff0ff, 6), [0, 21.6, 0]);
  // pipes arcing from walls to the core
  const pipeMat = stdMat(0x4a5a66, { metalness: 0.8, roughness: 0.35 });
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * Math.PI * 2 + 0.2; const c = new THREE.CubicBezierCurve3(V3(Math.cos(a) * Rw, 6 + (k % 3) * 2, Math.sin(a) * Rw), V3(Math.cos(a) * 16, 22, Math.sin(a) * 16), V3(Math.cos(a + 0.4) * 6, 30, Math.sin(a + 0.4) * 6), V3(Math.cos(a + 0.5) * 2.2, 26, Math.sin(a + 0.5) * 2.2));
    B.add(new THREE.TubeGeometry(c, 48, 0.35 + (k % 2) * 0.2, 10, false), pipeMat);
  }
  B.build(g, { receive: true });
  // rotating containment rings
  A.coreRings = [];
  for (let k = 0; k < 3; k++) {
    const rg = new THREE.Group(); rg.position.y = 16 + k * 2.4; g.add(rg);
    const r = 6 + k * 2.6;
    rg.add(new THREE.Mesh(G.tor(r, 0.35, 10, 96), steel)); const gl = new THREE.Mesh(G.tor(r - 0.36, 0.06, 6, 96), cyan); rg.add(gl);
    for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; const bx = new THREE.Mesh(G.box(0.9, 0.9, 1.3, 0.08), steel); bx.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); rg.add(bx); }
    rg.rotation.x = Math.PI / 2 + (k - 1) * 0.12; A.coreRings.push(rg);
  }
  const coreL = new THREE.PointLight(0x7fe8ff, 600, 40, 1.6); coreL.position.set(0, 20, 0); g.add(coreL); A.coreLight = coreL;
  const shaft = lightShaft(g, 3.6, 3.6, 20, 0, 0x7fe8ff, 0.18); A.shafts = [shaft.mat];
  A.dust = dustField(g, 500, [-14, 14, 1, 24, -14, 14], [0.5, 0.9, 1.1], 0.05);
  const steam = new THREE.Object3D(); steam.position.set(-16, 0.5, 14); g.add(steam); FX.addEmitter(steam, 'steam', 3);
  const steam2 = new THREE.Object3D(); steam2.position.set(17, 0.5, -12); g.add(steam2); FX.addEmitter(steam2, 'steam', 3);
  const spots = [];
  for (let k = 0; k < 5; k++) { const r0 = 10.6 + k * 1.2, y = 0.6 + k * 0.6; for (let a = 0; a < Math.PI * 2; a += 0.75 / r0) spots.push([Math.cos(a) * r0 + rand(-.1, .1), y, Math.sin(a) * r0 + rand(-.1, .1)]); }
  for (let a = 0; a < Math.PI * 2; a += 0.04) spots.push([Math.cos(a) * 19.3, 9.2, Math.sin(a) * 19.3]);
  A.crowd = new Crowd(g, spots, ['#2a3a4a', '#4a5a6a', '#1a2a3a', '#6a7a8a', '#3a2a4a', '#2a4a5a']);
  A.lights = L; A.ropes = ring.ropes; A.floorTex = ring.floorTex;
};

// ---------------------------------------------------------------- arena manager
const Arena = {
  current: null, id: null, group: null, t: 0,
  load(id) {
    if (this.id === id) return;
    this.dispose();
    const g = new THREE.Group(); g.name = 'arena-' + id; scene.add(g);
    this.group = g; this.id = id; this.current = { id };
    FX.clearEmitters();
    VENUES[id](g, this.current);
    scene.environment = this.current.env.texture;
    this.applyShadowQuality();
    this.splats = 0;
  },
  applyShadowQuality() {
    const q = QUALITY[settings.quality]; const key = this.current && this.current.lights && this.current.lights.key; if (!key) return;
    key.castShadow = q.shadow > 0;
    if (q.shadow > 0) { key.shadow.mapSize.set(q.shadow, q.shadow); if (key.shadow.map) { key.shadow.map.dispose(); key.shadow.map = null; } }
  },
  dispose() {
    if (!this.group) return;
    const geos = new Set(), mats = new Set(), texs = new Set();
    const cached = new Set(GC.values());
    this.group.traverse(o => {
      if (o.geometry && !cached.has(o.geometry)) geos.add(o.geometry);
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { mats.add(m); for (const k of ['map', 'roughnessMap', 'alphaMap', 'emissiveMap']) if (m[k] && m[k] !== TEX.panel && m[k] !== TEX.grunge && m[k] !== TEX.soft) texs.add(m[k]); });
    });
    geos.forEach(x => x.dispose()); mats.forEach(x => x.dispose()); texs.forEach(x => x.dispose());
    if (this.current && this.current.env) this.current.env.dispose();
    scene.remove(this.group); this.group = null; this.id = null; this.current = null;
  },
  groundAt(x, z) { const W = RING_H + 0.6; return (Math.abs(x) < W && Math.abs(z) < W) ? RING_Y : 0; },
  splat(x, z, big = 1) {
    const t = this.current && this.current.floorTex; if (!t) return;
    const W = RING_H + 0.6, c = t.userData.canvas, g = c.getContext('2d');
    const u = (x + W) / (2 * W) * c.width, v = (z + W) / (2 * W) * c.height;
    g.fillStyle = `rgba(12,9,6,${rand(0.35, 0.6)})`;
    for (let i = 0; i < 6 * big; i++) { g.beginPath(); g.ellipse(u + rand(-14, 14) * big, v + rand(-14, 14) * big, rand(3, 12) * big, rand(2, 7) * big, rand(0, 3), 0, 7); g.fill(); }
    t.needsUpdate = true;
  },
  update(dt, t, excite, fighters) {
    const A = this.current; if (!A) return;
    this.t += dt;
    if (A.ropes) A.ropes.update(dt, fighters);
    if (A.crowd) A.crowd.update(this.t, excite);
    if (A.dust) { A.dust.uniforms.uTime.value = this.t; A.dust.uniforms.uScale.value = FX.glow.mat.uniforms.uScale.value; }
    if (A.shafts) A.shafts.forEach(m => m.uniforms.uTime.value = this.t);
    if (A.ferris) { A.ferris.rotation.z += dt * 0.06; for (const gd of A.gondolas) gd.rotation.z = -A.ferris.rotation.z; }
    if (A.carousel) A.carousel.rotation.y += dt * 0.25;
    if (A.coreRings) A.coreRings.forEach((r, i) => r.rotation.z += dt * (i % 2 ? -0.25 : 0.18) * (1 + excite));
    if (A.coreLight) A.coreLight.intensity = 600 + Math.sin(this.t * 2.2) * 120 + excite * 300;
    if (A.weldLights) A.weldLights.forEach(l => { l.intensity = Math.random() < 0.3 ? rand(10, 40) : l.intensity * 0.7; });
    if (excite > 0.45 && A.crowd && Math.random() < dt * 14 * excite) { const p = A.crowd.randomHead(_av); FX.glow.emit(p.x, p.y, p.z, 0, 0, 0, 0.09, 0.5, 0.8, 7, 7, 7.5, 1); }
  },
};
const _av = V3();
