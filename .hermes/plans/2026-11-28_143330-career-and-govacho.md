# Career timeline and Govacho team implementation plan

> For Hermes: use the subagent-driven-development skill for task-by-task execution.

Goal: show concurrent work truthfully and connect the studio co-founder’s card to his personal website.

Architecture: keep work records in Astro’s existing collection and draw duration paths in the shared Timeline. Govacho’s static Vite site links across domains with a normal anchor; neither build depends on the other repo.

Progress: [x] T1 [x] T2 [x] T3 [x] T4 — owner approved the personal implementation for publication. Govacho commit `a8f83ac` was pushed to main and its Vercel production deployment succeeded; public DNS for `govacho.com` returned NXDOMAIN on 2026-11-28, and its Vercel deployment URL redirected to login.

Confirmed: Aftab Talayi Persian started June 2026 and is ongoing. The static timeline extends ongoing work through the build month; a later month requires a rebuild.

Verification: personal `pnpm run check`, `pnpm run check:cms`, `pnpm build`, and eleven timeline geometry/browser tests passed. Studio `pnpm build` and nine roster/panel tests passed. Desktop and 375px screenshots captured. Production-preview p95 was 16.7 ms both before and after the timeline revisions; task-duration samples were noisy. The personal build reports existing Astro deprecation and bundle-size warnings. The studio homepage has pre-existing horizontal overflow at 375px; the Team pane itself fits.

### T1 — Work records and title (workstation; completed)

- Govacho root `8b995c2` is dated 2026-10-09: one calendar month earlier is 2026-09-09. Use `2026-09` to match the collection’s month precision. Add Govacho Studio — Co-founder, ongoing, with an outbound link to the studio team page.
- Add Aftab Talayi Persian — Senior Full-stack AI Engineer once start month and end month (or Present) are confirmed. Use the requested title for the personal headline in `src/config/site.ts`; preserve prior employers’ historical titles. Don’t invent responsibilities or achievements.
- Done when both `src/content/work/` records flow into the home chart, `/work/`, individual work entries and `/resume/` without parallel hard-coded lists.

### T2 — Turn start dots into tenure ribbons (workstation)

- In `src/components/Timeline.astro`, map both ends of each tenure to one month axis. Include the final employed month; ongoing roles reach the current month. Preserve genuine gaps. Restore the original dotted sine-wave and run tenures alongside it in separate, non-crossing lanes when they overlap; keep the closest lane almost touching the baseline, with Pars Pardaz near it. Ribbons are slightly thicker, striped, and marked at both ends.
- Use palette-token strokes and a fine, static highlight for a dim enamel sheen. Hover/focus previews the corresponding ribbon and legend item; click/tap pins a selection and brings that ribbon forward. The selected ribbon also thickens, so color isn’t the only cue. Provide a compact dismissible detail card with full organization, role, dates and work link. No continuous animation.
- Keep names in wrapping HTML rather than stamping them on the paths. Keep every role selectable from a labeled legend with 44px targets, including at crossings and on phones. At 375px thin year labels, not employer names. All work links remain usable without JS.
- Done when real concurrent roles can be picked independently, the Aftab name fits, and Escape, touch and keyboard selection work on both timeline instances.

### T3 — Studio roster (workstation; independent of T2)

- Replace the placeholder in `../govacho.com/team/index.html` with a framed, decorative silhouette, member name, Co-founder role and descriptive personal-site link to `https://winenpot.github.io/`. Default to Ashkan Ranjbar (Vincent Law) so the destination identity is recognizable. Use the same card treatment for other confirmed members; don’t fabricate names or websites.
- Give each card a stable above/below link placement derived from its member identifier. Vary the composition without moving a link on reload or keyboard focus. Connect the home Team entry to the roster; leave desk photos alone.
- Done when the studio home leads to the team card and its visible link leads to the personal site without JavaScript-dependent navigation from the roster.
- Home Team pane: show a small cog-framed silhouette and nickname only for each member, alternating nickname above and below the picture by displayed order. Keep the larger numbered cog anchored on the right, at least twice the picture size. The main Team page holds full names, roles and personal links. The pane retains its Team-page navigation and close control; reduced motion keeps it usable.

### T4 — Verification and owner review (workstation)

- Run `pnpm run check`, `pnpm run check:cms`, `pnpm build` in the personal repo and `pnpm build` in the studio repo. Inspect generated routes and reciprocal links. Check interval mapping for overlapping, ongoing and single-month work.
- Give the owner local previews for desktop and 375px review: crossings, long names, pinned card, visible focus, reduced motion and frame/link placement. No commit, push or deploy without request.
