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
  const main = el("main", { class: "main" });
  document.body.appendChild(el("div", { class: "app" }, [sidebar, main]));

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
      if (!topics.length) list.appendChild(el("li", { class: "empty" }, "Coming soon"));
      else {
        // Cross-topic intelligence entry: a learning map / diagnostic for the subject.
        list.appendChild(el("li", { class: "nav-map" }, el("a", {
          href: `subject.html?id=${encodeURIComponent(subject.id)}`,
        }, [el("span", { class: "map-icon", html: "&#9635;" }), el("span", {}, "Learning map")])));
        for (const t of topics) {
        const link = el("a", {
          href: `topic.html?id=${encodeURIComponent(t.id)}`,
          class: t.id === activeTopicId ? "active" : "",
        }, [
          el("span", {}, t.title),
          isTopicMastered(t.id) ? el("span", { class: "nav-dot", title: "Mastered" }) : null,
        ]);
        list.appendChild(el("li", {}, link));
        }
      }
      head.addEventListener("click", () => sub.classList.toggle("open"));
      sub.append(head, list);
      sidebar.appendChild(sub);
    }
  } catch (e) {
    sidebar.appendChild(el("div", { class: "error-box" }, `Could not load nav: ${e.message}`));
  }
  return { main, sidebar };
}
