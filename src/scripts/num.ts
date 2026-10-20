// Clickable numbers (replaces the LCD <Seg>). Two independent behaviors:
// 1) count up from 0 the first time a <Num> scrolls into view (unchanged
//    cubic-ease timing from the old seg.ts), and
// 2) a damped rotational wobble per digit on click/tap/Enter/Space —
//    theta(t) = A * e^(-zeta*t) * sin(omega*t), A ~= 18deg, omega = 2*pi*3Hz,
//    zeta tuned so the envelope is down to ~1% by ~900ms. Sampled once into
//    a transform-only WAAPI keyframe list, so it stays on the compositor.
//    Digits start ~60ms apart; a re-click cancels and restarts cleanly.
const A = 18, OMEGA = 2 * Math.PI * 3, ZETA = 5.2, WOBBLE_DUR = 900, STAGGER = 60;

function theta(t: number) {
  return A * Math.exp(-ZETA * t) * Math.sin(OMEGA * t);
}

function buildWobbleKeyframes(stepMs = 16): Keyframe[] {
  const kf: Keyframe[] = [];
  for (let t = 0; t <= WOBBLE_DUR; t += stepMs) {
    kf.push({ transform: `rotate(${theta(t / 1000).toFixed(2)}deg)`, offset: t / WOBBLE_DUR });
  }
  kf.push({ transform: 'rotate(0deg)', offset: 1 });
  return kf;
}
const WOBBLE_KEYFRAMES = buildWobbleKeyframes();

function setDigits(btn: HTMLElement, text: string) {
  const digits = btn.querySelectorAll<HTMLElement>('.num__d');
  [...text].forEach((ch, i) => { if (digits[i]) digits[i].textContent = ch; });
}

function wobble(btn: HTMLElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'ease-out' });
    return;
  }
  btn.querySelectorAll<HTMLElement>('.num__d').forEach((d, i) => {
    d.getAnimations().forEach((a) => a.cancel());
    setTimeout(() => d.animate(WOBBLE_KEYFRAMES, { duration: WOBBLE_DUR, easing: 'linear', fill: 'none' }), i * STAGGER);
  });
}

function countUp(btn: HTMLElement) {
  const target = Number(btn.dataset.num);
  const pad = Number(btn.dataset.pad ?? '2');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || Number.isNaN(target)) { setDigits(btn, String(target).padStart(pad, '0')); return; }
  const t0 = performance.now(), dur = 1100;
  const tick = (t: number) => {
    const k = Math.min(1, (t - t0) / dur);
    const v = Math.round(target * (1 - Math.pow(1 - k, 3)));
    setDigits(btn, String(v).padStart(pad, '0'));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Upgrade every .num: zero it, count up on first scroll into view, wobble on click. */
export function initNums(root: ParentNode = document) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      countUp(e.target as HTMLElement);
    }
  }, { threshold: 0.4 });
  root.querySelectorAll<HTMLButtonElement>('.num').forEach((btn) => {
    setDigits(btn, '0'.repeat(Number(btn.dataset.pad ?? '2')));
    io.observe(btn);
    btn.addEventListener('click', () => wobble(btn));
  });
}
