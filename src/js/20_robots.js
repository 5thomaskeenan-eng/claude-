// ============================================================================
// ROBOTS: roster + procedural mech builder (joints are IK-driven at runtime)
// Each builder follows one concept sheet: silhouette first, then plates, then mechanics.
// ============================================================================
const ROBOTS = [
  {
    id: 'bulwark', name: 'Bulwark', cls: 'Heavyweight · Siege frame',
    bio: 'A demolition-crew chassis under a roof of white slab armor, built around a black sensor dome. Slow to start, impossible to move, and every right hand lands like a wrecking ball.',
    stats: { power: 8, speed: 4, armor: 9, reach: 7, stamina: 6 },
    colors: { primary: 0xd9dbd6, secondary: 0x8d928e, dark: 0x2b2e31, accent: 0xc8ff2e, eye: 0xc8ff2e },
    dims: { hipH: 1.0, hipW: 0.27, thigh: 0.5, shin: 0.52, ankle: 0.17, spineY: 0.16, chestY: 0.5, shX: 0.78, shY: 0.26, upper: 0.6, fore: 0.68, neckY: 0.5, neckZ: 0.12, stanceW: 0.42, hunch: 0.1 },
    unit: '07', build: 'bulwark', scale: 1.22, abilities: ['wrecking', 'quake'],
    persona: { range: 0.92, body: 0.3, aggr: 0.9, combos: [['jab', 'cross'], ['jab', 'jab', 'cross'], ['cross', 'hook'], ['hook', 'upper'], ['jab', 'body:cross']] },
  },
  {
    id: 'onyx', name: 'Onyx', cls: 'Brawler · Gorilla frame',
    bio: 'Built for deep-sea salvage, retired for punching. Round charcoal hull, arms that hang past its knees, and a sensor head buried in its collar where you can barely reach it.',
    stats: { power: 9, speed: 5, armor: 7, reach: 9, stamina: 6 },
    colors: { primary: 0x3d4044, secondary: 0x33363a, dark: 0x1a1b1e, accent: 0xd9e0e4, eye: 0xff6a1f },
    dims: { hipH: 1.0, hipW: 0.3, thigh: 0.5, shin: 0.5, ankle: 0.14, spineY: 0.14, chestY: 0.52, shX: 0.82, shY: 0.2, upper: 0.7, fore: 0.8, neckY: 0.44, neckZ: 0.16, stanceW: 0.45, hunch: 0.2 },
    unit: '12', build: 'onyx', scale: 1.15, abilities: ['boulder', 'pound'],
    persona: { range: 1.0, body: 0.4, aggr: 1.1, combos: [['hook', 'hook'], ['jab', 'hook'], ['body:hook', 'upper'], ['cross', 'hook', 'upper'], ['jab', 'cross']] },
  },
  {
    id: 'torque', name: 'Torque', cls: 'Rush-down · Monowheel frame',
    bio: 'Riot-control unit that traded its legs for a single drive wheel. Carries two door-sized forearm shields and closes distance faster than anything else in the league.',
    stats: { power: 6, speed: 9, armor: 7, reach: 6, stamina: 7 },
    colors: { primary: 0xe3e4df, secondary: 0x9a9e9a, dark: 0x2a2c2e, accent: 0xd4ff1e, eye: 0xd4ff1e },
    dims: { hipH: 1.2, hipW: 0.17, thigh: 0.32, shin: 0.32, ankle: 0.58, spineY: 0.16, chestY: 0.48, shX: 0.66, shY: 0.26, upper: 0.56, fore: 0.6, neckY: 0.44, neckZ: 0.06, stanceW: 0.13, hunch: 0.06, wheeled: true, footFwd: 0 },
    unit: 'T3', build: 'torque', scale: 0.86, abilities: ['nitro', 'clones'],
    persona: { range: 0.95, body: 0.3, aggr: 1.15, combos: [['jab', 'jab', 'cross'], ['jab', 'hook'], ['cross', 'hook', 'cross'], ['body:jab', 'hook'], ['jab', 'cross', 'upper']] },
  },
  {
    id: 'spectra', name: 'Spectra', cls: 'Showman · Outfighter',
    bio: 'A former arena mascot reflashed for combat. Horned helmet, a molten gauntlet on the right hand, and neon panels that light up like a pinball table. Never stops throwing the jab.',
    stats: { power: 5, speed: 9, armor: 5, reach: 7, stamina: 8 },
    colors: { primary: 0x1f2c54, secondary: 0x2c3d6e, dark: 0x111420, accent: 0x34ff6e, eye: 0xff3048, glowArm: 0xff4410, glowLegL: 0x2f6bff, glowLegR: 0xa04dff, glowPink: 0xff2fb4 },
    dims: { hipH: 1.2, hipW: 0.23, thigh: 0.6, shin: 0.62, ankle: 0.14, spineY: 0.16, chestY: 0.46, shX: 0.62, shY: 0.25, upper: 0.56, fore: 0.6, neckY: 0.44, neckZ: 0.05, stanceW: 0.34, hunch: 0.02 },
    unit: '88', build: 'spectra', scale: 0.95, abilities: ['phase', 'plasma'],
    persona: { range: 1.05, body: 0.25, aggr: 1.0, combos: [['jab', 'jab'], ['jab', 'jab', 'cross'], ['jab', 'cross', 'hook'], ['jab', 'body:jab', 'cross'], ['jab', 'cross', 'jab', 'upper']] },
  },
  {
    id: 'belljar', name: 'Belljar', cls: 'Tank · Counterpuncher',
    bio: 'A bomb-disposal unit that kept its blast dome. Quilted padding, clear riot guards and a tank tread for a right foot. Patient, patched together, and waiting for you to miss.',
    stats: { power: 7, speed: 5, armor: 8, reach: 6, stamina: 8 },
    colors: { primary: 0x8e918d, secondary: 0x6c7a3a, tertiary: 0x4a6f9e, dark: 0x2a2b29, brown: 0x6a4630, accent: 0x84a9d6, eye: 0xff2a1a },
    dims: { hipH: 1.2, hipW: 0.28, thigh: 0.62, shin: 0.58, ankle: 0.15, spineY: 0.16, chestY: 0.4, shX: 0.62, shY: 0.2, upper: 0.54, fore: 0.58, neckY: 0.34, neckZ: 0.02, stanceW: 0.4, hunch: 0.02 },
    unit: 'B5', build: 'belljar', scale: 1.04, abilities: ['ram', 'dome'],
    persona: { range: 0.95, body: 0.35, aggr: 0.7, counter: 1, combos: [['jab', 'cross'], ['cross', 'hook'], ['body:hook', 'hook'], ['upper', 'cross'], ['jab', 'upper']] },
  },
  {
    id: 'warden', name: 'Warden OD-9', cls: 'Technician · Military frame',
    bio: 'Decommissioned perimeter unit still running its targeting firmware. Olive plate over a skeletal frame, a single orange eye, and claws that never quite let go of a grudge.',
    stats: { power: 7, speed: 7, armor: 6, reach: 8, stamina: 7 },
    colors: { primary: 0x5f6b28, secondary: 0x4a5420, dark: 0x16181a, accent: 0xeef4ff, eye: 0xff6a12 },
    dims: { hipH: 1.26, hipW: 0.24, thigh: 0.64, shin: 0.64, ankle: 0.16, spineY: 0.16, chestY: 0.44, shX: 0.66, shY: 0.25, upper: 0.6, fore: 0.64, neckY: 0.42, neckZ: 0.06, stanceW: 0.36, hunch: 0.05 },
    unit: 'OD9', blade: 'sword', build: 'warden', scale: 1.08, abilities: ['missiles', 'harpoon'],
    persona: { range: 1.0, body: 0.35, aggr: 1.0, combos: [['jab', 'cross', 'hook'], ['jab', 'body:cross', 'hook'], ['jab', 'cross', 'upper'], ['hook', 'cross'], ['jab', 'jab', 'cross', 'hook']] },
  },
  {
    id: 'mire', name: 'Mire', cls: 'Swarmer · Hunchback',
    bio: 'Nobody admits to building it. Mire fights bent double behind two boulder shoulders, swings claws from the floor and only seems to get faster the more plating it loses.',
    stats: { power: 8, speed: 7, armor: 5, reach: 8, stamina: 7 },
    colors: { primary: 0x434b39, secondary: 0x2f3529, dark: 0x141612, accent: 0xb9c84a, eye: 0xf2ff2a },
    dims: { hipH: 1.04, hipW: 0.28, thigh: 0.54, shin: 0.54, ankle: 0.13, spineY: 0.12, chestY: 0.46, shX: 0.78, shY: 0.22, upper: 0.66, fore: 0.76, neckY: 0.3, neckZ: 0.32, stanceW: 0.46, hunch: 0.34 },
    unit: '00', build: 'mire', scale: 1.0, abilities: ['pounce', 'rend'],
    persona: { range: 0.88, body: 0.45, aggr: 1.25, combos: [['hook', 'hook', 'upper'], ['body:hook', 'body:hook', 'upper'], ['upper', 'hook'], ['jab', 'hook', 'hook'], ['cross', 'upper']] },
  },
];
const ROBOT = id => ROBOTS.find(r => r.id === id);

