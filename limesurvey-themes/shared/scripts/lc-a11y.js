/*!
 * LimeControl Survey Themes — usprawnienia dostępności (lc-a11y.js)
 * - link „Przejdź do treści”
 * - komunikat „wymagane” dla czytników ekranu przy gwiazdce
 * - aria-required na polach pytań obowiązkowych
 * - aria-invalid + aria-describedby dla pytań z błędem
 * - fokus na pierwszym błędzie po próbie przejścia dalej
 * - skróty klawiszowe dla ankietera (tylko gdy motyw ustawia --lc-hotkeys: 1, np. LimeControl CATI):
 *   1–9 i 0 wybierają odpowiedź, Ctrl+Enter = dalej, Ctrl+Shift+Enter = wstecz; można je wyłączyć
 * Działa z trybem AJAX (pjax) motywu fruity_twentythree.
 * Licencja: GPL-2.0-or-later
 */
(function () {
  'use strict';

  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
  var T = {
    pl: { skip: 'Przejdź do pytań', required: '(pytanie obowiązkowe)', menu: 'Menu ankiety', keys: 'Skróty', answer: 'odpowiedź', next: 'dalej', prev: 'wstecz', on: 'wł.', off: 'wył.' },
    en: { skip: 'Skip to questions', required: '(required)', menu: 'Survey menu', keys: 'Shortcuts', answer: 'answer', next: 'next', prev: 'back', on: 'on', off: 'off' },
    de: { skip: 'Zu den Fragen springen', required: '(Pflichtfrage)', menu: 'Umfragemenü', keys: 'Tastenkürzel', answer: 'Antwort', next: 'weiter', prev: 'zurück', on: 'an', off: 'aus' },
    fr: { skip: 'Aller aux questions', required: '(obligatoire)', menu: 'Menu du questionnaire', keys: 'Raccourcis', answer: 'réponse', next: 'suivant', prev: 'précédent', on: 'activés', off: 'désactivés' },
    es: { skip: 'Ir a las preguntas', required: '(obligatoria)', menu: 'Menú de la encuesta', keys: 'Atajos', answer: 'respuesta', next: 'siguiente', prev: 'anterior', on: 'activados', off: 'desactivados' },
    uk: { skip: 'Перейти до питань', required: '(обов’язкове питання)', menu: 'Меню опитування', keys: 'Клавіші', answer: 'відповідь', next: 'далі', prev: 'назад', on: 'увімк.', off: 'вимк.' }
  };
  var t = T[lang] || T.en;

  function mainTarget() {
    return document.querySelector('#main-col') ||
      document.querySelector('.group-container') ||
      document.querySelector('#limesurvey') ||
      document.querySelector('main') ||
      document.querySelector('#outerframeContainer');
  }

  function addSkipLink() {
    if (document.querySelector('.lc-skip-link')) return;
    var target = mainTarget();
    if (!target) return;
    if (!target.id) target.id = 'lc-main';
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    var a = document.createElement('a');
    a.className = 'lc-skip-link';
    a.href = '#' + target.id;
    a.textContent = t.skip;
    a.addEventListener('click', function (e) {
      e.preventDefault();
      target.focus();
      target.scrollIntoView({ block: 'start' });
    });
    document.body.insertBefore(a, document.body.firstChild);
  }

  function enhanceQuestions() {
    var questions = document.querySelectorAll('.question-container');
    Array.prototype.forEach.call(questions, function (q) {
      var mandatory = q.classList.contains('mandatory') || !!q.querySelector('.asterisk');
      if (mandatory) {
        var star = q.querySelector('.asterisk');
        // LS 7 ma już widoczny tekst „Wymagane” — wtedy nie dublujemy komunikatu.
        var hasVisibleLabel = !!q.querySelector('.question-title-container > .ls-question-mandatory');
        if (star && !hasVisibleLabel && !q.querySelector('.lc-required-text')) {
          star.setAttribute('aria-hidden', 'true');
          var sr = document.createElement('span');
          sr.className = 'lc-sr-only lc-required-text';
          sr.textContent = ' ' + t.required;
          (q.querySelector('.question-text, .ls-label-question') || star.parentNode).appendChild(sr);
        }
        Array.prototype.forEach.call(
          q.querySelectorAll('input[type=text], input[type=number], input[type=email], input[type=date], textarea, select'),
          function (el) { el.setAttribute('aria-required', 'true'); }
        );
      }

      var hasError = q.classList.contains('input-error') || q.classList.contains('ls-error-mandatory');
      var tip = q.querySelector('.question-valid-container');
      // LS ma już role="alert" wewnątrz kontenera walidacji — nie dublujemy aria-live.
      if (tip && !tip.id) tip.id = 'lc-tip-' + (q.id || Math.random().toString(36).slice(2));
      Array.prototype.forEach.call(q.querySelectorAll('input, textarea, select'), function (el) {
        if (el.type === 'hidden') return;
        if (hasError) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
        if (tip) {
          var ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
          if (ids.indexOf(tip.id) === -1) { ids.push(tip.id); el.setAttribute('aria-describedby', ids.join(' ')); }
        }
      });
    });

    var firstError = document.querySelector('.question-container.input-error, .question-container.ls-error-mandatory');
    if (firstError && !document.body.dataset.lcErrorFocused) {
      document.body.dataset.lcErrorFocused = '1';
      var heading = firstError.querySelector('.question-title-container') || firstError;
      if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
      // Gdy LS pokazuje komunikat w oknie (opcja „Pokaż okna wyskakujące”), fokus należy do okna —
      // przenosimy go na pytanie dopiero po jego zamknięciu.
      setTimeout(function () {
        var modal = document.querySelector('.modal.show, .modal.in');
        if (modal) {
          modal.addEventListener('hidden.bs.modal', function () { heading.focus(); }, { once: true });
          if (window.jQuery) window.jQuery(modal).one('hidden.bs.modal', function () { heading.focus(); });
        } else {
          heading.focus();
        }
      }, 400);
    }
  }

  // Przycisk menu w nagłówku (ikona „…”) nie ma nazwy dostępnej w fruity_twentythree.
  function labelIconButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.navbar button, .navbar-toggler'), function (b) {
      if (!b.getAttribute('aria-label') && !b.textContent.trim()) b.setAttribute('aria-label', t.menu);
    });
  }

  // ---------- Skróty klawiszowe dla ankietera ----------
  // Aktywne tylko w motywach, które ustawiają zmienną CSS --lc-hotkeys: 1 (np. LimeControl CATI).
  // Jednoznakowe skróty da się wyłączyć przyciskiem w legendzie (WCAG 2.1.4); wybór jest pamiętany.
  var HOTKEYS_OFF = 'lc_hotkeys_off';

  function hotkeysWanted() {
    try { return window.getComputedStyle(document.documentElement).getPropertyValue('--lc-hotkeys').trim() === '1'; } catch (e) { return false; }
  }
  function hotkeysDisabled() {
    try { return window.localStorage.getItem(HOTKEYS_OFF) === '1'; } catch (e) { return false; }
  }
  function isVisible(el) { return !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length)); }
  function isTyping(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable) return true;
    if (el.tagName !== 'INPUT') return false;
    var type = (el.getAttribute('type') || 'text').toLowerCase();
    return ['radio', 'checkbox', 'button', 'submit', 'reset'].indexOf(type) === -1;
  }
  function choices(scope) {
    return Array.prototype.filter.call(scope.querySelectorAll('input[type=radio], input[type=checkbox]'), function (el) {
      return !el.disabled && (isVisible(el) || isVisible(el.parentNode));
    });
  }
  function isAnswered(scope) {
    return Array.prototype.some.call(scope.querySelectorAll('input[type=radio], input[type=checkbox]'), function (el) { return el.checked; });
  }
  // Wiersz tablicy albo pytanie-lista, którego dotyczy naciśnięta cyfra.
  function hotkeyTarget() {
    var active = document.activeElement;
    var row = active && active.closest ? active.closest('table.ls-answers tbody tr') : null;
    if (row && choices(row).length) return row;
    var question = active && active.closest ? active.closest('.question-container') : null;
    if (!question || !choices(question).length) {
      question = Array.prototype.filter.call(document.querySelectorAll('.question-container'), function (q) {
        return isVisible(q) && choices(q).length && !isAnswered(q);
      })[0];
    }
    if (!question) return null;
    var rows = Array.prototype.filter.call(question.querySelectorAll('table.ls-answers tbody tr'), function (r) { return choices(r).length; });
    if (!rows.length) return question;
    return rows.filter(function (r) { return !isAnswered(r); })[0] || rows[0];
  }
  function pickChoice(index) {
    var target = hotkeyTarget();
    if (!target) return false;
    var input = choices(target)[index];
    if (!input) return false;
    input.click();
    // W tablicy fokus przechodzi do następnego wiersza — całą baterię pytań można przejść samymi cyframi.
    var next = target.tagName === 'TR' ? target.nextElementSibling : null;
    while (next && !choices(next).length) next = next.nextElementSibling;
    (next ? choices(next)[0] : input).focus();
    return true;
  }
  function onHotkey(e) {
    if (e.defaultPrevented || !hotkeysWanted()) return;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      var button = document.querySelector(e.shiftKey
        ? '#ls-button-previous, .ls-move-previous-btn'
        : '#ls-button-submit, .ls-move-next-btn, .ls-move-submit-btn');
      if (button && isVisible(button)) { e.preventDefault(); button.click(); }
      return;
    }
    if (hotkeysDisabled() || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
    if (!/^[0-9]$/.test(e.key)) return;
    var index = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
    if (pickChoice(index)) e.preventDefault();
  }
  function addHotkeyLegend() {
    if (!hotkeysWanted() || document.querySelector('.lc-hotkeys')) return;
    var nav = document.querySelector('#navigator-container, .navigator');
    if (!nav) return;
    var box = document.createElement('div');
    box.className = 'lc-hotkeys';
    var keys = document.createElement('span');
    keys.className = 'lc-hotkeys-keys';
    function kbd(text) { var k = document.createElement('kbd'); k.textContent = text; return k; }
    function add() { for (var i = 0; i < arguments.length; i++) keys.appendChild(typeof arguments[i] === 'string' ? document.createTextNode(arguments[i]) : arguments[i]); }
    add(kbd('1'), '–', kbd('9'), ' ' + t.answer + ' · ', kbd('Ctrl'), '+', kbd('Enter'), ' ' + t.next + ' · ', kbd('Ctrl'), '+', kbd('Shift'), '+', kbd('Enter'), ' ' + t.prev);
    var toggle = document.createElement('button');
    toggle.type = 'button';
    function paint() {
      var off = hotkeysDisabled();
      toggle.textContent = t.keys + ': ' + (off ? t.off : t.on);
      toggle.setAttribute('aria-pressed', off ? 'false' : 'true');
      if (off) box.setAttribute('data-off', '1'); else box.removeAttribute('data-off');
    }
    toggle.addEventListener('click', function () {
      try {
        if (hotkeysDisabled()) window.localStorage.removeItem(HOTKEYS_OFF); else window.localStorage.setItem(HOTKEYS_OFF, '1');
      } catch (e) { /* brak dostępu do localStorage — skróty zostają włączone */ }
      paint();
    });
    box.appendChild(toggle);
    box.appendChild(keys);
    paint();
    // Legenda trafia między przyciski „Wstecz” i „Dalej”, więc nigdy ich nie zasłania.
    if (nav.children.length > 1) nav.insertBefore(box, nav.children[1]); else nav.appendChild(box);
  }

  function init() {
    try { addSkipLink(); labelIconButtons(); enhanceQuestions(); addHotkeyLegend(); } catch (e) { /* nigdy nie blokuj ankiety */ }
  }
  document.addEventListener('keydown', function (e) { try { onHotkey(e); } catch (err) { /* nigdy nie blokuj ankiety */ } });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('pjax:scriptcomplete', function () { delete document.body.dataset.lcErrorFocused; init(); });
  if (window.jQuery) window.jQuery(document).on('pjax:scriptcomplete', function () { delete document.body.dataset.lcErrorFocused; init(); });
})();
