/**
 * media-gl.ts — Minimal WebGL2 renderer for scroll-driven image effects.
 *
 * Pure WebGL2 — no OGL dependency. OGL's class inheritance breaks under
 * Turbopack due to field initialisation order issues. This implementation
 * uses raw WebGL2 APIs directly; the logic is identical to the OGL version.
 *
 * Effects:
 *   'parallax'  Per-channel RGB offset (chromatic aberration) that grows
 *               with scroll velocity and eases to crisp at rest.
 *   'gooey'     Liquid simplex warp that swells as you scroll.
 *
 * Uniforms driven from scroll:
 *   u_vel    eased scroll velocity (~-1..1)
 *   u_scroll 0→1 progress over the element's scroll range
 *
 * The rAF loop pauses when the canvas is off-screen and settled — zero
 * idle GPU cost.
 */

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaEffect = "parallax" | "gooey";

export interface MediaGLOptions {
  src: string;
  effect?: MediaEffect;
  intensity?: number;
  onReady?: () => void;
  /** When true, disables the internal window.scroll listener. Use when an
   *  external ScrollTrigger drives setScrollState() — prevents the two
   *  sources from racing and diluting the velocity signal. */
  externalScroll?: boolean;
}

// ─── GLSL ─────────────────────────────────────────────────────────────────────

export const NOISE = `
vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute4(vec4 x){return mod289v4(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise3(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute4(permute4(permute4(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT_SRC = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main(){v_uv=a_uv;gl_Position=vec4(a_pos,0.,1.);}`;

const FRAG_PREFIX = `#version 300 es
precision mediump float;
uniform sampler2D u_map;
uniform float u_time,u_vel,u_scroll,u_intensity;
uniform vec2 u_ratio;
// Hover fabric-wave (parallax effect only — see FRAG_PARALLAX) — u_hover is
// eased 0→1 on button hover/focus, u_origin is the point on the image
// nearest the button the ripple radiates from. Harmless no-op if unused by
// a given shader (gooey doesn't reference them).
uniform float u_hover;
uniform vec2 u_origin;
in vec2 v_uv;
out vec4 fragColor;
vec2 cover(vec2 u){u-=.5;u*=u_ratio;u+=.5;return u;}
`;

