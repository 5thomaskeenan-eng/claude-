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
    build: 'bulwark',
    persona: { range: 0.92, body: 0.3, aggr: 0.9, combos: [['jab', 'cross'], ['jab', 'jab', 'cross'], ['cross', 'hook'], ['hook', 'upper'], ['jab', 'body:cross']] },
  },
  {
    id: 'onyx', name: 'Onyx', cls: 'Brawler · Gorilla frame',
    bio: 'Built for deep-sea salvage, retired for punching. Round charcoal hull, arms that hang past its knees, and a sensor head buried in its collar where you can barely reach it.',
    stats: { power: 9, speed: 5, armor: 7, reach: 9, stamina: 6 },
    colors: { primary: 0x3d4044, secondary: 0x33363a, dark: 0x1a1b1e, accent: 0xd9e0e4, eye: 0xff6a1f },
    dims: { hipH: 1.0, hipW: 0.3, thigh: 0.5, shin: 0.5, ankle: 0.14, spineY: 0.14, chestY: 0.52, shX: 0.82, shY: 0.2, upper: 0.7, fore: 0.8, neckY: 0.44, neckZ: 0.16, stanceW: 0.45, hunch: 0.2 },
    build: 'onyx',
    persona: { range: 1.0, body: 0.4, aggr: 1.1, combos: [['hook', 'hook'], ['jab', 'hook'], ['body:hook', 'upper'], ['cross', 'hook', 'upper'], ['jab', 'cross']] },
  },
  {
    id: 'torque', name: 'Torque', cls: 'Rush-down · Monowheel frame',
    bio: 'Riot-control unit that traded its legs for a single drive wheel. Carries two door-sized forearm shields and closes distance faster than anything else in the league.',
    stats: { power: 6, speed: 9, armor: 7, reach: 6, stamina: 7 },
    colors: { primary: 0xe3e4df, secondary: 0x9a9e9a, dark: 0x2a2c2e, accent: 0xd4ff1e, eye: 0xd4ff1e },
    dims: { hipH: 1.2, hipW: 0.17, thigh: 0.32, shin: 0.32, ankle: 0.58, spineY: 0.16, chestY: 0.48, shX: 0.66, shY: 0.26, upper: 0.56, fore: 0.6, neckY: 0.44, neckZ: 0.06, stanceW: 0.13, hunch: 0.06, wheeled: true, footFwd: 0 },
    build: 'torque',
    persona: { range: 0.95, body: 0.3, aggr: 1.15, combos: [['jab', 'jab', 'cross'], ['jab', 'hook'], ['cross', 'hook', 'cross'], ['body:jab', 'hook'], ['jab', 'cross', 'upper']] },
  },
  {
    id: 'spectra', name: 'Spectra', cls: 'Showman · Outfighter',
    bio: 'A former arena mascot reflashed for combat. Horned helmet, a molten gauntlet on the right hand, and neon panels that light up like a pinball table. Never stops throwing the jab.',
    stats: { power: 5, speed: 9, armor: 5, reach: 7, stamina: 8 },
    colors: { primary: 0x1f2c54, secondary: 0x2c3d6e, dark: 0x111420, accent: 0x34ff6e, eye: 0xff3048, glowArm: 0xff4410, glowLegL: 0x2f6bff, glowLegR: 0xa04dff, glowPink: 0xff2fb4 },
    dims: { hipH: 1.2, hipW: 0.23, thigh: 0.6, shin: 0.62, ankle: 0.14, spineY: 0.16, chestY: 0.46, shX: 0.62, shY: 0.25, upper: 0.56, fore: 0.6, neckY: 0.44, neckZ: 0.05, stanceW: 0.34, hunch: 0.02 },
    build: 'spectra',
    persona: { range: 1.05, body: 0.25, aggr: 1.0, combos: [['jab', 'jab'], ['jab', 'jab', 'cross'], ['jab', 'cross', 'hook'], ['jab', 'body:jab', 'cross'], ['jab', 'cross', 'jab', 'upper']] },
  },
  {
    id: 'belljar', name: 'Belljar', cls: 'Tank · Counterpuncher',
    bio: 'A bomb-disposal unit that kept its blast dome. Quilted padding, clear riot guards and a tank tread for a right foot. Patient, patched together, and waiting for you to miss.',
    stats: { power: 7, speed: 5, armor: 8, reach: 6, stamina: 8 },
    colors: { primary: 0x8e918d, secondary: 0x6c7a3a, tertiary: 0x4a6f9e, dark: 0x2a2b29, brown: 0x6a4630, accent: 0x84a9d6, eye: 0xff2a1a },
    dims: { hipH: 1.2, hipW: 0.28, thigh: 0.62, shin: 0.58, ankle: 0.15, spineY: 0.16, chestY: 0.4, shX: 0.62, shY: 0.2, upper: 0.54, fore: 0.58, neckY: 0.34, neckZ: 0.02, stanceW: 0.4, hunch: 0.02 },
    build: 'belljar',
    persona: { range: 0.95, body: 0.35, aggr: 0.7, counter: 1, combos: [['jab', 'cross'], ['cross', 'hook'], ['body:hook', 'hook'], ['upper', 'cross'], ['jab', 'upper']] },
  },
  {
    id: 'warden', name: 'Warden OD-9', cls: 'Technician · Military frame',
    bio: 'Decommissioned perimeter unit still running its targeting firmware. Olive plate over a skeletal frame, a single orange eye, and claws that never quite let go of a grudge.',
    stats: { power: 7, speed: 7, armor: 6, reach: 8, stamina: 7 },
    colors: { primary: 0x5f6b28, secondary: 0x4a5420, dark: 0x16181a, accent: 0xeef4ff, eye: 0xff6a12 },
    dims: { hipH: 1.26, hipW: 0.24, thigh: 0.64, shin: 0.64, ankle: 0.16, spineY: 0.16, chestY: 0.44, shX: 0.66, shY: 0.25, upper: 0.6, fore: 0.64, neckY: 0.42, neckZ: 0.06, stanceW: 0.36, hunch: 0.05 },
    build: 'warden',
    persona: { range: 1.0, body: 0.35, aggr: 1.0, combos: [['jab', 'cross', 'hook'], ['jab', 'body:cross', 'hook'], ['jab', 'cross', 'upper'], ['hook', 'cross'], ['jab', 'jab', 'cross', 'hook']] },
  },
  {
    id: 'mire', name: 'Mire', cls: 'Swarmer · Hunchback',
    bio: 'Nobody admits to building it. Mire fights bent double behind two boulder shoulders, swings claws from the floor and only seems to get faster the more plating it loses.',
    stats: { power: 8, speed: 7, armor: 5, reach: 8, stamina: 7 },
    colors: { primary: 0x434b39, secondary: 0x2f3529, dark: 0x141612, accent: 0xb9c84a, eye: 0xf2ff2a },
    dims: { hipH: 1.04, hipW: 0.28, thigh: 0.54, shin: 0.54, ankle: 0.13, spineY: 0.12, chestY: 0.46, shX: 0.78, shY: 0.22, upper: 0.66, fore: 0.76, neckY: 0.3, neckZ: 0.32, stanceW: 0.46, hunch: 0.34 },
    build: 'mire',
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

function makeRobotMats(c, dormant) {
  const paint = (color, set = TEX.pA, o = {}) => applyGrime(new THREE.MeshPhysicalMaterial(Object.assign({
    color, map: set.map, normalMap: set.normal, normalScale: new THREE.Vector2(0.9, 0.9), metalness: 1, metalnessMap: set.metal,
    roughness: 0.62, roughnessMap: TEX.grunge, clearcoat: 0.35, clearcoatRoughness: 0.45,
  }, o)));
  const metal = (color, o = {}) => applyGrime(new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.88, roughness: 0.42, roughnessMap: TEX.grunge, map: TEX.pC.map, normalMap: TEX.pC.normal, normalScale: new THREE.Vector2(0.6, 0.6) }, o)));
  const glow = (color, i = 2.6) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: dormant ? 0x000000 : color, emissiveIntensity: i, roughness: 0.35, metalness: 0.2 });
  const m = {
    primary: paint(c.primary, TEX.pA), secondary: paint(c.secondary, TEX.pB), dark: metal(c.dark),
    joint: new THREE.MeshStandardMaterial({ color: 0x1c1e20, metalness: 0.92, roughness: 0.32, roughnessMap: TEX.grunge }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xd4d8db, metalness: 1, roughness: 0.14 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0f0f0f, roughness: 0.93, metalness: 0, normalMap: TEX.pC.normal, normalScale: new THREE.Vector2(0.4, 0.4) }),
    cable: new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.6, metalness: 0.1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x07090c, metalness: 0.3, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02 }),
    clear: new THREE.MeshPhysicalMaterial({ color: 0xcfe2ea, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
    glow: glow(c.accent, 4.2), eye: glow(c.eye, 9),
  };
  if (c.tertiary) m.tertiary = paint(c.tertiary, TEX.pB);
  if (c.brown) m.brown = applyGrime(new THREE.MeshStandardMaterial({ color: c.brown, roughness: 0.78, metalness: 0.05, map: TEX.pQ.map, normalMap: TEX.pQ.normal, normalScale: new THREE.Vector2(0.5, 0.5) }));
  m.fabric = applyGrime(new THREE.MeshStandardMaterial({ color: c.primary, roughness: 0.92, metalness: 0, map: TEX.pQ.map, normalMap: TEX.pQ.normal, normalScale: new THREE.Vector2(1.3, 1.3) }));
  if (c.glowArm) { m.glowArm = glow(c.glowArm, 3.2); m.glowLegL = glow(c.glowLegL, 4); m.glowLegR = glow(c.glowLegR, 4); m.glowPink = glow(c.glowPink, 4); }
  m.clear.userData.noShadow = true;
  return m;
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
  const m = makeRobotMats(opts.colors || def.colors, opts.dormant);
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
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(pos[0], pos[1], pos[2]); mesh.rotation.set(rot[0], rot[1], rot[2]);
    if (scl) mesh.scale.set(scl[0], scl[1], scl[2]);
    mesh.castShadow = !mat.userData.noShadow; mesh.receiveShadow = true; parent.add(mesh); R.meshes.push(mesh);
    if (mat.emissiveIntensity > 0.5 && mat.emissive && mat.emissive.getHex() !== 0) R.glows.push(mesh);
    return mesh;
  };
  const A = (zone, mesh) => { R.armor[zone].push(mesh); return mesh; };
  const piston = (a, aOff, b, bOff, r = 0.045) => {
    const sl = new THREE.Mesh(G.cyl(r, r, 1, 10), m.joint), rod = new THREE.Mesh(G.cyl(r * 0.55, r * 0.55, 1, 8), m.chrome);
    sl.castShadow = rod.castShadow = true; R.root.add(sl, rod);
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

  // shared mechanical underlayer: pelvis, spine column, joint balls, bare limb frames
  P(R.body, G.box(0.52, 0.28, 0.38, 0.06), m.dark);
  P(R.body, G.box(0.34, 0.18, 0.14, 0.04), m.secondary, [0, -0.04, 0.2]);
  for (const s of sides) { P(R.body, G.sph(0.12, 16, 12), m.joint, [s * d.hipW, -0.04, 0]); P(R.body, G.box(0.14, 0.24, 0.3, 0.04), m.secondary, [s * (d.hipW + 0.12), -0.02, 0], [0, 0, s * 0.15]); }
  P(R.spine, G.cyl(0.15, 0.19, 0.24, 16), m.joint, [0, 0.06, 0]);
  for (let i = 0; i < 3; i++) P(R.spine, G.tor(0.17 - i * 0.01, 0.025, 6, 20), m.rubber, [0, -0.02 + i * 0.07, 0], [HP, 0, 0]);
  for (const s of sides) {
    P(sh(s), G.cyl(0.075, 0.075, U, 10), m.joint, [0, 0, U / 2], [HP, 0, 0]);
    P(el(s), G.sph(0.13, 16, 12), m.joint);
    P(hp(s), G.cyl(0.085, 0.085, T, 10), m.joint, [0, 0, T / 2], [HP, 0, 0]);
    P(kn(s), G.sph(0.14, 16, 12), m.joint);
    P(kn(s), G.cyl(0.075, 0.075, S, 10), m.joint, [0, 0, S / 2], [HP, 0, 0]);
  }

  BUILDERS[def.build]({ R, m, d, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S });

  // overdrive aura light
  R.aura = new THREE.PointLight(def.colors.accent, 0, 5, 2); R.aura.position.set(0, 0.2, 0.7); R.chest.add(R.aura);
  R.root.traverse(o => { if (o.isMesh) o.userData.robot = true; });
  if (opts.scale) R.root.scale.setScalar(opts.scale);
  return R;
}

