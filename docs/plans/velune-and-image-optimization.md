# VELUNE Cleanup + Image File-Size Optimization Implementation Plan

> **For agentic workers:** Execute task-by-task. Each task is self-contained; follow the steps in order and run the listed verification before reporting.

**Goal:** Finish replacing go_cart with VELUNE (delete the old asset and stale docs), and cut the image payload of the page by serving compressed WebP versions of every large image that is in use. Nothing should look different.

**Architecture:** A one-off Node script (`scripts/optimize-images.mjs`, using `sharp`) reads the existing PNG masters and writes `.webp` siblings next to them. Some are downscaled to about 2x their largest rendered size. The site then points every `src`/`href`/`projectData.image` at the `.webp` files. We swap the path directly and do not use `<picture>` (rationale below). The PNG masters stay in the repo so the script can be re-run; visitors never download them.

**Tech Stack:** Static vanilla HTML/CSS/JS on Vercel (no build step), Node 24, ESM (`"type": "module"`), tests via `node --test "tests/**/*.test.js"` (baseline: 338 passing). `sharp@0.35.5` is installed with `--no-save` for this one-off run only. It is NOT added to package.json, so Vercel deploys do not change.

**Spec:**
- User request: "delete go_cart and import the velune. also improve the images."
- Clarified: "improve the images" means **file-size optimization only**: compressed WebP and the same look. No presentation changes. Do not delete other unused legacy images.
- Already done in the working tree (keep, do not redo): VELUNE entry in `script.js` projectData, `index.html` milestone + noscript, `style.css` velune rules, `api/_lib/persona.js`, `tests/persona.test.js`. The live URL `https://gocart-three-nu.vercel.app/` IS the real VELUNE deployment, so keep it everywhere.

**Global Constraints:**
- Do not edit `docs/plans/*.md` historical plans (other than this file).
- Do not delete any image except `images/projects/gocart.png`. All PNG/JPG masters stay. This includes the currently untracked `images/projects/velune.png`, which gets committed as a master.
- Do not change layout, CSS, aspect ratios, or visible presentation. The only DOM changes allowed are `src`/`href`/`width`/`height` attribute values and placeholder filename text.
- Do not modify `package.json` or `package-lock.json`. If `npm install --no-save` touches the lockfile, restore it with `git checkout -- package-lock.json`.
- `npm test` must pass after every task.
- Never touch the gocart **URL** (`gocart-three-nu.vercel.app`). Only the `gocart.png` asset and the "gocart" project naming in docs are removed.

**Why a plain `src` swap instead of `<picture>`:** WebP has worked in every evergreen browser since Safari 14 (2020). Every image consumer in this site assumes one `<img>` with one `src`:
- `configureImageFallback()` (script.js ~1628), which is keyed on the filename
- the dialog swap `image.src = project.image` plus the `[data-dialog-image-name]` placeholder text (script.js ~2022-2033)
- `renderProjectCards()` template strings (script.js ~1800)
- the hero loader `loadHeroImages()` + canvas `drawImage()` (script.js ~771-855)
- the `<link rel="preload">` (index.html:71)

`<picture>` would mean changing all of these, plus the JS templates, for no practical benefit. If anything fails to load, the existing placeholder fallback still runs.

**Review Focus:**
- Every image path referenced in `index.html`/`script.js` exists on disk.
- `width`/`height` attributes and `imageWidth`/`imageHeight` exactly match the generated WebP dimensions.
- The hero preload `href` matches the hero `<img src>` exactly, so there is no double download.
- `package.json`/`package-lock.json` are unchanged.
- Each WebP is smaller than its PNG master.

---

## Image targets (Task 2 produces, Task 3 consumes)

