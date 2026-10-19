# Shahriar Islam Dip — Creative Full-Stack Developer Portfolio

> **Expressive design meets reliable engineering.**  
> A production-ready, accessible, and motion-considered portfolio showcasing four self-directed projects and a structured creative process.

---

## 🎯 Overview

This is the personal portfolio of **Shahriar Islam Dip** — a Computer Science and Engineering student at **Independent University, Bangladesh (IUB)** and a creative full-stack developer building expressive, high-performance digital products for startups, premium brands, founders, agencies, and product teams.

**Current focus:** Creative frontend development, UI engineering, full-stack applications, integrations, and product performance.  
**Availability:** Open to selected freelance and collaborative projects.  
**Location:** Dhaka, Bangladesh — available for remote collaboration worldwide.

---

## 📸 Preview

![Portfolio Screenshot](images/screenshotPortfolio.png)

*Hero section with dual-mode selector, interactive portrait reveal, and liquid WebGL background*

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Dual Portfolio Modes** | Toggle between **Design** and **Develop** perspectives — content, terminology, and focus adapt dynamically |
| **Interactive Hero** | Portrait reveal animation, mode selector, and two interaction modes: *Explore* (cursor-driven) and *Scroll* (traditional) |
| **Liquid Background** | WebGL-powered organic background (`liquid-background.js`) — respects `prefers-reduced-motion` |
| **Smooth Scroll** | Lenis-powered smooth scrolling with ScrollTrigger integration |
| **Project Case Studies** | Four self-directed projects with filterable grid, detailed dialogs, and keyboard navigation |
| **Process Navigator** | 7-stage interactive timeline: Discover → Define → Design → Engineer → Test → Launch → Improve |
| **Skills Tab System** | Five expertise areas with dynamic content: Creative Frontend, UI Engineering, Full-Stack, Performance, Integrations |
| **Statement Orbital** | Circular text animation with scroll-linked portrait reveal |
| **Profile & Career Dossier** | 6-section interactive dossier (Bio, Experience, Tech Arsenal, Education, Milestones, Certifications) with sticky navigation rail and scroll-spy |
| **Mobile-First Responsive** | Redesigned mobile experience with horizontal scroll-snap rail, sequential scroll-switching, and text-first certification display |
| **Full Accessibility** | Semantic HTML, ARIA attributes, keyboard navigation, focus management, reduced-motion support, skip links |
| **No-JS Fallbacks** | All critical content readable without JavaScript via `<noscript>` blocks |
| **Custom Cursor** | Context-aware cursor with labeled states (OPEN, EXPLORE, SCROLL, REVEAL, FILTER, STEP, CONTACT, CLOSE, PREV, NEXT, TOP, COPY, CONNECT, MENU) |
| **SID.agent Chat** | AI chat widget answering visitor questions through one Vercel serverless function, using Groq GPT-OSS 120B with an optional NVIDIA GPT-OSS 20B backup; keys stay server-side |

---

## 🛠 Tech Stack

| Category | Technologies |
|----------|--------------|
| **Core** | HTML5, CSS3 (custom properties, container queries), Vanilla ES6+ JavaScript |
| **Animation** | GSAP 3.13 + ScrollTrigger |
| **Smooth Scroll** | Lenis 1.3 |
| **Fonts** | Inter, Space Grotesk, Space Mono (Google Fonts, preloaded) |
| **Architecture** | Single-page, modular CSS/JS, data-attribute hooks, zero build step |
| **Performance** | Preloaded hero assets, lazy-loaded images, `decoding="async"`, resource hints |
| **Accessibility** | WCAG 2.1 AA target, semantic landmarks, live regions, focus trapping in dialogs |
| **AI chat** | Vercel Function (Node 24), Groq (`openai/gpt-oss-120b`), NVIDIA backup (`openai/gpt-oss-20b`) |

---

## 📁 Project Structure

