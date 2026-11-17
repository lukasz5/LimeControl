/*!
 * LimeControl Survey Themes — usprawnienia dostępności (lc-a11y.js)
 * - link „Przejdź do treści”
 * - komunikat „wymagane” dla czytników ekranu przy gwiazdce
 * - aria-required na polach pytań obowiązkowych
 * - aria-invalid + aria-describedby dla pytań z błędem
 * - fokus na pierwszym błędzie po próbie przejścia dalej
 * Działa z trybem AJAX (pjax) motywu fruity_twentythree.
 * Licencja: GPL-2.0-or-later
 */
(function () {
  'use strict';

  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().slice(0, 2);
  var T = {
    pl: { skip: 'Przejdź do pytań', required: '(pytanie obowiązkowe)', menu: 'Menu ankiety' },
    en: { skip: 'Skip to questions', required: '(required)', menu: 'Survey menu' },
    de: { skip: 'Zu den Fragen springen', required: '(Pflichtfrage)', menu: 'Umfragemenü' },
    fr: { skip: 'Aller aux questions', required: '(obligatoire)', menu: 'Menu du questionnaire' },
    es: { skip: 'Ir a las preguntas', required: '(obligatoria)', menu: 'Menú de la encuesta' },
    uk: { skip: 'Перейти до питань', required: '(обов’язкове питання)', menu: 'Меню опитування' }
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
        if (star && !q.querySelector('.lc-required-text')) {
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
      setTimeout(function () { heading.focus(); }, 60);
    }
  }

  // Przycisk menu w nagłówku (ikona „…”) nie ma nazwy dostępnej w fruity_twentythree.
  function labelIconButtons() {
    Array.prototype.forEach.call(document.querySelectorAll('.navbar button, .navbar-toggler'), function (b) {
      if (!b.getAttribute('aria-label') && !b.textContent.trim()) b.setAttribute('aria-label', t.menu);
    });
  }

  function init() {
    try { addSkipLink(); labelIconButtons(); enhanceQuestions(); } catch (e) { /* nigdy nie blokuj ankiety */ }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  document.addEventListener('pjax:scriptcomplete', function () { delete document.body.dataset.lcErrorFocused; init(); });
  if (window.jQuery) window.jQuery(document).on('pjax:scriptcomplete', function () { delete document.body.dataset.lcErrorFocused; init(); });
})();
