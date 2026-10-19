# Portfolio image manifest

The interface intentionally shows designed filename placeholders when any listed asset is unavailable. Do not replace these files with random online imagery.

## Active assets (referenced by the site)

### Hero and portrait
- `developer-placeholder.png` — hero portrait, used as the grayscale and colour reveal layers (preloaded). Dimensions 1067×1402.
- `socialpage.png` — statement-section portrait. Dimensions 1122×1402, lazy-loaded.

### Project case studies
- `projects/BizStudio.png` — BizGuide AI cream-and-orange homepage screenshot. Dimensions 1811×841.
- `projects/CareCompass.png` — CareCompass case study image.
- `projects/gocart.png` — gocart case study image.

- projects/A-Day-in-Dhaka.png — user-provided 1920×945 screenshot of the morning traffic scene in A Day in Dhaka: Mama's Tong. Source: https://github.com/Shahriar-Dev27/A-day-In-Dhaka-City-

### Preview
- `screenshotPortfolio.png` — portfolio preview screenshot, embedded in the root README.

## Legacy or unused assets (present on disk but not referenced)

These files exist in the folder but are not linked by `index.html` or `script.js`. Review before launch: wire them up, or remove them if they are no longer needed.

- `shahriar-hero-transparent.png`
- `shahriar-hero.png`
- `about-1.jpg`
- `cc.png`
- `ki.png`
- `vvv.png`
- `Gemini_Generated_Image_okws43okws43okws.jpg`

## Broken references to fix

- `script.js` (around line 2342) configures a fallback portrait at `images/portrait-small.jpg`, but that file is missing from the folder. Restore `portrait-small.jpg` or update the fallback path so the fallback resolves.

## Asset policy

- Keep the declared aspect ratios for any final replacements (hero 1067×1402, statement 1122×1402, BizGuide AI 1811×841). Match project image metadata and preview framing to each screenshot's actual dimensions.
- Keep lower-page images lazy-loaded (`loading="lazy"`, `decoding="async"`).
- Replace generated or temporary imagery with honest project screenshots or final editorial photography before launch. Do not use random online imagery.
