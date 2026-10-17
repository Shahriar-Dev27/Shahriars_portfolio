# Mobile View Fixes Implementation Plan

> **For agentic workers:** Execute task-by-task, in the order given. Tasks 1-8 all edit `style.css`, so per the agency rule (never run two tasks that touch the same file in parallel) they run **strictly one after another**. Task 9 is read-only. Tasks 10 and 11 are blocked on human answers. Steps use checkbox (`- [ ]`) syntax for tracking. Anchor every edit on the **selector text**, not on line numbers: line numbers below are from the tree as it was when this plan was written, and they shift after every task.

**Goal:** Fix the verified mobile-view problems of the portfolio (tiny text, misaligned project rows, small tap targets, edge-flush horizontal scrollers with heavy scrollbars, a stray focus ring on the hero heading, a crowded hero, a cramped Process intro), audit the areas nobody has checked yet (mobile menu, project dialog, 360/320 px, landscape phones), and keep desktop and tablet rendering unchanged.

**Architecture:** CSS-only fixes. Almost all rules go inside the existing mobile media queries in `style.css`: `@media (max-width: 47.99rem)` (starts ~4627, closes ~5601) and `@media (max-width: 23.5rem)` (~5604-5649). Task 1 adds one new "mobile type floor" block right after the landscape block (~5689-5765) with a combined media query, so the floor also covers landscape phones. The only inherently global rule is Task 6 (`#hero-title:focus`), which intentionally changes desktop too. No HTML changes. No JS changes (except Task 10, and only if the human picks option B or C).

**Tech Stack:** Static site, no build step, no test runner (`package-lock.json` has no packages). Plain `index.html` + `style.css` (~6074 lines) + `script.js` (~2756 lines), GSAP 3.13 + ScrollTrigger + Lenis from CDN. Fonts: Inter (body), Space Grotesk (display), Space Mono (mono labels). Verification uses headless Edge over CDP (harness in Appendix A).

**Spec (each reported problem, verified against code and a live headless-Edge run; corrections in bold):**

