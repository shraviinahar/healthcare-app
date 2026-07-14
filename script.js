// Basic interactivity for the demo symptom chips in the hero panel.
// This is a placeholder for the real symptom-input flow, which will
// eventually post to the FastAPI backend for prediction.

document.addEventListener("DOMContentLoaded", () => {
  const chips = document.querySelectorAll("#chipRow .chip");

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("chip-on");
    });
  });
});
