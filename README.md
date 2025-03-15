# Movie Connections Game

A web-based game that challenges players to connect movies through shared actors. Players start with a beginning movie and must find a path to reach a target movie by selecting actors and their filmographies.

## Game Rules

1. Select a starting movie and a target movie
2. From the starting movie, select an actor from its cast
3. Then select another movie from that actor's filmography
4. Continue this process until you reach the target movie
5. Try to complete the chain in as few steps as possible!

## Features

- Search for movies using The Movie Database (TMDB) API
- Option to randomly select starting and target movies
- Visual representation of the movie chain as it's built
- Display of actors' filmographies with movie posters
- Responsive design for mobile and desktop

## Setup Instructions

### Prerequisites

- Node.js (version 14.x or later)
- npm or yarn package manager
- TMDB API key (get one at [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))

### Installation

1. Clone this repository
   ```
   git clone https://github.com/yourusername/movie-connections.git
   cd movie-connections
   ```

2. Install dependencies
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file in the root directory and add your TMDB API key
   ```
   REACT_APP_TMDB_API_KEY=your_api_key_here
   ```

4. Start the development server
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```
npm run build
```
or
```
yarn build
```

## Technologies Used

- React.js
- TMDB API for movie data
- CSS for styling

## Future Enhancements

- Leaderboard for the shortest paths
- Timer mode for added challenge
- Social sharing of completed chains
- User accounts to save progress

## License

MIT