1. **Text too small.** Verified. At 390x844 there are 97 visible text elements below 11 px across ~27 selectors (full table in Task 1). **Corrections:** the generic `.section-label` is already 11.5 px (`var(--font-size-xs)`); the "10.2 px section labels" are only the four `dt.section-label` inside `.profile-notes` (mobile override `font-size: 0.64rem`, ~5015). The earlier "~40 elements" count was capped at 40 by the script and included hidden elements (header nav, side coordinates, hero stamp, custom cursor). Filter buttons are 9.28 px (`0.58rem`, ~5243) from 377 to 767 px and 8.32 px (`0.52rem`, ~5642) at 376 px and below, so **both 360 and 320 hit the 0.52rem rule**. Measured: the label "EXPERIMENTS" in Space Mono 700 is 74.1 px wide at 11 px with 0 letter-spacing; one filter cell has ~78 px of content width at 390, ~73 px at 360 and ~63 px at 320. So 11 px fits one row down to 377 px, but **cannot fit one row at 376 px and below**. Task 2 handles that.
2. **Project rows wrap inconsistently.** Verified. Cause: the base `.project-card__aside` (~2829) sets `align-items: flex-end; text-align: right`. The mobile override (~5265) switches to `flex-direction: row; align-items: baseline` but never resets `text-align`, so the tag shrinks inside the row and wraps right-aligned. At 390 BizGuide fits on one line and the other two wrap. At 360 and 320 **all three** wrap. **Thumbnails:** the markup already exists. `renderProjectCards()` (script.js ~1679-1695) renders `.project-card__thumb` with a lazy `<img>` for every card. It is a cursor-following hover preview, hidden on touch devices by two `display: none !important` rules (style.css ~2933 and ~5668). The source PNGs are big: BizStudio 1.03 MB, CareCompass 0.35 MB, gocart 0.80 MB. That is Task 11 (optional, needs a human decision).
3. **Tap targets under 44 px.** Verified. Footer nav links are 28-49 x 18 px and footer social links are 64-85 x 20 px (both under `.site-footer__middle`). **Also found:** `.scroll-indicator` in the hero is 173 x 15 px, and `.site-brand` is 42 x 42 px (the mark is `2.6rem`). `.contact-email` is 355 x 23 px. It is a single isolated large-text link, so it passes WCAG 2.5.8 through the spacing exception. Recorded as an accepted exception (ruling R3). The contact-section social links are already 44 px.
4. **Horizontal scrollers.** Verified. `.skill-path` (~5196) has `scroll-snap-align: start` on its buttons and no `scroll-padding-inline`, so proximity snapping scrolls it to `scrollLeft = gutter` and the first card sits at x = 0. Both `.skill-path` and `.process-timeline` (~5384) use `scrollbar-width: thin`, which shows as a grey bar in screenshots. `.process-timeline` uses `scroll-snap-align: center`, so its first card is not flush, but it has the same bar. The site already hides scrollbars this way on `.profile-nav__list` (~4874-4888), so Task 5 reuses that pattern.
5. **Hero h1 focus ring.** Verified at 390 **and at 1440 desktop**. When the loader finishes by itself, `document.activeElement` is `h1#hero-title`, it matches `:focus-visible`, and the global `:focus-visible` rule (~229) draws a 3 px orange outline. Cause: script.js ~551 focuses the Skip button programmatically before any user input, then `cleanup()` (~440) moves focus to `#hero-title`. Chromium keeps the keyboard-style focus modality, so the ring shows. It does **not** happen when the user taps Skip with a real pointer. **Also:** Back to top (script.js ~2543-2544) focuses `#hero-title` too. **Correction:** the rings seen on the menu link and the dialog Close button in earlier screenshots came from the synthetic `element.click()` in the old script. With real pointer input (Appendix A harness) they do not appear.
6. **Hero crowding.** Verified at scroll 0. The ghost word glyph box overlaps the h1 by ~62 px at 390, ~97 px at 360 and ~90 px at 320, at `rgb(240 237 230 / 14%)`. The portrait image box starts above the mode selector bottom by 56 px at 390, 107 px at 360 and 126 px at 320 (the image has headroom), and the hair visually touches the selector. **Note:** the ghost word text changes with the mode (Design / Develop), so check both modes.
7. **Smaller items.**
   - 7a, Process intro: verified. `.section-intro__identity` is a flex row. The Process header uses a `p.section-label` "04 / Process" plus a two-line `div` instead of the index-number pattern, so the two sit side by side and look cramped.
   - 7b, Profile rail and header: **corrected**. `.site-header` is `position: absolute` (~453), not fixed or sticky. It scrolls away with the hero at every width (desktop included). The sticky `.profile-rail` does not cover it. In the profile section the menu button is off-screen (measured `top = -1224`), and the same is true for every section below the hero. This is a design decision (Task 10).
   - 7c, Contact marquee: **corrected, no change needed**. It already has `aria-hidden="true"` (index.html:1089). script.js ~2198-2206 replaces its text with three spans *inside* that element, so they inherit it. The clipping comes from the intentional bleed (`position: absolute; bottom: -0.12em; overflow: hidden`). Recorded as ruling R4.

**Pre-audit of the unchecked areas** (done while planning, with real pointer input; Task 9 re-runs this after the fixes):
- Mobile menu at 390: rows are 355 x 60 px, no horizontal or vertical overflow, Escape closes it, and there is no focus ring when it is opened by tap. It only lists Index / Work / Profile / Contact.
- Project dialog at 390: no horizontal overflow, but the technology chips (`.project-dialog__story li`) are 9.92 px (fixed in Task 1).
- No horizontal page overflow at 390x844, 360x740, 320x640 or 844x390.
- Landscape 844x390 uses the tablet layout plus the landscape block (~5689). There are 24 kinds of sub-11 px text there. The hero is taller than the viewport: the mode selector bottom is at y = 500 with a viewport height of 390, so it is off-screen at load. The dialog navigation hint is 9.6 px.
- Not a bug: `.skill-path strong` renders in Georgia on purpose (style.css ~194-203, the "Brier accent" for skill labels).

