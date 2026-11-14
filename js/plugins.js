/* ЛР №10: автономні бібліотеки Swiper 11, Fancybox 5, Typed.js 2.1.0 */
document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (document.querySelector('.lr10-route-swiper') && typeof window.Swiper === 'function') {
    new Swiper('.lr10-route-swiper', {
      loop: true,
      slidesPerView: 1,
      spaceBetween: 20,
      speed: 600,
      grabCursor: true,
      autoplay: reducedMotion ? false : {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true
      },
      pagination: { el: '.lr10-swiper-pagination', clickable: true },
      navigation: { prevEl: '.lr10-swiper-prev', nextEl: '.lr10-swiper-next' },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        prevSlideMessage: 'Попередній маршрут',
        nextSlideMessage: 'Наступний маршрут',
        paginationBulletMessage: 'Перейти до маршруту {{index}}'
      },
      breakpoints: {
        320: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
      }
    });
  } else if (document.querySelector('.lr10-route-swiper')) {
    console.warn('Swiper недоступний: показано статичний список маршрутів.');
  }

  if (typeof window.Fancybox !== 'undefined') {
    Fancybox.bind('[data-fancybox="carpathian-gallery"]', {
      Carousel: { transition: 'fade' },
      Images: { Panzoom: { maxScale: 3 } }
    });
  }

  const typedElement = document.querySelector('#typed-text');
  if (typedElement) {
    if (reducedMotion) {
      typedElement.textContent = 'Тихі маршрути без натовпу.';
    } else if (typeof window.Typed === 'function') {
      typedElement.textContent = '';
      new Typed('#typed-text', {
        strings: [
          'Тихі маршрути без натовпу.',
          'Озера, ліси та гірські стежки.',
          'Мандрівки з повагою до природи.'
        ],
        typeSpeed: 48,
        backSpeed: 28,
        backDelay: 1800,
        loop: true,
        showCursor: true
      });
    }
  }
});
