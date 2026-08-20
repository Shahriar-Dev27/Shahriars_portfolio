"use strict";

const DEVELOPER_TIME_ZONE = "Asia/Dhaka";
const LOADER_SESSION_KEY = "portfolio-loader-seen";
const MODE_STORAGE_KEY = "portfolio-preferred-mode";
const PROJECT_FILTER_SESSION_KEY = "portfolio-project-filter";
const MAX_CANVAS_DPR = 2;

const portfolioModes = {
  design: {
    eyebrow: "Creative Frontend / UI Engineering",
    statement: "I shape expressive interfaces where hierarchy, motion, and usability work together.",
    focusLabel: "Current focus",
    focusValue: "Interaction design",
    backgroundWord: "Design",
    index: "01",
    technology: "UI systems / Motion",
    secondary: "Accessible interaction",
    aboutLens: "Typography / Interaction / UI systems",
    aboutDetail: "Visual systems translated into clear, accessible interface behavior.",
    skillsMode: "Design",
    annotations: ["Interface / 01", "Accessibility / Enabled", "Motion / Intentional"],
  },
  develop: {
    eyebrow: "Full-Stack Development / Systems",
    statement: "I engineer reliable digital products from responsive interfaces to scalable services.",
    focusLabel: "Current focus",
    focusValue: "Product engineering",
    backgroundWord: "Develop",
    index: "02",
    technology: "Architecture / APIs",
    secondary: "Performance systems",
    aboutLens: "Architecture / APIs / Performance",
    aboutDetail: "Maintainable product systems designed for reliability, scale, and clear ownership.",
    skillsMode: "Develop",
    annotations: ["System / 02", "Performance / Optimized", "Backend / Stable"],
  },
};

const skillData = [
  {
    id: "creative-frontend",
    index: "01",
    title: "Creative Frontend",
    focus: 88,
    mode: "design",
    description: "Building responsive, expressive interfaces with strong hierarchy, accessible interaction, and controlled motion.",
    technologies: ["HTML", "CSS", "JavaScript", "React", "Next.js", "Motion"],
    outcome: "Interfaces that feel distinctive without sacrificing usability or performance.",
  },
  {
    id: "ui-engineering",
    index: "02",
    title: "UI Engineering",
    focus: 82,
    mode: "design",
    description: "Translating visual systems into reusable components, interaction patterns, and maintainable frontend architecture.",
    technologies: ["Design Systems", "Components", "Accessibility", "Responsive UI"],
    outcome: "Consistent product experiences that remain easy to evolve.",
  },
  {
    id: "full-stack",
    index: "03",
    title: "Full-Stack Applications",
    focus: 86,
    mode: "develop",
    description: "Developing complete products across frontend interfaces, APIs, data flow, authentication, and deployment.",
    technologies: ["Node.js", "Express", "Next.js", "REST APIs", "SQL", "MongoDB"],
    outcome: "Reliable systems designed around real product requirements.",
  },
  {
    id: "performance",
    index: "04",
    title: "Performance & Quality",
    focus: 78,
    mode: "develop",
    description: "Improving loading behaviour, runtime efficiency, accessibility, testing, and production reliability.",
    technologies: ["Core Web Vitals", "Lighthouse", "Testing", "Optimization"],
    outcome: "Faster experiences with fewer technical and usability problems.",
  },
  {
    id: "integration",
    index: "05",
    title: "APIs & Integrations",
    focus: 74,
    mode: "develop",
    description: "Connecting products to external services, automation systems, business tools, and structured data.",
    technologies: ["REST", "Webhooks", "Authentication", "Third-Party APIs"],
    outcome: "Connected workflows that reduce manual work and extend product capability.",
  },
];

const projectData = [
  {
    id: "bizguide-ai",
    number: "01",
    title: "BizGuide AI",
    category: "full-stack",
    type: "Bangladesh Business Advisor",
    year: "2026",
    role: "Product Design / Full-Stack Development",
    status: "View project",
    caseType: "Self-directed project",
    summary: "A Bangladesh-first planning experience that helps founders examine location, budget, demand, timing, and risk before committing resources.",
    outcome: "Published as a live, responsive product prototype with transparent demo-data boundaries.",
    image: "images/projects/BizStudio.png",
    imageWidth: 1895,
    imageHeight: 905,
    imageAlt: "BizGuide AI homepage with a Bangladesh opportunity map and business idea planning prompt",
    liveUrl: null,
    repositoryUrl: null,
    technologies: ["Next.js", "TypeScript", "Three.js", "GSAP"],
    designTechnologies: ["Three.js", "GSAP"],
    developTechnologies: ["Next.js", "TypeScript"],
    theme: "dark",
    layout: "featured",
    details: {
      overview: "A live, self-directed business planning product for founders in Bangladesh. It turns an early idea into a structured view of location, budget, demand, timing, risk, and practical next steps.",
      challenge: "Early-stage founders can commit money before testing local demand, rent pressure, operating constraints, or available runway. The product needed to make those questions approachable without presenting prototype data as guaranteed advice.",
      approach: "Organize the experience around six decision lenses, plain-language prompts, transparent demo labeling, a guided advisor workspace, and pinned notes for useful findings.",
      implementation: "Built with Next.js, React, TypeScript, Three.js through React Three Fiber, GSAP, Tailwind CSS, responsive layouts, and a Netlify production deployment.",
      result: "Published as a working portfolio product that demonstrates the full planning journey. The current prototype clearly labels illustrative data and does not claim client performance metrics.",
    },
  },
  {
    id: "care-compass",
    number: "02",
    title: "CareCompass",
    category: "frontend",
    type: "Healthcare Discovery Platform",
    year: "2026",
    role: "Product Design / Frontend Development",
    status: "View project",
    caseType: "Self-directed project",
    summary: "A care discovery experience that helps patients search by symptoms, compare available clinicians, and book an appointment quickly.",
    outcome: "A calm, accessible path from a health concern to a confirmed appointment.",
    image: "images/projects/CareCompass.png",
    imageWidth: 1811,
    imageHeight: 890,
    imageAlt: "CareCompass homepage with symptom search, available doctors, appointment times, and an AI-assisted care prompt",
    liveUrl: "https://care-compass-seven.vercel.app",
    repositoryUrl: null,
    technologies: ["Responsive UI", "Accessible UX", "Search UX", "Booking Flow"],
    designTechnologies: ["Accessible UX", "Search UX"],
    developTechnologies: ["Responsive UI", "Booking Flow"],
    theme: "neutral",
    layout: "wide",
    details: {
      overview: "A healthcare discovery platform designed to make finding and booking the right clinician feel direct and understandable.",
      challenge: "Turn symptoms, specialties, availability, and trust signals into a useful search experience without overwhelming the patient.",
      approach: "Lead with plain-language symptom search, surface near-term appointments, and keep care-assistant suggestions clearly separated from confirmed provider information.",
      implementation: "Built as a responsive product interface with search, filtering, availability cards, booking cues, and clear trust and safety messaging.",
      result: "A focused care journey that moves from an uncertain need to an actionable appointment in a few clear steps.",
    },
  },
  {
    id: "gocart",
    number: "03",
    title: "gocart",
    category: "experiment",
    type: "Immersive 3D Commerce Experience",
    year: "2026",
    role: "Creative Development / Product Design",
    status: "View project",
    caseType: "Self-directed project",
    summary: "An immersive storefront that turns product discovery into a spatial, motion-led shopping experience.",
    outcome: "A distinctive commerce concept that keeps search, categories, and cart actions familiar inside an expressive 3D environment.",
    image: "images/projects/gocart.png",
    imageWidth: 1872,
    imageHeight: 875,
    imageAlt: "gocart homepage with floating 3D products, spatial grid, product cards, search, categories, and shopping bag controls",
    liveUrl: "https://gocart-a6c142gnq-shahriar4.vercel.app/",
    repositoryUrl: null,
    technologies: ["3D Product UI", "Motion", "Responsive Design", "E-commerce UX"],
    designTechnologies: ["3D Product UI", "Motion"],
    developTechnologies: ["Responsive Design", "E-commerce UX"],
    theme: "dark",
    layout: "wide",
    details: {
      overview: "A 3D commerce concept where curated products live inside an interactive, spatial storefront.",
      challenge: "Use motion and depth to create character without hiding the familiar controls people need to browse and shop.",
      approach: "Keep search, categories, featured products, account, and bag actions recognizable while using floating objects and a perspective grid for atmosphere.",
      implementation: "Built as a responsive commerce interface with animated product presentation, category navigation, discovery search, and conventional shopping controls.",
      result: "An expressive storefront concept that balances visual experimentation with an understandable shopping path.",
    },
  },
];

const processData = [
  { id: "discover", index: "01", title: "Discover", label: "Context", description: "Understand the product, audience, constraints, current problems, and desired business outcome.", activities: ["Stakeholder discussion", "Audience review", "Content and feature audit", "Reference analysis"], output: "A shared understanding of what should be built and why." },
  { id: "define", index: "02", title: "Define", label: "Direction", description: "Translate discovery into priorities, scope, information architecture, and measurable requirements.", activities: ["Project scope", "Content hierarchy", "Technical requirements", "Success criteria"], output: "A focused roadmap that reduces uncertainty before production." },
  { id: "design", index: "03", title: "Design", label: "Experience", description: "Shape the visual system, responsive layouts, interaction language, and reusable interface patterns.", activities: ["Wireframes", "Visual direction", "Responsive UI", "Motion planning"], output: "A clear interface direction ready for implementation." },
  { id: "engineer", index: "04", title: "Engineer", label: "Build", description: "Develop the interface, application logic, integrations, data flow, and maintainable component structure.", activities: ["Frontend development", "Backend services", "API integration", "Content implementation"], output: "A reliable working product built around real requirements." },
  { id: "test", index: "05", title: "Test", label: "Quality", description: "Review responsiveness, accessibility, performance, browser behaviour, edge cases, and content accuracy.", activities: ["Responsive QA", "Keyboard testing", "Performance review", "Browser testing"], output: "A more stable and inclusive experience before release." },
  { id: "launch", index: "06", title: "Launch", label: "Delivery", description: "Prepare production configuration, analytics, metadata, documentation, and controlled deployment.", activities: ["Production deployment", "SEO configuration", "Analytics setup", "Handover documentation"], output: "A launch-ready product with clear ownership and operational guidance." },
  { id: "improve", index: "07", title: "Improve", label: "Evolution", description: "Review feedback, performance data, user behaviour, and new business requirements after launch.", activities: ["Post-launch monitoring", "Iteration planning", "Performance improvements", "Feature expansion"], output: "A product that can continue evolving instead of becoming static." },
];

const testimonialData = [
  { id: "testimonial-01", quote: "The process felt unusually clear. Visual decisions were explained, technical tradeoffs were handled early, and the final product felt more considered than the original brief.", name: "Sample Client", role: "Founder", company: "Placeholder Studio", project: "Premium Web Platform", result: "Sample statement — replace before launch." },
  { id: "testimonial-02", quote: "The interface looked distinctive without becoming difficult to use. The development work was structured, responsive, and easy for our internal team to continue working with.", name: "Sample Client", role: "Product Lead", company: "Placeholder Product", project: "Business Dashboard", result: "Sample statement — replace before launch." },
  { id: "testimonial-03", quote: "What stood out was the balance between creative ambition and delivery discipline. Motion, accessibility, content, and performance were treated as one connected system.", name: "Sample Client", role: "Creative Director", company: "Placeholder Agency", project: "Interactive Brand Experience", result: "Sample statement — replace before launch." },
];

const appState = {
  initialized: false,
  mode: "design",
  heroInteractionMode: "scroll",
  reducedMotion: false,
  mobileMenuOpen: false,
  coarsePointer: false,
  heroVisible: true,
  cursorEnabled: false,
  loaderComplete: false,
  activeSkillId: "creative-frontend",
  skillSelectionManual: false,
  projectFilter: "all",
  activeProjectId: null,
  projectDialogOpen: false,
  activeProcessId: "design",
  processSelectionManual: false,
  testimonialIndex: 0,
  statementVisible: false,
};

const scrollLocks = new Set();
let lockedScrollY = 0;
let previousBodyStyles = null;
let revealState = null;
let modeTransitionTimer = 0;
let exploreRuntime = null;
let cursorRuntime = null;
let skillRuntime = null;
let projectRuntime = null;
let revealRuntime = null;
let scrollMotionReady = false;
let processRuntime = null;
let testimonialRuntime = null;
let statementRuntime = null;
let copyEmailRuntime = null;
let backToTopTimer = 0;

