# Space Mode — Feasibility & Build Plan

> Status: **feasibility approved, planning** · Owner decision: "Constrain + dynamic-gradient compass" · Last updated: 2026-06-26
> Companion docs: [GAMEPLAY-REVIEW.md](./GAMEPLAY-REVIEW.md)

A next-level, opt-in gameplay mode for Movie Connections: a spatial "space"-themed board where you travel from the start movie to the target through floating actor/movie bubbles, with the connecting strings glowing **greener the closer you are to the shortest path** and **redder the further you stray**.

---

## 1. The vision (as described)

You see the two movies you're connecting. Under the start movie, its actors appear as **floating face-bubbles** tied to the movie by **strings**. On iPhone you touch an actor's face and reveal that actor's filmography as a scrollable column of floating movie-bubbles; you travel to the film you think connects, touch it, and its actors bubble out — recursively — until you reach the target. The strings are **color-coded by how close you are to the optimal path**. Everything floats in space, smooth and physics-y. Going backward is dynamic (the path isn't fixed). It should **feel like a journey**.

---

## 2. Feasibility verdict — ✅ YES (as an opt-in mode, with 3 reframes)

Based on a multi-dimension feasibility study (algorithm, mobile rendering, interaction, data/backend, scope) plus adversarial review.

| Dimension | Verdict |
|---|---|
| Path-strength algorithm | ✅ feasible (reframe the algorithm) |
| Mobile rendering @ 60fps | ✅ feasible (specific architecture required) |
| Touch interaction & UX | ⚠️ partially — the single gesture must be decoupled |
| Data / backend | ✅ feasible (forces the "notable films" constraint) |
| Scope / phasing | ✅ feasible as a coexisting "Space mode" |

**The big enabler:** the existing `gameReducer` already models this. `SELECT_ACTOR` = expand an actor, `SELECT_MOVIE` = travel to a film (recurse), `UNDO_MOVE` = go backward. Space mode is a **rendering + interaction swap over the same game brain**, not a logic rewrite.

---

## 3. The three reframes from the literal idea

