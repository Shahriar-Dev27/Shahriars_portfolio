# Interactive Profile Section with Dynamic Vertical Numeric Navigation

## Overview
Implement an interactive, high-performance **Profile Dossier** section for the portfolio. The layout utilizes an asymmetrical dual-track architecture:
- **Left Rail (Sticky Navigation)**: A pinned vertical command menu featuring monospace numbers (`01`, `02`, `03`, `04`, `05`), active highlight transitions, a dynamic progress gauge track, category tags, and click-to-scroll triggers.
- **Right Track (Content Dossier)**: Structured content cards corresponding to each category (*Bio & Ethos*, *Experience & Trajectory*, *Tech Arsenal & Skills*, *Education & Research*, *Milestones & Honors*) that update the left numeric indicators dynamically as the user scrolls.

This feature is designed to fit the existing editorial dark aesthetic (Space Grotesk, Space Mono, Brier serif, `#090909`, `#ff5a3c` terracotta accent, Lenis smooth scrolling, and GSAP ScrollTrigger).

---

## User Review Required

> [!IMPORTANT]
> **Consolidation of Profile & Skills Sections**:
> The existing page currently has a brief `#profile` section followed by a separate interactive `#skills` tab section. We can either:
> 1. **Consolidate**: Absorb the Skills category directly into the Profile Dossier as Category `03 // Arsenal & Skills` (streamlining the page into fewer, richer interactive sections).
> 2. **Keep Separate**: Keep `#skills` as its own standalone section below and dedicate the Profile Dossier strictly to Personal Bio, Career History, Education, and Achievements.
> *(The default proposed plan adopts Option 1 to create an all-in-one immersive profile dossier, but can easily be configured for Option 2).*

> [!NOTE]
> **Mobile Presentation Strategy**:
> On screens `< 768px`, the vertical sticky rail smoothly converts into a horizontal sticky pill/scrubber dock pinned directly below the site header, allowing quick tap navigation and auto-scrolling horizontal chips without taking up vertical reading space.

---

## Open Questions

1. **Section Categories**: Does the proposed 5-part taxonomy (*01 Bio & Ethos*, *02 Experience & Impact*, *03 Skills & Tooling*, *04 Education & Foundations*, *05 Milestones & Recognition*) cover all your intended content, or would you like to add/rename any (e.g., *Philosophy*, *Certifications*, *Client Testimonials*)?
2. **Left Rail Aesthetic Preference**:
   - **Option A (Laser Rail)**: Vertical hairline track with a growing terracotta progress fill and sliding monospace labels.
   - **Option B (HUD Telemetry)**: Framed numeric badge boxes with micro-metadata tags (`STAMP // 2026`, `ROLE // LEAD`).
   - **Option C (Kinetic Ghost)**: Large background ghost numbers that scale up on active.

---

## Proposed Changes

### 1. HTML Structure & Semantic Markup

#### [MODIFY] [index.html](file:///e:/Websites/The_Portfolio/index.html)
- Replace the minimal `<section class="about-section" id="profile">` with `<section class="profile-dossier" id="profile" aria-labelledby="profile-heading">`.
- Structure the left rail inside `<aside class="profile-rail" aria-label="Profile navigation">` with `<nav class="profile-nav" role="tablist">` containing accessible buttons (`data-profile-target="#profile-..."`, `aria-selected="true/false"`, `data-cursor="GOTO"`).
- Structure the right dossier inside `<div class="profile-content">` with `<article class="profile-card" id="profile-..." data-profile-index="...">` for each category.
- Ensure all landmark roles, `aria-controls`, `aria-live`, and keyboard accessibility tags follow WCAG 2.1 AA standards.

---

### 2. Styling & Motion System

#### [MODIFY] [style.css](file:///e:/Websites/The_Portfolio/style.css)
- Add CSS Grid split-screen layout (`minmax(16rem, 22rem) 1fr`) with responsive fallback down to 1 column.
- Implement `.profile-rail__sticky` with `position: sticky; top: clamp(5.5rem, 10vh, 7.5rem);`.
- Implement `.profile-nav__track` and `.profile-nav__progress` gauge utilizing `var(--color-accent-primary)`.
- Style numeric indices (`.profile-nav__num`) with `Space Mono`, smooth color transitions, active transforms (`translateX(6px)`), and micro-indicator glow.
- Style `.profile-card` panels with hairline borders (`rgba(255, 255, 255, 0.12)`), dark panel elevation (`var(--color-panel)`), typography hierarchy, and active border accent transitions.
- Add mobile media queries (`@media (max-width: 767px)`) for the horizontal sticky scrubber bar.

---

### 3. Scroll Synchronization & Interactivity

#### [MODIFY] [script.js](file:///e:/Websites/The_Portfolio/script.js)
- Add `profileDossierData` object and runtime tracker (`profileRuntime`).
- Create `initProfileDossier()` function:
  - **Scroll-Spy Observer**: Use GSAP `ScrollTrigger` (or fallback `IntersectionObserver`) to detect which card is actively intersecting the reading viewport (threshold around `top 35%`).
  - **Active State Update**: Update active CSS classes (`is-active`), ARIA attributes (`aria-selected="true"`), and animate the vertical progress bar gauge according to the current section scroll position.
  - **Click-to-Scroll**: Bind click events on the rail items to scroll smoothly to the target card using the existing `revealRuntime.lenis` instance with smooth easing and header clearance offset.
  - **Keyboard Navigation**: Allow arrow up/down navigation across tabs with keyboard focus management.
- Register `["Profile dossier", initProfileDossier]` in the main `initApp()` pipeline.

---

## Verification Plan

### Automated / Syntax Verification
- Run syntax and lint checks on HTML, CSS, and JS files.
- Verify that `script.js` parses cleanly without errors using Node/browser runtime.

### Manual & Interactive Verification
- **Scroll Tracking**: Verify that scrolling down and up updates the active numeric indicator on the left immediately without lag or fluttering.
- **Click Navigation**: Verify that clicking `01`, `02`, `03`, `04`, `05` smoothly navigates to the corresponding content card with proper top offset.
- **Lenis Synchronization**: Confirm smooth scroll compatibility with existing Lenis and liquid canvas background without frame drops.
- **Responsive Testing**:
  - Desktop (`1440px`, `1920px`): Check sticky positioning and vertical track alignment.
  - Tablet (`768px - 1024px`): Check compact rail layout.
  - Mobile (`375px`, `414px`): Verify sticky horizontal scrubber bar and touch interactions.
- **Reduced Motion**: Verify that users with `prefers-reduced-motion: reduce` experience immediate state changes without jarring animations.
