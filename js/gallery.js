/* New section gallery: slanted columns with vertical parallax */
(function () {
  var box = document.querySelector('.ns-slant');
  if (!box || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var cols = Array.prototype.slice.call(box.querySelectorAll('.ns-col'));
  var speed = [-1, 0.7, -0.8, 1]; /* each column moves at its own pace */
  var range = 6;                  /* maximum travel, in % of the gallery width */
  var ticking = false;

  function update() {
    ticking = false;
    var r = box.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (r.top + r.height / 2 - vh / 2) / ((vh + r.height) / 2);
    p = Math.max(-1, Math.min(1, p));
    cols.forEach(function (c, i) {
      c.style.setProperty('--d', (p * speed[i] * range).toFixed(3));
    });
  }
  function ask() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  if (window.IntersectionObserver) {
    box.classList.add('is-ready');
    new IntersectionObserver(function (es, io) {
      if (es[0].isIntersecting) { box.classList.add('is-in'); io.disconnect(); }
    }, { threshold: 0.15 }).observe(box);
  }
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  update();
})();
