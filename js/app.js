// app.js — shared bootstrapping and small UI helpers used across pages.

export function qs(name) {
  return new URLSearchParams(location.search).get(name);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function showError(container, message) {
  container.innerHTML = "";
  // Render as text, never HTML: `message` interpolates untrusted values such as
  // the ?id= URL param (via error messages), so innerHTML here would be a
  // reflected-XSS sink. No caller passes intentional markup.
  container.appendChild(el("div", { class: "error-box" }, String(message)));
}

// Motion preference toggle, persisted, applied via animations.setMotionEnabled.
import { setMotionEnabled } from "./animations.js";
const MOTION_KEY = "mathgym.motion";
export function initMotionToggle() {
  const stored = localStorage.getItem(MOTION_KEY);
  const on = stored === null ? true : stored === "1";
  setMotionEnabled(on);
  return on;
}
export function setMotionPref(on) {
  localStorage.setItem(MOTION_KEY, on ? "1" : "0");
  setMotionEnabled(on);
}
