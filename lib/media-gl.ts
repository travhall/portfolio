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
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaEffect = 'parallax' | 'gooey';

export interface MediaGLOptions {
  src:             string;
  effect?:         MediaEffect;
  intensity?:      number;
  onReady?:        () => void;
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
in vec2 v_uv;
out vec4 fragColor;
vec2 cover(vec2 u){u-=.5;u*=u_ratio;u+=.5;return u;}
`;

const FRAG_PARALLAX = FRAG_PREFIX + NOISE + `
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

  // Chromatic aberration — the main effect. disp is a noise field that
  // spatially varies the per-channel offset so it reads as lens aberration
  // rather than a uniform shift. The base offset (.04) is visible even at
  // rest; the velocity term (.06 * abs(v)) grows it dramatically on scroll.
  float disp = snoise3(vec3(uv * 1.8, t)) * 0.5 + 0.5;
  float v    = u_vel * u_intensity;
  float mag  = (.04 + disp * .06) * v;
  vec2  off  = vec2(0.0, 1.0) * mag;

  vec2 cuv = cover(uv);
  float r  = texture(u_map, cover(uv + off * 1.0)).r;
  float g  = texture(u_map, cuv).g;
  float b  = texture(u_map, cover(uv - off * 1.8)).b;
  fragColor = vec4(r, g, b, 1.0);
}`;

const FRAG_GOOEY = FRAG_PREFIX + NOISE + `
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

export function coverRatio(cw: number, ch: number, iw: number, ih: number): [number, number] {
  const cAR = cw / ch, iAR = iw / ih;
  return [Math.min(cAR / iAR, 1), Math.min(iAR / cAR, 1)];
}

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  if (gl.isContextLost()) return null as unknown as WebGLShader;
  const s = gl.createShader(type);
  if (!s) { console.error('createShader returned null'); return null as unknown as WebGLShader; }
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const typeName = type === gl.VERTEX_SHADER ? 'Vertex' : 'Fragment';
    const log = gl.getShaderInfoLog(s) ?? '(no log)';
    console.error(`${typeName} shader compile error:\n${log}\n\nSource:\n${src}`);
  }
  return s;
}

function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
  const p = gl.createProgram()!;
  gl.attachShader(p, compileShader(gl, gl.VERTEX_SHADER, vert));
  gl.attachShader(p, compileShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error('Program link error:', gl.getProgramInfoLog(p));
  return p;
}

// ─── Class ────────────────────────────────────────────────────────────────────

export class MediaGL {
  private canvas:  HTMLCanvasElement;
  private opts:    Required<MediaGLOptions>;
  private gl!:     WebGL2RenderingContext;
  private prog!:   WebGLProgram;
  private vao!:    WebGLVertexArrayObject;
  private tex!:    WebGLTexture;

  // Uniform locations (populated in _build)
  private uTime!:      WebGLUniformLocation;
  private uVel!:       WebGLUniformLocation;
  private uScroll!:    WebGLUniformLocation;
  private uIntensity!: WebGLUniformLocation;
  private uRatio!:     WebGLUniformLocation;
  private uMap!:       WebGLUniformLocation;

  private ready    = false;
  private disposed = false;
  private rafId:  number | null = null;
  private last    = 0;
  private imgW    = 1;
  private imgH    = 1;
  private time    = 0;

  private vel     = 0;
  private velT    = 0;
  private scroll  = 0;
  private scrollT = 0;
  private lastY   = 0;

