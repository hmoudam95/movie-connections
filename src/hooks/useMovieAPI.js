import { useCallback } from 'react';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';

// Retries on 429 (rate limit) with capped exponential backoff + jitter.
// Surfaces a transient banner via uiDispatch so the UI shows "we're being
// rate-limited, retrying" instead of going blank.
async function fetchWithRetry(url, options = {}, uiDispatch, maxAttempts = 4) {
  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after'), 10);
        const baseDelay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 800 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 400);
        const delay = Math.min(baseDelay + jitter, 6000);
        if (uiDispatch) {
          uiDispatch({
            type: 'SET_RATE_LIMIT_BANNER',
            message: `TMDB is rate-limiting us, retrying in ${Math.round(delay / 1000)}s…`,
          });
        }
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
        continue;
      }
      if (uiDispatch) uiDispatch({ type: 'CLEAR_RATE_LIMIT_BANNER' });
      return res;
    } catch (err) {
      lastErr = err;
      const delay = 400 * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, delay));
      attempt += 1;
    }
  }
  if (uiDispatch) uiDispatch({ type: 'CLEAR_RATE_LIMIT_BANNER' });
  throw lastErr || new Error('Request failed after retries');
}

export function useMovieAPI(gameDispatch, uiDispatch) {
  // Fetch movie details + credits
  const fetchMovieDetails = async (movieId) => {
    uiDispatch({ type: 'SET_LOADING', value: true });
    try {
      const res = await fetchWithRetry(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`,
        {},
        uiDispatch
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      uiDispatch({ type: 'SET_ERROR', message: 'Failed to fetch movie details' });
      return null;
    } finally {
      uiDispatch({ type: 'SET_LOADING', value: false });
    }
  };

  // Fetch target movie cast for preview — returns the cast array
  const fetchTargetMovieCast = async (movieId) => {
    uiDispatch({ type: 'SET_TARGET_CAST_LOADING', value: true });
    try {
      const res = await fetchWithRetry(
        `${API_BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits`,
        {},
        uiDispatch
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const topCast = (data.credits?.cast || [])
        .slice()
        .sort((a, b) => a.order - b.order)
        .slice(0, 8);
      return topCast;
    } catch (err) {
      return [];
    } finally {
      uiDispatch({ type: 'SET_TARGET_CAST_LOADING', value: false });
    }
  };

  // Fetch actor filmography
  const fetchActorFilmography = async (actorId) => {
    uiDispatch({ type: 'SET_ACTOR_LOADING', value: true });
    try {
      const res = await fetchWithRetry(
        `${API_BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`,
        {},
        uiDispatch
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const sorted = (data.cast || [])
        .slice()
        .sort((a, b) => {
          const ay = a.release_date ? +a.release_date.slice(0, 4) : 0;
          const by = b.release_date ? +b.release_date.slice(0, 4) : 0;
          return by - ay;
        });
      gameDispatch({ type: 'SET_FILMOGRAPHY', filmography: sorted });
    } catch (err) {
      uiDispatch({ type: 'SET_ERROR', message: "Couldn't load this actor's films — try another" });
      gameDispatch({ type: 'SET_FILMOGRAPHY', filmography: [] });
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
        const res = await fetchWithRetry(
          `${API_BASE_URL}/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=1000&primary_release_date.lte=${today}&page=${page}`,
          {},
          uiDispatch
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const { results } = await res.json();
        const candidates = (results || []).filter(m => m.poster_path);

        if (candidates.length === 0) {
          throw new Error('No movies found with posters');
        }

        const choice = candidates[Math.floor(Math.random() * candidates.length)];

        if (isStart) {
          const details = await fetchMovieDetails(choice.id);
          if (details) gameDispatch({ type: 'SET_START_MOVIE', movie: choice, details });
        } else {
          const topCast = await fetchTargetMovieCast(choice.id);
          gameDispatch({ type: 'SET_TARGET_MOVIE', movie: choice, cast: topCast });
        }

        uiDispatch({ type: 'SET_RANDOM_ERROR', which: randomType, message: null });
      } catch (err) {
        uiDispatch({
          type: 'SET_RANDOM_ERROR',
          which: randomType,
          message: 'Couldn\'t load a movie — try the dice again',
        });
      } finally {
        uiDispatch({ type: 'SET_RANDOM_LOADING', which: randomType, value: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return { fetchMovieDetails, fetchTargetMovieCast, fetchActorFilmography, getRandomMovie };
}
