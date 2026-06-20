/**
 * magnetic-dots.ts — WebGL2 canvas overlay for the FeatureWipe hover effect.
 *
 * Renders a halftone "dots" image, hidden until the cursor enters, then
 * fades in and warps toward the pointer: a localized magnetic pull plus a
 * radiating ripple that animates continuously while hovered. Pointer-driven
 * rather than scroll-driven, so it's its own class rather than a third
 * MediaEffect on MediaGL (media-gl.ts) — the driver loop and uniforms don't
 * overlap with that scroll/velocity model.
 *
 * Deliberately skipped on touch/coarse-pointer devices — callers should
 * check supportsHoverPointer() before constructing one.
 */

import { coverRatio } from "./media-gl";

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export function supportsHoverPointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false;
}

// ─── Config ───────────────────────────────────────────────────────────────────
// Every tunable knob for the effect lives here so it can be experimented
// with (or overridden per-instance) without touching the shader.

export interface MagneticDotsConfig {
  /** Cursor influence radius, in normalized UV units (aspect-corrected). */
  radius: number;
  /** Strength of the inward pull toward the cursor, in UV units. */
  strength: number;
  /** Amplitude of the radiating ripple wave, in UV units. */
  rippleAmp: number;
  /** Spatial frequency of the ripple — higher = tighter rings. */
  rippleFreq: number;
  /** Ripple animation speed. */
  rippleSpeed: number;
  /** Pointer-follow easing per frame (0–1) — higher tracks faster. */
  mouseEase: number;
  /** Reveal fade in/out easing per frame (0–1). */
  revealEase: number;
}

export const DEFAULT_MAGNETIC_DOTS_CONFIG: MagneticDotsConfig = {
  radius: 0.32,
  strength: 0.06,
  rippleAmp: 0.012,
  rippleFreq: 26,
  rippleSpeed: 2.6,
  mouseEase: 0.12,
  revealEase: 0.1,
};

export interface MagneticDotsOptions extends Partial<MagneticDotsConfig> {
  src: string;
  onReady?: () => void;
}

// ─── GLSL ─────────────────────────────────────────────────────────────────────

const VERT_SRC = `#version 300 es
in vec2 a_pos;
in vec2 a_uv;
out vec2 v_uv;
void main(){v_uv=a_uv;gl_Position=vec4(a_pos,0.,1.);}`;

const FRAG_SRC = `#version 300 es
precision mediump float;
uniform sampler2D u_map;
uniform float u_time,u_reveal,u_radius,u_strength,u_rippleAmp,u_rippleFreq,u_rippleSpeed;
uniform vec2 u_mouse,u_ratio;
in vec2 v_uv;
out vec4 fragColor;
vec2 cover(vec2 u){u-=.5;u*=u_ratio;u+=.5;return u;}
void main(){
  vec2 uv = v_uv;

  // Distance to pointer in aspect-corrected space so the influence radius
  // reads as a circle regardless of the canvas's aspect ratio.
  vec2 d = (uv - u_mouse) * u_ratio;
  float dist = length(d);
  float falloff = 1.0 - smoothstep(0.0, u_radius, dist);
  vec2 dir = dist > 0.0001 ? d / dist : vec2(0.0);
  vec2 dirUv = dir / max(u_ratio, vec2(0.0001));

  // Magnetic pull: sample slightly toward the pointer so the image bulges
  // toward it. Ripple: a decaying wave radiating outward from the pointer,
  // animated continuously while hovered.
  float ripple = sin(dist * u_rippleFreq - u_time * u_rippleSpeed) * falloff * u_rippleAmp;
  vec2 warped = uv - dirUv * falloff * u_strength + dirUv * ripple;

  vec4 tex = texture(u_map, cover(warped));
  fragColor = vec4(tex.rgb, tex.a * u_reveal);
}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  if (gl.isContextLost()) return null as unknown as WebGLShader;
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error("MagneticDots shader compile error:", gl.getShaderInfoLog(s));
  }
  return s;
}

function createProgram(gl: WebGL2RenderingContext, vert: string, frag: string): WebGLProgram {
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
  private uReveal!: WebGLUniformLocation;
  private uRadius!: WebGLUniformLocation;
  private uStrength!: WebGLUniformLocation;
  private uRippleAmp!: WebGLUniformLocation;
  private uRippleFreq!: WebGLUniformLocation;
  private uRippleSpeed!: WebGLUniformLocation;
  private uMouse!: WebGLUniformLocation;
  private uRatio!: WebGLUniformLocation;
  private uMap!: WebGLUniformLocation;

  private ready = false;
  private disposed = false;
  private rafId: number | null = null;
  private last = 0;
  private time = 0;
  private imgW = 1;
  private imgH = 1;

  private mouse: [number, number] = [0.5, 0.5];
  private mouseTarget: [number, number] = [0.5, 0.5];
  private reveal = 0;
  private revealTarget = 0;
  private hovered = false;

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
    this.uReveal = gl.getUniformLocation(this.prog, "u_reveal")!;
    this.uRadius = gl.getUniformLocation(this.prog, "u_radius")!;
    this.uStrength = gl.getUniformLocation(this.prog, "u_strength")!;
    this.uRippleAmp = gl.getUniformLocation(this.prog, "u_rippleAmp")!;
    this.uRippleFreq = gl.getUniformLocation(this.prog, "u_rippleFreq")!;
    this.uRippleSpeed = gl.getUniformLocation(this.prog, "u_rippleSpeed")!;
    this.uMouse = gl.getUniformLocation(this.prog, "u_mouse")!;
    this.uRatio = gl.getUniformLocation(this.prog, "u_ratio")!;
    this.uMap = gl.getUniformLocation(this.prog, "u_map")!;

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
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
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
    gl.uniform1f(this.uTime, this.time);
    gl.uniform1f(this.uReveal, this.reveal);
    gl.uniform1f(this.uRadius, this.opts.radius);
    gl.uniform1f(this.uStrength, this.opts.strength);
    gl.uniform1f(this.uRippleAmp, reducedMotion() ? 0 : this.opts.rippleAmp);
    gl.uniform1f(this.uRippleFreq, this.opts.rippleFreq);
    gl.uniform1f(this.uRippleSpeed, this.opts.rippleSpeed);
    gl.uniform2f(this.uMouse, this.mouse[0], this.mouse[1]);
    gl.uniform2f(this.uRatio, rx, ry);
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
    this.mouseTarget = [u, 1 - v];
    this.start();
  }

  enter() {
    this.hovered = true;
    this.revealTarget = reducedMotion() ? 1 : 1;
    this.start();
  }

  leave() {
    this.hovered = false;
    this.revealTarget = 0;
    this.start();
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

    this.mouse[0] += (this.mouseTarget[0] - this.mouse[0]) * this.opts.mouseEase;
    this.mouse[1] += (this.mouseTarget[1] - this.mouse[1]) * this.opts.mouseEase;
    this.reveal += (this.revealTarget - this.reveal) * this.opts.revealEase;

    this._renderOnce();

    const settling =
      Math.abs(this.reveal - this.revealTarget) > 0.001 ||
      Math.abs(this.mouse[0] - this.mouseTarget[0]) > 0.0005 ||
      Math.abs(this.mouse[1] - this.mouseTarget[1]) > 0.0005;

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
