(function () {
  'use strict';
  try {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* 1 — scroll-reveal sections as they enter the viewport */
    var reveals = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-visible'); revObs.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { revObs.observe(el); });
    }

    /* 2 — highlight the nav link for the section in view */
    var links = {};
    document.querySelectorAll('.nav a[href^="#"]').forEach(function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var sections = document.querySelectorAll('#about, #work, #enquire');
    if ('IntersectionObserver' in window && sections.length) {
      var active = null;
      var navObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && links[e.target.id] && active !== e.target.id) {
            if (active && links[active]) links[active].removeAttribute('aria-current');
            links[e.target.id].setAttribute('aria-current', 'true');
            active = e.target.id;
          }
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      sections.forEach(function (s) { navObs.observe(s); });
    }

    /* 3 — click any painting to view it larger (accessible lightbox) */
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Artwork viewer');
    box.innerHTML = '<button type="button" class="lightbox__close" aria-label="Close viewer">✕</button><img alt="">';
    document.body.appendChild(box);
    var boxImg = box.querySelector('img');
    var boxClose = box.querySelector('.lightbox__close');
    var lastFocus = null;

    function openBox(src, alt) {
      boxImg.src = src;
      boxImg.alt = alt || '';
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.classList.add('no-scroll');
      requestAnimationFrame(function () { box.classList.add('is-open'); });
      boxClose.focus();
    }
    function closeBox() {
      box.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
      box.hidden = true;
      boxImg.removeAttribute('src');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    boxClose.addEventListener('click', closeBox);
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') closeBox();
      else if (e.key === 'Tab') { e.preventDefault(); boxClose.focus(); } /* trap focus on the single control */
    });

    document.querySelectorAll('.work-fig img').forEach(function (img) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'zoom-btn';
      btn.setAttribute('aria-label', 'View larger: ' + (img.alt || 'artwork'));
      img.parentNode.insertBefore(btn, img);
      btn.appendChild(img);
      btn.addEventListener('click', function () { openBox(img.currentSrc || img.src, img.alt); });
    });
  } catch (err) {
    /* never let an enhancement hide content */
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }
})();

/* hero cursor-trail / ripple — decorative, isolated so a failure here can't
   affect the enhancements above. Skipped entirely under reduced-motion. */
(function () {
  'use strict';
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var hero = document.querySelector('.hero');
    var canvas = hero && hero.querySelector('.hero-fx');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var INK = '26,26,26';                 /* --ink, as rgb for alpha compositing */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);

    var dots = [], rings = [], MAX = 160, raf = null, lastX = null, lastY = null;

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (var i = dots.length - 1; i >= 0; i--) {
        var d = dots[i];
        d.x += d.vx; d.y += d.vy; d.vx *= 0.94; d.vy *= 0.94; d.life--;
        if (d.life <= 0) { dots.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + INK + ',' + (d.life / d.max) * 0.32 + ')';
        ctx.fill();
      }
      for (var j = rings.length - 1; j >= 0; j--) {
        var g = rings[j];
        g.r += (g.maxR - g.r) * 0.08; g.life--;
        if (g.life <= 0) { rings.splice(j, 1); continue; }
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.r, 0, 6.2832);
        ctx.strokeStyle = 'rgba(' + INK + ',' + (g.life / g.max) * 0.22 + ')';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      raf = (dots.length || rings.length) ? requestAnimationFrame(tick) : null;
    }
    function start() { if (!raf) raf = requestAnimationFrame(tick); }

    function spawn(x, y, vx, vy) {
      if (dots.length >= MAX) return;
      dots.push({
        x: x, y: y,
        vx: vx * 0.12 + (Math.random() - 0.5) * 0.6,
        vy: vy * 0.12 + (Math.random() - 0.5) * 0.6 - 0.15,
        r: 0.8 + Math.random() * 1.6,
        life: 38 + (Math.random() * 28 | 0), max: 66
      });
    }

    function at(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

    hero.addEventListener('pointermove', function (e) {
      var p = at(e), x = p[0], y = p[1];
      if (x < 0 || y < 0 || x > W || y > H) { lastX = lastY = null; return; }
      if (lastX === null) { lastX = x; lastY = y; return; }
      var dx = x - lastX, dy = y - lastY, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) return;
      var n = Math.min(3, 1 + (dist / 18 | 0));
      for (var k = 0; k < n; k++) { var t = k / n; spawn(lastX + dx * t, lastY + dy * t, dx, dy); }
      lastX = x; lastY = y;
      start();
    });

    hero.addEventListener('pointerdown', function (e) {
      var p = at(e), x = p[0], y = p[1];
      rings.push({ x: x, y: y, r: 4, maxR: 70 + Math.random() * 30, life: 46, max: 46 });
      for (var k = 0; k < 10; k++) { var a = (k / 10) * 6.2832; spawn(x, y, Math.cos(a) * 8, Math.sin(a) * 8); }
      start();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = null; }
      else if (!document.hidden && (dots.length || rings.length)) start();
    });
  } catch (err) { /* decorative only */ }
})();
