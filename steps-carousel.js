// steps-carousel.js
// A vanilla JS/CSS carousel for the homepage's 3 "how it works" steps —
// a hand-built equivalent of a React Bits-style carousel (autoplay,
// pause-on-hover, seamless looping, drag/swipe), since this site is
// plain HTML/CSS/JS rather than React.
//
// Looping is done the same way the React version does it: a clone of
// the last real slide is placed before the first, and a clone of the
// first real slide is placed after the last. The visible position
// starts on the first *real* slide (index 1). When a transition lands
// on a clone, we instantly (no animation) snap to the matching real
// slide on the other end, so the loop looks seamless.

(function () {
  const carousel = document.getElementById("stepsCarousel");
  const track = document.getElementById("stepsTrack");
  const viewport = track.parentElement; // .steps-viewport — the actual visible sliding area
  const dotsEl = document.getElementById("stepsDots");
  const prevBtn = document.getElementById("stepsPrev");
  const nextBtn = document.getElementById("stepsNext");
  if (!carousel || !track) return;

  const AUTOPLAY_DELAY = 4000;
  const DRAG_THRESHOLD = 50; // px

  const realSlides = Array.from(track.children);
  const slideCount = realSlides.length;
  if (slideCount === 0) return;

  // Clone first/last slides for seamless looping.
  const firstClone = realSlides[0].cloneNode(true);
  const lastClone = realSlides[slideCount - 1].cloneNode(true);
  firstClone.setAttribute("aria-hidden", "true");
  lastClone.setAttribute("aria-hidden", "true");
  track.appendChild(firstClone);
  track.insertBefore(lastClone, track.firstChild);

  const allSlides = Array.from(track.children); // [lastClone, ...real, firstClone]
  let index = 1; // start on the first real slide
  let isHovered = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragDeltaX = 0;
  let autoplayTimer = null;

  function slideWidth() {
    return viewport.getBoundingClientRect().width;
  }

  function goTo(newIndex, animate = true) {
    index = newIndex;
    track.style.transition = animate ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)" : "none";
    track.style.transform = `translateX(${-index * slideWidth()}px)`;
    updateDots();
  }

  function updateDots() {
    const realIndex = ((index - 1) % slideCount + slideCount) % slideCount;
    Array.from(dotsEl.children).forEach((dot, i) => {
      dot.classList.toggle("is-active", i === realIndex);
    });
  }

  function buildDots() {
    dotsEl.innerHTML = "";
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "steps-dot";
      dot.setAttribute("aria-label", `Go to step ${i + 1}`);
      dot.addEventListener("click", () => {
        stopAutoplay();
        goTo(i + 1);
        startAutoplay();
      });
      dotsEl.appendChild(dot);
    }
    updateDots();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  // Snap instantly when we land on a clone, so the loop feels endless.
  track.addEventListener("transitionend", () => {
    if (index === allSlides.length - 1) {
      goTo(1, false);
    } else if (index === 0) {
      goTo(slideCount, false);
    }
  });

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      if (!isHovered && !isDragging) next();
    }, AUTOPLAY_DELAY);
  }
  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  carousel.addEventListener("mouseenter", () => { isHovered = true; });
  carousel.addEventListener("mouseleave", () => { isHovered = false; });

  prevBtn.addEventListener("click", () => { stopAutoplay(); prev(); startAutoplay(); });
  nextBtn.addEventListener("click", () => { stopAutoplay(); next(); startAutoplay(); });

  // --- Drag / swipe support ---
  function dragStart(x) {
    isDragging = true;
    dragStartX = x;
    dragDeltaX = 0;
    track.style.transition = "none";
  }
  function dragMove(x) {
    if (!isDragging) return;
    dragDeltaX = x - dragStartX;
    track.style.transform = `translateX(${-index * slideWidth() + dragDeltaX}px)`;
  }
  function dragEnd() {
    if (!isDragging) return;
    isDragging = false;
    if (dragDeltaX < -DRAG_THRESHOLD) {
      next();
    } else if (dragDeltaX > DRAG_THRESHOLD) {
      prev();
    } else {
      goTo(index); // snap back
    }
  }

  track.addEventListener("mousedown", (e) => dragStart(e.clientX));
  window.addEventListener("mousemove", (e) => dragMove(e.clientX));
  window.addEventListener("mouseup", dragEnd);

  track.addEventListener("touchstart", (e) => dragStart(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), { passive: true });
  track.addEventListener("touchend", dragEnd);

  window.addEventListener("resize", () => goTo(index, false));

  buildDots();
  goTo(1, false);
  startAutoplay();
})();
