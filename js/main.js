function siteBase() {
  var root = document.documentElement, one = function (s) { return document.querySelector(s); };
  var all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var IO = window.IntersectionObserver;

  /* navbar marks the section on screen */
  if (IO) {
    var seen = new IO(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var name = e.target.className.split(' ')[0];
        all('[data-s]').forEach(function (l) {
          var on = l.getAttribute('data-s') === name;
          l.classList.toggle('cur', on);
          if (on) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-60% 0px -40% 0px' });
    ['.hero', '.sv', '.why', '.best'].forEach(function (s) { var e = one(s); if (e) seen.observe(e); });
  }

  /* carousel: drag with the mouse; touch and trackpads scroll natively */
  (function () {
    var track = one('.svk');
    if (!track) return;
    var moved = false, sx = 0, sl = 0, lx = 0, lt = 0, v = 0, raf = 0;
    function move(e) {
      var dx = e.clientX - sx;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('drag'); }
      if (!moved) return;
      var now = performance.now();
      v = (e.clientX - lx) / Math.max(now - lt, 1); lx = e.clientX; lt = now;
      track.scrollLeft = sl - dx;
    }
    function glide(prev) {
      raf = requestAnimationFrame(function (t) {
        var dt = Math.min(t - prev, 40);
        v *= Math.pow(0.994, dt);
        track.scrollLeft -= v * dt;
        if (Math.abs(v) > 0.03) glide(t); else { raf = 0; track.classList.remove('drag'); }
      });
    }
    function up() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) { if (performance.now() - lt > 80) v = 0; glide(performance.now()); }
    }
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(raf); moved = false; sx = lx = e.clientX; sl = track.scrollLeft; lt = performance.now(); v = 0;
      window.addEventListener('pointermove', move, { passive: true });
      window.addEventListener('pointerup', up);
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);
  })();

  /* weak devices: a light fade instead of the GSAP animations */
  function lightReveal() {
    if (!IO || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IO(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px' });
    all('.svh,.svc,.wt,.rate,.big,.eco,.nat,.wq,.rv,.duoi,.bey,.bti,.ble,.bbt').forEach(function (e) {
      if (e.getBoundingClientRect().top > window.innerHeight) { e.classList.add('fi'); io.observe(e); }
    });
  }
  if (window.__tier === 'low') lightReveal();

  /* hero video: only after the page has loaded, only while on screen, sized for the device */
  var video = one('video.photo'), hero = one('.hero');
  function startVideo() {
    if (!video || window.__tier === 'low' || video.getAttribute('src')) return;
    var small = window.__tier === 'mid' || window.innerWidth <= 900;
    video.addEventListener('playing', function () { video.classList.add('vready'); }, { once: true });
    video.setAttribute('src', video.getAttribute(small ? 'data-sm' : 'data-lg'));
    var p = video.play(); if (p && p.catch) p.catch(function () {});
    if (IO && hero) new IO(function (es) {
      if (!video.getAttribute('src')) return;
      if (es[0].isIntersecting) { var r = video.play(); if (r && r.catch) r.catch(function () {}); } else video.pause();
    }).observe(hero);
  }
  function whenLoaded(fn) {
    if (document.readyState === 'complete') fn(); else window.addEventListener('load', fn, { once: true });
  }
  whenLoaded(function () { setTimeout(startVideo, 300); });

  /* step effects down if this device cannot keep up */
  function demote() {
    var next = window.__tier === 'high' ? 'mid' : 'low';
    root.classList.remove('t-' + window.__tier); root.classList.add('t-' + next);
    window.__tier = next;
    try { sessionStorage.setItem('perfTier', next); } catch (x) {}
    if (next === 'low' && video && video.getAttribute('src')) {
      video.classList.remove('vready'); video.pause();
      setTimeout(function () { video.removeAttribute('src'); video.load(); }, 600);
    }
    if (window.__fx) window.__fx.demote(next);
  }
  if (window.__tier !== 'low' && !/[?&]perf=/.test(location.search)) {
    var until = 0, running = false, frames = 0, start = 0, last = 0, slow = 0;
    var tick = function (t) {
      var now = performance.now();
      if (now > until || document.hidden) { running = false; return; }
      if (t - last > 400) { frames = 0; start = t; }
      last = t; frames++;
      if (t - start >= 1000) {
        var fps = frames * 1000 / (t - start); frames = 0; start = t;
        slow = fps < 40 ? slow + 1 : 0;
        if (slow >= 2) { slow = 0; demote(); if (window.__tier === 'low') { running = false; removeEventListener('scroll', kick); return; } }
      }
      requestAnimationFrame(tick);
    };
    var kick = function () {
      until = performance.now() + 1500;
      if (!running) { running = true; frames = 0; last = start = performance.now(); requestAnimationFrame(tick); }
    };
    whenLoaded(function () { setTimeout(function () { until = performance.now() + 4000; kick(); until = performance.now() + 4000; }, 1500); });
    addEventListener('scroll', kick, { passive: true });
  }
}
siteBase();
(function () {
  var cap = document.querySelector('.cap');
  if (!cap) return;
  var tg = cap.querySelector('.captg');
  function set(open) {
    cap.classList.toggle('open', open);
    tg.setAttribute('aria-expanded', open ? 'true' : 'false');
    tg.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  tg.addEventListener('click', function () { set(!cap.classList.contains('open')); });
  cap.querySelector('.capbg').addEventListener('click', function () { set(false); });
  cap.querySelector('.capm').addEventListener('click', function () { set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); } });
})();
