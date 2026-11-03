// ============================================================================
// MAPS: sky/lighting rigs and the six battlegrounds
// ============================================================================
const MAPGEN = {};

function setupSky(g, A, o) {
  const sky = new Sky(); sky.scale.setScalar(380); sky.frustumCulled = false; sky.userData.noAO = true;
  const u = sky.material.uniforms; u.turbidity.value = o.turbidity; u.rayleigh.value = o.rayleigh; u.mieCoefficient.value = o.mie; u.mieDirectionalG.value = 0.86;
  const sunDir = V3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - o.elev), THREE.MathUtils.degToRad(o.azim));
  u.sunPosition.value.copy(sunDir); g.add(sky);
  const es = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(100); Object.keys(u).forEach(k => sky2.material.uniforms[k].value = u[k].value); es.add(sky2);
  if (o.envGround) { const gm = new THREE.Mesh(new THREE.CircleGeometry(60, 24), new THREE.MeshBasicMaterial({ color: o.envGround })); gm.rotation.x = -Math.PI / 2; gm.position.y = -2; es.add(gm); }
  const pm = new THREE.PMREMGenerator(renderer); A.envRT = pm.fromScene(es, 0.02); pm.dispose(); sky2.geometry.dispose(); sky2.material.dispose();
  addSun(g, A, sunDir, o.sunColor, o.sunI);
  A.hemi = new THREE.HemisphereLight(o.skyC, o.groundC, o.hemiI); g.add(A.hemi);
  scene.fog = new THREE.FogExp2(o.fog, o.fogD); scene.background = new THREE.Color(o.fog);
}
function addSun(g, A, dir, color, intensity, box = 17) {
  const sun = new THREE.DirectionalLight(color, intensity);
  sun.shadow.camera.left = -box; sun.shadow.camera.right = box; sun.shadow.camera.top = box; sun.shadow.camera.bottom = -box; sun.shadow.camera.near = 5; sun.shadow.camera.far = 140;
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
  g.add(sun, sun.target); A.sun = sun; A.sunDir = dir.clone().normalize();
}
// procedural night sky with clouds, stars and lightning flashes
function setupNight(g, A, o) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color(o.top) }, uHor: { value: new THREE.Color(o.hor) }, uGlow: { value: new THREE.Color(o.glow) }, uFlash: { value: 0 }, uTime: { value: 0 }, uStars: { value: o.stars ? 1 : 0 }, uCloud: { value: o.clouds } },
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; }`,
    fragmentShader: `uniform vec3 uTop,uHor,uGlow; uniform float uFlash,uTime,uStars,uCloud; varying vec3 vP;
      float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y); }
      float fbm(vec2 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
      void main(){
        float y=clamp(vP.y,0.0,1.0);
        vec3 col=mix(uHor,uTop,pow(y,0.45));
        col+=uGlow*pow(1.0-y,5.0);
        vec2 cp=vP.xz/max(vP.y,0.06)*0.5+vec2(uTime*0.004,0.0);
        float c=fbm(cp*1.6);
        float cl=smoothstep(0.42,0.78,c)*uCloud*smoothstep(0.0,0.25,y);
        col=mix(col,col*0.45+uGlow*0.25,cl);
        if(uStars>0.5){ vec2 sp=vP.xz/(vP.y+0.25)*140.0; float s=h(floor(sp)); col+=vec3(0.9,0.95,1.0)*step(0.9965,s)*smoothstep(0.08,0.4,y)*(1.0-cl); }
        col+=vec3(0.7,0.78,1.0)*uFlash*(0.25+c*1.2);
        gl_FragColor=vec4(col,1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat); sky.frustumCulled = false; sky.userData.noAO = true; g.add(sky);
  A.skyMat = mat; A.anims.push((dt, t) => mat.uniforms.uTime.value = t);
  if (o.moon) {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xe8eeff).multiplyScalar(2.2), fog: false }));
    moon.position.copy(o.moon); g.add(moon);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.soft, color: 0x8fa0ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, fog: false, depthWrite: false })); halo.scale.set(60, 60, 1); halo.position.copy(o.moon); g.add(halo);
  }
  addSun(g, A, o.moonDir, o.moonColor, o.moonI);
  A.hemi = new THREE.HemisphereLight(o.skyC, o.groundC, o.hemiI); g.add(A.hemi);
  A.envRT = makeEnvMap(o.env);
  scene.fog = new THREE.FogExp2(o.fog, o.fogD); scene.background = new THREE.Color(o.fog);
  A.night = true;
}
function setupInterior(g, A, o) {
  addSun(g, A, o.keyDir, o.keyColor, o.keyI, 20);
  A.hemi = new THREE.HemisphereLight(o.skyC, o.groundC, o.hemiI); g.add(A.hemi);
  A.envRT = makeEnvMap(o.env);
  scene.fog = new THREE.FogExp2(o.fog, o.fogD); scene.background = new THREE.Color(o.fog);
}
function recenter(m) { m.geometry.computeBoundingBox(); const c = m.geometry.boundingBox.getCenter(V3()); m.geometry.translate(-c.x, -c.y, -c.z); m.position.add(c); m.matrixAutoUpdate = true; m.updateMatrix(); return m; }
function stripeTex(a, b, n = 8) { return canvasTex(512, 64, (g, w, h) => { for (let x = 0; x < w; x += w / n) { g.fillStyle = ((x / (w / n)) | 0) % 2 ? a : b; g.fillRect(x, 0, w / n, h); } noiseFill(g, w, h, 30); }, { repeat: [1, 1] }); }

// ---------------------------------------------------------------- city furniture
function cityRoof(A, b, mats, rng) {
  const B = new Batch(), top = b.yOff + b.nh * b.ch, w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  const t = 0.05;
  B.add(G.cube(w, 0.07, t), mats.roof, [cx, top + 0.035, b.z0 + t / 2]); B.add(G.cube(w, 0.07, t), mats.roof, [cx, top + 0.035, b.z1 - t / 2]);
  B.add(G.cube(t, 0.07, d), mats.roof, [b.x0 + t / 2, top + 0.035, cz]); B.add(G.cube(t, 0.07, d), mats.roof, [b.x1 - t / 2, top + 0.035, cz]);
  for (let i = 0; i < 2 + rng() * 3; i++) { const x = lerp(b.x0 + 0.15, b.x1 - 0.15, rng()), z = lerp(b.z0 + 0.15, b.z1 - 0.15, rng()); B.add(G.box(0.16, 0.08, 0.12, 0.01), mats.metal, [x, top + 0.04, z]); B.add(G.cyl(0.04, 0.04, 0.012, 10), mats.dark, [x, top + 0.086, z]); }
  if (b.style !== 'glass' && rng() < 0.45) {
    const x = cx + (rng() - 0.5) * w * 0.4, z = cz + (rng() - 0.5) * d * 0.4;
    for (const [dx, dz] of [[-0.07, -0.07], [0.07, -0.07], [-0.07, 0.07], [0.07, 0.07]]) B.add(G.cyl(0.008, 0.008, 0.12, 4), mats.dark, [x + dx, top + 0.06, z + dz]);
    B.add(G.cyl(0.1, 0.1, 0.16, 12), mats.wood, [x, top + 0.2, z]); B.add(G.cone(0.11, 0.07, 12), mats.dark, [x, top + 0.315, z]);
  }
  if (b.style === 'glass' && b.nh * b.ch > 4) { B.add(G.cyl(0.012, 0.02, 0.9, 6), mats.metal, [cx, top + 0.45, cz]); B.add(G.sph(0.03, 8, 6), mats.red, [cx, top + 0.92, cz]); }
  if (rng() < 0.18) {
    const face = rng() < 0.5; B.add(G.cube(face ? w * 0.8 : 0.03, 0.03, face ? 0.03 : d * 0.8), mats.dark, [cx, top + 0.1, cz]);
    const words = ['IRONVOLT', 'KAIJU COLA', 'DRIFT', 'PAN PACIFIC', 'NEO DOCK', 'JAEGER FUEL', 'NOODLE KING'];
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(face ? w * 0.8 : d * 0.8, 0.32), new THREE.MeshBasicMaterial({ map: neonTex(pick(words), pick(['#ff3a7a', '#3ad8ff', '#ffd23a', '#7aff5a']), false), color: new THREE.Color(1, 1, 1).multiplyScalar(A.storm ? 2.6 : 1.4), side: THREE.DoubleSide }));
    sign.position.set(cx, top + 0.3, cz); if (!face) sign.rotation.y = Math.PI / 2; A.group.add(sign); b.roof.push({ mesh: sign });
  }
  const meshes = B.build(A.group, { cast: true, receive: true });
  meshes.forEach(m => { recenter(m); b.roof.push({ mesh: m }); });
}
function cityNeon(A, b, rng, roadsX, roadsZ) {
  const words = ['HOTEL', 'BAR', 'RAMEN', '24H', 'KARAOKE', 'DOCK 7', 'PHARMA', 'CASINO', 'OPEN', 'TATTOO', 'DINER', 'MOTEL'];
  const cols = ['#ff2f7a', '#2fd8ff', '#ffd23a', '#9a5aff', '#5aff8a', '#ff7a2f'];
  const n = A.storm ? 2 : 1;
  for (let k = 0; k < n; k++) {
    if (rng() > (A.storm ? 0.75 : 0.35) || b.nh < 5) continue;
    const iy = 2 + Math.floor(rng() * Math.min(5, b.nh - 3)), sideX = rng() < 0.5;
    let ix, iz, nx, nz;
    if (sideX) { const right = rng() < 0.5; ix = right ? b.nx - 1 : 0; iz = Math.floor(rng() * b.nz); nx = right ? 1 : -1; nz = 0; }
    else { const front = rng() < 0.5; iz = front ? b.nz - 1 : 0; ix = Math.floor(rng() * b.nx); nz = front ? 1 : -1; nx = 0; }
    const i = b.idx(ix, iy, iz); const c = b.center(i, V3());
    const word = pick(words), col = pick(cols), vert = rng() < 0.7, hgt = vert ? 1.0 : 0.3, wid = vert ? 0.26 : 0.9;
    const sign = new THREE.Group();
    const face = new THREE.Mesh(new THREE.PlaneGeometry(wid, hgt), new THREE.MeshBasicMaterial({ map: neonTex(word, col, vert), color: new THREE.Color(1, 1, 1).multiplyScalar(A.storm ? 3 : 1.5), side: THREE.DoubleSide }));
    const back = new THREE.Mesh(new THREE.BoxGeometry(wid + 0.03, hgt + 0.03, 0.02), stdMat(0x111111));
    sign.add(back, face); face.position.z = 0.012;
    if (vert) { sign.position.set(c.x + nx * (b.cw / 2 + wid / 2 + 0.02), c.y, c.z + nz * (b.cw / 2 + wid / 2 + 0.02)); sign.rotation.y = nx ? 0 : Math.PI / 2; }
    else { sign.position.set(c.x + nx * (b.cw / 2 + 0.04), c.y, c.z + nz * (b.cw / 2 + 0.04)); sign.rotation.y = nx ? (nx > 0 ? Math.PI / 2 : -Math.PI / 2) : (nz > 0 ? 0 : Math.PI); }
    const geo = mergeGeometries([back.geometry.clone().toNonIndexed().applyMatrix4(back.matrix), face.geometry.clone().toNonIndexed().applyMatrix4(face.matrix)].map(g => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); return g; }), true);
    const mesh = new THREE.Mesh(geo, [back.material, face.material]); mesh.position.copy(sign.position); mesh.rotation.copy(sign.rotation);
    A.group.add(mesh); b.decor.push({ mesh, chunk: i });
  }
}