const FRAG_PARALLAX =
  FRAG_PREFIX +
  NOISE +
  `
void main(){
  float t = u_time * 0.03;
  vec2 uv = v_uv;

  // Slow vertical drift over the scroll range — image travels 8% of its
  // height from top to bottom of the row, creating genuine parallax depth.
  uv.y += (u_scroll - 0.5) * 0.08 * u_intensity;

  // Ambient simplex micro-turbulence — very low amplitude, gives the image
  // a living, breathing quality at rest without reading as distortion.
  float wx = snoise3(vec3(uv * 1.2, t));
  float wy = snoise3(vec3(uv * 1.2 + 5.3, t));
  uv += vec2(wx, wy) * 0.003 * u_intensity;

  // hdecay — still used by the chromatic-aberration term below to keep the
  // color fringe strongest near the button (u_origin) edge of the image.
  vec2  hd     = (uv - u_origin) * u_ratio;
  float hdecay = exp(-length(hd) * 2.2);

  // Hover ROLLING WAVE — a single low-frequency crest traveling down the
  // image, like a wave rolling to shore, rather than the omnidirectional
  // swirl of noise. It's a directional sine of position-minus-time, so every
  // knob is explicit:
  //   ROLL_FREQ   crests visible across the image height (~1 → one band).
  //   ROLL_SPEED  how fast the band travels (cycles/sec).
  //   the −u_time sign sets travel DOWN the image; flip to + to roll up.
  // Gated by u_hover (eased 0→1 in JS) so it's inert at rest. A faint second
  // wave at ~1.9× frequency + offset phase keeps successive crests from
  // reading as a metronome — one wave, then the next, gently undulating.
  const float TAU       = 6.28318530718;
  const float rollFreq  = 1.05;
  const float rollSpeed = 0.42;
  float roll  = sin((uv.y * rollFreq - u_time * rollSpeed) * TAU);
  roll += 0.35 * sin((uv.y * rollFreq * 1.9 - u_time * rollSpeed * 1.3) * TAU + 1.7);
  float ramp  = u_intensity * u_hover;
  uv.x += roll * 0.018 * ramp; // lateral shear — the visible "waver" band
  uv.y += roll * 0.006 * ramp; // slight vertical roll so the band undulates

  // Chromatic aberration — the main effect. disp is a noise field that
  // spatially varies the per-channel offset so it reads as lens aberration
  // rather than a uniform shift. mag is zero at rest (both terms below scale
  // with a driving signal), so two independent things can drive it:
  //   scrollMag — grows with scroll velocity, sign flips with direction.
  //   hoverMag  — grows with the same u_hover/hdecay that drives the wave
  //     above, so the fringe is strongest right where the ripple originates
  //     and fades out with it — reads as one combined effect, not two
  //     independent layers, and gives the hover state the same "aberration"
  //     texture the reference has instead of a bare geometric warp.
  float disp      = snoise3(vec3(uv * 1.8, t)) * 0.5 + 0.5;
  float scrollMag = (.04 + disp * .06) * (u_vel * u_intensity);
  float hoverMag  = (.03 + disp * .05) * u_hover * u_intensity * hdecay;
  float mag  = scrollMag + hoverMag;
  vec2  off  = vec2(0.0, 1.0) * mag;

  vec2 cuv = cover(uv);
  float r  = texture(u_map, cover(uv + off * 1.0)).r;
  float g  = texture(u_map, cuv).g;
  float b  = texture(u_map, cover(uv - off * 1.8)).b;
  fragColor = vec4(r, g, b, 1.0);
}`;

