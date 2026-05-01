import { useState, useEffect, useCallback } from 'react';

const BACKEND_BASE = process.env.REACT_APP_API_BASE_URL || '';

export function useHintSystem(gameState, currentMovie, targetMovie, cachedHintChain, gameDispatch, uiDispatch) {
  const [backgroundHintFetching, setBackgroundHintFetching] = useState(false);
  const [backgroundFetchController, setBackgroundFetchController] = useState(null);

  // Background hint fetching (silent, non-blocking)
  const fetchHintInBackground = useCallback(async () => {
    if (!currentMovie?.id || !targetMovie?.id) return;
    if (cachedHintChain || backgroundHintFetching) return;

    const controller = new AbortController();
    setBackgroundFetchController(controller);
    setBackgroundHintFetching(true);

    try {
      const res = await fetch(
        `${BACKEND_BASE}/api/path?fromMovieId=${currentMovie.id}&toMovieId=${targetMovie.id}`,
        { signal: controller.signal }
      );
      if (controller.signal.aborted) return;
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.chain) {
        gameDispatch({ type: 'CACHE_HINT', chain: data.chain });
      } else {
        // Surface the failure: clear the pending hint so the shimmer stops,
        // and show a toast-style error so the user knows something went wrong.
        const reason =
          res.status === 404
            ? "We couldn't find a path between those two movies"
            : "Hints are temporarily unavailable — try again in a moment";
        uiDispatch({ type: 'CLEAR_PENDING_HINT' });
        uiDispatch({ type: 'SET_ERROR', message: reason });
        if (data && data.detail) {
          console.error('[hint]', data.code || '', data.detail);
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        uiDispatch({ type: 'CLEAR_PENDING_HINT' });
        uiDispatch({ type: 'SET_ERROR', message: 'Hints are temporarily unavailable — try again in a moment' });
        console.error('[hint]', err.message);
      }
    } finally {
      if (!controller.signal.aborted) {
        setBackgroundHintFetching(false);
        setBackgroundFetchController(null);
      }
    }
  }, [currentMovie?.id, targetMovie?.id, cachedHintChain, backgroundHintFetching, gameDispatch, uiDispatch]);

  // Start background fetch 2s after game begins
  useEffect(() => {
    if (gameState === 'playing' && currentMovie?.id && targetMovie?.id) {
      const timer = setTimeout(() => {
        fetchHintInBackground();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState, currentMovie?.id, targetMovie?.id, fetchHintInBackground]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (backgroundFetchController) {
        backgroundFetchController.abort();
      }
    };
  }, [backgroundFetchController]);

  // Cancel background fetch (called on reset)
  const cancelHintFetch = () => {
    if (backgroundFetchController) {
      backgroundFetchController.abort();
      setBackgroundFetchController(null);
    }
    setBackgroundHintFetching(false);
  };

  return { fetchHintInBackground, cancelHintFetch };
}
