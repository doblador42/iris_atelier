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