```
The_Portfolio/
├── index.html              # Main HTML document (semantic, accessible, SEO-ready)
├── style.css               # Complete design system + component styles
├── script.js               # Core portfolio logic (modes, interactions, dialogs, filters)
├── liquid-background.js    # WebGL liquid background effect
├── api/                    # AI chat serverless function (/api/chat) and its modules
├── scripts/                # Local dev server (npm run dev / npm run dev:mock)
├── tests/                  # node:test suite (npm test)
├── package.json            # npm scripts only; no runtime dependencies
├── vercel.json             # Function limit and security headers
├── .env.example            # Template for .env.local (real keys are never committed)
├── favicon/
│   ├── SID.png             # Favicon (32×32)
│   ├── github.png          # Social icons
│   ├── Linkdin.png
│   └── gmail.png
├── images/
│   ├── agent-avatar.svg            # SID.agent chat avatar (illustrated portrait)
│   ├── developer-placeholder.png   # Hero portrait (1067×1402)
│   ├── socialpage.png              # Statement section portrait (1122×1402)
│   ├── screenshotPortfolio.png     # Portfolio preview screenshot
│   └── projects/
│       ├── BizStudio.png           # BizGuide AI case study image (1811×841)
│       ├── CareCompass.png         # CareCompass case study image
│       ├── gocart.png              # gocart case study image
│       └── A-Day-in-Dhaka.png      # Storyboard traffic scene screenshot (1920×945)
└── README.md               # This file
```

> **Note:** No build tooling, bundlers, or package managers required. Open `index.html` directly or serve via any static server. The optional AI chat is the only part that needs a runtime: one Vercel serverless function (`api/chat.js`) on Node 24, with no build step and no npm dependencies. The page works without it; the chat widget just needs `/api/chat`.

---

## 🚀 Getting Started

### Quick Preview
```bash
# Option 1: VS Code Live Server (recommended)
# Right-click index.html → "Open with Live Server"

# Option 2: Python
python -m http.server 8080

# Option 3: Node (serve)
npx serve .

# Option 4: PHP
php -S localhost:8080
```
Then open `http://localhost:8080` in your browser.

> The options above serve the static site only, not `/api/chat`, so the chat widget will not answer. For the chat, run `npm run dev` (with a `.env.local`) or `npm run dev:mock` (no keys needed) and open `http://localhost:3000`.

---

## 📱 Mobile Experience Highlights

The portfolio includes a **comprehensive mobile redesign** for the Profile & Career Dossier section:

- **Sticky Top Navigation Rail** — Horizontal scroll-snap pill rail with 6 categories (Bio, Experience, Tech Arsenal, Education, Milestones, Certifications)
- **Sequential Scroll-Switching** — Real-time ScrollSpy highlights active category, auto-centers active pill, tap-to-scroll navigation
- **Redesigned Tech Arsenal** — Organized into 4 category blocks (Frontend Architecture, Backend & APIs, Database & ORM, DevOps & Tools) with interactive chips, icons, and role badges
- **Text-First Certifications** — Pure text credential cards with verified badges, metadata, competency chips, and direct PDF verification actions (no images)

---

## 🎨 Design System

- **Typography**: Inter (UI), Space Grotesk (Display), Space Mono (Code)
- **Color Tokens**: CSS custom properties for light/dark themes
- **Spacing Scale**: Consistent 4px base unit
- **Border Radius**: 4px, 8px, 12px, 16px, full
- **Shadows**: Layered elevation system
- **Motion**: Respects `prefers-reduced-motion`, GSAP for complex animations

---

## ♿ Accessibility

- Semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `aside`, `footer`)
- ARIA labels, roles, and live regions for dynamic content
- Full keyboard navigation with visible focus states
- Focus trapping in modal dialogs
- Skip-to-content link
- Reduced motion support via `prefers-reduced-motion`
- Sufficient color contrast (WCAG 2.1 AA)
- Screen reader optimized content structure

---

## 📄 License

This portfolio is open source for learning and inspiration. Feel free to explore the code, but please do not copy the design or content directly for your own portfolio without attribution.

