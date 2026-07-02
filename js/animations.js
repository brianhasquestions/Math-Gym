// animations.js
// Reward/feedback animations. Every effect here fires on GENUINE progress
// (a correct step, a concept mastered, a topic cleared) — never on streaks,
// clicks, or time spent (ROADMAP §8). All effects respect prefers-reduced-motion
// and a user toggle, degrading to instant state changes.

const reducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let motionEnabled = true;
export function setMotionEnabled(on) { motionEnabled = on; }
function motionOff() { return !motionEnabled || reducedMotion(); }

// Briefly flash an element with a success/error pulse.
export function pulse(el, kind = "success") {
  if (!el) return;
  if (motionOff()) return;
  const cls = kind === "success" ? "pulse-success" : "pulse-error";
  el.classList.remove(cls);
  void el.offsetWidth; // restart animation
  el.classList.add(cls);
  el.addEventListener("animationend", () => el.classList.remove(cls), { once: true });
}

// A checkmark "stamp" when a step is confirmed correct.
export function stampStep(el) {
  if (!el) return;
  el.classList.add("step-correct");
  if (motionOff()) return;
  el.classList.add("step-stamp");
  el.addEventListener("animationend", () => el.classList.remove("step-stamp"), { once: true });
}

// The earned "concept mastered" moment — a distinct, meaningful celebration.
export function celebrateConcept(label) {
  banner(`>> skill mastered: ${label} <<`, "concept");
  if (!motionOff()) burst(18);
}

// The larger "topic cleared" moment.
export function celebrateTopic(title) {
  banner(`>>> topic cleared: ${title} <<<`, "topic");
  if (!motionOff()) burst(40);
}

function banner(text, kind) {
  const b = document.createElement("div");
  b.className = `reward-banner reward-${kind}`;
  b.setAttribute("role", "status");
  b.setAttribute("aria-live", "polite");
  b.textContent = text;
  document.body.appendChild(b);
  // Force reflow then animate in.
  void b.offsetWidth;
  b.classList.add("show");
  const remove = () => b.remove();
  setTimeout(() => { b.classList.remove("show"); setTimeout(remove, 400); }, 2600);
}

// Lightweight particle burst (canvas-free, DOM-based) for celebration moments.
function burst(count) {
  const layer = document.createElement("div");
  layer.className = "burst-layer";
  document.body.appendChild(layer);
  const colors = ["var(--accent)", "var(--success)", "var(--accent-2)", "var(--warn)"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("span");
    p.className = "particle";
    const angle = (Math.PI * 2 * i) / count + (i % 3) * 0.2;
    const dist = 80 + (i % 5) * 26;
    p.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    p.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = `${(i % 6) * 18}ms`;
    layer.appendChild(p);
  }
  setTimeout(() => layer.remove(), 1300);
}

// Smoothly animate a meter fill to a 0..1 value (honest progress display).
export function setMeter(fillEl, value, labelEl) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  if (fillEl) fillEl.style.width = `${pct}%`;
  if (labelEl) labelEl.textContent = `${Math.round(pct)}%`;
}
