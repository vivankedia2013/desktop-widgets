const gallery = document.getElementById('gallery'), active = document.getElementById('active'), login = document.getElementById('login');
Object.entries(WIDGETS).forEach(([type, w]) => {
  const c = document.createElement('div'); c.className = 'card';
  c.innerHTML = `<div class="ic">${w.icon}</div><b>${w.name}</b><select>${w.sizes.map((s) => `<option value="${s}">${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select><button class="add">Add to desktop</button>`;
  c.querySelector('button').onclick = () => api.invoke('widgets:add', type, c.querySelector('select').value);
  gallery.appendChild(c);
});
async function refresh() {
  const list = await api.invoke('widgets:list');
  active.innerHTML = list.length ? '' : '<p>No widgets yet. Pick one above to get started.</p>';
  list.forEach((w) => {
    const r = document.createElement('div'); r.className = 'act';
    r.innerHTML = `<span>${WIDGETS[w.type]?.icon || ''} ${WIDGETS[w.type]?.name || w.type} <span style="color:var(--sub)">(${w.size})</span></span><button>Remove</button>`;
    r.querySelector('button').onclick = () => api.invoke('widgets:remove', w.id);
    active.appendChild(r);
  });
}
api.on('widgets:changed', refresh); refresh();
api.invoke('settings:get').then((s) => { login.checked = !!s.launchAtLogin; });
login.onchange = () => api.invoke('settings:set', 'launchAtLogin', login.checked);
