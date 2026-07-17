// hero-3d.js
// A quiet, decorative 3D background for the hero section: a handful of
// low-poly shapes drifting and rotating slowly, with a subtle parallax
// shift toward the cursor. Purely visual — pointer-events are disabled
// on the canvas so it never blocks clicks on the real content above it.

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
  const COLORS = [0xff6f59, 0x2f8f82, 0xffb199, 0x2b2118];

  const shapes = [];
  const geometries = [
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.TorusGeometry(0.8, 0.28, 12, 32),
    new THREE.OctahedronGeometry(1, 0),
    new THREE.SphereGeometry(0.75, 16, 16),
  ];

  geometries.forEach((geo, i) => {
    const material = new THREE.MeshStandardMaterial({
      color: COLORS[i % COLORS.length],
      roughness: 0.4,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, material);

    // Spread them loosely around the right-hand side of the hero,
    // where the panel card sits, so they read as "orbiting" it.
    mesh.position.set(
      (Math.random() - 0.5) * 10 + 2,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 6 - 2
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    const scale = 0.6 + Math.random() * 0.7;
    mesh.scale.setScalar(scale);

    scene.add(mesh);
    shapes.push({
      mesh,
      spinSpeed: (Math.random() - 0.5) * 0.006,
      bobSpeed: 0.4 + Math.random() * 0.4,
      bobAmount: 0.4 + Math.random() * 0.4,
      baseY: mesh.position.y,
      phase: Math.random() * Math.PI * 2,
    });
  });

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 0.6);
  key.position.set(4, 6, 8);
  scene.add(key);

  let targetX = 0, targetY = 0;
  let mouseX = 0, mouseY = 0;

  window.addEventListener("mousemove", (e) => {
    const rect = hero.getBoundingClientRect();
    // Normalize to -1..1 based on position within the hero section
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

    // Gentle camera parallax toward the cursor
    targetX += (mouseX * 1.2 - targetX) * 0.04;
    targetY += (-mouseY * 0.8 - targetY) * 0.04;
    camera.position.x = targetX;
    camera.position.y = targetY;
    camera.lookAt(2, 0, 0);

    shapes.forEach((s) => {
      s.mesh.rotation.x += s.spinSpeed;
      s.mesh.rotation.y += s.spinSpeed * 1.4;
      s.mesh.position.y = s.baseY + Math.sin(t * s.bobSpeed + s.phase) * s.bobAmount;
    });

    renderer.render(scene, camera);
  }

  // Respect reduced-motion preferences: render one static frame instead of looping
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    renderer.render(scene, camera);
  } else {
    animate();
  }
})();
