// Generate sitemap.xml from the content manifest. Usage: node gen-sitemap.mjs
// Emits <repo>/sitemap.xml with the homepage plus every subject and topic page,
// absolute under the site's canonical origin.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Repo root = parent of this tools/ directory, so it works wherever the repo lives.
const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ORIGIN = "https://mathgym.io";

const manifest = JSON.parse(readFileSync(path.join(REPO, "content/manifest.json"), "utf8"));

// XML-escape for text inside <loc>. The only reserved character that appears in
// our URLs is '&' (from the query separator), but escape the full set to be safe.
const xmlEscape = (s) =>
  s.replace(/&/g, "&amp;")
   .replace(/</g, "&lt;")
   .replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;")
   .replace(/'/g, "&apos;");

// Build a query-page URL: base?id=<encoded>, then XML-escaped for the document.
const pageUrl = (base, id) => xmlEscape(`${ORIGIN}/${base}?id=${encodeURIComponent(id)}`);

const urls = [`${ORIGIN}/`];
for (const subject of manifest.subjects) {
  urls.push(pageUrl("subject.html", subject.id));
  for (const t of subject.topics) {
    urls.push(pageUrl("topic.html", t.id));
  }
}

const body = urls.map((u) => `  <url>\n    <loc>${u}</loc>\n  </url>`).join("\n");
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${body}\n` +
  `</urlset>\n`;

const out = path.join(REPO, "sitemap.xml");
writeFileSync(out, xml, "utf8");
console.log(`Wrote ${out} — ${urls.length} URLs (1 home + ${manifest.subjects.length} subjects + ${urls.length - 1 - manifest.subjects.length} topics).`);
