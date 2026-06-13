/**
 * hero-gl.ts — OGL port of the prototype's hero.js (Three.js → OGL, ≈25 KB vs ≈150 KB).
 *
 * A fullscreen-quad plane (ortho cam) renders one of two scroll-driven effects:
 *
 *   'parallax'  Directional vertical smear with per-channel RGB offset, so the
 *               image chromatically stretches in the scroll direction and snaps
 *               back to crisp at rest. Drier, editorial. (default)
 *
 *   'gooey'     Liquid simplex warp that swells as you scroll — the image
 *               stretches + ripples, then settles. Same visual family as the
 *               card hover shaders.
 *
 * Both are driven by two uniforms updated from scroll:
 *   u_vel    eased scroll speed (signed, ~-1..1) — distortion amplitude
 *   u_scroll 0..1 progress over the hero's pinned range
 *
 * The rAF loop runs only when the canvas is visible + motion is settling.
 * At rest, the loop pauses entirely — zero idle GPU cost.
 *
 * Usage:
 *   const gl = new HeroGL(canvasEl, { src: '/images/hero-light.jpg', intensity: 1.5 });
 *   // …in component cleanup:
 *   gl.dispose();
 */

import { Renderer, Geometry, Program, Mesh, Texture } from 'ogl';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeroEffect = 'parallax' | 'gooey';

export interface HeroGLOptions {
  /** URL of the image to display (pick light or dark based on prefers-color-scheme). */
  src: string;
  effect?: HeroEffect;
  /** Scale for all distortion terms (default: 1.5). */
  intensity?: number;
  /** Called once when the texture is loaded and the first frame renders. */
  onReady?: () => void;
}

// ─── GLSL ─────────────────────────────────────────────────────────────────────