function syncScrollLock() {
  const shouldLock = scrollLocks.size > 0;

  if (shouldLock && !previousBodyStyles) {
    revealRuntime?.lenis?.stop();
    lockedScrollY = window.scrollY;
    previousBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const scrollbarGap = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const bodyPaddingRight = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    if (scrollbarGap) document.body.style.paddingRight = `${bodyPaddingRight + scrollbarGap}px`;
    return;
  }

  if (!shouldLock && previousBodyStyles) {
    const styles = previousBodyStyles;
    previousBodyStyles = null;
    document.body.style.position = styles.position;
    document.body.style.top = styles.top;
    document.body.style.left = styles.left;
    document.body.style.right = styles.right;
    document.body.style.width = styles.width;
    document.body.style.overflow = styles.overflow;
    document.body.style.paddingRight = styles.paddingRight;
    window.scrollTo(0, lockedScrollY);
    revealRuntime?.lenis?.start();
    window.ScrollTrigger?.refresh();
  }
}

function lockPageScroll(reason) {
  if (!reason) return;
  scrollLocks.add(reason);
  syncScrollLock();
}

function unlockPageScroll(reason) {
  if (!reason) return;
  scrollLocks.delete(reason);
  syncScrollLock();
}

function announceInteraction(message) {
  const announcer = document.querySelector("[data-interaction-announcer]");
  if (announcer) announcer.textContent = message;
}

function syncBodyInteractionState() {
  document.body.dataset.portfolioMode = appState.mode;
  document.body.dataset.heroInteraction = appState.heroInteractionMode;
  document.body.classList.toggle("menu-open", appState.mobileMenuOpen);
  document.body.classList.toggle("dialog-open", appState.projectDialogOpen);
  document.documentElement.classList.toggle("coarse-pointer", appState.coarsePointer);
  document.documentElement.classList.toggle("reduced-motion", appState.reducedMotion);
}

function startHeroEntrance() {
  const hero = document.querySelector("#home");
  if (!hero) return;

  if (appState.reducedMotion) {
    hero.classList.add("is-entered");
    document.body.classList.add("hero-entered");
    return;
  }

  hero.classList.add("is-entering");
  document.body.classList.add("hero-entering");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hero.classList.add("is-entered");
      document.body.classList.add("hero-entered");
    });
  });
}

function initLoader() {
  const loader = document.querySelector("#loading-screen");
  const progress = loader?.querySelector("[data-loader-progress]");
  const message = loader?.querySelector("[data-loader-message]");
  const skipButton = loader?.querySelector("[data-loader-skip]");
  if (!loader || !progress || !message || !skipButton) {
    startHeroEntrance();
    return;
  }

  const pageRegions = document.querySelectorAll("header, main, footer");
  const setPageInert = (inert) => pageRegions.forEach((region) => { region.inert = inert; });

  let wasSeen = false;
  try {
    wasSeen = sessionStorage.getItem(LOADER_SESSION_KEY) === "true";
  } catch (error) {
    console.warn("Portfolio loader session state is unavailable.", error);
  }

  if (appState.reducedMotion || wasSeen) {
    loader.hidden = true;
    appState.loaderComplete = true;
    startHeroEntrance();
    return;
  }

  try {
    sessionStorage.setItem(LOADER_SESSION_KEY, "true");
  } catch (error) {
    console.warn("Portfolio loader session state could not be saved.", error);
  }

  const messages = [
    { at: 0, text: "Loading interface" },
    { at: 0.34, text: "Compiling motion" },
    { at: 0.68, text: "Connecting experience" },
    { at: 0.93, text: "Load Shahriar Islam Dip" },
  ];
  const duration = 1250;
  let animationFrame = 0;
  let startTime = 0;
  let finished = false;

  function cleanup() {
    cancelAnimationFrame(animationFrame);
    document.removeEventListener("keydown", handleKeydown);
    skipButton.removeEventListener("click", finish);
  }

  function finish() {
    if (finished) return;
    finished = true;
    cleanup();
    progress.value = 100;
    progress.textContent = "100%";
    message.textContent = "Load Shahriar Islam Dip";
    loader.classList.add("is-leaving");
    appState.loaderComplete = true;
    startHeroEntrance();

    window.setTimeout(() => {
      loader.hidden = true;
      document.body.classList.remove("loader-active");
      unlockPageScroll("loader");
      setPageInert(false);
      if (loader.contains(document.activeElement)) document.querySelector("#hero-title")?.focus();
    }, 640);
  }

  function handleKeydown(event) {
    if (event.key === "Escape") finish();
  }

  function update(timestamp) {
    if (!startTime) startTime = timestamp;
    const ratio = Math.min((timestamp - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - ratio, 3);
    const percentage = Math.min(100, Math.round(eased * 100));
    const activeMessage = [...messages].reverse().find((item) => ratio >= item.at);

    progress.value = percentage;
    progress.textContent = `${percentage}%`;
    message.textContent = activeMessage?.text ?? messages[0].text;

    if (ratio < 1) {
      animationFrame = requestAnimationFrame(update);
    } else {
      finish();
    }
  }

  loader.hidden = false;
  document.body.classList.add("loader-active");
  lockPageScroll("loader");
  setPageInert(true);
  skipButton.addEventListener("click", finish);
  document.addEventListener("keydown", handleKeydown);
  skipButton.focus();
  animationFrame = requestAnimationFrame(update);
}

function initNavigation() {
  const navigation = document.querySelector("#primary-navigation");
  const internalLinks = document.querySelectorAll("a[href^='#']");
  if (!internalLinks.length) return;

  internalLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (appState.heroInteractionMode === "explore") exitExploreMode({ restoreFocus: false });
      if (appState.projectDialogOpen && projectRuntime) {
        projectRuntime.lastTrigger = null;
        closeProjectDialog();
      }
      const href = link.getAttribute("href");
      const matchingPrimaryLink = navigation?.querySelector(`a[href='${href}']`);
      if (matchingPrimaryLink) {
        navigation.querySelector("[aria-current]")?.removeAttribute("aria-current");
        matchingPrimaryLink.setAttribute("aria-current", "location");
      }
    });
  });

  if (!navigation || !("IntersectionObserver" in window)) return;
  const primaryLinks = [...navigation.querySelectorAll("a[href^='#']")];
  const observedSections = primaryLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const visibility = new Map(observedSections.map((section) => [section.id, 0]));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => visibility.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
    const activeId = [...visibility.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!activeId || visibility.get(activeId) <= 0) return;
    primaryLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${activeId}`) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-28% 0px -58%", threshold: [0, 0.1, 0.35, 0.6] });
  observedSections.forEach((section) => observer.observe(section));
  window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
}

function initMobileMenu() {
  const menuButton = document.querySelector(".mobile-menu-button");
  const menu = document.querySelector("#mobile-menu");
  if (!menuButton || !menu) return;

  const focusableSelector = "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";
  let previousFocus = null;

  function setMenu(open, restoreFocus = true) {
    appState.mobileMenuOpen = open;
    menuButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);

    if (open) {
      lockPageScroll("mobile-menu");
      if (appState.heroInteractionMode === "explore") exitExploreMode({ restoreFocus: false });
      previousFocus = document.activeElement;
      menu.hidden = false;
      menu.querySelector(focusableSelector)?.focus();
      return;
    }

    menu.hidden = true;
    unlockPageScroll("mobile-menu");
    if (restoreFocus && previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  function handleKeydown(event) {
    if (!appState.mobileMenuOpen) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setMenu(false);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [...menu.querySelectorAll(focusableSelector), menuButton];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  menuButton.addEventListener("click", () => setMenu(!appState.mobileMenuOpen));
  menu.querySelectorAll("a[href]").forEach((link) => {
    link.addEventListener("click", () => setMenu(false, false));
  });
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1248 && appState.mobileMenuOpen) setMenu(false, false);
  }, { passive: true });
}

function loadHeroImages(images) {
  const waitForImage = (image, label) => new Promise((resolve) => {
    if (!(image instanceof HTMLImageElement)) {
      console.warn(`Hero portrait asset is missing from the document: ${label}`);
      resolve(false);
      return;
    }

    const loaded = () => resolve(true);
    const failed = () => {
      console.warn(`Hero portrait asset could not be loaded: ${label}`);
      resolve(false);
    };

    if (image.complete) {
      image.naturalWidth > 0 ? loaded() : failed();
      return;
    }

    image.addEventListener("load", loaded, { once: true });
    image.addEventListener("error", failed, { once: true });
  });

  return Promise.all([
    waitForImage(images.bw, "images/developer-placeholder.png (grayscale layer)"),
    waitForImage(images.color, "images/developer-placeholder.png (colour layer)"),
  ]).then(([bwLoaded, colorLoaded]) => bwLoaded && colorLoaded);
}

function drawContainedImage(context, image, width, height) {
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const containerRatio = width / height;
  let drawWidth;
  let drawHeight;
  let x;
  let y;

  if (imageRatio > containerRatio) {
    drawWidth = width;
    drawHeight = width / imageRatio;
    x = 0;
    y = height - drawHeight;
  } else {
    drawHeight = height;
    drawWidth = height * imageRatio;
    x = (width - drawWidth) / 2;
    y = 0;
  }

  context.drawImage(image, x, y, drawWidth, drawHeight);
}

function resizeRevealCanvas() {
  if (!revealState) return;
  const { element, canvas, maskCanvas, colorCanvas, colorImage } = revealState;
  const rect = element.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_CANVAS_DPR);

  revealState.geometry = { rect, width, height, dpr };
  [canvas, maskCanvas, colorCanvas].forEach((surface) => {
    surface.width = Math.round(width * dpr);
    surface.height = Math.round(height * dpr);
  });

  revealState.maskContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  revealState.colorContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  revealState.maskContext.clearRect(0, 0, width, height);
  revealState.colorContext.clearRect(0, 0, width, height);
  drawContainedImage(revealState.colorContext, colorImage, width, height);
  revealState.previousPaint = null;
  renderRevealCanvas(0);
}

function renderRevealCanvas(opacity = 1) {
  if (!revealState) return;
  const { context, canvas, colorCanvas, maskCanvas } = revealState;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = Math.max(0, Math.min(opacity, 1));
  context.drawImage(colorCanvas, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = "destination-in";
  context.drawImage(maskCanvas, 0, 0);
  context.globalCompositeOperation = "source-over";
}

function paintBrushDab(context, x, y, radius, opacity = 1) {
  if (!context || radius <= 0) return;
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(255,255,255,${opacity})`);
  gradient.addColorStop(0.25, `rgba(255,255,255,${opacity})`);
  gradient.addColorStop(0.45, `rgba(255,255,255,${opacity * 0.85})`);
  gradient.addColorStop(0.65, `rgba(255,255,255,${opacity * 0.45})`);
  gradient.addColorStop(0.85, `rgba(255,255,255,${opacity * 0.12})`);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function paintInterpolatedPath(from, to, spacing) {
  if (!revealState || !from || !to) return;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / Math.max(spacing, 1)));
  const baseRadius = revealState.brushRadius;

  for (let index = 1; index <= steps; index += 1) {
    const progress = index / steps;
    const x = from.x + (to.x - from.x) * progress;
    const y = from.y + (to.y - from.y) * progress;
    const variation = Math.sin((x + y) * 0.025);
    paintBrushDab(revealState.maskContext, x, y, baseRadius * (1 + variation * 0.04), 0.94);
    paintBrushDab(revealState.maskContext, x + baseRadius * 0.18, y - baseRadius * 0.12, baseRadius * 0.68, 0.55);
    paintBrushDab(revealState.maskContext, x - baseRadius * 0.2, y + baseRadius * 0.15, baseRadius * 0.48, 0.25);
  }
}

function getLocalPointerPosition(event) {
  if (!revealState?.geometry) return null;
  const { rect, width, height } = revealState.geometry;
  return {
    x: Math.max(0, Math.min(event.clientX - rect.left, width)),
    y: Math.max(0, Math.min(event.clientY - rect.top, height)),
  };
}

function fadeRevealMask(timestamp) {
  if (!revealState?.fading) return false;
  if (!revealState.fadeStart) revealState.fadeStart = timestamp;
  const progress = Math.min((timestamp - revealState.fadeStart) / 760, 1);
  renderRevealCanvas(1 - progress);

  if (progress >= 1) {
    const { width, height } = revealState.geometry;
    revealState.maskContext.clearRect(0, 0, width, height);
    revealState.fading = false;
    revealState.fadeStart = 0;
    revealState.previousPaint = null;
    renderRevealCanvas(0);
    return false;
  }
  return true;
}

function scheduleRevealFrame() {
  if (!revealState || revealState.animationFrame || !appState.heroVisible) return;
  revealState.animationFrame = requestAnimationFrame(runRevealFrame);
}

