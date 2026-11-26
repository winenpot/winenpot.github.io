// Run against a Chrome launched with --remote-debugging-port=9333:
// node scripts/check-sky-browser.mjs [http://127.0.0.1:4321]
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const base = process.argv[2] ?? 'http://127.0.0.1:4321';
const out = resolve(process.env.TMPDIR, 'sky-review');
mkdirSync(out, { recursive: true });
const target = await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
const errors = [];
socket.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  const task = pending.get(message.id);
  if (!task) return;
  pending.delete(message.id);
  message.error ? task.reject(new Error(JSON.stringify(message.error))) : task.resolve(message.result);
};
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const key = ++id;
    const timer = setTimeout(() => { pending.delete(key); reject(new Error(`Timeout: ${method}`)); }, 15000);
    pending.set(key, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    socket.send(JSON.stringify({ id: key, method, params }));
  });
}
async function evaluate(expression) {
  const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function ready(path) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if (await evaluate(`location.pathname === ${JSON.stringify(path)} && document.readyState === 'complete' && !!document.querySelector('#stars')?.dataset.snapshot`)) {
        await evaluate('document.fonts.ready.then(() => true)');
        await pause(100);
        return;
      }
    } catch {} // a full navigation briefly replaces the JS execution context
    await pause(100);
  }
  throw new Error(`Sky did not initialize on ${path}`);
}
async function state(label, previous) {
  const value = await evaluate(`(() => {
    const canvas = document.querySelector('#stars');
    let hash = 2166136261;
    for (const byte of canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data) hash = Math.imul(hash ^ byte, 16777619);
    return { index: canvas.dataset.snapshot, world: canvas.dataset.world, hash: hash >>> 0 };
  })()`);
  assert.equal(value.world, 'mars', `${label}: Mars observer`);
  if (previous) {
    assert.notEqual(value.index, previous.index, `${label}: new snapshot`);
    assert.notEqual(value.hash, previous.hash, `${label}: projected sky actually changes`);
  }
  console.log(label, value);
  return value;
}
async function screenshot(name) {
  const { data } = await cdp('Page.captureScreenshot', { format: 'png' });
  const path = resolve(out, name);
  writeFileSync(path, Buffer.from(data, 'base64'));
  console.log('Screenshot:', path);
}
try {
  await cdp('Page.enable');
  await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Page.navigate', { url: `${base}/` });
  await ready('/');
  let previous = await state('Initial load');
  await screenshot('sky-desktop-first.png');
  await cdp('Page.reload', { ignoreCache: true });
  await pause(200);
  await ready('/');
  previous = await state('Refresh', previous);
  await screenshot('sky-desktop-refresh.png');
  await evaluate("document.querySelector('nav a[href=\"/about/\"]').click()");
  await pause(200);
  await ready('/about/');
  previous = await state('Page link navigation', previous);
  await evaluate('history.back()');
  await pause(200);
  await ready('/');
  previous = await state('Back navigation', previous);
  await evaluate('history.forward()');
  await pause(200);
  await ready('/about/');
  previous = await state('Forward navigation', previous);
  await evaluate("dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))");
  await pause(100);
  previous = await state('Cached-page restore handler', previous);
  const stable = previous;
  await pause(200);
  assert.equal((await state('Reduced-motion static frame')).hash, stable.hash);
  await cdp('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await pause(150);
  await state('Mobile 375px');
  await screenshot('sky-mobile.png');
  await cdp('Emulation.setEmulatedMedia', { features: [] });
  await cdp('Page.reload');
  await pause(200);
  await ready('/about/');
  const animated = await state('Normal-motion rendering');
  await pause(350);
  assert.notEqual((await state('Normal-motion twinkle')).hash, animated.hash, 'normal animation is preserved');
  // Storage restrictions must not prevent rendering a Martian sky.
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: "Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });" });
  await cdp('Page.reload');
  await pause(200);
  await ready('/about/');
  await state('Storage blocked');
  assert.deepEqual(errors, [], 'no browser runtime exceptions');
  console.log('PASS: refresh, links, back/forward, cached restore, reduced motion, mobile, blocked storage.');
} finally {
  await cdp('Page.close');
  socket.close();
}
