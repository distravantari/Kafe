// Inline the line drawings so they inherit `color` (currentColor) from their container.
// <div data-mascot> gets Pak Grobak; <div data-doodle="gerobak"> gets assets/gerobak.svg.
const doodles = {};

function loadDoodle(name) {
  return (doodles[name] ||= fetch(`assets/${name}.svg`).then((r) => r.text()));
}

window.injectMascots = function () {
  document.querySelectorAll("[data-mascot]:empty, [data-doodle]:empty").forEach((el) => {
    const name = el.dataset.doodle || "mascot";
    loadDoodle(name).then((svg) => {
      el.innerHTML = svg;
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", name === "mascot" ? "Pak Grobak, the satay seller" : `Drawing: ${name}`);
    });
  });
};

window.injectMascots();