function runRevealFrame(timestamp) {
  if (!revealState) return;
  revealState.animationFrame = 0;
  if (!appState.heroVisible) return;

  if (revealState.autoSweep) {
    if (!revealState.autoSweep.start) revealState.autoSweep.start = timestamp;
    const progress = Math.min((timestamp - revealState.autoSweep.start) / 1800, 1);
    const { width, height } = revealState.geometry;
    const point = {
      x: width * (0.12 + progress * 0.76),
      y: height * (0.5 - Math.sin(progress * Math.PI) * 0.11),
    };
    const previous = revealState.previousPaint ?? point;
    paintInterpolatedPath(previous, point, revealState.brushRadius * 0.2);
    revealState.previousPaint = point;
    renderRevealCanvas(progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1);

    if (progress < 1) {
      scheduleRevealFrame();
    } else {
      revealState.autoSweep = null;
      revealState.fading = true;
      revealState.fadeStart = timestamp;
      scheduleRevealFrame();
    }
    return;
  }

  if (revealState.active && revealState.target) {
    if (!revealState.current) revealState.current = { ...revealState.target };
    revealState.current.x += (revealState.target.x - revealState.current.x) * 0.34;
    revealState.current.y += (revealState.target.y - revealState.current.y) * 0.34;
    const previous = revealState.previousPaint ?? revealState.current;
    paintInterpolatedPath(previous, revealState.current, revealState.brushRadius * 0.18);
    revealState.previousPaint = { ...revealState.current };
    revealState.needsPaint = false;
    renderRevealCanvas(1);

    const remaining = Math.hypot(revealState.target.x - revealState.current.x, revealState.target.y - revealState.current.y);
    if (remaining > 0.35) scheduleRevealFrame();
    return;
  }

  if (fadeRevealMask(timestamp)) scheduleRevealFrame();
}

function setHeroVisibility(isVisible) {
  appState.heroVisible = isVisible;
  if (!isVisible && appState.heroInteractionMode === "explore") exitExploreMode({ restoreFocus: false });
  if (!revealState) return;

  if (!isVisible && revealState.animationFrame) {
    cancelAnimationFrame(revealState.animationFrame);
    revealState.animationFrame = 0;
  } else if (isVisible && (revealState.active || revealState.fading || revealState.autoSweep)) {
    scheduleRevealFrame();
  }
}

function initHeroBrushReveal() {
  const element = document.querySelector("[data-hero-reveal]");
  const canvas = element?.querySelector(".hero__reveal-canvas");
  const bwImage = element?.querySelector(".hero__portrait-image--bw");
  const colorImage = element?.querySelector(".hero__portrait-image--color");
  if (!element || !(canvas instanceof HTMLCanvasElement) || !(bwImage instanceof HTMLImageElement) || !(colorImage instanceof HTMLImageElement)) return;

  const context = canvas.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  const colorCanvas = document.createElement("canvas");
  const maskContext = maskCanvas.getContext("2d");
  const colorContext = colorCanvas.getContext("2d");
  if (!context || !maskContext || !colorContext) {
    console.warn("Canvas portrait reveal is unsupported in this browser.");
    loadHeroImages({ bw: bwImage, color: colorImage }).then((loaded) => {
      if (loaded) element.classList.add("is-ready", "is-reduced");
    });
    return;
  }

  revealState = {
    element,
    canvas,
    context,
    maskCanvas,
    maskContext,
    colorCanvas,
    colorContext,
    bwImage,
    colorImage,
    geometry: null,
    brushRadius: 130,
    baseBrushRadius: 130,
    target: null,
    current: null,
    previousPaint: null,
    active: false,
    needsPaint: false,
    fading: false,
    fadeStart: 0,
    autoSweep: null,
    animationFrame: 0,
  };

  loadHeroImages({ bw: bwImage, color: colorImage }).then((loaded) => {
    if (!loaded || !revealState) return;

    if (bwImage.naturalWidth !== colorImage.naturalWidth || bwImage.naturalHeight !== colorImage.naturalHeight) {
      console.warn("Hero portrait images must have identical pixel dimensions for accurate reveal alignment.");
    }

    element.classList.add("is-ready");
    element.classList.toggle("is-reduced", appState.reducedMotion);
    revealState.baseBrushRadius = window.innerWidth < 768 ? 90 : window.innerWidth < 1100 ? 110 : Math.min(170, Math.max(120, window.innerWidth * 0.095));
    revealState.brushRadius = revealState.baseBrushRadius;
    resizeRevealCanvas();

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (finePointer) {
      element.addEventListener("pointerenter", (event) => {
        if (!revealState || appState.reducedMotion) return;
        revealState.geometry.rect = element.getBoundingClientRect();
        revealState.fading = false;
        revealState.fadeStart = 0;
        revealState.active = true;
        revealState.target = getLocalPointerPosition(event);
        revealState.current = revealState.target ? { ...revealState.target } : null;
        revealState.previousPaint = revealState.current ? { ...revealState.current } : null;
        if (revealState.current) {
          paintInterpolatedPath(revealState.current, revealState.current, 1);
          renderRevealCanvas(1);
        }
      });

      element.addEventListener("pointermove", (event) => {
        if (!revealState?.active || appState.reducedMotion) return;
        revealState.target = getLocalPointerPosition(event);
        revealState.needsPaint = true;
        scheduleRevealFrame();
      }, { passive: true });

      element.addEventListener("pointerleave", () => {
        if (!revealState || appState.reducedMotion) return;
        revealState.active = false;
        revealState.fading = true;
        revealState.fadeStart = performance.now();
        scheduleRevealFrame();
      });
    } else {
      if (!appState.reducedMotion) {
        revealState.autoSweep = { start: 0 };
        window.setTimeout(scheduleRevealFrame, 420);
      }
      let touchPointerId = null;

      element.addEventListener("pointerdown", (event) => {
        if (!revealState || appState.reducedMotion || event.pointerType === "mouse") return;
        touchPointerId = event.pointerId;
        revealState.autoSweep = null;
        revealState.geometry.rect = element.getBoundingClientRect();
        revealState.fading = false;
        revealState.fadeStart = 0;
        revealState.active = true;
        revealState.target = getLocalPointerPosition(event);
        revealState.current = revealState.target ? { ...revealState.target } : null;
        revealState.previousPaint = revealState.current ? { ...revealState.current } : null;
        if (revealState.current) {
          paintInterpolatedPath(revealState.current, revealState.current, 1);
          renderRevealCanvas(1);
        }
      }, { passive: true });

      element.addEventListener("pointermove", (event) => {
        if (!revealState?.active || appState.reducedMotion || event.pointerId !== touchPointerId) return;
        revealState.target = getLocalPointerPosition(event);
        scheduleRevealFrame();
      }, { passive: true });

      const endTouchReveal = (event) => {
        if (!revealState || event.pointerId !== touchPointerId) return;
        touchPointerId = null;
        revealState.active = false;
        revealState.fading = true;
        revealState.fadeStart = performance.now();
        scheduleRevealFrame();
      };
      element.addEventListener("pointerup", endTouchReveal);
      element.addEventListener("pointercancel", endTouchReveal);
    }
  });

  let resizeTimer = 0;
  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!revealState?.geometry) return;
      revealState.baseBrushRadius = window.innerWidth < 768 ? 90 : window.innerWidth < 1100 ? 110 : Math.min(170, Math.max(120, window.innerWidth * 0.095));
      revealState.brushRadius = appState.heroInteractionMode === "explore" ? revealState.baseBrushRadius * 1.18 : revealState.baseBrushRadius;
      resizeRevealCanvas();
    }, 140);
  };
  window.addEventListener("resize", handleResize, { passive: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => setHeroVisibility(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(element.closest("#home") ?? element);
    window.addEventListener("pagehide", () => observer.disconnect(), { once: true });
  }

  window.addEventListener("pagehide", () => {
    window.removeEventListener("resize", handleResize);
    if (revealState?.animationFrame) cancelAnimationFrame(revealState.animationFrame);
  }, { once: true });
}

function initLocalTime() {
  const outputs = document.querySelectorAll("[data-local-time]");
  const yearOutputs = document.querySelectorAll("[data-current-year]");
  if (!outputs.length && !yearOutputs.length) return;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DEVELOPER_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const updateTime = () => {
    const now = new Date();
    const time = formatter.format(now);
    outputs.forEach((output) => { output.textContent = `${time} / GMT+6`; });
    yearOutputs.forEach((output) => { output.textContent = String(now.getFullYear()); });
  };

  updateTime();
  window.setInterval(updateTime, 60_000);
}

function initReducedMotion() {
  if (!("matchMedia" in window)) return;
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = (event) => {
    appState.reducedMotion = event.matches;
    document.documentElement.classList.toggle("reduced-motion", event.matches);
    syncBodyInteractionState();
    revealState?.element.classList.toggle("is-reduced", event.matches);
    if (event.matches && revealState) {
      revealState.active = false;
      revealState.fading = false;
      revealState.autoSweep = null;
      if (revealState.animationFrame) cancelAnimationFrame(revealState.animationFrame);
      revealState.animationFrame = 0;
      renderRevealCanvas(0);
    }
    if (event.matches) {
      if (appState.heroInteractionMode === "explore") exitExploreMode({ announce: false, restoreFocus: false });
      disableCustomCursor();
    } else if (canEnableCustomCursor()) {
      enableCustomCursor();
    }
    renderHeroInteractionMode(false);
    handlePhaseFourMotionChange(event.matches);
  };
  update(preference);
  preference.addEventListener?.("change", update);
}

function getStoredPortfolioMode() {
  try {
    const stored = localStorage.getItem(MODE_STORAGE_KEY);
    return stored === "design" || stored === "develop" ? stored : "design";
  } catch (error) {
    console.warn("Portfolio mode preference is unavailable.", error);
    return "design";
  }
}

function storePortfolioMode(mode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Portfolio mode preference could not be saved.", error);
  }
}

function renderPortfolioMode(mode, announce = false) {
  const content = portfolioModes[mode];
  if (!content) return;

  syncBodyInteractionState();
  const textUpdates = [
    ["[data-mode-eyebrow]", content.eyebrow],
    ["[data-mode-statement]", content.statement],
    ["[data-mode-focus-label]", content.focusLabel],
    ["[data-mode-focus]", content.focusValue],
    ["[data-mode-index]", content.index],
    ["[data-mode-technology]", content.technology],
    ["[data-mode-secondary]", content.secondary],
    ["[data-about-lens]", content.aboutLens],
    ["[data-about-detail]", content.aboutDetail],
    ["[data-skills-mode]", content.skillsMode],
  ];
  textUpdates.forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  });

  const backgroundWord = document.querySelector("[data-mode-background]");
  if (backgroundWord) {
    backgroundWord.textContent = content.backgroundWord;
    backgroundWord.dataset.text = content.backgroundWord.toUpperCase();
  }

  document.querySelectorAll("[data-portfolio-mode]").forEach((button) => {
    const selected = button.dataset.portfolioMode === mode;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  ["primary", "secondary", "tertiary"].forEach((slot, index) => {
    const annotation = document.querySelector(`[data-annotation="${slot}"]`);
    if (annotation) annotation.textContent = content.annotations[index];
  });

  syncSkillWithPortfolioMode(mode);
  syncProjectMode(mode);
  syncProcessWithPortfolioMode(mode);

  if (announce) announceInteraction(`${mode === "design" ? "Design" : "Develop"} perspective selected.`);
}

function setPortfolioMode(mode, options = {}) {
  const { persist = true, announce = true, immediate = false, force = false } = options;
  const validMode = mode === "develop" ? "develop" : "design";
  if (!force && appState.mode === validMode) return;

  appState.mode = validMode;
  if (persist) storePortfolioMode(validMode);
  window.clearTimeout(modeTransitionTimer);

  if (immediate || appState.reducedMotion) {
    document.body.classList.remove("is-mode-transitioning");
    renderPortfolioMode(validMode, announce);
    return;
  }

  document.body.classList.add("is-mode-transitioning");
  requestAnimationFrame(() => renderPortfolioMode(validMode, announce));
  modeTransitionTimer = window.setTimeout(() => {
    document.body.classList.remove("is-mode-transitioning");
  }, 560);
}

function updatePortfolioModeUI() {
  renderPortfolioMode(appState.mode, false);
}

function initDeveloperModeToggle() {
  const tablist = document.querySelector(".mode-selector[role='tablist']");
  if (!tablist) return;
  const tabs = [...tablist.querySelectorAll("[data-portfolio-mode]")];
  if (tabs.length !== 2) return;

  appState.mode = getStoredPortfolioMode();
  setPortfolioMode(appState.mode, { persist: false, announce: false, immediate: true, force: true });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setPortfolioMode(tab.dataset.portfolioMode));
  });

  tablist.addEventListener("keydown", (event) => {
    const currentIndex = tabs.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    tabs[nextIndex].focus();
    setPortfolioMode(tabs[nextIndex].dataset.portfolioMode);
  });
}

