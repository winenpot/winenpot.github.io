// ─────────────────────────────────────────────────────────────────────
//  FLOATING FIGURES — where the living math objects drift on the page.
//  x/y are % of the viewport width / of the page height. depth > 0 makes
//  a figure lag behind the scroll (parallax). tone is any tokens.css hue.
//  `mobile: false` hides it below 640px. Kinds: see src/scripts/math-figures.ts
// ─────────────────────────────────────────────────────────────────────
export interface FloatingFigure {
  kind: 'gauss' | 'fibonacci' | 'euler';
  x: number; y: number; size: number; tone: string; mobile?: boolean; label: string;
}

// Only 3 (was 8) — the rest cost more to draw than they added. No parallax:
// position is fixed, figures only bob in place. See src/scripts/math-figures.ts.
export const FLOATING: FloatingFigure[] = [
  { kind: 'euler',     x: 0.5, y: 12, size: 210, tone: 'var(--periwinkle)', mobile: false, label: "Euler's identity unrolling into a wave" },
  { kind: 'gauss',     x: 85,  y: 49, size: 190, tone: 'var(--periwinkle)', label: 'Random samples building a Gaussian' },
  { kind: 'fibonacci', x: 86,  y: 70, size: 180, tone: 'var(--starlight)', mobile: false, label: 'Fibonacci squares and the golden spiral' },
];
