/* Navbar — estado ao rolar, indicador do link ativo e menu em cápsula no mobile */
(function () {
  var nb = document.getElementById('nb');
  if (!nb) return;
  var root = document.documentElement;
  var nav = nb.querySelector('.nb-nav');
  var ind = nb.querySelector('.nb-ind');
  var tog = nb.querySelector('.nb-tog');
  var scrim = document.querySelector('.nb-scrim');
  var links = Array.prototype.slice.call(nb.querySelectorAll('.nb-link'));
  var mobile = window.matchMedia('(max-width: 760px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = links[0], hover = null, open = false;

  links.forEach(function (a, i) { a.parentNode.style.setProperty('--i', i); });

  /* ---------- indicador (PC) ---------- */
  function place(a) {
    if (!a || mobile.matches) return;
    ind.style.setProperty('--x', a.offsetLeft + 'px');
    ind.style.setProperty('--w', a.offsetWidth + 'px');
    ind.classList.add('is-on');
  }
  links.forEach(function (a) {
    a.addEventListener('mouseenter', function () { hover = a; place(a); });
  });
  nav.addEventListener('mouseleave', function () { hover = null; place(current); });

  function setActive(a) {
    if (a === current) return;
    current = a;
    links.forEach(function (l) {
      if (l === a) l.setAttribute('aria-current', 'page'); else l.removeAttribute('aria-current');
    });
    if (!hover) place(a);
  }

  /* ---------- rolagem: barra flutuante + seção ativa ---------- */
  var targets = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  /* posições das seções ficam guardadas: a rolagem só compara números, sem medir a página a cada quadro */
  var tops = [], maxY = 0, vh = window.innerHeight, scrolled = null, ticking = false;
  function measure() {
    var y = window.scrollY;
    vh = window.innerHeight;
    tops = targets.map(function (t) { return t ? t.getBoundingClientRect().top + y : Infinity; });
    maxY = document.documentElement.scrollHeight - vh;
  }
  function update() {
    ticking = false;
    var y = window.scrollY;
    var s = y > 24;
    if (s !== scrolled) { scrolled = s; nb.classList.toggle('is-scrolled', s); }
    var line = y + vh * 0.38, best = links[0], bestTop = -Infinity;
    for (var i = 0; i < tops.length; i++) {
      if (tops[i] <= line && tops[i] > bestTop) { bestTop = tops[i]; best = links[i]; }
    }
    /* no fim da página, o último bloco fica ativo */
    if (y >= maxY - 4) best = links[links.length - 1];
    setActive(best);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  var rT = 0;
  function onResize() {
    clearTimeout(rT);
    rT = setTimeout(function () { measure(); place(hover || current); onScroll(); }, 150);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  if (window.ResizeObserver) new ResizeObserver(onResize).observe(document.body);

  /* ---------- menu mobile ---------- */
  function setOpen(v) {
    if (v === open) return;
    open = v;
    nb.classList.toggle('is-open', v);
    root.classList.toggle('nb-open', v);
    tog.setAttribute('aria-expanded', v ? 'true' : 'false');
    tog.setAttribute('aria-label', v ? 'Fechar menu' : 'Abrir menu');
    nav.inert = mobile.matches && !v;
    if (window.__lenis) { if (v) window.__lenis.stop(); else window.__lenis.start(); }
  }
  tog.addEventListener('click', function () { setOpen(!open); });
  if (scrim) scrim.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open) { setOpen(false); tog.focus(); }
  });
  function onMq() {
    if (!mobile.matches) setOpen(false);
    nav.inert = mobile.matches && !open;
    place(current);
  }
  if (mobile.addEventListener) mobile.addEventListener('change', onMq); else mobile.addListener(onMq);

  /* ---------- links: rolagem suave até a seção ---------- */
  nb.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.hash.slice(1), t = document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    var wasOpen = open;
    setOpen(false);
    var off = -84, L = window.__lenis;
    if (L) {
      L.scrollTo(id === 'home' ? 0 : t, { offset: off, duration: 1.4 });
    } else {
      var y = id === 'home' ? 0 : t.getBoundingClientRect().top + window.scrollY + off;
      /* espera a cápsula começar a fechar antes de rolar */
      setTimeout(function () {
        window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
      }, wasOpen ? 120 : 0);
    }
  });

  /* ---------- animações infinitas só rodam com a seção na tela ---------- */
  var xp = document.querySelector('.xp');
  if (xp && window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { xp.classList.toggle('is-vis', e.isIntersecting); });
    }).observe(xp);
  } else if (xp) { xp.classList.add('is-vis'); }

  /* ---------- início ---------- */
  onMq();
  measure();
  update();
  place(current);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); place(hover || current); });
  window.addEventListener('load', function () { measure(); place(hover || current); update(); });
})();
