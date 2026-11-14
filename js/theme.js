/* Перемикач світлої / темно-зеленої теми та тематичних SVG на всіх сторінках. */
(() => {
  'use strict';
  const key = 'zsk-theme';
  const root = document.documentElement;
  const toggles = [...document.querySelectorAll('[data-theme-toggle]')];
  const themeImages = [...document.querySelectorAll('[data-theme-light-src][data-theme-dark-src]')];
  const current = () => root.dataset.theme === 'dark' ? 'dark' : 'light';

  // Якщо користувач ще не скопіював темний SVG, залишаємо світлий логотип.
  themeImages.forEach(img => {
    img.addEventListener('error', () => {
      if (img.getAttribute('src') === img.dataset.themeDarkSrc) {
        img.src = img.dataset.themeLightSrc;
      }
    });
  });

  function apply(theme) {
    const dark = theme === 'dark';
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', dark ? '#16362A' : '#1E3F20');

    toggles.forEach(button => {
      const action = dark ? 'Увімкнути світлу тему' : 'Увімкнути темно-зелену тему';
      button.setAttribute('aria-label', action);
      button.setAttribute('title', action);
      button.setAttribute('aria-pressed', String(dark));
    });

    themeImages.forEach(img => {
      const src = dark ? img.dataset.themeDarkSrc : img.dataset.themeLightSrc;
      if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    });
  }

  apply(current());
  toggles.forEach(button => button.addEventListener('click', () => {
    const next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
    try { localStorage.setItem(key, next); } catch (_) { /* localStorage може бути недоступним */ }
  }));
})();
