// Per-word spaced-repetition state, kept in localStorage under its own key (`bn.srs`),
// like bn.extra. The scheduling maths lives in srsCore.js.
//
// It also keeps `wordsLearned` in progress.js in step: a word counts as learned from
// the Familiar tier up, and drops out again if a miss sends it back to Learning.
import { newItem, seedItem, review as reviewItem, isDue, isStarred, withStar } from './srsCore.js';
import { getProgress, setWordLearned } from './progress.js';

const KEY = 'bn.srs';
let current = null;
const listeners = new Set();

function load() {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.items === 'object' && parsed.items) {
        current = { items: parsed.items };
        return current;
      }
    }
  } catch (e) {}
  current = { items: {} };
  return current;
}

function save(next) {
  current = next;
  try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (e) {}
  for (const fn of listeners) {
    try { fn(current); } catch (e) { console.error(e); }
  }
}

export const getSrs = () => load();
export const subscribeSrs = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const getSrsItem = (id) => load().items[id] || newItem();

const isLearnedState = (s) => s === 'familiar' || s === 'known';

// Apply a rating to one word. Returns { before, after }.
export function reviewWord(id, rating, now = Date.now()) {
  const before = getSrsItem(id);
  const after = reviewItem(before, rating, now);
  save({ items: { ...load().items, [id]: after } });
  setWordLearned(id, isLearnedState(after.state));
  return { before, after };
}

// Words that were marked learned before spaced repetition existed (or via the quiz
// shortcut) get a Familiar item, spread over the next days so they do not all fall due at once.
export function seedLearned(now = Date.now()) {
  const cur = load();
  const missing = getProgress().wordsLearned.filter((id) => !cur.items[id]);
  if (!missing.length) return;
  const items = { ...cur.items };
  missing.forEach((id, i) => { items[id] = seedItem(now, Math.floor(i / 20) * 6 * 3600 * 1000); });
  save({ items });
}

// The learner un-learns a word by hand: it goes back to New.
// The star is the learner's own flag, so it survives the reset.
export function forgetWord(id) {
  const { [id]: old, ...rest } = load().items;
  if (isStarred(old)) rest[id] = withStar(newItem(), true);
  save({ items: rest });
  setWordLearned(id, false);
}

// Star / un-star one word. Works on words that are still New. Does not touch mastery.
export function setStar(id, on) {
  const item = getSrsItem(id);
  if (isStarred(item) === !!on) return;
  save({ items: { ...load().items, [id]: withStar(item, on) } });
}
export const toggleStar = (id) => setStar(id, !isStarred(getSrsItem(id)));

export function starredIds(srs) {
  return Object.keys(srs.items).filter((id) => isStarred(srs.items[id]));
}

export function resetSrs() {
  save({ items: {} });
}

export function dueIds(srs, now = Date.now()) {
  return Object.keys(srs.items).filter((id) => isDue(srs.items[id], now));
}

export function nextDueAt(srs, now = Date.now()) {
  let best = null;
  for (const it of Object.values(srs.items)) {
    if (it.state !== 'new' && it.due > now && (best === null || it.due < best)) best = it.due;
  }
  return best;
}
