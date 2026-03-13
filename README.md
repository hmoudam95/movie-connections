# Movie Connections

Connect two movies through shared actors in the fewest steps possible. A graph-powered puzzle game that uses real movie data and shortest-path algorithms to generate solvable challenges.

**Live at [movie-connections.vercel.app](https://movie-connections.vercel.app)**

## How to Play

1. Two random movies are selected — a **start** and a **target**
2. You see the cast of your current movie
3. Pick an actor, then pick one of their other films — that film becomes your new current movie
4. Repeat until you reach the target movie
5. The game tracks your **steps** (movies visited) and **moves** (selections made)

### Difficulty

| Mode   | Moves Allowed |
|--------|---------------|
| Easy   | 8             |
| Normal | 6             |
| Hard   | 4             |

Run out of moves and the game reveals the optimal path you missed.

### Hints

Three graduated tiers, each costing one move:

1. **Hint 1** — Number of steps in the shortest path
2. **Hint 2** — Name of the connecting actor for the next step
3. **Hint 3** — The exact next movie to pick

Hints are fetched in the background so they respond instantly when requested.

### Undo

Take back your last move at no cost. Only available when you've made at least one step.

## Features

- **Step limit & move economy** — every action counts, hints trade moves for information
- **Cinema Dark UI** — dark theme with gold accents, ticket-stub stats, confetti victory screen
- **Horizontal chain rail** — animated path visualization with poster thumbnails and actor connector circles
- **Filmography search** — filter an actor's films by title when browsing large filmographies
- **Mobile-first** — tested on iPhone 14 (390x844) and Galaxy S23 (360x780), 44px touch targets
- **Animated transitions** — page transitions via AnimatePresence, staggered cast grids, spring-based chain building, move dot pulse, hint reveal expand
- **Accessibility** — `prefers-reduced-motion` disables all animations
- **Neo4j shortest path** — graph database with 55,877 nodes and 79,048 relationships powers the hint system and game-over path reveal

## Tech Stack

| Layer      | Technology                                    |
|------------|-----------------------------------------------|
| Frontend   | React 19, Framer Motion, Tailwind CSS + custom CSS |
| Backend    | Vercel serverless functions (production), Express.js (local dev) |
| Database   | Neo4j AuraDB (cloud graph database)           |
| Data       | TMDB API (movie search, cast, filmographies, images) |
| Hosting    | Vercel                                        |

## Project Structure

```
src/
  App.js                    # Root component, AnimatePresence screen routing
  App.css                   # All game styles (Cinema Dark theme)
  screens/
    SetupScreen.jsx         # Movie selection + difficulty picker
    GameBoard.jsx           # Main gameplay — cast grid, filmography, hints, chain rail
    VictoryScreen.jsx       # Win screen — confetti, stats ticket, share
    GameOverScreen.jsx      # Loss screen — optimal path reveal, player journey
  components/
    ChainDisplay.jsx        # Horizontal chain rail + legacy list mode
    ActorImage.jsx          # Actor photo with initials fallback
    CastOverlay.jsx         # Cast browsing overlay
    ErrorState.jsx          # Error display with retry
  state/
    gameReducer.js          # Game logic — moves, chain, hints, undo, difficulty
    uiReducer.js            # UI state — loading, errors, overlays
  hooks/
    useHintSystem.js        # Background hint fetching + graduated reveal
    useMovieAPI.js          # TMDB API calls (search, cast, filmography)
    useMobile.js            # Mobile detection
  utils/
    constants.js            # TMDB base URLs, config
  styles/
    animations.css          # Animation utility classes
api/
  path.js                   # Vercel serverless — Neo4j shortest path query
server/
  index.js                  # Express.js dev server (same logic as api/path.js)
```

## Local Development

### Prerequisites

- Node.js 18+
- A [TMDB API key](https://www.themoviedb.org/settings/api)
- Neo4j database (local install or [AuraDB free tier](https://neo4j.com/aura))

### Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_TMDB_API_KEY=your_tmdb_key
TMDB_API_KEY=your_tmdb_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

`REACT_APP_TMDB_API_KEY` is used by the frontend (CRA requirement). `TMDB_API_KEY` is used by the backend. Both can be the same key.

### Run

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Terminal 1 — backend (port 4000)
cd server && npm start

# Terminal 2 — frontend (port 3000, proxies /api to 4000)
npm start
```

### Populate Database

```bash
node populateDatabase.js           # Local Neo4j
node populateAuraDatabase.js       # Cloud AuraDB
node scripts/migrateToCloud.js     # Migrate local → cloud
```

## Database Schema

```
(:Movie {id, title, poster_path, release_date})
(:Actor {id, name, profile_path})
(:Actor)-[:ACTED_IN]->(:Movie)
```

Single API endpoint: `GET /api/path?fromMovieId={id}&toMovieId={id}` — returns the shortest actor-movie chain. Auto-upserts both movies and their full cast before querying.

## Roadmap

- **Phase B** — Player stats, win streaks, personal best tracking
- **Phase C** — Challenge a friend via shareable URL
- **Phase D** — Global leaderboard

## License

MIT

## Acknowledgments

- [TMDB](https://www.themoviedb.org/) for movie data
- [Neo4j](https://neo4j.com/) for the graph database
- [Vercel](https://vercel.com/) for hosting
- [Framer Motion](https://www.framer.com/motion/) for animations
