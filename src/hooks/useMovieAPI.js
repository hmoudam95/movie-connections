import { useCallback } from 'react';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';

export function useMovieAPI(gameDispatch, uiDispatch) {
  // Fetch movie details + credits
  const fetchMovieDetails = async (movieId) => {
    uiDispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );
      return await res.json();
    } catch (err) {
      uiDispatch({ type: 'SET_ERROR', message: 'Failed to fetch movie details' });
      console.error(err);
      return null;
    } finally {
      uiDispatch({ type: 'SET_LOADING', value: false });
    }
  };

  // Fetch target movie cast for preview — returns the cast array
  const fetchTargetMovieCast = async (movieId) => {
    uiDispatch({ type: 'SET_TARGET_CAST_LOADING', value: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`
      );
      const data = await res.json();
      const topCast = data.credits.cast
        .slice()
        .sort((a, b) => a.order - b.order)
        .slice(0, 8);
      return topCast;
    } catch (err) {
      console.error('Failed to fetch target movie cast:', err);
      return [];
    } finally {
      uiDispatch({ type: 'SET_TARGET_CAST_LOADING', value: false });
    }
  };

  // Fetch actor filmography
  const fetchActorFilmography = async (actorId) => {
    uiDispatch({ type: 'SET_ACTOR_LOADING', value: true });
    try {
      const res = await fetch(
        `${API_BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`
      );
      const data = await res.json();
      const sorted = data.cast
        .slice()
        .sort((a, b) => {
          const ay = a.release_date ? +a.release_date.slice(0, 4) : 0;
          const by = b.release_date ? +b.release_date.slice(0, 4) : 0;
          return by - ay;
        });
      gameDispatch({ type: 'SET_FILMOGRAPHY', filmography: sorted });
    } catch (err) {
      uiDispatch({ type: 'SET_ERROR', message: "Failed to fetch actor's filmography" });
      console.error(err);
    } finally {
      uiDispatch({ type: 'SET_ACTOR_LOADING', value: false });
    }
  };

  // Get a random blockbuster movie
  const getRandomMovie = useCallback(
    async (isStart) => {
      const randomType = isStart ? 'start' : 'target';

      uiDispatch({ type: 'SET_RANDOM_LOADING', which: randomType, value: true });
      uiDispatch({ type: 'SET_RANDOM_ERROR', which: randomType, message: null });

      try {
        const today = new Date().toISOString().split('T')[0];
        const page = Math.floor(Math.random() * 5) + 1;
        const res = await fetch(
          `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=1000&primary_release_date.lte=${today}&page=${page}`
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const { results } = await res.json();
        const candidates = results.filter(m => m.poster_path);

        if (candidates.length === 0) {
          throw new Error('No movies found with posters');
        }

        const choice = candidates[Math.floor(Math.random() * candidates.length)];

        if (isStart) {
          const details = await fetchMovieDetails(choice.id);
          gameDispatch({ type: 'SET_START_MOVIE', movie: choice, details });
        } else {
          const topCast = await fetchTargetMovieCast(choice.id);
          gameDispatch({ type: 'SET_TARGET_MOVIE', movie: choice, cast: topCast });
        }

        uiDispatch({ type: 'SET_RANDOM_ERROR', which: randomType, message: null });
      } catch (err) {
        console.error('Random movie error:', err);
        uiDispatch({ type: 'SET_RANDOM_ERROR', which: randomType, message: err.message });
      } finally {
        uiDispatch({ type: 'SET_RANDOM_LOADING', which: randomType, value: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { fetchMovieDetails, fetchTargetMovieCast, fetchActorFilmography, getRandomMovie };
}
