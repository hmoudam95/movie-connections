export const initialGameState = {
  // Phase
  phase: 'setup', // 'setup' | 'playing' | 'complete'

  // Movies
  startMovie: null,
  targetMovie: null,
  currentMovie: null,

  // Gameplay
  chain: [],            // [{movie, actor}, ...]
  selectedActor: null,
  cast: [],             // current movie's cast list
  filmography: [],      // selected actor's movie list

  // Target cast preview
  targetMovieCast: [],
  showTargetCast: false,

  // Hint system
  hintChain: null,        // displayed hint path
  cachedHintChain: null,  // background-fetched hint (not yet shown)
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_START_MOVIE': {
      const { movie, details } = action;
      const sortedCast = details.credits.cast
        .slice()
        .sort((a, b) => a.order - b.order);
      return {
        ...state,
        startMovie: movie,
        currentMovie: details,
        cast: sortedCast,
        chain: [{ movie, actor: null }],
      };
    }

    case 'SET_TARGET_MOVIE': {
      return {
        ...state,
        targetMovie: action.movie,
        targetMovieCast: action.cast || [],
      };
    }

    case 'START_GAME': {
      return { ...state, phase: 'playing' };
    }

    case 'SELECT_ACTOR': {
      return { ...state, selectedActor: action.actor };
    }

    case 'DESELECT_ACTOR': {
      return { ...state, selectedActor: null, filmography: [] };
    }

    case 'SET_FILMOGRAPHY': {
      return { ...state, filmography: action.filmography };
    }

    case 'SELECT_MOVIE': {
      const { details, actor } = action;
      const sortedCast = details.credits.cast
        .slice()
        .sort((a, b) => a.order - b.order);
      return {
        ...state,
        chain: [...state.chain, { movie: details, actor }],
        currentMovie: details,
        cast: sortedCast,
        selectedActor: null,
        filmography: [],
      };
    }

    case 'COMPLETE_GAME': {
      return { ...state, phase: 'complete' };
    }

    case 'SET_TARGET_CAST': {
      return { ...state, targetMovieCast: action.cast };
    }

    case 'TOGGLE_TARGET_CAST': {
      return { ...state, showTargetCast: !state.showTargetCast };
    }

    case 'HIDE_TARGET_CAST': {
      return { ...state, showTargetCast: false };
    }

    case 'CACHE_HINT': {
      return { ...state, cachedHintChain: action.chain };
    }

    case 'SHOW_HINT': {
      return { ...state, hintChain: state.cachedHintChain };
    }

    case 'SET_HINT': {
      return { ...state, hintChain: action.chain };
    }

    case 'RESET': {
      return { ...initialGameState };
    }

    default:
      return state;
  }
}