// dirt that collects low on the chassis + world-space grime blotches
function applyGrime(m) {
  m.onBeforeCompile = sh => {
    sh.uniforms.uGround = { value: RING_Y };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW;').replace('#include <project_vertex>', '#include <project_vertex>\nvGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vGW; uniform float uGround;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float gh = clamp((vGW.y - uGround) / 1.3, 0.0, 1.0);
        vec3 gp = floor(vGW * 7.0);
        float gn = fract(sin(dot(gp, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        diffuseColor.rgb *= mix(0.5 + 0.18 * gn, 1.0, smoothstep(0.0, 1.0, gh)) * (0.93 + 0.07 * gn);`);
  };
  m.customProgramCacheKey = () => 'grime1';
  return m;
}

function makeRobotMats(c, dormant, def) {
  const paint = (color, set = TEX.pA, o = {}) => applyGrime(new THREE.MeshPhysicalMaterial(Object.assign({
    color, map: set.map, normalMap: set.normal, normalScale: new THREE.Vector2(1.0, 1.0), metalness: 1, metalnessMap: set.metal,
    roughness: 0.6, roughnessMap: TEX.grunge, clearcoat: 0.4, clearcoatRoughness: 0.4,
  }, o)));
  const metal = (color, o = {}) => applyGrime(new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.88, roughness: 0.42, roughnessMap: TEX.grunge, map: TEX.pC.map, normalMap: TEX.pC.normal, normalScale: new THREE.Vector2(0.7, 0.7) }, o)));
  const glow = (color, i = 2.6) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: dormant ? 0x000000 : color, emissiveIntensity: i, roughness: 0.35, metalness: 0.2 });
  const m = {
    primary: paint(c.primary, TEX.pA), secondary: paint(c.secondary, TEX.pB), dark: metal(c.dark),
    joint: new THREE.MeshStandardMaterial({ color: 0x1c1e20, metalness: 0.92, roughness: 0.32, roughnessMap: TEX.grunge }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd4d8db, metalness: 1, roughness: 0.14 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.93, metalness: 0, normalMap: TEX.pC.normal, normalScale: new THREE.Vector2(0.4, 0.4) }),
    cable: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.55, metalness: 0.2 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x07090c, metalness: 0.3, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }),
    clear: new THREE.MeshPhysicalMaterial({ color: 0xcfe2ea, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
    hazard: new THREE.MeshStandardMaterial({ map: TEX.hazard, roughness: 0.6, metalness: 0.3, normalMap: TEX.pC.normal }),
    glow: glow(c.accent, 4.2), eye: glow(c.eye, 9),
  };
  if (def && def.unit) m.decal = new THREE.MeshStandardMaterial({ map: unitDecal(def.unit, c.primary), roughness: 0.55, metalness: 0.2 });
  if (c.tertiary) m.tertiary = paint(c.tertiary, TEX.pB);
  if (c.brown) m.brown = applyGrime(new THREE.MeshStandardMaterial({ color: c.brown, roughness: 0.78, metalness: 0.05, map: TEX.pQ.map, normalMap: TEX.pQ.normal, normalScale: new THREE.Vector2(0.5, 0.5) }));
  m.fabric = applyGrime(new THREE.MeshStandardMaterial({ color: c.primary, roughness: 0.92, metalness: 0, map: TEX.pQ.map, normalMap: TEX.pQ.normal, normalScale: new THREE.Vector2(1.3, 1.3) }));
  if (c.glowArm) { m.glowArm = glow(c.glowArm, 3.2); m.glowLegL = glow(c.glowLegL, 4); m.glowLegR = glow(c.glowLegR, 4); m.glowPink = glow(c.glowPink, 4); }
  m.clear.userData.noShadow = true;
  return m;
}
const _decals = new Map();
function unitDecal(text, bg) {
  const k = text + bg; if (_decals.has(k)) return _decals.get(k);
  const t = canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = '#' + new THREE.Color(bg).getHexString(); g.fillRect(0, 0, w, h);
    noiseFill(g, w, h, 18);
    g.fillStyle = 'rgba(20,20,20,.88)'; g.font = '900 92px "Big Shoulders Display", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 6);
    g.strokeStyle = 'rgba(20,20,20,.6)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
    scratches(g, w, h, 40, '255,255,255', .25);
  }, { repeat: [1, 1] });
  _decals.set(k, t); return t;
}

// ---------------------------------------------------------------- hard-surface helpers
const PGC = new Map();
// chamfered, optionally tapered armour plate; face in XY, thickness along Z, UVs 0..1 across the face
function plateGeo(w, h, d, taper = 1, chamfer = 0.18) {
  const key = `${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)},${taper},${chamfer}`;
  if (PGC.has(key)) return PGC.get(key);
  const c = Math.min(w, h) * chamfer, bw = w / 2, bh = h / 2, tw = Math.max(bw * taper, c + 0.01);
  const s = new THREE.Shape();
  s.moveTo(-bw + c, -bh); s.lineTo(bw - c, -bh); s.lineTo(bw, -bh + c); s.lineTo(tw, bh - c); s.lineTo(tw - c, bh); s.lineTo(-tw + c, bh); s.lineTo(-tw, bh - c); s.lineTo(-bw, -bh + c); s.closePath();
  const bev = Math.min(d * 0.28, 0.03, c * 0.45), depth = Math.max(0.002, d - bev * 2);
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bev > 0.002, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: 1 });
  g.translate(0, 0, -depth / 2);
  g.computeBoundingBox(); const bb = g.boundingBox, uv = g.attributes.uv, pos = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
  PGC.set(key, g); return g;
}
// scatter small mechanical details over a rectangle on a plane (plane faces +Z of a rotated group)
function greeble(c, parent, rect, z, n, seed, rot = [0, 0, 0], pos = [0, 0, 0]) {
  const { P, m } = c; const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ'); parent.add(g);
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(rect[0], rect[1], r()), y = lerp(rect[2], rect[3], r()), k = r();
    if (k < 0.35) P(g, G.box(+(0.03 + r() * 0.08).toFixed(2), +(0.02 + r() * 0.06).toFixed(2), +(0.02 + r() * 0.03).toFixed(2), 0.006), r() < 0.5 ? m.dark : m.joint, [x, y, z]);
    else if (k < 0.55) P(g, G.cyl(0.018, 0.018, 0.03, 8), m.chrome, [x, y, z], [HPI, 0, 0]);
    else if (k < 0.75) { for (let j = 0; j < 3; j++) P(g, G.box(0.08, 0.008, 0.016, 0.003), m.joint, [x, y + j * 0.02, z]); }
    else if (k < 0.9) P(g, G.box(0.014, +(0.06 + r() * 0.1).toFixed(2), 0.014, 0.004), m.cable, [x, y, z]);
    else P(g, G.cyl(0.03, 0.03, 0.02, 10), m.glow, [x, y, z], [HPI, 0, 0]);
  }
  return g;
}
// merge static parts per (parent, material) so heavy detail stays cheap to draw
function mergeStatic(R) {
  const keep = new Set([...R.armor.head, ...R.armor.core, ...R.armor.armL, ...R.armor.armR]);
  const groups = new Map();
  R.root.traverse(o => {
    if (!o.isMesh || keep.has(o) || o.userData.noMerge || o.parent === R.root) return;
    const k = o.parent.uuid + '|' + o.material.uuid;
    if (!groups.has(k)) groups.set(k, []); groups.get(k).push(o);
  });
  const glowMats = new Set(R.glows.map(g => g.material)); R.glows = R.glows.filter(g => keep.has(g));
  for (const list of groups.values()) {
    if (list.length < 2) { if (glowMats.has(list[0].material)) R.glows.push(list[0]); continue; }
    const parent = list[0].parent, mat = list[0].material;
    const geos = list.map(o => {
      o.updateMatrix();
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      g.applyMatrix4(o.matrix); return g;
    });
    const merged = mergeGeometries(geos); geos.forEach(g => g.dispose());
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = !mat.userData.noShadow; mesh.receiveShadow = true; mesh.userData.ownGeo = true; mesh.userData.robot = true;
    list.forEach(o => o.removeFromParent()); parent.add(mesh);
    if (glowMats.has(mat)) R.glows.push(mesh);
  }
}

// ---------------------------------------------------------------- dynamic hydraulics
const _pa = new THREE.Vector3(), _pb = new THREE.Vector3(), _pd = new THREE.Vector3(), _pY = new THREE.Vector3(0, 1, 0);
function updatePistons(R) {
  if (!R.pistons.length) return;
  R.root.updateMatrixWorld();
  for (const p of R.pistons) {
    _pa.copy(p.aOff).applyMatrix4(p.a.matrixWorld); _pb.copy(p.bOff).applyMatrix4(p.b.matrixWorld);
    R.root.worldToLocal(_pa); R.root.worldToLocal(_pb);
    _pd.subVectors(_pb, _pa); const len = Math.max(0.01, _pd.length()); _pd.divideScalar(len);
    p.sleeve.quaternion.setFromUnitVectors(_pY, _pd); p.rod.quaternion.copy(p.sleeve.quaternion);
    p.sleeve.position.copy(_pa).addScaledVector(_pd, len * 0.3); p.sleeve.scale.set(1, len * 0.6, 1);
    p.rod.position.copy(_pa).addScaledVector(_pd, len * 0.74); p.rod.scale.set(1, len * 0.52, 1);
  }
}

// ---------------------------------------------------------------- builder
function buildRobot(def, opts = {}) {
  const d = def.dims;
  const m = makeRobotMats(opts.colors || def.colors, opts.dormant, opts.colors ? null : def);
  const R = {
    def, dims: d, mats: m, armor: { head: [], core: [], armL: [], armR: [] }, glows: [], meshes: [], pistons: [],
    root: new THREE.Group(), body: new THREE.Group(), spine: new THREE.Group(), chest: new THREE.Group(), neck: new THREE.Group(), head: new THREE.Object3D(),
    shL: new THREE.Object3D(), shR: new THREE.Object3D(), elL: new THREE.Object3D(), elR: new THREE.Object3D(), fistL: new THREE.Object3D(), fistR: new THREE.Object3D(),
    hipL: new THREE.Object3D(), hipR: new THREE.Object3D(), knL: new THREE.Object3D(), knR: new THREE.Object3D(), footL: new THREE.Group(), footR: new THREE.Group(),
  };
  R.root.name = def.id;
  R.root.add(R.body, R.footL, R.footR);
  R.body.position.y = d.hipH;
  R.body.add(R.spine, R.hipL, R.hipR);
  R.spine.position.y = d.spineY; R.spine.add(R.chest);
  R.chest.position.y = d.chestY;
  R.chest.add(R.neck, R.shL, R.shR);
  R.neck.position.set(0, d.neckY, d.neckZ); R.neck.add(R.head); R.head.position.y = 0.14;
  R.shL.position.set(d.shX, d.shY, 0); R.shR.position.set(-d.shX, d.shY, 0);
  R.shL.add(R.elL); R.shR.add(R.elR); R.elL.position.z = d.upper; R.elR.position.z = d.upper;
  R.elL.add(R.fistL); R.elR.add(R.fistR); R.fistL.position.z = d.fore; R.fistR.position.z = d.fore;
  R.hipL.position.set(d.hipW, -0.04, 0); R.hipR.position.set(-d.hipW, -0.04, 0);
  R.hipL.add(R.knL); R.hipR.add(R.knR); R.knL.position.z = d.thigh; R.knR.position.z = d.thigh;

  const P = (parent, geo, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = null) => {
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(pos[0], pos[1], pos[2]); mesh.rotation.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ');
    if (scl) mesh.scale.set(scl[0], scl[1], scl[2]);
    mesh.castShadow = !mat.userData.noShadow; mesh.receiveShadow = true; parent.add(mesh); R.meshes.push(mesh);
    if (mat.emissiveIntensity > 0.5 && mat.emissive && mat.emissive.getHex() !== 0) R.glows.push(mesh);
    return mesh;
  };
  const A = (zone, mesh) => { R.armor[zone].push(mesh); return mesh; };
  const piston = (a, aOff, b, bOff, r = 0.045) => {
    const sl = new THREE.Mesh(G.cyl(r, r, 1, 10), m.joint), rod = new THREE.Mesh(G.cyl(r * 0.55, r * 0.55, 1, 8), m.chrome);
    sl.castShadow = rod.castShadow = true; sl.userData.noMerge = rod.userData.noMerge = true; R.root.add(sl, rod);
    R.pistons.push({ a, aOff: V3(...aOff), b, bOff: V3(...bOff), sleeve: sl, rod });
  };
  const cable = (parent, pts, r = 0.025) => { const c = new THREE.CatmullRomCurve3(pts.map(p => V3(...p))); return P(parent, new THREE.TubeGeometry(c, 16, r, 6, false), m.cable); };
  const bolts = (parent, list, r = 0.022) => list.forEach(p => P(parent, G.cyl(r, r, 0.02, 6), m.chrome, p, [Math.PI / 2, 0, 0]));
  const HP = Math.PI / 2, C = R.chest, H = R.neck;
  const sides = [1, -1];
  const sh = s => s > 0 ? R.shL : R.shR, el = s => s > 0 ? R.elL : R.elR, fi = s => s > 0 ? R.fistL : R.fistR;
  const hp = s => s > 0 ? R.hipL : R.hipR, kn = s => s > 0 ? R.knL : R.knR, ft = s => s > 0 ? R.footL : R.footR;
  const zoneOf = s => s > 0 ? 'armL' : 'armR';
  const U = d.upper, F = d.fore, T = d.thigh, S = d.shin;
  const c = { R, m, d, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S };

  // shared mechanical underlayer
  P(R.body, G.box(0.52, 0.28, 0.38, 0.06), m.dark);
  P(R.body, G.box(0.34, 0.18, 0.14, 0.04), m.secondary, [0, -0.04, 0.2]);
  for (const s of sides) {
    P(R.body, G.sph(0.12, 16, 12), m.joint, [s * d.hipW, -0.04, 0]);
    P(R.body, plateGeo(0.3, 0.26, 0.08, 0.8), m.secondary, [s * (d.hipW + 0.14), -0.06, 0], [0, s * HP, s * 0.18, 'ZYX']);
    P(R.body, G.cyl(0.05, 0.05, 0.16, 10), m.chrome, [s * (d.hipW + 0.02), 0.02, -0.14], [0, 0, HP]);
  }
  greeble(c, R.body, [-0.2, 0.2, -0.1, 0.08], 0.2, 8, def.id.length * 5, [0, Math.PI, 0]);
  P(R.spine, G.cyl(0.15, 0.19, 0.24, 16), m.joint, [0, 0.06, 0]);
  for (let i = 0; i < 4; i++) P(R.spine, G.tor(0.17 - i * 0.008, 0.024, 6, 20), m.rubber, [0, -0.04 + i * 0.06, 0], [HP, 0, 0]);
  for (const s of sides) cable(R.spine, [[s * 0.12, -0.08, 0.12], [s * 0.2, 0.08, 0.16], [s * 0.16, 0.28, 0.1]], 0.022);
  for (const s of sides) {
    P(sh(s), G.cyl(0.075, 0.075, U, 10), m.joint, [0, 0, U / 2], [HP, 0, 0]);
    P(sh(s), G.cyl(0.11, 0.11, 0.1, 14), m.joint, [0, 0, 0.04], [HP, 0, 0]);
    P(el(s), G.sph(0.13, 16, 12), m.joint);
    P(el(s), G.cyl(0.1, 0.1, 0.26, 14), m.dark, [0, 0, 0], [0, 0, HP]);
    P(hp(s), G.cyl(0.085, 0.085, T, 10), m.joint, [0, 0, T / 2], [HP, 0, 0]);
    P(kn(s), G.sph(0.14, 16, 12), m.joint);
    P(kn(s), G.cyl(0.11, 0.11, 0.3, 14), m.dark, [0, 0, 0], [0, 0, HP]);
    P(kn(s), G.cyl(0.075, 0.075, S, 10), m.joint, [0, 0, S / 2], [HP, 0, 0]);
    cable(hp(s), [[s * 0.1, -0.12, 0.05], [s * 0.16, -0.14, T * 0.5], [s * 0.1, -0.12, T * 0.95]], 0.018);
  }

  BUILDERS[def.build](c);

  // forearm blades (Warden carries its sword instead)
  R.blades = {};
  for (const s of sides) {
    const bg = new THREE.Group(); bg.visible = false; bg.scale.z = 0.01; R.blades[s] = bg;
    if (def.blade === 'sword') {
      if (s > 0) { fi(1).add(bg); continue; }
      bg.position.set(0, -0.02, 0.14); fi(-1).add(bg);
      const steel = new THREE.MeshStandardMaterial({ color: 0x4e5a2a, metalness: 0.85, roughness: 0.35, map: TEX.pB.map });
      const edge = new THREE.MeshStandardMaterial({ color: 0xf2e6c4, metalness: 0.9, roughness: 0.2, emissive: 0xfff0c8, emissiveIntensity: 0.6 });
      const core = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff5a10, emissiveIntensity: 4 });
      P(bg, G.cyl(0.06, 0.06, 0.34, 10), m.joint, [0, 0, 0.0], [HP, 0, 0]);
      P(bg, G.box(0.1, 0.36, 0.1, 0.02), m.dark, [0, 0, 0.2]);
      P(bg, G.box(0.06, 0.3, 2.1, 0.01), steel, [0, 0, 1.3]);
      P(bg, G.box(0.065, 0.05, 1.9, 0.005), core, [0, 0.03, 1.25]);
      for (const y of [0.15, -0.15]) P(bg, G.box(0.03, 0.025, 2.08, 0.005), edge, [0, y, 1.3]);
      for (let i = 0; i < 6; i++) P(bg, G.box(0.08, 0.04, 0.03, 0.005), m.joint, [0, -0.08, 0.32 + i * 0.05]);
      R.bladeReach = 1.2;
    } else {
      bg.position.set(s * 0.2, 0.06, F * 0.5); el(s).add(bg);
      const steel = new THREE.MeshStandardMaterial({ color: 0xb8bec4, metalness: 1, roughness: 0.18 });
      P(bg, G.box(0.035, 0.16, 1.0, 0.01), steel, [0, 0, 0.5]);
      P(bg, G.box(0.03, 0.11, 0.24, 0.01), steel, [0, -0.025, 1.06], [0.35, 0, 0]);
      P(bg, G.box(0.012, 0.02, 1.0, 0.004), m.glow, [0, 0.085, 0.5]);
      P(bg, G.box(0.07, 0.2, 0.18, 0.02), m.dark, [0, 0, 0.0]);
      R.bladeReach = 0.3;
    }
  }
  // headlight beam for night maps
  const beam = new THREE.Mesh(new THREE.ConeGeometry(0.9, 6, 20, 1, true).rotateX(-Math.PI / 2).translate(0, 0, 3), new THREE.MeshBasicMaterial({ color: new THREE.Color(def.colors.eye).lerp(new THREE.Color(0xffffff), 0.6).multiplyScalar(0.07), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0, 0.12, 0.2); beam.rotation.x = 0.18; beam.visible = false; beam.userData.noMerge = beam.userData.noAO = true; R.head.add(beam); R.beam = beam;
  R.aura = new THREE.PointLight(def.colors.accent, 0, 5, 2); R.aura.position.set(0, 0.2, 0.7); R.chest.add(R.aura);
  if (opts.ghost) {
    const gm = new THREE.MeshBasicMaterial({ color: new THREE.Color(def.colors.accent).lerp(new THREE.Color(0x404a80), 0.5).multiplyScalar(0.9), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
    R.root.traverse(o => { if (o.isMesh) { o.material = gm; o.castShadow = false; o.receiveShadow = false; o.userData.noAO = true; } });
    R.ghostMat = gm; R.aura.intensity = 0; beam.visible = false; beam.userData.ghost = true;
  }
  mergeStatic(R);
  R.root.traverse(o => { if (o.isMesh) o.userData.robot = true; });
  R.dispose = () => {
    R.root.traverse(o => { if (o.isMesh && o.userData.ownGeo) o.geometry.dispose(); });
    Object.values(R.mats).forEach(x => x.dispose()); if (R.ghostMat) R.ghostMat.dispose();
  };
  if (opts.scale) R.root.scale.setScalar(opts.scale);
  return R;
}

// generic fists
function fistBlock(c, s, mat, plate, size = 0.34) {
  const { P, fi } = c; const f = fi(s);
  P(f, G.box(size, size * 0.92, size * 0.95, 0.07), mat, [0, 0, size * 0.42]);
  for (let i = 0; i < 4; i++) {
    P(f, G.box(size * 0.22, size * 0.3, size * 0.22, 0.03), c.m.joint, [(-1.5 + i) * size * 0.235, size * 0.18, size * 0.86]);
    P(f, G.box(size * 0.2, size * 0.14, size * 0.2, 0.02), plate, [(-1.5 + i) * size * 0.235, size * 0.36, size * 0.8]);
  }
  P(f, plateGeo(size * 1.02, size * 0.34, size * 0.22, 0.9), plate, [0, size * 0.28, size * 0.62], [-0.3, 0, 0]);
  P(f, G.box(size * 0.24, size * 0.3, size * 0.4, 0.04), c.m.joint, [s * size * 0.56, -size * 0.08, size * 0.48]);
  P(f, G.cyl(size * 0.3, size * 0.3, size * 0.2, 14), c.m.dark, [0, 0, 0.02], [HPI, 0, 0]);
}
function fistClaw(c, s, plate, len = 0.2, n = 3) {
  const { P, fi, m } = c; const f = fi(s);
  P(f, G.box(0.24, 0.2, 0.2, 0.05), m.dark, [0, 0, 0.08]);
  P(f, plateGeo(0.28, 0.2, 0.06, 0.8), plate, [0, 0.11, 0.08], [-HPI, 0, 0]);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.085;
    const k1 = new THREE.Group(); k1.position.set(x, 0.05, 0.17); k1.rotation.x = 0.55; f.add(k1);
    P(k1, G.box(0.06, 0.06, len * 0.55, 0.02), m.joint, [0, 0, len * 0.27]);
    P(k1, G.sph(0.038, 8, 6), m.chrome, [0, 0, len * 0.55]);
    const k2 = new THREE.Group(); k2.position.z = len * 0.55; k2.rotation.x = 0.9; k1.add(k2);
    P(k2, plateGeo(0.07, len * 0.5, 0.05, 0.6), plate, [0, 0, len * 0.24], [-HPI, 0, 0]);
    P(k2, G.cone(0.03, len * 0.3, 6), m.dark, [0, 0, len * 0.6], [HPI, 0, 0]);
  }
  const th = new THREE.Group(); th.position.set(s * 0.13, -0.03, 0.12); th.rotation.set(0.4, 0, -s * 0.7); f.add(th);
  P(th, G.box(0.055, 0.055, len * 0.6, 0.02), m.joint, [0, 0, len * 0.3]);
  P(th, G.cone(0.03, len * 0.25, 6), m.dark, [0, 0, len * 0.68], [HPI, 0, 0]);
}
const HPI = Math.PI / 2;
// plate facing out along ±X (s), leaning its top inward by `lean`
const SIDE = (s, lean = 0) => [0, s * HPI, s * lean, 'ZYX'];
const UPF = (tilt = 0) => [-HPI + tilt, 0, 0];

const BUILDERS = {
  // ------------------------------------------------------------ BULWARK: white slab roof over a black dome, lime lights
  bulwark(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.9, 0.78, 0.62, 0.08), m.dark, [0, -0.02, -0.04]);
    P(C, G.sph(0.42, 40, 28), m.glass, [0, 0.02, 0.2], [0, 0, 0], [1, 1, 0.82]);
    P(C, G.tor(0.41, 0.035, 10, 48), m.joint, [0, 0.02, 0.22]);
    for (const [x, y] of [[0.22, 0.18], [-0.22, 0.18]]) P(C, G.box(0.12, 0.04, 0.03, 0.01), m.glow, [x, y, 0.53], [0, x > 0 ? 0.5 : -0.5, x > 0 ? -0.5 : 0.5]);
    for (const [x, y] of [[0.08, 0.28], [-0.12, 0.3], [0.16, -0.12], [-0.2, -0.05]]) P(C, G.sph(0.012, 6, 4), m.chrome, [x, y, 0.52]);
    A('core', P(C, plateGeo(1.1, 0.84, 0.13, 1, 0.22), m.primary, [0, 0.48, 0.02], UPF(0.12)));
    A('core', P(C, plateGeo(0.94, 0.3, 0.1, 0.86), m.primary, [0, 0.38, 0.42], [0.55, 0, 0]));
    for (const s of sides) {
      A('core', P(C, plateGeo(0.74, 0.68, 0.17, 0.82), m.primary, [s * 0.53, 0.14, 0.02], SIDE(s, 0.16)));
      P(C, G.box(0.03, 0.26, 0.03, 0.01), m.glow, [s * 0.555, 0.06, 0.39], [0, 0, s * 0.16]);
      P(C, G.cyl(0.05, 0.05, 0.42, 10), m.chrome, [s * 0.24, 0.5, -0.44]);
      P(C, G.cyl(0.065, 0.065, 0.06, 10), m.dark, [s * 0.24, 0.72, -0.44]);
      cable(C, [[s * 0.3, -0.3, 0.2], [s * 0.44, -0.44, 0.05], [s * 0.36, -0.56, -0.2]], 0.03);
      cable(C, [[s * 0.38, -0.2, -0.3], [s * 0.5, -0.5, -0.25], [s * 0.3, -0.62, -0.1]], 0.024);
    }
    P(C, G.box(0.36, 0.22, 0.2, 0.04), m.secondary, [0, -0.44, 0.22]);
    for (let i = 0; i < 4; i++) P(C, G.box(0.3, 0.025, 0.03, 0.01), m.joint, [0, -0.38 - i * 0.04, 0.33]);
    P(C, G.cyl(0.27, 0.3, 0.2, 18), m.dark, [0, -0.46, -0.04]);
    P(C, plateGeo(0.72, 0.6, 0.28, 0.9), m.secondary, [0, 0.04, -0.44]);
    greeble(c, C, [-0.3, 0.3, -0.24, 0.26], 0.6, 22, 11, [0, Math.PI, 0]);
    P(H, G.box(0.36, 0.14, 0.24, 0.04), m.dark, [0, 0.0, 0.04]);
    P(H, G.box(0.28, 0.035, 0.03, 0.01), m.eye, [0, 0.01, 0.17]);
    A('head', P(H, G.cyl(0.012, 0.012, 0.34, 6), m.chrome, [0.15, 0.2, -0.08]));
    A('head', P(H, plateGeo(0.42, 0.3, 0.06, 0.8), m.secondary, [0, 0.1, 0.0], UPF()));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.05, 0); C.add(pad);
      P(pad, G.sph(0.18, 16, 12), m.joint, [0, -0.06, 0]);
      A(z, P(pad, plateGeo(0.86, 1.0, 0.34, 0.88, 0.2), m.primary, [s * 0.14, 0.16, 0], SIDE(s, 0.13)));
      A(z, P(pad, plateGeo(0.8, 0.52, 0.12, 0.9), m.secondary, [s * -0.02, 0.67, 0], [-HPI, 0, -s * 0.3, 'ZYX']));
      P(pad, G.box(0.04, 0.42, 0.04, 0.01), m.glow, [s * 0.34, 0.12, 0.42], [0, 0, s * 0.13]);
      if (m.decal) P(pad, G.box(0.02, 0.18, 0.34, 0.005), m.decal, [s * 0.33, 0.38, 0.0], [0, s > 0 ? 0 : Math.PI, s * 0.13]);
      bolts(pad, [[s * 0.2, 0.55, 0.43], [s * 0.26, 0.0, 0.43], [s * 0.3, -0.25, 0.43], [s * 0.2, 0.55, -0.43]]);
      piston(C, [s * 0.4, 0.05, 0.12], sh(s), [0, 0.12, U * 0.35], 0.04);
      P(sh(s), G.box(0.3, 0.3, U * 0.72, 0.05), m.dark, [0, 0, U * 0.52]);
      P(sh(s), plateGeo(U * 0.62, 0.32, 0.08, 0.9), m.primary, [s * 0.19, 0, U * 0.5], SIDE(s));
      P(el(s), G.box(0.44, 0.46, F * 0.86, 0.06), m.primary, [0, 0, F * 0.5]);
      P(el(s), plateGeo(0.4, F * 0.7, 0.07, 0.9), m.secondary, [0, 0.25, F * 0.5], UPF());
      P(el(s), G.box(0.34, 0.1, F * 0.6, 0.02), m.dark, [0, -0.25, F * 0.5]);
      A(z, P(el(s), plateGeo(F * 1.1, 0.8, 0.1, 0.9, 0.16), m.primary, [s * 0.28, 0.06, F * 0.46], SIDE(s)));
      P(el(s), G.box(0.025, 0.04, F * 0.7, 0.008), m.glow, [s * 0.34, 0.32, F * 0.46]);
      bolts(el(s), [[s * 0.335, -0.2, F * 0.15], [s * 0.335, -0.2, F * 0.8], [s * 0.335, 0.2, F * 0.15], [s * 0.335, 0.2, F * 0.8]]);
      greeble(c, el(s), [0.08, F * 0.8, -0.14, 0.14], 0.23, 10, 20 + s, SIDE(-s));
      piston(sh(s), [0, -0.17, U * 0.2], el(s), [0, -0.26, F * 0.25], 0.05);
      fistBlock(c, s, m.dark, m.primary, 0.4);
      P(hp(s), G.box(0.34, 0.34, T * 0.8, 0.05), m.dark, [0, 0, T * 0.5]);
      P(hp(s), plateGeo(0.4, T * 0.82, 0.12, 0.85), m.primary, [0, 0.21, T * 0.48], UPF());
      P(hp(s), plateGeo(T * 0.6, 0.3, 0.06), m.secondary, [s * 0.19, 0, T * 0.5], SIDE(s));
      P(kn(s), plateGeo(0.32, 0.32, 0.12, 0.8), m.primary, [0, 0.2, 0.04], UPF(0.3));
      P(kn(s), G.box(0.46, 0.48, S * 0.8, 0.06), m.primary, [0, 0.02, S * 0.5]);
      P(kn(s), plateGeo(0.42, S * 0.72, 0.1, 0.82), m.secondary, [0, 0.28, S * 0.5], UPF());
      P(kn(s), G.box(0.02, 0.2, S * 0.4, 0.004), m.hazard, [s * 0.24, -0.05, S * 0.52]);
      P(kn(s), G.box(0.03, 0.04, S * 0.5, 0.008), m.glow, [s * 0.24, 0.27, S * 0.5]);
      piston(hp(s), [0, -0.2, T * 0.25], kn(s), [0, -0.25, S * 0.35], 0.045);
      P(ft(s), G.box(0.36, 0.18, 0.58, 0.05), m.dark, [0, 0.09, 0.1]);
      P(ft(s), plateGeo(0.34, 0.26, 0.08, 0.8), m.primary, [0, 0.2, 0.24], UPF(0.3));
      P(ft(s), G.box(0.38, 0.06, 0.62, 0.02), m.rubber, [0, 0.03, 0.1]);
      P(ft(s), G.cyl(0.22, 0.22, 0.14, 24), m.rubber, [0, 0.22, -0.24], [0, 0, HP]);
      P(ft(s), G.cyl(0.11, 0.11, 0.16, 12), m.chrome, [0, 0.22, -0.24], [0, 0, HP]);
    }
  },

  // ------------------------------------------------------------ ONYX: charcoal spheres, discs, knuckle-dragging arms
  onyx(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.sph(0.5, 40, 28), m.primary, [0, 0.04, 0], [0, 0, 0], [1.12, 0.92, 0.88]);
    for (const a of [-0.35, 0.35]) P(C, G.tor(0.52, 0.012, 4, 48), m.dark, [0, 0.04, 0], [HP, a, 0], [1.1, 0.9, 1]);
    P(C, G.tor(0.47, 0.012, 4, 48), m.dark, [0, 0.04, 0], [0, 0, 0], [1.15, 0.95, 1]);
    P(C, G.sph(0.38, 28, 20), m.secondary, [0, -0.46, 0.06], [0, 0, 0], [1, 0.9, 1]);
    for (let i = 0; i < 2; i++) P(C, G.box(0.03, 0.14, 0.03, 0.01), m.dark, [-0.04 + i * 0.08, -0.4, 0.42], [0.2, 0, 0.1]);
    P(C, G.sph(0.44, 28, 20), m.dark, [0, 0.16, -0.32]);
    P(C, G.tor(0.26, 0.07, 12, 32), m.dark, [0, 0.42, 0.06], [HP, 0, 0]);
    A('core', P(C, plateGeo(0.44, 0.28, 0.12, 0.85, 0.3), m.secondary, [0.04, 0.12, 0.45], [-0.2, 0, 0]));
    A('core', P(C, plateGeo(0.3, 0.22, 0.1, 0.8, 0.3), m.secondary, [-0.27, -0.1, 0.38], [-0.1, -0.4, 0]));
    A('core', P(C, plateGeo(0.3, 0.2, 0.1, 0.8, 0.3), m.secondary, [0.28, -0.14, 0.36], [-0.1, 0.4, 0]));
    for (const [x, y] of [[-0.3, 0.26], [-0.24, 0.26], [-0.27, 0.21]]) P(C, G.sph(0.022, 8, 6), m.glow, [x, y, 0.42]);
    for (const s of sides) { A('core', P(C, G.sph(0.2, 18, 14), m.secondary, [s * 0.5, -0.18, 0.12])); cable(C, [[s * 0.3, 0.3, -0.25], [s * 0.55, 0.42, -0.2], [s * 0.7, 0.3, -0.1]], 0.035); cable(C, [[s * 0.2, -0.3, -0.3], [s * 0.4, -0.55, -0.2], [s * 0.3, -0.7, 0.0]], 0.03); }
    greeble(c, C, [-0.25, 0.25, -0.15, 0.3], 0.75, 18, 31, [0, Math.PI, 0]);
    for (const s of sides) P(R.body, plateGeo(0.26, 0.3, 0.08, 0.7, 0.3), m.primary, [s * 0.14, -0.14, 0.22], [0.2, 0, 0]);
    P(H, G.sph(0.17, 22, 16), m.dark, [0, 0.02, 0.02]);
    P(H, G.box(0.22, 0.06, 0.08, 0.025), m.glass, [0, 0.03, 0.15]);
    P(H, G.sph(0.022, 8, 6), m.eye, [0.03, 0.03, 0.19]);
    A('head', P(H, plateGeo(0.32, 0.26, 0.08, 0.8, 0.3), m.primary, [0, 0.16, 0], [-HP + 0.15, 0, 0]));
    const port = (parent, pos, rot, r = 0.12) => {
      P(parent, G.cyl(r, r, 0.04, 22), m.dark, pos, rot);
      const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(...rot); parent.add(g);
      P(g, G.tor(r * 0.72, r * 0.12, 6, 22), m.secondary, [0, 0.025, 0], [HP, 0, 0]);
      for (const a of [0, HP]) P(g, G.box(r * 1.1, 0.02, r * 0.18, 0.005), m.secondary, [0, 0.03, 0], [0, a, 0]);
      P(g, G.cyl(r * 0.2, r * 0.2, 0.02, 10), m.chrome, [0, 0.04, 0]);
    };
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      A(z, P(pad, G.sph(0.42, 32, 24), m.primary, [s * 0.06, 0.08, 0], [0, 0, 0], [1, 0.95, 1.05]));
      P(pad, G.tor(0.42, 0.012, 4, 40), m.dark, [s * 0.06, 0.08, 0], [0, HP, 0], [1, 0.95, 1.05]);
      P(pad, G.cyl(0.04, 0.05, 0.16, 8), m.dark, [s * -0.05, 0.52, -0.05]);
      P(pad, G.cyl(0.03, 0.04, 0.12, 8), m.dark, [s * 0.1, 0.5, 0.1]);
      port(pad, [s * 0.47, 0.06, 0], [0, 0, -s * HP], 0.14);
      for (let i = 0; i < 5; i++) P(sh(s), G.tor(0.2, 0.035, 8, 20), m.joint, [0, 0, U * (0.2 + i * 0.13)]);
      P(sh(s), G.cap(0.18, U * 0.4), m.secondary, [0, 0.03, U * 0.52], [HP, 0, 0]);
      P(el(s), G.sph(0.22, 18, 14), m.primary);
      port(el(s), [s * 0.2, 0, 0], [0, 0, -s * HP], 0.1);
      A(z, P(el(s), G.cap(0.27, F * 0.5), m.primary, [0, 0, F * 0.5], [HP, 0, 0]));
      P(el(s), G.tor(0.272, 0.01, 4, 32), m.dark, [0, 0, F * 0.32]);
      port(el(s), [s * 0.27, 0.02, F * 0.5], [0, 0, -s * HP], 0.12);
      P(el(s), G.tor(0.25, 0.03, 8, 24), m.dark, [0, 0, F * 0.9]);
      piston(sh(s), [0, -0.15, U * 0.3], el(s), [0, -0.22, F * 0.2], 0.04);
      const f = fi(s);
      P(f, G.sph(0.22, 18, 14), m.dark, [0, 0, 0.14], [0, 0, 0], [1.05, 0.85, 1]);
      for (let i = 0; i < 4; i++) { P(f, G.cap(0.055, 0.12), m.primary, [(-1.5 + i) * 0.1, 0.08, 0.3], [HP + 0.6, 0, 0]); P(f, G.sph(0.045, 8, 6), m.joint, [(-1.5 + i) * 0.1, 0.12, 0.24]); }
      P(f, G.cap(0.06, 0.1), m.primary, [s * 0.2, -0.04, 0.18], [HP, 0, -s * 0.6]);
      P(hp(s), G.cap(0.25, T * 0.45), m.primary, [0, 0, T * 0.5], [HP, 0, 0]);
      P(hp(s), G.tor(0.252, 0.01, 4, 32), m.dark, [0, 0, T * 0.5]);
      port(kn(s), [0, 0.15, 0], [0, 0, 0], 0.13);
      P(kn(s), G.cap(0.21, S * 0.5), m.secondary, [0, 0, S * 0.52], [HP, 0, 0]);
      P(kn(s), G.tor(0.2, 0.03, 8, 24), m.dark, [0, 0, S * 0.85]);
      piston(hp(s), [0, -0.22, T * 0.3], kn(s), [0, -0.2, S * 0.4], 0.04);
      P(ft(s), G.sph(0.22, 18, 12), m.dark, [0, 0.1, 0.06], [0, 0, 0], [1.05, 0.5, 1.35]);
      for (let i = 0; i < 3; i++) P(ft(s), G.cap(0.05, 0.08), m.primary, [(i - 1) * 0.1, 0.05, 0.32], [HP, 0, 0]);
    }
  },

  // ------------------------------------------------------------ TORQUE: white riot frame on a single drive wheel
  torque(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.7, 0.66, 0.48, 0.08), m.dark, [0, 0.04, -0.02]);
    A('core', P(C, plateGeo(0.78, 0.52, 0.12, 0.85), m.primary, [0, 0.16, 0.26], [-0.08, 0, 0]));
    for (const s of sides) {
      A('core', P(C, plateGeo(0.34, 0.36, 0.1, 0.8), m.primary, [s * 0.24, -0.06, 0.28], [-0.12, -s * 0.28, 0]));
      P(C, G.tor(0.09, 0.024, 6, 16, Math.PI * 1.3), m.glow, [s * 0.2, -0.08, 0.36], [0, 0, s > 0 ? 0.3 : 2.8]);
      P(C, plateGeo(0.5, 0.5, 0.08, 0.85), m.secondary, [s * 0.38, 0.06, -0.02], SIDE(s, 0.1));
    }
    if (m.decal) P(C, G.box(0.2, 0.1, 0.02, 0.005), m.decal, [0.18, 0.32, 0.33]);
    for (let i = 0; i < 3; i++) P(C, G.box(0.34 - i * 0.04, 0.09, 0.32, 0.02), m.dark, [0, -0.32 - i * 0.1, 0.02]);
    P(C, G.cyl(0.09, 0.09, 0.5, 10), m.chrome, [0, -0.4, -0.1]);
    for (const s of sides) piston(R.spine, [s * 0.14, 0, 0.1], C, [s * 0.22, -0.18, 0.12], 0.035);
    P(C, plateGeo(0.6, 0.5, 0.26, 0.9), m.secondary, [0, 0.1, -0.36]);
    greeble(c, C, [-0.26, 0.26, -0.15, 0.3], 0.5, 16, 41, [0, Math.PI, 0]);
    P(H, G.box(0.26, 0.24, 0.28, 0.08), m.dark, [0, 0.1, 0.02]);
    P(H, G.box(0.24, 0.05, 0.04, 0.015), m.eye, [0, 0.12, 0.16]);
    A('head', P(H, plateGeo(0.3, 0.3, 0.08, 0.8), m.primary, [0, 0.26, 0.0], UPF(0.1)));
    A('head', P(H, G.cyl(0.01, 0.01, 0.3, 6), m.chrome, [0.1, 0.38, -0.08]));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.05, 0); C.add(pad);
      P(pad, G.sph(0.16, 14, 10), m.joint, [0, -0.04, 0]);
      A(z, P(pad, plateGeo(0.66, 0.72, 0.1, 0.75), m.primary, [s * 0.24, 0.26, 0], SIDE(s, -0.35)));
      A(z, P(pad, plateGeo(0.6, 0.3, 0.08, 0.8), m.secondary, [s * 0.42, 0.5, 0], [-HPI, 0, -s * 0.62, 'ZYX']));
      P(pad, G.tor(0.08, 0.02, 6, 14, Math.PI * 1.3), m.glow, [s * 0.32, 0.2, 0.34], [0, 0, s > 0 ? 0.5 : 2.6]);
      P(sh(s), G.box(0.22, 0.24, U * 0.72, 0.04), m.secondary, [0, 0, U * 0.52]);
      P(el(s), G.box(0.3, 0.32, F * 0.85, 0.05), m.primary, [0, 0, F * 0.5]);
      A(z, P(el(s), plateGeo(F * 1.3, 1.04, 0.09, 0.9, 0.12), m.primary, [s * 0.22, 0.08, F * 0.42], SIDE(s)));
      P(el(s), G.box(0.1, 0.12, 0.3, 0.03), m.dark, [s * 0.16, 0, F * 0.42]);
      P(el(s), G.box(0.02, 0.6, 0.03, 0.006), m.glow, [s * 0.27, 0.08, F * 0.98]);
      P(el(s), G.box(0.015, 0.14, F * 0.5, 0.004), m.hazard, [s * 0.272, -0.36, F * 0.42]);
      bolts(el(s), [[s * 0.27, 0.48, F * -0.15], [s * 0.27, -0.4, F * -0.15], [s * 0.27, 0.48, F * 1.0], [s * 0.27, -0.4, F * 1.0]]);
      piston(sh(s), [0, -0.14, U * 0.25], el(s), [0, -0.18, F * 0.3], 0.04);
      fistBlock(c, s, m.dark, m.secondary, 0.32);
      P(hp(s), G.box(0.12, 0.2, T * 1.0, 0.03), m.dark, [0, 0, T * 0.5]);
      P(kn(s), G.box(0.1, 0.18, S * 1.0, 0.03), m.secondary, [0, 0, S * 0.5]);
      piston(R.body, [s * (c.d.hipW + 0.1), -0.05, -0.1], kn(s), [0, -0.1, S * 0.6], 0.04);
    }
    const wg = new THREE.Group(); wg.position.set(-c.d.stanceW, c.d.ankle, 0); R.footL.add(wg); R.wheel = wg;
    P(wg, G.tor(0.47, 0.11, 14, 48), m.rubber, [0, 0, 0], [0, HP, 0]);
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; P(wg, G.box(0.24, 0.04, 0.05, 0.01), m.rubber, [0, Math.sin(a) * 0.575, Math.cos(a) * 0.575], [a, 0, 0]); }
    P(wg, G.cyl(0.38, 0.38, 0.14, 32), m.dark, [0, 0, 0], [0, 0, HP]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P(wg, G.box(0.16, 0.06, 0.3, 0.01), m.secondary, [0, Math.sin(a) * 0.22, Math.cos(a) * 0.22], [a, 0, 0]); }
    P(wg, G.cyl(0.12, 0.12, 0.3, 14), m.chrome, [0, 0, 0], [0, 0, HP]);
    for (const x of [-0.08, 0.08]) P(wg, G.tor(0.3, 0.015, 4, 32), m.glow, [x, 0, 0], [0, HP, 0]);
    const fender = new THREE.Group(); fender.position.set(-c.d.stanceW, c.d.ankle, 0); R.footL.add(fender);
    P(fender, G.tor(0.68, 0.07, 6, 28, Math.PI * 0.75), m.primary, [0, 0, 0], [0, -HP, HP * 0.58]);
    P(fender, G.tor(0.68, 0.075, 4, 28, Math.PI * 0.3), m.hazard, [0.01, 0, 0], [0, -HP, HP * 1.1]);
    R.wheeled = true;
  },

  // ------------------------------------------------------------ SPECTRA: navy horned knight with neon panels
  spectra(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.76, 0.58, 0.5, 0.1), m.dark, [0, 0.08, -0.02]);
    A('core', P(C, plateGeo(0.86, 0.5, 0.14, 0.82, 0.24), m.primary, [0, 0.2, 0.22], [-0.15, 0, 0]));
    A('core', P(C, plateGeo(0.4, 0.34, 0.12, 0.8), m.secondary, [0.2, 0.08, 0.3], [-0.12, -0.25, 0]));
    A('core', P(C, plateGeo(0.4, 0.34, 0.12, 0.8), m.secondary, [-0.2, 0.08, 0.3], [-0.12, 0.25, 0]));
    P(C, plateGeo(0.18, 0.18, 0.03), m.glow, [-0.2, 0.08, 0.37], [-0.12, 0.25, 0]);
    P(C, plateGeo(0.1, 0.16, 0.03), m.glowPink, [0.17, 0.12, 0.37], [-0.12, -0.25, 0]);
    P(C, G.box(0.06, 0.06, 0.03, 0.01), m.glowArm, [0.27, 0.0, 0.36], [-0.12, -0.25, 0]);
    for (let i = 0; i < 3; i++) A('core', P(C, plateGeo(0.42 - i * 0.05, 0.11, 0.36 + i * 0.02, 0.9), m.secondary, [0, -0.22 - i * 0.12, 0.05]));
    P(C, plateGeo(0.68, 0.16, 0.5, 0.9), m.dark, [0, 0.44, 0]);
    P(C, plateGeo(0.62, 0.52, 0.28, 0.85), m.secondary, [0, 0.1, -0.38]);
    for (const s of sides) { P(C, G.box(0.06, 0.48, 0.34, 0.02), m.dark, [s * 0.2, 0.2, -0.56]); cable(C, [[s * 0.25, 0.4, -0.4], [s * 0.3, 0.55, -0.2], [s * 0.15, 0.55, 0.0]], 0.022); }
    greeble(c, C, [-0.25, 0.25, -0.15, 0.3], 0.54, 16, 51, [0, Math.PI, 0]);
    // beetle helmet: rounded dome, snout, forward-curving horns, red visor
    P(H, G.sph(0.21, 28, 20), m.primary, [0, 0.16, 0], [0, 0, 0], [1, 0.9, 1.15]);
    P(H, plateGeo(0.26, 0.16, 0.24, 0.8), m.dark, [0, 0.04, 0.12]);
    P(H, plateGeo(0.2, 0.1, 0.14, 0.7), m.secondary, [0, -0.02, 0.24], [0.3, 0, 0]);
    P(H, G.box(0.3, 0.05, 0.05, 0.015), m.eye, [0, 0.15, 0.22]);
    for (let i = 0; i < 3; i++) P(H, G.box(0.14, 0.012, 0.02, 0.004), m.joint, [0, 0.0 + i * 0.03, 0.31]);
    P(H, plateGeo(0.05, 0.36, 0.14, 0.6), m.dark, [0, 0.36, -0.02], [-HP, 0, 0]);
    for (const s of sides) {
      const hg = new THREE.Group(); hg.position.set(s * 0.15, 0.26, -0.02); hg.rotation.set(-0.5, 0, -s * 0.5); H.add(hg);
      A('head', P(hg, G.cone(0.055, 0.26, 10), m.secondary, [0, 0.12, 0]));
      P(hg, G.cone(0.035, 0.18, 8), m.glowArm, [0, 0.3, 0.06], [0.6, 0, 0]);
    }
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      P(pad, G.sph(0.17, 14, 10), m.joint, [0, -0.04, 0]);
      A(z, P(pad, G.sph(0.3, 28, 18), m.primary, [s * 0.1, 0.12, 0], [0, 0, 0], [1.1, 0.8, 1.15]));
      A(z, P(pad, plateGeo(0.5, 0.4, 0.1, 0.85), m.secondary, [s * 0.22, 0.0, 0], [-HPI, 0, -s * 0.55, 'ZYX']));
      P(pad, G.box(0.04, 0.04, 0.44, 0.01), s < 0 ? m.glowArm : m.glow, [s * 0.36, 0.06, 0], [0, 0, s * 0.55]);
      if (m.decal && s > 0) P(pad, G.box(0.02, 0.1, 0.2, 0.004), m.decal, [0.42, 0.18, 0], [0, 0, 0.6]);
      P(sh(s), plateGeo(0.22, U * 0.76, 0.22, 0.9), m.secondary, [0, 0, U * 0.52], UPF());
      if (s < 0) {
        A(z, P(el(s), G.cap(0.24, F * 0.55), m.glowArm, [0, 0, F * 0.5], [HP, 0, 0], [1, 1, 1.05]));
        for (const k of [0.15, 0.5, 0.85]) P(el(s), G.tor(0.245, 0.03, 8, 24), m.dark, [0, 0, F * k]);
        fistBlock(c, s, m.glowArm, m.dark, 0.36);
      } else {
        P(el(s), G.box(0.28, 0.28, F * 0.86, 0.06), m.primary, [0, 0, F * 0.5]);
        A(z, P(el(s), plateGeo(F * 0.6, 0.2, 0.06), m.glowArm, [s * 0.16, 0, F * 0.5], SIDE(s)));
        fistBlock(c, s, m.primary, m.secondary, 0.3);
      }
      piston(sh(s), [0, -0.12, U * 0.25], el(s), [0, -0.16, F * 0.25], 0.035);
      P(hp(s), G.box(0.24, 0.26, T * 0.85, 0.06), m.dark, [0, 0, T * 0.5]);
      P(hp(s), plateGeo(0.32, T * 0.8, 0.12, 0.8), m.primary, [0, 0.15, T * 0.5], UPF());
      P(hp(s), G.box(0.12, 0.03, T * 0.45, 0.01), s > 0 ? m.glowLegL : m.glowLegR, [0, 0.22, T * 0.5]);
      P(kn(s), plateGeo(0.26, 0.26, 0.1, 0.8), m.primary, [0, 0.17, 0.02], UPF(0.3));
      P(kn(s), G.box(0.3, 0.32, S * 0.85, 0.06), m.secondary, [0, 0.02, S * 0.5]);
      P(kn(s), plateGeo(0.32, S * 0.7, 0.08, 0.75), m.primary, [0, 0.2, S * 0.48], UPF());
      P(kn(s), G.box(0.16, 0.03, S * 0.5, 0.01), s > 0 ? m.glowLegL : m.glowLegR, [0, 0.25, S * 0.52]);
      piston(hp(s), [0, -0.16, T * 0.3], kn(s), [0, -0.2, S * 0.35], 0.035);
      P(ft(s), G.box(0.3, 0.15, 0.5, 0.05), m.dark, [0, 0.075, 0.1]);
      P(ft(s), plateGeo(0.28, 0.24, 0.07, 0.8), m.primary, [0, 0.17, 0.22], UPF(0.25));
      P(ft(s), G.cyl(0.15, 0.15, 0.11, 20), m.rubber, [0, 0.15, -0.18], [0, 0, HP]);
      P(ft(s), G.cyl(0.07, 0.07, 0.13, 10), m.chrome, [0, 0.15, -0.18], [0, 0, HP]);
    }
  },

  // ------------------------------------------------------------ BELLJAR: blast dome, quilted arms, clear guards, one tread
  belljar(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.68, 0.52, 0.46, 0.12), m.primary, [0, 0.04, 0]);
    A('core', P(C, plateGeo(0.3, 0.2, 0.06), m.secondary, [0.16, 0.08, 0.25]));
    A('core', P(C, plateGeo(0.18, 0.14, 0.06), m.tertiary, [-0.18, -0.08, 0.25]));
    A('core', P(C, plateGeo(0.5, 0.18, 0.08, 0.85), m.primary, [0, 0.3, 0.2], [-0.4, 0, 0]));
    for (const s of sides) { P(C, G.box(0.07, 0.62, 0.52, 0.02), m.dark, [s * 0.15, 0.02, 0], [0, 0, s * 0.35]); P(C, G.box(0.09, 0.06, 0.04, 0.01), m.chrome, [s * 0.2, 0.18, 0.26]); }
    for (let i = 0; i < 5; i++) P(C, G.tor(0.21 - (i % 2) * 0.02, 0.05, 8, 22), m.rubber, [0, -0.26 - i * 0.065, 0], [HP, 0, 0]);
    P(C, plateGeo(0.5, 0.42, 0.22, 0.9), m.secondary, [0, 0.0, -0.34]);
    greeble(c, C, [-0.2, 0.2, -0.15, 0.15], 0.46, 14, 61, [0, Math.PI, 0]);
    for (const s of sides) { P(C, G.cyl(0.035, 0.035, 0.34, 8), m.chrome, [s * 0.12, 0.38, 0.02]); cable(C, [[s * 0.2, 0.2, -0.3], [s * 0.38, 0.32, -0.25], [s * 0.5, 0.25, -0.1]], 0.028); cable(C, [[s * 0.1, 0.4, -0.1], [s * 0.2, 0.2, -0.32], [s * 0.15, -0.1, -0.4]], 0.02); }
    const pts = [[0.001, 0], [0.48, 0.0], [0.64, 0.03], [0.68, 0.08], [0.66, 0.14], [0.58, 0.22], [0.44, 0.29], [0.22, 0.33], [0.001, 0.34]].map(p => new THREE.Vector2(p[0], p[1]));
    A('head', P(H, new THREE.LatheGeometry(pts, 56), m.primary, [0, 0.2, -0.02]));
    P(H, G.tor(0.66, 0.025, 6, 56), m.dark, [0, 0.27, -0.02], [HP, 0, 0]);
    P(H, G.tor(0.5, 0.012, 4, 56), m.dark, [0, 0.45, -0.02], [HP, 0, 0]);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; P(H, G.cyl(0.018, 0.018, 0.02, 6), m.chrome, [Math.cos(a) * 0.64, 0.27, Math.sin(a) * 0.64 - 0.02]); }
    P(H, G.box(0.14, 0.04, 0.02, 0.01), m.tertiary, [0.1, 0.4, 0.5], [-0.45, 0.2, 0]);
    P(H, G.box(0.22, 0.03, 0.02, 0.01), m.secondary, [-0.28, 0.39, 0.46], [-0.45, -0.5, 0]);
    P(H, G.box(0.36, 0.2, 0.3, 0.05), m.dark, [0, 0.08, 0.08]);
    P(H, G.box(0.2, 0.08, 0.04, 0.02), m.glass, [0, 0.1, 0.24]);
    P(H, G.sph(0.03, 10, 8), m.eye, [0.02, 0.1, 0.26]);
    for (let i = 0; i < 4; i++) P(H, G.box(0.12, 0.012, 0.02, 0.004), m.joint, [0.12, 0.04 + i * 0.03, 0.235]);
    for (const s of sides) cable(H, [[s * 0.2, 0.12, 0.1], [s * 0.35, -0.05, 0.12], [s * 0.3, -0.25, 0.1]], 0.015);
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      A(z, P(pad, G.sph(0.32, 24, 18), m.fabric, [s * 0.08, 0.06, 0], [0, 0, 0], [1, 0.82, 1.05]));
      A(z, P(pad, plateGeo(0.58, 0.44, 0.03, 0.85), m.clear, [s * 0.36, 0.08, 0], SIDE(s, 0.18)));
      A(z, P(pad, plateGeo(0.38, 0.52, 0.03, 0.9), m.clear, [s * 0.16, 0.36, 0], [-HPI, 0, -s * 0.3, 'ZYX']));
      P(pad, G.box(0.06, 0.06, 0.52, 0.02), m.dark, [s * 0.14, 0.27, 0], [0, 0, s * 0.3]);
      for (const zz of [-0.18, 0.18]) P(pad, G.box(0.03, 0.05, 0.03, 0.01), m.chrome, [s * 0.4, 0.3, zz]);
      P(sh(s), G.cap(0.2, U * 0.48), m.fabric, [0, 0, U * 0.5], [HP, 0, 0]);
      for (const k of [0.2, 0.8]) P(sh(s), G.tor(0.2, 0.025, 6, 20), m.dark, [0, 0, U * k]);
      P(el(s), G.cap(0.19, F * 0.5), m.fabric, [0, 0, F * 0.45], [HP, 0, 0]);
      A(z, P(el(s), plateGeo(F * 0.42, 0.16, 0.04), m.tertiary, [s * 0.18, 0.05, F * 0.45], SIDE(s)));
      P(el(s), G.tor(0.19, 0.04, 8, 22), m.dark, [0, 0, F * 0.86]);
      fistBlock(c, s, m.brown, m.brown, 0.36);
      piston(sh(s), [0, -0.16, U * 0.25], el(s), [0, -0.17, F * 0.25], 0.035);
      P(hp(s), G.box(0.36, 0.4, T * 0.86, 0.1), m.primary, [0, 0, T * 0.5]);
      P(hp(s), plateGeo(0.44, T * 0.84, 0.12, 0.85, 0.22), m.primary, [0, 0.22, T * 0.5], UPF());
      P(hp(s), plateGeo(0.24, 0.2, 0.03), s > 0 ? m.secondary : m.tertiary, [s * 0.04, 0.29, T * 0.4], UPF());
      P(hp(s), plateGeo(0.12, 0.1, 0.03), m.tertiary, [s * -0.1, 0.29, T * 0.68], UPF());
      P(kn(s), plateGeo(0.3, 0.26, 0.1, 0.8), m.dark, [0, 0.16, 0.02], UPF(0.25));
      P(kn(s), G.cap(0.18, S * 0.5), m.fabric, [0, 0, S * 0.5], [HP, 0, 0]);
      piston(hp(s), [s * 0.2, -0.1, T * 0.3], kn(s), [s * 0.17, -0.08, S * 0.35], 0.04);
      if (s > 0) {
        P(kn(s), plateGeo(0.36, S * 0.95, 0.03, 0.8), m.clear, [0, 0.24, S * 0.55], UPF(0.08));
        P(ft(s), G.box(0.32, 0.18, 0.52, 0.06), m.brown, [0, 0.09, 0.08]);
        P(ft(s), G.box(0.3, 0.06, 0.2, 0.02), m.dark, [0, 0.2, 0.24]);
        P(ft(s), G.box(0.34, 0.04, 0.56, 0.01), m.rubber, [0, 0.02, 0.08]);
      } else {
        P(ft(s), G.box(0.34, 0.24, 0.68, 0.1), m.rubber, [0, 0.12, 0.06]);
        for (let i = 0; i < 4; i++) P(ft(s), G.cyl(0.09, 0.09, 0.36, 14), m.joint, [0, 0.12, -0.2 + i * 0.17], [0, 0, HP]);
        for (let i = 0; i < 12; i++) P(ft(s), G.box(0.36, 0.03, 0.04, 0.005), m.dark, [0, 0.005, -0.27 + i * 0.058]);
        P(ft(s), plateGeo(0.24, 0.46, 0.08), m.secondary, [0, 0.27, 0.06], UPF());
      }
    }
  },

  // ------------------------------------------------------------ WARDEN OD-9: olive plate over a skeletal frame, claws, sword
  warden(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.62, 0.5, 0.44, 0.06), m.dark, [0, 0.12, -0.02]);
    A('core', P(C, plateGeo(0.8, 0.54, 0.12, 0.72, 0.2), m.primary, [0, 0.2, 0.22], [-0.1, 0, 0]));
    P(C, plateGeo(0.46, 0.42, 0.38, 0.8), m.dark, [0, -0.3, 0]);
    for (const s of sides) {
      A('core', P(C, plateGeo(0.36, 0.3, 0.1, 0.7), m.secondary, [s * 0.21, 0.12, 0.3], [-0.1, -s * 0.32, 0]));
      P(C, G.box(0.026, 0.28, 0.02, 0.006), m.glow, [s * 0.1, 0.2, 0.33], [0, 0, s * 0.6]);
      P(C, G.box(0.026, 0.2, 0.02, 0.006), m.glow, [s * 0.2, -0.12, 0.25], [0, 0, -s * 0.3]);
      A('core', P(C, plateGeo(0.18, 0.14, 0.1, 0.7), m.primary, [s * 0.12, -0.3, 0.2]));
      for (let k = 0; k < 2; k++) P(C, G.cyl(0.02, 0.02, 0.36, 6), m.chrome, [s * (0.08 + k * 0.08), -0.36, 0.12], [0.1, 0, 0]);
      P(C, plateGeo(0.44, 0.44, 0.08, 0.8), m.secondary, [s * 0.34, 0.12, -0.04], SIDE(s, 0.12));
    }
    P(C, G.box(0.026, 0.32, 0.02, 0.006), m.glow, [0, -0.04, 0.31]);
    P(C, plateGeo(0.56, 0.42, 0.24, 0.85), m.secondary, [0, 0.12, -0.34]);
    greeble(c, C, [-0.24, 0.24, -0.1, 0.3], 0.47, 18, 71, [0, Math.PI, 0]);
    for (const s of sides) P(R.body, plateGeo(0.22, 0.34, 0.06, 0.6), m.primary, [s * 0.15, -0.2, 0.22], [0.15, 0, 0]);
    P(H, G.box(0.3, 0.32, 0.36, 0.12), m.primary, [0, 0.16, 0.0]);
    P(H, plateGeo(0.22, 0.24, 0.06, 0.7), m.dark, [0, 0.13, 0.18]);
    P(H, G.sph(0.045, 12, 10), m.eye, [0, 0.18, 0.22]);
    P(H, G.box(0.02, 0.24, 0.02, 0.005), m.glow, [0, 0.16, 0.215]);
    for (const s of sides) { P(H, G.box(0.02, 0.16, 0.02, 0.005), m.glow, [s * 0.08, 0.1, 0.21], [0, 0, s * 0.4]); A('head', P(H, G.cyl(0.014, 0.014, 0.4, 6), m.dark, [s * 0.08, 0.46, -0.08], [-0.15, 0, -s * 0.08])); P(H, plateGeo(0.3, 0.26, 0.05, 0.8), m.secondary, [s * 0.16, 0.16, 0.0], SIDE(s)); P(H, G.tor(0.05, 0.012, 4, 14), m.chrome, [s * 0.19, 0.12, 0.05], [0, HP, 0]); }
    A('head', P(H, plateGeo(0.34, 0.24, 0.08, 0.8), m.secondary, [0, 0.33, -0.04], UPF(0.15)));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.05, 0); C.add(pad);
      P(pad, G.sph(0.15, 14, 10), m.joint, [0, -0.05, 0]);
      A(z, P(pad, plateGeo(0.6, 0.54, 0.4, 0.75, 0.24), m.primary, [s * 0.12, 0.12, 0], SIDE(s, -0.12)));
      A(z, P(pad, plateGeo(0.46, 0.3, 0.1, 0.8), m.secondary, [s * 0.12, 0.42, 0], [-HPI, 0, -s * 0.35, 'ZYX']));
      P(pad, G.box(0.02, 0.02, 0.5, 0.005), m.glow, [s * 0.34, 0.26, 0], [0, 0, s * 0.12]);
      if (m.decal) P(pad, G.box(0.02, 0.1, 0.2, 0.004), m.decal, [s * 0.33, 0.1, 0], [0, 0, -s * 0.12]);
      for (const y of [0.06, -0.06]) { P(sh(s), G.cyl(0.03, 0.03, U * 0.9, 6), m.dark, [0, y, U * 0.5], [HP, 0, 0]); P(el(s), G.cyl(0.028, 0.028, F * 0.9, 6), m.dark, [s * 0.05, y, F * 0.48], [HP, 0, 0]); }
      P(sh(s), plateGeo(0.2, U * 0.45, 0.18, 0.8), m.primary, [0, 0.03, U * 0.42], UPF());
      A(z, P(el(s), plateGeo(0.18, F * 0.5, 0.18, 0.7), m.primary, [s * 0.03, 0.06, F * 0.35], UPF()));
      P(el(s), G.box(0.015, 0.015, F * 0.4, 0.004), m.glow, [s * 0.12, 0.17, F * 0.35]);
      P(el(s), G.cyl(0.07, 0.07, 0.12, 10), m.joint, [0, 0, F * 0.92], [HP, 0, 0]);
      for (let i = 0; i < 4; i++) P(el(s), G.box(0.12, 0.02, 0.04, 0.005), m.joint, [s * 0.03, -0.08, F * (0.2 + i * 0.18)]);
      piston(sh(s), [0, -0.1, U * 0.15], el(s), [0, -0.1, F * 0.55], 0.032);
      piston(sh(s), [s * 0.08, 0.08, U * 0.3], el(s), [s * 0.08, 0.08, F * 0.6], 0.026);
      fistClaw(c, s, m.primary, 0.26, 3);
      P(hp(s), G.box(0.26, 0.28, T * 0.82, 0.05), m.dark, [0, 0.02, T * 0.5]);
      P(hp(s), plateGeo(0.42, T * 0.86, 0.14, 0.7, 0.22), m.primary, [0, 0.18, T * 0.5], UPF());
      P(hp(s), plateGeo(0.2, T * 0.4, 0.04, 0.8), m.secondary, [s * 0.04, 0.26, T * 0.46], UPF());
      P(hp(s), G.box(0.03, 0.03, 0.08, 0.008), m.secondary, [s * 0.1, 0.27, T * 0.7]);
      P(kn(s), G.sph(0.16, 14, 10), m.dark);
      P(kn(s), G.box(0.22, 0.24, S * 0.85, 0.03), m.dark, [0, 0, S * 0.5]);
      P(kn(s), plateGeo(0.5, S * 0.86, 0.16, 0.62, 0.22), m.primary, [0, 0.16, S * 0.46], [-HPI + 0.06, Math.PI, 0]);
      P(kn(s), plateGeo(0.3, 0.2, 0.1, 0.8), m.secondary, [0, 0.22, 0.05], UPF(0.35));
      P(kn(s), G.box(0.015, 0.015, S * 0.4, 0.004), m.glow, [0, 0.25, S * 0.45]);
      piston(hp(s), [0, -0.2, T * 0.3], kn(s), [0, -0.18, S * 0.3], 0.04);
      P(ft(s), G.box(0.42, 0.24, 0.62, 0.06), m.dark, [0, 0.12, 0.08]);
      P(ft(s), plateGeo(0.4, 0.34, 0.12, 0.8), m.primary, [0, 0.27, 0.22], UPF(0.35));
      P(ft(s), G.box(0.44, 0.05, 0.66, 0.01), m.rubber, [0, 0.025, 0.08]);
    }
  },

  // ------------------------------------------------------------ MIRE: hunched dark hulk, boulder shoulders, claws
  mire(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.sph(0.5, 36, 26), m.primary, [0, 0.06, 0], [0, 0, 0], [1.15, 0.92, 1.0]);
    P(C, G.sph(0.32, 22, 16), m.dark, [0, -0.42, 0.04]);
    const rng = mulberry32(7);
    for (let i = 0; i < 14; i++) {
      const a = -1.4 + i * 0.21, y = (rng() - 0.4) * 0.6;
      const piece = P(C, plateGeo(0.2 + rng() * 0.14, 0.16 + rng() * 0.12, 0.06, 0.2 + rng() * 0.5, 0.1), i % 3 ? m.secondary : m.primary, [Math.sin(a) * 0.53, y, Math.cos(a) * 0.46], [rng() * 0.6 - 0.3, a, rng() * 1.2 - 0.6]);
      if (i % 2) A('core', piece);
    }
    for (let i = 0; i < 3; i++) P(C, G.box(0.05, 0.3, 0.06, 0.01), m.glow, [-0.25 + i * 0.05, 0.1 - i * 0.06, 0.46], [0, -0.4, 0.5]);
    for (let i = 0; i < 5; i++) P(C, G.cone(0.05, 0.32, 6), m.dark, [(i - 2) * 0.16, 0.44, -0.25], [-0.7, 0, (i - 2) * 0.22]);
    greeble(c, C, [-0.3, 0.3, -0.25, 0.2], 0.55, 16, 81, [0, Math.PI, 0]);
    P(H, G.box(0.32, 0.22, 0.28, 0.06), m.dark, [0, 0.0, 0.04]);
    P(H, G.sph(0.075, 14, 10), m.eye, [0, 0.0, 0.18]);
    P(H, G.tor(0.09, 0.02, 6, 16), m.joint, [0, 0.0, 0.17]);
    A('head', P(H, plateGeo(0.44, 0.34, 0.12, 0.6), m.secondary, [0, 0.13, 0.0], UPF(0.35)));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      A(z, P(pad, G.sph(0.46, 32, 24), m.primary, [s * 0.04, 0.16, 0], [0, 0, 0], [1, 0.9, 1.05]));
      for (let i = 0; i < 6; i++) A(z, P(pad, plateGeo(0.24, 0.18, 0.06, 0.3, 0.1), m.secondary, [s * (0.16 + i * 0.05), 0.42 - i * 0.1, 0.32 - i * 0.12], [0.4, s * (0.4 + i * 0.25), s * 0.3]));
      P(pad, G.box(0.05, 0.03, 0.4, 0.01), m.glow, [s * 0.3, 0.42, 0.0], [0, 0, s * 0.6]);
      for (let i = 0; i < 5; i++) P(sh(s), G.tor(0.17, 0.035, 8, 18), m.joint, [0, 0, U * (0.18 + i * 0.15)]);
      A(z, P(sh(s), plateGeo(0.28, U * 0.5, 0.1, 0.5), m.secondary, [0, 0.16, U * 0.5], UPF()));
      P(el(s), G.box(0.32, 0.34, F * 0.88, 0.06), m.primary, [0, 0, F * 0.48]);
      for (let i = 0; i < 4; i++) A(z, P(el(s), plateGeo(0.1, 0.24, 0.16, 0.25, 0.08), m.secondary, [s * 0.18, 0.08, F * (0.18 + i * 0.22)], [0.5, 0, s * 0.3]));
      P(el(s), G.box(0.03, 0.04, F * 0.5, 0.008), m.glow, [s * 0.17, -0.14, F * 0.5]);
      piston(sh(s), [0, -0.14, U * 0.2], el(s), [0, -0.2, F * 0.3], 0.045);
      fistClaw(c, s, m.secondary, 0.32, 3);
      P(hp(s), G.box(0.36, 0.36, T * 0.85, 0.05), m.secondary, [0, 0, T * 0.5]);
      P(hp(s), plateGeo(0.4, T * 0.7, 0.1, 0.5), m.primary, [0, 0.2, T * 0.45], UPF());
      P(kn(s), G.box(0.36, 0.38, S * 0.85, 0.05), m.primary, [0, 0.02, S * 0.5]);
      for (let i = 0; i < 3; i++) P(kn(s), plateGeo(0.12, 0.22, 0.08, 0.2, 0.06), m.dark, [0, 0.24, S * (0.25 + i * 0.25)], [-HPI - 0.5, 0, 0]);
      piston(hp(s), [0, -0.18, T * 0.3], kn(s), [0, -0.2, S * 0.4], 0.04);
      P(ft(s), G.box(0.34, 0.16, 0.34, 0.04), m.dark, [0, 0.08, 0]);
      for (let i = 0; i < 3; i++) P(ft(s), G.cone(0.055, 0.3, 6), m.secondary, [-0.11 + i * 0.11, 0.06, 0.28], [HP, 0, 0]);
    }
  },
};

// ---------------------------------------------------------------- two-bone IK (law of cosines + pole)
const _ikS = new THREE.Vector3(), _ikD = new THREE.Vector3(), _ikP = new THREE.Vector3(), _ikE = new THREE.Vector3(), _ikT = new THREE.Vector3();
function solveIK(a, b, L1, L2, target, pole, up) {
  a.updateWorldMatrix(true, false);
  a.getWorldPosition(_ikS);
  _ikD.subVectors(target, _ikS);
  let len = _ikD.length();
  const maxL = (L1 + L2) * 0.999;
  len = clamp(len, Math.abs(L1 - L2) + 0.02, maxL);
  _ikD.normalize();
  const x = (L1 * L1 - L2 * L2 + len * len) / (2 * len);
  const h = Math.sqrt(Math.max(0, L1 * L1 - x * x));
  _ikP.copy(pole).addScaledVector(_ikD, -pole.dot(_ikD));
  if (_ikP.lengthSq() < 1e-6) _ikP.set(0, -1, 0); _ikP.normalize();
  _ikE.copy(_ikS).addScaledVector(_ikD, x).addScaledVector(_ikP, h);
  _ikT.copy(_ikS).addScaledVector(_ikD, len);
  a.up.copy(up); a.lookAt(_ikE); a.updateMatrixWorld(true);
  b.up.copy(up); b.lookAt(_ikT); b.updateMatrixWorld(true);
}

function setGlow(R, k) {
  const ms = new Set(); R.glows.forEach(g => ms.add(g.material));
  ms.forEach(mm => { if (mm.userData.base == null) mm.userData.base = mm.emissiveIntensity; mm.emissiveIntensity = mm.userData.base * k; });
}
function setEnvIntensity(R, v) { for (const k in R.mats) R.mats[k].envMapIntensity = v; }

// pose a robot statically (dormant hangar mechs)
function poseStatic(R, kind = 'idle') {
  const d = R.dims, sc = R.root.scale.x;
  R.root.updateMatrixWorld(true);
  const up = V3(0, 1, 0), fwd = V3(0, 0, 1).applyQuaternion(R.root.quaternion);
  for (const s of [1, -1]) {
    const tgt = kind === 'dormant' ? V3(s * (d.shX + 0.1), d.hipH + 0.15, 0.3) : V3(s * 0.26, d.hipH + d.spineY + d.chestY + d.shY, 0.58);
    R.root.localToWorld(tgt);
    solveIK(s > 0 ? R.shL : R.shR, s > 0 ? R.elL : R.elR, d.upper * sc, d.fore * sc, tgt, V3(s, -1, -0.4).applyQuaternion(R.root.quaternion), up);
  }
  for (const s of [1, -1]) {
    const foot = s > 0 ? R.footL : R.footR; foot.position.set(s * d.stanceW, 0, s * 0.1);
    const ank = V3(s * d.stanceW, d.ankle, s * 0.1); R.root.localToWorld(ank);
    solveIK(s > 0 ? R.hipL : R.hipR, s > 0 ? R.knL : R.knR, d.thigh * sc, d.shin * sc, ank, fwd, fwd);
  }
  updatePistons(R);
}

const POSE_JOINTS = ['body', 'spine', 'chest', 'neck', 'shL', 'shR', 'elL', 'elR', 'hipL', 'hipR', 'knL', 'knR', 'footL', 'footR'];
function copyPose(src, dst) {
  for (const k of POSE_JOINTS) { dst[k].position.copy(src[k].position); dst[k].quaternion.copy(src[k].quaternion); }
  dst.root.quaternion.copy(src.root.quaternion); dst.root.scale.copy(src.root.scale);
  if (src.wheel && dst.wheel) dst.wheel.rotation.x = src.wheel.rotation.x;
  for (const s of [1, -1]) { dst.blades[s].visible = src.blades[s].visible; dst.blades[s].scale.z = src.blades[s].scale.z; }
  dst.root.updateMatrixWorld(true); updatePistons(dst);
}