**Global Constraints:**
- **Desktop and tablet stay unchanged.** Every rule goes inside `@media (max-width: 47.99rem)`, `@media (max-width: 23.5rem)`, or the new combined block from Task 1. The only exception is Task 6, which is global on purpose. The combined block also matches short landscape viewports (`(orientation: landscape) and (max-height: 39rem) and (max-width: 64rem)`), the same condition the existing landscape block already uses (ruling R1).
- **The working tree is dirty**: uncommitted loader work in `index.html`, `script.js`, `style.css` and the untracked `docs/`. Never revert, reformat or restage it. Task 0 checkpoints it first (open question OQ1). Until then, nobody runs `git add -A`, `git add .`, `git checkout -- <file>` or `git stash`.
- No new dependencies and no new files in the repo. The audit harness lives outside the repo (Appendix A).
- Smallest change per problem. Do not touch unrelated rules. Keep the existing CSS style: 2-space indent inside media blocks, one declaration per line, `rem` units, existing tokens (`var(--gutter)`, `var(--color-accent-primary)`), modern `rgb(r g b / a%)` colour syntax, a blank line between rules, and child combinators written `>` with no spaces (as in the existing file).
- Type floor tokens (Task 1): `--type-floor-label: 0.6875rem` (11 px) for mono uppercase labels, tags, badges and captions; `--type-floor-text: 0.75rem` (12 px) for readable values. Body copy is already 13.8-16 px.
- Every task must leave all four phone viewports with `scrollWidth === clientWidth` (no horizontal overflow) and with no control whose text overflows it (`clippedControlText` empty).

**Review Focus (for code-reviewer):**
- **Desktop and tablet regression:** compare the harness output at `1440 900 --desktop`, `1024 768 --desktop` and `820 1180` against the baseline JSON. `tinyTextUnder11px`, `tapTargetsUnder44` and `overflow` must be identical. The only allowed difference is `focusAfterLoad.outline` after Task 6.
- **Cascade:** a new mobile rule must not be silently beaten by a later block: the 23.5rem block, the coarse-pointer block (~5652, uses `!important`), the landscape block (~5689), or the `min-width: 64.01rem` block (~5914, desktop only). It must also not beat a rule it should not (for example, the floor must not enlarge anything on tablets).
- **No layout breakage at 320 px:** no overflow, no clipped control text, and wrapped text stays left-aligned and readable.
- **Task 6 accessibility reasoning** (see that task).
- No selectors added for elements that are hidden on mobile anyway (header nav, side coordinates, hero stamp, explore and scroll mode buttons, custom cursor, profile rail header and footer).
- Selector anchors match the current file. No unrelated hunks. The loader work is untouched.

---

## Verification Method (used by every task)

**Harness:** `C:/Users/SHAHRI~1/AppData/Local/Temp/claude/e--Professional-Web-portfolio-project-Shahriars-portfolio/3c5e97a4-1ad5-4845-a4e3-fd0f01b6b7f7/scratchpad/mobile-audit.mjs`. It already exists and has been tested. If you cannot reach that path, save Appendix A verbatim into your own scratchpad. Run it **from your scratchpad directory** (it writes `audit-<tag>.json`, screenshots and a temporary Edge profile into the current directory):

```bash
node mobile-audit.mjs 390 844 m390 --shots      # phone portrait
node mobile-audit.mjs 360 740 m360 --shots
node mobile-audit.mjs 320 640 m320 --shots
node mobile-audit.mjs 844 390 l844 --shots      # landscape phone, tablet layout + landscape block
node mobile-audit.mjs 740 360 l740 --shots      # landscape phone, mobile block + landscape block
node mobile-audit.mjs 1440 900 d1440 --desktop  # desktop regression
node mobile-audit.mjs 1024 768 d1024 --desktop  # small desktop regression
node mobile-audit.mjs 820 1180 t820             # tablet regression (mobile emulation)
```

Each run takes about 40 s. Delete the `edge-profile-*` folders afterwards. What the harness does:
- Opens `index.html` over `file://` with `Emulation.setDeviceMetricsOverride` and touch emulation, and lets the loader finish **without** Skip.
- Records `focusAfterLoad`, then `heroAtLoad` (ghost word / h1 overlap, mode selector and portrait geometry, measured before any scroll).
- Scrolls the whole page (taking screenshots with `--shots`) and records `menuButtonInProfileSection`.
- Collects page metrics: `overflow`, `tinyTextUnder11px` (visible text only, grouped by selector), `tapTargetsUnder44`, `clippedControlText`, `projectAsides`, `scrollers`, `processIntro`, `marqueeAriaHidden`, `headerPosition`.
- Opens the mobile menu and the first project dialog with **real pointer input** (CDP `Input.dispatchMouseEvent`, not `element.click()`), so `:focus-visible` behaves like on a real device.