function genCity(g, A, storm) {
  A.storm = storm;
  if (storm) {
    setupNight(g, A, { top: 0x05070c, hor: 0x1a2030, glow: 0x5a3a2a, stars: false, clouds: 1.0, moonDir: V3(-0.4, 1, 0.3), moonColor: 0x8aa0d0, moonI: 0.55, skyC: 0x30405a, groundC: 0x0c0c10, hemiI: 0.55, fog: 0x141a26, fogD: 0.021,
      env: { wall: 0x0a0d14, floor: 0x050608, panels: [{ color: 0xff2f7a, i: 3, pos: [16, 3, 10], w: 6, h: 3 }, { color: 0x2fd8ff, i: 3, pos: [-16, 4, -6], w: 6, h: 3 }, { color: 0xffb060, i: 2, pos: [0, 2, -20], w: 20, h: 2 }, { color: 0x6080b0, i: 1.5, pos: [0, 16, 0], w: 20, h: 20 }] } });
    A.grade = { contrast: 1.14, sat: 1.12, sharp: 0.4, shadow: [0.82, 0.95, 1.12], high: [1.08, 0.98, 0.92], vig: 1.0 };
    A.lightning = { flash: 0, base: A.hemi.intensity, bolt: new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: new THREE.Color(3, 3.2, 4), fog: false })) };
    A.lightning.bolt.visible = false; A.lightning.bolt.frustumCulled = false; A.lightning.bolt.userData.noAO = true; g.add(A.lightning.bolt);
  } else {
    setupSky(g, A, { elev: 3.5, azim: 205, turbidity: 9, rayleigh: 2.6, mie: 0.006, sunColor: 0xffa070, sunI: 2.6, skyC: 0x8a97c8, groundC: 0x40302c, hemiI: 0.75, fog: 0x6b5d68, fogD: 0.0105, envGround: 0x2a2624 });
    A.grade = { contrast: 1.08, sat: 1.06, sharp: 0.38, shadow: [0.9, 0.95, 1.08], high: [1.06, 1.0, 0.92], vig: 0.9 };
  }
  A.dustColor = storm ? [0.3, 0.32, 0.36] : [0.45, 0.42, 0.4]; A.bound = { x0: -27, x1: 27, z0: -27, z1: 19.6 };
  A.groundFn = (x, z) => z > 20.4 ? (Math.abs(x) < 7 ? -Math.min(2.6, (z - 20.4) * 0.36) : -2.6) : 0;
  const BS = 7.5, RW = 2.2;
  const S = 2048, span = 120, px = S / span, toPx = v => (v + span / 2) * px;
  const gt = canvasTex(S, S, (c) => {
    c.fillStyle = '#5d5a55'; c.fillRect(0, 0, S, S);
    for (let k = -8; k <= 8; k++) { const v = toPx(k * BS); c.fillStyle = '#7a766e'; c.fillRect(v - (RW / 2 + 0.38) * px, 0, (RW + 0.76) * px, S); c.fillRect(0, v - (RW / 2 + 0.38) * px, S, (RW + 0.76) * px); }
    for (let k = -8; k <= 8; k++) { const v = toPx(k * BS); c.fillStyle = '#2b2c2e'; c.fillRect(v - RW / 2 * px, 0, RW * px, S); c.fillRect(0, v - RW / 2 * px, S, RW * px); }
    for (let k = -8; k <= 8; k++) {
      const v = toPx(k * BS); c.strokeStyle = '#c9a63a'; c.lineWidth = 2; c.setLineDash([10, 10]);
      c.beginPath(); c.moveTo(v, 0); c.lineTo(v, S); c.stroke(); c.beginPath(); c.moveTo(0, v); c.lineTo(S, v); c.stroke(); c.setLineDash([]);
      c.strokeStyle = 'rgba(230,230,220,.55)'; c.lineWidth = 3;
      for (let j = -8; j <= 8; j++) { const w = toPx(j * BS); for (let s = -4; s <= 4; s += 1.6) { c.beginPath(); c.moveTo(w + s * 3 - 6, v - RW * px * 0.55); c.lineTo(w + s * 3 - 6, v - RW * px * 0.35); c.stroke(); } c.fillStyle = 'rgba(20,20,20,.7)'; c.beginPath(); c.arc(w + 9, v + 9, 3, 0, 7); c.fill(); }
    }
    const pl = toPx(-BS + RW / 2), pw = (2 * BS - RW) * px; c.fillStyle = '#7d766c'; c.fillRect(pl, pl, pw, pw);
    c.strokeStyle = 'rgba(40,36,30,.35)'; c.lineWidth = 1; for (let i = 0; i < pw; i += 10) { c.beginPath(); c.moveTo(pl + i, pl); c.lineTo(pl + i, pl + pw); c.stroke(); c.beginPath(); c.moveTo(pl, pl + i); c.lineTo(pl + pw, pl + i); c.stroke(); }
    c.fillStyle = '#8a8378'; c.fillRect(0, toPx(19.8), S, toPx(20.5) - toPx(19.8));
    blotches(c, S, S, 300, '0,0,0', .05, .18, 10, 60); noiseFill(c, S, S, 14);
    if (storm) blotches(c, S, S, 160, '10,12,16', .25, .45, 6, 40);
  }, { repeat: [1, 1] });
  gt.wrapS = gt.wrapT = THREE.ClampToEdgeWrapping;
  const detail = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#888'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 90); blotches(c, w, h, 40, '0,0,0', .1, .3, 4, 20); }, { repeat: [60, 60] });
  const groundMat = new THREE.MeshStandardMaterial({ map: gt, roughness: storm ? 1 : 0.9, metalness: 0.02, normalMap: autoNormal(detail, 2.5) });
  groundMat.normalMap.repeat.set(60, 60);
  if (storm) {
    const rough = canvasTex(1024, 1024, (c, w, h) => { c.fillStyle = 'rgb(120,120,120)'; c.fillRect(0, 0, w, h); blotches(c, w, h, 260, '10,10,10', .5, .9, 6, 40); noiseFill(c, w, h, 30); }, { srgb: false, repeat: [6, 6] });
    groundMat.roughnessMap = rough; groundMat.envMapIntensity = 2.2;
  }
  const gg = new THREE.PlaneGeometry(span, 80.4, 1, 1); gg.rotateX(-Math.PI / 2); gg.translate(0, 0, -19.8);
  { const p = gg.attributes.position, uv = gg.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + 60) / 120, 1 - (p.getZ(i) + 60) / 120); }
  const ground = new THREE.Mesh(gg, groundMat); ground.receiveShadow = true; g.add(ground);
  const wn = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#808080'; c.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { const x = Math.random() * w, y = Math.random() * h, r = rand(3, 14); const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); } }, { srgb: false });
  const waterMat = new THREE.MeshStandardMaterial({ color: storm ? 0x0a161c : 0x0f2a33, roughness: storm ? 0.12 : 0.06, metalness: 0.0, normalMap: autoNormal(wn, 3), envMapIntensity: 1.4 });
  waterMat.normalMap.repeat.set(30, 15);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(0, -0.32, 120.4); g.add(water); A.water = water;
  const B = new Batch();
  const concrete = stdMat(0x8a857c, { roughness: 0.85 });
  B.add(G.cube(53, 2.8, 0.5), concrete, [-33.5, -1.4, 20.6]); B.add(G.cube(53, 2.8, 0.5), concrete, [33.5, -1.4, 20.6]);
  for (const s of [-1, 1]) B.add(G.cube(0.5, 2.8, 7.6), concrete, [s * 7.25, -1.4, 24.2]);
  const ramp = new THREE.PlaneGeometry(14, 7.6, 1, 1); ramp.rotateX(-Math.PI / 2); const rp = ramp.attributes.position;
  for (let i = 0; i < rp.count; i++) rp.setY(i, rp.getZ(i) > 0 ? -2.65 : 0); ramp.translate(0, 0, 24.2); ramp.computeVertexNormals();
  const rampM = new THREE.Mesh(ramp, concrete); rampM.receiveShadow = true; g.add(rampM);
  const dark = stdMat(0x22262a, { metalness: 0.7, roughness: 0.45 });
  for (let x = -26; x <= 26; x += 2.2) if (Math.abs(x) > 7.5) B.add(G.cyl(0.05, 0.06, 0.12, 8), dark, [x, 0.06, 20.1]);
  // gantry cranes
  const red = stdMat(0xb8392a, { metalness: 0.5, roughness: 0.5 });
  for (const cx of [-24, -3.5, 14]) {
    for (const [dx, dz] of [[-0.8, 19.2], [0.8, 19.2], [-0.8, 21.6], [0.8, 21.6]]) B.add(G.cube(0.15, 5.2, 0.15), red, [cx + dx, 2.6, dz]);
    for (const dz of [19.2, 21.6]) { B.add(G.cube(1.75, 0.12, 0.12), red, [cx, 1.6, dz]); B.add(G.cube(1.75, 0.12, 0.12), red, [cx, 3.6, dz]); B.add(G.cube(0.08, 2.4, 0.08), red, [cx, 2.6, dz], [0, 0, 0.62]); }
    B.add(G.cube(1.9, 0.3, 9), red, [cx, 5.3, 23]); B.add(G.box(0.6, 0.45, 0.7, 0.04), stdMat(0xdcd8cc), [cx + 0.6, 4.85, 21.2]);
    B.add(G.cube(0.5, 0.5, 0.6), dark, [cx, 4.9, 25]); B.add(G.cyl(0.015, 0.015, 3, 4), dark, [cx, 3.4, 25]); B.add(G.box(0.48, 0.1, 0.22, 0.02), dark, [cx, 1.85, 25]);
  }
  // tanker at the quay (open cargo hold lit from inside), anchor chain, barrels
  const hullTex = canvasTex(512, 256, (c, w, h) => { c.fillStyle = '#1b1d20'; c.fillRect(0, 0, w, h * 0.58); c.fillStyle = '#7a2a20'; c.fillRect(0, h * 0.58, w, h); c.fillStyle = '#d8d4c8'; c.fillRect(0, h * 0.56, w, 4); for (let i = 0; i < 70; i++) { const x = Math.random() * w, l = rand(20, 90); const gr = c.createLinearGradient(x, 0, x, l); gr.addColorStop(0, 'rgba(140,70,30,.5)'); gr.addColorStop(1, 'rgba(140,70,30,0)'); c.fillStyle = gr; c.fillRect(x, rand(0, h * 0.3), rand(2, 5), l); } c.fillStyle = 'rgba(230,230,220,.8)'; c.font = '900 40px "Big Shoulders Display", Impact'; c.fillText('KESTREL', 330, 70); noiseFill(c, w, h, 22); }, { repeat: [1, 1] });
  const hullGeo = new THREE.BoxGeometry(22, 2.6, 3.6, 24, 4, 4); const hp = hullGeo.attributes.position;
  for (let i = 0; i < hp.count; i++) { const x = hp.getX(i); if (x > 7) { const k = clamp((x - 7) / 4, 0, 1); hp.setZ(i, hp.getZ(i) * (1 - k * 0.8)); } if (x < -9.5) hp.setZ(i, hp.getZ(i) * (1 - clamp((-9.5 - x) / 1.5, 0, 1) * 0.25)); }
  hullGeo.computeVertexNormals();
  const hull = new THREE.Mesh(hullGeo, new THREE.MeshStandardMaterial({ map: hullTex, roughness: 0.7, metalness: 0.4 })); hull.position.set(-20, -0.95, 25.6); hull.castShadow = hull.receiveShadow = true; g.add(hull);
  const deckMat = stdMat(0x4a5a4a, { roughness: 0.8, map: TEX.pC.map });
  B.add(G.cube(19, 0.08, 3.3), deckMat, [-21, 0.36, 25.6]);
  for (let i = 0; i < 4; i++) { const hx = -27 + i * 3.4; if (i === 2) { B.add(G.cube(2.4, 0.06, 2.2), basicGlow(0xffb060, 1.6), [hx, 0.3, 25.6]); lightShaft(g, [hx, 0.3, 25.6], 2.2, 2.0, 3, 0, 0xffb060, 0.15); } else B.add(G.box(2.6, 0.24, 2.4, 0.03), stdMat(0x2a4a5a, { roughness: 0.6, metalness: 0.4 }), [hx, 0.5, 25.6]); }
  B.add(G.box(2.6, 2.2, 3.0, 0.05), stdMat(0xd8d4c8, { roughness: 0.6 }), [-29, 1.5, 25.6]); B.add(G.box(3.0, 0.15, 3.4, 0.02), dark, [-29, 2.65, 25.6]); B.add(G.box(2.2, 0.8, 2.8, 0.04), stdMat(0xd8d4c8), [-29.2, 3.1, 25.6]);
  B.add(G.cube(2.25, 0.3, 2.85), basicGlow(0xbfe3ff, storm ? 1.6 : 0.8), [-28.8, 3.15, 25.6]);
  B.add(G.cyl(0.38, 0.45, 1.6, 16), red, [-30.2, 3.5, 25.6]); B.add(G.cyl(0.39, 0.39, 0.3, 16), dark, [-30.2, 4.3, 25.6]);
  for (const cx of [-24.5, -19.5, -14.5]) { B.add(G.cyl(0.12, 0.14, 1.6, 10), stdMat(0xd8a42a), [cx, 1.1, 24.3]); B.add(G.cyl(0.05, 0.05, 3.2, 6), stdMat(0xd8a42a), [cx + 1.1, 2.2, 24.3], [0, 0, -0.9]); }
  const cMats = [0xa13a24, 0x245e7a, 0xc2862a, 0x3a6e3a, 0x8a8a84].map(c => stdMat(c, { map: (() => canvasTex(128, 128, (cc, w, h) => { for (let x = 0; x < w; x++) { const v = 180 + Math.sin(x / w * Math.PI * 16) * 60; cc.fillStyle = `rgb(${v},${v},${v})`; cc.fillRect(x, 0, 1, h); } noiseFill(cc, w, h, 30); }))(), roughness: 0.6, metalness: 0.4 }));
  for (let i = 0; i < 24; i++) B.add(G.cube(0.95, 0.42, 0.44), pick(cMats), [-13.5 + (i % 4) * 1.0 - 4.5, 0.65 + Math.floor(i / 8) * 0.42, 24.8 + ((i >> 2) % 2) * 1.3]);
  chainLinks(g, [[-9.6, 0.2, 25.0, 3.2], [-9.6, 0.2, 26.2, 3.0]], stdMat(0x3b3631, { metalness: 0.85, roughness: 0.5 }));
  for (const [x, z] of [[-12, 19.4], [-12.6, 19.2], [-11.4, 19.6], [-26, 19.3], [-25.4, 19.5]]) { const m = pick([red, stdMat(0x24496b), stdMat(0x3c4a2c)]); B.add(G.cyl(0.11, 0.11, 0.34, 12), m, [x, 0.17, z]); B.add(G.tor(0.11, 0.01, 4, 12), dark, [x, 0.08, z], [Math.PI / 2, 0, 0]); B.add(G.tor(0.11, 0.01, 4, 12), dark, [x, 0.26, z], [Math.PI / 2, 0, 0]); }
  for (const x of [-27, -15]) B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(x, 0.4, 23.9), V3(x - 0.5, 0.1, 21.5), V3(x - 0.8, 0.12, 20.2)]), 10, 0.025, 5), stdMat(0xa08a60, { roughness: 0.95 }));
  // suspension bridge across the bay
  const steelB = stdMat(storm ? 0x3a4248 : 0x8a3a2a, { metalness: 0.5, roughness: 0.5 });
  for (const tx of [-30, 30]) { for (const dz of [-1.4, 1.4]) B.add(G.cube(0.8, 22, 0.8), steelB, [tx, 9, 78 + dz]); for (const y of [6, 13, 19.5]) B.add(G.cube(0.6, 0.8, 3.6), steelB, [tx, y, 78]); B.add(G.sph(0.2, 8, 6), basicGlow(0xff3020, 6), [tx, 20.3, 78]); }
  B.add(G.cube(240, 0.6, 3.4), stdMat(0x5a5e62, { roughness: 0.6 }), [0, 4.3, 78]);
  for (const dz of [-1.5, 1.5]) {
    const cab = new THREE.CatmullRomCurve3([V3(-110, 4.6, 78 + dz), V3(-60, 9, 78 + dz), V3(-30, 19.8, 78 + dz), V3(0, 6, 78 + dz), V3(30, 19.8, 78 + dz), V3(60, 9, 78 + dz), V3(110, 4.6, 78 + dz)]);
    B.add(new THREE.TubeGeometry(cab, 120, 0.15, 6), steelB);
    for (let x = -28; x <= 28; x += 2.5) { const t = (x + 30) / 60; const y = 4.6 + (Math.cosh((x) / 24) - 1) * 6.3 + 1.4; B.add(G.cyl(0.03, 0.03, Math.max(0.2, y - 4.6), 4), steelB, [x, 4.6 + (y - 4.6) / 2, 78 + dz]); }
  }
  const lightsB = new THREE.InstancedMesh(G.sph(0.12, 6, 4), basicGlow(0xffd8a0, storm ? 6 : 4), 80);
  for (let i = 0; i < 80; i++) { _wm.makeTranslation(-120 + i * 3, 4.75, 78 + (i % 2 ? 1.6 : -1.6)); lightsB.setMatrixAt(i, _wm); } g.add(lightsB);
  // street lamps, traffic lights
  const pole = stdMat(0x2a2d30, { metalness: 0.7, roughness: 0.4 }), lampG = basicGlow(0xffc77a, storm ? 10 : 8);
  for (let k = -3; k <= 3; k++) for (let j = -3; j <= 2; j++) for (const s of [-1, 1]) {
    const x = k * BS + s * (RW / 2 + 0.12), z = j * BS + 2.5; if (z > 19) continue;
    B.add(G.cyl(0.012, 0.016, 0.42, 5), pole, [x, 0.21, z]); B.add(G.box(0.07, 0.015, 0.03, 0.005), lampG, [x - s * 0.03, 0.42, z]);
  }
  const tl = [basicGlow(0xff2a1a, 6), basicGlow(0x2aff6a, 6), basicGlow(0xffb02a, 6)];
  for (let k = -3; k <= 3; k++) for (let j = -3; j <= 2; j++) {
    const ix = k * BS, iz = j * BS; if (Math.abs(ix) < 5 && Math.abs(iz) < 5) continue;
    for (const [sx, sz] of [[1, 1], [-1, -1]]) { const x = ix + sx * (RW / 2 + 0.2), z = iz + sz * (RW / 2 + 0.2); B.add(G.cyl(0.01, 0.012, 0.22, 5), pole, [x, 0.11, z]); B.add(G.cube(0.03, 0.07, 0.03), pole, [x, 0.25, z]); B.add(G.sph(0.009, 6, 4), pick(tl), [x, 0.27, z + sz * 0.016]); }
  }
  // fountain in the plaza
  B.add(G.cyl(1.4, 1.5, 0.12, 32), concrete, [0, 0.06, 0]); B.add(G.cyl(1.25, 1.25, 0.02, 32), new THREE.MeshStandardMaterial({ color: 0x1a3a44, roughness: 0.05, metalness: 0.1 }), [0, 0.11, 0]);
  // skyline beyond the playable blocks
  const glowI = storm ? 1.4 : 0.55;
  for (const st of ['glass', 'office', 'brick']) A.makeSet(st, glowI);
  A.makeSet('shop', storm ? 1.6 : 0.9);
  const rng = mulberry32(42);
  const red2 = basicGlow(0xff2a1a, 5);
  for (let i = 0; i < 80; i++) {
    const a = rng() * Math.PI * 2, r = 38 + rng() * 60, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 30 && Math.abs(x) < 70) continue;
    const w = 2 + rng() * 4, d = 2 + rng() * 4, h = 6 + rng() * (r > 60 ? 22 : 12), st = pick(['glass', 'office', 'brick', 'glass']);
    B.add(facadeBox(w, h, d), A.sets[st].mat, [x, h / 2, z]);
    if (rng() < 0.5) { const h2 = h * (0.2 + rng() * 0.3); B.add(facadeBox(w * 0.6, h2, d * 0.6), A.sets[st].mat, [x, h + h2 / 2, z]); B.add(G.cyl(0.05, 0.08, 2.5, 6), dark, [x, h + h2 + 1.25, z]); B.add(G.sph(0.18, 6, 4), red2, [x, h + h2 + 2.5, z]); }
  }
  B.build(g, { receive: true, cast: true });
  // destructible city blocks with shopfronts, setbacks, roofs and neon
  const tints = { glass: [0x9fb6c9, 0x7a8fa8, 0xb8c7d4], office: [0xd8d2c4, 0xb9b3a6, 0xe6e0d0], brick: [0xb0806a, 0xc49a7f, 0x9a6a58] };
  const roofMats = { roof: stdMat(0x6a6660, { roughness: 0.9 }), metal: stdMat(0x8a8e90, { metalness: 0.6, roughness: 0.4 }), dark: stdMat(0x2a2c2e, { metalness: 0.5 }), wood: stdMat(0x6a4a32, { roughness: 0.9 }), red: basicGlow(0xff2a1a, 6) };
  const made = [];
  for (let bx = -4; bx < 4; bx++) for (let bz = -4; bz < 3; bz++) {
    const cx = (bx + 0.5) * BS, cz = (bz + 0.5) * BS;
    if (Math.abs(cx) < 5 && Math.abs(cz) < 5) continue;
    const inner = BS - RW - 0.4, lots = rng() < 0.35 ? 1 : rng() < 0.6 ? 2 : 4;
    const back = cz < -9, wf = cz > 14;
    for (let l = 0; l < lots; l++) {
      const lw = lots === 4 ? inner / 2 : lots === 2 ? inner / 2 : inner, ld = lots === 4 ? inner / 2 : inner;
      const ox = lots === 1 ? 0 : (l % 2 ? 1 : -1) * inner / 4, oz = lots === 4 ? (l < 2 ? -1 : 1) * inner / 4 : 0;
      const nx = Math.min(7, Math.max(2, Math.floor((lw - 0.3) / CW) - (rng() < 0.4 ? 1 : 0))), nz = Math.min(7, Math.max(2, Math.floor((ld - 0.3) / CW) - (rng() < 0.4 ? 1 : 0)));
      const nh = wf ? 3 + Math.floor(rng() * 4) : Math.floor((back ? 12 : 7) + rng() * (back ? 9 : 8));
      const st = wf ? 'brick' : pick(['glass', 'office', 'brick', 'glass', 'office']);
      const b = A.addBuilding(st, cx + ox, cz + oz, nx, nz, nh, pick(tints[st]), { shop: st !== 'glass' || rng() < 0.4 ? 'shop' : null });
      made.push(b);
      if (nh >= 9 && nx >= 4 && nz >= 4 && rng() < 0.55) { const c = A.addBuilding(rng() < 0.5 ? st : 'glass', cx + ox, cz + oz, nx - 2, nz - 2, 3 + Math.floor(rng() * 7), pick(tints[st]), { yOff: nh * CH, parent: b }); made.push(c); }
    }
  }
  A.finalizeBuildings(g);
  for (const b of made) { if (!b.children.length) cityRoof(A, b, roofMats, rng); if (!b.yOff) cityNeon(A, b, rng); }
  A.anims.push((dt, t) => { roofMats.red.color.setRGB(1, 0.16, 0.1).multiplyScalar(Math.sin(t * 3) > 0 ? 6 : 0.4); });
  // cars, trees, props
  const cars = [], trees = [];
  for (let k = -4; k <= 4; k++) for (let t = -28; t < 20; t += rand(0.4, 1.4)) {
    if (Math.abs(k * BS) < 8 && Math.abs(t) < 8) continue;
    const lane = rand() < 0.5 ? -0.45 : 0.45;
    if (rand() < 0.5) cars.push([k * BS + lane, t, rand() < 0.5 ? 0 : Math.PI]); else if (t < 19) cars.push([t, k * BS + lane, Math.PI / 2]);
  }
  A.makeCars(cars.filter(c => c[1] < 19.5));
  for (let k = -4; k <= 4; k++) for (let t = -27; t < 19; t += 0.9) for (const s of [-1, 1]) { const off = k * BS + s * (RW / 2 + 0.28); if (Math.abs(off) < 8 && Math.abs(t) < 8) continue; if (((t / BS) % 1 + 1) % 1 < 0.2) continue; if (rand() < 0.5) trees.push([off, t, rand(0, 6), null, rand(0.8, 1.2)]); else if (t < 19) trees.push([t, off, rand(0, 6), null, rand(0.8, 1.2)]); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; trees.push([Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0, null, 1.3]); }
  const trunk = new THREE.CylinderGeometry(0.008, 0.012, 0.09, 5).toNonIndexed(); trunk.translate(0, 0.045, 0);
  const crown = new THREE.IcosahedronGeometry(0.065, 0).toNonIndexed(); crown.translate(0, 0.13, 0);
  for (const gg2 of [trunk, crown]) for (const a of Object.keys(gg2.attributes)) if (!['position', 'normal', 'uv'].includes(a)) gg2.deleteAttribute(a);
  A.addSmalls(mergeGeometries([trunk, crown]), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true }), trees.filter(t => t[1] < 19.5), [0x3a5a2a, 0x2a4a22, 0x4a6a32, 0x5a6a2a], [1.5, 0.18, 1.5], 0x3a2a1a);
  const busMat = stdMat(0xd8a42a, { roughness: 0.4, metalness: 0.3 });
  for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(G.box(0.95, 0.42, 0.44, 0.02), pick(cMats)); m.position.set(-4 + i * 2.6 + rand(-.3, .3), 0.21, 18.6 + rand(-.3, .3)); m.rotation.y = rand(-.3, .3); m.castShadow = true; A.addProp(m, { mass: 1, size: 0.48, kind: 'container' }); }
  for (const [x, z, r] of [[-7.5, -3, 0], [7.5, 5, 0], [3, 7.5, 1.57], [-4, -7.5, 1.57], [15, -10, 0], [-15, 12, 0]]) { const m = new THREE.Mesh(G.box(0.12, 0.13, 0.48, 0.02), busMat); m.position.set(x, 0.07, z); m.rotation.y = r; m.castShadow = true; A.addProp(m, { mass: 0.6, size: 0.3, kind: 'bus' }); }
  const statue = new THREE.Group(); statue.add(new THREE.Mesh(G.cyl(0.35, 0.45, 0.4, 16), concrete)); const fig = new THREE.Mesh(G.box(0.25, 0.7, 0.2, 0.05), stdMat(0x5f7a6a, { metalness: 0.7, roughness: 0.4 })); fig.position.y = 0.55; statue.add(fig);
  statue.position.set(0, 0.2, 0); statue.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(statue); A.addProp(statue, { mass: 1.6, size: 0.55, kind: 'statue' });
  A.heli.push(new Heli(g, 14, 9, 0.12, 0, storm), new Heli(g, 19, 11, -0.09, 2, storm));
  A.dust = dustField(g, 400, [-25, 25, 0.5, 9, -25, 18], storm ? [0.3, 0.35, 0.45] : [0.6, 0.6, 0.7], 0.035);
  A.intros = ['drop', 'flyin', 'emerge'];
}
MAPGEN.city = (g, A) => genCity(g, A, false);
MAPGEN.storm = (g, A) => genCity(g, A, true);