| Source (kept) | Output | Source dims | Resize rule | Expected output dims | Rendered context |
|---|---|---|---|---|---|
| `images/projects/velune.png` (1,919,573 B) | `images/projects/velune.webp` | 1680x898 | max width 1600 | 1600x855 | cards + dialog (dialog <= 92rem, about 1472px) |
| `images/projects/A-Day-in-Dhaka.png` (1,071,535 B) | `images/projects/A-Day-in-Dhaka.webp` | 1920x945 | max width 1600 | 1600x788 | cards + dialog |
| `images/projects/BizStudio.png` (110,152 B) | `images/projects/BizStudio.webp` | 1811x841 | max width 1600 | 1600x743 | cards + dialog default |
| `images/projects/CareCompass.png` (350,815 B) | `images/projects/CareCompass.webp` | 1811x890 | max width 1600 | 1600x786 | cards + dialog |
| `images/developer-placeholder.png` (1,805,661 B, alpha) | `images/developer-placeholder.webp` | 1067x1402 | none (rendered <= 43rem = 688px; x2 = 1376 > native) | 1067x1402 | hero, preloaded, canvas reveal |
| `images/socialpage.png` (1,782,246 B) | `images/socialpage.webp` | 1122x1402 | max width 800 (rendered as a circle of about 300px; x2 plus headroom for scroll-zoom) | 800x1000 | statement orbit centre |
| `images/Certificate/Certificate_img.png` (219,970 B, alpha) | `images/Certificate/Certificate_img.webp` | 988x764 | none | 988x764 | profile certificate card |
| `images/logo/Vite.js.png` (34,281 B) | `images/logo/Vite.js.webp` | 512x512 | 56x56 (28px icon x2) | 56x56 | skills icon |

The other `images/logo/*` files are <= 12 KB and SVGs, or are unused (`wordpress.png`), so leave them alone. The "expected" dims are rounded by sharp. **Task 3 must use the dims the script actually prints**, not this table, if they differ.

---

## Task 1 [frontend]: Remove go_cart remnants

**Files:**
- Delete: `images/projects/gocart.png`
- Modify: `images/README.md` (remove the `projects/gocart.png` bullet from "Legacy or unused assets")
- Modify: `readme.md` line ~89 and line ~202

- [ ] **Step 1:** `git rm images/projects/gocart.png`. If git refuses because of local state, delete the file from disk instead.
- [ ] **Step 2:** In `images/README.md`, delete only the gocart bullet in "Legacy or unused assets". Leave the `velune.png` line (it contains the URL `gocart-three-nu.vercel.app`, which is correct).
- [ ] **Step 3:** In the `readme.md` file tree (~line 89), replace
  `│       ├── gocart.png              # gocart case study image`
  with
  `│       ├── velune.png              # VELUNE case study image (1680×898)`
  (Task 3 renames the tree entries to `.webp` later. Here we only need the gocart entry gone.)
- [ ] **Step 4:** In `readme.md` (~line 202), replace
  `  3. **gocart** — Immersive 3D commerce experience (Experiment/Frontend)`
  with
  `  3. **VELUNE** — Editorial fashion storefront (Experiment/Frontend)`
- [ ] **Step 5: Verify**
  - `test ! -e images/projects/gocart.png && echo OK`
  - `grep -rn "gocart.png" index.html script.js style.css readme.md images/README.md api tests` prints nothing
  - `grep -n -i "gocart" readme.md` prints nothing
  - `npm test`: all pass (338)

---

## Task 2 [frontend]: Add the optimization script and generate the WebP files

**Files:**
- Create: `scripts/optimize-images.mjs`
- Create (generated, committed): the 8 `.webp` files in the table above

- [ ] **Step 1: Install sharp without saving.** From the repo root:
  ```
  npm install --no-save sharp@0.35.5
  git status --porcelain package.json package-lock.json
  ```
  The status must print nothing. If `package-lock.json` changed, run `git checkout -- package-lock.json`. `node_modules/` is already git-ignored.

- [ ] **Step 2: Write `scripts/optimize-images.mjs`** with these exact behaviours:
  - Header comment: purpose, plus the run instructions `npm install --no-save sharp@0.35.5 && node scripts/optimize-images.mjs`. Say that the PNG files are masters and the script only writes `.webp`.
  - Imports: `sharp` (default), `stat`/`writeFile` from `node:fs/promises`, `fileURLToPath`/`pathToFileURL` from `node:url`, `path` from `node:path`.
  - `const ROOT = fileURLToPath(new URL("../", import.meta.url));` and resolve every path against `ROOT`, so the script works from any cwd.
  - `export const JOBS = [ { src, out, resize } ... ]`, one entry per table row, with paths relative to ROOT. Use `resize: { width: 1600, withoutEnlargement: true }` for the four project shots, `{ width: 800, withoutEnlargement: true }` for socialpage, `{ width: 56, height: 56, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }` for Vite.js, and `null` for hero and certificate.
  - `export async function encode(job)`:
    - Build a pipeline: `sharp(srcAbs)`, then `.resize(job.resize)` if set.
    - Encode lossy with `.webp({ quality: 80, alphaQuality: 90, effort: 6, smartSubsample: true }).toBuffer({ resolveWithObject: true })`.
    - If `data.length >= srcBytes`, re-encode the same pipeline with `.webp({ lossless: true, effort: 6 })` and keep whichever buffer is smaller.
    - `writeFile(outAbs, data)`.
    - Return `{ src, out, srcBytes, outBytes, width: info.width, height: info.height }`.
  - Main: run the jobs sequentially. Print one line per job, `src  WxH  srcBytes -> out  WxH  outBytes  (-NN%)`, then a totals line. If any output is still >= its source, print `WARN` and set `process.exitCode = 1`.
  - Guard main with `if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)`.
  - Never delete or overwrite any non-`.webp` file.

