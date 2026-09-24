// Shared across both pages: hero chip demo interaction (homepage only,
// harmless no-op on pages without #chipRow) and a generic 3D tilt-on-hover
// effect for any element carrying the .tilt-card class.

document.addEventListener("DOMContentLoaded", () => {
  // --- Hero demo chip toggle (homepage) ---
  const chips = document.querySelectorAll("#chipRow .chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("chip-on");
    });
  });

  // --- Specialty tag tap-to-describe (homepage) ---
  const tags = document.querySelectorAll("#specialtyTags .tag");
  const descEl = document.getElementById("specialtyDesc");
  tags.forEach((tag) => {
    tag.addEventListener("click", () => {
      const alreadyActive = tag.classList.contains("is-active");
      tags.forEach((t) => t.classList.remove("is-active"));
      if (alreadyActive) {
        descEl.textContent = "Tap a specialty to see what they treat.";
      } else {
        tag.classList.add("is-active");
        descEl.textContent = tag.dataset.desc;
      }
    });
  });

  // --- 3D tilt-on-hover for .tilt-card elements ---
  const MAX_TILT = 8; // degrees

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0..1
      const py = (e.clientY - rect.top) / rect.height;  // 0..1

      const rotateY = (px - 0.5) * 2 * MAX_TILT;
      const rotateX = (0.5 - py) * 2 * MAX_TILT;

      card.style.transform =
        `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    });
  });
});
