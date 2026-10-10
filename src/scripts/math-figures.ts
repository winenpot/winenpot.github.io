// ─────────────────────────────────────────────────────────────────────
//  Living math figures, drawn in starlight on <canvas>.
//  Each figure is a pure function (ctx, t, size, color) → draws one frame.
//  To add one: write a draw function, add it to FIGURES, then place it in
//  src/config/figures.ts. Nothing else needs to change.
// ─────────────────────────────────────────────────────────────────────

type V3 = [number, number, number];
type Draw = (ctx: CanvasRenderingContext2D, t: number, s: number, color: string) => void;

const PHI = (1 + Math.sqrt(5)) / 2;
const TAU = Math.PI * 2;

function rot([x, y, z]: V3, ax: number, ay: number, az = 0): V3 {
  let c = Math.cos(ax), s = Math.sin(ax);
  [y, z] = [y * c - z * s, y * s + z * c];
  c = Math.cos(ay); s = Math.sin(ay);
  [x, z] = [x * c + z * s, -x * s + z * c];
  c = Math.cos(az); s = Math.sin(az);
  [x, y] = [x * c - y * s, x * s + y * c];
  return [x, y, z];
}
const proj = ([x, y, z]: V3, s: number, scale: number, cam = 4.2): [number, number, number] => {
  const k = cam / (cam - z);
  return [s / 2 + x * scale * k, s / 2 + y * scale * k, z];
};
function glow(ctx: CanvasRenderingContext2D, color: string, blur = 6) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}
function line(ctx: CanvasRenderingContext2D, a: number[], b: number[], alpha: number) {
  ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
}
function polyline(ctx: CanvasRenderingContext2D, pts: number[][]) {
  // depth-shaded segments
  for (let i = 1; i < pts.length; i++) line(ctx, pts[i - 1], pts[i], 0.25 + 0.6 * ((pts[i][2] + 1.6) / 3.2));
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

/* ── dodecahedron ─────────────────────────────────────────────────── */
const DODECA = (() => {
  const v: V3[] = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) v.push([a, b, c]);
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    v.push([0, a / PHI, b * PHI]); v.push([a / PHI, b * PHI, 0]); v.push([a * PHI, 0, b / PHI]);
  }
  const e: [number, number][] = [];
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    const d = Math.hypot(v[i][0] - v[j][0], v[i][1] - v[j][1], v[i][2] - v[j][2]);
    if (Math.abs(d - 2 / PHI) < 1e-3) e.push([i, j]);
  }
  return { v, e };
})();
const dodecahedron: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 8); ctx.lineWidth = 1.4;
  const p = DODECA.v.map((q) => proj(rot(q, t * 0.21, t * 0.33, 0.3), s, s * 0.2));
  for (const [i, j] of DODECA.e) line(ctx, p[i], p[j], 0.3 + 0.55 * ((p[i][2] + p[j][2] + 3.4) / 6.8));
  for (const q of p) { ctx.globalAlpha = 0.5 + 0.4 * ((q[2] + 1.7) / 3.4); ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, TAU); ctx.fill(); }
};

