(async () => {
  const q = new URLSearchParams(location.search);
  const id = q.get('id'), type = q.get('type'), size = q.get('size');
  const def = WIDGETS[type];
  const root = document.getElementById('root');
  document.body.classList.add('size-' + size);
  if (!def) { root.textContent = 'Unknown widget'; return; }

  const data = await api.invoke('data:get', id);
  const ctx = { id, size, get: (k, d) => (data[k] === undefined ? d : data[k]), set: (k, v) => { data[k] = v; api.send('data:set', id, k, v); } };
  def.render(root, ctx);

  // Drag the widget anywhere (skips interactive elements)
  let start = null;
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || e.target.closest('input,textarea,button,select,[data-nodrag]')) return;
    start = { x: e.screenX, y: e.screenY };
    api.send('drag:start', id);
  });
  window.addEventListener('mousemove', (e) => { if (start) api.send('drag:move', id, e.screenX - start.x, e.screenY - start.y); });
  window.addEventListener('mouseup', () => { start = null; });
  window.addEventListener('contextmenu', (e) => { e.preventDefault(); api.send('menu:show', id, def.sizes); });
})();
