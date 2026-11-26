# Зелені стежки Карпат — випускний вебпроєкт

Адаптивний багатосторінковий сайт еко-туризму: каталог шести маршрутів, картки маршрутів, бронювання з клієнтською валідацією, розрахунок вартості, віджет планування бюджету, карусель Swiper і галерея Fancybox.

## Запуск локально

Відкрийте папку у VS Code та запустіть **Live Server** (статичний сервер потрібний для `fetch()` JSON). Або виконайте `python -m http.server 5500` і відкрийте http://localhost:5500/.

## Перевірки

- `node tests/test_lr11_widget.cjs` — 25 модульних сценаріїв віджета та ціни.
- `python tests/check_site.py` — перевірка 11 HTML-сторінок і локальних ресурсів.
- `node --check js/widget.js` (за потреби — всі JS-файли).

## Технології

HTML5, попередньо згенерований Tailwind CSS та власний CSS, Vanilla JavaScript, локальний JSON, Swiper, Fancybox, Google Fonts, YouTube/Maps, GitHub Actions, Vercel.

## Оновлення для самостійної роботи

`about.html` + `css/selfstudy-polish.css`: мікровзаємодії карток і портрета, підтримка `prefers-reduced-motion`; знято пояснювальний підпис під показниками. Додано `sitemap.xml` та Open Graph/canonical метадані.

## Деплой

Workflow `.github/workflows/deploy.yml`: спершу перевірка, далі розгортання в Vercel за умови наявних `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` у GitHub Secrets. Секрети й `.env.local` ніколи не додавайте до репозиторію.

Публічний сайт: https://zelenistezhkykarpat.vercel.app/
GitHub: https://github.com/vasilinkahischak-hue/Zeleni_stezhky_karpat

## Межі функціональності

Фронтенд статичний: без підтвердження сервером не можна вважати бронювання здійсненим; тарифи та доступність гідів вимагають реальної інтеграції з бекендом.