**Baseline (before any fix, taken from the current dirty tree):** `.../scratchpad/mobile-baseline/` holds `audit-t390.json`, `audit-t360.json`, `audit-t320.json`, `audit-tland.json` (844x390), `audit-d1440.json`, `audit-d1024.json`, `audit-tab820.json` and the full set of 390 screenshots (`t390-*.jpg`, including `t390-menu.jpg` and `t390-dialog.jpg`). Do not overwrite these. Use new tags.

**Per-task evidence for the reviewer:** the relevant JSON fields before and after, plus the named screenshots.

## Task Map: lanes, files, regions, size, dependencies

There is no backend and no API contract, so nothing is tagged `[backend]`. Task 0 is `[shared]` because everything depends on it.

| # | Lane | Problem | File(s) and region (anchor selectors) | Size / tier | Depends on |
|---|---|---|---|---|---|
| 0 | [shared] | Baseline checkpoint | git only (no source edits) | mechanical, orchestrator + git-publisher | OQ1 answer |
| 1 | [frontend] | 1 type floor | `style.css`: NEW block after the landscape block; delete 5 superseded `font-size` lines in the 47.99rem block (profile, contact regions) | medium, judgment on regressions: `frontend-developer` | 0 |
| 2 | [frontend] | 1 filters fit | `style.css`: `.project-filters button` in 47.99rem block (~5239); `.project-filters button` in 23.5rem block (~5641) | small, exact CSS: `frontend-developer-quick` | 1 |
| 3 | [frontend] | 2 project rows | `style.css`: `.project-card__aside`, `.project-card__cue` in 47.99rem block (~5265-5274) | small, exact CSS: `frontend-developer-quick` | 1 |
| 4 | [frontend] | 3 tap targets | `style.css`: 47.99rem block header (`.mobile-menu-button`, ~4649), hero bottom (`.hero__bottom>p:last-child`, ~4788), footer (`.site-footer__middle>nav:first-child`, ~5583) | small, exact CSS: `frontend-developer-quick` | 1 |
| 5 | [frontend] | 4 scrollers | `style.css`: `.skill-path` (~5196) and `.process-timeline` (~5384) in 47.99rem block | small, exact CSS: `frontend-developer-quick` | 0 (sequenced after 4) |
| 6 | [frontend] | 5 focus ring | `style.css`: global, right after the `:focus-visible` rule (~229-233) | tiny, exact CSS: `frontend-developer-quick` | 0 (sequenced after 5) |
| 7 | [frontend] | 6 hero crowding | `style.css`: 47.99rem hero region (`.hero__background-word` ~4681, `.hero__portrait-motion-layer` ~4686, `.hero__content--left` ~4700); 23.5rem block (`.hero__background-word` ~5613, `.hero__portrait-motion-layer` ~5617) | medium, **design judgment**: `frontend-developer` | 1, 4 |
| 8 | [frontend] | 7a process intro (7c no-op) | `style.css`: 47.99rem block "Shared Section Intro" (`.section-intro__identity`, ~4806) | tiny, exact CSS: `frontend-developer-quick` | 0 (sequenced after 7) |
| 9 | [frontend] read-only | audit (menu, dialog, 360/320, landscape) | none (screenshots + JSON only) | medium, judgment: `frontend-developer` | 1-8 |
| 10 | [frontend] | 7b header reachability | **conditional**: option B means `script.js` + `style.css` (47.99rem header region, `.profile-rail`); option C means `index.html` + `style.css` + `script.js` | medium-large, design: `frontend-developer` | OQ2 answer, 9 |
| 11 | [frontend] | 2 thumbnails (optional) | **conditional**: `style.css` 47.99rem projects region and coarse-pointer block (~5668) | medium, design: `frontend-developer` | OQ3 answer, 3, 9 |

**Parallelism:** none between Tasks 1-8 (all edit `style.css`, and the agency rule forbids parallel edits to the same file). The regions are mostly disjoint, so if the orchestrator chooses one git worktree per task and merges, then {5}, {6} and {8} could run beside the others. That is not recommended for tasks this small. Task 9 is read-only, so it can overlap with the human Q&A for OQ2/OQ3. Tasks 10 and 11 must run after 9 and after each other (both edit `style.css`).

