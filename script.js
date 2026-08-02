/* ================================================================
   script.js
   Página romántica "Feliz Día de la Novia" para mi pastelito
   Organizado en módulos: Galaxia, Flotantes, Mensajes, Modal,
   Música, Chispas, Contador de estrellas, Efecto de escritura.
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     1. FONDO DE GALAXIA — estrellas parpadeantes + parallax
     ============================================================ */
  const canvas = document.getElementById('galaxy-canvas');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let mouseX = 0, mouseY = 0;

  function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
  }

  function generateStars(){
    const count = Math.floor((canvas.width * canvas.height) / 5500);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.4 + 0.3,
      baseAlpha: Math.random() * 0.6 + 0.3,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      phase: Math.random() * Math.PI * 2,
      parallax: Math.random() * 0.4 + 0.05
    }));
  }

  function drawStars(time){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(star => {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.phase) * 0.35 + 0.65;
      const alpha = star.baseAlpha * twinkle;
      const px = star.x + mouseX * star.parallax * 12;
      const py = star.y + mouseY * star.parallax * 12;

      ctx.beginPath();
      ctx.arc(px, py, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.shadowBlur = star.radius * 4;
      ctx.shadowColor = 'rgba(255,220,240,0.9)';
      ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5);
    mouseY = (e.clientY / window.innerHeight - 0.5);
  });

  resizeCanvas();
  requestAnimationFrame(drawStars);

  /* ============================================================
     2. ELEMENTOS FLOTANTES — corazones, estrellas, destellos,
        Snoopy y Hello Kitty flotando lentamente y al azar
     ============================================================ */
  const floatersLayer = document.getElementById('floaters-layer');

  // Símbolos de texto que se pueden usar como flotantes
  const symbolFloaters = [
    { cls: 'floater--heart', char: '💗' },
    { cls: 'floater--heart', char: '💕' },
    { cls: 'floater--heart-glow', char: '💖' },
    { cls: 'floater--star', char: '✦' },
    { cls: 'floater--star', char: '✧' },
    { cls: 'floater--sparkle', char: '✨' },
  ];

  // Rutas de imágenes reemplazables — coloca aquí tus propios archivos
  const imageFloaters = [
    'img/snoopy1.png',
    'img/snoopy2.png',
    'img/kitty1.png',
    'img/kitty2.png'
  ];

  function spawnFloater(){
    const useImage = Math.random() < 0.28;
    const el = document.createElement(useImage ? 'img' : 'span');
    el.classList.add('floater');

    const duration = 14 + Math.random() * 10; // 14–24s de recorrido
    const delay = Math.random() * 4;
    const left = Math.random() * 100;
    const size = 1.1 + Math.random() * 1.6; // rem para símbolos
    const opacity = (0.5 + Math.random() * 0.4).toFixed(2);

    el.style.left = `${left}vw`;
    el.style.bottom = '-60px';
    el.style.animationDuration = `${duration}s, ${duration}s`;
    el.style.animationDelay = `${delay}s, ${delay}s`;
    el.style.setProperty('--f-op', opacity);

    if (useImage){
      const src = imageFloaters[Math.floor(Math.random() * imageFloaters.length)];
      el.src = src;
      el.alt = '';
      el.classList.add('floater--img');
      // Si la imagen no existe todavía, se oculta con elegancia
      el.addEventListener('error', () => { el.style.display = 'none'; });
    } else {
      const symbol = symbolFloaters[Math.floor(Math.random() * symbolFloaters.length)];
      el.classList.add(symbol.cls);
      el.textContent = symbol.char;
      el.style.fontSize = `${size}rem`;
    }

    floatersLayer.appendChild(el);

    // Limpieza tras terminar la animación
    setTimeout(() => el.remove(), (duration + delay) * 1000 + 500);
  }

  // Generar flotantes continuamente, sin saturar la pantalla
  setInterval(spawnFloater, 900);
  for (let i = 0; i < 10; i++) setTimeout(spawnFloater, i * 300);

  /* ============================================================
     3. CHISPAS AL HACER CLIC
     ============================================================ */
  const sparkleLayer = document.getElementById('sparkle-layer');

  document.addEventListener('click', (e) => {
    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++){
      const spark = document.createElement('span');
      spark.className = 'click-spark';
      const angle = (Math.PI * 2 * i) / sparkCount;
      const distance = 30 + Math.random() * 30;
      spark.style.left = `${e.clientX}px`;
      spark.style.top = `${e.clientY}px`;
      spark.style.setProperty('--sx', `${Math.cos(angle) * distance}px`);
      spark.style.setProperty('--sy', `${Math.sin(angle) * distance}px`);
      sparkleLayer.appendChild(spark);
      setTimeout(() => spark.remove(), 750);
    }
  });

  /* ============================================================
     4. TRANSICIÓN AL SEGUNDO APARTADO + LLUVIA DE CORAZONES
     ============================================================ */
  const revealBtn = document.getElementById('revealBtn');
  const loveSection = document.getElementById('love');

  revealBtn.addEventListener('click', (e) => {
    document.querySelector('.hero__content').classList.add('is-launching');
    playGalaxyPortalTransition(e.currentTarget);
  });

  function playGalaxyPortalTransition(originEl){
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const overlay = document.createElement('div');
    overlay.className = 'portal-overlay';

    // Resplandor de fondo que se enciende desde el botón
    const flash = document.createElement('div');
    flash.className = 'portal-flash';
    flash.style.setProperty('--ox', `${(cx / window.innerWidth) * 100}%`);
    flash.style.setProperty('--oy', `${(cy / window.innerHeight) * 100}%`);
    overlay.appendChild(flash);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => flash.classList.add('is-active'));

    // Esfera que "nace" en el botón y se expande cubriendo toda la pantalla,
    // como el universo expandiéndose desde un punto
    const expand = document.createElement('div');
    expand.className = 'universe-expand';
    expand.style.left = `${cx}px`;
    expand.style.top = `${cy}px`;
    overlay.appendChild(expand);

    const expandScale = (Math.hypot(window.innerWidth, window.innerHeight) / 7) + 4;
    expand.animate([
      { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 1 },
      { transform: `translate(-50%, -50%) scale(${expandScale * 0.55}) rotate(140deg)`, opacity: 0.9, offset: 0.55 },
      { transform: `translate(-50%, -50%) scale(${expandScale}) rotate(260deg)`, opacity: 0 }
    ], {
      duration: 1000,
      easing: 'cubic-bezier(.16,.84,.3,1)',
      fill: 'forwards'
    });

    // Estrellas que se despliegan desde el botón hacia toda la pantalla
    const STAR_COUNT = 70;
    const maxDist = Math.hypot(window.innerWidth, window.innerHeight);

    for (let i = 0; i < STAR_COUNT; i++){
      const star = document.createElement('span');
      star.className = 'portal-star';
      const size = 2 + Math.random() * 4;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${cx}px`;
      star.style.top = `${cy}px`;
      overlay.appendChild(star);

      const angle = Math.random() * Math.PI * 2;
      const dist = maxDist * (0.35 + Math.random() * 0.75);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;
      const duration = 750 + Math.random() * 500;
      const delay = Math.random() * 180;

      star.animate([
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.4)', opacity: 1, offset: 0.18 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`, opacity: 0 }
      ], {
        duration,
        delay,
        easing: 'cubic-bezier(.16,.84,.3,1)',
        fill: 'forwards'
      });
    }

    setTimeout(() => {
      loveSection.scrollIntoView({ behavior: 'auto' });
      triggerHeartRain();
      flash.classList.remove('is-active');
      flash.classList.add('is-fading');
      setTimeout(() => overlay.remove(), 950);
    }, 950);
  }

  function triggerHeartRain(){
    const hearts = ['💗', '💖', '💕', '❤️'];
    for (let i = 0; i < 40; i++){
      setTimeout(() => {
        const h = document.createElement('span');
        h.className = 'heart-rain';
        h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
        h.style.left = `${Math.random() * 100}vw`;
        h.style.animationDuration = `${2.5 + Math.random() * 2}s`;
        h.style.fontSize = `${1 + Math.random() * 1.2}rem`;
        document.body.appendChild(h);
        setTimeout(() => h.remove(), 5000);
      }, i * 60);
    }
  }

  /* ============================================================
     5. CORAZÓN DE PUNTITOS BRILLANTES (contorno fino tipo glitter)
     ============================================================ */
  const heartDotsLayer = document.getElementById('heartDots');

  // Ecuación paramétrica del corazón: genera la silueta con puntitos
  function heartXY(t){
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x, y };
  }

  // Calculamos los límites reales de la curva para normalizar a 0–100%
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i <= 360; i++){
    const { x, y } = heartXY((i / 360) * Math.PI * 2);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }

  function placeHeartDot(x, y, size, colorClass, opacity, delay){
    const nx = (x - minX) / (maxX - minX);       // 0..1
    const ny = (y - minY) / (maxY - minY);       // 0..1
    const left = nx * 100;
    const top = (1 - ny) * 100;                  // invertido: y matemático crece hacia arriba

    const dot = document.createElement('span');
    dot.className = `heart-dot ${colorClass}`;
    dot.style.left = `${left}%`;
    dot.style.top = `${top}%`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.opacity = opacity;
    dot.style.animationDelay = `${delay}s`;
    heartDotsLayer.appendChild(dot);
  }

  // Contorno del corazón — puntitos MUY pegados a la curva (poco jitter) para
  // que se vea como una línea fina de glitter, tal como en la imagen de referencia
  const OUTLINE_DOTS = 340;
  for (let i = 0; i < OUTLINE_DOTS; i++){
    const t = (i / OUTLINE_DOTS) * Math.PI * 2;
    const jitter = 0.965 + Math.random() * 0.05;
    const { x, y } = heartXY(t);
    const size = 1.6 + Math.random() * 2.6;
    const roll = Math.random();
    const colorClass = roll < 0.16 ? 'heart-dot--white' : 'heart-dot--pink';
    placeHeartDot(x * jitter, y * jitter, size, colorClass, (0.75 + Math.random() * 0.25).toFixed(2), Math.random() * 2.6);
  }

  // Un halo muy sutil de polvo hacia el interior, apenas perceptible
  // (da volumen sin convertir el corazón en una mancha sólida)
  const FILL_DOTS = 36;
  for (let i = 0; i < FILL_DOTS; i++){
    const t = Math.random() * Math.PI * 2;
    const inward = 0.55 + Math.random() * 0.4;
    const { x, y } = heartXY(t);
    const size = 1 + Math.random() * 1.4;
    placeHeartDot(x * inward, y * inward, size, 'heart-dot--pink', (0.12 + Math.random() * 0.16).toFixed(2), Math.random() * 2.6);
  }

  /* ============================================================
     5b. POLVO DE ESTRELLAS DE FONDO — textura dispersa por el escenario
     ============================================================ */
  const stardustLayer = document.getElementById('stardustLayer');
  const STARDUST_COUNT = 130;
  for (let i = 0; i < STARDUST_COUNT; i++){
    const dot = document.createElement('span');
    dot.className = 'stardust-dot';
    const size = 1 + Math.random() * 1.8;
    dot.style.left = `${Math.random() * 100}%`;
    dot.style.top = `${Math.random() * 100}%`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.opacity = (0.15 + Math.random() * 0.35).toFixed(2);
    dot.style.animationDelay = `${Math.random() * 3}s`;
    stardustLayer.appendChild(dot);
  }

  /* ============================================================
     5c. BRAZOS DE ESPIRAL TIPO GALAXIA — puntitos a lo largo de
         espirales logarítmicas, giran junto con los mensajes
     ============================================================ */
  const spiralArmsLayer = document.getElementById('spiralArms');
  const ARM_COUNT = 3;
  const POINTS_PER_ARM = 110;
  const TOTAL_SWEEP = 430; // grados que recorre cada brazo

  for (let a = 0; a < ARM_COUNT; a++){
    const armOffset = (360 / ARM_COUNT) * a;
    for (let i = 0; i < POINTS_PER_ARM; i++){
      const t = i / POINTS_PER_ARM;               // 0 (centro) .. 1 (borde)
      const angleDeg = armOffset + t * TOTAL_SWEEP;
      const rad = (angleDeg * Math.PI) / 180;
      const radius = 4 + Math.pow(t, 0.82) * 46;   // % del ancho del contenedor
      const armSpread = (Math.random() - 0.5) * (3 + t * 6);
      const x = 50 + Math.cos(rad) * (radius + armSpread);
      const y = 50 + Math.sin(rad) * (radius + armSpread) * 0.42; // aplanado elíptico

      const dot = document.createElement('span');
      dot.className = 'spiral-dot';
      const roll = Math.random();
      const color = roll < 0.12 ? '#ffffff' : (roll < 0.24 ? 'var(--gold)' : 'var(--pink)');
      const glow = roll < 0.12 ? '#ffffff' : 'var(--pink-glow)';
      dot.style.background = color;
      dot.style.color = glow;
      const size = 1 + (1 - t) * 2.6 + Math.random() * 1.2;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${x}%`;
      dot.style.top = `${y}%`;
      dot.style.opacity = (0.25 + (1 - t) * 0.55 + Math.random() * 0.15).toFixed(2);
      spiralArmsLayer.appendChild(dot);
    }
  }

  /* ============================================================
     5d. AROS QUE ENVUELVEN AL CORAZÓN — elipses concéntricas de
         puntitos, como en la imagen de referencia
     ============================================================ */
  const haloRingsLayer = document.getElementById('haloRings');
  const haloRingsConfig = [
    { rx: 49, ry: 49, count: 100, size: [1.4, 3],   opacity: [0.55, 0.95] },
    { rx: 36, ry: 36, count: 84,  size: [1.2, 2.4], opacity: [0.45, 0.8] },
    { rx: 23, ry: 23, count: 68,  size: [1, 2],   opacity: [0.35, 0.6] }
  ];
  haloRingsConfig.forEach(ring => {
    for (let i = 0; i < ring.count; i++){
      const t = (i / ring.count) * Math.PI * 2;
      const jitter = 0.94 + Math.random() * 0.1;
      const x = 50 + Math.cos(t) * ring.rx * jitter;
      const y = 50 + Math.sin(t) * ring.ry * jitter;
      const dot = document.createElement('span');
      dot.className = 'halo-dot';
      const roll = Math.random();
      const color = roll < 0.2 ? '#ffffff' : 'var(--pink)';
      const glow = roll < 0.2 ? '#ffffff' : 'var(--pink-glow)';
      dot.style.background = color;
      dot.style.color = glow;
      const size = ring.size[0] + Math.random() * (ring.size[1] - ring.size[0]);
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${x}%`;
      dot.style.top = `${y}%`;
      dot.style.opacity = (ring.opacity[0] + Math.random() * (ring.opacity[1] - ring.opacity[0])).toFixed(2);
      haloRingsLayer.appendChild(dot);
    }
  });

  /* ============================================================
     5e. ESTELA DE CHISPAS — cae desde la punta del corazón hasta
         el núcleo, como en la imagen de referencia
     ============================================================ */
  const heartTrailLayer = document.getElementById('heartTrail');
  function spawnTrailSpark(){
    const spark = document.createElement('span');
    spark.className = 'trail-spark';
    const left = 40 + Math.random() * 20;
    const size = 1.6 + Math.random() * 2.6;
    const duration = 1.3 + Math.random() * 1.1;
    spark.style.left = `${left}%`;
    spark.style.width = `${size}px`;
    spark.style.height = `${size}px`;
    spark.style.animationDuration = `${duration}s`;
    heartTrailLayer.appendChild(spark);
    setTimeout(() => spark.remove(), duration * 1000 + 100);
  }
  setInterval(spawnTrailSpark, 70);
  for (let i = 0; i < 14; i++) setTimeout(spawnTrailSpark, i * 60);

  /* ============================================================
     6. MENSAJES DEDICADOS A ÁNGELA
     ============================================================ */
  const shortMessages = [
    '✨ La niña más hermosa',
    '✨ Tu sonrisa ilumina mi vida',
    '✨ Mi lugar favorito eres tú',
    '✨ Gracias por existir',
    '✨ Amo cada momento contigo',
    '✨ Eres mi paz',
    '✨ Eres mi felicidad',
    '✨ Mi persona favorita',
    '✨ Siempre tú',
    '✨ Mi universo',
    '✨ Mi princesa',
    '✨ Mi angelito',
    '✨ Mi todo',
    '✨ Eres increíble',
    '✨ Gracias por llegar a mi vida',
    '✨ Mi razón para sonreír',
    '✨ Siempre escogería tus abrazos',
    '✨ Contigo todo vale la pena',
    '✨ Eres mi hogar',
    '✨ Eres el amor de mi vida'
  ];

  // 25+ mensajes largos y únicos — ninguno se repite
  const longMessages = [
    'Mi pastelito, gracias por hacer que incluso los días más normales se conviertan en recuerdos inolvidables. Tu sonrisa tiene una forma única de alegrar mi corazón.',
    'Cada vez que pienso en ti, se me dibuja una sonrisa sin darme cuenta. Eres ese pensamiento bonito que aparece en medio de cualquier día.',
    'Contigo aprendí que el amor no necesita ser perfecto para ser real, solo necesita ser sincero, y contigo lo es cada día.',
    'Mi pastelito, eres de esas personas que llegan a la vida y la cambian por completo, sin pedir permiso, solo con su forma de ser.',
    'Me encanta la manera en que iluminas cada lugar donde estás, aunque tú ni siquiera te des cuenta de lo especial que eres.',
    'Gracias por escucharme, por entenderme y por quedarte incluso cuando las cosas no son fáciles. Eso también es amor.',
    'Si tuviera que elegir un lugar favorito, elegiría siempre estar a tu lado, sin importar dónde estemos.',
    'Tu risa es de mis sonidos favoritos en el mundo, y podría escucharla todos los días de mi vida.',
    'Eres esa persona con la que todo se siente más liviano, más bonito, más fácil de vivir.',
    'Mi pastelito, quiero que sepas que cada pequeño detalle tuyo, hasta los que tú crees que pasan desapercibidos, yo los guardo con cariño.',
    'No hace falta un día especial para amarte, pero hoy quiero recordarte lo mucho que significas para mí.',
    'Contigo he aprendido que el amor también se construye en los días comunes, en las conversaciones simples y en los silencios cómodos.',
    'Eres mi persona favorita para contar las cosas buenas y también las malas, porque contigo todo se siente más ligero.',
    'Me gusta pensar en el futuro y siempre imaginarte ahí, formando parte de cada plan y de cada sueño.',
    'Mi pastelito, tienes una forma especial de hacer sentir importante a las personas que amas, y yo soy muy afortunado de recibir eso.',
    'Cada mensaje tuyo, cada nota de voz, cada "buenos días" se convierte en uno de los mejores momentos de mi día.',
    'Quiero agradecerte por tu paciencia, por tu cariño y por elegir quedarte a mi lado incluso en los días difíciles.',
    'Eres la clase de persona que hace que uno quiera ser mejor, no por obligación, sino por el simple deseo de merecerte.',
    'Mi pastelito, contigo descubrí que el amor tranquilo, el que no necesita gritos ni dramas, también puede ser el más bonito de todos.',
    'Hoy, como cada día, quiero recordarte que eres amada, admirada y muy querida por mí.',
    'Me encanta cómo te emocionas con las cosas pequeñas, esa forma tuya de encontrar magia hasta en lo más simple.',
    'Gracias por ser mi compañera, mi confidente y mi persona favorita para compartir la vida.',
    'Mi pastelito, tu forma de cuidar a las personas que amas es uno de tus rasgos más hermosos, y yo lo valoro cada día.',
    'No importa cuántas veces pase el tiempo, siempre encontraré nuevas razones para quererte más.',
    'Eres ese tipo de amor que no se busca, simplemente llega, y desde que llegaste todo se siente más completo.',
    'Mi pastelito, quiero seguir construyendo contigo mil momentos más, mil recuerdos más, mil días más a tu lado.',
    'Gracias por creer en mí, por apoyarme y por hacerme sentir que puedo con todo mientras estés cerca.',
    'Cada día contigo se convierte en una razón más para sonreír y sentirme agradecido por tenerte.'
  ];

  // Fotos para el modal — imágenes de amor tomadas de Unsplash (aleatorias/alusivas)
  const modalPhotos = [
    'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?w=800&q=80&fm=jpg&fit=crop', // pareja besándose al atardecer
    'https://images.unsplash.com/photo-1527628173875-3c7bfd28ad78?w=800&q=80&fm=jpg&fit=crop', // manos entrelazadas
    'https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=800&q=80&fm=jpg&fit=crop', // silueta de pareja abrazada
    'https://images.unsplash.com/photo-1513279922550-250c2129b13a?w=800&q=80&fm=jpg&fit=crop', // pareja sentada frente a la ciudad
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80&fm=jpg&fit=crop'  // luz bokeh de corazón
  ];

  /* ============================================================
     6b. UNIVERSO GIRATORIO — mensajes y decoraciones en órbita
     ============================================================ */
  const universeStage = document.getElementById('universeStage');
  const orbitLayer = document.getElementById('orbitLayer');

  // Elementos decorativos que orbitan junto a los mensajes (no clicables)
  const decoFloaters = ['💗', '✨', '💫', 'img:kitty', 'img:snoopy', '💖'];

  const orbitItems = []; // { el, angle, rx, ry, speedFactor }

  function buildOrbit(){
    orbitLayer.innerHTML = '';
    orbitItems.length = 0;

    const totalTags = shortMessages.length;
    // Anillos bien separados para que los mensajes se vean dispersos,
    // como capas concéntricas alrededor de la espiral.
    const rings = [26, 42, 58, 74];
    const perRing = Math.ceil(totalTags / rings.length);

    shortMessages.forEach((text, index) => {
      const ringIndex = index % rings.length;
      const posInRing = Math.floor(index / rings.length);
      const ringStagger = ringIndex * 22; // desfase angular entre anillos
      const angle = (360 / perRing) * posInRing + ringStagger + (Math.random() * 10 - 5);

      const rx = rings[ringIndex];
      const ry = rx * 0.4;

      const tag = document.createElement('div');
      tag.className = 'orbit-item orbit-tag';
      tag.textContent = text.replace('✨', '').trim();
      tag.dataset.index = index;
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        openUniverseModal(index);
      });

      orbitLayer.appendChild(tag);
      orbitItems.push({ el: tag, angle, rx, ry, cyOffset: 46 });
    });

    // Íconos decorativos flotando entre los anillos de mensajes
    decoFloaters.forEach((deco, i) => {
      const angle = (360 / decoFloaters.length) * i + 34;
      const rx = 18 + (i % 2) * 32;
      const ry = rx * 0.4;

      const el = document.createElement('div');
      el.className = 'orbit-item orbit-deco';

      if (deco.startsWith('img:')){
        const img = document.createElement('img');
        const which = deco === 'img:kitty' ? 'img/kitty1.png' : 'img/snoopy1.png';
        img.src = which;
        img.alt = '';
        img.addEventListener('error', () => { img.replaceWith(document.createTextNode('💞')); });
        el.appendChild(img);
      } else {
        el.textContent = deco;
      }

      orbitLayer.appendChild(el);
      orbitItems.push({ el, angle, rx, ry, cyOffset: 46 });
    });
  }

  buildOrbit();

  // Rotación continua + arrastre manual (mouse y touch)
  let rotation = 0;
  let isDragging = false;
  let lastPointerX = 0;
  const AUTO_SPEED = 0.045; // grados por frame

  const spiralCore = document.querySelector('.spiral-core');
  const spiralArms = document.getElementById('spiralArms');
  const haloRings = document.getElementById('haloRings');

  function renderOrbit(){
    orbitItems.forEach(item => {
      const rad = (item.angle + rotation) * Math.PI / 180;
      const x = 50 + item.rx * Math.cos(rad);
      const y = item.cyOffset + item.ry * Math.sin(rad);
      // Los elementos más "atrás" (arriba) se ven más pequeños y tenues -> profundidad
      const depth = (Math.sin(rad) + 1) / 2; // 0 (atrás) .. 1 (adelante)
      const scale = 0.75 + depth * 0.4;
      const opacity = 0.45 + depth * 0.55;
      const z = Math.round(depth * 10);

      item.el.style.left = `${x}%`;
      item.el.style.top = `${y}%`;
      item.el.style.transform = `translate(-50%, -50%) scale(${scale})`;
      item.el.style.opacity = opacity.toFixed(2);
      item.el.style.zIndex = z;
    });

    // La espiral, el núcleo y los aros se quedan quietos, y el corazón
    // también permanece completamente estático (no gira, no se balancea).
    // Lo único que se mueve automáticamente son los mensajes en órbita.
  }

  function animateUniverse(){
    if (!isDragging) rotation += AUTO_SPEED;
    renderOrbit();
    requestAnimationFrame(animateUniverse);
  }
  requestAnimationFrame(animateUniverse);

  function pointerDown(x){
    isDragging = true;
    lastPointerX = x;
    universeStage.style.cursor = 'grabbing';
  }
  function pointerMove(x){
    if (!isDragging) return;
    const delta = x - lastPointerX;
    rotation += delta * 0.35;
    lastPointerX = x;
  }
  function pointerUp(){
    isDragging = false;
    universeStage.style.cursor = 'grab';
  }

  universeStage.addEventListener('mousedown', (e) => pointerDown(e.clientX));
  window.addEventListener('mousemove', (e) => pointerMove(e.clientX));
  window.addEventListener('mouseup', pointerUp);

  universeStage.addEventListener('touchstart', (e) => pointerDown(e.touches[0].clientX), { passive:true });
  universeStage.addEventListener('touchmove', (e) => pointerMove(e.touches[0].clientX), { passive:true });
  universeStage.addEventListener('touchend', pointerUp);

  /* ============================================================
     7. MODAL DE MENSAJE — con efecto "expandir el universo"
     ============================================================ */
  const modalOverlay = document.getElementById('messageModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');
  const modalPhoto = document.getElementById('modalPhoto');
  const modalClose = document.getElementById('modalClose');
  const modalBack = document.getElementById('modalBack');

  function openUniverseModal(index){
    // 1) el universo se expande (zoom) para dar sensación de "entrar" al mensaje
    universeStage.classList.add('is-zooming');

    setTimeout(() => {
      const title = shortMessages[index].replace('✨', '').trim();
      const message = longMessages[index % longMessages.length];
      const photo = modalPhotos[index % modalPhotos.length];

      modalTitle.textContent = title;
      modalText.textContent = '';
      modalPhoto.src = photo;
      modalPhoto.style.opacity = '0';
      modalPhoto.onload = () => { modalPhoto.style.opacity = '1'; };
      modalPhoto.onerror = () => { modalPhoto.removeAttribute('src'); modalPhoto.style.opacity = '0'; };

      modalOverlay.classList.add('is-open');
      modalOverlay.setAttribute('aria-hidden', 'false');
      typeWriter(modalText, message, 16);
    }, 550);
  }

  function closeModal(){
    modalOverlay.classList.remove('is-open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    // 2) el universo vuelve a su tamaño normal
    universeStage.classList.remove('is-zooming');
  }

  modalClose.addEventListener('click', closeModal);
  modalBack.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  /* ============================================================
     8. EFECTO DE ESCRITURA (typing effect)
     ============================================================ */
  function typeWriter(element, text, speed){
    let i = 0;
    element.textContent = '';
    const interval = setInterval(() => {
      element.textContent += text.charAt(i);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);
  }

  /* ============================================================
     9. BOTÓN DE MÚSICA
     ============================================================ */
  const musicToggle = document.getElementById('musicToggle');
  const bgMusic = document.getElementById('bgMusic');

  musicToggle.addEventListener('click', () => {
    if (bgMusic.paused){
      bgMusic.play().catch(() => {
        // El navegador puede bloquear la reproducción automática;
        // el usuario puede intentarlo de nuevo con un nuevo clic.
      });
      musicToggle.classList.add('is-playing');
      musicToggle.querySelector('.music-btn__icon').textContent = '🎶';
    } else {
      bgMusic.pause();
      musicToggle.classList.remove('is-playing');
      musicToggle.querySelector('.music-btn__icon').textContent = '🎵';
    }
  });

  /* ============================================================
     10. CONTADOR DE ESTRELLAS
     ============================================================ */
  const starCounterValue = document.getElementById('starCounterValue');
  let starCount = 0;
  const targetStars = 1000 + Math.floor(Math.random() * 500);

  function animateStarCounter(){
    const increment = Math.ceil(targetStars / 120);
    const timer = setInterval(() => {
      starCount += increment;
      if (starCount >= targetStars){
        starCount = targetStars;
        clearInterval(timer);
      }
      starCounterValue.textContent = starCount.toLocaleString('es-ES');
    }, 30);
  }
  animateStarCounter();

  // Cada clic en la pantalla "enciende" una estrella más
  document.addEventListener('click', () => {
    starCount += 1;
    starCounterValue.textContent = starCount.toLocaleString('es-ES');
  });

});