// ------------------------------------------------------------ SHATTERDOME: mech hangar
MAPGEN.hangar = (g, A) => {
  setupInterior(g, A, { keyDir: V3(0.15, 1, 0.25), keyColor: 0xdfeaff, keyI: 3.2, skyC: 0x6a7a8a, groundC: 0x2a2a2a, hemiI: 0.9, fog: 0x1a2026, fogD: 0.016,
    env: { wall: 0x161c22, floor: 0x101214, panels: [{ color: 0xdff2ff, i: 6, pos: [0, 14, 0], w: 30, h: 4 }, { color: 0xdff2ff, i: 6, pos: [0, 14, 15], w: 30, h: 4 }, { color: 0xffb040, i: 3, pos: [20, 4, 0], w: 4, h: 6 }, { color: 0xffe0b0, i: 4, pos: [0, 4, 25], w: 20, h: 8 }] } });
  A.grade = { contrast: 1.12, sat: 0.98, sharp: 0.42, shadow: [0.85, 0.96, 1.1], high: [1.05, 1.02, 0.95], vig: 1.0 };
  A.dustColor = [0.42, 0.42, 0.44]; A.camMode = 'pull'; A.ceiling = 16.2; A.intros = ['lift', 'flyin'];
  A.bound = { x0: -22.5, x1: 34, z0: -45, z1: 46 };
  const X = 31, Z = 41, H = 17;
  // outside: dusk sky through the doors and broken walls
  const sky = new Sky(); sky.scale.setScalar(380); sky.frustumCulled = false; sky.userData.noAO = true; const su = sky.material.uniforms; su.turbidity.value = 8; su.rayleigh.value = 2.4; su.mieCoefficient.value = 0.006; su.sunPosition.value.setFromSphericalCoords(1, THREE.MathUtils.degToRad(86), THREE.MathUtils.degToRad(180)); g.add(sky);
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), stdMat(0x3a3a38, { roughness: 0.95 })); outside.rotation.x = -Math.PI / 2; outside.position.y = -0.01; outside.receiveShadow = true; g.add(outside);
  // floor with bay markings
  const ft = canvasTex(2048, 2048, (c, w, h) => {
    c.fillStyle = '#6a6c6a'; c.fillRect(0, 0, w, h);
    blotches(c, w, h, 260, '0,0,0', .05, .2, 10, 80); blotches(c, w, h, 60, '255,255,255', .03, .08, 30, 120);
    const sx = w / (2 * X), sz = h / (2 * Z), P = (x, z) => [(x + X) * sx, (z + Z) * sz];
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; for (let x = -X; x <= X; x += 4) { c.beginPath(); c.moveTo(...P(x, -Z)); c.lineTo(...P(x, Z)); c.stroke(); } for (let z = -Z; z <= Z; z += 4) { c.beginPath(); c.moveTo(...P(-X, z)); c.lineTo(...P(X, z)); c.stroke(); }
    c.strokeStyle = '#d8a420'; c.lineWidth = 10; c.strokeRect(...P(-14, -30), 28 * sx, 62 * sz);
    for (const [bx, bz, n] of [[-26, -24, '01'], [-26, -4, '02'], [-26, 16, '03'], [0, -36, '04']]) {
      c.fillStyle = 'rgba(216,164,32,.85)'; const [px, pz] = P(bx + (bx < 0 ? 5 : 0), bz);
      c.save(); c.translate(px, pz); c.font = `900 ${Math.floor(70)}px "Big Shoulders Display", Impact`; c.textAlign = 'center'; c.fillText('BAY ' + n, 0, 0); c.restore();
    }
    for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(10,10,10,${rand(.1, .3)})`; c.lineWidth = rand(6, 14); c.beginPath(); const [a, b2] = P(rand(-20, 20), rand(-35, 35)); c.moveTo(a, b2); c.bezierCurveTo(a + rand(-200, 200), b2 + rand(-200, 200), a + rand(-200, 200), b2 + rand(-200, 200), a + rand(-300, 300), b2 + rand(-300, 300)); c.stroke(); }
    for (let i = 0; i < 30; i++) { const [a, b2] = P(rand(-28, 28), rand(-38, 38)); c.fillStyle = 'rgba(12,10,8,.45)'; c.beginPath(); c.ellipse(a, b2, rand(10, 60), rand(6, 30), rand(0, 3), 0, 7); c.fill(); }
    for (let z = -36; z <= 36; z += 12) { const [a, b2] = P(-1, z); c.fillStyle = '#2a2c2e'; c.fillRect(a, b2, 2 * sx, 0.6 * sz); c.fillStyle = 'rgba(255,255,255,.2)'; for (let k = 0; k < 2 * sx; k += 6) c.fillRect(a + k, b2, 2, 0.6 * sz); }
    noiseFill(c, w, h, 16);
  }, { repeat: [1, 1] });
  ft.wrapS = ft.wrapT = THREE.ClampToEdgeWrapping;
  const fdet = canvasTex(256, 256, (c, w, h) => { c.fillStyle = '#888'; c.fillRect(0, 0, w, h); noiseFill(c, w, h, 80); }, { repeat: [40, 50] });
  const fm = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.75, metalness: 0.15, normalMap: autoNormal(fdet, 2) }); fm.normalMap.repeat.set(40, 50);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(2 * X, 2 * Z), fm); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.005; floor.receiveShadow = true; g.add(floor);
  // destructible walls (big panels)
  A.makeSet('hangar', 1.2);
  const tint = 0xa8b0b4, wo = { cw: 1.0, ch: 0.85 };
  A.addBuilding('hangar', -X - 0.5, 0, 1, 2 * Z, 20, tint, wo);
  A.addBuilding('hangar', X + 0.5, 0, 1, 2 * Z, 20, tint, wo);
  const north = A.addBuilding('hangar', 0, -Z - 0.5, 2 * X + 2, 1, 20, tint, wo);
  A.addBuilding('hangar', -21.5, Z + 0.5, 19, 1, 20, tint, wo); A.addBuilding('hangar', 21.5, Z + 0.5, 19, 1, 20, tint, wo);
  A.addBuilding('hangar', 0, Z + 0.5, 24, 1, 8, tint, Object.assign({ yOff: 10.2 }, wo));
  // equipment blocks on the east side
  A.makeSet('metal', 0);
  for (const [x, z, nx, nz, nh] of [[24, -26, 4, 6, 6], [25, -12, 3, 3, 9], [24, 6, 5, 4, 5], [25, 22, 3, 6, 8], [12, -34, 6, 3, 5], [-10, -34, 5, 3, 7]]) A.addBuilding('metal', x, z, nx, nz, nh, pick([0xc0c4c0, 0xa8aca6, 0xd8c890]));
  A.finalizeBuildings(g);
  // backlight panel behind the centre cradle mech (falls when the wall breaks)
  const bl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), basicGlow(0xe8f4ff, 3)); bl.position.set(0, 7, -Z + 0.05); g.add(bl);
  north.decor.push({ mesh: bl, chunk: north.idx(Math.floor((2 * X + 2) / 2), 7, 0) });
  // roof: trusses, hex light coffers, skylight strips with light shafts
  const B = new Batch();
  const steel = stdMat(0x2b3236, { metalness: 0.85, roughness: 0.4 }), yel = stdMat(0xd99a00, { metalness: 0.5, roughness: 0.5 });
  for (const z0 of [-Z, -18, 2, 22]) { const len = (z0 === -Z ? 21 : 18); B.add(G.cube(2 * X + 2, 0.5, len), steel, [0, H + 0.25, z0 + len / 2]); }
  for (let z = -Z + 2; z <= Z - 2; z += 4) { B.add(G.cube(2 * X, 0.9, 0.35), steel, [0, H - 0.6, z]); B.add(G.cube(2 * X, 0.12, 0.12), steel, [0, H - 1.3, z]); for (let x = -X + 2; x < X; x += 4) B.add(G.cube(0.1, 0.9, 0.1), steel, [x, H - 0.9, z], [0, 0, 0.7]); }
  const hexL = basicGlow(0xeaf6ff, 3.2);
  for (let x = -24; x <= 24; x += 6) for (let z = -32; z <= 32; z += 8) { if (Math.abs(z + 20) < 3 || Math.abs(z) < 3 || Math.abs(z - 20) < 3) continue; B.add(G.cyl(1.25, 1.25, 0.1, 6), hexL, [x, H - 0.1, z]); B.add(G.cyl(1.4, 1.4, 0.2, 6), steel, [x, H, z]); }
  for (const z of [-20, 0, 20]) { B.add(G.cube(2 * X, 0.05, 2.2), basicGlow(0xcfe4ff, 2.2), [0, H + 0.6, z]); lightShaft(g, [0, 0, z], 2 * X - 4, 2.2, H, 0.1, 0xcfe4ff, 0.05); }
  for (let z = -Z + 2; z < Z; z += 3) for (const s of [-1, 1]) B.add(G.box(0.08, 0.06, 1.6, 0.01), basicGlow(0xdff2ff, 4), [s * (X - 0.2), 9.5, z]);
  // gantry cranes riding rails along the long walls
  for (const s of [-1, 1]) B.add(G.cube(0.6, 0.6, 2 * Z), yel, [s * (X - 1.2), 14, 0]);
  for (let i = 0; i < 2; i++) {
    const cg = new THREE.Group(); g.add(cg);
    const CB = new Batch();
    CB.add(G.cube(2 * X - 2.4, 0.9, 1.0), yel, [0, 14.4, 0]); CB.add(G.cube(2 * X - 2.4, 0.15, 0.15), yel, [0, 13.8, 0.5]); CB.add(G.cube(2 * X - 2.4, 0.15, 0.15), yel, [0, 13.8, -0.5]);
    CB.add(G.box(1.6, 1.0, 1.6, 0.05), steel, [i ? -6 : 8, 13.6, 0]); CB.add(G.box(0.9, 0.4, 0.5, 0.04), basicGlow(0xffd080, 2), [i ? -6 : 8, 13.2, 0.82]);
    CB.add(G.tor(0.45, 0.12, 8, 16, Math.PI * 1.4), steel, [i ? -6 : 8, 5.8, 0], [0, 0, 2.3]);
    CB.build(cg, { cast: true });
    chainLinks(cg, [[(i ? -6 : 8) - 0.2, 13.1, 0, 7.0], [(i ? -6 : 8) + 0.2, 13.1, 0, 7.0]], steel);
    const z0 = i ? -14 : 14; A.anims.push((dt, t) => { cg.position.z = z0 + Math.sin(t * 0.06 + i * 2) * 12; });
  }
  // cradles with dormant mechs (west wall + north centre piece)
  const cradles = [[-26, -24, 0.75, 'warden'], [-26, -4, 0.75, 'bulwark'], [-26, 16, 0.75, 'onyx'], [0, -36, 1.7, 'spectra']];
  const grate = stdMat(0x3a4044, { metalness: 0.7, roughness: 0.5, map: TEX.pC.map });
  A.mechs = [];
  cradles.forEach(([cx, cz, sc, id], i) => {
    const big = i === 3, w = big ? 5 : 3.2, d = big ? 3.2 : 3.6, hh = big ? 13 : 9;
    for (const [dx, dz] of [[-w, -d / 2], [w, -d / 2], [-w, d / 2], [w, d / 2]].map(([a, b2]) => big ? [a, b2] : [b2, a])) B.add(G.cube(0.3, hh, 0.3), yel, [cx + dx, hh / 2, cz + dz]);
    for (const y of big ? [4, 8, 11.5] : [3.2, 6.4]) {
      if (big) { B.add(G.cube(2 * w, 0.16, 1.4), grate, [cx, y, cz + d / 2 + 0.4]); B.add(G.cube(2 * w, 0.05, 0.05), yel, [cx, y + 0.7, cz + d / 2 + 1.05]); for (let k = -w; k <= w; k += 1) B.add(G.cyl(0.025, 0.025, 0.7, 5), yel, [cx + k, y + 0.35, cz + d / 2 + 1.05]); }
      else { B.add(G.cube(1.4, 0.16, 2 * w), grate, [cx + 2.2, y, cz]); B.add(G.cube(0.05, 0.05, 2 * w), yel, [cx + 2.85, y + 0.7, cz]); for (let k = -w; k <= w; k += 1) B.add(G.cyl(0.025, 0.025, 0.7, 5), yel, [cx + 2.85, y + 0.35, cz + k]); }
    }
    B.add(G.cube(big ? 2 * w : 0.3, 0.3, big ? 0.3 : 2 * w), yel, [cx, hh, cz + (big ? -d / 2 : 0)]);
    for (let k = 0; k < 4; k++) B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(cx + (big ? rand(-w, w) : 2), hh - 0.5, cz + (big ? -d / 2 : rand(-w, w))), V3(cx + rand(-1, 1), hh * 0.7, cz + rand(-1, 1)), V3(cx + rand(-0.5, 0.5), hh * 0.45, cz + rand(-0.6, 0.6))]), 12, 0.06, 6), steel);
    B.add(G.cube(big ? 2 * w : 2.2, 0.08, big ? 2.4 : 2 * w), stdMat(0xd8a420, { map: TEX.hazard, roughness: 0.6 }), [cx + (big ? 0 : 0.6), 0.04, cz]);
    const def = ROBOT(id);
    const R = buildRobot(def, { dormant: true, scale: sc, colors: { primary: [0x8a8e88, 0x6a6f63, 0x9a9c94, 0x2a3a5a][i], secondary: 0x50544d, dark: 0x1e2122, accent: 0x000000, eye: 0x331100, tertiary: 0x50544d, brown: 0x50544d, glowArm: 0x000000, glowLegL: 0, glowLegR: 0, glowPink: 0 } });
    R.root.position.set(cx + (big ? 0 : -0.4), 0, cz); R.root.rotation.y = big ? 0 : Math.PI / 2; g.add(R.root);
    R.root.updateMatrixWorld(true); poseStatic(R, 'dormant');
    R.root.traverse(o => { if (o.isMesh) o.castShadow = !big; });
    A.mechs.push(R);
    const spotTarget = V3(cx, hh * 0.6, cz);
    for (const s of [-1, 1]) { const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 7, 16, 1, true).translate(0, -3.5, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0d8).multiplyScalar(0.06), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); cone.position.set(cx + (big ? s * 6 : 4), hh + 2, cz + (big ? 3 : s * 4)); cone.lookAt(spotTarget); cone.rotateX(-Math.PI / 2); cone.userData.noAO = true; g.add(cone); }
    if (i < 3 && i % 2 === 0) { const welder = new THREE.Object3D(); welder.position.set(cx + 0.9, 2.2 + i * 0.6, cz + 0.8); g.add(welder); FX.addEmitter(welder, 'weld', 6); }
  });
  // warning beacons by the doors
  const beaconMat = basicGlow(0xffa020, 5);
  for (const x of [-12.5, 12.5]) { B.add(G.cyl(0.25, 0.25, 0.4, 12), beaconMat, [x, 10, Z - 0.3]); const pl = new THREE.PointLight(0xffa030, 60, 18, 1.6); pl.position.set(x, 9.6, Z - 1); g.add(pl); A.anims.push((dt, t) => { pl.intensity = 40 + Math.sin(t * 6 + x) * 40; beaconMat.color.setRGB(1, 0.63, 0.12).multiplyScalar(3 + Math.sin(t * 6 + x) * 3); }); }
  for (const z of [-30, 0, 30]) { const pl = new THREE.PointLight(0xffd2a0, 70, 26, 1.6); pl.position.set(-20, 8, z); g.add(pl); }
  // door frame and the open bay outside
  B.add(G.cube(1.2, 10.2, 1.4), steel, [-12.6, 5.1, Z + 0.5]); B.add(G.cube(1.2, 10.2, 1.4), steel, [12.6, 5.1, Z + 0.5]);
  B.add(G.cube(12, 9.8, 0.4), stdMat(0x4a5459, { map: TEX.pC.map, metalness: 0.6 }), [-19, 5, Z + 1.4]);
  B.add(G.cube(24, 0.5, 0.2), stdMat(0xffffff, { map: TEX.hazard }), [0, 10, Z + 1.2]);
  B.build(g, { receive: true, cast: true });
  // props: containers, crates, fuel, spare mech parts
  const crate = stdMat(0x5a4a33, { map: TEX.pB.map, roughness: 0.8 }), contM = [0xa13a24, 0x245e7a, 0xc2862a, 0x3a6e3a].map(c => stdMat(c, { map: TEX.pC.map, roughness: 0.6, metalness: 0.4 }));
  for (let i = 0; i < 12; i++) { const m = new THREE.Mesh(G.box(0.95, 0.42, 0.44, 0.02), pick(contM)); m.position.set(rand(-14, 20), 0.21, rand(-28, 34)); m.rotation.y = rand(0, 3); m.castShadow = true; A.addProp(m, { mass: 1, size: 0.48, kind: 'container' }); }
  for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(G.box(0.5, 0.5, 0.5, 0.03), crate); m.position.set(rand(-14, 18), 0.25, rand(-28, 34)); m.castShadow = true; A.addProp(m, { mass: 0.6, size: 0.4, kind: 'crate' }); }
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(G.cyl(0.22, 0.22, 0.6, 16), stdMat(0xd8d6cf, { metalness: 0.6, roughness: 0.35 })); m.rotation.z = Math.PI / 2; m.position.set(rand(-10, 18), 0.23, rand(-25, 30)); m.castShadow = true; A.addProp(m, { mass: 0.9, size: 0.35, kind: 'tank', explosive: true }); }
  for (let i = 0; i < 3; i++) {
    const part = new THREE.Group(); const pm = stdMat(0x9a9c94, { map: TEX.pA.map, metalness: 0.5, roughness: 0.5 });
    if (i < 2) { part.add(new THREE.Mesh(G.box(0.6, 0.55, 0.6, 0.08), pm)); for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(G.box(0.13, 0.18, 0.13, 0.03), stdMat(0x2a2c2e, { metalness: 0.8 })); f.position.set(-0.21 + k * 0.14, 0.2, 0.32); part.add(f); } }
    else { part.add(new THREE.Mesh(G.sph(0.42, 20, 14), pm)); const v = new THREE.Mesh(G.box(0.5, 0.1, 0.1, 0.03), basicGlow(0xff6a20, 2)); v.position.set(0, 0.05, 0.38); part.add(v); }
    part.position.set(rand(-12, 12), 0.3, rand(-20, 28)); part.rotation.set(rand(0, 1), rand(0, 6), 0); part.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(part);
    A.addProp(part, { mass: 1.5, size: 0.55, kind: i < 2 ? 'spare fist' : 'spare head' });
  }
  const carts = []; for (let i = 0; i < 40; i++) carts.push([rand(-20, 28), rand(-38, 38), rand(0, 6)]);
  const cb = new THREE.BoxGeometry(0.1, 0.06, 0.16).toNonIndexed(); cb.translate(0, 0.04, 0); const cm = new THREE.BoxGeometry(0.02, 0.12, 0.02).toNonIndexed(); cm.translate(0, 0.08, 0.07);
  A.addSmalls(mergeGeometries([cb, cm]), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.3 }), carts, [0xd8a420, 0xd8a420, 0x2a6ab8, 0xb8322a]);
  A.dust = dustField(g, 700, [-28, 28, 0.5, 16, -38, 38], [0.8, 0.9, 1], 0.04);
};

// ------------------------------------------------------------ HELIX CORE: reactor chamber
MAPGEN.reactor = (g, A) => {
  setupInterior(g, A, { keyDir: V3(0.1, 1, 0.15), keyColor: 0xd8f4ff, keyI: 2.4, skyC: 0x4a8ab0, groundC: 0x0a1218, hemiI: 0.6, fog: 0x06101a, fogD: 0.018,
    env: { wall: 0x0b1620, floor: 0x060a0e, panels: [{ color: 0x6fe8ff, i: 9, pos: [0, 14, 0], w: 6, h: 6 }, { color: 0x3a7aff, i: 3, pos: [18, 4, 0], w: 4, h: 10 }, { color: 0x3a7aff, i: 3, pos: [-18, 4, 0], w: 4, h: 10 }, { color: 0xffffff, i: 2, pos: [0, 4, 20], w: 10, h: 2 }] } });
  A.grade = { contrast: 1.12, sat: 1.1, sharp: 0.4, shadow: [0.8, 0.97, 1.12], high: [1.0, 1.04, 1.08], vig: 1.05 };
  A.dustColor = [0.35, 0.4, 0.45]; A.camMode = 'pull'; A.ceiling = 21; A.circle = 23.5; A.intros = ['lift', 'flyin'];
  A.bound = { x0: -24, x1: 24, z0: -24, z1: 24 };
  const Rw = 27, Hh = 24;
  const wallT = canvasTex(1024, 512, (c, w, h) => { c.fillStyle = '#3a4652'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 64) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x, 0, 6, h); c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(x + 6, 0, 3, h); } for (let y = 0; y < h; y += 96) { c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(0, y, w, 8); } for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(120,220,255,.35)'; c.fillRect(rand(0, w), rand(0, h), rand(20, 60), 4); } blotches(c, w, h, 80, '0,0,0', .05, .2, 10, 80); noiseFill(c, w, h, 18); }, { repeat: [10, 3] });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(Rw, Rw, Hh, 64, 1, true), stdMat(0xffffff, { map: wallT, metalness: 0.7, roughness: 0.45, side: THREE.BackSide })); wall.position.y = Hh / 2; wall.receiveShadow = true; g.add(wall);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(Rw, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), stdMat(0x2a3440, { map: TEX.pC.map, metalness: 0.7, roughness: 0.5, side: THREE.BackSide })); dome.position.y = Hh; dome.scale.y = 0.35; g.add(dome);
  const hex = (() => { const t = canvasTex(512, 512, (cc, w, h) => { cc.fillStyle = '#1d2a33'; cc.fillRect(0, 0, w, h); noiseFill(cc, w, h, 16); const r = 32, hh = r * Math.sqrt(3); cc.strokeStyle = 'rgba(0,0,0,.65)'; cc.lineWidth = 5; for (let row = -1; row < h / hh + 1; row++) for (let col = -1; col < w / (r * 1.5) + 1; col++) { const cx = col * r * 1.5, cy = row * hh + (col % 2 ? hh / 2 : 0); cc.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; cc.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } cc.closePath(); cc.stroke(); } }); t.repeat.set(12, 12); return t; })();
  const hexE = canvasTex(512, 512, (cc, w, h) => { cc.fillStyle = '#000'; cc.fillRect(0, 0, w, h); const r = 32, hh = r * Math.sqrt(3); cc.strokeStyle = '#4ad8ff'; cc.lineWidth = 1.6; for (let row = -1; row < h / hh + 1; row++) for (let col = -1; col < w / (r * 1.5) + 1; col++) { if (Math.random() > .35) continue; const cx = col * r * 1.5, cy = row * hh + (col % 2 ? hh / 2 : 0); cc.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; cc.lineTo(cx + Math.cos(a) * (r - 6), cy + Math.sin(a) * (r - 6)); } cc.closePath(); cc.stroke(); } }, { repeat: [12, 12] });
  const fl = new THREE.Mesh(new THREE.CircleGeometry(Rw, 64), new THREE.MeshStandardMaterial({ map: hex, emissiveMap: hexE, emissive: 0xffffff, emissiveIntensity: 1.4, metalness: 0.6, roughness: 0.35, normalMap: autoNormal(hex, 2) }));
  fl.material.normalMap.repeat.set(12, 12); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const B = new Batch();
  const steel = stdMat(0x26323c, { metalness: 0.85, roughness: 0.35, map: TEX.pC.map }), pipeMat = stdMat(0x4a5a66, { metalness: 0.8, roughness: 0.35 }), cyan = basicGlow(0x59d8ff, 3), cyanDim = basicGlow(0x59d8ff, 1.2);
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, x = Math.cos(a) * (Rw - 0.8), z = Math.sin(a) * (Rw - 0.8); B.add(G.cube(1.0, Hh, 1.2), steel, [x, Hh / 2, z], [0, -a, 0]); if (k % 2) B.add(G.cube(0.1, Hh - 4, 0.1), cyan, [Math.cos(a) * (Rw - 1.4), Hh / 2, Math.sin(a) * (Rw - 1.4)], [0, -a, 0]); else for (let j = 0; j < 4; j++) B.add(G.cyl(0.18, 0.18, Hh, 10), pipeMat, [Math.cos(a + 0.05 + j * 0.02) * (Rw - 1.5), Hh / 2, Math.sin(a + 0.05 + j * 0.02) * (Rw - 1.5)]); }
  B.add(G.tor(Rw - 2, 0.5, 6, 96), steel, [0, 11, 0], [Math.PI / 2, 0, 0]); B.add(G.tor(Rw - 2.4, 0.05, 4, 96), cyan, [0, 11.6, 0], [Math.PI / 2, 0, 0]);
  B.add(G.cube(2 * Rw, 0.5, 0.1), stdMat(0xffffff, { map: TEX.hazard }), [0, 0.25, 0], [0, 0, 0], [0.01, 1, 1]);
  for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; B.add(G.cube(2.6, 0.5, 0.1), stdMat(0xffffff, { map: TEX.hazard }), [Math.cos(a) * (Rw - 1.9), 0.25, Math.sin(a) * (Rw - 1.9)], [0, -a + Math.PI / 2, 0]); }
  // the core
  const coreR = 3.2;
  B.add(G.cyl(coreR, coreR + 0.4, 1.2, 32), steel, [0, 0.6, 0]);
  for (let k = 0; k < 8; k++) { B.add(G.cyl(coreR * 0.92, coreR * 0.92, 2.2, 32), steel, [0, 1.2 + k * 2.8 + 1.1, 0]); B.add(G.cyl(coreR * 0.95, coreR * 0.95, 0.5, 32), cyan, [0, 1.2 + k * 2.8 + 2.45, 0]); }
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; B.add(G.cyl(0.18, 0.18, Hh - 1, 8), pipeMat, [Math.cos(a) * (coreR + 0.25), Hh / 2, Math.sin(a) * (coreR + 0.25)]); }
  // pipes arcing overhead (ref: reactor sketch)
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2 + 0.2, r0 = Rw - 2;
    const c = new THREE.CubicBezierCurve3(V3(Math.cos(a) * r0, 6 + (k % 3) * 3, Math.sin(a) * r0), V3(Math.cos(a) * 18, 22, Math.sin(a) * 18), V3(Math.cos(a + 0.5) * 9, 23, Math.sin(a + 0.5) * 9), V3(Math.cos(a + 0.6) * (coreR + 0.6), 17 + (k % 2) * 3, Math.sin(a + 0.6) * (coreR + 0.6)));
    B.add(new THREE.TubeGeometry(c, 48, 0.35 + (k % 2) * 0.25, 10, false), pipeMat);
    for (const t of [0.25, 0.5, 0.75]) { const p = c.getPoint(t); B.add(G.cyl(0.62 + (k % 2) * 0.25, 0.62 + (k % 2) * 0.25, 0.5, 6), steel, [p.x, p.y, p.z], new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), c.getTangent(t))); }
  }
  B.build(g, { receive: true, cast: true });
  A.obstacles.push({ x: 0, z: 0, r: coreR + 0.4, h: 30, shock: true, isObstacle: true });
  const coreRings = [];
  for (let k = 0; k < 3; k++) {
    const rg = new THREE.Group(); rg.position.y = 4 + k * 3.2; g.add(rg);
    const r = coreR + 1.4 + k * 0.6;
    rg.add(new THREE.Mesh(G.tor(r, 0.22, 10, 96), steel)); rg.add(new THREE.Mesh(G.tor(r - 0.24, 0.05, 6, 96), cyan));
    for (let j = 0; j < 6; j++) { const a = j / 6 * Math.PI * 2; const bx = new THREE.Mesh(G.box(0.6, 0.6, 0.9, 0.08), steel); bx.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); rg.add(bx); }
    rg.rotation.x = Math.PI / 2 + (k - 1) * 0.1; rg.traverse(o => { if (o.isMesh) o.castShadow = true; }); coreRings.push(rg);
  }
  const coreL = new THREE.PointLight(0x7fe8ff, 900, 46, 1.5); coreL.position.set(0, 10, 0); g.add(coreL);
  const arcs = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(new Array(48).fill(0).map(() => V3())), new THREE.LineBasicMaterial({ color: new THREE.Color(2, 4, 6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  arcs.frustumCulled = false; arcs.userData.noAO = true; g.add(arcs);
  A.anims.push((dt, t) => {
    coreRings.forEach((r, i) => r.rotation.z += dt * (i % 2 ? -0.35 : 0.25) * (1 + Game.excite));
    coreL.intensity = 800 + Math.sin(t * 2.2) * 150 + Game.excite * 400;
    if (Math.random() < 0.25) {
      const pa = arcs.geometry.attributes.position;
      for (let s = 0; s < 4; s++) { const a = rand(0, 6.28), y = rand(1, 18); let p = V3(Math.cos(a) * coreR, y, Math.sin(a) * coreR); const q = V3(Math.cos(a + rand(-.4, .4)) * (coreR + rand(1.5, 3)), y + rand(-2, 2), Math.sin(a + rand(-.4, .4)) * (coreR + rand(1.5, 3))); for (let k = 0; k < 6; k++) { const n = p.clone().lerp(q, 1 / (6 - k)).add(V3(rand(-.2, .2), rand(-.2, .2), rand(-.2, .2))); pa.setXYZ((s * 6 + k) * 2, p.x, p.y, p.z); pa.setXYZ((s * 6 + k) * 2 + 1, n.x, n.y, n.z); p = n; } }
      pa.needsUpdate = true; arcs.material.opacity = 1; if (Math.random() < 0.3) SFX.zap && SFX.zap(0.3);
    } else arcs.material.opacity *= 0.7;
  });
  // coolant towers and control blocks (destructible)
  A.makeSet('tower', 1.6); A.makeSet('metal', 0);
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.26, r = 15.5; A.addBuilding('tower', Math.cos(a) * r, Math.sin(a) * r, 3, 3, 18, 0xb8c8d4, { cw: 0.6, ch: 0.62 }); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.78, r = 20.5; A.addBuilding('metal', Math.cos(a) * r, Math.sin(a) * r, 4, 3, 5, pick([0xa8b4c0, 0xc0c8d0])); }
  A.finalizeBuildings(g);
  lightShaft(g, [0, 0, 0], 7, 7, Hh, 0, 0x7fe8ff, 0.12);
  A.dust = dustField(g, 600, [-20, 20, 1, 20, -20, 20], [0.5, 0.9, 1.1], 0.05);
  for (const [x, z] of [[-16, 14], [17, -12], [-6, -20]]) { const o = new THREE.Object3D(); o.position.set(x, 0.5, z); g.add(o); FX.addEmitter(o, 'steam', 3); }
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(G.cyl(0.22, 0.22, 0.6, 16), stdMat(0x4ad8ff, { metalness: 0.5, roughness: 0.3, emissive: 0x0a3040 })); m.rotation.z = Math.PI / 2; const a = rand(0, 6.28), r = rand(7, 12); m.position.set(Math.cos(a) * r, 0.23, Math.sin(a) * r); m.castShadow = true; A.addProp(m, { mass: 0.9, size: 0.35, kind: 'coolant tank', explosive: true }); }
};

// ------------------------------------------------------------ WONDERLAND: dead amusement park at night
class FerrisWheel {
  constructor(g, x, z, R) {
    this.x = x; this.z = z; this.R = R; this.hp = 420; this.state = 'stand'; this.ang = 0; this.av = 0;
    this.pivot = new THREE.Group(); this.pivot.position.set(x, 0, z); g.add(this.pivot);
    const wheel = new THREE.Group(); wheel.position.y = R + 0.6; this.pivot.add(wheel); this.wheel = wheel;
    const iron = stdMat(0x9a9ca4, { metalness: 0.8, roughness: 0.45 }), rust = stdMat(0x6a4030, { map: TEX.grunge, metalness: 0.6, roughness: 0.7 });
    const B = new Batch();
    for (const zz of [-0.35, 0.35]) { B.add(G.tor(R, 0.07, 8, 96), iron, [0, 0, zz]); B.add(G.tor(R * 0.55, 0.04, 6, 64), iron, [0, 0, zz]); }
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2; for (const zz of [-0.35, 0.35]) B.add(G.cyl(0.025, 0.025, R, 5), iron, [Math.cos(a) * R / 2, Math.sin(a) * R / 2, zz], [0, 0, a - Math.PI / 2]); }
    B.add(G.cyl(0.35, 0.35, 1.0, 16), rust, [0, 0, 0], [Math.PI / 2, 0, 0]);
    B.build(wheel, { receive: false, cast: true });
    const bulbs = new THREE.InstancedMesh(G.sph(0.06, 6, 4), basicGlow(0xffc070, 5), 120);
    for (let k = 0; k < 120; k++) { const a = k / 60 * Math.PI * 2; _wm.makeTranslation(Math.cos(a) * R, Math.sin(a) * R, k < 60 ? 0.4 : -0.4); bulbs.setMatrixAt(k, _wm); }
    wheel.add(bulbs); this.gond = [];
    const gm = [0xd8433a, 0x2f8fd0, 0xe2b13c, 0x3cae7a].map(c => stdMat(c, { roughness: .5, metalness: .4 }));
    for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const gd = new THREE.Group(); gd.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); const cab = new THREE.Mesh(G.box(0.5, 0.42, 0.42, 0.06), gm[k % 4]); cab.position.y = -0.35; const roof = new THREE.Mesh(G.cone(0.34, 0.16, 4), gm[k % 4]); roof.position.y = -0.08; roof.rotation.y = Math.PI / 4; gd.add(cab, roof); wheel.add(gd); this.gond.push(gd); }
    const legs = new Batch();
    for (const s of [-1, 1]) for (const zz of [-1.2, 1.2]) legs.add(G.cyl(0.1, 0.14, R + 1.0, 8), iron, [s * (R * 0.32), (R + 0.6) / 2, zz * 0.62], [zz > 0 ? 0.32 : -0.32, 0, s * 0.33]);
    legs.add(G.box(R * 0.9, 0.3, 2.8, 0.05), rust, [0, 0.15, 0]);
    legs.build(this.pivot, { cast: true });
    this.obs = [[-R * 0.62, -0.8], [R * 0.62, -0.8], [-R * 0.62, 0.8], [R * 0.62, 0.8]].map(([dx, dz]) => ({ x: x + dx, z: z + dz, r: 0.35, h: 3, isObstacle: true, owner: this }));
    Arena.obstacles.push(...this.obs);
  }
  hit(p, radius, power) {
    if (this.state !== 'stand') return;
    const d = Math.hypot(p.x - this.x, p.z - this.z), dy = Math.abs(p.y - (this.R + 0.6));
    if (d < this.R * 0.8 + radius && (dy < this.R + radius || p.y < 2)) { this.hp -= power * 30 + radius * 40; this.lastDir = V3(this.x - p.x, 0, this.z - p.z).normalize(); FX.spark(p, V3(0, 1, 0), 20, 6, [3, 2.4, 1.4]); SFX.clank(1); if (this.hp <= 0) this.topple(); }
  }
  topple() {
    this.state = 'fall'; const dir = this.lastDir.lengthSq() > 0.1 ? this.lastDir : V3(0, 0, 1);
    this.fallDir = dir; this.axis = V3(dir.z, 0, -dir.x).normalize(); this.obs.forEach(o => o.dead = true);
    SFX.crumble(2); SFX.boom(0.8); Popups.show('THE WHEEL IS GOING DOWN', V3(this.x, this.R * 2, this.z), 'y'); Game.shake(0.4);
  }
  update(dt, fighters) {
    if (this.state === 'stand') { this.wheel.rotation.z += dt * 0.05; this.gond.forEach(gd => gd.rotation.z = -this.wheel.rotation.z); return; }
    if (this.state === 'fall') {
      this.av += dt * 1.6 * (0.3 + Math.sin(this.ang)); this.ang = Math.min(Math.PI / 2, this.ang + this.av * dt);
      this.pivot.quaternion.setFromAxisAngle(this.axis, this.ang);
      if (this.ang >= Math.PI / 2) {
        this.state = 'down'; Game.shake(1); SFX.boom(1.4); SFX.crumble(2); Game.flash(0.2);
        for (let k = 0; k <= 8; k++) { const p = V3(this.x, 0.3, this.z).addScaledVector(this.fallDir, (this.R + 0.6) * 2 * k / 8); FX.dust(p, 1.6, Arena.dustColor); Arena.impact(p.clone().setY(0.8), 1.2, 5, this.fallDir); Arena.crushCars(p, 1.2); }
        for (const f of fighters) { if (f.isDown) continue; const rel = V3(f.pos.x - this.x, 0, f.pos.z - this.z); const along = rel.dot(this.fallDir), side = Math.abs(rel.x * this.fallDir.z - rel.z * this.fallDir.x); if (along > 0 && along < this.R * 2.4 && side < this.R) { f.hp -= 180; f.launch(V3(-this.fallDir.z, 0, this.fallDir.x).multiplyScalar(Math.sign(rel.x * this.fallDir.z - rel.z * this.fallDir.x) || 1), 4, 1); Popups.show('CRUSHED', f.headW.clone(), 'r'); if (f.hp <= 0) Game.knockdown(f, Game.opponentOf(f), this.fallDir, 1.5); } }
      }
    }
  }
}
MAPGEN.carnival = (g, A) => {
  setupNight(g, A, { top: 0x060818, hor: 0x2a1838, glow: 0x6a2a5a, stars: true, clouds: 0.45, moon: V3(-60, 70, -130), moonDir: V3(-0.45, 0.6, -0.9), moonColor: 0x9fb0ff, moonI: 1.0, skyC: 0x4050a0, groundC: 0x1a1018, hemiI: 0.55, fog: 0x120e24, fogD: 0.013,
    env: { wall: 0x0e0c20, floor: 0x08060a, panels: [{ color: 0xbfd0ff, i: 3, pos: [-10, 10, -18], w: 3, h: 3 }, { color: 0xffa040, i: 4, pos: [0, 6, -20], w: 14, h: 3 }, { color: 0xff3a8a, i: 2.5, pos: [18, 3, 0], w: 4, h: 4 }, { color: 0x50c8ff, i: 2, pos: [-18, 3, 6], w: 4, h: 4 }] } });
  A.grade = { contrast: 1.12, sat: 1.15, sharp: 0.38, shadow: [0.9, 0.9, 1.15], high: [1.08, 0.98, 1.0], vig: 1.05 };
  A.dustColor = [0.42, 0.38, 0.42]; A.bound = { x0: -27, x1: 27, z0: -27, z1: 27 }; A.intros = ['drop', 'flyin', 'emerge'];
  const tiles = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#2a2826'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = randi(110, 150); c.fillStyle = `rgb(${v},${v - 6},${v - 2})`; c.fillRect(x * 64 + 2, y * 64 + 2, 60, 60); }
    blotches(c, w, h, 70, '20,25,15', .1, .4, 10, 70);
    for (let i = 0; i < 26; i++) { c.strokeStyle = 'rgba(10,10,10,.7)'; c.lineWidth = rand(1, 2.5); c.beginPath(); let x = Math.random() * w, y = Math.random() * h; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += rand(-25, 25); y += rand(-25, 25); c.lineTo(x, y); } c.stroke(); }
    noiseFill(c, w, h, 24);
  }, { repeat: [45, 45] });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.6, metalness: 0.05, normalMap: autoNormal(tiles, 2.5), envMapIntensity: 1.4 }));
  ground.material.normalMap.repeat.set(45, 45); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; g.add(ground);
  const B = new Batch();
  const iron = stdMat(0x8a8d96, { metalness: 0.8, roughness: 0.45 }), rustM = stdMat(0x6a4030, { map: TEX.grunge, metalness: 0.6, roughness: 0.7 });
  A.specials.push(new FerrisWheel(g, 2, -20, 3.4));
  // roller coaster around the back of the park, with a running train
  const cp = [[20, 0.4, 24], [27, 2, 14], [29, 4, 0], [26, 5.5, -14], [16, 3, -26], [6, 2, -29], [-8, 2.6, -30], [-20, 4, -26], [-28, 5.5, -12], [-29, 2.4, 4], [-24, 0.8, 18], [-12, 1, 26], [4, 1.6, 28]].map(p => V3(...p));
  const curve = new THREE.CatmullRomCurve3(cp, true, 'catmullrom', 0.4);
  const frames = curve.computeFrenetFrames(320, true);
  const railPts = [[], []];
  for (let i = 0; i <= 320; i++) { const p = curve.getPointAt(i / 320); const n = frames.binormals[i % 320]; railPts[0].push(p.clone().addScaledVector(n, 0.12)); railPts[1].push(p.clone().addScaledVector(n, -0.12)); }
  const railMat = stdMat(0xc23a2a, { metalness: 0.6, roughness: 0.45 });
  for (const rp of railPts) B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rp, true), 320, 0.025, 5, true), railMat);
  for (let i = 0; i < 200; i++) { const t = i / 200, p = curve.getPointAt(t); const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), curve.getTangentAt(t)); B.add(G.cube(0.32, 0.02, 0.05), rustM, [p.x, p.y - 0.02, p.z], q); if (i % 5 === 0 && p.y > 0.4) B.add(G.cyl(0.03, 0.03, p.y, 5), iron, [p.x, p.y / 2, p.z]); }
  const train = new THREE.Group(); g.add(train); const cars = [];
  for (let k = 0; k < 4; k++) { const cg = new THREE.Group(); const body = new THREE.Mesh(G.box(0.22, 0.12, 0.32, 0.03), stdMat([0xd8433a, 0xe2b13c, 0x2f8fd0, 0x3cae7a][k], { metalness: 0.5, roughness: 0.4 })); body.position.y = 0.09; body.castShadow = true; cg.add(body); const l = new THREE.Mesh(G.sph(0.02, 6, 4), basicGlow(0xffe0a0, 6)); l.position.set(0, 0.17, 0.12); cg.add(l); train.add(cg); cars.push(cg); }
  let tt = 0; A.anims.push((dt) => { tt = (tt + dt * 0.035) % 1; cars.forEach((c, k) => { const t = (tt - k * 0.006 + 1) % 1; const p = curve.getPointAt(t); c.position.copy(p); c.lookAt(curve.getPointAt((t + 0.002) % 1)); }); });
  // arcade halls and booths (destructible), kaiju skull, string lights
  A.makeSet('arcade', 1.8); A.makeSet('brick', 0.5);
  const halls = [[-16, -12, 6, 4, 5], [-17, 6, 5, 6, 4], [15, -10, 6, 4, 6], [-6, 17, 7, 3, 4], [9, 18, 4, 4, 5], [-22, -4, 3, 3, 3], [20, 4, 3, 5, 3]];
  for (const [x, z, nx, nz, nh] of halls) A.addBuilding(pick(['arcade', 'arcade', 'brick']), x, z, nx, nz, nh, pick([0xffffff, 0xe0d0f0, 0xf0e0d0]));
  A.finalizeBuildings(g);
  const skull = new Batch(); const bone = stdMat(0xb8b0a0, { roughness: 0.8, map: TEX.grunge });
  skull.add(G.sph(2.4, 28, 20), bone, [20, 0.4, 12], [0.3, -0.6, 0.2], [1.2, 0.8, 1.0]);
  skull.add(G.box(3.2, 0.8, 1.8, 0.3), bone, [18.2, 0.4, 13.6], [0.25, -0.6, 0.1]);
  for (let k = 0; k < 7; k++) skull.add(G.cone(0.16, 0.7, 6), bone, [17 + k * 0.4, 0.95, 14.6 - k * 0.2], [Math.PI, 0, 0]);
  for (const s of [-1, 1]) skull.add(G.cone(0.35, 2.4, 8), bone, [20 + s * 1.4, 2.4, 11.5], [-0.5, 0, s * 0.6]);
  skull.add(G.sph(0.42, 14, 10), basicGlow(0xffd040, 5), [18.6, 1.5, 13.4]);
  for (let k = 0; k < 6; k++) { const c = new THREE.CatmullRomCurve3([V3(14 - k * 0.9, 0, 18 + k * 0.2), V3(13.5 - k * 0.9, 1.6 - k * 0.1, 19.5 + k * 0.2), V3(13 - k * 0.9, 0, 21 + k * 0.2)]); skull.add(new THREE.TubeGeometry(c, 12, 0.14, 6), bone); }
  skull.build(g, { cast: true });
  A.obstacles.push({ x: 20, z: 12, r: 2.4, h: 3, isObstacle: true });
  const hl = new THREE.PointLight(0xffc040, 40, 10, 2); hl.position.set(18, 2.2, 14.5); g.add(hl);
  const posts = [[-11, -11], [11, -11], [11, 11], [-11, 11], [0, -14], [0, 14]];
  for (const [x, z] of posts) { B.add(G.cyl(0.08, 0.12, 4.5, 8), iron, [x, 2.25, z]); B.add(G.sph(0.22, 10, 8), basicGlow(0xffe0b0, 4), [x, 4.6, z]); }
  const strings = []; for (let i = 0; i < 4; i++) strings.push([posts[i], posts[(i + 1) % 4]]); strings.push([posts[0], posts[2]], [posts[1], posts[3]], [posts[4], posts[5]]);
  const nb = strings.length * 30; const sb = new THREE.InstancedMesh(G.sph(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }), nb); let bi = 0; const cc = new THREE.Color();
  for (const [[ax, az], [bx, bz]] of strings) for (let k = 0; k < 30; k++) { const t = (k + 0.5) / 30; const sag = Math.sin(t * Math.PI) * 1.4; _wm.makeTranslation(lerp(ax, bx, t), 4.5 - sag, lerp(az, bz, t)); sb.setMatrixAt(bi, _wm); cc.set([0xff5a5a, 0xffd060, 0x60d0ff, 0x80ff90, 0xff70d0][bi % 5]).multiplyScalar(3.5); sb.setColorAt(bi, cc); bi++; }
  g.add(sb);
  for (const [x, z, c] of [[-16, -9.5, 0xff3a9a], [15, -7.5, 0x3ae0ff], [-6, 15.2, 0xffd040]]) { const pl = new THREE.PointLight(c, 50, 12, 1.8); pl.position.set(x, 1.6, z); g.add(pl); }
  B.build(g, { receive: true, cast: true });
  // the carousel can be ripped up and thrown
  const CR = new THREE.Group(); const crB = new Batch();
  const stripe = stripeTex('#e8d7b0', '#b8322a', 16);
  crB.add(G.cyl(1.25, 1.3, 0.16, 32), stdMat(0x5a3a2a, { roughness: .7 }), [0, 0.08, 0]); crB.add(G.cone(1.4, 0.6, 32), stdMat(0xffffff, { map: stripe, roughness: .6 }), [0, 1.35, 0]); crB.add(G.cyl(0.14, 0.14, 1.2, 12), stdMat(0xd8b070, { metalness: .7, roughness: .3 }), [0, 0.7, 0]);
  const gold = stdMat(0xd8b070, { metalness: .9, roughness: .25 }), horse = stdMat(0xe8e0d0, { roughness: .5 });
  for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2, x = Math.cos(a) * 0.95, z = Math.sin(a) * 0.95; crB.add(G.cyl(0.012, 0.012, 1.1, 5), gold, [x, 0.65, z]); crB.add(G.box(0.28, 0.12, 0.08, 0.03), horse, [x, 0.48 + (k % 2) * 0.1, z], [0, -a, 0]); }
  crB.build(CR, { cast: true });
  const crBulbs = new THREE.InstancedMesh(G.sph(0.03, 6, 4), basicGlow(0xffe0a0, 5), 40); for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; _wm.makeTranslation(Math.cos(a) * 1.38, 1.06, Math.sin(a) * 1.38); crBulbs.setMatrixAt(k, _wm); } CR.add(crBulbs);
  CR.position.set(-9, 0, -4); g.add(CR); const crProp = A.addProp(CR, { mass: 2.0, size: 1.2, kind: 'carousel' });
  A.anims.push((dt) => { if (crProp.state === 'rest') CR.rotation.y += dt * 0.3; });
  const booths = []; for (let i = 0; i < 30; i++) { const a = rand(0, 6.28), r = rand(6, 24); booths.push([Math.cos(a) * r, Math.sin(a) * r, rand(0, 6)]); }
  const bb = new THREE.BoxGeometry(0.16, 0.12, 0.12).toNonIndexed(); bb.translate(0, 0.06, 0); const br = new THREE.ConeGeometry(0.13, 0.08, 4).toNonIndexed(); br.rotateY(Math.PI / 4); br.translate(0, 0.16, 0);
  for (const x of [bb, br]) for (const a of Object.keys(x.attributes)) if (!['position', 'normal', 'uv'].includes(a)) x.deleteAttribute(a);
  A.addSmalls(mergeGeometries([bb, br]), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }), booths, [0xd8433a, 0xe2b13c, 0x2f8fd0, 0xe8e0d0]);
  for (let i = 0; i < 8; i++) { const a = rand(0, 6.28), r = rand(5, 20); const m = new THREE.Mesh(G.box(0.3, 0.6, 0.25, 0.03), stdMat(pick([0x2a3a8a, 0x8a2a5a, 0x1a1a1a]), { roughness: .5 })); m.position.set(Math.cos(a) * r, 0.3, Math.sin(a) * r); m.castShadow = true; A.addProp(m, { mass: 0.5, size: 0.35, kind: 'arcade cabinet' }); }
  A.dust = dustField(g, 400, [-25, 25, 0.5, 8, -25, 25], [0.6, 0.5, 0.8], 0.035);
};

// ------------------------------------------------------------ RED MESA: desert refinery
MAPGEN.desert = (g, A) => {
  setupSky(g, A, { elev: 13, azim: 235, turbidity: 5, rayleigh: 1.3, mie: 0.005, sunColor: 0xffd2a0, sunI: 3.4, skyC: 0x9ab4d8, groundC: 0x8a5a38, hemiI: 0.7, fog: 0xc6a37e, fogD: 0.0095, envGround: 0x9a6a42 });
  A.grade = { contrast: 1.08, sat: 1.08, sharp: 0.38, shadow: [0.94, 0.94, 1.04], high: [1.06, 1.0, 0.9], vig: 0.85 };
  A.dustColor = [0.75, 0.58, 0.42]; A.bound = { x0: -26, x1: 26, z0: -26, z1: 26 }; A.groundFn = desertH; A.intros = ['drop', 'flyin', 'emerge'];
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
  // refinery: pipe racks, flare stack, pumpjacks, power pylons, a wrecked transport
  const steel = stdMat(0x8a8a84, { metalness: 0.7, roughness: 0.45, map: TEX.pC.map }), rust = stdMat(0x7a4a2a, { map: TEX.grunge, metalness: 0.5, roughness: 0.8 }), yel = stdMat(0xd8a420, { metalness: 0.4, roughness: 0.6 });
  for (const [x0, z0, x1, z1] of [[-24, -8, -12, -8], [-12, -8, -12, 6], [8, 14, 24, 14]]) {
    const len = Math.hypot(x1 - x0, z1 - z0), ang = Math.atan2(x1 - x0, z1 - z0);
    for (let t = 0; t <= len; t += 2) { const x = x0 + (x1 - x0) * t / len, z = z0 + (z1 - z0) * t / len; B.add(G.cube(0.08, 1.2, 0.08), steel, [x - Math.cos(ang) * 0.4, desertH(x, z) + 0.6, z + Math.sin(ang) * 0.4]); B.add(G.cube(0.08, 1.2, 0.08), steel, [x + Math.cos(ang) * 0.4, desertH(x, z) + 0.6, z - Math.sin(ang) * 0.4]); B.add(G.cube(0.9, 0.06, 0.06), steel, [x, desertH(x, z) + 1.2, z], [0, ang + Math.PI / 2, 0]); }
    for (const off of [-0.25, 0, 0.25]) B.add(G.cyl(0.07, 0.07, len, 8), pick([steel, rust]), [(x0 + x1) / 2 + Math.cos(ang) * off, desertH((x0 + x1) / 2, (z0 + z1) / 2) + 1.3, (z0 + z1) / 2 - Math.sin(ang) * off], [Math.PI / 2, 0, ang], [1, 1, 1].map((v, i) => v));
  }
  B.add(G.cyl(0.25, 0.35, 9, 12), steel, [-18, desertH(-18, -14) + 4.5, -14]); for (const y of [3, 6]) B.add(G.tor(0.45, 0.04, 4, 16), yel, [-18, desertH(-18, -14) + y, -14], [Math.PI / 2, 0, 0]);
  const flare = new THREE.Object3D(); flare.position.set(-18, desertH(-18, -14) + 9.2, -14); g.add(flare); FX.addEmitter(flare, 'fire', 18);
  const fireL = new THREE.PointLight(0xff8030, 120, 30, 1.5); fireL.position.copy(flare.position); g.add(fireL); A.anims.push((dt, t) => fireL.intensity = 100 + Math.sin(t * 13) * 25 + Math.sin(t * 7.3) * 20);
  const jacks = [];
  for (const [x, z] of [[18, -18], [22, -6], [-22, 18]]) {
    const y0 = desertH(x, z); B.add(G.box(0.8, 0.12, 0.3, 0.02), steel, [x, y0 + 0.06, z]); B.add(G.cube(0.06, 0.8, 0.06), steel, [x - 0.15, y0 + 0.4, z], [0, 0, 0.25]); B.add(G.cube(0.06, 0.8, 0.06), steel, [x + 0.15, y0 + 0.4, z], [0, 0, -0.25]);
    const beam = new THREE.Group(); beam.position.set(x, y0 + 0.82, z); const bm = new THREE.Mesh(G.box(1.3, 0.1, 0.1, 0.02), yel); const head = new THREE.Mesh(G.box(0.18, 0.3, 0.12, 0.03), yel); head.position.set(0.66, -0.1, 0); beam.add(bm, head); bm.castShadow = head.castShadow = true; g.add(beam); jacks.push(beam);
  }
  A.anims.push((dt, t) => jacks.forEach((b, i) => b.rotation.z = Math.sin(t * 1.4 + i) * 0.25));
  const wire = []; for (let i = -3; i <= 3; i++) { const x = i * 9, z = -22 + Math.abs(i) * 0.5, y0 = desertH(x, z); B.add(G.cyl(0.05, 0.08, 4, 6), steel, [x, y0 + 2, z]); B.add(G.cube(1.6, 0.08, 0.08), steel, [x, y0 + 3.8, z]); wire.push(V3(x, y0 + 3.8, z)); }
  for (let i = 0; i < wire.length - 1; i++) for (const off of [-0.7, 0.7]) { const a = wire[i].clone().add(V3(off, 0, 0)), b = wire[i + 1].clone().add(V3(off, 0, 0)); const m = a.clone().lerp(b, 0.5); m.y -= 0.6; B.add(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, m, b), 10, 0.012, 4), stdMat(0x111111)); }
  B.add(G.cap(0.9, 6), stdMat(0x8a8e88, { metalness: 0.6, roughness: 0.5, map: TEX.pA.map }), [12, desertH(12, -20) + 0.3, -20], [Math.PI / 2, 0.6, 0.15]);
  B.add(G.box(5, 0.12, 1.6, 0.04), stdMat(0x8a8e88, { metalness: 0.6, roughness: 0.5 }), [11.2, desertH(11.2, -18.8) + 0.4, -18.8], [0.1, 0.6, -0.3]);
  B.build(g, { receive: true, cast: true });
  A.makeSet('adobe', 0); A.makeSet('metal', 0); A.makeSet('rock', 0);
  const place = (st, x, z, nx, nz, nh, tint, o = {}) => { if (Math.hypot(x, z) < 6.5) return; const b = A.addBuilding(st, x, z, nx, nz, nh, tint, o); b.yOff = Math.min(desertH(b.x0, b.z0), desertH(b.x1, b.z0), desertH(b.x0, b.z1), desertH(b.x1, b.z1)) - 0.04; };
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2 + rng() * 0.2, r = 9 + rng() * 13, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const t = rng();
    if (t < 0.45) place('adobe', x, z, 3 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 4), pick([0xe0c4a0, 0xd4ae86, 0xc89a72]));
    else if (t < 0.7) place('metal', x, z, 3 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 3), 6 + Math.floor(rng() * 6), pick([0xc0c4c0, 0xa8aca6]));
    else place('rock', x, z, 2 + Math.floor(rng() * 2), 2 + Math.floor(rng() * 2), 10 + Math.floor(rng() * 9), pick([0xd08a60, 0xc07850]));
  }
  for (const [x, z] of [[-14, -2], [-8, -16], [14, -14], [17, 8]]) place('metal', x, z, 4, 4, 9, 0xe8e8e0, { cw: 0.5, ch: 0.5 });
  A.finalizeBuildings(g);
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
    m.add(new THREE.Mesh(G.cyl(0.225, 0.225, 0.08, 18), basicGlow(0xd8341a, 1)));
    A.addProp(m, { mass: 0.9, size: 0.35, kind: 'tank', explosive: true });
  }
  A.dust = dustField(g, 700, [-30, 30, 0.2, 6, -30, 30], [1.0, 0.85, 0.65], 0.05);
  A.heli.push(new Heli(g, 22, 10, 0.08, 1));
};
