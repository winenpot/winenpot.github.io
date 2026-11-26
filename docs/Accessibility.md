# Accessibility improvements

Status: implemented and verified. Published through the GitHub Pages workflow on main.

- Card gradients now sit on an opaque night-colour foundation: stars and
  floating drawings no longer pass through text. Palette and artwork remain.
- Mobile navigation uses visible, wrapping rows instead of a horizontally
  clipped/faded strip. All five links are visible at 320/375/768/1440 px.
- Filter buttons have minimum 44×44 px targets.
- The skip link now transfers keyboard focus to main content; anchor scrolling
  reserves room for the sticky navigation.
- The contact dialog has an accessible description. Clipboard success/failure
  is reported through a visible status/live region, including denied or missing
  Clipboard API handling rather than an unhandled rejection.

Verification: `node scripts/check-accessibility.mjs --performance` with local
Chrome CDP on port 9333 and Astro dev on 4321. The browser regression checks
were red before the fixes and now pass. Existing modal Escape/focus restoration
was characterized, not rewritten. Sampled homepage card-text contrast ratios
range from 6.85:1 to 14.67:1; these samples are not a whole-site WCAG audit.
Keyboard skip, dialog open/Escape/focus return, denied clipboard feedback,
touch targets, and navigation/reflow pass. Desktop and 375px screenshots were
visually reviewed. No screen-reader user testing or complete WCAG certification
was performed.

Astro check: zero errors/warnings/hints. CMS/schema check, production build,
photo build check, and Mars snapshot selection check pass. Existing Markdown
plugin deprecation and large-bundle build notices remain.

Performance smoke check, 1440×900, 2.5s each, live baseline vs local dev with
normal motion and different sky snapshots: idle p95 16.8ms before/after;
scroll p95 16.8ms before and 16.7ms after. Not a controlled benchmark.

The Mars-sky correction is published alongside this pass; see [[Real sky]].
