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

/* hero ambient field — faint ink motes that drift continuously, respond to
   device tilt (phones) and the pointer (desktop), with a ripple on tap/click.
   Decorative and isolated; fully skipped under reduced-motion, paused when the
   hero is off-screen or the tab is hidden. */
(function () {
  'use strict';
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var hero = document.querySelector('.hero');
    var canvas = hero && hero.querySelector('.hero-fx');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var INK = '26,26,26';                  /* --ink, as rgb for alpha compositing */
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;

    var motes = [], sparks = [], rings = [];
    var driftX = 0, driftY = 0, tgtX = 0, tgtY = 0;   /* tilt-driven flow, eased */
    var px = 0, py = 0, pActive = false;              /* pointer (repel) */
    var raf = null, visible = true;

    function rand(a, b) { return a + Math.random() * (b - a); }
    function newMote() {
      return { x: rand(0, W || 320), y: rand(0, H || 320),
               vx: rand(-0.15, 0.15), vy: rand(-0.15, 0.15),
               r: rand(0.8, 2.2), a: rand(0.16, 0.30) };
    }
    function build() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var target = Math.max(24, Math.min(64, Math.round(W * H / 14000)));
      while (motes.length < target) motes.push(newMote());
      motes.length = target;
    }

    function tick() {
      if (!visible) { raf = null; return; }
      ctx.clearRect(0, 0, W, H);
      driftX += (tgtX - driftX) * 0.05;
      driftY += (tgtY - driftY) * 0.05;

      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.x += m.vx + driftX;
        m.y += m.vy + driftY;
        if (pActive) {                     /* push motes away from the pointer */
          var dx = m.x - px, dy = m.y - py, d2 = dx * dx + dy * dy;
          if (d2 < 14400 && d2 > 1) {      /* within 120px */
            var d = Math.sqrt(d2), f = (1 - d / 120) * 2.6;
            m.x += dx / d * f; m.y += dy / d * f;
          }
        }
        if (m.x < -6) m.x = W + 6; else if (m.x > W + 6) m.x = -6;
        if (m.y < -6) m.y = H + 6; else if (m.y > H + 6) m.y = -6;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + INK + ',' + m.a + ')';
        ctx.fill();
      }

      for (var s = sparks.length - 1; s >= 0; s--) {
        var p = sparks[s];
        p.x += p.vx; p.y += p.vy; p.vx *= 0.93; p.vy *= 0.93; p.life--;
        if (p.life <= 0) { sparks.splice(s, 1); continue; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(' + INK + ',' + (p.life / p.max) * 0.34 + ')';
        ctx.fill();
      }
      for (var g = rings.length - 1; g >= 0; g--) {
        var ring = rings[g];
        ring.r += (ring.maxR - ring.r) * 0.08; ring.life--;
        if (ring.life <= 0) { rings.splice(g, 1); continue; }
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, 6.2832);
        ctx.strokeStyle = 'rgba(' + INK + ',' + (ring.life / ring.max) * 0.22 + ')';
        ctx.lineWidth = 1; ctx.stroke();
      }
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf && visible) raf = requestAnimationFrame(tick); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    function at(e) { var r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

    hero.addEventListener('pointermove', function (e) {
      var p = at(e); px = p[0]; py = p[1];
      pActive = px >= 0 && py >= 0 && px <= W && py <= H;
    });
    hero.addEventListener('pointerleave', function () { pActive = false; });

    hero.addEventListener('pointerdown', function (e) {
      enableTilt();                        /* first gesture unlocks iOS motion */
      var p = at(e), x = p[0], y = p[1];
      rings.push({ x: x, y: y, r: 4, maxR: 70 + Math.random() * 30, life: 46, max: 46 });
      for (var k = 0; k < 12; k++) {
        var ang = (k / 12) * 6.2832;
        sparks.push({ x: x, y: y, vx: Math.cos(ang) * rand(1, 3), vy: Math.sin(ang) * rand(1, 3),
                      r: rand(0.8, 2), life: 40, max: 40 });
      }
      start();
    });

    /* device tilt → drift direction */
    function onTilt(e) {
      if (e.gamma == null && e.beta == null) return;
      var g = Math.max(-45, Math.min(45, e.gamma || 0));
      var b = Math.max(-45, Math.min(45, (e.beta || 0) - 45));
      tgtX = (g / 45) * 0.5;
      tgtY = (b / 45) * 0.35;
    }
    var tiltOn = false;
    function enableTilt() {
      if (tiltOn) return;
      var DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {   /* iOS 13+ */
        tiltOn = true;
        DOE.requestPermission().then(function (st) {
          if (st === 'granted') window.addEventListener('deviceorientation', onTilt);
        }).catch(function () {});
      }
    }
    /* Android / desktop sensors need no permission — attach right away */
    if (window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission !== 'function') {
      window.addEventListener('deviceorientation', onTilt);
    }

    build();
    if ('ResizeObserver' in window) new ResizeObserver(build).observe(canvas);
    else window.addEventListener('resize', build);

    if ('IntersectionObserver' in window) {       /* run only while hero is in view */
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    start();
  } catch (err) { /* decorative only */ }
})();
