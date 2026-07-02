// renderer.js
// Renders our "markdown+latex" content into safe HTML. We support a small,
// predictable markdown subset and delegate all math (delimited by $...$ and
// $$...$$) to KaTeX. Text is HTML-escaped before formatting, so content files
// can't inject markup — only the formatting we explicitly allow.
//
// Depends on global `katex` (loaded from vendor/ in the page).

import { plotFenceToSvg } from "./plot.js";

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMath(tex, displayMode) {
  try {
    return katex.renderToString(tex, { displayMode, throwOnError: false });
  } catch {
    return `<code>${escapeHtml(tex)}</code>`;
  }
}

// Split text on math delimiters, returning segments tagged as text or math.
// Handles $$...$$ (display) and $...$ (inline). Escaped \$ is treated literally.
function tokenizeMath(text) {
  const tokens = [];
  let i = 0, buf = "";
  const flush = () => { if (buf) { tokens.push({ type: "text", value: buf }); buf = ""; } };
  while (i < text.length) {
    const ch = text[i];
    if (ch === "\\" && text[i + 1] === "$") { buf += "$"; i += 2; continue; }
    if (ch === "$" && text[i + 1] === "$") {
      const end = text.indexOf("$$", i + 2);
      if (end !== -1) { flush(); tokens.push({ type: "display", value: text.slice(i + 2, end) }); i = end + 2; continue; }
    }
    if (ch === "$") {
      const end = text.indexOf("$", i + 1);
      if (end !== -1) { flush(); tokens.push({ type: "inline", value: text.slice(i + 1, end) }); i = end + 1; continue; }
    }
    buf += ch; i++;
  }
  flush();
  return tokens;
}

// Inline formatting on already-escaped, math-free text: **bold**, *italic*, `code`.
function inlineFormat(escaped) {
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

// Render one line/segment of prose: escape, apply inline md, splice math back in.
function renderInline(text) {
  return tokenizeMath(text)
    .map((t) => {
      if (t.type === "text") return inlineFormat(escapeHtml(t.value));
      return renderMath(t.value, t.type === "display");
    })
    .join("");
}

// Block-level markdown: headings, unordered lists, ordered lists, paragraphs,
// and $$ display math on its own line.
export function renderMarkdown(src) {
  const lines = src.split("\n");
  const out = [];
  let i = 0;

  const isBlank = (l) => l.trim() === "";

  while (i < lines.length) {
    let line = lines[i];

    if (isBlank(line)) { i++; continue; }

    // Standalone display math block: $$ ... $$ (possibly multi-line).
    if (line.trim().startsWith("$$")) {
      const trimmed = line.trim();
      if (trimmed.length > 2 && trimmed.endsWith("$$") && trimmed.length > 4) {
        out.push(renderMath(trimmed.slice(2, -2), true));
        i++; continue;
      }
      // multi-line block
      let tex = trimmed.slice(2);
      i++;
      while (i < lines.length && !lines[i].includes("$$")) { tex += "\n" + lines[i]; i++; }
      if (i < lines.length) { tex += "\n" + lines[i].replace("$$", ""); i++; }
      out.push(renderMath(tex, true));
      continue;
    }

    // Fenced ```plot block: gather lines until the closing fence, parse the
    // JSON body, and render an SVG figure. Unknown fence languages are skipped
    // to their closing fence (kept out of prose) rather than dumped as text.
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1];
      i++;
      const bodyLines = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { bodyLines.push(lines[i]); i++; }
      if (i < lines.length) i++; // consume closing fence
      if (lang === "plot") out.push(plotFenceToSvg(bodyLines.join("\n")));
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      out.push(`<h${level}>${renderInline(h[2])}</h${level}>`);
      i++; continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${renderInline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // Paragraph: gather consecutive non-blank, non-block lines.
    const para = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !/^(#{1,4})\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("$$") &&
      !/^```/.test(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(`<p>${renderInline(para.join(" "))}</p>`);
  }

  return out.join("\n");
}

// Convenience: render into a DOM element.
export function renderInto(el, src) {
  el.innerHTML = renderMarkdown(src);
}

// Render inline prose (single line, may contain math) into an element.
export function renderInlineInto(el, src) {
  el.innerHTML = renderInline(src);
}