1. **"Find all possible routes" → one BFS distance-field.** Enumerating all routes between two movies is computationally intractable (#P-hard; ~10⁹–10¹⁵ paths at this branching factor). You don't need it. Compute **shortest-distance-to-the-target once** — a single BFS rooted *at the target*. The target never moves, so this distance field is **static for the entire game** and needs *zero* recompute as the player wanders or undoes. Coloring a string is then an O(1) lookup of a precomputed number.

2. **The "two graphs" problem → resolved by the constraint decision (below).** You can only color a film the solver graph knows about. Today gameplay browses the full live TMDB graph but the solver is the curated Neo4j subgraph — so obscure films would mis-color. Fixed by constraining the playable set.

3. **The single slide-gesture must be decoupled.** Conflating select + reveal + scroll + undo onto one vertical drag is undiscoverable and fights native scroll (TMDB actors have 40–150+ credits). Use **tap-to-select + native scroll-to-browse + explicit undo**; the thumb-swipe is an *additive accelerator*, never the only path to an action.

---

## 4. Decisions locked

- **Constrain the playable space to "notable" films** (the Neo4j / `vote_count`-threshold set). Makes colors always accurate, filmographies clean, and gives one difficulty knob. (Also the #1 fix from the gameplay review — Space mode pays down existing debt.)
- **Color = a live, dynamic GRADIENT compass.** Continuous green→amber→red by closeness (see §5). *(Updated from an earlier 3-tier default per owner request.)*
- **Coexist** as an opt-in mode — `SpaceBoard.jsx` sibling to `GameBoard.jsx`; never replace the proven daily/share board.
- **Phase-1 defaults** (all easily changed): device floor iPhone 11+; cap the visible fan to ~12–18 top-billed bubbles with a "show more"; no Neo4j GDS dependency (batched Cypher `shortestPath` or a downloaded-adjacency BFS); distance field computed once per game from the static target.

---

## 5. The color compass — dynamic gradient (owner's spec)

The closer a choice gets you to the target, the **greener and lighter** the string; the further, the **redder**. Continuous, not stepped.

**Inputs:** for each visible candidate node, `dist(node)` = shortest hops to the target (from the static BFS field). Let `dBest` = the smallest `dist` among the current options (a geodesic move) and `dCur` = distance from where you stand.

**Mapping (per string):**
```
t = clamp01( (dWorst - dist(node)) / (dWorst - dBest) )   // 1 = on shortest path, 0 = worst shown
hue        = lerp(0°  red → 45° amber → 135° green, t)     // continuous
lightness  = lerp(46% → 64%, t)                            // closer = lighter, per spec
saturation = ~70%
```
- `dist === Infinity` (unreachable / outside the known graph) → render **neutral grey**, *not* red (honest "unknown," avoids false signal). With the constraint in §4 this is rare.
- Because the graph is bipartite, movie→actor→movie is **2 hops**; compare distances in steps of 2 (or run BFS on the movie-projected graph so distances are clean movie-hops).

**Accessibility (mandatory — hue alone fails ~8% of men):** encode strength *redundantly* —
- **Thickness:** thicker string = closer.
- **Glow/opacity:** brighter = closer.
- **Optional dash pattern** for far/cold strings.
- **Text + `aria-live`:** on focus/tap, announce "on the shortest path" / "a step closer" / "moving away."

This keeps the beautiful gradient as the *primary* delight while staying legible for everyone.

---

## 6. The "journey" feel — do we need three.js / real 3D?

**Short answer: not for v1 — and probably not at all to get a strong journey feel.** Here's the honest trade.

**You can make it feel like a real journey *without* WebGL/three.js, using cheap "2.5D":**
- **Parallax starfield** — 2–3 drifting star layers at different speeds (Canvas2D or CSS). Instant "we're in space, and moving."
- **Depth cues** — bubbles further "back" are smaller, dimmer, slightly blurred (`scale` + `opacity` + `blur`). Fakes 3D convincingly.
- **Camera travel** — when you pick a film, the viewport *flies* to the new constellation (a transform pan/zoom with spring easing). This is the core "journey" beat and it's pure `transform`.
- **Inertia & easing** — momentum on scroll/drag so motion feels physical, not digital.

All of the above hold 60fps on mobile Safari and use libraries already installed (`@react-spring/web`, `@use-gesture/react`).

**When three.js / react-three-fiber is actually worth it (Phase 3, optional):**
- True 3D constellations (nodes orbiting in real perspective), depth-of-field, a camera that literally flies *through* a 3D star map.
- Cost: heavier (perf risk on mobile Safari with many textured nodes; +3–5 weeks; ongoing GPU/memory tuning) and it buys little at our small node budget (~12–18 bubbles).

**Recommendation:** build the journey with 2.5D first (Phases 1–2). It will already feel cinematic. Treat real-3D three.js as a *Phase 3 upgrade* only if the 2.5D version doesn't satisfy the dream — at which point we'd swap the background/camera layer, not rebuild the game.

---

## 7. Architecture

```
App.js ──(same props, same gameReducer)──┬── GameBoard.jsx   (current "puzzle" board)
                                         └── SpaceBoard.jsx  (NEW — opt-in "Space mode")
```

- **`SpaceBoard.jsx`** is a sibling that consumes the *same* props and dispatches the *same* actions (`SELECT_ACTOR`, `SELECT_MOVIE`, `UNDO_MOVE`). A `mode`/route toggle picks which board renders. No new game state.
- **Render stack (the part that keeps 60fps):**
  - **Bubbles:** DOM elements — one `<div>` per actor/movie with a CSS `background-image` circle (reuses the `ActorImage`/TMDB pipeline). Animate **only** `transform` / `opacity`. *No* WebGL textures.
  - **Strings:** ALL connectors drawn on **one `<canvas>`** (a single `requestAnimationFrame` loop redrawing lines from a shared positions ref). Color = per-line `strokeStyle` (the gradient is free here). *Never* N animated SVG paths.
  - **Layout:** computed **once per level** (radial/sunflower fan under the current movie, or a few force iterations that *stop* once settled). Springs only for entrance, idle bob, and the active drag — **no continuously-running physics sim** (that's the one thing Safari chokes on).
  - **Background:** parallax starfield (Canvas2D or CSS), static or slow-drift.
- **State for layout/positions** lives in refs (shared between the spring and the canvas loop) to avoid React re-renders per frame.

---

## 8. The distance-field algorithm (the compass engine)

1. **Once per game**, compute `dist(node)` = shortest hops to the **target** for every reachable node, via BFS *from the target outward*. O(V+E), sub-second on the ~56k/79k graph. Static for the whole game.
2. The player stands on `currentMovie` (distance `dCur`). Each candidate actor → film is 2 hops away.
   - **Greener / lighter** as `dist(candidate)` approaches `dCur − 2` (on a geodesic).
   - **Amber** for lateral moves (no progress).
   - **Redder** as `dist(candidate) ≥ dCur + 2` (moving away).
   - **Grey** for `Infinity` (unknown / out of graph).
3. Color an **actor face-bubble** by the *best* film reachable through it (`min dist` over that actor's notable films) so the face glows even before you expand it.
4. **Undo / dynamic path** needs zero new computation — the field is anchored to the static target, not the moving current node.

---

## 9. Backend changes (small)

- **`/api/distances?toMovieId=`** (new) — returns the distance field `{ nodeId: dist }` for nodes within radius ≤ 8 of the target, computed once and cached client-side for the game. *Or* the no-backend variant: ship the ~4k-node curated adjacency to the client and BFS in JS (instant undo/redo, zero per-move latency).
- **Notable-films filmography** — gameplay must read cast/filmography from the **Neo4j curated set** (or filter TMDB results to it), not raw TMDB credits, so every shown bubble is colorable. (`CAST_LIMIT`/popularity-scoped; extend `useMovieAPI`.)
- **No change** to the core per-move data path (cast + filmography are already fetched).
- **Graph completeness:** ensure puzzles stay solvable within the constrained set (deeper `populate.js` coverage; the cron already grows it).

---

## 10. Phased plan (~5–8 weeks, solo + AI; magical early)

### Phase 1 — the cheapest magical cut (~2–2.5 weeks)
- `SpaceBoard.jsx` behind a "Space mode" toggle, reusing `gameReducer` + `useMovieAPI`.
- 2.5D layout: radial fan of DOM bubbles under the current movie; **tap to expand/collapse** (no drag yet).
- **Canvas strings** with the **dynamic gradient compass** + redundant encoding (thickness/glow/aria).
- Distance field via the new `/api/distances` (or client-side BFS).
- Constrain shown films to the notable set.
- Parallax starfield background + camera-pan transition on travel.
- Ship behind the toggle; A/B against the classic board.

### Phase 2 — physics & gesture polish (~2–3 weeks)
- Spring float / idle bob; **drag-to-reveal** thumb gesture as an accelerator (tap still works).
- List **virtualization** for long filmographies; paging / "show more" beyond the top ~12–18.
- Mobile-Safari perf tuning (image loading, canvas redraw budget), reduced-motion + colorblind QA.

### Phase 3 — full immersion (~1–2 weeks, optional)
- WebGL/three.js starfield + parallax depth, or real-3D constellation + fly-through camera — *only* if 2.5D doesn't satisfy the journey.

---

## 11. Open decisions (defaults chosen; revisit anytime)

| Question | Default |
|---|---|
| Min device | iPhone 11+ |
| Visible bubble cap | top ~12–18 billed, "show more" for the rest |
| Color granularity | **continuous gradient** (owner-confirmed) |
| Distance compute | client-side BFS on downloaded adjacency (no GDS) |
| Replace or coexist | **coexist** (opt-in toggle) |
| Reveal color live or after | **live** (compass) |

---

## 12. Top risks

- **Mobile perf** if anyone reaches for a continuous physics sim or 40+ WebGL textures — mitigated by the static-layout + canvas-strings + capped-count architecture.
- **Coloring trivializing the puzzle** — a live compass *does* guide the player; acceptable for the cozy/casual lane, and Daily can offer a "no-compass" hard variant later.
- **Graph completeness** — constraining to notable films must not make puzzles unsolvable; keep growing the populated graph.
- **Accessibility** — never ship color-only; the redundant encodings in §5 are mandatory.
