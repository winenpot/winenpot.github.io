// Seven-segment LCD digits (ported from govacho.com). Every digit draws all
// seven bars; unlit ones stay faintly visible like a real LCD's ghost "8".
// Markup: <span data-seg>06</span>. Size = font-size, lit color = currentColor.
const MAP: Record<string, string> = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd',
  6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '',
};
const H = 1, G = 0.45;
const horiz = (y: number, x0: number, x1: number) =>
  `${x0},${y} ${x0 + H},${y - H} ${x1 - H},${y - H} ${x1},${y} ${x1 - H},${y + H} ${x0 + H},${y + H}`;
const vert = (x: number, y0: number, y1: number) =>
  `${x},${y0} ${x + H},${y0 + H} ${x + H},${y1 - H} ${x},${y1} ${x - H},${y1 - H} ${x - H},${y0 + H}`;
const SEG: Record<string, string> = {
  a: horiz(1, 1 + G, 9 - G), g: horiz(9, 1 + G, 9 - G), d: horiz(17, 1 + G, 9 - G),
  f: vert(1, 1 + G, 9 - G), b: vert(9, 1 + G, 9 - G), e: vert(1, 9 + G, 17 - G), c: vert(9, 9 + G, 17 - G),
};
const NS = 'http://www.w3.org/2000/svg';

function digit() {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 10 18');
  svg.setAttribute('class', 'seg-digit');
  svg.setAttribute('aria-hidden', 'true');
  for (const [n, pts] of Object.entries(SEG)) {
    const p = document.createElementNS(NS, 'polygon');
    p.setAttribute('points', pts);
    p.dataset.s = n;
    svg.appendChild(p);
  }
  return svg;
}

export function segment(el: HTMLElement, value: string | number) {
  const text = String(value);
  el.classList.add('seg');
  el.setAttribute('aria-label', el.dataset.label ? `${text} ${el.dataset.label}` : text);
  let ds = [...el.querySelectorAll<SVGElement>(':scope > .seg-digit')];
  if (ds.length !== text.length) {
    el.replaceChildren(...[...text].map(digit));
    ds = [...el.children] as SVGElement[];
  }
  [...text].forEach((ch, i) => {
    const on = MAP[ch] ?? '';
    for (const p of ds[i].children) p.classList.toggle('on', on.includes((p as SVGElement).dataset.s!));
  });
}

/** Upgrade every [data-seg]; count up from 0 when it scrolls into view. */
export function upgradeSegments(root: ParentNode = document) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const el = e.target as HTMLElement;
      const target = el.dataset.seg!;
      const n = parseInt(target, 10);
      if (reduce || Number.isNaN(n)) { segment(el, target); continue; }
      const t0 = performance.now(), dur = 1100;
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        const v = Math.round(n * (1 - Math.pow(1 - k, 3)));
        segment(el, String(v).padStart(target.length, '0'));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.4 });
  root.querySelectorAll<HTMLElement>('[data-seg]').forEach((el) => {
    segment(el, '0'.repeat(el.dataset.seg!.length));
    io.observe(el);
  });
}
