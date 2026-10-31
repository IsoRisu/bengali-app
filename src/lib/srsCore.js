// Spaced-repetition core: pure functions, no storage and no UI, so it can be tested alone.
//
// Each word has one item:
//   { state, ease, interval, due, streak, seen, lapses, lastReview, lastWrong }
//   state       'new' | 'learning' | 'familiar' | 'known'
//   ease        difficulty factor. Low = hard word (short intervals), high = easy word.
//   interval    days until the next review at the last pass (0 after a miss)
//   due         time (ms) the item is next due
//   streak      correct answers in a row (Hard, Good and Easy all count as correct)
//   lapses      times the learner missed it after having passed it
//
// State machine:  new -> learning -> familiar -> known
//   Again regresses one step: known -> familiar, familiar -> learning, otherwise learning.

export const MIN = 60 * 1000;
export const DAY = 24 * 60 * MIN;

export const STATES = ['new', 'learning', 'familiar', 'known'];
export const RATINGS = ['again', 'hard', 'good', 'easy'];
export const STATE_LABEL = { new: 'New', learning: 'Learning', familiar: 'Familiar', known: 'Known well' };
export const RATING_LABEL = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

export const CONFIG = {
  startEase: 2.5,
  minEase: 1.3,
  maxEase: 3.0,
  againDelay: 5 * MIN,               // a missed word is due again in 5 minutes
  firstDays: { hard: 0.25, good: 1, easy: 3 }, // first pass after new or after a miss
  hardFactor: 1.2,                   // later passes: hard = interval x 1.2
  easyBonus: 1.3,                    // easy = interval x ease x 1.3
  maxDays: 365,                      // no interval is longer than a year
  easeDelta: { again: -0.2, hard: -0.15, good: 0, easy: 0.15 },
  familiarStreak: 2,                 // Familiar: two correct in a row
  knownStreak: 4,                    // Known well: four in a row,
  knownStabilityDays: 7,             //   interval of at least a week,
  knownQuietDays: 7,                 //   and no miss in the last week
};

export function newItem() {
  return {
    state: 'new', ease: CONFIG.startEase, interval: 0, due: 0,
    streak: 0, seen: 0, lapses: 0, lastReview: 0, lastWrong: 0,
  };
}

// A word the learner marked as learned before spaced repetition existed.
export function seedItem(now, dueOffsetMs = 0) {
  return { ...newItem(), state: 'familiar', streak: CONFIG.familiarStreak, interval: 1,
    seen: CONFIG.familiarStreak, due: now + dueOffsetMs, lastReview: now };
}

export const stateRank = (s) => STATES.indexOf(s);
export const isDue = (item, now) => !!item && item.state !== 'new' && item.due <= now;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function nextInterval(item, rating) {
  const streak = item.streak + 1; // streak after this answer
  if (streak === 1) return CONFIG.firstDays[rating];
  const prev = Math.max(item.interval, 1);
  if (rating === 'hard') return prev * CONFIG.hardFactor;
  if (rating === 'good') return prev * item.ease;
  return prev * item.ease * CONFIG.easyBonus;
}

// Returns the updated item. Does not touch the input.
export function review(item, rating, now) {
  const it = { ...item, seen: item.seen + 1, lastReview: now };
  it.ease = clamp(item.ease + CONFIG.easeDelta[rating], CONFIG.minEase, CONFIG.maxEase);

  if (rating === 'again') {
    if (item.state !== 'new') it.lapses = item.lapses + 1;
    it.streak = 0;
    it.interval = 0;
    it.due = now + CONFIG.againDelay;
    it.lastWrong = now;
    it.state = item.state === 'known' ? 'familiar' : 'learning';
    return it;
  }

  it.interval = Math.min(nextInterval(item, rating), CONFIG.maxDays);
  it.streak = item.streak + 1;
  it.due = now + it.interval * DAY;
  if (it.state === 'new') it.state = 'learning';
  if (it.state === 'learning' && it.streak >= CONFIG.familiarStreak) it.state = 'familiar';
  if (
    it.state === 'familiar' &&
    it.streak >= CONFIG.knownStreak &&
    it.interval >= CONFIG.knownStabilityDays &&
    now - it.lastWrong >= CONFIG.knownQuietDays * DAY
  ) it.state = 'known';
  return it;
}

// Time (ms) until the item would be due after `rating`. Used for the button hints.
export const delayAfter = (item, rating, now) => review(item, rating, now).due - now;

export function formatDelay(ms) {
  if (ms <= 0) return 'now';
  const min = ms / MIN;
  if (min < 1) return '<1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < 24) return `${Math.round(h)} h`;
  const d = h / 24;
  if (d < 30) return `${Math.round(d)} d`;
  const mo = d / 30;
  return mo < 12 ? `${Math.round(mo)} mo` : `${(d / 365).toFixed(1)} y`;
}

// 0..1 fill for the progress indicator. Grows with correct answers, drops on a miss.
export function masteryFill(item) {
  if (!item || item.state === 'new') return 0;
  const s = item.streak;
  if (item.state === 'learning') return 0.15 + 0.15 * (Math.min(s, 2) / 2);
  if (item.state === 'familiar') return 0.45 + 0.25 * (Math.min(Math.max(s - 2, 0), 2) / 2);
  return 0.8 + 0.2 * Math.min(1, item.interval / 30);
}
