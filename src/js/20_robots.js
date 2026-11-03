// ============================================================================
// ROBOTS: roster + procedural rig builder (joints are IK-driven at runtime)
// ============================================================================
const ROBOTS = [
  {
    id: 'bulwark', name: 'Bulwark', cls: 'Heavyweight · Siege frame',
    bio: 'A demolition-crew chassis wrapped in slab armor. Slow to start, impossible to move, and every right hand lands like a wrecking ball.',
    stats: { power: 8, speed: 4, armor: 9, reach: 6, stamina: 6 },
    colors: { primary: 0xd2d4cf, secondary: 0x858b87, dark: 0x26292c, accent: 0xb4ff3a, eye: 0xb4ff3a },
    dims: { hipH: 1.16, hipW: 0.24, thigh: 0.58, shin: 0.58, ankle: 0.13, spineY: 0.14, chestY: 0.44, shX: 0.66, shY: 0.24, upper: 0.52, fore: 0.58, neckY: 0.42, neckZ: 0.08, stanceW: 0.36, hunch: 0 },
    style: { torso: 'slab', head: 'dome', shoulder: 'slab', arm: 'shield', fist: 'block', leg: 'block', foot: 'wheel' },
    persona: { range: 0.92, body: 0.3, aggr: 0.9, combos: [['jab', 'cross'], ['jab', 'jab', 'cross'], ['cross', 'hook'], ['hook', 'upper'], ['jab', 'body:cross']] },
  },
  {
    id: 'onyx', name: 'Onyx', cls: 'Brawler · Gorilla frame',
    bio: 'Built for deep-sea salvage, retired for punching. Long arms, a low centre of gravity and a sensor cluster buried where you can barely hit it.',
    stats: { power: 9, speed: 5, armor: 7, reach: 9, stamina: 6 },
    colors: { primary: 0x3b3e42, secondary: 0x2b2d31, dark: 0x16171a, accent: 0xdfe6ea, eye: 0xff5a1f },
    dims: { hipH: 1.0, hipW: 0.26, thigh: 0.5, shin: 0.5, ankle: 0.12, spineY: 0.14, chestY: 0.48, shX: 0.7, shY: 0.2, upper: 0.62, fore: 0.68, neckY: 0.34, neckZ: 0.22, stanceW: 0.4, hunch: 0.16 },
    style: { torso: 'pod', head: 'sunken', shoulder: 'orb', arm: 'pod', fist: 'round', leg: 'pod', foot: 'round' },
    persona: { range: 1.0, body: 0.4, aggr: 1.1, combos: [['hook', 'hook'], ['jab', 'hook'], ['body:hook', 'upper'], ['cross', 'hook', 'upper'], ['jab', 'cross']] },
  },
  {
    id: 'spectra', name: 'Spectra', cls: 'Showman · Outfighter',
    bio: 'A former arena mascot reflashed for combat. Lights up like a pinball table, moves like one too, and never stops throwing the jab.',
    stats: { power: 5, speed: 9, armor: 5, reach: 7, stamina: 8 },
    colors: { primary: 0x24335f, secondary: 0x33467c, dark: 0x12141c, accent: 0x34ff6e, eye: 0xff2f5a, glowArm: 0xff4a12, glowLegL: 0x3d6bff, glowLegR: 0xa04dff },
    dims: { hipH: 1.18, hipW: 0.22, thigh: 0.6, shin: 0.6, ankle: 0.12, spineY: 0.14, chestY: 0.42, shX: 0.58, shY: 0.24, upper: 0.54, fore: 0.58, neckY: 0.4, neckZ: 0.04, stanceW: 0.33, hunch: 0 },
    style: { torso: 'armored', head: 'horned', shoulder: 'layered', arm: 'gauntlet', fist: 'stud', leg: 'armored', foot: 'wheel' },
    persona: { range: 1.05, body: 0.25, aggr: 1.0, combos: [['jab', 'jab'], ['jab', 'jab', 'cross'], ['jab', 'cross', 'hook'], ['jab', 'body:jab', 'cross'], ['jab', 'cross', 'jab', 'upper']] },
  },
  {
    id: 'belljar', name: 'Belljar', cls: 'Tank · Counterpuncher',
    bio: 'A bomb-disposal unit that kept its blast dome. Patient, padded and patched together from three different factories. Waits for you to miss.',
    stats: { power: 7, speed: 5, armor: 8, reach: 6, stamina: 8 },
    colors: { primary: 0x8b8e8a, secondary: 0x6b7a3b, tertiary: 0x4b70a0, dark: 0x2a2b29, brown: 0x6b4a33, accent: 0x84a9d6, eye: 0xff2a1a },
    dims: { hipH: 1.14, hipW: 0.27, thigh: 0.6, shin: 0.56, ankle: 0.13, spineY: 0.14, chestY: 0.4, shX: 0.62, shY: 0.2, upper: 0.52, fore: 0.56, neckY: 0.36, neckZ: 0.02, stanceW: 0.38, hunch: 0 },
    style: { torso: 'barrel', head: 'bell', shoulder: 'pad', arm: 'padded', fist: 'block', leg: 'heavy', foot: 'tread' },
    persona: { range: 0.95, body: 0.35, aggr: 0.7, counter: 1, combos: [['jab', 'cross'], ['cross', 'hook'], ['body:hook', 'hook'], ['upper', 'cross'], ['jab', 'upper']] },
  },
  {
    id: 'warden', name: 'Warden OD-9', cls: 'Technician · Military frame',
    bio: 'Decommissioned perimeter unit, still running its targeting firmware. Clean, efficient combinations and a claw grip that never quite lets go of a grudge.',
    stats: { power: 7, speed: 7, armor: 6, reach: 8, stamina: 7 },
    colors: { primary: 0x5d6a2a, secondary: 0x47511f, dark: 0x16181a, accent: 0xe9f2ff, eye: 0xff6a12 },
    dims: { hipH: 1.24, hipW: 0.23, thigh: 0.63, shin: 0.62, ankle: 0.12, spineY: 0.14, chestY: 0.42, shX: 0.62, shY: 0.24, upper: 0.57, fore: 0.62, neckY: 0.4, neckZ: 0.04, stanceW: 0.34, hunch: 0.04 },
    style: { torso: 'plated', head: 'sentinel', shoulder: 'plate', arm: 'rail', fist: 'claw', leg: 'plated', foot: 'boot' },
    persona: { range: 1.0, body: 0.35, aggr: 1.0, combos: [['jab', 'cross', 'hook'], ['jab', 'body:cross', 'hook'], ['jab', 'cross', 'upper'], ['hook', 'cross'], ['jab', 'jab', 'cross', 'hook']] },
  },
  {
    id: 'mire', name: 'Mire', cls: 'Swarmer · Hunchback',
    bio: 'Nobody admits to building it. Mire fights bent double, swings from the floor and only seems to get faster the more of its plating it loses.',
    stats: { power: 8, speed: 7, armor: 5, reach: 8, stamina: 7 },
    colors: { primary: 0x404835, secondary: 0x2c3227, dark: 0x131511, accent: 0xc6d63e, eye: 0xf0ff2a },
    dims: { hipH: 1.04, hipW: 0.26, thigh: 0.52, shin: 0.52, ankle: 0.12, spineY: 0.12, chestY: 0.46, shX: 0.72, shY: 0.22, upper: 0.62, fore: 0.72, neckY: 0.3, neckZ: 0.3, stanceW: 0.42, hunch: 0.32 },
    style: { torso: 'hunch', head: 'cowl', shoulder: 'dome', arm: 'jag', fist: 'claw', leg: 'jag', foot: 'claw' },
    persona: { range: 0.88, body: 0.45, aggr: 1.25, combos: [['hook', 'hook', 'upper'], ['body:hook', 'body:hook', 'upper'], ['upper', 'hook'], ['jab', 'hook', 'hook'], ['cross', 'upper']] },
  },
];
const ROBOT = id => ROBOTS.find(r => r.id === id);

