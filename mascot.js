// Inline the mascot SVG so it inherits `color` (currentColor) from its container.
let mascotSvg = null;

window.injectMascots = function () {
  if (!mascotSvg) return;
  document.querySelectorAll("[data-mascot]:empty").forEach((el) => {
    el.innerHTML = mascotSvg;
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", "Kopi, the sleepy Kafe cup");
  });
};

fetch("assets/mascot.svg")
  .then((r) => r.text())
  .then((svg) => { mascotSvg = svg; window.injectMascots(); });
