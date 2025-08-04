# 🎬 Movie Connections Game

A sophisticated web-based game that challenges players to connect movies through shared actors using graph algorithms. Built with React 19, Neo4j AuraDB, and featuring a modern UI with skeleton loading states, error handling, and beautiful actor placeholders.

## 🎯 Game Rules

1. **Random Movies**: Get two random popular movies to connect
2. **Find Connections**: Navigate through actors and their filmographies  
3. **Build Your Path**: Create the shortest chain between the movies
4. **Get Hints**: Use Neo4j's shortest path algorithm for optimal solutions
5. **Achieve Victory**: Complete the connection and see your performance stats!

## ✨ Features

### 🎮 Core Gameplay
- **Random Movie Selection**: Auto-generated popular movies from TMDB
- **Smart Actor Navigation**: Browse complete filmographies with loading states
- **Visual Chain Building**: Beautiful breadcrumb-style path visualization
- **On-Demand Hints**: Get optimal solutions using Neo4j graph algorithms
- **Achievement System**: Performance-based scoring with celebration animations

### 🎨 Modern UI/UX
- **Professional Design System**: CSS custom properties with modern styling
- **Skeleton Loading States**: Smooth placeholders for all content
- **Actor Image Placeholders**: Beautiful gradient tiles with initials for missing photos
- **Error Handling**: Graceful error states with retry functionality
- **Responsive Animations**: Staggered grid animations and smooth transitions
- **Victory Celebrations**: Animated achievement system with social sharing

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
- **React 19.0.0** - Modern React with hooks and state management
- **CSS Custom Properties** - Professional design system with variables
- **Skeleton Components** - Loading placeholders for smooth UX
- **Error Boundaries** - Graceful error handling and recovery
- **Responsive Design** - Mobile-first approach with adaptive layouts

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
- **Random Movie Selection**: One-click popular movie generation
- **Actor Navigation**: Browse cast with image placeholders and loading states
- **Path Building**: Visual chain construction with smooth animations  
- **Hint System**: On-demand optimal path suggestions
- **Progress Tracking**: Step counter with achievement-based scoring

### Advanced Features
- **Skeleton Loading States**: Professional loading experience across all components
- **Actor Image Handling**: Smart placeholders with initials for missing profile photos
- **Error Recovery**: Retry buttons and graceful error handling
- **Performance Optimized**: Debounced API calls and efficient state management
- **Modern Animations**: Staggered grids, fade transitions, and micro-interactions

## 🚀 Performance & UX

- **Loading States**: Skeleton screens eliminate jarring content shifts
- **Error Handling**: Graceful failures with retry mechanisms
- **Image Optimization**: Smart actor placeholders reduce broken image issues
- **Debounced Interactions**: Prevents excessive API calls
- **Serverless Backend**: Scalable Vercel API routes
- **Database**: Optimized Neo4j queries for fast pathfinding

## 🆕 Recent Updates

### v2.0 - Modern UX Overhaul
- ✅ **Skeleton Loading System**: Professional loading states for all components
- ✅ **Actor Image Placeholders**: Beautiful gradient tiles with initials for missing photos
- ✅ **Simplified UI**: Removed search complexity, focus on random movie selection
- ✅ **Error Recovery**: Comprehensive error handling with retry functionality
- ✅ **Modern Animations**: Staggered grid loading and smooth transitions
- ✅ **Victory Celebrations**: Enhanced completion screen with achievement system
- ✅ **Performance Optimization**: Eliminated auto-fetch for better loading times

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