"use client";

// Scène WebGL de la direction C : un seul shader, aucune bibliothèque.
// Effets pilotés par des uniformes lus à chaque image (ref) :
// - mix : fondu « à l'encre » d'un portrait à l'autre (seuil de bruit, bord d'encre) ;
// - halftone : trame de points proportionnée à la lumière ;
// - shatter : éclatement en fragments avec décalage chromatique ;
// - rings : anneaux concentriques qui s'étendent (extension du territoire) ;
// - tint : couleur du membre.
// Économies : densité de pixels plafonnée, pause hors écran et onglet caché, rendu unique
// si le visiteur demande moins d'animations ; sans WebGL, l'image reste en CSS derrière.
import { useEffect, useRef } from "react";

export interface InkUniforms { mix: number; halftone: number; shatter: number; rings: number; tint: [number, number, number]; focusY: number; light: number }

const VERT = `attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }`;
const FRAG = `precision highp float;
varying vec2 v;
uniform sampler2D tA, tB; uniform vec2 res, sA, sB, mouse; uniform float mixv, halftone, shatter, rings, time, focusY, light; uniform vec3 tint;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++){ s += a * n(p); p *= 2.03; a *= .5; } return s; }
vec2 cover(vec2 uv, vec2 img){ float rs = res.x/res.y, ri = img.x/img.y;
  vec2 s = rs > ri ? vec2(1., ri/rs) : vec2(rs/ri, 1.); return uv * s + (1. - s) * vec2(.5, focusY); }
void main(){
  vec2 uv = v;
  vec2 cell = floor(uv * vec2(7., 5.));
  vec2 off = (vec2(h(cell), h(cell + 9.)) - .5) * shatter * .22;
  uv += off;
  float ca = shatter * .018 + .002;
  vec3 a = vec3(texture2D(tA, cover(uv + vec2(ca,0.), sA)).r, texture2D(tA, cover(uv, sA)).g, texture2D(tA, cover(uv - vec2(ca,0.), sA)).b);
  vec3 b = texture2D(tB, cover(uv, sB)).rgb;
  float k = fbm(uv * 4. + time * .03);
  float t = mixv * 1.15 - .075;
  vec3 col = mix(a, b, step(k, t));
  float edge = 1. - smoothstep(0., .035, abs(k - t));
  col = mix(col, vec3(.02), edge * step(.001, mixv) * step(mixv, .999));
  float l = dot(col, vec3(.299, .587, .114));
  // trame : points tournés de 15 degrés, rayon selon la lumière
  vec2 px = v * res; float c = .966, s = .259; vec2 r = mat2(c, -s, s, c) * px;
  float size = 7.;
  vec2 g = fract(r / size) - .5;
  float dot_ = smoothstep(.0, .08, sqrt(l) * .62 - length(g));
  vec3 duo = mix(vec3(.015), tint, smoothstep(.05, .95, l));
  vec3 ht = mix(vec3(.01), tint * 1.15 + .05, dot_);
  col = mix(col, mix(duo, ht, .7), halftone);
  // anneaux du territoire autour du personnage
  float d = length((v - vec2(.5, .45)) * vec2(res.x/res.y, 1.));
  float ring = smoothstep(.45, .5, fract(d * 9. - time * .35)) * smoothstep(.55, .45, fract(d * 9. - time * .35));
  float reach = smoothstep(rings * 1.6, rings * 1.6 - .25, d);
  col = mix(col, col * .35, rings * (1. - reach) * .8);
  col += tint * ring * reach * rings * .55;
  // lumière qui suit le pointeur, vignette, grain
  float ml = 1. - smoothstep(0., .55, length((v - mouse) * vec2(res.x/res.y, 1.)));
  col *= .78 + .35 * ml * light;
  col *= 1. - .55 * smoothstep(.45, 1.05, length((v - .5) * vec2(1.25, 1.)));
  col += (h(v * res + time) - .5) * .06;
  gl_FragColor = vec4(col, 1.);
}`;

function load(gl: WebGLRenderingContext, src: string): Promise<{ tex: WebGLTexture; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.crossOrigin = "anonymous"; img.decoding = "async";
    img.onload = () => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      resolve({ tex, w: img.naturalWidth, h: img.naturalHeight });
    };
    img.onerror = reject; img.src = src;
  });
}