/* ── die (tumbling cube with pips) ────────────────────────────────── */
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-.5, -.5], [.5, .5]], 3: [[-.5, -.5], [0, 0], [.5, .5]],
  4: [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]], 5: [[-.5, -.5], [.5, -.5], [0, 0], [-.5, .5], [.5, .5]],
  6: [[-.5, -.55], [.5, -.55], [-.5, 0], [.5, 0], [-.5, .55], [.5, .55]],
};
// face: normal axis/sign, the two in-plane axes, value (opposites sum to 7)
const FACES: { n: V3; u: V3; v: V3; val: number }[] = [
  { n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], val: 1 }, { n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], val: 6 },
  { n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], val: 3 }, { n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], val: 4 },
  { n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], val: 5 }, { n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], val: 2 },
];
const die: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 7); ctx.lineWidth = 1.4;
  const ax = t * 0.5, ay = t * 0.37, az = t * 0.13, sc = s * 0.2;
  for (const f of FACES) {
    const nz = rot(f.n, ax, ay, az)[2];
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) =>
      proj(rot([f.n[0] + a * f.u[0] + b * f.v[0], f.n[1] + a * f.u[1] + b * f.v[1], f.n[2] + a * f.u[2] + b * f.v[2]], ax, ay, az), s, sc));
    ctx.globalAlpha = nz > 0 ? 0.85 : 0.18;
    ctx.beginPath(); corners.forEach((c, i) => (i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]))); ctx.closePath(); ctx.stroke();
    if (nz > 0) {
      ctx.globalAlpha = 0.06 + nz * 0.08; ctx.fill();
      ctx.globalAlpha = 0.55 + nz * 0.45;
      for (const [a, b] of PIPS[f.val]) {
        const q = proj(rot([f.n[0] * 1.001 + a * 1.1 * f.u[0] + b * 1.1 * f.v[0], f.n[1] * 1.001 + a * 1.1 * f.u[1] + b * 1.1 * f.v[1], f.n[2] * 1.001 + a * 1.1 * f.u[2] + b * 1.1 * f.v[2]], ax, ay, az), s, sc);
        ctx.beginPath(); ctx.ellipse(q[0], q[1], s * 0.022 * (0.4 + nz * 0.6) + 0.6, s * 0.022, 0, 0, TAU); ctx.fill();
      }
    }
  }
};

/* ── Möbius strip ─────────────────────────────────────────────────── */
const mobius: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 6); ctx.lineWidth = 1.1;
  const P = (u: number, v: number): V3 => {
    const r = 1 + (v / 2) * Math.cos(u / 2);
    return [r * Math.cos(u), r * Math.sin(u), (v / 2) * Math.sin(u / 2)];
  };
  const R = (q: V3) => proj(rot(q, 1.0 + Math.sin(t * 0.3) * 0.3, t * 0.25, 0.2), s, s * 0.27);
  for (const v of [-0.8, -0.4, 0, 0.4, 0.8]) {
    const pts = []; for (let i = 0; i <= 120; i++) pts.push(R(P((i / 120) * TAU, v)));
    polyline(ctx, pts);
  }
  for (let i = 0; i < 48; i++) { const u = (i / 48) * TAU + t * 0.2; const a = R(P(u, -0.8)), b = R(P(u, 0.8)); line(ctx, a, b, 0.2 + 0.4 * ((a[2] + 1.5) / 3)); }
};

/* ── Klein bottle (figure-8 immersion) ────────────────────────────── */
const klein: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 5); ctx.lineWidth = 0.9;
  const r = 2;
  const P = (u: number, v: number): V3 => {
    const k = r + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v);
    return [k * Math.cos(u), k * Math.sin(u), Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v)];
  };
  const R = (q: V3) => proj(rot(q, 1.1, t * 0.22, t * 0.05), s, s * 0.13, 8);
  for (let j = 0; j < 10; j++) { const v = (j / 10) * TAU; const pts = []; for (let i = 0; i <= 90; i++) pts.push(R(P((i / 90) * TAU, v))); polyline(ctx, pts); }
  for (let j = 0; j < 22; j++) { const u = (j / 22) * TAU; const pts = []; for (let i = 0; i <= 40; i++) pts.push(R(P(u, (i / 40) * TAU))); polyline(ctx, pts); }
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

