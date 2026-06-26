// dailyStats.js — localStorage-backed streak/stats for the Daily Connection.
//
// Shape: { lastCompleted, streak, maxStreak, played, won, history: { [num]: moves } }
const KEY = 'mc_daily_stats_v1';

const EMPTY = { lastCompleted: null, streak: 0, maxStreak: 0, played: 0, won: 0, history: {} };

export function getDailyStats() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

// Already solved today's puzzle? (so we don't double-count or re-bump streak)
export function isDailyDone(puzzleNumber) {
  if (puzzleNumber == null) return false;
  return getDailyStats().history[puzzleNumber] != null;
}

// Record a daily win. Streak continues if this puzzle directly follows the last
// completed one; otherwise it resets to 1. Idempotent per puzzle number.
export function recordDailyWin(puzzleNumber, moves) {
  const stats = getDailyStats();
  if (puzzleNumber == null || stats.history[puzzleNumber] != null) return stats;

  const continues = stats.lastCompleted === puzzleNumber - 1;
  const streak = continues ? stats.streak + 1 : 1;
  const next = {
    ...stats,
    lastCompleted: puzzleNumber,
    streak,
    maxStreak: Math.max(stats.maxStreak, streak),
    played: stats.played + 1,
    won: stats.won + 1,
    history: { ...stats.history, [puzzleNumber]: moves },
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* storage full / unavailable — non-fatal */ }
  return next;
}
