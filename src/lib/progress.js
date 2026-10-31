// Progress store. Shape is fixed by the brief:
// { lettersLearned: string[], wordsLearned: string[], lessonsCompleted: string[], lastVisit: string }
// Immutable updates: every change replaces the state object and notifies subscribers.
// The streak count is NOT part of that shape (DECISIONS Entry 013): it lives under its own key,
// `bn.streak`, the way preferences live under `bn.prefs`. It is derived from `lastVisit`.

const KEY = 'bn.progress';
const STREAK_KEY = 'bn.streak';

const empty = () => ({
  lettersLearned: [],
  wordsLearned: [],
  lessonsCompleted: [],
  lastVisit: '',
});

const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const p = JSON.parse(raw);
    return {
      lettersLearned: list(p.lettersLearned),
      wordsLearned: list(p.wordsLearned),
      lessonsCompleted: list(p.lessonsCompleted),
      lastVisit: typeof p.lastVisit === 'string' ? p.lastVisit : '',
    };
  } catch {
    return empty();
  }
}

let state = load();
const listeners = new Set();

function save(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
  }
  listeners.forEach((fn) => fn());
}

export const getProgress = () => state;

export function subscribeProgress(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const isLetterLearned = (id) => state.lettersLearned.includes(id);

// Mark as learned is a plain toggle: no scheduling, intervals or due dates.
export function toggleLetterLearned(id) {
  const has = state.lettersLearned.includes(id);
  save({
    ...state,
    lettersLearned: has
      ? state.lettersLearned.filter((x) => x !== id)
      : [...state.lettersLearned, id],
  });
}

export const isWordLearned = (id) => state.wordsLearned.includes(id);
export const isLessonCompleted = (id) => state.lessonsCompleted.includes(id);

// Idempotent setters: "mark" can never un-mark by accident. Same immutable update as letters.
export function setWordLearned(id, learned) {
  if (state.wordsLearned.includes(id) === learned) return;
  save({
    ...state,
    wordsLearned: learned ? [...state.wordsLearned, id] : state.wordsLearned.filter((x) => x !== id),
  });
}

export function setLessonCompleted(id, completed) {
  if (state.lessonsCompleted.includes(id) === completed) return;
  save({
    ...state,
    lessonsCompleted: completed
      ? [...state.lessonsCompleted, id]
      : state.lessonsCompleted.filter((x) => x !== id),
  });
}

export const toggleWordLearned = (id) => setWordLearned(id, !isWordLearned(id));
export const toggleLessonCompleted = (id) => setLessonCompleted(id, !isLessonCompleted(id));

// ---- Daily streak (Entry 013) ----

// Local calendar day as YYYY-MM-DD. Local, not UTC: a visit at 01:00 in Helsinki is still "today".
export function localDay(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Whole days since 1970 for a YYYY-MM-DD string (NaN if it is not one). Going through UTC
// arithmetic keeps the difference exact across daylight-saving changes.
function dayNumber(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  return m ? Math.round(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000) : NaN;
}

// Pure rule. prev = stored count, lastVisit = stored day, today = this visit's day.
//   same day            -> unchanged
//   exactly next day    -> +1
//   gap of 2+ days      -> back to 1 (today is day one of a new streak)
//   no or bad lastVisit -> 1 (first visit)
//   lastVisit is in the future (clock moved back) -> unchanged, never punish the learner
export function nextStreak(prev, lastVisit, today) {
  const had = Number.isInteger(prev) && prev > 0 ? prev : 1;
  const gap = dayNumber(today) - dayNumber(lastVisit);
  if (Number.isNaN(gap)) return 1;
  if (gap === 0 || gap < 0) return had;
  return gap === 1 ? had + 1 : 1;
}

function loadStreak() {
  try {
    const n = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}').count;
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

let streak = loadStreak();

function saveStreak() {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: streak }));
  } catch {
    // keep working in memory
  }
}

export const getStreak = () => streak;

// Call on load and whenever the tab becomes visible again. Safe to call any number of times a day.
export function touchLastVisit(now = new Date()) {
  const today = localDay(now);
  if (state.lastVisit === today && streak >= 1) return;
  streak = nextStreak(streak, state.lastVisit, today);
  saveStreak();
  save({ ...state, lastVisit: today });
}

// ---- Resets (Entry 013). Callers must ask for confirmation first. ----

const FIELD = { letters: 'lettersLearned', words: 'wordsLearned', lessons: 'lessonsCompleted' };

export function resetCategory(category) {
  const field = FIELD[category];
  if (!field || state[field].length === 0) return;
  save({ ...state, [field]: [] });
}

// Clears all three lists and restarts the streak at day 1 (today counts). Preferences are kept.
export function resetAll() {
  streak = 1;
  saveStreak();
  save({ ...empty(), lastVisit: localDay() });
}
