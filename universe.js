/* ================================================================
   universe.js — Universo 3D para mi pastelito
   Galaxia espiral + nebulosa + corazón de partículas que late +
   mensajes orbitando en 3D. Hecho con Three.js (WebGL).
   ================================================================ */

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const stage = document.getElementById('universeStage');
const canvas = document.getElementById('universeCanvas');
const labelsEl = document.getElementById('uLabels');

/* Los mensajes y el modal viven en script.js; esperamos a que estén listos */
function whenReady() {
  return new Promise(resolve => {
    if (window.UNIVERSE) return resolve(window.UNIVERSE);
    window.addEventListener('universe:ready', () => resolve(window.UNIVERSE), { once: true });
  });
}

/* Si WebGL o la librería fallan, mostramos los mensajes como estrellitas sueltas */
function fallback(api) {
  stage.classList.add('u-fallback');
  api.messages.forEach((m, i) => {
    const b = document.createElement('button');
    b.className = 'u-label';
    b.innerHTML = `<span class="u-label__dot"></span>${m}`;
    b.addEventListener('click', () => api.open(i));
    labelsEl.appendChild(b);
  });
}

(async () => {
  const api = await whenReady();
  let THREE;
  try {
    THREE = await import(THREE_URL);
    const test = document.createElement('canvas');
    if (!(test.getContext('webgl2') || test.getContext('webgl'))) throw new Error('sin webgl');
  } catch (err) {
    console.warn('Universo 3D no disponible:', err);
    return fallback(api);
  }
  build(THREE, api);
})();