- [ ] **Step 3: Run it.** `node scripts/optimize-images.mjs`. Paste the full output table into your report. Task 3 needs these exact output dimensions and byte sizes.
- [ ] **Step 4: Visual sanity check.** Open each `.webp` next to its PNG (Read tool). It should show no visible banding or artifacts at normal zoom. The hero WebP must keep its transparent background. If any image looks degraded, raise the `quality` of that job only to 88 and re-run.
- [ ] **Step 5: Verify**
  - All 8 `.webp` files exist: `ls -l images/projects/*.webp images/developer-placeholder.webp images/socialpage.webp images/Certificate/Certificate_img.webp images/logo/Vite.js.webp`
  - Script exit code is 0, so every output is smaller than its source.
  - `git status --porcelain package.json package-lock.json` is empty
  - `npm test`: all pass. The script lives in `scripts/`, not `tests/`, so the count stays 338.

Do NOT change any references in `index.html`/`script.js`/`readme.md`/`images/README.md` in this task.

---

## Task 3 [frontend]: Point the site at the WebP files, add an asset-integrity test, and update the manifests

**Depends on:** Task 1 (it shares `readme.md`/`images/README.md`) and Task 2 (the files must exist; use the dims and bytes it printed).

**Files:**
- Create: `tests/assets.test.js`
- Modify: `index.html`, `script.js`, `readme.md`, `images/README.md`

- [ ] **Step 1: Write the failing test `tests/assets.test.js`** (ESM, `node:test`, `node:assert/strict`, `readFileSync`/`existsSync` from `node:fs`, same `const ROOT = new URL("../", import.meta.url);` pattern as `tests/persona.test.js`):
  - Read `index.html` and `script.js` as text. Collect every match of `/images\/[A-Za-z0-9_\-./]+?\.(?:png|jpe?g|webp|svg|pdf)/g`.
  - `const KNOWN_BROKEN = new Set(["images/portrait-small.jpg"]);` Add a comment saying this is a pre-existing broken fallback that `images/README.md` "Broken references to fix" already documents, and that it is out of scope.
  - Test "every referenced image exists on disk": for each unique path not in `KNOWN_BROKEN`, check `existsSync(new URL(p, ROOT))`. On failure, include the path in the message.
  - Test "no reference to the removed gocart asset": `index.html`, `script.js`, `readme.md`, `images/README.md` do not contain `gocart.png`.
  - Test "project images are WebP": collect every `image: "..."` value in `script.js` with `/\bimage:\s*"([^"]+)"/g`. It must find exactly 4, and each must end with `.webp`.
  - Test "hero preload matches hero src": the `href` of `<link rel="preload" as="image" ...>` equals the `src` of the `<img>` whose class contains `hero__portrait-image--bw`, and it ends with `.webp`.
  - Test "large raster images are WebP": every `<img src="images/...">` in `index.html` that is not under `images/logo/` and is not `.svg` ends with `.webp`.
  - Run `npm test`. The WebP tests should fail and the existence/gocart tests should pass.

- [ ] **Step 2: `index.html` edits.** Only the attribute values and placeholder text below change:
  - :71 preload, changed to `<link rel="preload" as="image" href="images/developer-placeholder.webp" type="image/webp">`
  - :197 placeholder `<strong>` text, plus both hero `<img src>` at :199 and :202, changed to `images/developer-placeholder.webp` (dims stay 1067x1402)
  - :624 `images/logo/Vite.js.png` changed to `images/logo/Vite.js.webp` (keep width/height 28)
  - :764 `images/Certificate/Certificate_img.png` changed to `.webp`, and fix `width="1000" height="774"` to the real `width="988" height="764"`
  - :1024-1026 aria-label text, `<strong>` text, and `<img src>` changed to `images/socialpage.webp`. Set `width="800" height="1000"` (or the dims Task 2 printed).
  - :1110-1111 dialog default `<strong data-dialog-image-name>` and `<img src>` changed to `images/projects/BizStudio.webp`. Set `width="1600" height="743"` (or the dims Task 2 printed).
