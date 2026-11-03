// ============================================================================
// FX: spark streaks, glow points, smoke, flash lights, physical debris
// ============================================================================
const RING_Y = 1.0;      // canvas height
const RING_H = 3.7;      // half size inside the ropes

const PointShader = (additive) => new THREE.ShaderMaterial({
  uniforms: { uScale: { value: 600 } },
  vertexShader: `attribute float size; attribute float alpha; attribute vec3 color; varying float vA; varying vec3 vC; uniform float uScale;
    void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); gl_PointSize=size*uScale/max(0.1,-mv.z); gl_Position=projectionMatrix*mv; vA=alpha; vC=color; }`,
  fragmentShader: additive
    ? `varying float vA; varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d); a*=a; gl_FragColor=vec4(vC*a*vA,1.0); }`
    : `varying float vA; varying vec3 vC; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.1,d); gl_FragColor=vec4(vC,a*vA); }`,
  transparent: true, depthWrite: false,
  blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
});

class PointPool {
  constructor(n, additive) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.size = new Float32Array(n); this.alpha = new Float32Array(n); this.col = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n); this.s0 = new Float32Array(n); this.s1 = new Float32Array(n);
    this.grav = new Float32Array(n); this.drag = new Float32Array(n); this.a0 = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size', new THREE.BufferAttribute(this.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.mat = PointShader(additive);
    this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 5 : 4;
  }
  emit(x, y, z, vx, vy, vz, life, s0, s1, r, g, b, a = 1, grav = 0, drag = 0) {
    const i = this.i; this.i = (this.i + 1) % this.n;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.life[i] = life; this.max[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a;
    this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b; this.grav[i] = grav; this.drag[i] = drag;
  }
  update(dt) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] -= dt; const k = 1 - Math.max(0, this.life[i]) / this.max[i];
      const dr = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= dr; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * dr - this.grav[i] * dt; this.vel[i * 3 + 2] *= dr;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      this.size[i] = lerp(this.s0[i], this.s1[i], k);
      this.alpha[i] = this.a0[i] * (k < 0.1 ? k / 0.1 : 1 - (k - 0.1) / 0.9);
    }
    const a = this.mesh.geometry.attributes;
    a.position.needsUpdate = a.size.needsUpdate = a.alpha.needsUpdate = a.color.needsUpdate = true;
  }
  clear() { this.life.fill(0); this.alpha.fill(0); }
}

