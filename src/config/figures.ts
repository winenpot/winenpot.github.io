// ─────────────────────────────────────────────────────────────────────
//  FLOATING FIGURES — where the living math objects drift on the page.
//  x/y are % of the viewport width / of the page height. depth > 0 makes
//  a figure lag behind the scroll (parallax). tone is any tokens.css hue.
//  `mobile: false` hides it below 640px. Kinds: see src/scripts/math-figures.ts
// ─────────────────────────────────────────────────────────────────────
export interface FloatingFigure {
  kind: 'dodecahedron' | 'die' | 'mobius' | 'klein' | 'gauss' | 'antikythera' | 'fibonacci' | 'euler';
  x: number; y: number; size: number; depth: number; tone: string; mobile?: boolean; label: string;
}

export const FLOATING: FloatingFigure[] = [
  { kind: 'dodecahedron', x: 87, y: 2,  size: 160, depth: 0.25, tone: 'var(--starlight)', label: 'A dodecahedron, built from the golden ratio' },
  { kind: 'euler',        x: 0.5, y: 12, size: 210, depth: 0.15, tone: 'var(--periwinkle)', mobile: false, label: "Euler's identity unrolling into a wave" },
  { kind: 'die',          x: 89, y: 23, size: 130, depth: 0.35, tone: 'var(--lavender)', label: 'A tumbling die' },
  { kind: 'antikythera',  x: 0.5, y: 36, size: 220, depth: 0.2,  tone: 'var(--mauve)', mobile: false, label: 'An Antikythera-style gear train' },
  { kind: 'gauss',        x: 85, y: 49, size: 190, depth: 0.18, tone: 'var(--periwinkle)', mobile: false, label: 'Random samples building a Gaussian' },
  { kind: 'mobius',       x: 1, y: 60, size: 180, depth: 0.3,  tone: 'var(--lavender)', label: 'A Möbius strip' },
  { kind: 'fibonacci',    x: 86, y: 70, size: 180, depth: 0.22, tone: 'var(--starlight)', mobile: false, label: 'Fibonacci squares and the golden spiral' },
  { kind: 'klein',        x: 40, y: 84, size: 200, depth: 0.12, tone: 'var(--violet)', mobile: false, label: 'A Klein bottle' },
];
