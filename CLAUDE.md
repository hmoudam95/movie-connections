# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React)
```bash
npm start          # Start React development server (localhost:3000)
npm run build      # Build for production
npm test           # Run React tests
```

### Backend (Local Development)
```bash
cd server && npm start    # Start Express server (localhost:4000)
```

### Database Operations
```bash
node populateDatabase.js           # Populate local Neo4j with TMDB movie data
node scripts/migrateToCloud.js     # Migrate data from local to cloud Neo4j
```

## Architecture Overview

### Hybrid Backend Architecture
The project uses a **dual backend approach**:
- **Local Development**: Express.js server (`server/index.js`) running on port 4000
- **Production**: Vercel API Routes (`api/path.js`) for serverless deployment

Both backends share identical core logic for Neo4j operations and TMDB API integration.

### Key Components

**Frontend (`src/App.js`)**:
- Single-page React application with three game states: setup, playing, complete
- Integrates TMDB API for movie search and details
- Manages game state and movie-actor chains
- Calls backend `/api/path` endpoint for shortest path calculations

**Backend Endpoints**:
- `GET /api/path?fromMovieId={id}&toMovieId={id}` - Returns shortest path between movies
- Auto-upserts movies and actors to Neo4j if they don't exist
- Uses Neo4j's shortestPath algorithm for optimal solutions

**Database Schema (Neo4j)**:
- `Movie` nodes: `{id, title, poster_path, release_date}`
- `Actor` nodes: `{id, name, profile_path}`
- `ACTED_IN` relationships: `(Actor)-[:ACTED_IN]->(Movie)`

### Environment Configuration

**Development**: Uses local Neo4j instance
**Production**: Uses Neo4j AuraDB cloud instance

Environment variables are handled differently:
- Local development: `.env` file
- Production: Vercel environment variables

### UI/Animation Stack
- **Framer Motion**: 3D hover effects and animations
- **Tailwind CSS**: Utility-first styling with custom components
- **Component Library**: Located in `src/components/ui/` with reusable MovieCard, Button, Modal, etc.

## Database Population

The `populateDatabase.js` script fetches popular movies from TMDB and populates the local Neo4j database. It:
1. Fetches 50 pages of popular movies (1000+ vote count)
2. For each movie, fetches detailed credits
3. Creates Movie nodes and Actor nodes with ACTED_IN relationships

## Deployment Architecture

**Vercel Configuration** (`vercel.json`):
- Static build for React frontend
- Serverless functions for API routes
- Environment variable mapping for Neo4j credentials

**API Route Logic**:
- Detects environment (local vs Vercel) using `process.env.VERCEL`
- Switches between local and cloud Neo4j configurations automatically
- Handles CORS for cross-origin requests

## Game Logic Flow

1. **Setup**: User selects/randomizes start and target movies
2. **Playing**: User navigates through actors to build movie chain
3. **Path Finding**: Backend calculates shortest path using Neo4j graph algorithms
4. **Completion**: Game ends when user reaches target movie

The shortest path algorithm runs automatically when the game starts and provides hints on demand.