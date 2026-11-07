// Widget registry. To add a new widget: add an entry here with name, icon, sizes and render(el, ctx).
const pad = (n) => String(n).padStart(2, '0');
const WIDGETS = {
  clock: { name: 'Digital Clock', icon: '🕐', sizes: ['small', 'medium'], render(el) {
    el.innerHTML = '<div class="center"><div class="time"><span id="hm"></span><span class="sec" id="s"></span></div><div class="sub" id="d"></div></div>';
    const hm = el.querySelector('#hm'), s = el.querySelector('#s'), d = el.querySelector('#d');
    const tick = () => { const t = new Date(); hm.textContent = pad(t.getHours()) + ':' + pad(t.getMinutes()); s.textContent = ':' + pad(t.getSeconds());
      d.textContent = t.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); };
    tick(); setInterval(tick, 250);
  } },
  analog: { name: 'Analog Clock', icon: '🕰️', sizes: ['small', 'medium'], render(el) {
    let ticks = '';
    for (let i = 0; i < 60; i++) ticks += `<line x1="50" y1="4" x2="50" y2="${i % 5 ? 6 : 9}" transform="rotate(${i * 6} 50 50)" stroke="currentColor" stroke-width="${i % 5 ? .5 : 1.4}" opacity="${i % 5 ? .4 : .9}"/>`;
    el.innerHTML = `<div class="center"><svg viewBox="0 0 100 100" style="height:100%;max-width:100%">${ticks}
      <line id="h" x1="50" y1="50" x2="50" y2="28" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
      <line id="m" x1="50" y1="50" x2="50" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <line id="s" x1="50" y1="58" x2="50" y2="12" stroke="#ff9f0a" stroke-width="1"/><circle cx="50" cy="50" r="2.4" fill="#ff9f0a"/></svg></div>`;
    const H = el.querySelector('#h'), M = el.querySelector('#m'), S = el.querySelector('#s');
    const f = () => { const t = new Date(), sec = t.getSeconds() + t.getMilliseconds() / 1000, min = t.getMinutes() + sec / 60, hr = (t.getHours() % 12) + min / 60;
      S.setAttribute('transform', `rotate(${sec * 6} 50 50)`); M.setAttribute('transform', `rotate(${min * 6} 50 50)`); H.setAttribute('transform', `rotate(${hr * 30} 50 50)`); requestAnimationFrame(f); };
    f();
  } },
  date: { name: 'Date', icon: '📅', sizes: ['small'], render(el) {
    const t = new Date();
    el.innerHTML = `<div class="center" style="justify-content:flex-start;align-items:flex-start;text-align:left"><div class="label">${t.toLocaleDateString(undefined, { weekday: 'long' })}</div>
      <div class="big" style="font-size:64px;margin-top:6px">${t.getDate()}</div><div class="sub">${t.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div></div>`;
  } },
  calendar: { name: 'Month Calendar', icon: '🗓️', sizes: ['large'], render(el) {
    const t = new Date(), y = t.getFullYear(), m = t.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    let cells = ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<div class="dow">${d}</div>`).join('') + '<div></div>'.repeat(first);
    for (let d = 1; d <= days; d++) cells += `<div class="${d === t.getDate() ? 'today' : ''}" style="padding:6px 0">${d}</div>`;
    el.innerHTML = `<div class="label" style="font-size:15px;margin-bottom:8px">${t.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</div><div class="grid7">${cells}</div>`;
  } },
  weather: { name: 'Weather', icon: '⛅', sizes: ['small', 'medium'], render(el, c) {
    const icon = (k) => (k === 0 ? '☀️' : k < 3 ? '🌤️' : k === 3 ? '☁️' : k < 50 ? '🌫️' : k < 60 ? '🌦️' : k < 70 ? '🌧️' : k < 80 ? '🌨️' : k < 90 ? '🌧️' : '⛈️');
    const ask = () => {
      el.innerHTML = '<div class="center"><div class="sub">Enter a city</div><input class="inp" id="c" placeholder="e.g. Indore"><button class="btn" id="go">Show weather</button></div>';
      el.querySelector('#go').onclick = () => { const v = el.querySelector('#c').value.trim(); if (v) { c.set('city', v); c.set('loc', null); load(); } };
    };
    const load = async () => {
      const city = c.get('city'); if (!city) return ask();
      try {
        let loc = c.get('loc');
        if (!loc) { const g = await (await fetch('https://geocoding-api.open-meteo.com/v1/search?count=1&name=' + encodeURIComponent(city))).json();
          if (!g.results) throw new Error('City not found'); loc = { lat: g.results[0].latitude, lon: g.results[0].longitude }; c.set('loc', loc); }
        const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto`)).json();
        el.innerHTML = `<div class="center" style="align-items:flex-start;text-align:left"><div class="row" style="width:100%"><b>${city}</b><button class="btn" id="ch" style="padding:2px 8px">✎</button></div>
          <div class="big">${Math.round(w.current.temperature_2m)}°</div><div style="font-size:22px">${icon(w.current.weather_code)}</div>
          <div class="sub">H ${Math.round(w.daily.temperature_2m_max[0])}° · L ${Math.round(w.daily.temperature_2m_min[0])}°</div></div>`;
        el.querySelector('#ch').onclick = () => { c.set('city', ''); ask(); };
      } catch (e) { el.innerHTML = `<div class="center"><div class="sub">Couldn’t load weather. Check the city name and your connection.</div><button class="btn" id="r">Change city</button></div>`; el.querySelector('#r').onclick = () => { c.set('city', ''); ask(); }; }
    };
    load(); setInterval(load, 15 * 60 * 1000);
  } },
  notes: { name: 'Notes', icon: '📝', sizes: ['small', 'medium', 'large'], render(el, c) {
    el.innerHTML = '<textarea placeholder="Write a note…"></textarea>';
    const t = el.querySelector('textarea'); t.value = c.get('text', ''); t.oninput = () => c.set('text', t.value);
  } },
  todo: { name: 'To-Do List', icon: '✅', sizes: ['medium', 'large'], render(el, c) {
    el.innerHTML = '<input class="inp" id="n" placeholder="Add a task and press Enter"><div id="l" style="margin-top:8px;overflow:auto;height:calc(100% - 40px)"></div>';
    const list = el.querySelector('#l'); let items = c.get('items', []);
    const draw = () => { list.innerHTML = ''; items.forEach((it, i) => { const r = document.createElement('div'); r.className = 'todo' + (it.done ? ' done' : '');
      r.innerHTML = `<input type="checkbox" ${it.done ? 'checked' : ''}><span style="flex:1">${it.text.replace(/</g, '&lt;')}</span><button class="btn" style="padding:0 7px">×</button>`;
      r.querySelector('input').onchange = (e) => { it.done = e.target.checked; c.set('items', items); draw(); };
      r.querySelector('button').onclick = () => { items.splice(i, 1); c.set('items', items); draw(); }; list.appendChild(r); }); };
    el.querySelector('#n').onkeydown = (e) => { if (e.key === 'Enter' && e.target.value.trim()) { items.push({ text: e.target.value.trim(), done: false }); e.target.value = ''; c.set('items', items); draw(); } };
    draw();
  } },
  stopwatch: { name: 'Stopwatch', icon: '⏱️', sizes: ['small', 'medium'], render(el) {
    let run = false, base = 0, t0 = 0;
    el.innerHTML = '<div class="center"><div class="time" id="t" style="font-size:30px">00:00.00</div><div class="row"><button class="btn go" id="a">Start</button><button class="btn" id="r">Reset</button></div></div>';
    const t = el.querySelector('#t'), a = el.querySelector('#a');
    const fmt = (ms) => `${pad(Math.floor(ms / 60000))}:${pad(Math.floor(ms / 1000) % 60)}.${pad(Math.floor(ms / 10) % 100)}`;
    setInterval(() => { if (run) t.textContent = fmt(base + Date.now() - t0); }, 40);
    a.onclick = () => { if (run) { base += Date.now() - t0; run = false; a.textContent = 'Start'; a.className = 'btn go'; } else { t0 = Date.now(); run = true; a.textContent = 'Stop'; a.className = 'btn stop'; } };
    el.querySelector('#r').onclick = () => { run = false; base = 0; t.textContent = fmt(0); a.textContent = 'Start'; a.className = 'btn go'; };
  } },
  timer: { name: 'Timer', icon: '⏳', sizes: ['small', 'medium'], render(el) {
    let end = 0;
    el.innerHTML = '<div class="center"><div class="time" id="t" style="font-size:32px">05:00</div><input class="inp" id="m" type="number" min="1" value="5" style="width:80px;text-align:center"><button class="btn go" id="a">Start</button></div>';
    const t = el.querySelector('#t'), a = el.querySelector('#a'), m = el.querySelector('#m');
    setInterval(() => { if (!end) return; const left = Math.max(0, end - Date.now()); t.textContent = `${pad(Math.floor(left / 60000))}:${pad(Math.floor(left / 1000) % 60)}`;
      if (!left) { end = 0; a.textContent = 'Start'; a.className = 'btn go'; try { new Notification('Timer finished'); } catch (_) {} } }, 250);
    a.onclick = () => { if (end) { end = 0; a.textContent = 'Start'; a.className = 'btn go'; } else { end = Date.now() + (+m.value || 1) * 60000; a.textContent = 'Cancel'; a.className = 'btn stop'; } };
  } },
  battery: { name: 'Battery', icon: '🔋', sizes: ['small'], render(el) {
    el.innerHTML = '<div class="center"><div class="big" id="p">–</div><div class="bar" style="width:100%"><i id="b" style="width:0"></i></div><div class="sub" id="s"></div></div>';
    if (!navigator.getBattery) { el.querySelector('#s').textContent = 'No battery found'; return; }
    navigator.getBattery().then((b) => { const u = () => { const p = Math.round(b.level * 100); el.querySelector('#p').textContent = p + '%'; el.querySelector('#b').style.width = p + '%';
      el.querySelector('#b').style.background = b.charging ? 'var(--green)' : p < 20 ? 'var(--red)' : 'var(--blue)'; el.querySelector('#s').textContent = b.charging ? 'Charging' : 'On battery'; };
      u(); b.onlevelchange = b.onchargingchange = u; });
  } },
  system: { name: 'CPU & Memory', icon: '📈', sizes: ['small', 'medium'], render(el) {
    el.innerHTML = '<div class="center" style="align-items:stretch;text-align:left;gap:8px"><div class="row"><b>CPU</b><span id="c">–</span></div><div class="bar"><i id="cb"></i></div><div class="row"><b>Memory</b><span id="m">–</span></div><div class="bar"><i id="mb" style="background:var(--green)"></i></div></div>';
    const u = async () => { const s = await api.invoke('sys:stats'), mp = Math.round(100 * s.memUsed / s.memTotal);
      el.querySelector('#c').textContent = s.cpu + '%'; el.querySelector('#cb').style.width = s.cpu + '%'; el.querySelector('#m').textContent = mp + '%'; el.querySelector('#mb').style.width = mp + '%'; };
    u(); setInterval(u, 2000);
  } },
  worldclock: { name: 'World Clock', icon: '🌍', sizes: ['medium', 'large'], render(el, c) {
    const zones = c.get('zones', [['Local', undefined], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Tokyo', 'Asia/Tokyo']]);
    el.innerHTML = '<div id="l"></div>'; const l = el.querySelector('#l');
    const u = () => { l.innerHTML = zones.map(([n, z]) => `<div class="row" style="padding:5px 0;border-bottom:.5px solid var(--line)"><span>${n}</span><b style="font-weight:300;font-size:18px">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: z })}</b></div>`).join(''); };
    u(); setInterval(u, 500);
  } },
  countdown: { name: 'Countdown', icon: '🎯', sizes: ['small', 'medium'], render(el, c) {
    const draw = () => { const d = c.get('date'), title = c.get('title', 'Event');
      if (!d) { el.innerHTML = '<div class="center"><input class="inp" id="t" placeholder="Event name"><input class="inp" id="d" type="date"><button class="btn" id="s">Start</button></div>';
        el.querySelector('#s').onclick = () => { const v = el.querySelector('#d').value; if (v) { c.set('date', v); c.set('title', el.querySelector('#t').value || 'Event'); draw(); } }; return; }
      const days = Math.ceil((new Date(d + 'T00:00:00') - new Date()) / 86400000);
      el.innerHTML = `<div class="center"><div class="big">${Math.abs(days)}</div><div class="sub">${days >= 0 ? 'days until' : 'days since'} ${title.replace(/</g, '&lt;')}</div><button class="btn" id="x" style="padding:2px 10px">Change</button></div>`;
      el.querySelector('#x').onclick = () => { c.set('date', ''); draw(); }; };
    draw();
  } },
  calculator: { name: 'Calculator', icon: '🧮', sizes: ['large'], render(el) {
    const keys = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '0', '.', '='];
    el.innerHTML = '<div class="disp" id="d">0</div><div class="calc">' + keys.map((k) => `<button class="${'÷×−+='.includes(k) ? 'op' : ''} ${k === '0' ? 'z' : ''}">${k}</button>`).join('') + '</div>';
    let cur = '0', prev = null, op = null, fresh = true; const d = el.querySelector('#d');
    const calc = (a, o, b) => (o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : b === 0 ? 0 : a / b);
    el.querySelectorAll('button').forEach((b) => b.onclick = () => { const k = b.textContent;
      if (/^\d$/.test(k)) { cur = fresh || cur === '0' ? k : cur + k; fresh = false; }
      else if (k === '.') { if (fresh) { cur = '0.'; fresh = false; } else if (!cur.includes('.')) cur += '.'; }
      else if (k === 'AC') { cur = '0'; prev = null; op = null; fresh = true; }
      else if (k === '±') cur = String(-parseFloat(cur));
      else if (k === '%') cur = String(parseFloat(cur) / 100);
      else { const v = parseFloat(cur); if (op && !fresh) { prev = calc(prev, op, v); cur = String(+prev.toFixed(10)); } else prev = v; op = k === '=' ? null : k; fresh = true; }
      d.textContent = cur; });
  } },
  quote: { name: 'Daily Quote', icon: '💬', sizes: ['small', 'medium'], render(el) {
    const q = ['Small steps still move you forward.', 'Done is better than perfect.', 'Start where you are.', 'Focus on one thing at a time.', 'Rest is part of the work.', 'Make it work, then make it better.', 'Curiosity beats certainty.'];
    el.innerHTML = `<div class="center"><div style="font-size:16px;font-weight:600;line-height:1.3">${q[Math.floor(Date.now() / 86400000) % q.length]}</div></div>`;
  } }
};
