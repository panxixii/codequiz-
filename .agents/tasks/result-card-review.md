# Result card redesign: seal badge hero, chip strengths, quoted advice

The quiz result card moves the match percent out of a thin label-and-bar strip and into the hero as a rotated cinnabar seal under the era/title line. Strengths become wrapped chips, advice becomes a left-ruled quote block, and the closing section is marked by a double rule. Spacing is unified under one `--rc-gap` rhythm. The change is confined to `ResultScreen.tsx` (hero markup only) and `src/index.css` (result-* rules). Card height at 390px is 656px, down from the 721px baseline.

Watch for: the working tree also holds unrelated edits to `src/data/echoLines.ts`, `src/data/questions.ts` and the generator scripts that change visible copy; stage only the card files (confirmed). Height misses the spec's 640px target by about 16px but is below baseline (confirmed, non-blocking). I reviewed the coder's screenshots, not a screenshot of my own (no browser run in this pass).

**Verdict**: APPROVED

## High-level view

The hero now has a clear focal point: a large name, a thin gold rule, the era line, and a stamped seal carrying the percent. This replaces a flat centered stack where name, percent and tagline competed. The progress bar is gone; the percent is the only information it carried.

Below the hero the card reads top to bottom as tagline between hairlines, label-flanked chip row, quoted advice, a quiet "also similar" line, and a double-ruled closing block. The rhythm is consistent and the left-aligned advice is the only non-centered block, which reads well.

Export safety holds. The seal uses border, rgba background, inset box-shadow and rotate only; the one `backdrop-filter` in the file is on `.action-dock`, outside the card. `cardRef` is unchanged and the exported PNG shows the seal, chips, advice block, double rule and inset frame without clipping.

<details>
<summary>Issues (3)</summary>

1. **Unrelated copy/data edits in working tree** (confirmed) — `echoLines.ts`, `questions.ts`, `generate-echo-lines.mjs`, `generate-figures.mjs` and new `scripts/` files are not part of this task; stage and commit only `ResultScreen.tsx` and `index.css`.
2. **Height 656px vs 640px target** (confirmed) — non-blocking; optionally shave about 16px via tagline or footer padding.
3. **Peony watermark absent in exported PNG** (likely) — not compared against the baseline; check that this is not a regression from the lowered peony opacity.

</details>

<details>
<summary>Details</summary>

## Seal badge replaces the match bar

The JSX diff is minimal: `.result-match` and its label, track and fill are removed, and `.result-match-seal` with the original strings "气质契合" and `{matchPercent}%` is nested in `.result-hero`. An `aria-label` was added to the seal, and the visible text remains. In the screenshots the seal sits clear of the era/title line, the rotation is slight, and 37.58% fits without overflow at 4rem. The mobile and export renders are visually equivalent.

## Scope contamination

`git status` shows data and script changes beyond the card. They alter visible copy (echo lines, questions), which the design spec forbids for this task. They are not reviewed here; they need to be excluded or confirmed separately.

## Visual evidence

Reviewed `result-card-mobile390-card.png` and `export-card.png`. Hierarchy is clear (name > seal > tagline > chips > advice), nothing is clipped, and the 纸笺 palette, gold rules and inset frame are kept. The peony is visible behind the lower right in the live card, faint enough not to hurt the advice text contrast. The coder reports 0 overflow offenders at 390 and 1280px; I did not re-measure.

</details>

<details>
<summary>File map</summary>

- `src/components/ResultScreen.tsx` — hero gains the seal; match bar markup removed
- `src/index.css` — result-* rules restyled; seal, chip, quote, double-rule styles added
- Other modified files (`src/data/*`, `scripts/*`) — unrelated, out of scope

Full diff: `git -C /Users/cici/Desktop/project/codequiz- diff`

</details>
