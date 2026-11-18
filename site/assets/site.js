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

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