function makeRobotMats(c, dormant) {
  const paint = (color, o = {}) => new THREE.MeshPhysicalMaterial(Object.assign({ color, metalness: 0.35, roughness: 0.62, map: TEX.panel, roughnessMap: TEX.grunge, clearcoat: 0.5, clearcoatRoughness: 0.32 }, o));
  const metal = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, metalness: 0.9, roughness: 0.38, roughnessMap: TEX.grunge }, o));
  const glow = (color, i = 2.6) => new THREE.MeshStandardMaterial({ color: 0x111111, emissive: dormant ? 0x000000 : color, emissiveIntensity: i, roughness: 0.4, metalness: 0.2 });
  const m = {
    primary: paint(c.primary), secondary: paint(c.secondary), dark: metal(c.dark, { map: TEX.panel }),
    joint: metal(0x1b1d1f, { roughness: 0.3 }), chrome: metal(0xcfd3d6, { roughness: 0.16, roughnessMap: null }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0e0e0e, roughness: 0.92, metalness: 0 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 }),
    glow: glow(c.accent, 2.2), eye: glow(c.eye, 6),
  };
  if (c.tertiary) m.tertiary = paint(c.tertiary);
  if (c.brown) m.brown = paint(c.brown, { metalness: 0.2, roughness: 0.75 });
  if (c.glowArm) { m.glowArm = glow(c.glowArm, 1.6); m.glowLegL = glow(c.glowLegL, 2.2); m.glowLegR = glow(c.glowLegR, 2.2); }
  return m;
}

