// hero-3d.js
// A quiet, decorative background for the hero section: a handful of
// medical icons (pill, cross, heartbeat line) drawn onto sprites so they
// always face the camera, gently drifting and rotating with a subtle
// parallax shift toward the cursor. Kept to the right-hand side of the
// hero (behind the demo panel) so they never drift over the headline
// text on the left. Pointer-events are disabled on the canvas so it
// never blocks clicks on the real content above it.

(function () {
  const canvas = document.getElementById("heroCanvas");
  if (!canvas || typeof THREE === "undefined") return;

  const hero = canvas.closest(".hero");

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // Theme colors (kept in sync with style.css tokens)
  const CORAL = "#ff6f59";
  const TEAL = "#2f8f82";
  const INK = "#2b2118";

  // --- Draw each icon onto a canvas, then use it as a sprite texture ---
  function makeTexture(draw) {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    draw(ctx, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  const pillTexture = makeTexture((ctx, s) => {
    ctx.translate(s / 2, s / 2);
    ctx.rotate(-Math.PI / 4);
    const w = s * 0.62, h = s * 0.3, r = h / 2;
    // capsule outline
    ctx.beginPath();
    ctx.moveTo(-w / 2 + r, -h / 2);
    ctx.lineTo(w / 2 - r, -h / 2);
    ctx.arc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-w / 2 + r, h / 2);
    ctx.arc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5);
    ctx.closePath();
    // left half coral, right half white
    ctx.save();
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-w / 2, -h / 2, w / 2, h);
    ctx.fillStyle = CORAL;
    ctx.fillRect(0, -h / 2, w / 2, h);
    ctx.restore();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
  });

  const crossTexture = makeTexture((ctx, s) => {
    ctx.translate(s / 2, s / 2);
    const arm = s * 0.16, len = s * 0.56, r = arm * 0.4;
    ctx.fillStyle = TEAL;
    function roundedRect(x, y, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
      ctx.fill();
    }
    roundedRect(-arm, -len / 2, arm * 2, len, r);
    roundedRect(-len / 2, -arm, len, arm * 2, r);
  });

  const heartbeatTexture = makeTexture((ctx, s) => {
    ctx.translate(s * 0.06, s / 2);
    ctx.strokeStyle = CORAL;
    ctx.lineWidth = 6;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    const w = s * 0.88;
    ctx.moveTo(0, 0);
    ctx.lineTo(w * 0.32, 0);
    ctx.lineTo(w * 0.42, -s * 0.28);
    ctx.lineTo(w * 0.52, s * 0.3);
    ctx.lineTo(w * 0.62, 0);
    ctx.lineTo(w, 0);
    ctx.stroke();
  });

  const ICONS = [pillTexture, crossTexture, heartbeatTexture, pillTexture, crossTexture];

  const sprites = [];
  ICONS.forEach((tex, i) => {
    const material = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);

    // Keep icons on the right-hand side / behind the panel, away from
    // the headline text which lives in the left column.
    sprite.position.set(
      2.5 + Math.random() * 6,
      (Math.random() - 0.5) * 7,
      (Math.random() - 0.5) * 5 - 2
    );
    const scale = 1.1 + Math.random() * 0.9;
    sprite.scale.set(scale, scale, 1);
    material.rotation = Math.random() * Math.PI * 2;

    scene.add(sprite);
    sprites.push({
      sprite,
      material,
      spinSpeed: (Math.random() - 0.5) * 0.01,
      bobSpeed: 0.3 + Math.random() * 0.4,
      bobAmount: 0.35 + Math.random() * 0.35,
      baseY: sprite.position.y,
      phase: Math.random() * Math.PI * 2,
    });
  });

  let targetX = 0, targetY = 0;
  let mouseX = 0, mouseY = 0;

  window.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
  });

  function resize() {
    const rect = hero.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    targetX += (mouseX * 1.0 - targetX) * 0.04;
    targetY += (-mouseY * 0.6 - targetY) * 0.04;
    camera.position.x = targetX;
    camera.position.y = targetY;
    camera.lookAt(3, 0, 0);

    sprites.forEach((s) => {
      s.material.rotation += s.spinSpeed;
      s.sprite.position.y = s.baseY + Math.sin(t * s.bobSpeed + s.phase) * s.bobAmount;
    });

    renderer.render(scene, camera);
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    renderer.render(scene, camera);
  } else {
    animate();
  }
})();
