# Loader Improvement Implementation Plan

> **For agentic workers:** Execute task-by-task, in order. Task 2 depends on Task 1 and touches the same three files, so the two must **never** run in parallel. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the existing loader (big number + split-panel wipe) from first paint with no content flash, drive its progress from real page-readiness signals with a minimum display time and hard timeouts, and refine its motion, copy, and accessibility. Keep the current look.

**Architecture:** A tiny inline `<head>` script decides **before first paint** whether the loader should show. It checks for no reduced-motion preference and no `portfolio-loader-seen` key in sessionStorage. If so, it adds `loader-pending` to `<html>`. CSS shows `.loader` only under `html.loader-pending`, so no-JS visitors and repeat visits never see it. The inline script also owns a no-dependency failsafe and a pre-JS Skip/Escape release, because `script.js` is deferred behind three CDN scripts and may run late. When `initLoader()` in `script.js` runs, it either takes over (adds `loader-running`) or, if the class is absent, just starts the hero entrance. Progress = weighted readiness signals (scripts, fonts, hero image decode, window load), smoothed per frame and gated by a minimum-time schedule.

**Tech Stack:** Vanilla HTML/CSS/JS, no build step, no test runner (`package-lock.json` has no packages). GSAP 3.13 + ScrollTrigger + Lenis 1.3.23 from CDN (`defer`). Google Fonts (`display=swap`). Files: `index.html`, `style.css`, `script.js` at the repo root `e:\Professional\Web\portfolio-project\Shahriars_portfolio\`.

**Spec (user-approved scope):**
1. Real loading + no flash: loader visible from first paint via HTML/CSS. No loader for no-JS, repeat visits in the same session, or reduced motion. Progress is tied to real readiness. Min display time is about 1000 ms, and hard safety timeouts mean it can never hang.
2. Visual polish: smooth, frame-rate-independent count-up, refined panel-wipe and exit easing, staggered text reveal, and a thin progress line. Transforms and opacity only.
3. Accessibility: valid progressbar semantics, reduced-motion fallback, Skip button + Escape kept, correct focus handling, sparse announcements (not every frame), and professional copy.

**Global Constraints:**
- Refine, do not redesign: keep the black split panels, the centred huge tabular number, the mono uppercase small text, and the colour tokens.
- Animate only `transform` and `opacity` (plus `display` toggles). No width/left/top animation. The progress line uses `transform: scaleX()`.
- No new dependencies, tooling, or test framework.
- Do NOT touch unrelated code. **There is an uncommitted change in `index.html` (~line 1040: `data-lenis-prevent` on `.project-dialog__shell`). It must be preserved and must not be reverted or reformatted.**
- `script.js` is `"use strict"`. Match existing style: 2-space indent, double quotes, `const`/arrow functions, guard clauses, `try/catch` around storage.
- The session key string `portfolio-loader-seen` now lives in two places (the inline script and `LOADER_SESSION_KEY` at script.js:4). Add a comment at both sites pointing to the other.
- Inline script must be ES5-safe (`var`, `function`, no arrow functions) and wrapped entirely in `try/catch`. On any error it must leave the page in the no-loader state.

**Review Focus (for code-reviewer):**
- **Can the loader ever get stuck?** Trace these paths: script.js never loads, a CDN hangs, `initLoader` throws, the tab is backgrounded (rAF paused), and fonts/image promises never settle.
- **No flash** in any of these: first visit (loader from first paint), repeat visit (no loader frame at all), no-JS (no loader), reduced motion (no loader).
- Scroll lock is always released and `inert` always removed. The `loader-pending`, `loader-running`, and `body.loader-active` classes are always cleaned up.
- `aria-valuenow` is updated in coarse steps only. No aria-live updates per frame.
- DOM writes per frame are minimal: text written only when the integer changes, and the line transform written each frame.

---

## Interface Contract (both tasks build to this)

### `<html>` classes

| Class | Set by | Removed by | Meaning |
|---|---|---|---|
| `loader-pending` | Inline head script, before first paint, only when (no reduced motion) AND (session key is not `"true"`) | `initLoader` cleanup after the exit; inline `release()` (failsafe / pre-JS skip); `initLoader` skip branch | Loader must be visible; page scroll blocked by CSS |
| `loader-running` | `initLoader` when it takes over | `initLoader` cleanup | `script.js` owns the loader; inline failsafe and pre-JS handlers become no-ops |
| `loader-dismissed` | Inline `release()` (failsafe fired, or Skip/Escape pressed before `script.js` ran) | never (harmless) | Tells `initLoader` the page content was already revealed without the entrance animation, so the hero must be shown immediately (no hide/re-show flash) |

### Inline head script (exact behaviour)

Place it in `index.html` `<head>` **immediately after the `<meta name="theme-color">` line (line 7) and before any `<link rel="stylesheet">`**. A parser-blocking inline script placed after a stylesheet would wait for that CSS. Behaviour, in order, all inside one outer `try { ... } catch (e) { root.classList.remove("loader-pending"); }`:
1. `var root = document.documentElement;` (declare this before the `try` so the `catch` can use it).
2. `reduce` = `!!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)`.
3. `seen` = `sessionStorage.getItem("portfolio-loader-seen") === "true"`, inside its own try/catch so `seen = false` if storage is unavailable (matches current behaviour).
4. If `reduce || seen`, stop and do nothing else.
5. Otherwise:
   - `root.classList.add("loader-pending")`.
   - Write the session key `"true"` in a try/catch. The inline script is now the only writer; `initLoader` no longer writes it.
6. Define `function release()`. It does something only if `root` has `loader-pending` and does NOT have `loader-running`. In that case it:
   - removes `loader-pending`;
   - adds `loader-dismissed`;
   - removes the two listeners below.
7. `setTimeout(release, 8000)`: the failsafe for when script.js never takes over.
8. `document.addEventListener("keydown", onKey)`, where `onKey` calls `release()` if `event.key === "Escape"`.
9. `document.addEventListener("click", onClick)`, where `onClick` calls `release()` if `event.target.closest && event.target.closest("[data-loader-skip]")`.

### Loader markup (final state after Task 2)

```html
<div class="loader" id="loading-screen" role="dialog" aria-modal="true" aria-labelledby="loader-title">
  <div class="loader__panel loader__panel--left" aria-hidden="true"></div>
  <div class="loader__panel loader__panel--right" aria-hidden="true"></div>
  <div class="loader__content">
    <p class="loader__label loader__reveal" id="loader-title">Loading portfolio</p>
    <div class="loader__meter loader__reveal" role="progressbar" aria-labelledby="loader-title"
      aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-loader-meter>
      <span class="loader__progress" aria-hidden="true" data-loader-progress>0%</span>
      <span class="loader__line" aria-hidden="true"><span class="loader__line-fill" data-loader-line></span></span>
    </div>
    <p class="loader__message loader__reveal" aria-hidden="true" data-loader-message>Loading typography</p>
    <button class="loader__skip loader__reveal" type="button" data-loader-skip>Skip intro</button>
  </div>