// Build one robot. Returns a rig object with named joints and armor lists per damage zone.
function buildRobot(def, opts = {}) {
  const d = def.dims, st = def.style;
  const m = makeRobotMats(opts.colors || def.colors, opts.dormant);
  const R = {
    def, dims: d, mats: m, armor: { head: [], core: [], armL: [], armR: [] }, glows: [], meshes: [],
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
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); R.meshes.push(mesh); return mesh;
  };
  const A = (zone, mesh) => { R.armor[zone].push(mesh); return mesh; };
  const HP = Math.PI / 2;

  // ---------------- pelvis (shared)
  P(R.body, G.box(0.5, 0.26, 0.36, 0.06), m.dark, [0, 0, 0]);
  P(R.body, G.box(0.36, 0.18, 0.12, 0.04), m.secondary, [0, -0.02, 0.18]);
  for (const s of [1, -1]) { P(R.body, G.sph(0.11), m.joint, [s * d.hipW, -0.04, 0]); }
  P(R.spine, G.cyl(0.16, 0.2, 0.22, 16), m.joint, [0, 0.06, 0]);

  // ---------------- torso
  const C = R.chest;
  switch (st.torso) {
    case 'slab':
      P(C, G.box(0.92, 0.7, 0.6, 0.08), m.dark, [0, 0, -0.02]);
      for (const s of [1, -1]) {
        A('core', P(C, G.box(0.44, 0.5, 0.14, 0.04), m.primary, [s * 0.24, 0.06, 0.3], [0, -s * 0.22, 0]));
        A('core', P(C, G.box(0.12, 0.52, 0.5, 0.04), m.secondary, [s * 0.5, 0, 0]));
        R.glows.push(P(C, G.box(0.035, 0.24, 0.03, 0.01), m.glow, [s * 0.44, 0.1, 0.33], [0, -s * 0.22, 0]));
        P(C, G.cyl(0.05, 0.05, 0.4, 10), m.chrome, [s * 0.2, 0.42, -0.42]);
      }
      P(C, G.sph(0.27), m.glass, [0, 0.04, 0.26], [0, 0, 0], [1, 1, 0.75]);
      for (const [x, y] of [[0.1, 0.13], [-0.08, 0.16], [0.02, -0.05]]) R.glows.push(P(C, G.sph(0.022, 8, 6), m.glow, [x, y, 0.46]));
      A('core', P(C, G.box(1.0, 0.12, 0.62, 0.04), m.primary, [0, 0.39, 0]));
      P(C, G.box(0.68, 0.56, 0.28, 0.06), m.secondary, [0, 0.04, -0.4]);
      P(C, G.cyl(0.25, 0.29, 0.2, 18), m.dark, [0, -0.44, 0]);
      P(C, G.cyl(0.29, 0.25, 0.12, 18), m.joint, [0, -0.56, 0]);
      break;
    case 'pod':
      P(C, G.sph(0.48, 28, 20), m.primary, [0, 0.04, 0], [0, 0, 0], [1.05, 0.95, 0.85]);
      P(C, G.sph(0.36, 24, 16), m.secondary, [0, -0.44, 0.06]);
      P(C, G.sph(0.44, 24, 16), m.dark, [0, 0.18, -0.3]);
      A('core', P(C, G.box(0.5, 0.32, 0.12, 0.05), m.primary, [0, -0.06, 0.45], [-0.25, 0, 0]));
      for (const s of [1, -1]) A('core', P(C, G.sph(0.2), m.secondary, [s * 0.46, -0.16, 0.18]));
      P(C, G.tor(0.09, 0.022), m.chrome, [0.26, 0.2, 0.44], [0, 0.4, 0]);
      for (const [x, y] of [[-0.24, 0.27], [-0.3, 0.2], [-0.18, 0.2]]) R.glows.push(P(C, G.sph(0.028, 8, 6), m.glow, [x, y, 0.42]));
      break;
    case 'armored':
      P(C, G.box(0.84, 0.62, 0.54, 0.08), m.primary, [0, 0.08, 0]);
      for (const s of [1, -1]) A('core', P(C, G.box(0.38, 0.32, 0.12, 0.04), m.secondary, [s * 0.2, 0.14, 0.29], [-0.12, -s * 0.2, 0]));
      R.glows.push(P(C, G.box(0.2, 0.2, 0.03, 0.01), m.glow, [-0.21, 0.05, 0.35], [-0.12, 0.2, 0]));
      R.glows.push(P(C, G.box(0.06, 0.18, 0.03, 0.01), m.glowArm, [0.27, 0.04, 0.34], [-0.12, -0.2, 0]));
      for (let i = 0; i < 3; i++) A('core', P(C, G.box(0.42 - i * 0.04, 0.11, 0.38, 0.03), m.dark, [0, -0.28 - i * 0.12, 0.02]));
      P(C, G.box(0.7, 0.12, 0.5, 0.04), m.dark, [0, 0.42, 0]);
      P(C, G.box(0.6, 0.5, 0.26, 0.05), m.secondary, [0, 0.08, -0.36]);
      for (const s of [1, -1]) P(C, G.box(0.05, 0.42, 0.3, 0.02), m.dark, [s * 0.18, 0.18, -0.52]);
      break;
    case 'barrel':
      P(C, G.box(0.74, 0.58, 0.52, 0.12), m.primary, [0, 0, 0]);
      A('core', P(C, G.box(0.3, 0.2, 0.05, 0.02), m.secondary, [0.18, 0.1, 0.27]));
      A('core', P(C, G.box(0.18, 0.14, 0.05, 0.02), m.tertiary, [-0.2, -0.12, 0.27]));
      for (const s of [1, -1]) P(C, G.box(0.06, 0.62, 0.56, 0.02), m.dark, [s * 0.16, 0, 0], [0, 0, s * 0.35]);
      P(C, G.cyl(0.24, 0.27, 0.22, 16), m.dark, [0, -0.4, 0]);
      for (const s of [1, -1]) P(C, G.cyl(0.035, 0.035, 0.32, 8), m.chrome, [s * 0.12, 0.38, 0]);
      P(C, G.box(0.56, 0.44, 0.24, 0.06), m.secondary, [0, 0.02, -0.36]);
      break;
    case 'plated':
      P(C, G.box(0.8, 0.56, 0.5, 0.06), m.primary, [0, 0.12, 0]);
      P(C, G.box(0.52, 0.42, 0.4, 0.06), m.dark, [0, -0.32, 0]);
      for (const s of [1, -1]) {
        A('core', P(C, G.box(0.34, 0.3, 0.1, 0.03), m.secondary, [s * 0.22, 0.14, 0.27], [0, -s * 0.3, 0]));
        R.glows.push(P(C, G.box(0.028, 0.24, 0.02, 0.01), m.glow, [s * 0.11, 0.2, 0.3], [0, 0, s * 0.62]));
        A('core', P(C, G.box(0.18, 0.12, 0.1, 0.03), m.primary, [s * 0.12, -0.3, 0.22]));
      }
      R.glows.push(P(C, G.box(0.028, 0.3, 0.02, 0.01), m.glow, [0, -0.06, 0.29]));
      P(C, G.box(0.56, 0.44, 0.24, 0.05), m.secondary, [0, 0.1, -0.34]);
      break;
    case 'hunch':
      P(C, G.sph(0.5, 28, 20), m.primary, [0, 0.06, 0], [0, 0, 0], [1.15, 0.92, 1.0]);
      P(C, G.sph(0.32, 20, 14), m.dark, [0, -0.4, 0.04]);
      P(C, G.box(0.24, 0.12, 0.16, 0.03), m.dark, [0, 0.24, 0.42], [0.2, 0, 0]);
      const rng = mulberry32(7);
      for (let i = 0; i < 7; i++) {
        const a = -1.1 + i * 0.36, y = (rng() - 0.3) * 0.4;
        A('core', P(C, G.box(0.26, 0.2, 0.08, 0.02), m.secondary, [Math.sin(a) * 0.5, y, Math.cos(a) * 0.44], [rng() * 0.6 - 0.3, a, rng() * 0.8 - 0.4]));
      }
      for (let i = 0; i < 3; i++) P(C, G.cone(0.06, 0.3, 6), m.dark, [(i - 1) * 0.22, 0.42, -0.25], [-0.6, 0, (i - 1) * 0.3]);
      R.glows.push(P(C, G.box(0.18, 0.025, 0.02, 0.01), m.glow, [0, -0.12, 0.47]));
      break;
  }

  // ---------------- head
  const H = R.neck;
  P(H, G.cyl(0.07, 0.09, 0.16, 10), m.joint, [0, 0.02, 0]);
  switch (st.head) {
    case 'dome':
      P(H, G.sph(0.21, 24, 16), m.glass, [0, 0.13, 0.02], [0, 0, 0], [1, 0.85, 1]);
      R.glows.push(P(H, G.box(0.26, 0.035, 0.05, 0.01), m.eye, [0, 0.15, 0.19]));
      A('head', P(H, G.box(0.34, 0.09, 0.32, 0.04), m.primary, [0, 0.27, -0.03]));
      A('head', P(H, G.cyl(0.014, 0.014, 0.28, 6), m.chrome, [0.12, 0.38, -0.06]));
      break;
    case 'sunken':
      P(H, G.sph(0.16), m.dark, [0, 0.0, 0.05]);
      for (const [x, y] of [[0, 0.03], [0.05, -0.04], [-0.05, -0.04]]) R.glows.push(P(H, G.sph(0.03, 8, 6), m.eye, [x, y, 0.2]));
      A('head', P(H, G.box(0.36, 0.1, 0.28, 0.04), m.primary, [0, 0.13, 0.02], [0.2, 0, 0]));
      break;
    case 'horned':
      P(H, G.box(0.32, 0.29, 0.34, 0.08), m.primary, [0, 0.15, 0]);
      R.glows.push(P(H, G.box(0.28, 0.06, 0.04, 0.015), m.eye, [0, 0.16, 0.17]));
      P(H, G.box(0.22, 0.1, 0.16, 0.03), m.dark, [0, 0.02, 0.1]);
      P(H, G.box(0.04, 0.1, 0.3, 0.015), m.dark, [0, 0.32, 0]);
      for (const s of [1, -1]) A('head', P(H, G.cone(0.05, 0.34, 8), m.secondary, [s * 0.13, 0.4, -0.02], [-0.15, 0, -s * 0.4]));
      break;
    case 'bell': {
      const pts = [[0.001, 0.0], [0.42, 0.0], [0.58, 0.06], [0.62, 0.15], [0.56, 0.25], [0.42, 0.32], [0.2, 0.36], [0.001, 0.37]].map(p => new THREE.Vector2(p[0], p[1]));
      const bell = A('head', P(H, new THREE.LatheGeometry(pts, 36), m.primary, [0, 0.16, -0.02]));
      bell.material = m.primary;
      P(H, G.box(0.4, 0.16, 0.3, 0.04), m.dark, [0, 0.1, 0.06]);
      R.glows.push(P(H, G.sph(0.045, 10, 8), m.eye, [0, 0.1, 0.22]));
      P(H, G.box(0.14, 0.05, 0.02, 0.01), m.tertiary, [0.18, 0.38, 0.38], [-0.5, 0.3, 0]);
      P(H, G.box(0.1, 0.06, 0.02, 0.01), m.secondary, [-0.26, 0.32, 0.36], [-0.4, -0.5, 0]);
      break;
    }
    case 'sentinel':
      P(H, G.box(0.3, 0.3, 0.34, 0.1), m.primary, [0, 0.14, 0.02]);
      P(H, G.box(0.18, 0.2, 0.05, 0.02), m.dark, [0, 0.12, 0.18]);
      R.glows.push(P(H, G.sph(0.042, 10, 8), m.eye, [0, 0.16, 0.21]));
      R.glows.push(P(H, G.box(0.02, 0.2, 0.02, 0.005), m.glow, [0, 0.2, 0.19], [0.0, 0, 0]));
      for (const s of [1, -1]) A('head', P(H, G.cyl(0.012, 0.012, 0.36, 6), m.dark, [s * 0.08, 0.42, -0.06], [0, 0, -s * 0.1]));
      A('head', P(H, G.box(0.32, 0.08, 0.2, 0.03), m.secondary, [0, 0.3, -0.04]));
      break;
    case 'cowl':
      P(H, G.box(0.32, 0.2, 0.3, 0.06), m.dark, [0, 0.0, 0.04]);
      R.glows.push(P(H, G.sph(0.07, 12, 10), m.eye, [0, 0.0, 0.2]));
      A('head', P(H, G.box(0.42, 0.12, 0.34, 0.04), m.secondary, [0, 0.12, 0.0], [0.3, 0, 0]));
      break;
  }

  // ---------------- shoulders (fixed to chest), arms (IK joints)
  for (const s of [1, -1]) {
    const side = s > 0 ? 'L' : 'R', zone = s > 0 ? 'armL' : 'armR';
    const pad = new THREE.Group(); pad.position.set(s * d.shX, d.shY + 0.04, 0); C.add(pad);
    P(pad, G.sph(0.16), m.joint, [0, -0.04, 0]);
    switch (st.shoulder) {
      case 'slab':
        A(zone, P(pad, G.box(0.3, 0.52, 0.6, 0.05), m.primary, [s * 0.16, 0.02, 0], [0, 0, -s * 0.1]));
        A(zone, P(pad, G.box(0.46, 0.12, 0.58, 0.03), m.secondary, [s * 0.06, 0.3, 0], [0, 0, s * 0.18]));
        R.glows.push(P(pad, G.box(0.03, 0.3, 0.03, 0.01), m.glow, [s * 0.32, 0.02, 0.3], [0, 0, -s * 0.1]));
        break;
      case 'orb':
        A(zone, P(pad, G.sph(0.32, 24, 18), m.primary, [s * 0.08, 0.08, 0]));
        P(pad, G.tor(0.2, 0.04), m.dark, [s * 0.38, 0.08, 0], [0, HP, 0]);
        P(pad, G.cyl(0.12, 0.12, 0.05, 18), m.chrome, [s * 0.43, 0.08, 0], [0, 0, HP]);
        break;
      case 'layered':
        A(zone, P(pad, G.box(0.42, 0.17, 0.5, 0.04), m.primary, [s * 0.12, 0.24, 0], [0, 0, s * 0.35]));
        A(zone, P(pad, G.box(0.4, 0.15, 0.46, 0.04), m.secondary, [s * 0.2, 0.08, 0], [0, 0, s * 0.55]));
        R.glows.push(P(pad, G.box(0.035, 0.035, 0.42, 0.01), m.glowArm, [s * 0.34, 0.28, 0], [0, 0, s * 0.35]));
        break;
      case 'pad':
        A(zone, P(pad, G.sph(0.3, 22, 16), m.primary, [s * 0.12, 0.06, 0], [0, 0, 0], [1, 0.78, 1.05]));
        P(pad, G.box(0.06, 0.06, 0.5, 0.02), m.dark, [s * 0.14, 0.24, 0], [0, 0, s * 0.3]);
        break;
      case 'plate':
        A(zone, P(pad, G.box(0.38, 0.42, 0.52, 0.04), m.primary, [s * 0.14, 0.1, 0], [0, 0, s * 0.16]));
        R.glows.push(P(pad, G.box(0.02, 0.02, 0.46, 0.005), m.glow, [s * 0.3, 0.26, 0], [0, 0, s * 0.16]));
        A(zone, P(pad, G.box(0.32, 0.12, 0.4, 0.03), m.secondary, [s * 0.12, 0.34, 0], [0, 0, s * 0.3]));
        break;
      case 'dome':
        A(zone, P(pad, G.sph(0.42, 26, 18), m.primary, [s * 0.12, 0.14, 0], [0, 0, 0], [1, 0.86, 1]));
        for (let i = 0; i < 3; i++) A(zone, P(pad, G.box(0.24, 0.16, 0.07, 0.02), m.secondary, [s * (0.2 + i * 0.07), 0.3 - i * 0.12, 0.28 - i * 0.12], [0.4, s * (0.4 + i * 0.3), s * 0.3]));
        break;
    }

    // upper arm along +Z of shoulder joint
    const sh = s > 0 ? R.shL : R.shR, el = s > 0 ? R.elL : R.elR, fist = s > 0 ? R.fistL : R.fistR;
    const U = d.upper, F = d.fore;
    P(sh, G.cyl(0.07, 0.07, U, 10), m.joint, [0, 0, U / 2], [HP, 0, 0]);
    P(el, G.sph(0.12), m.joint, [0, 0, 0]);
    switch (st.arm) {
      case 'shield':
        P(sh, G.box(0.25, 0.25, U * 0.7, 0.05), m.secondary, [0, 0, U * 0.5]);
        P(el, G.box(0.3, 0.3, F * 0.82, 0.05), m.primary, [0, 0, F * 0.48]);
        A(zone, P(el, G.box(0.08, 0.6, F * 1.02, 0.03), m.primary, [s * 0.2, 0.04, F * 0.46]));
        R.glows.push(P(el, G.box(0.02, 0.03, F * 0.6, 0.005), m.glow, [s * 0.25, 0.22, F * 0.46]));
        break;
      case 'pod':
        P(sh, G.cap(0.17, U * 0.55), m.secondary, [0, 0, U * 0.5], [HP, 0, 0]);
        P(el, G.cap(0.22, F * 0.5), m.primary, [0, 0, F * 0.48], [HP, 0, 0]);
        A(zone, P(el, G.tor(0.09, 0.025), m.chrome, [s * 0.22, 0.02, F * 0.5], [0, HP, 0]));
        R.glows.push(P(el, G.sph(0.03, 8, 6), m.glow, [s * 0.23, 0.02, F * 0.5]));
        break;
      case 'gauntlet':
        P(sh, G.box(0.22, 0.22, U * 0.78, 0.04), m.secondary, [0, 0, U * 0.5]);
        P(el, G.box(0.28, 0.28, F * 0.86, 0.05), m.primary, [0, 0, F * 0.48]);
        A(zone, R.glows[R.glows.push(P(el, G.box(0.09, 0.3, F * 0.7, 0.03), m.glowArm, [s * 0.16, 0, F * 0.5])) - 1]);
        break;
      case 'padded':
        P(sh, G.cap(0.19, U * 0.45), m.primary, [0, 0, U * 0.5], [HP, 0, 0]);
        P(el, G.box(0.28, 0.3, F * 0.8, 0.06), m.secondary, [0, 0, F * 0.48]);
        A(zone, P(el, G.box(0.04, 0.16, F * 0.4, 0.01), m.tertiary, [s * 0.15, 0.04, F * 0.5]));
        P(el, G.cyl(0.17, 0.17, 0.08, 14), m.dark, [0, 0, F * 0.9], [HP, 0, 0]);
        break;
      case 'rail':
        P(sh, G.box(0.2, 0.22, U * 0.7, 0.04), m.primary, [0, 0, U * 0.5]);
        P(el, G.box(0.17, 0.17, F * 0.9, 0.03), m.dark, [0, 0, F * 0.48]);
        for (const y of [0.07, -0.07]) P(el, G.cyl(0.018, 0.018, F * 0.9, 6), m.chrome, [s * 0.12, y, F * 0.48], [HP, 0, 0]);
        A(zone, P(el, G.box(0.22, 0.26, F * 0.6, 0.03), m.primary, [s * 0.02, 0.05, F * 0.42]));
        R.glows.push(P(el, G.box(0.015, 0.015, F * 0.5, 0.004), m.glow, [s * 0.13, 0.17, F * 0.42]));
        break;
      case 'jag':
        P(sh, G.cap(0.16, U * 0.55), m.dark, [0, 0, U * 0.5], [HP, 0, 0]);
        A(zone, P(sh, G.box(0.26, 0.12, U * 0.5, 0.02), m.secondary, [0, 0.13, U * 0.5], [0, 0, s * 0.2]));
        P(el, G.box(0.3, 0.32, F * 0.88, 0.05), m.primary, [0, 0, F * 0.48]);
        for (let i = 0; i < 3; i++) A(zone, P(el, G.box(0.08, 0.2, 0.16, 0.02), m.secondary, [s * 0.17, 0.08, F * (0.22 + i * 0.25)], [0.5, 0, s * 0.3]));
        break;
    }
    // fist
    switch (st.fist) {
      case 'block':
        P(fist, G.box(0.3, 0.3, 0.3, 0.06), st.arm === 'padded' ? m.brown : m.dark, [0, 0, 0.12]);
        P(fist, G.box(0.32, 0.12, 0.1, 0.03), m.primary, [0, 0.07, 0.25]);
        break;
      case 'round':
        P(fist, G.sph(0.21, 18, 14), m.dark, [0, 0, 0.13], [0, 0, 0], [1, 0.92, 1.08]);
        P(fist, G.cyl(0.18, 0.18, 0.08, 16), m.chrome, [0, 0, 0.02], [HP, 0, 0]);
        break;
      case 'stud':
        P(fist, G.box(0.28, 0.28, 0.28, 0.05), m.primary, [0, 0, 0.12]);
        for (let i = 0; i < 4; i++) P(fist, G.cyl(0.03, 0.035, 0.05, 8), m.chrome, [-0.1 + i * 0.067, 0.07, 0.28], [HP, 0, 0]);
        break;
      case 'claw':
        P(fist, G.box(0.22, 0.2, 0.16, 0.04), m.dark, [0, 0, 0.06]);
        for (let i = 0; i < 3; i++) {
          const f = new THREE.Group(); f.position.set(-0.07 + i * 0.07, 0.06, 0.13); f.rotation.x = 0.5; fist.add(f);
          P(f, G.box(0.055, 0.055, 0.14, 0.015), m.joint, [0, 0, 0.06]);
          P(f, G.box(0.05, 0.05, 0.12, 0.015), m.secondary, [0, -0.05, 0.13], [1.0, 0, 0]);
        }
        P(fist, G.box(0.05, 0.05, 0.14, 0.015), m.joint, [s * 0.12, -0.04, 0.1], [0.5, 0, -s * 0.5]);
        break;
    }
  }

  // ---------------- legs
  for (const s of [1, -1]) {
    const hip = s > 0 ? R.hipL : R.hipR, kn = s > 0 ? R.knL : R.knR, foot = s > 0 ? R.footL : R.footR;
    const T = d.thigh, S = d.shin;
    P(hip, G.cyl(0.08, 0.08, T, 10), m.joint, [0, 0, T / 2], [HP, 0, 0]);
    P(kn, G.sph(0.13), m.joint);
    P(kn, G.cyl(0.07, 0.07, S, 10), m.joint, [0, 0, S / 2], [HP, 0, 0]);
    switch (st.leg) {
      case 'block':
        P(hip, G.box(0.3, 0.3, T * 0.85, 0.05), m.secondary, [0, 0, T * 0.5]);
        P(hip, G.box(0.32, 0.08, T * 0.7, 0.03), m.primary, [0, 0.17, T * 0.48]);
        P(kn, G.box(0.26, 0.1, 0.24, 0.03), m.primary, [0, 0.15, 0.02]);
        P(kn, G.box(0.34, 0.36, S * 0.82, 0.05), m.primary, [0, 0.02, S * 0.5]);
        R.glows.push(P(kn, G.box(0.02, 0.02, S * 0.4, 0.005), m.glow, [s * 0.17, 0.2, S * 0.5]));
        break;
      case 'pod':
        P(hip, G.cap(0.2, T * 0.5), m.primary, [0, 0, T * 0.5], [HP, 0, 0]);
        P(kn, G.cap(0.18, S * 0.5), m.secondary, [0, 0, S * 0.52], [HP, 0, 0]);
        P(kn, G.sph(0.17), m.primary, [0, 0.05, 0]);
        break;
      case 'armored':
        P(hip, G.box(0.28, 0.3, T * 0.85, 0.05), m.primary, [0, 0, T * 0.5]);
        R.glows.push(P(hip, G.box(0.1, 0.03, T * 0.4, 0.01), s > 0 ? m.glowLegL : m.glowLegR, [0, 0.16, T * 0.5]));
        P(kn, G.box(0.3, 0.34, S * 0.85, 0.05), m.secondary, [0, 0.02, S * 0.5]);
        R.glows.push(P(kn, G.box(0.04, 0.03, S * 0.6, 0.01), s > 0 ? m.glowLegL : m.glowLegR, [s * 0.1, 0.19, S * 0.5]));
        P(kn, G.box(0.24, 0.1, 0.22, 0.03), m.primary, [0, 0.14, 0.02]);
        break;
      case 'heavy':
        P(hip, G.box(0.38, 0.42, T * 0.85, 0.08), m.primary, [0, 0, T * 0.5]);
        P(hip, G.box(0.22, 0.04, 0.2, 0.01), s > 0 ? m.secondary : m.tertiary, [0, 0.22, T * 0.4]);
        P(kn, G.box(0.32, 0.34, S * 0.85, 0.06), m.primary, [0, 0.02, S * 0.5]);
        P(kn, G.box(0.24, 0.12, 0.22, 0.03), m.dark, [0, 0.14, 0.02]);
        break;
      case 'plated':
        P(hip, G.box(0.28, 0.3, T * 0.85, 0.04), m.primary, [0, 0, T * 0.5]);
        P(kn, G.box(0.22, 0.24, S * 0.85, 0.03), m.dark, [0, 0, S * 0.5]);
        P(kn, G.box(0.3, 0.14, S * 0.8, 0.03), m.primary, [0, 0.12, S * 0.45], [0.05, 0, 0]);
        R.glows.push(P(kn, G.box(0.015, 0.015, S * 0.5, 0.004), m.glow, [0, 0.2, S * 0.45]));
        break;
      case 'jag':
        P(hip, G.box(0.34, 0.34, T * 0.85, 0.05), m.secondary, [0, 0, T * 0.5]);
        P(kn, G.box(0.34, 0.36, S * 0.85, 0.05), m.primary, [0, 0.02, S * 0.5]);
        for (let i = 0; i < 2; i++) P(kn, G.cone(0.05, 0.18, 6), m.dark, [0, 0.22, S * (0.3 + i * 0.3)], [-0.4, 0, 0]);
        break;
    }
    // foot (child of root, positioned per frame)
    const fs = st.foot === 'tread' && s > 0 ? 'boot' : st.foot;
    switch (fs) {
      case 'wheel':
        P(foot, G.box(0.3, 0.15, 0.46, 0.04), m.dark, [0, 0.075, 0.08]);
        P(foot, G.box(0.28, 0.06, 0.2, 0.02), m.primary, [0, 0.17, 0.18]);
        P(foot, G.cyl(0.15, 0.15, 0.1, 18), m.rubber, [0, 0.15, -0.17], [0, 0, HP]);
        P(foot, G.cyl(0.07, 0.07, 0.12, 10), m.chrome, [0, 0.15, -0.17], [0, 0, HP]);
        break;
      case 'round':
        P(foot, G.sph(0.2, 18, 12), m.dark, [0, 0.08, 0.08], [0, 0, 0], [1.0, 0.5, 1.35]);
        break;
      case 'boot':
        P(foot, G.box(0.3, 0.16, 0.5, 0.05), m.dark, [0, 0.08, 0.08]);
        P(foot, G.box(0.28, 0.08, 0.2, 0.03), m.primary, [0, 0.16, 0.24]);
        break;
      case 'tread':
        P(foot, G.box(0.32, 0.2, 0.62, 0.08), m.rubber, [0, 0.1, 0.06]);
        for (let i = 0; i < 3; i++) P(foot, G.cyl(0.08, 0.08, 0.34, 12), m.joint, [0, 0.1, -0.14 + i * 0.2], [0, 0, HP]);
        P(foot, G.box(0.2, 0.08, 0.4, 0.02), m.secondary, [0, 0.22, 0.06]);
        break;
      case 'claw':
        P(foot, G.box(0.3, 0.14, 0.3, 0.04), m.dark, [0, 0.07, 0]);
        for (let i = 0; i < 3; i++) P(foot, G.cone(0.05, 0.26, 6), m.secondary, [-0.1 + i * 0.1, 0.05, 0.24], [HP, 0, 0]);
        break;
    }
  }

  // overdrive aura light
  R.aura = new THREE.PointLight(def.colors.accent, 0, 5, 2); R.aura.position.set(0, 0.2, 0.6); R.chest.add(R.aura);
  R.root.traverse(o => { if (o.isMesh) o.userData.robot = true; });
  if (opts.scale) R.root.scale.setScalar(opts.scale);
  return R;
}

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

