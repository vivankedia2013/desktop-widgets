const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const store = require('./store');

const SIZES = { small: [158, 158], medium: [338, 158], large: [338, 354] }; // same as macOS widgets
const wins = new Map();   // id -> BrowserWindow
const drags = new Map();  // id -> start position
let manager = null;
let tray = null;

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', showManager);
app.on('window-all-closed', () => {}); // keep running in tray / menu bar

const find = (id) => store.get().widgets.find((w) => w.id === id);

function visiblePosition(w) {
  const [width, height] = SIZES[w.size] || SIZES.small;
  if (typeof w.x === 'number' && typeof w.y === 'number') {
    const d = screen.getDisplayMatching({ x: w.x, y: w.y, width, height });
    const b = d.workArea;
    const onScreen = w.x + 40 > b.x && w.x < b.x + b.width - 40 && w.y + 40 > b.y && w.y < b.y + b.height - 40;
    if (onScreen) return { x: w.x, y: w.y };
  }
  const b = screen.getPrimaryDisplay().workArea;
  const n = wins.size;
  return { x: b.x + 80 + (n % 8) * 36, y: b.y + 80 + (n % 8) * 36 };
}

function loadWidget(win, w) {
  win.loadFile(path.join(__dirname, 'renderer', 'widget.html'), { query: { id: w.id, type: w.type, size: w.size } });
}

function createWidget(w) {
  const [width, height] = SIZES[w.size] || SIZES.small;
  const pos = visiblePosition(w);
  w.x = pos.x; w.y = pos.y;
  const win = new BrowserWindow({
    ...pos, width, height, frame: false, transparent: true, hasShadow: false, resizable: false,
    maximizable: false, minimizable: false, fullscreenable: false, skipTaskbar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });
  win.once('ready-to-show', () => win.showInactive());
  win.on('move', () => {
    const [x, y] = win.getPosition();
    w.x = x; w.y = y;
    store.save();
  });
  win.on('closed', () => wins.delete(w.id));
  loadWidget(win, w);
  wins.set(w.id, win);
  return win;
}

function addWidget(type, size) {
  const w = { id: crypto.randomUUID(), type, size: size || 'small', data: {} };
  store.get().widgets.push(w);
  createWidget(w);
  store.save();
  notifyManager();
  return w.id;
}

function removeWidget(id) {
  const s = store.get();
  s.widgets = s.widgets.filter((w) => w.id !== id);
  wins.get(id)?.destroy();
  wins.delete(id);
  store.save();
  notifyManager();
}

function resizeWidget(id, size) {
  const w = find(id); const win = wins.get(id);
  if (!w || !win) return;
  w.size = size;
  const [width, height] = SIZES[size];
  win.setBounds({ x: w.x, y: w.y, width, height });
  loadWidget(win, w);
  store.save();
  notifyManager();
}

function notifyManager() { manager?.webContents.send('widgets:changed'); }

function showManager() {
  if (manager && !manager.isDestroyed()) { manager.show(); manager.focus(); return; }
  manager = new BrowserWindow({
    width: 860, height: 640, minWidth: 640, minHeight: 480, title: 'Desktop Widgets',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  manager.setMenuBarVisibility(false);
  manager.loadFile(path.join(__dirname, 'renderer', 'manager.html'));
  manager.on('closed', () => { manager = null; });
}

function applyLaunchAtLogin() {
  if (!app.isPackaged) return; // only register the installed app, not the dev Electron binary
  app.setLoginItemSettings({ openAtLogin: !!store.get().settings.launchAtLogin, openAsHidden: true });
}

function buildTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'trayTemplate.png')).resize({ width: 18, height: 18 });
  icon.setTemplateImage(true);
  tray = new Tray(icon);
  tray.setToolTip('Desktop Widgets');
  const menu = () => Menu.buildFromTemplate([
    { label: 'Widget Gallery…', click: showManager },
    { label: 'Launch at login', type: 'checkbox', checked: !!store.get().settings.launchAtLogin,
      click: (i) => { store.get().settings.launchAtLogin = i.checked; store.save(); applyLaunchAtLogin(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.on('click', () => tray.popUpContextMenu(menu()));
  tray.on('right-click', () => tray.popUpContextMenu(menu()));
}

// ---------- IPC ----------
const winOf = (e) => BrowserWindow.fromWebContents(e.sender);

ipcMain.handle('widgets:add', (_e, type, size) => addWidget(type, size));
ipcMain.handle('widgets:list', () => store.get().widgets.map(({ id, type, size }) => ({ id, type, size })));
ipcMain.handle('widgets:remove', (_e, id) => removeWidget(id));
ipcMain.handle('settings:get', () => store.get().settings);
ipcMain.handle('settings:set', (_e, key, val) => {
  store.get().settings[key] = val; store.save();
  if (key === 'launchAtLogin') applyLaunchAtLogin();
});
ipcMain.handle('data:get', (_e, id) => find(id)?.data || {});
ipcMain.on('data:set', (_e, id, key, val) => { const w = find(id); if (w) { w.data[key] = val; store.save(); } });

ipcMain.on('drag:start', (_e, id) => { const win = wins.get(id); if (win) drags.set(id, win.getPosition()); });
ipcMain.on('drag:move', (_e, id, dx, dy) => {
  const win = wins.get(id); const o = drags.get(id);
  if (!win || !o) return;
  const [width, height] = win.getSize();
  win.setBounds({ x: Math.round(o[0] + dx), y: Math.round(o[1] + dy), width, height });
});

ipcMain.on('menu:show', (e, id, supported) => {
  const w = find(id);
  if (!w) return;
  Menu.buildFromTemplate([
    { label: 'Size', submenu: supported.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), type: 'radio', checked: w.size === s, click: () => resizeWidget(id, s) })) },
    { label: 'Widget Gallery…', click: showManager },
    { type: 'separator' },
    { label: 'Remove Widget', click: () => removeWidget(id) }
  ]).popup({ window: winOf(e) });
});

let lastCpu = os.cpus();
ipcMain.handle('sys:stats', () => {
  const now = os.cpus(); let idle = 0; let total = 0;
  now.forEach((c, i) => {
    const p = lastCpu[i]?.times || c.times;
    for (const k in c.times) total += c.times[k] - p[k];
    idle += c.times.idle - p.idle;
  });
  lastCpu = now;
  return { cpu: total ? Math.round(100 * (1 - idle / total)) : 0, memUsed: os.totalmem() - os.freemem(), memTotal: os.totalmem() };
});

// ---------- lifecycle ----------
app.whenReady().then(() => {
  store.init();
  const firstRun = store.isFirstRun();
  if (process.platform === 'darwin') app.dock?.hide();
  buildTray();
  store.get().widgets.forEach(createWidget);   // restores every widget at its saved position
  applyLaunchAtLogin();
  if (firstRun || store.get().widgets.length === 0) showManager();
});
app.on('before-quit', () => store.flush());
