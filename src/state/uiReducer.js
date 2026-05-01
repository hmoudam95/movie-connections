export const initialUIState = {
  // Loading flags
  loading: false,
  randomLoading: { start: false, target: false },
  actorLoading: false,
  hintLoading: false,
  targetCastLoading: false,

  // Hint that the user clicked before the background fetch resolved.
  // Auto-resolves to a real hint when cachedHintChain arrives.
  pendingHintLevel: null,

  // Transient banner for retryable upstream errors (e.g. TMDB 429)
  rateLimitBanner: null,

  // Errors
  error: null,
  randomError: { start: null, target: null },
};

export function uiReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': {
      return { ...state, loading: action.value };
    }

    case 'SET_ACTOR_LOADING': {
      return { ...state, actorLoading: action.value };
    }

    case 'SET_HINT_LOADING': {
      return { ...state, hintLoading: action.value };
    }

    case 'SET_TARGET_CAST_LOADING': {
      return { ...state, targetCastLoading: action.value };
    }

    case 'SET_RANDOM_LOADING': {
      return {
        ...state,
        randomLoading: { ...state.randomLoading, [action.which]: action.value },
      };
    }

    case 'SET_RANDOM_ERROR': {
      return {
        ...state,
        randomError: { ...state.randomError, [action.which]: action.message },
      };
    }

    case 'SET_ERROR': {
      return { ...state, error: action.message };
    }

    case 'CLEAR_ERROR': {
      return { ...state, error: null };
    }

    case 'SET_PENDING_HINT': {
      return { ...state, pendingHintLevel: action.level };
    }

    case 'CLEAR_PENDING_HINT': {
      return { ...state, pendingHintLevel: null };
    }

    case 'SET_RATE_LIMIT_BANNER': {
      return { ...state, rateLimitBanner: action.message };
    }

    case 'CLEAR_RATE_LIMIT_BANNER': {
      return { ...state, rateLimitBanner: null };
    }

    case 'RESET_UI': {
      return { ...initialUIState };
    }

    default:
      return state;
  }
}