/** Image affichée dans le canevas : `images[from]` vers `images[to]` selon u.mix. */
export default function InkStage({ images, from, to, u, className }: { images: string[]; from: number; to: number; u: React.RefObject<InkUniforms>; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const state = useRef({ from, to });
  useEffect(() => { state.current = { from, to }; }, [from, to]);

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const gl = cv.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) { cv.dataset.fallback = "1"; return; }
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.dataset.fallback = "1"; return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const uni = { tA: U("tA"), tB: U("tB"), res: U("res"), sA: U("sA"), sB: U("sB"), mouse: U("mouse"), mixv: U("mixv"), halftone: U("halftone"), shatter: U("shatter"), rings: U("rings"), time: U("time"), focusY: U("focusY"), light: U("light"), tint: U("tint") };
    const tex: ({ tex: WebGLTexture; w: number; h: number } | null)[] = images.map(() => null);
    let alive = true;
    images.forEach((src, i) => load(gl, src).then((t) => { if (alive) { tex[i] = t; draw(performance.now()); } }).catch(() => {}));

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: .5, y: .4, tx: .5, ty: .4 };
    const onMove = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); mouse.tx = (e.clientX - r.left) / r.width; mouse.ty = (e.clientY - r.top) / r.height; };
    window.addEventListener("pointermove", onMove, { passive: true });
    // Résolution adaptative : si une image dépasse le budget (~22 ms), le canevas baisse sa
    // définition (jusqu'à 45 %) ; il la remonte quand l'appareil suit.
    let scale = 1, slow = 0, fast = 0, prev = 0;
    const size = () => { const dpr = Math.min(1.5, devicePixelRatio || 1) * scale; const w = Math.round(cv.clientWidth * dpr), h = Math.round(cv.clientHeight * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; gl.viewport(0, 0, w, h); } };
    const adapt = (now: number) => {
      if (prev) { const dt = now - prev; if (dt > 22) { slow++; fast = 0; } else if (dt < 14) { fast++; slow = 0; } }
      prev = now;
      if (slow > 8 && scale > .45) { scale = Math.max(.45, scale * .8); slow = 0; }
      if (fast > 120 && scale < 1) { scale = Math.min(1, scale * 1.15); fast = 0; }
    };
    const draw = (now: number) => {
      size();
      const a = tex[state.current.from] ?? tex.find(Boolean), b = tex[state.current.to] ?? a;
      if (!a || !b) return;
      mouse.x += (mouse.tx - mouse.x) * .08; mouse.y += (mouse.ty - mouse.y) * .08;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, a.tex); gl.uniform1i(uni.tA, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, b.tex); gl.uniform1i(uni.tB, 1);
      const p = u.current!;
      gl.uniform2f(uni.res, cv.width, cv.height); gl.uniform2f(uni.sA, a.w, a.h); gl.uniform2f(uni.sB, b.w, b.h);
      gl.uniform2f(uni.mouse, mouse.x, mouse.y); gl.uniform1f(uni.mixv, p.mix); gl.uniform1f(uni.halftone, p.halftone);
      gl.uniform1f(uni.shatter, p.shatter); gl.uniform1f(uni.rings, p.rings); gl.uniform1f(uni.time, reduce ? 0 : now / 1000);
      gl.uniform1f(uni.focusY, p.focusY); gl.uniform1f(uni.light, p.light); gl.uniform3f(uni.tint, ...p.tint);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      cv.dataset.ready = "1";
    };
    let raf = 0, visible = true;
    const loop = (now: number) => { adapt(now); draw(now); raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
    const sync = () => { cancelAnimationFrame(raf); prev = 0; if (visible && !document.hidden) { if (reduce) draw(performance.now()); else raf = requestAnimationFrame(loop); } };
    io.observe(cv); document.addEventListener("visibilitychange", sync);
    // Mouvement réduit : on redessine seulement quand l'état change (défilement).
    const onScroll = () => { if (reduce && visible) draw(performance.now()); };
    window.addEventListener("scroll", onScroll, { passive: true });
    sync();
    return () => { alive = false; cancelAnimationFrame(raf); io.disconnect(); document.removeEventListener("visibilitychange", sync); window.removeEventListener("pointermove", onMove); window.removeEventListener("scroll", onScroll); };
  }, [images, u]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
