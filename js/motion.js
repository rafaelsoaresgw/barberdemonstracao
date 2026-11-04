function motion() {
  var g = window.gsap, ST = window.ScrollTrigger, root = document.documentElement;
  if (window.__tier === 'low') { root.classList.remove('pre'); return { kill: function () {}, demote: function () {} }; }
  g.registerPlugin(ST);
  ST.config({ ignoreMobileResize: true, limitCallbacks: true });
  var CL = 'transform,opacity,visibility';
  var one = function (s) { return document.querySelector(s); };
  var all = function (s) { return g.utils.toArray(s); };
  var mm = g.matchMedia();
  var heavy = [];
  function hv(tw) { heavy.push(tw); return tw; }

  function rv(t, v, tr, start) {
    var o = { y: 36, autoAlpha: 0, duration: 1.1, ease: 'power3.out', clearProps: CL,
      scrollTrigger: { trigger: tr || t, start: start || 'top 86%', once: true } };
    for (var k in v) o[k] = v[k];
    return g.from(t, o);
  }
  function lines(t, tr, start) {
    return g.from(t, { yPercent: 135, autoAlpha: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', clearProps: CL,
      scrollTrigger: { trigger: tr, start: start || 'top 86%', once: true } });
  }
  function loop(t, v, tr) {
    var o = { duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1,
      scrollTrigger: { trigger: tr || t, start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' } };
    for (var k in v) o[k] = v[k];
    return g.to(t, o);
  }

  mm.add({ ok: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 901px)', fine: '(hover: hover) and (pointer: fine)' }, function (c) {
    if (!c.conditions.ok) return;
    var wide = c.conditions.wide, fine = c.conditions.fine, off = [];
    var high = window.__tier === 'high';
    heavy = [];
    function on(el, ev, fn) { el.addEventListener(ev, fn); off.push(function () { el.removeEventListener(ev, fn); }); }

    /* ---------- progress bar ---------- */
    g.to('.prog', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    /* ---------- navbar ---------- */
    g.from('.capi', { y: -26, autoAlpha: 0, duration: 1, ease: 'expo.out', clearProps: CL, delay: 0.1 });

    g.from('.wppc', { scale: 0, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.8)', delay: 1.3, clearProps: CL });

    /* ---------- first screen ---------- */
    var dds = all('.stat dd'), rate = { v: 0 }, count = { v: 0 };
    var tl = g.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } });
    tl.fromTo('.phw', { autoAlpha: 0, scale: 1.05 }, { autoAlpha: 1, scale: 1, duration: 1.9, ease: 'power2.out' }, 0)
      .from('.h1 .li', { yPercent: 135, autoAlpha: 0, stagger: 0.11, clearProps: CL }, 0.25)
      .from('.lead', { y: 18, autoAlpha: 0, clearProps: CL }, 0.65)
      .from('.cta > *', { y: 18, autoAlpha: 0, stagger: 0.08, clearProps: CL }, 0.78)
      .from('.stat', { y: 16, autoAlpha: 0, stagger: 0.12, clearProps: CL }, 0.75)
      .to(rate, { v: 5, duration: 1.3, ease: 'power2.out', onUpdate: function () { dds[0].textContent = rate.v.toFixed(1).replace('.', ','); } }, 0.8)
      .to(count, { v: 3, duration: 1.1, ease: 'power2.out', onUpdate: function () { dds[1].textContent = String(Math.round(count.v)); } }, 0.9)
      .fromTo('.chip', { autoAlpha: 0, scale: 0.86 }, { autoAlpha: 1, scale: 1, stagger: 0.16, duration: 0.9, ease: 'back.out(1.6)' }, 1.05);
    if (high) {
      hv(loop('.c1', { y: -6, duration: 2.8, delay: 1.9 }, '.hero'));
      hv(loop('.c2', { y: 6, duration: 3.3, delay: 2.1 }, '.hero'));

      /* scanning light, only over the photo: a playing video brings its own motion */
      g.set('.scan', { autoAlpha: 0 });
      var scanIn = hv(g.to('.scan', { autoAlpha: 1, duration: 0.8, delay: 1.5 }));
      var scan = hv(g.fromTo('.scan i', { yPercent: -100 }, { yPercent: 455, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5 }));
      var video = one('video.photo');
      var noScan = function () { scan.kill(); scanIn.kill(); g.set('.scan', { display: 'none' }); };
      if (video) on(video, 'playing', noScan);

      if (wide) {
        var sc = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 };
        hv(g.to('.figure', { yPercent: 5, ease: 'none', scrollTrigger: sc }));
        hv(g.fromTo('.copy', { yPercent: 0, autoAlpha: 1 }, { yPercent: -10, autoAlpha: 0.25, ease: 'none', scrollTrigger: sc }));
        hv(g.to('.stats', { yPercent: -14, ease: 'none', scrollTrigger: sc }));
      }
      if (wide && fine) {
        var px = g.quickTo('.phw', 'x', { duration: 1.1, ease: 'power3' }), py = g.quickTo('.phw', 'y', { duration: 1.1, ease: 'power3' });
        var c1 = g.quickTo('.c1', 'x', { duration: 1.3, ease: 'power3' }), c2 = g.quickTo('.c2', 'x', { duration: 1.3, ease: 'power3' });
        var hero = one('.hero'), hr = null;
        on(hero, 'mouseenter', function () { hr = hero.getBoundingClientRect(); });
        on(hero, 'mousemove', function (e) {
          if (window.__tier !== 'high') return;
          hr = hr || hero.getBoundingClientRect();
          var nx = (e.clientX - hr.left) / hr.width - 0.5, ny = (e.clientY - hr.top) / hr.height - 0.5;
          px(nx * 12); py(ny * 8); c1(nx * -16); c2(nx * 20);
        });
      }
    }

    /* below the fold: prepared in small steps so the first screen stays free */
    function later(fn) {
      var run = function () { c.add(fn); };
      if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 500 }); else setTimeout(run, 120);
    }
    later(function () {
    lines('.svt .li', '.svh');
    rv('.svp', { y: 18, delay: 0.25 }, '.svh');
    rv('.svc', { y: 0, x: 70, stagger: 0.1, duration: 1.2, ease: 'expo.out' }, '.svr', 'top 88%');

    });
    later(function () {
    lines('.wt .li', '.wt');
    rv('.rate', { y: 14, delay: 0.2 }, '.wt');
    if (high) hv(g.fromTo('.big', { clipPath: 'inset(10% 8% 10% 8% round 16px)' }, { clipPath: 'inset(0% 0% 0% 0% round 16px)', duration: 1.6, ease: 'expo.out', clearProps: 'clipPath',
      scrollTrigger: { trigger: '.big', start: 'top 88%', once: true } }));
    else rv('.big', { y: 30 }, '.big', 'top 88%');
    if (high) hv(g.fromTo('.fimg', { scale: 1.14, yPercent: -3 }, { scale: 1.08, yPercent: 3, ease: 'none', scrollTrigger: { trigger: '.big', start: 'top bottom', end: 'bottom top', scrub: 0.6 } }));
    rv('.pe', { y: 24, scale: 0.96 }, '.big', 'top 62%');
    rv('.eco', { y: 44 }, '.eco', 'top 90%');
    rv('.nat', { y: 44, delay: 0.1 }, '.nat', 'top 92%');
    rv('.eci, .eco .ct, .ecd', { y: 16, stagger: 0.08, delay: 0.15 }, '.eco', 'top 88%');
    rv('.ecb', { y: 70, duration: 1.4, ease: 'expo.out' }, '.eco', 'top 88%');
    rv('.nat .ct', { y: 16, delay: 0.15 }, '.nat', 'top 90%');
    rv('.nl li', { y: 0, x: -14, stagger: 0.07, delay: 0.25 }, '.nat', 'top 90%');
    g.from('.lf', { rotation: -16, scale: 0.84, autoAlpha: 0, duration: 1.5, ease: 'expo.out', clearProps: CL,
      scrollTrigger: { trigger: '.nat', start: 'top 90%', once: true },
      onComplete: function () { if (window.__tier === 'high') hv(loop('.lf', { rotation: 2.5, duration: 3.6 }, '.nat')); } });

    });
    later(function () {
    g.fromTo('.s2', { rotation: 0, x: -10, autoAlpha: 0 }, { rotation: 13, x: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.wq', start: 'top 86%', once: true } });
    g.fromTo('.s1', { rotation: 0, y: 12, autoAlpha: 0 }, { rotation: -8, y: 0, autoAlpha: 1, duration: 1, ease: 'back.out(1.5)', scrollTrigger: { trigger: '.wq', start: 'top 86%', once: true } });
    rv('.wq blockquote', { delay: 0.1 }, '.wq', 'top 84%');
    rv('.rv', { y: 30, stagger: 0.12 }, '.wr');
    g.from('.duoi', { autoAlpha: 0, duration: 1.2, ease: 'power2.out', clearProps: 'opacity,visibility', scrollTrigger: { trigger: '.duoi', start: 'top 92%', once: true } });
    if (high) hv(g.fromTo('.duoi', { yPercent: 5 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.duoi', start: 'top bottom', end: 'top 25%', scrub: 0.6 } }));

    });
    later(function () {
    if (high) hv(g.fromTo('.bbg', { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.best', start: 'top bottom', end: 'bottom 45%', scrub: 0.6 } }));
    g.fromTo('.bey', { '--ln': 0, autoAlpha: 0 }, { '--ln': 1, autoAlpha: 1, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '.best', start: 'top 74%', once: true } });
    lines('.bti .li', '.best', 'top 72%');
    rv('.ble', { y: 18, delay: 0.3 }, '.best', 'top 72%');
    rv('.bbt', { y: 18, delay: 0.42 }, '.best', 'top 72%');
    });

    /* ---------- pointer details ---------- */
    if (fine) {
      all('.btn, .bbt, .capcta, .circ').forEach(function (b) {
        var x = 0, y = 0, r = null;
        on(b, 'mouseenter', function () { r = b.getBoundingClientRect(); x = g.quickTo(b, 'x', { duration: 0.5, ease: 'power3' }); y = g.quickTo(b, 'y', { duration: 0.5, ease: 'power3' }); });
        on(b, 'mousemove', function (e) { if (!x) return; x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.28); });
        on(b, 'mouseleave', function () { g.to(b, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.45)', overwrite: true }); x = 0; y = 0; });
      });
      all('.circ').forEach(function (b) {
        var s = b.querySelector('svg');
        on(b, 'mouseenter', function () { g.to(s, { rotation: 45, duration: 0.45, ease: 'power3.out' }); });
        on(b, 'mouseleave', function () { g.to(s, { rotation: 0, duration: 0.45, ease: 'power3.out' }); });
      });
      all('.bbt svg').forEach(function (s) {
        var b = s.parentNode;
        on(b, 'mouseenter', function () { g.to(s, { x: 4, duration: 0.35, ease: 'power3.out' }); });
        on(b, 'mouseleave', function () { g.to(s, { x: 0, duration: 0.35, ease: 'power3.out' }); });
      });
      var e = one('.eco'), bot = one('.ecb');
      on(e, 'mouseenter', function () { g.to(bot, { y: -8, rotation: 1.5, duration: 0.6, ease: 'power3.out' }); });
      on(e, 'mouseleave', function () { g.to(bot, { y: 0, rotation: 0, duration: 0.7, ease: 'power3.out' }); });
    }
    return function () { off.forEach(function (f) { f(); }); };
  });

  /* anything the visitor can never scroll far enough to reach plays right away */
  function unreachable() {
    var max = ST.maxScroll(window);
    ST.getAll().forEach(function (st) {
      if (st.vars.once && st.animation && st.start > max) st.animation.play();
    });
  }
  ST.addEventListener('refresh', unreachable);
  unreachable();

  root.classList.remove('pre');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });

  return {
    kill: function () { mm.revert(); },
    demote: function (next) {
      heavy.forEach(function (tw) {
        var ts = tw.targets ? tw.targets() : [];
        if (tw.scrollTrigger) tw.scrollTrigger.kill();
        tw.kill();
        if (ts.length) g.set(ts, { clearProps: 'all' });
      });
      heavy = [];
      g.set('.scan', { display: 'none' });
      if (next === 'low') {
        ST.getAll().forEach(function (st) {
          if (st.animation && st.vars.once) st.animation.progress(1);
          if (st.vars.once) st.kill();
        });
      }
    }
  };
}

(function () {
  var doc = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { doc.classList.remove('pre'); return; }
  if (document.readyState === 'loading') return document.addEventListener('DOMContentLoaded', arguments.callee);
  window.__fx = motion();
})();