function canEnterExploreMode() {
  return !appState.reducedMotion && !appState.coarsePointer && appState.heroVisible && window.innerWidth >= 1024;
}

function renderHeroInteractionMode(announce = false) {
  const activeMode = appState.heroInteractionMode;
  syncBodyInteractionState();
  document.querySelectorAll("[data-hero-mode]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.heroMode === activeMode));
  });

  const backButton = document.querySelector("[data-back-to-scroll]");
  if (backButton) backButton.hidden = activeMode !== "explore";

  const hint = document.querySelector("[data-hero-hint]");
  if (hint) {
    if (appState.reducedMotion) hint.textContent = "Static experience";
    else if (appState.coarsePointer) hint.textContent = "Tap or drag to reveal";
    else if (activeMode === "explore") hint.textContent = "Move to inspect · Esc to exit";
    else if (canEnterExploreMode()) hint.textContent = "Select Explore for interactive view";
    else hint.textContent = "Motion reveals colour";
  }

  if (announce) announceInteraction(`Explore mode ${activeMode === "explore" ? "enabled" : "disabled"}.`);
}

function updateHeroInteractionUI() {
  renderHeroInteractionMode(false);
}

function enterExploreMode() {
  if (!canEnterExploreMode() || appState.heroInteractionMode === "explore") return;
  appState.heroInteractionMode = "explore";
  document.body.classList.add("hero-depth-active");
  lockPageScroll("hero-explore");
  if (revealState) revealState.brushRadius = revealState.baseBrushRadius * 1.18;
  if (exploreRuntime?.frame) exploreRuntime.rect = exploreRuntime.frame.getBoundingClientRect();
  renderHeroInteractionMode(true);
  setCursorState("MOVE");
}

function exitExploreMode(options = {}) {
  const { announce = true, restoreFocus = true } = options;
  const wasActive = appState.heroInteractionMode === "explore";
  appState.heroInteractionMode = "scroll";
  unlockPageScroll("hero-explore");
  if (revealState) revealState.brushRadius = revealState.baseBrushRadius;
  if (appState.reducedMotion) clearHeroDepthTransforms();
  else resetHeroDepth();
  renderHeroInteractionMode(wasActive && announce);
  resetCursorState();
  if (wasActive && restoreFocus) {
    document.querySelector("[data-hero-mode='scroll']")?.focus({ preventScroll: true });
  }
}

function setHeroInteractionMode(mode) {
  if (mode === "explore") enterExploreMode();
  else exitExploreMode();
}

function updateHeroDepthTarget(event) {
  if (!exploreRuntime || appState.heroInteractionMode !== "explore" || appState.reducedMotion) return;
  const rect = exploreRuntime.rect ?? exploreRuntime.frame.getBoundingClientRect();
  exploreRuntime.rect = rect;
  const normalizedX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1));
  const normalizedY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1));
  exploreRuntime.targetX = normalizedX * exploreRuntime.rangeX;
  exploreRuntime.targetY = normalizedY * exploreRuntime.rangeY;
  scheduleInteractionFrame();
}

function resetHeroDepth() {
  if (!exploreRuntime) return;
  exploreRuntime.targetX = 0;
  exploreRuntime.targetY = 0;
  scheduleInteractionFrame();
}

function clearHeroDepthTransforms() {
  if (!exploreRuntime) return;
  exploreRuntime.currentX = 0;
  exploreRuntime.currentY = 0;
  exploreRuntime.targetX = 0;
  exploreRuntime.targetY = 0;
  exploreRuntime.motionLayer.style.removeProperty("transform");
  exploreRuntime.backgroundWord.style.removeProperty("transform");
  exploreRuntime.annotations.forEach((annotation) => annotation.style.removeProperty("transform"));
  document.body.classList.remove("hero-depth-active");
}

function initExploreMode() {
  const frame = document.querySelector(".hero__frame");
  const motionLayer = document.querySelector("[data-hero-depth]");
  const backgroundWord = document.querySelector("[data-mode-background]");
  const annotations = [...document.querySelectorAll(".hero-annotation")];
  const controls = [...document.querySelectorAll("[data-hero-mode]")];
  const backButton = document.querySelector("[data-back-to-scroll]");
  if (!frame || !motionLayer || !backgroundWord || !controls.length || !backButton) return;

  exploreRuntime = {
    frame,
    motionLayer,
    backgroundWord,
    annotations,
    rect: null,
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    rangeX: window.innerWidth < 1280 ? 8 : 12,
    rangeY: window.innerWidth < 1280 ? 4 : 7,
  };

  const pointerQuery = window.matchMedia("(hover: none), (pointer: coarse)");
  const evaluateAvailability = () => {
    appState.coarsePointer = pointerQuery.matches;
    document.documentElement.classList.toggle("coarse-pointer", appState.coarsePointer);
    const exploreButton = document.querySelector("[data-hero-mode='explore']");
    if (exploreButton) exploreButton.disabled = !canEnterExploreMode();
    if (!canEnterExploreMode() && appState.heroInteractionMode === "explore") exitExploreMode({ restoreFocus: false });
    renderHeroInteractionMode(false);
  };

  controls.forEach((button) => {
    button.addEventListener("click", () => setHeroInteractionMode(button.dataset.heroMode));
  });
  backButton.addEventListener("click", () => exitExploreMode());
  frame.addEventListener("pointermove", updateHeroDepthTarget, { passive: true });
  frame.addEventListener("pointerleave", resetHeroDepth);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && appState.heroInteractionMode === "explore") exitExploreMode();
  });
  window.addEventListener("resize", () => {
    if (!exploreRuntime) return;
    exploreRuntime.rect = frame.getBoundingClientRect();
    exploreRuntime.rangeX = window.innerWidth < 1280 ? 8 : 12;
    exploreRuntime.rangeY = window.innerWidth < 1280 ? 4 : 7;
    evaluateAvailability();
  }, { passive: true });
  pointerQuery.addEventListener?.("change", evaluateAvailability);
  evaluateAvailability();
}

function setCursorState(state = "DEFAULT") {
  if (!cursorRuntime) return;
  const normalized = String(state || "DEFAULT").toUpperCase();
  cursorRuntime.element.dataset.state = normalized;
  cursorRuntime.label.textContent = normalized === "DEFAULT" ? "" : normalized;
}

function resetCursorState() {
  setCursorState(appState.heroInteractionMode === "explore" ? "MOVE" : "DEFAULT");
}

function canEnableCustomCursor() {
  return !appState.reducedMotion && !appState.projectDialogOpen && !appState.coarsePointer && window.innerWidth >= 1024 && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function enableCustomCursor() {
  if (!cursorRuntime || !canEnableCustomCursor()) return;
  appState.cursorEnabled = true;
  cursorRuntime.keyboardMode = false;
  document.documentElement.classList.add("has-custom-cursor");
}

function disableCustomCursor() {
  appState.cursorEnabled = false;
  document.documentElement.classList.remove("has-custom-cursor");
  if (!cursorRuntime) return;
  cursorRuntime.visible = false;
  cursorRuntime.element.classList.remove("is-visible");
  resetCursorState();
}

function scheduleInteractionFrame() {
  const activeRuntime = cursorRuntime ?? exploreRuntime;
  if (!activeRuntime || activeRuntime.animationFrame) return;
  activeRuntime.animationFrame = requestAnimationFrame(runInteractionFrame);
}

function runInteractionFrame() {
  const activeRuntime = cursorRuntime ?? exploreRuntime;
  if (!activeRuntime) return;
  activeRuntime.animationFrame = 0;
  let continueAnimation = false;

  if (cursorRuntime && appState.cursorEnabled && cursorRuntime.visible) {
    cursorRuntime.dotX += (cursorRuntime.targetX - cursorRuntime.dotX) * 0.58;
    cursorRuntime.dotY += (cursorRuntime.targetY - cursorRuntime.dotY) * 0.58;
    const lagX = cursorRuntime.targetX - cursorRuntime.ringX;
    const lagY = cursorRuntime.targetY - cursorRuntime.ringY;
    cursorRuntime.ringX += lagX * 0.16;
    cursorRuntime.ringY += lagY * 0.16;
    /* Fluid squash-and-stretch: the ring deforms along its direction of travel. */
    const speed = Math.hypot(lagX, lagY);
    const stretch = Math.min(0.28, speed * 0.0035);
    const angle = Math.atan2(lagY, lagX) * (180 / Math.PI);
    const pressScale = cursorRuntime.pressed ? 0.8 : 1;
    cursorRuntime.dot.style.transform = `translate3d(${cursorRuntime.dotX}px, ${cursorRuntime.dotY}px, 0) scale(${pressScale})`;
    cursorRuntime.ring.style.transform = `translate3d(${cursorRuntime.ringX}px, ${cursorRuntime.ringY}px, 0) rotate(${angle}deg) scale(${(1 + stretch) * pressScale}, ${(1 - stretch * 0.65) * pressScale}) rotate(${-angle}deg)`;
    continueAnimation = speed > 0.25;
  }

  if (exploreRuntime) {
    exploreRuntime.currentX += (exploreRuntime.targetX - exploreRuntime.currentX) * 0.14;
    exploreRuntime.currentY += (exploreRuntime.targetY - exploreRuntime.currentY) * 0.14;
    const x = exploreRuntime.currentX;
    const y = exploreRuntime.currentY;
    exploreRuntime.motionLayer.style.transform = `translateX(-50%) translate3d(${x}px, ${y}px, 0)`;
    exploreRuntime.backgroundWord.style.transform = `translate(-50%, -50%) scaleX(0.86) translate3d(${-x * 0.22}px, ${-y * 0.18}px, 0)`;
    exploreRuntime.annotations.forEach((annotation, index) => {
      const factor = 0.22 + index * 0.08;
      annotation.style.transform = `translate3d(${x * factor}px, ${y * factor}px, 0)`;
    });
    const depthRemaining = Math.hypot(exploreRuntime.targetX - x, exploreRuntime.targetY - y);
    if (appState.heroInteractionMode !== "explore" && depthRemaining <= 0.12) {
      clearHeroDepthTransforms();
    } else {
      continueAnimation = continueAnimation || depthRemaining > 0.12;
    }
  }

  if (continueAnimation) scheduleInteractionFrame();
}

function initCustomCursor() {
  const element = document.querySelector("[data-custom-cursor]");
  const dot = element?.querySelector(".custom-cursor__dot");
  const ring = element?.querySelector(".custom-cursor__ring");
  const label = element?.querySelector("[data-cursor-label]");
  if (!element || !dot || !ring || !label) return;

  cursorRuntime = {
    element,
    dot,
    ring,
    label,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    dotX: window.innerWidth / 2,
    dotY: window.innerHeight / 2,
    ringX: window.innerWidth / 2,
    ringY: window.innerHeight / 2,
    visible: false,
    keyboardMode: false,
    pressed: false,
    animationFrame: 0,
  };
  setCursorState("DEFAULT");
  if (canEnableCustomCursor()) enableCustomCursor();
  const cursorPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  document.addEventListener("pointermove", (event) => {
    if (!canEnableCustomCursor()) return;
    if (!appState.cursorEnabled) enableCustomCursor();
    cursorRuntime.targetX = event.clientX;
    cursorRuntime.targetY = event.clientY;
    cursorRuntime.visible = true;
    cursorRuntime.element.classList.add("is-visible");
    scheduleInteractionFrame();
  }, { passive: true });

  document.addEventListener("pointerover", (event) => {
    if (!appState.cursorEnabled) return;
    const target = event.target instanceof Element ? event.target.closest("[data-cursor]") : null;
    if (target) {
      const state = appState.heroInteractionMode === "explore" && target.dataset.cursor !== "SCROLL" ? "MOVE" : target.dataset.cursor;
      setCursorState(state);
    }
  });
  document.addEventListener("pointerout", (event) => {
    const target = event.target instanceof Element ? event.target.closest("[data-cursor]") : null;
    const related = event.relatedTarget instanceof Element ? event.relatedTarget.closest("[data-cursor]") : null;
    if (target && target !== related) resetCursorState();
  });
  document.addEventListener("pointerdown", () => {
    if (!appState.cursorEnabled) return;
    cursorRuntime.pressed = true;
    scheduleInteractionFrame();
  }, { passive: true });
  document.addEventListener("pointerup", () => {
    cursorRuntime.pressed = false;
    scheduleInteractionFrame();
  }, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => {
    cursorRuntime.visible = false;
    element.classList.remove("is-visible");
  });
  window.addEventListener("blur", () => {
    cursorRuntime.visible = false;
    element.classList.remove("is-visible");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    cursorRuntime.keyboardMode = true;
    disableCustomCursor();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) disableCustomCursor();
    else if (canEnableCustomCursor() && !cursorRuntime.keyboardMode) enableCustomCursor();
  });
  cursorPointerQuery.addEventListener?.("change", () => {
    if (canEnableCustomCursor() && !cursorRuntime.keyboardMode) enableCustomCursor();
    else disableCustomCursor();
  });
  window.addEventListener("resize", () => {
    if (canEnableCustomCursor() && !cursorRuntime.keyboardMode) enableCustomCursor();
    else disableCustomCursor();
  }, { passive: true });
}

