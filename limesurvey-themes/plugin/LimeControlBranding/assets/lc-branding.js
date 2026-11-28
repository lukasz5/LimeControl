/*!
 * LimeControlBranding — logotypy w nagłówku i stopce, kolor marki (strona respondenta).
 * Dane: window.LCBranding (wtyczka sprawdza i czyści je po stronie serwera).
 * Elementy powstają przez DOM (textContent/setAttribute) — bez innerHTML.
 * Działa z trybem AJAX (pjax) motywu fruity_twentythree.
 * Licencja: GPL-2.0-or-later
 */
(function () {
  'use strict';

  var C = window.LCBranding;
  if (!C || window.LCBrandingReady) return;
  window.LCBrandingReady = true;

  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var NEW_TAB = {
    pl: '(otwiera się w nowej karcie)', en: '(opens in a new tab)', de: '(öffnet sich in einem neuen Tab)',
    fr: '(s’ouvre dans un nouvel onglet)', es: '(se abre en una pestaña nueva)', uk: '(відкривається в новій вкладці)'
  };
  var newTab = NEW_TAB[lang.slice(0, 2)] || NEW_TAB.en;

  /** „[pl] Partnerzy [en] Partners” → tekst w języku ankiety; tekst bez znaczników zwraca bez zmian. */
  function pick(text) {
    text = String(text || '');
    var re = /\[([a-z]{2,3}(?:-[a-z0-9]{2,8})?)\]/gi;
    if (!re.test(text)) return text.trim();
    var parts = {}, first = null, m, last = 0, current = '', chunks = [];
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      chunks.push([current, text.slice(last, m.index)]);
      current = m[1].toLowerCase();
      last = re.lastIndex;
    }
    chunks.push([current, text.slice(last)]);
    chunks.forEach(function (c) {
      var value = c[1].trim();
      if (!value) return;
      parts[c[0]] = value;
      if (first === null && c[0]) first = value;
    });
    return parts[lang] || parts[lang.slice(0, 2)] || parts[''] || parts.en || first || '';
  }

  function safeUrl(url, isLink) {
    url = String(url || '').trim();
    if (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) return url;
    if (isLink && /^(mailto|tel):/i.test(url)) return url;
    return '';
  }

  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }

  function srOnly(text) {
    var s = el('span', 'lcb-sr-only');
    s.textContent = ' ' + text;
    return s;
  }

  /** Obraz logo, opcjonalnie w linku otwieranym w nowej karcie (respondent nie traci ankiety). */
  function logo(item, cls, onload) {
    var src = safeUrl(item.src, false);
    if (!src) return null;
    var img = el('img');
    img.src = src;
    img.alt = pick(item.alt) || C.fallbackAlt || '';
    img.decoding = 'async';
    if (onload) img.addEventListener('load', onload);
    var href = safeUrl(item.href, true);
    if (!href) {
      var span = el('span', cls);
      span.appendChild(img);
      return span;
    }
    var a = el('a', cls);
    a.href = href;
    if (/^https?:/i.test(href)) {
      a.target = '_blank';
      a.rel = 'noopener';
      a.appendChild(img);
      a.appendChild(srOnly(newTab));
    } else {
      a.appendChild(img);
    }
    return a;
  }

  // ---------- kolor marki z korektą kontrastu (WCAG 2.2 AA) ----------
  function hexToRgb(hex) {
    var n = String(hex).replace('#', '').trim();
    if (n.length === 3) n = n.replace(/(.)/g, '$1$1');
    if (!/^[0-9a-f]{6}$/i.test(n)) return null;
    return [0, 2, 4].map(function (i) { return parseInt(n.slice(i, i + 2), 16); });
  }
  function rgbToHex(rgb) {
    return '#' + rgb.map(function (v) { return ('0' + Math.round(Math.max(0, Math.min(255, v))).toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function lum(rgb) {
    var c = rgb.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function ratio(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function mix(a, b, t) { return [0, 1, 2].map(function (i) { return a[i] + (b[i] - a[i]) * t; }); }
  /** Przyciemnia (jasne tło) lub rozjaśnia (ciemne tło) kolor, aż ma wymagany kontrast z każdym tłem. */
  function fit(rgb, backgrounds, min, towards) {
    var c = rgb;
    for (var i = 0; i <= 50; i++) {
      var ok = backgrounds.every(function (bg) { return ratio(c, bg) >= min; });
      if (ok) return c;
      c = mix(rgb, towards, i / 50);
    }
    return towards;
  }
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function applyColor() {
    var brand = hexToRgb(C.color && C.color.brand);
    if (!brand) return;
    var root = document.documentElement.style;
    var BLACK = [17, 17, 17], WHITE = [255, 255, 255];
    if (C.color.header) {
      // Nagłówek w dokładnym kolorze marki, tekst biały albo prawie czarny — co daje większy kontrast.
      var headerText = ratio(WHITE, brand) >= ratio(BLACK, brand) ? WHITE : BLACK;
      root.setProperty('--lc-header-bg', rgbToHex(brand));
      root.setProperty('--lc-header-text', rgbToHex(headerText));
      root.setProperty('--lc-header-border', 'transparent');
    }
    // Akcent (linki, przyciski, zaznaczenia) tylko w motywach LimeControl, które opisują kolory tokenami --lc-*.
    var surface = hexToRgb(cssVar('--lc-surface'));
    var bg = hexToRgb(cssVar('--lc-bg'));
    var text = hexToRgb(cssVar('--lc-text'));
    if (!surface || !bg || !text) return;
    var dark = lum(surface) < 0.4;
    var towards = dark ? WHITE : [0, 0, 0];
    var primary = fit(brand, [surface, bg], 4.5, towards);
    var onPrimary = ratio(WHITE, primary) >= ratio([11, 18, 32], primary) ? WHITE : [11, 18, 32];
    primary = fit(primary, [onPrimary], 4.5, dark ? WHITE : [0, 0, 0]);
    var hover = fit(mix(primary, towards, 0.18), [onPrimary], 4.5, towards);
    var accent = mix(primary, surface, dark ? 0.78 : 0.9);
    for (var t = 0.9; t <= 0.99 && (ratio(text, accent) < 4.5 || ratio(primary, accent) < 3); t += 0.02) accent = mix(primary, surface, t);
    root.setProperty('--lc-primary', rgbToHex(primary));
    root.setProperty('--lc-primary-rgb', primary.map(Math.round).join(', '));
    root.setProperty('--lc-primary-hover', rgbToHex(hover));
    root.setProperty('--lc-on-primary', rgbToHex(onPrimary));
    root.setProperty('--lc-focus', rgbToHex(primary));
    root.setProperty('--lc-accent', rgbToHex(accent));
    if (cssVar('--lc-header-stripe')) root.setProperty('--lc-header-stripe', rgbToHex(primary));
  }

  // ---------- nagłówek ----------
  function fixOffset() {
    var nav = document.getElementById('survey-nav');
    if (window.basicThemeScripts && typeof window.basicThemeScripts.fixBodyPadding === 'function') {
      window.basicThemeScripts.fixBodyPadding();
    } else if (nav && getComputedStyle(nav).position === 'fixed') {
      document.body.style.paddingTop = Math.round(nav.getBoundingClientRect().height) + 'px';
    }
  }

  function renderHeader() {
    var h = C.header || {};
    var logos = (h.logos || []).filter(function (l) { return safeUrl(l.src, false); });
    if (!logos.length || document.querySelector('.lc-brand-header')) return;
    var box = el('div', 'lc-brand-header lc-brand-' + (h.align || 'split') + ' lc-brand-size-' + (h.size || 'm') + (h.plate ? ' lc-brand-plate' : ''));
    logos.forEach(function (item, i) {
      var node = logo(item, 'lc-brand-logo' + (i ? ' lc-brand-logo-2' : ''), fixOffset);
      if (node) box.appendChild(node);
    });
    var nav = document.getElementById('survey-nav') || document.querySelector('header.navbar, .navbar');
    if (nav) {
      var host = nav.querySelector('.container-fluid, .container') || nav;
      host.insertBefore(box, host.firstChild);
    } else {
      // Motyw bez paska nawigacji: logotypy nad treścią ankiety.
      box.className += ' lc-brand-standalone';
      var main = document.querySelector('#outerframeContainer, .outerframe, article, main') || document.body;
      main.insertBefore(box, main.firstChild);
    }
    document.body.classList.add('lc-brand-has-header');
    fixOffset();
  }

  // ---------- stopka ----------
  function renderFooter() {
    var f = C.footer || {};
    if (document.querySelector('.lc-brand-footer')) return;
    var title = pick(f.title);
    var text = pick(f.text);
    var logos = (f.logos || []).filter(function (l) { return safeUrl(l.src, false); });
    var link = f.link && safeUrl(f.link.href, true) ? f.link : null;
    if (!title && !text && !logos.length && !link) return;

    var footer = el('footer', 'lc-brand-footer lc-brand-footer--' + (f.style || 'card') + ' lc-brand-fsize-' + (f.size || 'm'));
    var inner = el('div', 'lc-brand-footer-inner');
    if (title) {
      var p = el('p', 'lc-brand-footer-title');
      p.textContent = title;
      inner.appendChild(p);
    }
    if (logos.length) {
      var ul = el('ul', 'lc-brand-logos');
      ul.setAttribute('role', 'list'); // Safari nie ogłasza listy bez punktorów
      logos.forEach(function (item) {
        var node = logo(item, 'lc-brand-footer-logo');
        if (!node) return;
        var li = el('li');
        li.appendChild(node);
        ul.appendChild(li);
      });
      inner.appendChild(ul);
    }
    if (text) {
      var para = el('p', 'lc-brand-footer-text');
      text.split('\n').forEach(function (line, i) {
        if (i) para.appendChild(el('br'));
        para.appendChild(document.createTextNode(line));
      });
      inner.appendChild(para);
    }
    if (link) {
      var a = el('a', 'lc-brand-footer-link');
      a.href = safeUrl(link.href, true);
      a.textContent = pick(link.label) || a.href.replace(/^(mailto|tel):/i, '');
      if (/^https?:/i.test(a.href)) { a.target = '_blank'; a.rel = 'noopener'; a.appendChild(srOnly(newTab)); }
      var lp = el('p', 'lc-brand-footer-links');
      lp.appendChild(a);
      inner.appendChild(lp);
    }
    footer.appendChild(inner);
    var article = document.querySelector('body > article');
    if (article && article.parentNode) article.parentNode.insertBefore(footer, article.nextSibling);
    else document.body.appendChild(footer);
  }

  function init() {
    try { applyColor(); } catch (e) { /* kolor jest dodatkiem — nigdy nie blokuj ankiety */ }
    try { renderHeader(); renderFooter(); } catch (e) { /* nigdy nie blokuj ankiety */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // Tryb AJAX fruity_twentythree podmienia nagłówek przy każdej stronie ankiety.
  document.addEventListener('pjax:scriptcomplete', init);
  if (window.jQuery) window.jQuery(document).on('pjax:scriptcomplete', init);
  window.addEventListener('load', fixOffset);
})();
