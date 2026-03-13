# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React)
```bash
npm install        # Install frontend dependencies
npm start          # Start React dev server (localhost:3000), proxies /api to localhost:4000
npm run build      # Build for production
npm test           # Run React tests (Jest + React Testing Library, interactive watch mode)
npm test -- --watchAll=false   # Run tests once (CI mode)
```

### Backend (Local Development)
```bash
cd server && npm install   # Install backend dependencies (separate package.json)
cd server && npm start     # Start Express server (localhost:4000)
```

Both the frontend and backend must run simultaneously for local development. The frontend's `proxy` field in `package.json` forwards `/api` requests to `localhost:4000`.

### Database Operations
```bash
node populateDatabase.js           # Populate local Neo4j with TMDB movie data
node populateAuraDatabase.js       # Populate Neo4j AuraDB cloud instance
node scripts/migrateToCloud.js     # Migrate data from local to cloud Neo4j
```

## Architecture Overview

### Dual Backend
- **Local**: Express.js server (`server/index.js`) on port 4000
- **Production**: Vercel serverless function (`api/path.js`)

Both implement the same logic: upsert movies/actors from TMDB into Neo4j, then run `shortestPath` queries. The Vercel route detects its environment via `process.env.VERCEL` and switches Neo4j credentials accordingly.

### Single API Endpoint
`GET /api/path?fromMovieId={id}&toMovieId={id}` — Returns the shortest actor-movie chain between two movies. Auto-upserts both movies and their full cast into Neo4j before querying.

### Frontend (`src/App.js`)
Single-file React app (no router). All game logic lives in one component with three states: `setup`, `playing`, `complete`. Uses TMDB API directly for movie search, cast browsing, and actor filmographies. The TMDB API key is provided via `REACT_APP_TMDB_API_KEY` env var.

Background hint fetching starts 2 seconds after gameplay begins, caching the shortest path result so the hint button responds instantly when clicked.

### Database Schema (Neo4j)
- `Movie` nodes: `{id, title, poster_path, release_date}`
- `Actor` nodes: `{id, name, profile_path}`
- `ACTED_IN` relationships: `(Actor)-[:ACTED_IN]->(Movie)`

### Environment Variables
Local dev uses a `.env` file in the project root. Required vars:
- `TMDB_API_KEY` — for backend TMDB calls
- `REACT_APP_TMDB_API_KEY` — for frontend TMDB calls (must have `REACT_APP_` prefix for CRA)
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD` — Neo4j connection
- `PORT` — backend port (default 4000)

Production uses Vercel environment variables with the same names (minus `REACT_APP_` prefix handled by Vercel config).

### UI Stack
- **Framer Motion** + **@react-spring/web** + **@use-gesture/react**: Animations, 3D hover effects, swipe gestures
- **Tailwind CSS**: Styling with custom theme in `tailwind.config.js` (custom color palettes, gradients, animations)
- **Custom CSS**: `src/App.css` for game-specific styles, `src/styles/animations.css` for animation utilities
- **Component library**: `src/components/ui/` — reusable MovieCard, Button, Modal, Toast, Card components (exported via barrel `index.js`)
