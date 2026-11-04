# Result card redesign: verification (iteration 2)
Changes this round (`src/index.css` only): seal reduced to the 4rem fallback (number 1.3rem); `--rc-gap` 1.1rem -> 0.85rem; card padding 1.1rem 1.2rem 0.9rem; hero top margin, ornament, cover-line and seal margins tightened; tagline padding 0.55rem and line-height 1.6; section label, advice, also, encourage and foot spacing tightened. JSX unchanged.
## Commands
- `pnpm build` (tsc --noEmit + vite build): PASS.
- Temporary Playwright script (system Chrome) started `vite` on port 5199, clicked through the real quiz flow, took the shots, then killed the server. No source hacks.
## Results
- Card height at 390 viewport: 656px (card width 360px). Previous iteration 743px, original baseline 721px. Now below baseline; the spec's <=640px target is missed by about 16px.
- Desktop (1280): card 420 x 661px.
- Overflow check (scrollWidth > clientWidth on card descendants): 0 offenders at both widths.
- PNG export: html-to-image `toPng` on the card (bg #e8d7b5, pixelRatio 2) succeeded. Seal (rotated), chips, advice block, double rule and inset frame render; no clipping. The peony is not visible in the PNG, same as the previous round. It was not compared against the original baseline.
- Full "保存到相册" 3-shot flow not re-run (it hung in headless Chrome on the unmodified baseline too).
## Screenshots (.agents/tasks/shots/)
- result-card-mobile390-card.png, result-card-mobile390-page.png
- result-card-desktop-card.png, result-card-desktop-page.png
- export-card.png
## Review findings
1. Height: fixed (743 -> 656px, below the 721px baseline).
2. Unrelated edits in `src/data/echoLines.ts` and `scripts/generate-echo-lines.mjs`: not from this task and not touched. They change visible copy, so the caller must exclude them from this change or confirm them separately (for example stage only ResultScreen.tsx and index.css).
3. Peony in PNG vs baseline: not compared (low priority).
