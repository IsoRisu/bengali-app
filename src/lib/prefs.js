const KEY = 'bn.prefs';

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
        current = { showRomanization: parsed.showRomanization };
        return current;
      }
    }
  } catch (e) {}
  current = { showRomanization: true };
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

export function setShowRomanization(show) {
  current = { showRomanization: !!show };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch (e) {}
  applyHtmlClass(current.showRomanization);
  notify();
}