// generic fists
function fistBlock(c, s, mat, plate, size = 0.34) {
  const { P, fi } = c; const f = fi(s);
  P(f, G.box(size, size * 0.92, size * 0.95, 0.07), mat, [0, 0, size * 0.42]);
  for (let i = 0; i < 4; i++) P(f, G.box(size * 0.22, size * 0.3, size * 0.22, 0.03), c.m.joint, [(-1.5 + i) * size * 0.235, size * 0.18, size * 0.86]);
  P(f, G.box(size * 1.02, size * 0.32, size * 0.24, 0.04), plate, [0, size * 0.28, size * 0.62]);
  P(f, G.box(size * 0.24, size * 0.3, size * 0.4, 0.04), c.m.joint, [s * size * 0.56, -size * 0.08, size * 0.48], [0, 0, 0]);
}
function fistClaw(c, s, plate, len = 0.2, n = 3) {
  const { P, fi, m } = c; const f = fi(s);
  P(f, G.box(0.24, 0.2, 0.2, 0.05), m.dark, [0, 0, 0.08]);
  P(f, G.box(0.26, 0.08, 0.16, 0.03), plate, [0, 0.11, 0.08]);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.085;
    const k1 = new THREE.Group(); k1.position.set(x, 0.05, 0.17); k1.rotation.x = 0.55; f.add(k1);
    P(k1, G.box(0.06, 0.06, len * 0.55, 0.02), m.joint, [0, 0, len * 0.27]);
    P(k1, G.sph(0.038, 8, 6), m.chrome, [0, 0, len * 0.55]);
    const k2 = new THREE.Group(); k2.position.z = len * 0.55; k2.rotation.x = 0.9; k1.add(k2);
    P(k2, G.box(0.055, 0.055, len * 0.5, 0.02), plate, [0, 0, len * 0.24]);
    P(k2, G.cone(0.03, len * 0.3, 6), m.dark, [0, 0, len * 0.6], [HPI, 0, 0]);
  }
  const th = new THREE.Group(); th.position.set(s * 0.13, -0.03, 0.12); th.rotation.set(0.4, 0, -s * 0.7); f.add(th);
  P(th, G.box(0.055, 0.055, len * 0.6, 0.02), m.joint, [0, 0, len * 0.3]);
  P(th, G.cone(0.03, len * 0.25, 6), m.dark, [0, 0, len * 0.68], [HPI, 0, 0]);
}
const HPI = Math.PI / 2;