</div>
```
- **No `hidden` attribute.** The global `[hidden] { display: none !important }` rule (style.css:129) would beat the class gate. CSS controls visibility; JS still sets `loader.hidden = true` at the end.
- **`<output>` is replaced** by the `role="progressbar"` meter. The visual number and the message are `aria-hidden`.
- **Announcements** use the existing global `[data-interaction-announcer]` via `announceInteraction()` (script.js:301). It lives outside the loader, so it survives the loader being hidden.

### Copy (proposed; see open question 1)
- Label / dialog name: `Loading portfolio`
- Messages by displayed percentage:
  - 0-29: `Loading typography`
  - 30-64: `Preparing visuals`
  - 65-94: `Enabling interactions`
  - 95-100: `Ready`
- Skip button: `Skip intro`
- Announced once at finish: `announceInteraction("Portfolio loaded")`

### script.js constants (add directly under `LOADER_SESSION_KEY`, script.js:4)
```js
const LOADER_MIN_DISPLAY_MS = 1000;    // performance.now() timebase (since navigation start)
const LOADER_MIN_COUNT_MS = 600;       // minimum count-up duration from initLoader start
const LOADER_SAFETY_TIMEOUT_MS = 4000; // from initLoader start: force target to 100%
const LOADER_HARD_TIMEOUT_MS = 5500;   // from initLoader start: call finish() directly even if rAF is paused
const LOADER_LEAVE_FALLBACK_MS = 960;  // exit cleanup fallback if transitionend never fires
```

---

## Task 1 [frontend]: First-paint loader contract (no flash, never stuck)

**Files:**
- Modify: `index.html`, lines 4-7 (insert the inline script) and line 48 (remove `hidden`)
- Modify: `style.css`, lines 115-118 (scroll block) and 299-307 (`.loader` display gate)
- Modify: `script.js`, line 4 (comment), lines 315-334 (`startHeroEntrance`), lines 336-436 (`initLoader`)

Keep the existing fake 1250 ms counter, messages, and markup in this task. Task 2 replaces them. This task only changes who decides visibility, and how cleanup and failure paths work.

- [ ] **Step 1: Inline head script.** Add it per the "Inline head script" contract, at the stated position. Include the comment `<!-- keep in sync with LOADER_SESSION_KEY in script.js -->`.
- [ ] **Step 2: Remove `hidden`** from `#loading-screen` (index.html:48). Change nothing else in the markup in this task.
- [ ] **Step 3: CSS gate.**
  - In the `.loader` rule (style.css:299), change `display: grid` to `display: none`.
  - Add `html.loader-pending .loader { display: grid; }` directly after it.
  - Add `html.loader-pending, html.loader-pending body { overflow: hidden; }` next to the existing `body.loader-active` rule (style.css:115).
