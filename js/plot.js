// plot.js
// Tiny dependency-free SVG plotting for MathGym lectures and problems. Produces
// a self-contained <svg> string from a JSON "plot spec" so content files can
// embed graphs with no runtime beyond this module. All colors come from the
// active theme's CSS custom properties (var(--accent) etc.), so plots restyle
// automatically with the theme.
//
// Supported spec.type:
//   "cartesian"    — axes/grid + function curves, points, segments (the default)
//   "elliptic"     — the real elliptic curve y^2 = x^3 + a x + b (two branches),
//                    with optional chord/tangent construction for point addition
//   "modLattice"   — integer points of an elliptic curve over Z_p as a dot grid
//   "graph"        — a node/edge diagram (discrete-math graphs, trees, digraphs)
//
// Cartesian extras: a curve may carry "fillRange": [a, b] (or "fill": true for
// the whole x-range) to shade the region between the curve and y = 0 — used for
// definite-integral area pictures. A segment may carry "arrow": true to draw an
// arrowhead at its `to` end — used for vectors.
//
// A spec is authored as a JSON object, either as the value of a problem's
// `plot` field or inside a ```plot fenced code block in markdown.

// --- A small, safe expression evaluator (functions of x) --------------------
// Supports + - * / ^, unary minus, parentheses, the variable x, the constants
// pi and e, and the functions sin cos tan exp ln log sqrt abs. No access to any
// globals — it only ever sees the token stream we tokenize here.
const FUNCS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  exp: Math.exp, ln: Math.log, log: Math.log,
  sqrt: Math.sqrt, abs: Math.abs,
};
const CONSTS = { pi: Math.PI, e: Math.E };

function compileFn(src) {
  const toks = String(src).match(/\d+\.?\d*|[a-z]+|[+\-*/^()]/gi) || [];
  let pos = 0;
  const peek = () => toks[pos];
  const eat = () => toks[pos++];

  // expr := term (('+'|'-') term)*
  function expr() {
    let v = term();
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const r = term();
      v = op === "+" ? (x) => v(x) + r(x) : (x) => v(x) - r(x);
    }
    return v;
  }
  // term := power (('*'|'/') power)*
  function term() {
    let v = power();
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const r = power();
      v = op === "*" ? (x) => v(x) * r(x) : (x) => v(x) / r(x);
    }
    return v;
  }
  // power := unary ('^' power)?   (right-associative)
  function power() {
    const b = unary();
    if (peek() === "^") { eat(); const e = power(); return (x) => Math.pow(b(x), e(x)); }
    return b;
  }
  // unary := '-' unary | atom
  function unary() {
    if (peek() === "-") { eat(); const u = unary(); return (x) => -u(x); }
    return atom();
  }
  // atom := number | const | var | func '(' expr ')' | '(' expr ')' | implicit-mul
  function atom() {
    const t = peek();
    if (t === "(") { eat(); const v = expr(); if (peek() === ")") eat(); return maybeImplicitMul(v); }
    if (/^\d/.test(t)) { eat(); const n = parseFloat(t); return maybeImplicitMul(() => n); }
    if (/^[a-z]+$/i.test(t)) {
      eat();
      if (t === "x") return maybeImplicitMul((x) => x);
      if (t in CONSTS) { const c = CONSTS[t]; return maybeImplicitMul(() => c); }
      if (t in FUNCS) {
        const fn = FUNCS[t];
        if (peek() === "(") { eat(); const arg = expr(); if (peek() === ")") eat(); return maybeImplicitMul((x) => fn(arg(x))); }
        return () => NaN;
      }
    }
    eat();
    return () => NaN;
  }
  // Handle juxtaposition like 2x, 3(x+1), 2sin(x): a factor immediately followed
  // by a variable/const/function/paren means multiply.
  function maybeImplicitMul(v) {
    const t = peek();
    if (t === "x" || t === "(" || (t && /^[a-z]+$/i.test(t) && (t in CONSTS || t in FUNCS))) {
      const r = atom();
      return (x) => v(x) * r(x);
    }
    return v;
  }

  const fn = expr();
  return (x) => { try { return fn(x); } catch { return NaN; } };
}

// --- SVG helpers ------------------------------------------------------------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const num = (n) => (Math.round(n * 100) / 100);

