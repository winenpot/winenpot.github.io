// ─────────────────────────────────────────────────────────────────────
//  Living math figures, drawn in starlight on <canvas>.
//  Each figure is a pure function (ctx, t, size, color) → draws one frame.
//  To add one: write a draw function, add it to FIGURES, then place it in
//  src/config/figures.ts. Nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────

type Draw = (ctx: CanvasRenderingContext2D, t: number, s: number, color: string) => void;

const TAU = Math.PI * 2;

function glow(ctx: CanvasRenderingContext2D, color: string, blur = 6) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}
function line(ctx: CanvasRenderingContext2D, a: number[], b: number[], alpha: number) {
  ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
}
/** Centered italic label; "e^{iπ}" draws iπ as a real superscript. */
const label = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, alpha = 0.8) => {
  ctx.globalAlpha = alpha; ctx.shadowBlur = 4; ctx.textAlign = 'left';
  const runs: { s: string; sup: boolean }[] = [];
  text.split(/(\^\{[^}]*\})/).forEach((p) => p && runs.push(p.startsWith('^{') ? { s: p.slice(2, -1), sup: true } : { s: p, sup: false }));
  const font = (sup: boolean) => `italic ${sup ? size * 0.66 : size}px "Fraunces Variable", Georgia, serif`;
  const w = runs.reduce((a, r) => { ctx.font = font(r.sup); return a + ctx.measureText(r.s).width; }, 0);
  let cx = x - w / 2;
  for (const r of runs) { ctx.font = font(r.sup); ctx.fillText(r.s, cx, r.sup ? y - size * 0.42 : y); cx += ctx.measureText(r.s).width; }
};

/* ── Gaussian: samples fall and build the bell ────────────────────── */
const gaussState = new WeakMap<CanvasRenderingContext2D, { bins: number[]; drops: { x: number; y: number; vy: number; bin: number }[]; last: number }>();
const randn = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * Math.random()); };
const gauss: Draw = (ctx, t, s, color) => {
  const B = 21, x0 = s * 0.1, x1 = s * 0.9, base = s * 0.78, bw = (x1 - x0) / B;
  let st = gaussState.get(ctx);
  if (!st) { st = { bins: Array(B).fill(0), drops: [], last: t }; gaussState.set(ctx, st); }
  const dt = Math.min(0.05, t - st.last); st.last = t;
  if (Math.random() < 0.35) {
    const z = randn(); const bin = Math.max(0, Math.min(B - 1, Math.floor(B / 2 + z * 3.2)));
    st.drops.push({ x: x0 + (bin + 0.5) * bw, y: s * 0.06, vy: 0, bin });
  }
  const unit = s * 0.012;
  st.drops = st.drops.filter((d) => {
    d.vy += 600 * dt; d.y += d.vy * dt;
    if (d.y >= base - st!.bins[d.bin] * unit) { st!.bins[d.bin]++; return false; }
    return true;
  });
  if (Math.max(...st.bins) * unit > s * 0.55) st.bins = st.bins.map((b) => Math.floor(b * 0.35));
  glow(ctx, color, 5); ctx.lineWidth = 1.2;
  st.bins.forEach((b, i) => { ctx.globalAlpha = 0.28; ctx.fillRect(x0 + i * bw + 1, base - b * unit, bw - 2, b * unit); });
  ctx.globalAlpha = 0.9; for (const d of st.drops) { ctx.beginPath(); ctx.arc(d.x, d.y, 1.8, 0, TAU); ctx.fill(); }
  // the ideal curve, scaled to the current tallest bin
  const n = st.bins.reduce((a, b) => a + b, 0) || 1, sigma = 3.2;
  ctx.globalAlpha = 0.85; ctx.beginPath();
  for (let i = 0; i <= 100; i++) {
    const xb = (i / 100) * B; const z = (xb - B / 2) / sigma;
    const y = base - (n / (sigma * Math.sqrt(TAU))) * Math.exp(-z * z / 2) * unit;
    i ? ctx.lineTo(x0 + xb * bw, y) : ctx.moveTo(x0 + xb * bw, y);
  }
  ctx.stroke();
  ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.moveTo(x0, base + 0.5); ctx.lineTo(x1, base + 0.5); ctx.stroke();
  label(ctx, 'N(μ, σ²)', s / 2, s * 0.92, s * 0.075);
};