const FX = {
  init() {
    this.group = new THREE.Group(); this.group.name = 'fx';
    // spark streaks
    this.maxS = 900; this.sp = new Float32Array(this.maxS * 10); this.si = 0;
    const g = new THREE.BufferGeometry();
    this.sPos = new Float32Array(this.maxS * 6); this.sCol = new Float32Array(this.maxS * 6);
    g.setAttribute('position', new THREE.BufferAttribute(this.sPos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.sCol, 3).setUsage(THREE.DynamicDrawUsage));
    this.sparks = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.sparks.frustumCulled = false; this.sparks.renderOrder = 6;
    this.glow = new PointPool(500, true);
    this.smoke = new PointPool(400, false);
    this.group.add(this.sparks, this.glow.mesh, this.smoke.mesh);
    this.lights = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffaa55, 0, 6, 2); this.group.add(l); return l; });
    this.li = 0;
    this.emitters = [];
    scene.add(this.group);
    this.resize();
  },
  resize() {
    if (!this.glow) return;
    const h = renderer.domElement.height; const s = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    this.glow.mat.uniforms.uScale.value = s; this.smoke.mat.uniforms.uScale.value = s;
  },
  spark(p, dir, n, speed, col = [4, 2.4, 1.0], spread = 0.9, life = 0.45) {
    for (let k = 0; k < n; k++) {
      const i = this.si; this.si = (this.si + 1) % this.maxS; const o = i * 10;
      let vx = dir.x + rand(-spread, spread), vy = dir.y + rand(-spread * 0.6, spread) + 0.3, vz = dir.z + rand(-spread, spread);
      const l = Math.hypot(vx, vy, vz) || 1, s = speed * rand(0.35, 1.25);
      this.sp[o] = p.x; this.sp[o + 1] = p.y; this.sp[o + 2] = p.z;
      this.sp[o + 3] = vx / l * s; this.sp[o + 4] = vy / l * s; this.sp[o + 5] = vz / l * s;
      this.sp[o + 6] = this.sp[o + 7] = life * rand(0.5, 1.3);
      this.sp[o + 8] = rand(0.7, 1.3); this.sp[o + 9] = Math.random() < 0.2 ? 1 : 0;
      this._col = col;
      this.sCol[i * 6] = col[0]; this.sCol[i * 6 + 1] = col[1]; this.sCol[i * 6 + 2] = col[2];
    }
  },
  burst(p, color = [3, 1.6, 0.6], size = 0.9) {
    this.glow.emit(p.x, p.y, p.z, 0, 0, 0, 0.16, size, size * 2.2, color[0], color[1], color[2], 1);
    for (let i = 0; i < 6; i++) this.glow.emit(p.x, p.y, p.z, rand(-3, 3), rand(-1, 4), rand(-3, 3), rand(0.25, 0.6), 0.08, 0.02, color[0], color[1], color[2], 1, 9, 1);
  },
  puff(p, n = 6, dark = 0.12, size = 0.6, up = 0.6, spread = 0.4, life = 1.6) {
    for (let i = 0; i < n; i++) this.smoke.emit(p.x + rand(-.1, .1), p.y + rand(-.1, .1), p.z + rand(-.1, .1), rand(-spread, spread), rand(0.2, 1) * up, rand(-spread, spread), life * rand(0.6, 1.3), size * 0.5, size * rand(1.6, 2.6), dark, dark, dark * 1.05, 0.55, -0.15, 1.2);
  },
  oil(p, dir, n = 10) {
    for (let i = 0; i < n; i++) this.smoke.emit(p.x, p.y, p.z, dir.x * rand(1, 4) + rand(-1, 1), rand(0.5, 3), dir.z * rand(1, 4) + rand(-1, 1), rand(0.4, 0.8), 0.05, 0.03, 0.02, 0.018, 0.012, 0.95, 9.8, 0.5);
  },
  flash(p, color, intensity = 30, dist = 7) {
    const l = this.lights[this.li]; this.li = (this.li + 1) % this.lights.length;
    l.position.copy(p); l.color.set(color); l.intensity = intensity; l.distance = dist; l.userData.i0 = intensity;
  },
  addEmitter(obj, kind, rate) { this.emitters.push({ obj, kind, rate, acc: 0 }); },
  clearEmitters() { this.emitters.length = 0; },
  update(dt) {
    // sparks
    const sp = this.sp, P = this.sPos, C = this.sCol;
    for (let i = 0; i < this.maxS; i++) {
      const o = i * 10;
      if (sp[o + 6] <= 0) { P[i * 6] = P[i * 6 + 3] = 0; P[i * 6 + 1] = P[i * 6 + 4] = -50; P[i * 6 + 2] = P[i * 6 + 5] = 0; continue; }
      sp[o + 6] -= dt;
      sp[o + 4] -= 12 * dt;
      const dr = Math.exp(-1.5 * dt); sp[o + 3] *= dr; sp[o + 5] *= dr;
      sp[o] += sp[o + 3] * dt; sp[o + 1] += sp[o + 4] * dt; sp[o + 2] += sp[o + 5] * dt;
      const fl = Arena.groundAt(sp[o], sp[o + 2]);
      if (sp[o + 1] < fl) { sp[o + 1] = fl; sp[o + 4] *= -0.35; sp[o + 3] *= 0.6; sp[o + 5] *= 0.6; }
      const k = Math.max(0, sp[o + 6] / sp[o + 7]), tl = 0.028 * sp[o + 8];
      P[i * 6] = sp[o]; P[i * 6 + 1] = sp[o + 1]; P[i * 6 + 2] = sp[o + 2];
      P[i * 6 + 3] = sp[o] - sp[o + 3] * tl; P[i * 6 + 4] = sp[o + 1] - sp[o + 4] * tl; P[i * 6 + 5] = sp[o + 2] - sp[o + 5] * tl;
      // fade by scaling colour of the tail vertex
      const f = k * k;
      C[i * 6 + 3] = C[i * 6] * 0.15 * f; C[i * 6 + 4] = C[i * 6 + 1] * 0.15 * f; C[i * 6 + 5] = C[i * 6 + 2] * 0.15 * f;
      if (k < 0.02) { C[i * 6] *= 0.5; C[i * 6 + 1] *= 0.5; C[i * 6 + 2] *= 0.5; }
    }
    this.sparks.geometry.attributes.position.needsUpdate = true; this.sparks.geometry.attributes.color.needsUpdate = true;
    this.glow.update(dt); this.smoke.update(dt);
    for (const l of this.lights) { if (l.intensity > 0) { l.intensity = Math.max(0, l.intensity - l.userData.i0 * dt * 7); } }
    // continuous emitters (damaged parts smoking / sparking, welding etc.)
    for (const e of this.emitters) {
      e.acc += dt * e.rate;
      while (e.acc > 1) {
        e.acc -= 1;
        const p = e.obj.getWorldPosition(_fxv);
        if (e.kind === 'smoke') this.puff(p, 1, 0.08, 0.35, 1.2, 0.15, 1.4);
        else if (e.kind === 'sparks') { if (Math.random() < 0.35) this.spark(p, _fxd.set(rand(-1, 1), 0.5, rand(-1, 1)), randi(2, 6), 3, [3, 2.2, 1.2], 0.8, 0.35); }
        else if (e.kind === 'weld') { this.spark(p, _fxd.set(rand(-1, 1), rand(0, 1), rand(-1, 1)), randi(4, 10), 5, [2.2, 2.8, 4], 1, 0.5); if (Math.random() < 0.5) this.flash(p, 0x9fd8ff, 14, 8); }
        else if (e.kind === 'steam') this.smoke.emit(p.x, p.y, p.z, rand(-.2, .2), rand(1.5, 2.5), rand(-.2, .2), 2.5, 0.4, 2.2, 0.55, 0.58, 0.6, 0.18, -0.3, 0.6);
      }
    }
  },
  clear() { this.sp.fill(0); this.glow.clear(); this.smoke.clear(); for (const l of this.lights) l.intensity = 0; Debris.clear(); },
};
const _fxv = new THREE.Vector3(), _fxd = new THREE.Vector3();

