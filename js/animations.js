/* New Style — animações (GSAP + ScrollTrigger + Lenis)
   Três níveis de desempenho (classe t-low / t-mid / t-high no <html>, definida no <head>):
   - todos: abertura, entradas de texto e cartões (rodam uma vez só)
   - mid/high: efeitos que acompanham a rolagem e o mouse (parallax, palavras acendendo, inclinação 3D, botões magnéticos)
   - high: tudo isso com o vidro da navbar mais forte; mid/high com mouse também ganham rolagem suave
   O FPS real é medido durante a abertura; se o aparelho não acompanhar, o nível cai sozinho. */
(function () {
  var root = document.documentElement;
  function show() { root.classList.remove('pre'); }

  if (!window.gsap || !window.ScrollTrigger) { show(); return; }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { show(); return; }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  gsap.config({ nullTargetWarn: false });
  ST.config({ ignoreMobileResize: true, limitCallbacks: true });

  var mm = gsap.matchMedia();
  var isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- nível de desempenho ---------- */
  var tier = window.__tier || 'mid';
  var light = function () { return tier === 'low'; };
  function setTier(t) {
    if (t === tier) return;
    root.classList.remove('t-' + tier);
    tier = window.__tier = t;
    root.classList.add('t-' + t);
    try { sessionStorage.setItem('ns-tier', t); } catch (e) {}
    if (t === 'low' && lenis) {
      lenis.destroy(); lenis = window.__lenis = null;
      gsap.ticker.remove(lenisRaf); gsap.ticker.lagSmoothing(500, 33);
    }
    if (t !== 'low') startLenis();
  }
  /* mede ~70 quadros enquanto a abertura roda (o momento mais pesado da página).
     Usa a mediana e ignora os primeiros quadros, para um engasgo isolado
     (decodificação de imagem, por exemplo) não rebaixar um aparelho bom */
  function measureFps() {
    return new Promise(function (res) {
      var last = 0, f = [], done = false;
      function end() {
        if (done) return; done = true;
        var d = f.slice(8).sort(function (a, b) { return a - b; });
        if (d.length > 10 && !window.__tierForced) {
          var fps = window.__fps = Math.round(1000 / d[d.length >> 1]);
          if (fps < 32) setTier('low');
          else if (fps < 50 && tier === 'high') setTier('mid');
          /* estimativa pelo hardware foi pessimista, mas o aparelho aguentou a abertura liso */
          else if (fps >= 55 && tier === 'low' && !window.__saveData) setTier('mid');
        }
        res();
      }
      function tick(t) {
        if (done) return;
        if (last) f.push(t - last);
        last = t;
        if (f.length < 78) requestAnimationFrame(tick); else end();
      }
      requestAnimationFrame(tick);
      setTimeout(end, 3200);
    });
  }

  /* ---------- rolagem suave (só com mouse, desligada no nível fraco) ---------- */
  var lenis = null;
  function lenisRaf(t) { if (lenis) lenis.raf(t * 1000); }
  function startLenis() {
    if (lenis || !isFine || tier === 'low' || !window.Lenis) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis; /* usado pela navbar (js/navbar.js) */
  }
  window.__lenis = null;
  startLenis();

  /* links ainda sem destino não jogam a página para o topo */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  /* ---------- barra de progresso ---------- */
  var bar = document.createElement('div');
  bar.className = 'scroll-bar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: true } });

  /* ---------- utilidades ---------- */
  /* separa o texto em palavras dentro de máscaras, mantendo <br> e <em> */
  function splitWords(el) {
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (w) {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          var o = document.createElement('span'), i = document.createElement('span');
          o.className = 'w'; i.className = 'wi'; i.textContent = w;
          o.appendChild(i); frag.appendChild(o);
        });
        el.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') {
        splitWords(n);
      }
    });
    return $$('.wi', el);
  }
  function wordsIn(el, trigger, start, delay) {
    var w = splitWords(el);
    return gsap.from(w, {
      yPercent: 118, duration: 1.15, delay: delay || 0, ease: 'expo.out', stagger: 0.04,
      scrollTrigger: { trigger: trigger || el, start: start || 'top 88%', once: true }
    });
  }
  function rise(t, trigger, o) {
    o = o || {};
    return gsap.from(t, {
      y: o.y === undefined ? 30 : o.y, autoAlpha: 0, duration: o.duration || 1.05, delay: o.delay || 0,
      stagger: o.stagger || 0, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
      scrollTrigger: { trigger: trigger || t, start: o.start || 'top 88%', once: true }
    });
  }
  function count(el, to, fmt, dur) {
    var o = { v: 0 }, lastV = -1;
    el.textContent = fmt(0);
    return gsap.to(o, {
      v: to, duration: dur || 1.8, ease: 'power2.out',
      /* só mexe no texto quando o número muda */
      onUpdate: function () { var v = Math.round(o.v); if (v !== lastV) { lastV = v; el.textContent = fmt(v); } }
    });
  }

  /* ---------- texto dos botões desliza no hover ---------- */
  $$('.ns-btn, .ns-pill, .xp-acts a').forEach(function (a) {
    var t = null;
    Array.prototype.slice.call(a.childNodes).forEach(function (n) {
      if (!t && n.nodeType === 3 && n.textContent.trim()) t = n;
    });
    if (!t) return;
    var txt = t.textContent.trim();
    var r = document.createElement('span'), i = document.createElement('span');
    r.className = 'roll'; i.className = 'roll-i'; i.textContent = txt; i.setAttribute('data-t', txt);
    r.appendChild(i);
    a.replaceChild(r, t);
    a.setAttribute('aria-label', txt);
  });

  /* ---------- 1. abertura da primeira seção ---------- */
  var num300 = $('.s-300 text'), num98 = $('.s-98 text');
  var letters = $$('.s-title .tl');
  /* no mobile a cápsula entra inteira; no PC, item por item */
  var navItems = window.matchMedia('(max-width: 760px)').matches ? $$('.nb-bar') : $$('.nb-logo, .nb-link, .nb-cta');
  var intro = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
  gsap.set(letters, { y: 1120 });
  intro
    /* só opacidade e posição: animar filtro em imagens grandes pesa em aparelhos fracos */
    .fromTo(['.scene', '.chair'], { autoAlpha: 0, y: 34 },
      { autoAlpha: 1, y: 0, duration: 1.9, ease: 'power3.out', clearProps: 'opacity,visibility,transform' }, 0)
    .to(letters, { y: 0, duration: 1.45, stagger: 0.055, clearProps: 'transform' }, 0.12)
    .from('.hz', { scaleX: 0, duration: 1.5, ease: 'power3.inOut', clearProps: 'transform' }, 0.25)
    .from(navItems, { y: -16, autoAlpha: 0, duration: 0.9, stagger: 0.035, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.45)
    .from(['#our', '#l1', '#l2'], { y: 20, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.85)
    .from(['.p1-f', '#p1-t', '.p2-f', '#p2-t'], { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.05, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 0.95)
    .from(['.read-f', '#read-t', '#play-t'], { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 1.02)
    .from('.tri', { autoAlpha: 0, duration: 0.8, clearProps: 'opacity,visibility' }, 1.2)
    .from(['.c1-f', '.s-300', '#c1a', '#c1b', '.c2-f', '.s-98', '#c2a', '#c2b'], { y: 26, autoAlpha: 0, duration: 1, stagger: 0.04, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 1)
    .add(function () {
      if (num300) count(num300, 300, function (v) { return v + '+'; });
      if (num98) count(num98, 98, function (v) { return v + '%'; });
    }, 1.05)
    .from(['#ptl'].concat($$('.partner .ico, .partner .txt')), { y: 14, autoAlpha: 0, duration: 0.85, stagger: 0.03, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, 1.2);
  var introDone = new Promise(function (res) { intro.eventCallback('onComplete', res); });

  /* ---------- 2. about ---------- */
  wordsIn($('#about-title'), '.about-heading');
  rise('.about-heading p', '.about-heading', { y: 16, delay: 0.25 });
  mm.add('(min-width: 761px)', function () { gsap.from('.about-divider', { scaleY: 0, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.about-copy', start: 'top 84%', once: true } }); });
  mm.add('(max-width: 760px)', function () { gsap.from('.about-divider', { scaleX: 0, duration: 1.2, ease: 'expo.inOut', scrollTrigger: { trigger: '.about-divider', start: 'top 90%', once: true } }); });
  $$('.about-gallery figure').forEach(function (f, i) {
    gsap.fromTo(f, { clipPath: 'inset(100% 0% 0% 0%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, delay: i * 0.14, ease: 'expo.inOut', clearProps: 'clipPath',
      scrollTrigger: { trigger: '.about-gallery', start: 'top 86%', once: true }
    });
  });

  /* ---------- 3. serviços ---------- */
  var nsHero = $('.ns-hero');
  wordsIn($('#ns-title'), nsHero, 'top 80%');
  rise('.ns-intro > p', nsHero, { y: 18, delay: 0.3, start: 'top 80%' });
  rise('.ns-pill', nsHero, { y: 18, delay: 0.42, start: 'top 80%' });
  gsap.from('.ns-feats', { '--ln': 0, duration: 1.6, ease: 'expo.inOut', scrollTrigger: { trigger: '.ns-feats', start: 'top 90%', once: true } });
  rise($$('.ns-feats li'), '.ns-feats', { y: 34, stagger: 0.09, delay: 0.15, start: 'top 86%' });

  /* ---------- 4. planos ---------- */
  wordsIn($('.ns-head h2'), '.ns-head');
  rise('.ns-head p', '.ns-head', { y: 16, delay: 0.3 });
  var plans = $$('.ns-plan');
  var planTl = gsap.timeline({ scrollTrigger: { trigger: '.ns-plans', start: 'top 82%', once: true } });
  planTl.from(plans, { y: 80, autoAlpha: 0, duration: 1.25, stagger: 0.13, ease: 'expo.out', clearProps: 'transform,opacity,visibility' }, 0);
  plans.forEach(function (p, i) {
    var at = 0.2 + i * 0.13;
    var price = $('.ns-price', p), val = parseInt(price.textContent.replace(/\D/g, ''), 10);
    price.setAttribute('aria-label', price.textContent);
    planTl.add(function () { count(price, val, function (v) { return 'R$' + v; }, 1.5); }, at);
    planTl.from($$('li', p), { x: -14, autoAlpha: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, at + 0.15);
    planTl.from($('.ns-btn', p), { y: 14, autoAlpha: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform,opacity,visibility' }, at + 0.45);
  });

  /* ---------- 5. experience ---------- */
  var card = $('.xp-card');
  var xpWords = splitWords($('#xp-title'));
  var xpTl = gsap.timeline({ scrollTrigger: { trigger: card, start: 'clamp(top 62%)', once: true }, defaults: { ease: 'power3.out' } });
  xpTl.from('.xp-eye', { y: 16, autoAlpha: 0, duration: 0.9, clearProps: 'transform,opacity,visibility' }, 0)
    .from(xpWords, { yPercent: 118, duration: 1.2, stagger: 0.09, ease: 'expo.out' }, 0.08)
    .from('.xp-txt', { y: 18, autoAlpha: 0, duration: 0.95, clearProps: 'transform,opacity,visibility' }, 0.42)
    .from('.xp-acts a', { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.09, clearProps: 'transform,opacity,visibility' }, 0.55);

  /* ================= efeitos contínuos (só mid/high) =================
     ligados depois da abertura, quando o FPS do aparelho já foi medido */
  function richFx() {
    /* primeira seção: título sai antes da cadeira, dando profundidade */
    mm.add('(min-width: 761px)', function () {
      var tr = { trigger: '.page', start: 'top top', end: 'bottom top', scrub: 0.7, invalidateOnRefresh: true };
      gsap.to('.s-title', { y: function () { return -window.innerHeight * 0.16; }, autoAlpha: 0.12, ease: 'none', scrollTrigger: tr });
      gsap.to(['.scene', '.chair', '.hz'], { y: function () { return window.innerHeight * 0.07; }, ease: 'none', scrollTrigger: tr });
      gsap.to(['#our', '#l1', '#l2'], { y: function () { return -window.innerHeight * 0.05; }, ease: 'none', scrollTrigger: tr });
    });
    mm.add('(max-width: 760px)', function () {
      gsap.to('.s-title', { y: -36, autoAlpha: 0.2, ease: 'none', scrollTrigger: { trigger: '.art', start: 'top top', end: 'bottom top', scrub: 0.6 } });
    });
    /* mouse: título e cadeira em direções opostas */
    if (isFine) mm.add('(min-width: 761px)', function () {
      var tx = gsap.quickTo('.s-title', 'x', { duration: 1.1, ease: 'power3.out' });
      var sx = gsap.quickTo('.scene', 'x', { duration: 1.1, ease: 'power3.out' });
      var cx = gsap.quickTo('.chair', 'x', { duration: 1.1, ease: 'power3.out' });
      var page = $('.page'), pending = false, lastX = 0;
      function frame() { pending = false; var n = lastX / window.innerWidth - 0.5; tx(n * -22); sx(n * 10); cx(n * 10); }
      function mv(e) { lastX = e.clientX; if (!pending) { pending = true; requestAnimationFrame(frame); } }
      page.addEventListener('mousemove', mv, { passive: true });
      return function () { page.removeEventListener('mousemove', mv); };
    });

    /* about: parágrafos acendem palavra por palavra conforme a rolagem */
    $$('.about-copy p').forEach(function (p) {
      var ws = p.textContent.trim().split(/\s+/);
      p.setAttribute('aria-label', p.textContent.trim());
      p.innerHTML = ws.map(function (w) { return '<span class="sw" aria-hidden="true">' + w + '</span>'; }).join(' ');
      gsap.fromTo($$('.sw', p), { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.05,
        scrollTrigger: { trigger: p, start: 'top 84%', end: 'bottom 55%', scrub: 0.6 }
      });
    });
    /* about: fotos com parallax */
    $$('.about-gallery figure img').forEach(function (img) {
      gsap.set(img, { scale: 1.16 });
      gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
    });

    /* serviços: colunas inclinadas abrem e andam em velocidades diferentes */
    var speed = [-1, 0.7, -0.8, 1];
    $$('.ns-col').forEach(function (c, i) {
      gsap.fromTo(c, { '--r': 0 }, {
        '--r': 1, duration: 1.5, delay: i * 0.13, ease: 'expo.inOut',
        scrollTrigger: { trigger: '.ns-slant', start: 'top 82%', once: true }
      });
      /* move a coluna na direção da própria inclinação e a foto um pouco contra (profundidade).
         Transform direto em % (mesmo resultado da antiga variável --d em cqw, sem recalcular estilos) */
      var d = speed[i] * 6, img = $('img', c);
      var st = { trigger: '.ns-slant', start: 'top bottom', end: 'bottom top', scrub: 0.8 };
      gsap.fromTo(c, { xPercent: -0.508 * d, yPercent: 1.667 * d }, { xPercent: 0.508 * d, yPercent: -1.667 * d, ease: 'none', force3D: true, scrollTrigger: st });
      gsap.fromTo(img, { yPercent: -0.44 * d }, { yPercent: 0.44 * d, ease: 'none', force3D: true, scrollTrigger: st });
    });

    /* experience: cartão cresce ao entrar */
    gsap.fromTo(card, { scale: 0.9 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: card, start: 'clamp(top 98%)', end: 'clamp(top 45%)', scrub: 0.7 } });

    if (!isFine) return;
    /* planos: luz que segue o mouse e leve inclinação 3D */
    gsap.set(plans, { transformPerspective: 1100 });
    plans.forEach(function (p) {
      var rx = gsap.quickTo(p, 'rotationX', { duration: 0.7, ease: 'power3.out' });
      var ry = gsap.quickTo(p, 'rotationY', { duration: 0.7, ease: 'power3.out' });
      var r = null;
      p.addEventListener('mouseenter', function () { r = p.getBoundingClientRect(); });
      p.addEventListener('mousemove', function (e) {
        if (!r) r = p.getBoundingClientRect();
        var nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
        p.style.setProperty('--mx', (nx * 100) + '%');
        p.style.setProperty('--my', (ny * 100) + '%');
        rx((0.5 - ny) * 3); ry((nx - 0.5) * 3);
      }, { passive: true });
      p.addEventListener('mouseleave', function () { r = null; rx(0); ry(0); });
    });
    /* botões magnéticos */
    function magnet(hit, parts, force) {
      if (!hit) return;
      var mv = parts.map(function (el) {
        return { x: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' }), y: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' }) };
      });
      var r = null;
      hit.addEventListener('mouseenter', function () { r = parts[0].getBoundingClientRect(); });
      hit.addEventListener('mousemove', function (e) {
        if (!r) r = parts[0].getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * force, dy = (e.clientY - r.top - r.height / 2) * force;
        mv.forEach(function (m) { m.x(dx); m.y(dy); });
      }, { passive: true });
      hit.addEventListener('mouseleave', function () { r = null; mv.forEach(function (m) { m.x(0); m.y(0); }); });
    }
    mm.add('(min-width: 761px)', function () {
      magnet($('a.nb-cta'), [$('a.nb-cta')], 0.22);
      magnet($('a.read'), [$('.read-f'), $('#read-t')], 0.18);
      $$('a.pill').forEach(function (a) { magnet(a, [$('.frame', a), $('.txt', a)], 0.2); });
    });
    magnet($('.ns-pill'), [$('.ns-pill')], 0.25);
    $$('.xp-acts a').forEach(function (a) { magnet(a, [a], 0.25); });
  }

  /* ---------- começa quando fontes e imagens principais estiverem prontas ---------- */
  function ready(img) {
    if (!img || img.complete) return Promise.resolve();
    return new Promise(function (res) { img.addEventListener('load', res); img.addEventListener('error', res); });
  }
  var waits = [ready($('.scene')), ready($('.chair'))];
  if (document.fonts && document.fonts.ready) waits.push(document.fonts.ready);
  var started = false;
  function start() {
    if (started) return;
    started = true;
    root.classList.add('is-intro');
    show();
    intro.play();
    ST.refresh();
    Promise.all([introDone, measureFps()]).then(function () {
      root.classList.remove('is-intro');
      if (!light()) richFx();
      ST.refresh();
    });
  }
  Promise.all(waits).then(start);
  setTimeout(start, 1800);
  window.addEventListener('load', function () { ST.refresh(); });
})();
