# Result Card Redesign Spec (纸笺 style)

Scope: `src/components/ResultScreen.tsx` (JSX of `<section ref={cardRef} className="scroll-panel result-sheet">` only) and `src/index.css` (result-* rules, ~lines 414-580, plus `.result-sheet.scroll-panel::after` ~143).
Do NOT change: copy text, data, QuizResult shape, reveal logic/animations, action-dock, export-stage, `cardRef`, `.brand-row/.brand-mark/.seal/.stat-chip/.cover-ornament/.cover-line` base rules (shared with the start page).

## Diagnosis of current card
- Every section is centered text with similar weight, so there is no focal point. Name, percent, tagline and advice all compete.
- The match row (label left, % right, bar) is a wide, thin, low-impact strip that splits the hero from its tagline.
- Strengths are a centered vertical list of 3+ lines: tall, and reads like a bullet list.
- Divider styles are inconsistent (border-top at .14/.16 alpha, left red rule, ornaments only in one place).
- Vertical rhythm is ad hoc (1.05/1.15/1.25/0.9rem).

## New layout order (top to bottom)
1. brand-row (unchanged)
2. hero: small kicker ornament, big name, thin gold rule, era · title, and a cinnabar seal stamped at the top-right of the hero holding the match percent
3. tagline (quote style, between two short gold rules)
4. strengths: section label + wrapped chip row
5. advice: bordered/quoted block
6. also-similar (secondary): single quiet line
7. encourage: kicker + text, framed by a double hairline divider
8. footer (subtle)

Match percent moves INTO the hero as a seal badge. The progress bar is removed (its information is the percent; the bar is redundant and costs about 4rem of height). Expected height saving: about 6-7rem at 390px.

## Spacing system
Use one rhythm: section gap `1.1rem` (`--rc-gap`, define on `.result-sheet`), inner gap `0.55rem`. Card padding `1.35rem 1.2rem 1.15rem`. Divider color: `rgba(168,136,88,0.45)` (gold-deep, one value everywhere).

## JSX changes (copy text unchanged, all strings keep exact wording)

Hero (replace `.result-hero` and `.result-match` blocks):
```tsx
<div className="result-hero">
  <p className="cover-ornament" aria-hidden>◆</p>
  <h2 className="result-hero-name">{primary.name}</h2>
  <p className="cover-line" aria-hidden />
  <p className="result-hero-sub">{primary.era} · {primary.title}</p>
  <div className="result-match-seal" aria-label={`气质契合 ${matchPercent}%`}>
    <span className="result-match-seal-label">气质契合</span>
    <span className="result-match-percent">{matchPercent}%</span>
  </div>
</div>
```
- `.result-match`, `.result-match-label`, `.result-match-track`, `.result-match-fill` are deleted (JSX and CSS). Keep `.result-match-percent` class name (reused inside the seal).
- Keep the exact strings "气质契合" and `{matchPercent}%`.

Tagline: unchanged element `<p className="result-tagline">`; styled via CSS only.

Strengths: keep `.result-block`, `.result-section-label` markup as is; `ul.result-tags` / `li.result-tag` markup unchanged (CSS turns them into chips).

Advice, also, encourage, foot: markup unchanged. Optional only: none required.

## CSS spec (per selector)

`.result-sheet`: `padding: 1.35rem 1.2rem 1.15rem; --rc-gap: 1.1rem;` and add an inner decorative frame using `box-shadow: inset 0 0 0 4px rgba(236,220,186,0.0), inset 0 0 0 5px rgba(168,136,88,0.35)` (hairline inset frame, 5px in; no pseudo-element needed since `::before` and `::after` are taken by the grain and peony). box-shadow inset is export-safe. Keep the base `.scroll-panel` shadows by appending the inset to the existing list in `.result-sheet` (it overrides, so repeat the outer two shadows).

`.result-hero`: `margin-top: 1.1rem; position: relative; text-align: center; padding-bottom: 0.2rem;`.
`.result-hero-name`: `font-size: clamp(2.6rem, 13vw, 3.4rem); letter-spacing: 0.16em; padding-left: 0.16em` (offsets trailing letter-spacing so the name is optically centered); `color: #1f170f; text-shadow: 0 1px 0 rgba(255,244,220,0.6)`.
`.cover-line` inside hero: override `.result-hero .cover-line { width: 4.5rem; margin: 0.6rem auto 0.55rem; background: linear-gradient(90deg, transparent, var(--silk-deep), transparent); }` (check base margin first; override only margin/background).
`.result-hero-sub`: `font-size: 0.92rem; letter-spacing: 0.2em; color: #6b5840`.