**Recommended order:** 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, then 10 and 11 if approved. This matches user impact: problems 1 to 5 first, then 6 and 7, then the audit.

---

## Task 0 [shared]: Baseline checkpoint (no source edits)

**Why:** `style.css`, `index.html` and `script.js` already carry uncommitted loader work. If a developer commits `style.css` for Task 1 without a checkpoint, the loader diff gets swept into the mobile commit, and per-task review diffs (`git diff <task-start-sha>..HEAD`) become unreadable.

- [ ] **Step 1:** Get OQ1 answered (is the loader work finished?).
- [ ] **Step 2 (if yes):** Dispatch `git-publisher` to make one local commit of exactly `index.html`, `script.js`, `style.css`, `docs/plans/loader-improvement.md` and this plan file, message `Improve loader readiness, motion and accessibility`. Pushing is the orchestrator call per the publish rules.
- [ ] **Step 2 (if no):** Do not start Task 1. Developers would have to stage hunks selectively (`git add -p style.css`), and that is error-prone. Escalate.
- [ ] **Step 3:** Record `BASE_SHA` (`git rev-parse HEAD`) in the ledger. Every later task records its own `task-start-sha`.
- [ ] **Step 4:** Confirm the baseline JSON in `.../scratchpad/mobile-baseline/` is still valid. It was captured from this same working tree, so a commit does not change the rendering. Re-capture only if the tree changed before Task 1 starts.

**Verification:** `git status --short` shows no ` M` entries for the three source files, and `git log -1 --stat` lists only the intended files.

---

## Task 1 [frontend]: Mobile type floor (problem 1)

**Files:** `style.css` only.
- Insert a new block **after the closing brace of the landscape block** (`/* 6. Landscape Mobile Viewports */`, closes ~5765) and **before** the comment `/* Kinetic motion language`.
- Delete the five superseded `font-size` declarations listed in Step 3. They live inside `@media (max-width: 47.99rem)`.

**Interface:** produces the custom properties `--type-floor-label` and `--type-floor-text`, which Tasks 2 and 7 may use.

**Selector table** (computed at 390 px, then the target). Only selectors that are visible on phones are included.

| Selector | Now | Target |
|---|---|---|
| `.hero__coordinates` | 9.28 | 11 (label) |
| `.hero__details` (dt) | 9.28 | 11 (label) |
| `.hero__details dd` | 9.28 | 12 (text) |
| `.hero-annotation` | 8.48 | 11 |
| `.mode-selector__option small` | 8.32 | 11 |
| `.hero__bottom` (scroll indicator + caption) | 9.28 | 11 |
| `.profile-nav__mobile-status` | 10.24 | 11 |
| `.profile-card__tag` | 10.56 | 11 |
| `.profile-card__badge` | 9.92 | 11 |
| `.profile-notes>div dt` | 10.24 | 11 |
| `.profile-tags li` (and `--lg`) | 9.92 / 10.88 | 11 |
| `.stack-group__title::before` | 9.92 | 11 |
| `.skill-panel__technologies li` | 10.08 | 11 |
| `.skill-path button>span` | 9.60 | 11 |
| `.project-card__tag`, `.project-card__cue` | 9.92 | 11 |
| `.process-timeline button span` | 9.76 | 11 |
| `.statement-orbit__centre>p` | 9.28 | 11 |
| `.project-dialog__links a`, `.project-dialog__story li`, `.project-dialog__gallery figcaption`, `.project-dialog__navigation p` | 9.6-9.92 | 11 |
| `.availability` | 9.76 | 11 |
| `.site-footer__bottom` | 9.92 | 11 |
| `.contact-metadata div` | 10.88 | 12 (text) |
| `.project-filters button` | 9.28 / 8.32 | **Task 2**, not here |

Excluded on purpose: elements hidden on phones (`.site-navigation a`, `.availability--header`, `.hero__coordinates--side`, `.hero__stamp span`, `.hero-mode__button`, `.back-to-scroll`, `.custom-cursor__label`, `.profile-nav__sub`, `.profile-rail__hint`), image-failure placeholders (`.asset-placeholder strong`, `.hero__portrait-placeholder`, `.project-card__thumb .asset-placeholder`), the absent testimonials section, and the decorative `aria-hidden` SVG `.statement-orbit__text text`, which scales with its viewBox to about 12 px.

