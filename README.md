# 🎬 Movie Connections Game

A modern web-based game that challenges players to connect movies through shared actors using the shortest path algorithm. Built with React, Neo4j graph database, and featuring Netflix-style 3D UI effects.

## 🎯 Game Rules

1. **Select Movies**: Choose a starting movie and a target movie
2. **Find Connections**: Navigate through actors and their filmographies
3. **Build Your Path**: Create the shortest chain between the two movies
4. **Get Hints**: Use the shortest path algorithm to see optimal solutions
5. **Compete**: Try to complete the chain in as few steps as possible!

## ✨ Features

### 🎮 Core Gameplay
- **Movie Search**: Real-time search using The Movie Database (TMDB) API
- **Random Selection**: Auto-generate starting and target movies
- **Visual Chain**: Beautiful breadcrumb-style path visualization
- **Actor Filmographies**: Browse complete movie lists for each actor
- **Shortest Path Hints**: Get optimal solutions using Neo4j graph algorithms

### 🎨 Modern UI/UX
- **Netflix-Style Design**: Cinematic 3D hover effects with Framer Motion
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark Theme**: Movie game aesthetic with neon accents
- **Smooth Animations**: Particle effects, glowing borders, and micro-interactions
- **Glass Morphism**: Modern backdrop blur and gradient overlays

### 🗄️ Database & Backend
- **Neo4j Graph Database**: 2036+ movies with actor relationships
- **Shortest Path Algorithm**: Efficient graph traversal for optimal solutions
- **Hybrid Architecture**: Local development + cloud production deployment
- **Real-time Data**: Dynamic movie and actor data from TMDB API

## 🚀 Live Demo

**Production**: [Your Vercel URL here]
**Local Development**: [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### Frontend
- **React 19.0.0** - Modern React with hooks
- **Framer Motion** - 3D animations and interactions
- **Tailwind CSS** - Utility-first styling
- **Headless UI** - Accessible component primitives
- **Heroicons** - Beautiful SVG icons

### Backend & Database
- **Neo4j AuraDB** - Cloud graph database (production)
- **Neo4j Local** - Local development database
- **Express.js** - API server (local development)
- **Vercel API Routes** - Serverless functions (production)

### APIs & Services
- **TMDB API** - Movie and actor data
- **Vercel** - Frontend hosting and serverless backend
- **GitHub** - Version control and CI/CD

## 📦 Installation & Setup

### Prerequisites

- **Node.js** (version 18.x or later)
- **npm** or **yarn** package manager
- **TMDB API key** ([Get one here](https://www.themoviedb.org/settings/api))
- **Neo4j Database** (local or cloud)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hmoudam95/movie-connections.git
   cd movie-connections
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   # TMDB API
   TMDB_API_KEY=your_tmdb_api_key_here
   
   # Local Neo4j (Development)
   LOCAL_NEO4J_URI=bolt://localhost:7687
   LOCAL_NEO4J_USER=neo4j
   LOCAL_NEO4J_PASSWORD=your_local_password
   
   # Cloud Neo4j (Production - AuraDB)
   NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_cloud_password
   
   # React App
   REACT_APP_API_BASE_URL=
   PORT=4000
   ```

4. **Set up local Neo4j database**
   ```bash
   # Start your local Neo4j instance
   # Then populate with movie data
   node populateDatabase.js
   ```

5. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   cd server && npm start
   
   # Terminal 2: Start frontend
   npm start
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Production Deployment

#### Option 1: Vercel (Recommended)

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Set up Neo4j AuraDB**
   - Create a free account at [neo4j.com/aura](https://neo4j.com/aura)
   - Create a new database instance
   - Run the migration script:
     ```bash
     node scripts/migrateToCloud.js
     ```

3. **Configure Vercel environment variables**
   In your Vercel dashboard, add:
   ```env
   NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   TMDB_API_KEY=your_tmdb_api_key
   ```

4. **Deploy**
   - Vercel will automatically deploy on git push
   - API routes will be available at `/api/path`

#### Option 2: Other Platforms
- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)
- **Heroku**: [heroku.com](https://heroku.com)

## 🎨 Design System

The project includes a complete design system with reusable components:

### UI Components
- **MovieCard** - Netflix-style 3D movie cards with hover effects
- **Button** - Multiple variants with animations
- **Modal** - Accessible dialog components
- **Toast** - Notification system
- **Card** - Flexible container components

### Animations
- **3D Hover Effects** - Realistic card rotation and perspective
- **Particle Systems** - Floating particles on interaction
- **Micro-interactions** - Smooth transitions and feedback
- **Loading States** - Skeleton screens and spinners

## 📊 Database Schema

### Nodes
- **Movie**: `{id, title, poster_path, release_date}`
- **Actor**: `{id, name, profile_path}`

### Relationships
- **ACTED_IN**: `(Actor)-[:ACTED_IN]->(Movie)`

### Sample Queries
```cypher
// Find shortest path between movies
MATCH (start:Movie {id: "123"}), (end:Movie {id: "456"})
MATCH p = shortestPath((start)-[:ACTED_IN*]-(end))
RETURN [n IN nodes(p) | {id: n.id, title: n.title, type: labels(n)[0]}] AS chain
```

## 🔧 Available Scripts

```bash
# Development
npm start          # Start React development server
npm run build      # Build for production
npm test           # Run tests

# Database
node populateDatabase.js     # Populate local Neo4j with TMDB data
node scripts/migrateToCloud.js  # Migrate data to cloud database

# Backend (local development)
cd server && npm start       # Start Express.js server
```

## 🎯 Game Features

### Core Mechanics
- **Movie Selection**: Search or random selection
- **Actor Navigation**: Browse cast members
- **Path Building**: Visual chain construction
- **Hint System**: Optimal path suggestions
- **Progress Tracking**: Step counter and completion status

### Advanced Features
- **Shortest Path Algorithm**: Neo4j graph traversal
- **Real-time Search**: Instant movie and actor lookup
- **Responsive Design**: Mobile and desktop optimized
- **Accessibility**: Screen reader support and keyboard navigation

## 🚀 Performance

- **Frontend**: Optimized React build with code splitting
- **Backend**: Serverless functions for scalability
- **Database**: Indexed Neo4j queries for fast pathfinding
- **CDN**: Global content delivery via Vercel

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TMDB** for providing comprehensive movie data
- **Neo4j** for the powerful graph database platform
- **Vercel** for seamless deployment and hosting
- **Framer Motion** for amazing animation capabilities
- **Tailwind CSS** for the utility-first styling approach

---

**Built with ❤️ for movie lovers and puzzle enthusiasts!** 🎬✨