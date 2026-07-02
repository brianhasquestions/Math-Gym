# MathGym — Progress & Status

_Living status doc. See [ROADMAP.md](ROADMAP.md) for the original plan and design rationale._

## 1. Where things stand

**Content: COMPLETE (core + 2026-07 expansion waves 1–3).** **11 subjects,
79 topics, 1,306 seed problems**, every answer machine-validated against the
real grader. Wave 3 added a cryptographic-weaknesses capstone (referencing
Soatok's blog) and a from-scratch **SVG plotting engine** ([js/plot.js](js/plot.js))
now rendering graphs in lectures and training across the graphing/trig/exponential/
calculus/ODE/ECC topics. Wave 1 (ROADMAP §15.1) added 12 topics incl. the new
**Trigonometry** subject; wave 2 (§15.2b, user-directed) added proof topics to
Geometry and Calculus 3 plus a new **Cryptography** subject — the math behind
AES-256, RSA, ECC, Diffie–Hellman — all with full per-concept×tier generator
coverage.

| Subject | Topics | Status |
|---|---|---|
| Algebra | 11 | ✅ validated (+ Graphing Linear Equations) |
| Algebra 2 | 6 | ✅ validated |
| Geometry | 9 | ✅ validated (+ Similarity, Circles, Intro to Proof) |
| **Trigonometry** | 5 | ✅ validated (NEW subject: Radians & Unit Circle, Sine/Cosine Graphs, Identities, Law of Sines & Cosines, Trig Equations) |
| Calculus 1 | 8 | ✅ validated (+ Transcendental Derivatives, Implicit Differentiation) |
| Calculus 2 | 6 | ✅ validated |
| Calculus 3 | 7 | ✅ validated (+ Vector Proofs and Identities) |
| Differential Equations | 7 | ✅ validated (+ Nonhomogeneous Second-Order) |
| Matrix Algebra | 6 | ✅ validated |
| Linear Algebra | 7 | ✅ validated (+ Diagonalization and Matrix Powers) |
| **Cryptography** | 7 | ✅ validated (NEW subject: Modular Arithmetic, GCD/Euclid, Modular Exponentiation & Fermat–Euler + Diffie–Hellman, RSA, AES & GF(2⁸), ECC, + How Cryptography Breaks) |

Every topic has: applied-first lecture, real-world application section, 4
micro-lesson-backed key concepts, and 15–18 step-by-step problems spread across
difficulty tiers 1–3. Verified servable at every tier and masterable by the engine.
Remaining curriculum gaps are catalogued and prioritized in ROADMAP §15 (P2/P3).

**App: working end-to-end.** Landing page lists all 9 subjects / 58 topics;
lecture pages render markdown + KaTeX (incl. matrices, λ-notation); the adaptive
training session drives the mastery loop with the "prove-it" guardrail,
active-skill highlight, and terminal-themed reward animations. No console errors.

**Cross-topic intelligence (ROADMAP Phase 5) — DONE.** A new engine
([js/insights.js](js/insights.js)) reads the authored `prerequisites` graph
(topic-level edges, cross-subject aware) plus stored mastery to power three
surfaces: (1) a **subject learning map** ([subject.html](subject.html), reached
from each sidebar subject) that topologically orders topics by prerequisite,
badges each mastered/in-progress/not-started, highlights a **recommended
next topic**, and lists your **weakest attempted skills** across the subject;
(2) a **prerequisite gate** banner on the topic page ("builds on X, which you
haven't mastered — nail it first"); (3) a **struggle nudge** in training that,
the first time you hit a worked-solution reveal on a topic with an unmastered
prerequisite, points you at the likely root cause. All advisory, never blocking.

## 2. Engine & infrastructure

- **Adaptive engine** ([js/mastery-model.js](js/mastery-model.js)) — per-concept
  proficiency, difficulty escalation, brutal mastery bar (0.85 + 3 clean top-tier
  solves), §6.4 "prove the lesson landed" guardrail, honest progress meter.
- **Grader** ([js/problem-engine.js](js/problem-engine.js)) — see §3.
- **Parametric generators** ([js/generator.js](js/generator.js)) — every topic
  has generators. Coverage packs are self-contained files merged via
  `Object.assign` at the bottom of generator.js: `gen-de-fill.js` (def-),
  `gen-linalg-fill.js` (laf-), and the 2026-07 expansion packs
  `gen-alg-graph-fill.js` (agr-), `gen-calc1-fill.js` (c1i-/c1t-),
  `gen-geo-fill.js` (gsm-/gci-), `gen-de-fill2.js` (def2-),
  `gen-linalg-fill2.js` (laf2-), `gen-trig-fill.js` (trg-),
  `gen-trig2-fill.js` (trg2-), `gen-geo-proof-fill.js` (gpr-),
  `gen-calc3-proof-fill.js` (c3p-), `gen-crypto1-fill.js` (cr1-),
  `gen-crypto2-fill.js` (cr2-), `gen-crypto3-fill.js` (cr3-),
  `gen-crypto4-fill.js` (cr4-, crypto weaknesses).
- **Content** — `content/manifest.json` indexes `content/<subject>/<topic>.json`.
- **Theme** — Matrix / 90s-BBS terminal, monospace, green phosphor, zero gradients.

### Validation harness (now IN THE REPO: `tools/`)
Previously lived in a session scratchpad and was lost to temp cleanup; rebuilt
2026-07-01 and committed to `tools/` so it persists.
- `tools/validate.mjs` — auto-discovers every manifest topic; asserts JSON
  validity, concept/micro-lesson completeness, that **every** step answer +
  accept-variant self-checks via the real `checkStep`, that each generator
  yields 30 valid self-checking instances, and that each concept is servable at
  difficulty 1/2/3. Run after any content change: `node tools/validate.mjs`.
- `tools/checkone.mjs <topic.json> [--pack <pack.js>]` — same checks for a
  single file; `--pack` merges an unwired generator pack so authoring agents
  can self-test before integration.

## 3. Grader capabilities & constraints (authoring reference)

**Can verify:**
- Numbers; fractions == decimals (`1/2` == `0.5`).
- Multivariable polynomial equivalence — factored == expanded
  (`(x-2)(x-3)` == `x^2-5x+6`), term reorder, `^` powers, `*`/juxtaposition,
  division by a constant.
- Equation side-swap (`40=4x` == `4x=40`) — but **never** simplifies across `=`.
- Inequalities, direction-aware (`x>3` == `3<x`; strictness matters; not auto-solved).
- Ordered n-vectors and matrices (`<a,b,c>`, `[[a,b],[c,d]]`, row-major; order matters).
- Unordered solution sets (`form:"solutions"`, e.g. `x = 2 or x = -3`; strips
  `x=`/`r=`/`lambda=`).
- Factored-form gate (`form:"factored"` requires real product form).
- `+ C` antiderivatives (treats `C` as a symbol).
- Numeric radical / π / e expressions (`5√2` == `sqrt(50)` == `7.0710678`) — see §4.

**Cannot verify (author around these):**
- Symbolic trig/exp/log (e.g. `sin x`, `e^x`, `ln x`) — evaluate to a number instead.
- A variable in a denominator (e.g. `1/(x-3)`, simplified rational expressions) —
  use exact-string answers with `accept:[]`, or grade a numeric/excluded-value step.
- Negative/fractional exponents symbolically — give numeric or `1/x^3`-exact form.

## 4. Polish backlog (in priority order)

1. ~~**Symbolic-radical / constant numeric evaluation**~~ ✅ DONE — `evalNumeric`
   in the grader evaluates `√`/`sqrt`, `π`, `e`, and arithmetic to a number, so
   `5√2` == `sqrt(50)` == `7.0710678` and `16π` == `16*pi` compare correctly (tight
   tolerance, so a coarse rounded decimal still won't pass an exact-form step).
2. ~~**Parametric generators for seed-only topics**~~ ✅ DONE — **all 58 topics in
   all 9 subjects now have parametric generators**, giving the adaptive engine
   unlimited "keep drilling similar problems" variety on every topic. The harness
   self-checks 30 randomized instances per generator AND verifies each generator's
   concept belongs to its topic (so none are dead). Per-subject answer design:
   Algebra/Geometry clean integers + Pythagorean triples; Algebra 2 real radical
   forms (`5√2`); Calculus polynomial derivatives/antiderivatives (`+ C`) and
   point-evaluated numerics, with `e≈2.718` for by-parts/cooling so rounding
   agrees; Calc 3 / Matrix / Linear numeric vectors and matrices; eigenvalue and
   characteristic roots as solution sets.
   - ~~**Per-tier coverage for the advanced subjects**~~ ✅ DONE — the initial pass
     left **Differential Equations** and **Linear Algebra** thin: ~1 generator per
     topic, none at difficulty 3 (so the mastery tier repeated the same 1–2 seed
     problems). Both are now at **100% coverage — every concept has a generator at
     difficulty 1, 2, AND 3** (116 new generators). To keep `generator.js` from
     ballooning, these live in self-contained packs `js/gen-de-fill.js` (55) and
     `js/gen-linalg-fill.js` (61), merged into the registry via `Object.assign`
     near the bottom of `js/generator.js`. Coverage for a subject can be audited
     by probing `generate()` per concept×tier (see the coverage script pattern).
3. ~~**Rational-expression grading**~~ ✅ DONE — the grader now canonicalizes a
   single rational expression `P/Q` (variable denominators allowed) and compares
   two rationals by cross-multiplication, so `(x+2)/(x-3)`, its reorderings/sign-
   flips, and even simplifications (`(x²-4)/(x-2)` ≡ `x+2`) all grade equal — while
   different numerators/denominators are still rejected and all prior behavior
   (fractions, polynomials, tuples, inequalities) is unchanged. The rational-
   expressions topic gained a `simplify-rational` generator that exploits this.
4. **Threshold playtesting** — the mastery numbers (0.85 / 3-clean) are still
   simulated-only; tune against a real user (deferred per the "user testing at the
   end" plan). This is the only remaining item, and it needs a human.

## 5. Running it

- Serve statically: `python -m http.server 8000` then open `http://localhost:8000`.
- Validate content: `node tools/validate.mjs` (from the repo root or `tools/`).

## 6. Changelog (major increments)

1. Phase 0/1: scaffolding, schemas, adaptive engine, vertical slice (linear-equations).
2. Systems topic + structural checker (tuples, side-swap).
3. Factoring + quadratics; polynomial engine (factored==expanded), `form:"factored"`
   and `form:"solutions"` gates.
4. Terminal/BBS theme; Phase-2 polish (prove-it guardrail, a11y, export/import).
5. Full content build-out: all 9 subjects via parallel agents, auto-validator,
   grader hardening (inequalities, n-vectors/matrices, `lambda=`).
6. Polish: radical/π/e numeric eval, rational-expression equality, and parametric
   generators for **all 58 topics**.
7. **Theming + layout**: a 3-theme system (Matrix Terminal, Daylight Blue,
   Slate Dark) — switchable via header swatches, persisted, with a no-flash inline
   loader. CSS refactored to theme-neutral tokens (`css/theme.css` holds the token
   sets; terminal-only flourishes are scoped to `[data-theme="terminal"]`). The
   home page is now a **sidebar app shell** (`js/shell.js`): collapsible
   subjects → topics, active-topic highlight, also on the topic page; training
   stays a focused full-width view. Light/Slate use rounded cards + a sans-serif
   face; Terminal keeps the green-on-black monospace look.
8. **Cross-topic intelligence (Phase 5)**: `js/insights.js` engine over the
   prerequisite graph + stored mastery; subject learning-map page
   (`subject.html`) with topological ordering, status badges, recommended-next,
   and weakest-skills-in-subject; prerequisite-gate banner on topic pages; and a
   once-per-session struggle nudge in training. New shared `.insight-banner` /
   `.path-node` / `.weak-list` styles in `css/base.css`; sidebar gained a
   per-subject "Learning map" link.
9. **P1 content expansion (2026-07-01, ROADMAP §15)**: full curriculum-gap audit
   of all subjects, then 12 new topics authored by parallel agents and
   machine-validated — Algebra *Graphing Linear Equations*; Calc 1
   *Transcendental Derivatives* + *Implicit Differentiation*; Geometry
   *Similarity and Scale* + *Circles*; DiffEq *Nonhomogeneous Second-Order*;
   LinAlg *Diagonalization and Matrix Powers*; and a new **Trigonometry**
   subject (5 topics). 196 new seed problems, 132 new generators (every new
   concept covered at every tier), prerequisite graph extended (Related Rates
   now builds on Implicit Differentiation + Similarity; Trig bridges Geometry →
   Calculus). Validation harness rebuilt and moved into the repo at `tools/`.
   Verified live: sidebar/subject map/topic/training all render, generated
   problems serve and grade end-to-end.
10. **Wave-2 expansion (2026-07-01, user-directed, ROADMAP §15.2b)**: proofs +
   **Cryptography**. Geometry gained *Introduction to Proof and Logical
   Reasoning* (two-column proofs as checkable statement/reason steps — reason
   menus graded as exact strings with accept lists; SAS≠SSA anagram-safety
   verified). Calc 3 gained *Vector Proofs and Identities* (component proofs
   machine-graded via polynomial equivalence — subscripted variables like `v1`
   confirmed to parse as single symbols). New 6-topic **Cryptography** subject
   covering the actual math of deployed crypto: modular arithmetic → GCD /
   extended Euclid → modular exponentiation, Fermat–Euler, Diffie–Hellman →
   RSA (full toy round trips, factor-n attack problem) → AES & GF(2⁸)
   (xtime/gmul against the real 0x11B modulus) → ECC (point addition on
   brute-force-verified toy curves, ECDH). 130 new seed problems, 96 new
   generators; every crypto computation machine-verified during authoring.
   Verified live: RSA keygen and proof problems solved end-to-end in training;
   Cryptography learning map topologically ordered with cross-subject prereqs.
11. **Wave-3 expansion (2026-07-01, user-directed)**: plotting + crypto attacks.
   New **[js/plot.js](js/plot.js)** — a dependency-free SVG plotter (own tiny safe
   expression evaluator) with three modes: `cartesian` (axes/grid + function
   curves + points/segments), `elliptic` (the real two-branch y²=x³+ax+b curve
   with chord/tangent construction), and `modLattice` (an elliptic curve's points
   over Z_p as a dot grid). Themed entirely via CSS custom properties. Integrated
   two ways: fenced ```plot blocks in lecture markdown ([js/renderer.js](js/renderer.js))
   and an optional `plot` field on a problem object rendered above the prompt in
   training ([train.html](train.html)); styles in [css/base.css](css/base.css).
   Graphs + graph-reading practice added to graphing-linear-equations,
   sine-cosine-graphs, exponential-functions, analyzing-functions,
   differential-equations/introduction, and **ecc** (the real intercepting-curve
   visual the user asked for, plus the mod-11 point cloud — 2G=(5,2) verified).
   New capstone topic **cryptography.crypto-weaknesses** ("How Cryptography
   Breaks") — keystream/nonce reuse, ECB pattern leakage, ECDSA nonce-reuse key
   recovery (the PS3 break), and textbook-RSA misuse — every attack computed by
   hand on toy numbers, citing four verified Soatok (Dhole Moments) posts as the
   authoritative further reading. 40 new problems, 12 new generators.
   Verified live: plots render in ECC lecture and in graph-reading training
   problems; full manifest validates (79 topics, 1,306 problems, 0 failing).
12. **Wave-4 expansion (2026-07-01, user-directed)**: graphing everywhere + Discrete Math.
   [js/plot.js](js/plot.js) grew three primitives: `fillRange:[a,b]` on a cartesian
   curve (shades the region between the curve and y=0 — the definite-integral
   picture), `arrow:true` on segments (vectors), and a new `graph` spec type
   (node/edge diagrams with optional direction/labels, auto-scaled abstract
   coordinates — discrete-math graphs, trees, DAGs). Plots were then authored
   across every pertinent math section (~26 topics now carry them, up from the
   handful in wave 3): algebra (lines with rise/run, parabola roots, crossing
   systems), algebra-2 (domain/range, growth vs decay, log/exp mirror), geometry
   (countable 3-4-5 grid triangles), trigonometry (unit circle, sin/cos periods,
   why-multiple-solutions, law-of-sines triangles to scale), calculus 1
   (secant→tangent, hole/limit pictures, extrema/inflection, optimization peaks),
   calculus 2 (shaded ∫ areas, area-between-curves), differential equations
   (solution families, Newton cooling, Euler polygons against exact curves), and
   linear algebra (vector arrows, transformation images, v ∥ Av eigenlines).
   Every plotted coordinate computed, not eyeballed; tangents verified tangent.
   New 12th subject **Discrete Math** (placed before Cryptography): propositional
   logic & truth tables, sets & set operations, counting (permutations /
   combinations / pigeonhole), graph theory (handshake lemma, Euler paths,
   trees — 14 rendered graph diagrams incl. 11 graph-reading problems), and
   recursion/recurrences/induction (Hanoi worked in full). 80 new seed problems,
   16 per topic with exact tier-1/2/3 coverage per concept; seed-only for now
   (`generators: []`) — a gen-discrete-fill pack is the open follow-up.
   Verified live: manifest validates (84 topics, 1,386 problems, 0 failing);
   graph/shaded/arrow plots render in lectures and in graph-reading training
   problems; no console or KaTeX errors.
13. **Wave-5: proofs everywhere they belong (2026-07-01, user-directed)**: added
   **discrete-math.proof-techniques** ("Proof Techniques: Direct, Contrapositive,
   and Contradiction") — the canonical discrete-math proof unit, following the
   intro-to-proof grading pattern (enumerated technique menus, numeric witnesses,
   polynomial-graded algebra steps like (2k+1)² = 4k²+4k+1); 16 seed problems
   with exact tier coverage; workedExample executes all four techniques in full
   (odd+odd, n² even ⇒ n even, √2 irrational, n²+n+41 killed at n=40).
   **Audited every existing proof topic** for logical/mathematical correctness
   (the harness can only check that answers self-grade, not that the math is
   right): geometry.intro-to-proof + its 12 gpr- generators (20,000-seed
   brute-force sweep — clean), calculus-3.vector-proofs (clean),
   trigonometry.trig-identities (clean), recursion-and-induction's induction
   problems. Three real defects found and fixed: c3p-geom-midsegment-d2 could
   emit collinear "triangles" (guard: p·s ≠ q·r), c3p-lagrange-d2 could emit
   parallel vectors making Lagrange verification a degenerate 0=0 (guard:
   nonzero cross product), and a false side-claim in an induction narrative
   ("2^n > n^3 first true at n=10" — it holds at n=1, fails only for 2..9).
   Verified live: proof-techniques lecture renders (105 KaTeX expressions,
   0 errors) and a full direct-proof problem was solved step-by-step in
   training. 85 topics, 1,402 seed problems, 0 failing.
14. **Wave-6: multi-dimension review + fixes (2026-07-01, user-directed)**. A 4-track
   review (engine correctness, security/rendering/a11y, content coverage, deployment)
   found and fixed: a reflected-XSS sink (`showError` rendered the `?id=` param as
   innerHTML — now text); two grader loopholes (paren-wrapping bypassed the
   factored-form gate; function names like `sin` were parsed as commutative
   letter-products, so `sin(4x)`≡`4sin(x)`); wrong-variable numeric matches
   (`y=7` satisfied an `x=7` step); an over-tight tolerance that rejected rounded
   decimals of π/√ answers; `x^(2)` and `(2,-3)` rejections; orphaned concepts
   wedging the mastery focus lock after a content update; unvalidated
   import-progress that could crash the app; and a zero-span plot NaN. Added plot
   `<title>`/aria-label and fixed light-theme `--warn`/`--text-faint` WCAG-AA
   contrast. Content: proof-techniques got 12 `dm-proof-*` generators (last
   generator-less topic); the four sub-15-seed algebra topics topped up to 16 with
   tier-3 gaps closed (validator 15→0 warnings); plots added to calc-3 (dot/cross,
   gradient, multivar-opt), matrix-transformations, trig-identities, related-rates.
   Deployment: OG/Twitter/description/canonical/theme-color on all pages, og.svg
   card, 404.html, robots.txt, sitemap.xml (98 URLs, `tools/gen-sitemap.mjs`).
   Verified: 85 topics / 1431 problems / 0 failing; 24-case grader test suite;
   XSS payload confirmed inert on fresh module. OPEN (needs Cloudflare dashboard,
   not code): enable "Always Use HTTPS" + HSTS — http://mathgym.io still serves
   cleartext.
