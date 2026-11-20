// LimeControl — drobne interakcje strony (bez zależności)
(function () {
  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  var progress = document.querySelector('.nav-progress');
  var toTop = document.querySelector('.to-top');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Przewijanie: cień nawigacji, pasek postępu czytania, przycisk „na górę” (raz na klatkę)
  var ticking = false;
  var onScroll = function () {
    ticking = false;
    var y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    }
    if (toTop) toTop.classList.toggle('show', y > 700);
  };
  onScroll();
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  if (toTop) {
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      var logo = document.querySelector('.nav-logo');
      if (logo) logo.focus({ preventScroll: true });
    });
  }

  // Menu mobilne (animowany hamburger)
  var setMenu = function (open) {
    if (!toggle || !links) return;
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', toggle.getAttribute(open ? 'data-label-close' : 'data-label-open') || '');
    document.body.classList.toggle('nav-open', open);
  };
  if (toggle && links) {
    toggle.addEventListener('click', function () { setMenu(!links.classList.contains('open')); });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') && !e.target.closest('.nav')) setMenu(false);
    });
    window.matchMedia('(min-width: 1041px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  // Rozwijana lista języków
  var langMenu = document.querySelector('.lang-menu');
  var langBtn = langMenu && langMenu.querySelector('.lang-btn');
  var setLang = function (open, focusBtn) {
    if (!langBtn) return;
    langMenu.classList.toggle('open', open);
    langBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      var cur = langMenu.querySelector('.lang-list a[aria-current]') || langMenu.querySelector('.lang-list a');
      if (cur) cur.focus();
    } else if (focusBtn) langBtn.focus();
  };
  if (langBtn) {
    langBtn.addEventListener('click', function () { setLang(!langMenu.classList.contains('open')); });
    document.addEventListener('click', function (e) {
      if (langMenu.classList.contains('open') && !e.target.closest('.lang-menu')) setLang(false);
    });
    langMenu.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !langMenu.contains(e.relatedTarget)) setLang(false);
    });
    langMenu.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      var items = Array.prototype.slice.call(langMenu.querySelectorAll('.lang-list a'));
      if (!langMenu.classList.contains('open')) { if (e.target === langBtn) { e.preventDefault(); setLang(true); } return; }
      var i = items.indexOf(document.activeElement);
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (langMenu && langMenu.classList.contains('open')) setLang(false, true);
    else if (links && links.classList.contains('open')) { setMenu(false); toggle.focus(); }
  });

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
  var targets = document.querySelectorAll('main section:not(.hero) .section-head, main .grid > *, main .steps > li, main .compat > div, main .checklist > li, main .split > *, main .cta, main .faq details, main .shot, .footer-grid > *');
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

  // Google Analytics 4 — ładowany wyłącznie po zgodzie (identyfikator w <html data-ga>, baner w stopce).
  var gaId = document.documentElement.getAttribute('data-ga');
  var banner = document.getElementById('cookie-banner');
  if (gaId && banner) {
    var KEY = 'lc-consent';
    var MAX_AGE = 365 * 24 * 3600 * 1000; // po roku pytamy ponownie
    var read = function () {
      try {
        var v = JSON.parse(localStorage.getItem(KEY) || 'null');
        return v && (v.value === 'granted' || v.value === 'denied') && Date.now() - v.at < MAX_AGE ? v.value : null;
      } catch (e) { return null; }
    };
    var save = function (value) {
      try { localStorage.setItem(KEY, JSON.stringify({ value: value, at: Date.now() })); } catch (e) { /* tryb prywatny */ }
    };
    var loaded = false;
    var loadGa = function () {
      if (loaded) return;
      loaded = true;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
      window.gtag('js', new Date());
      window.gtag('config', gaId, { allow_google_signals: false, allow_ad_personalization_signals: false });
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
      document.head.appendChild(s);
    };
    // Usuwa pliki cookie GA (_ga, _ga_<ID>) z bieżącej domeny i domeny nadrzędnej.
    var clearGa = function () {
      var host = location.hostname.replace(/^www\./, '');
      document.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (!/^_ga/.test(name)) return;
        [host, '.' + host, ''].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      });
    };
    var show = function () { banner.hidden = false; };
    var decide = function (value) {
      var before = read();
      save(value);
      banner.hidden = true;
      if (value === 'granted') loadGa();
      else {
        clearGa();
        if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
        // Skrypt GA już działa na tej stronie — przeładowanie zatrzymuje go od razu.
        if (before === 'granted' && loaded) location.reload();
      }
    };
    banner.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-consent]');
      if (btn) decide(btn.getAttribute('data-consent'));
    });
    document.querySelectorAll('[data-cookie-settings]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        show();
        var first = banner.querySelector('button');
        if (first) first.focus();
      });
    });
    var current = read();
    if (current === 'granted') loadGa();
    else if (current === null) show();
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
