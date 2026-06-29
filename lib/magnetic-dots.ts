/**
 * magnetic-dots.ts — WebGL2 canvas overlay for the FeatureWipe hover effect.
 *
 * Renders a procedural duotone halftone of a source image — flat ink color
 * on flat paper color, dot size driven by the source's per-cell brightness
 * — that warps the whole dot grid toward the pointer once it's moving: a
 * localized magnetic pull plus an organic noise ripple, both motion-gated
 * (zero at a still cursor) so the grid stays crisp at rest.
 *
 * Show/hide is owned entirely by CSS (.fw-dots-canvas opacity, the same
 * transition as the photo it sits behind — see layout.css), not by this
 * class. They used to be two independent fades (a CSS one for the photo,
 * a JS-eased one for this canvas) that could drift out of sync and expose
 * the bare page background for a frame or two; sharing one CSS transition
 * makes that impossible. enter()/leave() now only gate the render loop.
 *
 * Deliberately a flat duotone rather than the photo's real colors: a busy
 * photographic background sitting behind headline/button text was a real
 * legibility/contrast problem, and a flat two-color halftone is much calmer
 * while still reading as "the project's image" at a glance. The ink color
 * is the case study's brand color and the paper color is the page surface
 * — both resolved to RGB by the caller (FeatureWipe) and passed in, since
 * this class only deals in plain WebGL color values, not CSS/OKLCH.
 *
 * Pointer-driven rather than scroll-driven, so it's its own class rather
 * than a third MediaEffect on MediaGL (media-gl.ts) — the driver loop and
 * uniforms don't overlap with that scroll/velocity model.
 *
 * Deliberately skipped on touch/coarse-pointer devices — callers should
 * check supportsHoverPointer() before constructing one.
 */

import { coverRatio, NOISE } from "./media-gl";

function reducedMotion(): boolean {
  if (typeof document !== "undefined") {
    const explicit = document.documentElement.getAttribute("data-motion");
    if (explicit === "off") return true;
    if (explicit === "on") return false;
  }
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function supportsHoverPointer(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false
  );
}

export type RGB = [number, number, number];

// ─── Config ───────────────────────────────────────────────────────────────────
// Every tunable knob for the effect lives here so it can be experimented
// with (or overridden per-instance) without touching the shader.

export interface MagneticDotsConfig {
  /** Cursor influence radius, in normalized UV units (aspect-corrected). */
  radius: number;
  /** Strength of the inward pull toward the cursor, in UV units. */
  strength: number;
  /** Amplitude of the organic noise warp, in UV units. */
  rippleAmp: number;
  /** Spatial frequency of the noise field — higher = smaller, busier cells. */
  rippleFreq: number;
  /** Noise animation speed. */
  rippleSpeed: number;
  /** Pointer-follow easing per frame (0–1) — higher tracks faster. */
  mouseEase: number;
  /** Pull/warp magnitude is driven entirely by this — 0 at a still cursor
   *  (grid stays undistorted), scaling up with pointer speed. There's no
   *  always-on baseline distortion from proximity alone anymore. */
  velocityBoost: number;
  /** Maps raw pointer speed (UV units/sec) to the 0–1 velocity signal —
   *  higher means a slower flick already reads as "fast". */
  velocityScale: number;
  /** Per-frame decay of the velocity signal once the pointer stops moving. */
  velocityDecay: number;
  /** Halftone cell size, in canvas-aspect-corrected units (see u_canvasRatio
   *  in the shader) — roughly cellSize * max(canvasW, canvasH) px per cell. */
  cellSize: number;
  /** Max dot radius as a fraction of cellSize — ~0.5 lets the darkest cells
   *  nearly fill their cell without touching neighbors. */
  dotMax: number;
  /** Multiplier on each cell's paper-distance (see colorWeight) before
   *  sizing its dot — UI/website screenshots are mostly flat light
   *  backgrounds with little contrast, so without this most cells stay
   *  too faint to read as a recognizable shape. */
  contrast: number;
  /** Blend between brightness-only contrast (0) and full RGB distance from
   *  the paper color (1) when deciding a cell's dot size. Pure brightness
   *  misses saturated-but-bright elements (e.g. a brand-colored button on
   *  a light page); full color distance picks those up too. */
  colorWeight: number;
  /** Per-frame decay of the scroll-velocity signal once scrolling stops —
   *  mirrors velocityDecay but for setScrollState() rather than the pointer. */
  scrollVelDecay: number;
  /** Vertical offset (canvas-aspect-corrected units) used to sample the dot
   *  mask twice for the scroll-chromatic-aberration fringe, scaled by scroll
   *  speed — the cheap version of the effect: a colored fringe from the
   *  difference of two offset samples, not three fully-recomputed channels.
   *  Must stay well below cellSize, or the two samples land in unrelated
   *  cells and produce noise instead of a coherent fringe. */
  aberrSpread: number;
  /** Color intensity of that fringe. */
  aberrStrength: number;
}