---

## 🤝 Connect

- **GitHub**: [@Shahriar-Dev27](https://github.com/Shahriar-Dev27)
- **LinkedIn**: [Shahriar Islam Dip](https://www.linkedin.com/in/shahriar-islam-536900229/)
- **Email**: shahriar.dip@example.com

---

*Built with care, curiosity, and a lot of coffee ☕*

### Requirements
- Modern browser with ES6+ and WebGL support
- No server-side dependencies for the site itself. The optional AI chat uses one Vercel serverless function (`api/chat.js`) with zero npm dependencies.

---

## 📖 Section Breakdown

### 1. Hero (`#home`)
- **Portrait reveal** — canvas-based grayscale→color transition on scroll/interaction
- **Mode selector** — Design / Develop tabs (persists in `data-portfolio-mode` on `<body>`)
- **Interaction controls** — Explore (cursor-driven depth) vs Scroll (traditional)
- **Dynamic content** — Kicker, statement, focus, technology, and background word update per mode
- **Annotations** — Five labeled callouts (Interface, Accessibility, Motion, Build, Latency)

### 2. Profile (`#profile`)
- **Identity statement** — "I build digital products that look distinctive, feel effortless, and work consistently and reliably."
- **Education story** — IUB Computer Science & Engineering, framed as system-thinking foundation
- **Three outcomes** — Think with structure, Build with people, Learn beyond class
- **Notes grid** — 7 cards: Experience focus, Selected capabilities (mode-aware), Working philosophy, Currently, Availability, Location, Preferred work

### 3. Expertise (`#skills`)
- **Focus meter** — Visual percentage (design-mode: 88% Creative Frontend)
- **Skill panel** — Dynamic content per tab (title, description, technologies, outcome)
- **Five tabs** — Creative Frontend, UI Engineering, Full-Stack, Performance, Integrations
- **Keyboard navigable** — Arrow keys, Home/End, Enter/Space activation

### 4. Selected Work (`#work`)
- **Three self-directed products:**
  1. **BizGuide AI** — Bangladesh-first business planning product (Full-Stack)
  2. **CareCompass** — Healthcare discovery & appointment booking platform (Full-Stack)
  3. **gocart** — Immersive 3D commerce experience (Experiment/Frontend)
- **Filter tabs** — All, Frontend, Full-stack, Experiments
- **Project dialog** — Case study with overview, challenge, approach, implementation, outcome, technologies, live/source links, gallery, prev/next navigation
- **No-JS fallback** — Static list in `<noscript>`

### 5. Process (`#process`)
- **7-stage timeline** — Discover, Define, Design, Engineer, Test, Launch, Improve
- **Interactive navigator** — Click/keyboard to view stage details (activities, output)
- **Progress indicator** — Visual step progress bar
- **No-JS fallback** — Ordered list

### 6. Statement (`#statement`)
- **Orbital text** — "DESIGN WITH INTENT — ENGINEER WITH PRECISION — SHIP WITH CONFIDENCE —" on SVG circular path
- **Scroll-linked portrait** — Image reveal tied to scroll position
- **Accessible text alternative** — Plain text version for screen readers

### 7. Contact (`#contact`)
- **Email** — `dipshahriar27@gmail.com` (mailto with subject prefill)
- **Copy email button** — Clipboard API with toast feedback
- **Social links** — GitHub, LinkedIn, Email (external, `rel="noopener noreferrer"`)
- **Metadata** — Location, response time, preferred work, local time
- **Marquee** — Decorative scrolling text

### Footer
- **Colophon** — "Designed with intent. Engineered with care."
- **Navigation** — Quick links to all sections
- **Availability + local time** — Dynamic
- **Social icons** — GitHub, LinkedIn, Email
- **Copyright** — Auto-year via `data-current-year`

---

## ⚙️ Customization Guide

### Update Personal Info
| Location | What to Change |
|----------|----------------|
| `<title>`, `<meta property="og:*">` | Site title, description, social preview image |
| `hero__kicker`, `hero__details`, `hero__content--right` | Hero kicker, location, focus, stack |
| `about-education__story` | University, degree, narrative |
| `about-notes` | Experience, capabilities, philosophy, availability |
| `contact-email`, `mailto:` links | Email address |
| Social links (`href`) | GitHub, LinkedIn profiles |
| `data-current-year` (2 locations) | Current year (or use JS to auto-update) |

### Add/Modify Projects
Edit the **project data object** in `script.js` (look for `projectData` or similar). Each project needs:
```javascript
{
  id: 'bizguide-ai',
  number: '01',
  type: 'Self-directed project',
  caseType: 'Full-Stack',
  title: 'BizGuide AI',
  year: '2026',
  role: 'Product Design / Full-Stack Development',
  image: 'images/projects/BizStudio.png',
  imageAlt: 'Descriptive alt text',
  liveUrl: 'https://...',        // optional
  repoUrl: 'https://...',        // optional
  overview: '...',
  challenge: '...',
  approach: '...',
  implementation: '...',
  result: '...',
  technologies: ['Next.js', 'TypeScript', 'Tailwind', 'Supabase', '...'],
  gallery: [                     // optional additional images
    { src: '...', alt: '...' }
  ]
}
```
Then add corresponding filter classes in HTML (`data-project-filter`).

### Modify Skills
Update the **skills data** in `script.js`. Each skill tab needs:
```javascript
{
  id: 'creative-frontend',
  label: 'Design-focused practice',
  title: 'Creative Frontend',
  description: '...',
  technologies: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'Motion'],
  outcome: 'Interfaces that feel distinctive without sacrificing usability or performance.',
  focusPercent: 88  // design mode
}
```

### Adjust Process Stages
Modify **process data** in `script.js`:
```javascript
{
  index: '03',
  label: 'Experience',
  title: 'Design',
  description: 'Shape the visual system, responsive layouts, interaction language, and reusable interface patterns.',
  activities: [
    'Design system & component library',
    'Responsive layout architecture',
    'Interaction & motion specifications',
    'Accessibility annotations',
    'Design QA & handoff'
  ],
  output: 'Figma design system, annotated prototypes, component specs, motion guidelines, accessibility checklist.'
}
```

### Theme & Design Tokens
All visual tokens live in `style.css` under `:root`:
- **Colors** — `--color-bg`, `--color-fg`, `--color-muted`, `--color-accent`, `--color-border`, `--color-focus`
- **Typography** -- `--font-sans`, `--font-display`, `--font-mono`, fluid type scale `--fs-*`
- **Spacing** — `--space-*` (4px base unit)
- **Radius** — `--radius-*`
- **Shadows** — `--shadow-*`
- **Transitions** — `--transition-*`
- **Z-index** — `--z-*`

### Reduce Motion
The portfolio respects `@media (prefers-reduced-motion: reduce)`:
- Liquid background pauses
- GSAP animations disable
- Lenis smooth scroll disables
- Orbital animation pauses
- All transitions instant

---

## ♿ Accessibility Checklist

- [x] Semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `footer`, `dialog`)
- [x] Skip link to main content
- [x] ARIA labels, roles, and live regions (`aria-live`, `aria-atomic`, `aria-labelledby`)
- [x] Keyboard navigation for all interactive elements (tabs, dialogs, filters, carousel)
- [x] Focus management (trapping in dialog, restoration on close)
- [x] Sufficient color contrast (WCAG AA)
- [x] `prefers-reduced-motion` honored globally
- [x] Meaningful image `alt` text (empty `alt=""` for decorative)
- [x] `<noscript>` fallbacks for all dynamic content
- [x] Form labels and button accessible names
- [x] Heading hierarchy (h1 → h2 → h3)

---

## 📦 Deployment

### Static Hosting (Recommended)
| Platform | Command |
|----------|---------|
| **Netlify** | Drag & drop folder, or connect Git repo |
| **Vercel** | `vercel deploy` or Git integration |
| **GitHub Pages** | Push to `gh-pages` branch or use Actions |
| **Cloudflare Pages** | Connect repo, build command: `none`, output: `/` |
| **Firebase Hosting** | `firebase deploy` (configure `public: "."`) |
| **Surge.sh** | `surge . your-domain.surge.sh` |

> **Note:** The AI chat needs Vercel, or another host that can run `api/chat.js`. On the other static hosts the site works, but `/api/chat` is missing, so the chat widget shows its friendly error message instead of replies.

### Custom Domain
1. Add `CNAME` file with your domain (or configure in host dashboard)
2. Update `<link rel="canonical">` and `<meta property="og:url">` in `index.html`
3. Replace `[SOCIAL PREVIEW IMAGE URL]` with actual OG image

### Performance Checklist (Pre-deploy)
- [ ] Compress images (WebP/AVIF, appropriate dimensions)
- [ ] Enable gzip/brotli on server
- [ ] Set long-term caching for static assets (`Cache-Control: public, max-age=31536000, immutable`)
- [ ] Verify no console errors
- [ ] Run Lighthouse (target: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO ≥ 90)

## 🤖 SID.agent (AI portfolio chat)

SID.agent is the chat widget on the site. It answers visitors' questions about Shahriar's work using Groq's free-tier API with `openai/gpt-oss-120b`, called from a Vercel serverless function at `/api/chat`. Groq is primary, with NVIDIA GPT-OSS 20B as an optional backup. Both keys live only in Vercel environment variables and your local `.env.local`; they never reach the browser or git.

### Architecture
- **Widget:** `index.html`, `script.js`, `style.css`, with the avatar at `images/agent-avatar.svg` (an illustrated portrait of Shahriar Islam Dip)
- **Endpoint:** `api/chat.js` and the modules in `api/_lib/` (`handler.js`, `providers.js`, `origin.js`, `rate-limit.js`, `validate.js`, `respond.js`, `persona.js`, `config.js`)
- **Provider order:** Groq (`openai/gpt-oss-120b`), then NVIDIA (`openai/gpt-oss-20b`). A provider is skipped if its key is missing or blank. NVIDIA is not called when Groq succeeds.
- **Generation:** low reasoning effort and a 1,024-token completion budget shared by reasoning and the final answer. Groq receives `max_completion_tokens` and `include_reasoning: false`; NVIDIA receives its documented `max_tokens` parameter. Only final message content is returned; separate reasoning fields are ignored. Visible replies stay capped at 700 characters.
- **Fallback:** one attempt per configured provider, Groq first. Any Groq failure (including 401, 422, 429, 5xx, timeout, invalid JSON or empty content) allows NVIDIA to answer within the remaining time budget. If all configured providers fail, a 422 produces `502 upstream_rejected`; otherwise the visitor gets a friendly canned reply. Without any configured key, the endpoint returns `503 not_configured`. Limits remain 8 seconds per provider and 20 seconds total.

### Environment Variables

| Name | Required | Default | Notes |
|---|---|---|---|
| `GROQ_API_KEY` | primary | none | Groq console key, server-side only |
| `GROQ_MODEL` | no | `openai/gpt-oss-120b` | Optional Groq model override |
| `NVIDIA_API_KEY` | optional | none | Enables the NVIDIA backup; skipped if empty |
| `NVIDIA_MODEL` | no | `openai/gpt-oss-20b` | Optional NVIDIA model override |
| `ALLOWED_ORIGINS` | yes in production | none | comma-separated exact origins, e.g. `https://example.com,https://www.example.com`. Use lowercase, include the scheme, no path. List both apex and `www` if both serve the site. A mismatch makes real visitors get the "forbidden" reply. |
| `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL` | automatic | | Vercel system variables. "Automatically expose System Environment Variables" must stay enabled. |

Create the primary key in the [Groq console](https://console.groq.com/keys). To enable backup responses, generate a separate NVIDIA key on the [GPT-OSS 20B model page](https://build.nvidia.com/openai/gpt-oss-20b) and set `NVIDIA_API_KEY`. The NVIDIA endpoint is offered for prototyping, subject to its trial terms and account limits. Request parameters follow [NVIDIA's API reference](https://docs.api.nvidia.com/nim/reference/openai-gpt-oss-20b-infer).

Groq currently lists free limits for `openai/gpt-oss-120b` of 30 requests/minute, 1,000 requests/day, 8,000 tokens/minute and 200,000 tokens/day. Any one limit can stop requests. Quotas apply across the organization, and the exact limits for your account are shown in [Groq settings](https://console.groq.com/settings/limits). See [Groq's rate-limit documentation](https://console.groq.com/docs/rate-limits) (checked October 18, 2026).

### Adding Keys in Vercel
1. Open the project on Vercel, then go to **Settings**, then **Environment Variables**.
2. Add `GROQ_API_KEY` and optional `NVIDIA_API_KEY` for **Production** and **Preview**. A Development-only key does not configure the live site. Use `GROQ_MODEL=openai/gpt-oss-120b` and `NVIDIA_MODEL=openai/gpt-oss-20b`, or omit these overrides to use the defaults.
3. Set `ALLOWED_ORIGINS` for **Production**.
4. Redeploy so the new variables take effect.

These variables must stay server-side. Do not give them a public prefix (such as `NEXT_PUBLIC_`), and do not reference them in client code.

### Local Development
- **With Groq:** copy `.env.example` to `.env.local` (git-ignored), add your `GROQ_API_KEY` and optional `NVIDIA_API_KEY`, then run `npm run dev`. The dev server reads `.env.local` when it starts, so restart it after editing.
- **Without keys:** run `npm run dev:mock`. It uses fake keys and makes no network calls. Pick another mock mode with `node scripts/dev-server.js --mock=<mode>`:
  - `ok` (default): canned replies after a short delay
  - `slow`: a longer delay
  - `fatal`: both providers return 422, so the endpoint answers 502
  - `unauthorized`: Groq returns 401 and NVIDIA fails, so the visitor gets a canned reply
  - `backup`: Groq returns 429 and NVIDIA answers successfully
  - `down` or `fail`: both providers return 503, so the visitor gets a canned reply
  - `ratelimit`: mock providers with the real rate limiter
- **With Vercel's runtime:** after `vercel link` and `vercel env pull .env.local`, `npx vercel dev` runs the function the way Vercel does.
- **Port 3000:** the dev server runs at `http://localhost:3000` (use `--port N` or the `PORT` variable to change it). The chat origin allowlist only covers port 3000. On another port, add `ALLOWED_ORIGINS=http://localhost:<port>` (the dev server prints this hint).

### Tests
Run `npm test`. It uses Node's built-in test runner (`node:test`) over `tests/**/*.test.js`, and it makes no network calls.

### Rate Limits and Limitations
> Best effort: state lives in one warm function instance. It resets on cold start and is not shared across concurrent instances. Each provider's own quotas remain the real ceiling.

The Origin check stops other websites from calling the endpoint from a browser. It does not stop scripts or `curl`, which can send any Origin header.

Messages are sent to third-party AI providers. Free tiers may use prompts to improve the providers' models, so visitors should not share personal information. The widget's disclaimer says the same.

### Customising the Persona
- **`api/_lib/persona.js`:** `SYSTEM_PROMPT` (voice and rules), `FACTS` (what the model may state) and `FALLBACK_REPLIES` (canned replies)
- **`script.js`:** `CHAT_COPY` (widget text, including the disclaimer) and `CHAT_SUGGESTIONS` (suggested questions), both near the top of the file
- **Keep `FACTS` in sync with the site.** `tests/persona.test.js` checks project titles, live URLs, stack, process and contact details against `script.js` and `index.html`. Run `npm test` after every change.

### Deploying the Chat on Vercel
Follow the steps in [Adding Keys in Vercel](#adding-keys-in-vercel), then check the live deployment:
- [ ] The chat returns a reply to a test message.
- [ ] `/api/_lib/persona.js`, `/docs/...`, `/tests/...`, `/scripts/...` and `/.env.example` return 404.
- [ ] A POST to `/api/chat` with an Origin that is not in `ALLOWED_ORIGINS` returns 403.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `503 not_configured` | No provider key is set in this environment | Add `GROQ_API_KEY` and optional `NVIDIA_API_KEY` in Vercel (Production and/or Preview), or in `.env.local`, then redeploy or restart |
| `403 forbidden_origin` (the visitor sees the "forbidden" reply) | The site's origin is not in `ALLOWED_ORIGINS`. Check the scheme, `www` versus apex, trailing paths and letter case | Set the exact origin in `ALLOWED_ORIGINS`, then redeploy |
| Repeated canned replies | Every configured provider failed: quota exhaustion, invalid keys, a retired model or timeout | Check runtime logs for provider/status/reason, then each provider's key, model and quota |
| `502 upstream_rejected` | Every provider failed and at least one answered HTTP 422 | Check `GROQ_MODEL`, `NVIDIA_MODEL` and provider-specific request settings |
| Model name changed or retired | The provider removed or renamed a model | Set `GROQ_MODEL` or `NVIDIA_MODEL` to a current model name for that provider in Vercel, then redeploy |

---

## 🔧 Development Notes

### Adding New Sections
1. Add semantic `<section>` in `index.html` with `id`, `aria-labelledby`
2. Add navigation link in header + mobile menu + footer
3. Add styles in `style.css` (follow existing patterns: `section-name`, `section-name__element`)
4. Add reveal attributes (`data-reveal="fade-up|clip"`, `data-speed`)
5. Initialize any JS in `script.js` (intersection observers, interactions)

### JavaScript Architecture
- **No framework** — vanilla ES6 modules pattern (IIFE or top-level `const`)
- **Data-attribute hooks** — `data-*` for all JS selectors (no class-based JS hooks)
- **Single initialization** — `DOMContentLoaded` → `init()` orchestrates modules
- **State** — Minimal, stored on elements or module-scoped variables
- **Events** — Delegated where possible, passive listeners for scroll

### CSS Methodology
- **BEM-ish** — Block `__element` `--modifier`
- **Custom properties** — All tokens in `:root`, component-scoped where needed
- **Container queries** — Used for component-level responsiveness
- **Fluid typography** — `clamp()` for all font sizes
- **Logical properties** — `inline-size`, `block-size`, `margin-inline`, etc.

---

## 📄 License

This portfolio is **personal work** — not licensed for reuse as a template.  
You may reference the code for learning purposes.  
All project case studies, images, and written content are proprietary.

---

## 🤝 Contact & Links

| Channel | Link |
|---------|------|
| **Email** | [dipshahriar27@gmail.com](mailto:dipshahriar27@gmail.com) |
| **GitHub** | [github.com/Shahriar-Dev27](https://github.com/Shahriar-Dev27) |
| **LinkedIn** | [linkedin.com/in/shahriar-islam-536900229](https://www.linkedin.com/in/shahriar-islam-536900229/) |
| **Portfolio** | [Live Site](#) *(deploy to get URL)* |

> **Response time:** Typically within 30 minutes during business hours (GMT+6).  
> **Preferred work:** Interactive websites, product interfaces, business platforms, design-led web applications.

---

## 🙏 Acknowledgments

- **GSAP** — GreenSock Animation Platform
- **Lenis** — Studio Freight smooth scroll
- **Google Fonts** — Inter, Space Grotesk, Space Mono
- **Inspiration** — Design-engineering hybrid portfolios that respect craft and code equally

---

*Built with intent. Engineered with care. Shipped with confidence.*  


**— Shahriar Islam Dip, 2026**
