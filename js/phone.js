/* Форматування телефонів: видимий код країни, локальний номер, повна нормалізація E.164. */
(() => {
  'use strict';
  const countries = [
    {name:'🇺🇦 Україна',code:'380',min:9,max:9,groups:[2,3,2,2],example:'99 123 45 67'},
    {name:'🇵🇱 Польща',code:'48',min:9,max:9,groups:[3,3,3],example:'123 456 789'},
    {name:'🇨🇿 Чехія',code:'420',min:9,max:9,groups:[3,3,3],example:'777 123 456'},
    {name:'🇸🇰 Словаччина',code:'421',min:9,max:9,groups:[3,3,3],example:'912 345 678'},
    {name:'🇩🇪 Німеччина',code:'49',min:7,max:11,groups:[3,4,4],example:'151 2345 6789'},
    {name:'🇬🇧 Велика Британія',code:'44',min:9,max:10,groups:[4,3,3],example:'7700 900 123'},
    {name:'🇺🇸 США / Канада',code:'1',min:10,max:10,groups:[3,3,4],example:'202 555 0123'}
  ];
  const digits = value => String(value ?? '').replace(/\D/g,'');
  const state = new WeakMap();
  const group = (value, groups) => {
    let start=0; const result=[];
    for(const length of groups){const part=value.slice(start,start+length);if(part)result.push(part);start+=length;}
    if(start<value.length)result.push(value.slice(start));
    return result.join(' ');
  };
  function normalize(raw,country) {
    let value=digits(raw);
    // A pasted full phone number is accepted without duplicating the prefix.
    if(value.startsWith(country.code) && value.length>country.max) value=value.slice(country.code.length);
    if(country.code!=='1' && value.startsWith('0') && value.length>country.max) value=value.slice(1);
    return value.slice(0,country.max);
  }
  function get(input) {
    const s=state.get(input);
    if(!s)return null;
    const national=normalize(input.value,s.country);
    return {country:s.country,national,international:'+'+s.country.code+national};
  }
  function valid(input) {
    const item=get(input);
    if(!item)return false;
    const {country,national,international}=item;
    if(national.length<country.min || national.length>country.max || !/^\+[1-9]\d{7,14}$/.test(international))return false;
    if(country.code==='380' && !/^[1-9]\d{8}$/.test(national))return false;
    if(country.code==='1' && !/^[2-9]\d{2}[2-9]\d{6}$/.test(national))return false;
    return true;
  }
  function init(input) {
    if(state.has(input))return;
    const wrap=document.createElement('div');wrap.className='zsk-phone-control';
    const select=document.createElement('select');select.className='zsk-phone-country';
    select.setAttribute('aria-label','Код країни для номера телефону');
    select.setAttribute('title','Виберіть країну');
    select.name='phone-country';
    countries.forEach(c=>{
      const option=document.createElement('option');option.value=c.code;
      option.textContent=`${c.name} +${c.code}`;select.append(option);
    });
    const label=input.closest('[data-field]')?.querySelector('label[for="phone"]') || input.closest('div')?.parentNode?.querySelector('label[for="phone"]');
    if(label)wrap.setAttribute('role','group');
    input.parentNode.insertBefore(wrap,input);wrap.append(select,input);
    input.autocomplete='tel-national';input.inputMode='tel';input.spellcheck=false;
    state.set(input,{country:countries[0]});
    const hint=document.getElementById('phoneHint');
    function update() {
      const c=state.get(input).country;
      const cursor=input.selectionStart ?? input.value.length;
      const digitsBefore=digits(input.value.slice(0,cursor)).length;
      const national=normalize(input.value,c);
      input.value=group(national,c.groups);
      input.placeholder=c.example;
      input.maxLength=c.max+c.groups.length;
      if(hint && hint.closest('form')===input.closest('form'))hint.textContent=`Код +${c.code} обрано автоматично. Введіть ${c.min===c.max?c.min:`${c.min}–${c.max}`} цифр без коду.`;
      // Keep caret near its original digit when editing in the middle of a formatted number.
      let pos=0, seen=0;
      while(pos<input.value.length && seen<digitsBefore){if(/\d/.test(input.value[pos]))seen++;pos++;}
      try{input.setSelectionRange(pos,pos)}catch(_){}
    }
    select.addEventListener('change',()=>{
      state.get(input).country=countries.find(c=>c.code===select.value)||countries[0];
      input.value='';update();input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    input.addEventListener('input',update);
    input.addEventListener('paste',e=>{
      const text=e.clipboardData?.getData('text'); if(!text)return;
      const c=state.get(input).country;
      const clean=normalize(text,c);
      e.preventDefault();input.value=clean;update();input.dispatchEvent(new Event('input',{bubbles:true}));
    });
    update();
  }
  window.ZSKPhone=Object.freeze({get,valid,format:group,countries});
  document.querySelectorAll('input[type="tel"]').forEach(init);
})();
