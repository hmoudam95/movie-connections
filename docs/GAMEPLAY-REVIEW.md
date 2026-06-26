# Gameplay & Mechanics Review

> A design review of the core loop, what a "step" is, the key structural issue, and v2 ideas. Last updated: 2026-06-26.
> Companion: [SPATIAL-MODE.md](./SPATIAL-MODE.md)

## 1. What a "step" is

The game is a walk on a **bipartite graph**: Movie nodes and Actor nodes, edges = "acted in." The chain alternates **movie → actor → movie**.

- **A step / move = arriving at a new *movie*** (`movesUsed++` on `SELECT_MOVIE`).
- **The actor is the *edge* (the bridge), not a step** — you don't spend anything passing through it; you spend a move when you *land* on the next movie.

**Terminology bug:** the UI uses two words for one thing — the header says "moves," the victory ticket says "Steps Used / Moves Left," and `movesUsed` is incremented by *both* movie-picks *and* hint costs. Pick one vocabulary. Suggestion: **Hops** (movies in the chain) is the score; hints are tracked separately as a penalty.

## 2. The #1 structural issue — two different graphs

| | Graph |
|---|---|
| Gameplay (cast / filmography browsing) | **Full live TMDB** — every movie/actor/credit |
| Par / hints / optimal-path | **Curated Neo4j subgraph** — popular movies only |

Consequences: **par can be wrong** (a shorter path may exist via films not in Neo4j), the game-over "optimal path" can route through **unfindable deep cuts**, and filmographies are **noisy** (voice/TV/uncredited).

**Highest-leverage fix:** constrain the playable space to **notable films** (a `vote_count`/popularity threshold = the same set populated into Neo4j). One change fixes par accuracy + filmography noise + hint findability + gives a single difficulty knob. *(This is also a prerequisite for [Space Mode](./SPATIAL-MODE.md) coloring.)*

## 3. Logic / clarity fixes

- Unify "moves" vs "steps"; make the score legible.
- **Decouple hint cost from the move runway** (own budget or a score penalty) — today a hint literally shortens your path to the target.
- **Win-adjacency detection** — when the current movie shares an actor with the target, surface "you're one away."
- Block revisiting a movie already in the chain / reusing the same actor (prevents trivial loops).

## 4. Core loop — strengths & weaknesses

**Strengths:** recognition not recall (options are shown, so it's accessible); the "aha" of spotting a bridge actor; undo as a safety net; graduated hints.

**Weaknesses:** no directional feedback (you can wander away blindly); choice overload + no cast search; the actor is a throwaway click; win is binary and silent about quality; knowledge cliff for new players (no onboarding).

## 5. Dynamics — ways to change the feel (ranked)

1. **Directional "compass"** — graph distance to target as warmer/colder. *(This is the heart of [Space Mode](./SPATIAL-MODE.md).)*
2. **Constraint daily modifiers** — "2010s only," "no Marvel," "must pass a Best Picture winner." Huge for variety/replay/identity.
3. **Obscurity scoring** — bridging via a rarer actor/film scores higher → skill ceiling + leaderboard.
4. **Meet-in-the-middle** — build from both ends and connect in the middle (how humans actually solve it).
5. **Recall / hard mode** — hide filmographies → a trivia challenge.
6. **Actor as a resource** — limited "star tokens" / use-once, making the connection a real decision.

## 6. Additions to perfect it

- **Onboarding** — a ghosted first move.
- **"Best possible" reveal on win** — "you did it in 4; the shortest was 2 →" + the optimal path. Uses the existing path engine; biggest replay driver, nearly free.
- **Cast / filmography search** — find an actor by name in a huge cast.
- **Connection trivia** — "reunited 11 years after Titanic." Turns a lookup into a moment.
- **Challenge-a-friend** on the daily; **a soft "nudge"** tier below hints.

## 7. Recommended v2

1. **Unify the graph** (notable-films threshold) — fixes correctness, noise, and difficulty at once.
2. **Directional feedback + one-away detection** — kills blind wandering, lands the climax.
3. **Constraint dailies + the "best possible" win reveal** — variety, identity, replay.
4. Plus the **moves/steps cleanup** and decoupling hint cost from the runway.

This deepens the *strategy* while keeping the *"the info is in front of you"* friendliness that makes it broadly playable. The ambitious [Space Mode](./SPATIAL-MODE.md) is a separate, opt-in track that builds on #1 and #2.