// Physical armor debris: plates knocked off robots tumble, bounce and settle on the canvas or the floor.
const Debris = {
  list: [],
  add(mesh, vel, ang) {
    mesh.updateWorldMatrix(true, false);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    mesh.matrixWorld.decompose(p, q, s);
    mesh.removeFromParent(); scene.add(mesh);
    mesh.position.copy(p); mesh.quaternion.copy(q); mesh.scale.copy(s);
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    const r = mesh.geometry.boundingSphere.radius * Math.max(s.x, s.y, s.z) * 0.55;
    this.list.push({ mesh, vel, ang, r, sleep: false, t: 0 });
    if (this.list.length > 60) { const d = this.list.shift(); d.mesh.removeFromParent(); }
  },
  update(dt) {
    for (const d of this.list) {
      if (d.sleep) continue;
      d.t += dt;
      d.vel.y -= 14 * dt;
      d.mesh.position.addScaledVector(d.vel, dt);
      const ax = d.ang; d.mesh.rotateX(ax.x * dt); d.mesh.rotateY(ax.y * dt); d.mesh.rotateZ(ax.z * dt);
      const p = d.mesh.position;
      // ropes / posts keep most plates on the canvas
      const fl = Arena.groundAt(p.x, p.z);
      if (p.y - d.r < fl) {
        p.y = fl + d.r;
        if (Math.abs(d.vel.y) > 2.5) SFX.clank(Math.min(1, Math.abs(d.vel.y) / 8));
        d.vel.y *= -0.32; d.vel.x *= 0.62; d.vel.z *= 0.62; ax.multiplyScalar(0.6);
        if (d.vel.lengthSq() < 0.05 && d.t > 0.6) d.sleep = true;
      }
    }
  },
  clear() { for (const d of this.list) d.mesh.removeFromParent(); this.list.length = 0; },
};

