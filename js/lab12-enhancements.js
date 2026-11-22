/* Lab 12: progressive enhancements without replacing original form logic. */
(() => {
  'use strict';
  const countries = [
    {label:'🇺🇦 Україна +380',code:'380',digits:9,group:[2,3,2,2]},
    {label:'🇵🇱 Польща +48',code:'48',digits:9,group:[3,3,3]},
    {label:'🇩🇪 Німеччина +49',code:'49',digits:11,group:[3,4,4]},
    {label:'🇬🇧 Велика Британія +44',code:'44',digits:10,group:[4,3,3]},
    {label:'🇺🇸 США / Канада +1',code:'1',digits:10,group:[3,3,4]}
  ];
  const numbers = (str) => String(str || '').replace(/\D/g, '');
  function chunk(str, groups) {
    let start=0;
    return groups.map(n => {const s=str.slice(start,start+n);start+=n;return s;}).filter(Boolean).join(' ');
  }
  function setupPhone(input) {
    const parent=input.parentElement;
    if(!parent || parent.querySelector('.zsk-country-select')) return;
    const row=document.createElement('div');row.className='zsk-phone-row';
    const select=document.createElement('select');select.className='zsk-country-select';
    select.setAttribute('aria-label','Код країни');
    countries.forEach((c,i) => {const opt=document.createElement('option'); opt.value=String(i);opt.textContent=c.label;select.append(opt);});
    parent.insertBefore(row,input);row.append(select,input);
    input.autocomplete='tel-national';input.inputMode='numeric';
    let current=countries[0];
    function domestic() {let d=numbers(input.value);if(d.startsWith(current.code))d=d.slice(current.code.length);if(current.code==='380' && d.startsWith('0') && d.length===10)d=d.slice(1);return d.slice(0,current.digits);}
    function display() {input.value=chunk(domestic(),current.group);input.placeholder=chunk('99123456789'.slice(0,current.digits),current.group);}
    function canonical() {return '+'+current.code+domestic();}
    function validity() {
      const d=domestic();
      const ukOk=current.code!=='380'|| /^[1-9]\d{8}$/.test(d);
      const ok=d.length===current.digits && ukOk;
      input.setCustomValidity(!d.length?'Введіть номер телефону':(ok?'':'Перевірте довжину номера для обраної країни'));
      return ok;
    }
    select.addEventListener('change',()=> {current=countries[Number(select.value)];input.value='';display();validity();});
    input.addEventListener('input',()=>{display();validity();});
    input.addEventListener('blur',()=>{display();validity();});
    const form=input.closest('form');
    if(form){form.addEventListener('submit', event => {
      if(!validity()) {event.preventDefault();input.reportValidity();input.focus();return;}
      // Convert to canonical E.164 for original validation and GET form transmission.
      input.value=canonical();
      // The site's legacy validation.js may still enforce Ukraine-only numbers.
    },true);}
    display();input.setCustomValidity('');
  }
  const routePrices={ 'pip-ivan':{price:2400,days:3}, nesamovute:{price:1800,days:1},dovbush:{price:1300,days:1}, synevyr:{price:1600,days:1},bordzava:{price:2100,days:2},hoverla:{price:1900,days:1}};
  // Single, testable pricing rule for integration into original site.js/widget.js.
  window.ZSKLab12=Object.freeze({
    extraDayPrice(routeKey, selectedDays, participants=1) {
      const route=routePrices[routeKey];if(!route)return 0;
      const days=Math.max(0,Number(selectedDays)-route.days);
      return Math.round(days*(route.price/route.days)*Math.max(1,Number(participants)));
    }
  });
  function setupTent() {
    const form=document.querySelector('#booking-form');
    const rent=document.querySelector('#extra-tent');
    if(!form||!rent)return;
    const firstDay=document.querySelector('[name="days"]:checked');
    const tentChoice=document.createElement('fieldset');tentChoice.className='zsk-tent-choice';
    tentChoice.innerHTML='<legend class="text-sm font-semibold">Намет для продовженого походу</legend><label><input type="radio" name="tent-source" value="own"> Маю власний намет</label><label><input type="radio" name="tent-source" value="rental"> Орендую намет</label><p class="text-xs text-secondary">При збільшенні тривалості понад стандартну наявність намету потрібно підтвердити.</p>';
    rent.closest('.rounded-xl')?.append(tentChoice);
    const radios=[...tentChoice.querySelectorAll('input')];
    function route(){return document.querySelector('[name="route"]:checked')?.value||'pip-ivan';}
    function duration(){return Number(document.querySelector('[name="days"]:checked')?.value||firstDay?.value||3);}
    function check() {
      const original=routePrices[route()]?.days||3;
      const extra=duration()>original;
      tentChoice.hidden=!extra;
      radios.forEach(r=>r.required=extra);
      return !extra||radios.some(r=>r.checked);
    }
    form.addEventListener('change',event => {
      if(event.target.matches('[name="days"], [name="route"]'))check();
      if(event.target.matches('[name="tent-source"]')){
        if(event.target.value==='rental'&&!rent.checked){rent.click();}
        if(event.target.value==='own'&&rent.checked){rent.click();}
      }
    });
    form.addEventListener('submit',event => {
      if(!check()){
        event.preventDefault();
        tentChoice.hidden=false;
        radios[0].focus();
        radios[0].reportValidity();
      }
    },true);
    check();
  }
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('input[type="tel"]').forEach(setupPhone);
    setupTent();
  });
})();
