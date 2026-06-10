// Water-ripple click effect — ported from the prototype's ripple-click.js
// (itself a GSAP-free take on Codrops "Distorted Button Effects" example 9).
//
// A click sends a ripple out from the exact cursor point: an feImage
// (a radial R/G displacement texture) grows outward while its displacement
// strength fades, so the element's pixels bow and settle like water. The
// SVG filter is attached only for the pulse, then removed — zero idle cost.

const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const DEFAULT_SRC = "/images/ripple.png";

export type RippleOptions = {
  src?: string;
  /** peak displacement in px */
  strength?: number;
  /** max ripple diameter in px (default: ~2.4x the element's long side) */
  size?: number;
  /** ms for the ripple to travel + fade */
  duration?: number;
  onComplete?: () => void;
};

type RippleParts = { id: string; filter: SVGElement; img: SVGElement; dm: SVGElement; gen: number };

let host: SVGSVGElement | null = null;
let uid = 0;
const partsByElement = new WeakMap<Element, RippleParts>();

function ensureHost(): SVGSVGElement {
  if (host?.isConnected) return host;
  // Module state resets on hot reload, but a host appended by a previous
  // module instance can still be sitting in the DOM — reuse it instead of
  // appending a duplicate (which would leave stale, frozen <filter>s with
  // ids that collide with the new ones below).
  const existing = document.querySelector<SVGSVGElement>("svg.ripple-filters");
  if (existing) {
    host = existing;
    return host;
  }
  host = document.createElementNS(SVG_NS, "svg") as SVGSVGElement;
  host.setAttribute("aria-hidden", "true");
  host.setAttribute("class", "ripple-filters");
  host.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.appendChild(host);
  return host;
}

function makeFilter(src: string): RippleParts {
  const svgHost = ensureHost();
  // Skip any id still occupied by a leftover <filter> from a previous module
  // instance (e.g. hot reload reset `uid` to 0) — a duplicate id would
  // resolve `url(#id)` to that stale, frozen filter instead of this one.
  let id: string;
  do {
    id = "ripple-fx-" + ++uid;
  } while (svgHost.querySelector(`#${id}`));
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.setAttribute("id", id);
  // userSpaceOnUse so the region lines up 1:1 with the primitives' own px
  // coordinates (which are also userSpaceOnUse, the default). objectBoundingBox
  // (the SVG default) re-derives the region from the element's aspect ratio and
  // breaks the displacement rendering on non-square elements.
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  // x/y/width/height (the filter region) are sized per-run to fit that ripple's
  // max diameter — see run().
  filter.setAttribute("color-interpolation-filters", "sRGB");

  const img = document.createElementNS(SVG_NS, "feImage");
  img.setAttributeNS(XLINK_NS, "xlink:href", src);
  img.setAttribute("href", src);
  img.setAttribute("preserveAspectRatio", "none");
  img.setAttribute("x", "0");
  img.setAttribute("y", "0");
  img.setAttribute("width", "0");
  img.setAttribute("height", "0");
  img.setAttribute("result", "ripple");

  const dm = document.createElementNS(SVG_NS, "feDisplacementMap");
  dm.setAttribute("xChannelSelector", "R");
  dm.setAttribute("yChannelSelector", "G");
  dm.setAttribute("color-interpolation-filters", "sRGB");
  dm.setAttribute("in", "SourceGraphic");
  dm.setAttribute("in2", "ripple");
  dm.setAttribute("scale", "0");
  dm.setAttribute("result", "dm");

  // keep the distortion only where the ripple ring is, then lay it over the source
  const c1 = document.createElementNS(SVG_NS, "feComposite");
  c1.setAttribute("operator", "in");
  c1.setAttribute("in2", "ripple");
  const c2 = document.createElementNS(SVG_NS, "feComposite");
  c2.setAttribute("in2", "SourceGraphic");

  filter.append(img, dm, c1, c2);
  svgHost.appendChild(filter);
  return { id, filter, img, dm, gen: 0 };
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3); // wave decelerates as it spreads

function run(el: HTMLElement, parts: RippleParts, cx: number, cy: number, opts: RippleOptions) {
  const strength = opts.strength ?? 18;
  const maxSize = opts.size ?? Math.max(el.offsetWidth, el.offsetHeight) * 2.4;
  const duration = opts.duration ?? 900;
  const start = performance.now();

  // Size the filter region (in px, userSpaceOnUse) to fit this ripple's full
  // diameter, however far that pushes past the element's edges (worst case:
  // click lands in a corner).
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const pad = maxSize / 2;
  parts.filter.setAttribute("x", (-pad).toFixed(1));
  parts.filter.setAttribute("y", (-pad).toFixed(1));
  parts.filter.setAttribute("width", (w + 2 * pad).toFixed(1));
  parts.filter.setAttribute("height", (h + 2 * pad).toFixed(1));

  el.style.filter = `url(#${parts.id})`;
  el.style.willChange = "filter";

  // A new ripple supersedes any in-flight one on this element — bump the
  // generation so the old loop's next frame bails out instead of stomping on
  // these (shared) filter primitives or resetting el.style.filter mid-flight.
  const myGen = ++parts.gen;

  function frame(now: number) {
    if (parts.gen !== myGen) return;
    const t = Math.min(Math.max((now - start) / duration, 0), 1);
    const size = maxSize * easeOut(t); // ring grows + decelerates
    const s = size / 2;
    parts.img.setAttribute("x", (cx - s).toFixed(1));
    parts.img.setAttribute("y", (cy - s).toFixed(1));
    parts.img.setAttribute("width", size.toFixed(1));
    parts.img.setAttribute("height", size.toFixed(1));
    parts.dm.setAttribute("scale", (strength * (1 - t)).toFixed(2)); // amplitude decays
    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      el.style.filter = "none";
      el.style.willChange = "auto";
      parts.dm.setAttribute("scale", "0");
      opts.onComplete?.();
    }
  }
  requestAnimationFrame(frame);
}

/** True if the user has asked the OS for reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Fire a ripple from the event's point — designed for a React onClick handler. */
export function triggerRipple(el: HTMLElement, ev: { clientX?: number; clientY?: number } | null, opts: RippleOptions = {}) {
  if (!el || typeof window === "undefined") return;
  if (prefersReducedMotion()) {
    opts.onComplete?.();
    return;
  }
  let parts = partsByElement.get(el);
  if (!parts) {
    parts = makeFilter(opts.src || DEFAULT_SRC);
    partsByElement.set(el, parts);
  }
  const r = el.getBoundingClientRect();
  // clientX/rect is robust even when the click lands on a child (icon/label) span
  const cx = ev?.clientX != null ? ev.clientX - r.left : r.width / 2;
  const cy = ev?.clientY != null ? ev.clientY - r.top : r.height / 2;
  run(el, parts, cx, cy, opts);
}

/**
 * Drop the SVG `<filter>` for an element that's about to be removed from the
 * DOM (e.g. a dismissed Tag) — otherwise it lingers in the hidden host SVG
 * for the rest of the session.
 */
export function disposeRipple(el: HTMLElement) {
  const parts = partsByElement.get(el);
  if (!parts) return;
  parts.filter.remove();
  partsByElement.delete(el);
}