  private _boundScroll!: () => void;
  private _boundResize!: () => void;
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, opts: MediaGLOptions) {
    this.canvas = canvas;
    this.opts   = { effect: 'parallax', intensity: 1.5, onReady: () => {}, externalScroll: false, ...opts };
    this.lastY  = typeof window !== 'undefined' ? window.scrollY : 0;
    this._init();
  }

  private _init() {
    // If the canvas already has a context (e.g. React StrictMode remount after
    // dispose), reuse it — don't request a new one on a potentially lost context.
    const existing = this.canvas.getContext('webgl2');
    if (!existing || existing.isContextLost()) {
      console.warn('MediaGL: WebGL2 context unavailable or lost');
      return;
    }
    this.gl = existing;

    const { w, h } = this._size();
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    this.canvas.width  = w * dpr;
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

    this._boundScroll = this._measure.bind(this);
    this._boundResize = this._resize.bind(this);
    // Only register the internal scroll listener when not externally driven.
    // When externalScroll:true, setScrollState() is the sole scroll input.
    if (!this.opts.externalScroll) {
      window.addEventListener('scroll', this._boundScroll, { passive: true });
    }
    window.addEventListener('resize', this._boundResize);

    const parent = this.canvas.parentElement;
    if (parent) {
      this.resizeObserver = new ResizeObserver(() => this._resize());
      this.resizeObserver.observe(parent);
    }
  }

  private _build(img: HTMLImageElement | null) {
    if (this.disposed) return;
    if (!this.gl || this.gl.isContextLost()) return;
    const gl   = this.gl;
    const frag = this.opts.effect === 'parallax' ? FRAG_PARALLAX : FRAG_GOOEY;

    // Compile program
    this.prog = createProgram(gl, VERT_SRC, frag);

    // Cache uniform locations
    this.uTime      = gl.getUniformLocation(this.prog, 'u_time')!;
    this.uVel       = gl.getUniformLocation(this.prog, 'u_vel')!;
    this.uScroll    = gl.getUniformLocation(this.prog, 'u_scroll')!;
    this.uIntensity = gl.getUniformLocation(this.prog, 'u_intensity')!;
    this.uRatio     = gl.getUniformLocation(this.prog, 'u_ratio')!;
    this.uMap       = gl.getUniformLocation(this.prog, 'u_map')!;

    // Fullscreen quad VAO
    // prettier-ignore
    const pos = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    // prettier-ignore
    const uvs = new Float32Array([0,0, 1,0, 0,1, 1,1]);
    const idx = new Uint16Array([0,1,2, 1,3,2]);

    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    const posBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(this.prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    const aUv = gl.getAttribLocation(this.prog, 'a_uv');
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0);

    const idxBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);
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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    }
    gl.bindTexture(gl.TEXTURE_2D, null);

    this.ready = true;
    this._resize();
    this._measure();
    this.start();
    this.opts.onReady();
  }

  private _measure() {
    const y  = window.scrollY ?? 0;
    const dy = y - this.lastY;
    this.lastY = y;
    if (reducedMotion()) {
      this.velT    = 0;
      this.scrollT = 0.5;
    } else {
      this.velT    = Math.max(-1, Math.min(1, dy / 60));
      this.scrollT = Math.max(0, Math.min(1, y / (window.innerHeight * 1.4)));
    }
    this.start();
  }

  private _resize() {
    if (!this.ready || this.disposed) return;
    const { w, h } = this._size();
    const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
    this.canvas.width  = w * dpr;
    this.canvas.height = h * dpr;
    this._renderOnce();
  }

  private _size() {
    const p = this.canvas.parentElement;
    return {
      w: p?.clientWidth  || this.canvas.clientWidth  || 1,
      h: p?.clientHeight || this.canvas.clientHeight || 1,
    };
  }

  private _renderOnce() {
    if (!this.ready || this.disposed) return;
    const gl  = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.prog);

    const { w, h } = this._size();
    const [rx, ry] = coverRatio(w, h, this.imgW, this.imgH);
    gl.uniform1f(this.uTime,      this.time);
    gl.uniform1f(this.uVel,       this.vel);
    gl.uniform1f(this.uScroll,    this.scroll);
    gl.uniform1f(this.uIntensity, this.opts.intensity);
    gl.uniform2f(this.uRatio,     rx, ry);
    gl.uniform1i(this.uMap,       0);

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
      this.velT    = 0;
      this.scrollT = 0.5;
      this.start();
      return;
    }
    // Feed velocity into the spring target so the easing in _tick applies
    this.velT    = Math.max(-1, Math.min(1, vel));
    this.scrollT = Math.max(0,  Math.min(1, scroll));
    this.start();
  }

  setIntensity(v: number) {
    this.opts.intensity = v;
    this.start();
  }

  setEffect(name: MediaEffect) {
    if (this.opts.effect === name || !this.ready || this.disposed) return;
    this.opts.effect = name;
    const gl   = this.gl;
    const frag = name === 'parallax' ? FRAG_PARALLAX : FRAG_GOOEY;
    gl.deleteProgram(this.prog);
    this.prog = createProgram(gl, VERT_SRC, frag);
    this.uTime      = gl.getUniformLocation(this.prog, 'u_time')!;
    this.uVel       = gl.getUniformLocation(this.prog, 'u_vel')!;
    this.uScroll    = gl.getUniformLocation(this.prog, 'u_scroll')!;
    this.uIntensity = gl.getUniformLocation(this.prog, 'u_intensity')!;
    this.uRatio     = gl.getUniformLocation(this.prog, 'u_ratio')!;
    this.uMap       = gl.getUniformLocation(this.prog, 'u_map')!;
    this.start();
  }

  // ── Render loop ────────────────────────────────────────────────────────────

  start() {
    if (this.rafId || !this.ready || this.disposed) return;
    this.last  = performance.now();
    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  private _tick(now: number) {
    this.rafId = null;
    if (this.disposed) return;

    const dt   = Math.min((now - this.last) / 1000, 0.05);
    this.last  = now;
    this.time += dt;

    this.velT   *= Math.exp(-dt * 6.0);
    this.vel    += (this.velT   - this.vel)    * Math.min(1, dt * 9);
    this.scroll += (this.scrollT - this.scroll) * Math.min(1, dt * 6);

    this._renderOnce();

    const r       = this.canvas.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    const settling =
      Math.abs(this.vel)    > 0.001 ||
      Math.abs(this.velT)   > 0.001 ||
      Math.abs(this.scroll  - this.scrollT) > 0.001;

    if (!visible && !settling) { this.stop(); return; }
    if (visible && !settling && this.opts.effect === 'parallax') { this.stop(); return; }

    this.rafId = requestAnimationFrame(this._tick.bind(this));
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────

  dispose(_keepContext = false): void {
    this.disposed = true;
    this.stop();
    window.removeEventListener('scroll', this._boundScroll);
    window.removeEventListener('resize', this._boundResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    // Do not call loseContext — it permanently breaks the canvas element for
    // React remounts (StrictMode or navigation). The GPU resources are freed
  }
}

