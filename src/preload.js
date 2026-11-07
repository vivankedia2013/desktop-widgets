const { contextBridge, ipcRenderer } = require('electron');
const INVOKE = ['widgets:add', 'widgets:list', 'widgets:remove', 'settings:get', 'settings:set', 'data:get', 'sys:stats'];
const SEND = ['drag:start', 'drag:move', 'data:set', 'menu:show'];
const ON = ['widgets:changed'];
contextBridge.exposeInMainWorld('api', {
  invoke: (c, ...a) => (INVOKE.includes(c) ? ipcRenderer.invoke(c, ...a) : Promise.reject(new Error('blocked'))),
  send: (c, ...a) => { if (SEND.includes(c)) ipcRenderer.send(c, ...a); },
  on: (c, f) => { if (ON.includes(c)) ipcRenderer.on(c, () => f()); }
});