const missingAssetWarnings = new Set();

function configureImageFallback(container, image, filename) {
  if (!container || !(image instanceof HTMLImageElement) || !filename) return;
  const originalAlt = image.dataset.originalAlt ?? image.alt;
  image.dataset.originalAlt = originalAlt;
  container.dataset.assetRequest = filename;

  const markLoaded = () => {
    if (container.dataset.assetRequest !== filename) return;
    container.classList.add("has-image");
    container.classList.remove("is-missing");
    image.alt = originalAlt;
    image.removeAttribute("aria-hidden");
  };
  const markMissing = () => {
    if (container.dataset.assetRequest !== filename) return;
    container.classList.remove("has-image");
    container.classList.add("is-missing");
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    if (!missingAssetWarnings.has(filename)) {
      missingAssetWarnings.add(filename);
      console.warn(`Portfolio image is unavailable; showing placeholder: ${filename}`);
    }
  };

  image.addEventListener("load", markLoaded, { once: true });
  image.addEventListener("error", markMissing, { once: true });
  if (image.complete) image.naturalWidth > 0 ? markLoaded() : markMissing();
}

function initStaticImageFallbacks() {
  document.querySelectorAll("[data-image-fallback]").forEach((container) => {
    const image = container.querySelector("img");
    if (image) configureImageFallback(container, image, image.getAttribute("src"));
  });
}

function getSkillsForMode(mode = appState.mode) {
  return skillData.filter((skill) => skill.mode === mode);
}

