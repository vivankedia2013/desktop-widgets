# Desktop Widgets

Free, unlimited, macOS-style desktop widgets for **macOS (Big Sur 11 or later)** and **Windows 10 / 11**.

## Features
- Unlimited widgets, no paywall. Same sizes as macOS widgets (small, medium, large).
- 15 built-in widgets: digital clock (hours, minutes, seconds), analog clock, date, month calendar, weather, notes, to-do, stopwatch, timer, battery, CPU and memory, world clock, countdown, calculator, daily quote.
- Drag any widget anywhere on the desktop. Right-click a widget to resize or remove it.
- Position saving: every widget returns to its exact place after a restart.
- Launches automatically at login (can be switched off from the tray or menu bar icon).
- Light and dark mode follow the system.

## Run from source
```bash
npm install
npm start
```
Requires [Node.js](https://nodejs.org) 18 or later.

## Build installers
```bash
npm run build:mac   # run on a Mac, creates a .dmg in dist/
npm run build:win   # run on Windows, creates an .exe installer in dist/
```
Or push a tag such as `v1.0.0` and let GitHub Actions build both (see `.github/workflows/build.yml`).

## Add your own widget
Open `src/renderer/widgets.js` and add an entry with a `name`, `icon`, `sizes` and a `render(el, ctx)` function. Use `ctx.get(key)` and `ctx.set(key, value)` to save data for that widget.

## Notes
- Launch at login works for the installed app, not for `npm start`.
- Widgets are normal windows. They can be covered by other windows, and they do not use Apple's WidgetKit or the Windows 11 widget board.
- Weather uses the free [Open-Meteo](https://open-meteo.com) service, no API key needed.
- Unsigned builds: macOS shows a warning on first open (right-click the app, then Open). Windows SmartScreen may show "More info", then "Run anyway".

## License
MIT