// 3D simplex noise — Ashima / Stefan Gustavson, inlined to avoid a dependency.
const NOISE = /* glsl */`
vec3 mod289v3(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289v4(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute4(vec4 x){return mod289v4(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise3(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289v3(i);
  vec4 p = permute4(permute4(permute4(
    i.z + vec4(0.0,i1.z,i2.z,1.0))
    + i.y + vec4(0.0,i1.y,i2.y,1.0))
    + i.x + vec4(0.0,i1.x,i2.x,1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j  = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0+1.0;
  vec4 s1 = floor(b1)*2.0+1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

// Vertex: clip-space NDC quad — no camera / matrix transforms needed.
// Position data spans -1..1 in x and y, mapping directly to WebGL clip space.
const VERT = /* glsl */`
attribute vec2 position;
attribute vec2 uv;
varying vec2 v_uv;
void main(){
  v_uv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

// Shared fragment preamble — uniforms + cover helper.
// NOTE: precision must be the very first statement in a GLSL ES 1.0 fragment
// shader. Keep it here so it's prepended before NOISE when building each shader.
const FRAG_COMMON = /* glsl */`
uniform sampler2D u_map;
uniform float u_time;
uniform float u_vel;
uniform float u_scroll;
uniform float u_intensity;
uniform float u_entrance;
uniform vec2  u_ratio;
varying vec2 v_uv;
// Cover-fit: scale UVs so the image fills the canvas at the correct aspect ratio.
vec2 cover(vec2 uv){ uv -= .5; uv *= u_ratio; uv += .5; return uv; }
`;

// precision MUST be first — GLSL ES 1.0 rejects float ops with no default precision.
const FRAG_PRECISION = `precision mediump float;\n`;

// Parallax: directional vertical smear + per-channel (RGB) offset.
// The R and B channels are vertically displaced by different amounts, creating
// chromatic aberration that intensifies with scroll speed and eases to zero at rest.
const FRAG_PARALLAX = FRAG_PRECISION + NOISE + FRAG_COMMON + /* glsl */`
void main(){
  float t   = u_time * 0.03;
  vec2  uv  = v_uv;
  // Slow parallax drift over the pinned range
  uv.y += (u_scroll - 0.5) * 0.06 * u_intensity;
  // Subtle scale breath so edges never reveal background
  uv = (uv - .5) * (1.0 - u_scroll * 0.04 * u_intensity) + .5;

  // Entrance ripple — radial wave from low-center, amplitude fades to 0 as
  // u_entrance decays from 1 to 0: the print settling into the fixer bath.
  vec2  rippleCenter = vec2(0.5, 0.85);
  vec2  rd     = uv - rippleCenter;
  float ripple = sin(length(rd) * 16.0 - u_time * 3.5) * u_entrance * 0.05;
  uv += normalize(rd + 1e-4) * ripple;

  // Ambient water-surface wave — gentle simplex displacement layered on top
  // of the smear below, growing with scroll velocity.
  float wx = snoise3(vec3(uv * 1.4, t));
  float wy = snoise3(vec3(uv * 1.4 + 7.0, t));
  uv += vec2(wx, wy) * (0.002 + abs(u_vel) * 0.01) * u_intensity;

  float disp = snoise3(vec3(uv * 1.6, t)) * 0.5 + 0.5;
  float v    = u_vel * u_intensity;
  vec2  off  = vec2(0.0, 1.0) * (0.02 + disp * 0.035) * v;
  vec2  cuv  = cover(uv);
  float r    = texture2D(u_map, cover(uv + off * 1.0)).r;
  float g    = texture2D(u_map, cuv).g;
  float b    = texture2D(u_map, cover(uv + off * 2.5)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}`;

// Gooey: liquid simplex warp with ambient shimmer + scroll-swelled stretch.
const FRAG_GOOEY = FRAG_PRECISION + NOISE + FRAG_COMMON + /* glsl */`
void main(){
  float t   = u_time * 0.06;
  float amp = (0.006 + abs(u_vel) * 0.05 + u_scroll * 0.012) * u_intensity;
  vec2  uv  = v_uv;
  uv.y = (uv.y - .5) / (1.0 + u_vel * 0.18 * u_intensity) + .5;
  float nx = snoise3(vec3(uv.x * 2.2, uv.y * 2.2, t));
  float ny = snoise3(vec3(uv.x * 2.2 + 5.0, uv.y * 2.2 + 5.0, t));
  uv += vec2(nx, ny) * amp;
  uv += vec2(0.0, sin(uv.x * 3.1416 + t * 2.0) * 0.01 * (u_scroll + abs(u_vel)) * u_intensity);
  gl_FragColor = texture2D(u_map, cover(uv));
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns [scaleX, scaleY] so the image fills the canvas at correct aspect ratio. */
function coverRatio(
  cw: number, ch: number,
  iw: number, ih: number,
): [number, number] {
  const cAR = cw / ch, iAR = iw / ih;
  return [Math.min(cAR / iAR, 1), Math.min(iAR / cAR, 1)];
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class HeroGL {
  private canvas: HTMLCanvasElement;
  private opts: Required<HeroGLOptions>;

  private renderer!: Renderer;
  private geometry!: Geometry;
  private texture!: Texture;
  private program!: Program;
  private mesh!: Mesh;

  private ready    = false;
  private disposed = false;
  private rafId: number | null = null;
  private last  = 0;
  private imgW  = 1;
  private imgH  = 1;

  // Eased scroll state — same spring parameters as the prototype
  private vel    = 0;   // rendered (eased)
  private velT   = 0;   // instantaneous (decays to 0 each frame)
  private scroll  = 0;  // rendered 0..1
  private scrollT = 0;  // target 0..1
  private lastY   = 0;

  // Entrance ripple amplitude — 1 at drop, decays to 0 as the image settles.
  // Driven externally (see setEntrance) by the float-in GSAP timeline.
  private entrance = 0;

  private _boundScroll!: () => void;
  private _boundResize!: () => void;

  constructor(canvas: HTMLCanvasElement, opts: HeroGLOptions) {
    this.canvas = canvas;
    this.opts   = { effect: 'parallax', intensity: 1.5, onReady: () => {}, ...opts };
    this.lastY  = typeof window !== 'undefined' ? window.scrollY : 0;
    this._init();
  }

  // ── Setup ──────────────────────────────────────────────────────────────────

  private _init() {
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);

    // Size the canvas to its CSS layout dimensions before creating the renderer
    // so the initial viewport is correct.
    const { w, h } = this._size();
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;

    // Use WebGL1 for broadest compatibility with the GLSL 1.0 shaders
    this.renderer = new Renderer({ canvas: this.canvas, alpha: true, antialias: true, dpr, webgl: 1 });
    (this.renderer.gl as WebGLRenderingContext).clearColor(0, 0, 0, 0);

    // Clip-space NDC quad — positions span -1..1 to fill the canvas exactly.
    // No camera or matrix transforms required.
    this.geometry = new Geometry(this.renderer.gl, {
      position: { size: 2, data: new Float32Array([-1,-1, 1,-1, -1,1, 1,1]) },
      uv:       { size: 2, data: new Float32Array([0,0, 1,0, 0,1, 1,1]) },
      index:    { data: new Uint16Array([0,1,2, 1,3,2]) },
    });

    this.texture = new Texture(this.renderer.gl, {
      minFilter: (this.renderer.gl as WebGLRenderingContext).LINEAR,
      magFilter: (this.renderer.gl as WebGLRenderingContext).LINEAR,
      generateMipmaps: false,
    });

    const img = new Image();
    // No crossOrigin needed — images are same-origin; adding it can cause
    // the browser to bypass the cache and re-request without CORS headers.
    img.onload = () => {
      this.imgW = img.naturalWidth;
      this.imgH = img.naturalHeight;
      this.texture.image = img;
      this._build();
    };
    img.onerror = () => this._build();   // graceful fallback: renders with blank texture
    img.src = this.opts.src;

    this._boundScroll = this._measure.bind(this);
    this._boundResize = this._resize.bind(this);
    window.addEventListener('scroll', this._boundScroll, { passive: true });
    window.addEventListener('resize', this._boundResize);
  }

  private _build() {
    if (this.disposed) return;
    const { w, h } = this._size();

    this.program = new Program(this.renderer.gl, {
      vertex:   VERT,
      fragment: this.opts.effect === 'parallax' ? FRAG_PARALLAX : FRAG_GOOEY,
      uniforms: {
        u_map:       { value: this.texture },
        u_time:      { value: 0 },
        u_vel:       { value: 0 },
        u_scroll:    { value: 0 },
        u_intensity: { value: this.opts.intensity },
        u_entrance:  { value: this.entrance },
        u_ratio:     { value: coverRatio(w, h, this.imgW, this.imgH) },
      },
      transparent: true,
    });

    this.mesh  = new Mesh(this.renderer.gl, { geometry: this.geometry, program: this.program });
    this.ready = true;
    this._resize();
    this._measure();
    this.start();
    this.opts.onReady();
  }

  // ── Scroll measurement ─────────────────────────────────────────────────────

  private _measure() {
    const y  = window.scrollY ?? 0;
    const dy = y - this.lastY;
    this.lastY  = y;
    this.velT   = Math.max(-1, Math.min(1, dy / 60));
    // 0..1 over the hero's pinned phase (first ~1.4 viewports)
    this.scrollT = Math.max(0, Math.min(1, y / (window.innerHeight * 1.4)));
    this.start();
  }

  // ── Resize ────────────────────────────────────────────────────────────────

  private _resize() {
    if (!this.renderer) return;
    const { w, h } = this._size();
    this.renderer.setSize(w, h);
    if (this.program) {
      this.program.uniforms.u_ratio.value = coverRatio(w, h, this.imgW, this.imgH);
    }
    this._renderOnce();
  }

  private _size() {
    // Prefer the parent container's dimensions — the canvas may not report its
    // CSS-computed size reliably on all browsers (e.g. when the parent has
    // view-transition-name set), but the parent element always lays out first.
    const parent = this.canvas.parentElement;
    return {
      w: parent?.clientWidth  || this.canvas.clientWidth  || 1,
      h: parent?.clientHeight || this.canvas.clientHeight || 1,
    };
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setIntensity(v: number) {
    this.opts.intensity = v;
    if (this.program) this.program.uniforms.u_intensity.value = v;
    this.start();
  }

  /**
   * Drive the entrance-ripple amplitude — 1 at drop, 0 once settled.
   * Call from a GSAP onUpdate during the hero's float-in animation.
   */
  setEntrance(v: number) {
    this.entrance = v;
    if (this.program) this.program.uniforms.u_entrance.value = v;
    this.start();
  }

  setEffect(name: HeroEffect) {
    if (this.opts.effect === name) return;
    this.opts.effect = name;
    if (!this.ready) return;
    const { w, h } = this._size();
    const prev = this.program.uniforms;
    this.program = new Program(this.renderer.gl, {
      vertex:   VERT,
      fragment: name === 'parallax' ? FRAG_PARALLAX : FRAG_GOOEY, // already precision-prefixed
      uniforms: {
        u_map:       { value: this.texture },
        u_time:      { value: prev.u_time.value as number },
        u_vel:       { value: 0 },
        u_scroll:    { value: this.scroll },
        u_intensity: { value: this.opts.intensity },
        u_entrance:  { value: this.entrance },
        u_ratio:     { value: coverRatio(w, h, this.imgW, this.imgH) },
      },
      transparent: true,
    });
    this.mesh.program = this.program;
    this.start();
  }

  // ── Render loop ──────────────────────────────────────────────────────────

  start() {
    if (this.rafId || this.disposed || !this.ready) return;
    this.last  = performance.now();
    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private _renderOnce() {
    if (!this.ready || this.disposed) return;
    // No camera needed — vertex shader uses clip-space positions directly.
    this.renderer.render({ scene: this.mesh });
  }

  private _tick(now: number) {
    this.rafId = null;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;

    // Velocity decays toward zero when not scrolling, then the rendered value
    // eases toward the decaying target — same double-spring as the prototype.
    this.velT  *= Math.exp(-dt * 6.0);
    this.vel   += (this.velT - this.vel)    * Math.min(1, dt * 9);
    this.scroll += (this.scrollT - this.scroll) * Math.min(1, dt * 6);

    this.program.uniforms.u_time.value   = (this.program.uniforms.u_time.value as number) + dt;
    this.program.uniforms.u_vel.value    = this.vel;
    this.program.uniforms.u_scroll.value = this.scroll;

    this._renderOnce();

    const r       = this.canvas.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    const settling =
      Math.abs(this.vel)    > 0.001 ||
      Math.abs(this.velT)   > 0.001 ||
      Math.abs(this.scroll - this.scrollT) > 0.001 ||
      this.entrance         > 0.001;

    // Pause entirely when scrolled out of view and fully settled
    if (!visible && !settling) { this.stop(); return; }
    // Parallax has no ambient motion — rest once settled
    if (visible && !settling && this.opts.effect === 'parallax') { this.stop(); return; }

    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  /**
   * @param keepContext  Pass `true` when swapping textures on the same canvas
   *                     so the shared WebGL context is NOT lost — only the RAF
   *                     loop and event listeners are torn down.
   *                     Defaults to `false` (full cleanup on unmount).
   */
  dispose(keepContext = false) {
    this.disposed = true;
    this.stop();
    window.removeEventListener('scroll', this._boundScroll);
    window.removeEventListener('resize', this._boundResize);
    if (!keepContext) {
      // Force context loss to immediately free GPU memory on full teardown
      const ext = (this.renderer.gl as WebGLRenderingContext)
        .getExtension('WEBGL_lose_context');
      ext?.loseContext();
    }
  }
}

// ─── Utility: choose correct image src based on color-scheme preference ──────

/**
 * Returns the correct hero image src.
 * Checks the manual `data-theme` attribute on <html> first (set by the theme
 * toggle in the menu), then falls back to the OS `prefers-color-scheme`.
 */
export function getHeroSrc(lightSrc: string, darkSrc: string): string {
  if (typeof window === 'undefined') return lightSrc;
  const forced = document.documentElement.getAttribute('data-theme');
  if (forced === 'dark')  return darkSrc;
  if (forced === 'light') return lightSrc;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkSrc : lightSrc;
}
