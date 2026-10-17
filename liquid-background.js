"use strict";

// Primary tuning controls for the ambient liquid surface.
const LIQUID_CONFIG = Object.freeze({
  speed: 0.22,
  distortion: 0.52,
  pointerIntensity: 0.34,
  maxPixelRatio: 1.5,
  mobilePixelRatio: 1.25,
  colors: {
    base: [0.957, 0.941, 0.906],
    water: [0.49, 0.60, 0.62],
    highlight: [1.0, 0.46, 0.34],
  },
});

(function initLiquidBackground() {
  const canvas = document.querySelector("[data-liquid-background]");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  const container = canvas.closest(".liquid-background");
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
    premultipliedAlpha: false,
  });

  if (!gl) {
    container?.classList.add("is-fallback");
    return;
  }

  const vertexSource = `
    attribute vec2 aPosition;
    varying vec2 vUv;

    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;

    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uPointer;
    uniform float uPointerStrength;
    uniform float uScroll;
    uniform float uIntensity;
    uniform vec3 uColorBase;
    uniform vec3 uColorWater;
    uniform vec3 uColorHighlight;

    void main() {
      vec2 uv = vUv;
      vec2 point = uv - 0.5;
      point.x *= uResolution.x / max(uResolution.y, 1.0);

      float time = uTime;
      float broad = sin(point.x * 3.4 + time + sin(point.y * 2.2 - time * 0.55));
      float crossWave = sin(point.y * 5.1 - time * 0.72 + broad * 0.55);
      float detail = sin((point.x + point.y) * 9.0 + time * 0.45 + crossWave * 0.7);
      float flow = broad * 0.5 + crossWave * 0.34 + detail * 0.16;

      vec2 pointerUv = uPointer * 0.5 + 0.5;
      vec2 pointerDelta = uv - pointerUv;
      pointerDelta.x *= uResolution.x / max(uResolution.y, 1.0);
      float pointerDistance = length(pointerDelta);
      float pointerRipple = exp(-pointerDistance * 4.8)
        * sin(pointerDistance * 18.0 - time * 1.25)
        * uPointerStrength;

      float displaced = flow * uIntensity + pointerRipple + uScroll * 0.08;
      float caustic = pow(0.5 + 0.5 * sin(detail * 1.7 + broad * 1.2 + time), 7.0);
      float waterMix = smoothstep(-0.85, 0.9, displaced) * 0.15;

      vec3 color = mix(uColorBase, uColorWater, waterMix);
      color = mix(color, uColorHighlight, caustic * 0.035 * uIntensity);
      color += vec3(0.018) * smoothstep(-0.2, 1.0, broad + crossWave);

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  }

  const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();

  if (!vertexShader || !fragmentShader || !program) {
    container?.classList.add("is-fallback");
    return;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    container?.classList.add("is-fallback");
    return;
  }

  const positionBuffer = gl.createBuffer();
  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const uniforms = {
    time: gl.getUniformLocation(program, "uTime"),
    resolution: gl.getUniformLocation(program, "uResolution"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    pointerStrength: gl.getUniformLocation(program, "uPointerStrength"),
    scroll: gl.getUniformLocation(program, "uScroll"),
    intensity: gl.getUniformLocation(program, "uIntensity"),
    colorBase: gl.getUniformLocation(program, "uColorBase"),
    colorWater: gl.getUniformLocation(program, "uColorWater"),
    colorHighlight: gl.getUniformLocation(program, "uColorHighlight"),
  };

  if (!positionBuffer || positionLocation < 0) {
    container?.classList.add("is-fallback");
    return;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.uniform3fv(uniforms.colorBase, LIQUID_CONFIG.colors.base);
  gl.uniform3fv(uniforms.colorWater, LIQUID_CONFIG.colors.water);
  gl.uniform3fv(uniforms.colorHighlight, LIQUID_CONFIG.colors.highlight);

  const pointerTarget = { x: 0, y: 0 };
  const pointerCurrent = { x: 0, y: 0 };
  let scrollTarget = 0;
  let scrollCurrent = 0;
  let animationFrame = 0;
  let startTime = performance.now();
  let reducedMotion = motionPreference.matches;
  let destroyed = false;

  function resize() {
    const isMobile = window.innerWidth < 768;
    const dprLimit = isMobile ? LIQUID_CONFIG.mobilePixelRatio : LIQUID_CONFIG.maxPixelRatio;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, dprLimit);
    const width = Math.max(1, Math.round(window.innerWidth * pixelRatio));
    const height = Math.max(1, Math.round(window.innerHeight * pixelRatio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uniforms.resolution, width, height);
  }

  function render(timestamp) {
    if (destroyed || document.hidden) return;

    pointerCurrent.x += (pointerTarget.x - pointerCurrent.x) * 0.035;
    pointerCurrent.y += (pointerTarget.y - pointerCurrent.y) * 0.035;
    scrollCurrent += (scrollTarget - scrollCurrent) * 0.045;

    const elapsed = reducedMotion ? 2.5 : (timestamp - startTime) * 0.001 * LIQUID_CONFIG.speed;
    const mobileFactor = window.innerWidth < 768 ? 0.72 : 1;
    gl.uniform1f(uniforms.time, elapsed);
    gl.uniform2f(uniforms.pointer, pointerCurrent.x, pointerCurrent.y);
    gl.uniform1f(uniforms.pointerStrength, reducedMotion ? 0 : LIQUID_CONFIG.pointerIntensity * mobileFactor);
    gl.uniform1f(uniforms.scroll, reducedMotion ? 0 : scrollCurrent);
    gl.uniform1f(uniforms.intensity, LIQUID_CONFIG.distortion * mobileFactor);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!reducedMotion) animationFrame = requestAnimationFrame(render);
  }

  function start() {
    cancelAnimationFrame(animationFrame);
    if (!document.hidden) animationFrame = requestAnimationFrame(render);
  }

  function handlePointer(event) {
    if (reducedMotion) return;
    pointerTarget.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
    pointerTarget.y = 1 - (event.clientY / Math.max(window.innerHeight, 1)) * 2;
  }

  function handleScroll() {
    scrollTarget = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 8);
  }

  function handleVisibility() {
    if (document.hidden) cancelAnimationFrame(animationFrame);
    else start();
  }

  function handleMotionPreference(event) {
    reducedMotion = event.matches;
    container?.classList.toggle("is-static", reducedMotion);
    startTime = performance.now();
    start();
  }

  function destroy() {
    destroyed = true;
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", handlePointer);
    window.removeEventListener("scroll", handleScroll);
    document.removeEventListener("visibilitychange", handleVisibility);
    motionPreference.removeEventListener?.("change", handleMotionPreference);
    gl.deleteBuffer(positionBuffer);
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
  }

  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", handlePointer, { passive: true });
  window.addEventListener("scroll", handleScroll, { passive: true });
  document.addEventListener("visibilitychange", handleVisibility);
  motionPreference.addEventListener?.("change", handleMotionPreference);
  window.addEventListener("pagehide", (event) => {
    if (!event.persisted) destroy();
  });

  container?.classList.add("is-webgl");
  container?.classList.toggle("is-static", reducedMotion);
  resize();
  handleScroll();
  start();
})();
