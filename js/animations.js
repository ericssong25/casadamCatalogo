/**
 * Casa Dam — Animaciones (CSS keyframes + class toggling)
 * Sin inline styles, sin dependencias externas
 */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PAGE_LOAD_CARD_LIMIT = 12;
  var CARD_DELAY = 50;
  var FILTER_DELAY = 35;
  var RENDER_DELAY = 20;

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); return; }
    document.addEventListener('DOMContentLoaded', fn);
  }

  function staggerElements(elements, startMs, delayMs, className) {
    elements.forEach(function (el, i) {
      el.style.setProperty('--anim-delay', (startMs + i * delayMs) + 'ms');
      el.classList.add(className);
    });
  }

  /* =======================================================
     PAGE LOAD
     ======================================================= */

  function animatePageLoad() {
    var hero = document.querySelector('.hero__content');
    if (hero) {
      hero.style.setProperty('--anim-delay', '0ms');
      hero.classList.add('anim-hero');
    }

    var search = document.querySelector('.search-bar');
    if (search) {
      search.style.setProperty('--anim-delay', '100ms');
      search.classList.add('anim-fade');
    }

    var groups = document.querySelectorAll('.filter-group');
    if (groups.length) {
      staggerElements(Array.from(groups), 200, FILTER_DELAY, 'anim-sidebar');
    }

    var allCards = document.querySelectorAll('.product-card');
    var cards = Array.from(allCards).slice(0, PAGE_LOAD_CARD_LIMIT);
    if (cards.length) {
      staggerElements(cards, 300, CARD_DELAY, 'anim-card-in');
    }
  }

  /* =======================================================
     SCROLL REVEAL
     ======================================================= */

  function initScrollReveal() {
    var allCards = document.querySelectorAll('.product-card');
    var remaining = Array.from(allCards).slice(PAGE_LOAD_CARD_LIMIT);
    if (!remaining.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.setProperty('--anim-delay', '0ms');
          entry.target.classList.add('anim-card-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    remaining.forEach(function (el) { observer.observe(el); });
  }

  /* =======================================================
     FILTER CHANGE
     ======================================================= */

  function initFilterAnimation() {
    var grid = document.querySelector('.product-grid');
    if (!grid) return;

    var observer = new MutationObserver(function () {
      var newCards = grid.querySelectorAll('.product-card:not(.anim-card-in)');
      if (!newCards.length) return;
      staggerElements(Array.from(newCards), 0, RENDER_DELAY, 'anim-card-in');
    });

    observer.observe(grid, { childList: true, subtree: true });
  }

  /* =======================================================
     COUNT BOUNCE
     ======================================================= */

  function initCountBounce() {
    var countEl = document.querySelector('.toolbar__count strong');
    if (!countEl || prefersReducedMotion) return;
    var observer = new MutationObserver(function () {
      countEl.classList.remove('bounce');
      void countEl.offsetWidth;
      countEl.classList.add('bounce');
    });
    observer.observe(countEl, { characterData: true, childList: true, subtree: true });
  }

  /* =======================================================
     SEARCH ICON SPIN
     ======================================================= */

  function initSearchSpin() {
    var inputs = document.querySelectorAll('.search-bar__input');
    inputs.forEach(function (input) {
      var timer;
      input.addEventListener('input', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          if (prefersReducedMotion) return;
          var icon = input.closest('.search-bar__search').querySelector('.search-bar__icon');
          if (!icon) return;
          icon.classList.remove('spinning');
          void icon.offsetWidth;
          icon.classList.add('spinning');
        }, 250);
      });
    });
  }

  /* =======================================================
     BUTTON FEEDBACK
     ======================================================= */

  function initButtonFeedback() {
    var clearBtn = document.querySelector('.filter-panel__clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (prefersReducedMotion) return;
        clearBtn.classList.remove('pulse');
        void clearBtn.offsetWidth;
        clearBtn.classList.add('pulse');
      });
    }
    document.querySelectorAll('.search-bar__currency').forEach(function (s) {
      s.addEventListener('change', function () {
        if (prefersReducedMotion) return;
        s.classList.remove('pulse');
        void s.offsetWidth;
        s.classList.add('pulse');
      });
    });
  }

  /* =======================================================
     EMPTY STATE
     ======================================================= */

  function initEmptyState() {
    var empty = document.querySelector('.empty-state');
    if (!empty) return;
    var observer = new MutationObserver(function () {
      if (getComputedStyle(empty).display !== 'none' && !empty.dataset.animated) {
        empty.style.setProperty('--anim-delay', '0ms');
        empty.classList.add('anim-empty');
        empty.dataset.animated = '1';
      }
    });
    observer.observe(empty, { attributes: true, attributeFilter: ['style'] });
  }

  /* =======================================================
     BOOT
     ======================================================= */

  ready(function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        animatePageLoad();
        initScrollReveal();
        initFilterAnimation();
        initCountBounce();
        initSearchSpin();
        initButtonFeedback();
        initEmptyState();
      });
    });
  });

})();
