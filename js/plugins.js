/* Завантаження інтерактивних бібліотек за потреби. */
(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scripts = new Map();
  const styles = new Map();
  function loadScript(src) {
    if (scripts.has(src)) return scripts.get(src);
    const promise = new Promise((resolve,reject) => {
      const el = document.createElement('script'); el.src = src; el.async = true;
      el.onload = resolve; el.onerror = reject; document.head.appendChild(el);
    }); scripts.set(src,promise); return promise;
  }
  function loadCSS(href) {
    if (styles.has(href)) return styles.get(href);
    const promise = new Promise((resolve,reject) => {
      const el = document.createElement('link'); el.rel = 'stylesheet';el.href=href;
      el.onload=resolve; el.onerror=reject; document.head.appendChild(el);
    });styles.set(href,promise);return promise;
  }
  function onApproach(element, callback) {
    if (!element) return;
    if (!('IntersectionObserver' in window)) {callback();return;}
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry=>entry.isIntersecting)) {observer.disconnect();callback();}
    }, {rootMargin:'550px 0px'});
    observer.observe(element);
    element.addEventListener('focusin',()=>{observer.disconnect();callback();},{once:true});
  }
  function initSwiper() {
    if (typeof window.Swiper !== 'function' || document.querySelector('.lr10-route-swiper.swiper-initialized')) return;
    new window.Swiper('.lr10-route-swiper', {
      loop:true, slidesPerView:1, spaceBetween:20,speed:600,grabCursor:true,
      autoplay:reduced?false:{delay:3500,disableOnInteraction:false,pauseOnMouseEnter:true},
      pagination:{el:'.lr10-swiper-pagination',clickable:true},
      navigation:{prevEl:'.lr10-swiper-prev',nextEl:'.lr10-swiper-next'},
      keyboard:{enabled:true,onlyInViewport:true},
      a11y:{prevSlideMessage:'Попередній маршрут',nextSlideMessage:'Наступний маршрут',paginationBulletMessage:'Перейти до маршруту {{index}}'},
      breakpoints:{320:{slidesPerView:1},768:{slidesPerView:2},1024:{slidesPerView:3}}
    });
  }
  function initFancybox() {
    if (typeof window.Fancybox !== 'undefined') {
      window.Fancybox.bind('[data-fancybox="carpathian-gallery"]',{
        Carousel:{transition:'fade'},Images:{Panzoom:{maxScale:3}}
      });
    }
  }
  document.addEventListener('DOMContentLoaded', () => {
    onApproach(document.querySelector('.lr10-route-swiper'),()=>{
      Promise.all([
        loadCSS('https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css'),
        loadScript('https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js')
      ]).then(initSwiper).catch(()=>console.warn('Swiper не завантажився: відображаються всі маршрути.'));
    });
    const gallery = document.querySelector('.lr10-gallery-grid');
    onApproach(gallery,()=>{
      Promise.all([
        loadCSS('https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0.36/dist/fancybox/fancybox.css'),
        loadScript('https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0.36/dist/fancybox/fancybox.umd.js')
      ]).then(initFancybox).catch(()=>console.warn('Fancybox не завантажився: посилання на фото залишаються доступними.'));
    });
    const typed = document.querySelector('#typed-text');
    if (typed) {
      if (reduced) typed.textContent='Тихі маршрути без натовпу.';
      else {
        // Lightweight local equivalent of the former Typed.js animation.
        if (!typed.nextElementSibling?.classList.contains('typed-cursor')) {
          const cursor = document.createElement('span');
          cursor.className = 'typed-cursor';
          cursor.setAttribute('aria-hidden', 'true');
          cursor.textContent = '|';
          typed.insertAdjacentElement('afterend', cursor);
        }
        const phrases = ['Тихі маршрути без натовпу.','Озера, ліси та гірські стежки.','Мандрівки з повагою до природи.'];
        let phrase = 0, chars = 0, backwards = false;
        const animate = () => {
          // Pausing an offscreen animation avoids unnecessary layout updates.
          if (document.hidden) { window.setTimeout(animate, 600); return; }
          const value = phrases[phrase];
          typed.textContent = value.slice(0, chars);
          if (!backwards && chars === value.length) {
            backwards = true;
            window.setTimeout(animate, 1800);
            return;
          }
          if (backwards && chars === 0) {
            backwards = false;
            phrase = (phrase + 1) % phrases.length;
          }
          chars += backwards ? -1 : 1;
          window.setTimeout(animate, backwards ? 28 : 48);
        };
        animate();
      }
    }
    // Native iframe lazy loading can still eagerly request resources on long mobile pages.
    // Keep original embedding behavior but postpone external connections until actual approach.
    document.querySelectorAll('iframe[data-zsk-deferred-src]').forEach(frame=>{
      onApproach(frame,()=>{
        if (frame.dataset.zskDeferredSrc) {
          frame.src=frame.dataset.zskDeferredSrc;
          delete frame.dataset.zskDeferredSrc;
        }
      });
    });
  });
})();