export const DEFAULT_MAGNETIC_DOTS_CONFIG: MagneticDotsConfig = {
  radius: 0.32,
  // strength/rippleAmp scaled down with cellSize below — at the old larger
  // cellSize a displacement of a fraction of a cell was subtle, but against
  // a much finer grid the same raw uv displacement spans many cells and
  // shreds the pattern into streaks instead of a recognizable halftone.
  strength: 0.011,
  rippleAmp: 0.0025,
  rippleFreq: 5,
  rippleSpeed: 0.3,
  mouseEase: 0.12,
  velocityBoost: 1.8,
  velocityScale: 4,
  velocityDecay: 6,
  // Denser grid — small enough to resolve actual image shapes instead of
  // reading as an abstract blob pattern.
  cellSize: 0.0055,
  dotMax: 0.48,
  contrast: 1.7,
  colorWeight: 0.6,
  scrollVelDecay: 6,
  // Must stay well below cellSize (0.0055) — at the old 0.006 the two offset
  // samples landed in unrelated, non-adjacent cells instead of perturbing
  // near the same one, producing noise that didn't scale predictably with
  // scroll speed instead of a recognizable fringe. ~18% of cellSize keeps
  // both samples within/near the same cell.
  aberrSpread: 0.01,
  aberrStrength: 1.9,
};

export interface MagneticDotsOptions extends Partial<MagneticDotsConfig> {
  /** Source image the halftone's per-cell brightness is sampled from. */
  src: string;
  /** Duotone "ink" color (dots), as 0–1 RGB. */
  inkColor: RGB;
  /** Duotone "paper" color (background), as 0–1 RGB. */
  paperColor: RGB;
  onReady?: () => void;
}

// ─── GLSL ─────────────────────────────────────────────────────────────────────

const VERT_SRC = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main(){v_uv=a_uv;gl_Position=vec4(a_pos,0.,1.);}`;

const FRAG_SRC =
  `#version 300 es
precision mediump float;
uniform sampler2D u_map;
uniform float u_time,u_radius,u_strength,u_rippleAmp,u_rippleFreq,u_rippleSpeed,u_vel,u_velocityBoost,u_cellSize,u_dotMax,u_contrast,u_colorWeight,u_scrollVel,u_aberrSpread,u_aberrStrength;
uniform vec2 u_mouse,u_ratio,u_canvasRatio;
uniform vec3 u_inkColor,u_paperColor;
in vec2 v_uv;
out vec4 fragColor;
vec2 cover(vec2 u){u-=.5;u*=u_ratio;u+=.5;return u;}
float luminance(vec3 c){return dot(c, vec3(0.299, 0.587, 0.114));}
` +
  NOISE +
  `
