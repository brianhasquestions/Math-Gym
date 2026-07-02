# MathGym — Project Roadmap

> A web app that **teaches and trains** applied mathematics. The goal is mastery,
> not points. We force the learner to confront and grind down their weak spots
> until they genuinely understand, while using tasteful animation to make the act
> of learning feel rewarding.

> **CONTENT COMPLETE (core + 2026-07 expansion).** Now **11 subjects, 79
> topics, 1,306 problems**, all machine-validated, plus an in-app **SVG
> plotting engine** (js/plot.js) driving graphs in lectures and training. The
> 2026-07 audit (§15) mapped the gaps; wave 1 (§15.1: 12 topics incl. the new
> **Trigonometry** subject), wave 2 (§15.2b: Geometry/Calc-3 proof topics + the
> new **Cryptography** subject), and wave 3 (§15.2c: plotting + a crypto-attacks
> capstone citing Soatok) are all implemented and live. P2 items in §15.2 remain
> open for a future wave.
>
> **Previous milestone — all 9 subjects, 58 topics, 941 problems, every answer
> machine-validated.** A headless validator ([scratchpad]/validate.mjs) auto-discovers
> every topic from the manifest and checks: JSON validity, concept/micro-lesson
> completeness, that *every* authored answer and accept-variant self-checks against
> the real grader, that each skill is servable at all 3 difficulty tiers, and that
> each topic is masterable. The grader was hardened along the way to support
> inequalities (direction-aware), n-dimensional vectors and matrices (row-major),
> unordered solution sets (incl. `lambda=`), fractions/decimals, factored forms,
> and `+ C` antiderivatives. Per-subject topic counts: Algebra 10, Algebra 2 6,
> Geometry 6, Calculus 1/2/3 6 each, Differential Equations 6, Matrix Algebra 6,
> Linear Algebra 6. **Remaining polish:** parametric generators for the
> agent-authored topics (currently seed-only, 15–18 problems each; the 4 original
> Algebra topics have generators), and symbolic-radical / rational-expression
> grading (those topics currently lean on numeric + exact-string answers).
>
> **Status (Phase 0 + Phase 1 done; Phase 2 in progress):** Scaffolding, schemas,
> the full adaptive engine, and two end-to-end topics are built and verified
> (headless sim + live browser):
> - `algebra.linear-equations` (vertical slice) and `algebra.systems-linear-equations`
>   (authored as a pipeline stress test — ordered-pair answers, `\begin{cases}`
>   rendering, multi-method solving).
> - **Answer checker:** a real polynomial engine (parse → expand → canonical form)
>   so factored == expanded ($(x-2)(x-3)=x^2-5x+6$), fractions == decimals
>   ($1/2=0.5$), plus term-reorder, side-swap (never across `=`), ordered-pair/tuple,
>   and numeric tolerance. Word answers stay exact-only (no anagram collisions).
> - **Engine hardening:** §6.4 "prove it landed" guardrail (a shown solution freezes
>   progress until a fresh problem is solved unaided); config validation; honest
>   per-concept meter; `aria-live` feedback; progress export/import/reset.
> - **Theme:** Matrix / 90s-BBS terminal — green phosphor on black, monospace,
>   sharp corners, blinking cursor, zero gradients; motion-safe.
> - **Content:** four Algebra topics live — `linear-equations`, `systems-linear-equations`,
>   `factoring` (GCF, difference of squares, simple & leading-coefficient trinomials),
>   and `quadratic-equations` (factoring, square-root method, quadratic formula,
>   discriminant). Factoring/quadratics exercise the polynomial checker hard.
>   Two answer-form gates back this: `form:"factored"` requires real product form
>   (rejects the expanded original, with a targeted UI nudge), and `form:"solutions"`
>   compares an UNORDERED set of roots ($x=2$ or $x=-3$ == $-3, 2$, fractions == decimals).
> - **Polish:** active-skill highlight in the mastery panel; defensive generator
>   guard (a buggy generator can't crash a session).
> Remaining Phase 2: threshold playtesting with a real user. Then Phase 3 content
> scale-out across the other subjects.

---

## 1. Vision & Guiding Principles

These principles are the filter for *every* later decision. When a feature is
ambiguous, re-read this section.

1. **Applied-first, not theory-first.** Traditional math content drowns the
   learner in abstraction before showing why it matters. We invert this. Every
   topic leads with a real situation (a bridge load, a loan, a signal, a robot
   arm, a population, a logistics route) and derives the math *from* it. Pure
   theory is included only where it earns its place.
2. **Mastery is mandatory, not optional.** A learner does not "pass" a topic by
   getting one problem right. They keep receiving fresh, similar problems until a
   measured mastery threshold is met. This is the "brutal" core — but it is
   *fair* brutality: clear, transparent, and always escapable through actual
   learning.
3. **Diagnose the weakness, then drill it.** When a learner fails, we identify
   *which sub-skill* failed (not just "wrong answer") and serve more of that
   specific sub-skill.
4. **Reward learning, do not gamify gaming.** Animations and feedback fire on
   genuine progress (mastering a concept, breaking through a wall), *not* on
   streaks, coins, leaderboards, or grind-for-grind's-sake loops. We build a
   dopamine circuit around *understanding*, not around *engagement metrics*.
   See §8 for the explicit line between the two.
5. **Show the work, demand the work.** Problems are solved step-by-step. The app
   checks intermediate steps, not just final answers, so it can pinpoint exactly
   where reasoning breaks.
6. **No build step, no backend (v1).** HTML5 + CSS + vanilla JS, content as
   static data files. The whole thing runs from a static host or the file
   system. Progress lives in the browser. This keeps us fast and dependency-free.

---

## 2. Subject → Topic Breakdown

The nine knowledge areas, each decomposed into the **topics** that will become
content units. Each topic listed here will get its own content file (see §4):
a lecture, a real-world application section, and a problem bank.

> Note on overlap: Algebra 2, Matrix Algebra, and Linear Algebra share material.
> We author each topic *once* and reuse it across subject "tracks" via tags
> rather than duplicating content.

### 2.1 Algebra (Algebra 1)
- Numbers, operations, and order of operations
- Variables, expressions, and evaluation
- Linear equations in one variable
- Linear inequalities and interval notation
- Ratios, proportions, and percent (applied: tips, tax, discounts, scaling)
- Unit conversion and dimensional analysis
- The coordinate plane and plotting
- Slope and rate of change (applied: speed, pricing per unit)
- Linear functions and modeling
- Systems of linear equations (two variables)
- Exponents and exponent rules
- Polynomials: add, subtract, multiply
- Factoring (GCF, trinomials, difference of squares)
- Quadratic equations (factoring, completing the square, quadratic formula)
- Introduction to functions and function notation

### 2.2 Algebra 2
- Functions: domain, range, transformations, composition, inverses
- Quadratic functions and parabolas (applied: projectile motion, optimization)
- Polynomial functions and their behavior
- Rational expressions and equations
- Radical expressions and equations
- Complex numbers
- Exponential functions (applied: compound interest, growth)
- Logarithms and logarithmic functions (applied: pH, decibels, Richter scale)
- Systems of equations and inequalities (incl. nonlinear)
- Sequences and series (arithmetic, geometric; applied: amortization)
- Probability and basic combinatorics
- Introduction to conic sections

### 2.3 Geometry
- Points, lines, planes, and angles
- Triangles: properties and congruence
- Similarity and scale (applied: maps, models, shadows)
- The Pythagorean theorem (applied: distance, construction)
- Right-triangle trigonometry (sin, cos, tan; applied: ramps, heights)
- Quadrilaterals and polygons
- Circles: arcs, chords, sectors
- Perimeter, area, and composite figures
- Surface area and volume (applied: packaging, material cost)
- Coordinate geometry
- Transformations (translation, rotation, reflection, dilation)
- Introduction to proof and logical reasoning

### 2.4 Calculus 1 (Differential Calculus)
- Functions review and the idea of a limit
- Limits and continuity (computing, one-sided, infinite)
- The derivative as a rate of change (applied: velocity, marginal cost)
- Differentiation rules (power, product, quotient, chain)
- Derivatives of trig, exponential, and log functions
- Implicit differentiation
- Related rates (applied: filling tanks, shadows, expanding ripples)
- Linear approximation and differentials
- Extrema, the first and second derivative tests
- Optimization (applied: max profit, min material, fastest route)
- Curve sketching
- Introduction to the antiderivative

### 2.5 Calculus 2 (Integral Calculus & Series)
- The definite integral and area under a curve
- The Fundamental Theorem of Calculus
- Integration techniques: substitution
- Integration by parts
- Trigonometric integrals and trig substitution
- Partial fractions
- Improper integrals
- Applications of integration: area between curves, volumes of revolution
- Applications: arc length, work, fluid force, average value (applied: physics/engineering)
- Differential-equation preview (separable)
- Sequences and convergence
- Infinite series and convergence tests
- Power series and Taylor/Maclaurin series (applied: approximation, computing)

### 2.6 Calculus 3 (Multivariable Calculus)
- Vectors in 2D and 3D
- Dot product, cross product, and projections
- Lines, planes, and surfaces in space
- Vector-valued functions and motion in space
- Functions of several variables and surfaces
- Partial derivatives
- The gradient and directional derivatives (applied: heat, terrain, optimization)
- Tangent planes and linear approximation
- Multivariable optimization and Lagrange multipliers (applied: constrained cost)
- Double integrals (incl. polar)
- Triple integrals (incl. cylindrical/spherical)
- Vector fields
- Line integrals and the Fundamental Theorem for line integrals
- Green's, Stokes', and the Divergence theorems (applied: flux, circulation)

### 2.7 Differential Equations
- What a differential equation is (applied: modeling change)
- Solutions, initial conditions, and direction fields
- Separable first-order equations
- Linear first-order equations and integrating factors
- Modeling: growth/decay, cooling, mixing, circuits
- Second-order linear homogeneous equations (constant coefficients)
- Nonhomogeneous equations: undetermined coefficients & variation of parameters
- Mechanical/electrical vibrations and resonance (applied)
- The Laplace transform and solving IVPs with it
- Systems of differential equations
- Numerical methods (Euler, improved Euler/RK overview)
- Series solutions (introduction)

### 2.8 Matrix Algebra
- What a matrix is and where they come from (applied: tables, transformations, graphs)
- Matrix notation, equality, and special matrices
- Matrix addition, scalar multiplication
- Matrix multiplication and its meaning
- The identity and matrix inverses
- Determinants and their interpretation (area/volume scaling)
- Solving linear systems with matrices (Gaussian elimination, RREF)
- Elementary row operations
- LU decomposition (introduction)
- Matrix transformations of the plane (applied: graphics, rotations/scaling)
- Applications: Markov chains, computer graphics, encoding

### 2.9 Linear Algebra
- Vectors and vector operations (geometric and algebraic)
- Linear combinations and span
- Linear independence
- Vector spaces and subspaces
- Basis and dimension
- The four fundamental subspaces (column, row, null, left-null)
- Rank and the rank-nullity theorem
- Linear transformations and their matrices
- Change of basis
- Eigenvalues and eigenvectors (applied: stability, PageRank, PCA intuition)
- Diagonalization
- Inner products, orthogonality, and projections
- Gram–Schmidt and QR (introduction)
- Least squares (applied: data fitting/regression)
- Introduction to the Singular Value Decomposition (applied: compression, data)

### 2.10 Cryptography (added 2026-07)
- Modular arithmetic: congruences, clock arithmetic, modular inverses
- Primes, GCD, and the Euclidean algorithm (incl. extended Euclid / Bézout)
- Modular exponentiation, Fermat's little theorem, Euler's totient
- Key exchange: Diffie–Hellman and the discrete-log problem
- RSA: key generation, encryption/decryption, and why it works
- Symmetric ciphers: XOR, finite fields GF(2^8), and the math inside AES-256
- Elliptic curves: point addition, scalar multiplication, ECDH/ECDSA intuition

---

## 3. Repository / Project Structure

```
MathGym/
├── ROADMAP.md                  ← this file
├── index.html                  ← landing / subject selection
├── topic.html                  ← lecture + application + "start training" entry
├── train.html                  ← the adaptive training session UI
├── css/
│   ├── base.css                ← reset, typography, layout primitives
│   ├── theme.css               ← color tokens, dark/light
│   └── animations.css          ← keyframes, reward animations
├── js/
│   ├── app.js                  ← routing/bootstrapping, shared UI
│   ├── content-loader.js       ← loads subject/topic JSON
│   ├── renderer.js             ← renders lecture + application markdown/HTML + math
│   ├── problem-engine.js       ← serves problems, checks steps, scores
│   ├── mastery-model.js        ← the adaptive mastery algorithm (§6)
│   ├── generator.js            ← parametric problem generation (§5.2)
│   ├── progress-store.js       ← localStorage read/write, schema versioning
│   └── animations.js           ← reward/feedback animation controller
├── content/
│   ├── manifest.json           ← list of subjects → topics → file paths
│   ├── algebra/
│   │   ├── linear-equations.json
│   │   └── ...
│   ├── algebra-2/
│   ├── geometry/
│   ├── calculus-1/
│   ├── calculus-2/
│   ├── calculus-3/
│   ├── differential-equations/
│   ├── matrix-algebra/
│   └── linear-algebra/
├── assets/                     ← icons, illustrations, fonts (self-hosted)
└── vendor/                     ← KaTeX (math rendering), pinned + self-hosted
```

We deliberately keep **content separate from code**. Content authors (us, early
on) edit only JSON; engine work never touches content. This separation is what
makes the project scale.

---

## 4. Content Model (per topic)

Each topic is one JSON file. This is the "base" the user described — it must be
authored *before* heavy UI work, because everything downstream consumes it.

A topic file contains four parts:

1. **Metadata** — id, subject, title, prerequisites (other topic ids), key
   concepts (the atomic sub-skills used by the mastery engine).
2. **Lecture** — the teaching content. Plain, conversational, example-driven.
   Written in a markdown subset + LaTeX math. *Applied framing leads.*
3. **Real-world application** — a dedicated section: where this shows up in
   engineering, finance, medicine, data, daily life. At least one worked
   real-scenario example.
4. **Problem bank** — a large set of problems (see §5). Each tagged with the key
   concept(s) it exercises and a difficulty tier.

### 4.1 Topic JSON schema (draft)

```jsonc
{
  "id": "algebra.linear-equations",
  "subject": "algebra",
  "title": "Linear Equations in One Variable",
  "prerequisites": ["algebra.variables-expressions"],
  "keyConcepts": [
    "isolate-variable",
    "combine-like-terms",
    "distribute",
    "variables-both-sides"
  ],
  "lecture": {
    "format": "markdown+latex",
    "body": "..."
  },
  "application": {
    "summary": "...",
    "domains": ["personal finance", "engineering"],
    "workedExample": "..."
  },
  "problems": [ /* see §5.1 */ ]
}
```

### 4.2 Authoring workload (the big lift)

Across all 9 subjects there are ~110 topics (§2). For each we need a lecture, an
application section, and a **large** problem bank. To make "large" tractable we
combine two sources of problems:

- **Hand-authored seed problems** — ~10–20 carefully written, with full
  step-by-step solutions. These guarantee quality and realism.
- **Parametric generators** — each seed problem (where the math allows) becomes a
  *template* whose numbers/context are randomized, yielding effectively unlimited
  "similar" problems. This is what powers "keep giving more until mastered" (§5.2).

---

## 5. Problems: Format, Generation, and Step-Checking

### 5.1 Problem object schema (draft)

```jsonc
{
  "id": "algebra.linear-equations.p014",
  "concepts": ["variables-both-sides", "distribute"],
  "difficulty": 2,                 // 1=intro, 2=standard, 3=challenge
  "context": "applied",            // "applied" | "abstract"
  "prompt": "A gym charges $25 plus $4 per class; a rival charges $40 plus $1 per class. After how many classes is the cost equal?",
  "givens": { "...": "..." },
  "steps": [                       // ordered, checkable intermediate steps
    {
      "instruction": "Write an equation setting the two costs equal.",
      "answer": "25 + 4x = 40 + x",
      "accept": ["25+4x=40+x", "4x+25=x+40"],
      "hint": "Cost = base fee + per-class fee × number of classes."
    },
    {
      "instruction": "Get the variable terms on one side.",
      "answer": "3x = 15",
      "hint": "Subtract x from both sides."
    },
    {
      "instruction": "Solve for x.",
      "answer": "x = 5",
      "hint": "Divide both sides by 3."
    }
  ],
  "finalAnswer": { "value": "5", "unit": "classes" },
  "solutionNarrative": "...",      // shown after completion / on giving up
  "template": "linear-twoside-v1"  // optional: links to a generator (§5.2)
}
```

### 5.2 Parametric generation

A generator is a small JS function keyed by `template` id. It produces a fully
populated problem object with randomized parameters while guaranteeing a clean
answer (e.g., integer solutions) and a sensible applied context drawn from a pool.

```js
// generator.js (illustrative)
generators["linear-twoside-v1"] = (rng) => {
  const a = rng.int(2, 6), b = rng.int(10, 40), c = rng.int(1, a - 1);
  // build "b + a·x = d + c·x" with integer solution, pick a context, etc.
  return problemObject;
};
```

Design rules for generators:
- Always yield clean, checkable answers (control the solution, derive the givens).
- Pull contexts from a themed pool so problems feel real and varied, not robotic.
- Tag with the same `concepts` as their seed so the mastery engine treats them as
  equivalent practice.
- Determinism via a seeded RNG so a session is reproducible/debuggable.

### 5.3 Step-checking & answer equivalence

Final-answer-only checking is too coarse for diagnosis. We check each step.
This requires a tolerant equivalence checker:

- **Numeric** answers: parse and compare within tolerance; handle units.
- **Symbolic/expression** answers: normalize (strip spaces, canonical ordering)
  and compare against an `accept` list of equivalent forms. For v1 we rely on
  curated `accept` arrays; a later upgrade can add a lightweight CAS-style
  normalizer for algebraic equivalence.
- **Multiple-choice / pick-the-setup** steps where free-form parsing is risky.

> Decision to revisit: how much symbolic equivalence to support in v1 vs. leaning
> on multiple-choice for the trickiest steps. Start curated, upgrade later.

---

## 6. The Adaptive Mastery Engine (core feature)

This is the heart of MathGym. It decides which problem to serve next and when a
learner has truly mastered a topic.

### 6.1 What we track (the mastery model)

Mastery is tracked **per key concept**, not per topic, so we can drill the exact
weakness.

For each `(learner, concept)` we store:
- `proficiency` — a 0..1 estimate of mastery.
- `recentResults` — a rolling window (e.g., last 8 attempts) of correct/incorrect.
- `currentDifficulty` — the tier currently being served (1–3).
- `attempts`, `consecutiveCorrect`, `consecutiveWrong`.
- `hintsUsed`, `avgStepsCorrectFirstTry`.

### 6.2 Serving logic (next-problem selection)

**Blocked practice:** the engine focuses on ONE skill at a time. It locks onto
the current focus concept and keeps serving it until that concept is mastered,
then advances to the next unmastered concept in the topic's authored order. (We
tried weakest-first interleaving early on, but it hops between skills after every
problem; learners found it disorienting — one skill at a time reads as "drill
this, then unlock the next.")

1. Stay on the current focus concept; if it's mastered, advance to the next
   unmastered concept in authored order (`state.focusConceptId` / `conceptOrder`).
2. Serve a problem tagged with that concept at `currentDifficulty`.
3. After grading:
   - **Correct, few/no hints** → raise proficiency; if accuracy in the window is
     high, escalate difficulty.
   - **Correct but heavy hints / multiple step retries** → small proficiency gain,
     hold difficulty.
   - **Incorrect** → lower proficiency, drop difficulty one tier, and queue
     *more* problems of the specific step/concept that failed (the "drill").
4. Repeat until every key concept in the topic crosses the mastery bar.

### 6.3 Mastery criterion (the "brutal" bar)

A concept is **mastered** when:
- `proficiency >= 0.85`, **and**
- the learner has answered **≥ 3 consecutive** problems at the **top difficulty
  tier** correctly, **and**
- those were solved with minimal hints (hints cap the proficiency gain).

A topic is mastered when **all** its key concepts are mastered. No shortcut, no
"good enough on average" — a single weak concept keeps the topic open. That is
the deliberate brutality: you cannot pass by being strong elsewhere.

### 6.4 Anti-frustration guardrails (brutal, not cruel)

Forcing learning ≠ grinding someone into the ground blind. Guardrails:
- After repeated failures on a concept, **inject a targeted micro-lesson** (a
  focused re-explanation of just that sub-skill) before continuing the drill.
- Escalate hint richness automatically when struggling (more guidance, not less).
- Show a worked solution after N failed attempts, then require the learner to
  redo a *fresh* similar problem unaided to prove the lesson landed.
- Allow pausing a session; never lose progress. The wall is the *concept*, not
  the clock.

### 6.5 Tuning

All thresholds (window size, 0.85, 3-in-a-row, difficulty step) live in one
config object so we can tune the difficulty curve without touching logic. Expect
to playtest and adjust.

---

## 7. Step-by-Step Training UX

The training session (`train.html`) flow:

1. **Problem presented** with its real-world framing and rendered math.
2. **Step entry** — the learner is asked for the first step, not the final answer.
   They enter it; the engine checks it.
   - Correct → reveal/advance to the next step.
   - Incorrect → targeted feedback; offer the step's hint; let them retry.
3. Progress bar shows steps completed within the problem.
4. On final step correct → **reward animation** (§8) scaled to the achievement.
5. A persistent **mastery meter** for the current topic's concepts shows how close
   they are to clearing the topic — honest, not inflated.
6. On giving up a step → full worked solution, then a fresh similar problem.

Accessibility: keyboard-first input, screen-reader labels, math rendered with
accessible output, respects `prefers-reduced-motion` (animations degrade
gracefully).

---

## 8. Animation & Reward System (dopamine without gamification)

We want the *feeling* of breakthrough, tied strictly to real learning.

**We DO (reward understanding):**
- Satisfying step-confirmation micro-animations (a clean check, a smooth advance).
- A meaningful "concept mastered" moment — a distinct, earned celebration when a
  key concept crosses the bar.
- A larger "topic cleared" moment.
- Visual representations of *understanding growing* (the mastery meter filling as
  a direct, honest function of real proficiency).
- Smooth, physical, pleasing transitions that make interaction feel responsive.

**We DON'T (avoid gamification that rewards gaming):**
- No points/coins/XP currencies disconnected from understanding.
- No daily-streak pressure, no "don't break your streak!" guilt loops.
- No leaderboards or social comparison.
- No randomized/variable-ratio reward loot (the casino mechanic).
- No cosmetic unlock treadmills that pull focus from the math.

**Litmus test for any reward:** *"Does this fire because the learner understood
something, or because they kept clicking?"* If the latter, cut it.

Implementation: CSS keyframes + the Web Animations API in `animations.js`, all
gated behind `prefers-reduced-motion` and a user toggle.

---

## 9. Progress & Persistence

- `localStorage` (v1), namespaced and **schema-versioned** so we can migrate.
- Stores per-concept mastery state, per-topic completion, session history.
- Export/import progress as a JSON file (so a learner isn't locked to one browser
  and we avoid needing a backend).
- Clear "reset progress" with confirmation.
- Future: optional account sync if we ever add a backend (explicitly out of scope
  for v1).

---

## 10. Tech Decisions (and their rationale)

| Concern | Decision | Why |
|---|---|---|
| Framework | None (vanilla JS, ES modules) | User requirement; zero build, long-lived |
| Math rendering | **KaTeX**, self-hosted in `vendor/` | Fast, no runtime deps, offline; pinned for stability |
| Styling | Hand-written CSS + design tokens | Full control, no toolchain |
| Content format | JSON files + a manifest | Code/content separation; easy to author & validate |
| Problem variety | Seed problems + parametric generators | Makes "unlimited similar problems" real |
| State | localStorage, versioned, exportable | No backend needed for v1 |
| Routing | Multi-page (index/topic/train) | Simplest; no SPA router needed |

> Open decision: KaTeX vs. MathJax. Recommendation: **KaTeX** for speed and
> simplicity; revisit only if we hit unsupported notation.

---

## 11. Build Phases & Milestones

Phased so we always have something runnable and we validate the hardest part
(the engine) early on a small slice of content.

**Phase 0 — Foundations**
- Repo structure, base CSS/theme, KaTeX vendored, content manifest schema.
- Lock the topic + problem JSON schemas (§4, §5). Write a tiny schema validator.

**Phase 1 — Vertical slice (prove the whole loop on ONE topic)**
- Author one topic end-to-end (recommend `algebra.linear-equations`): lecture,
  application, ~15 seed problems + 1 generator.
- Build `content-loader`, `renderer`, lecture/application display on `topic.html`.
- Build `problem-engine` + step-checking + `train.html` for that one topic.
- Build `mastery-model` and run the full serve→grade→escalate→master loop.
- Add `progress-store`. Add first reward animations.
- **Goal:** a learner can actually master one topic, brutally and rewardingly.
  This validates the riskiest design before we scale content.

**Phase 2 — Engine hardening & UX**
- Tune mastery thresholds via playtesting (§6.5).
- Anti-frustration guardrails (§6.4), micro-lessons.
- Animation/reward polish (§8), reduced-motion, accessibility pass.
- Progress export/import.

**Phase 3 — Content scale-out**
- Author the rest of Algebra, then Geometry & Algebra 2 (high-demand, broad base).
- Build a library of reusable generators.
- Establish a content QA checklist (answers verified, applied framing present,
  difficulty tiers balanced).

**Phase 4 — Advanced subjects**
- Calculus 1–3, Differential Equations, Matrix & Linear Algebra.
- Extend step-checking where symbolic/notation needs grow (§5.3).

**Phase 5 — Cross-topic intelligence**
- Prerequisite-aware suggestions ("you're failing this because of that earlier
  concept — drill it first").
- Topic-spanning diagnostic to place a learner and surface weaknesses across a
  whole subject.

---

## 12. Cross-Cutting Concerns / Definition of Done

For each **topic** to be "done":
- [ ] Lecture written, applied-first, with rendered math verified.
- [ ] Real-world application section with ≥1 worked real scenario.
- [ ] ≥15 seed problems with full step-by-step solutions, answers verified.
- [ ] ≥1 generator where the math supports it.
- [ ] Every problem tagged with key concept(s) and difficulty.
- [ ] Runs through the mastery loop without dead-ends.

For the **app** to be "done" (v1):
- [ ] All 9 subjects have content for their core topics.
- [ ] Adaptive engine masters/escalates/drills correctly and is tuned.
- [ ] Step-by-step checking works across content types.
- [ ] Reward system fires only on genuine progress; reduced-motion respected.
- [ ] Progress persists, exports, imports, resets.
- [ ] Accessible (keyboard, screen reader, contrast).

---

## 13. Open Questions (decide before/early in Phase 1)

1. **Symbolic equivalence depth** — curated `accept` lists only, or a light CAS
   normalizer for algebra? (Recommend: curated for v1, CAS later.) (§5.3)
2. **Difficulty tiers** — 3 tiers enough, or do calculus topics need more? (§5.1)
3. **Mastery thresholds** — starting values in §6.3 are a hypothesis; confirm via
   Phase 1 playtest.
4. **Input modality for math** — typed plain-text math (e.g. `x^2`) vs. a small
   equation input helper. (Recommend: plain-text + live KaTeX preview.)
5. **Tone of the applied contexts** — how much we lean into specific domains
   (finance vs. engineering vs. everyday). (Recommend: variety, weighted to
   everyday + money early, engineering/science later.)

---

## 14. Immediate Next Steps

1. Review & approve this roadmap (especially §6 mastery rules and §8 reward line).
2. Lock the topic + problem JSON schemas (§4.1, §5.1).
3. Build Phase 0 scaffolding.
4. Author the `algebra.linear-equations` vertical slice and prove the loop.

---

## 15. Content Gap Analysis & Expansion Plan (2026-07-01)

A full audit of the live content (all 58 topics: key concepts, lectures,
applications) against a standard curriculum for each subject. Structural health
is perfect — every topic has 4 micro-lesson-backed concepts, a lecture, and an
application. The gaps below are **coverage** gaps. Priorities:

- **P1 — implement now** (this wave): highest leverage, unblocks the learning
  ladder or is a prerequisite another live topic silently assumes.
- **P2 — next wave**: standard-curriculum material worth having.
- **P3 — deliberate scope cuts**: theory-heavy or grader-hostile; revisit only
  with a reason.

### 15.1 P1 — implementing now (12 new topics)

| Subject | New topic | Why it's P1 |
|---|---|---|
| Algebra | **Graphing Linear Equations** (slope, intercepts, slope-intercept form) | Biggest single gap; Calc 1 leans on "slope of the tangent" with slope never taught |
| Calculus 1 | **Implicit Differentiation** | Standard prerequisite for Related Rates, which is already live |
| Calculus 1 | **Derivatives of Exponential, Log, and Trig Functions** | Rules topic stops at chain rule; no $e^x$/$\ln x$/$\sin x$ derivatives exist |
| Geometry | **Similarity and Scale** | Related Rates invokes similar triangles; nothing teaches them |
| Geometry | **Circles** (arcs, central/inscribed angles, sectors) | Circle theorems absent; only circumference/area live |
| Diff. Equations | **Nonhomogeneous Second-Order Equations** (undetermined coefficients) | Second-order topic covers the homogeneous case only |
| Linear Algebra | **Diagonalization and Matrix Powers** | Eigenvalue topic finds eigenvalues but never uses them — this is the payoff |
| **Trigonometry** (new subject, 5 topics) | Radians & the Unit Circle · Graphs of Sine and Cosine · Trigonometric Identities · Law of Sines and Cosines · Solving Trig Equations | The biggest structural hole in the ladder: Geometry ends at SOH-CAH-TOA, Calculus assumes full trig fluency |

### 15.2 P2 — next wave

- **Algebra:** absolute-value equations/inequalities; graphing quadratics
  (vertex, intercepts).
- **Algebra 2:** completing the square + vertex form; polynomial functions
  (end behavior, zeros, Factor Theorem); function transformations & piecewise;
  complex numbers.
- **Geometry:** quadrilaterals & polygon angle sums; coordinate geometry
  (midpoint, equation of a circle); transformations.
- **Calculus 1:** L'Hôpital's rule; linear approximation & differentials;
  Mean Value Theorem.
- **Calculus 2:** partial fractions; improper integrals; Taylor/Maclaurin
  series; arc length; trig integrals & trig substitution.
- **Calculus 3:** lines & planes in space; vector-valued functions & motion;
  multivariable chain rule; cylindrical/spherical coordinates; **vector
  calculus block** (fields, line integrals, Green's/Stokes'/Divergence) — the
  largest remaining unit anywhere in the app.
- **Differential Equations:** exact equations & substitutions (Bernoulli);
  systems of ODEs (ties into LinAlg eigenvalues); Laplace transforms;
  forced oscillations & resonance.
- **Matrix Algebra:** transpose & symmetric matrices; Cramer's rule.
- **Linear Algebra:** Gram–Schmidt & QR; complex eigenvalues.
- **New subject — Statistics & Probability:** the most "applied" math there is;
  strong fit for MathGym's positioning. Descriptive stats, probability rules,
  distributions, inference intro.

### 15.2b Wave 2 — user-directed additions (2026-07-01)

Requested explicitly (overriding the P3 cut for proofs):

| Subject | New topic | Notes |
|---|---|---|
| Geometry | **Introduction to Proof and Logical Reasoning** | Structured two-column proofs as checkable steps: statement/reason pairs (reason names graded as exact strings with accept lists), angle-chasing numerics, congruence criteria |
| Calculus 3 | **Vector Proofs and Identities** | Component-based proofs of dot/cross identities — the polynomial-equivalence grader can verify the algebra steps symbolically |
| **Cryptography** (new subject, 6 topics) | Modular Arithmetic · GCD, Primes, and the Euclidean Algorithm · Modular Exponentiation and Fermat–Euler (incl. Diffie–Hellman) · RSA: Public-Key Encryption · Symmetric Ciphers and Finite Fields (AES) · Elliptic Curve Cryptography | The math behind AES-256, RSA, ECC, and friends. Nearly everything is integer arithmetic mod n — ideal for the grader. Toy-sized keys for hand computation; lectures connect each mechanism to the real 256-bit/2048-bit deployments |

### 15.2c Wave 3 — plotting + cryptographic weaknesses (2026-07-01, user-directed)

- **SVG plotting engine** (`js/plot.js`) — dependency-free, theme-aware, with a
  tiny safe expression evaluator. Modes: `cartesian` (function curves, points,
  segments), `elliptic` (the real two-branch y²=x³+ax+b curve with chord/tangent
  construction), `modLattice` (curve points over Z_p). Authored via fenced
  ```plot blocks in lectures or a `plot` field on a problem. Graphs + graph-reading
  practice added to: `algebra.graphing-linear-equations`,
  `trigonometry.sine-cosine-graphs`, `algebra-2.exponential-functions`,
  `calculus-1.analyzing-functions`, `differential-equations.introduction`, and
  `cryptography.ecc` (the real elliptic-curve visual + mod-p point cloud).
- **`cryptography.crypto-weaknesses`** — "How Cryptography Breaks": keystream/nonce
  reuse, ECB pattern leakage, ECDSA nonce-reuse private-key recovery (the Sony PS3
  break), and textbook-RSA misuse, all hand-computable. References four verified
  posts from **Soatok's Dhole Moments** (soatok.blog) — the user's gold-standard
  source — as the authoritative further reading on cryptographic misuse.

### 15.3 P3 — deliberate scope cuts

- Conic sections; abstract vector spaces; SVD; LU decomposition; series
  solutions of ODEs; parametric/polar calculus. Theory-heavy relative to
  MathGym's applied-first charter, or (for symbolic work like SVD) beyond what
  the grader can verify without major upgrades. (Formal proof was originally
  cut here, then added back by explicit request — see §15.2b.)

### 15.4 Grader notes for the P1 wave

Symbolic trig/exp/log is still unverifiable (PROGRESS §3), so the new topics
author around it: unit-circle values grade as exact fractions or numeric
$\pi$/√ expressions (`evalNumeric` handles those); implicit-differentiation
slopes grade via the rational-expression engine (`-x/y` etc.); transcendental
derivatives grade at evaluation points or as exact strings with `accept`
lists; nonhomogeneous DE steps solve for numeric undetermined coefficients;
diagonalization grades eigenvalues as solution sets and $P$/$D$/$A^k$ as
matrices (with a stated eigenvalue order).