function animateSkillFocus(targetValue) {
  if (!skillRuntime) return;
  if (skillRuntime.focusFrame) cancelAnimationFrame(skillRuntime.focusFrame);
  const output = skillRuntime.focusOutput;
  const startValue = Number.parseInt(output.textContent, 10) || targetValue;
  if (appState.reducedMotion || startValue === targetValue) {
    output.textContent = String(targetValue);
    return;
  }

  const startedAt = performance.now();
  const duration = 420;
  const update = (timestamp) => {
    const progress = Math.min((timestamp - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    output.textContent = String(Math.round(startValue + (targetValue - startValue) * eased));
    if (progress < 1) skillRuntime.focusFrame = requestAnimationFrame(update);
    else skillRuntime.focusFrame = 0;
  };
  skillRuntime.focusFrame = requestAnimationFrame(update);
}

function renderActiveSkill(skill, options = {}) {
  if (!skillRuntime || !skill) return;
  const { animate = true, announce = false } = options;
  const index = skillData.findIndex((item) => item.id === skill.id);

  skillRuntime.title.textContent = skill.title;
  skillRuntime.description.textContent = skill.description;
  skillRuntime.outcome.textContent = skill.outcome;
  skillRuntime.index.textContent = skill.index;
  skillRuntime.modeLabel.textContent = `${skill.mode === "design" ? "Design" : "Develop"}-focused practice`;
  skillRuntime.technologies.replaceChildren(...skill.technologies.map((technology) => {
    const item = document.createElement("li");
    item.textContent = technology;
    return item;
  }));

  skillRuntime.buttons.forEach((button) => {
    const selected = button.dataset.skillId === skill.id;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    const buttonSkill = skillData.find((item) => item.id === button.dataset.skillId);
    button.classList.toggle("is-mode-related", buttonSkill?.mode === appState.mode);
  });
  skillRuntime.panel.setAttribute("aria-labelledby", `skill-tab-${skill.id}`);
  skillRuntime.progress.style.width = `${((index + 1) / skillData.length) * 100}%`;
  animateSkillFocus(skill.focus);

  if (animate && !appState.reducedMotion && typeof skillRuntime.panel.animate === "function") {
    skillRuntime.panel.animate(
      [{ opacity: 0.55, transform: "translateY(0.45rem)" }, { opacity: 1, transform: "translateY(0)" }],
      { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
  }
  if (announce) announceInteraction(`${skill.title} expertise selected.`);
}

function selectSkill(skillId, options = {}) {
  const { manual = false, announce = true, animate = true, focus = false } = options;
  const skill = skillData.find((item) => item.id === skillId);
  if (!skill || !skillRuntime) return;
  appState.activeSkillId = skill.id;
  if (manual) appState.skillSelectionManual = true;
  renderActiveSkill(skill, { animate, announce });
  const activeBtn = skillRuntime.buttons.find((button) => button.dataset.skillId === skill.id);
  if (focus) activeBtn?.focus();
  if (activeBtn && window.matchMedia("(max-width: 47.99rem)").matches && typeof skillRuntime.path?.scrollTo === "function") {
    const left = activeBtn.offsetLeft - ((skillRuntime.path.clientWidth - activeBtn.offsetWidth) / 2);
    skillRuntime.path.scrollTo({ left: Math.max(0, left), behavior: appState.reducedMotion ? "auto" : "smooth" });
  }
}

function syncSkillWithPortfolioMode(mode = appState.mode) {
  if (!skillRuntime) return;
  const activeSkill = skillData.find((skill) => skill.id === appState.activeSkillId);
  if (activeSkill?.mode === mode) {
    renderActiveSkill(activeSkill, { animate: false, announce: false });
    return;
  }
  const nextSkill = getSkillsForMode(mode)[0];
  if (nextSkill) selectSkill(nextSkill.id, { manual: false, announce: false, animate: !appState.reducedMotion });
}

function initSkillSelector() {
  const panel = document.querySelector("#skill-panel");
  const path = document.querySelector(".skill-path[role='tablist']");
  const buttons = path ? [...path.querySelectorAll("[data-skill-id]")] : [];
  const focusOutput = document.querySelector("[data-skill-focus]");
  const progress = document.querySelector("[data-skill-progress]");
  const title = document.querySelector("[data-skill-title]");
  const description = document.querySelector("[data-skill-description]");
  const technologies = document.querySelector("[data-skill-technologies]");
  const outcome = document.querySelector("[data-skill-outcome]");
  const index = document.querySelector("[data-skill-index]");
  const modeLabel = document.querySelector("[data-skill-mode-label]");
  if (!panel || !path || !buttons.length || !focusOutput || !progress || !title || !description || !technologies || !outcome || !index || !modeLabel) return;

  skillRuntime = { panel, path, buttons, focusOutput, progress, title, description, technologies, outcome, index, modeLabel, focusFrame: 0 };
  const initialSkill = skillData.find((skill) => skill.id === appState.activeSkillId && skill.mode === appState.mode) ?? getSkillsForMode(appState.mode)[0] ?? skillData[0];
  appState.activeSkillId = initialSkill.id;
  renderActiveSkill(initialSkill, { animate: false, announce: false });

  buttons.forEach((button) => {
    button.addEventListener("click", () => selectSkill(button.dataset.skillId, { manual: true }));
  });
  path.addEventListener("keydown", (event) => {
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % buttons.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else return;
    event.preventDefault();
    selectSkill(buttons[nextIndex].dataset.skillId, { manual: true, focus: true });
  });
}

function renderProjectCards() {
  if (!projectRuntime?.grid) return;
  projectRuntime.grid.innerHTML = projectData.map((project, index) => `
    <article class="project-card" data-project-id="${project.id}" data-category="${project.category}" data-theme="${project.theme}" data-reveal="fade-up" data-speed="${index % 2 === 0 ? "0.12" : "0.24"}">
      <span class="project-card__index" aria-hidden="true">${project.number}</span>
      <h3 class="project-card__title">${project.title}</h3>
      <div class="project-card__aside">
        <span class="project-card__tag">${project.type} / ${project.year}</span>
        <span class="project-card__cue" aria-hidden="true">${project.status ?? "Concept"} <i aria-hidden="true">↗</i></span>
      </div>
      <div class="project-card__thumb" aria-hidden="true">
        <div class="asset-placeholder" role="img" aria-label="Placeholder for ${project.image}"><span>Image placeholder</span><strong>${project.image}</strong></div>
        <img src="${project.image}" width="${project.imageWidth ?? 1600}" height="${project.imageHeight ?? 1000}" loading="lazy" decoding="async" alt="">
      </div>
      <button class="project-card__open" type="button" aria-label="View case study for ${project.title}" data-project-open="${project.id}" data-cursor="VIEW CASE"><span class="visually-hidden">View ${project.title} case study</span></button>
    </article>
  `).join("");

  projectRuntime.cards = [...projectRuntime.grid.querySelectorAll(".project-card")];
  projectRuntime.cards.forEach((card) => {
    const project = projectData.find((item) => item.id === card.dataset.projectId);
    const image = card.querySelector("img");
    if (project && image) configureImageFallback(card, image, project.image);
    card.querySelector("[data-project-open]")?.addEventListener("click", (event) => openProjectDialog(card.dataset.projectId, event.currentTarget));
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--thumb-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--thumb-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
  });
  syncProjectMode(appState.mode);
}

function syncProjectMode(mode = appState.mode) {
  if (!projectRuntime?.cards) return;
  projectRuntime.cards.forEach((card) => {
    const project = projectData.find((item) => item.id === card.dataset.projectId);
    if (!project) return;
    const emphasized = mode === "design" ? ["frontend", "experiment"].includes(project.category) : project.category === "full-stack";
    card.classList.toggle("is-mode-emphasized", emphasized);
  });
}

function getStoredProjectFilter() {
  try {
    const stored = sessionStorage.getItem(PROJECT_FILTER_SESSION_KEY);
    return ["all", "frontend", "full-stack", "experiment"].includes(stored) ? stored : "all";
  } catch (error) {
    console.warn("Project filter session state is unavailable.", error);
    return "all";
  }
}

function getVisibleProjects() {
  return projectData.filter((project) => appState.projectFilter === "all" || project.category === appState.projectFilter);
}

function updateProjectCount() {
  const visible = getVisibleProjects();
  const count = document.querySelector("[data-project-count]");
  const label = document.querySelector("[data-active-filter]");
  if (count) count.textContent = `${visible.length} ${visible.length === 1 ? "project" : "projects"}`;
  if (label) label.textContent = appState.projectFilter === "all" ? "All" : appState.projectFilter === "full-stack" ? "Full-stack" : appState.projectFilter === "experiment" ? "Experiments" : "Frontend";
}

function filterProjectCards(options = {}) {
  if (!projectRuntime?.cards) return;
  const { immediate = false } = options;
  window.clearTimeout(projectRuntime.filterTimer);
  const shouldUpdateImmediately = immediate || appState.reducedMotion;
  const oldHeight = projectRuntime.grid.offsetHeight;
  if (!shouldUpdateImmediately && oldHeight) projectRuntime.grid.style.minHeight = `${oldHeight}px`;
  projectRuntime.grid.setAttribute("aria-busy", "true");

  projectRuntime.cards.forEach((card) => {
    const visible = appState.projectFilter === "all" || card.dataset.category === appState.projectFilter;
    const openButton = card.querySelector("[data-project-open]");
    if (visible) {
      card.hidden = false;
      if (openButton) openButton.tabIndex = 0;
      if (!shouldUpdateImmediately) {
        card.classList.add("is-filtering-out");
        requestAnimationFrame(() => card.classList.remove("is-filtering-out"));
      } else card.classList.remove("is-filtering-out");
    } else {
      if (openButton) openButton.tabIndex = -1;
      if (shouldUpdateImmediately) card.hidden = true;
      else card.classList.add("is-filtering-out");
    }
  });

  const finish = () => {
    projectRuntime.cards.forEach((card) => {
      const visible = appState.projectFilter === "all" || card.dataset.category === appState.projectFilter;
      card.hidden = !visible;
      card.classList.remove("is-filtering-out");
    });
    projectRuntime.grid.style.removeProperty("min-height");
    projectRuntime.grid.removeAttribute("aria-busy");
  };
  if (shouldUpdateImmediately) finish();
  else projectRuntime.filterTimer = window.setTimeout(finish, 240);

  updateProjectCount();
  if (appState.projectDialogOpen && !getVisibleProjects().some((project) => project.id === appState.activeProjectId)) {
    const firstVisible = getVisibleProjects()[0];
    if (firstVisible) renderProjectDialog(firstVisible.id, true);
  }
}

function setProjectFilter(filter, options = {}) {
  const { persist = true, announce = true, immediate = false } = options;
  const validFilter = ["all", "frontend", "full-stack", "experiment"].includes(filter) ? filter : "all";
  appState.projectFilter = validFilter;
  if (persist) {
    try {
      sessionStorage.setItem(PROJECT_FILTER_SESSION_KEY, validFilter);
    } catch (error) {
      console.warn("Project filter session state could not be saved.", error);
    }
  }

  projectRuntime?.filterButtons.forEach((button, index) => {
    const selected = button.dataset.projectFilter === validFilter;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    if (selected) {
      projectRuntime.filters.style.setProperty("--filter-index", index);
      projectRuntime.grid.setAttribute("aria-labelledby", button.id);
    }
  });
  filterProjectCards({ immediate });
  const visibleCount = getVisibleProjects().length;
  if (announce) announceInteraction(`${updateFilterAnnouncement(validFilter)} filter selected. ${visibleCount} ${visibleCount === 1 ? "project" : "projects"} shown.`);
}

function updateFilterAnnouncement(filter) {
  if (filter === "full-stack") return "Full-stack";
  if (filter === "experiment") return "Experiments";
  return filter.charAt(0).toUpperCase() + filter.slice(1);
}

function initProjectFilters() {
  if (!projectRuntime) return;
  const filters = document.querySelector("[data-project-filters]");
  const buttons = filters ? [...filters.querySelectorAll("[data-project-filter]")] : [];
  if (!filters || !buttons.length) return;
  projectRuntime.filters = filters;
  projectRuntime.filterButtons = buttons;

  buttons.forEach((button) => button.addEventListener("click", () => setProjectFilter(button.dataset.projectFilter)));
  filters.addEventListener("keydown", (event) => {
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else return;
    event.preventDefault();
    buttons[nextIndex].focus();
    setProjectFilter(buttons[nextIndex].dataset.projectFilter);
  });
  setProjectFilter(getStoredProjectFilter(), { persist: false, announce: false, immediate: true });
}

function renderProjectDialog(projectId, announce = false) {
  if (!projectRuntime?.dialog) return;
  const project = projectData.find((item) => item.id === projectId);
  if (!project) return;
  projectRuntime.dialog.dataset.projectId = project.id;
  appState.activeProjectId = project.id;
  const textBindings = {
    number: project.number,
    "case-type": project.caseType ?? "Fictional concept project",
    title: project.title,
    type: project.type,
    year: project.year,
    role: project.role,
    overview: project.details.overview,
    challenge: project.details.challenge,
    approach: project.details.approach,
    implementation: project.details.implementation,
    result: project.details.result,
  };
  Object.entries(textBindings).forEach(([key, value]) => {
    const output = projectRuntime.dialog.querySelector(`[data-dialog-${key}]`);
    if (output) output.textContent = value;
  });
  const technologies = projectRuntime.dialog.querySelector("[data-dialog-technologies]");
  if (technologies) technologies.replaceChildren(...project.technologies.map((technology) => {
    const item = document.createElement("li");
    item.textContent = technology;
    return item;
  }));

  [
    ["[data-dialog-live]", project.liveUrl],
    ["[data-dialog-repository]", project.repositoryUrl],
  ].forEach(([selector, url]) => {
    const link = projectRuntime.dialog.querySelector(selector);
    if (!(link instanceof HTMLAnchorElement)) return;
    link.hidden = !url;
    if (url) link.href = url;
    else link.removeAttribute("href");
  });

  const gallery = projectRuntime.dialog.querySelector("[data-dialog-gallery]");
  if (gallery) {
    const galleryItems = Array.isArray(project.gallery) ? project.gallery : [];
    gallery.replaceChildren(...galleryItems.map((media) => {
      const figure = document.createElement("figure");
      const galleryImage = document.createElement("img");
      const caption = document.createElement("figcaption");
      galleryImage.src = media.image;
      galleryImage.width = media.width;
      galleryImage.height = media.height;
      galleryImage.alt = media.alt;
      galleryImage.loading = "lazy";
      galleryImage.decoding = "async";
      galleryImage.addEventListener("error", () => figure.remove(), { once: true });
      caption.textContent = media.caption;
      figure.append(galleryImage, caption);
      return figure;
    }));
    gallery.hidden = galleryItems.length === 0;
  }

  const image = projectRuntime.dialog.querySelector("[data-dialog-image]");
  const imageWrap = projectRuntime.dialog.querySelector("[data-dialog-image-wrap]");
  const imageName = projectRuntime.dialog.querySelector("[data-dialog-image-name]");
  const placeholder = projectRuntime.dialog.querySelector("[data-dialog-placeholder]");
  if (image && imageWrap) {
    imageWrap.classList.remove("has-image", "is-missing");
    image.dataset.originalAlt = project.imageAlt ?? `${project.title}, fictional ${project.type}`;
    image.alt = image.dataset.originalAlt;
    image.src = project.image;
    image.width = project.imageWidth ?? 1600;
    image.height = project.imageHeight ?? 1000;
    if (imageName) imageName.textContent = project.image;
    if (placeholder) placeholder.setAttribute("aria-label", `Placeholder for ${project.image}`);
    configureImageFallback(imageWrap, image, project.image);
  }
  if (announce) announceInteraction(`${project.title} project details displayed.`);
}

function openProjectDialog(projectId, trigger) {
  if (!projectRuntime?.dialog || appState.projectDialogOpen || appState.mobileMenuOpen) return;
  if (appState.heroInteractionMode === "explore") exitExploreMode({ restoreFocus: false });
  projectRuntime.lastTrigger = trigger instanceof HTMLElement ? trigger : null;
  renderProjectDialog(projectId, false);
  appState.projectDialogOpen = true;
  syncBodyInteractionState();
  const dialog = projectRuntime.dialog;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else {
    dialog.setAttribute("open", "");
    dialog.setAttribute("aria-modal", "true");
  }
  lockPageScroll("project-dialog");
  disableCustomCursor();
  requestAnimationFrame(() => {
    dialog.classList.add("is-open");
    projectRuntime.closeButton?.focus({ preventScroll: true });
  });
  announceInteraction(`${projectData.find((project) => project.id === projectId)?.title ?? "Project"} dialog opened.`);
}

function closeProjectDialog() {
  if (!projectRuntime?.dialog || !appState.projectDialogOpen) return;
  window.clearTimeout(projectRuntime.dialogCloseTimer);
  const dialog = projectRuntime.dialog;
  dialog.classList.remove("is-open");
  const finish = () => {
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
    appState.projectDialogOpen = false;
    appState.activeProjectId = null;
    syncBodyInteractionState();
    unlockPageScroll("project-dialog");
    const trigger = projectRuntime.lastTrigger;
    projectRuntime.lastTrigger = null;
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    if (canEnableCustomCursor() && !cursorRuntime?.keyboardMode) enableCustomCursor();
    announceInteraction("Project dialog closed.");
  };
  if (appState.reducedMotion) finish();
  else projectRuntime.dialogCloseTimer = window.setTimeout(finish, 180);
}

function showAdjacentProject(direction) {
  const visible = getVisibleProjects();
  if (!visible.length) return;
  const currentIndex = Math.max(0, visible.findIndex((project) => project.id === appState.activeProjectId));
  const nextIndex = (currentIndex + direction + visible.length) % visible.length;
  renderProjectDialog(visible[nextIndex].id, true);
}

function showPreviousProject() {
  showAdjacentProject(-1);
}

function showNextProject() {
  showAdjacentProject(1);
}

function initProjectCards() {
  const grid = document.querySelector("[data-project-grid]");
  const dialog = document.querySelector("[data-project-dialog]");
  if (!grid) return;
  projectRuntime = {
    grid,
    dialog,
    cards: [],
    filters: null,
    filterButtons: [],
    filterTimer: 0,
    dialogCloseTimer: 0,
    lastTrigger: null,
    closeButton: dialog?.querySelector("[data-dialog-close]") ?? null,
  };
  renderProjectCards();
  if (!dialog) return;

  projectRuntime.closeButton?.addEventListener("click", closeProjectDialog);
  dialog.querySelector("[data-dialog-previous]")?.addEventListener("click", showPreviousProject);
  dialog.querySelector("[data-dialog-next]")?.addEventListener("click", showNextProject);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeProjectDialog();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeProjectDialog();
  });
  dialog.addEventListener("keydown", (event) => {
    const target = event.target;
    const editable = target instanceof Element && target.closest("input, textarea, select, [contenteditable='true'], [data-horizontal-scroll]");
    if (!editable && event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousProject();
    } else if (!editable && event.key === "ArrowRight") {
      event.preventDefault();
      showNextProject();
    }
  });
}

function initMagneticElements() {
  const magneticTargets = document.querySelectorAll(
    ".site-navigation a, .contact-pill, .mode-selector__option, .hero-mode__button, .project-filters button, .contact-action, .copy-email, .back-to-top, .back-to-scroll, .project-dialog__close, .loader__skip"
  );
  magneticTargets.forEach((element) => {
    element.classList.add("is-magnetic");
    element.addEventListener("pointermove", (event) => {
      if (!appState.cursorEnabled || appState.reducedMotion) return;
      const bounds = element.getBoundingClientRect();
      const pullX = (event.clientX - (bounds.left + bounds.width / 2)) * 0.32;
      const pullY = (event.clientY - (bounds.top + bounds.height / 2)) * 0.32;
      element.style.translate = `${pullX.toFixed(1)}px ${pullY.toFixed(1)}px`;
    }, { passive: true });
    element.addEventListener("pointerleave", () => {
      element.style.translate = "0px 0px";
    }, { passive: true });
  });
}

function registerRevealElements() {
  return [...document.querySelectorAll("[data-reveal], [data-scroll-image]")];
}

function destroyScrollMotion({ showContent = true } = {}) {
  if (!revealRuntime) return;
  const { gsap, elements, tweens, parallaxTweens, extraTweens = [], extraTickers = [], lenis, ticker } = revealRuntime;
  [...tweens, ...parallaxTweens, ...extraTweens].forEach((tween) => tween?.kill());
  extraTickers.forEach((fn) => gsap?.ticker.remove(fn));
  if (ticker && gsap) gsap.ticker.remove(ticker);
  lenis?.destroy();
  if (showContent && gsap && elements.length) {
    gsap.set(elements, { clearProps: "opacity,visibility,transform" });
    gsap.set(document.querySelectorAll("[data-speed]"), { clearProps: "--parallax-y" });
    gsap.set(document.querySelectorAll(".split-word"), { clearProps: "transform,opacity,visibility" });
    gsap.set(document.querySelectorAll(".projects-grid, .site-footer__word, .process-stage__ghost"), { clearProps: "transform" });
  }
  revealRuntime = null;
}

/* Wrap each word of a plain-text heading in an overflow mask so lines can
   slide up from behind an invisible edge — the signature kinetic-type reveal. */
function splitHeadingIntoWords(element) {
  if (element.dataset.splitReady || element.children.length > 0) return null;
  const text = element.textContent;
  element.dataset.splitReady = "true";
  element.setAttribute("aria-label", text.trim());
  const fragment = document.createDocumentFragment();
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      fragment.append(document.createTextNode(" "));
      return;
    }
    const mask = document.createElement("span");
    mask.className = "split-mask";
    mask.setAttribute("aria-hidden", "true");
    const word = document.createElement("span");
    word.className = "split-word";
    word.textContent = part;
    mask.append(word);
    fragment.append(mask);
  });
  element.replaceChildren(fragment);
  return [...element.querySelectorAll(".split-word")];
}