const BUILDERS = {
  // ------------------------------------------------------------ BULWARK: white slab roof over a black dome, lime lights
  bulwark(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.9, 0.78, 0.62, 0.08), m.dark, [0, -0.02, -0.04]);
    P(C, G.sph(0.42, 40, 28), m.glass, [0, 0.02, 0.2], [0, 0, 0], [1, 1, 0.82]);
    P(C, G.tor(0.41, 0.035, 10, 48), m.joint, [0, 0.02, 0.22]);
    for (const [x, y] of [[0.22, 0.18], [-0.22, 0.18]]) P(C, G.box(0.12, 0.04, 0.03, 0.01), m.glow, [x, y, 0.53], [0, x > 0 ? 0.5 : -0.5, x > 0 ? -0.5 : 0.5]);
    for (const [x, y] of [[0.08, 0.28], [-0.12, 0.3], [0.16, -0.12]]) P(C, G.sph(0.012, 6, 4), m.chrome, [x, y, 0.52]);
    A('core', P(C, G.box(1.08, 0.13, 0.78, 0.04), m.primary, [0, 0.47, 0.02], [0.12, 0, 0]));
    A('core', P(C, G.box(0.92, 0.1, 0.3, 0.03), m.primary, [0, 0.4, 0.4], [0.45, 0, 0]));
    for (const s of sides) {
      A('core', P(C, G.box(0.17, 0.66, 0.72, 0.04), m.primary, [s * 0.52, 0.15, 0.02], [0, 0, s * 0.16]));
      P(C, G.box(0.03, 0.26, 0.03, 0.01), m.glow, [s * 0.53, 0.06, 0.39], [0, 0, s * 0.16]);
      P(C, G.cyl(0.05, 0.05, 0.42, 10), m.chrome, [s * 0.24, 0.5, -0.44]);
      cable(C, [[s * 0.3, -0.3, 0.2], [s * 0.42, -0.42, 0.05], [s * 0.36, -0.5, -0.2]], 0.022);
    }
    P(C, G.box(0.36, 0.22, 0.2, 0.04), m.secondary, [0, -0.44, 0.22]);
    for (let i = 0; i < 4; i++) P(C, G.box(0.3, 0.025, 0.03, 0.01), m.joint, [0, -0.38 - i * 0.04, 0.33]);
    P(C, G.cyl(0.27, 0.3, 0.2, 18), m.dark, [0, -0.46, -0.04]);
    P(C, G.box(0.7, 0.58, 0.3, 0.06), m.secondary, [0, 0.04, -0.44]);
    for (let i = 0; i < 5; i++) P(C, G.box(0.5, 0.03, 0.04, 0.01), m.joint, [0, -0.12 + i * 0.07, -0.6]);
    // sensor under the roof
    P(H, G.box(0.36, 0.14, 0.24, 0.04), m.dark, [0, 0.0, 0.04]);
    P(H, G.box(0.28, 0.035, 0.03, 0.01), m.eye, [0, 0.01, 0.17]);
    A('head', P(H, G.cyl(0.012, 0.012, 0.34, 6), m.chrome, [0.15, 0.2, -0.08]));
    A('head', P(H, G.box(0.42, 0.06, 0.3, 0.02), m.secondary, [0, 0.1, 0.0]));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.05, 0); C.add(pad);
      P(pad, G.sph(0.18, 16, 12), m.joint, [0, -0.06, 0]);
      A(z, P(pad, G.box(0.36, 0.98, 0.84, 0.05), m.primary, [s * 0.14, 0.16, 0], [0, 0, s * 0.13]));
      A(z, P(pad, G.box(0.5, 0.12, 0.8, 0.04), m.secondary, [s * -0.04, 0.66, 0], [0, 0, s * 0.3]));
      P(pad, G.box(0.04, 0.42, 0.04, 0.01), m.glow, [s * 0.3, 0.12, 0.43], [0, 0, s * 0.13]);
      bolts(pad, [[s * 0.2, 0.55, 0.43], [s * 0.26, 0.0, 0.43], [s * 0.3, -0.25, 0.43]]);
      // arm: heavy frame + white sleeve; forearm block with door-shield
      P(sh(s), G.box(0.3, 0.3, U * 0.72, 0.05), m.dark, [0, 0, U * 0.52]);
      P(sh(s), G.box(0.08, 0.32, U * 0.6, 0.02), m.primary, [s * 0.18, 0, U * 0.5]);
      P(el(s), G.box(0.44, 0.46, F * 0.86, 0.06), m.primary, [0, 0, F * 0.5]);
      P(el(s), G.box(0.34, 0.1, F * 0.6, 0.02), m.dark, [0, -0.25, F * 0.5]);
      A(z, P(el(s), G.box(0.1, 0.78, F * 1.08, 0.03), m.primary, [s * 0.28, 0.06, F * 0.46]));
      P(el(s), G.box(0.025, 0.04, F * 0.7, 0.008), m.glow, [s * 0.335, 0.32, F * 0.46]);
      bolts(el(s), [[s * 0.335, -0.2, F * 0.15], [s * 0.335, -0.2, F * 0.8], [s * 0.335, 0.2, F * 0.15]]);
      piston(sh(s), [0, -0.17, U * 0.2], el(s), [0, -0.26, F * 0.25], 0.05);
      fistBlock(c, s, m.dark, m.primary, 0.4);
      // stocky legs, wheel at the heel
      P(hp(s), G.box(0.34, 0.34, T * 0.8, 0.05), m.dark, [0, 0, T * 0.5]);
      P(hp(s), G.box(0.38, 0.12, T * 0.78, 0.03), m.primary, [0, 0.2, T * 0.48]);
      P(kn(s), G.box(0.3, 0.16, 0.3, 0.04), m.primary, [0, 0.18, 0.02]);
      P(kn(s), G.box(0.46, 0.48, S * 0.8, 0.06), m.primary, [0, 0.02, S * 0.5]);
      P(kn(s), G.box(0.03, 0.04, S * 0.5, 0.008), m.glow, [s * 0.24, 0.27, S * 0.5]);
      piston(hp(s), [0, -0.2, T * 0.25], kn(s), [0, -0.25, S * 0.35], 0.045);
      P(ft(s), G.box(0.36, 0.18, 0.58, 0.05), m.dark, [0, 0.09, 0.1]);
      P(ft(s), G.box(0.34, 0.08, 0.26, 0.03), m.primary, [0, 0.2, 0.24]);
      P(ft(s), G.cyl(0.22, 0.22, 0.14, 24), m.rubber, [0, 0.22, -0.24], [0, 0, HP]);
      P(ft(s), G.cyl(0.11, 0.11, 0.16, 12), m.chrome, [0, 0.22, -0.24], [0, 0, HP]);
    }
  },

  // ------------------------------------------------------------ ONYX: charcoal spheres, discs, knuckle-dragging arms
  onyx(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.sph(0.5, 36, 26), m.primary, [0, 0.04, 0], [0, 0, 0], [1.12, 0.92, 0.88]);
    P(C, G.sph(0.38, 28, 20), m.secondary, [0, -0.46, 0.06], [0, 0, 0], [1, 0.9, 1]);
    for (let i = 0; i < 2; i++) P(C, G.box(0.03, 0.14, 0.03, 0.01), m.dark, [-0.04 + i * 0.08, -0.4, 0.42], [0.2, 0, 0.1]);
    P(C, G.sph(0.44, 28, 20), m.dark, [0, 0.16, -0.32]);
    P(C, G.tor(0.26, 0.07, 12, 32), m.dark, [0, 0.42, 0.06], [HP, 0, 0]);
    A('core', P(C, G.box(0.42, 0.26, 0.12, 0.06), m.secondary, [0.04, 0.12, 0.44], [-0.2, 0, 0]));
    A('core', P(C, G.box(0.3, 0.2, 0.1, 0.05), m.secondary, [-0.26, -0.1, 0.38], [-0.1, -0.4, 0]));
    for (const [x, y] of [[-0.3, 0.24], [-0.24, 0.24], [-0.27, 0.19]]) P(C, G.sph(0.022, 8, 6), m.glow, [x, y, 0.4]);
    for (const s of sides) A('core', P(C, G.sph(0.2, 18, 14), m.secondary, [s * 0.5, -0.18, 0.12]));
    // head sunk in the collar
    P(H, G.sph(0.17, 22, 16), m.dark, [0, 0.02, 0.02]);
    P(H, G.box(0.22, 0.06, 0.08, 0.025), m.glass, [0, 0.03, 0.15]);
    P(H, G.sph(0.022, 8, 6), m.eye, [0.03, 0.03, 0.19]);
    A('head', P(H, G.box(0.32, 0.08, 0.26, 0.04), m.primary, [0, 0.16, 0], [0.15, 0, 0]));
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
      A(z, P(pad, G.sph(0.42, 30, 22), m.primary, [s * 0.06, 0.08, 0], [0, 0, 0], [1, 0.95, 1.05]));
      P(pad, G.cyl(0.04, 0.05, 0.16, 8), m.dark, [s * -0.05, 0.52, -0.05]);
      port(pad, [s * 0.47, 0.06, 0], [0, 0, -s * HP], 0.14);
      P(sh(s), G.cap(0.22, U * 0.5), m.secondary, [0, 0, U * 0.52], [HP, 0, 0]);
      P(el(s), G.sph(0.22, 18, 14), m.primary);
      port(el(s), [s * 0.2, 0, 0], [0, 0, -s * HP], 0.1);
      A(z, P(el(s), G.cap(0.27, F * 0.5), m.primary, [0, 0, F * 0.5], [HP, 0, 0]));
      port(el(s), [s * 0.27, 0.02, F * 0.5], [0, 0, -s * HP], 0.12);
      P(el(s), G.tor(0.25, 0.03, 8, 24), m.dark, [0, 0, F * 0.9]);
      // big mitt: palm and four curled thick fingers
      const f = fi(s);
      P(f, G.sph(0.22, 18, 14), m.dark, [0, 0, 0.14], [0, 0, 0], [1.05, 0.85, 1]);
      for (let i = 0; i < 4; i++) P(f, G.cap(0.055, 0.12), m.primary, [(-1.5 + i) * 0.1, 0.08, 0.3], [HP + 0.6, 0, 0]);
      P(f, G.cap(0.06, 0.1), m.primary, [s * 0.2, -0.04, 0.18], [HP, 0, -s * 0.6]);
      cable(C, [[s * 0.3, 0.3, -0.25], [s * 0.55, 0.42, -0.2], [s * 0.7, 0.3, -0.1]], 0.03);
      // thick rounded legs with knee discs
      P(hp(s), G.cap(0.25, T * 0.45), m.primary, [0, 0, T * 0.5], [HP, 0, 0]);
      port(kn(s), [0, 0.15, 0], [0, 0, 0], 0.13);
      P(kn(s), G.cap(0.21, S * 0.5), m.secondary, [0, 0, S * 0.52], [HP, 0, 0]);
      P(kn(s), G.tor(0.2, 0.03, 8, 24), m.dark, [0, 0, S * 0.85]);
      P(ft(s), G.sph(0.22, 18, 12), m.dark, [0, 0.1, 0.06], [0, 0, 0], [1.05, 0.5, 1.35]);
      for (let i = 0; i < 3; i++) P(ft(s), G.cap(0.05, 0.08), m.primary, [(i - 1) * 0.1, 0.05, 0.32], [HP, 0, 0]);
    }
  },

  // ------------------------------------------------------------ TORQUE: white riot frame on a single drive wheel
  torque(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.78, 0.72, 0.52, 0.08), m.primary, [0, 0.06, 0]);
    P(C, G.box(0.46, 0.34, 0.1, 0.04), m.secondary, [0, 0.14, 0.28]);
    for (const s of sides) {
      A('core', P(C, G.box(0.34, 0.36, 0.1, 0.03), m.primary, [s * 0.22, 0.18, 0.3], [-0.1, -s * 0.25, 0]));
      const hook = P(C, G.tor(0.09, 0.022, 6, 16, Math.PI * 1.3), m.glow, [s * 0.2, -0.06, 0.32], [0, 0, s > 0 ? 0.3 : 2.8]);
    }
    for (let i = 0; i < 3; i++) P(C, G.box(0.34 - i * 0.04, 0.09, 0.32, 0.02), m.dark, [0, -0.32 - i * 0.1, 0.02]);
    P(C, G.cyl(0.09, 0.09, 0.5, 10), m.chrome, [0, -0.4, -0.1]);
    for (const s of sides) piston(R.spine, [s * 0.14, 0, 0.1], C, [s * 0.22, -0.18, 0.12], 0.035);
    P(C, G.box(0.62, 0.5, 0.26, 0.05), m.secondary, [0, 0.1, -0.36]);
    P(H, G.box(0.26, 0.24, 0.28, 0.08), m.dark, [0, 0.1, 0.02]);
    P(H, G.box(0.24, 0.05, 0.04, 0.015), m.eye, [0, 0.12, 0.16]);
    A('head', P(H, G.box(0.3, 0.1, 0.3, 0.04), m.primary, [0, 0.26, 0.0], [0.1, 0, 0]));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.05, 0); C.add(pad);
      P(pad, G.sph(0.16, 14, 10), m.joint, [0, -0.04, 0]);
      A(z, P(pad, G.box(0.42, 0.7, 0.66, 0.05), m.primary, [s * 0.22, 0.24, 0], [0, 0, -s * 0.35]));
      A(z, P(pad, G.box(0.36, 0.1, 0.6, 0.03), m.secondary, [s * 0.44, 0.5, 0], [0, 0, -s * 0.62]));
      P(pad, G.tor(0.08, 0.02, 6, 14, Math.PI * 1.3), m.glow, [s * 0.18, 0.15, 0.34], [0, 0, s > 0 ? 0.5 : 2.6]);
      P(sh(s), G.box(0.22, 0.24, U * 0.72, 0.04), m.secondary, [0, 0, U * 0.52]);
      P(el(s), G.box(0.3, 0.32, F * 0.85, 0.05), m.primary, [0, 0, F * 0.5]);
      A(z, P(el(s), G.box(0.09, 1.0, F * 1.25, 0.03), m.primary, [s * 0.22, 0.08, F * 0.42]));
      P(el(s), G.box(0.1, 0.12, 0.3, 0.03), m.dark, [s * 0.16, 0, F * 0.42]);
      P(el(s), G.box(0.02, 0.6, 0.03, 0.006), m.glow, [s * 0.27, 0.08, F * 0.98]);
      piston(sh(s), [0, -0.14, U * 0.25], el(s), [0, -0.18, F * 0.3], 0.04);
      fistBlock(c, s, m.dark, m.secondary, 0.32);
      // fork struts down to the axle
      P(hp(s), G.box(0.12, 0.2, T * 1.0, 0.03), m.dark, [0, 0, T * 0.5]);
      P(kn(s), G.box(0.1, 0.18, S * 1.0, 0.03), m.secondary, [0, 0, S * 0.5]);
      piston(R.body, [s * (c.d.hipW + 0.1), -0.05, -0.1], kn(s), [0, -0.1, S * 0.6], 0.04);
    }
    // the wheel lives on the left foot group (both feet share the axle point)
    const wg = new THREE.Group(); wg.position.set(-c.d.stanceW, c.d.ankle, 0); R.footL.add(wg); R.wheel = wg;
    const tyre = P(wg, G.tor(0.47, 0.11, 14, 40), m.rubber, [0, 0, 0], [0, HP, 0]);
    P(wg, G.cyl(0.38, 0.38, 0.14, 32), m.dark, [0, 0, 0], [0, 0, HP]);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P(wg, G.box(0.16, 0.06, 0.3, 0.01), m.secondary, [0, Math.sin(a) * 0.22, Math.cos(a) * 0.22], [a, 0, 0]); }
    P(wg, G.cyl(0.12, 0.12, 0.3, 14), m.chrome, [0, 0, 0], [0, 0, HP]);
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; P(wg, G.box(0.24, 0.04, 0.06, 0.01), m.rubber, [0, Math.sin(a) * 0.57, Math.cos(a) * 0.57], [a, 0, 0]); }
    const fender = new THREE.Group(); fender.position.set(-c.d.stanceW, c.d.ankle, 0); R.footL.add(fender);
    P(fender, G.tor(0.68, 0.06, 6, 24, Math.PI * 0.7), m.primary, [0, 0, 0], [0, -HP, HP * 0.6]);
    R.wheeled = true;
  },

  // ------------------------------------------------------------ SPECTRA: navy horned knight with neon panels
  spectra(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.82, 0.62, 0.54, 0.1), m.primary, [0, 0.1, 0]);
    P(C, G.box(0.5, 0.4, 0.44, 0.06), m.dark, [0, -0.28, 0]);
    A('core', P(C, G.box(0.36, 0.3, 0.12, 0.05), m.secondary, [0.2, 0.16, 0.29], [-0.12, -0.25, 0]));
    A('core', P(C, G.box(0.36, 0.3, 0.12, 0.05), m.secondary, [-0.2, 0.16, 0.29], [-0.12, 0.25, 0]));
    P(C, G.box(0.18, 0.18, 0.03, 0.02), m.glow, [-0.2, 0.15, 0.36], [-0.12, 0.25, 0]);
    P(C, G.box(0.1, 0.16, 0.03, 0.02), m.glowPink, [0.17, 0.2, 0.36], [-0.12, -0.25, 0]);
    P(C, G.box(0.06, 0.06, 0.03, 0.01), m.glowArm, [0.27, 0.06, 0.35], [-0.12, -0.25, 0]);
    for (let i = 0; i < 3; i++) A('core', P(C, G.box(0.42 - i * 0.05, 0.1, 0.38, 0.03), m.secondary, [0, -0.2 - i * 0.12, 0.06]));
    P(C, G.box(0.66, 0.14, 0.5, 0.05), m.dark, [0, 0.44, 0]);
    P(C, G.box(0.62, 0.52, 0.28, 0.06), m.secondary, [0, 0.1, -0.38]);
    for (const s of sides) { P(C, G.box(0.06, 0.48, 0.34, 0.02), m.dark, [s * 0.2, 0.2, -0.56]); cable(C, [[s * 0.25, 0.4, -0.4], [s * 0.3, 0.55, -0.2], [s * 0.15, 0.55, 0.0]], 0.02); }
    // beetle helmet: rounded dome, snout, forward-curving horns, red visor
    P(H, G.sph(0.21, 26, 18), m.primary, [0, 0.16, 0], [0, 0, 0], [1, 0.9, 1.15]);
    P(H, G.box(0.24, 0.14, 0.24, 0.05), m.dark, [0, 0.04, 0.12]);
    P(H, G.box(0.18, 0.08, 0.12, 0.03), m.secondary, [0, -0.02, 0.24], [0.3, 0, 0]);
    P(H, G.box(0.3, 0.05, 0.05, 0.015), m.eye, [0, 0.15, 0.22]);
    P(H, G.box(0.04, 0.12, 0.34, 0.015), m.dark, [0, 0.36, -0.02]);
    for (const s of sides) {
      const hg = new THREE.Group(); hg.position.set(s * 0.15, 0.26, -0.02); hg.rotation.set(-0.5, 0, -s * 0.5); H.add(hg);
      A('head', P(hg, G.cone(0.055, 0.26, 10), m.secondary, [0, 0.12, 0]));
      const tip = P(hg, G.cone(0.035, 0.18, 8), m.glowArm, [0, 0.3, 0.06], [0.6, 0, 0]);
    }
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      P(pad, G.sph(0.17, 14, 10), m.joint, [0, -0.04, 0]);
      A(z, P(pad, G.sph(0.3, 24, 16), m.primary, [s * 0.1, 0.12, 0], [0, 0, 0], [1.1, 0.8, 1.15]));
      A(z, P(pad, G.box(0.4, 0.14, 0.5, 0.04), m.secondary, [s * 0.2, 0.0, 0], [0, 0, s * 0.55]));
      P(pad, G.box(0.04, 0.04, 0.44, 0.01), s < 0 ? m.glowArm : m.glow, [s * 0.36, 0.06, 0], [0, 0, s * 0.55]);
      P(sh(s), G.box(0.22, 0.22, U * 0.76, 0.05), m.secondary, [0, 0, U * 0.52]);
      if (s < 0) {
        // molten right gauntlet
        A(z, P(el(s), G.cap(0.24, F * 0.55), m.glowArm, [0, 0, F * 0.5], [HP, 0, 0], [1, 1, 1.05]));
        P(el(s), G.tor(0.24, 0.035, 8, 24), m.dark, [0, 0, F * 0.15]);
        P(el(s), G.tor(0.24, 0.035, 8, 24), m.dark, [0, 0, F * 0.85]);
        fistBlock(c, s, m.glowArm, m.dark, 0.36);
      } else {
        P(el(s), G.box(0.28, 0.28, F * 0.86, 0.06), m.primary, [0, 0, F * 0.5]);
        A(z, P(el(s), G.box(0.06, 0.2, F * 0.6, 0.02), m.glowArm, [s * 0.16, 0, F * 0.5]));
        fistBlock(c, s, m.primary, m.secondary, 0.3);
      }
      piston(sh(s), [0, -0.12, U * 0.25], el(s), [0, -0.16, F * 0.25], 0.035);
      P(hp(s), G.box(0.3, 0.32, T * 0.85, 0.06), m.primary, [0, 0, T * 0.5]);
      P(hp(s), G.box(0.12, 0.03, T * 0.45, 0.01), s > 0 ? m.glowLegL : m.glowLegR, [0, 0.17, T * 0.5]);
      P(kn(s), G.box(0.26, 0.12, 0.24, 0.04), m.primary, [0, 0.15, 0.02]);
      P(kn(s), G.box(0.32, 0.36, S * 0.85, 0.06), m.secondary, [0, 0.02, S * 0.5]);
      P(kn(s), G.box(0.18, 0.03, S * 0.6, 0.01), s > 0 ? m.glowLegL : m.glowLegR, [0, 0.2, S * 0.52]);
      piston(hp(s), [0, -0.16, T * 0.3], kn(s), [0, -0.2, S * 0.35], 0.035);
      P(ft(s), G.box(0.3, 0.15, 0.5, 0.05), m.dark, [0, 0.075, 0.1]);
      P(ft(s), G.box(0.28, 0.07, 0.22, 0.03), m.primary, [0, 0.17, 0.22]);
      P(ft(s), G.cyl(0.15, 0.15, 0.11, 20), m.rubber, [0, 0.15, -0.18], [0, 0, HP]);
      P(ft(s), G.cyl(0.07, 0.07, 0.13, 10), m.chrome, [0, 0.15, -0.18], [0, 0, HP]);
    }
  },

  // ------------------------------------------------------------ BELLJAR: blast dome, quilted arms, clear guards, one tread
  belljar(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.68, 0.52, 0.46, 0.12), m.primary, [0, 0.04, 0]);
    A('core', P(C, G.box(0.28, 0.18, 0.05, 0.02), m.secondary, [0.16, 0.08, 0.24]));
    A('core', P(C, G.box(0.16, 0.12, 0.05, 0.02), m.tertiary, [-0.18, -0.08, 0.24]));
    for (const s of sides) P(C, G.box(0.07, 0.62, 0.52, 0.02), m.dark, [s * 0.15, 0.02, 0], [0, 0, s * 0.35]);
    for (let i = 0; i < 4; i++) P(C, G.tor(0.21 - (i % 2) * 0.02, 0.05, 8, 22), m.rubber, [0, -0.28 - i * 0.07, 0], [HP, 0, 0]);
    P(C, G.box(0.5, 0.42, 0.22, 0.06), m.secondary, [0, 0.0, -0.34]);
    for (const s of sides) { P(C, G.cyl(0.035, 0.035, 0.34, 8), m.chrome, [s * 0.12, 0.38, 0.02]); cable(C, [[s * 0.2, 0.2, -0.3], [s * 0.38, 0.32, -0.25], [s * 0.5, 0.25, -0.1]], 0.028); }
    // the dome: wide bowl with a lip, face module and red eye below
    const pts = [[0.001, 0], [0.48, 0.0], [0.64, 0.03], [0.68, 0.08], [0.66, 0.14], [0.58, 0.22], [0.44, 0.29], [0.22, 0.33], [0.001, 0.34]].map(p => new THREE.Vector2(p[0], p[1]));
    A('head', P(H, new THREE.LatheGeometry(pts, 48), m.primary, [0, 0.2, -0.02]));
    P(H, G.tor(0.66, 0.025, 6, 48), m.dark, [0, 0.27, -0.02], [HP, 0, 0]);
    P(H, G.box(0.14, 0.04, 0.02, 0.01), m.tertiary, [0.1, 0.4, 0.5], [-0.45, 0.2, 0]);
    P(H, G.box(0.22, 0.03, 0.02, 0.01), m.secondary, [-0.28, 0.39, 0.46], [-0.45, -0.5, 0]);
    P(H, G.box(0.36, 0.2, 0.3, 0.05), m.dark, [0, 0.08, 0.08]);
    P(H, G.box(0.2, 0.08, 0.04, 0.02), m.glass, [0, 0.1, 0.24]);
    P(H, G.sph(0.03, 10, 8), m.eye, [0.02, 0.1, 0.26]);
    for (let i = 0; i < 4; i++) P(H, G.box(0.12, 0.012, 0.02, 0.004), m.joint, [0.12, 0.04 + i * 0.03, 0.235]);
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      A(z, P(pad, G.sph(0.32, 24, 18), m.fabric, [s * 0.08, 0.06, 0], [0, 0, 0], [1, 0.82, 1.05]));
      A(z, P(pad, G.box(0.04, 0.42, 0.56, 0.02), m.clear, [s * 0.36, 0.08, 0], [0, 0, -s * 0.18]));
      A(z, P(pad, G.box(0.36, 0.04, 0.5, 0.02), m.clear, [s * 0.16, 0.36, 0], [0, 0, s * 0.3]));
      P(pad, G.box(0.06, 0.06, 0.52, 0.02), m.dark, [s * 0.14, 0.27, 0], [0, 0, s * 0.3]);
      P(sh(s), G.cap(0.2, U * 0.48), m.fabric, [0, 0, U * 0.5], [HP, 0, 0]);
      P(el(s), G.cap(0.19, F * 0.5), m.fabric, [0, 0, F * 0.45], [HP, 0, 0]);
      A(z, P(el(s), G.box(0.05, 0.16, F * 0.42, 0.01), m.tertiary, [s * 0.18, 0.05, F * 0.45]));
      P(el(s), G.tor(0.19, 0.04, 8, 22), m.dark, [0, 0, F * 0.86]);
      fistBlock(c, s, m.brown, m.brown, 0.36);
      // thick armoured thighs with olive / blue patches
      P(hp(s), G.box(0.42, 0.46, T * 0.86, 0.1), m.primary, [0, 0, T * 0.5]);
      P(hp(s), G.box(0.24, 0.04, 0.22, 0.01), s > 0 ? m.secondary : m.tertiary, [s * 0.04, 0.24, T * 0.4]);
      P(hp(s), G.box(0.12, 0.03, 0.1, 0.01), m.tertiary, [s * -0.1, 0.24, T * 0.68]);
      P(kn(s), G.box(0.28, 0.14, 0.26, 0.04), m.dark, [0, 0.16, 0.02]);
      P(kn(s), G.cap(0.18, S * 0.5), m.fabric, [0, 0, S * 0.5], [HP, 0, 0]);
      piston(hp(s), [s * 0.2, -0.1, T * 0.3], kn(s), [s * 0.17, -0.08, S * 0.35], 0.04);
      if (s > 0) { // left: boot with a clear shin guard
        P(kn(s), G.box(0.34, 0.06, S * 0.95, 0.02), m.clear, [0, 0.24, S * 0.55], [0.08, 0, 0]);
        P(ft(s), G.box(0.32, 0.18, 0.52, 0.06), m.brown, [0, 0.09, 0.08]);
        P(ft(s), G.box(0.3, 0.06, 0.2, 0.02), m.dark, [0, 0.2, 0.24]);
      } else { // right: tank tread
        P(ft(s), G.box(0.34, 0.24, 0.68, 0.1), m.rubber, [0, 0.12, 0.06]);
        for (let i = 0; i < 4; i++) P(ft(s), G.cyl(0.09, 0.09, 0.36, 14), m.joint, [0, 0.12, -0.2 + i * 0.17], [0, 0, HP]);
        for (let i = 0; i < 9; i++) P(ft(s), G.box(0.36, 0.03, 0.04, 0.005), m.dark, [0, 0.005, -0.25 + i * 0.075]);
        P(ft(s), G.box(0.24, 0.08, 0.46, 0.02), m.secondary, [0, 0.27, 0.06]);
      }
    }
  },

  // ------------------------------------------------------------ WARDEN OD-9: olive plate over a skeletal frame, claws
  warden(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.box(0.78, 0.5, 0.5, 0.08), m.primary, [0, 0.16, 0]);
    P(C, G.box(0.46, 0.42, 0.38, 0.06), m.dark, [0, -0.3, 0]);
    for (const s of sides) {
      A('core', P(C, G.box(0.34, 0.3, 0.1, 0.03), m.secondary, [s * 0.21, 0.16, 0.27], [0, -s * 0.32, 0]));
      P(C, G.box(0.026, 0.28, 0.02, 0.006), m.glow, [s * 0.1, 0.18, 0.31], [0, 0, s * 0.6]);
      P(C, G.box(0.026, 0.2, 0.02, 0.006), m.glow, [s * 0.2, -0.12, 0.22], [0, 0, -s * 0.3]);
      A('core', P(C, G.box(0.16, 0.12, 0.1, 0.03), m.primary, [s * 0.12, -0.3, 0.2]));
      for (let k = 0; k < 2; k++) P(C, G.cyl(0.02, 0.02, 0.36, 6), m.chrome, [s * (0.08 + k * 0.08), -0.36, 0.12], [0.1, 0, 0]);
    }
    P(C, G.box(0.026, 0.32, 0.02, 0.006), m.glow, [0, -0.04, 0.29]);
    P(C, G.box(0.56, 0.42, 0.24, 0.05), m.secondary, [0, 0.12, -0.34]);
    // helmet with single eye and antenna pair
    P(H, G.box(0.3, 0.32, 0.36, 0.12), m.primary, [0, 0.16, 0.0]);
    P(H, G.box(0.2, 0.22, 0.05, 0.03), m.dark, [0, 0.13, 0.18]);
    P(H, G.sph(0.045, 12, 10), m.eye, [0, 0.18, 0.21]);
    P(H, G.box(0.02, 0.24, 0.02, 0.005), m.glow, [0, 0.16, 0.205]);
    for (const s of sides) { P(H, G.box(0.02, 0.16, 0.02, 0.005), m.glow, [s * 0.08, 0.1, 0.2], [0, 0, s * 0.4]); A('head', P(H, G.cyl(0.014, 0.014, 0.4, 6), m.dark, [s * 0.08, 0.46, -0.08], [-0.15, 0, -s * 0.08])); }
    A('head', P(H, G.box(0.34, 0.1, 0.24, 0.04), m.secondary, [0, 0.32, -0.04], [0.15, 0, 0]));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.05, 0); C.add(pad);
      P(pad, G.sph(0.15, 14, 10), m.joint, [0, -0.05, 0]);
      A(z, P(pad, G.box(0.42, 0.52, 0.58, 0.1), m.primary, [s * 0.12, 0.12, 0], [0, 0, s * 0.12]));
      A(z, P(pad, G.box(0.3, 0.12, 0.46, 0.04), m.secondary, [s * 0.12, 0.42, 0], [0, 0, s * 0.35]));
      P(pad, G.box(0.02, 0.02, 0.5, 0.005), m.glow, [s * 0.34, 0.28, 0], [0, 0, s * 0.12]);
      // skeletal arms: twin rods, small plates, exposed pistons
      for (const y of [0.06, -0.06]) { P(sh(s), G.cyl(0.03, 0.03, U * 0.9, 6), m.dark, [0, y, U * 0.5], [HP, 0, 0]); P(el(s), G.cyl(0.028, 0.028, F * 0.9, 6), m.dark, [s * 0.05, y, F * 0.48], [HP, 0, 0]); }
      P(sh(s), G.box(0.18, 0.2, U * 0.45, 0.04), m.primary, [0, 0.03, U * 0.42]);
      A(z, P(el(s), G.box(0.16, 0.2, F * 0.45, 0.04), m.primary, [s * 0.03, 0.06, F * 0.35]));
      P(el(s), G.box(0.015, 0.015, F * 0.4, 0.004), m.glow, [s * 0.12, 0.17, F * 0.35]);
      P(el(s), G.cyl(0.07, 0.07, 0.12, 10), m.joint, [0, 0, F * 0.92], [HP, 0, 0]);
      piston(sh(s), [0, -0.1, U * 0.15], el(s), [0, -0.1, F * 0.55], 0.032);
      piston(sh(s), [s * 0.08, 0.08, U * 0.3], el(s), [s * 0.08, 0.08, F * 0.6], 0.026);
      fistClaw(c, s, m.primary, 0.24, 3);
      // big angular legs over heavy boots
      P(hp(s), G.box(0.38, 0.4, T * 0.82, 0.06), m.primary, [0, 0.02, T * 0.5]);
      P(hp(s), G.box(0.2, 0.06, T * 0.4, 0.02), m.secondary, [s * 0.04, 0.23, T * 0.46]);
      P(kn(s), G.sph(0.16, 14, 10), m.dark);
      const shin = P(kn(s), G.box(0.44, 0.44, S * 0.74, 0.06), m.primary, [0, 0.06, S * 0.48]);
      P(kn(s), G.box(0.3, 0.12, 0.3, 0.04), m.secondary, [0, 0.2, 0.05], [-0.2, 0, 0]);
      P(kn(s), G.box(0.015, 0.015, S * 0.4, 0.004), m.glow, [0, 0.29, S * 0.45]);
      piston(hp(s), [0, -0.2, T * 0.3], kn(s), [0, -0.18, S * 0.3], 0.04);
      P(ft(s), G.box(0.42, 0.24, 0.62, 0.06), m.dark, [0, 0.12, 0.08]);
      P(ft(s), G.box(0.4, 0.12, 0.3, 0.04), m.primary, [0, 0.26, 0.2], [0.15, 0, 0]);
    }
  },

  // ------------------------------------------------------------ MIRE: hunched dark hulk, boulder shoulders, claws
  mire(c) {
    const { R, m, P, A, piston, cable, bolts, HP, C, H, sides, sh, el, fi, hp, kn, ft, zoneOf, U, F, T, S } = c;
    P(C, G.sph(0.5, 32, 24), m.primary, [0, 0.06, 0], [0, 0, 0], [1.15, 0.92, 1.0]);
    P(C, G.sph(0.32, 22, 16), m.dark, [0, -0.42, 0.04]);
    const rng = mulberry32(7);
    for (let i = 0; i < 9; i++) {
      const a = -1.2 + i * 0.3, y = (rng() - 0.35) * 0.5;
      A('core', P(C, G.box(0.26, 0.22, 0.07, 0.02), i % 3 ? m.secondary : m.primary, [Math.sin(a) * 0.52, y, Math.cos(a) * 0.45], [rng() * 0.6 - 0.3, a, rng() * 0.8 - 0.4]));
    }
    for (let i = 0; i < 3; i++) P(C, G.box(0.05, 0.3, 0.06, 0.01), m.glow, [-0.25 + i * 0.05, 0.1 - i * 0.06, 0.46], [0, -0.4, 0.5]);
    for (let i = 0; i < 4; i++) P(C, G.cone(0.05, 0.3, 6), m.dark, [(i - 1.5) * 0.18, 0.44, -0.25], [-0.7, 0, (i - 1.5) * 0.25]);
    P(H, G.box(0.32, 0.22, 0.28, 0.06), m.dark, [0, 0.0, 0.04]);
    P(H, G.sph(0.075, 14, 10), m.eye, [0, 0.0, 0.18]);
    P(H, G.tor(0.09, 0.02, 6, 16), m.joint, [0, 0.0, 0.17]);
    A('head', P(H, G.box(0.44, 0.12, 0.34, 0.04), m.secondary, [0, 0.13, 0.0], [0.35, 0, 0]));
    for (const s of sides) {
      const z = zoneOf(s);
      const pad = new THREE.Group(); pad.position.set(s * c.d.shX, c.d.shY + 0.04, 0); C.add(pad);
      A(z, P(pad, G.sph(0.46, 30, 22), m.primary, [s * 0.04, 0.16, 0], [0, 0, 0], [1, 0.9, 1.05]));
      for (let i = 0; i < 4; i++) A(z, P(pad, G.box(0.24, 0.16, 0.07, 0.02), m.secondary, [s * (0.18 + i * 0.07), 0.36 - i * 0.12, 0.3 - i * 0.1], [0.4, s * (0.4 + i * 0.3), s * 0.3]));
      P(sh(s), G.cap(0.17, U * 0.55), m.dark, [0, 0, U * 0.5], [HP, 0, 0]);
      A(z, P(sh(s), G.box(0.28, 0.12, U * 0.5, 0.02), m.secondary, [0, 0.15, U * 0.5], [0, 0, s * 0.2]));
      P(el(s), G.box(0.32, 0.34, F * 0.88, 0.06), m.primary, [0, 0, F * 0.48]);
      for (let i = 0; i < 3; i++) A(z, P(el(s), G.box(0.08, 0.22, 0.17, 0.02), m.secondary, [s * 0.18, 0.08, F * (0.22 + i * 0.25)], [0.5, 0, s * 0.3]));
      P(el(s), G.box(0.03, 0.04, F * 0.5, 0.008), m.glow, [s * 0.17, -0.14, F * 0.5]);
      piston(sh(s), [0, -0.14, U * 0.2], el(s), [0, -0.2, F * 0.3], 0.045);
      fistClaw(c, s, m.secondary, 0.3, 3);
      P(hp(s), G.box(0.36, 0.36, T * 0.85, 0.05), m.secondary, [0, 0, T * 0.5]);
      P(kn(s), G.box(0.36, 0.38, S * 0.85, 0.05), m.primary, [0, 0.02, S * 0.5]);
      for (let i = 0; i < 2; i++) P(kn(s), G.cone(0.05, 0.2, 6), m.dark, [0, 0.24, S * (0.3 + i * 0.3)], [-0.4, 0, 0]);
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