- [ ] **Step 3: `script.js` edits.**
  - The four projectData entries (~183, ~214, ~245, ~276) change `image:` to the `.webp` path and `imageWidth`/`imageHeight` to the dims Task 2 printed (expected: BizStudio 1600x743, CareCompass 1600x786, velune 1600x855, A-Day-in-Dhaka 1600x788).
  - ~794-795: the hero loader labels change to `images/developer-placeholder.webp (grayscale layer)` / `(colour layer)`.
  - Do not touch `images/portrait-small.jpg` (~2591) or `CHAT_AVATAR_SRC`.
- [ ] **Step 4: `readme.md` edits.**
  - File tree (~83-90): rename the active entries to `.webp` with output dims. Hero is `developer-placeholder.webp   # Hero portrait (1067×1402)`, socialpage is `socialpage.webp ... (800×1000)`, and the project entries become `BizStudio.webp`, `CareCompass.webp`, `velune.webp`, `A-Day-in-Dhaka.webp` with their 1600-wide dims. Add a `scripts/optimize-images.mjs   # One-off PNG to WebP optimizer (sharp, --no-save)` line. Also add one sentence near the tree: PNG masters are kept alongside, and the site serves the `.webp` files.
  - ~258 code example: the `image:` value `images/projects/BizStudio.png` becomes `images/projects/BizStudio.webp` (keep its existing quote style).
  - Leave `screenshotPortfolio.png` (line 20) alone.
- [ ] **Step 5: `images/README.md` manifest.**
  - In "Active assets", list each served `.webp` with its dimensions and byte size from the Task 2 output, and fill in the missing CareCompass dimensions. Keep the existing descriptions, the VELUNE live URL, and the A-Day source link.
  - Add a section "Source masters (not served)" listing the 8 PNG masters with their original dims and bytes, plus the regeneration command `npm install --no-save sharp@0.35.5 && node scripts/optimize-images.mjs`.
  - Update "Asset policy": the hero stays 1067x1402, the statement image becomes 800x1000 (same ratio), BizGuide AI becomes 1600x743. Add a rule: new raster images ship as WebP generated by the script.
  - Leave the "Legacy or unused" list (as Task 1 left it) and "Broken references" otherwise untouched.
- [ ] **Step 6: Verify**
  - `npm test`: all pass (338 + the 5 new asset tests)
  - `grep -n "\.png" index.html | grep -v "images/logo/" | grep -v "favicon/"` prints nothing
  - `grep -nE "images/[A-Za-z0-9_./-]+\.png" script.js` prints nothing
  - `grep -rn "gocart.png" index.html script.js readme.md images/README.md` prints nothing
  - `git status --porcelain package.json package-lock.json` is empty
  - Optional manual check: `npm run dev:mock` and check four things. The hero reveal works. Project cards and the dialog show all 4 images (VELUNE included) with no placeholder. The statement portrait and certificate render. The Network panel shows `.webp` served as `image/webp` (the dev server already maps `.webp`).
  - Report a before/after byte table: the sum of the 8 PNG masters vs the sum of the 8 WebPs, from the Task 2 output.

---

## Dependencies / parallelism

- Task 1 and Task 2 touch disjoint files, so they **can run in parallel**.
- Task 3 is blocked by **both** Task 1 and Task 2.
- No `[shared]` or `[backend]` tasks. Everything is static frontend assets and docs.

## Self-review

- Spec coverage: delete go_cart (T1), WebP size-only optimization with the same look (T2 + T3, no CSS or layout changes), manifest update (T3 step 5), and the requested verifications (npm test, no `gocart.png` refs, paths exist via the test, before/after bytes) are all covered.
- Out of scope, explicitly: other legacy images, `screenshotPortfolio.png`, the `portrait-small.jpg` broken fallback, favicons, small logos, and historical `docs/plans/*`.
- Consistency: the `imageWidth`/`imageHeight` values in `script.js`, the HTML `width`/`height`, and the README dims all come from the same Task 2 output.