function colorVar(name) {
  const map = { accent: "--accent", success: "--success", error: "--error", warn: "--warn", text: "--text", dim: "--text-dim", faint: "--text-faint" };
  return `var(${map[name] || "--accent"})`;
}

// --- Cartesian plot ---------------------------------------------------------
function cartesian(spec) {
  const W = spec.width || 440, H = spec.height || 320;
  const pad = 6;
  const [x0, x1] = spec.xRange || [-6, 6];
  const [y0, y1] = spec.yRange || [-6, 6];
  const sx = (W - 2 * pad) / (x1 - x0);
  const sy = (H - 2 * pad) / (y1 - y0);
  const px = (x) => pad + (x - x0) * sx;
  const py = (y) => H - pad - (y - y0) * sy;
  const parts = [];

  // Grid
  if (spec.grid !== false) {
    const gx = niceStep(x1 - x0), gy = niceStep(y1 - y0);
    for (let x = Math.ceil(x0 / gx) * gx; x <= x1 + 1e-9; x += gx) {
      parts.push(`<line x1="${num(px(x))}" y1="${pad}" x2="${num(px(x))}" y2="${H - pad}" stroke="var(--border)" stroke-width="1"/>`);
    }
    for (let y = Math.ceil(y0 / gy) * gy; y <= y1 + 1e-9; y += gy) {
      parts.push(`<line x1="${pad}" y1="${num(py(y))}" x2="${W - pad}" y2="${num(py(y))}" stroke="var(--border)" stroke-width="1"/>`);
    }
  }
  // Axes
  if (y0 <= 0 && y1 >= 0) parts.push(`<line x1="${pad}" y1="${num(py(0))}" x2="${W - pad}" y2="${num(py(0))}" stroke="var(--text-faint)" stroke-width="1.5"/>`);
  if (x0 <= 0 && x1 >= 0) parts.push(`<line x1="${num(px(0))}" y1="${pad}" x2="${num(px(0))}" y2="${H - pad}" stroke="var(--text-faint)" stroke-width="1.5"/>`);

  // Curves
  for (const c of spec.curves || []) {
    const f = compileFn(c.fn);
    const stroke = colorVar(c.color || "accent");
    const N = 240;
    // Optional area shading between the curve and y = 0 over [a, b].
    if (c.fillRange || c.fill) {
      const a = Math.max(x0, (c.fillRange || [x0, x1])[0]);
      const b = Math.min(x1, (c.fillRange || [x0, x1])[1]);
      const yBase = Math.max(y0, Math.min(y1, 0));
      const clamp = (y) => Math.max(y0, Math.min(y1, y));
      let fd = `M${num(px(a))} ${num(py(yBase))} `;
      for (let i = 0; i <= N; i++) {
        const x = a + (i / N) * (b - a);
        const y = f(x);
        fd += `L${num(px(x))} ${num(py(clamp(isFinite(y) ? y : yBase)))} `;
      }
      fd += `L${num(px(b))} ${num(py(yBase))} Z`;
      parts.push(`<path d="${fd}" fill="${stroke}" opacity="0.16" stroke="none"/>`);
    }
    let d = "", pen = false;
    for (let i = 0; i <= N; i++) {
      const x = x0 + (i / N) * (x1 - x0);
      const y = f(x);
      if (!isFinite(y) || y < y0 - (y1 - y0) || y > y1 + (y1 - y0)) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${num(px(x))} ${num(py(y))} `;
      pen = true;
    }
    parts.push(`<path d="${d.trim()}" fill="none" stroke="${stroke}" stroke-width="2"/>`);
    if (c.label) {
      const lx = c.labelAt != null ? c.labelAt : x0 + 0.72 * (x1 - x0);
      const ly = f(lx);
      if (isFinite(ly) && ly >= y0 && ly <= y1) parts.push(text(px(lx) + 4, py(ly) - 4, c.label, stroke));
    }
  }
  // Segments (e.g. chord/tangent, rise/run, vectors)
  for (const s of spec.segments || []) {
    const dash = s.dashed ? ` stroke-dasharray="5 4"` : "";
    const x1 = px(s.from[0]), y1 = py(s.from[1]), x2 = px(s.to[0]), y2 = py(s.to[1]);
    parts.push(`<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${colorVar(s.color || "dim")}" stroke-width="1.5"${dash}/>`);
    if (s.arrow) parts.push(arrowHead(x1, y1, x2, y2, colorVar(s.color || "dim")));
    if (s.label) parts.push(text((x1 + x2) / 2 + 3, (y1 + y2) / 2 - 3, s.label, colorVar(s.color || "dim")));
  }
  // Points
  for (const p of spec.points || []) {
    parts.push(`<circle cx="${num(px(p.x))}" cy="${num(py(p.y))}" r="${p.r || 4}" fill="${colorVar(p.color || "accent")}"/>`);
    if (p.label) parts.push(text(px(p.x) + 7, py(p.y) - 6, p.label, colorVar(p.color || "text")));
  }
  return svgWrap(W, H, parts.join(""), spec.caption);
}

// --- Real elliptic curve y^2 = x^3 + a x + b --------------------------------
function elliptic(spec) {
  const W = spec.width || 440, H = spec.height || 320;
  const a = spec.a ?? -1, b = spec.b ?? 1;
  const [x0, x1] = spec.xRange || [-3, 4];
  const [y0, y1] = spec.yRange || [-6, 6];
  const rhs = (x) => x * x * x + a * x + b;
  // Upper branch sqrt(rhs) then mirror for the lower branch.
  const upper = { fn: `sqrt(x^3 ${a >= 0 ? "+" : "-"} ${Math.abs(a)}*x ${b >= 0 ? "+" : "-"} ${Math.abs(b)})`, color: spec.color || "accent" };
  const base = { ...spec, type: "cartesian", xRange: [x0, x1], yRange: [y0, y1], curves: [] };
  // Build both branches by sampling rhs directly (avoids evaluator edge cases).
  const parts = [];
  const pad = 6;
  const sx = (W - 2 * pad) / (x1 - x0), sy = (H - 2 * pad) / (y1 - y0);
  const px = (x) => pad + (x - x0) * sx, py = (y) => H - pad - (y - y0) * sy;
  // grid + axes via a minimal cartesian pass
  const gx = niceStep(x1 - x0), gy = niceStep(y1 - y0);
  for (let x = Math.ceil(x0 / gx) * gx; x <= x1 + 1e-9; x += gx) parts.push(`<line x1="${num(px(x))}" y1="${pad}" x2="${num(px(x))}" y2="${H - pad}" stroke="var(--border)" stroke-width="1"/>`);
  for (let y = Math.ceil(y0 / gy) * gy; y <= y1 + 1e-9; y += gy) parts.push(`<line x1="${pad}" y1="${num(py(y))}" x2="${W - pad}" y2="${num(py(y))}" stroke="var(--border)" stroke-width="1"/>`);
  parts.push(`<line x1="${pad}" y1="${num(py(0))}" x2="${W - pad}" y2="${num(py(0))}" stroke="var(--text-faint)" stroke-width="1.5"/>`);
  if (x0 <= 0 && x1 >= 0) parts.push(`<line x1="${num(px(0))}" y1="${pad}" x2="${num(px(0))}" y2="${H - pad}" stroke="var(--text-faint)" stroke-width="1.5"/>`);
  // curve
  const stroke = colorVar(spec.color || "accent");
  const N = 400;
  let dUp = "", dLo = "", penU = false, penL = false;
  for (let i = 0; i <= N; i++) {
    const x = x0 + (i / N) * (x1 - x0);
    const r = rhs(x);
    if (r < 0) { penU = penL = false; continue; }
    const y = Math.sqrt(r);
    if (y > y1 + 1) { penU = penL = false; continue; }
    dUp += `${penU ? "L" : "M"}${num(px(x))} ${num(py(y))} `; penU = true;
    dLo += `${penL ? "L" : "M"}${num(px(x))} ${num(py(-y))} `; penL = true;
  }
  parts.push(`<path d="${dUp.trim()}" fill="none" stroke="${stroke}" stroke-width="2"/>`);
  parts.push(`<path d="${dLo.trim()}" fill="none" stroke="${stroke}" stroke-width="2"/>`);
  // chord/tangent construction + points reuse cartesian primitives
  for (const s of spec.segments || []) {
    const dash = s.dashed ? ` stroke-dasharray="5 4"` : "";
    parts.push(`<line x1="${num(px(s.from[0]))}" y1="${num(py(s.from[1]))}" x2="${num(px(s.to[0]))}" y2="${num(py(s.to[1]))}" stroke="${colorVar(s.color || "warn")}" stroke-width="1.5"${dash}/>`);
  }
  for (const p of spec.points || []) {
    parts.push(`<circle cx="${num(px(p.x))}" cy="${num(py(p.y))}" r="${p.r || 4.5}" fill="${colorVar(p.color || "accent")}"/>`);
    if (p.label) parts.push(text(px(p.x) + 7, py(p.y) - 6, p.label, colorVar(p.color || "text")));
  }
  return svgWrap(W, H, parts.join(""), spec.caption || ecCaption(a, b));
}

// Format "y² = x³ + a x + b", dropping unit coefficients and zero terms.
function ecCaption(a, b, mod) {
  const ax = a === 0 ? "" : a > 0 ? ` + ${a === 1 ? "" : a}x` : ` − ${a === -1 ? "" : Math.abs(a)}x`;
  const bt = b === 0 ? "" : b > 0 ? ` + ${b}` : ` − ${Math.abs(b)}`;
  const rel = mod != null ? "≡" : "=";
  const tail = mod != null ? ` (mod ${mod})` : "";
  return `y² ${rel} x³${ax}${bt}${tail}`;
}

// --- Elliptic curve over Z_p (dot lattice) ----------------------------------
function modLattice(spec) {
  const p = spec.p || 11, a = spec.a ?? 1, b = spec.b ?? 6;
  const W = spec.width || 320, H = spec.height || 320, pad = 22;
  const cell = (Math.min(W, H) - 2 * pad) / p;
  const px = (x) => pad + x * cell, py = (y) => H - pad - y * cell;
  const parts = [];
  // faint grid
  for (let i = 0; i <= p; i++) {
    parts.push(`<line x1="${num(px(i))}" y1="${num(py(0))}" x2="${num(px(i))}" y2="${num(py(p - 1))}" stroke="var(--border)" stroke-width="0.5"/>`);
    parts.push(`<line x1="${num(px(0))}" y1="${num(py(i))}" x2="${num(px(p - 1))}" y2="${num(py(i))}" stroke="var(--border)" stroke-width="0.5"/>`);
  }
  const mod = (n) => ((n % p) + p) % p;
  const highlight = new Set((spec.points || []).map((q) => `${q.x},${q.y}`));
  for (let x = 0; x < p; x++) {
    const r = mod(x * x * x + a * x + b);
    for (let y = 0; y < p; y++) {
      if (mod(y * y) === r) {
        const on = highlight.has(`${x},${y}`);
        parts.push(`<circle cx="${num(px(x))}" cy="${num(py(y))}" r="${on ? 6 : 4}" fill="${on ? colorVar("warn") : colorVar("accent")}"/>`);
      }
    }
  }
  for (const q of spec.points || []) {
    if (q.label) parts.push(text(px(q.x) + 8, py(q.y) - 6, q.label, colorVar("text")));
  }
  return svgWrap(W, H, parts.join(""), spec.caption || ecCaption(a, b, p));
}

// --- Node/edge graph diagram (discrete math) --------------------------------
// spec.nodes: [{ id, x, y, label?, color? }]  — x/y in any abstract coordinates;
//   the diagram is scaled to fit. label defaults to id.
// spec.edges: [["A","B"], ...] or [{ from, to, directed?, dashed?, label?, color? }]
function graphDiagram(spec) {
  const nodes = spec.nodes || [];
  if (nodes.length === 0) throw new Error("graph needs nodes");
  const W = spec.width || 360, H = spec.height || 280, pad = 34;
  const xs = nodes.map((n) => n.x), ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const sx = (W - 2 * pad) / Math.max(maxX - minX, 1e-9);
  const sy = (H - 2 * pad) / Math.max(maxY - minY, 1e-9);
  const px = (x) => (maxX === minX ? W / 2 : pad + (x - minX) * sx);
  const py = (y) => (maxY === minY ? H / 2 : H - pad - (y - minY) * sy);
  const R = spec.nodeRadius || 14;
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  const parts = [];
  for (const e of spec.edges || []) {
    const eo = Array.isArray(e) ? { from: e[0], to: e[1] } : e;
    const a = byId.get(String(eo.from)), b = byId.get(String(eo.to));
    if (!a || !b) continue;
    const x1 = px(a.x), y1 = py(a.y), x2 = px(b.x), y2 = py(b.y);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    // Trim the line back to the node rims (leave room for an arrowhead).
    const ax1 = x1 + R * Math.cos(ang), ay1 = y1 + R * Math.sin(ang);
    const gap = eo.directed ? R + 8 : R;
    const ax2 = x2 - gap * Math.cos(ang), ay2 = y2 - gap * Math.sin(ang);
    const stroke = colorVar(eo.color || "dim");
    const dash = eo.dashed ? ` stroke-dasharray="5 4"` : "";
    parts.push(`<line x1="${num(ax1)}" y1="${num(ay1)}" x2="${num(ax2)}" y2="${num(ay2)}" stroke="${stroke}" stroke-width="1.5"${dash}/>`);
    if (eo.directed) parts.push(arrowHead(ax1, ay1, x2 - R * Math.cos(ang), y2 - R * Math.sin(ang), stroke));
    if (eo.label) parts.push(text((ax1 + ax2) / 2 + 5, (ay1 + ay2) / 2 - 5, eo.label, stroke));
  }
  for (const n of nodes) {
    const cx = px(n.x), cy = py(n.y);
    parts.push(`<circle cx="${num(cx)}" cy="${num(cy)}" r="${R}" fill="var(--surface)" stroke="${colorVar(n.color || "accent")}" stroke-width="2"/>`);
    const lab = n.label != null ? n.label : n.id;
    parts.push(`<text x="${num(cx)}" y="${num(cy)}" text-anchor="middle" dominant-baseline="central" font-family="var(--font-mono, monospace)" font-size="12" fill="var(--text)">${esc(lab)}</text>`);
  }
  return svgWrap(W, H, parts.join(""), spec.caption);
}

// --- shared bits ------------------------------------------------------------
// A small filled arrowhead pointing along (x1,y1) -> (x2,y2), tip at (x2,y2).
function arrowHead(x1, y1, x2, y2, fill) {
  const ang = Math.atan2(y2 - y1, x2 - x1), L = 9, spread = Math.PI / 7;
  const p1 = `${num(x2 - L * Math.cos(ang - spread))},${num(y2 - L * Math.sin(ang - spread))}`;
  const p2 = `${num(x2 - L * Math.cos(ang + spread))},${num(y2 - L * Math.sin(ang + spread))}`;
  return `<polygon points="${num(x2)},${num(y2)} ${p1} ${p2}" fill="${fill}"/>`;
}
function text(x, y, s, fill) {
  return `<text x="${num(x)}" y="${num(y)}" font-family="var(--font-mono, monospace)" font-size="12" fill="${fill}">${esc(s)}</text>`;
}
function niceStep(range) {
  const raw = range / 10;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
function svgWrap(W, H, inner, caption) {
  const capEl = caption ? `<figcaption class="plot-caption">${esc(caption)}</figcaption>` : "";
  return `<figure class="plot-figure"><svg viewBox="0 0 ${W} ${H}" class="plot-svg" role="img" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">${inner}</svg>${capEl}</figure>`;
}

// Public: render a plot spec (object) to an <svg> figure string.
export function plotToSvg(spec) {
  try {
    if (!spec || typeof spec !== "object") return "";
    if (spec.type === "elliptic") return elliptic(spec);
    if (spec.type === "modLattice") return modLattice(spec);
    if (spec.type === "graph") return graphDiagram(spec);
    return cartesian(spec);
  } catch (e) {
    return `<figure class="plot-figure"><figcaption class="plot-caption">[plot error: ${esc(e.message)}]</figcaption></figure>`;
  }
}

// Public: parse a ```plot fenced block body (JSON) and render it. Returns "" on
// bad JSON so a typo can't break the whole lecture.
export function plotFenceToSvg(jsonBody) {
  let spec;
  try { spec = JSON.parse(jsonBody); }
  catch { return `<figure class="plot-figure"><figcaption class="plot-caption">[plot: invalid JSON]</figcaption></figure>`; }
  return plotToSvg(spec);
}