// pose a robot statically (menu display, dormant hangar mechs)
function poseStatic(R, kind = 'idle', t = 0) {
  const d = R.dims, sc = R.root.scale.x;
  R.root.updateMatrixWorld(true);
  const up = V3(0, 1, 0), fwd = V3(0, 0, 1).applyQuaternion(R.root.quaternion);
  for (const s of [1, -1]) {
    const sh = s > 0 ? R.shL : R.shR, el = s > 0 ? R.elL : R.elR;
    let tgt;
    if (kind === 'dormant') tgt = V3(s * (d.shX + 0.1), d.hipH + 0.1, 0.25);
    else if (kind === 'victory') tgt = V3(s * (d.shX + 0.15), d.hipH + d.spineY + d.chestY + 1.3, 0.2);
    else tgt = V3(s * 0.26, d.hipH + d.spineY + d.chestY + d.shY + 0.02 + Math.sin(t * 3 + s) * 0.02, 0.58);
    R.root.localToWorld(tgt);
    const pole = V3(s, -1, -0.4).applyQuaternion(R.root.quaternion);
    solveIK(sh, el, d.upper * sc, d.fore * sc, tgt, pole, up);
  }
  for (const s of [1, -1]) {
    const hip = s > 0 ? R.hipL : R.hipR, kn = s > 0 ? R.knL : R.knR, foot = s > 0 ? R.footL : R.footR;
    foot.position.set(s * d.stanceW, 0, s * 0.1);
    const ank = V3(s * d.stanceW, d.ankle, s * 0.1); R.root.localToWorld(ank);
    solveIK(hip, kn, d.thigh * sc, d.shin * sc, ank, fwd, fwd);
  }
}
