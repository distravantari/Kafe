// Inline the mascot SVG so it inherits `color` (currentColor) from its container.
fetch("assets/mascot.svg")
  .then((r) => r.text())
  .then((svg) => {
    document.querySelectorAll("[data-mascot]").forEach((el) => {
      el.innerHTML = svg;
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Kopi, the sleepy Kafe cup");
    });
  });
