// shell.js — shared app chrome: a header (brand + theme picker) and an optional
// collapsible sidebar nav built from the content manifest. Used by index/topic.

import { loadManifest } from "./content-loader.js";
import { isTopicMastered } from "./progress-store.js";
import { themePicker, logoMarkup } from "./theme.js";
import { el } from "./app.js";

// Build just the sticky header (brand + optional crumbs + theme picker).
export function buildHeader({ crumbs = "" } = {}) {
  const header = el("header", { class: "site-header" }, [
    el("div", { class: "brand", html: `<a href="index.html">${logoMarkup()}<span>Math<span class="dot">Gym</span></span></a>` }),
    el("div", { class: "header-right" }, [
      crumbs ? el("nav", { class: "crumbs", html: crumbs }) : null,
      themePicker(),
    ]),
  ]);
  document.body.appendChild(header);
  return header;
}

// Build header + sidebar + main. Returns { main } for the page to fill.
export async function buildShell({ activeTopicId = null, crumbs = "" } = {}) {
  buildHeader({ crumbs });
  const sidebar = el("aside", { class: "sidebar" });
  sidebar.appendChild(el("div", { class: "sidebar-title" }, "Subjects"));
  const search = el("input", {
    class: "sidebar-search", type: "search", placeholder: "Filter topics…",
    "aria-label": "Filter topics",
  });
  sidebar.appendChild(search);
  const main = el("main", { class: "main" });
  document.body.appendChild(el("div", { class: "app" }, [sidebar, main]));

  // Collected for the live filter: each subject block + its topic rows.
  const entries = [];

  try {
    const manifest = await loadManifest();
    for (const subject of manifest.subjects) {
      const topics = subject.topics || [];
      const activeHere = topics.some((t) => t.id === activeTopicId);
      const sub = el("div", { class: "nav-subject" + (activeHere ? " open" : "") });
      const head = el("button", { class: "nav-head", type: "button" }, [
        el("span", { class: "chev", html: "&#9656;" }),
        el("span", { class: "nav-label" }, subject.title),
        el("span", { class: "nav-count" }, topics.length ? String(topics.length) : "—"),
      ]);
      const list = el("ul", { class: "nav-topics" });
      const rows = [];
      if (!topics.length) list.appendChild(el("li", { class: "empty" }, "Coming soon"));
      else {
        // Cross-topic intelligence entry: a learning map / diagnostic for the subject.
        const mapLi = el("li", { class: "nav-map" }, el("a", {
          href: `subject.html?id=${encodeURIComponent(subject.id)}`,
        }, [el("span", { class: "map-icon", html: "&#9635;" }), el("span", {}, "Learning map")]));
        list.appendChild(mapLi);
        for (const t of topics) {
          const link = el("a", {
            href: `topic.html?id=${encodeURIComponent(t.id)}`,
            class: t.id === activeTopicId ? "active" : "",
          }, [
            el("span", {}, t.title),
            isTopicMastered(t.id) ? el("span", { class: "nav-dot", title: "Mastered" }) : null,
          ]);
          const li = el("li", {}, link);
          list.appendChild(li);
          rows.push({ li, text: t.title.toLowerCase() });
        }
        entries.push({ sub, wasOpen: activeHere, mapLi, rows, subjectText: subject.title.toLowerCase() });
      }
      head.addEventListener("click", () => sub.classList.toggle("open"));
      sub.append(head, list);
      sidebar.appendChild(sub);
    }
  } catch (e) {
    sidebar.appendChild(el("div", { class: "error-box" }, `Could not load nav: ${e.message}`));
  }

  // Live filter: match on topic title (or a whole subject by its name). While a
  // query is active, matching subjects auto-expand and the learning-map row is
  // hidden; clearing the box restores each subject's original open/closed state.
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    for (const en of entries) {
      const subjectHit = q && en.subjectText.includes(q);
      let visibleRows = 0;
      for (const r of en.rows) {
        const show = !q || subjectHit || r.text.includes(q);
        r.li.style.display = show ? "" : "none";
        if (show) visibleRows++;
      }
      if (en.mapLi) en.mapLi.style.display = q ? "none" : "";
      if (!q) {
        en.sub.classList.toggle("open", en.wasOpen);
        en.sub.style.display = "";
      } else {
        const anyHit = visibleRows > 0;
        en.sub.style.display = anyHit ? "" : "none";
        en.sub.classList.toggle("open", anyHit);
      }
    }
  });

  return { main, sidebar };
}