- [ ] **Step 4: `startHeroEntrance` signature.** Change it to `function startHeroEntrance({ immediate = false } = {})`. When `immediate || appState.reducedMotion`, take the existing reduced-motion branch: add `is-entered` / `hero-entered` and never add `is-entering`. Otherwise behaviour is unchanged. The only caller is `initLoader` (verified by grep).
- [ ] **Step 5: `initLoader` decision and cleanup logic.**
  - `const root = document.documentElement;`
  - **Missing elements** guard: `root.classList.remove("loader-pending")`, then `startHeroEntrance()`, then return.
  - **Skip branch.** The condition is `!root.classList.contains("loader-pending") || appState.reducedMotion`. It must:
    - remove `loader-pending` from `root`;
    - set `loader.hidden = true` and `appState.loaderComplete = true`;
    - call `startHeroEntrance({ immediate: root.classList.contains("loader-dismissed") })`;
    - return.
  - **Delete** the sessionStorage read and write from `initLoader`. The inline script is the source of truth. Keep the `LOADER_SESSION_KEY` constant and add the comment `// keep in sync with inline <head> script in index.html`.
  - **Takeover:** call `root.classList.add("loader-running")` first, then do the existing setup:
    - add `body.loader-active`;
    - call `lockPageScroll("loader")`;
    - set inert, add the listeners, and set focus.
    - Remove the now-redundant `loader.hidden = false`.
  - **Inert set:** change the selector from `"header, main, footer"` to `".skip-link, header, main, footer"`. The skip link sits above the loader (`--z-skip: 100`) and is currently reachable by Tab while the modal is open.
  - **Focus:** `skipButton.focus({ preventScroll: true })`.
  - **Cleanup** is one function, run inside the existing 640 ms timeout for now. It:
    - sets `loader.hidden = true`;
    - calls `root.classList.remove("loader-pending", "loader-running")`;
    - removes `loader-active` from `body`;
    - calls `unlockPageScroll("loader")`;
    - calls `setPageInert(false)`;
    - moves focus to `#hero-title` with `{ preventScroll: true }`, only if focus was inside the loader.
  - **Exception safety:** wrap everything after `loader-running` is added in `try/catch`. On catch: `console.error`, then run cleanup immediately, then `startHeroEntrance({ immediate: true })`. Without this, `runInitializer` would swallow the error and leave the loader up with `loader-running` set, which disarms the inline failsafe.
- [ ] **Step 6: Syntax check.** Run `node --check "e:/Professional/Web/portfolio-project/Shahriars_portfolio/script.js"`. Expect no output and exit code 0.
- [ ] **Step 7: Manual verification.** Run checklist items A1-A7 and report each as pass or fail.

## Task 2 [frontend]: Real readiness progress, a11y semantics, visual polish

**Depends on:** Task 1 completed and approved in review.

