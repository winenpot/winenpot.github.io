import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.TIMELINE_BASE_URL ?? 'http://localhost:4321';

test('ribbons follow the original wave at a constant nonzero lane offset', async () => {
  const { month, ribbon } = await import('../src/scripts/timeline-geometry.ts');
  const first = month('2024-01'), last = month('2025-01');
  const path = ribbon('2024-01', '2024-12', first, last, first, 0).d;
  const points = [...path.matchAll(/[ML]([\d.]+)\s+([\d.]+)/g)].map(m => [+m[1], +m[2]]);
  const offsets = points.map(([x, y]) => y - (50 + 30 * Math.sin((x / 1000) * Math.PI * 3.2 + 0.4)));
  assert.ok(Math.abs(offsets[0] - 4) < .02, 'nearest lane almost touches the base wave');
  assert.ok(Math.max(...offsets) - Math.min(...offsets) < .03, 'offset remains constant along the original wave');
});

test('inclusive overlaps get distinct reusable lanes, including ongoing work', async () => {
  const { month, allocateLanes } = await import('../src/scripts/timeline-geometry.ts');
  assert.equal(typeof allocateLanes, 'function', 'rendered timeline needs an interval allocator');
  const current = month('2024-08');
  const spans = [
    { start: '2024-01', end: '2024-03' },
    { start: '2024-01', end: '2024-03' }, // identical
    { start: '2024-03', end: '2024-03' }, // inclusive boundary, single month
    { start: '2024-04', end: '2024-04' }, // next month can reuse a lane
    { start: '2024-06' }, // ongoing to August inclusive
    { start: '2024-08', end: '2024-08' },
    { start: '2024-10', end: '2024-10' }, // genuine gap
  ];
  const lanes = allocateLanes(spans, current);
  for (let i = 0; i < spans.length; i++) for (let j = i + 1; j < spans.length; j++) {
    const a = spans[i], b = spans[j];
    const end = s => Math.max(month(s.start), s.end ? month(s.end) : current);
    if (month(a.start) <= end(b) && month(b.start) <= end(a)) assert.notEqual(lanes[i], lanes[j], `${i} overlaps ${j}`);
  }
  assert.ok(lanes.slice(0, 3).includes(lanes[3]), 'adjacent non-overlapping months reuse a lane');
  assert.ok(lanes.slice(0, 3).includes(lanes[6]), 'a gap permits lane reuse');
});

test('month-axis geometry includes a single final month and ongoing overlaps', async () => {
  const geometry = await import('../src/scripts/timeline-geometry.ts').catch(() => null);
  assert.ok(geometry, 'timeline geometry must be available to render synthetic intervals');
  const { month, ribbon } = geometry;
  const first = month('2024-01');
  const last = month('2025-01');
  const current = month('2024-08');
  const single = ribbon('2024-02', '2024-02', first, last, current, 0);
  const ongoing = ribbon('2024-02', undefined, first, last, current, 1);
  const overlap = ribbon('2024-05', '2024-09', first, last, current, 2);
  assert.equal(single.end, '2024-03');
  assert.equal(ongoing.end, '2024-09');
  assert.equal(single.startX, 100);
  assert.equal(single.endX, 180);
  assert.equal(ongoing.endX, 660);
  assert.ok(ongoing.startX < overlap.endX && overlap.startX < ongoing.endX);
  assert.notEqual(ongoing.d, overlap.d);
});

test('both rendered timelines use the original wave and allocated lanes', async () => {
  const { month, waveY, allocateLanes } = await import('../src/scripts/timeline-geometry.ts');
  for (const route of ['/', '/work/']) {
    const html = await (await fetch(new URL(route, base))).text();
    assert.match(html, /class="tl__path"/, `${route} renders the original dotted base`);
    const paths = [...html.matchAll(/<path\b[^>]*data-work="([^"]+)"[^>]*data-start="([^"]+)"[^>]*data-end-exclusive="([^"]+)"[^>]*data-lane="(\d+)"[^>]*d="([^"]+)"[^>]*>/g)];
    assert.ok(paths.length >= 6, `${route} exposes lane geometry`);
    assert.ok(+paths.find(p => p[1] === 'pars-pardaz')[4] <= 1, 'Pars Pardaz stays on a near-baseline lane');
    const spans = paths.map(p => ({ start: p[2], end: p[3] }));
    const now = new Date(), current = now.getFullYear() * 12 + now.getMonth();
    const inclusiveSpans = spans.map(s => ({ start: s.start, end: `${Math.floor((month(s.end) - 1) / 12)}-${String((month(s.end) - 1) % 12 + 1).padStart(2, '0')}` }));
    assert.deepEqual(paths.map(p => +p[4]), allocateLanes(inclusiveSpans, current));
    for (const [, id, , , lane, d] of paths) {
      const points = [...d.matchAll(/[ML]([\d.]+)\s+([\d.]+)/g)];
      const offset = (4 + Math.floor(+lane / 2) * 7) * (+lane % 2 ? -1 : 1);
      for (const p of points) assert.ok(Math.abs(+p[2] - waveY(+p[1]) - offset) < .02, `${id} follows lane ${lane}`);
    }
  }
});

test('rendered timelines show Basalam for every month through February 2021', async () => {
  for (const route of ['/', '/work/']) {
    const response = await fetch(new URL(route, base));
    assert.equal(response.status, 200);
    const html = await response.text();
    const ribbon = html.match(/<path\b[^>]*data-work="basalam"[^>]*>/)?.[0];
    assert.ok(ribbon, `${route} must render a Basalam tenure ribbon`);
    assert.match(ribbon, /data-start="2020-10"/);
    assert.match(ribbon, /data-end-exclusive="2021-03"/);
    const paths = [...html.matchAll(/<path\b[^>]*data-work="([^"]+)"[^>]*data-start="([^"]+)"[^>]*data-end-exclusive="([^"]+)"[^>]*d="([^"]+)"[^>]*>/g)];
    assert.ok(paths.length >= 6);
    const { month, axisX } = await import('../src/scripts/timeline-geometry.ts');
    const first = Math.floor(Math.min(...paths.map(p => month(p[2]))) / 12) * 12;
    const now = new Date();
    const last = Math.max(now.getFullYear() * 12 + now.getMonth() + 1, ...paths.map(p => month(p[3])));
    for (const [, id, start, end, d] of paths) {
      const points = [...d.matchAll(/[ML]([\d.]+)\s+([\d.]+)/g)];
      assert.ok(points.length >= 2, `${id} has a path`);
      assert.ok(Math.abs(Number(points[0][1]) - axisX(month(start), first, last)) < .011, `${id} starts at its month`);
      assert.ok(Math.abs(Number(points.at(-1)[1]) - axisX(month(end), first, last)) < .011, `${id} ends after its final month`);
    }
  }
});
