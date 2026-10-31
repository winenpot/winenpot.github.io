/**
 * Greedy t-spanner: the logic behind TSpanner.astro. The lab page loads this
 * file only when the demo's tile opens (its own chunk, via import.meta.glob),
 * then calls mount() on the markup. See TSpanner.astro for the algorithm.
 */
import { t } from '../../i18n/ui';

const W = 1000, H = 540; // fixed logical canvas space; CSS scales it visually
type Pt = { x: number; y: number };
type Edge = [number, number, number]; // [i, j, dist]

class MinHeap {
  private a: [number, number][] = [];
  push(d: number, u: number) {
    const a = this.a;
    a.push([d, u]);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): [number, number] | undefined {
    const a = this.a;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = i * 2 + 2;
        let m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
  get size() { return this.a.length; }
}

/** Shortest path i→j in `adj`, capped: returns Infinity as soon as it's
 *  provably > cap, without exploring the whole graph. */
function shortestCapped(adj: { to: number; w: number }[][], src: number, dst: number, n: number, cap: number): number {
  const dist = new Float64Array(n).fill(Infinity);
  const visited = new Uint8Array(n);
  dist[src] = 0;
  const heap = new MinHeap();
  heap.push(0, src);
  while (heap.size) {
    const [d, u] = heap.pop()!;
    if (visited[u]) continue;
    visited[u] = 1;
    if (u === dst) return d;
    if (d > cap) return Infinity;
    for (const e of adj[u]) {
      const nd = d + e.w;
      if (nd < dist[e.to]) { dist[e.to] = nd; heap.push(nd, e.to); }
    }
  }
  return Infinity;
}

function kruskalMST(pairsSorted: Edge[], n: number): { edges: Edge[]; total: number } {
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  const edges: Edge[] = [];
  let total = 0;
  for (const [i, j, dd] of pairsSorted) {
    const ri = find(i), rj = find(j);
    if (ri !== rj) { parent[ri] = rj; edges.push([i, j, dd]); total += dd; if (edges.length === n - 1) break; }
  }
  return { edges, total };
}

export function mount(root: HTMLElement) {
  const canvas = root.querySelector('canvas.tspanner__canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const tInput = root.querySelector('.tspanner__t-input') as HTMLInputElement;
  const tOut = root.querySelector('.tspanner__t-out') as HTMLOutputElement;
  const mstToggle = root.querySelector('.tspanner__mst-toggle') as HTMLInputElement;
  const statN = root.querySelector('[data-stat="n"]') as HTMLElement;
  const statM = root.querySelector('[data-stat="m"]') as HTMLElement;
  const statRatio = root.querySelector('[data-stat="ratio"]') as HTMLElement;
  const statTime = root.querySelector('[data-stat="time"]') as HTMLElement;

  let points: Pt[] = [];
  let tValue = parseFloat(tInput.value);
  let spannerEdges: Edge[] = [];
  let mstEdges: Edge[] = [];
  let debounceId: number | undefined;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const css = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
  const euclid = (p: Pt, q: Pt) => Math.hypot(p.x - q.x, p.y - q.y);

  function scheduleRebuild() {
    statTime.textContent = t('tspanner.computing');
    window.clearTimeout(debounceId);
    debounceId = window.setTimeout(rebuild, 60);
  }

  function rebuild() {
    const n = points.length;
    if (n < 2) {
      spannerEdges = []; mstEdges = [];
      statN.textContent = String(n);
      statM.textContent = `0 / 0`;
      statRatio.textContent = '—';
      statTime.textContent = '—';
      draw();
      return;
    }
    const t0 = performance.now();
    const pairs: Edge[] = [];
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) pairs.push([i, j, euclid(points[i], points[j])]);
    pairs.sort((a, b) => a[2] - b[2]);

    const adj: { to: number; w: number }[][] = Array.from({ length: n }, () => []);
    const edges: Edge[] = [];
    for (const [i, j, dd] of pairs) {
      const cap = tValue * dd;
      const sp = shortestCapped(adj, i, j, n, cap);
      if (sp > cap) {
        adj[i].push({ to: j, w: dd });
        adj[j].push({ to: i, w: dd });
        edges.push([i, j, dd]);
      }
    }
    const buildMs = performance.now() - t0;
    const mst = kruskalMST(pairs, n);

    spannerEdges = edges;
    mstEdges = mst.edges;

    const totalLen = edges.reduce((s, [, , dd]) => s + dd, 0);
    const possible = (n * (n - 1)) / 2;
    statN.textContent = String(n);
    statM.textContent = `${edges.length} / ${possible}`;
    statRatio.textContent = mst.total > 0 ? `${(totalLen / mst.total).toFixed(2)}×` : '—';
    statTime.textContent = `${buildMs.toFixed(buildMs < 10 ? 2 : 0)} ms`;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const edgeColor = css('--periwinkle') || '#9aa6ec';
    const mstColor = css('--kincha') || '#d9a540';
    const ptFill = css('--starlight') || '#f4e9c8';
    const ptStroke = css('--night-0') || '#0a0b1c';

    ctx.lineCap = 'round';
    ctx.strokeStyle = edgeColor;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1.6;
    for (const [i, j] of spannerEdges) {
      ctx.beginPath();
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[j].x, points[j].y);
      ctx.stroke();
    }

    if (mstToggle.checked) {
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = mstColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      for (const [i, j] of mstEdges) {
        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[j].x, points[j].y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = ptFill;
    ctx.strokeStyle = ptStroke;
    ctx.lineWidth = 1.5;
    for (const p of points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function toLogical(clientX: number, clientY: number): Pt {
    const r = canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H };
  }

  canvas.addEventListener('pointerup', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    const r = canvas.getBoundingClientRect();
    const hitRadiusLogical = 20 / (r.width / W); // ~20 on-screen px, any viewport size
    const hitIdx = points.findIndex((q) => euclid(q, p) < hitRadiusLogical);
    if (hitIdx >= 0) points.splice(hitIdx, 1);
    else points.push(p);
    scheduleRebuild();
  });

  function randomPoints(n: number) {
    const margin = 36;
    points = Array.from({ length: n }, () => ({
      x: margin + Math.random() * (W - 2 * margin),
      y: margin + Math.random() * (H - 2 * margin),
    }));
    scheduleRebuild();
  }

  root.querySelectorAll<HTMLButtonElement>('.tspanner__random').forEach((btn) => {
    btn.addEventListener('click', () => randomPoints(Number(btn.dataset.n)));
  });
  root.querySelector('[data-clear]')!.addEventListener('click', () => { points = []; scheduleRebuild(); });
  mstToggle.addEventListener('change', draw);
  tInput.addEventListener('input', () => { tOut.textContent = parseFloat(tInput.value).toFixed(1); });
  tInput.addEventListener('change', () => { tValue = parseFloat(tInput.value); scheduleRebuild(); });

  // Mounted when its tile opens (lab page), so it is on screen: seed now.
  randomPoints(40);

  draw();
}
