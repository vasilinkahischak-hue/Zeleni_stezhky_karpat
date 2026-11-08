
/* Зелені стежки Карпат — ЛР №9.
   Інтерактивність сайту без сторонніх JS-бібліотек. */

(() => {
  'use strict';

  const routes = window.ZSK_ROUTES || {};

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const formatPrice = (num) =>
    `${new Intl.NumberFormat('uk-UA').format(num)} грн`;

  const integer = (v, fallback, lo = 1, hi = 10) => {
    const n = Number.parseInt(v, 10);

    return Number.isFinite(n)
      ? Math.min(hi, Math.max(lo, n))
      : fallback;
  };

  const isoDate = (value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value || '')
      ? value
      : '';

  const readableDate = (value) => {
    if (!isoDate(value)) {
      return 'Дату ще не вибрано';
    }

    const [year, month, day] = value.split('-').map(Number);

    return new Intl.DateTimeFormat('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(Date.UTC(year, month - 1, day)));
  };

  // Моделі спорядження та вартість оренди за добу.
  const gearModels = {
    tent: {
      'naturehike-cloud-up-2': {
        label: 'Naturehike Cloud Up 2',
        price: 150
      },
      'msr-hubba-hubba-nx-2': {
        label: 'MSR Hubba Hubba NX 2',
        price: 210
      },
      'sea-to-summit-alto-tr2': {
        label: 'Sea to Summit Alto TR2',
        price: 240
      }
    },

    'sleeping-bag': {
      'deuter-orbit-minus5': {
        label: 'Deuter Orbit -5',
        price: 100
      },
      'marmot-trestles-elite-eco-20': {
        label: 'Marmot Trestles Elite Eco 20',
        price: 140
      },
      'sea-to-summit-spark-spiii': {
        label: 'Sea to Summit Spark SP III',
        price: 190
      }
    },

    poles: {
      'black-diamond-trail-back': {
        label: 'Black Diamond Trail Back',
        price: 50
      },
      'leki-makalu-lite': {
        label: 'LEKI Makalu Lite',
        price: 65
      },
      'black-diamond-distance-carbon-z': {
        label: 'Black Diamond Distance Carbon Z',
        price: 95
      }
    }
  };

  const extrasName = {
    tent: 'Намет',
    'sleeping-bag': 'Спальник',
    poles: 'Трекінгові палиці'
  };

  const transferCosts = {
    own: 0,
    ivano: 300,
    lviv: 600
  };

  const transferNames = {
    own: 'Власний транспорт',
    ivano: 'Трансфер з Івано-Франківська',
    lviv: 'Трансфер зі Львова'
  };

  // Розрахунок загальної вартості.
  function calculate(selection) {
    const r =
      routes[selection.route] || routes['pip-ivan'];

    const guests = integer(selection.guests, 2);
    const days = integer(selection.days, r.days, 1, 5);

    const extras = (selection.extras || []).filter(
      e => Object.prototype.hasOwnProperty.call(
        gearModels, e
      )
    );

    const gearItems = extras.map(kind => {
      const candidates = gearModels[kind];
      const modelId = selection.gearModels?.[kind];

      const selected =
        candidates[modelId] ||
        Object.values(candidates)[0];

      const id = candidates[modelId]
        ? modelId
        : Object.keys(candidates)[0];

      return {
        kind,
        id,
        label: selected.label,
        price: selected.price,
        cost: selected.price * days
      };
    });

    const gear = gearItems.reduce(
      (sum, item) => sum + item.cost,
      0
    );

    const transfer =
      transferCosts[selection.transfer] ?? 0;

    return {
      r,
      guests,
      days,
      gear,
      gearItems,
      transfer,
      base: r.price * guests,
      total: r.price * guests + gear + transfer,
      extras
    };
  }

  // ==========================================
  // КАТАЛОГ МАРШРУТІВ
  // ==========================================

  const filters = $('#filters-form');
  const grid = $('#route-cards');

  if (filters && grid) {
    const cards = $$('article[data-route]', grid);

    const search = $('#route-search');
    const sort = $('#sort');
    const count = $('#route-count');

    const levels = {
      Легкий: 1,
      Середній: 2,
      Складний: 3
    };

    function updateCatalog() {
      const keyword = (search?.value || '')
        .trim()
        .toLocaleLowerCase('uk-UA');

      const picked = name =>
        $$(`input[name="${name}"]:checked`, filters)
          .map(el => el.value);

      const chosenLevels = picked('level');
      const duration = picked('duration')[0];
      const eco = Number(picked('eco')[0] || 0);

      let visible = 0;

      for (const card of cards) {
        const days = Number(card.dataset.days);

        const matches =
          (!keyword ||
            card.dataset.search.includes(keyword)) &&
          (!chosenLevels.length ||
            chosenLevels.includes(card.dataset.level)) &&
          (!duration ||
            (duration === '1'
              ? days === 1
              : duration === '2-3'
                ? days >= 2 && days <= 3
                : days >= 4)) &&
          Number(card.dataset.eco) >= eco;

        card.classList.toggle('hidden', !matches);

        if (matches) visible++;
      }

      const mode = sort?.value || 'popular';

      const sorted = [...cards].sort((a, b) => {
        if (mode === 'price') {
          return Number(a.dataset.price) -
            Number(b.dataset.price);
        }

        if (mode === 'level') {
          return levels[a.dataset.level] -
            levels[b.dataset.level];
        }

        if (mode === 'duration') {
          return Number(a.dataset.days) -
            Number(b.dataset.days);
        }

        return cards.indexOf(a) - cards.indexOf(b);
      });

      sorted.forEach(el => grid.appendChild(el));

      if (count) {
        count.textContent =
          `Показано ${visible} із ${cards.length} маршрутів`;
      }
    }

    search?.addEventListener('input', updateCatalog);

    filters.addEventListener('change', updateCatalog);

    filters.addEventListener('reset', () =>
      setTimeout(updateCatalog, 0)
    );

    sort?.addEventListener('change', updateCatalog);

    $$('[data-sort]').forEach(button =>
      button.addEventListener('click', () => {
        sort.value = button.dataset.sort;
        updateCatalog();
      })
    );

    const map = $('#routes-map');

    $$('[data-view]').forEach(button =>
      button.addEventListener('click', () => {
        const isMap = button.dataset.view === 'map';

        grid.classList.toggle('hidden', isMap);
        map?.classList.toggle('hidden', !isMap);

        $$('[data-view]').forEach(b =>
          b.setAttribute(
            'aria-pressed',
            String(b === button)
          )
        );
      })
    );

    updateCatalog();
  }

  // ==========================================
  // СТОРІНКА ОКРЕМОГО МАРШРУТУ
  // ==========================================

  const detail = $('aside[data-route][data-price]');

  if (detail) {
    const stepper = $('[data-guest-stepper]', detail);
    const r = routes[detail.dataset.route];

    if (stepper && r) {
      let guests = 2;

      const buttons = $$('button', stepper);
      const output = $('output', stepper);

      const link = $(
        'a[href^="booking.html"]',
        detail
      );

      const date = $('select', detail);

      const update = () => {
        output.textContent = `${guests} учасн.`;

        $('#route-subtotal-label', detail).textContent =
          `${formatPrice(r.price)} × ${guests} учасн.`;

        $('#route-subtotal', detail).textContent =
          formatPrice(r.price * guests);

        $('#route-grand-total', detail).textContent =
          formatPrice(r.price * guests);

        const qs = new URLSearchParams({
          route: detail.dataset.route,
          guests: String(guests)
        });

        if (isoDate(date?.value)) {
          qs.set('date', date.value);
        }

        link.href = `booking.html?${qs.toString()}`;

        buttons[0].disabled = guests <= 1;
        buttons[1].disabled = guests >= 10;
      };

      buttons[0].addEventListener('click', () => {
        guests = Math.max(1, guests - 1);
        update();
      });

      buttons[1].addEventListener('click', () => {
        guests = Math.min(10, guests + 1);
        update();
      });

      date?.addEventListener('change', update);
      update();
    }
  }

  // ==========================================
  // ФОРМА БРОНЮВАННЯ
  // ==========================================

  const booking = $('#booking-form');

  if (booking) {
    const routeInputs = $$(
      'input[name="route"]',
      booking
    );

    const params = new URLSearchParams(location.search);
    const requested = params.get('route');

    if (routes[requested]) {
      routeInputs.find(
        input => input.value === requested
      ).checked = true;
    }

    const date = $('#date', booking);
    const guests = $('#guests', booking);

    if (isoDate(params.get('date'))) {
      date.value = params.get('date');
    }

    guests.value = String(
      integer(params.get('guests'), 2)
    );

    const now = new Date();

    const today =
      `${now.getFullYear()}-` +
      `${String(now.getMonth() + 1).padStart(2, '0')}-` +
      `${String(now.getDate()).padStart(2, '0')}`;

    date.min = today;

    if (!isoDate(date.value) || date.value < today) {
      date.value = today;
    }

    const getSelection = () => ({
      route:
        $('input[name="route"]:checked', booking)?.value ||
        'pip-ivan',

      date: date.value,
      guests: guests.value,

      days:
        $('input[name="days"]:checked', booking)?.value,

      extras:
        $$('input[name="extras"]:checked', booking)
          .map(e => e.value),

      gearModels: Object.fromEntries(
        ['tent', 'sleeping-bag', 'poles'].map(kind => [
          kind,
          $(
            `input[name="gear-model-${kind}"]:checked`,
            booking
          )?.value
        ])
      ),

      transfer:
        $('input[name="transfer"]:checked', booking)?.value ||
        'own'
    });

    // Оновлення інформації та вартості.
    const render = () => {
      const selection = getSelection();
      const quote = calculate(selection);

      $('#summary-image').src = quote.r.image;
      $('#summary-route').textContent = quote.r.name;

      $('#summary-details').textContent =
        `${readableDate(selection.date)} · ` +
        `${quote.days} дн. · ${quote.guests} учасн.`;

      $('#quote-base-label').textContent =
        `Базова програма (${quote.guests} учасн.)`;

      $('#quote-base-value').textContent =
        formatPrice(quote.base);

      $('#quote-gear-value').textContent =
        `+${formatPrice(quote.gear)}`;

      const gearSummary = $('#quote-gear-summary');

      if (gearSummary) {
        gearSummary.textContent =
          quote.gearItems.length
            ? quote.gearItems.map(item =>
                `${item.label} ` +
                `(${formatPrice(item.price)}/доба)`
              ).join(' · ')
            : 'Спорядження не обрано';
      }

      $('#quote-transfer-label').textContent =
        transferNames[selection.transfer] || 'Трансфер';

      $('#quote-transfer-value').textContent =
        `+${formatPrice(quote.transfer)}`;

      $('#quote-total').textContent =
        formatPrice(quote.total);

      $('#quote-footnote').textContent =
        `Орієнтовно за ${quote.guests} учасн.`;

      $('#quote-note').textContent =
        quote.days === quote.r.days
          ? 'Вартість орієнтовна для стандартної програми; фактичну доступність і ціну підтверджує організатор.'
          : `Обрано ${quote.days} дн., а стандартний тур триває ${quote.r.days} дн. Підсумок розраховано за базовим туром, зміну програми треба погодити.`;
    };

    function updateDurationFromRoute() {
      const r = routes[getSelection().route];
      const input = $(`#days-${r.days}`, booking);

      if (input) input.checked = true;

      render();
    }

    // ==========================================
    // РОЗКРИТТЯ КАТЕГОРІЙ СПОРЯДЖЕННЯ
    // ==========================================

    function syncGearPanels() {
      $$('input[name="extras"]', booking).forEach(box => {
        const panel = $(
          `[data-gear-panel="${box.value}"]`,
          booking
        );

        const toggleText = $(
          `[data-gear-toggle-text="${box.value}"]`,
          booking
        );

        if (!panel) return;

        panel.hidden = !box.checked;

        box.setAttribute(
          'aria-expanded',
          String(box.checked)
        );

        if (toggleText) {
          toggleText.textContent =
            box.checked ? 'Згорнути' : 'Обрати модель';
        }

        $$('input[type="radio"]', panel).forEach(input => {
          input.disabled = !box.checked;
        });
      });

      render();
    }

    // ==========================================
    // ВИПРАВЛЕННЯ ЗАВАНТАЖЕННЯ ФОТО
    // ==========================================
    //
    // Підтримуються папки:
    // assets/images/gear/
    // assets/images/
    // assets/gear/
    // images/gear/
    // images/
    //
    // Важливо:
    // display:none разом із loading="lazy"
    // може завадити завантаженню фотографії.
    // ==========================================

    $$('[data-gear-photo]', booking).forEach(container => {
      const img = $('img', container);

      if (!img) return;

      const original = img.getAttribute('src');

      if (!original) return;

      const filename = original
        .split('/')
        .pop()
        .split('?')[0];

      const candidates = [...new Set([
        original,
        `assets/images/gear/${filename}`,
        `assets/images/${filename}`,
        `assets/gear/${filename}`,
        `images/gear/${filename}`,
        `images/${filename}`,
        filename
      ])];

      const placeholder = $(
        '.gear-photo-placeholder',
        container
      );

      let pathIndex = 0;

      // Дозволяємо браузеру почати завантаження.
      img.style.display = 'block';
      img.style.opacity = '0';
      img.loading = 'eager';

      // Успішне завантаження фотографії.
      const success = () => {
        if (!img.naturalWidth) return;

        img.style.display = 'block';
        img.style.opacity = '1';

        container.classList.add(
          'gear-image-loaded'
        );

        if (placeholder) {
          placeholder.style.display = 'none';
        }
      };

      // Якщо файл не знайдено, пробуємо іншу папку.
      const nextPath = () => {
        container.classList.remove(
          'gear-image-loaded'
        );

        img.style.opacity = '0';

        if (placeholder) {
          placeholder.style.display = '';
        }

        pathIndex += 1;

        if (pathIndex < candidates.length) {
          img.src = candidates[pathIndex];
        } else {
          img.style.display = 'none';

          if (placeholder) {
            placeholder.textContent =
              'Фото не знайдено';

            placeholder.title =
              `Перевір назву та папку файлу: ${filename}`;
          }

          console.warn(
            'Не знайдено фото спорядження:',
            filename,
            'Перевірені шляхи:',
            candidates
          );
        }
      };

      img.addEventListener('load', success);
      img.addEventListener('error', nextPath);

      // Якщо браузер уже завантажив зображення.
      if (img.complete) {
        if (img.naturalWidth > 0) {
          success();
        } else {
          nextPath();
        }
      }
    });

    // ==========================================
    // ПОДІЇ ФОРМИ ТА КАЛЬКУЛЯТОРА
    // ==========================================

    routeInputs.forEach(el =>
      el.addEventListener(
        'change',
        updateDurationFromRoute
      )
    );

    booking.addEventListener('change', e => {
      if (e.target.matches('input[name="extras"]')) {
        syncGearPanels();
      } else {
        render();
      }
    });

    guests.addEventListener('input', render);
    date.addEventListener('input', render);

    updateDurationFromRoute();
    syncGearPanels();

    // ==========================================
    // КЛІЄНТСЬКА ВАЛІДАЦІЯ БРОНЮВАННЯ
    // ==========================================

    booking.noValidate = true;

    const errorIds = [
      'name',
      'phone',
      'email',
      'date',
      'guests'
    ];

    const errorMessages = {
      name:
        'Введіть прізвище та ім’я (два слова, без цифр).',

      phone:
        'Введіть український номер: +380XXXXXXXXX або 0XXXXXXXXX.',

      email:
        'Введіть коректний email, наприклад name@example.com.',

      date:
        'Оберіть дату, яка не є минулою.',

      guests:
        'Вкажіть цілу кількість учасників від 1 до 10.'
    };

    const fields = Object.fromEntries(
      errorIds.map(id => [
        id,
        $(`#${id}`, booking)
      ])
    );

    function isValid(id) {
      const value = fields[id].value.trim();

      if (id === 'name') {
        return (
          value.length >= 5 &&
          value.length <= 80 &&
          /^[\p{L}][\p{L}'’\-]*(?:\s+[\p{L}][\p{L}'’\-]*)+$/u
            .test(value)
        );
      }

      if (id === 'phone') {
        const normalized = value.replace(
          /[\s()\-]/g,
          ''
        );

        return /^(?:\+380|380|0)\d{9}$/
          .test(normalized);
      }

      if (id === 'email') {
        return (
          value.length <= 254 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
            .test(value) &&
          fields[id].validity.valid
        );
      }

      if (id === 'date') {
        return !!isoDate(value) && value >= today;
      }

      if (id === 'guests') {
        return /^(?:[1-9]|10)$/.test(value);
      }

      return false;
    }

    function validateField(id, display = true) {
      const valid = isValid(id);
      const field = fields[id];

      const message = $(
        `#${id}-error`,
        booking
      );

      if (display || !valid) {
        field.setAttribute(
          'aria-invalid',
          String(!valid)
        );

        field.classList.toggle(
          'is-invalid',
          !valid
        );

        if (message) {
          message.hidden = valid;

          message.textContent =
            valid ? '' : errorMessages[id];
        }
      }

      return valid;
    }

    errorIds.forEach(id => {
      const field = fields[id];

      field.addEventListener('blur', () =>
        validateField(id)
      );

      field.addEventListener('input', () => {
        if (
          field.getAttribute('aria-invalid') === 'true' ||
          field.value.trim()
        ) {
          validateField(id);
        }
      });

      field.addEventListener('change', () =>
        validateField(id)
      );
    });

    // ==========================================
    // МОДАЛЬНЕ ВІКНО ПІДТВЕРДЖЕННЯ
    // ==========================================

    const dialog = $('#booking-preview-dialog');

    const goToDemoConfirmation = () => {
      const selection = getSelection();

      const qs = new URLSearchParams({
        route: selection.route,
        date: selection.date,
        guests: String(
          integer(selection.guests, 2)
        ),
        days: String(selection.days),
        transfer: selection.transfer
      });

      selection.extras.forEach(kind => {
        qs.append('extras', kind);

        const modelId = selection.gearModels[kind];

        if (gearModels[kind]?.[modelId]) {
          qs.set(
            `gear-model-${kind}`,
            modelId
          );
        }
      });

      // Особисті контактні дані не передаємо в URL.
      location.href =
        `booking_confirmed.html?${qs.toString()}`;
    };

    $('[data-dialog-cancel]', dialog)
      ?.addEventListener('click', () =>
        dialog.close()
      );

    $('[data-dialog-confirm]', dialog)
      ?.addEventListener(
        'click',
        goToDemoConfirmation
      );

    booking.addEventListener('submit', e => {
      e.preventDefault();

      let firstInvalid;

      for (const id of errorIds) {
        if (
          !validateField(id) &&
          !firstInvalid
        ) {
          firstInvalid = fields[id];
        }
      }

      if (firstInvalid) {
        firstInvalid.focus();

        firstInvalid.scrollIntoView({
          block: 'center',
          behavior: 'smooth'
        });

        return;
      }

      const s = getSelection();
      const quote = calculate(s);

      $('#booking-dialog-summary').textContent =
        `${quote.r.name} · ` +
        `${readableDate(s.date)} · ` +
        `${quote.guests} учасн. · ` +
        `${formatPrice(quote.total)}`;

      if (
        dialog &&
        typeof dialog.showModal === 'function'
      ) {
        dialog.showModal();
      } else if (
        window.confirm(
          'Перейти до демонстраційного підтвердження?'
        )
      ) {
        goToDemoConfirmation();
      }
    });
  }

  // ==========================================
  // СТОРІНКА ПІДТВЕРДЖЕННЯ
  // ==========================================

  if ($('#confirmation-route')) {
    const qs = new URLSearchParams(location.search);

    const s = {
      route: qs.get('route') || 'pip-ivan',
      date: isoDate(qs.get('date')) || '',
      guests: qs.get('guests'),
      days: qs.get('days'),
      transfer: qs.get('transfer') || 'own',
      extras: qs.getAll('extras'),

      gearModels: Object.fromEntries(
        ['tent', 'sleeping-bag', 'poles'].map(kind => [
          kind,
          qs.get(`gear-model-${kind}`)
        ])
      )
    };

    const quote = calculate(s);

    $('#confirmation-route').textContent =
      quote.r.name;

    $('#confirmation-image').src =
      quote.r.image;

    $('#confirmation-image').alt =
      quote.r.name;

    $('#confirmation-date').textContent =
      `${readableDate(s.date)} · ${quote.days} дн.`;

    $('#confirmation-guests').textContent =
      `${quote.guests} учасн.`;

    $('#confirmation-total').textContent =
      formatPrice(quote.total);

    const eco = $('#confirmation-eco');

    if (eco) {
      eco.textContent =
        `Eco-Impact ${quote.r.eco}/10`;
    }

    const extraList = $('#confirmation-extras');

    if (extraList) {
      extraList.replaceChildren();

      const items = quote.gearItems.map(item =>
        `${extrasName[item.kind]}: ${item.label} — ` +
        `${formatPrice(item.cost)} (${quote.days} дн.)`
      );

      if (s.transfer && s.transfer !== 'own') {
        items.push(
          `${transferNames[s.transfer]} — ` +
          `${formatPrice(quote.transfer)}`
        );
      }

      if (!items.length) {
        items.push('Без додаткових послуг');
      }

      for (const label of items) {
        const li = document.createElement('li');

        li.textContent = label;

        extraList.appendChild(li);
      }
    }

    // Друк підтвердження.
    $('[data-action="print"]')
      ?.addEventListener('click', () =>
        window.print()
      );

    // Додавання плану мандрівки до календаря.
    $('[data-action="calendar"]')
      ?.addEventListener('click', () => {
        if (!isoDate(s.date)) {
          return alert(
            'Спочатку оберіть дату у формі розрахунку.'
          );
        }

        const start = s.date.replaceAll('-', '');

        const endDate = new Date(
          `${s.date}T12:00:00Z`
        );

        endDate.setUTCDate(
          endDate.getUTCDate() + quote.days
        );

        const end =
          `${endDate.getUTCFullYear()}` +
          `${String(endDate.getUTCMonth() + 1)
            .padStart(2, '0')}` +
          `${String(endDate.getUTCDate())
            .padStart(2, '0')}`;

        const escapeText = v =>
          v.replaceAll('\\', '\\\\')
            .replaceAll('\n', '\\n')
            .replaceAll(',', '\\,')
            .replaceAll(';', '\\;');

        const event = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Zeleni Stezhky//Demo//UK',
          'BEGIN:VEVENT',
          `UID:demo-${start}-${s.route}@carpathiantrails.invalid`,
          `DTSTAMP:${new Date()
            .toISOString()
            .replace(/[-:]/g, '')
            .replace(/\.\d{3}/, '')}`,
          `DTSTART;VALUE=DATE:${start}`,
          `DTEND;VALUE=DATE:${end}`,
          `SUMMARY:${escapeText(quote.r.name)} (план, не бронювання)`,
          'DESCRIPTION:Навчальна демонстрація. Уточніть маршрут у організатора.',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([event], {
          type: 'text/calendar;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;
        a.download = 'carpathian-hike-plan.ics';

        document.body.appendChild(a);
        a.click();
        a.remove();

        setTimeout(
          () => URL.revokeObjectURL(url),
          1000
        );
      });
  }
})();
