/* Зелені стежки Карпат — ЛР №7. Лише необхідні інтерактивні дії, без бібліотек. */
(() => {
  'use strict';
  const routes = window.ZSK_ROUTES || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const formatPrice = (num) => `${new Intl.NumberFormat('uk-UA').format(num)} грн`;
  const integer = (v, fallback, lo = 1, hi = 10) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
  };
  const isoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '') ? value : '';
  const readableDate = (value) => {
    if (!isoDate(value)) return 'Дату ще не вибрано';
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('uk-UA', {day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,day)));
  };
  const rate = {'tent':150,'sleeping-bag':100,'poles':50};
  const extrasName = {'tent':'Намет','sleeping-bag':'Спальник','poles':'Трекінгові палиці'};
  const transferCosts = {own:0,ivano:300,lviv:600};
  const transferNames = {own:'Власний транспорт',ivano:'Трансфер з Івано-Франківська',lviv:'Трансфер зі Львова'};
  function calculate(selection) {
    const r=routes[selection.route] || routes['pip-ivan'];
    const guests=integer(selection.guests,2), days=integer(selection.days,r.days,1,5);
    const extras=(selection.extras || []).filter(e=>Object.prototype.hasOwnProperty.call(rate,e));
    const gear=extras.reduce((sum,k)=>sum+rate[k]*days,0);
    const transfer=transferCosts[selection.transfer] ?? 0;
    return {r,guests,days,gear,transfer,base:r.price*guests,total:r.price*guests+gear+transfer,extras};
  }
  // Каталог: пошук, чекбокси, сортування, перегляд карти.
  const filters=$('#filters-form');
  const grid=$('#route-cards');
  if (filters && grid) {
    const cards=$$('article[data-route]',grid);
    const search=$('#route-search'),sort=$('#sort'),count=$('#route-count');
    const levels={Легкий:1,Середній:2,Складний:3};
    function updateCatalog() {
      const keyword=(search?.value||'').trim().toLocaleLowerCase('uk-UA');
      const picked=name=>$$(`input[name="${name}"]:checked`,filters).map(el=>el.value);
      const chosenLevels=picked('level'),chosenTypes=picked('type');
      const duration=picked('duration')[0],eco=Number(picked('eco')[0]||0);
      let visible=0;
      for(const card of cards) {
        const days=Number(card.dataset.days);
        const matches=(!keyword || card.dataset.search.includes(keyword)) &&
          (!chosenLevels.length || chosenLevels.includes(card.dataset.level)) &&
          (!chosenTypes.length || chosenTypes.some(t=>t==='Одноденний' ? days===1 : t===card.dataset.type)) &&
          (!duration || (duration==='1' ? days===1 : duration==='2-3' ? days>=2 && days<=3 : days>=4)) &&
          Number(card.dataset.eco)>=eco;
        card.classList.toggle('hidden',!matches);
        if(matches)visible++;
      }
      const mode=sort?.value||'popular';
      const sorted=[...cards].sort((a,b)=> {
        if(mode==='price')return Number(a.dataset.price)-Number(b.dataset.price);
        if(mode==='level')return levels[a.dataset.level]-levels[b.dataset.level];
        if(mode==='duration')return Number(a.dataset.days)-Number(b.dataset.days);
        return cards.indexOf(a)-cards.indexOf(b);
      });
      sorted.forEach(el=>grid.appendChild(el));
      if(count)count.textContent=`Показано ${visible} із ${cards.length} маршрутів`;
    }
    search?.addEventListener('input',updateCatalog);
    filters.addEventListener('change',updateCatalog);
    filters.addEventListener('reset',()=>setTimeout(updateCatalog,0));
    sort?.addEventListener('change',updateCatalog);
    $$('[data-sort]').forEach(button=>button.addEventListener('click',()=>{sort.value=button.dataset.sort;updateCatalog();}));
    const map=$('#routes-map');
    $$('[data-view]').forEach(button=>button.addEventListener('click',()=>{
      const isMap=button.dataset.view==='map';
      grid.classList.toggle('hidden',isMap);
      map?.classList.toggle('hidden',!isMap);
      $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    }));
    updateCatalog();
  }
  // Сторінки маршруту: живий підсумок і передавання вибору до форми.
  const detail=$('aside[data-route][data-price]');
  if(detail) {
    const stepper=$('[data-guest-stepper]',detail),r=routes[detail.dataset.route];
    if(stepper && r) {
      let guests=2;
      const buttons=$$('button',stepper),output=$('output',stepper);
      const link=$('a[href^="booking.html"]',detail);
      const date=$('select',detail);
      const update=()=>{
        output.textContent=`${guests} учасн.`;
        $('#route-subtotal-label',detail).textContent=`${formatPrice(r.price)} × ${guests} учасн.`;
        $('#route-subtotal',detail).textContent=formatPrice(r.price*guests);
        $('#route-grand-total',detail).textContent=formatPrice(r.price*guests);
        const qs=new URLSearchParams({route:detail.dataset.route,guests:String(guests)});
        if(isoDate(date?.value))qs.set('date',date.value);
        link.href=`booking.html?${qs.toString()}`;
        buttons[0].disabled=guests<=1;
        buttons[1].disabled=guests>=10;
      };
      buttons[0].addEventListener('click',()=>{guests=Math.max(1,guests-1);update();});
      buttons[1].addEventListener('click',()=>{guests=Math.min(10,guests+1);update();});
      date?.addEventListener('change',update);update();
    }
  }
  // Бронювання: попередня ціна; персональні поля не передаються у URL.
  const booking=$('#booking-form');
  if(booking) {
    const routeInputs=$$('input[name="route"]',booking);
    const params=new URLSearchParams(location.search);
    const requested=params.get('route');
    if(routes[requested])routeInputs.find(input=>input.value===requested).checked=true;
    const date=$('#date',booking),guests=$('#guests',booking);
    if(isoDate(params.get('date')))date.value=params.get('date');
    guests.value=String(integer(params.get('guests'),2));
    // HTML min is a fallback for JS-off; JS makes it relative to the current day.
    const now=new Date();
    const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    date.min=today;
    if(!isoDate(date.value) || date.value<today)date.value=today;
    const getSelection=()=>({
      route: $('input[name="route"]:checked',booking)?.value || 'pip-ivan',
      date:date.value,
      guests:guests.value,
      days:$('input[name="days"]:checked',booking)?.value,
      extras:$$('input[name="extras"]:checked',booking).map(e=>e.value),
      transfer:$('input[name="transfer"]:checked',booking)?.value||'own'
    });
    const render=()=>{
      const selection=getSelection(),quote=calculate(selection);
      $('#summary-image').src=quote.r.image;
      $('#summary-route').textContent=quote.r.name;
      $('#summary-details').textContent=`${readableDate(selection.date)} · ${quote.days} дн. · ${quote.guests} учасн.`;
      $('#quote-base-label').textContent=`Базова програма (${quote.guests} учасн.)`;
      $('#quote-base-value').textContent=formatPrice(quote.base);
      $('#quote-gear-value').textContent=`+${formatPrice(quote.gear)}`;
      $('#quote-transfer-label').textContent=transferNames[selection.transfer]||'Трансфер';
      $('#quote-transfer-value').textContent=`+${formatPrice(quote.transfer)}`;
      $('#quote-total').textContent=formatPrice(quote.total);
      $('#quote-footnote').textContent=`Орієнтовно за ${quote.guests} учасн.`;
      $('#quote-note').textContent=quote.days===quote.r.days ?
        'Вартість орієнтовна для стандартної програми; фактичну доступність і ціну підтверджує організатор.' :
        `Обрано ${quote.days} дн., а стандартний тур триває ${quote.r.days} дн. Підсумок розраховано за базовим туром, зміну програми треба погодити.`;
    };
    function updateDurationFromRoute() {
      const r=routes[getSelection().route];
      const input=$(`#days-${r.days}`,booking);
      if(input) input.checked=true;
      render();
    }
    routeInputs.forEach(el=>el.addEventListener('change',updateDurationFromRoute));
    booking.addEventListener('change',render);
    guests.addEventListener('input',render);date.addEventListener('input',render);
    updateDurationFromRoute();
    booking.addEventListener('submit',e=>{
      if(!booking.checkValidity())return;
      e.preventDefault();
      const s=getSelection(),qs=new URLSearchParams({route:s.route,date:s.date,guests:String(integer(s.guests,2)),days:String(s.days),transfer:s.transfer});
      s.extras.forEach(extra=>qs.append('extras',extra));
      location.href=`booking_confirmed.html?${qs.toString()}`;
    });
  }
  // Підсумок демонстрації: відображає фактичний вибір, без неправдивих заяв про оплату.
  if($('#confirmation-route')) {
    const qs=new URLSearchParams(location.search);
    const s={route:qs.get('route')||'pip-ivan',date:isoDate(qs.get('date'))||'',guests:qs.get('guests'),days:qs.get('days'),transfer:qs.get('transfer')||'own',extras:qs.getAll('extras')};
    const quote=calculate(s);
    $('#confirmation-route').textContent=quote.r.name;
    $('#confirmation-image').src=quote.r.image;
    $('#confirmation-image').alt=quote.r.name;
    $('#confirmation-date').textContent=`${readableDate(s.date)} · ${quote.days} дн.`;
    $('#confirmation-guests').textContent=`${quote.guests} учасн.`;
    $('#confirmation-total').textContent=formatPrice(quote.total);
    const eco=$('#confirmation-eco');if(eco)eco.textContent=`Eco-Impact ${quote.r.eco}/10`;
    const extraList=$('#confirmation-extras');
    if(extraList) {
      extraList.replaceChildren();
      const items=quote.extras.map(e=>`${extrasName[e]} — ${formatPrice(rate[e]*quote.days)}`);
      if(s.transfer && s.transfer!=='own')items.push(`${transferNames[s.transfer]} — ${formatPrice(quote.transfer)}`);
      if(!items.length)items.push('Без додаткових послуг');
      for(const label of items){const li=document.createElement('li');li.textContent=label;extraList.appendChild(li);}
    }
    $('[data-action="print"]')?.addEventListener('click',()=>window.print());
    $('[data-action="calendar"]')?.addEventListener('click',()=>{
      if(!isoDate(s.date))return alert('Спочатку оберіть дату у формі розрахунку.');
      const start=s.date.replaceAll('-','');
      const endDate=new Date(`${s.date}T12:00:00Z`);endDate.setUTCDate(endDate.getUTCDate()+quote.days);
      const end=`${endDate.getUTCFullYear()}${String(endDate.getUTCMonth()+1).padStart(2,'0')}${String(endDate.getUTCDate()).padStart(2,'0')}`;
      const escapeText=v=>v.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;');
      const event=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Zeleni Stezhky//Demo//UK','BEGIN:VEVENT',`UID:demo-${start}-${s.route}@carpathiantrails.invalid`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${start}`,`DTEND;VALUE=DATE:${end}`,`SUMMARY:${escapeText(quote.r.name)} (план, не бронювання)`,'DESCRIPTION:Навчальна демонстрація. Уточніть маршрут у організатора.','END:VEVENT','END:VCALENDAR'].join('\r\n');
      const blob=new Blob([event],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='carpathian-hike-plan.ics';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
  }
})();
