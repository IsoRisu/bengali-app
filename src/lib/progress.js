const KEY_PROGRESS = 'bn.progress';
const KEY_STREAK = 'bn.streak';

let progressCurrent = null;
let streakCurrent = null;
const progressListeners = new Set();

function notify() {
  for (const fn of progressListeners) {
    try { fn(progressCurrent); } catch (e) { console.error(e); }
  }
}

function emptyProgress() {
  return {
    lettersLearned: [],
    wordsLearned: [],
    lessonsCompleted: [],
    lastVisit: ''
  };
}

export function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nextStreak(prev, lastVisit, today) {
  const prevCount = typeof prev === 'number' && prev > 0 ? prev : null;
  if (!lastVisit || !/^\d{4}-\d{2}-\d{2}$/.test(lastVisit)) return 1;
  if (!today || !/^\d{4}-\d{2}-\d{2}$/.test(today)) return 1;

  if (lastVisit === today) return prevCount ?? 1;

  const [y1, m1, d1] = lastVisit.split('-').map(Number);
  const [y2, m2, d2] = today.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  const diffDays = Math.round((t2 - t1) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return prevCount ?? 1;
  if (diffDays === 1) return (prevCount ?? 1) + 1;
  return 1;
}

function loadProgress() {
  if (progressCurrent) return progressCurrent;
  try {
    const raw = localStorage.getItem(KEY_PROGRESS);
    if (raw) {
      const p = JSON.parse(raw);
      progressCurrent = {
        lettersLearned: Array.isArray(p.lettersLearned) ? p.lettersLearned : [],
        wordsLearned: Array.isArray(p.wordsLearned) ? p.wordsLearned : [],
        lessonsCompleted: Array.isArray(p.lessonsCompleted) ? p.lessonsCompleted : [],
        lastVisit: typeof p.lastVisit === 'string' ? p.lastVisit : ''
      };
      return progressCurrent;
    }
  } catch (e) {}
  progressCurrent = emptyProgress();
  return progressCurrent;
}

function saveProgress(next, triggerNotify = true) {
  progressCurrent = next;
  try {
    localStorage.setItem(KEY_PROGRESS, JSON.stringify(progressCurrent));
  } catch (e) {}
  if (triggerNotify) notify();
}

function loadStreak() {
  if (streakCurrent !== null) return streakCurrent;
  try {
    const raw = localStorage.getItem(KEY_STREAK);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.count === 'number' && parsed.count > 0) {
        streakCurrent = parsed.count;
        return streakCurrent;
      }
    }
  } catch (e) {}
  streakCurrent = 1;
  return streakCurrent;
}

function saveStreak(count, triggerNotify = true) {
  streakCurrent = count;
  try {
    localStorage.setItem(KEY_STREAK, JSON.stringify({ count }));
  } catch (e) {}
  if (triggerNotify) notify();
}

export function getProgress() {
  return loadProgress();
}

export function getStreak() {
  return loadStreak();
}

export function subscribeProgress(fn) {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

export function touchLastVisit() {
  const today = localDay();
  const p = loadProgress();
  const prevS = loadStreak();
  const nextS = nextStreak(prevS, p.lastVisit, today);

  let changed = false;
  if (p.lastVisit !== today) {
    p.lastVisit = today;
    saveProgress(p, false);
    changed = true;
  }
  if (nextS !== prevS) {
    saveStreak(nextS, false);
    changed = true;
  }
  if (changed) notify();
}

export function isLetterLearned(id) {
  return loadProgress().lettersLearned.includes(id);
}

export function toggleLetterLearned(id) {
  const p = loadProgress();
  const set = new Set(p.lettersLearned);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  saveProgress({ ...p, lettersLearned: Array.from(set) });
}

export function isWordLearned(id) {
  return loadProgress().wordsLearned.includes(id);
}

export function setWordLearned(id, bool = true) {
  const p = loadProgress();
  const set = new Set(p.wordsLearned);
  if (bool) set.add(id);
  else set.delete(id);
  saveProgress({ ...p, wordsLearned: Array.from(set) });
}

export function toggleWordLearned(id) {
  setWordLearned(id, !isWordLearned(id));
}

export function isLessonCompleted(id) {
  return loadProgress().lessonsCompleted.includes(id);
}

export function setLessonCompleted(id, bool = true) {
  const p = loadProgress();
  const set = new Set(p.lessonsCompleted);
  if (bool) set.add(id);
  else set.delete(id);
  saveProgress({ ...p, lessonsCompleted: Array.from(set) });
}

export function toggleLessonCompleted(id) {
  setLessonCompleted(id, !isLessonCompleted(id));
}

export function resetCategory(cat) {
  const p = loadProgress();
  const map = { letters: 'lettersLearned', words: 'wordsLearned', lessons: 'lessonsCompleted' };
  const field = map[cat];
  if (!field) return;
  saveProgress({ ...p, [field]: [] });
}

export function resetAll() {
  const p = loadProgress();
  saveStreak(1, false);
  saveProgress({
    lettersLearned: [],
    wordsLearned: [],
    lessonsCompleted: [],
    lastVisit: p.lastVisit || localDay()
  });
}