function initScrollReveals() {
  scrollMotionReady = true;
  initStaticImageFallbacks();
  destroyScrollMotion();
  const elements = registerRevealElements();
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const Lenis = window.Lenis;

  if (appState.reducedMotion || !gsap || !ScrollTrigger || !Lenis) {
    if (!appState.reducedMotion) console.warn("GSAP, ScrollTrigger, or Lenis was unavailable; scroll content remains visible.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  const lenis = new Lenis({
    duration: 1.45,
    easing: (time) => Math.min(1, 1.001 - Math.pow(2, -10 * time)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1,
    touchMultiplier: 1,
    anchors: true,
  });
  const ticker = (time) => lenis.raf(time * 1000);
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(ticker);
  gsap.ticker.lagSmoothing(0);
  const extraTweens = [];
  const extraTickers = [];

  const tweens = elements.map((element) => {
    const isImage = element.hasAttribute("data-scroll-image");
    /* Big headings get the masked word-by-word reveal instead of a plain fade. */
    if (!isImage && element.dataset.reveal === "clip") {
      const words = splitHeadingIntoWords(element) ?? [...element.querySelectorAll(".split-word")];
      if (words.length) {
        gsap.set(element, { autoAlpha: 1, y: 0 });
        gsap.set(words, { yPercent: 112 });
        return gsap.to(words, {
          yPercent: 0,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.055,
          overwrite: "auto",
          scrollTrigger: {
            trigger: element,
            start: "top 88%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
          },
        });
      }
    }
    const distance = isImage ? 96 : element.dataset.reveal === "clip" ? 78 : 64;
    gsap.set(element, { autoAlpha: 0, y: distance });
    return gsap.to(element, {
      autoAlpha: 1,
      y: 0,
      duration: isImage ? 1.15 : 1.05,
      ease: "power3.out",
      overwrite: "auto",
      scrollTrigger: {
        trigger: element,
        start: "top 85%",
        toggleActions: "play none none reverse",
        invalidateOnRefresh: true,
      },
    });
  });

  /* Hero depth drift: portrait and giant word separate at different speeds as
     the hero scrolls away. Uses the composable `translate` property so the
     explore-mode `transform` interactions stay untouched. */
  const heroFrame = document.querySelector(".hero__frame");
  if (heroFrame) {
    extraTweens.push(gsap.fromTo(heroFrame, { "--hero-drift": "0vh", "--hero-word-drift": "0vh" }, {
      "--hero-drift": "14vh",
      "--hero-word-drift": "-20vh",
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true, invalidateOnRefresh: true },
    }));
  }

  /* Project imagery parallax inside its frame, via CSS vars to stay
     composable with the existing hover transforms. */
  document.querySelectorAll(".project-card:not([data-project-id='bizguide-ai']) .project-card__thumb").forEach((media) => {
    extraTweens.push(gsap.fromTo(media, { "--media-shift": "-5.5%" }, {
      "--media-shift": "5.5%",
      ease: "none",
      scrollTrigger: { trigger: media, start: "top bottom", end: "bottom top", scrub: 1.1, invalidateOnRefresh: true },
    }));
  });

  /* Ghost words slide horizontally with scroll. */
  const footerWord = document.querySelector(".site-footer__word");
  if (footerWord) {
    extraTweens.push(gsap.fromTo(footerWord, { xPercent: 6 }, {
      xPercent: -6,
      ease: "none",
      scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true },
    }));
  }

  /* Contact marquee becomes a living ticker whose speed reacts to scroll velocity. */
  const marquee = document.querySelector(".contact-section__marquee");
  if (marquee && !marquee.dataset.marqueeReady) {
    marquee.dataset.marqueeReady = "true";
    const marqueeText = marquee.textContent.trim();
    marquee.replaceChildren(...[0, 1, 2].map(() => {
      const span = document.createElement("span");
      span.textContent = marqueeText;
      return span;
    }));
  }
  if (marquee) {
    const marqueeTween = gsap.to(marquee.children, { xPercent: -100, ease: "none", duration: 26, repeat: -1 });
    extraTweens.push(marqueeTween);
    let marqueeBoost = 1;
    const marqueeTicker = () => {
      marqueeBoost += (1 - marqueeBoost) * 0.06;
      marqueeTween.timeScale(marqueeBoost);
    };
    gsap.ticker.add(marqueeTicker);
    extraTickers.push(marqueeTicker);
    lenis.on("scroll", (event) => {
      const boost = 1 + Math.min(5, Math.abs(event.velocity) * 0.14);
      if (boost > marqueeBoost) marqueeBoost = boost;
    });
  }

  /* Scroll-velocity skew: the work grid shears slightly under fast scrolling. */
  const skewTarget = document.querySelector(".projects-grid");
  if (skewTarget) {
    let currentSkew = 0;
    let targetSkew = 0;
    const skewSetter = gsap.quickSetter(skewTarget, "skewY", "deg");
    lenis.on("scroll", (event) => {
      targetSkew = gsap.utils.clamp(-3.2, 3.2, event.velocity * 0.055);
    });
    const skewTicker = () => {
      currentSkew += (targetSkew - currentSkew) * 0.09;
      targetSkew *= 0.92;
      skewSetter(Math.abs(currentSkew) < 0.01 ? 0 : currentSkew);
    };
    gsap.ticker.add(skewTicker);
    extraTickers.push(skewTicker);
  }

  const parallaxTweens = [...document.querySelectorAll("[data-speed]")].map((element) => {
    const speed = gsap.utils.clamp(-0.6, 0.6, Number.parseFloat(element.dataset.speed) || 0);
    const distance = 56 * speed;
    return gsap.fromTo(element,
      { "--parallax-y": `${distance}px` },
      {
        "--parallax-y": `${-distance}px`,
        ease: "none",
        scrollTrigger: {
          trigger: element.closest("section") || element,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
      });
  });

  revealRuntime = { elements, gsap, ScrollTrigger, tweens, parallaxTweens, extraTweens, extraTickers, lenis, ticker };
  if (scrollLocks.size) lenis.stop();
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh, { once: true });
  document.querySelectorAll("main img[loading='lazy']").forEach((image) => {
    if (!image.complete) image.addEventListener("load", refresh, { once: true });
  });
  requestAnimationFrame(refresh);
  window.addEventListener("pagehide", () => destroyScrollMotion({ showContent: false }), { once: true });
}

function handlePhaseFourMotionChange(reduced) {
  if (reduced) destroyScrollMotion();
  else if (scrollMotionReady) initScrollReveals();
  if (skillRuntime) {
    if (skillRuntime.focusFrame) cancelAnimationFrame(skillRuntime.focusFrame);
    const activeSkill = skillData.find((skill) => skill.id === appState.activeSkillId);
    if (activeSkill) renderActiveSkill(activeSkill, { animate: false, announce: false });
  }
  if (projectRuntime?.cards) filterProjectCards({ immediate: true });
  if (processRuntime) renderProcessStage(processData.find((stage) => stage.id === appState.activeProcessId), { announce: false });
  if (testimonialRuntime) renderTestimonial(testimonialData[appState.testimonialIndex], { announce: false });
  if (statementRuntime) reduced ? pauseCircularStatement() : resumeCircularStatement();
}

function renderProcessStage(stage, options = {}) {
  if (!processRuntime || !stage) return;
  const { announce = false } = options;
  const panel = processRuntime.panel;
  panel.classList.add("is-updating");
  const bindings = {
    "[data-process-index]": stage.index,
    "[data-process-label]": stage.label,
    "[data-process-title]": stage.title,
    "[data-process-description]": stage.description,
    "[data-process-output]": stage.output,
    "[data-process-current]": stage.index,
  };
  Object.entries(bindings).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  });
  const activities = panel.querySelector("[data-process-activities]");
  if (activities) activities.innerHTML = stage.activities.map((activity) => `<li>${activity}</li>`).join("");
  const stageIndex = processData.findIndex((item) => item.id === stage.id);
  const progress = panel.querySelector("[data-process-progress]");
  if (progress) progress.style.transform = `scaleX(${(stageIndex + 1) / processData.length})`;
  processRuntime.buttons.forEach((button) => {
    const selected = button.dataset.processStage === stage.id;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.classList.toggle("is-active", selected);
    if (selected) panel.setAttribute("aria-labelledby", button.id);
  });
  requestAnimationFrame(() => panel.classList.remove("is-updating"));
  if (announce) announceInteraction(`${stage.title} process stage selected.`);
}

function selectProcessStage(stageId, options = {}) {
  const stage = processData.find((item) => item.id === stageId);
  if (!stage || !processRuntime) return;
  const { manual = false, focus = false, announce = true } = options;
  appState.activeProcessId = stage.id;
  if (manual) appState.processSelectionManual = true;
  renderProcessStage(stage, { announce });
  if (focus) {
    const button = processRuntime.buttons.find((item) => item.dataset.processStage === stage.id);
    button?.focus({ preventScroll: true });
    if (button && window.matchMedia("(max-width: 47.99rem)").matches && typeof processRuntime.tabs.scrollTo === "function") {
      const left = button.offsetLeft - ((processRuntime.tabs.clientWidth - button.offsetWidth) / 2);
      processRuntime.tabs.scrollTo({ left: Math.max(0, left), behavior: appState.reducedMotion ? "auto" : "smooth" });
    }
  }
}

function moveProcessStage(direction) {
  const currentIndex = Math.max(0, processData.findIndex((stage) => stage.id === appState.activeProcessId));
  const nextIndex = (currentIndex + direction + processData.length) % processData.length;
  selectProcessStage(processData[nextIndex].id, { manual: true, focus: false });
}

function syncProcessWithPortfolioMode(mode = appState.mode) {
  if (!processRuntime) return;
  const designStages = new Set(["discover", "define", "design"]);
  processRuntime.buttons.forEach((button) => {
    const emphasized = mode === "design" ? designStages.has(button.dataset.processStage) : !designStages.has(button.dataset.processStage);
    button.classList.toggle("is-mode-emphasized", emphasized);
  });
  if (!appState.processSelectionManual) selectProcessStage(mode === "design" ? "design" : "engineer", { announce: false });
}

function initProcessTimeline() {
  const root = document.querySelector("[data-process]");
  const tabs = root?.querySelector("[data-process-tabs]");
  const panel = root?.querySelector("[data-process-panel]");
  if (!root || !tabs || !panel) return;
  tabs.innerHTML = processData.map((stage) => `<button id="process-tab-${stage.id}" type="button" role="tab" aria-controls="process-panel" aria-selected="false" tabindex="-1" data-process-stage="${stage.id}" data-cursor="STEP"><span>${stage.index}</span><strong>${stage.title}</strong><i aria-hidden="true"></i></button>`).join("");
  processRuntime = { root, tabs, panel, buttons: [...tabs.querySelectorAll("[data-process-stage]")] };
  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-process-stage]");
    if (button) selectProcessStage(button.dataset.processStage, { manual: true });
  });
  tabs.addEventListener("keydown", (event) => {
    const currentIndex = processRuntime.buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % processData.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + processData.length) % processData.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = processData.length - 1;
    else return;
    event.preventDefault();
    selectProcessStage(processData[nextIndex].id, { manual: true, focus: true });
  });
  root.querySelector("[data-process-previous]")?.addEventListener("click", () => moveProcessStage(-1));
  root.querySelector("[data-process-next]")?.addEventListener("click", () => moveProcessStage(1));
  syncProcessWithPortfolioMode(appState.mode);
}

function renderTestimonial(testimonial, options = {}) {
  if (!testimonialRuntime || !testimonial) return;
  const { announce = false } = options;
  const panel = testimonialRuntime.panel;
  const bindings = {
    "[data-testimonial-quote]": testimonial.quote,
    "[data-testimonial-name]": testimonial.name,
    "[data-testimonial-role]": testimonial.role,
    "[data-testimonial-company]": testimonial.company,
    "[data-testimonial-project]": testimonial.project,
    "[data-testimonial-result]": testimonial.result,
    "[data-testimonial-current]": String(appState.testimonialIndex + 1).padStart(2, "0"),
  };
  panel.classList.add("is-changing");
  Object.entries(bindings).forEach(([selector, value]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  });
  testimonialRuntime.indexButtons.forEach((button, index) => {
    const selected = index === appState.testimonialIndex;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  requestAnimationFrame(() => panel.classList.remove("is-changing"));
  if (announce) announceInteraction(`Testimonial ${appState.testimonialIndex + 1} of ${testimonialData.length}: ${testimonial.role}, ${testimonial.company}.`);
}

function selectTestimonial(index, options = {}) {
  const normalizedIndex = (index + testimonialData.length) % testimonialData.length;
  appState.testimonialIndex = normalizedIndex;
  renderTestimonial(testimonialData[normalizedIndex], options);
  if (options.focus) testimonialRuntime?.indexButtons[normalizedIndex]?.focus({ preventScroll: true });
}

function showPreviousTestimonial() { selectTestimonial(appState.testimonialIndex - 1, { announce: true }); }
function showNextTestimonial() { selectTestimonial(appState.testimonialIndex + 1, { announce: true }); }

function initTestimonials() {
  const root = document.querySelector("[data-testimonials]");
  const panel = root?.querySelector("[data-testimonial-panel]");
  if (!root || !panel) return;
  testimonialRuntime = { root, panel, indexButtons: [...root.querySelectorAll("[data-testimonial-select]")], hidden: document.hidden, pointerStart: null };
  root.querySelector("[data-testimonial-previous]")?.addEventListener("click", showPreviousTestimonial);
  root.querySelector("[data-testimonial-next]")?.addEventListener("click", showNextTestimonial);
  const index = root.querySelector("[data-testimonial-index]");
  index?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-testimonial-select]");
    if (button) selectTestimonial(Number(button.dataset.testimonialSelect), { announce: true });
  });
  index?.addEventListener("keydown", (event) => {
    const currentIndex = testimonialRuntime.indexButtons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % testimonialData.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + testimonialData.length) % testimonialData.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = testimonialData.length - 1;
    else return;
    event.preventDefault();
    selectTestimonial(nextIndex, { announce: true, focus: true });
  });
  panel.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") testimonialRuntime.pointerStart = { x: event.clientX, y: event.clientY };
  });
  panel.addEventListener("pointerup", (event) => {
    const start = testimonialRuntime.pointerStart;
    testimonialRuntime.pointerStart = null;
    if (!start || event.pointerType !== "touch") return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) deltaX < 0 ? showNextTestimonial() : showPreviousTestimonial();
  });
  document.addEventListener("visibilitychange", () => { if (testimonialRuntime) testimonialRuntime.hidden = document.hidden; });
  selectTestimonial(0, { announce: false });
}

