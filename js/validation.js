/* ЛР №9 — адаптивна форма: HTML5 + Vanilla JavaScript + RegEx.
   Демонстрація: жоден контактний запис не надсилається і не зберігається.
   Регулярні вирази задають конкретні навчальні правила, а не гарантують існування email/телефону. */
(() => {
  'use strict';
  const form = document.getElementById('feedbackForm');
  if (!form) return;
  const dialog = document.getElementById('feedbackDialog');
  const closeButton = document.getElementById('feedbackDialogClose');
  const status = document.getElementById('feedbackStatus');
  const ids = ['username','email','phone','message','agreement'];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const touched = new Set();
  const REGEX_PHONE = /^\+380\d{9}$/;
  const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const letters = /\p{L}/gu;
  form.noValidate = true;

  // Рівень правил: кожне поле перевіряється окремою невеликою функцією.
  function validateName() {
    const value = fields.username.value.trim();
    if (!value) return 'Вкажіть ваше ім’я.';
    if ([...value].length > 80) return 'Ім’я має містити не більше 80 символів.';
    if ((value.match(letters) || []).length < 2) return 'Вкажіть щонайменше дві літери.';
    if (!/^[\p{L}\p{M}\s’'-]+$/u.test(value)) return 'Використовуйте літери, пробіли, дефіс або апостроф.';
    return '';
  }
  function validateEmail() {
    const value = fields.email.value.trim();
    if (!value) return 'Вкажіть електронну адресу.';
    if (value.length > 254 || !REGEX_EMAIL.test(value)) return 'Введіть коректний email, наприклад name@example.com.';
    return '';
  }
  function validatePhone() {
    const value = fields.phone.value;
    if (!value.trim()) return 'Вкажіть номер телефону.';
    if (REGEX_PHONE.test(value)) return '';
    if (/^0\d{9}$/.test(value)) return 'Використайте міжнародний формат: +38' + value + '.';
    if (/\s/.test(value)) return 'Введіть номер без пробілів: +380XXXXXXXXX.';
    return 'Телефон має бути у форматі +380XXXXXXXXX (+380 і 9 цифр).';
  }
  function validateMessage() {
    const value = fields.message.value.trim();
    if (!value) return 'Напишіть повідомлення.';
    const length = [...value].length;
    if (length < 10) return 'Повідомлення повинно містити щонайменше 10 символів.';
    if (length > 500) return 'Повідомлення не може перевищувати 500 символів.';
    return '';
  }
  function validateAgreement() {
    return fields.agreement.checked ? '' : 'Підтвердіть згоду перед перевіркою форми.';
  }
  const validators = {username:validateName, email:validateEmail, phone:validatePhone, message:validateMessage, agreement:validateAgreement};

  // Рівень відображення: aria-invalid та aria-live для доступності.
  function nodes(id) {
    const field = fields[id];
    return {field, wrapper:field.closest('[data-field]'), error:document.getElementById(id + 'Error'), success:document.getElementById(id + 'Success')};
  }
  function showError(id, message) {
    const {field, wrapper, error, success} = nodes(id);
    wrapper.dataset.state = 'error';
    field.setAttribute('aria-invalid','true');
    error.textContent = message;
    error.hidden = false;
    success.hidden = true;
  }
  function showSuccess(id) {
    const {field, wrapper, error, success} = nodes(id);
    wrapper.dataset.state = 'success';
    field.setAttribute('aria-invalid','false');
    error.textContent = '';
    error.hidden = true;
    success.hidden = false;
  }
  function clearError(id) {
    const {field, wrapper, error, success} = nodes(id);
    delete wrapper.dataset.state;
    field.setAttribute('aria-invalid','false');
    error.textContent = '';
    error.hidden = true;
    success.hidden = true;
  }
  function checkField(id) {
    const message = validators[id]();
    if (message) showError(id, message);
    else showSuccess(id);
    return !message;
  }
  function updateCounter() {
    document.getElementById('messageCount').textContent = String([...fields.message.value].length);
  }

  // Динамічна перевірка: порожня форма не показує помилок до взаємодії.
  for (const id of ids) {
    const field = fields[id];
    const eventName = id === 'agreement' ? 'change' : 'input';
    field.addEventListener(eventName, () => {
      touched.add(id);
      if (id === 'message') updateCounter();
      checkField(id);
      if (status.textContent) status.textContent = '';
    });
    field.addEventListener('blur', () => {
      touched.add(id);
      checkField(id);
    });
  }

  // Submit: навіть за вимкненого браузерного HTML5-валідатора JavaScript
  // блокує некоректні дані. Реального мережевого запиту не виконується.
  form.addEventListener('submit', event => {
    event.preventDefault();
    const invalid = ids.filter(id => { touched.add(id); return !checkField(id); });
    if (invalid.length) {
      status.textContent = 'Перевірте поля з повідомленнями про помилки.';
      fields[invalid[0]].focus();
      return;
    }
    status.textContent = '';
    if (dialog && typeof dialog.showModal === 'function') {
      dialog.showModal(); // native <dialog> утримує фокус та закривається через Esc
      closeButton?.focus();
    } else {
      // Fallback для дуже старих браузерів: інформуємо без удаваного надсилання.
      status.textContent = 'Усі поля пройшли перевірку. Демонстрація: дані не надсилаються.';
    }
    form.reset();
    touched.clear();
    ids.forEach(clearError);
    updateCounter();
  });
  closeButton?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('close', () => form.querySelector('[type="submit"]')?.focus());
  updateCounter();
})();