/* ── Fibonacci squares + golden spiral ────────────────────────────── */
const FIB = [1, 1, 2, 3, 5, 8, 13];
const fibonacci: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 5); ctx.lineWidth = 1.1;
  const cycle = 9, k = (t % cycle) / cycle; // draw-in, hold, fade
  const prog = Math.min(1, k / 0.6), fade = k > 0.88 ? 1 - (k - 0.88) / 0.12 : 1;
  const u = s / 24;
  // squares spiral outward: direction sequence right, down, left, up …
  let x = 0, y = 0, minx = 0, miny = 0, maxx = 1, maxy = 1;
  const sq: { x: number; y: number; n: number; d: number }[] = [{ x: 0, y: 0, n: 1, d: 0 }];
  for (let i = 1; i < FIB.length; i++) {
    const n = FIB[i], d = i % 4;
    if (d === 1) { x = maxx; y = miny; } else if (d === 2) { x = maxx - n; y = maxy; } else if (d === 3) { x = minx - n; y = maxy - n; } else { x = minx; y = miny - n; }
    sq.push({ x, y, n, d });
    minx = Math.min(minx, x); miny = Math.min(miny, y); maxx = Math.max(maxx, x + n); maxy = Math.max(maxy, y + n);
  }
  const ox = s / 2 - ((minx + maxx) / 2) * u, oy = s / 2 - ((miny + maxy) / 2) * u;
  ctx.save(); ctx.translate(s / 2, s / 2); ctx.rotate(Math.sin(t * 0.1) * 0.15); ctx.translate(-s / 2, -s / 2);
  const shown = prog * sq.length;
  sq.forEach((q, i) => {
    const a = Math.max(0, Math.min(1, shown - i)) * fade; if (!a) return;
    ctx.globalAlpha = 0.45 * a; ctx.strokeRect(ox + q.x * u, oy + q.y * u, q.n * u, q.n * u);
    if (q.n >= 2) label(ctx, String(q.n), ox + (q.x + q.n / 2) * u, oy + (q.y + q.n / 2) * u + u * 0.35 * Math.min(q.n, 5), Math.min(q.n, 5) * u * 0.6, 0.55 * a);
    // quarter arc: centre is the square corner shared with the previous ones
    const corners: [number, number, number][] = [[q.x, q.y + q.n, -Math.PI / 2], [q.x, q.y, 0], [q.x + q.n, q.y, Math.PI / 2], [q.x + q.n, q.y + q.n, Math.PI]];
    const [cx, cy, a0] = corners[q.d];
    ctx.globalAlpha = 0.95 * a; ctx.lineWidth = 1.6; ctx.beginPath();
    ctx.arc(ox + cx * u, oy + cy * u, q.n * u, a0, a0 + (Math.PI / 2) * Math.min(1, Math.max(0, shown - i))); ctx.stroke(); ctx.lineWidth = 1.1;
  });
  ctx.restore();
  label(ctx, 'φ = 1.618…', s / 2, s * 0.95, s * 0.07, 0.75 * fade);
};

/* ── Euler: e^{iθ} on the circle, unrolling into a wave ──────────── */
const E_DIGITS = '2.71828182845904523536028747135266249775724709369995';
const euler: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 6); ctx.lineWidth = 1.2;
  const cx = s * 0.28, cy = s * 0.44, r = s * 0.16, th = t * 0.9;
  ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
  line(ctx, [cx - r * 1.3, cy], [cx + r * 1.3, cy], 0.25); line(ctx, [cx, cy - r * 1.3], [cx, cy + r * 1.3], 0.25);
  const px = cx + r * Math.cos(th), py = cy - r * Math.sin(th);
  ctx.lineWidth = 1.6; line(ctx, [cx, cy], [px, py], 0.95);
  ctx.beginPath(); ctx.arc(px, py, 2.6, 0, TAU); ctx.globalAlpha = 1; ctx.fill();
  // sine wave unrolling to the right (the wave the circle draws)
  const wx = cx + r * 1.45; ctx.lineWidth = 1.2; line(ctx, [px, py], [wx, py], 0.3);
  ctx.globalAlpha = 0.85; ctx.beginPath();
  for (let i = 0; i <= 80; i++) { const xx = wx + (i / 80) * s * 0.42; const y = cy - r * Math.sin(th - (i / 80) * TAU * 1.2); i ? ctx.lineTo(xx, y) : ctx.moveTo(xx, y); }
  ctx.stroke();
  const atPi = Math.abs(((th % TAU) + TAU) % TAU - Math.PI) < 0.35;
  label(ctx, atPi ? 'e^{iπ} + 1 = 0' : 'e^{iθ} = cos θ + i sin θ', s / 2, s * 0.8, s * (atPi ? 0.085 : 0.06), atPi ? 1 : 0.7);
  const nd = 3 + Math.floor((t * 3) % (E_DIGITS.length - 2));
  ctx.font = `${s * 0.05}px "IBM Plex Mono", monospace`; ctx.globalAlpha = 0.6;
  ctx.textAlign = 'center'; ctx.fillText('e = ' + E_DIGITS.slice(0, Math.min(nd, 18)) + (nd < 18 ? '' : '…'), s / 2, s * 0.92);
};

export const FIGURES: Record<string, Draw> = { gauss, fibonacci, euler };
export type FigureKind = keyof typeof FIGURES;

/** One shared loop for every [data-figure] canvas; pauses off-screen. */
export function startFigures() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frameInterval = 1000 / 30;
  const nodes = [...document.querySelectorAll<HTMLCanvasElement>('canvas[data-figure]')];
  const live = new Set<HTMLCanvasElement>();
  const items = nodes.map((c) => {
    const dpr = Math.min(1.5, devicePixelRatio || 1);
    const size = c.clientWidth || Number(c.dataset.size) || 160;
    c.width = c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const color = getComputedStyle(c).color;
    return { c, ctx, size, color, draw: FIGURES[c.dataset.figure!], seed: Math.random() * 100 };
  });
  let lastFrame = 0;
  const frame = (ms: number) => {
    if (!reduce && ms - lastFrame < frameInterval) {
      requestAnimationFrame(frame);
      return;
    }
    lastFrame = ms;
    const t = ms / 1000;
    for (const it of items) {
      if (!live.has(it.c) || !it.draw) continue;
      it.ctx.clearRect(0, 0, it.size, it.size);
      it.ctx.save(); it.draw(it.ctx, t + it.seed, it.size, it.color); it.ctx.restore();
    }
    if (!reduce) requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? live.add(e.target as HTMLCanvasElement) : live.delete(e.target as HTMLCanvasElement))));
  nodes.forEach((n) => io.observe(n));
  if (reduce) { items.forEach((it) => live.add(it.c)); setTimeout(() => frame(12000), 50); }
  else requestAnimationFrame(frame);
}