`.result-match-seal` (new): the 印章.
- `margin: 0.9rem auto 0; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 4.6rem; height: 4.6rem; border: 2px solid var(--seal-deep); border-radius: 6px; color: var(--seal-deep); background: rgba(180,35,24,0.06); transform: rotate(-4deg);` Wrap hero is text-align:center so inline-flex centers; if the implementer prefers, make hero `display:flex; flex-direction:column; align-items:center`.
- Inner hairline: `box-shadow: inset 0 0 0 2px rgba(236,220,186,0.9), inset 0 0 0 3px rgba(143,28,20,0.55);`
- `.result-match-seal-label`: `font-size: 0.6rem; letter-spacing: 0.18em; padding-left: 0.18em; opacity: 0.85;`
- `.result-match-percent`: `font-size: 1.5rem; line-height: 1.1; margin-top: 0.1rem; letter-spacing: 0.02em;` (keep font-family display, color seal-deep).
- Rotation (transform) is supported by html-to-image. Do not use mix-blend-mode, filter or backdrop-filter on it.
- Alternative if the seal looks heavy at 390px: reduce to 4rem square and 1.3rem number. Keep the seal; do not revert to a bar.

`.result-tagline`: `margin: var(--rc-gap) 0 0; padding: 0.8rem 0.4rem; font-size: 1.12rem; line-height: 1.7; letter-spacing: 0.06em; border-top: 1px solid rgba(168,136,88,0.45); border-bottom: 1px solid rgba(168,136,88,0.45);` (replaces the old match top border; gives a framed "题辞" feel). Color #241a10.

`.result-block`: `margin-top: var(--rc-gap); padding: 0; border-top: none;`.
`.result-section-label`: keep flex; `margin-bottom: 0.65rem; font-size: 0.78rem; letter-spacing: 0.22em;` and keep ornaments (the ornament-flanked label already matches the hero).

`.result-tags`: `flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 0.5rem;`.
`.result-tag`: chip: `padding: 0.3rem 0.8rem; border: 1px solid rgba(143,28,20,0.4); border-radius: 999px; background: rgba(255,248,230,0.45); color: #5c4028; font-size: 0.95rem; letter-spacing: 0.1em; line-height: 1.35;`.
`.result-tag::before`: delete the `※` rule (chips make the bullet redundant and add width). The `※` is decoration only, not copy.

`.result-advice`: quoted block: `margin: var(--rc-gap) 0 0; padding: 0.8rem 0.95rem; text-align: left; font-size: 0.9rem; line-height: 1.8; color: #4a3b29; background: rgba(255,248,230,0.35); border-left: 3px solid var(--seal-deep); border-radius: 0 3px 3px 0;` Left-aligned multi-line prose reads better than centered. Plain background color only (no blur).

`.result-also`: `margin: 0.75rem 0 0; padding: 0; border: none; text-align: center; font-size: 0.82rem; color: #6b5840; letter-spacing: 0.06em;` (demote to a quiet single line; remove red left border since advice now owns that motif).

`.result-encourage`: `margin-top: var(--rc-gap); padding-top: 0.9rem; border-top: 3px double rgba(168,136,88,0.55);` (double rule marks the closing section). Kicker: `font-size: 0.72rem; letter-spacing: 0.24em; color: var(--seal-deep)`. Text: `font-size: 1rem; line-height: 1.7; margin-top: 0.4rem`.

`.result-foot`: `margin: 0.9rem 0 0; font-size: 0.6rem; letter-spacing: 0.22em; color: rgba(90,70,42,0.45)`. Keep centered.

`.result-sheet.scroll-panel::after` (peony): keep size, lower opacity to `0.12` so it never sits behind the left-aligned advice text with contrast issues. Keep `z-index:0`; content is already `z-index:1`.

## Responsive
- Mobile-first at 390px: card inner width about 350px; all chips wrap naturally; seal 4.6rem.
- `@media (min-width: 640px)`: optional only; the stage is already `width: min(100%, 420px)`, so no change needed. Do not add a wider layout.

## Export-safety checklist (html-to-image)
- Keep `ref={cardRef}` on the `<section>` and its `scroll-panel result-sheet` classes; exported background color is `#e8d7b5`.
- Only use: borders, border-radius, rgba backgrounds, linear-gradient, inset box-shadow, transform: rotate, text-shadow. Avoid: backdrop-filter, filter, mix-blend-mode on new elements, `clip-path`, CSS masks, `position: sticky`, viewport units for sizing blocks (the `13vw` in `clamp` for font-size is ok, existing code already does this).
- No new images or web fonts; no new `<img>`.
- No animation/transition on card children (card enters via the existing `.result-card-enter` wrapper, which is outside the section).
- `transform: rotate` on the seal: html-to-image clones computed styles, so it renders. Verify in a PNG.

## Implementation steps
1. Edit JSX in ResultScreen.tsx: remove `.result-match` block, add `.result-match-seal` inside `.result-hero` as above.
2. Edit index.css result-* rules per spec; delete `.result-match`, `-label`, `-track`, `-fill` and `.result-tag::before`; add `.result-match-seal*`.
3. Run `pnpm build` (tsc + vite) and `pnpm lint` if present (check package.json scripts); confirm no errors.
4. Visual check: `pnpm dev`, open at 390px, skip through the quiz, check the card after reveal; trigger "保存到相册" and confirm the third PNG shows the seal, chips, and advice block.
5. Acceptance: card height at 390px noticeably shorter than before (target <= about 640px), no text overflow, seal not overlapping the era/title line, all original strings still present.