- [ ] **Step 1: Record `task-start-sha`** and run the harness at 390, 360, 320, 844x390 and 740x360 (tags `pre1-*`) only if the tree changed since the baseline. Otherwise use the baseline JSON.
- [ ] **Step 2: Insert the type-floor block** at the location above, exactly:

```css
/* 7. Mobile type floor: phones in portrait (max-width 47.99rem) and short landscape phones.
   Labels never render below 11px; readable values never below 12px. */
@media (max-width: 47.99rem), (orientation: landscape) and (max-height: 39rem) and (max-width: 64rem) {
  :root {
    --type-floor-label: 0.6875rem;
    --type-floor-text: 0.75rem;
  }

  .hero__coordinates,
  .hero__details,
  .hero-annotation,
  .mode-selector__option small,
  .hero__bottom,
  .profile-nav__mobile-status,
  .profile-card__tag,
  .profile-card__badge,
  .profile-notes>div dt,
  .profile-tags li,
  .stack-group__title::before,
  .skill-panel__technologies li,
  .skill-path button>span,
  .project-card__tag,
  .project-card__cue,
  .process-timeline button span,
  .statement-orbit__centre>p,
  .project-dialog__links a,
  .project-dialog__story li,
  .project-dialog__gallery figcaption,
  .project-dialog__navigation p,
  .availability,
  .site-footer__bottom {
    font-size: var(--type-floor-label);
  }

  .hero__details dd,
  .contact-metadata div {
    font-size: var(--type-floor-text);
  }
}

/* 7b. Phone-portrait accommodations for the type floor. */
@media (max-width: 47.99rem) {
  /* At 11px the scroll cue and the caption no longer fit side by side down to 320px:
     tighten the tracking and let the caption wrap to two right-aligned lines. */
  .hero__bottom {
    letter-spacing: 0.02em;
  }

  .hero__bottom>p:last-child {
    max-width: 5rem;
  }
}
```

  Why `.profile-tags li` also covers `.profile-tags--lg li`: both selectors have specificity (0,1,1), and this block comes later in the source, so it wins. Why `.profile-notes>div dt` beats `.section-label`: (0,1,2) is higher than (0,1,0).

- [ ] **Step 3: Delete the superseded declarations** inside `@media (max-width: 47.99rem)`, leaving every other declaration of those rules intact:
  - `.profile-nav__mobile-status`: delete `font-size: 0.64rem;`
  - `.profile-card__tag`: delete `font-size: 0.66rem;` (keep `letter-spacing: 0.1em;`)
  - `.profile-notes>div dt { font-size: 0.64rem; }`: delete the whole rule (it has nothing else)
  - `.stack-group__title::before`: delete `font-size: 0.62rem;`
  - `.contact-metadata div`: delete `font-size: 0.68rem;` (keep `grid-template-columns` and `gap`)
- [ ] **Step 4: Verify on phones.** Run the harness at 390, 360, 320, 844x390 and 740x360 with `--shots`.
  - Expected: in portrait, `tinyTextUnder11px` contains **only** the `div.project-filters` button entries (Task 2 fixes those).
  - In landscape, any remaining entries must belong to selectors outside the table (tablet-layout-only elements such as `.profile-nav__sub` and `.profile-rail__hint`). Do not fix them here. List them in your report for Task 9.
  - `overflow` is `[]`, `clippedControlText` is `[]`, and `scrollWidth === clientWidth`.
  - Screenshots: the hero caption wraps to two right-aligned lines and does not touch the scroll cue at 320; the contact metadata label column (`7rem`) still fits "PREFERRED WORK" on one line; profile chips and badges wrap cleanly.
  - Project rows may wrap more than before. That is expected and Task 3 fixes it.
- [ ] **Step 5: Verify desktop and tablet are unchanged.** Run `1440 900 --desktop`, `1024 768 --desktop` and `820 1180`. `tinyTextUnder11px`, `tapTargetsUnder44` and `overflow` must equal the baseline JSON exactly.
- [ ] **Step 6: Commit** `style.css` only, with the message `Mobile: enforce 11px label / 12px text floor`.

