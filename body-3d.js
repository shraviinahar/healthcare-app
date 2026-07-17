// body-3d.js
// A simple low-poly 3D figure built from primitive geometries. Drag to
// rotate; click a region to toggle its commonly-associated symptoms in
// the checklist (via window.NirogSymptoms, exposed by symptoms.js).
//
// This is a UX shortcut for common symptom clusters, not a diagnostic
// tool in itself — it just pre-fills related chips faster than tapping
// each one individually.

(function () {
  const canvas = document.getElementById("bodyCanvas");
  const labelEl = document.getElementById("bodyLabel");
  if (!canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(3, 5, 6);
  scene.add(key);

  // Theme colors
  const SKIN = 0xffd9c7;
  const SKIN_ACTIVE = 0x2f8f82;
  const SKIN_HOVER = 0xff9d8a;

  const group = new THREE.Group();
  scene.add(group);

  // Each region: geometry + position + the symptoms it represents.
  const regions = [];

  function addPart(name, geometry, position, symptomList) {
    const material = new THREE.MeshStandardMaterial({
      color: SKIN,
      roughness: 0.6,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.userData = { name, symptoms: symptomList };
    group.add(mesh);
    regions.push(mesh);
    return mesh;
  }

  // Head
  addPart("Head", new THREE.SphereGeometry(0.55, 20, 20), [0, 2.35, 0],
    ["headache", "dizziness", "blurred vision", "confusion"]);

  // Neck / throat
  addPart("Throat", new THREE.CylinderGeometry(0.22, 0.24, 0.35, 16), [0, 1.85, 0],
    ["sore throat", "congestion", "sinus pressure"]);

  // Chest
  addPart("Chest", new THREE.CylinderGeometry(0.62, 0.55, 1.1, 16), [0, 1.05, 0],
    ["chest pain", "shortness of breath", "palpitations", "cough"]);

  // Abdomen
  addPart("Abdomen", new THREE.CylinderGeometry(0.5, 0.42, 0.7, 16), [0, 0.25, 0],
    ["abdominal pain", "nausea", "vomiting", "diarrhoea", "bloating"]);

  // Arms
  addPart("Left arm", new THREE.CylinderGeometry(0.14, 0.12, 1.5, 12), [-0.82, 0.95, 0],
    ["numbness or tingling", "weakness on one side", "tremor"]).rotation.z = 0.25;
  addPart("Right arm", new THREE.CylinderGeometry(0.14, 0.12, 1.5, 12), [0.82, 0.95, 0],
    ["numbness or tingling", "weakness on one side", "tremor"]).rotation.z = -0.25;

  // Legs
  addPart("Left leg", new THREE.CylinderGeometry(0.18, 0.15, 1.7, 12), [-0.3, -1.35, 0],
    ["joint pain", "muscle pain", "swelling", "balance problems"]);
  addPart("Right leg", new THREE.CylinderGeometry(0.18, 0.15, 1.7, 12), [0.3, -1.35, 0],
    ["joint pain", "muscle pain", "swelling", "balance problems"]);

  group.scale.setScalar(1.05);
  group.position.y = -0.1;

  // --- Drag to rotate ---
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let rotY = 0.3, rotX = 0;
  let autoRotate = true;

  function pointerDown(x, y) {
    isDragging = true;
    autoRotate = false;
    prevX = x;
    prevY = y;
  }
  function pointerMove(x, y) {
    if (!isDragging) return;
    const dx = x - prevX;
    const dy = y - prevY;
    rotY += dx * 0.008;
    rotX = Math.max(-0.5, Math.min(0.5, rotX + dy * 0.006));
    prevX = x;
    prevY = y;
  }
  function pointerUp() { isDragging = false; }

  canvas.addEventListener("mousedown", (e) => pointerDown(e.clientX, e.clientY));
  window.addEventListener("mousemove", (e) => pointerMove(e.clientX, e.clientY));
  window.addEventListener("mouseup", pointerUp);

  canvas.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    pointerDown(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    pointerMove(t.clientX, t.clientY);
  }, { passive: true });
  canvas.addEventListener("touchend", pointerUp);

  // --- Hover + click via raycasting ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  function updatePointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickRegion() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(regions);
    return hits.length ? hits[0].object : null;
  }

  function refreshColors() {
    regions.forEach((mesh) => {
      const active = window.NirogSymptoms && window.NirogSymptoms.isGroupActive(mesh.userData.symptoms);
      const isHovered = mesh === hovered;
      mesh.material.color.set(active ? SKIN_ACTIVE : (isHovered ? SKIN_HOVER : SKIN));
    });
  }

  canvas.addEventListener("mousemove", (e) => {
    if (isDragging) return;
    updatePointer(e.clientX, e.clientY);
    const region = pickRegion();
    hovered = region;
    canvas.style.cursor = region ? "pointer" : "grab";
    labelEl.textContent = region ? region.userData.name : "\u00A0";
    refreshColors();
  });

  canvas.addEventListener("mouseleave", () => {
    hovered = null;
    labelEl.textContent = "\u00A0";
    refreshColors();
  });

  canvas.addEventListener("click", (e) => {
    updatePointer(e.clientX, e.clientY);
    const region = pickRegion();
    if (region && window.NirogSymptoms) {
      window.NirogSymptoms.toggleGroup(region.userData.symptoms);
      refreshColors();
    }
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animate() {
    requestAnimationFrame(animate);
    if (autoRotate && !prefersReduced) rotY += 0.0025;
    group.rotation.y = rotY;
    group.rotation.x = rotX;
    refreshColors();
    renderer.render(scene, camera);
  }
  animate();
})();
