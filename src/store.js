// Saves widget layout (position, size, per-widget data) to userData/layout.json
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

let file;
let data = { widgets: [], settings: { launchAtLogin: true } };
let timer;

function init() {
  file = path.join(app.getPath('userData'), 'layout.json');
  try {
    const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
    data = { widgets: saved.widgets || [], settings: { ...data.settings, ...(saved.settings || {}) } };
  } catch (_) { /* first run */ }
}
function flush() {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2)); } catch (e) { console.error('save failed', e); }
}
function save() { clearTimeout(timer); timer = setTimeout(flush, 250); }

module.exports = { init, save, flush, get: () => data, isFirstRun: () => !fs.existsSync(file) };