**Files:**
- Modify: `index.html` (loader markup block only, about lines 48-57 plus Task 1's offset)
- Modify: `style.css`:
  - one new `:root` token;
  - the loader block (~298-388);
  - one entry in the existing `@media (prefers-reduced-motion: reduce)` block (~line 5757).
- Modify: `script.js`:
  - constants under line 4;
  - new helpers placed directly above `initLoader`;
  - the body of `initLoader`.

- [ ] **Step 1: Markup.** Replace the loader block with "Loader markup (final state)" from the contract, verbatim.
- [ ] **Step 2: CSS polish** (inside the loader block unless stated).
  - **Token:** add `--ease-loader-wipe: cubic-bezier(0.76, 0, 0.24, 1);` to `:root` next to `--ease-exit`.
  - **Panels:** `.loader__panel` gets `width: calc(50% + 1px); will-change: transform; transition: transform 760ms var(--ease-loader-wipe);`. The 1px overlap hides the hairline seam at odd viewport widths.
  - **Leaving panels:** `.loader.is-leaving .loader__panel { transition-delay: 120ms; }`. Keep the existing `translateX(-101%)` / `translateX(101%)`.
  - **Content transition:** `.loader__content` uses `opacity 240ms var(--ease-exit), transform 320ms var(--ease-exit)`.
  - **Leaving content:** `.loader.is-leaving .loader__content` becomes `opacity: 0; transform: translateY(-0.75rem);`. Drop `scale(0.98)`, because scaling huge text blurs it.
  - **Leaving loader:** `.loader.is-leaving { pointer-events: none; }`.
  - **Meter:** `.loader__meter { display: grid; justify-items: center; gap: clamp(1rem, 3vw, 1.75rem); margin-block: clamp(1.5rem, 5vw, 3.5rem); }`. Remove `margin-block` from `.loader__progress` (it moves to the meter). Keep all other `.loader__progress` declarations.
  - **Line track:** `.loader__line { display: block; width: min(14rem, 50vw); height: 1px; overflow: hidden; background: var(--color-border); }`.
  - **Line fill:** `.loader__line-fill { display: block; height: 100%; background: var(--color-accent-primary); transform: scaleX(0); transform-origin: left center; }`.
  - **Stagger:**
    - Set the indexes: `.loader__label { --loader-i: 0; }`, `.loader__meter { --loader-i: 1; }`, `.loader__message { --loader-i: 2; }`, `.loader__skip { --loader-i: 3; }`.
    - Add `@keyframes loader-reveal { from { opacity: 0; transform: translateY(0.75rem); } }`.
    - Apply it with `html.loader-pending .loader__reveal { animation: loader-reveal 640ms var(--ease-standard) both; animation-delay: calc(var(--loader-i) * 90ms + 80ms); }`.
    - It runs from first paint and needs no JS. The reveal animates the **children**; the exit animates the **parent** `.loader__content`, so they never fight over the same property.
  - **Reduced motion:** in the existing reduced-motion block, add `.loader__reveal { animation: none !important; }`. This is defensive; the loader normally never shows under reduced motion.
- [ ] **Step 3: Pure helpers** (exact signatures, placed directly above `initLoader`):
  - `function getLoaderReadinessSignals()` returns `Array<{ id: string, weight: number, promise: Promise<void> }>`. Weights sum to 1, and **every promise resolves and never rejects**.
    - `"scripts"`, weight 0.15: `Promise.resolve()`. Deferred scripts execute in order, so by the time script.js runs, GSAP, ScrollTrigger, and Lenis have already executed or failed. The page works either way.
    - `"fonts"`, weight 0.30: `document.fonts ? document.fonts.ready.then(noop, noop) : Promise.resolve()`.
    - `"hero-image"`, weight 0.30: `document.querySelector(".hero__portrait-image--bw")`, then `img.decode()`, with a catch that resolves. Resolve immediately if the image is missing or `decode` is not a function.
    - `"window-load"`, weight 0.25: resolve immediately if `document.readyState === "complete"`, otherwise on `window` `load` with `{ once: true }`.
  - `function nextLoaderDisplayValue(current, target, deltaMs, tauMs = 160)` returns `current + (target - current) * (1 - Math.exp(-deltaMs / tauMs))`. This is frame-rate-independent exponential smoothing.
  - `function getLoaderMessage(percentage)` returns the copy string for the band in the Copy section.
- [ ] **Step 4: Progress engine in `initLoader`.** It replaces the fake `messages` / `duration` / `update`.
  - **Setup** at takeover:
    - `initStart = performance.now()`;
    - `minEndAt = Math.max(LOADER_MIN_DISPLAY_MS, initStart + LOADER_MIN_COUNT_MS)`;
    - `signals = getLoaderReadinessSignals()`, with each one marked `done` when its promise resolves;
    - `realRatio` = the sum of `weight` over done signals.
  - **Timers:**
    - `safetyTimer = setTimeout(() => { timedOut = true; }, LOADER_SAFETY_TIMEOUT_MS)`;
    - `hardTimer = setTimeout(finish, LOADER_HARD_TIMEOUT_MS)`, which covers a background tab where rAF is paused.
  - **Each frame**, `tick(now)`:
    - `dt = Math.min(64, now - lastFrame)`. The clamp prevents a jump after the synchronous init of the remaining 18 initializers blocks the main thread.
    - `creep = 1 - Math.exp(-(now - initStart) / 1500)`.
    - `signalTarget = timedOut ? 1 : Math.max(realRatio, Math.min(realRatio + 0.15, creep))`. The number never sits frozen, yet never runs more than 15 points ahead of real readiness.
    - `timeCap = Math.min(1, (now - initStart) / Math.max(1, minEndAt - initStart))`, so the count-up is spread over the minimum display time instead of jumping.
    - `target = Math.min(signalTarget, timeCap) * 100`.
    - `displayed = nextLoaderDisplayValue(displayed, target, dt)`.
  - **Render:**
    - `shown = Math.floor(displayed)`. Write `progress.textContent = shown + "%"` **only when `shown` changes**.
    - `line.style.transform = "scaleX(" + (displayed / 100).toFixed(4) + ")"` every frame.
    - Update `meter.setAttribute("aria-valuenow", String(Math.floor(shown / 10) * 10))` only when that decade value changes.
    - Update `message.textContent` only when `getLoaderMessage(shown)` returns a different string.
  - **End:** if `target === 100 && displayed >= 99.5`, call `finish()`. Otherwise call `requestAnimationFrame(tick)`.
- [ ] **Step 5: `finish()`.** It must be idempotent, and is shared by natural completion, Skip, Escape, and the hard timeout.
  - Return early if already `finished`.
  - Cancel the rAF, clear both timers, and remove the keydown and click listeners.
  - Set the end state: progress `100%`, line `scaleX(1)`, `aria-valuenow="100"`, message `Ready`.
  - Add `.is-leaving`, set `appState.loaderComplete = true`, call `announceInteraction("Portfolio loaded")`, then `startHeroEntrance()`.
  - Run cleanup **exactly once**, on whichever happens first:
    - `transitionend` on `.loader__panel--right` with `event.propertyName === "transform"`;
    - `setTimeout(cleanup, LOADER_LEAVE_FALLBACK_MS)`.
  - Cleanup is the Task 1 cleanup function. Remove the old hard-coded 640 ms.
- [ ] **Step 6: Syntax check.** Run `node --check "e:/Professional/Web/portfolio-project/Shahriars_portfolio/script.js"`. Expect exit code 0.
- [ ] **Step 7: Helper checks in the DevTools console.** These are not committed, since the repo has no test runner.
  - `nextLoaderDisplayValue(0, 100, 160)` should be about 63.2.
  - `nextLoaderDisplayValue(50, 50, 16) === 50`.
  - `[0, 29, 30, 64, 65, 94, 95, 100].map(getLoaderMessage)` should give the expected bands.
  - `getLoaderReadinessSignals().reduce((s, x) => s + x.weight, 0)` should be 1, allowing for floating-point error.
- [ ] **Step 8: Manual verification.** Run the full checklist (A and B) and report each item as pass or fail.

---

## Manual Verification Checklist

Serve locally (for example the VS Code Live Server extension, or `npx serve` from the repo root). To simulate a first visit, run `sessionStorage.removeItem("portfolio-loader-seen")` and reload, or use a fresh private window.

**A. Contract (after Task 1; re-run after Task 2)**
- [ ] **A1 First visit:** the loader is the first frame painted. Hero/header content is never visible before it (DevTools Performance with screenshots, Slow 4G).
- [ ] **A2 Repeat visit** (reload in the same tab): no loader frame at all, and the hero entrance plays.
- [ ] **A3 No-JS** (DevTools > Settings > Debugger > Disable JavaScript): no loader, page readable, noscript message visible, page scrolls.
- [ ] **A4 Reduced motion** (DevTools > Rendering > emulate prefers-reduced-motion: reduce, first visit): no loader, and the hero is shown immediately.
- [ ] **A5 script.js blocked** (DevTools > Network > Block request URL for script.js, first visit): the loader releases by itself in about 8 s and the page scrolls. Skip and Escape release it sooner.
- [ ] **A6 Slow CDN** (Slow 3G, or block unpkg.com):
  - before script.js runs, Skip and Escape dismiss the loader;
  - when script.js later runs, the hero does not hide and re-show (no flicker).
- [ ] **A7 Cleanup after every exit path** (natural finish, Skip, Escape, failsafe):
  - wheel, touch, and keyboard scrolling all work;
  - Lenis smooth scroll works;
  - `document.querySelectorAll("[inert]").length === 0`;
  - html has neither `loader-pending` nor `loader-running`;
  - body has no `loader-active` class and no inline `position: fixed`.

**B. Behaviour and polish (after Task 2)**
- [ ] **B1 Fast and cached:** the count-up is smooth from 0 to 100 over about 1 s, with no jumps or stalls, and the line tracks the number.
- [ ] **B2 Slow 3G, cache disabled:** the number keeps creeping but stays tied to real readiness. It reaches 100 no later than about 4.5 s after script.js runs, then exits.
- [ ] **B3 Background tab:** open the page in a background tab, wait 6 s, then switch to it. The loader is already gone or leaves at once. It never hangs.
- [ ] **B4 Skip and Escape:** each exits immediately mid-count. Repeated presses throw no console errors.
- [ ] **B5 Focus:**
  - the Skip button has focus at takeover;
  - Tab cannot leave the dialog (the skip link is inert);
  - after exit, focus is on #hero-title if it was inside the loader;
  - the page never scrolls because of focus.
- [ ] **B6 Screen reader** (NVDA or Narrator):
  - the dialog "Loading portfolio" and the Skip button are announced;
  - there is no per-frame chatter;
  - "Portfolio loaded" is announced once;
  - the progressbar reports its value when navigated to.
- [ ] **B7 Exit motion:**
  - the text fades and lifts first;
  - the panels then wipe apart with in-out easing;
  - there is no seam between the panels;
  - the hero entrance overlaps the wipe.
- [ ] **B8 Stagger:** the label, meter, message, and button fade up in sequence from first paint.
- [ ] **B9 Mobile (320 px and 390 px widths, touch emulation):**
  - the number does not overflow;
  - the line is centred;
  - the Skip button is at least a 44 px tall target;
  - the panels cover the full viewport height.
- [ ] **B10 Performance:** a DevTools Performance recording shows only compositor transform and opacity animation from the loader, apart from the number text update.
- [ ] **B11 No new console errors or warnings** on any path above.

---

## Planner Rulings and Notes
- **Reduced motion:** the loader is skipped entirely, as it is today, rather than shown as a static screen. See open question 2.
- **Session key writer moves to the inline script:** a reload mid-loader will not replay it, which is consistent with "seen once per session."
- **Pre-JS Skip/Escape lives in the inline script:** script.js runs only after the three deferred CDN scripts have executed. Without it, the Skip button would do nothing on a slow CDN.
- **Corrections to the brief:**
  - style.css:4242 is a font-weight :is() list, not a reduced-motion rule. The global reduced-motion block is at style.css:5757 and already squashes animation and transition durations.
  - The pageshow handler at script.js:10 always scrolls to the top. This is pre-existing behaviour and out of scope.
- **Out of scope, pre-existing:** on repeat visits the hero paints visible, then JS adds is-entering (hidden) and fades it back in, a brief hero flash unrelated to the loader. See open question 3.
