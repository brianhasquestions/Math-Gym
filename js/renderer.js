// renderer.js
// Renders our "markdown+latex" content into safe HTML. We support a small,
// predictable markdown subset and delegate all math (delimited by $...$ and
// $$...$$) to KaTeX. Text is HTML-escaped before formatting, so content files
// can't inject markup: only the formatting we explicitly allow.
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

// Index of the next UNESCAPED occurrence of `delim` at or after `from`. Inside
// a math span "\$" is KaTeX's literal dollar sign (e.g. "$9 \div 12 = \$0.75$"),
// so it must not close the span; "\\$" (row break, then close) still does.
function findClose(text, delim, from) {
  let j = text.indexOf(delim, from);
  while (j !== -1) {
    let bs = 0;
    for (let k = j - 1; k >= 0 && text[k] === "\\"; k--) bs++;
    if (bs % 2 === 0) return j;
    j = text.indexOf(delim, j + 1);
  }
  return -1;
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
      const end = findClose(text, "$$", i + 2);
      if (end !== -1) { flush(); tokens.push({ type: "display", value: text.slice(i + 2, end) }); i = end + 2; continue; }
    }
    if (ch === "$") {
      const end = findClose(text, "$", i + 1);
      if (end !== -1) { flush(); tokens.push({ type: "inline", value: text.slice(i + 1, end) }); i = end + 1; continue; }
    }
    buf += ch; i++;
  }
  flush();
  return tokens;
}

// Inline formatting on already-escaped, math-free text: **bold**, *italic*, `code`,
// and [text](https://url) links. Only http(s) URLs without quotes or angle
// brackets become links, so content still cannot inject attributes or schemes.
function inlineFormat(escaped) {
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]\n]+)\]\((https?:\/\/[^\s()"'<>]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
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
  // A line opens a standalone display block only if it starts with $$ and its
  // first closing $$ is either the line's end or absent (block continues on
  // later lines). "$$…$$ (note …)" or "$$a$$ and $$b$$" are prose with inline
  // display math: treating them as one block fed "a$$ (note…" to KaTeX.
  const isDisplayBlock = (l) => {
    const t = l.trim();
    if (!t.startsWith("$$")) return false;
    const close = t.indexOf("$$", 2);
    return close === -1 || close === t.length - 2;
  };

  while (i < lines.length) {
    let line = lines[i];

    if (isBlank(line)) { i++; continue; }

    // Standalone display math block: $$ ... $$ (possibly multi-line).
    if (isDisplayBlock(line)) {
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

    // Table: a header row of pipe-delimited cells, a separator row of dashes,
    // then zero or more data rows. Cells carry inline formatting and math.
    // The separator row is optional: two or more consecutive |…| rows are a
    // table with the first row as header (several payoff matrices were authored
    // without it and used to collapse into one paragraph of pipes).
    const isSep = (l) => /^[\s|:-]+$/.test(l) && l.includes("-") && l.includes("|");
    const isPipeRow = (l) => /^\s*\|.*\|\s*$/.test(l) && (l.match(/\|/g) || []).length >= 3 && !isSep(l);
    if (
      line.trim().startsWith("|") &&
      i + 1 < lines.length &&
      (isSep(lines[i + 1]) || (isPipeRow(line) && isPipeRow(lines[i + 1])))
    ) {
      const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const header = cells(line);
      i += isSep(lines[i + 1]) ? 2 : 1; // consume header (+ separator when present)
      const body = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { body.push(cells(lines[i])); i++; }
      const thead = `<thead><tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${body
        .map((r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<div class="md-table-wrap"><table class="md-table">${thead}${tbody}</table></div>`);
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
      !isDisplayBlock(lines[i]) &&
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

// Render prose that may carry a block structure (e.g. a payoff/data table) as
// well as inline formatting. When the source contains a markdown table we route
// through the full block renderer; otherwise we keep the lightweight inline path
// so all existing single-line prompts render exactly as before.
export function renderProseInto(el, src) {
  if (typeof src === "string" && /\n\s*\|.*\|/.test(src)) {
    el.innerHTML = renderMarkdown(src);
  } else {
    el.innerHTML = renderInline(src);
  }
}