/* ── Antikythera-style gear train ─────────────────────────────────── */
function gear(ctx: CanvasRenderingContext2D, cx: number, cy: number, n: number, m: number, a: number, spokes = 4) {
  const rp = (n * m) / 2, ro = rp + m * 0.9, ri = rp - m * 1.0;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const b = a + (i / n) * TAU, w = TAU / n;
    const pts = [[ri, b - w * 0.5], [ri, b - w * 0.22], [ro, b - w * 0.12], [ro, b + w * 0.12], [ri, b + w * 0.22]];
    pts.forEach(([r, ang], k) => { const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang); i === 0 && k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
  }
  ctx.closePath(); ctx.globalAlpha = 0.1; ctx.fill(); ctx.globalAlpha = 0.85; ctx.stroke();
  ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, ri * 0.82, 0, TAU); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, m * 1.2, 0, TAU); ctx.stroke();
  for (let k = 0; k < spokes; k++) { const b = a + (k / spokes) * TAU; ctx.beginPath(); ctx.moveTo(cx + m * 1.2 * Math.cos(b), cy + m * 1.2 * Math.sin(b)); ctx.lineTo(cx + ri * 0.82 * Math.cos(b), cy + ri * 0.82 * Math.sin(b)); ctx.stroke(); }
}
const antikythera: Draw = (ctx, t, s, color) => {
  glow(ctx, color, 5); ctx.lineWidth = 1.1;
  const m = s * 0.016;
  const g1 = { n: 38, x: s * 0.42, y: s * 0.46 };
  const n2 = 16, a2 = -0.35, n3 = 24, a3 = 1.15;
  const d12 = ((g1.n + n2) * m) / 2;
  const g2 = { x: g1.x + d12 * Math.cos(a2), y: g1.y + d12 * Math.sin(a2) };
  const d23 = ((n2 + n3) * m) / 2;
  const g3 = { x: g2.x + d23 * Math.cos(a3), y: g2.y + d23 * Math.sin(a3) };
  const th1 = t * 0.25;
  const th2 = -(g1.n / n2) * (th1 - a2) + a2 + Math.PI - Math.PI / n2;
  const th3 = -(n2 / n3) * (th2 - a3) + a3 + Math.PI - Math.PI / n3;
  // the zodiac dial around the great wheel
  const rd = (g1.n * m) / 2 + m * 2.6;
  ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(g1.x, g1.y, rd, 0, TAU); ctx.stroke();
  for (let i = 0; i < 72; i++) { const b = (i / 72) * TAU; const l = i % 6 ? m * 0.6 : m * 1.4; line(ctx, [g1.x + rd * Math.cos(b), g1.y + rd * Math.sin(b)], [g1.x + (rd - l) * Math.cos(b), g1.y + (rd - l) * Math.sin(b)], 0.45); }
  gear(ctx, g1.x, g1.y, g1.n, m, th1, 4);
  gear(ctx, g2.x, g2.y, n2, m, th2, 3);
  gear(ctx, g3.x, g3.y, n3, m, th3, 5);
  // pointer on the great wheel
  ctx.globalAlpha = 0.95; ctx.lineWidth = 1.6;
  line(ctx, [g1.x, g1.y], [g1.x + rd * 0.95 * Math.cos(th1 * 0.4), g1.y + rd * 0.95 * Math.sin(th1 * 0.4)], 0.95);
  ctx.beginPath(); ctx.arc(g1.x + rd * Math.cos(th1 * 0.4), g1.y + rd * Math.sin(th1 * 0.4), 2.6, 0, TAU); ctx.fill();
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

export const FIGURES: Record<string, Draw> = { dodecahedron, die, mobius, klein, gauss, antikythera, fibonacci, euler };
export type FigureKind = keyof typeof FIGURES;

/** One shared loop for every [data-figure] canvas; pauses off-screen. */
export function startFigures() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = [...document.querySelectorAll<HTMLCanvasElement>('canvas[data-figure]')];
  const live = new Set<HTMLCanvasElement>();
  const items = nodes.map((c) => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const size = c.clientWidth || Number(c.dataset.size) || 160;
    c.width = c.height = Math.round(size * dpr);
    const ctx = c.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const color = getComputedStyle(c).color;
    return { c, ctx, size, color, draw: FIGURES[c.dataset.figure!], seed: Math.random() * 100 };
  });
  const frame = (ms: number) => {
    const t = ms / 1000;
    for (const it of items) {
      if (!live.has(it.c) || !it.draw) continue;
      it.ctx.clearRect(0, 0, it.size, it.size);
      it.ctx.save(); it.draw(it.ctx, t + it.seed, it.size, it.color); it.ctx.restore();
    }
    if (!reduce) requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? live.add(e.target as HTMLCanvasElement) : live.delete(e.target as HTMLCanvasElement))), { rootMargin: '120px' });
  nodes.forEach((n) => io.observe(n));
  if (reduce) { items.forEach((it) => live.add(it.c)); setTimeout(() => frame(12000), 50); }
  else requestAnimationFrame(frame);
}