// ---------------------------------------------------------------- screen popups
const Popups = {
  el: null,
  show(text, world, cls = '', dy = 0) {
    if (!this.el) this.el = $('popups');
    const v = world.clone().project(camera);
    if (v.z > 1) return;
    const d = document.createElement('div'); d.className = 'pop ' + cls; d.textContent = text;
    d.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px'; d.style.top = ((-v.y * 0.5 + 0.5) * innerHeight + dy) + 'px';
    this.el.appendChild(d); setTimeout(() => d.remove(), 1000);
  },
  clear() { if (this.el) this.el.innerHTML = ''; },
};

// ---------------------------------------------------------------- fist motion trails (power punches)
class Trail {
  constructor(color) {
    this.n = 14; this.pts = []; for (let i = 0; i < this.n; i++) this.pts.push([V3(), V3()]);
    this.pos = new Float32Array(this.n * 2 * 3); this.al = new Float32Array(this.n * 2);
    const idx = []; for (let i = 0; i < this.n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const g = new THREE.BufferGeometry(); g.setIndex(idx);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('al', new THREE.BufferAttribute(this.al, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uC: { value: new THREE.Color(color).multiplyScalar(2.2) }, uK: { value: 0 } },
      vertexShader: `attribute float al; varying float vA; void main(){ vA=al; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 uC; uniform float uK; varying float vA; void main(){ gl_FragColor=vec4(uC*vA*uK,1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 7; scene.add(this.mesh);
    this.k = 0;
  }
  push(p, on, dt) {
    const last = this.pts.pop(); last[0].set(p.x, p.y + 0.13, p.z); last[1].set(p.x, p.y - 0.13, p.z); this.pts.unshift(last);
    this.k = on ? Math.min(1, this.k + dt * 12) : Math.max(0, this.k - dt * 6);
    this.mat.uniforms.uK.value = this.k; this.mesh.visible = this.k > 0.01;
    for (let i = 0; i < this.n; i++) {
      const [a, b] = this.pts[i]; const o = i * 6;
      this.pos[o] = a.x; this.pos[o + 1] = a.y; this.pos[o + 2] = a.z; this.pos[o + 3] = b.x; this.pos[o + 4] = b.y; this.pos[o + 5] = b.z;
      const f = Math.pow(1 - i / (this.n - 1), 1.6) * 0.5; this.al[i * 2] = f; this.al[i * 2 + 1] = f;
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.al.needsUpdate = true;
  }
  dispose() { this.mesh.removeFromParent(); this.mesh.geometry.dispose(); this.mat.dispose(); }
}
function rumble(strength, ms) {
  try { const p = Input.pad; const a = p && p.vibrationActuator; if (a && a.playEffect) a.playEffect('dual-rumble', { duration: ms, strongMagnitude: clamp(strength, 0, 1), weakMagnitude: clamp(strength * 0.7, 0, 1) }); } catch (e) { }
  try { if (IS_TOUCH && navigator.vibrate) navigator.vibrate(Math.round(ms * 0.6)); } catch (e) { }
}