function build(THREE, api) {
  const small = () => stage.clientWidth < 640;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const rand = (a, b) => a + Math.random() * (b - a);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500);
  const world = new THREE.Group();          // galaxia + órbitas (gira con el arrastre)
  scene.add(world);

  /* ---------------- Shader de partículas brillantes ---------------- */
  const uniforms = {
    uTime: { value: 0 },
    uPixel: { value: DPR },
    uAssemble: { value: 0 },
    uBeat: { value: 0 },
  };

  const pointVert = /* glsl */`
    uniform float uTime; uniform float uPixel; uniform float uAssemble; uniform float uBeat;
    uniform float uSpin; uniform float uMode;
    attribute float aSize; attribute vec3 aColor; attribute float aPhase; attribute vec3 aStart;
    varying vec3 vColor; varying float vAlpha;
    void main(){
      vec3 p = position;
      float tw = 0.65 + 0.35 * sin(uTime * (1.4 + fract(aPhase * 7.13) * 2.2) + aPhase * 6.2831);
      if (uMode < 0.5) {
        // GALAXIA: rotación diferencial (el centro gira más rápido)
        float r = length(p.xz);
        float ang = atan(p.z, p.x) + uTime * uSpin / (0.7 + r * 0.32);
        p.x = cos(ang) * r; p.z = sin(ang) * r;
      } else if (uMode < 1.5) {
        // CORAZÓN: se arma desde estrellas dispersas y late
        float k = clamp(uAssemble * 1.15 - aPhase * 0.15, 0.0, 1.0);
        k = 1.0 - pow(1.0 - k, 3.0);
        p = mix(aStart, position, k);
        p *= 1.0 + uBeat * 0.075;
        p += 0.025 * vec3(sin(uTime * 3.0 + aPhase * 40.0), cos(uTime * 2.6 + aPhase * 31.0), 0.0);
      } else if (uMode < 2.5) {
        // ESTELA: chispas que suben del núcleo al corazón en espiral
        float t = fract(uTime * (0.16 + fract(aPhase * 3.7) * 0.18) + aPhase);
        vec3 a = aStart; vec3 b = position;
        p = mix(a, b, t);
        float sw = (1.0 - t) * 0.55 + 0.08;
        p.x += cos(t * 14.0 + aPhase * 6.28) * sw;
        p.z += sin(t * 14.0 + aPhase * 6.28) * sw;
        tw *= sin(t * 3.14159);
      }
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = aSize * uPixel * (30.0 / -mv.z) * (0.6 + 0.4 * tw);
      vColor = aColor; vAlpha = tw;
    }`;
  const pointFrag = /* glsl */`
    uniform float uOpacity;
    varying vec3 vColor; varying float vAlpha;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float d = length(c);
      float core = smoothstep(0.5, 0.0, d);
      float glow = pow(core, 2.2);
      // pequeño destello en cruz para las más brillantes
      float cross = max(0.0, 1.0 - abs(c.x) * 18.0) * max(0.0, 1.0 - abs(c.y) * 2.2)
                  + max(0.0, 1.0 - abs(c.y) * 18.0) * max(0.0, 1.0 - abs(c.x) * 2.2);
      float a = (glow + cross * 0.18 * step(0.9, vAlpha)) * vAlpha * uOpacity;
      gl_FragColor = vec4(vColor * a, a);
    }`;

  function makePoints(data, { mode = 0, spin = 0, opacity = 1 } = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(data.col, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(data.size, 1));
    g.setAttribute('aPhase', new THREE.Float32BufferAttribute(data.phase, 1));
    g.setAttribute('aStart', new THREE.Float32BufferAttribute(data.start || data.pos, 3));
    const m = new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uSpin: { value: spin }, uMode: { value: mode }, uOpacity: { value: opacity } },
      vertexShader: pointVert, fragmentShader: pointFrag,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(g, m);
    pts.frustumCulled = false;
    return pts;
  }
  const C = hex => new THREE.Color(hex);
  const mix = (a, b, t) => a.clone().lerp(b, t);
  function bucket() { return { pos: [], col: [], size: [], phase: [], start: [] }; }
  function push(d, x, y, z, c, s, sx, sy, sz) {
    d.pos.push(x, y, z); d.col.push(c.r, c.g, c.b); d.size.push(s); d.phase.push(Math.random());
    d.start.push(sx ?? x, sy ?? y, sz ?? z);
  }

  /* ---------------- Galaxia espiral ---------------- */
  const R = 10;
  const pal = {
    core: C('#fff1f7'), hot: C('#ff8cc0'), pink: C('#ff3f8e'), violet: C('#8b5cff'), blue: C('#4f7dff'),
    gold: C('#ffd27a'), white: C('#ffffff'),
  };
  {
    const N = small() ? 11000 : 22000;
    const ARMS = 3, d = bucket();
    for (let i = 0; i < N; i++) {
      const r = Math.pow(Math.random(), 1.45) * R;
      const branch = (i % ARMS) / ARMS * Math.PI * 2;
      const curl = r * 0.62;
      const spread = 0.18 + r * 0.075;
      const rx = Math.pow(Math.random(), 2.4) * (Math.random() < .5 ? 1 : -1) * spread * 2;
      const rz = Math.pow(Math.random(), 2.4) * (Math.random() < .5 ? 1 : -1) * spread * 2;
      const thick = 0.06 + Math.max(0, 1 - r / 3) * 0.55;
      const ry = (Math.random() - .5) * thick * Math.pow(Math.random(), 1.5) * 2;
      const t = r / R;
      let c = t < .12 ? mix(pal.core, pal.hot, t / .12)
            : t < .45 ? mix(pal.hot, pal.pink, (t - .12) / .33)
            : t < .75 ? mix(pal.pink, pal.violet, (t - .45) / .3)
            : mix(pal.violet, pal.blue, (t - .75) / .25);
      const roll = Math.random();
      if (roll < .05) c = pal.gold; else if (roll < .1) c = pal.white;
      push(d, Math.cos(branch + curl) * r + rx, ry, Math.sin(branch + curl) * r + rz, c,
        rand(1.8, 4.2) * (1.25 - t * .4));
    }
    world.add(makePoints(d, { spin: .055, opacity: 1 }));
  }

  /* Nebulosa: partículas grandes y muy tenues a lo largo de los brazos */
  {
    const d = bucket(), N = small() ? 380 : 700;
    for (let i = 0; i < N; i++) {
      const r = rand(.8, R * .95);
      const branch = (i % 3) / 3 * Math.PI * 2 + r * .62 + rand(-.35, .35);
      const c = Math.random() < .55 ? C('#ff3f8e') : (Math.random() < .6 ? C('#8b5cff') : C('#ff9ad0'));
      push(d, Math.cos(branch) * r, rand(-.25, .25), Math.sin(branch) * r, c, rand(30, 70) * (1 - r / R * .4));
    }
    world.add(makePoints(d, { spin: .055, opacity: .045 }));
  }

  /* Núcleo brillante (sprite con degradado) */
  function glowTexture(stops) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    stops.forEach(([o, c]) => gr.addColorStop(o, c));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const coreTex = glowTexture([[0, 'rgba(255,245,250,1)'], [.12, 'rgba(255,190,220,.9)'], [.35, 'rgba(255,70,150,.35)'], [1, 'rgba(120,20,90,0)']]);
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: coreTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  core.scale.set(4.2, 4.2, 1);
  world.add(core);
  const haze = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture([[0, 'rgba(255,80,160,.35)'], [.5, 'rgba(140,60,255,.12)'], [1, 'rgba(0,0,0,0)']]),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8,
  }));
  haze.scale.set(22, 22, 1); haze.material.opacity = .45;
  world.add(haze);

  /* ---------------- Fondo de estrellas lejanas ---------------- */
  const sky = (() => {
    const d = bucket(), N = small() ? 1400 : 2600;
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = rand(60, 140);
      const s = Math.sqrt(1 - u * u);
      const c = Math.random() < .15 ? pal.gold : (Math.random() < .3 ? C('#ffc6e2') : pal.white);
      push(d, Math.cos(th) * s * r, u * r, Math.sin(th) * s * r, c, rand(3, 9));
    }
    const p = makePoints(d, { mode: 3 });
    scene.add(p);
    return p;
  })();

  /* ---------------- Corazón 3D de partículas ---------------- */
  const HEART_Y = 3.3, HS = 3.0;
  const heart = new THREE.Group();
  heart.position.y = HEART_Y;
  scene.add(heart);
  const heartXY = t => [16 * Math.sin(t) ** 3 / 17, (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17];
  {
    const d = bucket(), N = small() ? 4200 : 7500;
    const pinks = [C('#ff2d78'), C('#ff5fa2'), C('#ff8cc0'), C('#ffb8dd')];
    for (let i = 0; i < N; i++) {
      const t = Math.random() * Math.PI * 2;
      const [hx, hy] = heartXY(t);
      const outline = Math.random() < .38;
      const s = outline ? rand(.97, 1.02) : Math.pow(Math.random(), .45);
      const depth = Math.sqrt(Math.max(0, 1 - s * s)) * .55;
      const x = hx * s * HS, y = (hy * s + .08) * HS, z = rand(-1, 1) * depth * HS;
      let c = pinks[(Math.random() * pinks.length) | 0];
      if (Math.random() < (outline ? .22 : .08)) c = pal.white;
      // posición inicial: estrellas dispersas en una esfera amplia
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = rand(6, 16);
      const sq = Math.sqrt(1 - u * u);
      push(d, x, y, z, c, outline ? rand(2.6, 4.6) : rand(1.5, 3.2),
        Math.cos(th) * sq * rr, u * rr - HEART_Y, Math.sin(th) * sq * rr);
    }
    heart.add(makePoints(d, { mode: 1 }));
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture([[0, 'rgba(255,90,160,.55)'], [.45, 'rgba(255,45,120,.18)'], [1, 'rgba(0,0,0,0)']]),
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    glow.scale.set(HS * 4.2, HS * 4.2, 1);
    heart.add(glow);
    heart.userData.glow = glow;
  }

  /* Estela de chispas del núcleo al corazón */
  {
    const d = bucket(), N = small() ? 260 : 480;
    const tipY = HEART_Y + (heartXY(Math.PI)[1] + .08) * HS;
    for (let i = 0; i < N; i++) {
      const c = Math.random() < .3 ? pal.gold : (Math.random() < .5 ? pal.white : C('#ff8cc0'));
      push(d, rand(-.15, .15), tipY + rand(-.1, .3), rand(-.15, .15), c, rand(1.2, 2.8),
        rand(-.5, .5), rand(.1, .4), rand(-.5, .5));
    }
    scene.add(makePoints(d, { mode: 2 }));
  }

  /* ---------------- Anillos de órbita + mensajes ---------------- */
  const rings = [
    { r: 7.4, tilt: .06, roll: -.05, speed: .06, y: .4 },
    { r: 9.8, tilt: -.05, roll: .06, speed: -.045, y: 0 },
    { r: 12.2, tilt: .04, roll: -.03, speed: .03, y: -.4 },
  ];
  rings.forEach(rg => {
    rg.group = new THREE.Group();
    rg.group.position.y = rg.y;
    rg.group.rotation.set(rg.tilt, 0, rg.roll);
    world.add(rg.group);
    const d = bucket(), N = Math.round(rg.r * 70);
    for (let i = 0; i < N; i++) {
      const a = i / N * Math.PI * 2, j = rand(-.06, .06);
      const c = Math.random() < .2 ? pal.gold : C('#ffa6cf');
      push(d, Math.cos(a) * (rg.r + j), rand(-.03, .03), Math.sin(a) * (rg.r + j), c, rand(.6, 1.5));
    }
    rg.group.add(makePoints(d, { opacity: .55 }));
  });

  const labels = api.messages.map((text, i) => {
    const ringIndex = i % rings.length;
    const ring = rings[ringIndex];
    const onRing = api.messages.filter((_, k) => k % rings.length === ringIndex).length;
    const slot = Math.floor(i / rings.length);
    const el = document.createElement('button');
    el.className = 'u-label';
    el.type = 'button';
    el.innerHTML = `<span class="u-label__dot"></span><span class="u-label__txt">${text}</span>`;
    labelsEl.appendChild(el);
    const lab = { el, ring, angle: slot / onRing * Math.PI * 2 + ringIndex * .7, index: i, v: new THREE.Vector3() };
    el.addEventListener('click', e => {
      if (moved > 6) { e.preventDefault(); return; }
      burst(el);
      api.open(i);
    });
    el.addEventListener('pointerenter', () => (hovering = true));
    el.addEventListener('pointerleave', () => (hovering = false));
    return lab;
  });

  /* Chispitas al tocar un mensaje */
  function burst(el) {
    const r = el.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    for (let k = 0; k < 14; k++) {
      const s = document.createElement('span');
      s.className = 'u-spark';
      s.style.left = `${r.left - sr.left + r.width / 2}px`;
      s.style.top = `${r.top - sr.top + r.height / 2}px`;
      const a = Math.random() * Math.PI * 2, dist = rand(30, 90);
      s.style.setProperty('--dx', `${Math.cos(a) * dist}px`);
      s.style.setProperty('--dy', `${Math.sin(a) * dist}px`);
      stage.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
    beatBoost = 1;
  }

  /* ---------------- Interacción: arrastrar para girar ---------------- */
  let yaw = 0, pitch = 0, vYaw = 0, vPitch = 0, dragging = false, lx = 0, ly = 0, moved = 0, hovering = false;
  stage.addEventListener('pointerdown', e => {
    dragging = true; moved = 0; lx = e.clientX; ly = e.clientY;
    stage.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    moved += Math.abs(dx) + Math.abs(dy);
    lx = e.clientX; ly = e.clientY;
    vYaw = dx * .006; vPitch = dy * .004;
    yaw += vYaw; pitch = Math.max(-.32, Math.min(.5, pitch + vPitch));
  });
  window.addEventListener('pointerup', () => { dragging = false; stage.classList.remove('is-dragging'); });
  window.addEventListener('pointercancel', () => { dragging = false; stage.classList.remove('is-dragging'); });

  /* ---------------- Tamaño y cámara ---------------- */
  let W = 1, H = 1, camDist = 18;
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camDist = W / H < 1 ? 20 + (1 - W / H) * 15 : 18.5;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  /* Pausar cuando no se ve; armar el corazón al entrar en pantalla */
  let visible = false, assembleStart = null;
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible && assembleStart === null) assembleStart = performance.now();
    if (visible) requestAnimationFrame(loop);
  }, { threshold: .15 }).observe(stage);

  /* ---------------- Bucle de animación ---------------- */
  const clock = new THREE.Clock();
  let beatBoost = 0, autoSpeed = .0;
  const tmp = new THREE.Vector3(), camPos = new THREE.Vector3();

  function heartbeat(t) {               // doble latido: pum-pum ... pum-pum
    const p = (t % 1.25) / 1.25;
    const a = Math.exp(-Math.pow((p - .08) / .045, 2));
    const b = Math.exp(-Math.pow((p - .26) / .05, 2)) * .65;
    return a + b;
  }

  function loop() {
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), .05);
    const t = clock.elapsedTime;
    uniforms.uTime.value = t;

    // armado del corazón (≈2.6 s)
    if (assembleStart !== null) uniforms.uAssemble.value = Math.min(1, (performance.now() - assembleStart) / 2600);
    beatBoost *= .94;
    uniforms.uBeat.value = heartbeat(t) * .85 + beatBoost * .6;
    heart.userData.glow.material.opacity = .65 + uniforms.uBeat.value * .5;

    // giro automático suave que se calma si ella está sobre un mensaje
    const targetAuto = hovering ? 0 : .09;
    autoSpeed += (targetAuto - autoSpeed) * .05;
    if (!dragging) {
      yaw += autoSpeed * dt + vYaw; vYaw *= .94;
      pitch += vPitch; vPitch *= .9;
      pitch += (0 - pitch) * .01;
      pitch = Math.max(-.32, Math.min(.5, pitch));
    }
    world.rotation.y = yaw;
    sky.rotation.y = yaw * .15 + t * .004;
    heart.rotation.y = Math.sin(t * .45) * .45 + yaw * .12;

    // cámara orbitando ligeramente en altura según el pitch
    const elev = .66 + pitch;
    camPos.set(0, Math.sin(elev) * camDist + 1.2, Math.cos(elev) * camDist);
    camera.position.lerp(camPos, .12);
    camera.lookAt(0, 1.6, 0);

    rings.forEach(rg => (rg.group.rotation.y += rg.speed * dt));
    renderer.render(scene, camera);

    // mensajes: posición 3D -> pantalla
    camera.updateMatrixWorld();
    const camInv = camera.matrixWorldInverse;
    labels.forEach(l => {
      const a = l.angle;
      tmp.set(Math.cos(a) * l.ring.r, 0, Math.sin(a) * l.ring.r);
      l.ring.group.localToWorld(tmp);
      l.v.copy(tmp).applyMatrix4(camInv);
      const z = -l.v.z;
      tmp.project(camera);
      const x = (tmp.x * .5 + .5) * W, y = (-tmp.y * .5 + .5) * H;
      const near = camDist - 10, far = camDist + 10;
      const f = 1 - Math.min(1, Math.max(0, (z - near) / (far - near)));   // 1 = adelante
      const scale = (small() ? .6 : .7) + f * .4;
      l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      l.el.style.opacity = (.12 + Math.pow(f, 1.4) * .88).toFixed(2);
      l.el.style.zIndex = String(10 + Math.round(f * 100));
      l.el.style.filter = f < .45 ? `blur(${((.45 - f) * 5).toFixed(1)}px)` : 'none';
      l.el.classList.toggle('is-back', f < .45);
    });

    requestAnimationFrame(loop);
  }
}