function pauseCircularStatement() { statementRuntime?.root.classList.add("is-paused"); }
function resumeCircularStatement() {
  if (!statementRuntime || !appState.statementVisible || appState.reducedMotion) return;
  if (!statementRuntime.root.matches(":hover, :focus-within")) statementRuntime.root.classList.remove("is-paused");
}
function setCircularStatementVisibility(visible) {
  appState.statementVisible = visible;
  statementRuntime?.root.classList.toggle("is-outside", !visible);
  if (visible) resumeCircularStatement();
}

function initCircularText() {
  const root = document.querySelector("[data-statement-orbit]");
  if (!root) return;
  statementRuntime = { root, observer: null };
  root.addEventListener("pointerenter", pauseCircularStatement);
  root.addEventListener("pointerleave", resumeCircularStatement);
  root.addEventListener("focusin", pauseCircularStatement);
  root.addEventListener("focusout", resumeCircularStatement);
  const imageWrap = root.querySelector("[data-statement-image-wrap]");
  const image = imageWrap?.querySelector("img");
  if (imageWrap && image) configureImageFallback(imageWrap, image, "images/portrait-small.jpg");
  if ("IntersectionObserver" in window) {
    statementRuntime.observer = new IntersectionObserver(([entry]) => setCircularStatementVisibility(Boolean(entry?.isIntersecting)), { threshold: 0.1 });
    statementRuntime.observer.observe(root);
  } else setCircularStatementVisibility(true);
  window.addEventListener("pagehide", () => statementRuntime?.observer?.disconnect(), { once: true });
}

async function copyEmailAddress(email) {
  if (!email) throw new Error("No email address is available.");
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(email);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = email;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = typeof document.execCommand === "function" && document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Clipboard access was blocked.");
}

function showCopyFeedback(button, state) {
  if (!button || !copyEmailRuntime) return;
  window.clearTimeout(copyEmailRuntime.timer);
  const messages = { success: "Email copied", error: "Copy failed — select email" };
  button.textContent = messages[state] ?? copyEmailRuntime.originalText;
  button.dataset.copyState = state;
  const announcement = state === "success" ? "Email address copied to clipboard." : "Email could not be copied. Use the visible email link instead.";
  announceInteraction(announcement);
  copyEmailRuntime.timer = window.setTimeout(() => {
    button.textContent = copyEmailRuntime.originalText;
    delete button.dataset.copyState;
  }, 2000);
}

function initCopyEmail() {
  const button = document.querySelector("[data-email].copy-email");
  if (!button) return;
  copyEmailRuntime = { button, originalText: button.textContent.trim(), timer: 0, busy: false };
  button.addEventListener("click", async () => {
    if (copyEmailRuntime.busy) return;
    copyEmailRuntime.busy = true;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      await copyEmailAddress(button.dataset.email);
      showCopyFeedback(button, "success");
    } catch (error) {
      console.warn("Email copy was unavailable.", error);
      showCopyFeedback(button, "error");
    } finally {
      copyEmailRuntime.busy = false;
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  });
}

function scrollToTop() {
  window.clearTimeout(backToTopTimer);
  if (!appState.reducedMotion && revealRuntime?.lenis) revealRuntime.lenis.scrollTo(0, { duration: 1.2 });
  else window.scrollTo({ top: 0, left: 0, behavior: appState.reducedMotion ? "auto" : "smooth" });
  const target = document.querySelector("#hero-title");
  backToTopTimer = window.setTimeout(() => target?.focus({ preventScroll: true }), appState.reducedMotion ? 0 : 500);
  announceInteraction("Returned to the top of the portfolio.");
}

let profileDossierRuntime = null;

function selectProfileCard(targetSelector, options = {}) {
  if (!profileDossierRuntime) return;
  const { announce = false, scroll = false, focus = false } = options;
  const targetCard = profileDossierRuntime.cards.find((c) => `#${c.id}` === targetSelector || c.id === targetSelector.replace("#", ""));
  if (!targetCard) return;

  const targetId = `#${targetCard.id}`;

  // Update Navigation Tab States
  profileDossierRuntime.navButtons.forEach((btn) => {
    const isSelected = btn.dataset.profileTarget === targetId;
    btn.classList.toggle("is-active", isSelected);
    btn.setAttribute("aria-selected", String(isSelected));
    btn.tabIndex = isSelected ? 0 : -1;
    if (isSelected && focus) {
      btn.focus({ preventScroll: true });
    }
  });

  // Update Card States
  profileDossierRuntime.cards.forEach((card) => {
    const isCurrent = card === targetCard;
    card.classList.toggle("is-active", isCurrent);
  });

  const activeBtn = profileDossierRuntime.navButtons.find((btn) => btn.dataset.profileTarget === targetId);
  const currentIndex = profileDossierRuntime.cards.indexOf(targetCard);
  if (currentIndex >= 0) {
    profileDossierRuntime.mobileStep.textContent = `${String(currentIndex + 1).padStart(2, "0")} / ${String(profileDossierRuntime.cards.length).padStart(2, "0")}`;
    profileDossierRuntime.mobileLabel.textContent = activeBtn?.querySelector(".profile-nav__title")?.textContent || "";
  }

  // Auto-scroll horizontal pill rail on mobile
  if (activeBtn && window.innerWidth <= 767) {
    const parentList = activeBtn.closest(".profile-nav__list");
    if (parentList) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const listWidth = parentList.clientWidth;
      parentList.scrollTo({
        left: btnLeft - (listWidth / 2) + (btnWidth / 2),
        behavior: appState.reducedMotion ? "auto" : "smooth",
      });
    }
  }

  // Smooth scroll to card
  if (scroll) {
    if (revealRuntime?.lenis && !appState.reducedMotion) {
      const headerOffset = window.innerWidth <= 767 ? -120 : -90;
      revealRuntime.lenis.scrollTo(targetCard, {
        offset: headerOffset,
        duration: 1.1,
      });
    } else {
      const headerOffset = window.innerWidth <= 767 ? 120 : 90;
      const targetPos = targetCard.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({
        top: targetPos,
        behavior: appState.reducedMotion ? "auto" : "smooth",
      });
    }
  }

  if (announce) {
    const title = targetCard.querySelector(".profile-card__title")?.textContent || targetCard.id;
    announceInteraction(`Viewing Profile category: ${title}`);
  }
}

function updateProfileProgress() {
  if (!profileDossierRuntime?.progressBar || !profileDossierRuntime?.section) return;
  const rect = profileDossierRuntime.section.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  if (total <= 0) return;
  const current = -rect.top;
  const progressPercent = Math.min(100, Math.max(0, (current / total) * 100));
  profileDossierRuntime.progressBar.style.setProperty("--profile-progress", `${progressPercent.toFixed(1)}%`);
}

function initProfileDossier() {
  const section = document.querySelector(".profile-dossier");
  if (!section) return;

  const navButtons = Array.from(section.querySelectorAll(".profile-nav__item"));
  const cards = Array.from(section.querySelectorAll(".profile-card"));
  const progressBar = section.querySelector("[data-profile-progress]");
  const profileNav = section.querySelector(".profile-nav");
  const navList = section.querySelector(".profile-nav__list");
  const mobileStep = section.querySelector("[data-profile-mobile-step]");
  const mobileLabel = section.querySelector("[data-profile-mobile-label]");

  if (!navButtons.length || !cards.length || !mobileStep || !mobileLabel) return;

  profileDossierRuntime = {
    section,
    navButtons,
    cards,
    progressBar,
    navList,
    mobileStep,
    mobileLabel,
    triggers: [],
  };

  const mobileProfileQuery = window.matchMedia("(max-width: 47.99rem)");
  const syncProfileOrientation = () => profileNav?.setAttribute("aria-orientation", mobileProfileQuery.matches ? "horizontal" : "vertical");
  syncProfileOrientation();
  mobileProfileQuery.addEventListener?.("change", syncProfileOrientation);

  // Click handling
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      selectProfileCard(btn.dataset.profileTarget, { scroll: true, announce: true });
    });
  });

  // Keyboard navigation
  navList?.addEventListener("keydown", (event) => {
    const currentIndex = navButtons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    let nextIndex = currentIndex;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % navButtons.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + navButtons.length) % navButtons.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = navButtons.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextBtn = navButtons[nextIndex];
    selectProfileCard(nextBtn.dataset.profileTarget, { scroll: true, focus: true, announce: true });
  });

  // GSAP ScrollTrigger Integration
  if (window.ScrollTrigger && !appState.reducedMotion) {
    cards.forEach((card, index) => {
      const isFirst = index === 0;
      const isLast = index === cards.length - 1;
      const trigger = ScrollTrigger.create({
        trigger: card,
        start: isFirst ? "top 80%" : "top 50%",
        end: isLast ? "bottom 20%" : "bottom 50%",
        onEnter: () => selectProfileCard(`#${card.id}`, { scroll: false }),
        onEnterBack: () => selectProfileCard(`#${card.id}`, { scroll: false }),
        onToggle: (self) => {
          if (self.isActive) selectProfileCard(`#${card.id}`, { scroll: false });
        },
      });
      profileDossierRuntime.triggers.push(trigger);
    });

    const progressTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top 70%",
      end: "bottom 30%",
      scrub: true,
      onUpdate: (self) => {
        if (progressBar) {
          progressBar.style.setProperty("--profile-progress", `${(self.progress * 100).toFixed(1)}%`);
        }
      },
    });
    profileDossierRuntime.triggers.push(progressTrigger);
  } else {
    // Native scroll listener fallback
    window.addEventListener("scroll", () => {
      updateProfileProgress();
      const threshold = window.innerHeight * 0.45;
      let activeCard = cards[0];
      let minDistance = Infinity;

      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (rect.top <= threshold && rect.bottom >= threshold) {
          activeCard = card;
        } else {
          const distance = Math.abs(rect.top - threshold);
          if (distance < minDistance) {
            minDistance = distance;
            activeCard = card;
          }
        }
      });

      if (activeCard) {
        selectProfileCard(`#${activeCard.id}`, { scroll: false });
      }
    }, { passive: true });
  }
}

function initBackToTop() {
  document.querySelector("[data-back-to-top]")?.addEventListener("click", scrollToTop);
}

function runInitializer(label, initializer) {
  try {
    initializer();
  } catch (error) {
    console.error(`${label} could not initialize. The remaining page will continue loading.`, error);
  }
}

function initApp() {
  if (appState.initialized) return;
  appState.initialized = true;
  [
    ["Reduced-motion preferences", initReducedMotion],
    ["Loader", initLoader],
    ["Navigation", initNavigation],
    ["Mobile menu", initMobileMenu],
    ["Hero portrait", initHeroBrushReveal],
    ["Local time", initLocalTime],
    ["Hero explore mode", initExploreMode],
    ["Portfolio mode", initDeveloperModeToggle],
    ["Profile dossier", initProfileDossier],
    ["Project cards", initProjectCards],
    ["Project filters", initProjectFilters],
    ["Skill selector", initSkillSelector],
    ["Process timeline", initProcessTimeline],
    ["Testimonials", initTestimonials],
    ["Circular statement", initCircularText],
    ["Copy email", initCopyEmail],
    ["Back to top", initBackToTop],
    ["Scroll reveals", initScrollReveals],
    ["Custom cursor", initCustomCursor],
    ["Magnetic elements", initMagneticElements],
  ].forEach(([label, initializer]) => runInitializer(label, initializer));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp, { once: true });
} else {
  initApp();
}
