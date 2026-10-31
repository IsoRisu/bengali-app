const KEY = 'bn.prefs';
// How Words questions are answered: 'auto' picks by mastery tier, or always choose / always type.
export const ANSWER_MODES = ['auto', 'choose', 'type'];

let current = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try { fn(current); } catch (e) { console.error(e); }
  }
}

function applyHtmlClass(show) {
  if (typeof document !== 'undefined') {
    if (show) {
      document.documentElement.classList.remove('hide-roman');
    } else {
      document.documentElement.classList.add('hide-roman');
    }
  }
}

function load() {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.showRomanization === 'boolean') {
        current = {
          showRomanization: parsed.showRomanization,
          answerMode: ANSWER_MODES.includes(parsed.answerMode) ? parsed.answerMode : 'auto',
        };
        return current;
      }
    }
  } catch (e) {}
  current = { showRomanization: true, answerMode: 'auto' };
  return current;
}

export function initPrefs() {
  const prefs = load();
  applyHtmlClass(prefs.showRomanization);
}

export function getPrefs() {
  return load();
}

export function subscribePrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch (e) {}
  notify();
}

export function setShowRomanization(show) {
  current = { ...load(), showRomanization: !!show };
  applyHtmlClass(current.showRomanization);
  persist();
}

export function setAnswerMode(mode) {
  current = { ...load(), answerMode: ANSWER_MODES.includes(mode) ? mode : 'auto' };
  persist();
}