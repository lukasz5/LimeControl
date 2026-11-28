/*!
 * LimeControlBranding — edytor w panelu administracyjnym LimeSurvey.
 * Rozbudowuje zwykłe pola ustawień wtyczki: wgrywanie obrazów (z podglądem), lista logotypów stopki
 * (zapisywana jako JSON w ukrytym polu) i próbnik koloru. Bez JavaScriptu pola działają jak zwykłe pola tekstowe.
 * Licencja: GPL-2.0-or-later
 */
(function () {
  'use strict';

  var ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';

  function init() {
    var editor = document.querySelector('.lcb-editor');
    if (!editor || editor.getAttribute('data-ready')) return;
    editor.setAttribute('data-ready', '1');
    var form = editor.closest('form') || document;
    var endpoint = editor.getAttribute('data-endpoint');
    var sid = editor.getAttribute('data-sid') || '0';
    var max = parseInt(editor.getAttribute('data-max'), 10) || 12;
    var T = {};
    try { T = JSON.parse(editor.getAttribute('data-i18n') || '{}'); } catch (e) { T = {}; }
    function t(k) { return T[k] || k; }

    function field(key) {
      return form.querySelector('[name="' + key + '"], [name$="[' + key + ']"]');
    }
    function csrf() {
      var input = document.querySelector('input[name="YII_CSRF_TOKEN"]');
      if (input && input.value) return input.value;
      if (window.LS && window.LS.data && window.LS.data.csrfToken) return window.LS.data.csrfToken;
      var meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.getAttribute('content') : '';
    }
    function el(tag, cls, text) {
      var e = document.createElement(tag);
      if (cls) e.className = cls;
      if (text) e.textContent = text;
      return e;
    }
    function button(text, cls) {
      var b = el('button', 'btn btn-sm ' + (cls || 'btn-outline-secondary'), text);
      b.type = 'button';
      return b;
    }
    function changed(input) {
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /** Wgrywa plik na serwer (wtyczka sprawdza uprawnienia, typ i rozmiar) i zwraca adres obrazu. */
    function upload(file) {
      var data = new FormData();
      data.append('image', file);
      data.append('sid', sid);
      data.append('YII_CSRF_TOKEN', csrf());
      return fetch(endpoint, { method: 'POST', body: data, credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) {
          return r.text().then(function (body) {
            var json = null;
            try { json = JSON.parse(body); } catch (e) { /* np. strona błędu CSRF */ }
            if (!r.ok || !json || !json.ok) throw new Error((json && json.error) || (t('js_error') + ' (HTTP ' + r.status + ')'));
            return json.url;
          });
        });
    }

    /** Przycisk „Wybierz obraz…” z ukrytym polem pliku. */
    function picker(onFile, status) {
      var input = el('input');
      input.type = 'file';
      input.accept = ACCEPT;
      input.hidden = true;
      var b = button(t('js_choose'), 'btn-outline-primary');
      b.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var file = input.files && input.files[0];
        input.value = '';
        if (!file) return;
        status.textContent = t('js_uploading');
        b.disabled = true;
        upload(file).then(function (url) {
          status.textContent = '';
          onFile(url);
        }, function (err) {
          status.textContent = err.message || t('js_error');
          status.classList.add('lcb-error');
        }).then(function () { b.disabled = false; });
      });
      return { button: b, input: input };
    }

    function preview(img, url) {
      if (url) { img.src = url; img.hidden = false; } else { img.removeAttribute('src'); img.hidden = true; }
    }

    // ---------- pojedyncze obrazy (logo w nagłówku, drugie logo) ----------
    ['header_logo', 'header_logo2'].forEach(function (key) {
      var input = field(key);
      if (!input) return;
      var box = el('div', 'lcb-image-tool');
      var img = el('img', 'lcb-thumb');
      img.alt = '';
      var status = el('span', 'lcb-status');
      status.setAttribute('aria-live', 'polite');
      var p = picker(function (url) { input.value = url; changed(input); preview(img, url); sync(); }, status);
      var remove = button(t('js_remove'));
      remove.addEventListener('click', function () { input.value = ''; changed(input); preview(img, ''); sync(); });
      function sync() {
        p.button.textContent = input.value ? t('js_replace') : t('js_choose');
        remove.hidden = !input.value;
      }
      input.addEventListener('change', function () { preview(img, input.value); sync(); });
      preview(img, input.value);
      sync();
      box.appendChild(img);
      box.appendChild(p.button);
      box.appendChild(p.input);
      box.appendChild(remove);
      box.appendChild(status);
      input.insertAdjacentElement('afterend', box);
    });

    // ---------- lista logotypów w stopce ----------
    var store = field('footer_logos');
    if (store) {
      var items = [];
      try { items = JSON.parse(store.value || '[]'); } catch (e) { items = []; }
      if (!Array.isArray(items)) items = [];
      store.classList.add('lcb-hidden-store');
      store.setAttribute('aria-hidden', 'true');
      store.tabIndex = -1;
      var list = el('ol', 'lcb-logo-list');
      var addStatus = el('span', 'lcb-status');
      addStatus.setAttribute('aria-live', 'polite');
      var add = picker(function (url) { items.push({ src: url, alt: '', href: '' }); save(); render(); }, addStatus);
      add.button.textContent = t('js_add_logo');
      var tools = el('div', 'lcb-image-tool');
      tools.appendChild(add.button);
      tools.appendChild(add.input);
      tools.appendChild(addStatus);

      function save() {
        store.value = JSON.stringify(items.filter(function (i) { return i && i.src; }));
        changed(store);
        add.button.disabled = items.length >= max;
        addStatus.textContent = items.length >= max ? t('js_limit') : '';
      }
      function render() {
        list.textContent = '';
        items.forEach(function (item, index) {
          var li = el('li', 'lcb-logo-row');
          var img = el('img', 'lcb-thumb');
          img.alt = '';
          preview(img, item.src);
          var fields = el('div', 'lcb-logo-fields');
          [['alt', 'js_alt'], ['href', 'js_link']].forEach(function (pair) {
            var label = el('label', 'lcb-field');
            var span = el('span', '', t(pair[1]));
            var inp = el('input', 'form-control form-control-sm');
            inp.type = 'text';
            inp.value = item[pair[0]] || '';
            if (pair[0] === 'href') inp.placeholder = 'https://';
            inp.addEventListener('input', function () { item[pair[0]] = inp.value; save(); flag(); });
            label.appendChild(span);
            label.appendChild(inp);
            fields.appendChild(label);
          });
          var warn = el('span', 'lcb-warn', t('js_alt_missing'));
          function flag() { warn.hidden = !!(item.alt && item.alt.trim()); }
          flag();
          fields.appendChild(warn);
          var actions = el('div', 'lcb-logo-actions');
          var rowStatus = el('span', 'lcb-status');
          rowStatus.setAttribute('aria-live', 'polite');
          var replace = picker(function (url) { item.src = url; save(); render(); }, rowStatus);
          replace.button.textContent = t('js_replace');
          var up = button('↑');
          up.setAttribute('aria-label', t('js_up'));
          up.disabled = index === 0;
          up.addEventListener('click', function () { items.splice(index - 1, 0, items.splice(index, 1)[0]); save(); render(); });
          var down = button('↓');
          down.setAttribute('aria-label', t('js_down'));
          down.disabled = index === items.length - 1;
          down.addEventListener('click', function () { items.splice(index + 1, 0, items.splice(index, 1)[0]); save(); render(); });
          var del = button(t('js_remove'), 'btn-outline-danger');
          del.addEventListener('click', function () { items.splice(index, 1); save(); render(); });
          [replace.button, replace.input, up, down, del, rowStatus].forEach(function (n) { actions.appendChild(n); });
          li.appendChild(img);
          li.appendChild(fields);
          li.appendChild(actions);
          list.appendChild(li);
        });
        add.button.disabled = items.length >= max;
      }
      render();
      store.insertAdjacentElement('afterend', tools);
      store.insertAdjacentElement('afterend', list);
    }

    // ---------- kolor marki ----------
    var color = field('brand_color');
    if (color) {
      var swatch = el('input', 'lcb-color-picker');
      swatch.type = 'color';
      swatch.setAttribute('aria-label', (color.labels && color.labels[0] ? color.labels[0].textContent : 'Colour').trim());
      var valid = function (v) { return /^#[0-9a-f]{6}$/i.test(v); };
      swatch.value = valid(color.value) ? color.value : '#1f6feb';
      swatch.addEventListener('input', function () { color.value = swatch.value.toUpperCase(); changed(color); });
      color.addEventListener('input', function () { if (valid(color.value)) swatch.value = color.value; });
      color.insertAdjacentElement('afterend', swatch);
      color.parentNode.classList.add('lcb-color-row');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // Panel ustawień ankiety bywa doładowywany — próbujemy jeszcze raz po zmianach w DOM.
  if (window.MutationObserver) {
    var obs = new MutationObserver(function () { if (document.querySelector('.lcb-editor:not([data-ready])')) init(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
