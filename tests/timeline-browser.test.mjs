// Run with a local Chrome CDP endpoint and dev server:
// TIMELINE_CDP=http://127.0.0.1:9228 node --test tests/timeline-browser.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const cdp = process.env.TIMELINE_CDP ?? 'http://127.0.0.1:9228';
const base = process.env.TIMELINE_BASE_URL ?? 'http://localhost:4321';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function session() {
  const target = await fetch(`${cdp}/json/new?about:blank`, { method: 'PUT' }).then(r => r.json());
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let id = 0;
  const pending = new Map();
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(message.error.message)) : resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const current = ++id;
    const timer = setTimeout(() => { pending.delete(current); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
    pending.set(current, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
    ws.send(JSON.stringify({ id: current, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  };
  return { send, evaluate, close: () => ws.close() };
}

for (const route of ['/', '/work/']) {
  test(`${route}: work links remain available without JavaScript`, async () => {
    const { send, evaluate, close } = await session();
    try {
      await send('Emulation.setScriptExecutionDisabled', { value: true });
      await send('Page.navigate', { url: new URL(route, base).href });
      for (let i = 0; i < 100 && !await evaluate("!!document.querySelector('[data-tl]')"); i++) await wait(100);
      const links = await evaluate("[...document.querySelectorAll('[data-tl] .tl__work-link')].map(a => ({href:a.getAttribute('href'), visible:!!a.getClientRects().length}))");
      assert.ok(links.length >= 6);
      assert.ok(links.every(link => link.visible && link.href.startsWith('/work/')));
    } finally { close(); }
  });

  test(`${route}: striped ribbons have visible markers exactly at both month boundaries`, async () => {
    const { send, evaluate, close } = await session();
    try {
      await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
      await send('Page.navigate', { url: new URL(route, base).href });
      for (let i = 0; i < 100 && !await evaluate("!!document.querySelector('[data-tl][data-ready]')"); i++) await wait(100);
      const result = await evaluate(`(() => {
        const timeline = document.querySelector('[data-tl]');
        return [...timeline.querySelectorAll('[data-ribbon]')].map(group => {
          const path = group.querySelector('.tl__stroke'), stripe = group.querySelector('.tl__stripe');
          const id = group.dataset.ribbon, matrix = path.getScreenCTM();
          const markers = ['start','end'].map((side, i) => {
            const marker = timeline.querySelector('[data-marker="' + id + '-' + side + '"]');
            if (!marker) return null;
            const pt = path.getPointAtLength(i ? path.getTotalLength() : 0), rect = marker.getBoundingClientRect();
            return { distance: Math.hypot(rect.x + rect.width/2 - (pt.x*matrix.a + pt.y*matrix.c + matrix.e), rect.y + rect.height/2 - (pt.x*matrix.b + pt.y*matrix.d + matrix.f)), size: rect.width };
          });
          return { id, width: parseFloat(getComputedStyle(path).strokeWidth), dash: stripe && getComputedStyle(stripe).strokeDasharray, markers };
        });
      })()`);
      assert.ok(result.length >= 6);
      for (const ribbon of result) {
        assert.ok(ribbon.width > 4, `${ribbon.id} is thicker`);
        assert.ok(ribbon.dash && ribbon.dash !== 'none', `${ribbon.id} is striped`);
        assert.ok(ribbon.markers.every(marker => marker && marker.size >= 6 && marker.distance < 1), `${ribbon.id} marks both actual endpoints`);
      }
    } finally { close(); }
  });

  test(`${route}: keyboard and touch pin, switch, and dismiss independently`, async () => {
    const { send, evaluate, close } = await session();
    try {
      await send('Page.enable');
      await send('Page.navigate', { url: new URL(route, base).href });
      for (let i = 0; i < 100 && !await evaluate("!!document.querySelector('[data-tl][data-ready]')"); i++) await wait(100);
      assert.equal(await evaluate("!!document.querySelector('[data-tl][data-ready]')"), true);
      const idleOpacity = await evaluate("Number(getComputedStyle(document.querySelector('[data-ribbon=\"3\"] .tl__stroke')).opacity)");
      await evaluate("document.querySelector('[data-select=\"3\"]').focus()");
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
      assert.equal(await evaluate("document.querySelector('[data-select=\"3\"]').getAttribute('aria-pressed')"), 'true');
      assert.ok(await evaluate("Number(getComputedStyle(document.querySelector('[data-ribbon=\"3\"] .tl__stroke')).opacity)") > idleOpacity, 'selected ribbon brightens');
      assert.equal(await evaluate("document.querySelector('[data-detail=\"3\"]').hidden"), false);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      assert.equal(await evaluate("document.querySelector('[data-detail=\"3\"]').hidden"), true);
      await evaluate("document.querySelector('[data-select=\"3\"]').click(); document.querySelector('[data-detail=\"3\"] [data-dismiss]').focus(); document.querySelector('[data-detail=\"3\"] [data-dismiss]').click()");
      assert.equal(await evaluate("document.activeElement === document.querySelector('[data-select=\"3\"]')"), true, 'close restores keyboard focus to its selector');
      await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
      const tap = async i => {
        const point = await evaluate(`(() => { const b = document.querySelector('[data-select="${i}"]'); b.scrollIntoView({block:'center',behavior:'instant'}); const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`);
        await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
        await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      };
      await tap(3);
      assert.equal(await evaluate("document.querySelector('[data-detail=\"3\"]').hidden"), false);
      await tap(4);
      assert.equal(await evaluate("document.querySelector('[data-detail=\"3\"]').hidden"), true);
      assert.equal(await evaluate("document.querySelector('[data-detail=\"4\"]').hidden"), false);
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    } finally { close(); }
  });
}
