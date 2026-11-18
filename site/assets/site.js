// LimeControl — drobne interakcje strony (bez zależności)
(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Dokumentacja: podświetlanie aktywnej sekcji w spisie treści
  var docLinks = document.querySelectorAll('.docs-nav a[href^="#"]');
  if (docLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    var navBox = document.querySelector('.docs-nav');
    docLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    // Długi spis treści przewija się sam, żeby aktywna pozycja była widoczna (strona nie skacze).
    var keepVisible = function (a) {
      if (!navBox || navBox.scrollHeight <= navBox.clientHeight) return;
      var link = a.getBoundingClientRect();
      var box = navBox.getBoundingClientRect();
      if (link.top < box.top) navBox.scrollTop -= box.top - link.top + 12;
      else if (link.bottom > box.bottom) navBox.scrollTop += link.bottom - box.bottom + 12;
    };
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && map[entry.target.id]) {
          docLinks.forEach(function (a) { a.classList.remove('active'); });
          map[entry.target.id].classList.add('active');
          keepVisible(map[entry.target.id]);
        }
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  // Pojawianie się sekcji i kart przy przewijaniu (po kolei w obrębie siatki)
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('main section:not(.hero) .section-head, main .grid > *, main .steps > li, main .compat > div, main .checklist > li, main .split > *, main .cta, main .faq details, main .shot');
  if (!reduce && 'IntersectionObserver' in window && targets.length) {
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');
        seen.unobserve(el);
        // opóźnienie potrzebne tylko przy wejściu — potem nie spowalnia efektów najechania
        el.addEventListener('transitionend', function () { el.style.removeProperty('--d'); }, { once: true });
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) {
      var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty('--d', Math.min(siblings % 6, 5) * 0.07 + 's');
      el.classList.add('reveal');
      seen.observe(el);
    });
  } else {
    document.documentElement.classList.remove('js');
  }

  // Galeria ekranów aplikacji: przyciski przewijania
  var shots = document.querySelector('.shots');
  if (shots) {
    document.querySelectorAll('.shots-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var step = (shots.querySelector('.shot') || shots).getBoundingClientRect().width + 28;
        shots.scrollBy({ left: Number(btn.getAttribute('data-dir')) * step * 2, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