// Halftone dot mask at an arbitrary (already-warped) position — pulled out
// into its own function so the scroll-aberration fringe below can sample it
// twice more at small offsets, instead of duplicating this whole block.
float dotMaskAt(vec2 pos){
  vec2 p = pos * u_canvasRatio / u_cellSize;
  vec2 cellIdx = floor(p);
  vec2 cellCenterUv = ((cellIdx + 0.5) * u_cellSize) / u_canvasRatio;
  vec3 cellColor = texture(u_map, cover(cellCenterUv)).rgb;
  float diffLum = abs(luminance(cellColor) - luminance(u_paperColor));
  float diffColor = length(cellColor - u_paperColor) * 0.5774; // /sqrt(3), normalizes max RGB-cube distance to 1
  float diff = clamp(mix(diffLum, diffColor, u_colorWeight) * u_contrast, 0.0, 1.0);
  float dotRadius = diff * u_dotMax;
  float distInCell = length(p - (cellIdx + 0.5));
  return 1.0 - smoothstep(dotRadius - 0.06, dotRadius, distInCell);
}
void main(){
  vec2 uv = v_uv;

  // Distance to pointer corrected by the CANVAS's own aspect ratio (not
  // the image-cover ratio — those differ now that this canvas is a tall
  // full-row backdrop rather than photo-shaped) so the influence radius
  // reads as a true circle regardless of how narrow/wide the row is.
  vec2 d = (uv - u_mouse) * u_canvasRatio;
  float dist = length(d);
  float falloff = 1.0 - smoothstep(0.0, u_radius, dist);
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
  vec2 dirUv = dir / max(u_canvasRatio, vec2(0.0001));

  // Motion-gated, not always-on: at a still cursor this is exactly 0, so
  // the grid stays perfectly crisp/undistorted at rest. It only ramps up
  // once the cursor is actually moving (u_vel), scaled by velocityBoost —
  // a static hover no longer warps the grid, only a moving one does.
  float motion = clamp(u_vel * u_velocityBoost, 0.0, 1.0);

  // Magnetic pull + organic noise warp on the whole dot grid (applied to
  // uv before the grid is computed below), so the grid itself bulges and
  // ripples toward the pointer rather than just resampling brightness.
  vec2 noiseUv = uv * u_rippleFreq;
  float nx = snoise3(vec3(noiseUv, u_time * u_rippleSpeed));
  float ny = snoise3(vec3(noiseUv + 17.3, u_time * u_rippleSpeed + 4.1));
  vec2 noiseWarp = vec2(nx, ny) * falloff * u_rippleAmp * motion;
  vec2 warped = uv - dirUv * falloff * u_strength * motion + noiseWarp;

  // Halftone: divide the (aspect-corrected) warped position into a grid of
  // cells, sample the source image's color at each cell's center, and draw
  // a dot whose radius grows the more that cell DIFFERS from the paper
  // color — blending brightness contrast with full color distance, so a
  // saturated brand-colored button that's bright (and so nearly invisible
  // in a brightness-only halftone) still shows up against a light page.
  float dotMask = dotMaskAt(warped);
  vec3 duotone = mix(u_paperColor, u_inkColor, dotMask);

  // Scroll chromatic aberration — cheap version: sample the mask twice more
  // at small vertical offsets (scaled by scroll speed) and use the
  // difference as a red/cyan fringe added on top, rather than fully
  // recomputing all three RGB channels. Only visible while also hovered,
  // since that's the only time this canvas itself is visible (CSS opacity). cSpell:ignore aberr GLSL mediump snoise
  // sqrt curve, not linear — realistic scroll speed rarely pushes u_scrollVel
  // past ~0.2-0.3 (vs the 1.0 ceiling), so a linear scale left the effect
  // visible only during an almost-impossible full-speed fling. sqrt boosts
  // the low end disproportionately (sqrt(0.2)=0.45) while still topping out
  // at 1.0 for genuinely fast scrolling.
  float scrollMag = sqrt(clamp(abs(u_scrollVel), 0.0, 1.0));
  vec2 aberrOff = vec2(0.0, u_aberrSpread * scrollMag);
  float fringe = dotMaskAt(warped + aberrOff) - dotMaskAt(warped - aberrOff);
  duotone += vec3(fringe, 0.0, -fringe) * u_aberrStrength;

  fragColor = vec4(duotone, 1.0);
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader {
  if (gl.isContextLost()) return null as unknown as WebGLShader;
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("MagneticDots shader compile error:", gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string,
): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("MagneticDots program link error:", gl.getProgramInfoLog(p));
  }
  return p;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class MagneticDots {
  private canvas: HTMLCanvasElement;
  private opts: Required<MagneticDotsOptions>;
  private gl!: WebGL2RenderingContext;
  private prog!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private tex!: WebGLTexture;

  private uTime!: WebGLUniformLocation;
  private uRadius!: WebGLUniformLocation;
  private uStrength!: WebGLUniformLocation;
  private uRippleAmp!: WebGLUniformLocation;
  private uRippleFreq!: WebGLUniformLocation;
  private uRippleSpeed!: WebGLUniformLocation;
  private uMouse!: WebGLUniformLocation;
  private uRatio!: WebGLUniformLocation;
  private uMap!: WebGLUniformLocation;
  private uVel!: WebGLUniformLocation;
  private uVelocityBoost!: WebGLUniformLocation;
  private uCanvasRatio!: WebGLUniformLocation;
  private uCellSize!: WebGLUniformLocation;
  private uDotMax!: WebGLUniformLocation;
  private uContrast!: WebGLUniformLocation;
  private uColorWeight!: WebGLUniformLocation;
  private uInkColor!: WebGLUniformLocation;
  private uPaperColor!: WebGLUniformLocation;
  private uScrollVel!: WebGLUniformLocation;
  private uAberrSpread!: WebGLUniformLocation;
  private uAberrStrength!: WebGLUniformLocation;

  private ready = false;
  private disposed = false;
  private rafId: number | null = null;
  private last = 0;
  private time = 0;
  private imgW = 1;
  private imgH = 1;

  private mouse: [number, number] = [0.5, 0.5];
  private mouseTarget: [number, number] = [0.5, 0.5];
  private hovered = false;

  // Pointer speed signal — raw samples come from setPointer() (one per
  // pointermove), then decay continuously in _tick so it settles back to 0
  // a beat after the cursor stops, instead of snapping to 0 immediately.
  private velRaw = 0;
  private vel = 0;
  private lastPointerSample: [number, number] | null = null;
  private lastPointerTime = 0;

  // Scroll-velocity signal for the chromatic-aberration fringe — same
  // raw-then-eased-decay shape as pointer vel above, fed by setScrollState()
  // (called from FeatureWipe's existing per-row ScrollTrigger, the same one
  // that already drives the photo's MediaGL chromatic aberration).
  private scrollVelRaw = 0;
  private scrollVel = 0;

  private resizeObserver: ResizeObserver | null = null;
  private _boundResize!: () => void;

  constructor(canvas: HTMLCanvasElement, opts: MagneticDotsOptions) {
    this.canvas = canvas;
    this.opts = { onReady: () => {}, ...DEFAULT_MAGNETIC_DOTS_CONFIG, ...opts };
    this._init();
  }

  private _init() {
    const existing = this.canvas.getContext("webgl2");
    if (!existing || existing.isContextLost()) {
      console.warn("MagneticDots: WebGL2 context unavailable or lost");
      return;
    }
    this.gl = existing;

    const { w, h } = this._size();
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this.gl.clearColor(0, 0, 0, 0);

    const img = new Image();
    img.onload = () => {
      this.imgW = img.naturalWidth;
      this.imgH = img.naturalHeight;
      this._build(img);
    };
    img.onerror = () => this._build(null);
    img.src = this.opts.src;

    this._boundResize = this._resize.bind(this);
    window.addEventListener("resize", this._boundResize);
    const parent = this.canvas.parentElement;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => this._resize());
      this.resizeObserver.observe(parent);
    }
  }

  private _build(img: HTMLImageElement | null) {
    if (this.disposed || !this.gl || this.gl.isContextLost()) return;
    const gl = this.gl;

    this.prog = createProgram(gl, VERT_SRC, FRAG_SRC);
    this.uTime = gl.getUniformLocation(this.prog, "u_time")!;
    this.uRadius = gl.getUniformLocation(this.prog, "u_radius")!;
    this.uStrength = gl.getUniformLocation(this.prog, "u_strength")!;
    this.uRippleAmp = gl.getUniformLocation(this.prog, "u_rippleAmp")!;
    this.uRippleFreq = gl.getUniformLocation(this.prog, "u_rippleFreq")!;
    this.uRippleSpeed = gl.getUniformLocation(this.prog, "u_rippleSpeed")!;
    this.uMouse = gl.getUniformLocation(this.prog, "u_mouse")!;
    this.uRatio = gl.getUniformLocation(this.prog, "u_ratio")!;
    this.uMap = gl.getUniformLocation(this.prog, "u_map")!;
    this.uVel = gl.getUniformLocation(this.prog, "u_vel")!;
    this.uVelocityBoost = gl.getUniformLocation(this.prog, "u_velocityBoost")!;
    this.uCanvasRatio = gl.getUniformLocation(this.prog, "u_canvasRatio")!;
    this.uCellSize = gl.getUniformLocation(this.prog, "u_cellSize")!;
    this.uDotMax = gl.getUniformLocation(this.prog, "u_dotMax")!;
    this.uContrast = gl.getUniformLocation(this.prog, "u_contrast")!;
    this.uColorWeight = gl.getUniformLocation(this.prog, "u_colorWeight")!;
    this.uScrollVel = gl.getUniformLocation(this.prog, "u_scrollVel")!;
    this.uAberrSpread = gl.getUniformLocation(this.prog, "u_aberrSpread")!;
    this.uAberrStrength = gl.getUniformLocation(this.prog, "u_aberrStrength")!;
    this.uInkColor = gl.getUniformLocation(this.prog, "u_inkColor")!;
    this.uPaperColor = gl.getUniformLocation(this.prog, "u_paperColor")!;

    // prettier-ignore
    const pos = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    // prettier-ignore
    const uvs = new Float32Array([0,0, 1,0, 0,1, 1,1]);
    const idx = new Uint16Array([0, 1, 2, 1, 3, 2]);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(this.prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(this.prog, "a_uv");
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    gl.bindVertexArray(null);

    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (img) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    } else {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        1,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        new Uint8Array(4),
      );
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.ready = true;
    this._resize();
    this._renderOnce();
    this.opts.onReady();
  }

  private _resize() {
    if (!this.ready || this.disposed) return;
    const { w, h } = this._size();
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    this._renderOnce();
  }

  private _size() {
    const p = this.canvas.parentElement;
    return {
      w: p?.clientWidth || this.canvas.clientWidth || 1,
      h: p?.clientHeight || this.canvas.clientHeight || 1,
    };
  }

  private _renderOnce() {
    if (!this.ready || this.disposed) return;
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(this.prog);

    const { w, h } = this._size();
    const [rx, ry] = coverRatio(w, h, this.imgW, this.imgH);
    const [crx, cry] = coverRatio(w, h, 1, 1);
    gl.uniform1f(this.uTime, this.time);
    gl.uniform1f(this.uRadius, this.opts.radius);
    gl.uniform1f(this.uStrength, this.opts.strength);
    gl.uniform1f(this.uRippleAmp, reducedMotion() ? 0 : this.opts.rippleAmp);
    gl.uniform1f(this.uRippleFreq, this.opts.rippleFreq);
    gl.uniform1f(this.uRippleSpeed, this.opts.rippleSpeed);
    gl.uniform2f(this.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform2f(this.uRatio, rx, ry);
    gl.uniform2f(this.uCanvasRatio, crx, cry);
    gl.uniform1f(this.uVel, reducedMotion() ? 0 : this.vel);
    gl.uniform1f(this.uVelocityBoost, this.opts.velocityBoost);
    gl.uniform1f(this.uCellSize, this.opts.cellSize);
    gl.uniform1f(this.uDotMax, this.opts.dotMax);
    gl.uniform1f(this.uContrast, this.opts.contrast);
    gl.uniform1f(this.uColorWeight, this.opts.colorWeight);
    gl.uniform1f(this.uScrollVel, reducedMotion() ? 0 : this.scrollVel);
    gl.uniform1f(this.uAberrSpread, this.opts.aberrSpread);
    gl.uniform1f(this.uAberrStrength, this.opts.aberrStrength);
    gl.uniform3f(this.uInkColor, ...this.opts.inkColor);
    gl.uniform3f(this.uPaperColor, ...this.opts.paperColor);
    gl.uniform1i(this.uMap, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** uv is normalized [0,1] in standard screen space (x: left→right, y: top→bottom). */
  setPointer(u: number, v: number) {
    const target: [number, number] = [u, 1 - v];

    const now = performance.now();
    if (this.lastPointerSample) {
      const dt = Math.max((now - this.lastPointerTime) / 1000, 0.001);
      const dx = target[0] - this.lastPointerSample[0];
      const dy = target[1] - this.lastPointerSample[1];
      const speed = Math.sqrt(dx * dx + dy * dy) / dt;
      this.velRaw = Math.max(0, Math.min(1, speed * this.opts.velocityScale));
    }
    this.lastPointerSample = target;
    this.lastPointerTime = now;

    this.mouseTarget = target;
    this.start();
  }

  /** vel is the same -1..1 scroll-speed signal FeatureWipe already computes
   *  per row for the photo's MediaGL.setScrollState() — just fed here too.
   *  Deliberately does NOT call start(): scroll alone shouldn't spin up the
   *  render loop while not hovered (the canvas is invisible then anyway via
   *  CSS opacity), so this only updates the target the next hover-driven
   *  tick will ease toward. */
  setScrollState(vel: number) {
    this.scrollVelRaw = Math.max(-1, Math.min(1, vel));
  }

  /** Visibility is owned entirely by CSS now (.fw-dots-canvas opacity, same
   *  transition as the photo it sits behind) — this only gates the render
   *  loop / motion warp, not any fade of its own. */
  enter() {
    this.hovered = true;
    this.start();
  }

  leave() {
    this.hovered = false;
    this.stop();
  }

  start() {
    if (this.rafId || !this.ready || this.disposed) return;
    this.last = performance.now();
    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private _tick(now: number) {
    this.rafId = null;
    if (this.disposed) return;

    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.time += dt;

    this.mouse[0] +=
      (this.mouseTarget[0] - this.mouse[0]) * this.opts.mouseEase;
    this.mouse[1] +=
      (this.mouseTarget[1] - this.mouse[1]) * this.opts.mouseEase;

    // velRaw decays on its own (no continuous pointermove keeps re-arming
    // it), then vel eases toward it — same spring shape as mouse above, so
    // a held-still cursor settles back to a calm warp.
    this.velRaw *= Math.exp(-dt * this.opts.velocityDecay);
    this.vel += (this.velRaw - this.vel) * Math.min(1, dt * 9);

    // Same shape again for scroll velocity — decays toward 0 once
    // ScrollTrigger stops calling setScrollState (i.e. scrolling stopped).
    this.scrollVelRaw *= Math.exp(-dt * this.opts.scrollVelDecay);
    this.scrollVel +=
      (this.scrollVelRaw - this.scrollVel) * Math.min(1, dt * 9);

    this._renderOnce();

    const settling =
      Math.abs(this.mouse[0] - this.mouseTarget[0]) > 0.0005 ||
      Math.abs(this.mouse[1] - this.mouseTarget[1]) > 0.0005 ||
      this.vel > 0.001;

    if (!this.hovered && !settling) {
      this.stop();
      return;
    }
    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  dispose() {
    this.disposed = true;
    this.stop();
    window.removeEventListener("resize", this._boundResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}
