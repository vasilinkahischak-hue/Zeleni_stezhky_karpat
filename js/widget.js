/* Зелені стежки Карпат · Планувальник бюджету походу.
   Vanilla JavaScript, ізоляція IIFE, fetch/async-await, defensive programming. */
(() => {
  'use strict';

  const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const validMoney = (n) => Number.isSafeInteger(n) && n >= 0 && n <= 1000000;
  const currency = (value) => `${new Intl.NumberFormat('uk-UA').format(value)} грн`;

  // Вміст JSON також вважаємо недовіреним: не покладаємося лише на HTML-обмеження.
  function normalizeData(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.routes) || !raw.rules) {
      throw new Error('Некоректна структура JSON');
    }
    const original = raw.routes;
    if (original.length < 1 || original.length > 25) {
      throw new Error('Некоректна кількість маршрутів');
    }
    const ids = new Set();
    const routes = original.map((route) => {
      if (!route || typeof route !== 'object' ||
          typeof route.id !== 'string' || !/^[a-z0-9-]{1,45}$/.test(route.id) ||
          ids.has(route.id) ||
          typeof route.name !== 'string' ||
          route.name.trim().length < 2 || route.name.length > 130 ||
          !validMoney(route.price) || route.price < 1 ||
          !Number.isSafeInteger(route.standardDays) ||
          route.standardDays < 1 || route.standardDays > 7) {
        throw new Error('Недопустимі дані маршруту');
      }
      ids.add(route.id);
      return Object.freeze({
        id: route.id, name: route.name.trim(),
        price: route.price, standardDays: route.standardDays
      });
    });

    const r = raw.rules;
    for (const kind of ['guests', 'days']) {
      const range = r[kind];
      if (!range || !Number.isSafeInteger(range.min) ||
          !Number.isSafeInteger(range.max) || range.min < 1 ||
          range.min > range.max || range.max > 100) {
        throw new Error(`Некоректні межі ${kind}`);
      }
    }
    for (const name of ['foodPerPersonPerDay', 'gearPerDay']) {
      if (!validMoney(r[name])) throw new Error(`Некоректний тариф ${name}`);
    }
    if (!r.groupDiscount || !Number.isSafeInteger(r.groupDiscount.fromGuests) ||
        r.groupDiscount.fromGuests < r.guests.min ||
        r.groupDiscount.fromGuests > r.guests.max ||
        !Number.isFinite(r.groupDiscount.percent) ||
        r.groupDiscount.percent < 0 || r.groupDiscount.percent > 50) {
      throw new Error('Некоректна групова знижка');
    }
    if (!r.transport || typeof r.transport !== 'object' ||
        !hasOwn(r.transport, 'own') || Object.keys(r.transport).length > 12) {
      throw new Error('Некоректний список трансферів');
    }
    const transport = Object.create(null);
    Object.entries(r.transport).forEach(([key, option]) => {
      if (!/^[a-z0-9-]{1,30}$/.test(key) || !option ||
          typeof option.label !== 'string' ||
          option.label.trim().length < 2 || option.label.length > 90 ||
          !validMoney(option.price)) {
        throw new Error('Некоректний трансфер');
      }
      transport[key] = Object.freeze({label: option.label.trim(), price: option.price});
    });
    return {
      routes, routeMap: new Map(routes.map((route) => [route.id, route])),
      rules: Object.freeze({
        guests: {...r.guests}, days: {...r.days},
        foodPerPersonPerDay: r.foodPerPersonPerDay,
        gearPerDay: r.gearPerDay,
        groupDiscount: {...r.groupDiscount},
        transport
      })
    };
  }

  // parseInt('2.5') мовчки повертає 2 — навмисно використовуємо Number().
  function readCount(raw, limits, roundUp = false) {
    if (typeof raw !== 'string' && typeof raw !== 'number') {
      return {error: 'Введіть числове значення.'};
    }
    const trimmed = String(raw).trim().replace(',', '.');
    if (trimmed === '') return {error: `Введіть число від ${limits.min} до ${limits.max}.`};
    const value = Number(trimmed);
    if (!Number.isFinite(value)) return {error: 'Введіть коректне скінченне число.'};
    if (value < 0) return {error: 'Від’ємні значення не допускаються.'};
    if (value === 0) return {error: `Значення має бути від ${limits.min} до ${limits.max}.`};
    if (!roundUp && !Number.isInteger(value)) return {error: 'Кількість учасників має бути цілим числом.'};
    const result = roundUp ? Math.ceil(value) : value;
    if (!Number.isSafeInteger(result) || result < limits.min || result > limits.max) {
      return {error: `Дозволений діапазон: від ${limits.min} до ${limits.max}.`};
    }
    return {
      value: result,
      note: roundUp && result !== value ? `Витрати рахуються за повні дні: ${trimmed} → ${result}.` : ''
    };
  }

  // Чиста функція: завжди повертає обчислені значення або кидає контрольовану помилку.
  function calculate(data, selection) {
    const route = data.routeMap.get(selection.route);
    if (!route) throw new RangeError('Оберіть маршрут зі списку.');
    const guests = selection.guests;
    const days = selection.days;
    if (!Number.isSafeInteger(guests) || guests < data.rules.guests.min || guests > data.rules.guests.max ||
        !Number.isSafeInteger(days) || days < data.rules.days.min || days > data.rules.days.max) {
      throw new RangeError('Недопустимі кількісні параметри.');
    }
    if (!hasOwn(data.rules.transport, selection.transport)) {
      throw new RangeError('Оберіть транспорт зі списку.');
    }
    const base = route.price * guests;
    const discount = guests >= data.rules.groupDiscount.fromGuests
      ? Math.round(base * data.rules.groupDiscount.percent / 100) : 0;
    const durationSurcharge = Math.round(Math.max(0,days-route.standardDays)*route.price/route.standardDays*guests);
    const food = selection.food === true ? guests * days * data.rules.foodPerPersonPerDay : 0;
    const gear = selection.gear === true ? days * data.rules.gearPerDay : 0;
    const transfer = data.rules.transport[selection.transport].price;
    const total = base + durationSurcharge - discount + food + gear + transfer;
    if (!Number.isSafeInteger(total) || total < 0 ||
        ![base, durationSurcharge, discount, food, gear, transfer].every(Number.isSafeInteger)) {
      throw new RangeError('Неможливо безпечно обчислити вартість.');
    }
    return {route, guests, days, base, durationSurcharge, discount, food, gear, transfer, total};
  }

  function initWidget(root) {
    const pick = (key) => root.querySelector(`[data-tb="${key}"]`);
    const keys = [
      'form','fields','status','retry','route','route-error',
      'guests','guests-error','days','days-error',
      'transport','transport-error','food','gear',
      'lines','total','note','selected-name','selected-details','booking-link'
    ];
    const el = Object.fromEntries(keys.map((key) => [key, pick(key)]));
    if (keys.some((key) => !el[key])) {
      console.warn('[Бюджет походу] не вистачає HTML-елементів віджета.');
      return;
    }

    let data = null;
    let queued = false;
    const setStatus = (message, retry = false) => {
      el.status.textContent = message;
      el.status.hidden = !message;
      el.retry.hidden = !retry;
    };
    const setError = (field, textEl, message, hint = '') => {
      const bad = Boolean(message);
      field.setAttribute('aria-invalid', String(bad));
      field.classList.toggle('lr11-invalid', bad);
      textEl.textContent = message || hint;
      textEl.classList.toggle('lr11-info', !bad && Boolean(hint));
    };
    const blankResult = (message) => {
      el.lines.replaceChildren();
      el.total.textContent = '—';
      el.note.textContent = message;
      el['booking-link'].setAttribute('aria-disabled','true');
      el['booking-link'].removeAttribute('href');
    };
    const addLine = (label, price, negative = false) => {
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = `${negative ? '−' : ''}${currency(price)}`;
      if (negative) dd.className = 'lr11-discount';
      el.lines.append(dt, dd);
    };

    function update() {
      queued = false;
      if (!data) return;
      const routeId = el.route.value;
      const guestCount = readCount(el.guests.value, data.rules.guests);
      const tripDays = readCount(el.days.value, data.rules.days, true);
      const routeError = data.routeMap.has(routeId) ? '' : 'Оберіть маршрут зі списку.';
      const transferError = hasOwn(data.rules.transport, el.transport.value)
        ? '' : 'Оберіть транспорт зі списку.';
      setError(el.route, el['route-error'], routeError);
      setError(el.guests, el['guests-error'], guestCount.error || '');
      setError(el.days, el['days-error'], tripDays.error || '', tripDays.note || '');
      setError(el.transport, el['transport-error'], transferError);
      if (routeError || guestCount.error || tripDays.error || transferError) {
        blankResult('Виправте виділені поля, щоб побачити вартість.');
        return;
      }
      try {
        const summary = calculate(data, {
          route: routeId, guests: guestCount.value, days: tripDays.value,
          transport: el.transport.value, food: el.food.checked, gear: el.gear.checked
        });
        el['selected-name'].textContent = summary.route.name;
        el['selected-details'].textContent = `${summary.guests} учасн. · ${summary.days} дн. додаткових витрат`;
        el.lines.replaceChildren();
        addLine(`Тур: ${currency(summary.route.price)} × ${summary.guests}`, summary.base);
        if(summary.durationSurcharge)addLine('Додаткові дні',summary.durationSurcharge);
        if (summary.discount) addLine('Групова знижка 5% на тур', summary.discount, true);
        addLine('Харчування', summary.food);
        addLine('Спорядження', summary.gear);
        addLine('Транспорт', summary.transfer);
        el.total.textContent = currency(summary.total);
        el.note.textContent = summary.days !== summary.route.standardDays
          ? `Стандартний маршрут триває ${summary.route.standardDays} дн. Для іншої тривалості уточніть програму; сума орієнтовна.`
          : 'Орієнтовна вартість подорожі. Наявність місць та деталі узгоджуються з організатором.';
        const params = new URLSearchParams({route: routeId, guests: String(summary.guests),days:String(summary.days)});
        el['booking-link'].href = `booking.html?${params.toString()}`;
        el['booking-link'].removeAttribute('aria-disabled');
      } catch (error) {
        blankResult('Не вдалося виконати розрахунок. Перевірте введені значення.');
        console.warn('[Бюджет походу] відхилено некоректне значення:', error.message);
      }
    }
    const scheduleUpdate = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    };

    const fillSelect = (select, entries, current) => {
      select.replaceChildren();
      entries.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label; // ніколи не innerHTML для JSON або вводу користувача
        select.appendChild(option);
      });
      select.value = current;
    };
    async function load() {
      data = null;
      el.fields.disabled = true;
      blankResult('Завантажуємо маршрути та тарифи…');
      setStatus('Завантажуємо маршрути та тарифи…');
      try {
        const response = await fetch(root.dataset.src || 'data/widget-data.json', {cache: 'no-store'});
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const loaded = normalizeData(await response.json());
        data = loaded;
        fillSelect(el.route, loaded.routes.map((route) =>
          [route.id, `${route.name} — ${currency(route.price)} / учасник`]), loaded.routes[0].id);
        fillSelect(el.transport, Object.entries(loaded.rules.transport).map(([id, item]) =>
          [id, `${item.label} — ${currency(item.price)}`]), 'own');
        el.guests.min = loaded.rules.guests.min;
        el.guests.max = loaded.rules.guests.max;
        el.days.min = loaded.rules.days.min;
        el.days.max = loaded.rules.days.max;
        el.days.value = String(loaded.routes[0].standardDays);
        el.fields.disabled = false;
        setStatus('');
        update();
      } catch (error) {
        console.warn('[Бюджет походу] не вдалося завантажити JSON:', error.message);
        setStatus('Не вдалося завантажити тарифи. Перевірте Live Server та повторіть спробу.', true);
        blankResult('Дані тимчасово недоступні.');
      }
    }
    el.form.addEventListener('input', scheduleUpdate);
    el.form.addEventListener('change', scheduleUpdate);
    el.form.addEventListener('submit', (event) => event.preventDefault());
    el.retry.addEventListener('click', load);
    load();
  }

  if (typeof document !== 'undefined') {
    const initAll = () => document.querySelectorAll('[data-trip-budget]').forEach(initWidget);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAll, {once:true});
    } else initAll();
  }
  // Node test access, without exposing production globals in browsers.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {normalizeData, readCount, calculate};
  }
})();
