export const DIFFICULTY_MOVES = { easy: 8, normal: 6, hard: 4 };

export const initialGameState = {
  // Phase
  phase: 'setup', // 'setup' | 'playing' | 'complete' | 'failed'

  // Difficulty & Moves
  difficulty: 'normal',
  movesRemaining: DIFFICULTY_MOVES.normal,
  movesUsed: 0,

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

  // Hint system (graduated)
  cachedHintChain: null,  // background-fetched hint (not yet shown)
  hintLevel: 0,           // 0 = no hints used, 1/2/3 = hint tiers
  hintsUsed: [],          // track which hints were revealed
};

export function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_DIFFICULTY': {
      const difficulty = action.difficulty;
      return {
        ...state,
        difficulty,
        movesRemaining: DIFFICULTY_MOVES[difficulty],
      };
    }

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
        chain: [{ movie: details, actor: null }],
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
      return {
        ...state,
        phase: 'playing',
        movesRemaining: DIFFICULTY_MOVES[state.difficulty],
        movesUsed: 0,
      };
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
      const newMovesUsed = state.movesUsed + 1;
      const newMovesRemaining = state.movesRemaining - 1;
      return {
        ...state,
        chain: [...state.chain, { movie: details, actor }],
        currentMovie: details,
        cast: sortedCast,
        selectedActor: null,
        filmography: [],
        movesUsed: newMovesUsed,
        movesRemaining: newMovesRemaining,
      };
    }

    case 'COMPLETE_GAME': {
      return { ...state, phase: 'complete' };
    }

    case 'FAIL_GAME': {
      return { ...state, phase: 'failed' };
    }

    case 'UNDO_MOVE': {
      if (state.chain.length <= 1) return state;
      const newChain = state.chain.slice(0, -1);
      const lastItem = newChain[newChain.length - 1];
      return {
        ...state,
        chain: newChain,
        currentMovie: lastItem.movie,
        cast: lastItem.movie.credits?.cast
          ? lastItem.movie.credits.cast.slice().sort((a, b) => a.order - b.order)
          : state.cast,
        selectedActor: null,
        filmography: [],
        movesUsed: state.movesUsed - 1,
        movesRemaining: state.movesRemaining + 1,
      };
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

    case 'USE_HINT': {
      const { level, content, moveCost } = action;
      return {
        ...state,
        hintLevel: level,
        hintsUsed: [...state.hintsUsed, { level, content }],
        movesRemaining: state.movesRemaining - moveCost,
        movesUsed: state.movesUsed + moveCost,
      };
    }

    case 'RESET': {
      return { ...initialGameState };
    }

    default:
      return state;
  }
}
