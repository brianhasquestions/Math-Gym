# MathGym

A web app that teaches and trains **applied mathematics** with adaptive, mastery-based practice — wrapped in a 90s-BBS terminal aesthetic.

Every topic leads with where the math actually shows up in the real world (TLS handshakes, bridge trusses, drug half-lives, build-system DAGs), then drills you with step-by-step problems until each underlying skill is genuinely solid.

**12 subjects · 84 topics · 1,300+ seed problems · hundreds of parametric generators**

Algebra · Algebra 2 · Geometry · Trigonometry · Calculus 1–3 · Differential Equations · Matrix Algebra · Linear Algebra · Discrete Math · Cryptography

## Quick start

No build step, no dependencies — it's vanilla HTML/CSS/JS with a vendored copy of KaTeX. Serve the repo root over HTTP (ES modules won't load from `file://`):

```sh
npm run serve        # python -m http.server 8000
# then open http://localhost:8000
```

## How it works

- **Browse** — pick a subject in the sidebar, choose a topic.
- **Learn** — each topic opens with key concepts (micro-lessons), an applied lecture with inline SVG plots, and a fully worked real-world example.
- **Train** — the adaptive engine ([js/mastery-model.js](js/mastery-model.js)) serves step-graded problems per skill, escalates difficulty as you prove mastery, and keeps drilling weak spots. Progress lives in `localStorage` (export/import from the home page).

Problems are served by [js/problem-engine.js](js/problem-engine.js): parametric **generators** ([js/generator.js](js/generator.js) + `gen-*-fill.js` packs) provide endless variety, with hand-authored **seed problems** as the fallback. Answers are graded by a structural normalizer — fractions match decimals, factored matches expanded, `4x + 19 = 59` ≠ `4x = 40` (steps stay meaningful), tuples, inequalities, solution sets, and √/π expressions all compare sensibly.

## Content model

All content is data. [content/manifest.json](content/manifest.json) lists subjects and topics; each topic is one JSON file:

```
content/<subject>/<topic>.json
├─ keyConcepts[]     { id, label, microLesson }        — the skills being trained
├─ lecture           markdown + LaTeX, ```plot fences  — the applied lesson
├─ application       workedExample + domainNotes       — where it's used for real
├─ generators[]      template names wired in js/generator.js
└─ problems[]        seed problems: steps with graded answers at difficulty 1–3
```

### Plots

[js/plot.js](js/plot.js) is a tiny dependency-free SVG plotter, themed via CSS custom properties. Specs are JSON, embedded either as a ` ```plot ` fenced block in a lecture or as a `plot` field on a problem:

- `cartesian` — function curves (`"fn": "sin(2x)"`), points, segments (`arrow` for vectors), `fillRange` area shading for integrals
- `graph` — node/edge diagrams for discrete math (trees, DAGs, Euler paths)
- `elliptic` / `modLattice` — real elliptic curves and their point clouds over ℤₚ, for the cryptography section

## Validating content

The headless harness in [tools/](tools) imports the *real* grader and checks every answer self-grades, every generator yields 30 valid instances, and every skill is servable at every difficulty:

```sh
node tools/validate.mjs                      # every topic in the manifest
node tools/checkone.mjs content/algebra/factoring.json
node tools/checkone.mjs <topic.json> --pack <pack.js>   # pre-wiring generator test
```

Run it after every content change.

## Repo layout

```
index.html / subject.html / topic.html / train.html   — the four pages
js/          engine: mastery model, problem engine, generators, renderer, plots
css/         base styles + three switchable terminal themes
content/     all subjects and topics (JSON)
tools/       content validation harness + sitemap generator (Node)
vendor/      KaTeX (vendored; the app is fully offline-capable)
```