const FRAG_GOOEY =
  FRAG_PREFIX +
  NOISE +
  `
void main(){
  float t=u_time*.06;
  float amp=(.006+abs(u_vel)*.05+u_scroll*.012)*u_intensity;
  vec2 uv=v_uv;
  uv.y=(uv.y-.5)/(1.+u_vel*.18*u_intensity)+.5;
  float nx=snoise3(vec3(uv.x*2.2,uv.y*2.2,t));
  float ny=snoise3(vec3(uv.x*2.2+5.,uv.y*2.2+5.,t));
  uv+=vec2(nx,ny)*amp;
  uv+=vec2(0.,sin(uv.x*3.1416+t*2.)*.01*(u_scroll+abs(u_vel))*u_intensity);
  fragColor=texture(u_map,cover(uv));
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function coverRatio(
  cw: number,
  ch: number,
  iw: number,
  ih: number,
): [number, number] {
  const cAR = cw / ch,
    iAR = iw / ih;
  return [Math.min(cAR / iAR, 1), Math.min(iAR / cAR, 1)];
}

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader {
  if (gl.isContextLost()) return null as unknown as WebGLShader;
  const s = gl.createShader(type);
  if (!s) {
    console.error("createShader returned null");
    return null as unknown as WebGLShader;
  }
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const typeName = type === gl.VERTEX_SHADER ? "Vertex" : "Fragment";
    const log = gl.getShaderInfoLog(s) ?? "(no log)";
    console.error(
      `${typeName} shader compile error:\n${log}\n\nSource:\n${src}`,
    );
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
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error("Program link error:", gl.getProgramInfoLog(p));
  return p;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class MediaGL {
  private canvas: HTMLCanvasElement;
  private opts: Required<MediaGLOptions>;
  private gl!: WebGL2RenderingContext;
  private prog!: WebGLProgram;
  private vao!: WebGLVertexArrayObject;
  private tex!: WebGLTexture;
  private posBuf!: WebGLBuffer;
  private uvBuf!: WebGLBuffer;
  private idxBuf!: WebGLBuffer;

  // Uniform locations (populated in _build)
  private uTime!: WebGLUniformLocation;
  private uVel!: WebGLUniformLocation;
  private uScroll!: WebGLUniformLocation;
  private uIntensity!: WebGLUniformLocation;
  private uRatio!: WebGLUniformLocation;
  private uMap!: WebGLUniformLocation;
  private uHover!: WebGLUniformLocation;
  private uOrigin!: WebGLUniformLocation;

  private ready = false;
  private disposed = false;
  private rafId: number | null = null;
  private last = 0;
  private imgW = 1;
  private imgH = 1;
  private time = 0;

  private vel = 0;
  private velT = 0;
  private scroll = 0;
  private scrollT = 0;
  private lastY = 0;

  private hover: number = 0;
  private hoverT: number = 0;
  private origin: [number, number] = [0.5, 0.5];

  private _boundScroll!: () => void;
  private _boundResize!: () => void;
  private resizeObserver: ResizeObserver | null = null;

  // Cached so a context restore can re-upload the texture without refetching
  // the network image. Null means the image failed to load (or hasn't
  // resolved yet) — _build's 1×1 fallback path handles that case either way.
  private img: HTMLImageElement | null = null;
  private _boundContextLost!: (e: Event) => void;
  private _boundContextRestored!: () => void;

  constructor(canvas: HTMLCanvasElement, opts: MediaGLOptions) {
    this.canvas = canvas;
    this.opts = {
      effect: "parallax",
      intensity: 1.5,
      onReady: () => {},
      externalScroll: false,
      ...opts,
    };
    this.lastY = typeof window !== "undefined" ? window.scrollY : 0;
    this._init();
  }

  private _init() {
    // If the canvas already has a context (e.g. React StrictMode remount after
    // dispose), reuse it — don't request a new one on a potentially lost context.
    const existing = this.canvas.getContext("webgl2");
    if (!existing || existing.isContextLost()) {
      console.warn("MediaGL: WebGL2 context unavailable or lost");
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
      this.img = img;
      this.imgW = img.naturalWidth;
      this.imgH = img.naturalHeight;
      this._build(img);
    };
    img.onerror = () => this._build(null);
    img.src = this.opts.src;

    this._boundScroll = this._measure.bind(this);
    this._boundResize = this._resize.bind(this);
    // Only register the internal scroll listener when not externally driven.
    // When externalScroll:true, setScrollState() is the sole scroll input.
    if (!this.opts.externalScroll) {
      window.addEventListener("scroll", this._boundScroll, { passive: true });
    }
    window.addEventListener("resize", this._boundResize);

    const parent = this.canvas.parentElement;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => this._resize());
      this.resizeObserver.observe(parent);
    }

    // A lost context invalidates every GL object (program, buffers, texture,
    // VAO) even though the canvas element and its JS-side `gl` reference
    // survive — preventDefault() on 'lost' is what tells the browser this
    // context is worth restoring at all; without it 'restored' never fires.
    // Rebuilding on restore reuses the cached `this.img` instead of
    // refetching the network image.
    this._boundContextLost = (e: Event) => {
      e.preventDefault();
      this.ready = false;
      this.stop();
    };
    this._boundContextRestored = () => this._build(this.img);
    this.canvas.addEventListener(
      "webglcontextlost",
      this._boundContextLost,
      false,
    );
    this.canvas.addEventListener(
      "webglcontextrestored",
      this._boundContextRestored,
      false,
    );
  }

  private _build(img: HTMLImageElement | null) {
    if (this.disposed) return;
    if (!this.gl || this.gl.isContextLost()) return;
    const gl = this.gl;
    const frag = this.opts.effect === "parallax" ? FRAG_PARALLAX : FRAG_GOOEY;

    // Compile program
    this.prog = createProgram(gl, VERT_SRC, frag);

    // Cache uniform locations. u_hover/u_origin are null on programs that
    // don't reference them (e.g. gooey) — gl.uniform*(null, ...) is a
    // spec-defined no-op, so that's safe to just always set in _renderOnce.
    this.uTime = gl.getUniformLocation(this.prog, "u_time")!;
    this.uVel = gl.getUniformLocation(this.prog, "u_vel")!;
    this.uScroll = gl.getUniformLocation(this.prog, "u_scroll")!;
    this.uIntensity = gl.getUniformLocation(this.prog, "u_intensity")!;
    this.uRatio = gl.getUniformLocation(this.prog, "u_ratio")!;
    this.uMap = gl.getUniformLocation(this.prog, "u_map")!;
    this.uHover = gl.getUniformLocation(this.prog, "u_hover")!;
    this.uOrigin = gl.getUniformLocation(this.prog, "u_origin")!;

    // Fullscreen quad VAO
    // prettier-ignore
    const pos = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    // prettier-ignore
    const uvs = new Float32Array([0,0, 1,0, 0,1, 1,1]);
    const idx = new Uint16Array([0, 1, 2, 1, 3, 2]);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    this.posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(this.prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.uvBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(this.prog, "a_uv");
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    this.idxBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    // Texture
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (img) {
      // flipY: WebGL's origin is bottom-left, image origin is top-left
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    } else {
      // 1×1 transparent fallback
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
    this._measure();
    this.start();
    this.opts.onReady();
  }

  private _measure() {
    const y = window.scrollY ?? 0;
    const dy = y - this.lastY;
    this.lastY = y;
    if (reducedMotion()) {
      this.velT = 0;
      this.scrollT = 0.5;
    } else {
      this.velT = Math.max(-1, Math.min(1, dy / 60));
      this.scrollT = Math.max(0, Math.min(1, y / (window.innerHeight * 1.4)));
    }
    this.start();
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
    gl.useProgram(this.prog);

    const { w, h } = this._size();
    const [rx, ry] = coverRatio(w, h, this.imgW, this.imgH);
    gl.uniform1f(this.uTime, this.time);
    gl.uniform1f(this.uVel, this.vel);
    gl.uniform1f(this.uScroll, this.scroll);
    gl.uniform1f(this.uIntensity, this.opts.intensity);
    gl.uniform2f(this.uRatio, rx, ry);
    gl.uniform1i(this.uMap, 0);
    gl.uniform1f(this.uHover, this.hover);
    gl.uniform2f(this.uOrigin, this.origin[0], this.origin[1]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);

    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  setScrollState(vel: number, scroll: number) {
    // prefers-reduced-motion: hold the shader at its neutral, distortion-free
    // state — no chromatic-aberration/parallax reaction to scroll velocity —
    // rather than just easing it slower. 0.5 is the scroll midpoint where the
    // parallax UV offset term cancels to zero (see FRAG_PARALLAX above).
    if (reducedMotion()) {
      this.velT = 0;
      this.scrollT = 0.5;
      this.start();
      return;
    }
    // Feed velocity into the spring target so the easing in _tick applies
    this.velT = Math.max(-1, Math.min(1, vel));
    this.scrollT = Math.max(0, Math.min(1, scroll));
    this.start();
  }

  setIntensity(v: number) {
    this.opts.intensity = v;
    this.start();
  }

  // Fabric-wave hover trigger — see FRAG_PARALLAX. Call on pointer/focus
  // enter+leave of the row's "View Case Study" button, not the image itself
  // (there's no live cursor position over the image to follow; the wave is
  // an ambient animation anchored at setOrigin's point, gated by this).
  setHover(active: boolean) {
    // No wave motion under reduced motion — same neutral-state policy as
    // setScrollState above.
    this.hoverT = reducedMotion() ? 0 : active ? 1 : 0;
    this.start();
  }

  // One-time (not per-frame) — the point on the image nearest the button,
  // in UV space (0,0 = top-left, 1,1 = bottom-right), that the hover-wave
  // radiates from. Set once after construction based on the row's side.
  setOrigin(x: number, y: number) {
    this.origin = [x, y];
  }

  setEffect(name: MediaEffect) {
    if (this.opts.effect === name || !this.ready || this.disposed) return;
    this.opts.effect = name;
    const gl = this.gl;
    const frag = name === "parallax" ? FRAG_PARALLAX : FRAG_GOOEY;
    gl.deleteProgram(this.prog);
    this.prog = createProgram(gl, VERT_SRC, frag);
    this.uTime = gl.getUniformLocation(this.prog, "u_time")!;
    this.uVel = gl.getUniformLocation(this.prog, "u_vel")!;
    this.uScroll = gl.getUniformLocation(this.prog, "u_scroll")!;
    this.uIntensity = gl.getUniformLocation(this.prog, "u_intensity")!;
    this.uRatio = gl.getUniformLocation(this.prog, "u_ratio")!;
    this.uMap = gl.getUniformLocation(this.prog, "u_map")!;
    this.uHover = gl.getUniformLocation(this.prog, "u_hover")!;
    this.uOrigin = gl.getUniformLocation(this.prog, "u_origin")!;
    this.start();
  }

  // ── Render loop ────────────────────────────────────────────────────────────

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

    this.velT *= Math.exp(-dt * 6.0);
    this.vel += (this.velT - this.vel) * Math.min(1, dt * 9);
    this.scroll += (this.scrollT - this.scroll) * Math.min(1, dt * 6);
    this.hover += (this.hoverT - this.hover) * Math.min(1, dt * 8);

    this._renderOnce();

    const r = this.canvas.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    const settling =
      Math.abs(this.vel) > 0.001 ||
      Math.abs(this.velT) > 0.001 ||
      Math.abs(this.scroll - this.scrollT) > 0.001 ||
      // hoverT > 0 for the entire hover duration (not just while easing),
      // so this keeps the loop alive for continuous ambient wave motion the
      // whole time the button is hovered — not just during the fade in/out.
      this.hoverT > 0.001 ||
      this.hover > 0.001;

    if (!visible && !settling) {
      this.stop();
      return;
    }
    if (visible && !settling && this.opts.effect === "parallax") {
      this.stop();
      return;
    }

    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  dispose(_keepContext = false): void {
    this.disposed = true;
    this.stop();
    window.removeEventListener("scroll", this._boundScroll);
    window.removeEventListener("resize", this._boundResize);
    this.canvas.removeEventListener("webglcontextlost", this._boundContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this._boundContextRestored,
    );
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    // Free the individual GL objects — this is unrelated to (and much
    // narrower than) the WEBGL_lose_context extension: deleting a program,
    // texture, VAO, or buffer doesn't touch the context itself, so the
    // canvas element stays reusable for a React remount (StrictMode or a
    // client-side navigation back to the same route) exactly as before.
    // Guarded by `ready` too — if dispose() runs while the source image is
    // still loading, _build() never ran and prog/tex/vao/bufs were never
    // created, so there's nothing to free yet. Skipped if the context is
    // already lost — every name below is already invalid GPU-side in that
    // case, and gl.delete* would just no-op anyway. cSpell:ignore Turbopack initialisation GLSL snoise xzyw xxyy zzww mediump hdecay webglcontextlost webglcontextrestored bufs
    if (this.ready && this.gl && !this.gl.isContextLost()) {
      this.gl.deleteProgram(this.prog);
      this.gl.deleteTexture(this.tex);
      this.gl.deleteVertexArray(this.vao);
      this.gl.deleteBuffer(this.posBuf);
      this.gl.deleteBuffer(this.uvBuf);
      this.gl.deleteBuffer(this.idxBuf);
    }
  }
}
