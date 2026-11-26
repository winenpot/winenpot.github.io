// Browser regression checks. Start local Chrome with --remote-debugging-port=9333.
// Run: node scripts/check-accessibility.mjs [--baseline]
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
const baseline = process.argv.includes('--baseline');
const out = resolve(process.env.TMPDIR, 'accessibility-review');
mkdirSync(out, { recursive: true });
const tab = await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let seq = 0;
const tasks = new Map(), errors = [], failures = [];
ws.onmessage = ({ data }) => {
  const m = JSON.parse(data);
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  const task = tasks.get(m.id);
  if (task) { tasks.delete(m.id); m.error ? task.reject(new Error(JSON.stringify(m.error))) : task.resolve(m.result); }
};
function cdp(method, params = {}) { return new Promise((resolve, reject) => { const id = ++seq; tasks.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); assert.ok(!r.exceptionDetails, JSON.stringify(r.exceptionDetails)); return r.result.value; }
const pause = ms => new Promise(r => setTimeout(r, ms));
function check(condition, message) { if (!condition) failures.push(message); }
async function shot(name) { const r = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(resolve(out, name), Buffer.from(r.data, 'base64')); }
async function load(path) {
  await cdp('Page.navigate', { url: `http://127.0.0.1:4321${path}` });
  for (let i = 0; i < 100; i++) { await pause(100); try { if (await evaluate(`location.pathname === '${path}' && document.readyState === 'complete' && !!document.querySelector('#stars')?.dataset.snapshot`)) { await evaluate('document.fonts.ready.then(() => true)'); return; } } catch {} }
  throw new Error('Page did not load: '+path);
}
try {
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [375, 320, 768, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await load('/');
    const result = await evaluate(`(() => {
      const nav = document.querySelector('.nav__links'), r = nav.getBoundingClientRect();
      return { overflow: document.documentElement.scrollWidth > innerWidth,
        navVisible: [...nav.querySelectorAll('a')].every(a => { const b = a.getBoundingClientRect(); return b.left >= r.left - 1 && b.right <= r.right + 1; }) && getComputedStyle(nav).maskImage === 'none',
        targets: [...nav.querySelectorAll('a')].every(a => a.getBoundingClientRect().height >= 44),
        opaque: [...document.querySelectorAll('.card')].every(c => getComputedStyle(c).backgroundColor !== 'rgba(0, 0, 0, 0)'),
        mainFocusable: document.querySelector('main').getAttribute('tabindex') === '-1' };
    })()`);
    check(!result.overflow, `${width}px: no horizontal page overflow`);
    check(result.navVisible, `${width}px: all navigation labels visible without scrolling or a fading mask`);
    check(result.targets, `${width}px: navigation touch targets >=44px`);
    check(result.opaque, `${width}px: opaque card foundation keeps stars behind the content`);
    check(result.mainFocusable, `${width}px: skip target accepts keyboard focus`);
    if ([375,1440].includes(width)) await shot(`${baseline ? 'before' : 'after'}-${width}.png`);
    console.log(width, result);
  }
  // Sample actual rendered surfaces under secondary text, not palette guesses.
  const samples = await evaluate(`(() => {
    const samples = [...document.querySelectorAll('.card p')].map(e => {
      const r = e.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), color: getComputedStyle(e).color };
    }).filter(r => r.x >= 0 && r.x < innerWidth && r.y >= 0 && r.y < innerHeight);
    const style = document.createElement('style'); style.id = 'contrast-probe'; style.textContent = '.card > * { visibility: hidden !important; }'; document.head.append(style);
    return samples;
  })()`);
  const surface = await cdp('Page.captureScreenshot', { format: 'png' });
  const { data: pixels, info } = await sharp(Buffer.from(surface.data, 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await evaluate("document.querySelector('#contrast-probe').remove()");
  const luminance = rgb => rgb.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratios = samples.map(s => {
    const i = (s.y * info.width + s.x) * info.channels;
    const bg = luminance([...pixels.subarray(i, i + 3)]);
    const fg = luminance(s.color.match(/[0-9.]+/g).slice(0, 3).map(Number));
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
  });
  check(ratios.length > 0 && ratios.every(r => r >= 4.5), 'sampled secondary text contrast >=4.5:1');
  console.log('Sampled card text contrast ratios:', ratios.map(r => r.toFixed(2)));
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  check(await evaluate("document.activeElement.matches('a[href=\"#main\"]')"), 'skip link is first in keyboard order');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await pause(100);
  check(await evaluate("document.activeElement.id === 'main'"), 'activating skip link focuses main content');
  await evaluate("document.querySelector('[data-hire-open]').click()");
  await pause(100);
  check(await evaluate("document.querySelector('#hire-dialog').open && document.querySelector('#hire-dialog').contains(document.activeElement)"), 'contact dialog opens with focus inside');
  await evaluate("Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Permission denied')) } }); document.querySelector('[data-copy]').click()");
  await pause(100);
  check(await evaluate("!!document.querySelector('[data-copy-status][role=status]')?.textContent.trim()"), 'clipboard failure is announced instead of silently failing');
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await pause(100);
  check(await evaluate("!document.querySelector('#hire-dialog').open && document.activeElement.matches('[data-hire-open]')"), 'Escape closes dialog and restores opener focus');
  await load('/work/');
  check(await evaluate("[...document.querySelectorAll('button.chip')].every(b => b.getBoundingClientRect().height >= 44)"), 'filter buttons have >=44px touch targets');
  check(errors.length === 0, 'no browser runtime exceptions: '+errors.join(', '));
  writeFileSync(resolve(out, `${baseline ? 'before' : 'after'}-results.json`), JSON.stringify({ failures, errors }, null, 2));
  console.log('Failures:', failures);
  assert.deepEqual(failures, []);
  console.log('PASS: navigation/reflow, readable surfaces, keyboard skip, modal focus, clipboard feedback, touch targets.');
  if (process.argv.includes('--performance')) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await cdp('Emulation.setEmulatedMedia', { features: [] });
    await cdp('Performance.enable'); await cdp('Page.bringToFront');
    const performance = {};
    for (const [name, url] of [['live-before', 'https://winenpot.github.io/'], ['local-after', 'http://127.0.0.1:4321/']]) {
      await cdp('Page.navigate', { url });
      for (let i = 0; i < 100; i++) { await pause(100); try { if (await evaluate("document.readyState === 'complete' && document.querySelector('#stars')?.width > 0")) break; } catch {} }
      await pause(500);
      performance[name] = {};
      for (const scroll of [false, true]) {
        const before = Object.fromEntries((await cdp('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
        const frames = await evaluate(`(async () => {
          const times = [], start = performance.now(), height = document.documentElement.scrollHeight - innerHeight;
          await new Promise(resolve => { const frame = now => { times.push(now); const k = (now - start) / 2500; if (${scroll}) scrollTo(0, height * Math.min(1, k)); k < 1 ? requestAnimationFrame(frame) : resolve(); }; requestAnimationFrame(frame); });
          const deltas = times.slice(1).map((t, i) => t - times[i]).sort((a,b) => a-b);
          return { frames: deltas.length, p95ms: deltas[Math.floor(deltas.length * .95)] };
        })()`);
        const after = Object.fromEntries((await cdp('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
        performance[name][scroll ? 'scroll' : 'idle'] = { ...frames, taskSeconds: after.TaskDuration - before.TaskDuration, styleSeconds: after.RecalcStyleDuration - before.RecalcStyleDuration };
      }
    }
    writeFileSync(resolve(out, 'performance.json'), JSON.stringify(performance, null, 2));
    console.log('Performance (live baseline vs local dev; different snapshots):', JSON.stringify(performance));
  }
} finally { await cdp('Page.close'); ws.close(); }
